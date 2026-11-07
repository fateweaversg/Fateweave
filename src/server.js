'use strict';
/**
 * FateWeave — pay-first server-backed build.
 *
 * Flow:
 *  1. Visitor enters birth profile → POST /api/hook → teaser ONLY (never full details).
 *  2. Visitor pays via Stripe Checkout → POST /api/checkout (price chosen server-side by date).
 *  3. Stripe webhook (signature-verified) marks the order paid and the
 *     success page exchanges the Checkout Session for a random stored token
 *     bound to email + birth date.
 *  4. GET /api/report?token=… returns full details only for a valid paid token.
 *  5. POST /api/live-reader — 3 questions max per paid session, server-enforced.
 *  6. Report email on payment + daily encouragement at 7am SGT (src/jobs/daily.js).
 *  7. Owner login via server-checked password hash — no public owner link.
 *
 * Security rules enforced here:
 * - No secrets in frontend JS. No deterministic unlock code anywhere.
 * - Webhook signature verification is mandatory when STRIPE_WEBHOOK_SECRET is set.
 * - Access tokens are random, stored hashed, bound to email + birth date.
 */
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const path = require('path');

const { config, currentPrice } = require('./config');
const { db } = require('./db');
const { buildFullReading, buildTeaser, parseBirth, scoreEnneagramFromChoices, scoreMbti, getPersonalityQuestions, lockedPersonalitySummary, elName } = require('./readings');
const { strings } = require('./i18n');
const { sendReportEmail } = require('./email');
const { issueAccessToken, verifyAccessToken, issueOwnerToken, verifyOwnerToken, checkOwnerPassword, hashToken } = require('./auth');

const app = express();
app.set('trust proxy', 1); // Railway terminates TLS behind a proxy; rate-limit needs the real client IP.
app.use(helmet({ contentSecurityPolicy: false }));
// JSON parsing must SKIP the webhook routes: Stripe signature verification
// needs the RAW request body, and a parsed object cannot be verified.
// The webhook routes below use express.raw() themselves.
// (Previous bug: global express.json() ran first, so req.body was already
// a parsed object and stripe.webhooks.constructEvent always failed 400.)
const jsonParser = express.json({ limit: '64kb' });
app.use((req, res, next) => {
  if (req.originalUrl && req.originalUrl.startsWith('/api/webhook/')) return next();
  return jsonParser(req, res, next);
});

const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false });
app.use('/api/', apiLimiter);

// Stripe webhook needs the RAW body — see the skip above.
let stripe = null;
if (config.stripeSecretKey) {
  stripe = require('stripe')(config.stripeSecretKey);
}

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function requireFields(body, fields) {
  return fields.filter((f) => !body || body[f] === undefined || body[f] === '');
}

// --- Public config (safe to expose) ---------------------------------------
app.get('/api/config', (req, res) => {
  const price = currentPrice();
  res.json({
    price: { amountCents: price.amountCents, currency: price.currency, isPromo: price.isPromo, promoStart: price.promoStart, promoEnd: price.promoEnd },
    stripePublishableKey: config.stripePublishableKey || null,
    liveReaderMax: config.liveReaderMaxPerSession,
  });
});

// --- Hook: teaser only ------------------------------------------------------
app.post('/api/hook', (req, res) => {
  const missing = requireFields(req.body, ['birthDate']);
  if (missing.length) return res.status(400).json({ error: `Missing: ${missing.join(', ')}` });
  try {
    parseBirth(req.body.birthDate, req.body.birthTime);
    const teaser = buildTeaser({ birthDate: req.body.birthDate, birthTime: req.body.birthTime || null, name: req.body.name || null });
    return res.json(teaser);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

// --- Checkout: Stripe Checkout Session, price decided server-side ----------
app.post('/api/checkout', async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Payments are not configured yet (STRIPE_SECRET_KEY missing). See DEPLOY-CHECKLIST.md.' });
  const missing = requireFields(req.body, ['email', 'birthDate']);
  if (missing.length) return res.status(400).json({ error: `Missing: ${missing.join(', ')}` });
  if (!isValidEmail(req.body.email)) return res.status(400).json({ error: 'Invalid email' });
  try { parseBirth(req.body.birthDate, req.body.birthTime); } catch (e) { return res.status(400).json({ error: e.message }); }

  const price = currentPrice();
  const email = req.body.email.toLowerCase();
  const order = db.prepare(
    'INSERT INTO orders (email, birth_date, birth_time, name, amount_cents, currency, price_label, provider, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(email, req.body.birthDate, req.body.birthTime || null, req.body.name || null,
    price.amountCents, price.currency, price.label, 'stripe', 'pending');

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      line_items: [{
        price_data: {
          currency: price.currency,
          product_data: { name: price.isPromo ? 'FateWeave — Full reading (launch promo)' : 'FateWeave — Full reading' },
          unit_amount: price.amountCents,
        },
        quantity: 1,
      }],
      metadata: { orderId: String(order.lastInsertRowid), email, birthDate: req.body.birthDate },
      success_url: `${config.baseUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.baseUrl}/?cancelled=1`,
    });
    db.prepare('UPDATE orders SET provider_session_id = ? WHERE id = ?').run(session.id, order.lastInsertRowid);
    return res.json({ checkoutUrl: session.url, orderId: order.lastInsertRowid, price });
  } catch (e) {
    console.error('Stripe checkout error:', e.message);
    return res.status(502).json({ error: 'Could not create a checkout session. Check Stripe keys.' });
  }
});

// --- Exchange a paid Checkout Session for an access token (server-verified) -
app.get('/api/checkout-session/:sessionId', async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Payments are not configured yet.' });
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
    if (session.payment_status !== 'paid') return res.status(402).json({ error: 'Payment not completed yet.' });
    const orderId = Number(session.metadata?.orderId || 0);
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    // Reuse an existing token for this order if one was already issued.
    // The stored token is only a hash, so it cannot be recovered — issue a
    // FRESH token for the same verified-paid order instead, so the success
    // page always has a working token and never strands the buyer on a
    // bare page. The old token stays valid too (same order, same buyer).
    const existing = db.prepare('SELECT * FROM access_tokens WHERE order_id = ? AND revoked = 0').get(orderId);
    if (existing) {
      const fresh = issueAccessToken(order.email, order.birth_date, orderId);
      db.prepare("UPDATE orders SET status = 'paid', paid_at = datetime('now') WHERE id = ?").run(orderId);
      return res.json({ paid: true, email: order.email, birthDate: order.birth_date, token: fresh.token, expiresAt: fresh.expiresAt, tokenAlreadyIssued: true, message: 'Access was already issued for this order — a fresh token has been issued for this session.' });
    }
    const { token, expiresAt } = issueAccessToken(order.email, order.birth_date, orderId);
    db.prepare("UPDATE orders SET status = 'paid', paid_at = datetime('now') WHERE id = ?").run(orderId);
    db.prepare('INSERT OR IGNORE INTO email_subscribers (email, birth_date, name) VALUES (?, ?, ?)').run(order.email, order.birth_date, order.name);
    // Email the detailed report (best-effort — never block the unlock on email).
    try {
      const reading = buildFullReading({ birthDate: order.birth_date, birthTime: order.birth_time, name: order.name });
      await sendReportEmail(order.email, reading, 'en');
    } catch (e) { console.error('Report email failed:', e.message); }
    return res.json({ paid: true, email: order.email, birthDate: order.birth_date, token, expiresAt });
  } catch (e) {
    console.error('Checkout session lookup failed:', e.message);
    return res.status(400).json({ error: 'Could not verify this checkout session.' });
  }
});

// --- Stripe webhook: signature-verified, authoritative payment record ------
app.post('/api/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe || !config.stripeWebhookSecret) {
    return res.status(503).json({ error: 'Stripe webhook is not configured (STRIPE_WEBHOOK_SECRET missing).' });
  }
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], config.stripeWebhookSecret);
  } catch (e) {
    console.error('Stripe webhook signature verification failed:', e.message);
    return res.status(400).send('Webhook signature verification failed.');
  }
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const orderId = Number(session.metadata?.orderId || 0);
    if (orderId) {
      db.prepare("UPDATE orders SET status = 'paid', paid_at = datetime('now'), provider_payment_id = ? WHERE id = ?")
        .run(session.payment_intent || null, orderId);
      console.log(`Order ${orderId} marked paid via webhook.`);
    }
  }
  return res.json({ received: true });
});

// --- HitPay webhook stub (optional; Stripe is primary) ----------------------
app.post('/api/webhook/hitpay', express.raw({ type: 'application/json' }), (req, res) => {
  if (!config.hitpay.webhookSecret) {
    return res.status(400).json({ error: 'HitPay webhook is not configured. Set HITPAY_WEBHOOK_SECRET and implement the provider-specific signature check before enabling.' });
  }
  // TODO (before enabling HitPay in production): verify the HitPay signature
  // per HitPay docs (HMAC-SHA256 over the raw body with HITPAY_SALT / API key),
  // then mark the matching order paid and issue a token via issueAccessToken().
  // This stub deliberately does NOT mark anything paid until that check exists.
  console.log('HitPay webhook received — signature check not yet implemented, order NOT marked paid.');
  return res.status(501).json({ error: 'HitPay webhook signature verification is not implemented yet. See src/server.js.' });
});

// --- Full report: paid token only -------------------------------------------
function loadPersonality(email, birthDate) {
  const rows = db.prepare('SELECT kind, result_json FROM personality_results WHERE email = ? AND birth_date = ?').all(String(email).toLowerCase(), birthDate);
  const out = {};
  for (const r of rows) { try { out[r.kind] = JSON.parse(r.result_json); } catch {} }
  return Object.keys(out).length ? out : null;
}

app.get('/api/report', (req, res) => {
  const { token, email, birthDate } = req.query;
  const access = verifyAccessToken(token, email, birthDate);
  if (!access) return res.status(403).json({ error: 'A valid paid access token is required for the full report.' });
  const order = access.order_id ? db.prepare('SELECT * FROM orders WHERE id = ?').get(access.order_id) : null;
  const personality = loadPersonality(access.email, access.birth_date);
  const reading = buildFullReading({ birthDate: access.birth_date, birthTime: order?.birth_time || null, name: order?.name || null }, personality);
  return res.json({ ...reading, personality: personality || undefined, access: { email: access.email, expiresAt: access.expires_at, liveReaderMax: config.liveReaderMaxPerSession } });
});

// --- Resend the detailed report email (paid token only) ----------------------
app.post('/api/resend-report', async (req, res) => {
  const { token, email, birthDate } = req.body || {};
  const access = verifyAccessToken(token, email, birthDate);
  if (!access) return res.status(403).json({ error: 'A valid paid access token is required.' });
  try {
    const order = access.order_id ? db.prepare('SELECT * FROM orders WHERE id = ?').get(access.order_id) : null;
    const personality = loadPersonality(access.email, access.birth_date);
    const reading = buildFullReading({ birthDate: access.birth_date, birthTime: order?.birth_time || null, name: order?.name || null }, personality);
    await sendReportEmail(access.email, reading, 'en');
    return res.json({ resent: true, email: access.email });
  } catch (e) {
    console.error('Resend report email failed:', e.message);
    return res.status(502).json({ error: 'Could not resend the report email.' });
  }
});

// --- Live Reader: 3 questions max per paid session, server-enforced --------
app.post('/api/live-reader', (req, res) => {
  const { token, email, birthDate, sessionId, question, lang } = req.body || {};
  const access = verifyAccessToken(token, email, birthDate);
  if (!access) return res.status(403).json({ error: 'A valid paid access token is required for Live Reader.' });
  if (!sessionId || !question || String(question).trim().length < 2) {
    return res.status(400).json({ error: 'sessionId and a question are required.' });
  }
  const usage = db.prepare('SELECT * FROM live_reader_usage WHERE token_hash = ? AND session_id = ?')
    .get(hashToken(token), sessionId);
  const count = usage ? usage.question_count : 0;
  if (count >= config.liveReaderMaxPerSession) {
    return res.status(429).json({ error: `Live Reader allows ${config.liveReaderMaxPerSession} questions per session.`, questionsUsed: count, questionsRemaining: 0 });
  }
  const order = access.order_id ? db.prepare('SELECT * FROM orders WHERE id = ?').get(access.order_id) : null;
  const personality = loadPersonality(access.email, access.birth_date);
  const reading = buildFullReading({ birthDate: access.birth_date, birthTime: order?.birth_time || null, name: order?.name || null }, personality);
  const answer = liveReaderAnswer(reading, String(question), lang === 'zh' ? 'zh' : 'en');
  db.prepare(`INSERT INTO live_reader_usage (token_hash, session_id, question_count, last_asked_at)
    VALUES (?, ?, 1, datetime('now'))
    ON CONFLICT(token_hash, session_id) DO UPDATE SET question_count = question_count + 1, last_asked_at = datetime('now')`)
    .run(hashToken(token), sessionId);
  return res.json({ answer, questionsUsed: count + 1, questionsRemaining: config.liveReaderMaxPerSession - count - 1 });
});

/* Live Reader (rewritten 7 Nov 2026, item E) — the old version picked ONE
   system by keyword and returned one fixed template per system, so all
   three answers read the same. Now each question is classified by TOPIC
   (career / love / money / health / timing / general) as well as system,
   and the answer is composed from the matching sections of THAT buyer's
   actual reading — never generic filler, never the same text for two
   different topics. Short and plain: (1) one direct answer, (2) what the
   chart actually says in 1–2 short lines naming the system, (3) one small
   thing to do this week. Technical terms are glossed in plain words. */
const TOPICS = [
  { id: 'career', en: ['career', 'job', 'work', 'promotion', 'boss', 'business', 'study', 'exam', 'school', 'interview'], zh: ['事业', '工作', '职业', '升职', '老板', '生意', '学习', '考试', '学业', '面试'] },
  { id: 'love', en: ['love', 'relationship', 'marriage', 'partner', 'boyfriend', 'girlfriend', 'wife', 'husband', 'dating', 'crush'], zh: ['感情', '爱情', '婚姻', '伴侣', '男友', '女友', '老公', '老婆', '对象', '喜欢'] },
  { id: 'money', en: ['money', 'wealth', 'finance', 'salary', 'income', 'invest', 'debt', 'buy', 'house', 'price', 'rich'], zh: ['财运', '钱', '财富', '工资', '收入', '投资', '买房', '债务', '赚钱'] },
  { id: 'health', en: ['health', 'body', 'sleep', 'tired', 'sick', 'energy', 'exercise', 'rest'], zh: ['健康', '身体', '睡眠', '累', '生病', '精力', '运动', '休息'] },
  { id: 'timing', en: ['when', 'timing', 'next month', 'this year', 'soon', 'should i'], zh: ['什么时候', '时机', '何时', '今年', '下个月', '该不该'] },
];
function firstSentence(text) {
  if (!text) return '';
  const m = String(text).match(/^[^.!?。]+[.!?。]?/);
  return (m ? m[0] : String(text)).trim();
}
function plainEN(s) {
  return String(s)
    .replace(/your Day Master/g, "your chart's core")
    .replace(/Day Master/g, "your chart's core")
    .replace(/useful god/g, 'the element you most need')
    .replace(/luck pillar/g, 'ten-year phase');
}
function plainZH(s) {
  return String(s)
    .replace(/日主/g, '命盘核心')
    .replace(/用神/g, '你最需要补的五行')
    .replace(/大运/g, '十年阶段');
}
function liveReaderAnswer(reading, question, lang = 'en') {
  const q = String(question || '').toLowerCase();
  const has = (list) => list.some((w) => q.includes(w.toLowerCase()));
  let topic = 'general';
  for (const t of TOPICS) { if (has(t.en) || has(t.zh)) { topic = t.id; break; } }
  const L = (o) => (o && typeof o === 'object' ? (lang === 'zh' ? o.zh || o.en : o.en || o.zh) : o);
  const sent = (sec) => (lang === 'zh' ? plainZH(firstSentence(L(sec))) : plainEN(firstSentence(L(sec))));
  const sysName = (name) => (lang === 'zh' ? { Bazi: '八字', Horoscope: '星座', Tarot: '塔罗', Numerology: '数字命理', 'Yi-Jing': '易经', 'Zi Wei': '紫微' }[name] || name : name);
  // Matching sections of this buyer's actual reading, per topic.
  const pick = {
    career: [
      ['Bazi', reading.bazi.sections.career],
      ['Horoscope', reading.horoscope.sections.career],
      ['Tarot', reading.tarot.sections.career],
      ['Numerology', reading.numerology.sections.career],
    ],
    love: [
      ['Bazi', reading.bazi.sections.relationships],
      ['Horoscope', reading.horoscope.sections.relationships],
      ['Tarot', reading.tarot.sections.relationships],
      ['Numerology', reading.numerology.sections.relationships],
    ],
    money: [
      ['Bazi', reading.bazi.sections.timing],
      ['Numerology', reading.numerology.sections.career],
      ['Tarot', reading.tarot.sections.timing],
      ['Zi Wei', reading.ziwei.sections.wealth],
    ],
    health: [
      ['Bazi', reading.bazi.sections.health],
      ['Horoscope', reading.horoscope.sections.health],
      ['Tarot', reading.tarot.sections.health],
      ['Numerology', reading.numerology.sections.health],
    ],
    timing: [
      ['Yi-Jing', reading.yijing.sections.timing],
      ['Bazi', reading.bazi.sections.timing],
      ['Numerology', reading.numerology.sections.timing],
      ['Tarot', reading.tarot.sections.timing],
    ],
    general: [
      ['Bazi', reading.bazi.sections.overview],
      ['Horoscope', reading.horoscope.sections.overview],
      ['Tarot', reading.tarot.sections.overview],
      ['Numerology', reading.numerology.sections.overview],
    ],
  }[topic];
  // The system's core fact for this topic — from this buyer's computed values.
  const core = {
    career: lang === 'zh'
      ? `你的核心：最旺的五行是${elName(reading.bazi.dominant, 'zh')}，太阳在${reading.horoscope.sun.zh}。`
      : `Your core: your strongest element is ${elName(reading.bazi.dominant, 'en')}, and your Sun is ${reading.horoscope.sun.en}.`,
    love: lang === 'zh'
      ? `你的核心：月亮在${reading.horoscope.moon.zh}——那是你私下最需要的安全感来源。`
      : `Your core: your Moon is ${reading.horoscope.moon.en} — that is what you privately need to feel safe.`,
    money: lang === 'zh'
      ? `你的核心：最弱的五行是${elName(reading.bazi.weakest, 'zh')}，补它比追运气更实在。`
      : `Your core: your lightest element is ${elName(reading.bazi.weakest, 'en')} — feeding it matters more than chasing luck.`,
    health: lang === 'zh'
      ? `你的核心：最弱的五行是${elName(reading.bazi.weakest, 'zh')}，那就是你漏气的地方。`
      : `Your core: your lightest element is ${elName(reading.bazi.weakest, 'en')} — that is where you leak energy.`,
    timing: lang === 'zh'
      ? `你的核心：你的卦是第 ${reading.yijing.hexagramNumber} 卦「${reading.yijing.hexagramZh}」，个人年是 ${reading.numerology.personalYear}。`
      : `Your core: your hexagram is ${reading.yijing.hexagramNumber} · ${reading.yijing.hexagramEn}, and your Personal Year is ${reading.numerology.personalYear}.`,
    general: lang === 'zh'
      ? `你的核心：命盘核心是${reading.bazi.dayMaster.zh}，生命灵数是 ${reading.numerology.lifePath}。`
      : `Your core: your chart's core is ${reading.bazi.dayMaster.en}, and your Life Path is ${reading.numerology.lifePath}.`,
  }[topic];
  const action = {
    career: lang === 'zh' ? '这周在工作中做一件能发挥你最强一面的事，事后写下一行结果。' : 'This week, do one thing at work that uses your strongest side — and write down how it went.',
    love: lang === 'zh' ? '这周对最亲近的人直接说出一个需要——说出来，不要只暗示。' : 'This week, say one plain need to the person closest to you — out loud, not as a hint.',
    money: lang === 'zh' ? '这周写下两个数字：进了多少，出了多少。不评判，只记数字。' : 'This week, write down two numbers: what came in and what went out. No judgement, just the numbers.',
    health: lang === 'zh' ? '这周像守死线一样守住一段休息时间——固定时间，不挪动。' : 'This week, protect one rest window the way you protect a deadline — same time, no moving it.',
    timing: lang === 'zh' ? '这周先准备好一件事，等窗口打开时你就能直接行动。' : 'This week, prepare one thing, so you are ready when the window opens.',
    general: lang === 'zh' ? '这周做一件报告里提到的小事，然后留意有什么变化。' : 'This week, do one small thing the reading points to, then notice what changes.',
  }[topic];
  const s1 = pick[0], s2 = pick[1];
  const sampleNote = (s1[0] === 'Zi Wei' || s2[0] === 'Zi Wei')
    ? (lang === 'zh' ? '（紫微为样本内容，仅供参考。）' : ' (Zi Wei is sample content, for reflection only.)')
    : '';
  return lang === 'zh'
    ? `${sysName(s1[0])}：${sent(s1[1])}\n\n${core} ${sysName(s2[0])}也这么说：${sent(s2[1])}${sampleNote}\n\n本周一件事：${action}`
    : `${sysName(s1[0])}: ${sent(s1[1])}\n\n${core} ${sysName(s2[0])} says the same: ${sent(s2[1])}${sampleNote}\n\nOne thing this week: ${action}`;
}

// --- Enneagram / MBTI ---------------------------------------------------------
// Quizzes are takeable BEFORE payment (that is the hook). The question lists
// are public, but scoring letters / type numbers are stripped — the browser
// never sees how answers map to types.
//   - No token: scoring runs server-side, but only a LOCKED summary is
//     returned (type + name + one teaser line). No scores, no interpretation,
//     no strengths/lacking. The full breakdown unlocks after payment, when
//     the frontend re-submits the same answers with a valid token.
//   - Valid token: full result returned AND saved, so /api/report includes
//     the personality lens (and Complete Portrait) on every later visit.
app.get('/api/personality/questions', (req, res) => {
  const q = getPersonalityQuestions();
  return res.json({
    enneagram: q.enneagram.map((item) => ({ n: item.n, q: item.q, opts: item.opts.map((o) => ({ en: o.en, zh: o.zh })) })),
    mbti: q.mbti.map((item) => ({ n: item.n, dim: item.dim, q: item.q, a: { en: item.a.en, zh: item.a.zh }, b: { en: item.b.en, zh: item.b.zh } })),
  });
});

app.post('/api/personality', (req, res) => {
  const { token, email, birthDate, enneagramAnswers, mbtiAnswers } = req.body || {};
  if (!enneagramAnswers && !mbtiAnswers) return res.status(400).json({ error: 'Provide enneagramAnswers and/or mbtiAnswers.' });
  const out = {};
  if (enneagramAnswers) out.enneagram = scoreEnneagramFromChoices(enneagramAnswers);
  if (mbtiAnswers) out.mbti = scoreMbti(mbtiAnswers);
  if (!out.enneagram && !out.mbti) return res.status(400).json({ error: 'Invalid answers — check the question counts (Enneagram 9 or 27, MBTI 8 or 24).' });

  const access = token ? verifyAccessToken(token, email, birthDate) : null;
  if (!access) {
    // Pre-payment: locked teaser only.
    return res.json({ ...lockedPersonalitySummary(out.enneagram, out.mbti), unlocked: false });
  }
  // Paid: save for the portrait lens, return the full breakdown.
  for (const [kind, result] of Object.entries(out)) {
    db.prepare(`INSERT INTO personality_results (email, birth_date, kind, result_json, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'))
      ON CONFLICT(email, birth_date, kind) DO UPDATE SET result_json = excluded.result_json, updated_at = datetime('now')`)
      .run(access.email, access.birth_date, kind, JSON.stringify(result));
  }
  return res.json({ ...out, unlocked: true });
});

// --- Owner: login (server-checked bcrypt hash) + manual access issue -------
app.post('/api/owner/login', async (req, res) => {
  const ok = await checkOwnerPassword(req.body?.password);
  if (!ok) return res.status(401).json({ error: 'Invalid owner password.' });
  const { token, expiresAt } = issueOwnerToken();
  return res.json({ ownerToken: token, expiresAt });
});
app.post('/api/owner/issue-access', (req, res) => {
  if (!verifyOwnerToken(req.headers['x-owner-token'])) return res.status(401).json({ error: 'Owner token required.' });
  const { email, birthDate, name } = req.body || {};
  if (!isValidEmail(email) || !birthDate) return res.status(400).json({ error: 'Valid email and birthDate are required.' });
  try { parseBirth(birthDate); } catch (e) { return res.status(400).json({ error: e.message }); }
  const order = db.prepare("INSERT INTO orders (email, birth_date, name, amount_cents, currency, price_label, provider, status, paid_at) VALUES (?, ?, ?, 0, 'usd', 'owner-manual', 'manual', 'paid', datetime('now'))")
    .run(email.toLowerCase(), birthDate, name || null);
  const { token, expiresAt } = issueAccessToken(email.toLowerCase(), birthDate, order.lastInsertRowid);
  return res.json({ token, expiresAt, email, birthDate });
});
app.get('/api/owner/report', (req, res) => {
  if (!verifyOwnerToken(req.headers['x-owner-token'])) return res.status(401).json({ error: 'Owner token required.' });
  const { email, birthDate } = req.query;
  if (!email || !birthDate) return res.status(400).json({ error: 'email and birthDate are required.' });
  const reading = buildFullReading({ birthDate, birthTime: null, name: null });
  return res.json({ ...reading, ownerPreview: true });
});

// --- Unsubscribe --------------------------------------------------------------
app.get('/api/unsubscribe', (req, res) => {
  if (req.query.email) {
    db.prepare('UPDATE email_subscribers SET unsubscribed = 1 WHERE email = ?').run(String(req.query.email).toLowerCase());
  }
  res.send('<p>You have been unsubscribed from FateWeave daily encouragement. You can resubscribe by unlocking a new reading.</p>');
});

// --- Static frontend ----------------------------------------------------------
app.use(express.static(path.join(__dirname, '..', 'public')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'index.html')));

// --- Daily job is separate (src/jobs/daily.js) — see README for the cron. ----
if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`FateWeave server listening on ${config.baseUrl} (port ${config.port})`);
    console.log(`Price in force: ${JSON.stringify(currentPrice())}`);
    if (!config.stripeSecretKey) console.log('WARNING: STRIPE_SECRET_KEY is not set — checkout will return 503 until it is configured.');
    if (!config.resendApiKey && !config.smtp.host) console.log('WARNING: No email provider configured — emails will use the console log fallback (dev only).');
    if (!config.ownerPasswordHash) console.log('WARNING: OWNER_PASSWORD_HASH is not set — owner login is disabled.');
  });
}
module.exports = { app, liveReaderAnswer };
