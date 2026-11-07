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
const { buildFullReading, buildTeaser, parseBirth, scoreEnneagramFromChoices, scoreMbti, getPersonalityQuestions, lockedPersonalitySummary } = require('./readings');
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

function liveReaderAnswer(reading, question, lang) {
  // Rule-based, detailed discussion grounded ONLY in the buyer's unlocked data.
  // No LLM call is made here — a model-backed Live Reader is a Phase 2 option.
  const q = question.toLowerCase();
  const pickSystem = q.includes('bazi') || q.includes('八字') ? 'bazi'
    : q.includes('tarot') || q.includes('塔羅') ? 'tarot'
    : q.includes('zi wei') || q.includes('紫微') ? 'ziwei'
    : q.includes('horoscope') || q.includes('星座') || q.includes('astrology') ? 'horoscope'
    : q.includes('numerology') || q.includes('生命靈數') ? 'numerology'
    : q.includes('yi') || q.includes('易經') ? 'yijing' : 'portrait';
  const en = {
    bazi: `Your Day Master is ${reading.bazi.dayMaster.en} (${reading.bazi.dayMaster.zh}), and its element is ${reading.bazi.element}. ${reading.bazi.guidance.en} That is the first thread to hold onto when you ask about "${question}": the answer is not a different self, it is this same self, used more deliberately. In practical terms, look at the next week and name one decision where you would normally rush or hold back — then choose the middle pace your element points to. The second thread is timing. Your reading does not promise an outcome; it points to the conditions that make an outcome more likely, and the condition here is steadiness before speed. Third, notice what you are already doing well and do more of that, rather than adding a new habit on top of a tired one. If the question is about a relationship or a choice, ask the same question again in a week with fresh eyes — a reading is a mirror, not a verdict, and the most useful part is what you notice when you return to it.`,
    tarot: `Your spread is ${reading.tarot.cards.join(', ')}. ${reading.tarot.guidance.en} Applied to "${question}", the cards are less a prediction than a sequence: what you carry from the past, what is asking for attention now, and what is forming next. The present card is the one to sit with longest — it names the energy that is already moving, whether or not you have named it yet. The near-future card does not decide for you; it shows the shape of the path you are already on, so you can choose whether to stay on it. Take one small action that matches the present card this week, and watch what changes. That is how a reading earns its keep.`,
    ziwei: `Your Life Palace is ${reading.ziwei.lifePalace}. ${reading.ziwei.guidance.en} For "${question}", the useful question is not "what will happen?" but "what part of me is this palace asking me to take responsibility for?" A palace is a room you live in — you cannot redecorate it by wishing; you change how you use it, day by day. Start with the smallest responsibility inside that room, keep it for a week, and notice what shifts around it.`,
    horoscope: `Your Sun sign is ${reading.horoscope.sunSign.en}. ${reading.horoscope.guidance.en} For "${question}", your sign's timing is the clue: the moments when you feel most yourself are usually the moments when the answer is clearest. Do not decide when you are tired or rushed — decide in the window when you are most like yourself, and the choice will feel less like a gamble.`,
    numerology: `Your Life Path is ${reading.numerology.lifePath}. ${reading.numerology.guidance.en} Applied to "${question}", the number is a reminder of the lesson you keep meeting. The same lesson in a new situation is not a failure — it is the curriculum. Ask what this situation is teaching you that the last one also taught, and the next step usually becomes obvious.`,
    yijing: `Your hexagram is ${reading.yijing.hexagram}. ${reading.yijing.guidance.en} For "${question}", the hexagram invites a small, honest move rather than a grand plan. Name the smallest step, take it today, and let the next step reveal itself after that.`,
    portrait: `${reading.portrait.essenceLine.en} ${reading.synthesis.en} For your question — "${question}" — the portrait suggests the same move: return to your own direction, not someone else's pace. ${reading.portrait.growingEdge.en}`,
  };
  const zh = {
    bazi: `你的日主是${reading.bazi.dayMaster.zh}，五行屬${reading.bazi.dayMaster.element}。${reading.bazi.guidance.zh}面對「${question}」這個問題，第一條線是：答案不是一個不同的自己，而是更刻意地使用同一個自己。實際的做法是：看看下週，找出一個你通常會急著決定或退縮的選擇，然後選擇屬於你的中間節奏。第二條線是時機。報告不承諾結果，它指出讓結果更可能出現的條件，而這裡的條件是「先穩，再快」。第三，留意你已經做得好的地方，多做那個，而不是在疲憊之上再加一個新習慣。`,
    tarot: `你的牌陣是 ${reading.tarot.cards.join('、')}。${reading.tarot.guidance.zh}針對「${question}」，牌更像是一段順序：你從過去帶來什麼、現在什麼在要求注意、接下來什麼正在形成。現在這張牌最值得久坐——它說的是已經在動的能量，無論你是否已為它命名。近期未來的牌不是替你決定，而是顯示你已經走在的路的形狀，讓你選擇是否繼續走下去。本週做一件與現在這張牌相符的小事，看看什麼改變了。`,
    ziwei: `你的命宮是${reading.ziwei.lifePalaceZh}。${reading.ziwei.guidance.zh}面對「${question}」，有用的問題不是「會發生什麼？」而是「這個宮位要我為自己的哪一部分負責？」宮位是你住的房間——不是許願就能重新裝修，而是日復一日改變使用它的方式。先從房間裡最小的責任開始，守一週，留意周圍的變化。`,
    horoscope: `你的太陽星座是${reading.horoscope.sunSign.zh}。${reading.horoscope.guidance.zh}面對「${question}」，星座的時機就是線索：你感覺最像自己的時刻，通常也是答案最清晰的時刻。不要在疲憊或匆忙時決定——在最像自己的時段決定，選擇會比較不像賭博。`,
    numerology: `你的生命靈數是 ${reading.numerology.lifePath}。${reading.numerology.guidance.zh}針對「${question}」，這個數字提醒你不斷遇到的課題。同一個課題換一個情境出現，不是失敗，而是課程。問問這個情境在教你什麼，是上一個情境也教過的，下一步通常就清楚了。`,
    yijing: `你的卦象是「${reading.yijing.hexagram}」。${reading.yijing.guidance.zh}面對「${question}」，卦象邀請你採取一個小而誠實的行動，而不是一個宏大的計劃。說出最小的一步，今天就做，然後讓下一步在那之後顯現。`,
    portrait: `${reading.portrait.essenceLine.zh} ${reading.synthesis.zh}面對你的問題——「${question}」——整體肖像建議同一個行動：回到自己的方向，而不是別人的速度。${reading.portrait.growingEdge.zh}`,
  };
  return lang === 'zh' ? zh[pickSystem] : en[pickSystem];
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
