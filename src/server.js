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
 *  5. Master chat is the single reading conversation; the retired Live Reader
 *     API is handled by the 410 response in src/master-flow.js.
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
const { buildFullReading, buildTeaser, castYijingRandom, parseBirth, scoreEnneagramFromChoices, scoreMbti, getPersonalityQuestions, lockedPersonalitySummary, elName, elementMeaning } = require('./readings');
const { strings } = require('./i18n');
const { sendEmail, sendReportEmail } = require('./email');
const { issueAccessToken, verifyAccessToken, issueOwnerToken, verifyOwnerToken, checkOwnerPassword, hashToken } = require('./auth');
const {
  aiMasterLive, validateMasterMessage, resolveAiMaster, aiUsageSummary,
  aiCooldownState,
} = require('./ai-master');

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

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false,
  // JSON, not the default plain-text 429: the frontend calls res.json()
  // on every API reply, and a plain-text 429 used to surface as the
  // generic "unreachable" message (7 Nov 2026 — the Master showed the
  // friendly unreachable error four times in a row when the limiter
  // tripped). A limiter trip never consumes a chat or wipes state —
  // it runs before the route handler, so nothing is stored.
  handler: (req, res) => res.status(429).json({ error: 'Too many requests — please wait a few minutes and try again.' }),
});
const masterChatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false,
  handler: (req, res) => res.status(429).json({ error: 'Too many questions in a short time — please wait a few minutes and try again.' }),
});
const ownerLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (_req, res) => res.status(429).json({ error: 'Too many owner login attempts. Please wait 15 minutes.' }),
});
const ownerEmailTestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 1, standardHeaders: true, legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ error: 'An email delivery check was already requested from this connection. Please wait an hour.' }),
});
app.use('/api/', apiLimiter);

// Stripe webhook needs the RAW body — see the skip above.
let stripe = null;
if (config.stripeSecretKey) {
  stripe = require('stripe')(config.stripeSecretKey);
}

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function validEmailTestCredential(candidate) {
  if (!config.emailTestToken || typeof candidate !== 'string') return false;
  const supplied = Buffer.from(candidate);
  const expected = Buffer.from(config.emailTestToken);
  return supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
}
function canRunEmailTest(req) {
  return verifyOwnerToken(req.headers['x-owner-token']) || validEmailTestCredential(req.headers['x-email-test-token']);
}
function requireFields(body, fields) {
  return fields.filter((f) => !body || body[f] === undefined || body[f] === '');
}
function validateZiweiInputs(body) {
  const missing = requireFields(body, ['birthTime', 'ziweiGender']);
  if (missing.length) return `Missing: ${missing.join(', ')}`;
  if (!/^\d{2}:\d{2}$/.test(String(body.birthTime))) return 'Enter a valid birth time in HH:MM format.';
  if (!['male', 'female'].includes(body.ziweiGender)) return 'Choose a chart sex for the Zi Wei calculation.';
  return null;
}

const masterFlow = require('./master-flow');
app.use('/api', masterFlow.createMasterRouter({ stripe, limiter: masterChatLimiter, readingFor: (access) => {
  const order=access.order_id?db.prepare('SELECT * FROM orders WHERE id=?').get(access.order_id):null;
  const personality=loadPersonality(access.email,access.birth_date);
  if (!order?.birth_time || !order?.ziwei_gender) throw new Error('Please add your birth time and chart sex to calculate the full Zi Wei reading.');
  return {personality,reading:buildFullReading({birthDate:access.birth_date,birthTime:order.birth_time,ziweiGender:order.ziwei_gender,name:order.name||null},personality)};
}}));

// --- Public config (safe to expose) ---------------------------------------
app.get('/api/config', (req, res) => {
  const price = currentPrice();
  res.json({
    price: { amountCents: price.amountCents, currency: price.currency, isPromo: price.isPromo, promoStart: price.promoStart, promoEnd: price.promoEnd },
    fullPriceCents: config.fullPriceCents,
    promoAccessEnabled: true,
    stripePublishableKey: config.stripePublishableKey || null,
    previewMode: config.previewMode,
    liveReaderMax: config.liveReaderMaxPerSession,
    masterChatMax: config.masterChatMaxPerSession,
    masterProbePacks: [
      { additionalFollowups: 5, amountCents: config.masterProbe5PriceCents },
      { additionalFollowups: 10, amountCents: config.masterProbe10PriceCents },
    ],
    // AI Master (Gemini): true only when GEMINI_API_KEY is set server-side.
    // The key itself is never exposed — only whether the AI is live.
    aiMasterLive: aiMasterLive(),
    masterChatExtendedTotal: 15,
    masterFlow: {mainQuestions:3,includedProbes:5,packOptions:[5,10],maxPurchases:1,maxProbes:15},
  });
});

// --- Hook: teaser only ------------------------------------------------------
app.post('/api/hook', (req, res) => {
  const missing = requireFields(req.body, ['birthDate', 'birthTime', 'ziweiGender']);
  if (missing.length) return res.status(400).json({ error: `Missing: ${missing.join(', ')}` });
  const chartError = validateZiweiInputs(req.body);
  if (chartError) return res.status(400).json({ error: chartError });
  try {
    parseBirth(req.body.birthDate, req.body.birthTime);
    const teaser = buildTeaser({ birthDate: req.body.birthDate, birthTime: req.body.birthTime, ziweiGender: req.body.ziweiGender, name: req.body.name || null });
    return res.json(teaser);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

// Private invite-only trials. The code itself is hashed in the database and
// returned only once to the owner when created. Each redemption is unique to
// one email + birth date and receives an expiring paid-style order/token.
const promoAccessLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 8, standardHeaders: true, legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ error: 'Too many code attempts. Please try again in an hour.' }),
});
db.exec(`CREATE TABLE IF NOT EXISTS promo_redemptions(
  email TEXT NOT NULL,birth_date TEXT NOT NULL,order_id INTEGER NOT NULL UNIQUE,
  redeemed_at TEXT NOT NULL DEFAULT(datetime('now')),PRIMARY KEY(email,birth_date)
);`);
app.post('/api/redeem-promo', promoAccessLimiter, (req, res) => {
  const { email: rawEmail, birthDate, birthTime, ziweiGender, name, promoCode } = req.body || {};
  if (!isValidEmail(rawEmail)) return res.status(400).json({ error: 'Enter a valid email address.' });
  if (!birthDate || !birthTime || !ziweiGender) return res.status(400).json({ error: 'Complete your birth date, birth time and chart sex first.' });
  const chartError = validateZiweiInputs({ birthTime, ziweiGender });
  if (chartError) return res.status(400).json({ error: chartError });
  try { parseBirth(birthDate, birthTime); } catch (e) { return res.status(400).json({ error: e.message }); }
  const normalizedCode = String(promoCode || '').trim().toUpperCase();
  if (!/^[A-Z0-9]{8,16}$/.test(normalizedCode)) return res.status(403).json({ error: 'That trial code is not valid.' });
  const codeHash = hashToken(normalizedCode);
  const email = rawEmail.trim().toLowerCase();
  let orderId, accessDays;
  try {
    db.exec('BEGIN IMMEDIATE');
    const code = db.prepare('SELECT * FROM trial_codes WHERE code_hash=? AND disabled=0').get(codeHash);
    if (!code) { db.exec('ROLLBACK'); return res.status(403).json({ error: 'That trial code is not valid.' }); }
    const now = Date.now();
    if (new Date(code.expires_at).getTime() <= now) { db.exec('ROLLBACK'); return res.status(410).json({ error: 'This trial code has expired.' }); }
    const existing = db.prepare('SELECT id FROM trial_code_redemptions WHERE email=? AND birth_date=?').get(email, birthDate);
    const legacy = db.prepare('SELECT order_id FROM promo_redemptions WHERE email=? AND birth_date=?').get(email, birthDate);
    if (existing || legacy) { db.exec('ROLLBACK'); return res.status(409).json({ error: 'A trial has already been used for this email and birth date.' }); }
    const count = db.prepare('SELECT COUNT(*) n FROM trial_code_redemptions WHERE code_id=?').get(code.id).n;
    if (count >= code.max_redemptions) { db.exec('ROLLBACK'); return res.status(409).json({ error: 'This trial code has already been used.' }); }
    accessDays = code.access_days;
    const order = db.prepare("INSERT INTO orders(email,birth_date,birth_time,ziwei_gender,name,amount_cents,currency,price_label,provider,status,paid_at) VALUES(?,?,?,?,?,0,'usd','trial-code','trial','paid',datetime('now'))")
      .run(email, birthDate, birthTime, ziweiGender, name || null);
    orderId = Number(order.lastInsertRowid);
    const expiresAt = new Date(now + accessDays * 86400000).toISOString();
    db.prepare('INSERT INTO trial_code_redemptions(code_id,email,birth_date,order_id,access_expires_at) VALUES(?,?,?,?,?)').run(code.id, email, birthDate, orderId, expiresAt);
    db.exec('COMMIT');
  } catch (e) {
    try { db.exec('ROLLBACK'); } catch {}
    console.error('Promo redemption failed:', e.message);
    return res.status(500).json({ error: 'Could not unlock this reading. Please try again.' });
  }
  const { token, expiresAt } = issueAccessToken(email, birthDate, orderId, accessDays);
  return res.json({ paid: true, trialAccess: true, email, birthDate, token, expiresAt });
});
function recordTrialConversion(email, birthDate) {
  if (!email || !birthDate) return;
  db.prepare(`UPDATE trial_code_redemptions SET converted_at=COALESCE(converted_at,datetime('now'))
    WHERE email=? AND birth_date=? AND EXISTS (
      SELECT 1 FROM orders o WHERE o.email=? AND o.birth_date=? AND o.status='paid'
        AND o.provider='stripe' AND o.price_label NOT IN ('trial-code','master-chat-upgrade')
        AND o.created_at >= trial_code_redemptions.redeemed_at
    )`).run(String(email).toLowerCase(), birthDate, String(email).toLowerCase(), birthDate);
}

// --- Checkout: Stripe Checkout Session, price decided server-side ----------
app.post('/api/checkout', async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Payments are not configured yet (STRIPE_SECRET_KEY missing). See DEPLOY-CHECKLIST.md.' });
  const missing = requireFields(req.body, ['email', 'birthDate', 'birthTime', 'ziweiGender']);
  if (missing.length) return res.status(400).json({ error: `Missing: ${missing.join(', ')}` });
  const chartError = validateZiweiInputs(req.body);
  if (chartError) return res.status(400).json({ error: chartError });
  if (!isValidEmail(req.body.email)) return res.status(400).json({ error: 'Invalid email' });
  try { parseBirth(req.body.birthDate, req.body.birthTime); } catch (e) { return res.status(400).json({ error: e.message }); }

  const price = currentPrice();
  const email = req.body.email.toLowerCase();
  const order = db.prepare(
    'INSERT INTO orders (email, birth_date, birth_time, ziwei_gender, name, amount_cents, currency, price_label, provider, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(email, req.body.birthDate, req.body.birthTime, req.body.ziweiGender, req.body.name || null,
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

// The active one-time 5/10 pack endpoint is mounted above in master-flow.
// Keep a hard stop here as a guard in case route ordering changes later.
app.post('/api/checkout-upgrade', (_req, res) => res.status(410).json({ error: 'Refresh FateWeave to load the current follow-up packs.' }));

// --- Extended Master Chat upgrade (7 Nov 2026) --------------------------
// A paid $3 upgrade lifts the 5-follow-up limit for the same 90-day window
// as the unlock. Stored per buyer (email + birth_date) in chat_upgrades,
// never per token. The upgrade never outlives the reading: expires_at is
// the buyer's current unlock expiry (or now + 90 days if none is found).
function isChatExtended(email, birthDate) {
  if (!email || !birthDate) return false;
  const row = db.prepare('SELECT * FROM chat_upgrades WHERE email = ? AND birth_date = ?').get(String(email).toLowerCase(), birthDate);
  if (!row) return false;
  return new Date(row.expires_at) > new Date() ? row : false;
}
function grantChatExtended(email, birthDate, orderId) {
  masterFlow.grantPurchase(email,birthDate,orderId);
  return new Date(Date.now()+config.accessTokenDays*86400000).toISOString();
}

// --- Exchange a paid Checkout Session for an access token (server-verified) -
app.get('/api/checkout-session/:sessionId', async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Payments are not configured yet.' });
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
    if (session.payment_status !== 'paid') return res.status(402).json({ error: 'Payment not completed yet.' });
    const orderId = Number(session.metadata?.orderId || 0);
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    // Upgrade order: no new access token — the buyer already holds one.
    // Mark it paid and grant Extended Master Chat (30 chats) for the unlock window.
    if (order.price_label === 'master-chat-upgrade' || session.metadata?.upgrade === '1') {
      db.prepare("UPDATE orders SET status = 'paid', paid_at = datetime('now') WHERE id = ?").run(orderId);
      const until = grantChatExtended(order.email, order.birth_date, orderId);
      return res.json({ paid: true, upgrade: true, email: order.email, birthDate: order.birth_date, chatExtendedUntil: until });
    }
    // Reuse an existing token for this order if one was already issued.
    // The stored token is only a hash, so it cannot be recovered — issue a
    // FRESH token for the same verified-paid order instead, so the success
    // page always has a working token and never strands the buyer on a
    // bare page. The old token stays valid too (same order, same buyer).
    const existing = db.prepare('SELECT * FROM access_tokens WHERE order_id = ? AND revoked = 0').get(orderId);
    if (existing) {
      const fresh = issueAccessToken(order.email, order.birth_date, orderId);
      db.prepare("UPDATE orders SET status = 'paid', paid_at = datetime('now') WHERE id = ?").run(orderId);
      recordTrialConversion(order.email, order.birth_date);
      return res.json({ paid: true, email: order.email, birthDate: order.birth_date, token: fresh.token, expiresAt: fresh.expiresAt, tokenAlreadyIssued: true, message: 'Access was already issued for this order — a fresh token has been issued for this session.' });
    }
    const { token, expiresAt } = issueAccessToken(order.email, order.birth_date, orderId);
    db.prepare("UPDATE orders SET status = 'paid', paid_at = datetime('now') WHERE id = ?").run(orderId);
    recordTrialConversion(order.email, order.birth_date);
    db.prepare('INSERT OR IGNORE INTO email_subscribers (email, birth_date, name) VALUES (?, ?, ?)').run(order.email, order.birth_date, order.name);
    // Email the detailed report (best-effort — never block the unlock on email).
    try {
      const reading = buildFullReading({ birthDate: order.birth_date, birthTime: order.birth_time, ziweiGender: order.ziwei_gender, name: order.name });
      await sendReportEmail(order.email, reading, 'en');
    } catch (e) { console.error('Report email failed (checkout, unlock unaffected):', { email: order.email, code: e.code || 'no-code', message: e.message }); }
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
      if (session.metadata?.upgrade !== '1') {
        const order = db.prepare('SELECT email,birth_date,price_label FROM orders WHERE id=?').get(orderId);
        if (order && order.price_label !== 'trial-code') recordTrialConversion(order.email, order.birth_date);
      }
      if (session.metadata?.upgrade === '1') {
        const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
        if (order) {
          const until = grantChatExtended(order.email, order.birth_date, orderId);
          console.log(`Order ${orderId}: Extended Master Chat granted until ${until}.`);
        }
      }
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

app.post('/api/update-ziwei-inputs', (req, res) => {
  const { token, email, birthDate, birthTime, ziweiGender } = req.body || {};
  const access = verifyAccessToken(token, email, birthDate);
  if (!access) return res.status(403).json({ error: 'A valid paid access token is required.' });
  const chartError = validateZiweiInputs({ birthTime, ziweiGender });
  if (chartError) return res.status(400).json({ error: chartError });
  const order = access.order_id ? db.prepare('SELECT * FROM orders WHERE id = ?').get(access.order_id) : null;
  if (!order) return res.status(404).json({ error: 'The paid order for this reading could not be found.' });
  try { parseBirth(access.birth_date, birthTime); }
  catch (e) { return res.status(400).json({ error: e.message }); }
  db.prepare('UPDATE orders SET birth_time = ?, ziwei_gender = ? WHERE id = ?').run(birthTime, ziweiGender, order.id);
  return res.json({ updated: true });
});

app.get('/api/report', (req, res) => {
  const { token, email, birthDate } = req.query;
  const access = verifyAccessToken(token, email, birthDate);
  if (!access) return res.status(403).json({ error: 'A valid paid access token is required for the full report.' });
  const order = access.order_id ? db.prepare('SELECT * FROM orders WHERE id = ?').get(access.order_id) : null;
  if (!order?.birth_time || !order?.ziwei_gender) return res.status(409).json({ code: 'ziwei_inputs_required', error: 'Enter your birth time and chart sex to calculate the complete Zi Wei chart.', birthTime: order?.birth_time || null, ziweiGender: order?.ziwei_gender || null });
  const personality = loadPersonality(access.email, access.birth_date);
  const reading = buildFullReading({ birthDate: access.birth_date, birthTime: order.birth_time, ziweiGender: order.ziwei_gender, name: order.name || null }, personality);
  return res.json({ ...reading, personality: personality || undefined, access: { email: access.email, expiresAt: access.expires_at, liveReaderMax: config.liveReaderMaxPerSession } });
});

// Staging-only preview unlock. It is inert unless explicitly enabled on
// Render. The fixture order and access token live in the disposable staging
// database; this route never grants access on Railway or in normal production.
app.post('/api/preview-access', (req, res) => {
  if (!config.previewMode) return res.status(404).json({ error: 'Not found.' });
  const missing = requireFields(req.body, ['birthDate', 'birthTime', 'ziweiGender']);
  if (missing.length) return res.status(400).json({ error: `Missing: ${missing.join(', ')}` });
  const chartError = validateZiweiInputs(req.body);
  if (chartError) return res.status(400).json({ error: chartError });
  try { parseBirth(req.body.birthDate, req.body.birthTime); }
  catch (e) { return res.status(400).json({ error: e.message }); }
  const email = `preview-${crypto.randomBytes(8).toString('hex')}@fateweave.invalid`;
  const order = db.prepare(
    "INSERT INTO orders (email, birth_date, birth_time, ziwei_gender, name, amount_cents, currency, price_label, provider, status, paid_at) VALUES (?, ?, ?, ?, ?, 0, 'usd', 'staging-preview', 'preview', 'paid', datetime('now'))"
  ).run(email, req.body.birthDate, req.body.birthTime, req.body.ziweiGender, req.body.name || null);
  const { token, expiresAt } = issueAccessToken(email, req.body.birthDate, order.lastInsertRowid);
  return res.json({ token, email, birthDate: req.body.birthDate, expiresAt, preview: true });
});

// --- Resend the detailed report email (paid token only) ----------------------
// On failure the response carries a machine-readable code so the frontend
// can give a useful next step. Raw provider responses are kept in server logs.
app.post('/api/resend-report', async (req, res) => {
  const { token, email, birthDate } = req.body || {};
  const access = verifyAccessToken(token, email, birthDate);
  if (!access) return res.status(403).json({ error: 'A valid paid access token is required.' });
  try {
    const order = access.order_id ? db.prepare('SELECT * FROM orders WHERE id = ?').get(access.order_id) : null;
    if (!order?.birth_time || !order?.ziwei_gender) return res.status(409).json({ code: 'ziwei_inputs_required', error: 'Enter your birth time and chart sex before emailing the complete report.' });
    const personality = loadPersonality(access.email, access.birth_date);
    const reading = buildFullReading({ birthDate: access.birth_date, birthTime: order.birth_time, ziweiGender: order.ziwei_gender, name: order.name || null }, personality);
    await sendReportEmail(access.email, reading, 'en');
    return res.json({ resent: true, email: access.email });
  } catch (e) {
    const code = e.code || 'resend_error';
    console.error('Resend report email failed:', { email: access.email, code, message: e.message });
    const friendly = code === 'resend_sandbox_recipient'
      ? 'This email address cannot receive the report yet — the sender is still in Resend test mode, which only delivers to the Resend account owner’s own email. Your reading is unlocked on this page: use Download report below to get it now, no email needed.'
      : code === 'smtp_auth_error'
        ? 'The report email service could not sign in. Your reading is unlocked on this page — use Download report below, and contact support if you still need the email.'
        : code === 'smtp_connection_error'
          ? 'The report email service could not connect. Your reading is unlocked on this page — use Download report below and try again later.'
          : code === 'smtp_config_error' || code === 'email_provider_not_configured'
            ? 'Report email is temporarily unavailable. Your reading is unlocked on this page — use Download report below.'
            : 'Could not resend the report email. Your reading is still unlocked on this page — use Download report below to get it now.';
    return res.status(502).json({ error: friendly, code });
  }
});

app.get('/api/yijing/cast', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  return res.json(castYijingRandom());
});

// --- Ask the Master: follow-up chat on the buyer's own reading -------------
// Paid-only, 5 AI chats per BUYER (server-enforced, separate from Live
// Reader's 3 questions); Extended upgrade ($3): 30 AI chats in total
// per buyer. The counter counts AI REPLIES the buyer received — the
// stored Master rows carry source 'ai' / 'rule-based', and only the
// 'ai' ones consume the allowance (7 Nov 2026 fix 3: a rule-based
// reply given while the AI is resting/down never consumes a chat, so
// the counter only moves on a real AI answer). The ai_usage ledger
// stays the AI cost record only.
// History and counts are keyed by the BUYER (email + birth_date), not
// by sessionId: the browser makes a fresh random sessionId on every
// page load, and the old keying showed an empty thread after a reload
// or after the Stripe return from the $3 upgrade. sessionId is still
// accepted (and stored) for backward compatibility, but it never
// wipes or hides the buyer's thread. Answers come only from this
// buyer's own full reading + the buyer's conversation (Live Reader Q&A
// included, stored in master_chat_messages with source 'live-reader').
// History: GET /api/master-chat returns the thread so a reload restores it.
function masterChatHistory(email, birthDate) {
  return db.prepare('SELECT role, content, lang, source FROM master_chat_messages WHERE email = ? AND birth_date = ? ORDER BY id DESC LIMIT 100')
    .all(String(email).toLowerCase(), birthDate).reverse();
}
function masterChatCount(email, birthDate) {
  // AI replies received, not questions asked (7 Nov 2026 fix 3):
  // role 'master' rows store the reply's source — 'ai' or
  // 'rule-based' — so this counts only real AI answers. A rule-based
  // reply given while the AI is resting/down never consumes the 5
  // included or the 30 Extended chats.
  const row = db.prepare("SELECT COUNT(*) AS c FROM master_chat_messages WHERE email = ? AND birth_date = ? AND role = 'master' AND source = 'ai'").get(String(email).toLowerCase(), birthDate);
  return row ? row.c : 0;
}
app.get('/api/master-chat', (req, res) => {
  const { token, email, birthDate, sessionId } = req.query;
  const access = verifyAccessToken(token, email, birthDate);
  if (!access) return res.status(403).json({ error: 'A valid paid access token is required for Ask the Master.' });
  if (!sessionId) return res.status(400).json({ error: 'sessionId is required.' });
  const used = masterChatCount(access.email, access.birth_date);
  const extended = !!isChatExtended(access.email, access.birth_date);
  const max = extended ? config.ai.extendedChatTotalMax : config.masterChatMaxPerSession;
  return res.json({
    messages: masterChatHistory(access.email, access.birth_date),
    questionsUsed: used,
    questionsRemaining: Math.max(0, max - used),
    max,
    extended,
    extendedTotal: config.ai.extendedChatTotalMax,
    aiMasterLive: aiMasterLive(),
    // True while the AI is in its short post-failure cooldown (5 min
    // for a 5xx/timeout, 15 min for a 429) — the UI shows a small
    // honest note that answers are summaries meanwhile.
    aiResting: false,
  });
});
// Concurrent identical Master requests, keyed by buyer + exact
// question text. A double-tap / Enter+click can submit the same
// question 2–3 times in the same second (7 Nov 2026 live logs: 3
// identical Gemini calls in one second) — the second caller awaits
// the first caller's result instead of calling Gemini again. The
// client also disables the Ask button while a request is in flight,
// but two tabs can still race, so the server collapses them too.
const inflightMaster = new Map();
const inflightMasterBuyers = new Set();
app.post('/api/master-chat', masterChatLimiter, async (req, res) => {
  const { token, email, birthDate, sessionId, message, lang } = req.body || {};
  const access = verifyAccessToken(token, email, birthDate);
  if (!access) return res.status(403).json({ error: 'A valid paid access token is required for Ask the Master.' });
  if (!sessionId) return res.status(400).json({ error: 'sessionId is required.' });
  // One short question only (max 500 chars) — a friendly message, not a
  // technical error, when the user writes too much.
  const valid = validateMasterMessage(message, lang === 'zh' ? 'zh' : 'en');
  if (!valid.ok) return res.status(400).json({ error: valid.error });
  const used = masterChatCount(access.email, access.birth_date);
  const extended = !!isChatExtended(access.email, access.birth_date);
  const max = extended ? config.ai.extendedChatTotalMax : config.masterChatMaxPerSession;
  // Duplicate guard (7 Nov 2026): an identical question from this
  // buyer within the last 5 seconds that was already answered returns
  // the stored answer — no new Gemini call, no new row, no chat
  // consumed. (Deliberate repeats after 5 s still get a fresh,
  // history-aware answer, so the "give me an example" rotation is
  // unaffected.)
  const lastUser = db.prepare(`SELECT id FROM master_chat_messages WHERE email = ? AND birth_date = ? AND role = 'user' AND source = 'master' AND content = ? AND created_at >= datetime('now', '-5 seconds') ORDER BY id DESC LIMIT 1`)
    .get(access.email, access.birth_date, valid.text);
  if (lastUser) {
    const lastMaster = db.prepare("SELECT content, source FROM master_chat_messages WHERE email = ? AND birth_date = ? AND role = 'master' AND id > ? ORDER BY id ASC LIMIT 1")
      .get(access.email, access.birth_date, lastUser.id);
    if (lastMaster) {
      return res.json({ answer: lastMaster.content, questionsUsed: used, questionsRemaining: Math.max(0, max - used), max, extended, extendedTotal: config.ai.extendedChatTotalMax, messages: masterChatHistory(access.email, access.birth_date), ai: lastMaster.source === 'ai', source: lastMaster.source, aiResting: false, duplicate: true });
    }
  }
  if (used >= max) {
    // code lets the client tell this apart from a rate-limiter 429:
    // only the allowance being used up zeroes the counter.
    return res.status(429).json({ error: 'You have used all ' + max + ' Gemini follow-ups.', code: 'master_limit_reached', questionsUsed: used, questionsRemaining: 0, upgradePriceCents: config.masterChatUpgradePriceCents });
  }
  const dupKey = `${access.email.toLowerCase()}|${access.birth_date}|${valid.text}`;
  const prior = inflightMaster.get(dupKey);
  if (prior) {
    try {
      const body = await prior;
      return res.status(body.httpStatus || 200).json({ ...body, duplicate: true });
    } catch {
      // The first call failed — fall through and try ourselves.
    }
  }
  const buyerKey = `${access.email.toLowerCase()}|${access.birth_date}`;
  if (inflightMasterBuyers.has(buyerKey)) return res.status(409).json({ code: 'master_busy', error: lang === 'zh' ? '请等当前问题回答完毕再提问。' : 'Please wait for your current question to finish.' });
  inflightMasterBuyers.add(buyerKey);
  const work = (async () => {
    const order = access.order_id ? db.prepare('SELECT * FROM orders WHERE id = ?').get(access.order_id) : null;
    if (!order?.birth_time || !order?.ziwei_gender) return { httpStatus: 409, error: 'Enter your birth time and chart sex to calculate the complete reading.', code: 'ziwei_inputs_required' };
    const personality = loadPersonality(access.email, access.birth_date);
    const reading = buildFullReading({ birthDate: access.birth_date, birthTime: order.birth_time, ziweiGender: order.ziwei_gender, name: order.name || null }, personality);
    const history = masterChatHistory(access.email, access.birth_date);
    // AI Master first (Gemini, when GEMINI_API_KEY is set and the caps
    // allow); rule-based reply otherwise — never a dead chat. The stored
    // message is labelled with its source ('ai' or 'rule-based') so the
    // UI can show a small "summary from your reading" note on rule-based
    // replies, and the owner usage view can count fallbacks. questionsAsked
    // is the AI-reply count, so the Extended 30-chat cap counts AI
    // replies received, not questions asked.
    const ai = await resolveAiMaster({
      email: access.email, birthDate: access.birth_date, extended,
      reading, message: valid.text, lang: lang === 'zh' ? 'zh' : 'en', history, personality,
      questionsAsked: used,
    });
    if (ai.status !== 'ai') {
      const retryAfterSeconds = ai.retryAfterSeconds || 30;
      const zh = lang === 'zh';
      const error = ai.reason === 'global-limit'
        ? (zh ? '今日 Gemini 服务额度已用完。请明天再试，你的追问次数未扣除。' : "Today's Gemini service limit has been reached. Please retry tomorrow; no follow-up was used.")
        : (zh ? 'Gemini 暂时无法回答，请稍后重试。你的问题已保留，追问次数未扣除。' : 'Gemini could not answer right now. Please retry shortly. Your question is kept and no follow-up was used.');
      return { httpStatus: 503, error, code: 'gemini_unavailable', retryAfterSeconds,
        questionsUsed: used, questionsRemaining: Math.max(0, max - used), max, extended,
        extendedTotal: config.ai.extendedChatTotalMax, ai: false, source: null, aiResting: false };
    }
    const answer = ai.answer, source = 'ai';
    try {
      db.exec('BEGIN');
      db.prepare("INSERT INTO master_chat_messages (token_hash, session_id, email, birth_date, role, content, lang, source) VALUES (?, ?, ?, ?, 'user', ?, ?, 'master')")
        .run(hashToken(token), sessionId, access.email, access.birth_date, valid.text, lang === 'zh' ? 'zh' : 'en');
      db.prepare("INSERT INTO master_chat_messages (token_hash, session_id, email, birth_date, role, content, lang, source) VALUES (?, ?, ?, ?, 'master', ?, ?, ?)")
        .run(hashToken(token), sessionId, access.email, access.birth_date, answer, lang === 'zh' ? 'zh' : 'en', source);
      db.exec('COMMIT');
    } catch (e) { db.exec('ROLLBACK'); throw e; }
    // Counter: AI replies received out of 5 included, or 30 with
    // Extended. Recomputed after the insert, so it drops only on a
    // real AI answer — a rule-based reply while the AI is resting
    // never consumes a chat.
    const asked = masterChatCount(access.email, access.birth_date);
    return { answer, questionsUsed: asked, questionsRemaining: Math.max(0, max - asked), max, extended, extendedTotal: config.ai.extendedChatTotalMax, messages: masterChatHistory(access.email, access.birth_date), ai: source === 'ai', source, aiResting: false };
  })();
  inflightMaster.set(dupKey, work);
  try {
    const result = await work;
    if (result.httpStatus) {
      res.set('Retry-After', String(result.retryAfterSeconds));
      return res.status(result.httpStatus).json(result);
    }
    return res.json(result);
  } catch (e) {
    // Safety net (8 Nov 2026 fix 4): Express 4 does not forward async
    // handler rejections to error middleware, so an unexpected throw
    // inside work() (reading build, DB write) would hang the request
    // forever with no response — the silent-hang shape seen live.
    // Never a dead chat: fall back to the rule-based answer, and if
    // even that cannot be built, answer with a friendly 500 JSON.
    console.error('Master chat work failed:', e && e.message);
    return res.status(503).json({ code: 'gemini_unavailable', error: lang === 'zh'
      ? '暂时无法取得回答，请重试。追问次数未扣除。'
      : 'The answer could not be completed. Please retry; no follow-up was used.' });
  } finally {
    if (inflightMaster.get(dupKey) === work) inflightMaster.delete(dupKey);
    inflightMasterBuyers.delete(buyerKey);
  }
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
  { id: 'love', en: ['love', 'relationship', 'marriage', 'partner', 'boyfriend', 'girlfriend', 'wife', 'husband', 'dating', 'crush', 'meet someone', 'someone new', 'find love', 'find someone'], zh: ['感情', '爱情', '婚姻', '伴侣', '男友', '女友', '老公', '老婆', '对象', '喜欢', '脱单'] },
  { id: 'money', en: ['money', 'wealth', 'finance', 'salary', 'income', 'invest', 'debt', 'buy', 'house', 'price', 'rich'], zh: ['财运', '钱', '财富', '工资', '收入', '投资', '买房', '债务', '赚钱'] },
  { id: 'health', en: ['health', 'body', 'sleep', 'tired', 'sick', 'energy', 'exercise', 'rest'], zh: ['健康', '身体', '睡眠', '累', '生病', '精力', '运动', '休息'] },
  { id: 'timing', en: ['when', 'timing', 'next month', 'this year', 'soon', 'should i'], zh: ['什么时候', '时机', '何时', '今年', '下个月', '该不该'] },
];
function firstSentence(text) {
  if (!text) return '';
  const s = String(text);
  // Quote-aware: a terminator inside 「」 or “” does not end the sentence
  // (e.g. the Life Path text quoted inside the numerology career line).
  // Only 「」 and “” are tracked — English apostrophes (chart's) must not
  // unbalance the depth count.
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '「' || ch === '“') depth++;
    else if (ch === '」' || ch === '”') depth = Math.max(0, depth - 1);
    else if ((ch === '.' || ch === '!' || ch === '?' || ch === '。') && depth === 0) {
      return s.slice(0, i + 1).trim();
    }
  }
  return s.trim();
}
// firstSentence() keeps its trailing terminator (".", "。" …). Strip one
// before a template adds its own, or the answer prints ".." / "。。"
// (10-profile stress test, 8 Nov 2026: default-branch "changes.." and
// "前行。。", general-example "生产。。今天").
function stripTerm(s) { return String(s || '').replace(/[.。!！?？]+$/, ''); }
function plainEN(s) {
  // Order matters: "Your X" must be replaced before bare "X", or "Your Day
  // Master is…" becomes "Your your chart's core is…" (bug found 7 Nov 2026).
  return String(s)
    .replace(/Your Day Master/g, "Your chart's core")
    .replace(/your Day Master/g, "your chart's core")
    .replace(/Day Master/g, "the chart's core")
    .replace(/Your useful god/g, 'The element you most need')
    .replace(/your useful god/g, 'the element you most need')
    .replace(/useful god/g, 'the element you most need')
    .replace(/Your luck pillar/g, 'Your ten-year phase')
    .replace(/your luck pillar/g, 'your ten-year phase')
    .replace(/luck pillar/g, 'ten-year phase');
}
function plainZH(s) {
  // Same ordering rule as plainEN: "你的用神是…" must not become
  // "你的你最需要补的五行是…".
  return String(s)
    .replace(/你的日主/g, '你的命盘核心')
    .replace(/日主/g, '命盘核心')
    .replace(/你的用神/g, '你最需要补的五行')
    .replace(/用神/g, '最需要补的五行')
    .replace(/你的大运/g, '你的十年阶段')
    .replace(/大运/g, '十年阶段');
}

/* --- Shared topic helpers (Live Reader + Ask the Master) ------------------
   Extracted verbatim from liveReaderAnswer so both answer from the same
   sections of the same reading. topicPick(topic) returns the four
   [system, section] pairs for a topic, in priority order; Live Reader
   uses pairs 0-1, Ask the Master "deeper" / repeat-topic follow-ups use
   pairs 2-3 so they never repeat the Live Reader answer verbatim. */
function classifyTopic(question) {
  const q = String(question || '').toLowerCase();
  const has = (list) => list.some((w) => q.includes(w.toLowerCase()));
  for (const t of TOPICS) { if (has(t.en) || has(t.zh)) return t.id; }
  return 'general';
}
function topicPick(reading, topic) {
  return {
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
}
function topicCore(reading, topic, lang) {
  return {
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
      ? `你的核心：${reading.bazi.dayMaster.zh}，生命灵数是 ${reading.numerology.lifePath}。`
      : `Your core: ${reading.bazi.dayMaster.en}, and your Life Path is ${reading.numerology.lifePath}.`,
  }[topic];
}
function topicAction(topic, lang) {
  return {
    career: lang === 'zh' ? '这周在工作中做一件能发挥你最强一面的事，事后写下一行结果。' : 'This week, do one thing at work that uses your strongest side — and write down how it went.',
    love: lang === 'zh' ? '这周对最亲近的人直接说出一个需要——说出来，不要只暗示。' : 'This week, say one plain need to the person closest to you — out loud, not as a hint.',
    money: lang === 'zh' ? '这周写下两个数字：进了多少，出了多少。不评判，只记数字。' : 'This week, write down two numbers: what came in and what went out. No judgement, just the numbers.',
    health: lang === 'zh' ? '这周像守死线一样守住一段休息时间——固定时间，不挪动。' : 'This week, protect one rest window the way you protect a deadline — same time, no moving it.',
    timing: lang === 'zh' ? '这周先准备好一件事，等窗口打开时你就能直接行动。' : 'This week, prepare one thing, so you are ready when the window opens.',
    general: lang === 'zh' ? '这周做一件报告里提到的小事，然后留意有什么变化。' : 'This week, do one small thing the reading points to, then notice what changes.',
  }[topic];
}
function topicWord(topic, lang) {
  const words = {
    career: { en: 'work', zh: '工作' }, love: { en: 'love', zh: '感情' },
    money: { en: 'money', zh: '财运' }, health: { en: 'health', zh: '健康' },
    timing: { en: 'timing', zh: '时机' }, general: { en: 'your reading', zh: '你的报告' },
  };
  return (words[topic] || words.general)[lang === 'zh' ? 'zh' : 'en'];
}

/* Time-horizon questions ("next year", "明年", "next month", "this year",
   "soon" ...) must blend timing content — Yi-Jing timing, Personal Year
   and the hexagram — into the answer, not only the generic topic section.
   (Fix, 7 Nov 2026: a "next year" career question used to get only the
   generic career section, with no timing at all.) */
function hasTimeHorizon(question) {
  const q = String(question || '');
  return /next year|next month|next week|this year|this month|coming year|coming month|soon|in the future/i.test(q)
    || /明年|今年|下个月|下周|这个月|很快|不久|未来/.test(q);
}
function timingLine(reading, lang) {
  const zh = lang === 'zh';
  const L = (o) => (o && typeof o === 'object' ? (zh ? o.zh || o.en : o.en || o.zh) : o);
  const sentYi = zh ? plainZH(firstSentence(reading.yijing.sections.timing.zh)) : plainEN(firstSentence(reading.yijing.sections.timing.en));
  const pyFull = L(reading.numerology.personalYearText);
  return zh
    ? `时机：${sentYi} 今年是${pyFull} 你的卦是第 ${reading.yijing.hexagramNumber} 卦「${reading.yijing.hexagramZh}」。`
    : `Timing: ${sentYi} This is ${pyFull} Your hexagram is ${reading.yijing.hexagramNumber} · ${reading.yijing.hexagramEn}.`;
}

function liveReaderAnswer(reading, question, lang = 'en') {
  const topic = classifyTopic(question);
  const L = (o) => (o && typeof o === 'object' ? (lang === 'zh' ? o.zh || o.en : o.en || o.zh) : o);
  const sent = (sec) => (lang === 'zh' ? plainZH(firstSentence(L(sec))) : plainEN(firstSentence(L(sec))));
  const sysName = (name) => (lang === 'zh' ? { Bazi: '八字', Horoscope: '星座', Tarot: '塔罗', Numerology: '数字命理', 'Yi-Jing': '易经', 'Zi Wei': '紫微' }[name] || name : name);
  // Matching sections of this buyer's actual reading, per topic.
  const pick = topicPick(reading, topic);
  // The system's core fact for this topic — from this buyer's computed values.
  const core = topicCore(reading, topic, lang);
  const action = topicAction(topic, lang);
  const s1 = pick[0], s2 = pick[1];
  const sampleNote = '';
  const timing = hasTimeHorizon(question) ? timingLine(reading, lang) : '';
  return lang === 'zh'
    ? `${sysName(s1[0])}：${sent(s1[1])}\n\n${core} ${sysName(s2[0])}也这么说：${sent(s2[1])}${sampleNote}${timing ? `\n\n${timing}` : ''}\n\n本周一件事：${action}`
    : `${sysName(s1[0])}: ${sent(s1[1])}\n\n${core} ${sysName(s2[0])} says the same: ${sent(s2[1])}${sampleNote}${timing ? `\n\n${timing}` : ''}\n\nOne thing this week: ${action}`;
}


/* Ask the Master (7 Nov 2026) — rule-based follow-up chat, NO LLM.
   The buyer already got 3 Live Reader answers; this answers what comes
   next: "what does that mean?", "give me an example", "tell me more",
   or a question on one area. Every answer comes ONLY from this buyer's
   own full reading + this session's conversation (history rows, Live
   Reader Q&A included). Plain language: no technical term without a
   plain gloss, short sentences, one direct point + one small action.
   Never invents a prediction, never claims the Zi Wei sample is
   computed, never gives medical / financial / legal advice, never
   touches another buyer's data (only this token's reading is loaded). */
/* Ask the Master — never repeat an answer (fix, 7 Nov 2026).
   The old explain/example branches reused topicCore() + topicPick()[0] —
   the same core + first section Live Reader had just used — so "What does
   that mean?" and "Give me an example" returned essentially the Live
   Reader answer three times. Now:
   - explain identifies the SPECIFIC term present in the immediately
     preceding Master answer (findTermInLastAnswer) and explains THAT term;
   - example rotates through at least 3 distinct everyday scenarios per
     topic, never repeating one already used in this session;
   - a final de-duplication guard (masterChatAnswer wrapper below) compares
     normalised text + first 100 chars against every previous Master answer
     in the session and falls back to an unused section if a candidate
     still duplicates one. */
function normalizeDup(s) {
  return String(s || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
}
function isDupAnswer(candidate, prevAnswers) {
  const n = normalizeDup(candidate);
  if (!n) return false;
  const head = n.slice(0, 100);
  for (const p of prevAnswers || []) {
    const pn = normalizeDup(p);
    if (!pn) continue;
    if (n === pn || pn.includes(n) || n.includes(pn)) return true;
    if (head && pn.slice(0, 100) === head) return true;
  }
  return false;
}
/* The specific term named in the last Master answer — the term an explain
   follow-up ("What does that mean?") is actually asking about. Detected
   from the answer's own words, using this buyer's computed values, never
   from a generic template. Returns the same shape findTerm() returns,
   plus kind/body/corePrefix for the explanation. */
function findTermInLastAnswer(reading, text, lang, personality) {
  const zh = lang === 'zh';
  const t = String(text || '');
  const tl = t.toLowerCase();
  const L = (o) => (o && typeof o === 'object' ? (zh ? o.zh || o.en : o.en || o.zh) : o);
  const elTerm = (key, isDom) => ({
    label: zh ? elName(key, 'zh') + '的能量' : elName(key, 'en') + ' energy',
    gloss: elementMeaning(key, lang),
    text: reading.bazi.elementBalance,
    body: key === reading.bazi.dominant ? reading.bazi.dayMasterText
      : key === reading.bazi.weakest ? reading.bazi.sections.challenges
        : reading.bazi.elementBalance,
    kind: isDom ? 'element-dom' : 'element',
    corePrefix: !!isDom,
  });
  const dom = reading.bazi.dominant, weak = reading.bazi.weakest;
  if (t.includes(`strongest element is ${elName(dom, 'en')}`) || t.includes(`最旺的五行是${elName(dom, 'zh')}`)) return elTerm(dom, true);
  if (t.includes(`lightest element is ${elName(weak, 'en')}`) || t.includes(`最弱的五行是${elName(weak, 'zh')}`)) return elTerm(weak, false);
  if (t.includes(`Sun is ${reading.horoscope.sun.en}`) || t.includes(`太阳在${reading.horoscope.sun.zh}`)) {
    return { label: zh ? '太阳星座' : 'Sun sign', gloss: zh ? '你的太阳星座——你是谁、什么给你动力的核心' : 'your Sun sign — the core of who you are and what fuels you', text: reading.horoscope.sections.sun, kind: 'sun' };
  }
  if (tl.includes(`moon is ${reading.horoscope.moon.en.toLowerCase()}`) || tl.includes(`moon is in ${reading.horoscope.moon.en.toLowerCase()}`) || t.includes(`月亮在${reading.horoscope.moon.zh}`)) {
    return { label: zh ? '月亮星座' : 'Moon sign', gloss: zh ? '你的月亮星座——你私下需要什么，才感到安全、才能充电' : 'your Moon sign — what you privately need to feel safe and recharge', text: reading.horoscope.sections.moon, kind: 'moon' };
  }
  if (t.includes(`Rising ${reading.horoscope.rising.en}`) || t.includes(`上升${reading.horoscope.rising.zh}`)) {
    return { label: zh ? '上升星座' : 'Rising sign', gloss: zh ? '你的上升星座——别人最先遇到的你的样子' : 'your Rising sign — the style people meet first', text: reading.horoscope.sections.rising, kind: 'rising' };
  }
  let m = t.match(/Life Path (?:is )?(\d+)/) || t.match(/生命灵数(?:是| )(\d+)/);
  if (m) return { label: zh ? '生命灵数' : 'Life Path', gloss: zh ? '生命灵数——你的人生不断重复的那一课' : 'your Life Path number — the lesson your life keeps teaching you', text: reading.numerology.lifePathText, kind: 'lifepath' };
  m = t.match(/Personal Year (?:is )?(\d+)/) || t.match(/个人年(?:是| )(\d+)/);
  if (m) return { label: zh ? '个人年' : 'Personal Year', gloss: zh ? '个人年——今年属于你的主题' : 'your Personal Year number — the theme of this year for you', text: reading.numerology.personalYearText, kind: 'personalyear' };
  m = t.match(/Destiny (?:number )?(?:is )?(\d+)/) || t.match(/命运数(?:是| )(\d+)/);
  if (m && reading.numerology.destinyText) return { label: zh ? '命运数' : 'Destiny number', gloss: zh ? '命运数——世界不断要求你练习的方向' : 'your Destiny number — the direction the world keeps asking you to practise', text: reading.numerology.destinyText, kind: 'destiny' };
  m = t.match(/hexagram (?:is )?(\d+)/i) || t.match(/第 ?(\d+) 卦/);
  if (m) return { label: zh ? '你的卦象' : 'Your hexagram', gloss: zh ? '你的卦象——你现在处境的一幅图，由六爻组成' : 'your hexagram — a picture of your situation right now, built from six lines', text: reading.yijing.theme, kind: 'hexagram' };
  m = t.match(/chart's core is ([A-Za-z ]+?)(?:\.|,| and)/) || t.match(/命盘核心是(\S+?)(?:。|，|、)/);
  if (m) return { label: zh ? '命盘核心' : "Your chart's core", gloss: zh ? '命盘核心——你出生时在中心的那一个五行' : "your chart's core — the element you were born with at the centre", text: reading.bazi.dayMasterText, kind: 'daymaster' };
  for (const c of reading.tarot.cardsDetailed) {
    if (tl.includes(L(c.name).toLowerCase()) || (c.name.zh && t.includes(c.name.zh))) {
      return { label: L(c.name), gloss: zh ? '这张牌在' + L(c.position) + '位置——它指出的那一部分，要先看' : 'this card in the ' + L(c.position) + ' position — what it names is the part to look at first', text: c.meaning, kind: 'tarot' };
    }
  }
  if (/enneagram|九型/i.test(t)) {
    const e = personality && personality.enneagram;
    return { label: zh ? '九型人格' : 'Enneagram', gloss: zh ? '你的九型人格类型——你最想要什么、又在躲什么的模式' : 'your Enneagram type — the pattern of what you want most, and what you avoid', text: e ? { en: firstSentence(e.interpretation.core.en), zh: firstSentence(e.interpretation.core.zh) } : (zh ? '你还没有做九型测验——先在报告上方的测验区做完它，这里就会有你的类型。' : 'You have not taken the Enneagram quiz yet — take it in the quiz section above and your type will appear here.'), kind: 'enneagram' };
  }
  if (/mbti/i.test(t)) {
    const mb = personality && personality.mbti;
    return { label: 'MBTI', gloss: zh ? '你的 MBTI 类型——你天生如何接收信息、如何做决定' : 'your MBTI type — how you naturally take in information and make decisions', text: mb ? { en: firstSentence(mb.interpretation.en), zh: firstSentence(mb.interpretation.zh) } : (zh ? '你还没有做 MBTI 测验——先在报告上方的测验区做完它，这里就会有你的类型。' : 'You have not taken the MBTI quiz yet — take it in the quiz section above and your type will appear here.'), kind: 'mbti' };
  }
  for (const key of ['wood', 'fire', 'earth', 'metal', 'water']) {
    if (tl.includes(`${key} energy`) || t.includes(`${elName(key, 'zh')}的能量`) || t.includes(`${elName(key, 'zh')}能量`)) return elTerm(key, key === dom);
  }
  return null;
}
/* Explain one term in plain words, naming the buyer's actual values.
   For the dominant element (the core claim of a career answer) the
   explanation keeps the "Your core:" line the Live Reader answer opened
   with, then explains the term itself — it never reuses the Live Reader
   answer's body. */
/* Head for an explained term. The gloss already names the term in most
   cases ("your Life Path number — ..."), so only prepend the label when
   the gloss does not already say it — comparing after stripping a leading
   "your " / "你的" from both sides, or "Moon sign — your Moon sign —"
   stutters (bug found 7 Nov 2026). And when the body sentence already
   contains the gloss (an element's meaning restated in its own section),
   the head is just the label — otherwise the same phrase appears twice. */
function explainHead(term, bodySent, lang) {
  const zh = lang === 'zh';
  const stripLead = (s) => String(s || '').replace(/^(your|你的)\s*/i, '');
  const norm = (x) => String(x || '').toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, ' ').trim();
  const gloss = term.gloss || '';
  if (bodySent && norm(gloss).length > 0 && norm(bodySent).includes(norm(gloss))) return term.label;
  const glossLead = stripLead(gloss).toLowerCase();
  const labelLead = stripLead(term.label).toLowerCase();
  if (labelLead.length > 0 && glossLead.startsWith(labelLead)) return gloss;
  return term.label + (zh ? '——' : ' — ') + gloss;
}
function explainTerm(reading, term, lang, lastTopic) {
  const zh = lang === 'zh';
  const sent = (sec) => {
    const o = sec && typeof sec === 'object' ? (zh ? sec.zh || sec.en : sec.en || sec.zh) : sec;
    return zh ? plainZH(firstSentence(o)) : plainEN(firstSentence(o));
  };
  const bodySent = sent(term.body || term.text);
  const head = explainHead(term, bodySent, lang);
  const headCap = !zh ? head.charAt(0).toUpperCase() + head.slice(1) : head;
  const prefix = term.corePrefix ? topicCore(reading, lastTopic === 'general' ? 'general' : lastTopic, lang) + ' ' : '';
  const action = zh ? '这周留意一次，你在自己身上看到它的时候，用一行字记下来。' : 'This week, notice one moment when you see it in yourself, and write down one line about it.';
  return zh ? prefix + headCap + '。' + bodySent + '\n\n一小步：' + action
    : prefix + headCap + '. ' + bodySent + '\n\nOne small step: ' + action;
}
/* Everyday scenarios, 3 distinct variants per topic, each tied to the
   buyer's actual reading (Day Master, Sun / Moon / Rising, Life Path,
   Personal Year, hexagram, Present tarot card). Variant 0 is the original
   example text; variants 1–2 draw on different values, so a second or
   third "Give me an example" never repeats the first. */
function exampleScenarios(reading, topic, lang, personality) {
  const zh = lang === 'zh';
  const L = (o) => (o && typeof o === 'object' ? (zh ? o.zh || o.en : o.en || o.zh) : o);
  const dom = reading.bazi.dominant, weak = reading.bazi.weakest;
  const sun = reading.horoscope.sun, moon = reading.horoscope.moon, rising = reading.horoscope.rising;
  const lp = reading.numerology.lifePath, py = reading.numerology.personalYear;
  const hexN = reading.yijing.hexagramNumber, hexEn = reading.yijing.hexagramEn, hexZh = reading.yijing.hexagramZh;
  const present = reading.tarot.cardsDetailed[1];
  const hexRef = zh ? `第 ${hexN} 卦「${hexZh}」` : `${hexN} · ${hexEn}`;
  const S = {
    career: [
      zh ? '举个例子：你最旺的五行是' + elName(dom, 'zh') + '。这周工作上遇到卡住的事，先做' + elName(dom, 'zh') + '的那一部分——' + firstSentence(elementMeaning(dom, 'zh')) + '；' + elName(weak, 'zh') + '的那一部分，交给清单或同事。'
        : 'Here is one from everyday life: your strongest element is ' + elName(dom, 'en') + '. At work this week, when a task feels stuck, do the ' + elName(dom, 'en') + ' part first — ' + firstSentence(elementMeaning(dom, 'en')) + ' — and leave the ' + elName(weak, 'en') + ' part to a checklist or a colleague.',
      zh ? '举个例子：你的太阳在' + sun.zh + '。这周工作中遇到需要深度而不是速度的决定时，先安静十分钟，看清楚底下是什么——那就是你的太阳最擅长的事——然后把决定清楚地说一次。'
        : 'Here is one from everyday life: your Sun is ' + sun.en + '. At work this week, when a decision needs depth rather than speed, take ten quiet minutes to look underneath it first — that is your Sun doing its best work — then say the decision out loud once, plainly.',
      zh ? '举个例子：你的生命灵数是 ' + lp + '，你的卦是' + hexRef + '。这周自己先开始一件小事，不要等别人批准——先写一稿，先打一个电话——让这一周告诉你它会变成什么。'
        : 'Here is one from everyday life: your Life Path is ' + lp + ', and your hexagram is ' + hexRef + '. This week, start one small thing yourself instead of waiting for permission — a first draft, a first call — and let the week show you what it becomes.',
    ],
    love: [
      zh ? '举个例子：你的月亮在' + moon.zh + '。今晚不要只暗示，直接说出一个需要——比如“我需要早点休息”——看看会发生什么。'
        : "Here is one from everyday life: your Moon is in " + moon.en + ". Tonight, instead of hinting, say one plain need — 'I need an early night' — and see what happens.",
      zh ? '举个例子：你的上升星座是' + rising.zh + '。这周遇到新的人，留意你给别人的第一印象——温暖、开放、带一点梦幻——就让它是这样，不要急着纠正它。'
        : 'Here is one from everyday life: your Rising is ' + rising.en + '. When you meet someone new this week, notice the first impression you give — warm, open, a little dreamy — and let it be that, instead of correcting it.',
      zh ? '举个例子：你现在的塔罗牌是' + L(present.name) + '。今晚不要问别人感情该怎么办，先静下来听一听你心里已经有的答案——相信它一个晚上。'
        : 'Here is one from everyday life: your Present card is ' + L(present.name) + '. Tonight, instead of asking someone else what to do about a relationship, sit with the quiet answer you already have — and trust it for one evening.',
    ],
    money: [
      zh ? '举个例子：这周写下两个数字——进了多少，出了多少。你最弱的五行是' + elName(weak, 'zh') + '，数字会告诉你，缺口在哪里。'
        : 'Here is one from everyday life: this week, write down two numbers — what came in, and what went out. Your lightest element is ' + elName(weak, 'en') + ', and the numbers will show you where the gap is.',
      zh ? '举个例子：你最弱的五行是' + elName(weak, 'zh') + '。这周觉得钱紧的时候，看看' + elName(weak, 'zh') + '的那一部分——你一直省掉的小快乐或小庆祝——给它留一个小小的、有计划的位置，不要让它在没计划的时候漏出去。'
        : 'Here is one from everyday life: your lightest element is ' + elName(weak, 'en') + '. When money feels tight this week, look for the ' + elName(weak, 'en') + ' part — the small pleasure or celebration you keep skipping — and give it a tiny, planned place instead of letting it leak out unplanned.',
      zh ? '举个例子：你的个人年是 ' + py + '——新的开始。这周为你想开始的新事存一小笔钱，并且说清楚它是用来做什么的。'
        : 'Here is one from everyday life: your Personal Year is ' + py + ' — new beginnings. This week, put one small amount aside for the new thing you want to start, and name what it is for.',
    ],
    health: [
      zh ? '举个例子：这周留出一段固定的休息时间——每天同一时间，手机放一边。你最弱的五行是' + elName(weak, 'zh') + '，休息不是奖励，是燃料。'
        : 'Here is one from everyday life: protect one rest window this week — same time every day, phone aside. Your lightest element is ' + elName(weak, 'en') + ', so rest is not a reward, it is fuel.',
      zh ? '举个例子：你的月亮在' + moon.zh + '。这周觉得累的时候，回到能让你恢复的东西那里——一顿熟悉的饭、一个早睡的夜晚——不要硬撑。'
        : 'Here is one from everyday life: your Moon is ' + moon.en + '. When you feel drained this week, go back to the thing that restores you — a familiar meal, an early night — instead of pushing through.',
      zh ? '举个例子：你的卦是' + hexRef + '。这周精力掉下来的时候，干净利落地结束一件拖着你的事——然后感受第二天轻了多少。'
        : 'Here is one from everyday life: your hexagram is ' + hexRef + '. When your energy dips this week, make one clean break — end the thing that is dragging, clearly — and feel how much lighter the next day is.',
    ],
    timing: [
      zh ? '举个例子：你的卦是' + hexRef + '。这周先准备好一件事，等窗口打开时，你就能直接行动。'
        : 'Here is one from everyday life: your hexagram is ' + hexRef + '. This week, prepare one thing now, so when the window opens you can move at once.',
      zh ? '举个例子：你的个人年是 ' + py + '。这周种下一颗种子——一个电话、一张纸条、第一步——不要每天挖出来看它长了没有。'
        : 'Here is one from everyday life: your Personal Year is ' + py + '. This week, plant one seed — a call, a note, a first step — and do not dig it up to check it every day.',
      zh ? '举个例子：今年与你的' + elName(dom, 'zh') + '相生。这周先做生长的事——计划、初稿——再做紧急的事。'
        : 'Here is one from everyday life: this year feeds your ' + elName(dom, 'en') + '. This week, do the growing thing first — the plan, the first draft — before the urgent thing.',
    ],
    general: [
      zh ? '举个例子：你的命盘核心是' + reading.bazi.dayMaster.zh + '。在平常的一天里，它看起来是这样的——' + stripTerm(firstSentence(reading.bazi.dayMasterText.zh)) + '。今天留意一次，你在哪里看到了它。'
        : "Here is one from everyday life: your chart's core is " + reading.bazi.dayMaster.en + '. In a normal day it looks like this — ' + firstSentence(reading.bazi.dayMasterText.en) + ' — notice it once today, and write down where you saw it.',
      zh ? '举个例子：你的生命灵数是 ' + lp + '。今天自己先开始一件小事，不要等别人先动——哪怕很小——然后留意那是什么感觉。'
        : 'Here is one from everyday life: your Life Path is ' + lp + '. Today, start one thing without waiting for someone else to start it — even a small one — and notice how that feels.',
      zh ? '举个例子：你的完整肖像一句话是：' + firstSentence(L(reading.portrait.essenceLine)) + '今天留意一次，它在哪里出现了——用一行字记下来。'
        : 'Here is one from everyday life: your portrait says — ' + firstSentence(L(reading.portrait.essenceLine)) + ' Today, notice one moment when that shows up, and write down where you saw it.',
    ],
  };
  return S[topic] || S.general;
}
function masterChatAnswerRaw(reading, message, lang, history, personality) {
  const msg = String(message || '');
  const q = msg.toLowerCase();
  const zh = lang === 'zh';
  const L = (o) => (o && typeof o === 'object' ? (zh ? o.zh || o.en : o.en || o.zh) : o);
  const sent = (sec) => (zh ? plainZH(firstSentence(L(sec))) : plainEN(firstSentence(L(sec))));
  const sysName = (name) => (zh ? { Bazi: '八字', Horoscope: '星座', Tarot: '塔罗', Numerology: '数字命理', 'Yi-Jing': '易经', 'Zi Wei': '紫微' }[name] || name : name);
  const sampleNote = () => '';
  const lastUser = [...(history || [])].reverse().find((m) => m.role === 'user');
  const lastTopic = lastUser ? classifyTopic(lastUser.content) : 'general';
  const topic = classifyTopic(msg);
  const pick = topicPick(reading, topic === 'general' ? lastTopic : topic);
  const smallStep = (t) => topicAction(t, lang);
  // A time-horizon question ("next year", "明年", ...) — in this message
  // or in the question it follows up — also draws on timing content.
  const horizon = hasTimeHorizon(msg) || (lastUser && hasTimeHorizon(lastUser.content));
  const timing = horizon ? timingLine(reading, lang) : '';

  // Past lives are not in the reading: say so plainly instead of
  // pivoting to an unrelated term (stress tests, 8 Nov 2026: "What was
  // I in my past life?" fell through to the Zi Wei Life Palace, because
  // "life" matched it and the question is under 30 chars).
  if (/past life|previous life|前世/i.test(msg)) {
    return zh
      ? '你的报告里没有前世——我只能说你这一生的命盘。如果你愿意，可以问我这一生的内容，比如：我的生命灵数是什么意思？'
      : "Your reading doesn't cover past lives — it only describes this life's chart. Ask me about this life instead — for example, what does your Life Path mean?";
  }

  // Safety guard: medical / financial / legal / lottery questions get a
  // short refusal + a redirect to the reading — never advice on those
  // topics. A guard entry with msg/msgZh returns its own wording
  // instead of the generic "talk to a professional" line.
  const guard = [
    // Lottery first: "Should I buy Toto?" also matches the money guard,
    // but the lottery wording is the precise one.
    { re: /lottery|toto|jackpot|winning numbers|\b4d\b/i, zhRe: /彩票|万字|买多多|中奖|买彩票|买万字|赌博|赌钱/, kind: 'lottery',
      msg: "I can't predict lottery numbers — no chart can, and the numbers are random. Ask me what your reading says about money and timing instead.",
      msgZh: '我不能预测彩票号码——没有任何命盘能预测，号码是随机的。可以问我报告里关于财运和时机的内容。' },
    // Symptom language (10-profile stress test, 8 Nov 2026): "I have
    // chest pain" and "My knees hurt" missed the old list (no "pain" /
    // "hurt" keyword) and got a reading answer instead of a doctor
    // pointer. Word boundaries on cure/pain/ill/sick/sore: bare "cure"
    // matched "secure", "pain" matched "Spain", "ill" matched "will".
    // Bare "hurt" is NOT a trigger on its own — "he hurt me" is a love
    // question, not a medical one — so hurt needs a body part nearby
    // (re2). General "how is my health" has no symptom word, so it
    // still answers from the reading, as designed.
    { re: /diagnos|disease|medicine|medication|dosage|treatment|\bcure\b|cancer|doctor|hospital|symptom|\bpain\b|ache|\bsore\b|fever|headache|dizz|nausea|vomit|bleed|swollen|\bnumb\b|injur|fracture|sprain|cough|breathless|\bsick\b|\bill\b/i,
      re2: /\b(knee|back|chest|neck|shoulder|stomach|throat|tooth|joint|muscle|head|eye|ear|hip|ankle|wrist|foot|finger|toe)s?\b[^.!?]{0,30}\b(hurt|hurts|pain|ache|aching|sore|swollen|numb)\b/i,
      zhRe: /诊断|吃药|用药|治疗|治病|癌症|看病|症状|医生|胸痛|胸口痛|膝盖痛|腰痛|背痛|胃痛|牙痛|关节痛|头痛|疼痛|很痛|好痛|生病|发烧|头晕|恶心|呕吐|流血|肿胀|麻木|受伤|骨折|扭伤|咳嗽|气喘|膝盖/, kind: 'medical' },
    { re: /invest|stock|crypto|shares|buy.*(?:fund|bond)|portfolio|should i buy/i, zhRe: /投资|股票|基金|买币|理财|买房|贷款/, kind: 'money' },
    { re: /sue|lawsuit|lawyer|court|contract|legal/i, zhRe: /诉讼|律师|打官司|合同纠纷|法律/, kind: 'legal' },
  ];
  for (const g of guard) {
    if (g.re.test(msg) || (g.re2 && g.re2.test(msg)) || g.zhRe.test(msg)) {
      if (g.msg) return zh ? g.msgZh : g.msg;
      if (zh) {
        const what = g.kind === 'medical' ? '医疗' : g.kind === 'money' ? '财务' : '法律';
        return '这个问题我不能回答——这是' + what + '问题，这份报告只供自我反思。如果你需要专业意见，请找相应的专业人士。你可以问我报告里的内容，比如：我的生命灵数是什么意思？';
      }
      const what = g.kind === 'medical' ? 'medical' : g.kind === 'money' ? 'financial' : 'legal';
      return "I can't advise on that — it's a " + what + ' question, and this reading is for self-reflection only. For that, please talk to a professional. Ask me about your reading instead — for example, what does your Life Path mean?';
    }
  }

  // --- Term lookup: a word from their own reading -------------------------
  function findTerm() {
    const has = (...ws) => ws.some((w) => q.includes(w.toLowerCase()));
    if (has('day master', '日主', '命盘核心')) return { label: zh ? '命盘核心' : "Your chart's core", gloss: zh ? '命盘核心——你出生时在中心的那一个五行' : "your chart's core — the element you were born with at the centre", text: reading.bazi.dayMasterText };
    if (has('life path', '生命灵数')) return { label: zh ? '生命灵数' : 'Life Path', gloss: zh ? '生命灵数——你的人生不断重复的那一课' : 'your Life Path number — the lesson your life keeps teaching you', text: reading.numerology.lifePathText };
    if (has('personal year', '个人年')) return { label: zh ? '个人年' : 'Personal Year', gloss: zh ? '个人年——今年属于你的主题' : 'your Personal Year number — the theme of this year for you', text: reading.numerology.personalYearText };
    if (has('destiny', '命运数')) return { label: zh ? '命运数' : 'Destiny number', gloss: zh ? '命运数——世界不断要求你练习的方向' : 'your Destiny number — the direction the world keeps asking you to practise', text: reading.numerology.destinyText };
    if (has('hexagram', '卦', '易经')) return { label: zh ? '你的卦象' : 'Your hexagram', gloss: zh ? '你的卦象——你现在处境的一幅图，由六爻组成' : 'your hexagram — a picture of your situation right now, built from six lines', text: reading.yijing.theme };
    if (has('sun', '太阳')) return { label: zh ? '太阳星座' : 'Sun sign', gloss: zh ? '你的太阳星座——你是谁、什么给你动力的核心' : 'your Sun sign — the core of who you are and what fuels you', text: reading.horoscope.sections.sun };
    if (has('moon', '月亮')) return { label: zh ? '月亮星座' : 'Moon sign', gloss: zh ? '你的月亮星座——你私下需要什么，才感到安全、才能充电' : 'your Moon sign — what you privately need to feel safe and recharge', text: reading.horoscope.sections.moon };
    if (has('rising', '上升')) return { label: zh ? '上升星座' : 'Rising sign', gloss: zh ? '你的上升星座——别人最先遇到的你的样子' : 'your Rising sign — the style people meet first', text: reading.horoscope.sections.rising };
    if (has('enneagram', '九型')) {
      const e = personality && personality.enneagram;
      return { label: zh ? '九型人格' : 'Enneagram', gloss: zh ? '你的九型人格类型——你最想要什么、又在躲什么的模式' : 'your Enneagram type — the pattern of what you want most, and what you avoid', text: e ? { en: firstSentence(e.interpretation.core.en), zh: firstSentence(e.interpretation.core.zh) } : (zh ? '你还没有做九型测验——先在报告上方的测验区做完它，这里就会有你的类型。' : 'You have not taken the Enneagram quiz yet — take it in the quiz section above and your type will appear here.') };
    }
    if (has('mbti')) {
      const m = personality && personality.mbti;
      return { label: 'MBTI', gloss: zh ? '你的 MBTI 类型——你天生如何接收信息、如何做决定' : 'your MBTI type — how you naturally take in information and make decisions', text: m ? { en: firstSentence(m.interpretation.en), zh: firstSentence(m.interpretation.zh) } : (zh ? '你还没有做 MBTI 测验——先在报告上方的测验区做完它，这里就会有你的类型。' : 'You have not taken the MBTI quiz yet — take it in the quiz section above and your type will appear here.') };
    }
    const elKeys = [['wood', '木'], ['fire', '火'], ['earth', '土'], ['metal', '金'], ['water', '水']];
    for (const [key, ch] of elKeys) {
      if (has(key) || q.includes(ch)) {
        return { label: zh ? elName(key, 'zh') : elName(key, 'en'), gloss: elementMeaning(key, lang), text: reading.bazi.elementBalance };
      }
    }
    for (const p of reading.ziwei.palaces) {
      if (has(p.en.toLowerCase(), p.zh)) return { label: L(p), gloss: L(p.text), text: reading.ziwei.sections[p.key] || reading.ziwei.sections.overview, ziwei: true };
    }
    for (const c of reading.tarot.cardsDetailed) {
      if (q.includes(L(c.name).toLowerCase()) || (c.name.zh && q.includes(c.name.zh))) {
        return { label: L(c.name), gloss: zh ? '这张牌在' + L(c.position) + '位置——它指出的那一部分，要先看' : 'this card in the ' + L(c.position) + ' position — what it names is the part to look at first', text: c.meaning };
      }
    }
    return null;
  }
  const term = findTerm();
  const isExplain = /what does (that|this|it) mean|what is|what'?s|什么意思|是什么|解释|不懂|mean\?/i.test(msg);
  const isExample = /example|例子|举例|比如/.test(q);
  const isDeeper = /tell me more|more about|deeper|详细|多说|深入|展开|再说/.test(q);

  // (a) Explain a term from their reading. The gloss already names the
  // term in most cases ("your Life Path number — ..."), so only prepend
  // the label when the gloss does not already start with it.
  if (term && (isExplain || msg.trim().length < 30)) {
    const action = zh ? '这周留意一次，你在自己身上看到它的时候，用一行字记下来。' : 'This week, notice one moment when you see it in yourself, and write down one line about it.';
    const head = explainHead(term, sent(term.text), lang);
    const headCap = !zh ? head.charAt(0).toUpperCase() + head.slice(1) : head;
    return (zh ? headCap + '。' + sent(term.text) + '\n\n一小步：' + action
      : headCap + '. ' + sent(term.text) + '\n\nOne small step: ' + action);
  }
  // "What does that mean?" with no term named: explain the core of what
  // the Master just said, from the last topic in the conversation.
  // But "What is X?" naming a word that is NOT in their reading gets an
  // honest answer instead — the Master only explains their own report.
  if (isExplain && !term && /what is|什么是/.test(q)) {
    return zh ? '你的报告里没有这个词——我只能解释你自己报告里的词。试试：日主、生命灵数、卦象、塔罗牌、九型或 MBTI。'
      : "I don't have that in your reading — I can only explain words from your own report. Try: Day Master, Life Path, your hexagram, a tarot card, Enneagram or MBTI.";
  }
  if (isExplain && !term) {
    // Bare "What does that mean?" — explain the SPECIFIC term named in
    // the immediately preceding Master answer, not a generic template.
    // (Old code reused topicCore() + topicPick()[0] here, i.e. the Live
    // Reader answer itself, three times over.)
    const lastMaster = [...(history || [])].reverse().find((m) => m.role === 'master');
    const term2 = lastMaster ? findTermInLastAnswer(reading, lastMaster.content, lang, personality) : null;
    if (term2) return explainTerm(reading, term2, lang, lastTopic);
    const t2 = lastTopic === 'general' ? 'general' : lastTopic;
    const core = topicCore(reading, t2, lang);
    const p2 = topicPick(reading, t2);
    return zh ? core + ' 换句话说：' + sent(p2[0][1]) : core + ' In plain words: ' + sent(p2[0][1]);
  }

  // (b) Example — a concrete everyday example tied to their reading.
  // Rotates through 3 distinct scenarios per topic; a scenario already
  // used in this session is skipped, so a second "Give me an example"
  // never repeats the first.
  if (isExample) {
    const t2 = topic === 'general' ? lastTopic : topic;
    const prevMaster = (history || []).filter((m) => m.role === 'master').map((m) => m.content);
    const scenarios = exampleScenarios(reading, t2, lang, personality);
    for (const s of scenarios) { if (!isDupAnswer(s, prevMaster)) return s; }
    return scenarios[scenarios.length - 1];
  }

  // (c) Deeper — a second, different layer on the same topic: pairs 2-3
  // of the topic's sections, never the pairs Live Reader used (0-1).
  if (isDeeper) {
    const t2 = topic === 'general' ? lastTopic : topic;
    const p2 = topicPick(reading, t2);
    const s2 = p2[2], s3 = p2[3];
    return zh
      ? '再往深一层。' + sysName(s2[0]) + '：' + sent(s2[1]) + ' ' + sysName(s3[0]) + '补充：' + sent(s3[1]) + sampleNote(s2[0]) + sampleNote(s3[0]) + (timing ? '\n\n' + timing : '') + '\n\n一小步：' + smallStep(t2)
      : 'Here is the next layer. ' + sysName(s2[0]) + ': ' + sent(s2[1]) + ' ' + sysName(s3[0]) + ' adds: ' + sent(s3[1]) + sampleNote(s2[0]) + sampleNote(s3[0]) + (timing ? '\n\n' + timing : '') + '\n\nOne small step: ' + smallStep(t2);
  }

  // (d) Specific area as a follow-up. If this topic was already covered
  // in the conversation (e.g. Live Reader just answered about work),
  // use the next layer (pairs 2-3) and say so; otherwise answer like
  // Live Reader (pairs 0-1) with a conversational lead-in.
  if (topic !== 'general') {
    const already = lastTopic === topic;
    const p2 = already ? [pick[2], pick[3]] : [pick[0], pick[1]];
    const lead = already
      ? (zh ? '你刚才问了' + topicWord(topic, 'zh') + '——这是同一份报告里的下一层。' : 'You asked about ' + topicWord(topic, 'en') + ' earlier — here is the next layer from that same reading.')
      : (zh ? '你的报告对' + topicWord(topic, 'zh') + '是这样说的：' : "Here's what your reading says about " + topicWord(topic, 'en') + ':');
    // Name the question back to the buyer, and ground a time-horizon
    // question in timing content as well as the topic section.
    const asked = zh ? `你问的是“${msg.trim()}”。` : `You asked about "${msg.trim()}".`;
    return lead + ' ' + asked + ' ' + sysName(p2[0][0]) + (zh ? '：' : ': ') + sent(p2[0][1]) + ' ' + sysName(p2[1][0]) + (zh ? '也这么说：' : ' says the same: ') + sent(p2[1][1]) + sampleNote(p2[0][0]) + sampleNote(p2[1][0]) + (timing ? '\n\n' + timing : '') + (zh ? '\n\n一小步：' : '\n\nOne small step: ') + smallStep(topic);
  }

  // Default: one-line portrait + an invitation to dig in.
  const essence = stripTerm(firstSentence(L(reading.portrait.essenceLine)));
  return zh
    ? '你的报告一句话：' + essence + '。' + (timing ? ' ' + timing + ' ' : '') + '你可以问我某个词是什么意思——比如“我的生命灵数是什么意思？”——或者要一个例子，比如“举个例子。”'
    : 'Your reading in one line: ' + essence + '. ' + (timing ? timing + ' ' : '') + "Ask me what a word means — for example, 'What does my Life Path mean?' — or ask for an example, like 'Give me an example.'";
}

/* Final de-duplication guard (7 Nov 2026): if the composed answer still
   duplicates a previous Master answer in this session — same normalised
   text, contained in one, or the same first 100 characters — fall back to
   a different, unused section (another system's section for the topic, or
   the portrait) and compose from that instead. The guard keeps the
   5-follow-up limit and the Extended flag untouched; it only changes
   WHICH unused material an answer is built from. */
function dedupFallback(reading, message, lang, history, personality, prevMaster) {
  const zh = lang === 'zh';
  const lastUser = [...(history || [])].reverse().find((m) => m.role === 'user');
  const lastTopic = lastUser ? classifyTopic(lastUser.content) : 'general';
  const topic = classifyTopic(message);
  const t2 = topic === 'general' ? lastTopic : topic;
  const L = (o) => (o && typeof o === 'object' ? (zh ? o.zh || o.en : o.en || o.zh) : o);
  const sent = (sec) => (zh ? plainZH(firstSentence(L(sec))) : plainEN(firstSentence(L(sec))));
  const sysName = (name) => (zh ? { Bazi: '八字', Horoscope: '星座', Tarot: '塔罗', Numerology: '数字命理', 'Yi-Jing': '易经', 'Zi Wei': '紫微' }[name] || name : name);
  const sample = () => '';
  const candidates = [];
  for (const [sys, sec] of topicPick(reading, t2)) {
    candidates.push(zh
      ? `换一个角度，${sysName(sys)}说：${sent(sec)}${sample(sys)}\n\n一小步：${topicAction(t2, lang)}`
      : `Here is another angle, from ${sysName(sys)}: ${sent(sec)}${sample(sys)}\n\nOne small step: ${topicAction(t2, lang)}`);
  }
  for (const other of ['career', 'love', 'money', 'health', 'timing', 'general']) {
    if (other === t2) continue;
    for (const [sys, sec] of topicPick(reading, other)) {
      candidates.push(zh
        ? `换一个角度，${sysName(sys)}说：${sent(sec)}${sample(sys)}\n\n一小步：${topicAction(other, lang)}`
        : `Here is another angle, from ${sysName(sys)}: ${sent(sec)}${sample(sys)}\n\nOne small step: ${topicAction(other, lang)}`);
    }
  }
  candidates.push(zh
    ? '你的完整肖像一句话：' + stripTerm(firstSentence(L(reading.portrait.essenceLine))) + '。' + firstSentence(L(reading.portrait.developmentFocus[0]))
    : 'Your portrait in one line: ' + firstSentence(L(reading.portrait.essenceLine)) + ' ' + firstSentence(L(reading.portrait.developmentFocus[0])));
  if (hasTimeHorizon(message) || (lastUser && hasTimeHorizon(lastUser.content))) candidates.push(timingLine(reading, lang));
  for (const c of candidates) { if (c && !isDupAnswer(c, prevMaster)) return c; }
  return null;
}
function masterChatAnswer(reading, message, lang, history, personality) {
  const prevMaster = (history || []).filter((m) => m.role === 'master').map((m) => m.content);
  const ans = masterChatAnswerRaw(reading, message, lang, history, personality);
  if (!isDupAnswer(ans, prevMaster)) return ans;
  return dedupFallback(reading, message, lang, history, personality, prevMaster) || ans;
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
app.post('/api/owner/login', ownerLoginLimiter, async (req, res) => {
  const ok = await checkOwnerPassword(req.body?.password);
  if (!ok) return res.status(401).json({ error: 'Invalid owner password.' });
  const { token, expiresAt } = issueOwnerToken();
  return res.json({ ownerToken: token, expiresAt });
});
function createTrialCode() {
  // An unambiguous uppercase alphabet keeps codes easy to read aloud.
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(12);
  let code = '';
  for (const b of bytes) code += alphabet[b % alphabet.length];
  return code;
}
function ownerTrialAccess(req, res) {
  if (!verifyOwnerToken(req.headers['x-owner-token'])) {
    res.status(401).json({ error: 'Owner sign-in is required.' });
    return false;
  }
  return true;
}
// Values of active codes are never listed. The plaintext appears only in
// the one-time creation response and is not stored in the database.
app.get('/api/owner/trial-codes', (req, res) => {
  if (!ownerTrialAccess(req, res)) return;
  const codes = db.prepare(`SELECT c.id,c.label,c.max_redemptions,c.access_days,c.expires_at,c.disabled,c.created_at,
      COUNT(r.id) AS redemptions, SUM(CASE WHEN r.converted_at IS NOT NULL THEN 1 ELSE 0 END) AS conversions
    FROM trial_codes c LEFT JOIN trial_code_redemptions r ON r.code_id=c.id
    GROUP BY c.id ORDER BY c.id DESC LIMIT 100`).all();
  const legacyRedemptions = db.prepare('SELECT COUNT(*) AS n FROM promo_redemptions').get().n;
  return res.json({
    codes,
    legacy: { redemptionLimit: config.promoAccessMaxRedemptions, redemptionsUsed: legacyRedemptions },
  });
});
app.post('/api/owner/trial-codes', (req, res) => {
  if (!ownerTrialAccess(req, res)) return;
  const body = req.body || {};
  const accessDays = Number(body.accessDays || 7);
  const label = String(body.label || '').trim().slice(0, 80);
  if (![7, 14].includes(accessDays)) return res.status(400).json({ error: 'Trial access must last 7 or 14 days.' });
  const mode = body.mode === 'shared' ? 'shared' : 'batch';
  const batchSize = Number(body.batchSize || 1);
  const maxUses = Number(body.maxUses || 1);
  if (mode === 'batch' && (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 100)) {
    return res.status(400).json({ error: 'Create between 1 and 100 single-use codes per batch.' });
  }
  if (mode === 'shared' && (!Number.isInteger(maxUses) || maxUses < 1 || maxUses > 100)) {
    return res.status(400).json({ error: 'A campaign code can have 1 to 100 uses.' });
  }
  const count = mode === 'batch' ? batchSize : 1;
  const uses = mode === 'batch' ? 1 : maxUses;
  const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();
  const created = [];
  db.exec('BEGIN IMMEDIATE');
  try {
    const add = db.prepare('INSERT INTO trial_codes(code_hash,label,max_redemptions,access_days,expires_at) VALUES(?,?,?,?,?)');
    for (let i = 0; i < count; i++) {
      const code = createTrialCode();
      const result = add.run(hashToken(code), label, uses, accessDays, expiresAt);
      created.push({ code, label, uses, accessDays, expiresAt, id: Number(result.lastInsertRowid) });
    }
    db.exec('COMMIT');
  } catch (e) {
    try { db.exec('ROLLBACK'); } catch {}
    console.error('Trial code creation failed:', e.message);
    return res.status(500).json({ error: 'Could not create trial codes.' });
  }
  return res.status(201).json({ created });
});
// Send a plain delivery check to the two owner-approved addresses stored
// temporarily in Railway variables. Owner token required, one batch per
// source IP per hour. No reading or profile data is included.
app.get('/api/owner/test-email', (req, res) => {
  if (!canRunEmailTest(req)) return res.status(401).json({ error: 'Owner or temporary email-test key required.' });
  res.set('Cache-Control', 'no-store');
  return res.json({ recipients: config.emailTestRecipients });
});
app.post('/api/owner/test-email', ownerEmailTestLimiter, async (req, res) => {
  if (!canRunEmailTest(req)) return res.status(401).json({ error: 'Owner or temporary email-test key required.' });
  res.set('Cache-Control', 'no-store');
  const recipients = config.emailTestRecipients;
  if (recipients.length !== 2 || recipients.some((email) => !isValidEmail(email))) {
    return res.status(503).json({ error: 'The two temporary test addresses are not configured.' });
  }
  const subject = 'FateWeave email delivery check';
  const html = '<p>This is a plain email delivery check for FateWeave.</p><p>No reading or birth details are included.</p>';
  const results = [];
  for (const email of recipients) {
    try {
      const result = await sendEmail(email, subject, html);
      results.push({ email, accepted: true, provider: result.provider });
    } catch (e) {
      results.push({ email, accepted: false, code: e.code || 'email_error' });
    }
  }
  console.log('Owner email delivery check:', results.map(({ email, accepted, provider, code }) => ({ email, accepted, provider, code })));
  const accepted = results.every((result) => result.accepted);
  return res.status(accepted ? 200 : 502).json({ accepted, results });
});
app.post('/api/owner/issue-access', (req, res) => {
  if (!verifyOwnerToken(req.headers['x-owner-token'])) return res.status(401).json({ error: 'Owner token required.' });
  const { email, birthDate, birthTime, ziweiGender, name } = req.body || {};
  if (!isValidEmail(email) || !birthDate) return res.status(400).json({ error: 'Valid email and birthDate are required.' });
  const chartError = validateZiweiInputs({ birthTime, ziweiGender });
  if (chartError) return res.status(400).json({ error: chartError });
  try { parseBirth(birthDate, birthTime); } catch (e) { return res.status(400).json({ error: e.message }); }
  const order = db.prepare("INSERT INTO orders (email, birth_date, birth_time, ziwei_gender, name, amount_cents, currency, price_label, provider, status, paid_at) VALUES (?, ?, ?, ?, ?, 0, 'usd', 'owner-manual', 'manual', 'paid', datetime('now'))")
    .run(email.toLowerCase(), birthDate, birthTime, ziweiGender, name || null);
  const { token, expiresAt } = issueAccessToken(email.toLowerCase(), birthDate, order.lastInsertRowid);
  return res.json({ token, expiresAt, email, birthDate });
});
app.get('/api/owner/report', (req, res) => {
  if (!verifyOwnerToken(req.headers['x-owner-token'])) return res.status(401).json({ error: 'Owner token required.' });
  const { email, birthDate, birthTime, ziweiGender } = req.query;
  if (!email || !birthDate || !birthTime || !ziweiGender) return res.status(400).json({ error: 'email, birthDate, birthTime and ziweiGender are required.' });
  const chartError = validateZiweiInputs({ birthTime, ziweiGender });
  if (chartError) return res.status(400).json({ error: chartError });
  const reading = buildFullReading({ birthDate, birthTime, ziweiGender, name: null });
  return res.json({ ...reading, ownerPreview: true });
});
// --- Owner: AI Master usage (Gemini cost + caps) ---------------------------
// Today + last 7 days: AI calls, tokens, estimated cost, fallback count,
// and the top buyers by AI calls. Costs are estimates from the Gemini
// 2.5 Flash paid-tier prices in config.ai — the real bill is Google's.
// No message text is ever stored or returned here.
app.get('/api/owner/ai-usage', (req, res) => {
  if (!verifyOwnerToken(req.headers['x-owner-token'])) return res.status(401).json({ error: 'Owner token required.' });
  const summary = aiUsageSummary(7);
  return res.json({
    aiMasterLive: aiMasterLive(),
    provider: config.ai.provider,
    model: config.ai.model,
    prices: { inputPerMillionUsd: config.ai.inputPricePerMillionUsd, outputPerMillionUsd: config.ai.outputPricePerMillionUsd },
    caps: { extendedChatTotalMax: config.ai.extendedChatTotalMax, globalDailyMax: config.ai.globalDailyMax },
    ...summary,
  });
});

// --- Unsubscribe --------------------------------------------------------------
app.get('/api/unsubscribe', (req, res) => {
  if (req.query.email) {
    db.prepare('UPDATE email_subscribers SET unsubscribed = 1 WHERE email = ?').run(String(req.query.email).toLowerCase());
  }
  res.send('<p>You have been unsubscribed from FateWeave daily encouragement. You can resubscribe by unlocking a new reading.</p>');
});

// --- Dedicated page per system (7 Nov 2026) --------------------------------
// Each system gets its own route — /bazi, /ziwei, /horoscope, /yijing,
// /tarot, /numerology, /portrait — plus /master for Live Reader + Ask the
// Master. The route serves the same index.html shell with the system and
// its theme class on <body>; public/app.js then renders ONLY that system
// (hero + its own interactions) and hides the rest. No reading text is in
// the shell: heroes and content still come from /api/hook (teaser) and
// /api/report (valid paid token), so the paywall is unchanged.
const SYSTEM_PAGES = {
  bazi: 'theme-bazi', ziwei: 'theme-ziwei', horoscope: 'theme-horoscope',
  yijing: 'theme-yijing', tarot: 'theme-tarot', numerology: 'theme-numerology',
  portrait: 'theme-portrait', master: 'theme-master',
};
const INDEX_HTML = require('fs').readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
app.get('/live-reader', (_req, res) => res.redirect(302, '/master'));
app.get(Object.keys(SYSTEM_PAGES).map((k) => '/' + k), (req, res) => {
  const key = req.path.slice(1);
  res.type('html').send(INDEX_HTML.replace('<body>', `<body data-system="${key}" class="${SYSTEM_PAGES[key]}">`));
});

// --- Static frontend ----------------------------------------------------------
app.get('/owner/email-test', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.sendFile(path.join(__dirname, '..', 'public', 'owner-email-test.html'));
});
app.get('/owner/trial-codes', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.sendFile(path.join(__dirname, '..', 'public', 'owner-promo-codes.html'));
});
// Unknown API paths must return a JSON 404 instead of falling through to the
// single-page app shell (which makes clients fail while parsing the response).
app.use('/api', (_req, res) => res.status(404).json({ error: 'API route not found.' }));
app.use(express.static(path.join(__dirname, '..', 'public')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'index.html')));

// --- Daily job is separate (src/jobs/daily.js) — see README for the cron. ----
if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`FateWeave server listening on ${config.baseUrl} (port ${config.port})`);
    console.log(`Price in force: ${JSON.stringify(currentPrice())}`);
    if (!config.stripeSecretKey) console.log('WARNING: STRIPE_SECRET_KEY is not set — checkout will return 503 until it is configured.');
    console.log(`AI Master: ${aiMasterLive() ? `live (Gemini ${config.ai.model})` : 'rule-based only — set GEMINI_API_KEY to light up the AI Master (see src/ai-master.js).'}`);
    const emailProvider = config.smtp.host ? 'SMTP' : config.resendApiKey ? 'Resend' : 'none';
    console.log(`Email provider selected: ${emailProvider}${config.smtp.host ? ` (${config.smtp.host}:${config.smtp.port})` : ''}`);
    if (config.smtp.host && (!config.smtp.user || !config.smtp.pass)) console.log('WARNING: SMTP host selected but SMTP_USER or SMTP_PASS is missing.');
    if (emailProvider === 'none') console.log('WARNING: No email provider configured — emails are unavailable in production.');
    if (!config.ownerPasswordHash) console.log('WARNING: OWNER_PASSWORD_HASH is not set — owner login is disabled.');
    if (emailProvider === 'Resend' && config.resendFrom === 'onboarding@resend.dev') console.log('WARNING: Resend sandbox sender selected; delivery is restricted to the Resend account owner.');
  });
}
module.exports = { app, liveReaderAnswer, masterChatAnswer };
