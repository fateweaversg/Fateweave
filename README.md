# FateWeave 天机汇 — Pay-First Server Build

Deployable Node.js + SQLite codebase for the FateWeave pay-first model.
The handover identifies the existing Railway deployment at
https://fateweave-production.up.railway.app. This folder is a local continuation
of the supplied source; local changes are not deployed automatically.

## Model (decided 7 Nov 2026 — supersedes pick-1-system + unlock code)

- **Free hook:** visitor enters a birth date and sees a teaser for *each* system
  only — Bazi Day Master, Zi Wei Life Palace, Horoscope Sun sign, Numerology
  Life Path, Tarot/Yi-Jing card/hexagram name with interpretation locked,
  Complete Portrait one essence line. No full system is free.
- **Pay first:** $1 promo 7–24 Nov 2026 inclusive (server decides by SGT date),
  then $8 full unlock. Stripe Checkout is primary; HitPay is an optional
  alternative (stubbed — see below).
- **After verified payment:** full details open on the site for that email +
  birth date, Live Reader opens (voice in/out, 3 questions per buyer,
  server-enforced), and the detailed report can be downloaded. Email is
  attempted, but the Resend sandbox rejects non-owner recipients. Daily
  encouragement requires working email and a separately configured schedule.
- **Ask the Master:** 5 AI replies included; the $3 Extended upgrade allows
  30 total during the 90-day unlock. Only AI replies consume the allowance.
  History and usage are keyed by email + birth date and survive reloads.
- **No unlock codes.** No deterministic code generator. No secrets in the
  browser. No visible owner-preview link. Access tokens are random
  (`crypto.randomBytes`), stored hashed, bound to email + birth date, 90-day expiry.

## Honest limits (kept in the UI)

- Bazi is a simplified demo engine — no true solar-time correction yet.
- Zi Wei paid content is illustrative sample content, not a fully computed chart.
- Self-reflection / entertainment only — no medical, financial or legal claims.

## Run locally

```bash
cd server-build
cp .env.example .env        # fill in keys — see DEPLOY-CHECKLIST.md
npm install
npm run hash-owner-password "a-strong-password-at-least-10-chars"
# put the printed hash in .env as OWNER_PASSWORD_HASH
npm test                    # smoke test, no real keys needed
node scripts/dom-check.js    # guided-flow DOM checks
node scripts/success-check.js # checkout-return checks
npm start                   # http://localhost:3000
```

Daily encouragement job (run separately, e.g. cron at 07:00 SGT):

```bash
node src/jobs/daily.js
```

## API

| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| GET | `/api/config` | public | Price in force (server-side date logic), Stripe publishable key |
| POST | `/api/hook` | public | Teaser only — never full details |
| POST | `/api/checkout` | public | Creates a Stripe Checkout Session; price decided server-side |
| POST | `/api/checkout-upgrade` | paid token | Extended Master Chat checkout |
| GET | `/api/checkout-session/:sessionId` | public | Exchanges a *paid* Checkout Session for a random access token; emails the report |
| POST | `/api/webhook/stripe` | Stripe signature | `STRIPE_WEBHOOK_SECRET` verified; marks order paid |
| POST | `/api/webhook/hitpay` | — | **Stub (501)** until HitPay signature verification is implemented |
| GET | `/api/report?token=&email=&birthDate=` | paid token | Full details, 403 otherwise |
| POST | `/api/resend-report` | paid token | Attempts report email; reports provider errors |
| GET | `/api/live-reader` | paid token | Buyer usage and remaining questions |
| POST | `/api/live-reader` | paid token | 3 questions per buyer, server-enforced |
| GET | `/api/master-chat` | paid token | Persistent history and AI allowance |
| POST | `/api/master-chat` | paid token | Gemini answer with rule-based fallback |
| GET | `/api/personality/questions` | public | Optional Enneagram / MBTI quizzes |
| POST | `/api/personality` | paid token | Brief Enneagram / MBTI scoring |
| POST | `/api/owner/login` | password | Server-checked bcrypt hash; returns a 24h owner token |
| POST | `/api/owner/issue-access` | owner token | Manually issue access for an email + birth date |
| GET | `/api/owner/report` | owner token | Owner preview of a full reading |
| GET | `/api/owner/ai-usage` | owner token | AI usage ledger |
| GET | `/api/unsubscribe?email=` | — | Opt out of daily encouragement |

## Project layout

```
server-build/
  package.json  Dockerfile  docker-compose.yml  .env.example
  README.md  DEPLOY-CHECKLIST.md
  src/
    server.js       Express app, all routes, rate limiting, helmet
    config.js       Env config + promo price logic (SGT dates)
    db.js           SQLite (node:sqlite) schema: orders, access_tokens,
                    live_reader_usage, owner_tokens, email_subscribers, daily_sends
    readings.js     Seeded rule-based reading engine (teaser vs full)
    i18n.js         EN / Simplified Chinese strings
    ai-master.js    Gemini provider, guardrails, daily cap and fallback
    email.js        Resend → SMTP → console log fallback (dev only)
    auth.js         Random hashed tokens, owner bcrypt check
    jobs/daily.js   07:00 SGT daily encouragement sender
  public/
    index.html  app.js  styles.css  success.html
  scripts/
    smoke-test.js        npm test — no real keys needed
    seed-owner-hash.js   npm run hash-owner-password
```

## Deploy

### Option A — Railway (recommended for SQLite)

1. Push this folder to a GitHub repo (do **not** commit `.env`).
2. Railway → New Project → Deploy from GitHub → pick the repo.
3. Add a persistent volume mounted at `/app/data` (otherwise the SQLite file
   is lost on redeploy), or set `DATABASE_PATH` to the volume path.
4. Set all variables from `.env.example` in Railway → Variables.
5. In Stripe Dashboard, add the webhook endpoint
   `https://<your-railway-domain>/api/webhook/stripe` for event
   `checkout.session.completed`, and copy the signing secret into
   `STRIPE_WEBHOOK_SECRET`.
6. Set `BASE_URL` to your Railway domain.
7. Deploy. Test with Stripe **test** keys first. The owner must complete live
   verification and one real $1 payment before any public launch offer.
8. Daily job: Railway → Cron (or a separate service) running
   `node src/jobs/daily.js` at 07:00 Asia/Singapore daily.

### Option B — Render

1. Push to GitHub. Render → New → Web Service → pick the repo.
2. Build command: `npm install`. Start command: `npm start`.
3. Add a Persistent Disk mounted at `/app/data` (SQLite needs it).
4. Set the same env vars as above; set the Stripe webhook to your Render URL.
5. Daily job: Render → New → Cron Job, schedule `0 7 * * *`
   (set the service timezone to Asia/Singapore), command `node src/jobs/daily.js`.
   A cron job needs its own copy of the env vars and access to the same disk/DB —
   on Render, prefer a single service + an external scheduler, or move to Postgres
   (see below) if the disk cannot be shared.

### Vercel note

Vercel is **not** recommended for this build as-is: its serverless functions
have no persistent filesystem, so SQLite would not survive. If you prefer
Vercel, move the DB to Postgres (e.g. Neon / Supabase) and adapt `src/db.js`
— the route and token logic stays the same. Railway / Render are the simpler
first deploy.

### Docker

```bash
docker compose up --build
# or: docker build -t fateweave . && docker run -p 3000:3000 --env-file .env fateweave
```

## Scaling note

SQLite is right for the $1 launch (low volume, single server). If daily volume
grows, move to Postgres: keep the same tables, replace `src/db.js` with a
`pg` pool, and keep the token-hash / webhook logic unchanged. Do not move the
payment check into the browser at any scale — that was the loophole that
killed the static-page code.

## What this build does NOT do

- No real payment is taken until Stripe live keys + a live webhook are configured.
- Live Reader answers are rule-based and grounded in the buyer's reading.
  Ask the Master uses Gemini when available and falls back without consuming
  the buyer's AI allowance when unavailable.
- HitPay auto-unlock is **not** wired — the webhook is a stub that refuses to
  mark orders paid until its signature check is implemented.
- Daily email requires a working sender and a scheduled job. The supplied
  handover reports that the live daily schedule is not configured.
