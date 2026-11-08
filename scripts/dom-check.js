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
const htmlShell = fs.readFileSync(path.join(ROOT, 'public', 'index.html'), 'utf8');
const chatCss = fs.readFileSync(path.join(ROOT, 'public', 'styles.css'), 'utf8');
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
  focus() {}
  click() {}
}

const IDS = ['lang-en', 'lang-zh', 'systems', 'sys-hero', 'quiz-list', 'quiz-area', 'hook-card', 'teaser-status', 'birthDate', 'birthTime', 'ziweiGender', 'name', 'email', 'ziwei-input-card', 'ziwei-input-form', 'ziwei-input-status', 'ziwei-birth-time', 'ziwei-birth-gender', 'unlocked-banner', 'unlocked-card', 'unlocked-sub', 'unlock-card', 'price-line', 'pay-btn', 'report-card', 'report', 'lr-used', 'lr-question', 'lr-answers', 'lr-speak', 'lr-stop', 'mc-left', 'mc-left-label', 'mc-left-suffix', 'mc-ai-badge', 'mc-progress', 'mc-mode', 'mc-next', 'mc-ai-rest', 'mc-upgrade-btn', 'mc-upgrade-offer', 'mc-thread', 'mc-question', 'resend-status', 'view-report-btn', 'resend-btn', 'download-report-btn', 'hook-form', 'checkout-form', 'preview-unlock-btn', 'lr-ask', 'lr-voice', 'mc-ask', 'mc-voice', 'mc-upgrade-offer-btn', 'brand-hero', 'hub-next', 'step-nav', 'daily-card', 'limits-card', 'quiz-card', 'master-locked-card', 'live-reader', 'master-chat'];

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
  const fetchCalls = { masterPost: 0, lrPost: 0, report: 0 };
  const fetchStub = async (url, opts) => {
    const u = String(url);
    const isMasterPost = u.startsWith('/api/master-chat') && opts && opts.method === 'POST';
    const isLrPost = u.startsWith('/api/live-reader') && opts && opts.method === 'POST';
    if (isMasterPost) fetchCalls.masterPost++;
    if (isLrPost) fetchCalls.lrPost++;
    if (u.startsWith('/api/report')) fetchCalls.report++;
    // fetchMode 'reportFailsOnce' (8 Nov 2026 fix 4): the first
    // /api/report restore throws (transient network failure, Railway
    // incident) — loadReport must retry once and unlock, not leave
    // /master showing "locked" until a reload.
    if (fetchMode === 'reportFailsOnce' && u.startsWith('/api/report') && fetchCalls.report === 1) throw new Error('transient network failure');
    if (fetchMode === 'ziweiInputsRequired' && u.startsWith('/api/report')) return { ok: false, status: 409, json: async () => ({ code: 'ziwei_inputs_required', error: 'Enter chart inputs.', birthTime: null, ziweiGender: null }) };
    // fetchMode 'throw': the master-chat POST throws (offline / Railway
    // incident). fetchMode 'nonJson': it returns a non-JSON error page
    // (Safari: res.json() throws "The string did not match the expected
    // pattern"). Both are the 7 Nov 2026 live failure; GETs still work
    // so the page itself loads and the counter is set.
    // fetchMode 'hang' (7 Nov 2026 fix 5): the POST never resolves —
    // the long silent stretches Jason saw on video. The page must show
    // a thinking bubble and disable Ask while it waits.
    if (fetchMode === 'geminiDown' && isMasterPost) return { ok: false, status: 503, json: async () => ({ code: 'gemini_unavailable', error: 'The Master is unavailable. Please retry; no follow-up was used.', questionsRemaining: 5 }) };
    if (fetchMode === 'throw' && isMasterPost) throw new Error('The string did not match the expected pattern');
    if (fetchMode === 'nonJson' && isMasterPost) return { ok: false, status: 502, json: async () => { throw new SyntaxError('Unexpected token < in JSON at position 0'); } };
    if (fetchMode === 'hang' && (isMasterPost || isLrPost)) return new Promise(() => {});
    const json = async () => ({});
    if (u.startsWith('/api/config')) return { ok: true, json: async () => ({ price: { amountCents: 100, currency: 'usd', isPromo: true, promoStart: '2026-11-07', promoEnd: '2026-11-24' } }) };
    if (u.startsWith('/api/hook')) return { ok: true, json: async () => buildTeaser({ birthDate: '1990-05-14', birthTime: '08:30', ziweiGender: 'male', name: 'Test' }) };
    if (u.startsWith('/api/live-reader')) return { ok: true, json: async () => ({ questionsUsed: 1, questionsRemaining: 2, max: 3 }) };
    if (u.startsWith('/api/report')) return unlocked
      ? { ok: true, json: async () => buildFullReading({ birthDate: '1990-05-14', birthTime: '08:30', ziweiGender: 'male', name: 'Test' }) }
      : { ok: false, status: 403, json };
    if (u.startsWith('/api/master-chat')) return { ok: true, json: async () => ({topics:[],activeTopicId:null,mainUsed:0,mainRemaining:3,probesUsed:0,probesRemaining:5,probeMax:5,purchases:0,purchasesRemaining:2}) };
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
    els.ziweiGender.value = 'male';
    els.name.value = 'Test';
    const h = els['hook-form']._handlers.submit[0];
    await h({ preventDefault() {} });
    await new Promise((r) => setTimeout(r, 50));
  }
  els._sandbox = sandbox;
  els._fetchCalls = fetchCalls;
  return els;
}


let pass=0,fail=0;
function check(n,v){if(v){pass++;console.log('PASS '+n);}else{fail++;console.error('FAIL '+n);}}
(async()=>{
 let els=await runCase({page:null,unlocked:false});check('hub preserves free glimpse',!els['hook-card'].hidden&&els['report-card'].hidden);
 els=await runCase({page:'master',unlocked:false});check('unpaid master remains locked',!els['master-locked-card'].hidden);
 els=await runCase({page:'master',unlocked:true,fetchMode:'ziweiInputsRequired'});check('legacy paid order gets the missing Zi Wei form',!els['ziwei-input-card'].hidden&&els['master-locked-card'].hidden&&els['report-card'].hidden);
 check('Master conversation scroll has a visible track and full-height replies',chatCss.includes('overflow-y: scroll')&&chatCss.includes('scrollbar-width: auto')&&chatCss.includes('max-height:none; overflow:visible'));
 check('conversation panel includes a scroll cue and keyboard focus',htmlShell.includes('mcScrollHint')&&htmlShell.includes('id="mc-thread" role="log"')&&htmlShell.includes('tabindex="0"'));
 els=await runCase({page:'master',unlocked:true});check('one input begins at first main question',els['mc-mode'].textContent.includes('Question 1 of 3')&&els['mc-question'].placeholder.includes('Master'));
 check('Next disabled until a main answer exists',els['mc-next'].disabled===true);
 check('initial shared follow-up balance is 5',els['mc-left'].textContent==='5');
 check('purchase button adds fifteen',els['mc-upgrade-btn'].textContent.includes('15'));
 check('provider badge hidden',els['mc-ai-badge'].hidden);
 for(const mode of ['throw','nonJson','geminiDown']){
  els=await runCase({page:'master',unlocked:true,fetchMode:mode});els['mc-question'].value='What does my financial outlook mean?';await els['mc-ask']._handlers.click[0]();
  check(mode+': input retained',els['mc-question'].value==='What does my financial outlook mean?');
  check(mode+': follow-up balance not consumed',els['mc-left'].textContent==='5');
  check(mode+': retry notice outside thread',!els['mc-ai-rest'].hidden&&!els['mc-thread'].innerHTML.includes('financial outlook'));
  check(mode+': ask re-enabled',els['mc-ask'].disabled===false);
 }
 els=await runCase({page:'master',unlocked:true,fetchMode:'hang'});els['mc-question'].value='What is my outlook?';void els['mc-ask']._handlers.click[0]();await new Promise(r=>setTimeout(r,10));
 check('thinking state disables Ask and Next',els['mc-ask'].disabled&&els['mc-next'].disabled);
 await els['mc-ask']._handlers.click[0]();check('double tap sends one request',els._fetchCalls.masterPost===1);
 check('thinking state is visible',els['mc-thread'].innerHTML.includes('thinking'));
 console.log(`Unified DOM: ${pass} passed, ${fail} failed.`);process.exitCode=fail?1:0;
})().catch(e=>{console.error(e);process.exitCode=1;});
