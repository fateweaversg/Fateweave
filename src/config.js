'use strict';
/**
 * FateWeave server config — all secrets come from env, never from the client.
 * No secret is ever sent to the frontend.
 */
require('dotenv').config();

function intEnv(name, fallback) {
  const v = parseInt(process.env[name] || '', 10);
  return Number.isFinite(v) ? v : fallback;
}

const config = {
  port: intEnv('PORT', 3000),
  baseUrl: (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, ''),
  nodeEnv: process.env.NODE_ENV || 'development',
  // Free Render staging only; do not set PREVIEW_MODE in production.
  previewMode: process.env.PREVIEW_MODE === '1' && process.env.RENDER === 'true',
  databasePath: process.env.DATABASE_PATH || './data/fateweave.db',
  promoPriceCents: intEnv('PROMO_PRICE_CENTS', 299),
  fullPriceCents: intEnv('FULL_PRICE_CENTS', 800),
  // Optional private free-access code. Keep it in Railway variables only.
  promoAccessCode: process.env.PROMO_ACCESS_CODE || '',
  promoAccessMaxRedemptions: intEnv('PROMO_ACCESS_MAX_REDEMPTIONS', 10),
  currency: 'usd',
  promoStart: process.env.PROMO_START || '2026-11-07',
  promoEnd: process.env.PROMO_END || '2026-11-24',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  resendApiKey: process.env.RESEND_API_KEY || '',
  // Sandbox sender (7 Nov 2026): Resend's onboarding@resend.dev only
  // delivers to the Resend account owner's own email address — any other
  // recipient is rejected with 403 "You can only send testing emails to
  // your own email address". Until a verified domain is set here, report
  // emails to other addresses will fail; the in-app Download report
  // fallback (public/app.js) covers those buyers. Do NOT buy a domain
  // or change this sender without the owner's say-so.
  resendFrom: process.env.RESEND_FROM_EMAIL || 'noreply@fateweave.example',
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: intEnv('SMTP_PORT', 587),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM_EMAIL || 'noreply@fateweave.example',
  },
  // Temporary owner-only delivery check recipients. Remove this Railway
  // variable after the one-off test; recipient addresses never live in git.
  emailTestRecipients: (process.env.EMAIL_TEST_RECIPIENTS || '').split(',').map((x) => x.trim().toLowerCase()).filter(Boolean),
  // Temporary single-purpose credential for the email delivery check only.
  // Remove it from Railway immediately after the test.
  emailTestToken: process.env.EMAIL_TEST_TOKEN || '',
  hitpay: {
    apiKey: process.env.HITPAY_API_KEY || '',
    salt: process.env.HITPAY_SALT || '',
    webhookSecret: process.env.HITPAY_WEBHOOK_SECRET || '',
  },
  ownerPasswordHash: process.env.OWNER_PASSWORD_HASH || '',
  ownerEmail: process.env.OWNER_EMAIL || 'owner@example.com',
  accessTokenDays: intEnv('ACCESS_TOKEN_DAYS', 90),
  liveReaderMaxPerSession: 3,
  masterChatMaxPerSession: 5, // Ask the Master follow-ups per paid session (separate from Live Reader's 3)
  // One optional Master follow-up purchase. A buyer chooses one pack only.
  masterProbe5PriceCents: intEnv('MASTER_CHAT_5_PACK_PRICE_CENTS', 199),
  masterProbe10PriceCents: intEnv('MASTER_CHAT_10_PACK_PRICE_CENTS', 349),

  // --- AI Master (Gemini) — 7 Nov 2026 -------------------------------------
  // The Master chat is AI-powered when GEMINI_API_KEY is set; without it
  // the site keeps its rule-based answers (existing behaviour, no dead
  // chat). The key lives ONLY in the environment (Railway variables) —
  // never in code, never in the frontend, never in git. Provider and
  // model are one env var each, so the model can be swapped later
  // (e.g. to a Flash-Lite or a newer Flash) without a code change.
  ai: {
    provider: (process.env.AI_PROVIDER || 'gemini').toLowerCase(),
    // Default model gemini-3.5-flash (NOT gemini-2.5-flash — see note
    // below). AI_MODEL env var still overrides it.
    model: process.env.AI_MODEL || 'gemini-3.5-flash',
    fallbackModels: (process.env.AI_FALLBACK_MODELS ?? 'gemini-3.5-flash-lite').split(',').map(x => x.trim()).filter(Boolean),
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    // Per-message limit (also enforced in src/ai-master.js).
    maxQuestionChars: 500,
    // Per-exchange budget: ~2,000 input tokens (system prompt + compact
    // reading summary + last 6 messages + question), max 700 output.
    // Gemini 3 includes private reasoning tokens in this ceiling.
    maxOutputTokens: intEnv('AI_MAX_OUTPUT_TOKENS', 700),
    temperature: 0.7,
    historyMessages: 6,
    // Hard per-attempt deadline for the Gemini call (8 Nov 2026 fix 4):
    // a single attempt may never hang longer than this — the deadline
    // covers the fetch AND the response-body read (res.json/res.text),
    // not just time-to-first-byte. The old 20 s AbortController only
    // guarded the fetch itself: once headers arrived, a stalled body
    // could hang res.json() forever, and a fetch that ignores the
    // abort signal could hang the whole Master POST with no log line
    // at all (live 8 Nov 00:37–00:40 SGT: two POSTs hung 10 min / 90 s
    // with zero server log lines). Worst case per question is now
    // 2 attempts x this deadline + ~1 s retry + up to 10 s 429 backoff.
    geminiTimeoutMs: intEnv('AI_GEMINI_TIMEOUT_MS', 25000),
    // Gemini 3.5 Flash PAID tier, verified Nov 2026 (multiple sources):
    // $1.50 / 1M input tokens, $9.00 / 1M output tokens. One reply costs
    // 2,000 x $1.50/1M + 350 x $9.00/1M = $0.003 + $0.00315
    // ≈ $0.0062 (about 0.6 US cents).
    //   $2.99 launch unlock includes 5 follow-ups; a 10-answer add-on
    //   costs roughly $0.09 in AI at these estimates, before Stripe fees.
    //   Optional add-ons are $1.99 for 5 or $3.49 for 10 follow-ups.
    //   A normal user is far below these caps.
    // NOTE (7 Nov 2026): the original brief quoted ~$0.0012/reply,
    // $0.036 for 30 chats and break-evens of 830 / 2,500 — that
    // arithmetic was wrong (it under-counted the output leg). The
    // correct figures above come from aiCostUsd.
    // NOTE (7 Nov 2026, live failure): gemini-2.5-flash and
    // gemini-2.5-flash-lite return HTTP 404 on generateContent for
    // this key — verified by direct API test, even though ListModels
    // lists them. The live server started on the old 2.5-flash
    // default (AI_MODEL was never set in Railway, only the key was),
    // the first AI call failed "Gemini error (404)", the 1-hour
    // cooldown kept every later Master question rule-based, and the
    // owner saw only rule-based replies. Do NOT revert this default
    // to gemini-2.5-flash. Verified working on this key:
    // gemini-3.5-flash (default), gemini-3.5-flash-lite ($0.30/$2.50
    // per 1M — the cheap fallback, one env var away) and
    // gemini-3.8-flash ($0.75/$3.75 intro until 31 Dec 2026).
    inputPricePerMillionUsd: 1.50,
    outputPricePerMillionUsd: 9.00,
    // Extended Master Chat total (7 Nov 2026 20:04 SGT — replaces the
    // old 20/day fair-use cap): max Master chats per upgrade purchase,
    // counted by masterChatCount in src/server.js: only AI-sourced
    // replies consume the allowance. Rule-based fallback replies while
    // the AI is unavailable do not consume a chat.
    // The included 5 follow-ups from the base unlock are part of that
    // 30 — after upgrading, the buyer has 30 Master chats in total
    // for the 90-day unlock window, counting any of the 5 already
    // used. Past 30, further Master questions get the rule-based
    // reply + a short "used up" note.
    // The UI counter reads "Master chats left: n / 30".
    extendedChatTotalMax: intEnv('AI_EXTENDED_CHAT_TOTAL_MAX', 30),
    // Global daily cap across ALL buyers — the launch-day safety valve
    // while on Gemini's FREE tier, whose daily request limit varies by
    // account and Google has tightened it (do NOT hard-code a free-tier
    // number; treat the free quota as unknown). When this cap is hit,
    // Master falls back to rule-based replies for the rest of the day.
    // Raise it (or set it very high) when moving to paid Gemini, where
    // the binding constraint is money, not requests: at ~$0.006/reply,
    // 1,000 AI calls/day costs ~$6.
    globalDailyMax: intEnv('AI_GLOBAL_DAILY_MAX', 100),
  },
};

/** Price in force right now, decided server-side by date (SGT). */
function currentPrice(now = new Date()) {
  // Compare YYYY-MM-DD in Asia/Singapore.
  const sgt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Singapore', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now); // YYYY-MM-DD
  const inPromo = sgt >= config.promoStart && sgt <= config.promoEnd;
  return {
    amountCents: inPromo ? config.promoPriceCents : config.fullPriceCents,
    currency: config.currency,
    isPromo: inPromo,
    promoStart: config.promoStart,
    promoEnd: config.promoEnd,
    label: inPromo ? 'promo' : 'full',
  };
}

module.exports = { config, currentPrice, aiCostUsd };

/** Estimated AI cost (USD) for one Master exchange, from the Gemini
 * paid-tier prices in config.ai. Used for the usage ledger
 * and the owner usage view; the real bill is whatever Google charges. */
function aiCostUsd(inputTokens, outputTokens) {
  const inCost = (inputTokens || 0) * config.ai.inputPricePerMillionUsd / 1e6;
  const outCost = (outputTokens || 0) * config.ai.outputPricePerMillionUsd / 1e6;
  return inCost + outCost;
}
