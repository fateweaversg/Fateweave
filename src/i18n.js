'use strict';
/** Bilingual UI + email strings. zh = Traditional Chinese (zh-TW). */
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
    tagline: '輸入一次生日，六個系統同時回答。它們說的一樣嗎？',
    hookTitle: '你的免費一瞥',
    hookCta: '查看我的免費一瞥',
    unlockTitle: '解鎖完整報告',
    unlockBody: '先付款，完整內容隨即開啟——六個系統全部、Live Reader（3 個問題），以及詳細報告寄到你的信箱。',
    liveReaderTitle: 'Live Reader',
    liveReaderBody: '最多問 3 個問題，可用語音或打字。回答只根據你的報告內容。',
    dailyTitle: '免費每日鼓勵',
    dailyBody: '每天早上 7:00（新加坡時間）一封短信——一句鼓勵、一張塔羅牌、一句今日提醒。解鎖後免費，隨時可以取消訂閱。',
    limitsTitle: '誠實說明',
    limits: [
      '八字為簡化演示引擎——尚未做真太陽時校正。',
      '付費報告中的紫微內容為示範樣本，並非完整排盤。',
      '僅供自我反思與娛樂——不是醫療、財務或法律建議。',
    ],
    promoLabel: (from, to) => `$1 限時優惠 · ${from}–${to} · 之後 $8`,
    fullLabel: '$8 完整解鎖',
  },
};

function strings(lang) { return STRINGS[lang === 'zh' ? 'zh' : 'en']; }

const DAILY_ENCOURAGEMENTS = [
  { en: 'Start small today. One honest step is enough.', zh: '今天從小開始。一個誠實的步驟就夠了。' },
  { en: 'You do not have to fix everything. Tend what is in front of you.', zh: '你不需要修正一切。照顧眼前的事情就好。' },
  { en: 'Rest is not falling behind. It is how the work continues.', zh: '休息不是落後，而是工作繼續的方式。' },
  { en: 'Notice one good thing before the day rushes past.', zh: '在一天匆匆過去之前，留意一件好事。' },
  { en: 'Your direction matters more than your speed today.', zh: '今天，方向比速度更重要。' },
  { en: 'Ask for help where you would gladly give it.', zh: '在你願意給予幫助的地方，也請接受幫助。' },
  { en: 'A small routine, kept gently, beats a big plan kept anxiously.', zh: '溫柔地守住一個小習慣，勝過焦慮地守住一個大計劃。' },
];

module.exports = { strings, DAILY_ENCOURAGEMENTS };
