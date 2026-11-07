# FateWeave — Deploy in 7 Steps (Railway + GitHub + Stripe)

This folder is a clean, GitHub-ready copy of the FateWeave pay-first server build
(Node + Express + SQLite). No `node_modules`, no database file, no `.env`, no secrets.
Full detail is in `README.md` and `DEPLOY-CHECKLIST.md` — this page is the short path.

## What you need first
- A GitHub account (free) and a Railway account (free trial: 30 days / $5 credit)
- Stripe test keys (Dashboard → Developers → API keys, Sandbox mode)
- A Resend API key (resend.com, free tier) for the report + daily emails
- A strong owner password you choose yourself (10+ characters)

## Step 1 — Put this code on GitHub
Create a new repo on GitHub named `fateweave` (Private is fine).
Upload this whole folder, either:
- **Web upload:** GitHub → repo → Add file → Upload files → drag this folder's contents in, or
- **Git push:**
  ```bash
  cd fateweave-server-build-deploy
  git init && git add . && git commit -m "FateWeave pay-first server build"
  git branch -M main
  git remote add origin https://github.com/YOUR-USERNAME/fateweave.git
  git push -u origin main
  ```
Do NOT upload `node_modules`, a `.env` file, or any `.db` file — they are already
excluded by `.gitignore`. If GitHub warns about a large file, you uploaded `node_modules` by mistake; delete it and try again.

## Step 2 — Deploy from GitHub in Railway
1. Railway → your project (e.g. `scintillating-empathy`) → New → **GitHub Repository**.
2. Pick the `fateweave` repo. Railway detects Node.js and deploys it (Dockerfile included).
3. Wait for the build to succeed. Railway gives you a public URL like
   `https://fateweave-production-xxxx.up.railway.app` — copy it. This is your live site.
   (The random project name, e.g. `scintillating-empathy`, does not affect the URL.
   Rename the project to `FateWeave` in Settings if you like.)

## Step 3 — Add env vars in Railway
Railway → service → Variables. Add each one from `.env.example` (values from your own accounts — never paste them in chat):
- `STRIPE_SECRET_KEY` — test key `sk_test_...`
- `STRIPE_PUBLISHABLE_KEY` — test key `pk_test_...`
- `STRIPE_WEBHOOK_SECRET` — leave blank for now, add in Step 5
- `RESEND_API_KEY` — from resend.com
- `RESEND_FROM_EMAIL` — an address on your verified Resend domain
- `OWNER_PASSWORD_HASH` — generate it first, locally:
  ```bash
  npm install
  npm run hash-owner-password "your-strong-password"
  ```
  Paste the printed `$2b$...` hash, NOT the password itself.
- `BASE_URL` — your Railway URL from Step 2 (update it if you later add a custom domain)
- `NODE_ENV=production`
- `DATABASE_PATH=./data/fateweave.db`

## Step 4 — Add a Railway Volume for the database
Railway → service → Settings → Volumes → Add Volume:
- **Mount path:** `/app/data`
Without this, the SQLite file (paid orders, access tokens) is wiped on every redeploy.
Redeploy after adding the volume.

## Step 5 — Add the Stripe webhook
1. Stripe Dashboard (still in Sandbox) → Developers → Webhooks → Add endpoint:
   `https://<your-railway-url>/api/webhook/stripe`
   Event: `checkout.session.completed`
2. Copy the webhook signing secret (`whsec_...`) into Railway as `STRIPE_WEBHOOK_SECRET`.
3. Redeploy in Railway.

## Step 6 — Test in Stripe test mode (before going live)
Visit your Railway URL in a private browser:
1. Enter a birth date — free hook shows a teaser for each system only, no full details.
2. Pay $1 with Stripe test card **4242 4242 4242 4242**, any future expiry, any CVC.
3. Success page → full report opens. Report email arrives. Live Reader works for 3 questions and blocks the 4th.
4. Same token + wrong birth date → blocked. No token → blocked.
If any step fails, stay in test mode and fix it — do NOT switch Stripe to live yet.

## Step 7 — Go live (only after Step 6 passes)
1. In Stripe, switch to the live account and copy the **live** keys (`sk_live_...`, `pk_live_...`).
2. In Railway, replace the three Stripe vars with the live values and create a **live**
   webhook (`whsec_...` for the same URL) — test and live webhooks have different secrets.
3. Redeploy. Do one real $1 test payment yourself, then refund it in Stripe if you like.
4. Only then post the launch (Xiaohongshu / Threads / TikTok / Carousell) with the new Railway URL.

## Costs to expect
- Railway: $0 in the trial (30 days / $5 credit), then Hobby $5/month for reliable always-on.
- Domain (optional): `.com` ~$10–11/year; launch on the free Railway URL first.
- Stripe: free account; fees 3.4% + S$0.50 per card sale ($1 keeps ~$0.47, $8 keeps ~$7.23).
