'use strict';
/* FateWeave frontend — NO secrets, NO unlock codes, NO payment verification here.
   Payment is verified on the server only. The browser only holds the random
   access token the server issued after a verified payment.
   Hook rule: free users see a card name + 1-2 lines per system, and blurred
   skeleton blocks for the rest. Full text only ever arrives via /api/report
   with a valid paid token — it is never in this file. */
// Dedicated system pages (7 Nov 2026): /bazi, /ziwei, /horoscope, /yijing,
// /tarot, /numerology, /portrait, /master. The server serves the same
// index.html shell with data-system + a theme class on <body>; app.js then
// renders ONLY that system (hero + its own interactions). null = hub.
const pageSystem = document.body.dataset.system || null;
const SYSTEMS = [
  { key: 'bazi', route: '/bazi', section: 'sys-bazi', name: 'Bazi 八字' },
  { key: 'ziwei', route: '/ziwei', section: 'sys-ziwei', name: 'Zi Wei 紫微' },
  { key: 'horoscope', route: '/horoscope', section: 'sys-horo', name: 'Horoscope 星座' },
  { key: 'yijing', route: '/yijing', section: 'sys-yijing', name: 'Yi-Jing 易经' },
  { key: 'tarot', route: '/tarot', section: 'sys-tarot', name: 'Tarot 塔罗' },
  { key: 'numerology', route: '/numerology', section: 'sys-num', name: 'Numerology 生命灵数' },
  { key: 'portrait', route: '/portrait', section: 'sys-portrait', name: 'Complete Portrait' },
];
/* Guided step flow (7 Nov 2026): hub → 1 Bazi → 2 Zi Wei → 3 Horoscope →
   4 Yi-Jing → 5 Tarot → 6 Numerology → 7 Portrait → 8 Master → hub.
   SYSTEMS covers steps 1–7; Master is step 8 (its content lives in
   #report-card's Live Reader + Ask the Master blocks, not in #systems). */
const STEP_ORDER = [
  ...SYSTEMS,
  { key: 'master', route: '/master', section: null, name: 'Ask the Master' },
];
const state = {
  lang: 'en', teaser: null, report: null, unlocked: false, price: null,
  mcExtended: false,
  sessionId: crypto.randomUUID(),
  revealed: {}, tarotFlipped: [false, false, false], ziweiCast: false, yijingCast: false,
  yijingLines: [], yijingCasting: false,
  quiz: { kind: null, questions: null, idx: 0, answers: [], result: null },
  quizCache: null,
  mcMessages: [], mcLeft: 5,
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
    masterChatTitle: 'Ask the Master',
    masterChatBody: 'Still wondering about something in your reading? Ask a follow-up — the Master answers from your own report, and remembers what you asked before.',
    followupsLeft: 'Follow-ups left',
    masterChatsLeft: 'Master chats left',
    aiBadge: 'AI Master',
    mcRuleBasedTag: 'Summary from your reading',
    chipExplain: 'What does that mean?', chipExample: 'Give me an example', chipDeeper: 'Tell me more about work',
    mcAskPh: 'Ask a follow-up…',
    masterChatNote: 'Follow-ups are answered from your own reading only — no predictions, and no medical, financial or legal advice.',
    masterChatExplainer: 'Ask the Master — 5 follow-up questions included with your unlock. Ask what a reply means, for an example, or to go deeper.',
    upgradeTitle: 'Want more than 5 follow-ups?',
    upgradeBody: 'Upgrade to Extended Master Chat for $3 — 30 Master chats in total, for the same 90 days as your reading.',
    upgradeBtn: 'Upgrade to Extended Master Chat — $3',
    upgradeExtended: 'Extended Master Chat',
    upgradeOffer: 'You have used all 5 follow-ups. Upgrade to Extended Master Chat for $3 — 30 chats in total.',
    upgradeDone: 'Extended Master Chat unlocked — 30 Master chats in total.',
    upgradeFail: 'Could not start the upgrade checkout. Please try again.',
    upgradePending: 'Your Extended Master Chat is being activated — if the counter still shows a limit, refresh this page in a moment.',
    skipToMaster: 'Skip to Master →',
    sysOpen: 'Open the full page',
    backToHub: '← All six systems',
    nextSystem: 'Next',
    hubNext: 'Start your reading — Next: Bazi →',
    stepOf: 'Step {n} of 8 — {name}',
    prevStep: '← Previous',
    nextStep: 'Next: {name} →',
    doneHub: 'Done — back to hub',
    allSystems: 'All six systems',
    masterLockedTitle: 'Ask the Master is locked',
    masterLockedBody: 'Unlock your full reading first — then come back here to ask the Master.',
    masterLockedLink: '← Back to the hub to unlock',
    tapEnlarge: 'Tap a flipped card again to enlarge it',
    heroLocked: 'Unlock the full reading to see your result here.',
    downloadReport: 'Download my report',
    downloadNote: 'If the report email never arrives, download it here instead — no email needed.',
    downloadFail: 'Could not download the report — open your full reading first, then try again.',
    resendSandbox: 'Email could not be sent to this address yet — the sender is still in test mode and can only email the account owner. Use Download my report below to get your report now.',
    mcLimit: 'You have used all 5 follow-ups for this session.',
    mcYou: 'You', mcMaster: 'The Master',
    questionsUsed: 'Questions used', ask: 'Ask', askPh: 'Ask a question\u2026', speakAnswer: 'Speak the answer aloud', stopSpeaking: 'Stop speaking',
    dailyTitle: 'Free daily encouragement', dailyBody: 'One short email at 7:00am SGT \u2014 a word of encouragement, a tarot card, and a line for your day. Free with your unlock. Unsubscribe anytime.',
    limitsTitle: 'Honest limits',
    limit1: 'Bazi is a simplified demo engine \u2014 no true solar-time correction yet.',
    limit2: 'Zi Wei content in the paid reading is illustrative sample content, not a fully computed chart.',
    limit3: 'For self-reflection and entertainment only \u2014 not medical, financial or legal advice.',
    limit4: 'Moon / Rising are approximations from the original prototype.',
    moreDetail: 'More detail', strongest: 'Strongest', weakest: 'Weakest',
    tapReveal: 'Tap to reveal', tapFlip: 'Tap a card to flip it', castChart: 'Cast the chart', castCoins: 'Cast the coins',
    lockedTitle: 'Full reading locked', lockedBody: 'Unlock the full reading to read every detail.',
    unlockBtn: 'Unlock full reading', casting: 'Casting\u2026', flipping: 'Tap to flip', flipAllTarot: 'Flip all three cards to read them as one story.',
    readingGlimpse: 'Reading your glimpse\u2026', enterDateFirst: 'Enter your birth date in the free glimpse form first.',
    couldNotRead: 'Could not read that birth date.', networkError: 'Network error: ',
    masterUnreachable: 'The Master couldn\u2019t be reached just now \u2014 please try again in a moment.',
    aiRestingNote: 'The AI Master is resting briefly after a hiccup \u2014 answers for now are summaries from your reading. Try again in a few minutes.',
    unreachable: 'Couldn\u2019t be reached just now \u2014 please try again in a moment.',
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
    sun: 'Sun', moon: 'Moon', rising: 'Rising', lifePath: 'Life Path', destiny: 'Destiny', personalYear: 'Personal Year',
    dayMaster: 'Day Master', lifePalace: 'Life Palace', hexagram: 'Hexagram', changingLines: 'Changing lines',
    overview: 'Overview', strengthsSec: 'Strengths', challengesSec: 'Challenges / growing edge', careerSec: 'Career', relationshipsSec: 'Relationships', healthSec: 'Health & energy', timingSec: 'Timing',
    growthEdge: 'Growing edge', practices: 'Practices for the next 90 days', style: 'How you think, work & connect',
    think: 'How you think', work: 'How you work', connect: 'How you connect',
  },
  zh: {
    tagline: '\u8f93\u5165\u4e00\u6b21\u751f\u65e5\uff0c\u516d\u4e2a\u7cfb\u7edf\u540c\u65f6\u56de\u7b54\u3002\u5b83\u4eec\u8bf4\u7684\u4e00\u6837\u5417\uff1f',
    masterLine: '\u300c\u6211\u4e0d\u7b97\u547d\uff0c\u53ea\u628a\u516d\u4e2a\u7cfb\u7edf\u6446\u5728\u4e00\u8d77\u2014\u2014\u770b\u5b83\u4eec\u5728\u54ea\u91cc\u8bf4\u7684\u4e00\u6837\u3002\u300d\u2014\u2014 \u638c\u95e8',
    hookTitle: '\u4f60\u7684\u514d\u8d39\u4e00\u77a5', hookLede: '\u8f93\u5165\u751f\u65e5\uff0c\u7136\u540e\u9010\u5f20\u70b9\u5f00\u6bcf\u4e00\u4e2a\u7cfb\u7edf\uff0c\u770b\u4e00\u70b9\u70b9\u5185\u5bb9\u3002\u5b8c\u6574\u62a5\u544a\u9700\u4ed8\u6b3e\u540e\u89e3\u9501\u3002',
    birthDate: '\u51fa\u751f\u65e5\u671f', birthTime: '\u51fa\u751f\u65f6\u95f4\uff08\u53ef\u9009\uff09', name: '\u540d\u5b57\uff08\u53ef\u9009\uff09', hookCta: '\u67e5\u770b\u6211\u7684\u514d\u8d39\u4e00\u77a5',
    quizTitle: '\u8ba4\u8bc6\u81ea\u5df1\u2014\u2014\u4e24\u4e2a\u6d4b\u9a8c', quizLede: '\u514d\u8d39\u505a\u2014\u2014\u8fd9\u4e5f\u662f\u9884\u89c8\u7684\u4e00\u90e8\u5206\u3002\u4f60\u4f1a\u5373\u65f6\u770b\u5230\u4f60\u7684\u7c7b\u578b\u4e0e\u4e00\u53e5\u8bdd\uff1b\u5b8c\u6574\u89e3\u6790\u968f\u62a5\u544a\u89e3\u9501\u3002',
    unlockedTitle: '\u4f60\u7684\u62a5\u544a\u5df2\u89e3\u9501', viewReport: '\u67e5\u770b\u5b8c\u6574\u62a5\u544a', resendReport: '\u91cd\u5bc4\u62a5\u544a\u7535\u90ae',
    unlockedBanner: '\u2713 \u5df2\u89e3\u9501\u2014\u2014\u65e0\u9700\u518d\u6b21\u4ed8\u6b3e',
    unlockedBannerSub: '\u5b8c\u6574\u62a5\u544a\u5df2\u5728\u4e0b\u65b9\u5f00\u542f\uff0c\u5e76\u4fdd\u5b58\u5728\u6b64\u88c5\u7f6e\u2014\u2014\u968f\u65f6\u91cd\u65b0\u6574\u7406\uff0c\u4e0d\u7528\u518d\u8f93\u5165\u4efb\u4f55\u8d44\u6599\u3002',
    unlockTitle: '\u89e3\u9501\u5b8c\u6574\u62a5\u544a',
    unlockBody: '\u5148\u4ed8\u6b3e\uff0c\u5b8c\u6574\u5185\u5bb9\u968f\u5373\u5f00\u542f\u2014\u2014\u516d\u4e2a\u7cfb\u7edf\u5168\u90e8\u3001Live Reader\uff083 \u4e2a\u95ee\u9898\uff09\uff0c\u4ee5\u53ca\u8be6\u7ec6\u62a5\u544a\u5bc4\u5230\u4f60\u7684\u4fe1\u7bb1\u3002',
    emailLabel: '\u7535\u90ae\uff08\u63a5\u6536\u62a5\u544a\u4e0e\u6bcf\u65e5\u9f13\u52b1\uff09', sameDateNote: '\u8bf7\u7528\u4e0e\u514d\u8d39\u4e00\u77a5\u76f8\u540c\u7684\u51fa\u751f\u65e5\u671f\uff0c\u4ee5\u53ca\u76f8\u540c\u7684\u7535\u90ae\uff0c\u4ee5\u4fbf\u65e5\u540e\u56de\u6765\u67e5\u770b\u3002',
    fullReadingTitle: '\u4f60\u7684\u5b8c\u6574\u62a5\u544a', liveReaderTitle: 'Live Reader',
    liveReaderBody: '\u6700\u591a\u95ee 3 \u4e2a\u95ee\u9898\uff0c\u53ef\u7528\u8bed\u97f3\u6216\u6253\u5b57\u3002\u56de\u7b54\u53ea\u6839\u636e\u4f60\u7684\u62a5\u544a\u5185\u5bb9\u3002',
    masterChatTitle: '\u95ee\u638c\u95e8',
    masterChatBody: '\u62a5\u544a\u91cc\u8fd8\u6709\u4e0d\u660e\u767d\u7684\u5730\u65b9\uff1f\u63a5\u7740\u95ee\u2014\u2014\u638c\u95e8\u53ea\u6839\u636e\u4f60\u81ea\u5df1\u7684\u62a5\u544a\u56de\u7b54\uff0c\u4e5f\u8bb0\u5f97\u4f60\u4e4b\u524d\u95ee\u8fc7\u4ec0\u4e48\u3002',
    followupsLeft: '\u5269\u4f59\u8ffd\u95ee\u6b21\u6570',
    masterChatsLeft: '\u638c\u95e8\u8ffd\u95ee\u8fd8\u5269',
    aiBadge: 'AI \u638c\u95e8',
    mcRuleBasedTag: '\u6839\u636e\u4f60\u7684\u62a5\u544a\u6574\u7406',
    chipExplain: '\u8fd9\u662f\u4ec0\u4e48\u610f\u601d\uff1f', chipExample: '\u4e3e\u4e2a\u4f8b\u5b50', chipDeeper: '\u591a\u8bf4\u4e00\u70b9\u5de5\u4f5c',
    mcAskPh: '\u95ee\u4e00\u4e2a\u8ffd\u95ee\u2026\u2026',
    masterChatNote: '\u8ffd\u95ee\u53ea\u6839\u636e\u4f60\u81ea\u5df1\u7684\u62a5\u544a\u56de\u7b54\u2014\u2014\u6ca1\u6709\u9884\u6d4b\uff0c\u4e5f\u4e0d\u7ed9\u533b\u7597\u3001\u8d22\u52a1\u6216\u6cd5\u5f8b\u5efa\u8bae\u3002',
    masterChatExplainer: '\u95ee\u638c\u95e8\u2014\u2014\u89e3\u9501\u5305\u542b 5 \u6b21\u8ffd\u95ee\u3002\u95ee\u95ee\u67d0\u4e2a\u56de\u7b54\u662f\u4ec0\u4e48\u610f\u601d\u3001\u8981\u4e00\u4e2a\u4f8b\u5b50\uff0c\u6216\u8005\u5f80\u6df1\u91cc\u804a\u3002',
    upgradeTitle: '\u60f3\u8981\u8d85\u8fc7 5 \u6b21\u8ffd\u95ee\uff1f',
    upgradeBody: '\u82b1 $3 \u5347\u7ea7\u4e3a\u52a0\u957f\u638c\u95e8\u8ffd\u95ee\u2014\u201490 \u5929\u5185\u5171 30 \u6b21\u8ffd\u95ee\uff0c\u4e0e\u62a5\u544a\u6709\u6548\u671f\u76f8\u540c\u3002',
    upgradeBtn: '\u5347\u7ea7\u4e3a\u52a0\u957f\u638c\u95e8\u8ffd\u95ee \u2014 $3',
    upgradeExtended: '\u52a0\u957f\u638c\u95e8\u8ffd\u95ee',
    upgradeOffer: '5 \u6b21\u8ffd\u95ee\u5df2\u7ecf\u7528\u5b8c\u3002\u82b1 $3 \u5347\u7ea7\u4e3a\u52a0\u957f\u638c\u95e8\u8ffd\u95ee\uff0c\u5171 30 \u6b21\uff0c\u7ee7\u7eed\u95ee\u4e0b\u53bb\u3002',
    upgradeDone: '\u52a0\u957f\u638c\u95e8\u8ffd\u95ee\u5df2\u89e3\u9501\u2014\u2014\u5171 30 \u6b21\u3002',
    upgradeFail: '\u65e0\u6cd5\u5f00\u59cb\u5347\u7ea7\u7ed3\u8d26\uff0c\u8bf7\u518d\u8bd5\u4e00\u6b21\u3002',
    upgradePending: '\u52a0\u957f\u638c\u95e8\u8ffd\u95ee\u6b63\u5728\u5f00\u901a\u4e2d\u2014\u2014\u5982\u679c\u8ba1\u6570\u4ecd\u663e\u793a\u4e0a\u9650\uff0c\u8bf7\u7a0d\u540e\u5237\u65b0\u672c\u9875\u3002',
    skipToMaster: '\u76f4\u63a5\u53bb\u627e\u638c\u95e8 \u2192',
    sysOpen: '打开完整页面',
    backToHub: '← 回到六个系统',
    nextSystem: '下一个',
    hubNext: '开始阅读 — 下一个：八字 →',
    stepOf: '第 {n} 步，共 8 步 — {name}',
    prevStep: '← 上一步',
    nextStep: '下一个：{name} →',
    doneHub: '完成 — 回到首页',
    allSystems: '全部六个系统',
    masterLockedTitle: '问掌门尚未解锁',
    masterLockedBody: '请先解锁完整报告，再回来问掌门。',
    masterLockedLink: '← 回到首页解锁',
    tapEnlarge: '\u518d\u70b9\u4e00\u4e0b\u5df2\u7ffb\u5f00\u7684\u724c\uff0c\u53ef\u4ee5\u653e\u5927\u67e5\u770b',
    heroLocked: '\u89e3\u9501\u5b8c\u6574\u62a5\u544a\uff0c\u5373\u53ef\u5728\u8fd9\u91cc\u770b\u5230\u4f60\u7684\u7ed3\u679c\u3002',
    downloadReport: '\u4e0b\u8f7d\u6211\u7684\u62a5\u544a',
    downloadNote: '\u5982\u679c\u62a5\u544a\u90ae\u4ef6\u4e00\u76f4\u6536\u4e0d\u5230\uff0c\u5c31\u5728\u8fd9\u91cc\u4e0b\u8f7d\u2014\u2014\u4e0d\u7528\u7b49\u90ae\u4ef6\u3002',
    downloadFail: '\u4e0b\u8f7d\u5931\u8d25\u2014\u2014\u8bf7\u5148\u6253\u5f00\u5b8c\u6574\u62a5\u544a\uff0c\u518d\u8bd5\u4e00\u6b21\u3002',
    resendSandbox: '\u8fd9\u4e2a\u90ae\u7bb1\u6682\u65f6\u6536\u4e0d\u5230\u62a5\u544a\u2014\u2014\u53d1\u4ef6\u4eba\u4ecd\u5728\u6d4b\u8bd5\u6a21\u5f0f\uff0c\u53ea\u80fd\u53d1\u7ed9\u8d26\u53f7\u672c\u4eba\u7684\u90ae\u7bb1\u3002\u8bf7\u7528\u4e0b\u9762\u7684\u201c\u4e0b\u8f7d\u6211\u7684\u62a5\u544a\u201d\u76f4\u63a5\u83b7\u53d6\u62a5\u544a\u3002',
    mcLimit: '\u672c\u6b21\u7684 5 \u6b21\u8ffd\u95ee\u5df2\u7ecf\u7528\u5b8c\u3002',
    mcYou: '\u4f60', mcMaster: '\u638c\u95e8',
    questionsUsed: '\u5df2\u7528\u95ee\u9898', ask: '\u63d0\u95ee', askPh: '\u95ee\u4e00\u4e2a\u95ee\u9898\u2026\u2026', speakAnswer: '\u5927\u58f0\u8bfb\u51fa\u7b54\u6848', stopSpeaking: '\u505c\u6b62\u6717\u8bfb',
    dailyTitle: '\u514d\u8d39\u6bcf\u65e5\u9f13\u52b1', dailyBody: '\u6bcf\u5929\u65e9\u4e0a 7:00\uff08\u65b0\u52a0\u5761\u65f6\u95f4\uff09\u4e00\u5c01\u77ed\u4fe1\u2014\u2014\u4e00\u53e5\u9f13\u52b1\u3001\u4e00\u5f20\u5854\u7f57\u724c\u3001\u4e00\u53e5\u4eca\u65e5\u63d0\u9192\u3002\u89e3\u9501\u540e\u514d\u8d39\uff0c\u968f\u65f6\u53ef\u4ee5\u53d6\u6d88\u8ba2\u9605\u3002',
    limitsTitle: '\u8bda\u5b9e\u8bf4\u660e',
    limit1: '\u516b\u5b57\u4e3a\u7b80\u5316\u6f14\u793a\u5f15\u64ce\u2014\u2014\u5c1a\u672a\u505a\u771f\u592a\u9633\u65f6\u6821\u6b63\u3002',
    limit2: '\u4ed8\u8d39\u62a5\u544a\u4e2d\u7684\u7d2b\u5fae\u5185\u5bb9\u4e3a\u793a\u8303\u6837\u672c\uff0c\u5e76\u975e\u5b8c\u6574\u6392\u76d8\u3002',
    limit3: '\u4ec5\u4f9b\u81ea\u6211\u53cd\u601d\u4e0e\u5a31\u4e50\u2014\u2014\u4e0d\u662f\u533b\u7597\u3001\u8d22\u52a1\u6216\u6cd5\u5f8b\u5efa\u8bae\u3002',
    limit4: '\u6708\u4eae\u4e0e\u4e0a\u5347\u661f\u5ea7\u4e3a\u539f\u578b\u7684\u8fd1\u4f3c\u8ba1\u7b97\u3002',
    moreDetail: '\u66f4\u591a\u8be6\u60c5', strongest: '\u6700\u65fa', weakest: '\u6700\u5f31',
    tapReveal: '\u70b9\u4e00\u4e0b\u63ed\u5f00', tapFlip: '\u70b9\u4e00\u5f20\u724c\u7ffb\u5f00\u5b83', castChart: '\u8d77\u76d8', castCoins: '\u63b7\u5366',
    lockedTitle: '\u5b8c\u6574\u5185\u5bb9\u672a\u89e3\u9501', lockedBody: '\u89e3\u9501\u5b8c\u6574\u62a5\u544a\uff0c\u5373\u53ef\u9605\u8bfb\u5168\u90e8\u7ec6\u8282\u3002',
    unlockBtn: '\u89e3\u9501\u5b8c\u6574\u62a5\u544a', casting: '\u8d77\u5366\u4e2d\u2026\u2026', flipping: '\u70b9\u4e00\u4e0b\u7ffb\u724c', flipAllTarot: '\u7ffb\u5f00\u4e09\u5f20\u724c\uff0c\u770b\u770b\u5b83\u4eec\u5408\u8d77\u6765\u8bf4\u7684\u6545\u4e8b\u3002',
    readingGlimpse: '\u6b63\u5728\u8bfb\u53d6\u4f60\u7684\u9884\u89c8\u2026\u2026', enterDateFirst: '\u8bf7\u5148\u5728\u514d\u8d39\u4e00\u77a5\u8868\u5355\u8f93\u5165\u51fa\u751f\u65e5\u671f\u3002',
    couldNotRead: '\u65e0\u6cd5\u8bfb\u53d6\u8be5\u51fa\u751f\u65e5\u671f\u3002', networkError: '\u7f51\u7edc\u9519\u8bef\uff1a',
    masterUnreachable: '\u638c\u95e8\u6682\u65f6\u8054\u7cfb\u4e0d\u4e0a\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002',
    aiRestingNote: 'AI \u638c\u95e8\u521a\u624d\u51fa\u4e86\u4e00\u70b9\u5c0f\u72b6\u51b5\uff0c\u6b63\u5728\u77ed\u6682\u4f11\u606f\u2014\u2014\u4e0b\u9762\u7684\u56de\u7b54\u5148\u662f\u6839\u636e\u4f60\u7684\u62a5\u544a\u6574\u7406\u7684\u6458\u8981\u3002\u51e0\u5206\u949f\u540e\u518d\u8bd5\u3002',
    unreachable: '\u6682\u65f6\u8054\u7cfb\u4e0d\u4e0a\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002',
    payUnlock: '\u4ed8\u6b3e\u5e76\u89e3\u9501', priceUnavailable: '\u6682\u65f6\u65e0\u6cd5\u53d6\u5f97\u4ef7\u683c\u2014\u2014\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002',
    questions: '\u9898', questionOf: '\u7b2c', of: '/', back: '\u2190 \u4e0a\u4e00\u9898', restart: '\u91cd\u65b0\u6d4b\u9a8c',
    startQuiz: '\u5f00\u59cb\u6d4b\u9a8c', retake: '\u91cd\u65b0\u6d4b\u9a8c', yourType: '\u4f60\u7684\u7c7b\u578b', fullBreakdownLocked: '\u5b8c\u6574\u89e3\u6790\u672a\u89e3\u9501\u2014\u2014\u89e3\u9501\u540e\u53ef\u9605\u8bfb\u3002',
    strengths: '\u957f\u5904', whatsLacking: '\u5c1a\u7f3a\u4e4b\u5904', yourResult: '\u4f60\u7684\u7ed3\u679c',
    resendOk: '\u62a5\u544a\u7535\u90ae\u5df2\u91cd\u5bc4\u2014\u2014\u8bf7\u68c0\u67e5\u6536\u4ef6\u7bb1\u3002', resendFail: '\u65e0\u6cd5\u91cd\u5bc4\u62a5\u544a\u7535\u90ae\u3002',
    checkoutFail: '\u7ed3\u5e10\u5931\u8d25\u3002', checkoutError: '\u7ed3\u5e10\u9519\u8bef\uff1a',
    voiceUnsupported: '\u6b64\u6d4f\u89c8\u5668\u4e0d\u652f\u63f4\u8bed\u97f3\u8f93\u5165\u2014\u2014\u8bf7\u6253\u5b57\u63d0\u95ee\u3002',
    portraitTitle: '\u5b8c\u6574\u8096\u50cf', synthesisTitle: '\u516d\u4e2a\u7cfb\u7edf\u4e00\u81f4\u4e4b\u5904\u2014\u2014\u4ee5\u53ca\u5f20\u529b\u6240\u5728',
    sampleNote: '\u793a\u8303\u6837\u672c\u5185\u5bb9\uff0c\u5e76\u975e\u5b8c\u6574\u8ba1\u7b97\u3002',
    simplifiedNote: '\u7b80\u5316\u5f15\u64ce\u2014\u2014\u5c1a\u672a\u505a\u771f\u592a\u9633\u65f6\u6821\u6b63\u3002',
    reversed: '\u9006\u4f4d', past: '\u8fc7\u53bb', present: '\u73b0\u5728', path: '\u8fd1\u671f\u672a\u6765',
    sysDescBazi: '\u516b\u5b57\u547d\u76d8\u2014\u2014\u4ece\u51fa\u751f\u5e74\u3001\u6708\u3001\u65e5\u3001\u65f6\u770b\u65e5\u4e3b\u3001\u4e94\u884c\u4e0e\u8fd0\u52bf\u3002',
    sysDescZiwei: '\u7d2b\u5fae\u6597\u6570\u2014\u2014\u547d\u5bab\u4e0e\u8d22\u5e1b\u3001\u5b98\u7984\u3001\u592b\u59bb\u7b49\u5bab\u4f4d\u3002',
    sysDescHoro: '\u897f\u6d0b\u5360\u661f\u2014\u2014\u592a\u9633\u3001\u6708\u4eae\u4e0e\u4e0a\u5347\u661f\u5ea7\u3002',
    sysDescYijing: '\u6613\u7ecf\u2014\u2014\u516d\u6b21\u63b7\u5e01\uff0c\u9010\u723b\u6210\u5366\u3002',
    sysDescTarot: '\u5854\u7f57\u2014\u2014\u4e09\u5f20\u724c\uff1a\u8fc7\u53bb\u3001\u73b0\u5728\u4e0e\u672a\u6765\u4e4b\u8def\u3002',
    sysDescNum: '\u751f\u547d\u7075\u6570\u2014\u2014\u751f\u547d\u7075\u6570\u3001\u547d\u8fd0\u6570\u4e0e\u4e2a\u4eba\u5e74\u3002',
    sysDescPortrait: '\u5b8c\u6574\u8096\u50cf\u2014\u2014\u516d\u4e2a\u7cfb\u7edf\u4ea4\u7ec7\u800c\u6210\uff0c\u770b\u5b83\u4eec\u5728\u54ea\u91cc\u4e00\u81f4\u3001\u5728\u54ea\u91cc\u62c9\u626f\u3002',
    yijingHow: '\u516d\u6b21\u63b7\u5e01\uff0c\u9010\u723b\u6210\u5366\uff0c\u7531\u4e0b\u800c\u4e0a\u3002',
    castingLine: '\u6b63\u5728\u63b7\u7b2c {n} \u723b\uff0c\u5171 6 \u723b\u2026',
    lineLabel: '\u7b2c {n} \u723b',
    solidLine: '\u9633\u723b\uff08\u5b9e\u7ebf\uff09',
    brokenLine: '\u9634\u723b\uff08\u65ad\u7ebf\uff09',
    changingLine: '\u53d8\u723b',
    heads: '\u9633', tails: '\u9634',
    sun: '\u592a\u9633', moon: '\u6708\u4eae', rising: '\u4e0a\u5347', lifePath: '\u751f\u547d\u7075\u6570', destiny: '\u547d\u8fd0\u6570', personalYear: '\u4e2a\u4eba\u5e74',
    dayMaster: '\u65e5\u4e3b', lifePalace: '\u547d\u5bab', hexagram: '\u5366\u8c61', changingLines: '\u53d8\u723b',
    overview: '\u603b\u89c8', strengthsSec: '\u957f\u5904', challengesSec: '\u6311\u6218 / \u6210\u957f\u8fb9\u7f18', careerSec: '\u4e8b\u4e1a', relationshipsSec: '\u611f\u60c5\u4e0e\u5173\u7cfb', healthSec: '\u5065\u5eb7\u4e0e\u7cbe\u529b', timingSec: '\u65f6\u673a',
    growthEdge: '\u6210\u957f\u8fb9\u7f18', practices: '\u672a\u6765 90 \u5929\u7684\u7ec3\u4e60', style: '\u4f60\u5982\u4f55\u601d\u8003\u3001\u5de5\u4f5c\u4e0e\u8fde\u7ed3',
    think: '\u5982\u4f55\u601d\u8003', work: '\u5982\u4f55\u5de5\u4f5c', connect: '\u5982\u4f55\u8fde\u7ed3',
  },
};

// Element names, localised (item B) — the Bazi element bar used to render
// the raw English keys (wood/fire/earth/metal/water) on the Chinese page.
const EL_NAMES = {
  en: { wood: 'Wood', fire: 'Fire', earth: 'Earth', metal: 'Metal', water: 'Water' },
  zh: { wood: '\u6728', fire: '\u706b', earth: '\u571f', metal: '\u91d1', water: '\u6c34' },
};
// Tarot keywords in the page language (the server now sends keywordsZh).
// Real tarot pictures (Task 3, 7 Nov 2026): the front of a flipped card
// shows the actual Rider-Waite picture (local file, /tarot/xx-name.jpg),
// rotated 180° when reversed. If the image field is ever missing for a
// card, fall back to the drawn symbol medallion for that card only.
function tarotFrontArt(c) {
  if (c.image) return `<img class="card-img${c.reversed ? ' rev' : ''}" src="${esc(c.image)}" alt="${esc(L(c.name))}" loading="lazy">`;
  return `<div class="card-art"><span class="card-emoji">${esc(c.emoji)}</span></div>`;
}
function tarotKeywords(c) {
  if (!c) return '';
  return c.keywordsZh ? L({ en: c.keywords, zh: c.keywordsZh }) : (c.keywords || '');
}

const t = (k) => STR[state.lang][k] || STR.en[k] || k;
const L = (o) => (o && typeof o === 'object' ? (state.lang === 'zh' ? o.zh || o.en : o.en || o.zh) : o);
const esc = (x) => String(x ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const $ = (id) => document.getElementById(id);

function setLang(lang) {
  state.lang = lang;
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  document.querySelectorAll('[data-i18n]').forEach((el) => { if (STR[lang][el.dataset.i18n]) el.textContent = STR[lang][el.dataset.i18n]; });
  document.querySelectorAll('[data-i18n-ph]').forEach((el) => { if (STR[lang][el.dataset.i18nPh]) el.placeholder = STR[lang][el.dataset.i18nPh]; });
  $('lang-en').classList.toggle('active', lang === 'en');
  $('lang-zh').classList.toggle('active', lang === 'zh');
  renderSystems(); renderQuizList(); renderReportCard(); renderMcThread(); renderMcCounter();
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
// Visual-first (item C): the first section (usually Overview) stays visible;
// the rest collapse into a <details> so the page is not a wall of text.
function sectionHTML(sections, keys) {
  if (!sections) return '';
  const label = { overview: 'overview', strengths: 'strengthsSec', challenges: 'challengesSec', career: 'careerSec', relationships: 'relationshipsSec', health: 'healthSec', timing: 'timingSec' };
  const list = (keys || ['overview', 'strengths', 'challenges', 'career', 'relationships', 'health', 'timing']).filter((k) => sections[k]);
  if (!list.length) return '';
  const render = (k) => `<h3>${esc(t(label[k]))}</h3><p>${esc(L(sections[k]))}</p>`;
  const first = list[0], rest = list.slice(1);
  let html = render(first);
  if (rest.length) html += `<details class="more"><summary>${esc(t('moreDetail'))}</summary>${rest.map(render).join('')}</details>`;
  return html;
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
  html += `<section class="card" id="sys-bazi">${sysHead('\uD83C\uDF3F', 'Bazi \u516b\u5b57')}<p class="lede sys-desc">${esc(t('sysDescBazi'))}</p>${revealCover('\uD83C\uDF3F', `${t('tapReveal')} \u2014 ${t('dayMaster')}`, t('enterDateFirst'))}</section>`;
  html += `<section class="card" id="sys-ziwei">${sysHead('\u2B50', 'Zi Wei \u7d2b\u5fae\u6597\u6570')}<p class="lede sys-desc">${esc(t('sysDescZiwei'))}</p><p class="lede">${esc(t('lifePalace'))} \u00B7 ${esc(L({ en: 'Tian Ji', zh: '\u5929\u673a' }))}</p><button type="button" data-preview="ziwei">\u2728 ${esc(t('castChart'))}</button></section>`;
  html += `<section class="card" id="sys-horo">${sysHead('\uD83C\uDF19', 'Horoscope \u661f\u5ea7')}<p class="lede sys-desc">${esc(t('sysDescHoro'))}</p>${revealCover('\uD83C\uDF19', `${t('tapReveal')} \u2014 ${t('sun')}`, t('enterDateFirst'))}</section>`;
  html += `<section class="card" id="sys-yijing">${sysHead('\u262F\uFE0F', 'Yi-Jing \u6613\u7ecf')}<p class="lede sys-desc">${esc(t('sysDescYijing'))}</p><p class="lede">${esc(t('yijingHow'))}</p><button type="button" data-preview="yijing">\uD83E\uDE99 ${esc(t('castCoins'))}</button></section>`;
  html += `<section class="card" id="sys-tarot">${sysHead('\uD83C\uDCCF', 'Tarot \u5854\u7f57')}<p class="lede sys-desc">${esc(t('sysDescTarot'))}</p><p class="lede">${esc(t('tapFlip'))}</p><div class="tarot-row">${['past', 'present', 'path'].map((p) => `<div><div class="tarot-card" data-preview="tarot" role="button" tabindex="0" aria-label="${esc(t('tapFlip'))}"><div class="tarot-inner"><div class="tarot-face tarot-back"><div class="star">\u2726</div><p>${esc(t('flipping'))}</p></div></div></div><p class="tarot-pos">${esc(t(p))}</p></div>`).join('')}</div></section>`;
  html += `<section class="card" id="sys-num">${sysHead('\uD83D\uDD22', 'Numerology \u751f\u547d\u7075\u6570')}<p class="lede sys-desc">${esc(t('sysDescNum'))}</p>${revealCover('\uD83D\uDD22', `${t('tapReveal')} \u2014 ${t('lifePath')}`, t('enterDateFirst'))}</section>`;
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

/* --- Dedicated system pages: hero, nav, section filtering ----------------
   The hero is the big title + the buyer's own key result, large, with its
   graphic — e.g. Horoscope: big "Cancer" + ♋; Numerology: the Life Path
   number huge; Bazi: the Day Master large. Before any glimpse (no teaser)
   the hero shows the system name + a locked line only — no computed
   result leaks, because the result only ever comes from /api/hook (teaser)
   or /api/report (paid token), exactly as on the hub. */
const SYS_META = {
  bazi: { title: 'Bazi 八字', descKey: 'sysDescBazi' },
  ziwei: { title: 'Zi Wei 紫微', descKey: 'sysDescZiwei' },
  horoscope: { title: 'Horoscope 星座', descKey: 'sysDescHoro' },
  yijing: { title: 'Yi-Jing 易经', descKey: 'sysDescYijing' },
  tarot: { title: 'Tarot 塔罗', descKey: 'sysDescTarot' },
  numerology: { title: 'Numerology 生命灵数', descKey: 'sysDescNum' },
  portrait: { title: 'Complete Portrait', descKey: 'sysDescPortrait' },
  master: { title: 'Ask the Master', descKey: 'masterChatExplainer' },
};
function heroResultHTML(key) {
  const src = state.unlocked && state.report ? state.report : state.teaser;
  if (!src) return `<p class="hero-sub">${esc(t('heroLocked'))}</p>`;
  const r = state.report;
  const unlocked = state.unlocked && !!r;
  switch (key) {
    case 'bazi': {
      const dm = unlocked ? r.bazi.dayMaster : { en: src.bazi.dayMaster, zh: src.bazi.dayMasterZh };
      return `<div class="hero-result">${esc(L(dm))}</div><p class="hero-sub">${esc(L(unlocked ? r.bazi.dayMasterText : src.bazi.hook))}</p>`;
    }
    case 'ziwei': {
      const pal = unlocked ? r.ziwei.palaces[0] : null;
      return `<div class="hero-result">★ ${esc(unlocked ? L(pal.star) : L({ en: 'Tian Ji', zh: '天机' }))}</div><p class="hero-sub">${esc(L({ en: 'Tian Ji Palace', zh: '天机宫' }))} · ${esc(L(unlocked ? pal.text : src.ziwei.hook))}</p>`;
    }
    case 'horoscope': {
      const sun = unlocked ? r.horoscope.sun : { en: src.horoscope.sunSign, zh: src.horoscope.sunSignZh, symbol: '☉' };
      return `<div class="hero-result"><span class="hero-glyph">${esc(sun.symbol || '☉')}</span> ${esc(L(sun))}</div><p class="hero-sub">${esc(L(unlocked ? r.horoscope.sun.trait : src.horoscope.hook))}</p>${unlocked ? `<p class="hero-sub">${esc(r.horoscope.moon.symbol)} ${esc(t('moon'))}: ${esc(L(r.horoscope.moon))} &nbsp;·&nbsp; ${esc(r.horoscope.rising.symbol)} ${esc(t('rising'))}: ${esc(L(r.horoscope.rising))}</p>` : ''}`;
    }
    case 'yijing': {
      const hex = unlocked ? r.yijing.hexagram : src.yijing.hexagram;
      return `<div class="hero-result">${esc(hex)}</div><p class="hero-sub">${esc(L(unlocked ? r.yijing.theme : src.yijing.hook))}</p>`;
    }
    case 'tarot': {
      const cards = unlocked ? r.tarot.cardsDetailed : src.tarot.cards;
      return `<div class="hero-result">${esc(cards.map((c) => L(c.name)).join(' · '))}</div><p class="hero-sub">${esc(t('tapFlip'))} · ${esc(t('tapEnlarge'))}</p>`;
    }
    case 'numerology': {
      const lp = unlocked ? r.numerology.lifePath : src.numerology.lifePath;
      return `<div class="hero-num">${lp}</div><div class="hero-result">${esc(t('lifePath'))}</div><p class="hero-sub">${esc(L(unlocked ? r.numerology.lifePathText : src.numerology.hook))}</p>`;
    }
    case 'portrait':
      return `<p class="hero-sub essence">${esc(L(src.portrait.essenceLine))}</p>`;
    case 'master':
      return `<p class="hero-sub">${esc(t('masterChatExplainer'))}</p>`;
    default:
      return '';
  }
}
function pageHeroHTML() {
  if (!pageSystem) return '';
  const meta = SYS_META[pageSystem];
  if (!meta) return '';
  return `<div class="sys-hero"><h1 class="sys-hero-title">${esc(meta.title)}</h1><p class="lede">${esc(t(meta.descKey))}</p>${heroResultHTML(pageSystem)}</div>`;
}
function pageNavHTML() {
  if (!pageSystem) return '';
  const idx = SYSTEMS.findIndex((s) => s.key === pageSystem);
  const next = idx >= 0 ? SYSTEMS[(idx + 1) % SYSTEMS.length] : null;
  return `<nav class="sys-nav"><a href="/">${esc(t('backToHub'))}</a>${next ? `<a href="${next.route}">${esc(t('nextSystem'))}: ${esc(next.name)} →</a>` : ''}${pageSystem !== 'master' ? `<a href="/master">${esc(t('masterChatTitle'))} →</a>` : ''}</nav>`;
}
/* --- Guided step flow: page isolation (7 Nov 2026) -------------------------
   The shell (index.html) carries every section, so each page must show
   only its own slice — otherwise a system page shows the hub hero, the
   quiz, the unlock card, the full-reading summary, Live Reader, Ask the
   Master, daily encouragement and honest limits underneath its own hero,
   and the buyer has to hit Back / scroll. applyPageLayout() runs at init
   and after every renderSystems() / loadReport(), so the layout follows
   both the route and the state (locked/unlocked, glimpse shown). Rules:
   - Hub: brand hero, hook form, system overview cards, unlock card
     (while locked) / unlocked card (once unlocked), daily + limits.
     NO quizzes, NO full-reading summary, NO Live Reader / Ask the Master.
     After a glimpse, a big "Start your reading — Next: Bazi →" button.
   - System page: ONLY that system (hero + its own content + its own
     control). The unlock card stays ONLY while locked; the unlocked card
     never appears here. Quizzes live on Portrait only. Brand hero, hook
     form, daily + limits are hidden.
   - Master: ONLY Live Reader + Ask the Master (from #report-card, never
     the full-reading summary div). While locked: a locked prompt + a
     link back to the hub instead of the chat. */
function stepNavHTML() {
  if (!pageSystem) return '';
  const idx = STEP_ORDER.findIndex((s) => s.key === pageSystem);
  if (idx < 0) return '';
  const stepName = SYS_META[pageSystem].title;
  const progress = esc(t('stepOf').replace('{n}', String(idx + 1)).replace('{name}', stepName));
  const prev = idx === 0
    ? `<a class="step-btn prev" href="/">${esc(t('backToHub'))}</a>`
    : `<a class="step-btn prev" href="${STEP_ORDER[idx - 1].route}">${esc(t('prevStep'))}</a>`;
  const next = idx === STEP_ORDER.length - 1
    ? `<a class="step-btn next" href="/">${esc(t('doneHub'))}</a>`
    : `<a class="step-btn next" href="${STEP_ORDER[idx + 1].route}">${esc(t('nextStep').replace('{name}', SYS_META[STEP_ORDER[idx + 1].key].title))}</a>`;
  return `<div class="step-progress">${progress}</div><div class="step-btns">${prev}${next}</div><a class="step-all" href="/">${esc(t('allSystems'))}</a>`;
}
function hubNextHTML() {
  if (pageSystem || (!state.teaser && !state.report)) return '';
  // Unlocked users get a "Skip to Master" shortcut as well (7 Nov 2026):
  // after paying for Extended Master Chat they land straight on /master,
  // and an unlocked user on the hub must never have to walk the whole
  // step flow — least of all the Portrait quizzes — to reach the chat.
  // Quizzes are optional content on the Portrait page only, never a gate.
  const skip = state.unlocked ? ` <a class="hub-master-btn" href="/master">${esc(t('skipToMaster'))}</a>` : '';
  return `<a class="hub-next-btn" href="/bazi">${esc(t('hubNext'))}</a>${skip}`;
}
function applyPageLayout() {
  const show = (id, on) => { const el = $(id); if (el) el.classList.toggle('hidden', !on); };
  const onHub = !pageSystem;
  const onMaster = pageSystem === 'master';
  const onPortrait = pageSystem === 'portrait';
  show('brand-hero', onHub);
  show('hook-card', onHub);
  show('daily-card', onHub);
  show('limits-card', onHub);
  // Quizzes live on the Portrait page only — never on the hub or another system page.
  show('quiz-card', onPortrait);
  // The unlocked card (View report / Resend / Download) lives on the hub only.
  show('unlocked-card', onHub && state.unlocked);
  // The unlock/pay card stays on a system page ONLY while locked (it is
  // the pay step for that system); on Master the locked prompt replaces it.
  show('unlock-card', !onMaster && !state.unlocked);
  // The full reading (summary + Live Reader + Ask the Master) opens only
  // on /master — and there only the Live Reader + Master chat blocks,
  // never the full-reading summary div. The hub never shows it.
  show('report-card', onMaster && state.unlocked);
  const reportDiv = $('report');
  if (reportDiv) reportDiv.classList.toggle('hidden', onMaster);
  show('master-locked-card', onMaster && !state.unlocked);
  const hubNext = $('hub-next');
  if (hubNext) hubNext.innerHTML = hubNextHTML();
  const stepNav = $('step-nav');
  if (stepNav) stepNav.innerHTML = stepNavHTML();
}
function extractSection(html, sectionId) {
  const m = html.match(new RegExp(`<section class="card" id="${sectionId}">[\\s\\S]*?</section>`));
  return m ? m[0] : '';
}
function addHubLinks(html) {
  // Hub: each system card links out to its own dedicated page.
  for (const s of SYSTEMS) {
    const sec = extractSection(html, s.section);
    if (!sec) continue;
    const linked = sec.replace(/<\/section>$/, `<p class="sys-open"><a href="${s.route}">${esc(t('sysOpen'))} →</a></p></section>`);
    html = html.replace(sec, linked);
  }
  return html;
}

/* --- Systems renderer: teaser (free) or report (paid) --- */
function renderSystems() {
  const box = $('systems');
  const src = state.unlocked && state.report ? state.report : state.teaser;
  if (!src) {
    let ph = previewSystemsHTML();
    if (pageSystem) {
      const hero = $('sys-hero'); if (hero) hero.innerHTML = pageHeroHTML();
      if (pageSystem === 'master') { box.innerHTML = ''; applyPageLayout(); bindPreviewEvents(); return; }
      const sec = SYSTEMS.find((s) => s.key === pageSystem);
      box.innerHTML = sec ? extractSection(ph, sec.section) : ph;
    } else box.innerHTML = addHubLinks(ph);
    applyPageLayout(); bindPreviewEvents(); return;
  }
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
  html += `<section class="card" id="sys-bazi">${sysHead('\uD83C\uDF3F', 'Bazi \u516b\u5b57')}<p class="lede sys-desc">${esc(t('sysDescBazi'))}</p>`;
  if (!state.revealed.bazi) {
    html += revealCover('\uD83C\uDF3F', `${t('tapReveal')} \u2014 ${t('dayMaster')}`, t('tapReveal'));
  } else {
    const dm = unlocked ? r.bazi.dayMaster : { en: src.bazi.dayMaster, zh: src.bazi.dayMasterZh };
    html += `<div class="reveal-in"><p class="essence">${esc(t('dayMaster'))}: ${esc(L(dm))}</p><p class="hook-line">${esc(L(baziHook))}</p>`;
    if (unlocked) {
      html += `<div class="pillars">${r.bazi.pillars.map((p) => `<div class="pillar cast-item"><div class="plabel">${esc(L(p.label))}</div><div class="pchars">${esc(p.stem.char)}${esc(p.branch.char)}</div><div class="pelem">${esc(L(p.stem))} \u00B7 ${esc(L(p.branch))}</div></div>`).join('')}</div>`;
      html += `<div class="elbar">${Object.entries(r.bazi.counts).map(([k, v]) => `<div class="${k === r.bazi.dominant ? 'hot' : k === r.bazi.weakest ? 'cold' : ''}">${esc(EL_NAMES[state.lang][k] || k)} \u00D7${v}</div>`).join('')}</div>`;
      html += `<div class="glance"><span class="chip">${esc(t('dayMaster'))}: <b>${esc(L(r.bazi.dayMaster))}</b></span><span class="chip">${esc(t('strongest'))}: <b>${esc(EL_NAMES[state.lang][r.bazi.dominant])}</b></span><span class="chip">${esc(t('weakest'))}: <b>${esc(EL_NAMES[state.lang][r.bazi.weakest])}</b></span></div>`;
      html += sectionHTML(r.bazi.sections);
      html += `<p class="small">${esc(t('simplifiedNote'))}</p>`;
    } else html += lockBlock();
    html += `</div>`;
  }
  html += `</section>`;

  /* Zi Wei — cast the chart */
  html += `<section class="card" id="sys-ziwei">${sysHead('\u2B50', 'Zi Wei \u7d2b\u5fae\u6597\u6570')}<p class="lede sys-desc">${esc(t('sysDescZiwei'))}</p>`;
  if (!state.ziweiCast) {
    html += `<p class="lede">${esc(t('lifePalace'))} \u00B7 ${esc(L({ en: 'Tian Ji', zh: '\u5929\u673a' }))}</p><button type="button" data-act="cast-ziwei">\u2728 ${esc(t('castChart'))}</button>`;
  } else {
    html += `<p class="small">${esc(t('sampleNote'))}</p>`;
    const palaces = unlocked ? r.ziwei.palaces : [
      { key: 'life', en: 'Life Palace', zh: '\u547d\u5bab', star: { en: 'Tian Ji', zh: '\u5929\u673a' }, text: src.ziwei.hook },
      { key: 'wealth', en: 'Wealth Palace', zh: '\u8d22\u5e1b\u5bab', star: { en: 'Wu Qu', zh: '\u6b66\u66f2' }, text: null },
      { key: 'career', en: 'Career Palace', zh: '\u5b98\u7984\u5bab', star: { en: 'Tai Yang', zh: '\u592a\u9633' }, text: null },
      { key: 'spouse', en: 'Spouse Palace', zh: '\u592b\u59bb\u5bab', star: { en: 'Tai Yin', zh: '\u592a\u9634' }, text: null },
    ];
    html += `<div class="palace-grid">${palaces.map((p) => {
      const readable = unlocked || p.key === 'life';
      return `<div class="palace cast-item ${p.key === 'life' ? 'main' : ''}"><div class="pname">${esc(L(p))}</div><div class="star">${esc(L(p.star))}</div>${readable && p.text ? `<p>${esc(L(p.text))}</p>` : `<div class="skel"></div><div class="skel short"></div>`}</div>`;
    }).join('')}</div>`;
    if (unlocked) html += sectionHTML(r.ziwei.sections);
    else html += lockBlock();
  }
  html += `</section>`;

  /* Horoscope */
  html += `<section class="card" id="sys-horo">${sysHead('\uD83C\uDF19', 'Horoscope \u661f\u5ea7')}<p class="lede sys-desc">${esc(t('sysDescHoro'))}</p>`;
  if (!state.revealed.horo) {
    html += revealCover('\uD83C\uDF19', `${t('tapReveal')} \u2014 ${t('sun')}`, t('tapReveal'));
  } else {
    const sun = unlocked ? r.horoscope.sun : { en: src.horoscope.sunSign, zh: src.horoscope.sunSignZh };
    html += `<div class="reveal-in"><p class="essence">${esc(t('sun'))}: ${esc(L(sun))}</p><p class="hook-line">${esc(L(horoHook))}</p>`;
    if (unlocked) {
      html += `<p><span class="badge big">${esc(r.horoscope.sun.symbol)} ${esc(t('sun'))} ${esc(L(r.horoscope.sun))}</span><span class="badge big">${esc(r.horoscope.moon.symbol)} ${esc(t('moon'))} ${esc(L(r.horoscope.moon))}</span><span class="badge big">${esc(r.horoscope.rising.symbol)} ${esc(t('rising'))} ${esc(L(r.horoscope.rising))}</span></p>`;
      html += sectionHTML(r.horoscope.sections);
    } else html += lockBlock();
    html += `</div>`;
  }
  html += `</section>`;

  /* Yi-Jing — cast the coins: true 6-line casting, bottom to top.
     The hexagram and hook below are only shown once all six lines have
     been cast; the lines shown are the server's lines for this profile. */
  html += `<section class="card" id="sys-yijing">${sysHead('\u262F\uFE0F', 'Yi-Jing \u6613\u7ecf')}<p class="lede sys-desc">${esc(t('sysDescYijing'))}</p><p class="lede">${esc(t('yijingHow'))}</p>`;
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
  html += `<section class="card" id="sys-tarot">${sysHead('\uD83C\uDCCF', 'Tarot \u5854\u7f57')}<p class="lede sys-desc">${esc(t('sysDescTarot'))}</p><p class="lede">${esc(t('tapFlip'))}</p>`;
  const cards = unlocked ? r.tarot.cardsDetailed : src.tarot.cards;
  const posKeys = ['past', 'present', 'path'];
  html += `<div class="tarot-row">${cards.map((c, i) => {
    const flipped = state.tarotFlipped[i];
    return `<div><div class="tarot-card ${flipped ? 'flipped' : ''}" data-tarot="${i}" role="button" tabindex="0" aria-label="${esc(t('tapFlip'))}">
      <div class="tarot-inner">
        <div class="tarot-face tarot-back"><div class="back-frame"><div class="star">\u2726</div><p class="back-brand">FateWeave</p><p>${esc(t('flipping'))}</p></div></div>
        <div class="tarot-face tarot-front" style="--hue:${((c.idx ?? 0) * 47) % 360}"><div class="card-num">${esc(c.number ?? '')}</div>${tarotFrontArt(c)}<div class="cname">${esc(L(c.name))}</div><div class="kw">${esc(tarotKeywords(c))}</div>${c.reversed ? `<div class="rev-banner">${esc(t('reversed'))}</div>` : ''}</div>
      </div></div><p class="tarot-pos">${esc(t(posKeys[i]))}</p></div>`;
  }).join('')}</div>`;
  html += `<div id="tarot-detail">${cards.map((c, i) => {
    if (!state.tarotFlipped[i]) return '';
    if (unlocked) {
      return `<div class="tarot-detail reveal-in"><h3>${esc(t(posKeys[i]))} \u2014 ${esc(L(c.name))}${c.reversed ? ` (${esc(t('reversed'))})` : ''}</h3><p>${esc(L(c.meaning))}</p><p class="hook-line">${esc(L(c.positionText))}</p><p>${esc(L(c.forQuestion))}</p></div>`;
    }
    return `<div class="tarot-detail"><p class="hook-line"><strong>${esc(L(c.name))}</strong> \u2014 ${esc(tarotKeywords(c))}</p>${lockBlock()}</div>`;
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
  html += `<section class="card" id="sys-num">${sysHead('\uD83D\uDD22', 'Numerology \u751f\u547d\u7075\u6570')}<p class="lede sys-desc">${esc(t('sysDescNum'))}</p>`;
  if (!state.revealed.num) {
    html += revealCover('\uD83D\uDD22', `${t('tapReveal')} \u2014 ${t('lifePath')}`, t('tapReveal'));
  } else {
    const lp = unlocked ? r.numerology.lifePath : src.numerology.lifePath;
    html += `<div class="reveal-in"><p class="essence">${esc(t('lifePath'))}: ${lp}</p><p class="hook-line">${esc(L(numHook))}</p>`;
    if (unlocked) {
      html += `<div class="bignum-row"><div class="bignum"><div class="n">${r.numerology.lifePath}</div><div class="l">${esc(t('lifePath'))}</div></div>${r.numerology.destiny ? `<div class="bignum"><div class="n">${r.numerology.destiny}</div><div class="l">${esc(t('destiny'))}</div></div>` : ''}<div class="bignum"><div class="n">${r.numerology.personalYear}</div><div class="l">${esc(t('personalYear'))} ${new Date().getFullYear()}</div></div></div>`;
      html += sectionHTML(r.numerology.sections);
    } else html += lockBlock();
    html += `</div>`;
  }
  html += `</section>`;

  /* Complete Portrait */
  html += `<section class="card" id="sys-portrait">${sysHead('\uD83E\uDE9E', t('portraitTitle'))}<p class="lede sys-desc">${esc(t('sysDescPortrait'))}</p><p class="essence">${esc(L(src.portrait.essenceLine))}</p>`;
  if (unlocked) {
    const pChips = [`${esc(t('dayMaster'))}: <b>${esc(L(r.bazi.dayMaster))}</b>`, `${esc(t('sun'))}: <b>${esc(L(r.horoscope.sun))}</b>`, `${esc(t('lifePath'))}: <b>${r.numerology.lifePath}</b>`];
    if (r.personality?.enneagram) pChips.push(`Enneagram: <b>${r.personality.enneagram.core}w${r.personality.enneagram.wing}</b>`);
    if (r.personality?.mbti) pChips.push(`MBTI: <b>${r.personality.mbti.type}</b>`);
    html += `<div class="glance">${pChips.map((c) => `<span class="chip">${c}</span>`).join('')}</div>`;
    html += `<h3>${esc(t('portraitTitle'))}</h3><p>${esc(L(r.portrait.character))}</p>`;
    html += `<h3>${esc(t('style'))}</h3><p><strong>${esc(t('think'))}:</strong> ${esc(L(r.portrait.style.think))}</p><p><strong>${esc(t('work'))}:</strong> ${esc(L(r.portrait.style.work))}</p><p><strong>${esc(t('connect'))}:</strong> ${esc(L(r.portrait.style.connect))}</p>`;
    html += `<h3>${esc(t('strengths'))}</h3><ul class="clean plist">${r.portrait.strengths.map((x) => `<li>${esc(L(x.text))} <small>(${esc(L(x.source))})</small></li>`).join('')}</ul>`;
    html += `<h3>${esc(t('whatsLacking'))}</h3><ul class="clean plist">${r.portrait.lacking.map((x) => `<li>${esc(L(x.text))} <small>(${esc(L(x.source))})</small></li>`).join('')}</ul>`;
    html += `<h3>${esc(t('practices'))}</h3><ul class="clean">${r.portrait.developmentFocus.map((x) => `<li>${esc(L(x))}</li>`).join('')}</ul>`;
    html += `<h3>${esc(t('synthesisTitle'))}</h3><p>${esc(L(r.synthesis.agree))}</p><p>${esc(L(r.synthesis.tension))}</p><p><em>${esc(L(r.synthesis.full))}</em></p>`;
    if (r.synthesis.personalityLens) html += `<p class="hook-line">${esc(L(r.synthesis.personalityLens))}</p>`;
  } else html += lockBlock();
  html += `</section>`;

  if (pageSystem) {
    const hero = $('sys-hero'); if (hero) hero.innerHTML = pageHeroHTML();
    if (pageSystem === 'master') { box.innerHTML = ''; bindSystemEvents(); applyPageLayout(); return; }
    const sec = SYSTEMS.find((s) => s.key === pageSystem);
    box.innerHTML = sec ? extractSection(html, sec.section) : html;
  } else {
    const hero = $('sys-hero'); if (hero) hero.innerHTML = '';
    box.innerHTML = addHubLinks(html);
  }
  bindSystemEvents();
  applyPageLayout();
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
        coins.innerHTML = '<div class="coin spin">\u9633</div><div class="coin spin">\u9634</div><div class="coin spin">\u9633</div>';
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
    const flip = () => {
      const i = Number(el.dataset.tarot);
      if (state.tarotFlipped[i]) { el.classList.toggle('enlarged'); return; } // tap again = enlarge
      state.tarotFlipped[i] = true; renderSystems();
    };
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
  state.mcMessages = []; state.mcLeft = 5;
  renderMcThread();
  $('unlocked-banner').classList.add('hidden');
  $('unlocked-banner').innerHTML = '';
  $('unlocked-card').classList.add('hidden');
  $('unlock-card').classList.remove('hidden');
  $('report-card').classList.add('hidden');
  $('report').innerHTML = '';
  renderQuizArea();
  renderQuizList();
  applyPageLayout();
}

function renderQuizList() {
  const list = $('quiz-list');
  const defs = [
    { kind: 'enneagram', icon: '\uD83D\uDD2E', title: 'Enneagram \u4e5d\u578b\u4eba\u683c', count: 27 },
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
    // Live Reader + Ask the Master live on /master only — a single-system
    // page stays focused on that system, and the hub shows neither
    // (applyPageLayout, called by renderSystems below, enforces this).
    if (pageSystem === 'master') $('report-card').classList.remove('hidden');
    renderSystems();
    renderReportCard();
    loadMasterChat(); // restore the Ask the Master thread + follow-up counter
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
    ${r.personality ? `<h3>${esc(t('portraitTitle'))} \u00B7 ${state.lang === 'zh' ? '\u4eba\u683c' : 'Personality'}</h3>${r.personality.enneagram ? `<p>Enneagram ${r.personality.enneagram.core}w${r.personality.enneagram.wing} \u00B7 ${esc(L({ en: r.personality.enneagram.nameEn, zh: r.personality.enneagram.nameZh }))}</p>` : ''}${r.personality.mbti ? `<p>MBTI ${r.personality.mbti.type} \u00B7 ${esc(L({ en: r.personality.mbti.nickEn, zh: r.personality.mbti.nickZh }))}</p>` : ''}` : ''}
    <p class="small">${[t('limit1'), t('limit2'), t('limit3'), t('limit4')].map(esc).join(' ')}</p>`;
}

$('view-report-btn').addEventListener('click', () => {
  // The unlocked card lives on the hub only, and the full reading lives
  // on the system pages — so "View my full reading" starts the guided
  // reading at Bazi instead of scrolling to a hidden card.
  if (!pageSystem) { location.href = '/bazi'; return; }
  $('report-card').scrollIntoView({ behavior: 'smooth' });
});
$('resend-btn').addEventListener('click', async () => {
  const status = $('resend-status');
  status.textContent = t('readingGlimpse');
  try {
    const res = await fetch('/api/resend-report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(authParams()) });
    // The server returns a code on failure: resend_sandbox_recipient means
    // the sender is still Resend test mode (only the account owner's own
    // email can receive it) — say so plainly and point at Download report.
    const data = await res.json().catch(() => ({}));
    if (res.ok) status.textContent = t('resendOk');
    else if (data.code === 'resend_sandbox_recipient') status.textContent = t('resendSandbox');
    else status.textContent = data.error || t('resendFail');
  } catch { status.textContent = t('resendFail'); }
});

/* --- Download my report (fallback when email fails) ------------------------
   Uses the full report already unlocked in this browser (/api/report with
   a valid token) — no new email needed. The buyer always gets their
   report even when Resend rejects the recipient (sandbox sender). */
function dlSecs(sections) {
  if (!sections) return '';
  const label = { overview: 'overview', strengths: 'strengthsSec', challenges: 'challengesSec', career: 'careerSec', relationships: 'relationshipsSec', health: 'healthSec', timing: 'timingSec' };
  return ['overview', 'strengths', 'challenges', 'career', 'relationships', 'health', 'timing']
    .filter((k) => sections[k]).map((k) => `<h3>${esc(t(label[k]))}</h3><p>${esc(L(sections[k]))}</p>`).join('');
}
function reportDownloadHTML(r) {
  const sec = (title, inner) => `<h2>${esc(title)}</h2>${inner}`;
  let h = `<!doctype html><html lang="${state.lang === 'zh' ? 'zh-CN' : 'en'}"><head><meta charset="utf-8"><title>FateWeave — ${esc(r.profile.birthDate || '')}</title></head><body style="font-family:sans-serif;line-height:1.6;max-width:680px;margin:auto;padding:24px">`;
  h += `<h1>FateWeave 天机汇 — ${esc(t('fullReadingTitle'))}</h1><p>${esc(r.profile.birthDate || '')}${r.profile.name ? ' · ' + esc(r.profile.name) : ''}</p>`;
  h += `<p><em>${esc(L(r.portrait.essenceLine))}</em></p><p>${esc(L(r.portrait.character))}</p>`;
  h += sec('Bazi 八字 — ' + L(r.bazi.dayMaster), `<p>${esc(L(r.bazi.dayMasterText))}</p>` + dlSecs(r.bazi.sections));
  h += sec('Zi Wei 紫微 — ' + r.ziwei.lifePalace, `<p><em>${esc(t('sampleNote'))}</em></p>` + dlSecs(r.ziwei.sections));
  h += sec('Horoscope 星座 — ' + L(r.horoscope.sun), `<p>Sun ${esc(L(r.horoscope.sun))} · Moon ${esc(L(r.horoscope.moon))} · Rising ${esc(L(r.horoscope.rising))}</p>` + dlSecs(r.horoscope.sections));
  h += sec('Numerology 生命灵数 — Life Path ' + r.numerology.lifePath, dlSecs(r.numerology.sections));
  h += sec('Yi-Jing 易经 — ' + r.yijing.hexagram, `<p>${esc(L(r.yijing.theme))}</p>` + dlSecs(r.yijing.sections));
  h += sec('Tarot 塔罗', r.tarot.cardsDetailed.map((c) => `<p><strong>${esc(L(c.position))} — ${esc(L(c.name))}${c.reversed ? ' (' + esc(t('reversed')) + ')' : ''}:</strong> ${esc(L(c.meaning))}</p>`).join('') + `<p>${esc(L(r.tarot.story))}</p>` + dlSecs(r.tarot.sections));
  if (r.personality) {
    h += `<h2>${esc(t('portraitTitle'))}</h2>`;
    if (r.personality.enneagram) h += `<p>Enneagram ${r.personality.enneagram.core}w${r.personality.enneagram.wing} · ${esc(L({ en: r.personality.enneagram.nameEn, zh: r.personality.enneagram.nameZh }))}</p>`;
    if (r.personality.mbti) h += `<p>MBTI ${r.personality.mbti.type} · ${esc(L({ en: r.personality.mbti.nickEn, zh: r.personality.mbti.nickZh }))}</p>`;
  }
  h += `<h2>${esc(t('synthesisTitle'))}</h2><p>${esc(L(r.synthesis.agree))}</p><p>${esc(L(r.synthesis.tension))}</p><p><em>${esc(L(r.synthesis.full))}</em></p>`;
  h += `<hr><p><small>${[t('limit1'), t('limit2'), t('limit3'), t('limit4')].map(esc).join(' ')}</small></p></body></html>`;
  return h;
}
$('download-report-btn').addEventListener('click', () => {
  const r = state.report;
  if (!r) { $('resend-status').textContent = t('downloadFail'); return; }
  const blob = new Blob([reportDownloadHTML(r)], { type: 'text/html;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `FateWeave-report-${r.profile.birthDate || 'reading'}.html`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
});

/* --- Live Reader — voice in + voice out, typed fallback --- */
$('lr-ask').addEventListener('click', async () => {
  const q = $('lr-question').value.trim();
  if (!q) return;
  const box = $('lr-answers');
  let res;
  try {
    res = await fetch('/api/live-reader', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...authParams(), sessionId: state.sessionId, question: q, lang: state.lang }) });
  } catch (err) {
    // Transport failure: friendly message, never the raw browser error.
    box.innerHTML += `<p>${esc(t('unreachable'))}</p>`;
    return;
  }
  let data = null;
  try { data = await res.json(); } catch { data = null; }
  if (!res.ok || !data || typeof data.answer !== 'string') {
    box.innerHTML += `<p>${esc((data && data.error) || t('unreachable'))}</p>`;
    return;
  }
  try {
    $('lr-used').textContent = data.questionsUsed;
    box.innerHTML += `<p><strong>You:</strong> ${esc(q)}</p><p><strong>Live Reader:</strong> ${esc(data.answer)}</p>`;
    $('lr-question').value = '';
    if ($('lr-speak').checked && 'speechSynthesis' in window) {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(data.answer);
      u.lang = state.lang === 'zh' ? 'zh-CN' : 'en-US';
      speechSynthesis.speak(u);
      $('lr-stop').classList.remove('hidden');
    }
  } catch (err) { box.innerHTML += `<p>${esc(t('unreachable'))}</p>`; }
});
$('lr-voice').addEventListener('click', () => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { alert(t('voiceUnsupported')); return; }
  const rec = new SR();
  rec.lang = state.lang === 'zh' ? 'zh-CN' : 'en-US';
  rec.onresult = (e) => { $('lr-question').value = e.results[0][0].transcript; };
  rec.start();
});
$('lr-stop').addEventListener('click', () => { speechSynthesis.cancel(); $('lr-stop').classList.add('hidden'); });

/* --- Ask the Master — follow-up chat on the buyer's own reading -----------
   Paid-only (the section lives inside #report-card, hidden until unlocked).
   5 follow-ups per BUYER (Extended: 30 chats in total), server-enforced,
   separate from Live Reader's 3 questions. History loads from the server
   on unlock, so a reload restores the thread — the server keys it by the
   buyer, not by the browser session, so a fresh sessionId never wipes
   it. Voice in reuses the Live Reader pattern (zh-CN/en-US); voice out
   reuses the Live Reader speak checkbox. */
function renderAiRestNote(resting) {
  const el = $('mc-ai-rest');
  if (!el) return;
  el.textContent = resting ? t('aiRestingNote') : '';
  el.classList.toggle('hidden', !resting);
}
function renderMcCounter() {
  const left = $('mc-left'), label = $('mc-left-label'), suffix = $('mc-left-suffix'), btn = $('mc-upgrade-btn'), offer = $('mc-upgrade-offer');
  if (!left) return;
  // Counter: Extended buyers see "Master chats left: n / 30"; everyone
  // else sees "Follow-ups left: n / 5".
  if (label) label.textContent = state.mcExtended ? t('masterChatsLeft') : t('followupsLeft');
  if (state.mcExtended) {
    left.textContent = state.mcLeft;
    if (suffix) suffix.textContent = ' / 30';
    if (btn) { btn.textContent = '✓ ' + t('upgradeExtended'); btn.disabled = true; }
    if (offer) offer.classList.add('hidden');
  } else {
    left.textContent = state.mcLeft;
    if (suffix) suffix.textContent = ' / 5';
    if (btn) { btn.textContent = t('upgradeBtn'); btn.disabled = false; }
  }
}
function renderMcThread() {
  const box = $('mc-thread');
  if (!box) return;
  box.innerHTML = (state.mcMessages || []).map((m) => {
    const tag = m.role === 'master' && m.source === 'rule-based'
      ? ` <small class="mc-rb-tag">${esc(t('mcRuleBasedTag'))}</small>` : '';
    return `<p class="${m.role === 'user' ? 'mc-user' : 'mc-master'}"><strong>${esc(m.role === 'user' ? t('mcYou') : t('mcMaster'))}:</strong> ${esc(m.content)}${tag}</p>`;
  }).join('');
  box.scrollTop = box.scrollHeight;
}
async function loadMasterChat() {
  if (!state.unlocked) return;
  try {
    const p = authParams();
    const res = await fetch(`/api/master-chat?token=${encodeURIComponent(p.token)}&email=${encodeURIComponent(p.email)}&birthDate=${encodeURIComponent(p.birthDate)}&sessionId=${state.sessionId}`);
    if (!res.ok) return;
    const data = await res.json();
    state.mcMessages = data.messages || [];
    state.mcExtended = !!data.extended;
    state.mcLeft = typeof data.questionsRemaining === 'number' ? data.questionsRemaining : 0;
    // AI badge: shown only when the AI Master is actually live (the
    // server sets GEMINI_API_KEY). Rule-based mode shows no badge.
    const badge = $('mc-ai-badge');
    if (badge) {
      badge.textContent = t('aiBadge');
      badge.classList.toggle('hidden', !data.aiMasterLive);
    }
    // AI resting after a brief hiccup (short cooldown server-side):
    // say so honestly instead of silently serving summaries.
    renderAiRestNote(!!data.aiResting);
    renderMcCounter();
    renderMcThread();
  } catch {}
}
function mcSpeak(text) {
  if (!$('lr-speak').checked || !('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = state.lang === 'zh' ? 'zh-CN' : 'en-US';
  speechSynthesis.speak(u);
}
async function sendMasterChat(text) {
  const q = (text || $('mc-question').value || '').trim();
  if (!q) return;
  if (!state.mcExtended && state.mcLeft <= 0) {
    state.mcMessages = [...state.mcMessages, { role: 'master', content: t('upgradeOffer'), lang: state.lang, source: 'master' }];
    const offer = $('mc-upgrade-offer'); if (offer) offer.classList.remove('hidden');
    renderMcThread();
    return;
  }
  // Transport failure (offline, Railway incident page, …): show a short
  // friendly message in the user's language — never the raw browser
  // error (Safari's "The string did not match the expected pattern" is
  // what res.json() throws on a non-JSON reply). The question stays in
  // the box for a retry, nothing is stored, and no AI chat is consumed.
  let res;
  try {
    res = await fetch('/api/master-chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...authParams(), sessionId: state.sessionId, message: q, lang: state.lang }) });
  } catch (err) {
    state.mcMessages = [...state.mcMessages, { role: 'master', content: t('masterUnreachable'), lang: state.lang, source: 'master' }];
    renderMcThread();
    return;
  }
  let data = null;
  try { data = await res.json(); } catch { data = null; }
  if (!res.ok || !data || typeof data.answer !== 'string') {
    if (!res.ok && data && data.error) {
      // A real server error (e.g. limit reached): keep the existing
      // behaviour — the question did reach the server.
      state.mcMessages = [...state.mcMessages, { role: 'user', content: q, lang: state.lang, source: 'master' }, { role: 'master', content: data.error, lang: state.lang, source: 'master' }];
      if (res.status === 429) {
        state.mcLeft = 0; renderMcCounter();
        const offer = $('mc-upgrade-offer'); if (offer) offer.classList.remove('hidden');
      }
    } else {
      // Non-JSON reply (e.g. a Railway error page) or an empty body:
      // friendly message only — the question was never answered, so it
      // is not stored and no chat is consumed.
      state.mcMessages = [...state.mcMessages, { role: 'master', content: t('masterUnreachable'), lang: state.lang, source: 'master' }];
    }
    renderMcThread();
    return;
  }
  try {
    state.mcMessages = data.messages || state.mcMessages;
    state.mcExtended = !!data.extended;
    state.mcLeft = typeof data.questionsRemaining === 'number' ? data.questionsRemaining : 0;
    renderAiRestNote(!!data.aiResting);
    renderMcCounter();
    $('mc-question').value = '';
    renderMcThread();
    mcSpeak(data.answer);
  } catch (err) {
    state.mcMessages = [...state.mcMessages, { role: 'master', content: t('masterUnreachable'), lang: state.lang, source: 'master' }];
    renderMcThread();
  }
}
$('mc-ask').addEventListener('click', () => sendMasterChat());
$('mc-question').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); sendMasterChat(); } });
document.querySelectorAll('[data-chip]').forEach((b) => {
  b.onclick = () => {
    const kind = b.dataset.chip;
    sendMasterChat(kind === 'explain' ? t('chipExplain') : kind === 'example' ? t('chipExample') : t('chipDeeper'));
  };
});
/* --- Extended Master Chat upgrade ($3, 30 chats) --------------------------
   Paid token only (the server checks the token and the Stripe payment).
   On success Stripe lands the buyer DIRECTLY on /master?upgraded=1 —
   checkUpgradeReturn() there verifies the session and the counter then
   reads Extended (30 chats). No hub detour, no step flow, no quiz in the way. */
async function buyMasterUpgrade() {
  const btn = $('mc-upgrade-btn');
  if (btn) btn.disabled = true;
  try {
    const res = await fetch('/api/checkout-upgrade', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(authParams()) });
    const data = await res.json();
    if (!res.ok) { alert(data.error || t('upgradeFail')); if (btn) btn.disabled = false; return; }
    if (data.alreadyExtended) { state.mcExtended = true; renderMcCounter(); return; }
    location.href = data.checkoutUrl;
  } catch (e) { alert(t('upgradeFail')); if (btn) btn.disabled = false; }
}
$('mc-upgrade-btn').addEventListener('click', buyMasterUpgrade);
$('mc-upgrade-offer-btn').addEventListener('click', buyMasterUpgrade);
$('mc-voice').addEventListener('click', () => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { alert(t('voiceUnsupported')); return; }
  const rec = new SR();
  rec.lang = state.lang === 'zh' ? 'zh-CN' : 'en-US';
  rec.onresult = (e) => { $('mc-question').value = e.results[0][0].transcript; };
  rec.start();
});

/* --- Upgrade return: after Stripe, the upgrade now lands DIRECTLY on
   /master?upgraded=1&session_id=… (7 Nov 2026 fix — the old hub landing
   forced the buyer through the whole guided flow, quizzes included, to
   reach the chat). Confirm the upgrade on the server (the webhook may not
   have landed yet) and refresh the Master counter so it reads Extended
   (30 chats).
   Runs at init on every page, after loadReport() restores the token —
   /master works standalone: no re-entry, no quiz required. If the session
   cannot be verified yet (payment still settling), say so plainly instead
   of silently dropping the params. */
async function checkUpgradeReturn() {
  const params = new URLSearchParams(location.search);
  if (params.get('upgraded') !== '1' || !params.get('session_id')) return;
  try {
    const res = await fetch('/api/checkout-session/' + encodeURIComponent(params.get('session_id')));
    const data = await res.json();
    if (res.ok && data.upgrade) {
      state.mcExtended = true;
      const banner = $('unlocked-banner');
      banner.innerHTML = `${esc(t('upgradeDone'))}`;
      banner.classList.remove('hidden');
      await loadMasterChat();
    } else if (state.unlocked) {
      // Paid session not verifiable yet — the webhook usually lands
      // within moments. Never strand the buyer silently on a 5-limit
      // counter they just paid to remove.
      const banner = $('unlocked-banner');
      banner.innerHTML = `${esc(t('upgradePending'))}`;
      banner.classList.remove('hidden');
    }
  } catch {}
  history.replaceState(null, '', location.pathname);
}

prefillForm(); // birth date, time, name, email survive a reload (bug 3)
loadPrice();
loadReport().then(() => checkUpgradeReturn());
renderQuizList();
renderSystems(); // pre-glimpse preview: all six systems visible before any birth date is entered
