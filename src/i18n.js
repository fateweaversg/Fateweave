'use strict';
/** Bilingual UI + email strings. zh = Simplified Chinese (zh-CN). */
const STRINGS = {
  en: {
    tagline: 'One birthday in. Six systems answer. Do they agree?',
    hookTitle: 'Your free glimpse',
    hookCta: 'See my free glimpse',
    unlockTitle: 'Unlock the full reading',
    unlockBody: 'Pay first, then the full details open — for every system, plus Live Reader (3 questions) and your detailed report by email.',
    liveReaderTitle: 'Live Reader',
    liveReaderBody: 'Ask up to 3 questions, by voice or typing. Answers are grounded in your reading only.',
    dailyTitle: 'Free daily encouragement',
    dailyBody: 'One short email at 7:00am SGT — a word of encouragement, a tarot card, and a line for your day. Free with your unlock. Unsubscribe anytime.',
    limitsTitle: 'Honest limits',
    limits: [
      'Bazi is a simplified demo engine — no true solar-time correction yet.',
      'Zi Wei content in the paid reading is illustrative sample content, not a fully computed chart.',
      'For self-reflection and entertainment only — not medical, financial or legal advice.',
    ],
    promoLabel: (from, to) => `$1 launch promo · ${from}–${to} · then $8`,
    fullLabel: '$8 full unlock',
  },
  zh: {
    tagline: '输入一次生日，六个系统同时回答。它们说的一样吗？',
    hookTitle: '你的免费一瞥',
    hookCta: '查看我的免费一瞥',
    unlockTitle: '解锁完整报告',
    unlockBody: '先付款，完整内容随即开启——六个系统全部、Live Reader（3 个问题），以及详细报告寄到你的信箱。',
    liveReaderTitle: 'Live Reader',
    liveReaderBody: '最多问 3 个问题，可用语音或打字。回答只根据你的报告内容。',
    dailyTitle: '免费每日鼓励',
    dailyBody: '每天早上 7:00（新加坡时间）一封短信——一句鼓励、一张塔罗牌、一句今日提醒。解锁后免费，随时可以取消订阅。',
    limitsTitle: '诚实说明',
    limits: [
      '八字为简化演示引擎——尚未做真太阳时校正。',
      '付费报告中的紫微内容为示范样本，并非完整排盘。',
      '仅供自我反思与娱乐——不是医疗、财务或法律建议。',
    ],
    promoLabel: (from, to) => `$1 限时优惠 · ${from}–${to} · 之后 $8`,
    fullLabel: '$8 完整解锁',
  },
};

function strings(lang) { return STRINGS[lang === 'zh' ? 'zh' : 'en']; }

// NOTE (7 Nov 2026, item F): there used to be a DAILY_ENCOURAGEMENTS list of
// 7 generic rotating lines here. It was removed — the daily message is now
// generated per buyer and per day by buildDailyMessage() in readings.js
// (from that buyer's birth profile + that date's seeded card and hexagram),
// not rotated from a fixed list.

module.exports = { strings };
