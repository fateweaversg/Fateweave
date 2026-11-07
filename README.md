# FateWeave — server build

Existing deployment: https://fateweave-production.up.railway.app
Node >=22.5, Express and persistent SQLite. Keep the database on the Railway volume.

## Current Master flow

One input serves three main questions. Every main question and follow-up uses
the model-backed Master. Each main has its own topic history; Next question
closes it and opens a fresh topic. Replies explain reading terms in plain words.

Five follow-ups are included. Each $3 pack adds 15; at most two packs per user
email: 5 -> 20 -> 35 total. Usage is shared across that email's profiles. Main
questions remain bound to the paid email + birth profile. Main questions are
available even when follow-ups are exhausted. Failed requests consume nothing.

Existing conversations and usage migrate once. Existing paid upgrades count
as the first pack under the new 20/35 rule. Payment callbacks are idempotent.

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
- POST /api/checkout-upgrade: paid; $3 for 15 probes, two purchases maximum.
- GET /api/checkout-session/:id: verified paid-session exchange and pack grant.
- POST /api/webhook/stripe: signed Stripe payment notification, idempotent grant.
- /api/live-reader: retired (410); refresh old clients to use the single input.

The report, glimpse, personality, owner and unsubscribe endpoints remain.
No API keys are exposed in the browser. The model provider is server-configured;
its name is omitted from customer-facing copy.

## Deployment and launch status

Use the existing GitHub repository. Railway may require Deploy latest commit
rather than Redeploy. Preserve /app/data and existing environment variables.
Stripe remains in TEST mode until owner verification and a real $1 test.
Resend's shared sandbox sender only delivers to the account owner; the report
can be downloaded. Daily email needs a working sender and a separate schedule.
No social posting until the owner approves the website. Purchases and billing
changes need the owner's approval.

Bazi is simplified; Zi Wei is illustrative, not fully computed. Readings are
for reflection and entertainment, not guaranteed forecasts or professional advice.
