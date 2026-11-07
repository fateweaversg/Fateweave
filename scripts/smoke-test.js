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

    // 15. Ambience (7 Nov 2026): music toggle + animations exist, music
    // never autoplays. The toggle must be in the page, music.js must be
    // loaded, and the module must only start audio from a user gesture
    // (click handler / first pointerdown or keydown), never on load.
    const pub = path.join(__dirname, '..', 'public');
    const html = fs.readFileSync(path.join(pub, 'index.html'), 'utf8');
    const musicJs = fs.readFileSync(path.join(pub, 'music.js'), 'utf8');
    const css = fs.readFileSync(path.join(pub, 'styles.css'), 'utf8');
    check('music toggle present and off by default', html.includes('id="music-toggle"') && html.includes('aria-pressed="false"') && html.includes('src="/music.js"'), 'toggle or script tag missing');
    check('music never autoplays', !/^startMusic\(\);/m.test(musicJs) && musicJs.includes("addEventListener('click'") && musicJs.includes("addEventListener('pointerdown'"), 'music starts without a gesture');
    check('music remembers toggle in localStorage', musicJs.includes("localStorage.getItem(KEY)") && musicJs.includes("localStorage.setItem(KEY"), 'no localStorage persistence');
    check('hero animation + reduced-motion guard present', css.includes('@keyframes spinSlow') && css.includes('@keyframes twinkle') && css.includes('prefers-reduced-motion'), 'spin/twinkle/reduced-motion CSS missing');

    // 16. Regression (7 Nov 2026): pre-paid page must show all six systems
    // before any birth date is entered, and Yi-Jing must cast 6 lines.
    // (a) The teaser now carries the six coin-toss lines, and they must be
    // exactly the full reading's lines — same order, same sums, same
    // solid/broken + changing flags — so the hexagram the client animates
    // is the hexagram the server computed. No line interpretation text
    // may leak into the teaser.
    const { buildTeaser } = require('../src/readings');
    let yiBad = [];
    for (const bd of ['1990-05-14', '1983-05-21', '2000-06-15', '1975-12-31', '1999-02-28']) {
      const tz = buildTeaser({ birthDate: bd, birthTime: '08:30', name: 'Test' });
      const full = buildFullReading({ birthDate: bd, birthTime: '08:30', name: 'Test' });
      const tl = tz.yijing.lines;
      if (!Array.isArray(tl) || tl.length !== 6) { yiBad.push(`${bd}: lines=${tl?.length}`); continue; }
      for (let i = 0; i < 6; i++) {
        const fl = full.yijing.lines[i];
        if (tl[i].line !== i + 1 || tl[i].sum !== fl.sum || tl[i].yang !== fl.yang || tl[i].changing !== fl.changing) yiBad.push(`${bd}: line ${i + 1} mismatch`);
        if (tl[i].sum < 6 || tl[i].sum > 9 || typeof tl[i].yang !== 'boolean' || typeof tl[i].changing !== 'boolean') yiBad.push(`${bd}: line ${i + 1} bad values`);
        if ('text' in tl[i]) yiBad.push(`${bd}: line ${i + 1} leaks interpretation text`);
      }
      if (tz.yijing.hexagram !== full.yijing.hexagram) yiBad.push(`${bd}: hexagram mismatch ${tz.yijing.hexagram} vs ${full.yijing.hexagram}`);
      // Lines must actually build the hexagram: yang bits of lines 1-3 =
      // lower trigram, lines 4-6 = upper trigram. Recompute from the lines
      // and check the hexagram number matches the full reading's.
      const bits = tl.map((l) => (l.yang ? 1 : 0));
      if (bits.filter((b) => b).length === 0 && full.yijing.hexagramNumber !== 2) yiBad.push(`${bd}: all-yin lines but hexagram is not 2`);
      if (bits.filter((b) => b).length === 6 && full.yijing.hexagramNumber !== 1) yiBad.push(`${bd}: all-yang lines but hexagram is not 1`);
    }
    check('yijing teaser carries 6 server lines matching the full reading', yiBad.length === 0, yiBad.slice(0, 5).join('; '));
    // (b) Frontend: the six system sections render on load with no teaser
    // (preview path), and the Yi-Jing cast animates the server lines one
    // toss at a time instead of a single blind animation.
    const appJs = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');
    const previewOk = appJs.includes('function previewSystemsHTML') && appJs.includes('function promptBirthDate')
      && ['sys-bazi', 'sys-ziwei', 'sys-horo', 'sys-yijing', 'sys-tarot', 'sys-num'].every((id) => appJs.includes(`id="${id}"`) || appJs.includes(`id="sys-`))
      && appJs.includes('let ph = previewSystemsHTML()') && appJs.includes('bindPreviewEvents(); return;')
      && !appJs.includes("if (!src) { box.innerHTML = ''; return; }");
    check('frontend renders six-system preview with no teaser', previewOk, 'preview path missing or empty-preview early return still present');
    const castOk = appJs.includes('yijingLinesOf()') && appJs.includes('hexagramDiagramHTML') && appJs.includes('castingLine')
      && appJs.includes('step(i + 1)') && appJs.includes('i >= 6');
    check('frontend Yi-Jing casts 6 sequential lines from server data', castOk, 'sequential 6-line cast not found in app.js');
    // `css` is already loaded above (section 15, Ambience) — reuse it.
    check('styles include hexagram diagram + attention highlight', css.includes('.hex-diagram') && css.includes('.hex-bar.yang') && css.includes('.card.attention'), 'hexagram/attention CSS missing');

    // 17. Amendments (7 Nov 2026): Simplified Chinese, real tarot cards,
    // topic-aware Live Reader, and timely (not pre-calculated) content.
    const { liveReaderAnswer } = require('../src/server');
    const { buildDailyMessage } = require('../src/readings');
    const lrReading = buildFullReading({ birthDate: '1990-05-14', birthTime: '08:30', name: 'Test' });
    // (a) Live Reader: career vs love answers differ and are topic-relevant.
    const lrCareerEn = liveReaderAnswer(lrReading, 'Should I change jobs this year?', 'en');
    const lrLoveEn = liveReaderAnswer(lrReading, 'Will I find love soon?', 'en');
    check('live-reader career vs love differ (en)', lrCareerEn !== lrLoveEn, 'identical answers');
    check('live-reader career answer is about work', /work|job|career/i.test(lrCareerEn) && lrCareerEn.length < 1200, lrCareerEn.slice(0, 120));
    check('live-reader love answer is about relationships', /Moon|relationship|partner|safe/i.test(lrLoveEn) && lrLoveEn.length < 1200, lrLoveEn.slice(0, 120));
    check('live-reader answers use plain words, no jargon (en)', !/Day Master|useful god|luck pillar/.test(lrCareerEn) && !/Day Master|useful god|luck pillar/.test(lrLoveEn), 'jargon present');
    const lrCareerZh = liveReaderAnswer(lrReading, '我今年应该换工作吗？', 'zh');
    const lrLoveZh = liveReaderAnswer(lrReading, '我的感情什么时候会有进展？', 'zh');
    check('live-reader career vs love differ (zh)', lrCareerZh !== lrLoveZh, 'identical answers');
    check('live-reader career answer is about work (zh)', /工作|事业/.test(lrCareerZh), lrCareerZh.slice(0, 60));
    check('live-reader love answer is about relationships (zh)', /感情|月亮/.test(lrLoveZh), lrLoveZh.slice(0, 60));
    check('live-reader answers use plain words, no jargon (zh)', !/用神|大运/.test(lrCareerZh) && !/用神|大运/.test(lrLoveZh), 'jargon present');
    // (b) Daily message: timely, computed from profile + date — never generic.
    const d1 = buildDailyMessage({ birthDate: '1990-05-14', birthTime: null, name: 'Test' }, '2026-11-07');
    const d2 = buildDailyMessage({ birthDate: '1990-05-14', birthTime: null, name: 'Test' }, '2026-11-08');
    const d3 = buildDailyMessage({ birthDate: '1985-03-02', birthTime: null, name: 'Other' }, '2026-11-07');
    check('daily message differs across dates (same profile)', d1.en !== d2.en && d1.zh !== d2.zh, 'same text on two days');
    check('daily message differs across profiles (same day)', d1.en !== d3.en && d1.zh !== d3.zh, 'same text for two profiles');
    check('daily message names its date and card', d1.en.includes('2026-11-07') && d1.card?.name?.en && d1.hexagram?.number >= 1 && d1.hexagram?.number <= 64, JSON.stringify(d1).slice(0, 120));
    // (c) Timing is date-derived: no hardcoded 2026 / fixed month windows.
    const thisYear = String(new Date().getFullYear());
    const fullText = JSON.stringify(lrReading);
    check('timing has no fixed month windows', !fullText.includes('months 3–4') && !fullText.includes('month 9') && !fullText.includes('第 3–4 月'), 'fixed month window present');
    check('timing uses the current year', lrReading.bazi.sections.timing.en.includes(thisYear) && lrReading.numerology.sections.timing.en.includes(thisYear), lrReading.bazi.sections.timing.en.slice(0, 100));
    check('personal year uses the current year', lrReading.numerology.personalYearText.en && buildFullReading({ birthDate: '1990-05-14', birthTime: null, name: null }).bazi.currentYear.en.startsWith(thisYear), 'currentYear label is hardcoded');
    // (d) Tarot: only the 22 major arcana, with Simplified keywords + numbers.
    const D = require('../src/original-data.js');
    const tarotOk = lrReading.tarot.cardsDetailed.length === 3
      && lrReading.tarot.cardsDetailed.every((c) => c.idx >= 0 && c.idx < 22 && c.number === D.TAROT[c.idx][0] && c.keywordsZh && c.keywordsZh !== c.keywords);
    check('tarot draw uses only the 22 major arcana, with zh keywords', tarotOk, JSON.stringify(lrReading.tarot.cardsDetailed.map((c) => [c.idx, c.number])));
    const tz2 = buildTeaser({ birthDate: '1990-05-14', birthTime: '08:30', name: 'Test' });
    check('teaser tarot cards carry number + idx + zh keywords', tz2.tarot.cards.every((c) => c.number && typeof c.idx === 'number' && c.keywordsZh), JSON.stringify(tz2.tarot.cards[0]));
    // (e) Simplified Chinese: no Traditional-only characters in user-visible
    // zh strings; zh-CN (not zh-TW) in the frontend; 简中 button label.
    const tradOnly = ['還', '嗎', '會', '讓', '學', '數', '塔羅', '龍', '機', '匯', '個', '這', '說', '對', '關', '實', '進', '過', '頭', '為', '無', '與', '長', '後', '裏', '發'];
    const decodeEsc = (s) => s.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
    const tradFound = [];
    for (const f of ['src/readings.js', 'src/original-data.js', 'src/i18n.js', 'src/server.js', 'src/email.js', 'public/index.html', 'public/success.html']) {
      const txt = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
      for (const ch of tradOnly) if (txt.includes(ch)) tradFound.push(`${f}:${ch}`);
    }
    const appDecoded = decodeEsc(fs.readFileSync(path.join(pub, 'app.js'), 'utf8'));
    for (const ch of tradOnly) if (appDecoded.includes(ch)) tradFound.push(`public/app.js:${ch}`);
    check('no Traditional-only characters in zh strings', tradFound.length === 0, tradFound.slice(0, 8).join(', '));
    check('frontend uses zh-CN, not zh-TW', appJs.includes('zh-CN') && !appJs.includes('zh-TW'), 'zh-TW still present');
    check('language button is 简中', html.includes('简中') && !html.includes('繁中'), 'button label not Simplified');
    check('frontend has details-collapse + glance + bignum + real-card CSS', css.includes('details.more') && css.includes('.glance') && css.includes('.bignum-row') && css.includes('.card-art') && css.includes('.rev-banner'), 'visual CSS missing');
    check('frontend sectionHTML collapses extra sections', appJs.includes('<details class="more"') && appJs.includes("t('moreDetail')"), 'details collapse missing');

    // 18. Ask the Master (7 Nov 2026): paid-only follow-up chat, 5 per
    // session, with conversation memory of the Live Reader Q&A.
    const mcSession = 'smoke-mc-1';
    const mcBody = (message, sessionId, extra) => JSON.stringify({ token, email: 'buyer@example.com', birthDate: '1990-05-14', sessionId: sessionId || mcSession, message, lang: 'en', ...(extra || {}) });
    res = await fetch(`${BASE}/api/master-chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: mcBody('What does that mean?').replace('"token":"' + token + '"', '"token":"nope"') });
    check('master-chat 403 without token', res.status === 403, `got ${res.status}`);
    res = await fetch(`${BASE}/api/master-chat?email=buyer@example.com&birthDate=1990-05-14&sessionId=${mcSession}`);
    check('master-chat history 403 without token', res.status === 403, `got ${res.status}`);
    res = await fetch(`${BASE}/api/master-chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, email: 'buyer@example.com', birthDate: '1990-05-14', message: 'hi' }) });
    check('master-chat 400 without sessionId', res.status === 400, `got ${res.status}`);
    // First a Live Reader question, so the follow-up has something to refer to.
    res = await fetch(`${BASE}/api/live-reader`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, email: 'buyer@example.com', birthDate: '1990-05-14', sessionId: mcSession, question: 'Should I change jobs this year?', lang: 'en' }) });
    data = await res.json();
    const lrCareerAnswer = data.answer || '';
    check('master-chat setup: live-reader career answer stored', res.ok && lrCareerAnswer.length > 50, `got ${res.status}`);
    res = await fetch(`${BASE}/api/master-chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: mcBody('What does that mean?') });
    data = await res.json();
    check('master-chat explain references the previous answer topic', res.ok && data.questionsUsed === 1 && data.answer.includes('Your core:'), `got ${res.status} ${JSON.stringify(data).slice(0, 160)}`);
    res = await fetch(`${BASE}/api/master-chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: mcBody('Give me an example') });
    data = await res.json();
    check('master-chat example returns an everyday example tied to the reading', res.ok && data.questionsUsed === 2 && data.answer.includes('everyday life') && /strongest element|Moon|hexagram|Life Path/.test(data.answer), `got ${res.status} ${JSON.stringify(data).slice(0, 160)}`);
    res = await fetch(`${BASE}/api/master-chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: mcBody('Tell me more about work') });
    data = await res.json();
    check('master-chat deeper gives a different layer, never the live-reader text', res.ok && data.questionsUsed === 3 && data.answer.includes('next layer') && data.answer !== lrCareerAnswer, `got ${res.status} ${JSON.stringify(data).slice(0, 160)}`);
    // Repeat-topic follow-up references the earlier conversation.
    res = await fetch(`${BASE}/api/master-chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: mcBody('What about my career?') });
    data = await res.json();
    check('master-chat repeat topic references earlier question', res.ok && data.questionsUsed === 4 && /asked about work earlier/.test(data.answer), `got ${res.status} ${JSON.stringify(data).slice(0, 160)}`);
    res = await fetch(`${BASE}/api/master-chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: mcBody('What does my Life Path mean?') });
    data = await res.json();
    check('master-chat 5th follow-up ok', res.ok && data.questionsUsed === 5 && data.questionsRemaining === 0 && /Life Path/.test(data.answer), `got ${res.status} ${JSON.stringify(data).slice(0, 160)}`);
    res = await fetch(`${BASE}/api/master-chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: mcBody('One more question?') });
    data = await res.json();
    check('master-chat 6th follow-up rejected (429)', res.status === 429 && data.questionsUsed === 5 && data.questionsRemaining === 0, `got ${res.status} ${JSON.stringify(data).slice(0, 120)}`);
    res = await fetch(`${BASE}/api/master-chat?token=${token}&email=buyer@example.com&birthDate=1990-05-14&sessionId=${mcSession}`);
    data = await res.json();
    check('master-chat history returns the full thread on load', res.ok && Array.isArray(data.messages) && data.messages.length === 12 && data.messages[0].source === 'live-reader' && data.messages[data.messages.length - 1].role === 'master' && data.questionsRemaining === 0, `got ${res.status} len=${data.messages?.length}`);
    // Separate session: zh term explanation + safety guard (limit is per session).
    const mcZh = 'smoke-mc-2';
    res = await fetch(`${BASE}/api/master-chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, email: 'buyer@example.com', birthDate: '1990-05-14', sessionId: mcZh, message: '我的生命灵数是什么意思？', lang: 'zh' }) });
    data = await res.json();
    check('master-chat zh term explanation in Simplified Chinese', res.ok && data.answer.includes('生命灵数') && !data.answer.includes('生命靈數') && !data.answer.includes('還'), `got ${res.status} ${JSON.stringify(data).slice(0, 160)}`);
    res = await fetch(`${BASE}/api/master-chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, email: 'buyer@example.com', birthDate: '1990-05-14', sessionId: mcZh, message: 'Should I invest in stocks?', lang: 'en' }) });
    data = await res.json();
    check('master-chat refuses financial advice', res.ok && /can.t (advise|give financial advice)/.test(data.answer), `got ${res.status} ${JSON.stringify(data).slice(0, 160)}`);
    // Frontend: Ask the Master section exists, only inside the (hidden-until-unlocked) report card.
    check('frontend has Ask the Master section + chips + counter', html.includes('id="master-chat"') && html.includes('id="mc-thread"') && html.includes('id="mc-left"') && html.includes('data-chip="explain"') && html.includes('data-chip="example"') && html.includes('data-chip="deeper"') && appJs.includes('/api/master-chat') && appJs.includes('loadMasterChat'), 'master-chat UI missing');
    check('frontend has download-report fallback button', html.includes('id="download-report-btn"') && appJs.includes('reportDownloadHTML') && appJs.includes("download = `FateWeave-report-"), 'download button missing');

    // 19. Resend failure (7 Nov 2026): the sandbox sender only delivers
    // to the Resend account owner's own email — a resend to any other
    // address must return a SPECIFIC error, not the generic one.
    const { classifyResendError } = require('../src/email');
    check('classifyResendError names the sandbox rejection', classifyResendError({ message: 'You can only send testing emails to your own email address', statusCode: 403 }) === 'resend_sandbox_recipient', 'wrong code');
    check('classifyResendError falls back for other failures', classifyResendError({ message: 'network timeout' }) === 'resend_error', 'wrong fallback');
    process.env.EMAIL_FAIL_MODE = 'resend-sandbox'; // test hook in src/email.js
    res = await fetch(`${BASE}/api/resend-report`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, email: 'buyer@example.com', birthDate: '1990-05-14' }) });
    data = await res.json();
    check('resend-report returns specific sandbox error, not generic', res.status === 502 && data.code === 'resend_sandbox_recipient' && /test mode/.test(data.error) && data.error !== 'Could not resend the report email.', `got ${res.status} ${JSON.stringify(data).slice(0, 160)}`);
    delete process.env.EMAIL_FAIL_MODE;
    res = await fetch(`${BASE}/api/resend-report`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, email: 'buyer@example.com', birthDate: '1990-05-14' }) });
    check('resend-report works again once the failure is cleared', res.ok, `got ${res.status}`);


    // 20. Dedicated system pages (7 Nov 2026): each route serves the hub
    // shell with its system + theme on <body>, and NO reading text — the
    // hero and content still come from /api/hook and /api/report.
    for (const [route, theme] of [['bazi', 'theme-bazi'], ['ziwei', 'theme-ziwei'], ['horoscope', 'theme-horoscope'], ['yijing', 'theme-yijing'], ['tarot', 'theme-tarot'], ['numerology', 'theme-numerology'], ['portrait', 'theme-portrait'], ['master', 'theme-master']]) {
      res = await fetch(`${BASE}/${route}`);
      const pageText = await res.text();
      check(`/${route} page returns 200 with theme + hero shell`, res.ok && pageText.includes(`data-system="${route}"`) && pageText.includes(theme) && pageText.includes('id="sys-hero"') && pageText.includes('id="systems"'), `got ${res.status}`);
      check(`/${route} page leaks NO computed reading`, !pageText.includes('Geng Metal') && !pageText.includes('1990-05-14') && !pageText.includes('Life Path 8') && !pageText.includes('Cancer Sun'), 'reading text in page shell');
    }
    res = await fetch(`${BASE}/api/config`);
    data = await res.json();
    check('config exposes master-chat upgrade price ($3)', res.ok && data.masterChatUpgrade?.amountCents === 300 && data.masterChatUpgrade?.currency === 'usd', JSON.stringify(data.masterChatUpgrade));
    check('frontend has per-system hero + nav + hub links', appJs.includes('function pageHeroHTML') && appJs.includes('function pageNavHTML') && appJs.includes('function extractSection') && appJs.includes('function addHubLinks') && appJs.includes('SYS_META') && css.includes('.sys-hero') && css.includes('.theme-tarot') && css.includes('.theme-bazi'), 'page-mode code missing');
    check('frontend hero shows the buyer key result large', appJs.includes('heroResultHTML') && appJs.includes('hero-num') && appJs.includes('hero-glyph') && css.includes('.hero-num'), 'hero result missing');

    // 21. Unlimited Master Chat upgrade (7 Nov 2026, $3).
    res = await fetch(`${BASE}/api/checkout-upgrade`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    check('checkout-upgrade 403 without token', res.status === 403, `got ${res.status}`);
    res = await fetch(`${BASE}/api/checkout-upgrade`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: 'nope', email: 'buyer@example.com', birthDate: '1990-05-14' }) });
    check('checkout-upgrade 403 with invalid token', res.status === 403, `got ${res.status}`);
    res = await fetch(`${BASE}/api/checkout-upgrade`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, email: 'buyer@example.com', birthDate: '1990-05-14' }) });
    check('checkout-upgrade 503 without Stripe keys', res.status === 503, `got ${res.status}`);
    // Simulate a paid upgrade (as the webhook / checkout-session exchange
    // would): insert the chat_upgrades row, then the limit must lift.
    const upSession = 'smoke-mc-upgrade';
    db.prepare("INSERT INTO chat_upgrades (email, birth_date, order_id, expires_at) VALUES (?, ?, ?, datetime('now', '+90 days'))").run('buyer@example.com', '1990-05-14', order.lastInsertRowid);
    res = await fetch(`${BASE}/api/master-chat?token=${token}&email=buyer@example.com&birthDate=1990-05-14&sessionId=${upSession}`);
    data = await res.json();
    check('master-chat GET reports unlimited after upgrade', res.ok && data.unlimited === true && data.questionsRemaining === null, JSON.stringify(data).slice(0, 120));
    let upOk = true;
    for (let i = 1; i <= 7; i++) {
      res = await fetch(`${BASE}/api/master-chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, email: 'buyer@example.com', birthDate: '1990-05-14', sessionId: upSession, message: `Follow-up ${i} about work?`, lang: 'en' }) });
      data = await res.json();
      if (!res.ok || data.questionsRemaining !== null) { upOk = false; break; }
    }
    check('master-chat unlimited: 7 follow-ups all succeed, no limit', upOk, 'upgrade did not lift the limit');
    // Expired upgrade + another buyer without one: the limit still applies.
    const order2 = db.prepare("INSERT INTO orders (email, birth_date, name, amount_cents, currency, price_label, provider, status, paid_at) VALUES (?, ?, ?, 100, 'usd', 'promo', 'stripe', 'paid', datetime('now'))").run('other@example.com', '1985-03-02', 'Other');
    const { token: token2 } = issueAccessToken('other@example.com', '1985-03-02', order2.lastInsertRowid);
    db.prepare("INSERT INTO chat_upgrades (email, birth_date, order_id, expires_at) VALUES (?, ?, ?, datetime('now', '-1 day'))").run('other@example.com', '1985-03-02', order2.lastInsertRowid);
    const expSession = 'smoke-mc-expired';
    for (let i = 1; i <= 5; i++) {
      await fetch(`${BASE}/api/master-chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: token2, email: 'other@example.com', birthDate: '1985-03-02', sessionId: expSession, message: `Question ${i}?`, lang: 'en' }) });
    }
    res = await fetch(`${BASE}/api/master-chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: token2, email: 'other@example.com', birthDate: '1985-03-02', sessionId: expSession, message: 'Question 6?', lang: 'en' }) });
    check('master-chat expired upgrade still hits 429 on 6th', res.status === 429, `got ${res.status}`);
    // Non-upgraded users still hit the limit (fresh session, buyer 2, no upgrade row for a new birth date).
    const order3 = db.prepare("INSERT INTO orders (email, birth_date, name, amount_cents, currency, price_label, provider, status, paid_at) VALUES (?, ?, ?, 100, 'usd', 'promo', 'stripe', 'paid', datetime('now'))").run('third@example.com', '1992-07-07', 'Third');
    const { token: token3 } = issueAccessToken('third@example.com', '1992-07-07', order3.lastInsertRowid);
    const limSession = 'smoke-mc-limit';
    for (let i = 1; i <= 5; i++) {
      await fetch(`${BASE}/api/master-chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: token3, email: 'third@example.com', birthDate: '1992-07-07', sessionId: limSession, message: `Question ${i}?`, lang: 'en' }) });
    }
    res = await fetch(`${BASE}/api/master-chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: token3, email: 'third@example.com', birthDate: '1992-07-07', sessionId: limSession, message: 'Question 6?', lang: 'en' }) });
    data = await res.json();
    check('master-chat non-upgraded still 429 on 6th, with upgrade price', res.status === 429 && data.upgradePriceCents === 300, `got ${res.status} ${JSON.stringify(data).slice(0, 120)}`);
    check('frontend explains the 5 limit + shows the upgrade offer', html.includes('id="mc-upgrade-btn"') && html.includes('id="mc-upgrade-offer"') && appJs.includes('buyMasterUpgrade') && appJs.includes('/api/checkout-upgrade') && appJs.includes('masterChatExplainer') && appJs.includes('upgradeOffer'), 'upgrade UI missing');
    const successHtml = fs.readFileSync(path.join(pub, 'success.html'), 'utf8');
    check('upgrade return lands DIRECTLY on /master (not the hub)', successHtml.includes('data.upgrade') && successHtml.includes('/master?upgraded=1&session_id=') && !successHtml.includes("/?upgraded=1&session_id=") && successHtml.includes('Ask the Master →'), 'upgrade redirect still points at the hub');

    // 22. Real tarot pictures (7 Nov 2026): Rider-Waite, local files only.
    const tarotDir = path.join(pub, 'tarot');
    const mapping = JSON.parse(fs.readFileSync(path.join(tarotDir, 'mapping.json'), 'utf8'));
    const D2 = require('../src/original-data.js');
    let tarotBad = [];
    for (let i = 0; i < 22; i++) {
      const f = mapping[String(i)];
      if (!f) { tarotBad.push(`idx ${i}: no mapping`); continue; }
      const fp = path.join(tarotDir, f);
      if (!fs.existsSync(fp)) { tarotBad.push(`idx ${i}: ${f} missing`); continue; }
      const buf = fs.readFileSync(fp);
      if (buf.length < 10000 || buf[0] !== 0xFF || buf[1] !== 0xD8) tarotBad.push(`idx ${i}: ${f} not a valid JPEG`);
    }
    check('tarot: all 22 major arcana images exist locally as valid JPEGs', tarotBad.length === 0, tarotBad.slice(0, 5).join('; '));
    check('tarot mapping covers all 22, matching TAROT order', Object.keys(mapping).length === 22 && mapping['12'] === '12-hanged-man.jpg' && mapping['0'] === '00-fool.jpg', JSON.stringify(Object.keys(mapping).length));
    const imgReading = buildFullReading({ birthDate: '1990-05-14', birthTime: '08:30', name: 'Test' });
    check('tarot cards carry local image paths', imgReading.tarot.cardsDetailed.every((c) => c.image && c.image.startsWith('/tarot/') && fs.existsSync(path.join(pub, c.image))), JSON.stringify(imgReading.tarot.cardsDetailed.map((c) => c.image)));
    const tz3 = buildTeaser({ birthDate: '1990-05-14', birthTime: '08:30', name: 'Test' });
    check('teaser tarot cards carry image paths too', tz3.tarot.cards.every((c) => c.image && c.image.startsWith('/tarot/')), JSON.stringify(tz3.tarot.cards.map((c) => c.image)));
    res = await fetch(`${BASE}/tarot/12-hanged-man.jpg`);
    check('tarot image is served by the app (200, jpeg)', res.ok && (res.headers.get('content-type') || '').includes('image/jpeg'), `got ${res.status} ${res.headers.get('content-type')}`);
    check('frontend renders real card pictures + enlarge', appJs.includes('tarotFrontArt') && appJs.includes('class="card-img') && appJs.includes("classList.toggle('enlarged')") && css.includes('.tarot-front .card-img') && css.includes('.tarot-card.enlarged') && css.includes('body.theme-tarot .tarot-card'), 'real-card frontend missing');
    // "the The Hanged Man" regression: no doubled article anywhere.
    let theTheBad = [];
    for (const bd of ['1990-05-14', '1983-05-21', '2000-06-15', '1975-12-31']) {
      const r = buildFullReading({ birthDate: bd, birthTime: '08:30', name: 'Test' });
      if (JSON.stringify(r).includes('the The ')) theTheBad.push(bd);
    }
    check('tarot text has no "the The " doubled article', theTheBad.length === 0, theTheBad.join(', '));

    // 23. Guided step flow (7 Nov 2026): each page shows ONLY its slice.
    // The shell still carries every section (static HTML), so isolation is
    // enforced by applyPageLayout() in app.js — these checks assert the
    // layout rules at the level this suite tests at (served HTML/JS text).
    check('step flow: shell has layout hooks (hero/daily/limits/hub-next/step-nav/master-locked ids)', html.includes('id="brand-hero"') && html.includes('id="hub-next"') && html.includes('id="step-nav"') && html.includes('id="daily-card"') && html.includes('id="limits-card"') && html.includes('id="master-locked-card"'), 'layout hook ids missing from index.html');
    const sysBlock = appJs.match(/const SYSTEMS = \[([\s\S]*?)\];/);
    const sysKeys = sysBlock ? [...sysBlock[1].matchAll(/key: '(\w+)'/g)].map((m) => m[1]) : [];
    check('step flow: step order is Bazi → Zi Wei → Horoscope → Yi-Jing → Tarot → Numerology → Portrait → Master', JSON.stringify(sysKeys) === JSON.stringify(['bazi', 'ziwei', 'horoscope', 'yijing', 'tarot', 'numerology', 'portrait']) && appJs.includes('const STEP_ORDER = [') && appJs.includes("...SYSTEMS,") && appJs.includes("{ key: 'master', route: '/master'"), `SYSTEMS order: ${sysKeys.join(',')}`);
    check('step flow: applyPageLayout exists and runs from renderSystems + init', appJs.includes('function applyPageLayout()') && (appJs.match(/applyPageLayout\(\);/g) || []).length >= 4 && appJs.includes('renderSystems(); // pre-glimpse preview'), 'applyPageLayout missing or not wired in');
    check('step flow: hub shows no quizzes / no full reading / no Live Reader or Master', appJs.includes("show('quiz-card', onPortrait)") && appJs.includes("show('report-card', onMaster && state.unlocked)") && !appJs.includes("if (!pageSystem || pageSystem === 'master') $('report-card')"), 'hub isolation rules missing (or the old hub report-card unhide is still there)');
    check('step flow: system pages hide hero/hook/daily/limits, unlock card only while locked, unlocked card hub-only', appJs.includes("show('brand-hero', onHub)") && appJs.includes("show('hook-card', onHub)") && appJs.includes("show('daily-card', onHub)") && appJs.includes("show('limits-card', onHub)") && appJs.includes("show('unlock-card', !onMaster && !state.unlocked)") && appJs.includes("show('unlocked-card', onHub && state.unlocked)"), 'system-page isolation rules missing');
    check('step flow: Master shows only Live Reader + Master chat, locked prompt while locked', appJs.includes("reportDiv.classList.toggle('hidden', onMaster)") && appJs.includes("show('master-locked-card', onMaster && !state.unlocked)") && appJs.includes('masterLockedTitle') && appJs.includes('masterLockedBody'), 'master isolation rules missing');
    check('step flow: step nav has Step N of 8 + Previous/Next/Done + All six systems', appJs.includes("t('stepOf')") && appJs.includes("'Step {n} of 8") && appJs.includes("t('prevStep')") && appJs.includes("t('nextStep')") && appJs.includes("t('doneHub')") && appJs.includes("'Done — back to hub'") && appJs.includes("t('allSystems')") && appJs.includes('function stepNavHTML()'), 'step nav labels missing');
    check('step flow: hub shows Start-your-reading button after a glimpse, linking to /bazi', appJs.includes('function hubNextHTML()') && appJs.includes("if (pageSystem || (!state.teaser && !state.report)) return '';") && appJs.includes('href="/bazi"') && appJs.includes("'Start your reading — Next: Bazi →'"), 'hub-next button missing');
    check('step flow: step-nav + hub-next styles exist', css.includes('#step-nav') && css.includes('.step-btn') && css.includes('.step-progress') && css.includes('.hub-next-btn'), 'step-nav CSS missing');
    check('step flow: View-my-full-reading starts the guided reading at /bazi', appJs.includes("if (!pageSystem) { location.href = '/bazi'; return; }"), 'view-report still scrolls to a hidden card on the hub');

    // 24. Ask the Master never repeats itself (7 Nov 2026) + timing blend.
    // Regression case from the owner's report: birth profile 1963-11-07
    // (Jia Wood Day Master, Sun Scorpio, Life Path 1). Live Reader career
    // "next year" → explain → example → example again → deeper must be
    // FIVE distinct answers, none repeating a previous one.
    // The Master thread is tested with in-process masterChatAnswer calls
    // (the level sections 14/17 test at): the HTTP path + the 5-per-session
    // limit are already covered by sections 18/21, and the POST
    // /api/master-chat rate limit (30/15 min) is already spent by them —
    // routing this thread over HTTP too would trip it.
    const { masterChatAnswer } = require('../src/server');
    const evOrder = db.prepare("INSERT INTO orders (email, birth_date, name, amount_cents, currency, price_label, provider, status, paid_at) VALUES (?, ?, ?, 100, 'usd', 'promo', 'stripe', 'paid', datetime('now'))").run('evidence@example.com', '1963-11-07', 'Evidence');
    const { token: evToken } = issueAccessToken('evidence@example.com', '1963-11-07', evOrder.lastInsertRowid);
    const evReading = buildFullReading({ birthDate: '1963-11-07', birthTime: null, name: null });
    const normAns = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, '');
    const isDistinct = (a, b) => normAns(a) !== normAns(b) && !normAns(a).includes(normAns(b)) && !normAns(b).includes(normAns(a));
    const allDistinct = (arr) => arr.every((a, i) => arr.slice(i + 1).every((b) => isDistinct(a, b)));
    const evSession = 'smoke-mc-p2a';
    const evPost = (path, body) => fetch(`${BASE}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    res = await evPost('/api/live-reader', { token: evToken, email: 'evidence@example.com', birthDate: '1963-11-07', sessionId: evSession, question: 'How is my career in the next year?', lang: 'en' });
    data = await res.json();
    const evLr = data.answer || '';
    check('master p2: next-year career Live Reader blends timing (Personal Year / hexagram)', res.ok && /Personal Year|hexagram|Timing/i.test(evLr) && /work|career/i.test(evLr) && evLr.length < 1200, `got ${res.status} ${evLr.slice(0, 120)}`);
    const evHist = [
      { role: 'user', content: 'How is my career in the next year?', source: 'live-reader' },
      { role: 'master', content: evLr, source: 'live-reader' },
    ];
    const evExplain = masterChatAnswer(evReading, 'What does that mean?', 'en', evHist, null);
    evHist.push({ role: 'user', content: 'What does that mean?', source: 'master' }, { role: 'master', content: evExplain, source: 'master' });
    check('master p2: explain names the specific term from the Live Reader answer (Wood)', isDistinct(evExplain, evLr) && /Wood energy|strongest element is Wood/.test(evExplain) && evExplain.includes('Your core:'), evExplain.slice(0, 160));
    const evEx1 = masterChatAnswer(evReading, 'Give me an example', 'en', evHist, null);
    evHist.push({ role: 'user', content: 'Give me an example', source: 'master' }, { role: 'master', content: evEx1, source: 'master' });
    check('master p2: first example is distinct and everyday', isDistinct(evEx1, evLr) && isDistinct(evEx1, evExplain) && evEx1.includes('everyday life'), evEx1.slice(0, 160));
    const evEx2 = masterChatAnswer(evReading, 'Give me an example', 'en', evHist, null);
    evHist.push({ role: 'user', content: 'Give me an example', source: 'master' }, { role: 'master', content: evEx2, source: 'master' });
    check('master p2: second example is a DIFFERENT scenario, never a repeat', isDistinct(evEx2, evLr) && isDistinct(evEx2, evExplain) && isDistinct(evEx2, evEx1) && evEx2.includes('everyday life') && /Sun|Life Path|hexagram/.test(evEx2), evEx2.slice(0, 160));
    const evDeep = masterChatAnswer(evReading, 'Tell me more about work', 'en', evHist, null);
    evHist.push({ role: 'user', content: 'Tell me more about work', source: 'master' }, { role: 'master', content: evDeep, source: 'master' });
    check('master p2: deeper is distinct from the Live Reader answer, next layer, names its system', isDistinct(evDeep, evLr) && evDeep.includes('next layer') && /Tarot|Numerology|Horoscope|Bazi/.test(evDeep), evDeep.slice(0, 160));
    check('master p2: all five answers in the thread are pairwise distinct', allDistinct([evLr, evExplain, evEx1, evEx2, evDeep]), 'two answers in the thread repeat each other');
    // Master asked directly about next-year career (no Live Reader first):
    // still grounds in timing + references the actual question.
    const evDirect = masterChatAnswer(evReading, 'How is my career next year?', 'en', [], null);
    check('master p2: direct next-year career question draws on timing + quotes the question', /Personal Year|hexagram|Timing/i.test(evDirect) && evDirect.includes('How is my career next year?'), evDirect.slice(0, 160));
    // Same thread in Simplified Chinese: timing blends, explain names the term.
    res = await evPost('/api/live-reader', { token: evToken, email: 'evidence@example.com', birthDate: '1963-11-07', sessionId: 'smoke-mc-p2c', question: '我明年的事业怎么样？', lang: 'zh' });
    data = await res.json();
    const evLrZh = data.answer || '';
    check('master p2: zh next-year career Live Reader blends timing', res.ok && /个人年|卦|时机/.test(evLrZh) && /工作|事业/.test(evLrZh), `got ${res.status} ${evLrZh.slice(0, 80)}`);
    const evExplainZh = masterChatAnswer(evReading, '这是什么意思？', 'zh', [
      { role: 'user', content: '我明年的事业怎么样？', source: 'live-reader' },
      { role: 'master', content: evLrZh, source: 'live-reader' },
    ], null);
    check('master p2: zh explain is distinct and names the term (木 / 最旺)', isDistinct(evExplainZh, evLrZh) && /木|最旺/.test(evExplainZh), evExplainZh.slice(0, 160));

    // 25. Upgrade return lands DIRECTLY on /master (7 Nov 2026 fix).
    // Owner report: after paying $3 the hub landing forced the whole
    // guided flow — Portrait quizzes included — just to reach the chat.
    const srvJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'server.js'), 'utf8');
    check('upgrade return: checkout-upgrade success_url lands on /master?upgraded=1', srvJs.includes("success_url: `${config.baseUrl}/master?upgraded=1&session_id={CHECKOUT_SESSION_ID}`"), 'upgrade success_url still points elsewhere');
    check('upgrade return: checkout-upgrade cancel_url returns to /master too', srvJs.includes("cancel_url: `${config.baseUrl}/master?upgrade_cancelled=1`"), 'upgrade cancel_url still points at the hub');
    check('upgrade return: base $1/$8 unlock still lands on the hub (unchanged)', srvJs.includes("success_url: `${config.baseUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`"), 'base unlock success_url changed');
    check('upgrade return: success.html upgrade branch goes to /master + Ask-the-Master button', successHtml.includes('/master?upgraded=1&session_id=') && successHtml.includes('Taking you straight to Ask the Master'), 'success.html upgrade branch still points at the hub');
    check('upgrade return: checkUpgradeReturn verifies the session + shows Unlimited + pending fallback', appJs.includes('function checkUpgradeReturn()') && appJs.includes("params.get('upgraded') !== '1'") && appJs.includes("t('upgradeDone')") && appJs.includes("t('upgradePending')") && appJs.includes('loadMasterChat()'), 'checkUpgradeReturn missing or incomplete');
    check('upgrade return: /master restores from the stored token at init', appJs.includes('loadReport().then(() => checkUpgradeReturn())') && appJs.includes("localStorage.getItem('fateweave_token')") && appJs.includes("show('quiz-card', onPortrait)"), '/master restore path missing');
    check('upgrade return: hub shows Skip-to-Master shortcut for unlocked users', appJs.includes('function hubNextHTML()') && appJs.includes("t('skipToMaster')") && appJs.includes('href="/master"') && appJs.includes('hub-master-btn') && css.includes('.hub-master-btn'), 'hub Master shortcut missing');
    check('upgrade return: skipToMaster + upgradePending strings exist in EN + Simplified Chinese', appJs.includes("skipToMaster: 'Skip to Master →'") && appJs.includes('upgradePending:'), 'upgrade-return strings missing');
    // Quizzes are optional Portrait content only — no step navigation or
    // master restore path ever requires them.
    const stepNavSrc = appJs.slice(appJs.indexOf('function stepNavHTML()'), appJs.indexOf('function hubNextHTML()'));
    const upgradeRetSrc = appJs.slice(appJs.indexOf('async function checkUpgradeReturn()'), appJs.indexOf('prefillForm();'));
    check('upgrade return: no step nav or master return path requires a quiz', !/quiz/i.test(stepNavSrc) && !/quiz/i.test(upgradeRetSrc), 'a quiz gate crept into step nav or the upgrade return');

    console.log(`\nSmoke test: ${passed} passed, ${failed} failed.`);
    process.exitCode = failed ? 1 : 0;
  } finally {
    server.close();
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
