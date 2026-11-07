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
  databasePath: process.env.DATABASE_PATH || './data/fateweave.db',
  promoPriceCents: intEnv('PROMO_PRICE_CENTS', 100),
  fullPriceCents: intEnv('FULL_PRICE_CENTS', 800),
  currency: 'usd',
  promoStart: process.env.PROMO_START || '2026-11-07',
  promoEnd: process.env.PROMO_END || '2026-11-24',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  resendApiKey: process.env.RESEND_API_KEY || '',
  resendFrom: process.env.RESEND_FROM_EMAIL || 'noreply@fateweave.example',
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: intEnv('SMTP_PORT', 587),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM_EMAIL || 'noreply@fateweave.example',
  },
  hitpay: {
    apiKey: process.env.HITPAY_API_KEY || '',
    salt: process.env.HITPAY_SALT || '',
    webhookSecret: process.env.HITPAY_WEBHOOK_SECRET || '',
  },
  ownerPasswordHash: process.env.OWNER_PASSWORD_HASH || '',
  ownerEmail: process.env.OWNER_EMAIL || 'owner@example.com',
  accessTokenDays: intEnv('ACCESS_TOKEN_DAYS', 90),
  liveReaderMaxPerSession: 3,
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

module.exports = { config, currentPrice };
