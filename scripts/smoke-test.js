'use strict';
/**
 * Smoke test — runs without any real Stripe / email keys.
 * Starts the server on a test port with an isolated DB, then checks:
 *  1. /api/config returns the promo price in force
 *  2. /api/hook returns TEASER ONLY (no full guidance / synthesis / tarot interpretation)
 *  3. /api/checkout returns 503 without Stripe keys (honest, not a fake success)
 *  4. /api/webhook/stripe rejects without a valid signature
 *  5. /api/report returns 403 without a valid token, and 403 for a wrong birth date
 *  6. /api/live-reader returns 403 without a valid token
 *  7. A manually issued token (owner flow, DB-level) unlocks the full report,
 *     Live Reader answers, and the 4th question in the same session is rejected (429)
 *  8. Owner login rejects a wrong password
 *
 * Run: npm test   (or: node scripts/smoke-test.js)
 * Exit 0 = all checks passed.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fateweave-smoke-'));
process.env.DATABASE_PATH = path.join(tmpDir, 'test.db');
process.env.PORT = '3456';
process.env.BASE_URL = 'http://localhost:3456';
process.env.NODE_ENV = 'test';
process.env.OWNER_PASSWORD_HASH = '$2b$12$aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'; // dummy, will not match

const { app } = require('../src/server');
const { issueAccessToken } = require('../src/auth');
const { db } = require('../src/db');

const BASE = 'http://localhost:3456';
let passed = 0, failed = 0;
function check(name, ok, detail) {
  if (ok) { passed++; console.log(`  PASS ${name}`); }
  else { failed++; console.log(`  FAIL ${name} ${detail || ''}`); }
}

async function main() {
  const server = app.listen(3456);
  await new Promise((r) => server.once('listening', r));
  try {
    // 1. config
    let res = await fetch(`${BASE}/api/config`);
    let data = await res.json();
    check('config returns price', res.ok && typeof data.price.amountCents === 'number', JSON.stringify(data));

    // 2. hook = teaser only
    res = await fetch(`${BASE}/api/hook`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ birthDate: '1990-05-14', birthTime: '08:30', name: 'Test' }) });
    data = await res.json();
    const hookText = JSON.stringify(data);
    check('hook returns teaser', res.ok && data.teaser === true && data.bazi?.dayMaster, hookText.slice(0, 200));
    check('hook leaks NO full guidance', !hookText.includes('guidance') && !hookText.includes('synthesis') && !hookText.includes('Complete Portrait'), 'full fields present in hook response');
    check('hook leaks NO tarot interpretation', !hookText.includes('Past —') && !data.tarot?.guidance, 'tarot guidance in hook');

    // 3. checkout without Stripe keys
    res = await fetch(`${BASE}/api/checkout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'buyer@example.com', birthDate: '1990-05-14' }) });
    check('checkout 503 without Stripe keys', res.status === 503, `got ${res.status}`);

    // 4. webhook rejects bad signature / unconfigured
    res = await fetch(`${BASE}/api/webhook/stripe`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    check('stripe webhook rejects when unconfigured', res.status === 503 || res.status === 400, `got ${res.status}`);

    // 5. report without token
    res = await fetch(`${BASE}/api/report?email=a@b.com&birthDate=1990-05-14`);
    check('report 403 without token', res.status === 403, `got ${res.status}`);

    // 6. live-reader without token
    res = await fetch(`${BASE}/api/live-reader`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: 'nope', email: 'a@b.com', birthDate: '1990-05-14', sessionId: 's1', question: 'hello?' }) });
    check('live-reader 403 without token', res.status === 403, `got ${res.status}`);

    // 7. Issue a real token (as the server would after verified payment) and test the paid flow
    const order = db.prepare("INSERT INTO orders (email, birth_date, name, amount_cents, currency, price_label, provider, status, paid_at) VALUES (?, ?, ?, 100, 'usd', 'promo', 'stripe', 'paid', datetime('now'))").run('buyer@example.com', '1990-05-14', 'Test');
    const { token } = issueAccessToken('buyer@example.com', '1990-05-14', order.lastInsertRowid);

    res = await fetch(`${BASE}/api/report?token=${token}&email=buyer@example.com&birthDate=1990-05-14`);
    data = await res.json();
    check('report 200 with valid token', res.ok && data.bazi?.guidance && data.synthesis, `got ${res.status}`);

    res = await fetch(`${BASE}/api/report?token=${token}&email=buyer@example.com&birthDate=1991-01-01`);
    check('report 403 for wrong birth date', res.status === 403, `got ${res.status}`);

    const sessionId = 'smoke-session-1';
    for (let i = 1; i <= 3; i++) {
      res = await fetch(`${BASE}/api/live-reader`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, email: 'buyer@example.com', birthDate: '1990-05-14', sessionId, question: `Question ${i} about my Bazi?`, lang: 'en' }) });
      data = await res.json();
      check(`live-reader question ${i} ok`, res.ok && data.questionsUsed === i && data.answer?.length > 100, `got ${res.status} ${JSON.stringify(data).slice(0, 120)}`);
    }
    res = await fetch(`${BASE}/api/live-reader`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, email: 'buyer@example.com', birthDate: '1990-05-14', sessionId, question: 'Question 4?', lang: 'en' }) });
    check('live-reader 4th question rejected (429)', res.status === 429, `got ${res.status}`);

    // 8. owner login rejects wrong password
    res = await fetch(`${BASE}/api/owner/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: 'wrong-password' }) });
    check('owner login rejects wrong password', res.status === 401, `got ${res.status}`);

    // 9. Personality questions are public but leak NO scoring mapping
    res = await fetch(`${BASE}/api/personality/questions`);
    data = await res.json();
    const qText = JSON.stringify(data);
    check('personality questions: 27 enneagram + 24 mbti', res.ok && data.enneagram?.length === 27 && data.mbti?.length === 24, `got ${data.enneagram?.length}/${data.mbti?.length}`);
    check('personality questions leak NO scoring letters/types', !qText.includes('"t":') && !qText.includes('"l":'), 'scoring field present in questions');

    // 10. Personality scoring pre-payment: locked summary only (type + 1 line)
    const enneaChoices = Array.from({ length: 27 }, (_, i) => i % 3);
    const mbtiChoices = Array.from({ length: 24 }, (_, i) => (i % 2 === 0 ? 'a' : 'b'));
    res = await fetch(`${BASE}/api/personality`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enneagramAnswers: enneaChoices, mbtiAnswers: mbtiChoices }) });
    data = await res.json();
    const lockedText = JSON.stringify(data);
    check('personality pre-payment returns locked summary', res.ok && data.unlocked === false && data.enneagram?.type && data.enneagram?.teaser && data.mbti?.type && data.mbti?.teaser, JSON.stringify(data).slice(0, 200));
    check('personality locked summary leaks NO full breakdown', !lockedText.includes('interpretation') && !lockedText.includes('"scores"') && !lockedText.includes('strengths'), 'full breakdown fields in locked response');

    // 11. Personality scoring WITH token: full breakdown, saved, appears in report
    res = await fetch(`${BASE}/api/personality`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, email: 'buyer@example.com', birthDate: '1990-05-14', enneagramAnswers: enneaChoices, mbtiAnswers: mbtiChoices }) });
    data = await res.json();
    check('personality paid returns full breakdown', res.ok && data.unlocked === true && data.enneagram?.interpretation?.core && data.enneagram?.scores?.length === 9 && data.mbti?.interpretation?.en, JSON.stringify(data).slice(0, 200));
    res = await fetch(`${BASE}/api/report?token=${token}&email=buyer@example.com&birthDate=1990-05-14`);
    data = await res.json();
    check('report includes saved personality lens', res.ok && data.personality?.enneagram?.type && data.personality?.mbti?.type && data.portrait?.essenceLine?.en?.includes('Enneagram'), `got ${res.status}`);

    // 12. Resend report: 403 without token, 200 with token (log fallback in test)
    res = await fetch(`${BASE}/api/resend-report`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: 'nope', email: 'buyer@example.com', birthDate: '1990-05-14' }) });
    check('resend-report 403 without token', res.status === 403, `got ${res.status}`);
    res = await fetch(`${BASE}/api/resend-report`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, email: 'buyer@example.com', birthDate: '1990-05-14' }) });
    data = await res.json();
    check('resend-report 200 with token', res.ok && data.resent === true, `got ${res.status} ${JSON.stringify(data).slice(0, 120)}`);

    // 13. Hook still teaser-only, now with 1–2 line hooks per system
    res = await fetch(`${BASE}/api/hook`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ birthDate: '1990-05-14', birthTime: '08:30', name: 'Test' }) });
    data = await res.json();
    check('hook has per-system hook lines + tarot names', res.ok && data.bazi?.hook?.en && data.ziwei?.hook?.en && data.tarot?.cards?.length === 3 && data.yijing?.hook?.en, JSON.stringify(data).slice(0, 200));
    check('hook still leaks NO full content', !JSON.stringify(data).includes('guidance') && !JSON.stringify(data).includes('synthesis') && !data.tarot?.cardsDetailed, 'full fields in hook');

    // 14. Regression (7 Nov 2026): Numerology Relationships must never end in
    // a literal "undefined" — LP_PORTRAIT rows only carry gEn/gZh, and an
    // earlier build read .en/.zh off them. The same class of bug also hit
    // the Personal Year text (PY_TXT only has 1–9, but digitalRoot could
    // return a master number). Sweep twelve years of dates plus dates that
    // produce the master Life Paths 11, 22 and 33, with and without a name
    // (Destiny number), and assert no literal "undefined" anywhere in a
    // full reading.
    const { buildFullReading } = require('../src/readings');
    const badDates = [];
    const seenLp = new Set();
    const sweep = (from, to, name) => {
      for (let d = new Date(from); d <= to; d.setUTCDate(d.getUTCDate() + 1)) {
        const bd = d.toISOString().slice(0, 10);
        const r = buildFullReading({ birthDate: bd, birthTime: null, name: name || null });
        seenLp.add(r.numerology.lifePath);
        if (JSON.stringify(r).includes('undefined') || !r.numerology.sections.relationships.en || /:\s*$/.test(r.numerology.sections.relationships.en)) badDates.push(bd + (name ? ` (${name})` : ''));
      }
    };
    sweep(new Date('1980-01-01T00:00:00Z'), new Date('1991-12-31T00:00:00Z'));
    sweep(new Date('1990-01-01T00:00:00Z'), new Date('1990-03-31T00:00:00Z'), 'Test User');
    for (const bd of ['1989-09-29', '1991-01-01', '1991-11-29']) { // LP 11, 22, 33
      const r = buildFullReading({ birthDate: bd, birthTime: null, name: null });
      seenLp.add(r.numerology.lifePath);
      if (JSON.stringify(r).includes('undefined')) badDates.push(bd);
    }
    check('numerology: no "undefined" in any full reading (all life paths)', badDates.length === 0, badDates.slice(0, 5).join(', '));
    check('numerology sweep covered life paths 1-9 + masters', [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33].every((n) => seenLp.has(n)), `seen: ${[...seenLp].sort((a, b) => a - b).join(',')}`);

    console.log(`\nSmoke test: ${passed} passed, ${failed} failed.`);
    process.exitCode = failed ? 1 : 0;
  } finally {
    server.close();
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
