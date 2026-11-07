'use strict';
/* Minimal DOM-stub harness: loads the real public/app.js in a vm context
   per page (hub, /bazi, /portrait, /master × locked/unlocked) and checks
   applyPageLayout() outcomes + the hub-next button + step nav. Not part
   of the shipped test suite — a one-off verification aid. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const appJs = fs.readFileSync(path.join(ROOT, 'public', 'app.js'), 'utf8');
const { buildTeaser, buildFullReading } = require(path.join(ROOT, 'src', 'readings'));

class El {
  constructor(id) {
    this.id = id;
    this._cls = new Set();
    this.classList = {
      add: (c) => this._cls.add(c),
      remove: (c) => this._cls.delete(c),
      toggle: (c, force) => { if (force === undefined) { this._cls.has(c) ? this._cls.delete(c) : this._cls.add(c); } else if (force) this._cls.add(c); else this._cls.delete(c); },
      contains: (c) => this._cls.has(c),
    };
    this.dataset = {};
    this.style = {};
    this.innerHTML = '';
    this.textContent = '';
    this.value = '';
    this.disabled = false;
    this._handlers = {};
  }
  get hidden() { return this._cls.has('hidden'); }
  addEventListener(ev, fn) { (this._handlers[ev] = this._handlers[ev] || []).push(fn); }
  querySelectorAll() { return []; }
  querySelector() { return null; }
  scrollIntoView() {}
  appendChild() {}
  remove() {}
  click() {}
}

const IDS = ['lang-en', 'lang-zh', 'systems', 'sys-hero', 'quiz-list', 'quiz-area', 'hook-card', 'teaser-status', 'birthDate', 'birthTime', 'name', 'email', 'unlocked-banner', 'unlocked-card', 'unlocked-sub', 'unlock-card', 'price-line', 'pay-btn', 'report-card', 'report', 'lr-used', 'lr-question', 'lr-answers', 'lr-speak', 'lr-stop', 'mc-left', 'mc-left-label', 'mc-left-suffix', 'mc-ai-badge', 'mc-upgrade-btn', 'mc-upgrade-offer', 'mc-thread', 'mc-question', 'resend-status', 'view-report-btn', 'resend-btn', 'download-report-btn', 'hook-form', 'checkout-form', 'lr-ask', 'lr-voice', 'mc-ask', 'mc-voice', 'mc-upgrade-offer-btn', 'brand-hero', 'hub-next', 'step-nav', 'daily-card', 'limits-card', 'quiz-card', 'master-locked-card', 'live-reader', 'master-chat'];

async function runCase({ page, unlocked, submitHook, search, fetchMode }) {
  const els = {};
  for (const id of IDS) els[id] = new El(id);
  els['report-card'].classList.add('hidden');
  els['unlocked-card'].classList.add('hidden');
  els['master-locked-card'].classList.add('hidden');
  els['unlocked-banner'].classList.add('hidden');
  // Static shell content (as served from index.html) that applyPageLayout
  // only shows/hides, never writes.
  els['master-locked-card'].innerHTML = '<h2>Ask the Master is locked</h2><p>Unlock your full reading first.</p><p><a href="/">Back to the hub to unlock</a></p>';
  const store = {};
  if (unlocked) {
    store.fateweave_token = 'tok';
    store.fateweave_email = 'buyer@example.com';
    store.fateweave_birthDate = '1990-05-14';
  }
  const body = new El('body');
  body.dataset.system = page || '';
  const docEl = new El('html');
  const fetchStub = async (url, opts) => {
    const u = String(url);
    const isMasterPost = u.startsWith('/api/master-chat') && opts && opts.method === 'POST';
    // fetchMode 'throw': the master-chat POST throws (offline / Railway
    // incident). fetchMode 'nonJson': it returns a non-JSON error page
    // (Safari: res.json() throws "The string did not match the expected
    // pattern"). Both are the 7 Nov 2026 live failure; GETs still work
    // so the page itself loads and the counter is set.
    if (fetchMode === 'throw' && isMasterPost) throw new Error('The string did not match the expected pattern');
    if (fetchMode === 'nonJson' && isMasterPost) return { ok: false, status: 502, json: async () => { throw new SyntaxError('Unexpected token < in JSON at position 0'); } };
    const json = async () => ({});
    if (u.startsWith('/api/config')) return { ok: true, json: async () => ({ price: { amountCents: 100, currency: 'usd', isPromo: true, promoStart: '2026-11-07', promoEnd: '2026-11-24' } }) };
    if (u.startsWith('/api/hook')) return { ok: true, json: async () => buildTeaser({ birthDate: '1990-05-14', birthTime: '08:30', name: 'Test' }) };
    if (u.startsWith('/api/report')) return unlocked
      ? { ok: true, json: async () => buildFullReading({ birthDate: '1990-05-14', birthTime: '08:30', name: 'Test' }) }
      : { ok: false, status: 403, json };
    if (u.startsWith('/api/master-chat')) return { ok: true, json: async () => ({ messages: [], questionsUsed: 0, questionsRemaining: 5, max: 5, extended: false, aiMasterLive: false }) };
    if (u.startsWith('/api/checkout-session/')) return { ok: true, json: async () => ({ paid: true, upgrade: true, email: 'buyer@example.com', birthDate: '1990-05-14' }) };
    return { ok: false, status: 404, json };
  };
  const sandbox = {
    console, setTimeout, clearTimeout, URLSearchParams,
    crypto: require('crypto'),
    location: { search: search || '', pathname: page ? '/' + page : '/', href: '' },
    history: { replaceState() {} },
    localStorage: {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
    },
    fetch: fetchStub,
    document: {
      body, documentElement: docEl,
      getElementById: (id) => els[id] || null,
      querySelectorAll: () => [],
      querySelector: () => null,
      createElement: () => new El('x'),
    },
    window: {},
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(appJs, sandbox, { filename: 'app.js' });
  await new Promise((r) => setTimeout(r, 100));
  if (submitHook) {
    els.birthDate.value = '1990-05-14';
    els.birthTime.value = '08:30';
    els.name.value = 'Test';
    const h = els['hook-form']._handlers.submit[0];
    await h({ preventDefault() {} });
    await new Promise((r) => setTimeout(r, 50));
  }
  els._sandbox = sandbox;
  return els;
}

let pass = 0, fail = 0;
function check(name, ok, detail) {
  if (ok) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name + ' ' + (detail || '')); }
}

(async () => {
  // Hub, fresh (no teaser): hero + hook visible; quiz/report/hub-next hidden.
  let els = await runCase({ page: null, unlocked: false });
  check('hub fresh: hero+hook visible', !els['brand-hero'].hidden && !els['hook-card'].hidden);
  check('hub fresh: quiz + report + unlock-banner hidden', els['quiz-card'].hidden && els['report-card'].hidden);
  check('hub fresh: no hub-next button yet', els['hub-next'].innerHTML === '');
  check('hub fresh: step-nav empty', els['step-nav'].innerHTML === '');
  check('hub fresh: unlock card visible (locked)', !els['unlock-card'].hidden);

  // Hub, after glimpse: hub-next button links to /bazi.
  els = await runCase({ page: null, unlocked: false, submitHook: true });
  check('hub glimpse: Start-your-reading button links /bazi', els['hub-next'].innerHTML.includes('href="/bazi"') && els['hub-next'].innerHTML.includes('Start your reading'));
  check('hub glimpse: systems show all six overview cards', ['sys-bazi', 'sys-tarot', 'sys-num'].every((id) => els.systems.innerHTML.includes(`id="${id}"`)));
  check('hub glimpse: still no quiz / report on hub', els['quiz-card'].hidden && els['report-card'].hidden);

  // /bazi locked (preview): only bazi section; hero/hook/quiz/daily hidden; unlock visible; step 1 of 8.
  els = await runCase({ page: 'bazi', unlocked: false });
  check('bazi locked: only its own section renders', els.systems.innerHTML.includes('id="sys-bazi"') && !els.systems.innerHTML.includes('id="sys-tarot"') && !els.systems.innerHTML.includes('id="sys-num"'));
  check('bazi locked: hero/hook/quiz/daily/limits hidden', els['brand-hero'].hidden && els['hook-card'].hidden && els['quiz-card'].hidden && els['daily-card'].hidden && els['limits-card'].hidden);
  check('bazi locked: unlock card visible, unlocked card hidden', !els['unlock-card'].hidden && els['unlocked-card'].hidden);
  check('bazi locked: step nav Step 1 of 8, Next Zi Wei, prev = hub', els['step-nav'].innerHTML.includes('Step 1 of 8') && els['step-nav'].innerHTML.includes('/ziwei') && els['step-nav'].innerHTML.includes('href="/"'));

  // /bazi unlocked: unlock card hidden; step nav still step 1.
  els = await runCase({ page: 'bazi', unlocked: true });
  check('bazi unlocked: unlock + unlocked cards both hidden', els['unlock-card'].hidden && els['unlocked-card'].hidden);
  check('bazi unlocked: report card hidden (full reading lives on system pages)', els['report-card'].hidden);
  check('bazi unlocked: step nav still Step 1 of 8', els['step-nav'].innerHTML.includes('Step 1 of 8'));

  // /portrait: quizzes visible; step 7 of 8, Next Master.
  els = await runCase({ page: 'portrait', unlocked: false });
  check('portrait: quiz card visible', !els['quiz-card'].hidden);
  check('portrait: step nav Step 7 of 8, Next Master', els['step-nav'].innerHTML.includes('Step 7 of 8') && els['step-nav'].innerHTML.includes('/master'));

  // /tarot locked: step 5 of 8, prev yijing, next numerology.
  els = await runCase({ page: 'tarot', unlocked: false });
  check('tarot: step nav Step 5 of 8, prev /yijing, next /numerology', els['step-nav'].innerHTML.includes('Step 5 of 8') && els['step-nav'].innerHTML.includes('/yijing') && els['step-nav'].innerHTML.includes('/numerology'));
  check('tarot: only tarot section renders', els.systems.innerHTML.includes('id="sys-tarot"') && !els.systems.innerHTML.includes('id="sys-bazi"'));

  // /master locked: locked prompt visible, report hidden, unlock card hidden.
  els = await runCase({ page: 'master', unlocked: false });
  check('master locked: locked prompt visible + hub link', !els['master-locked-card'].hidden && els['master-locked-card'].innerHTML.includes('href="/"'));
  check('master locked: report + unlock cards hidden', els['report-card'].hidden && els['unlock-card'].hidden);
  check('master locked: step nav Step 8 of 8, Done back to hub', els['step-nav'].innerHTML.includes('Step 8 of 8') && els['step-nav'].innerHTML.includes('Done'));

  // /master unlocked: report card visible, summary div hidden.
  els = await runCase({ page: 'master', unlocked: true });
  check('master unlocked: report card visible, summary div hidden, locked prompt hidden', !els['report-card'].hidden && els.report.hidden && els['master-locked-card'].hidden);

  // Hub unlocked: unlocked card visible, unlock hidden, report hidden, hub-next present.
  els = await runCase({ page: null, unlocked: true });
  check('hub unlocked: unlocked card visible, unlock hidden, report hidden', !els['unlocked-card'].hidden && els['unlock-card'].hidden && els['report-card'].hidden);
  check('hub unlocked: hub-next button present', els['hub-next'].innerHTML.includes('href="/bazi"'));
  check('hub unlocked: Skip-to-Master shortcut present (no step flow / quiz needed)', els['hub-next'].innerHTML.includes('href="/master"') && els['hub-next'].innerHTML.includes('Skip to Master'));
  check('hub unlocked: no hub-next shortcut before unlock (locked glimpse only)', (await runCase({ page: null, unlocked: false, submitHook: true }))['hub-next'].innerHTML.includes('href="/master"') === false);

  // /master unlocked after a $3 upgrade return: ?upgraded=1 verifies the
  // session, the banner reads Extended, the chat is open, no quiz in sight.
  els = await runCase({ page: 'master', unlocked: true, search: '?upgraded=1&session_id=cs_test_upgrade' });
  check('master upgrade return: banner shows Extended Master Chat unlocked', !els['unlocked-banner'].hidden && els['unlocked-banner'].innerHTML.includes('Extended Master Chat unlocked'));
  check('master upgrade return: report card visible, locked prompt hidden, quiz hidden', !els['report-card'].hidden && els['master-locked-card'].hidden && els['quiz-card'].hidden);
  check('master unlocked: no quiz anywhere on the Master page', els['quiz-card'].hidden && !els.systems.innerHTML.includes('quiz'));

  // Master chat transport failure (7 Nov 2026 live bug): the fetch
  // throws, or the reply is a non-JSON error page. The user must see a
  // short friendly message — never the raw browser error — the failed
  // question must not be stored, the input must be kept for a retry,
  // and the counter must not move.
  els = await runCase({ page: 'master', unlocked: true, fetchMode: 'throw' });
  await new Promise((r) => setTimeout(r, 50));
  els['mc-question'].value = 'How is my career next year?';
  await els['mc-ask']._handlers.click[0]();
  await new Promise((r) => setTimeout(r, 50));
  check('master chat fetch throws: friendly message, no raw browser error', els['mc-thread'].innerHTML.includes('try again in a moment') && !els['mc-thread'].innerHTML.includes('The string did not match') && !els['mc-thread'].innerHTML.includes('Network error'), els['mc-thread'].innerHTML.slice(0, 200));
  check('master chat fetch throws: question not stored, input kept, counter still 5', !els['mc-thread'].innerHTML.includes('How is my career next year?') && els['mc-question'].value === 'How is my career next year?' && Number(els['mc-left'].textContent) === 5, `thread=${els['mc-thread'].innerHTML.slice(0, 120)} left=${els['mc-left'].textContent}`);

  els = await runCase({ page: 'master', unlocked: true, fetchMode: 'nonJson' });
  await new Promise((r) => setTimeout(r, 50));
  els['mc-question'].value = 'How is my career next year?';
  await els['mc-ask']._handlers.click[0]();
  await new Promise((r) => setTimeout(r, 50));
  check('master chat non-JSON reply: friendly message, no raw browser error', els['mc-thread'].innerHTML.includes('try again in a moment') && !els['mc-thread'].innerHTML.includes('Unexpected token') && !els['mc-thread'].innerHTML.includes('Network error'), els['mc-thread'].innerHTML.slice(0, 200));
  check('master chat non-JSON reply: question not stored, counter still 5', !els['mc-thread'].innerHTML.includes('How is my career next year?') && Number(els['mc-left'].textContent) === 5, `left=${els['mc-left'].textContent}`);

  console.log(`\nDOM check: ${pass} passed, ${fail} failed.`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
