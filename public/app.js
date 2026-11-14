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
  lang: 'en', teaser: null, report: null, unlocked: false, ziweiInputsNeeded: false, price: null, masterPacks: [], previewMode: false, promoAccessEnabled: false,
  teaserLoading: !!localStorage.getItem('fateweave_birthDate') && new URLSearchParams(location.search).get('fresh') !== '1',
  mcExtended: false,
  sessionId: crypto.randomUUID(),
  revealed: {}, tarotFlipped: [false, false, false], ziweiCast: false, yijingCast: false,
  yijingLines: [], yijingCasting: false,
  quiz: { kind: null, questions: null, idx: 0, answers: [], result: null },
  quizCache: null,
  mcMessages: [], mcLeft: 5, mcMax: 5, mcSending: false, lrSending: false,
  yijingResult: null,
};

const STR = {
  en: {
    tagline: 'One birthday. Six ways to read the story.',
    heroKicker: 'A field guide to your personal patterns',
    heroSub: 'Meet six distinct traditions. Compare the patterns they notice. Decide what feels worth exploring.',
    heroTrust: 'For reflection and exploration. Your choices remain your own.',
    heroArtLabel: 'FIELD NOTE 01 / SIX LENSES',
    heroStart: 'Start with my birth date', guideCta: 'Meet the guides',
    masterLine: 'Six traditions, six guides. You remain the author of your choices.',
    hookKicker: 'Begin with a small clue',
    hookTitle: 'Your first glimpse', hookLede: 'Enter your birth date to see a first clue from each tradition. Open the perspectives that interest you, then continue when you are ready.',
    birthDate: 'Birth date', birthTime: 'Birth time', chartSex: 'Chart sex', chartSexChoose: 'Choose chart sex', chartSexMale: 'Male', chartSexFemale: 'Female', name: 'Name (optional)', namePh: 'How should we address you?', hookCta: 'Create my free glimpse',
    ziweiInputTitle: 'Complete your chart details', ziweiInputBody: 'Enter your birth time and chart sex to calculate your full Zi Wei chart.', ziweiInputSave: 'Save details and open reading', mcScrollHint: 'Scroll inside the conversation panel to read full replies and earlier messages.',
    quizTitle: 'Know yourself \u2014 two quizzes', quizLede: 'Take them free \u2014 they are part of the hook. You will see your type and one line right away; the full breakdown unlocks with your reading.',
    unlockedTitle: 'Your reading is unlocked', viewReport: 'View my full reading', resendReport: 'Resend report email',
    unlockedBanner: '\u2713 Unlocked \u2014 no need to pay again',
    unlockedBannerSub: 'Your full reading is open below. It is saved on this device \u2014 refresh any time, no need to re-enter anything.',
    unlockTitle: 'Unlock the full reading',
    unlockBody: 'Unlock the full reading across all 8 systems, with 5 Master follow-up chats included. Optional packs: $1.99 for 5 more or $3.49 for 10 more.',
    liveReaderLink: 'Ask the Master',
    emailLabel: 'Email (for your reading access)', sameDateNote: 'Use the same birth date as your free glimpse, and the same email to return to your reading.',
    promoAccessSummary: 'Have an invited trial code?', promoCodeLabel: 'Trial code', promoAccessButton: 'Unlock trial', promoAccessNote: 'Invited codes expire after 7 days. Each trial lasts 7 or 14 days and is tied to one email and birth date.', promoCodeWorking: 'Checking your code…', promoCodeSuccess: 'Your limited-time trial is unlocked.',
    fullReadingTitle: 'Your full reading', liveReaderTitle: 'Regular questions (3)',
    liveReaderBody: 'All questions are now in the Master conversation.',
    masterChatTitle: 'Ask the Master',
    masterChatBody: 'Still wondering about something in your reading? Ask a follow-up — the Master answers from your own report, and remembers what you asked before.',
    followupsLeft: 'Master follow-ups left',
    masterChatsLeft: 'Master follow-ups left',
    aiBadge: 'Master',
    mcRuleBasedTag: 'Summary from your reading',
    chipExplain: 'What does that mean?', chipExample: 'Give me an example', chipDeeper: 'Tell me more about work',
    mcAskPh: 'Ask a follow-up…',
    masterChatNote: 'Follow-ups are answered from your own reading only — no predictions, and no medical, financial or legal advice.',
    masterChatExplainer: 'Three main questions, one conversation at a time. Ask follow-ups until you are ready, then choose Next question.',
    upgradeTitle: 'Need more follow-ups?',
    upgradeBody: '5 follow-ups included with this reading. Choose one add-on: 5 more for $1.99 or 10 more for $3.49.',
    upgradeBtn: 'Add follow-ups',
    upgradeExtended: 'Follow-up add-on',
    upgradeOffer: 'Choose one add-on pack, or continue to the next main question.',
    upgradeDone: 'Your follow-up pack has been added. Previous usage is preserved.',
    upgradeFail: 'Could not start the upgrade checkout. Please try again.',
    upgradePending: 'Your follow-up pack is being activated — if the counter has not updated, refresh this page in a moment.',
    skipToMaster: 'Skip to Master →',
    sysOpen: 'Open the full page',
    backToHub: '← All six systems',
    nextSystem: 'Next',
    hubNext: 'Start your reading — Next: Bazi →',
    stepOf: 'Step {n} of 8 — {name}',
    prevStep: '← Previous',
    nextStep: 'Next: {name} →',
    startWithDate: 'Start with a birth date →',
    previewEnvironment: 'Staging preview · no live payments or customer data',
    previewUnlockTitle: 'Preview the full reading',
    previewOnlyPrice: 'Free review mode · no charge',
    previewOnlyBody: 'Open a temporary full reading to review the system pages, card flips and casting interactions. This preview does not take payment or send email.',
    previewOnlyNote: 'Staging preview only. Reading access uses temporary storage and may reset when the free service sleeps.',
    previewUnlock: 'Open full reading preview',
    previewAccessFail: 'Could not open the preview. Please try again.',
    previewProfileNote: 'Your birth details are used only to generate this temporary preview. No email is needed.',
    doneHub: 'Done — back to hub',
    allSystems: 'All six systems',
    masterLockedTitle: 'Ask the Master is locked',
    masterLockedBody: 'Unlock the full reading with 5 Master follow-up chats included. Optional packs: $1.99 for 5 more or $3.49 for 10 more.',
    masterLockedLink: '← Back to the hub to unlock',
    tapEnlarge: 'Tap a flipped card again to enlarge it',
    heroLocked: 'Unlock the full reading to see your result here.',
    downloadReport: 'Download my report',
    downloadNote: 'Email delivery is temporarily unavailable. Download your unlocked report here.',
    downloadFail: 'Could not download the report — open your full reading first, then try again.',
    resendSandbox: 'Email could not be sent to this address yet — the sender is still in test mode and can only email the account owner. Use Download my report below to get your report now.',
    mcLimit: 'You have used all 5 follow-ups for this session.',
    mcYou: 'You', mcMaster: 'The Master',
    questionsUsed: 'Questions used', ask: 'Ask', askPh: 'Ask a question\u2026', speakAnswer: 'Speak the answer aloud', stopSpeaking: 'Stop speaking',
    dailyTitle: 'Free daily encouragement', dailyBody: 'Daily encouragement emails are temporarily unavailable. Your unlocked reading remains available here.',
    limitsTitle: 'Honest limits',
    limit1: 'Bazi is a simplified demo engine \u2014 no true solar-time correction yet.',
    limit2: 'Zi Wei is calculated from your birth date, birth time and chart sex. Clock time is used without a true-solar-time location correction.',
    limit3: 'For self-reflection and entertainment only \u2014 not medical, financial or legal advice.',
    limit4: 'Moon / Rising are approximations from the original prototype.',
    moreDetail: 'More detail', strongest: 'Strongest', weakest: 'Weakest',
    tapReveal: 'Tap to reveal', tapFlip: 'Tap a card to flip it', castChart: 'Cast the chart', castCoins: 'Cast the coins', castAgain: 'Cast again',
    lockedTitle: 'Full reading locked', lockedBody: 'Unlock the full reading to read every detail.',
    unlockBtn: 'Unlock full reading', casting: 'Casting\u2026', flipping: 'Tap to flip', flipAllTarot: 'Flip all three cards to read them as one story.',
    readingGlimpse: 'Reading your glimpse\u2026', enterDateFirst: 'Enter your birth date in the free glimpse form first.', loadingSavedGlimpse: 'Loading your saved glimpse…',
    couldNotRead: 'Could not read that birth date.', networkError: 'Network error: ',
    masterUnreachable: 'The Master couldn\u2019t be reached just now \u2014 please try again in a moment.',
    extendedLimit: 'Your available Master follow-ups have been used.',
    aiRestingNote: 'Master is temporarily unavailable. Please retry shortly; no follow-up was used.',
    unreachable: 'Couldn\u2019t be reached just now \u2014 please try again in a moment.',
    mcThinking: 'The Master is thinking\u2026',
    lrThinking: 'Thinking\u2026',
    payUnlock: 'Pay & unlock', priceUnavailable: 'Price unavailable \u2014 please try again later.',
    promoPriceLine: (amount, start, end, full) => `$${amount} launch offer · ${start}–${end} · then $${full}`,
    fullPriceLine: (amount) => `$${amount} full unlock`, payAmountUnlock: (amount) => `Pay $${amount} & unlock`,
    noChangingLines: 'No changing lines — this cast remains at Hexagram {number} · {name}.',
    questions: 'questions', questionOf: 'Question', of: 'of', back: '\u2190 Back', restart: 'Restart quiz',
    startQuiz: 'Start the quiz', retake: 'Retake', yourType: 'Your type', fullBreakdownLocked: 'Full breakdown locked \u2014 unlock to read it.',
    strengths: 'Strengths', whatsLacking: 'What\u2019s lacking', yourResult: 'Your result',
    resendOk: 'Report email resent \u2014 check your inbox.', resendFail: 'Could not resend the report email.',
    checkoutFail: 'Checkout failed.', checkoutError: 'Checkout error: ',
    voiceUnsupported: 'Voice input is not supported in this browser \u2014 please type your question.',
    portraitTitle: 'Complete Portrait', synthesisTitle: 'Where the six systems agree \u2014 and where they pull apart',
    sampleNote: 'Calculated from your birth details.',
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
    tagline: '\u540c\u4e00\u4e2a\u751f\u65e5\uff0c\u516d\u79cd\u65b9\u5f0f\u8bfb\u61c2\u4f60\u7684\u6545\u4e8b\u3002',
    heroKicker: '\u63a2\u7d22\u5c5e\u4e8e\u4f60\u7684\u751f\u547d\u7ebf\u7d22',
    heroSub: '\u8ba4\u8bc6\u516d\u79cd\u4e0d\u540c\u7684\u4f20\u7edf\u3002\u6bd4\u8f83\u5b83\u4eec\u53d1\u73b0\u7684\u7ebf\u7d22\uff0c\u518d\u51b3\u5b9a\u4ec0\u4e48\u503c\u5f97\u7ee7\u7eed\u63a2\u7d22\u3002',
    heroTrust: '\u7528\u4e8e\u81ea\u6211\u63a2\u7d22\u4e0e\u53cd\u601d\u3002\u4f60\u7684\u9009\u62e9\uff0c\u59cb\u7ec8\u7531\u4f60\u51b3\u5b9a\u3002',
    heroArtLabel: '\u4e13\u9898\u8bb0\u5f55 01 / \u516d\u79cd\u89c6\u89d2',
    heroStart: '\u4ece\u51fa\u751f\u65e5\u671f\u5f00\u59cb', guideCta: '\u8ba4\u8bc6\u516d\u4f4d\u6307\u5357',
    masterLine: '\u516d\u79cd\u4f20\u7edf\uff0c\u516d\u4f4d\u6307\u5357\u3002\u4f60\u4ecd\u7136\u662f\u81ea\u5df1\u9009\u62e9\u7684\u4e3b\u4eba\u3002',
    hookKicker: '\u4ece\u4e00\u4e2a\u5c0f\u7ebf\u7d22\u5f00\u59cb',
    hookTitle: '\u5148\u770b\u4e00\u773c', hookLede: '\u8f93\u5165\u51fa\u751f\u65e5\u671f\uff0c\u5148\u770b\u770b\u516d\u79cd\u4f20\u7edf\u5404\u81ea\u6ce8\u610f\u5230\u7684\u7ebf\u7d22\u3002\u9009\u62e9\u611f\u5174\u8da3\u7684\u89c6\u89d2\uff0c\u51c6\u5907\u597d\u4e86\u518d\u7ee7\u7eed\u3002',
    birthDate: '\u51fa\u751f\u65e5\u671f', birthTime: '\u51fa\u751f\u65f6\u95f4', chartSex: '\u6392\u76d8\u6027\u522b', chartSexChoose: '\u8bf7\u9009\u62e9\u6392\u76d8\u6027\u522b', chartSexMale: '\u7537', chartSexFemale: '\u5973', name: '\u540d\u5b57\uff08\u53ef\u9009\uff09', namePh: '\u5e0c\u671b\u6211\u4eec\u600e\u4e48\u79f0\u547c\u4f60\uff1f', hookCta: '\u751f\u6210\u514d\u8d39\u9884\u89c8',
    ziweiInputTitle: '\u8865\u5168\u547d\u76d8\u8d44\u6599', ziweiInputBody: '\u8bf7\u8f93\u5165\u51fa\u751f\u65f6\u95f4\u4e0e\u6392\u76d8\u6027\u522b\uff0c\u4ee5\u8ba1\u7b97\u5b8c\u6574\u7d2b\u5fae\u547d\u76d8\u3002', ziweiInputSave: '\u4fdd\u5b58\u8d44\u6599\u5e76\u6253\u5f00\u62a5\u544a', mcScrollHint: '\u5728\u5bf9\u8bdd\u6846\u5185\u6eda\u52a8\uff0c\u67e5\u770b\u5b8c\u6574\u56de\u590d\u548c\u65e9\u524d\u7684\u6d88\u606f\u3002',
    quizTitle: '\u8ba4\u8bc6\u81ea\u5df1\u2014\u2014\u4e24\u4e2a\u6d4b\u9a8c', quizLede: '\u514d\u8d39\u505a\u2014\u2014\u8fd9\u4e5f\u662f\u9884\u89c8\u7684\u4e00\u90e8\u5206\u3002\u4f60\u4f1a\u5373\u65f6\u770b\u5230\u4f60\u7684\u7c7b\u578b\u4e0e\u4e00\u53e5\u8bdd\uff1b\u5b8c\u6574\u89e3\u6790\u968f\u62a5\u544a\u89e3\u9501\u3002',
    unlockedTitle: '\u4f60\u7684\u62a5\u544a\u5df2\u89e3\u9501', viewReport: '\u67e5\u770b\u5b8c\u6574\u62a5\u544a', resendReport: '\u91cd\u5bc4\u62a5\u544a\u7535\u90ae',
    unlockedBanner: '\u2713 \u5df2\u89e3\u9501\u2014\u2014\u65e0\u9700\u518d\u6b21\u4ed8\u6b3e',
    unlockedBannerSub: '\u5b8c\u6574\u62a5\u544a\u5df2\u5728\u4e0b\u65b9\u5f00\u542f\uff0c\u5e76\u4fdd\u5b58\u5728\u6b64\u88c5\u7f6e\u2014\u2014\u968f\u65f6\u91cd\u65b0\u6574\u7406\uff0c\u4e0d\u7528\u518d\u8f93\u5165\u4efb\u4f55\u8d44\u6599\u3002',
    unlockTitle: '\u89e3\u9501\u5b8c\u6574\u62a5\u544a',
    unlockBody: '解锁全部 8 个系统的完整报告，并包含 5 次掌门追问。可选加购：$1.99 增加 5 次，或 $3.49 增加 10 次。',
    liveReaderLink: '问掌门',
    emailLabel: '\u7535\u90ae\uff08\u7528\u4e8e\u67e5\u9605\u62a5\u544a\uff09', sameDateNote: '\u8bf7\u4f7f\u7528\u4e0e\u514d\u8d39\u9884\u89c8\u76f8\u540c\u7684\u51fa\u751f\u65e5\u671f\u548c\u7535\u90ae\uff0c\u65b9\u4fbf\u8fd4\u56de\u67e5\u770b\u62a5\u544a\u3002',
    promoAccessSummary: '有受邀试用码？', promoCodeLabel: '试用码', promoAccessButton: '解锁试用', promoAccessNote: '受邀试用码在 7 天后过期。试用权限为 7 天或 14 天，并绑定一个邮箱和出生日期。', promoCodeWorking: '正在验证试用码…', promoCodeSuccess: '你的限时试用已解锁。',
    fullReadingTitle: '\u4f60\u7684\u5b8c\u6574\u62a5\u544a', liveReaderTitle: '普通提问（3 次）',
    liveReaderBody: '所有问题现已合并至掌门聊天。',
    masterChatTitle: '\u95ee\u638c\u95e8',
    masterChatBody: '\u62a5\u544a\u91cc\u8fd8\u6709\u4e0d\u660e\u767d\u7684\u5730\u65b9\uff1f\u63a5\u7740\u95ee\u2014\u2014\u638c\u95e8\u53ea\u6839\u636e\u4f60\u81ea\u5df1\u7684\u62a5\u544a\u56de\u7b54\uff0c\u4e5f\u8bb0\u5f97\u4f60\u4e4b\u524d\u95ee\u8fc7\u4ec0\u4e48\u3002',
    followupsLeft: '剩余 Master 追问',
    masterChatsLeft: '剩余 Master 追问',
    aiBadge: 'Master',
    mcRuleBasedTag: '\u6839\u636e\u4f60\u7684\u62a5\u544a\u6574\u7406',
    chipExplain: '\u8fd9\u662f\u4ec0\u4e48\u610f\u601d\uff1f', chipExample: '\u4e3e\u4e2a\u4f8b\u5b50', chipDeeper: '\u591a\u8bf4\u4e00\u70b9\u5de5\u4f5c',
    mcAskPh: '\u95ee\u4e00\u4e2a\u8ffd\u95ee\u2026\u2026',
    masterChatNote: '\u8ffd\u95ee\u53ea\u6839\u636e\u4f60\u81ea\u5df1\u7684\u62a5\u544a\u56de\u7b54\u2014\u2014\u6ca1\u6709\u9884\u6d4b\uff0c\u4e5f\u4e0d\u7ed9\u533b\u7597\u3001\u8d22\u52a1\u6216\u6cd5\u5f8b\u5efa\u8bae\u3002',
    masterChatExplainer: '三个主要问题，逐题交流。可继续追问，满意后点击下一题。',
    upgradeTitle: '需要更多追问？',
    upgradeBody: '本次报告已包含 5 次追问。可任选一次加购：$1.99 增加 5 次，或 $3.49 增加 10 次。',
    upgradeBtn: '加购追问',
    upgradeExtended: '\u638c\u95e8\u8ffd\u95ee\u52a0\u8d2d',
    upgradeOffer: '任选一个加购包，或继续下一个主要问题。',
    upgradeDone: '追问次数已增加，之前的使用次数保留。',
    upgradeFail: '\u65e0\u6cd5\u5f00\u59cb\u5347\u7ea7\u7ed3\u8d26\uff0c\u8bf7\u518d\u8bd5\u4e00\u6b21\u3002',
    upgradePending: '追问加购正在开通中——如果计数尚未更新，请稍后刷新本页。',
    skipToMaster: '\u76f4\u63a5\u53bb\u627e\u638c\u95e8 \u2192',
    sysOpen: '打开完整页面',
    backToHub: '← 回到六个系统',
    nextSystem: '下一个',
    hubNext: '开始阅读 — 下一个：八字 →',
    stepOf: '第 {n} 步，共 8 步 — {name}',
    prevStep: '← 上一步',
    nextStep: '下一个：{name} →',
    startWithDate: '先输入出生日期 →',
    previewEnvironment: '测试预览 · 不接入付款或正式用户数据',
    previewUnlockTitle: '预览完整解读',
    previewOnlyPrice: '免费预览 · 不会收费',
    previewOnlyBody: '打开一份临时完整解读，查看各系统页面、翻牌和起盘互动。此预览不会收款或发送邮件。',
    previewOnlyNote: '仅供测试预览。解读权限保存在临时空间，免费服务休眠后可能重置。',
    previewUnlock: '打开完整解读预览',
    previewAccessFail: '暂时无法打开预览，请重试。',
    previewProfileNote: '出生资料仅用于生成这份临时预览，不需要输入电邮。',
    doneHub: '完成 — 回到首页',
    allSystems: '全部六个系统',
    masterLockedTitle: '问掌门尚未解锁',
    masterLockedBody: '解锁完整报告即包含 5 次掌门追问。可选加购：$1.99 增加 5 次，或 $3.49 增加 10 次。',
    masterLockedLink: '← 回到首页解锁',
    tapEnlarge: '\u518d\u70b9\u4e00\u4e0b\u5df2\u7ffb\u5f00\u7684\u724c\uff0c\u53ef\u4ee5\u653e\u5927\u67e5\u770b',
    heroLocked: '\u89e3\u9501\u5b8c\u6574\u62a5\u544a\uff0c\u5373\u53ef\u5728\u8fd9\u91cc\u770b\u5230\u4f60\u7684\u7ed3\u679c\u3002',
    downloadReport: '\u4e0b\u8f7d\u6211\u7684\u62a5\u544a',
    downloadNote: '\u90ae\u4ef6\u53d1\u9001\u6682\u65f6\u65e0\u6cd5\u4f7f\u7528\u3002\u4f60\u7684\u5df2\u89e3\u9501\u62a5\u544a\u53ef\u5728\u8fd9\u91cc\u4e0b\u8f7d\u3002',
    downloadFail: '\u4e0b\u8f7d\u5931\u8d25\u2014\u2014\u8bf7\u5148\u6253\u5f00\u5b8c\u6574\u62a5\u544a\uff0c\u518d\u8bd5\u4e00\u6b21\u3002',
    resendSandbox: '\u8fd9\u4e2a\u90ae\u7bb1\u6682\u65f6\u6536\u4e0d\u5230\u62a5\u544a\u2014\u2014\u53d1\u4ef6\u4eba\u4ecd\u5728\u6d4b\u8bd5\u6a21\u5f0f\uff0c\u53ea\u80fd\u53d1\u7ed9\u8d26\u53f7\u672c\u4eba\u7684\u90ae\u7bb1\u3002\u8bf7\u7528\u4e0b\u9762\u7684\u201c\u4e0b\u8f7d\u6211\u7684\u62a5\u544a\u201d\u76f4\u63a5\u83b7\u53d6\u62a5\u544a\u3002',
    mcLimit: '\u672c\u6b21\u7684 5 \u6b21\u8ffd\u95ee\u5df2\u7ecf\u7528\u5b8c\u3002',
    mcYou: '\u4f60', mcMaster: '\u638c\u95e8',
    questionsUsed: '\u5df2\u7528\u95ee\u9898', ask: '\u63d0\u95ee', askPh: '\u95ee\u4e00\u4e2a\u95ee\u9898\u2026\u2026', speakAnswer: '\u5927\u58f0\u8bfb\u51fa\u7b54\u6848', stopSpeaking: '\u505c\u6b62\u6717\u8bfb',
    dailyTitle: '\u514d\u8d39\u6bcf\u65e5\u9f13\u52b1', dailyBody: '\u6bcf\u65e5\u9f13\u52b1\u90ae\u4ef6\u6682\u65f6\u65e0\u6cd5\u4f7f\u7528\u3002\u4f60\u5df2\u89e3\u9501\u7684\u62a5\u544a\u4ecd\u53ef\u5728\u6b64\u67e5\u770b\u3002',
    limitsTitle: '\u8bda\u5b9e\u8bf4\u660e',
    limit1: '\u516b\u5b57\u4e3a\u7b80\u5316\u6f14\u793a\u5f15\u64ce\u2014\u2014\u5c1a\u672a\u505a\u771f\u592a\u9633\u65f6\u6821\u6b63\u3002',
    limit2: '\u7d2b\u5fae\u6839\u636e\u51fa\u751f\u65e5\u671f\u3001\u51fa\u751f\u65f6\u95f4\u53ca\u6392\u76d8\u6027\u522b\u8ba1\u7b97\uff1b\u4f7f\u7528\u8f93\u5165\u7684\u949f\u8868\u65f6\u95f4\uff0c\u672a\u4f5c\u771f\u592a\u9633\u65f6\u5730\u70b9\u6821\u6b63\u3002',
    limit3: '\u4ec5\u4f9b\u81ea\u6211\u53cd\u601d\u4e0e\u5a31\u4e50\u2014\u2014\u4e0d\u662f\u533b\u7597\u3001\u8d22\u52a1\u6216\u6cd5\u5f8b\u5efa\u8bae\u3002',
    limit4: '\u6708\u4eae\u4e0e\u4e0a\u5347\u661f\u5ea7\u4e3a\u539f\u578b\u7684\u8fd1\u4f3c\u8ba1\u7b97\u3002',
    moreDetail: '\u66f4\u591a\u8be6\u60c5', strongest: '\u6700\u65fa', weakest: '\u6700\u5f31',
    tapReveal: '\u70b9\u4e00\u4e0b\u63ed\u5f00', tapFlip: '\u70b9\u4e00\u5f20\u724c\u7ffb\u5f00\u5b83', castChart: '\u8d77\u76d8', castCoins: '\u63b7\u5366', castAgain: '\u518d\u6b21\u8d77\u5366',
    lockedTitle: '\u5b8c\u6574\u5185\u5bb9\u672a\u89e3\u9501', lockedBody: '\u89e3\u9501\u5b8c\u6574\u62a5\u544a\uff0c\u5373\u53ef\u9605\u8bfb\u5168\u90e8\u7ec6\u8282\u3002',
    unlockBtn: '\u89e3\u9501\u5b8c\u6574\u62a5\u544a', casting: '\u8d77\u5366\u4e2d\u2026\u2026', flipping: '\u70b9\u4e00\u4e0b\u7ffb\u724c', flipAllTarot: '\u7ffb\u5f00\u4e09\u5f20\u724c\uff0c\u770b\u770b\u5b83\u4eec\u5408\u8d77\u6765\u8bf4\u7684\u6545\u4e8b\u3002',
    readingGlimpse: '\u6b63\u5728\u8bfb\u53d6\u4f60\u7684\u9884\u89c8\u2026\u2026', enterDateFirst: '\u8bf7\u5148\u5728\u514d\u8d39\u4e00\u77a5\u8868\u5355\u8f93\u5165\u51fa\u751f\u65e5\u671f\u3002', loadingSavedGlimpse: '\u6b63\u5728\u8bfb\u53d6\u4f60\u4fdd\u5b58\u7684\u9884\u89c8\u2026',
    couldNotRead: '\u65e0\u6cd5\u8bfb\u53d6\u8be5\u51fa\u751f\u65e5\u671f\u3002', networkError: '\u7f51\u7edc\u9519\u8bef\uff1a',
    masterUnreachable: '\u638c\u95e8\u6682\u65f6\u8054\u7cfb\u4e0d\u4e0a\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002',
    extendedLimit: '掌门追问次数已用完。',
    aiRestingNote: 'Master 暂时无法回答，请稍后重试。追问次数未扣除。',
    unreachable: '\u6682\u65f6\u8054\u7cfb\u4e0d\u4e0a\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002',
    mcThinking: '\u638c\u95e8\u6b63\u5728\u601d\u8003\u2026',
    lrThinking: '\u6b63\u5728\u601d\u8003\u2026',
    payUnlock: '\u4ed8\u6b3e\u5e76\u89e3\u9501', priceUnavailable: '\u6682\u65f6\u65e0\u6cd5\u53d6\u5f97\u4ef7\u683c\u2014\u2014\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002',
    promoPriceLine: (amount, start, end, full) => `限时优惠 $${amount} · ${start} 至 ${end} · 之后 $${full}`,
    fullPriceLine: (amount) => `完整解锁 $${amount}`, payAmountUnlock: (amount) => `支付 $${amount} 并解锁`,
    noChangingLines: '没有变爻——本次卦象维持第 {number} 卦·{name}。',
    questions: '\u9898', questionOf: '\u7b2c', of: '/', back: '\u2190 \u4e0a\u4e00\u9898', restart: '\u91cd\u65b0\u6d4b\u9a8c',
    startQuiz: '\u5f00\u59cb\u6d4b\u9a8c', retake: '\u91cd\u65b0\u6d4b\u9a8c', yourType: '\u4f60\u7684\u7c7b\u578b', fullBreakdownLocked: '\u5b8c\u6574\u89e3\u6790\u672a\u89e3\u9501\u2014\u2014\u89e3\u9501\u540e\u53ef\u9605\u8bfb\u3002',
    strengths: '\u957f\u5904', whatsLacking: '\u5c1a\u7f3a\u4e4b\u5904', yourResult: '\u4f60\u7684\u7ed3\u679c',
    resendOk: '\u62a5\u544a\u7535\u90ae\u5df2\u91cd\u5bc4\u2014\u2014\u8bf7\u68c0\u67e5\u6536\u4ef6\u7bb1\u3002', resendFail: '\u65e0\u6cd5\u91cd\u5bc4\u62a5\u544a\u7535\u90ae\u3002',
    checkoutFail: '\u7ed3\u5e10\u5931\u8d25\u3002', checkoutError: '\u7ed3\u5e10\u9519\u8bef\uff1a',
    voiceUnsupported: '\u6b64\u6d4f\u89c8\u5668\u4e0d\u652f\u63f4\u8bed\u97f3\u8f93\u5165\u2014\u2014\u8bf7\u6253\u5b57\u63d0\u95ee\u3002',
    portraitTitle: '\u5b8c\u6574\u8096\u50cf', synthesisTitle: '\u516d\u4e2a\u7cfb\u7edf\u4e00\u81f4\u4e4b\u5904\u2014\u2014\u4ee5\u53ca\u5f20\u529b\u6240\u5728',
    sampleNote: '\u6839\u636e\u4f60\u7684\u51fa\u751f\u8d44\u6599\u8ba1\u7b97\u3002',
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
  renderCheckoutPrice();
  $('lang-en').classList.toggle('active', lang === 'en');
  $('lang-zh').classList.toggle('active', lang === 'zh');
  applyPreviewModeUI();
  renderSystems(); renderQuizList(); renderReportCard(); renderMcThread(); renderMcCounter();
}
function applyPreviewModeUI() {
  if (!state.previewMode) return;
  $('preview-environment-banner').textContent = t('previewEnvironment');
  $('preview-environment-banner').classList.remove('hidden');
  $('preview-tools').classList.remove('hidden');
  $('preview-mode-note').textContent = t('previewOnlyNote');
  $('preview-unlock-btn').textContent = t('previewUnlock');
  $('checkout-form').classList.add('hidden');
  $('unlock-title').textContent = t('previewUnlockTitle');
  $('price-line').textContent = t('previewOnlyPrice');
  $('unlock-body').textContent = t('previewOnlyBody');
  $('unlock-note').textContent = t('previewProfileNote');
  $('unlock-note').dataset.i18n = 'previewProfileNote';
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
function sysHead(icon, title) {
  const roles = [
    { match: 'Bazi', en: 'The Pattern Reader', zh: '五行观察者' },
    { match: 'Zi Wei', en: 'The Star Cartographer', zh: '星曜地图师' },
    { match: 'Horoscope', en: 'The Sky Editor', zh: '星空编辑' },
    { match: 'Yi-Jing', en: 'The Change Editor', zh: '变化解读者' },
    { match: 'Tarot', en: 'The Card Storyteller', zh: '牌面故事家' },
    { match: 'Numerology', en: 'The Number Archivist', zh: '数字档案员' },
  ];
  const role = roles.find((item) => title.includes(item.match));
  const label = role ? (state.lang === 'zh' ? role.zh : role.en) : (state.lang === 'zh' ? '综合编辑' : 'The Synthesis Editor');
  return `<h2><span class="sys-icon">${icon}</span><span>${esc(title)}</span><small class="guide-credit">${esc(label)}</small></h2>`;
}
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
  if (pageSystem) { location.href = '/#hook-card'; return; }
  const card = $('hook-card');
  card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  card.classList.add('attention');
  setTimeout(() => card.classList.remove('attention'), 2200);
  $('teaser-status').textContent = t('enterDateFirst');
}
function previewSystemsHTML() {
  let html = '';
  html += `<section class="card" id="sys-bazi">${sysHead('\uD83C\uDF3F', 'Bazi \u516b\u5b57')}<p class="lede sys-desc">${esc(t('sysDescBazi'))}</p>${revealCover('\uD83C\uDF3F', `${t('tapReveal')} \u2014 ${t('dayMaster')}`, t('enterDateFirst'))}</section>`;
  html += `<section class="card" id="sys-ziwei">${sysHead('\u2B50', 'Zi Wei \u7d2b\u5fae\u6597\u6570')}<p class="lede sys-desc">${esc(t('sysDescZiwei'))}</p><p class="lede">${esc(t('lifePalace'))} \u00B7 ${esc(t('enterDateFirst'))}</p><button type="button" data-preview="ziwei">\u2728 ${esc(t('castChart'))}</button></section>`;
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
  if (state.yijingResult?.lines?.length === 6) return state.yijingResult.lines;
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
      return `<div class="hero-result">${esc(L(dm))}</div><p class="hero-sub">${esc(L(unlocked ? r.bazi.dayMasterText : (src.bazi.workPreview || src.bazi.hook)))}</p>${!unlocked && src.bazi.strongestElement ? `<p class="hero-sub">${esc(t('strongest'))}: ${esc(L(src.bazi.strongestElement))}</p>` : ''}`;
    }
    case 'ziwei': {
      const pal = unlocked ? r.ziwei.palaces[0] : null;
      const star = unlocked ? L(pal.star) : L(src.ziwei.mainStar);
      const palaceName = unlocked ? L(pal) : L({ en: src.ziwei.lifePalace, zh: src.ziwei.lifePalaceZh });
      const localizedPalace = unlocked ? (state.lang === 'zh' ? r.ziwei.lifePalaceZh : r.ziwei.lifePalace) : palaceName;
      return `<div class="hero-result">★ ${esc(star)}</div><p class="hero-sub">${esc(localizedPalace)} · ${esc(L(unlocked ? pal.text : src.ziwei.hook))}</p>`;
    }
    case 'horoscope': {
      const sun = unlocked ? r.horoscope.sun : { en: src.horoscope.sunSign, zh: src.horoscope.sunSignZh, symbol: '☉' };
      return `<div class="hero-result"><span class="hero-glyph">${esc(sun.symbol || '☉')}</span> ${esc(L(sun))}</div><p class="hero-sub">${esc(L(unlocked ? r.horoscope.sun.trait : src.horoscope.hook))}</p>${unlocked ? `<p class="hero-sub">${esc(r.horoscope.moon.symbol)} ${esc(t('moon'))}: ${esc(L(r.horoscope.moon))} &nbsp;·&nbsp; ${esc(r.horoscope.rising.symbol)} ${esc(t('rising'))}: ${esc(L(r.horoscope.rising))}</p>` : ''}`;
    }
    case 'yijing': {
      const latestCast = state.yijingResult;
      const hex = latestCast
        ? `${latestCast.hexagram.number} · ${L(latestCast.hexagram)}`
        : (unlocked ? r.yijing.hexagram : src.yijing.hexagram);
      const preview = latestCast
        ? latestCast.preview
        : (unlocked ? r.yijing.theme : (src.yijing.preview || src.yijing.hook));
      return `<div class="hero-result">${esc(hex)}</div><p class="hero-sub">${esc(L(preview))}</p>`;
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
      return ''; 
    default:
      return '';
  }
}
function pageHeroHTML() {
  if (!pageSystem) return '';
  const meta = SYS_META[pageSystem];
  if (!meta) return '';
  const start = !state.teaser && !state.report ? `<p><a class="editorial-link" href="/#hook-card">${esc(t('startWithDate'))}</a></p>` : '';
  return `<div class="sys-hero"><h1 class="sys-hero-title">${esc(meta.title)}</h1><p class="lede">${esc(t(meta.descKey))}</p>${heroResultHTML(pageSystem)}${start}</div>`;
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
  show('systems', true);
  show('sys-hero', !!pageSystem);
  show('step-nav', !!pageSystem);
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
  show('master-locked-card', onMaster && !state.unlocked && !state.ziweiInputsNeeded);
  show('ziwei-input-card', (onMaster || onHub) && state.unlocked && state.ziweiInputsNeeded);
  if (onMaster && state.ziweiInputsNeeded) show('report-card', false);
  const hubNext = $('hub-next');
  if (hubNext) { hubNext.innerHTML = hubNextHTML(); show('hub-next', !onMaster); }
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
    if (state.teaserLoading && pageSystem !== 'master') {
      const message = `<p class="lede" role="status">${esc(t('loadingSavedGlimpse'))}</p>`;
      const hero = $('sys-hero');
      if (pageSystem && hero) hero.innerHTML = `<div class="sys-hero"><h1 class="sys-hero-title">${esc(SYS_META[pageSystem]?.title || '')}</h1>${message}</div>`;
      box.innerHTML = pageSystem ? `<section class="card">${message}</section>` : message;
      applyPageLayout(); bindPreviewEvents(); return;
    }
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
  const baziHook = unlocked ? r.bazi.dayMasterText : (src.bazi.workPreview || src.bazi.hook);
  const horoHook = hookOf('horoscope', unlocked ? r.horoscope.sun.trait : null);
  const numHook = hookOf('numerology', unlocked ? r.numerology.lifePathText : null);
  const yijingHook = state.yijingResult?.preview || hookOf('yijing', unlocked ? r.yijing.theme : null);
  let html = '';

  /* Bazi */
  html += `<section class="card" id="sys-bazi">${sysHead('\uD83C\uDF3F', 'Bazi \u516b\u5b57')}<p class="lede sys-desc">${esc(t('sysDescBazi'))}</p>`;
  if (!state.revealed.bazi) {
    html += revealCover('\uD83C\uDF3F', `${t('tapReveal')} \u2014 ${t('dayMaster')}`, t('tapReveal'));
  } else {
    const dm = unlocked ? r.bazi.dayMaster : { en: src.bazi.dayMaster, zh: src.bazi.dayMasterZh };
    html += `<div class="reveal-in"><p class="essence">${esc(t('dayMaster'))}: ${esc(L(dm))}</p>${!unlocked && src.bazi.strongestElement ? `<p class="lede">${esc(t('strongest'))}: ${esc(L(src.bazi.strongestElement))}</p>` : ''}<p class="hook-line">${esc(L(baziHook))}</p>`;
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
    const life = unlocked ? r.ziwei.mainStar : src.ziwei.mainStar;
    const palace = unlocked ? (state.lang === 'zh' ? r.ziwei.lifePalaceZh : r.ziwei.lifePalace) : (state.lang === 'zh' ? src.ziwei.lifePalaceZh : src.ziwei.lifePalace);
    html += `<p class="lede">${esc(t('lifePalace'))} · ${esc(L(life))} · ${esc(palace)}</p>${!unlocked && src.ziwei.meaningPreview ? `<p class="hook-line">${esc(L(src.ziwei.meaningPreview))}</p>` : ''}<button type="button" data-act="cast-ziwei">\u2728 ${esc(t('castChart'))}</button>`;
  } else {
    html += `<p class="small">${esc(t('sampleNote'))}</p>`;
    const palaces = unlocked ? r.ziwei.palaces : [{ key: 'soul', en: 'Life Palace', zh: '\u547d\u5bab', star: src.ziwei.mainStar, text: src.ziwei.meaningPreview || src.ziwei.hook }];
    html += `<div class="palace-grid">${palaces.map((p) => {
      const isLife = p.key === 'life' || p.key === 'soul';
      const readable = unlocked || isLife;
      return `<div class="palace cast-item ${isLife ? 'main' : ''}"><div class="pname">${esc(L(p))}</div><div class="star">${esc(L(p.star))}</div>${readable && p.text ? `<p>${esc(L(p.text))}</p>` : `<div class="skel"></div><div class="skel short"></div>`}</div>`;
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

  /* The interactive Yi-Jing cast is newly randomized for every attempt.
     The full report below remains stable for this birth profile. */
  html += `<section class="card" id="sys-yijing">${sysHead('\u262F\uFE0F', 'Yi-Jing \u6613\u7ecf')}<p class="lede sys-desc">${esc(t('sysDescYijing'))}</p><p class="lede">${esc(t('yijingHow'))}</p>`;
  if (!state.yijingCast) {
    html += `<button type="button" data-act="cast-yijing">\uD83E\uDE99 ${esc(t('castCoins'))}</button><div class="yijing-stage"></div>`;
  } else {
    const hex = state.yijingResult ? `${state.yijingResult.hexagram.number} · ${L(state.yijingResult.hexagram)}` : (unlocked ? r.yijing.hexagram : src.yijing.hexagram);
    html += `<button type="button" data-act="cast-yijing">\uD83E\uDE99 ${esc(t('castAgain'))}</button>`;
    html += `<div class="yijing-stage">${hexagramDiagramHTML(yijingLinesOf())}`;
    html += `<div class="reveal-in"><p class="essence">${esc(t('hexagram'))}: ${esc(hex)}</p><p class="hook-line">${esc(L(yijingHook))}</p>`;
    if (state.yijingResult) {
      const cast = state.yijingResult;
      const castLineSummary = cast.changingLines.length
        ? `${t('changingLines')}: ${cast.changingLines.join(', ')} · → ${cast.transformed.number} ${L(cast.transformed)}`
        : t('noChangingLines').replace('{number}', String(cast.hexagram.number)).replace('{name}', L(cast.hexagram));
      html += `<p class="small">${esc(castLineSummary)}</p>`;
    }
    if (unlocked) {
      html += `<p><span class="badge">${esc(t('changingLines'))}: ${r.yijing.changingLines.length ? r.yijing.changingLines.join(', ') : '\u2014'}</span>${r.yijing.transformed ? `<span class="badge">\u2192 ${esc(r.yijing.transformed.number)} \u00B7 ${esc(L(r.yijing.transformed))}</span>` : ''}</p>`;
      if (r.yijing.sections.changing) html += `<h3>${esc(t('changingLines'))}</h3><p>${esc(L(r.yijing.sections.changing))}</p>`;
      html += sectionHTML(r.yijing.sections, ['overview', 'career', 'relationships', 'health', 'timing']);
    } else html += lockBlock();
    html += `</div></div>`;
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
      </div></div><p class="tarot-pos">${esc(t(posKeys[i]))}</p>${!unlocked && c.meaningPreview ? `<p class="tarot-preview">${esc(L(c.meaningPreview))}</p>` : ''}</div>`;
  }).join('')}</div>`;
  html += `<div id="tarot-detail">${cards.map((c, i) => {
    if (!state.tarotFlipped[i]) return '';
    if (unlocked) {
      return `<div class="tarot-detail reveal-in"><h3>${esc(t(posKeys[i]))} \u2014 ${esc(L(c.name))}${c.reversed ? ` (${esc(t('reversed'))})` : ''}</h3><p>${esc(L(c.meaning))}</p><p class="hook-line">${esc(L(c.positionText))}</p><p>${esc(L(c.forQuestion))}</p></div>`;
    }
    return `<div class="tarot-detail"><p class="hook-line"><strong>${esc(L(c.name))}</strong> \u2014 ${esc(tarotKeywords(c))}</p>${c.meaningPreview ? `<p>${esc(L(c.meaningPreview))}</p>` : ''}${lockBlock()}</div>`;
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
  const portraitPreview = !unlocked && Array.isArray(src.portrait.previewLines?.[state.lang])
    ? src.portrait.previewLines[state.lang].map((line) => `<p class="essence">${esc(line)}</p>`).join('')
    : `<p class="essence">${esc(L(src.portrait.essenceLine))}</p>`;
  html += `<section class="card" id="sys-portrait">${sysHead('\uD83E\uDE9E', t('portraitTitle'))}<p class="lede sys-desc">${esc(t('sysDescPortrait'))}</p>${portraitPreview}`;
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
    el.onclick = async () => {
      if (state.yijingCasting) return;
      const stage = el.parentElement ? el.parentElement.querySelector('.yijing-stage') : null;
      if (!stage) return;
      state.yijingCasting = true;
      el.disabled = true;
      try {
        const response = await fetch('/api/yijing/cast', { cache: 'no-store' });
        if (!response.ok) throw new Error('cast_failed');
        const cast = await response.json();
        const revealed = [];
        const step = (i) => {
          if (i >= 6) {
            setTimeout(() => { state.yijingResult = cast; state.yijingCast = true; state.yijingCasting = false; renderSystems(); }, 350);
            return;
          }
          const line = cast.lines[i];
          stage.innerHTML = `<p class="lede">${esc(t('castingLine').replace('{n}', line.line))}</p>${yijingCoinsHTML(line.sum)}${hexagramDiagramHTML(revealed)}`;
          stage.querySelectorAll('.coin').forEach((c) => c.classList.add('spin'));
          setTimeout(() => { revealed.push(line); stage.innerHTML = `<p class="lede">${esc(t('castingLine').replace('{n}', line.line))}</p>${yijingCoinsHTML(line.sum)}${hexagramDiagramHTML(revealed)}`; step(i + 1); }, 450);
        };
        step(0);
      } catch {
        state.yijingCasting = false;
        stage.textContent = state.lang === 'zh' ? '暂时无法起卦，请重试。' : 'Could not cast just now. Please try again.';
        el.disabled = false;
      }
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
function saveProfile(birthDate, birthTime, name, ziweiGender) {
  try {
    if (birthDate) localStorage.setItem('fateweave_birthDate', birthDate);
    localStorage.setItem('fateweave_birthTime', birthTime || '');
    localStorage.setItem('fateweave_ziweiGender', ziweiGender || '');
    localStorage.setItem('fateweave_name', name || '');
  } catch {}
}
function prefillForm() {
  try {
    const birthDate = localStorage.getItem('fateweave_birthDate');
    const birthTime = localStorage.getItem('fateweave_birthTime');
    const ziweiGender = localStorage.getItem('fateweave_ziweiGender');
    const name = localStorage.getItem('fateweave_name');
    const email = localStorage.getItem('fateweave_email');
    if (birthDate) $('birthDate').value = birthDate;
    if (birthTime) $('birthTime').value = birthTime;
    if (ziweiGender) $('ziweiGender').value = ziweiGender;
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
  state.yijingResult = null;
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
    state.fullPriceCents = data.fullPriceCents || 800;
    state.masterPacks = data.masterProbePacks || [];
    state.previewMode = data.previewMode === true;
    state.promoAccessEnabled = data.promoAccessEnabled === true;
    $('promo-access').classList.toggle('hidden', !state.promoAccessEnabled);
    if (state.previewMode) { applyPreviewModeUI(); return; }
    renderCheckoutPrice();
  } catch {
    $('price-line').textContent = t('priceUnavailable');
    $('pay-btn').textContent = t('payUnlock');
  }
}

function renderCheckoutPrice() {
  const priceLine = $('price-line');
  const payButton = $('pay-btn');
  if (!priceLine || !payButton) return;
  if (!state.price) { payButton.textContent = t('payUnlock'); return; }
  const amount = (state.price.amountCents / 100).toFixed(2);
  const full = ((state.fullPriceCents || 800) / 100).toFixed(2);
  priceLine.textContent = state.price.isPromo
    ? STR[state.lang].promoPriceLine(amount, state.price.promoStart, state.price.promoEnd, full)
    : STR[state.lang].fullPriceLine(amount);
  payButton.textContent = STR[state.lang].payAmountUnlock(amount);
}

$('hook-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const birthDate = $('birthDate').value;
  const birthTime = $('birthTime').value;
  const ziweiGender = $('ziweiGender').value;
  const name = $('name').value || null;
  const status = $('teaser-status');
  status.textContent = t('readingGlimpse');
  try {
    const res = await fetch('/api/hook', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ birthDate, birthTime, ziweiGender, name }) });
    const data = await res.json();
    if (!res.ok) { status.textContent = data.error || t('couldNotRead'); return; }
    // The profile the user just asked about is the current profile from now
    // on — persist date, time and name so a reload prefills all three.
    const prevBirthDate = state.report?.profile?.birthDate || localStorage.getItem('fateweave_birthDate');
    saveProfile(birthDate, birthTime, name, ziweiGender);
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

$('ziwei-input-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const status = $('ziwei-input-status');
  const birthTime = $('ziwei-birth-time').value;
  const ziweiGender = $('ziwei-birth-gender').value;
  status.textContent = t('readingGlimpse');
  try {
    const res = await fetch('/api/update-ziwei-inputs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...authParams(), birthTime, ziweiGender }) });
    const data = await res.json();
    if (!res.ok) { status.textContent = data.error || t('couldNotRead'); return; }
    saveProfile(authParams().birthDate, birthTime, $('name').value || localStorage.getItem('fateweave_name') || '', ziweiGender);
    $('birthTime').value = birthTime; $('ziweiGender').value = ziweiGender;
    status.textContent = '';
    if (!await loadReport(true)) status.textContent = t('couldNotRead');
  } catch (err) { status.textContent = t('networkError') + err.message; }
});

$('checkout-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = $('email').value;
  const birthDate = $('birthDate').value;
  if (!birthDate) { alert(t('enterDateFirst')); return; }
  const birthTime = $('birthTime').value;
  const ziweiGender = $('ziweiGender').value;
  if (!birthTime || !ziweiGender) { $('birthTime').reportValidity(); $('ziweiGender').reportValidity(); return; }
  const name = $('name').value || null;
  // Persist the profile (and email) now, so a reload or an abandoned
  // checkout never loses what the user already typed.
  saveProfile(birthDate, birthTime, name, ziweiGender);
  try { localStorage.setItem('fateweave_email', email); } catch {}
  try {
    const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, birthDate, birthTime, ziweiGender, name }) });
    const data = await res.json();
    if (!res.ok) { alert(data.error || t('checkoutFail')); return; }
    location.href = data.checkoutUrl;
  } catch (err) { alert(t('checkoutError') + err.message); }
});

$('promo-access-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = $('email').value.trim();
  const birthDate = $('birthDate').value;
  const birthTime = $('birthTime').value;
  const ziweiGender = $('ziweiGender').value;
  const status = $('promo-access-status');
  if (!birthDate || !birthTime || !ziweiGender) {
    status.textContent = flowText('Complete your birth date, birth time and chart sex above first.','请先填写上方的出生日期、时间和排盘性别。');
    return;
  }
  const button = $('promo-access-btn');
  button.disabled = true;
  status.textContent = t('promoCodeWorking');
  try {
    const res = await fetch('/api/redeem-promo', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,birthDate,birthTime,ziweiGender,name:$('name').value||null,promoCode:$('promo-code').value})});
    const data = await res.json();
    if (!res.ok || !data.token) { status.textContent = data.error || t('previewAccessFail'); return; }
    saveProfile(birthDate,birthTime,$('name').value||'',ziweiGender);
    localStorage.setItem('fateweave_token',data.token);
    localStorage.setItem('fateweave_email',data.email);
    localStorage.setItem('fateweave_tokenBirthDate',birthDate);
    localStorage.removeItem('fateweave_staging_preview');
    status.textContent = t('promoCodeSuccess');
    $('promo-code').value = '';
    if (!await loadReport(true)) status.textContent = flowText('The code was accepted, but your report did not load. Refresh this page to reopen it.','代码已接受，但报告未能加载。刷新页面后即可重新打开。');
  } catch { status.textContent = t('networkError'); }
  finally { button.disabled = false; }
});

async function unlockStagingPreview() {
  const birthDate = $('birthDate').value || localStorage.getItem('fateweave_birthDate');
  if (!birthDate) { alert(t('enterDateFirst')); location.href = '/#hook-card'; return; }
  const button = $('preview-unlock-btn');
  button.disabled = true;
  try {
    const birthTime = $('birthTime').value || localStorage.getItem('fateweave_birthTime') || null;
    const ziweiGender = $('ziweiGender').value || localStorage.getItem('fateweave_ziweiGender') || null;
    const name = $('name').value || localStorage.getItem('fateweave_name') || null;
    const res = await fetch('/api/preview-access', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ birthDate, birthTime, ziweiGender, name }),
    });
    const data = await res.json();
    if (!res.ok || !data.token) { alert(data.error || t('previewAccessFail')); return; }
    saveProfile(birthDate, birthTime, name, ziweiGender);
    localStorage.setItem('fateweave_token', data.token);
    localStorage.setItem('fateweave_email', data.email);
    localStorage.setItem('fateweave_staging_preview', '1');
    if (!await loadReport(true)) alert(t('previewAccessFail'));
  } catch { alert(t('previewAccessFail')); }
  finally { button.disabled = false; }
}
$('preview-unlock-btn').addEventListener('click', unlockStagingPreview);

/* --- Post-payment restore: token -> full reading, prefilled, no re-entry --- */
async function loadReport(quiet, _retried) {
  const { token, email, birthDate } = authParams();
  if (!token || !email || !birthDate) return false;
  try {
    const res = await fetch(`/api/report?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}&birthDate=${encodeURIComponent(birthDate)}`);
    if (!res.ok) {
      if (res.status === 409) {
        const problem = await res.json();
        if (problem.code === 'ziwei_inputs_required') {
          state.unlocked = true;
          state.ziweiInputsNeeded = true;
          $('ziwei-birth-time').value = problem.birthTime || localStorage.getItem('fateweave_birthTime') || '';
          $('ziwei-birth-gender').value = problem.ziweiGender || localStorage.getItem('fateweave_ziweiGender') || '';
          applyPageLayout();
          return false;
        }
      }
      // A 403 is a real "not paid / expired" — never retry it. Any other
      // failure (5xx, or a dropped request during a network incident)
      // gets ONE retry after 1.5 s: a single transient failure used to
      // leave /master showing "locked" until the buyer reloaded the page
      // (live 8 Nov 2026 — the first /master load after the $1 unlock
      // showed locked, the reload showed unlocked).
      if (res.status !== 403 && !_retried) {
        await new Promise((r) => setTimeout(r, 1500));
        return loadReport(quiet, true);
      }
      return false; // not paid / expired — stay on the hook view
    }
    const r = await res.json();
    state.report = r;
    state.unlocked = true;
    state.ziweiInputsNeeded = false;
    // Prefill the form from the stored order — the reading belongs to this birth date.
    $('birthDate').value = r.profile.birthDate || birthDate;
    if (r.profile.birthTime) $('birthTime').value = r.profile.birthTime;
    if (r.profile.name) $('name').value = r.profile.name;
    $('email').value = email;
    if (state.previewMode) {
      $('resend-btn').classList.add('hidden');
      $('resend-status').classList.add('hidden');
    }
    // Persist the paid profile: the token is bound to this birth date, so
    // remember which date it belongs to (returning to it after peeking at
    // another date must restore the paid reading), and keep birth time and
    // name stored so a reload prefills them too.
    try {
      localStorage.setItem('fateweave_tokenBirthDate', r.profile.birthDate || birthDate);
      localStorage.setItem('fateweave_birthTime', r.profile.birthTime || $('birthTime').value || '');
      localStorage.setItem('fateweave_ziweiGender', r.profile.ziweiGender || '');
      localStorage.setItem('fateweave_name', r.profile.name || $('name').value || '');
    } catch {}
    $('unlocked-banner').innerHTML = `${esc(t('unlockedBanner'))}<small>${esc(t('unlockedBannerSub'))}</small>`;
    $('unlocked-banner').classList.remove('hidden');
    $('unlocked-sub').textContent = email;
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
  } catch {
    // Network throw (offline / incident): one retry, then give up.
    if (!_retried) {
      await new Promise((r) => setTimeout(r, 1500));
      return loadReport(quiet, true);
    }
    return false;
  }
}

async function loadSavedTeaser() {
  const birthDate = localStorage.getItem('fateweave_birthDate');
  if (!birthDate) { state.teaserLoading = false; return false; }
  state.teaserLoading = true;
  renderSystems();
  try {
    const res = await fetch('/api/hook', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ birthDate, birthTime: localStorage.getItem('fateweave_birthTime') || null, ziweiGender: localStorage.getItem('fateweave_ziweiGender') || null, name: localStorage.getItem('fateweave_name') || null }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error('saved_teaser_failed');
    state.teaser = data;
    state.teaserLoading = false;
    renderSystems();
    return true;
  } catch {
    state.teaserLoading = false;
    renderSystems();
    return false;
  }
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
  h += sec('Zi Wei 紫微 — ' + r.ziwei.lifePalace, `<p><em>${esc(t('limit2'))}</em></p>` + r.ziwei.palaces.map((p) => `<h3>${esc(L(p))} · ${esc(L(p.branch))}${p.isBodyPalace ? ' · ' + (state.lang === 'zh' ? '身宫' : 'Body Palace') : ''}</h3><p><strong>${esc((p.majorStars || []).map((s) => L(s)).join(', ') || L(p.star))}</strong>${p.minorStars?.length ? '<br>' + esc(state.lang === 'zh' ? '辅曜' : 'Supporting stars') + ': ' + esc(p.minorStars.map((s) => L(s)).join(', ')) : ''}${p.decadal ? '<br>' + esc(state.lang === 'zh' ? '大限年龄' : 'Decadal ages') + ': ' + p.decadal.startAge + '–' + p.decadal.endAge : ''}</p><p>${esc(L(p.text))}</p>`).join('') + dlSecs(r.ziwei.sections));
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

/* --- Paid Live Reader — voice in + voice out, typed fallback -------------- */
// Load the buyer's REAL used count on init (7 Nov 2026 fix): the page
// used to show "Questions used: 0 / 3" on load because the count was
// only updated after a successful answer — so the screen said 0/3
// while the server refused the question. This fetches the count the
// server enforces, so the screen can never disagree with it.
async function loadLiveReaderCount() {
  if (!state.unlocked) return;
  try {
    const p = authParams();
    const res = await fetch(`/api/live-reader?token=${encodeURIComponent(p.token)}&email=${encodeURIComponent(p.email)}&birthDate=${encodeURIComponent(p.birthDate)}&sessionId=${state.sessionId}`);
    if (!res.ok) return;
    const data = await res.json();
    if (typeof data.questionsUsed === 'number') $('lr-used').textContent = String(data.questionsUsed);
  } catch {}
}
function setLrBusy(busy) {
  state.lrSending = !!busy;
  const ask = $('lr-ask'); if (ask) ask.disabled = !!busy;
}
function showLrThinking() {
  const box = $('lr-answers'); if (!box) return;
  box.innerHTML += `<p class="lr-thinking">${esc(t('lrThinking'))}</p>`;
  box.scrollTop = box.scrollHeight;
}
function hideLrThinking() {
  const box = $('lr-answers'); if (!box) return;
  const el = box.querySelector('.lr-thinking'); if (el) el.remove();
}
$('lr-ask').addEventListener('click', async () => {
  const q = $('lr-question').value.trim();
  if (!q || state.lrSending) return;
  const box = $('lr-answers');
  setLrBusy(true);
  showLrThinking();
  try {
    let res;
    try {
      res = await fetch('/api/live-reader', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...authParams(), sessionId: state.sessionId, question: q, lang: state.lang }) });
    } catch (err) {
      // Transport failure: friendly message, never the raw browser error.
      hideLrThinking();
      box.innerHTML += `<p>${esc(t('unreachable'))}</p>`;
      return;
    }
    let data = null;
    try { data = await res.json(); } catch { data = null; }
    hideLrThinking();
    if (!res.ok || !data || typeof data.answer !== 'string') {
      box.innerHTML += `<p>${esc((data && data.error) || t('unreachable'))}</p>`;
      return;
    }
    $('lr-used').textContent = String(data.questionsUsed);
    box.innerHTML += `<p><strong>You:</strong> ${esc(q)}</p><p><strong>Live Reader:</strong> ${esc(data.answer)}</p>`;
    $('lr-question').value = '';
    if ($('lr-speak').checked && 'speechSynthesis' in window) {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(data.answer);
      u.lang = state.lang === 'zh' ? 'zh-CN' : 'en-US';
      speechSynthesis.speak(u);
      $('lr-stop').classList.remove('hidden');
    }
  } catch (err) { hideLrThinking(); box.innerHTML += `<p>${esc(t('unreachable'))}</p>`; }
  finally { setLrBusy(false); hideLrThinking(); }
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
   5 included follow-ups per buyer, plus one optional 5- or 10-question pack,
   server-enforced,
   separate from Live Reader's 3 questions. History loads from the server
   on unlock, so a reload restores the thread. Each paid reading order has
   its own conversation, so a new purchase never inherits an old thread.
   Voice in reuses the Live Reader pattern (zh-CN/en-US); voice out
   reuses the Live Reader speak checkbox. */

let masterFlowState = null;
let pendingMasterRequest = null;
const flowText = (en,zh) => state.lang === 'zh' ? zh : en;
function renderAiRestNote() { const n=$('mc-ai-rest');if(n)n.classList.add('hidden'); }
function renderMcCounter() {
  if(!masterFlowState)return;
  const f=masterFlowState, active=f.topics.find(x=>x.id===f.activeTopicId);
  $('mc-left-label').textContent=flowText('Follow-ups left','剩余追问');
  $('mc-left').textContent=String(f.probesRemaining);$('mc-left-suffix').textContent=' / '+f.probeMax;
  $('mc-progress').textContent=flowText(`Main questions: ${f.mainUsed} / 3 · Add-on purchased: ${f.purchases>0?'yes':'no'}`,`主要问题：${f.mainUsed} / 3 · 已加购追问：${f.purchases>0?'是':'否'}`);
  $('mc-mode').textContent=active?flowText(`Continue question ${active.number}. Follow-ups share one balance across all three questions.`,`继续第 ${active.number} 题。三题共用追问次数。`):flowText(`Question ${f.mainUsed+1} of 3 — ask about a new topic.`,`第 ${f.mainUsed+1} 题，共 3 题：请输入新问题。`);
  const nextReminder=flowText('Follow-ups apply only to this question. Clicking Next closes it, and you cannot return to continue it.','追问仅针对当前问题。点击“下一题”后此题将关闭，之后无法返回继续追问。');
  $('mc-topic-warning').textContent=nextReminder;
  $('mc-topic-warning').classList.toggle('hidden',!active);
  $('mc-question').placeholder=active?flowText('Ask about this answer…','继续追问这条回答……'):flowText('What would you like to ask the Master?','你想问掌门什么问题？');
  $('mc-next').disabled=state.mcSending||!active||!f.mainRemaining;
  $('mc-next').textContent=f.mainRemaining?flowText('Next question →','下一题 →'):flowText('All 3 main questions started','已使用全部 3 个主要问题');
  $('mc-ask').disabled=state.mcSending||(!active&&!f.mainRemaining)||(!!active&&!f.probesRemaining);
  $('mc-ask').textContent=active?flowText('Ask follow-up','追问'):flowText('Ask the Master','问掌门');
  const pack5=$('mc-upgrade-5-btn'),pack10=$('mc-upgrade-10-btn');
  const options=state.masterPacks.length?state.masterPacks:[{additionalFollowups:5,amountCents:199},{additionalFollowups:10,amountCents:349}];
  const pack5Data=options.find(p=>p.additionalFollowups===5),pack10Data=options.find(p=>p.additionalFollowups===10);
  pack5.textContent=flowText(`Add 5 follow-ups — $${((pack5Data?.amountCents||199)/100).toFixed(2)}`,`加购 5 次追问 — $${((pack5Data?.amountCents||199)/100).toFixed(2)}`);
  pack10.textContent=flowText(`Add 10 follow-ups — $${((pack10Data?.amountCents||349)/100).toFixed(2)}`,`加购 10 次追问 — $${((pack10Data?.amountCents||349)/100).toFixed(2)}`);
  pack5.disabled=pack10.disabled=state.mcSending||f.purchasesRemaining===0;
  $('mc-upgrade-options').classList.toggle('hidden',f.purchasesRemaining===0);
  $('mc-upgrade-offer').classList.toggle('hidden',!active||f.probesRemaining>0);
  $('mc-upgrade-offer').textContent=f.purchasesRemaining?flowText('No follow-ups left. Choose one add-on pack, or use Next question if you have main questions remaining.','追问已用完。可任选一个加购包，或点击下一题使用剩余主要问题。'):flowText('Your one add-on has been used. Any remaining main questions are still available.','已使用唯一一次追问加购机会，仍可使用尚未用完的主要问题。');
  const badge=$('mc-ai-badge');if(badge)badge.classList.add('hidden');
}
function renderMcThread() {
  const box=$('mc-thread');if(!box||!masterFlowState)return;
  box.innerHTML=masterFlowState.topics.map(topic=>{
    const title=flowText('Question ','第 ')+topic.number+(state.lang==='zh'?' 题':'')+' · '+topic.question;
    const body=topic.messages.map(m=>`<div class="${m.role==='user'?'mc-user':'mc-master'}"><strong>${esc(m.role==='user'?flowText('You','你'):flowText('Master','掌门'))}</strong><p>${esc(m.content.replace(/\*\*/g,'')).replace(/\n/g,'<br>')}</p></div>`).join('');
    return topic.id===masterFlowState.activeTopicId?`<section class="master-topic"><h4>${esc(title)}</h4>${body}</section>`:`<details class="master-topic"><summary>${esc(title)}</summary>${body}</details>`;
  }).join('');
  box.scrollTop=box.scrollHeight;
}
function applyMasterFlow(data){masterFlowState=data;state.mcLeft=data.probesRemaining;state.mcMax=data.probeMax;state.mcExtended=data.purchases>0;renderMcCounter();renderMcThread();}
async function loadMasterChat(){
  if(!state.unlocked)return;
  try{const res=await fetch('/api/master-chat?'+new URLSearchParams(authParams()));if(res.ok)applyMasterFlow(await res.json());}catch{}
}
function mcSpeak(){}
function setMcBusy(busy){state.mcSending=!!busy;renderMcCounter();}
function showMcThinking(){const box=$('mc-thread');box.innerHTML+=`<p class="mc-thinking">${esc(flowText('The Master is thinking…','掌门正在思考……'))}</p>`;}
function hideMcThinking(){const el=$('mc-thread').querySelector('.mc-thinking');if(el)el.remove();}
function masterNotice(text){const n=$('mc-ai-rest');n.textContent=text;n.classList.remove('hidden');}
async function sendMasterChat(text){
  if(state.mcSending||!masterFlowState)return;
  const q=(text||$('mc-question').value||'').trim();if(!q)return;
  const f=masterFlowState,kind=f.activeTopicId?'probe':'main';
  if(kind==='probe'&&!f.probesRemaining){renderMcCounter();return;}
  if(!pendingMasterRequest||pendingMasterRequest.message!==q||pendingMasterRequest.topicId!==f.activeTopicId){pendingMasterRequest={message:q,topicId:f.activeTopicId,kind,requestId:crypto.randomUUID()};}
  setMcBusy(true);renderAiRestNote();showMcThinking();
  try{
    const res=await fetch('/api/master-chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...authParams(),...pendingMasterRequest,lang:state.lang})});
    const data=await res.json();
    if(!res.ok){masterNotice(data.error||flowText('Please retry. Your question is kept.','请重试，问题已保留。'));return;}
    pendingMasterRequest=null;$('mc-question').value='';applyMasterFlow(data);
  }catch{masterNotice(flowText('The Master could not be reached. Your question is kept; please retry.','暂时联系不上掌门。问题已保留，请重试。'));}
  finally{setMcBusy(false);hideMcThinking();}
}
$('mc-ask').addEventListener('click',()=>sendMasterChat());
$('mc-question').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();sendMasterChat();}});
$('mc-next').addEventListener('click',async()=>{
  if(state.mcSending||!masterFlowState?.activeTopicId)return;
  setMcBusy(true);
  try{const res=await fetch('/api/master-chat/next',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...authParams(),topicId:masterFlowState.activeTopicId})});const data=await res.json();if(!res.ok){masterNotice(data.error);return;}pendingMasterRequest=null;$('mc-question').value='';renderAiRestNote();applyMasterFlow(data);$('mc-question').focus();}catch{masterNotice(flowText('Could not move to the next question. Please retry.','暂时无法进入下一题，请重试。'));}finally{setMcBusy(false);}
});
/* --- Master follow-up add-on: choose one 5- or 10-question pack ----------
   Paid token only (the server checks the token and the Stripe payment).
   On success Stripe lands the buyer DIRECTLY on /master?upgraded=1 —
   checkUpgradeReturn() there verifies the session and the counter then
   restores the selected follow-up allowance. No hub detour or quiz. */
async function buyMasterUpgrade(packSize) {
  if (state.previewMode) { masterNotice(t('previewOnlyNote')); return; }
  $('mc-upgrade-5-btn').disabled = $('mc-upgrade-10-btn').disabled = true;
  try {
    const res = await fetch('/api/checkout-upgrade', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({...authParams(),packSize}) });
    const data = await res.json();
    if (!res.ok) { masterNotice(data.error || t('upgradeFail')); await loadMasterChat(); return; }
    
    location.href = data.checkoutUrl;
  } catch (e) { alert(t('upgradeFail')); $('mc-upgrade-5-btn').disabled = $('mc-upgrade-10-btn').disabled = false; }
}
$('mc-upgrade-5-btn').addEventListener('click', () => buyMasterUpgrade(5));
$('mc-upgrade-10-btn').addEventListener('click', () => buyMasterUpgrade(10));

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
   have landed yet) and refresh the Master follow-up counter.
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
async function initializeApp() {
  await loadPrice();
  const unlocked = await loadReport(true);
  if (!unlocked) await loadSavedTeaser();
  await checkUpgradeReturn();
}
initializeApp();
renderQuizList();
renderSystems(); // pre-glimpse preview: all six systems visible before any birth date is entered



// Clean test URL: bypass browser-saved report/profile restore without deleting it.
if (new URLSearchParams(location.search).get('fresh') === '1') {
  $('birthDate').value = '';
  $('birthTime').value = '';
  $('ziweiGender').value = '';
  $('name').value = '';
  $('email').value = '';
  loadReport = async () => false;
  loadSavedTeaser = async () => false;
}
