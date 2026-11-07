'use strict';
// Execute the real checkout-return script with isolated browser and API stubs.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '../public/success.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

async function run(data, { ok = true, stored = {}, search = '?session_id=cs_test' } = {}) {
  const link = {}, button = {};
  const elements = Object.fromEntries(['status', 'heading', 'actions'].map(id => [id, {
    textContent: '', classList: { remove() {} },
    querySelector: selector => selector === 'a' ? link : button,
  }]));
  const timers = [];
  const context = {
    URLSearchParams, encodeURIComponent,
    location: { search, href: '' },
    document: { getElementById: id => elements[id] },
    localStorage: { setItem: (k, v) => { stored[k] = v; }, getItem: k => stored[k] },
    fetch: async () => ({ ok, json: async () => data }),
    setTimeout: fn => timers.push(fn),
  };
  await vm.runInNewContext(script, context);
  return { elements, stored, timers, link, context };
}

(async () => {
  const paid = await run({ token: 'paid-token', email: 'buyer@example.com', birthDate: '1990-05-14' });
  assert.equal(paid.stored.fateweave_token, 'paid-token');
  assert.equal(paid.stored.fateweave_tokenBirthDate, '1990-05-14');
  assert.match(paid.elements.status.textContent, /Download my report/);
  assert.doesNotMatch(paid.elements.status.textContent, /was emailed|email was sent/i);
  paid.timers[0]();
  assert.equal(paid.context.location.href, '/');
  const fresh = await run({ paid: true });
  assert.doesNotMatch(fresh.elements.status.textContent, /check your email/i);
  const existing = await run({ paid: true }, { stored: { fateweave_token: 'existing' } });
  assert.match(existing.elements.status.textContent, /already unlocked/);
  const upgrade = await run({ upgrade: true });
  assert.equal(upgrade.link.href, '/master?upgraded=1&session_id=cs_test');
  upgrade.timers[0]();
  assert.equal(upgrade.context.location.href, upgrade.link.href);
  const failed = await run({ error: 'Payment not completed yet.' }, { ok: false });
  assert.match(failed.elements.status.textContent, /Payment not completed/);
  assert.equal(failed.stored.fateweave_token, undefined);
  const missing = await run({}, { search: '' });
  assert.match(missing.elements.status.textContent, /No checkout session/);
  console.log('Checkout return: 6 scenarios passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
