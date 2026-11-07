'use strict';
/* FateWeave frontend — NO secrets, NO unlock codes, NO payment verification here.
   Payment is verified on the server only. The browser only holds the random
   access token the server issued after a verified payment.
   Hook rule: free users see a card name + 1-2 lines per system, and blurred
   skeleton blocks for the rest. Full text only ever arrives via /api/report
   with a valid paid token — it is never in this file. */
const state = {
  lang: 'en', teaser: null, report: null, unlocked: false, price: null,
  sessionId: crypto.randomUUID(),
  revealed: {}, tarotFlipped: [false, false, false], ziweiCast: false, yijingCast: false,
  yijingLines: [], yijingCasting: false,
  quiz: { kind: null, questions: null, idx: 0, answers: [], result: null },
  quizCache: null,
};

const STR = {
  en: {
    tagline: 'One birthday in. Six systems answer. Do they agree?',
    masterLine: '\u201CI don\u2019t tell fortunes. I lay six systems side by side \u2014 and we see where they agree.\u201D \u2014 The Master',
    hookTitle: 'Your free glimpse', hookLede: 'Enter your birth date, then tap each card to reveal a little detail from every system. The full reading unlocks after payment.',
    birthDate: 'Birth date', birthTime: 'Birth time (optional)', name: 'Name (optional)', hookCta: 'See my free glimpse',
    quizTitle: 'Know yourself \u2014 two quizzes', quizLede: 'Take them free \u2014 they are part of the hook. You will see your type and one line right away; the full breakdown unlocks with your reading.',
    unlockedTitle: 'Your reading is unlocked', viewReport: 'View my full reading', resendReport: 'Resend report email',
    unlockedBanner: '\u2713 Unlocked \u2014 no need to pay again',
    unlockedBannerSub: 'Your full reading is open below. It is saved on this device \u2014 refresh any time, no need to re-enter anything.',
    unlockTitle: 'Unlock the full reading',
    unlockBody: 'Pay first, then the full details open \u2014 for every system, plus Live Reader (3 questions) and your detailed report by email.',
    emailLabel: 'Email (for your report + daily encouragement)', sameDateNote: 'Use the same birth date as your free glimpse, and the same email to come back later.',
    fullReadingTitle: 'Your full reading', liveReaderTitle: 'Live Reader',
    liveReaderBody: 'Ask up to 3 questions, by voice or typing. Answers are grounded in your reading only.',
    questionsUsed: 'Questions used', ask: 'Ask', askPh: 'Ask a question\u2026', speakAnswer: 'Speak the answer aloud', stopSpeaking: 'Stop speaking',
    dailyTitle: 'Free daily encouragement', dailyBody: 'One short email at 7:00am SGT \u2014 a word of encouragement, a tarot card, and a line for your day. Free with your unlock. Unsubscribe anytime.',
    limitsTitle: 'Honest limits',
    limit1: 'Bazi is a simplified demo engine \u2014 no true solar-time correction yet.',
    limit2: 'Zi Wei content in the paid reading is illustrative sample content, not a fully computed chart.',
    limit3: 'For self-reflection and entertainment only \u2014 not medical, financial or legal advice.',
    tapReveal: 'Tap to reveal', tapFlip: 'Tap a card to flip it', castChart: 'Cast the chart', castCoins: 'Cast the coins',
    lockedTitle: 'Full reading locked', lockedBody: 'Unlock the full reading to read every detail.',
    unlockBtn: 'Unlock full reading', casting: 'Casting\u2026', flipping: 'Tap to flip', flipAllTarot: 'Flip all three cards to read them as one story.',
    readingGlimpse: 'Reading your glimpse\u2026', enterDateFirst: 'Enter your birth date in the free glimpse form first.',
    couldNotRead: 'Could not read that birth date.', networkError: 'Network error: ',
    payUnlock: 'Pay & unlock', priceUnavailable: 'Price unavailable \u2014 please try again later.',
    questions: 'questions', questionOf: 'Question', of: 'of', back: '\u2190 Back', restart: 'Restart quiz',
    startQuiz: 'Start the quiz', retake: 'Retake', yourType: 'Your type', fullBreakdownLocked: 'Full breakdown locked \u2014 unlock to read it.',
    strengths: 'Strengths', whatsLacking: 'What\u2019s lacking', yourResult: 'Your result',
    resendOk: 'Report email resent \u2014 check your inbox.', resendFail: 'Could not resend the report email.',
    checkoutFail: 'Checkout failed.', checkoutError: 'Checkout error: ',
    voiceUnsupported: 'Voice input is not supported in this browser \u2014 please type your question.',
    portraitTitle: 'Complete Portrait', synthesisTitle: 'Where the six systems agree \u2014 and where they pull apart',
    sampleNote: 'Illustrative sample content, not a computed chart.',
    simplifiedNote: 'Simplified engine \u2014 no true solar-time correction yet.',
    reversed: 'Reversed', past: 'Past', present: 'Present', path: 'Near future',
    sysDescBazi: 'Your Chinese birth chart — Day Master, five elements and luck, from your year, month, day and hour.',
    sysDescZiwei: 'Purple Star astrology — your Life Palace, and the palaces for wealth, career and relationships.',
    sysDescHoro: 'Western astrology — your Sun, Moon and Rising signs.',
    sysDescYijing: 'The Book of Changes — cast six lines, one toss per line, to build your hexagram.',
    sysDescTarot: 'Three cards — Past, Present, and the path ahead.',
    sysDescNum: 'Life Path, Destiny and Personal Year numbers, from your birth date and name.',
    sysDescPortrait: 'One portrait woven from all six systems — where they agree, and where they pull apart.',
    yijingHow: 'Six tosses, one per line, building the hexagram from the bottom up.',
    castingLine: 'Casting line {n} of 6…',
    lineLabel: 'Line {n}',
    solidLine: 'Solid — Yang',
    brokenLine: 'Broken — Yin',
    changingLine: 'Changing',
    heads: 'Heads', tails: 'Tails',
    sun: 'Sun', moon: 'Moon', rising: 'Rising', lifePath: 'Life Path', destiny: 'Destiny', personalYear: 'Personal Year 2026',
    dayMaster: 'Day Master', lifePalace: 'Life Palace', hexagram: 'Hexagram', changingLines: 'Changing lines',
    overview: 'Overview', strengthsSec: 'Strengths', challengesSec: 'Challenges / growing edge', careerSec: 'Career', relationshipsSec: 'Relationships', healthSec: 'Health & energy', timingSec: 'Timing',
    growthEdge: 'Growing edge', practices: 'Practices for the next 90 days', style: 'How you think, work & connect',
    think: 'How you think', work: 'How you work', connect: 'How you connect',
  },
  zh: {
    tagline: '\u8f38\u5165\u4e00\u6b21\u751f\u65e5\uff0c\u516d\u500b\u7cfb\u7d71\u540c\u6642\u56de\u7b54\u3002\u5b83\u5011\u8aaa\u7684\u4e00\u6a23\u55ce\uff1f',
    masterLine: '\u300c\u6211\u4e0d\u7b97\u547d\uff0c\u53ea\u628a\u516d\u500b\u7cfb\u7d71\u64fa\u5728\u4e00\u8d77\u2014\u2014\u770b\u5b83\u5011\u5728\u54ea\u88e1\u8aaa\u7684\u4e00\u6a23\u3002\u300d\u2014\u2014 \u638c\u9580',
    hookTitle: '\u4f60\u7684\u514d\u8cbb\u4e00\u77a5', hookLede: '\u8f38\u5165\u751f\u65e5\uff0c\u7136\u5f8c\u9010\u5f35\u9ede\u958b\u6bcf\u4e00\u500b\u7cfb\u7d71\uff0c\u770b\u4e00\u9ede\u9ede\u5167\u5bb9\u3002\u5b8c\u6574\u5831\u544a\u9700\u4ed8\u6b3e\u5f8c\u89e3\u9396\u3002',
    birthDate: '\u51fa\u751f\u65e5\u671f', birthTime: '\u51fa\u751f\u6642\u9593\uff08\u53ef\u9078\uff09', name: '\u540d\u5b57\uff08\u53ef\u9078\uff09', hookCta: '\u67e5\u770b\u6211\u7684\u514d\u8cbb\u4e00\u77a5',
    quizTitle: '\u8a8d\u8b58\u81ea\u5df1\u2014\u2014\u5169\u500b\u6e2c\u9a57', quizLede: '\u514d\u8cbb\u505a\u2014\u2014\u9019\u4e5f\u662f\u9810\u89bd\u7684\u4e00\u90e8\u5206\u3002\u4f60\u6703\u5373\u6642\u770b\u5230\u4f60\u7684\u985e\u578b\u8207\u4e00\u53e5\u8a71\uff1b\u5b8c\u6574\u89e3\u6790\u96a8\u5831\u544a\u89e3\u9396\u3002',
    unlockedTitle: '\u4f60\u7684\u5831\u544a\u5df2\u89e3\u9396', viewReport: '\u67e5\u770b\u5b8c\u6574\u5831\u544a', resendReport: '\u91cd\u5bc4\u5831\u544a\u96fb\u90f5',
    unlockedBanner: '\u2713 \u5df2\u89e3\u9396\u2014\u2014\u7121\u9700\u518d\u6b21\u4ed8\u6b3e',
    unlockedBannerSub: '\u5b8c\u6574\u5831\u544a\u5df2\u5728\u4e0b\u65b9\u958b\u555f\uff0c\u4e26\u4fdd\u5b58\u5728\u6b64\u88dd\u7f6e\u2014\u2014\u96a8\u6642\u91cd\u65b0\u6574\u7406\uff0c\u4e0d\u7528\u518d\u8f38\u5165\u4efb\u4f55\u8cc7\u6599\u3002',
    unlockTitle: '\u89e3\u9396\u5b8c\u6574\u5831\u544a',
    unlockBody: '\u5148\u4ed8\u6b3e\uff0c\u5b8c\u6574\u5167\u5bb9\u96a8\u5373\u958b\u555f\u2014\u2014\u516d\u500b\u7cfb\u7d71\u5168\u90e8\u3001Live Reader\uff083 \u500b\u554f\u984c\uff09\uff0c\u4ee5\u53ca\u8a73\u7d30\u5831\u544a\u5bc4\u5230\u4f60\u7684\u4fe1\u7bb1\u3002',
    emailLabel: '\u96fb\u90f5\uff08\u63a5\u6536\u5831\u544a\u8207\u6bcf\u65e5\u9f13\u52f5\uff09', sameDateNote: '\u8acb\u7528\u8207\u514d\u8cbb\u4e00\u77a5\u76f8\u540c\u7684\u51fa\u751f\u65e5\u671f\uff0c\u4ee5\u53ca\u76f8\u540c\u7684\u96fb\u90f5\uff0c\u4ee5\u4fbf\u65e5\u5f8c\u56de\u4f86\u67e5\u770b\u3002',
    fullReadingTitle: '\u4f60\u7684\u5b8c\u6574\u5831\u544a', liveReaderTitle: 'Live Reader',
    liveReaderBody: '\u6700\u591a\u554f 3 \u500b\u554f\u984c\uff0c\u53ef\u7528\u8a9e\u97f3\u6216\u6253\u5b57\u3002\u56de\u7b54\u53ea\u6839\u64da\u4f60\u7684\u5831\u544a\u5167\u5bb9\u3002',
    questionsUsed: '\u5df2\u7528\u554f\u984c', ask: '\u63d0\u554f', askPh: '\u554f\u4e00\u500b\u554f\u984c\u2026\u2026', speakAnswer: '\u5927\u8072\u8b80\u51fa\u7b54\u6848', stopSpeaking: '\u505c\u6b62\u6717\u8b80',
    dailyTitle: '\u514d\u8cbb\u6bcf\u65e5\u9f13\u52f5', dailyBody: '\u6bcf\u5929\u65e9\u4e0a 7:00\uff08\u65b0\u52a0\u5761\u6642\u9593\uff09\u4e00\u5c01\u77ed\u4fe1\u2014\u2014\u4e00\u53e5\u9f13\u52f5\u3001\u4e00\u5f35\u5854\u7f85\u724c\u3001\u4e00\u53e5\u4eca\u65e5\u63d0\u9192\u3002\u89e3\u9396\u5f8c\u514d\u8cbb\uff0c\u96a8\u6642\u53ef\u4ee5\u53d6\u6d88\u8a02\u95b1\u3002',
    limitsTitle: '\u8aa0\u5be6\u8aaa\u660e',
    limit1: '\u516b\u5b57\u70ba\u7c21\u5316\u6f14\u793a\u5f15\u64ce\u2014\u2014\u5c1a\u672a\u505a\u771f\u592a\u967d\u6642\u6821\u6b63\u3002',
    limit2: '\u4ed8\u8cbb\u5831\u544a\u4e2d\u7684\u7d2b\u5fae\u5167\u5bb9\u70ba\u793a\u7bc4\u6a23\u672c\uff0c\u4e26\u975e\u5b8c\u6574\u6392\u76e4\u3002',
    limit3: '\u50c5\u4f9b\u81ea\u6211\u53cd\u601d\u8207\u5a1b\u6a02\u2014\u2014\u4e0d\u662f\u91ab\u7642\u3001\u8ca1\u52d9\u6216\u6cd5\u5f8b\u5efa\u8b70\u3002',
    tapReveal: '\u9ede\u4e00\u4e0b\u63ed\u958b', tapFlip: '\u9ede\u4e00\u5f35\u724c\u7ffb\u958b\u5b83', castChart: '\u8d77\u76e4', castCoins: '\u64f2\u5366',
    lockedTitle: '\u5b8c\u6574\u5167\u5bb9\u672a\u89e3\u9396', lockedBody: '\u89e3\u9396\u5b8c\u6574\u5831\u544a\uff0c\u5373\u53ef\u95b1\u8b80\u5168\u90e8\u7d30\u7bc0\u3002',
    unlockBtn: '\u89e3\u9396\u5b8c\u6574\u5831\u544a', casting: '\u8d77\u5366\u4e2d\u2026\u2026', flipping: '\u9ede\u4e00\u4e0b\u7ffb\u724c', flipAllTarot: '\u7ffb\u958b\u4e09\u5f35\u724c\uff0c\u770b\u770b\u5b83\u5011\u5408\u8d77\u4f86\u8aaa\u7684\u6545\u4e8b\u3002',
    readingGlimpse: '\u6b63\u5728\u8b80\u53d6\u4f60\u7684\u9810\u89bd\u2026\u2026', enterDateFirst: '\u8acb\u5148\u5728\u514d\u8cbb\u4e00\u77a5\u8868\u55ae\u8f38\u5165\u51fa\u751f\u65e5\u671f\u3002',
    couldNotRead: '\u7121\u6cd5\u8b80\u53d6\u8a72\u51fa\u751f\u65e5\u671f\u3002', networkError: '\u7db2\u7d61\u932f\u8aa4\uff1a',
    payUnlock: '\u4ed8\u6b3e\u4e26\u89e3\u9396', priceUnavailable: '\u66ab\u6642\u7121\u6cd5\u53d6\u5f97\u50f9\u683c\u2014\u2014\u8acb\u7a0d\u5f8c\u518d\u8a66\u3002',
    questions: '\u984c', questionOf: '\u7b2c', of: '/', back: '\u2190 \u4e0a\u4e00\u984c', restart: '\u91cd\u65b0\u6e2c\u9a57',
    startQuiz: '\u958b\u59cb\u6e2c\u9a57', retake: '\u91cd\u65b0\u6e2c\u9a57', yourType: '\u4f60\u7684\u985e\u578b', fullBreakdownLocked: '\u5b8c\u6574\u89e3\u6790\u672a\u89e3\u9396\u2014\u2014\u89e3\u9396\u5f8c\u53ef\u95b1\u8b80\u3002',
    strengths: '\u9577\u8655', whatsLacking: '\u5c1a\u7f3a\u4e4b\u8655', yourResult: '\u4f60\u7684\u7d50\u679c',
    resendOk: '\u5831\u544a\u96fb\u90f5\u5df2\u91cd\u5bc4\u2014\u2014\u8acb\u6aa2\u67e5\u6536\u4ef6\u7bb1\u3002', resendFail: '\u7121\u6cd5\u91cd\u5bc4\u5831\u544a\u96fb\u90f5\u3002',
    checkoutFail: '\u7d50\u5e33\u5931\u6557\u3002', checkoutError: '\u7d50\u5e33\u932f\u8aa4\uff1a',
    voiceUnsupported: '\u6b64\u700f\u89bd\u5668\u4e0d\u652f\u63f4\u8a9e\u97f3\u8f38\u5165\u2014\u2014\u8acb\u6253\u5b57\u63d0\u554f\u3002',
    portraitTitle: '\u5b8c\u6574\u8096\u50cf', synthesisTitle: '\u516d\u500b\u7cfb\u7d71\u4e00\u81f4\u4e4b\u8655\u2014\u2014\u4ee5\u53ca\u5f35\u529b\u6240\u5728',
    sampleNote: '\u793a\u7bc4\u6a23\u672c\u5167\u5bb9\uff0c\u4e26\u975e\u5b8c\u6574\u8a08\u7b97\u3002',
    simplifiedNote: '\u7c21\u5316\u5f15\u64ce\u2014\u2014\u5c1a\u672a\u505a\u771f\u592a\u967d\u6642\u6821\u6b63\u3002',
    reversed: '\u9006\u4f4d', past: '\u904e\u53bb', present: '\u73fe\u5728', path: '\u8fd1\u671f\u672a\u4f86',
    sysDescBazi: '\u516b\u5b57\u547d\u76e4\u2014\u2014\u5f9e\u51fa\u751f\u5e74\u3001\u6708\u3001\u65e5\u3001\u6642\u770b\u65e5\u4e3b\u3001\u4e94\u884c\u8207\u904b\u52e2\u3002',
    sysDescZiwei: '\u7d2b\u5fae\u6597\u6578\u2014\u2014\u547d\u5bae\u8207\u8ca1\u5e1b\u3001\u5b98\u7984\u3001\u592b\u59bb\u7b49\u5bae\u4f4d\u3002',
    sysDescHoro: '\u897f\u6d0b\u5360\u661f\u2014\u2014\u592a\u967d\u3001\u6708\u4eae\u8207\u4e0a\u5347\u661f\u5ea7\u3002',
    sysDescYijing: '\u6613\u7d93\u2014\u2014\u516d\u6b21\u64f2\u5e63\uff0c\u9010\u723b\u6210\u5366\u3002',
    sysDescTarot: '\u5854\u7f85\u2014\u2014\u4e09\u5f35\u724c\uff1a\u904e\u53bb\u3001\u73fe\u5728\u8207\u672a\u4f86\u4e4b\u8def\u3002',
    sysDescNum: '\u751f\u547d\u9748\u6578\u2014\u2014\u751f\u547d\u9748\u6578\u3001\u547d\u904b\u6578\u8207\u500b\u4eba\u5e74\u3002',
    sysDescPortrait: '\u5b8c\u6574\u8096\u50cf\u2014\u2014\u516d\u500b\u7cfb\u7d71\u4ea4\u7e54\u800c\u6210\uff0c\u770b\u5b83\u5011\u5728\u54ea\u88e1\u4e00\u81f4\u3001\u5728\u54ea\u88e1\u62c9\u626f\u3002',
    yijingHow: '\u516d\u6b21\u64f2\u5e63\uff0c\u9010\u723b\u6210\u5366\uff0c\u7531\u4e0b\u800c\u4e0a\u3002',
    castingLine: '\u6b63\u5728\u64f2\u7b2c {n} \u723b\uff0c\u5171 6 \u723b\u2026',
    lineLabel: '\u7b2c {n} \u723b',
    solidLine: '\u967d\u723b\uff08\u5be6\u7dda\uff09',
    brokenLine: '\u9670\u723b\uff08\u65b7\u7dda\uff09',
    changingLine: '\u8b8a\u723b',
    heads: '\u967d', tails: '\u9670',
    sun: '\u592a\u967d', moon: '\u6708\u4eae', rising: '\u4e0a\u5347', lifePath: '\u751f\u547d\u9748\u6578', destiny: '\u547d\u904b\u6578', personalYear: '2026 \u500b\u4eba\u5e74',
    dayMaster: '\u65e5\u4e3b', lifePalace: '\u547d\u5bae', hexagram: '\u5366\u8c61', changingLines: '\u8b8a\u723b',
    overview: '\u7e3d\u89bd', strengthsSec: '\u9577\u8655', challengesSec: '\u6311\u6230 / \u6210\u9577\u908a\u7de3', careerSec: '\u4e8b\u696d', relationshipsSec: '\u611f\u60c5\u8207\u95dc\u4fc2', healthSec: '\u5065\u5eb7\u8207\u7cbe\u529b', timingSec: '\u6642\u6a5f',
    growthEdge: '\u6210\u9577\u908a\u7de3', practices: '\u672a\u4f86 90 \u5929\u7684\u7df4\u7fd2', style: '\u4f60\u5982\u4f55\u601d\u8003\u3001\u5de5\u4f5c\u8207\u9023\u7d50',
    think: '\u5982\u4f55\u601d\u8003', work: '\u5982\u4f55\u5de5\u4f5c', connect: '\u5982\u4f55\u9023\u7d50',
  },
};
const t = (k) => STR[state.lang][k] || STR.en[k] || k;
const L = (o) => (o && typeof o === 'object' ? (state.lang === 'zh' ? o.zh || o.en : o.en || o.zh) : o);
const esc = (x) => String(x ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const $ = (id) => document.getElementById(id);

function setLang(lang) {
  state.lang = lang;
  document.documentElement.lang = lang === 'zh' ? 'zh-TW' : 'en';
  document.querySelectorAll('[data-i18n]').forEach((el) => { if (STR[lang][el.dataset.i18n]) el.textContent = STR[lang][el.dataset.i18n]; });
  document.querySelectorAll('[data-i18n-ph]').forEach((el) => { if (STR[lang][el.dataset.i18nPh]) el.placeholder = STR[lang][el.dataset.i18nPh]; });
  $('lang-en').classList.toggle('active', lang === 'en');
  $('lang-zh').classList.toggle('active', lang === 'zh');
  renderSystems(); renderQuizList(); renderReportCard();
}
$('lang-en').onclick = () => setLang('en');
$('lang-zh').onclick = () => setLang('zh');

/* --- Locked placeholder: skeleton bars only, NEVER real text --- */
function lockBlock() {
  return `<div class="lock-wrap"><div class="lock-blur" aria-hidden="true">
    <div class="skel"></div><div class="skel short"></div><div class="skel"></div><div class="skel short"></div>
  </div><div class="lock-overlay"><div class="lock-ic">\uD83D\uDD12</div><p>${esc(t('lockedTitle'))}</p>
  <button type="button" class="ghost" onclick="document.getElementById('unlock-card').scrollIntoView({behavior:'smooth'})">${esc(t('unlockBtn'))}</button></div></div>`;
}
function sectionHTML(sections, keys) {
  if (!sections) return '';
  const label = { overview: 'overview', strengths: 'strengthsSec', challenges: 'challengesSec', career: 'careerSec', relationships: 'relationshipsSec', health: 'healthSec', timing: 'timingSec' };
  return (keys || ['overview', 'strengths', 'challenges', 'career', 'relationships', 'health', 'timing'])
    .filter((k) => sections[k]).map((k) => `<h3>${esc(t(label[k]))}</h3><p>${esc(L(sections[k]))}</p>`).join('');
}
function sysHead(icon, title) { return `<h2><span class="sys-icon">${icon}</span>${esc(title)}</h2>`; }
function revealCover(icon, label, sub) {
  return `<div class="reveal-cover" role="button" tabindex="0"><div class="big">${icon}</div><p>${esc(label)}</p><small>${esc(sub)}</small></div>`;
}

/* --- Pre-glimpse preview ---------------------------------------------------
   Before any birth date is entered, #systems was empty — renderSystems()
   returned early with no teaser/report, so none of the six systems was
   visible at all (feedback from Jason testing on his phone, 7 Nov 2026).
   Now all six sections render on page load, each with a one-line
   description and its control visible. Tapping a control before a glimpse
   only prompts for the birth date — it never shows a reading for a date
   that was not entered, and no reading text leaks in this state. */
function promptBirthDate() {
  const card = $('hook-card');
  card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  card.classList.add('attention');
  setTimeout(() => card.classList.remove('attention'), 2200);
  $('teaser-status').textContent = t('enterDateFirst');
}
function previewSystemsHTML() {
  let html = '';
  html += `<section class="card" id="sys-bazi">${sysHead('\uD83C\uDF3F', 'Bazi \u516B\u5B57')}<p class="lede sys-desc">${esc(t('sysDescBazi'))}</p>${revealCover('\uD83C\uDF3F', `${t('tapReveal')} \u2014 ${t('dayMaster')}`, t('enterDateFirst'))}</section>`;
  html += `<section class="card" id="sys-ziwei">${sysHead('\u2B50', 'Zi Wei \u7D2B\u5FAE\u6597\u6578')}<p class="lede sys-desc">${esc(t('sysDescZiwei'))}</p><p class="lede">${esc(t('lifePalace'))} \u00B7 ${esc(L({ en: 'Tian Ji', zh: '\u5929\u6A5F' }))}</p><button type="button" data-preview="ziwei">\u2728 ${esc(t('castChart'))}</button></section>`;
  html += `<section class="card" id="sys-horo">${sysHead('\uD83C\uDF19', 'Horoscope \u661F\u5EA7')}<p class="lede sys-desc">${esc(t('sysDescHoro'))}</p>${revealCover('\uD83C\uDF19', `${t('tapReveal')} \u2014 ${t('sun')}`, t('enterDateFirst'))}</section>`;
  html += `<section class="card" id="sys-yijing">${sysHead('\u262F\uFE0F', 'Yi-Jing \u6613\u7D93')}<p class="lede sys-desc">${esc(t('sysDescYijing'))}</p><p class="lede">${esc(t('yijingHow'))}</p><button type="button" data-preview="yijing">\uD83E\uDE99 ${esc(t('castCoins'))}</button></section>`;
  html += `<section class="card" id="sys-tarot">${sysHead('\uD83C\uDCCF', 'Tarot \u5854\u7F85')}<p class="lede sys-desc">${esc(t('sysDescTarot'))}</p><p class="lede">${esc(t('tapFlip'))}</p><div class="tarot-row">${['past', 'present', 'path'].map((p) => `<div><div class="tarot-card" data-preview="tarot" role="button" tabindex="0" aria-label="${esc(t('tapFlip'))}"><div class="tarot-inner"><div class="tarot-face tarot-back"><div class="star">\u2726</div><p>${esc(t('flipping'))}</p></div></div></div><p class="tarot-pos">${esc(t(p))}</p></div>`).join('')}</div></section>`;
  html += `<section class="card" id="sys-num">${sysHead('\uD83D\uDD22', 'Numerology \u751F\u547D\u9748\u6578')}<p class="lede sys-desc">${esc(t('sysDescNum'))}</p>${revealCover('\uD83D\uDD22', `${t('tapReveal')} \u2014 ${t('lifePath')}`, t('enterDateFirst'))}</section>`;
  html += `<section class="card" id="sys-portrait">${sysHead('\uD83E\uDE9E', t('portraitTitle'))}<p class="lede sys-desc">${esc(t('sysDescPortrait'))}</p>${revealCover('\uD83E\uDE9E', t('portraitTitle'), t('enterDateFirst'))}</section>`;
  return html;
}
function bindPreviewEvents() {
  document.querySelectorAll('[data-preview]').forEach((el) => {
    el.onclick = () => promptBirthDate();
    el.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); promptBirthDate(); } };
  });
  // The Bazi / Horoscope / Numerology / Portrait previews use revealCover
  // divs (no data-preview attribute on them) — they prompt too.
  document.querySelectorAll('#systems .reveal-cover').forEach((el) => {
    el.onclick = () => promptBirthDate();
    el.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); promptBirthDate(); } };
  });
}

/* --- Yi-Jing 6-line casting -------------------------------------------------
   Traditional casting builds a hexagram from 6 lines, bottom to top, one
   3-coin toss per line. The server already computes exactly those 6 lines
   (castYijing) and the teaser now carries them (line, coin sum, solid /
   broken, changing) — so the animation below reveals the SERVER's lines,
   one toss at a time, and the hexagram shown is the one those lines make.
   Nothing is invented client-side. */
function yijingLinesOf() {
  const src = state.unlocked && state.report ? state.report : state.teaser;
  if (!src || !src.yijing) return null;
  if (Array.isArray(src.yijing.lines) && src.yijing.lines.length === 6) return src.yijing.lines;
  return null;
}
function hexagramDiagramHTML(lines) {
  // Lines are drawn with line 6 at the top and line 1 at the bottom.
  // `lines` may be a partial reveal (during casting): unrevealed lines
  // render as faint placeholders so the hexagram visibly grows upward.
  const byLine = {};
  (lines || []).forEach((l) => { byLine[l.line] = l; });
  let rows = '';
  for (let n = 6; n >= 1; n--) {
    const l = byLine[n];
    if (!l) {
      rows += `<div class="hex-row hex-placeholder"><span class="hex-num">${esc(t('lineLabel').replace('{n}', n))}</span><span class="hex-bar hex-empty"></span><span class="hex-kind"></span></div>`;
      continue;
    }
    const bar = l.yang ? '<span class="hex-bar yang"></span>' : '<span class="hex-bar yin"><i></i><i></i></span>';
    const kind = l.yang ? t('solidLine') : t('brokenLine');
    const mark = l.changing ? `<span class="hex-mark">\u2715 ${esc(t('changingLine'))}</span>` : '';
    rows += `<div class="hex-row cast-item"><span class="hex-num">${esc(t('lineLabel').replace('{n}', l.line))}</span>${bar}<span class="hex-kind">${esc(kind)}</span>${mark}</div>`;
  }
  return `<div class="hex-diagram">${rows}</div>`;
}
function yijingCoinsHTML(sum) {
  // 3-coin toss: heads = 3, tails = 2, so sum 6..9 means 0..3 heads.
  const heads = Math.max(0, Math.min(3, (sum || 6) - 6));
  let out = '';
  for (let i = 0; i < 3; i++) out += `<div class="coin">${i < heads ? esc(t('heads')) : esc(t('tails'))}</div>`;
  return `<div class="coins">${out}</div>`;
}

/* --- Systems renderer: teaser (free) or report (paid) --- */
function renderSystems() {
  const box = $('systems');
  const src = state.unlocked && state.report ? state.report : state.teaser;
  if (!src) { box.innerHTML = previewSystemsHTML(); bindPreviewEvents(); return; }
  const unlocked = state.unlocked && !!state.report;
  const r = state.report;
  // Hook lines: from the teaser when present, else from the full reading
  // (a fresh load with a stored token never fetched a teaser).
  const hookOf = (sys, fallback) => (src[sys] && src[sys].hook) || fallback;
  const baziHook = hookOf('bazi', unlocked ? r.bazi.dayMasterText : null);
  const horoHook = hookOf('horoscope', unlocked ? r.horoscope.sun.trait : null);
  const numHook = hookOf('numerology', unlocked ? r.numerology.lifePathText : null);
  const yijingHook = hookOf('yijing', unlocked ? r.yijing.theme : null);
  let html = '';

  /* Bazi */
  html += `<section class="card" id="sys-bazi">${sysHead('\uD83C\uDF3F', 'Bazi \u516B\u5B57')}<p class="lede sys-desc">${esc(t('sysDescBazi'))}</p>`;
  if (!state.revealed.bazi) {
    html += revealCover('\uD83C\uDF3F', `${t('tapReveal')} \u2014 ${t('dayMaster')}`, t('tapReveal'));
  } else {
    const dm = unlocked ? r.bazi.dayMaster : { en: src.bazi.dayMaster, zh: src.bazi.dayMasterZh };
    html += `<div class="reveal-in"><p class="essence">${esc(t('dayMaster'))}: ${esc(L(dm))}</p><p class="hook-line">${esc(L(baziHook))}</p>`;
    if (unlocked) {
      html += `<div class="pillars">${r.bazi.pillars.map((p) => `<div class="pillar cast-item"><div class="plabel">${esc(L(p.label))}</div><div class="pchars">${esc(p.stem.char)}${esc(p.branch.char)}</div><div class="pelem">${esc(L(p.stem))} \u00B7 ${esc(L(p.branch))}</div></div>`).join('')}</div>`;
      html += `<div class="elbar">${Object.entries(r.bazi.counts).map(([k, v]) => `<div class="${k === r.bazi.dominant ? 'hot' : k === r.bazi.weakest ? 'cold' : ''}">${esc(k)} \u00D7${v}</div>`).join('')}</div>`;
      html += sectionHTML(r.bazi.sections);
      html += `<p class="small">${esc(t('simplifiedNote'))}</p>`;
    } else html += lockBlock();
    html += `</div>`;
  }
  html += `</section>`;

  /* Zi Wei — cast the chart */
  html += `<section class="card" id="sys-ziwei">${sysHead('\u2B50', 'Zi Wei \u7D2B\u5FAE\u6597\u6578')}<p class="lede sys-desc">${esc(t('sysDescZiwei'))}</p>`;
  if (!state.ziweiCast) {
    html += `<p class="lede">${esc(t('lifePalace'))} \u00B7 ${esc(L({ en: 'Tian Ji', zh: '\u5929\u6A5F' }))}</p><button type="button" data-act="cast-ziwei">\u2728 ${esc(t('castChart'))}</button>`;
  } else {
    const palaces = unlocked ? r.ziwei.palaces : [
      { key: 'life', en: 'Life Palace', zh: '\u547D\u5BAE', star: { en: 'Tian Ji', zh: '\u5929\u6A5F' }, text: src.ziwei.hook },
      { key: 'wealth', en: 'Wealth Palace', zh: '\u8CA1\u5E1B\u5BAE', star: { en: 'Wu Qu', zh: '\u6B66\u66F2' }, text: null },
      { key: 'career', en: 'Career Palace', zh: '\u5B98\u7984\u5BAE', star: { en: 'Tai Yang', zh: '\u592A\u967D' }, text: null },
      { key: 'spouse', en: 'Spouse Palace', zh: '\u592B\u59BB\u5BAE', star: { en: 'Tai Yin', zh: '\u592A\u9670' }, text: null },
    ];
    html += `<div class="palace-grid">${palaces.map((p) => {
      const readable = unlocked || p.key === 'life';
      return `<div class="palace cast-item ${p.key === 'life' ? 'main' : ''}"><div class="pname">${esc(L(p))}</div><div class="star">${esc(L(p.star))}</div>${readable && p.text ? `<p>${esc(L(p.text))}</p>` : `<div class="skel"></div><div class="skel short"></div>`}</div>`;
    }).join('')}</div>`;
    if (unlocked) html += sectionHTML(r.ziwei.sections) + `<p class="small">${esc(t('sampleNote'))}</p>`;
    else html += lockBlock();
  }
  html += `</section>`;

  /* Horoscope */
  html += `<section class="card" id="sys-horo">${sysHead('\uD83C\uDF19', 'Horoscope \u661F\u5EA7')}<p class="lede sys-desc">${esc(t('sysDescHoro'))}</p>`;
  if (!state.revealed.horo) {
    html += revealCover('\uD83C\uDF19', `${t('tapReveal')} \u2014 ${t('sun')}`, t('tapReveal'));
  } else {
    const sun = unlocked ? r.horoscope.sun : { en: src.horoscope.sunSign, zh: src.horoscope.sunSignZh };
    html += `<div class="reveal-in"><p class="essence">${esc(t('sun'))}: ${esc(L(sun))}</p><p class="hook-line">${esc(L(horoHook))}</p>`;
    if (unlocked) {
      html += `<p><span class="badge">${esc(t('sun'))} ${esc(L(r.horoscope.sun))}</span><span class="badge">${esc(t('moon'))} ${esc(L(r.horoscope.moon))}</span><span class="badge">${esc(t('rising'))} ${esc(L(r.horoscope.rising))}</span></p>`;
      html += sectionHTML(r.horoscope.sections);
    } else html += lockBlock();
    html += `</div>`;
  }
  html += `</section>`;

  /* Yi-Jing — cast the coins: true 6-line casting, bottom to top.
     The hexagram and hook below are only shown once all six lines have
     been cast; the lines shown are the server's lines for this profile. */
  html += `<section class="card" id="sys-yijing">${sysHead('\u262F\uFE0F', 'Yi-Jing \u6613\u7D93')}<p class="lede sys-desc">${esc(t('sysDescYijing'))}</p><p class="lede">${esc(t('yijingHow'))}</p>`;
  if (!state.yijingCast) {
    html += `<button type="button" data-act="cast-yijing">\uD83E\uDE99 ${esc(t('castCoins'))}</button><div class="yijing-stage"></div>`;
  } else {
    const hex = unlocked ? r.yijing.hexagram : src.yijing.hexagram;
    html += hexagramDiagramHTML(yijingLinesOf());
    html += `<div class="reveal-in"><p class="essence">${esc(t('hexagram'))}: ${esc(hex)}</p><p class="hook-line">${esc(L(yijingHook))}</p>`;
    if (unlocked) {
      html += `<p><span class="badge">${esc(t('changingLines'))}: ${r.yijing.changingLines.length ? r.yijing.changingLines.join(', ') : '\u2014'}</span>${r.yijing.transformed ? `<span class="badge">\u2192 ${esc(r.yijing.transformed.number)} \u00B7 ${esc(L(r.yijing.transformed))}</span>` : ''}</p>`;
      if (r.yijing.sections.changing) html += `<h3>${esc(t('changingLines'))}</h3><p>${esc(L(r.yijing.sections.changing))}</p>`;
      html += sectionHTML(r.yijing.sections, ['overview', 'career', 'relationships', 'health', 'timing']);
    } else html += lockBlock();
    html += `</div>`;
  }
  html += `</section>`;

  /* Tarot — flip the cards */
  html += `<section class="card" id="sys-tarot">${sysHead('\uD83C\uDCCF', 'Tarot \u5854\u7F85')}<p class="lede sys-desc">${esc(t('sysDescTarot'))}</p><p class="lede">${esc(t('tapFlip'))}</p>`;
  const cards = unlocked ? r.tarot.cardsDetailed : src.tarot.cards;
  const posKeys = ['past', 'present', 'path'];
  html += `<div class="tarot-row">${cards.map((c, i) => {
    const flipped = state.tarotFlipped[i];
    return `<div><div class="tarot-card ${flipped ? 'flipped' : ''}" data-tarot="${i}" role="button" tabindex="0" aria-label="${esc(t('tapFlip'))}">
      <div class="tarot-inner">
        <div class="tarot-face tarot-back"><div class="star">\u2726</div><p>${esc(t('flipping'))}</p></div>
        <div class="tarot-face tarot-front"><div class="emoji">${esc(c.emoji)}</div><div class="cname">${esc(L(c.name))}</div><div class="kw">${esc(c.keywords || '')}</div>${c.reversed ? `<div class="rev">${esc(t('reversed'))}</div>` : ''}</div>
      </div></div><p class="tarot-pos">${esc(t(posKeys[i]))}</p></div>`;
  }).join('')}</div>`;
  html += `<div id="tarot-detail">${cards.map((c, i) => {
    if (!state.tarotFlipped[i]) return '';
    if (unlocked) {
      return `<div class="tarot-detail reveal-in"><h3>${esc(t(posKeys[i]))} \u2014 ${esc(L(c.name))}${c.reversed ? ` (${esc(t('reversed'))})` : ''}</h3><p>${esc(L(c.meaning))}</p><p class="hook-line">${esc(L(c.positionText))}</p><p>${esc(L(c.forQuestion))}</p></div>`;
    }
    return `<div class="tarot-detail"><p class="hook-line"><strong>${esc(L(c.name))}</strong> \u2014 ${esc(c.keywords || '')}</p>${lockBlock()}</div>`;
  }).join('')}</div>`;
  if (unlocked && state.tarotFlipped.every(Boolean)) {
    // The story names all three cards and the sections discuss them in
    // detail, so they only appear once every card has actually been flipped
    // open. Previously they rendered for a paid session even with all cards
    // face-down after a reload (bug found live 7 Nov 2026).
    html += `<p class="hook-line"><em>${esc(L(r.tarot.story))}</em></p>` + sectionHTML(r.tarot.sections, ['career', 'relationships', 'health', 'timing']);
  } else if (unlocked) {
    html += `<p class="small">${esc(t('flipAllTarot'))}</p>`;
  }
  html += `</section>`;

  /* Numerology */
  html += `<section class="card" id="sys-num">${sysHead('\uD83D\uDD22', 'Numerology \u751F\u547D\u9748\u6578')}<p class="lede sys-desc">${esc(t('sysDescNum'))}</p>`;
  if (!state.revealed.num) {
    html += revealCover('\uD83D\uDD22', `${t('tapReveal')} \u2014 ${t('lifePath')}`, t('tapReveal'));
  } else {
    const lp = unlocked ? r.numerology.lifePath : src.numerology.lifePath;
    html += `<div class="reveal-in"><p class="essence">${esc(t('lifePath'))}: ${lp}</p><p class="hook-line">${esc(L(numHook))}</p>`;
    if (unlocked) {
      html += `<p><span class="badge">${esc(t('lifePath'))} ${r.numerology.lifePath}</span>${r.numerology.destiny ? `<span class="badge">${esc(t('destiny'))} ${r.numerology.destiny}</span>` : ''}<span class="badge">${esc(t('personalYear'))}: ${r.numerology.personalYear}</span></p>`;
      html += sectionHTML(r.numerology.sections);
    } else html += lockBlock();
    html += `</div>`;
  }
  html += `</section>`;

  /* Complete Portrait */
  html += `<section class="card" id="sys-portrait">${sysHead('\uD83E\uDE9E', t('portraitTitle'))}<p class="lede sys-desc">${esc(t('sysDescPortrait'))}</p><p class="essence">${esc(L(src.portrait.essenceLine))}</p>`;
  if (unlocked) {
    html += `<h3>${esc(t('portraitTitle'))}</h3><p>${esc(L(r.portrait.character))}</p>`;
    html += `<h3>${esc(t('style'))}</h3><p><strong>${esc(t('think'))}:</strong> ${esc(L(r.portrait.style.think))}</p><p><strong>${esc(t('work'))}:</strong> ${esc(L(r.portrait.style.work))}</p><p><strong>${esc(t('connect'))}:</strong> ${esc(L(r.portrait.style.connect))}</p>`;
    html += `<h3>${esc(t('strengths'))}</h3><ul class="clean">${r.portrait.strengths.map((x) => `<li>${esc(L(x.text))} <small>(${esc(L(x.source))})</small></li>`).join('')}</ul>`;
    html += `<h3>${esc(t('whatsLacking'))}</h3><ul class="clean">${r.portrait.lacking.map((x) => `<li>${esc(L(x.text))} <small>(${esc(L(x.source))})</small></li>`).join('')}</ul>`;
    html += `<h3>${esc(t('practices'))}</h3><ul class="clean">${r.portrait.developmentFocus.map((x) => `<li>${esc(L(x))}</li>`).join('')}</ul>`;
    html += `<h3>${esc(t('synthesisTitle'))}</h3><p>${esc(L(r.synthesis.agree))}</p><p>${esc(L(r.synthesis.tension))}</p><p><em>${esc(L(r.synthesis.full))}</em></p>`;
    if (r.synthesis.personalityLens) html += `<p class="hook-line">${esc(L(r.synthesis.personalityLens))}</p>`;
  } else html += lockBlock();
  html += `</section>`;

  box.innerHTML = html;
  bindSystemEvents();
}

function bindSystemEvents() {
  const bindReveal = (sel, key) => {
    document.querySelectorAll(sel).forEach((el) => {
      const go = () => { state.revealed[key] = true; renderSystems(); };
      el.onclick = go;
      el.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } };
    });
  };
  bindReveal('#sys-bazi .reveal-cover', 'bazi');
  bindReveal('#sys-horo .reveal-cover', 'horo');
  bindReveal('#sys-num .reveal-cover', 'num');
  document.querySelectorAll('[data-act="cast-ziwei"]').forEach((el) => { el.onclick = () => { state.ziweiCast = true; renderSystems(); }; });
  document.querySelectorAll('[data-act="cast-yijing"]').forEach((el) => {
    el.onclick = () => {
      if (state.yijingCasting) return;
      const lines = yijingLinesOf();
      const stage = el.parentElement ? el.parentElement.querySelector('.yijing-stage') : null;
      if (!lines || !stage) {
        // Fallback (should not happen — the teaser always carries lines):
        // the old single 1.6s animation, then reveal.
        const card = el.closest('.card');
        const lede = card ? card.querySelector('.lede') : null;
        if (lede) lede.textContent = t('casting');
        const coins = document.createElement('div');
        coins.className = 'coins';
        coins.innerHTML = '<div class="coin spin">\u967D</div><div class="coin spin">\u9670</div><div class="coin spin">\u967D</div>';
        el.replaceWith(coins);
        setTimeout(() => { state.yijingCast = true; renderSystems(); }, 1600);
        return;
      }
      // True 6-line casting: one toss per line, bottom (line 1) to top
      // (line 6). Each step shows the three coins of that toss, then the
      // line joins the hexagram diagram. The lines are the server's lines
      // for this profile, in order — nothing is re-rolled client-side.
      state.yijingCasting = true;
      el.disabled = true;
      const revealed = [];
      const step = (i) => {
        if (i >= 6) {
          setTimeout(() => { state.yijingCast = true; state.yijingLines = lines; state.yijingCasting = false; renderSystems(); }, 500);
          return;
        }
        const line = lines[i];
        stage.innerHTML = `<p class="lede">${esc(t('castingLine').replace('{n}', line.line))}</p>${yijingCoinsHTML(line.sum)}${hexagramDiagramHTML(revealed)}`;
        stage.querySelectorAll('.coin').forEach((c) => c.classList.add('spin'));
        setTimeout(() => {
          revealed.push(line);
          stage.innerHTML = `<p class="lede">${esc(t('castingLine').replace('{n}', line.line))}</p>${yijingCoinsHTML(line.sum)}${hexagramDiagramHTML(revealed)}`;
          step(i + 1);
        }, 750);
      };
      step(0);
    };
  });
  document.querySelectorAll('[data-tarot]').forEach((el) => {
    const flip = () => { const i = Number(el.dataset.tarot); state.tarotFlipped[i] = !state.tarotFlipped[i]; renderSystems(); };
    el.onclick = flip;
    el.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } };
  });
}

/* --- Quizzes: free to take, full breakdown locked until paid --- */
function storedQuiz(kind) {
  try { return JSON.parse(localStorage.getItem('fateweave_quiz_' + kind) || 'null'); } catch { return null; }
}
function saveQuiz(kind, data) { try { localStorage.setItem('fateweave_quiz_' + kind, JSON.stringify(data)); } catch {} }
function authParams() {
  return {
    token: localStorage.getItem('fateweave_token'),
    email: localStorage.getItem('fateweave_email'),
    birthDate: localStorage.getItem('fateweave_birthDate'),
  };
}

/* --- Birth profile persistence (bug 3) --------------------------------------
   The birth date and email were already stored, but birth time and name were
   not — after a reload both fields came back empty even though the banner
   promises "no need to re-enter anything". Persist time + name alongside
   them, and prefill the form from storage on every load. */
function saveProfile(birthDate, birthTime, name) {
  try {
    if (birthDate) localStorage.setItem('fateweave_birthDate', birthDate);
    localStorage.setItem('fateweave_birthTime', birthTime || '');
    localStorage.setItem('fateweave_name', name || '');
  } catch {}
}
function prefillForm() {
  try {
    const birthDate = localStorage.getItem('fateweave_birthDate');
    const birthTime = localStorage.getItem('fateweave_birthTime');
    const name = localStorage.getItem('fateweave_name');
    const email = localStorage.getItem('fateweave_email');
    if (birthDate) $('birthDate').value = birthDate;
    if (birthTime) $('birthTime').value = birthTime;
    if (name) $('name').value = name;
    if (email) $('email').value = email;
  } catch {}
}

/* --- Profile change (bug 2) -------------------------------------------------
   A paid reading belongs to ONE birth date: the stored token is bound to
   email + birth date on the server. When the user asks for a glimpse of a
   DIFFERENT birth date, the old full reading must not stay on screen for
   the new date — previously renderSystems() kept showing state.report
   whenever the device was unlocked, so pillars / Sun / Life Path never
   changed. Reset the view to locked; the stored token is deliberately NOT
   deleted, so going back to the paid birth date restores the paid reading
   (loadReport below) instead of asking the buyer to pay again. */
function resetProfileView() {
  state.report = null;
  state.unlocked = false;
  state.teaser = null;
  state.revealed = {};
  state.tarotFlipped = [false, false, false];
  state.ziweiCast = false;
  state.yijingCast = false;
  state.yijingLines = [];
  state.yijingCasting = false;
  state.quiz = { kind: null, questions: null, idx: 0, answers: [], result: null };
  $('unlocked-banner').classList.add('hidden');
  $('unlocked-banner').innerHTML = '';
  $('unlocked-card').classList.add('hidden');
  $('unlock-card').classList.remove('hidden');
  $('report-card').classList.add('hidden');
  $('report').innerHTML = '';
  renderQuizArea();
  renderQuizList();
}

function renderQuizList() {
  const list = $('quiz-list');
  const defs = [
    { kind: 'enneagram', icon: '\uD83D\uDD2E', title: 'Enneagram \u4E5D\u578B\u4EBA\u683C', count: 27 },
    { kind: 'mbti', icon: '\uD83E\uDDE0', title: 'MBTI', count: 24 },
  ];
  list.innerHTML = defs.map((d) => {
    const saved = storedQuiz(d.kind);
    const summary = saved?.result ? quizResultSummary(d.kind, saved.result) : '';
    return `<div class="card" style="margin-bottom:12px"><h3 style="margin-top:0">${d.icon} ${esc(d.title)} \u00B7 ${d.count} ${esc(t('questions'))}</h3>${summary}<button type="button" data-quiz="${d.kind}">${esc(saved ? t('retake') : t('startQuiz'))}</button></div>`;
  }).join('');
  list.querySelectorAll('[data-quiz]').forEach((b) => { b.onclick = () => startQuiz(b.dataset.quiz); });
  renderQuizArea();
}

function quizResultSummary(kind, res) {
  if (!res) return '';
  if (kind === 'enneagram') {
    return `<p class="hook-line"><strong>${esc(t('yourType'))}: ${res.type}w${res.wing} \u00B7 ${esc(L({ en: res.nameEn, zh: res.nameZh }))}</strong><br>${esc(L(res.teaser || res.summary))}</p>${res.locked ? lockBlock() : ''}`;
  }
  return `<p class="hook-line"><strong>${esc(t('yourType'))}: ${res.type} \u00B7 ${esc(L({ en: res.nickEn, zh: res.nickZh }))}</strong><br>${esc(L(res.teaser || res.summary))}</p>${res.locked ? lockBlock() : ''}`;
}

async function startQuiz(kind) {
  const area = $('quiz-area');
  area.innerHTML = `<p>${esc(t('readingGlimpse'))}</p>`;
  try {
    if (!state.quizCache) {
      const res = await fetch('/api/personality/questions');
      state.quizCache = await res.json();
    }
    state.quiz = { kind, questions: state.quizCache[kind], idx: 0, answers: [], result: null };
    renderQuizArea();
    $('quiz-area').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (e) { area.innerHTML = `<p>${esc(t('networkError'))}${esc(e.message)}</p>`; }
}

function renderQuizArea() {
  const area = $('quiz-area');
  const q = state.quiz;
  if (!q.kind || !q.questions) { area.innerHTML = ''; return; }
  if (q.result) {
    // Finished: show the result, not the last question card. Previously
    // submitQuiz() wrote the result into the area and then renderQuizList()
    // re-ran this function, which re-rendered the last question on top of
    // it (bug found live 7 Nov 2026). A locked summary has .locked set, so
    // it renders the locked view even if state.unlocked changed meanwhile.
    area.innerHTML = quizFullResult(q.kind, q.result, state.unlocked && !q.result.locked);
    return;
  }
  const total = q.questions.length;
  const item = q.questions[q.idx];
  const pct = Math.round((q.idx / total) * 100);
  let opts = '';
  if (q.kind === 'enneagram') {
    opts = item.opts.map((o, i) => `<button type="button" class="quiz-opt ${q.answers[q.idx] === i ? 'sel' : ''}" data-opt="${i}">${esc(L(o))}</button>`).join('');
  } else {
    opts = `<button type="button" class="quiz-opt ${q.answers[q.idx] === 'a' ? 'sel' : ''}" data-opt="a">${esc(L(item.a))}</button><button type="button" class="quiz-opt ${q.answers[q.idx] === 'b' ? 'sel' : ''}" data-opt="b">${esc(L(item.b))}</button>`;
  }
  area.innerHTML = `<div class="card" style="margin-bottom:0">
    <div class="quiz-progress"><div style="width:${pct}%"></div></div>
    <p class="small">${esc(t('questionOf'))} ${q.idx + 1} ${esc(t('of'))} ${total}</p>
    <p class="quiz-q">${esc(L(item.q))}</p>${opts}
    <div class="quiz-nav"><button type="button" class="ghost" data-nav="back" ${q.idx === 0 ? 'disabled' : ''}>${esc(t('back'))}</button>
    <button type="button" class="ghost" data-nav="restart">${esc(t('restart'))}</button></div></div>`;
  area.querySelectorAll('[data-opt]').forEach((b) => {
    b.onclick = () => {
      q.answers[q.idx] = q.kind === 'enneagram' ? Number(b.dataset.opt) : b.dataset.opt;
      if (q.idx + 1 < total) { q.idx++; renderQuizArea(); }
      else submitQuiz();
    };
  });
  area.querySelector('[data-nav="back"]').onclick = () => { if (q.idx > 0) { q.idx--; renderQuizArea(); } };
  area.querySelector('[data-nav="restart"]').onclick = () => { state.quiz = { kind: null, questions: null, idx: 0, answers: [], result: null }; renderQuizArea(); renderQuizList(); };
}

async function submitQuiz() {
  const q = state.quiz;
  const area = $('quiz-area');
  area.innerHTML = `<p>${esc(t('readingGlimpse'))}</p>`;
  const body = { ...authParams() };
  if (q.kind === 'enneagram') body.enneagramAnswers = q.answers;
  else body.mbtiAnswers = q.answers;
  try {
    const res = await fetch('/api/personality', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) { area.innerHTML = `<p>${esc(data.error || t('couldNotRead'))}</p>`; return; }
    const result = data[q.kind];
    saveQuiz(q.kind, { answers: q.answers, result });
    state.quiz.result = result;
    area.innerHTML = quizFullResult(q.kind, result, data.unlocked);
    renderQuizList(); // re-renders the area too; renderQuizArea() now shows the result, not the last question
    if (data.unlocked) loadReport(true); // refresh portrait lens with the new personality
  } catch (e) { area.innerHTML = `<p>${esc(t('networkError'))}${esc(e.message)}</p>`; }
}

function quizFullResult(kind, res, unlocked) {
  let html = `<div class="card" style="margin-bottom:0"><h3>${esc(t('yourResult'))}</h3>`;
  if (kind === 'enneagram') {
    html += `<p class="essence">Type ${res.type}w${res.wing} \u00B7 ${esc(L({ en: res.nameEn, zh: res.nameZh }))}</p>`;
    if (unlocked) {
      html += `<p>${esc(L(res.interpretation.core))}</p><p>${esc(L(res.interpretation.deep))}</p>`;
      html += `<h3>${esc(t('strengths'))}</h3><p>${esc(L(res.strengths))}</p><h3>${esc(t('whatsLacking'))}</h3><p>${esc(L(res.lacking))}</p>`;
      html += res.scores.map((s, i) => `<div class="scorebar"><span class="slabel">Type ${i + 1}</span><div class="strack"><div class="sfill" style="width:${Math.round((s / res.total) * 100)}%"></div></div><span>${s}</span></div>`).join('');
    } else {
      html += `<p class="hook-line">${esc(L(res.teaser))}</p><p class="small">${esc(t('fullBreakdownLocked'))}</p>${lockBlock()}`;
    }
  } else {
    html += `<p class="essence">${res.type} \u00B7 ${esc(L({ en: res.nickEn, zh: res.nickZh }))}</p>`;
    if (unlocked) {
      html += `<p>${esc(L(res.interpretation))}</p><p>${esc(L({ en: res.interpretation.deepEn, zh: res.interpretation.deepZh }))}</p>`;
      const dimNames = { EI: 'E / I', SN: 'S / N', TF: 'T / F', JP: 'J / P' };
      html += Object.entries(res.dimensions).map(([k, d]) => `<div class="scorebar"><span class="slabel">${dimNames[k]}</span><div class="strack"><div class="sfill" style="width:${d.pct}%"></div></div><span>${d.letter} ${d.pct}%</span></div>`).join('');
    } else {
      html += `<p class="hook-line">${esc(L(res.teaser))}</p><p class="small">${esc(t('fullBreakdownLocked'))}</p>${lockBlock()}`;
    }
  }
  html += `</div>`;
  return html;
}

/* --- Price / checkout --- */
async function loadPrice() {
  try {
    const res = await fetch('/api/config');
    const data = await res.json();
    state.price = data.price;
    const dollars = (data.price.amountCents / 100).toFixed(2);
    $('price-line').textContent = data.price.isPromo
      ? `$${dollars} launch promo \u00B7 ${data.price.promoStart}\u2013${data.price.promoEnd} \u00B7 then $8`
      : `$${dollars} full unlock`;
    $('pay-btn').textContent = `Pay $${dollars} & unlock`;
  } catch { $('price-line').textContent = t('priceUnavailable'); }
}

$('hook-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const birthDate = $('birthDate').value;
  const birthTime = $('birthTime').value || null;
  const name = $('name').value || null;
  const status = $('teaser-status');
  status.textContent = t('readingGlimpse');
  try {
    const res = await fetch('/api/hook', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ birthDate, birthTime, name }) });
    const data = await res.json();
    if (!res.ok) { status.textContent = data.error || t('couldNotRead'); return; }
    // The profile the user just asked about is the current profile from now
    // on — persist date, time and name so a reload prefills all three.
    const prevBirthDate = state.report?.profile?.birthDate || localStorage.getItem('fateweave_birthDate');
    saveProfile(birthDate, birthTime, name);
    state.teaser = data;
    status.textContent = '';
    if (prevBirthDate && birthDate !== prevBirthDate) {
      // Different birth date = different profile (bug 2): the paid reading
      // for the old date must not be shown for this one. Reset to the locked
      // teaser view; if this date is the one the stored token was issued
      // for, the paid reading is restored instead. Either way, quiz results
      // are re-fetched for the current profile (locked summary when unpaid,
      // full breakdown when paid) so no stale personality state lingers.
      resetProfileView();
      state.teaser = data; // resetProfileView() clears it
      await loadReport(true);
      unlockStoredQuizzes();
    }
    renderSystems();
    $('systems').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) { status.textContent = t('networkError') + err.message; }
});

$('checkout-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = $('email').value;
  const birthDate = $('birthDate').value;
  if (!birthDate) { alert(t('enterDateFirst')); return; }
  const birthTime = $('birthTime').value || null;
  const name = $('name').value || null;
  // Persist the profile (and email) now, so a reload or an abandoned
  // checkout never loses what the user already typed.
  saveProfile(birthDate, birthTime, name);
  try { localStorage.setItem('fateweave_email', email); } catch {}
  try {
    const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, birthDate, birthTime, name }) });
    const data = await res.json();
    if (!res.ok) { alert(data.error || t('checkoutFail')); return; }
    location.href = data.checkoutUrl;
  } catch (err) { alert(t('checkoutError') + err.message); }
});

/* --- Post-payment restore: token -> full reading, prefilled, no re-entry --- */
async function loadReport(quiet) {
  const { token, email, birthDate } = authParams();
  if (!token || !email || !birthDate) return false;
  try {
    const res = await fetch(`/api/report?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}&birthDate=${encodeURIComponent(birthDate)}`);
    if (!res.ok) return false; // not paid / expired — stay on the hook view
    const r = await res.json();
    state.report = r;
    state.unlocked = true;
    // Prefill the form from the stored order — the reading belongs to this birth date.
    $('birthDate').value = r.profile.birthDate || birthDate;
    if (r.profile.birthTime) $('birthTime').value = r.profile.birthTime;
    if (r.profile.name) $('name').value = r.profile.name;
    $('email').value = email;
    // Persist the paid profile: the token is bound to this birth date, so
    // remember which date it belongs to (returning to it after peeking at
    // another date must restore the paid reading), and keep birth time and
    // name stored so a reload prefills them too.
    try {
      localStorage.setItem('fateweave_tokenBirthDate', r.profile.birthDate || birthDate);
      localStorage.setItem('fateweave_birthTime', r.profile.birthTime || $('birthTime').value || '');
      localStorage.setItem('fateweave_name', r.profile.name || $('name').value || '');
    } catch {}
    $('unlocked-banner').innerHTML = `${esc(t('unlockedBanner'))}<small>${esc(t('unlockedBannerSub'))}</small>`;
    $('unlocked-banner').classList.remove('hidden');
    $('unlocked-sub').textContent = `${esc(r.profile.birthDate)} \u00B7 ${email}`;
    $('unlocked-card').classList.remove('hidden');
    $('unlock-card').classList.add('hidden');
    $('report-card').classList.remove('hidden');
    renderSystems();
    renderReportCard();
    if (!quiet) unlockStoredQuizzes();
    return true;
  } catch { return false; }
}

// After payment, re-submit any quizzes taken free so the full breakdown unlocks.
async function unlockStoredQuizzes() {
  for (const kind of ['enneagram', 'mbti']) {
    const saved = storedQuiz(kind);
    if (!saved?.answers) continue;
    try {
      const body = { ...authParams() };
      if (kind === 'enneagram') body.enneagramAnswers = saved.answers; else body.mbtiAnswers = saved.answers;
      const res = await fetch('/api/personality', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (res.ok && data[kind]) {
        saveQuiz(kind, { answers: saved.answers, result: data[kind] });
        // Keep the in-memory result in step: after payment this is the full
        // breakdown, after a profile change it is the locked summary again.
        if (state.quiz.kind === kind) state.quiz.result = data[kind];
      }
    } catch {}
  }
  renderQuizList();
}

function renderReportCard() {
  const r = state.report;
  if (!r) { $('report').innerHTML = ''; return; }
  $('report').innerHTML = `<p class="essence">${esc(L(r.portrait.essenceLine))}</p>
    <p>${esc(L(r.portrait.character))}</p>
    <h3>${esc(t('synthesisTitle'))}</h3><p>${esc(L(r.synthesis.agree))}</p><p>${esc(L(r.synthesis.tension))}</p>
    <p><em>${esc(L(r.synthesis.full))}</em></p>
    ${r.personality ? `<h3>${esc(t('portraitTitle'))} \u00B7 \u4EBA\u683C</h3>${r.personality.enneagram ? `<p>Enneagram ${r.personality.enneagram.core}w${r.personality.enneagram.wing} \u00B7 ${esc(L({ en: r.personality.enneagram.nameEn, zh: r.personality.enneagram.nameZh }))}</p>` : ''}${r.personality.mbti ? `<p>MBTI ${r.personality.mbti.type} \u00B7 ${esc(L({ en: r.personality.mbti.nickEn, zh: r.personality.mbti.nickZh }))}</p>` : ''}` : ''}
    <p class="small">${r.limits.map(esc).join(' ')}</p>`;
}

$('view-report-btn').addEventListener('click', () => { $('report-card').scrollIntoView({ behavior: 'smooth' }); });
$('resend-btn').addEventListener('click', async () => {
  const status = $('resend-status');
  status.textContent = t('readingGlimpse');
  try {
    const res = await fetch('/api/resend-report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(authParams()) });
    status.textContent = res.ok ? t('resendOk') : t('resendFail');
  } catch { status.textContent = t('resendFail'); }
});

/* --- Live Reader — voice in + voice out, typed fallback --- */
$('lr-ask').addEventListener('click', async () => {
  const q = $('lr-question').value.trim();
  if (!q) return;
  const box = $('lr-answers');
  try {
    const res = await fetch('/api/live-reader', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...authParams(), sessionId: state.sessionId, question: q, lang: state.lang }) });
    const data = await res.json();
    if (!res.ok) { box.innerHTML += `<p><strong>Live Reader:</strong> ${esc(data.error || t('couldNotRead'))}</p>`; return; }
    $('lr-used').textContent = data.questionsUsed;
    box.innerHTML += `<p><strong>You:</strong> ${esc(q)}</p><p><strong>Live Reader:</strong> ${esc(data.answer)}</p>`;
    $('lr-question').value = '';
    if ($('lr-speak').checked && 'speechSynthesis' in window) {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(data.answer);
      u.lang = state.lang === 'zh' ? 'zh-TW' : 'en-US';
      speechSynthesis.speak(u);
      $('lr-stop').classList.remove('hidden');
    }
  } catch (err) { box.innerHTML += `<p>Error: ${esc(err.message)}</p>`; }
});
$('lr-voice').addEventListener('click', () => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { alert(t('voiceUnsupported')); return; }
  const rec = new SR();
  rec.lang = state.lang === 'zh' ? 'zh-TW' : 'en-US';
  rec.onresult = (e) => { $('lr-question').value = e.results[0][0].transcript; };
  rec.start();
});
$('lr-stop').addEventListener('click', () => { speechSynthesis.cancel(); $('lr-stop').classList.add('hidden'); });

prefillForm(); // birth date, time, name, email survive a reload (bug 3)
loadPrice();
loadReport();
renderQuizList();
renderSystems(); // pre-glimpse preview: all six systems visible before any birth date is entered
