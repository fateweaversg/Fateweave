# FateWeave — Deploy Checklist (what Jason must provide)

The supplied 8 November handover reports an existing Railway deployment,
GitHub repository, persistent SQLite volume, and working Stripe TEST payments.
The checkboxes below are a verification checklist, not a record that setup
has never happened. This local continuation has not been deployed.

Remaining launch blockers reported in the handover: owner password reset,
working email beyond the Resend sandbox, owner-only Stripe live verification
and one real $1 test, and the owner's website approval before social posting.
Paid Gemini billing and domain purchases require the owner's decision.

## 1. Code & hosting account
- [ ] Push `server-build/` to a GitHub repo (private is fine).
- [ ] Create a Railway account (recommended) **or** a Render account.
- [ ] Deploy from GitHub (see README.md, Option A or B).
- [ ] Add a persistent volume / disk at `/app/data` so the SQLite file survives redeploys.

## 2. Stripe (primary payment — required for launch)
- [ ] Stripe account at https://dashboard.stripe.com (Singapore).
- [ ] Copy **test** keys first: `STRIPE_SECRET_KEY` (`sk_test_…`), `STRIPE_PUBLISHABLE_KEY` (`pk_test_…`).
- [ ] In Stripe Dashboard → Developers → Webhooks, add endpoint
      `https://<your-domain>/api/webhook/stripe`, event `checkout.session.completed`.
- [ ] Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET` (`whsec_…`).
- [ ] Test end-to-end with a Stripe test card (4242 4242 4242 4242): hook → pay $1 → success page → full report opens → report email arrives → Live Reader 3-question limit.
- [ ] Only then switch the three keys to **live** keys (`sk_live_…` / `pk_live_…` / live `whsec_…`).
- [ ] Never paste a Stripe secret key in chat or in a file that is shared.

## 3. Email (required for the report + daily encouragement)
- [ ] Pick one: **Resend** (https://resend.com, simplest) **or** an SMTP provider.
- [ ] Resend: create an API key → `RESEND_API_KEY`; verify your sending domain;
      set `RESEND_FROM_EMAIL` to an address on that domain.
- [ ] SMTP: fill `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM_EMAIL`.
- [ ] If neither is set, emails only print to the server log — do **not** launch like that.

## 4. Owner access
- [ ] Choose a strong owner password (10+ characters, not reused elsewhere).
- [ ] Run `npm run hash-owner-password "your-password"` locally and put the
      printed hash in `.env` as `OWNER_PASSWORD_HASH`. Never store the password itself in the repo.
- [ ] Owner login is via `POST /api/owner/login` — there is no public owner link on the site.

## 5. Domain (optional, recommended)
- [ ] Buy / point a domain (e.g. `fateweave.sg`) to the Railway / Render service.
- [ ] Set `BASE_URL` to `https://<your-domain>`.
- [ ] Re-create the Stripe webhook with the final domain if it changes.

## 6. HitPay (optional — only if you want PayNow as well as cards)
- [ ] HitPay account, API key + salt → `HITPAY_API_KEY`, `HITPAY_SALT`, `HITPAY_WEBHOOK_SECRET`.
- [ ] **Before enabling:** implement the HitPay webhook signature check in
      `src/server.js` (`POST /api/webhook/hitpay` is currently a stub that
      refuses to mark orders paid). Do not enable HitPay auto-unlock without it.
- [ ] Stripe alone is enough to launch — HitPay can wait.

## 7. Pre-launch test (do this before posting anything)
- [ ] `npm test` passes locally.
- [ ] As a visitor (private browser): free hook shows teaser only, no full details leak.
- [ ] Pay $1 in Stripe **test** mode → full report opens, report email arrives, Live Reader works for 3 questions and blocks the 4th.
- [ ] Same token + wrong birth date → 403. No token → 403.
- [ ] Promo price shows $1 until 24 Nov 2026, then $8 (check `GET /api/config`).
- [ ] Daily job: run `node src/jobs/daily.js` once and confirm one email per subscriber, no duplicates on a second run.
- [ ] Owner login works; no owner link is visible on the public page.

## 8. Posting (only after 7 passes)
- [ ] Update the launch drafts (`launch-drafts-2026-11-07.md`) to the new public
      domain and the pay-first hook wording — do not reuse the old pick-1-system /
      "would you pay S$18?" captions.
- [ ] Post Xiaohongshu / Threads / Reels / TikTok / Carousell $1 listing from
      the updated drafts. Nothing has been posted yet.
