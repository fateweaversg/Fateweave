'use strict';
/** Bilingual UI + email strings. zh = Simplified Chinese (zh-CN). */
const STRINGS = {
  en: {
    tagline: 'One birthday in. Six systems answer. Do they agree?',
    hookTitle: 'Your free glimpse',
    hookCta: 'See my free glimpse',
    unlockTitle: 'Unlock the full reading',
    unlockBody: 'Unlock the full reading across all 8 systems, including 3 main Master questions and 5 follow-up chats. Add one follow-up pack if needed: $1.99 for 5 or $3.49 for 10. Master chat opens after payment or an invited trial.',
    liveReaderTitle: 'Master question allowance',
    liveReaderBody: 'The unlock includes 3 main questions and 5 follow-up chats. Additional follow-ups are available in packs.',
    dailyTitle: 'Free daily encouragement',
    dailyBody: 'One short email at 7:00am SGT — a word of encouragement, a tarot card, and a line for your day. Free with your unlock. Unsubscribe anytime.',
    limitsTitle: 'Honest limits',
    limits: [
      'Bazi is a simplified demo engine — no true solar-time correction yet.',
      'Zi Wei is calculated from birth date, birth time and chart sex, using entered clock time without a true-solar-time location correction.',
      'For self-reflection and entertainment only — not medical, financial or legal advice.',
    ],
    promoLabel: (from, to) => `$2.99 launch offer · ${from}–${to} · then $8`,
    fullLabel: '$8 full unlock',
  },
  zh: {
    tagline: '输入一次生日，六个系统同时回答。它们说的一样吗？',
    hookTitle: '你的免费一瞥',
    hookCta: '查看我的免费一瞥',
    unlockTitle: '解锁完整报告',
    unlockBody: '解锁全部 8 个系统的完整报告，包含 3 个掌门主问题和 5 次追问。需要更多时，可加购一个追问包：$1.99 增加 5 次，或 $3.49 增加 10 次。付款或使用受邀试用后即可使用掌门聊天。',
    liveReaderTitle: '掌门提问次数',
    liveReaderBody: '解锁后可提出 3 个主要问题，并包含 5 次追问。额外追问可选择加购包。',
    dailyTitle: '免费每日鼓励',
    dailyBody: '每天早上 7:00（新加坡时间）一封短信——一句鼓励、一张塔罗牌、一句今日提醒。解锁后免费，随时可以取消订阅。',
    limitsTitle: '诚实说明',
    limits: [
      '八字为简化演示引擎——尚未做真太阳时校正。',
      '紫微根据出生日期、出生时间及排盘性别计算，使用输入的钟表时间，未作真太阳时地点校正。',
      '仅供自我反思与娱乐——不是医疗、财务或法律建议。',
    ],
    promoLabel: (from, to) => `$2.99 限时优惠 · ${from}–${to} · 之后 $8`,
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
