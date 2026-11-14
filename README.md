# FateWeave — production service

Live site: https://fateweave-production.up.railway.app
Node >=22.5, Express and persistent SQLite. Keep the database on the Railway volume.

Stripe is configured in LIVE mode. Never use test-card instructions against this deployment.

## Current Master flow

The $2.99 launch unlock (7–24 Nov 2026) provides the complete reading across
all 8 systems and includes 3 main Master questions plus 5 follow-up chats.
After 24 Nov, the listed full price is $8.00. One optional follow-up add-on
purchase is available: 5 chats for $1.99 or 10 chats for $3.49. Prices are
configured server-side; do not change them without Jason's direction.

Each main question opens its own conversation topic; Next question closes it
and starts a new topic. Follow-up usage is shared across the three topics for
the same reading. Main questions remain available when follow-ups are exhausted.
Failed requests consume nothing.

Existing conversations and usage migrate once. Older paid follow-up packs keep
their originally purchased allowance; new buyers can make one add-on purchase.
Payment callbacks are idempotent.

## Run and check

Install with npm ci, configure the names from .env.example privately, then:

```
npm test
npm start
```

npm test runs master-flow-check.js (current API, topic isolation, allowance,
checkout fixture and migration), dom-check.js, and success-check.js.
smoke-test.js and gemini-check.js retain the previous two-box API tests as
historical reference; their old endpoint expectations are superseded.

## Chat API

- GET /api/master-chat: paid conversation, grouped topics and allowances.
- POST /api/master-chat: paid {kind: main|probe, message, topicId, requestId, lang};
  main answers consume a main slot, probes consume the shared follow-up balance.
- POST /api/master-chat/next: paid {topicId}; closes current topic.
- POST /api/checkout-upgrade: paid; one optional add-on, $1.99 for 5 or $3.49 for 10 follow-ups.
- GET /api/checkout-session/:id: verified paid-session exchange and pack grant.
- POST /api/webhook/stripe: signed Stripe payment notification, idempotent grant.
- POST /api/redeem-promo: accepts only a valid invite-only trial code; the former shared environment code is not accepted.
- GET/POST /api/owner/trial-codes: owner-authenticated trial code list and creation; code values are stored as hashes and shown once.
- Guest Live Reader endpoints are removed. The legacy paid `/api/live-reader` endpoint returns 410; use `/api/master-chat`.

The report, glimpse, personality, owner and unsubscribe endpoints remain.
No API keys are exposed in the browser. The model provider is server-configured;
its name is omitted from customer-facing copy.

## Deployment and launch status

Use the existing GitHub repository and Railway service. Preserve `/app/data`
and existing environment variables during deployment. Stripe is LIVE; do not
replace its keys with sandbox credentials. Report email delivery may depend on
the configured sender; buyers can download their report from the site.

Bazi is simplified; Zi Wei is illustrative, not fully computed. Readings are
for reflection and entertainment, not guaranteed forecasts or professional advice.
Railway recovery (2026-11-08): Railway App access is restricted to this repository, and production auto-deploy is enabled for main. If no push-triggered deployment appears, use Railway’s Deploy latest commit action; do not Redeploy an older deployment.
