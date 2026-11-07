'use strict';
/**
 * FateWeave reading engine — server-side only.
 *
 * Reused approach from the original static prototype (one birth profile feeds
 * all six systems + Enneagram/MBTI + Complete Portrait), re-implemented here
 * as deterministic, seeded, rule-based generators so the same birth profile
 * always gives the same reading.
 *
 * HONEST LIMITS (must stay in UI copy — see public/index.html):
 * - Bazi is a SIMPLIFIED demo engine, no true solar-time correction yet.
 * - Zi Wei paid content is ILLUSTRATIVE sample content, not computed.
 * - Self-reflection / entertainment only. No medical, financial or legal claims.
 */
const crypto = require('crypto');

// --- Seeded PRNG -----------------------------------------------------------
function seedFrom(str) {
  const h = crypto.createHash('sha256').update(String(str)).digest();
  return h.readUInt32LE(0);
}
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }

// --- Shared data -----------------------------------------------------------
const HEAVENLY_STEMS = [
  { en: 'Jia Wood', zh: '甲木', element: 'Wood' },
  { en: 'Yi Wood', zh: '乙木', element: 'Wood' },
  { en: 'Bing Fire', zh: '丙火', element: 'Fire' },
  { en: 'Ding Fire', zh: '丁火', element: 'Fire' },
  { en: 'Wu Earth', zh: '戊土', element: 'Earth' },
  { en: 'Ji Earth', zh: '己土', element: 'Earth' },
  { en: 'Geng Metal', zh: '庚金', element: 'Metal' },
  { en: 'Xin Metal', zh: '辛金', element: 'Metal' },
  { en: 'Ren Water', zh: '壬水', element: 'Water' },
  { en: 'Gui Water', zh: '癸水', element: 'Water' },
];
const EARTHLY_BRANCHES = [
  { en: 'Rat', zh: '子' }, { en: 'Ox', zh: '丑' }, { en: 'Tiger', zh: '寅' },
  { en: 'Rabbit', zh: '卯' }, { en: 'Dragon', zh: '辰' }, { en: 'Snake', zh: '巳' },
  { en: 'Horse', zh: '午' }, { en: 'Goat', zh: '未' }, { en: 'Monkey', zh: '申' },
  { en: 'Rooster', zh: '酉' }, { en: 'Dog', zh: '戌' }, { en: 'Pig', zh: '亥' },
];
const ZODIAC = [
  { en: 'Aries', zh: '白羊座', from: [3, 21], to: [4, 19] },
  { en: 'Taurus', zh: '金牛座', from: [4, 20], to: [5, 20] },
  { en: 'Gemini', zh: '雙子座', from: [5, 21], to: [6, 20] },
  { en: 'Cancer', zh: '巨蟹座', from: [6, 21], to: [7, 22] },
  { en: 'Leo', zh: '獅子座', from: [7, 23], to: [8, 22] },
  { en: 'Virgo', zh: '處女座', from: [8, 23], to: [9, 22] },
  { en: 'Libra', zh: '天秤座', from: [9, 23], to: [10, 22] },
  { en: 'Scorpio', zh: '天蠍座', from: [10, 23], to: [11, 21] },
  { en: 'Sagittarius', zh: '射手座', from: [11, 22], to: [12, 21] },
  { en: 'Capricorn', zh: '摩羯座', from: [12, 22], to: [1, 19] },
  { en: 'Aquarius', zh: '水瓶座', from: [1, 20], to: [2, 18] },
  { en: 'Pisces', zh: '雙魚座', from: [2, 19], to: [3, 20] },
];
const TAROT_MAJOR = [
  'The Fool', 'The Magician', 'The High Priestess', 'The Empress', 'The Emperor',
  'The Hierophant', 'The Lovers', 'The Chariot', 'Strength', 'The Hermit',
  'Wheel of Fortune', 'Justice', 'The Hanged Man', 'Death', 'Temperance',
  'The Devil', 'The Tower', 'The Star', 'The Moon', 'The Sun',
  'Judgement', 'The World',
];
const YIJING_HEXAGRAMS = [
  'Qian — The Creative', 'Kun — The Receptive', 'Zhun — Difficulty at the Beginning',
  'Meng — Youthful Folly', 'Xu — Waiting', 'Song — Conflict', 'Shi — The Army',
  'Bi — Holding Together', 'Xiao Xu — Small Taming', 'Lu — Treading',
  'Tai — Peace', 'Pi — Standstill', 'Tong Ren — Fellowship', 'Da You — Great Possession',
  'Qian — Modesty', 'Yu — Enthusiasm', 'Sui — Following', 'Gu — Work on the Decayed',
  'Lin — Approach', 'Guan — Contemplation', 'Shi He — Biting Through', 'Bi — Grace',
  'Bo — Splitting Apart', 'Fu — Return', 'Wu Wang — Innocence', 'Da Xu — Great Taming',
  'Yi — Nourishment', 'Da Guo — Great Exceeding', 'Kan — The Abysmal Water',
  'Li — The Clinging Fire', 'Xian — Influence', 'Heng — Duration',
];
const ELEMENT_GUIDANCE = {
  Wood: { en: 'Growth, direction and new beginnings. Your season is spring — start things, then tend them.', zh: '成長、方向與新的開始。你的季節是春天——開始，然後好好照顧它。' },
  Fire: { en: 'Warmth, visibility and momentum. You are read by your energy — spend it on what you want to be known for.', zh: '溫暖、可見性與動能。人們從你的能量認識你——把能量放在你想被認識的事上。' },
  Earth: { en: 'Steadiness, care and follow-through. You hold things together — protect your own ground first.', zh: '穩定、照顧與貫徹。你讓事情聚在一起——先守好自己的地基。' },
  Metal: { en: 'Clarity, structure and refinement. Cut what is not needed and your best work shows.', zh: '清晰、結構與精煉。去掉不需要的，你最好的作品就會出現。' },
  Water: { en: 'Depth, adaptability and listening. You go around obstacles — trust the quiet read before you act.', zh: '深度、適應與傾聽。你繞過障礙——行動前，先相信安靜的判斷。' },
};

function parseBirth(birthDate, birthTime) {
  const [y, m, d] = birthDate.split('-').map(Number);
  if (!y || !m || !d) throw new Error('Invalid birth_date, expected YYYY-MM-DD');
  const date = new Date(Date.UTC(y, m - 1, d));
  if (Number.isNaN(date.getTime())) throw new Error('Invalid birth_date');
  return { year: y, month: m, day: d, birthTime: birthTime || null, date };
}

function sunSign(month, day) {
  for (const z of ZODIAC) {
    const [fm, fd] = z.from; const [tm, td] = z.to;
    if (fm === tm) { if (month === fm && day >= fd && day <= td) return z; }
    else if (fm < tm) { if ((month === fm && day >= fd) || (month === tm && day <= td)) return z; }
    else { if ((month === fm && day >= fd) || (month === tm && day <= td) || (month > fm || month < tm)) return z; }
  }
  return ZODIAC[0];
}
function lifePathNumber(y, m, d) {
  const sumDigits = (n) => String(n).split('').reduce((a, c) => a + Number(c), 0);
  let n = sumDigits(y) + sumDigits(m) + sumDigits(d);
  while (n > 9 && n !== 11 && n !== 22) n = sumDigits(n);
  return n;
}

// --- Full reading (paid only — NEVER returned by /api/hook) ----------------
function buildFullReading(profile) {
  const { birthDate, birthTime, name } = profile;
  const { year, month, day } = parseBirth(birthDate, birthTime);
  const rng = mulberry32(seedFrom(`${birthDate}|${birthTime || ''}|${name || ''}`));

  const dayStem = HEAVENLY_STEMS[(year + month + day) % 10];
  const yearBranch = EARTHLY_BRANCHES[(year - 4) % 12];
  const monthBranch = EARTHLY_BRANCHES[(month + 1) % 12];
  const sign = sunSign(month, day);
  const lifePath = lifePathNumber(year, month, day);
  const hexagram = YIJING_HEXAGRAMS[Math.floor(rng() * YIJING_HEXAGRAMS.length)];
  const tarot = [pick(rng, TAROT_MAJOR), pick(rng, TAROT_MAJOR), pick(rng, TAROT_MAJOR)];
  const elementGuide = ELEMENT_GUIDANCE[dayStem.element];

  const bazi = {
    system: 'Bazi',
    dayMaster: dayStem,
    yearPillar: { stem: HEAVENLY_STEMS[year % 10], branch: yearBranch },
    monthPillar: { stem: HEAVENLY_STEMS[(year + month) % 10], branch: monthBranch },
    element: dayStem.element,
    guidance: elementGuide,
    note: 'Simplified demo engine — no true solar-time correction yet.',
    noteZh: '簡化演示引擎——尚未做真太陽時校正。',
  };
  const ziwei = {
    system: 'Zi Wei Dou Shu',
    lifePalace: `${yearBranch.en} Palace`,
    lifePalaceZh: `${yearBranch.zh} 宮`,
    mainStar: pick(rng, ['Zi Wei', 'Tian Ji', 'Tai Yang', 'Wu Qu', 'Tian Tong', 'Lian Zhen']),
    guidance: {
      en: 'Illustrative sample reading — Zi Wei content here is a sample, not a fully computed chart. Read it as a reflection prompt, not a prediction.',
      zh: '示範樣本內容——此處紫微內容為樣本，並非完整排盤。請當作反思提示，而非預測。',
    },
    note: 'Illustrative sample content, not computed.',
    noteZh: '示範樣本內容，並非完整計算。',
  };
  const horoscope = {
    system: 'Western Horoscope',
    sunSign: sign,
    guidance: {
      en: `As a ${sign.en}, your next chapter is about using your natural timing — not forcing it.`,
      zh: `作為${sign.zh}，你的下一章是關於運用你自然的節奏——而不是強迫它。`,
    },
  };
  const numerology = {
    system: 'Numerology',
    lifePath,
    guidance: {
      en: `Life Path ${lifePath} points to the lesson you keep meeting: what you practise, you become.`,
      zh: `生命靈數 ${lifePath} 指向你不斷遇到的課題：你練習什麼，就成為什麼。`,
    },
  };
  const yijing = {
    system: 'Yi-Jing',
    hexagram,
    guidance: {
      en: `Hexagram ${hexagram} asks: what is the smallest honest step you can take today?`,
      zh: `卦象「${hexagram}」在問：今天你能採取的最小誠實一步是什麼？`,
    },
  };
  const tarotReading = {
    system: 'Tarot',
    spread: ['Past', 'Present', 'Near future'],
    cards: tarot,
    guidance: {
      en: `Past — ${tarot[0]}. Present — ${tarot[1]}. Near future — ${tarot[2]}. The thread between them is the choice you are already making.`,
      zh: `過去——${tarot[0]}。現在——${tarot[1]}。近期未來——${tarot[2]}。貫穿其中的，是你已經在做的選擇。`,
    },
  };
  const portrait = {
    essenceLine: {
      en: `${dayStem.en} at heart, ${sign.en} in how you meet the world — steady in your own direction, even when the route changes.`,
      zh: `內心是${dayStem.zh}，面對世界的方式是${sign.zh}——即使路線改變，仍朝著自己的方向穩定前行。`,
    },
    strengths: [dayStem.element, sign.en, `Life Path ${lifePath}`],
    growingEdge: {
      en: 'Notice where you rush to fix, and pause there first. The pause is part of the work.',
      zh: '留意你急著修正的地方，先在那裡停一下。停頓也是工作的一部分。',
    },
  };
  const synthesis = {
    en: `Across all six systems, one thread repeats: ${dayStem.element} steadiness, ${sign.en} timing, and Life Path ${lifePath}. They do not agree on the details — they agree on the direction: start small, keep going, and let the result catch up.`,
    zh: `在六個系統中，一條線不斷重複：${dayStem.element}的穩定、${sign.zh}的時機，以及生命靈數 ${lifePath}。它們在細節上並不一致，但在方向上一致：從小開始，持續前行，讓結果跟上來。`,
  };

  return {
    profile: { name: name || null, birthDate, birthTime: birthTime || null },
    generatedAt: new Date().toISOString(),
    bazi, ziwei, horoscope, numerology, yijing, tarot: tarotReading,
    portrait, synthesis,
    limits: [
      'Bazi simplified demo engine, no true solar-time correction yet.',
      'Zi Wei paid content is illustrative sample, not computed.',
      'Self-reflection / entertainment only — no medical, financial or legal claims.',
    ],
  };
}

// --- Teaser / hook (free — ONLY these fields may leave the server) ---------
function buildTeaser(profile) {
  const full = buildFullReading(profile);
  return {
    profile: { birthDate: full.profile.birthDate },
    teaser: true,
    bazi: { dayMaster: full.bazi.dayMaster.en, dayMasterZh: full.bazi.dayMaster.zh },
    ziwei: { lifePalace: full.ziwei.lifePalace, lifePalaceZh: full.ziwei.lifePalaceZh },
    horoscope: { sunSign: full.horoscope.sunSign.en, sunSignZh: full.horoscope.sunSign.zh },
    numerology: { lifePath: full.numerology.lifePath },
    yijing: { hexagram: full.yijing.hexagram },
    tarot: { firstCard: full.tarot.cards[0] },
    portrait: { essenceLine: full.portrait.essenceLine },
    lockedNote: {
      en: 'Full details for each system are unlocked after payment.',
      zh: '每個系統的完整內容需付款後解鎖。',
    },
  };
}

// --- Enneagram / MBTI (brief scored versions; deep 27Q / 24Q in Phase 2) ---
function scoreEnneagram(answers) {
  // answers: array of 1-5 scores, 9 items, one per type. Highest = likely type.
  if (!Array.isArray(answers) || answers.length < 9) return null;
  let best = 0;
  answers.slice(0, 9).forEach((v, i) => { if (v > answers[best]) best = i; });
  return { type: best + 1, scores: answers.slice(0, 9) };
}
function scoreMbti(answers) {
  // answers: array of 'a'/'b' choices, 12 items (3 per dimension).
  if (!Array.isArray(answers) || answers.length < 12) return null;
  const dims = [['E', 'I'], ['S', 'N'], ['T', 'F'], ['J', 'P']];
  let code = '';
  for (let d = 0; d < 4; d++) {
    const slice = answers.slice(d * 3, d * 3 + 3);
    const aCount = slice.filter((x) => x === 'a').length;
    code += aCount >= 2 ? dims[d][0] : dims[d][1];
  }
  return { type: code };
}

module.exports = { buildFullReading, buildTeaser, scoreEnneagram, scoreMbti, parseBirth };
