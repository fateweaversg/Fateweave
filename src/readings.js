'use strict';
/**
 * FateWeave reading engine — server-side only.
 *
 * VERBATIM PORT: all tables live in src/original-data.js, extracted
 * mechanically from the original prototype
 * (~/workspace/ts-spaces/fortune-telling-service/index.html, 2 Nov 2026):
 * Tarot 22, Yi-Jing HEX_THEME 1-64, Enneagram 9+18 questions & 9 types,
 * MBTI 8+16 questions & 16 types, DAYMASTER_TXT, EL_TXT, LP, PY_TXT,
 * DM/EL/ENNEA/LP portrait tables, MBTI_LETTER. No table values were edited.
 *
 * Calculations ported from the original too: Bazi pillars (Li Chun year,
 * calendar-month branch, day pillar = days since 1900-01-01), Western
 * sun/moon/rising, numerology digital roots, Tarot draw (seeded, 28%
 * reversed), Yi-Jing 3-coin cast. The server makes them DETERMINISTIC per
 * birth profile (seeded PRNG) so the page, the emailed report and a
 * re-visit all show the same cards/hexagram.
 *
 * HONEST LIMITS (must stay in UI copy):
 * - Bazi is a SIMPLIFIED engine, no true solar-time correction yet.
 * - Zi Wei paid content is ILLUSTRATIVE sample content, not a computed
 *   chart (original prototype hard-codes the palace stars shown here).
 * - Moon / Rising are approximations from the original prototype.
 * - Self-reflection / entertainment only. No medical, financial or legal claims.
 */
const crypto = require('crypto');
const D = require('./original-data');

function hashCode(s) { let h = 0; for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0; return Math.abs(h); }
function seededRand(seed) { let x = seed % 2147483647; if (x <= 0) x += 2147483646; return () => { x = x * 16807 % 2147483647; return (x - 1) / 2147483646; }; }
function digitalRoot(n) { while (n > 9 && n !== 11 && n !== 22 && n !== 33) { let s = 0; const t = String(n); for (let i = 0; i < t.length; i++) s += parseInt(t[i], 10); n = s; } return n; }
// Personal Year is a 1–9 cycle (the PY_TXT table only has 1–9, and classic
// numerology does not keep master numbers for the personal year). Reducing
// with digitalRoot() could return 11/22/33 and render a literal
// "undefined" in the reading (bug found live 7 Nov 2026, same class as the
// Life Path Relationships bug).
function singleDigit(n) { while (n > 9) { let s = 0; const t = String(n); for (let i = 0; i < t.length; i++) s += parseInt(t[i], 10); n = s; } return n; }
function seedFrom(str) { return hashCode(str) || 1; }
const L = (lang) => (lang === 'zh' ? 'zh' : 'en');
// bilingual text helper: t({en, zh}, lang)
function T(obj, lang) { if (!obj) return ''; if (typeof obj === 'string') return obj; return obj[L(lang)] || obj.en || ''; }

const STEM_EN = ['Jia Wood', 'Yi Wood', 'Bing Fire', 'Ding Fire', 'Wu Earth', 'Ji Earth', 'Geng Metal', 'Xin Metal', 'Ren Water', 'Gui Water'];
const STEM_ZH = ['甲木', '乙木', '丙火', '丁火', '戊土', '己土', '庚金', '辛金', '壬水', '癸水'];
const BRANCH_EN = ['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'];
const BRANCH_ZH = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

function parseBirth(birthDate, birthTime) {
  const [y, m, d] = String(birthDate).split('-').map(Number);
  if (!y || !m || !d) throw new Error('Invalid birth_date, expected YYYY-MM-DD');
  const date = new Date(Date.UTC(y, m - 1, d));
  if (Number.isNaN(date.getTime())) throw new Error('Invalid birth_date');
  return { year: y, month: m, day: d, birthTime: birthTime || null, date };
}

/* --- Original calculations (ported) ------------------------------------- */
function calcBazi(date, timeStr) {
  const y = date.getFullYear(), m = date.getMonth() + 1, d = date.getDate();
  const yy = (m < 2 || (m === 2 && d < 4)) ? y - 1 : y; // Li Chun approx Feb 4
  const yi = ((yy - 4) % 60 + 60) % 60;
  const yearP = { stem: yi % 10, branch: yi % 12 };
  const mBranch = m % 12;
  const monthStemBase = [2, 4, 6, 8, 0][yearP.stem % 5];
  const monthOffset = ((mBranch - 2) + 12) % 12;
  const monthP = { stem: (monthStemBase + monthOffset) % 10, branch: mBranch };
  const base = new Date(1900, 0, 1);
  const days = Math.round((new Date(y, m - 1, d) - base) / 86400000);
  const di = ((days + 10) % 60 + 60) % 60;
  const dayP = { stem: di % 10, branch: di % 12 };
  let hh = 8; if (timeStr) hh = parseInt(timeStr.split(':')[0], 10) || 8;
  const hBranch = Math.floor(((hh + 1) % 24) / 2) % 12;
  const hourStemBase = [0, 2, 4, 6, 8][dayP.stem % 5];
  const hourP = { stem: (hourStemBase + hBranch) % 10, branch: hBranch };
  const pillars = [yearP, monthP, dayP, hourP];
  const counts = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  pillars.forEach((p) => { counts[D.STEMS[p.stem][3]]++; counts[D.BRANCHES[p.branch][3]]++; });
  return { pillars, counts, dayMaster: dayP.stem, zodiac: D.ZODIAC[yearP.branch], yy };
}
function sunSign(m, d) {
  const bounds = [[1, 19, 9, 10], [2, 18, 10, 11], [3, 20, 11, 0], [4, 19, 0, 1], [5, 20, 1, 2], [6, 20, 2, 3], [7, 22, 3, 4], [8, 22, 4, 5], [9, 22, 5, 6], [10, 22, 6, 7], [11, 21, 7, 8], [12, 21, 8, 9]];
  const b = bounds[m - 1]; return D.SIGNS[d <= b[1] ? b[2] : b[3]];
}
function calcAstro(date, timeStr) {
  const sun = sunSign(date.getMonth() + 1, date.getDate());
  const ref = Date.UTC(2000, 0, 6, 18, 14);
  let age = ((date.getTime() - ref) / 86400000) % 29.53059; if (age < 0) age += 29.53059;
  const moonIdx = (D.SIGNS.indexOf(sun) + Math.floor(age / 29.53059 * 12)) % 12;
  let hh = 8; if (timeStr) hh = parseInt(timeStr.split(':')[0], 10) || 8;
  const riseIdx = (D.SIGNS.indexOf(sun) + Math.round(hh / 2)) % 12;
  return { sun, moon: D.SIGNS[moonIdx], rising: D.SIGNS[riseIdx], moonAge: age };
}
function calcNumbers(date, name) {
  const s = String(date.getFullYear()) + String(date.getMonth() + 1).padStart(2, '0') + String(date.getDate()).padStart(2, '0');
  let sum = 0; for (let i = 0; i < s.length; i++) sum += parseInt(s[i], 10);
  const lp = digitalRoot(sum);
  let dest = 0;
  if (name) {
    const clean = name.toLowerCase().replace(/[^a-z]/g, ''); let tot = 0;
    for (let j = 0; j < clean.length; j++) { let v = (clean.charCodeAt(j) - 96) % 9; if (v === 0) v = 9; tot += v; }
    dest = clean.length ? digitalRoot(tot) : 0;
  }
  const pyStr = String(date.getMonth() + 1) + String(date.getDate()) + String(currentYear()); let pySum = 0;
  for (let k = 0; k < pyStr.length; k++) pySum += parseInt(pyStr[k], 10);
  return { lp, dest, py: singleDigit(pySum) };
}
function pillarObj(p, labelEn, labelZh) {
  const st = D.STEMS[p.stem], br = D.BRANCHES[p.branch];
  return {
    label: { en: labelEn, zh: labelZh },
    stem: { en: STEM_EN[p.stem], zh: STEM_ZH[p.stem], char: st[0], pinyin: st[1], element: st[2], elementKey: st[3] },
    branch: { en: BRANCH_EN[p.branch], zh: BRANCH_ZH[p.branch], char: br[0], pinyin: br[1], element: br[2], elementKey: br[3] },
  };
}
function drawTarot(seedStr) {
  const r = seededRand(seedFrom(seedStr));
  const used = {}, out = [];
  while (out.length < 3) {
    const idx = Math.floor(r() * D.TAROT.length);
    if (!used[idx]) { used[idx] = 1; out.push({ idx, rev: r() < 0.28 }); }
  }
  return out;
}
function castYijing(seedStr) {
  const r = seededRand(seedFrom(seedStr));
  const lines = [];
  for (let i = 0; i < 6; i++) {
    let sum = 0; for (let c = 0; c < 3; c++) sum += r() < 0.5 ? 3 : 2; // 3-coin cast: heads=3, tails=2
    lines.push({ sum, yang: sum === 7 || sum === 9, changing: sum === 6 || sum === 9, line: i + 1 });
  }
  let bitsLo = 0, bitsHi = 0;
  for (let j = 0; j < 3; j++) { if (lines[j].yang) bitsLo |= 1 << j; if (lines[j + 3].yang) bitsHi |= 1 << j; }
  const lo = D.TRI_BY_BITS[bitsLo], hi = D.TRI_BY_BITS[bitsHi];
  const hex = D.HEX[hi][lo];
  let tBitsLo = 0, tBitsHi = 0;
  for (let j = 0; j < 6; j++) { const eff = lines[j].changing ? !lines[j].yang : lines[j].yang; if (j < 3) { if (eff) tBitsLo |= 1 << j; } else if (eff) tBitsHi |= 1 << (j - 3); }
  const tLo = D.TRI_BY_BITS[tBitsLo], tHi = D.TRI_BY_BITS[tBitsHi];
  const transformed = D.HEX[tHi][tLo];
  return { lines, hex, transformed, changingLines: lines.filter((l) => l.changing).map((l) => l.line), upper: D.TRI[hi], lower: D.TRI[lo] };
}
function elName(key, lang) { return lang === 'zh' ? D.ELNAME[key].replace(/^[A-Za-z]+ /, '') : D.ELNAME[key].replace(/ [^ ]+$/, ''); }
// Plain element meaning from the original EL_TXT table (Ask the Master
// "what does Wood mean?" answers) — never invented, always the buyer's
// own table text.
function elementMeaning(key, lang) {
  const row = D.EL_TXT[key];
  if (!row) return '';
  return lang === 'zh' ? row.zh : row.en;
}

/* --- Current-date helpers (item F, 7 Nov 2026) ---------------------------
   Timing must be computed from the actual current date at request time —
   never a hardcoded year ("2026", "Fire Horse") or fixed month windows
   ("months 3–4 and month 9"). The Chinese year stem/branch derive from
   the year number: stem (year−4)%10, branch (year−4)%12. */
function currentYear() { return new Date().getFullYear(); }
function chineseYearLabel(y) {
  const stem = ((y - 4) % 10 + 10) % 10, branch = ((y - 4) % 12 + 12) % 12;
  return { en: `${y} · ${STEM_EN[stem]} ${BRANCH_EN[branch]}`, zh: `${y}年 · ${STEM_ZH[stem]}${BRANCH_ZH[branch]}` };
}
function nextTwelveMonths() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 11, 1);
  const enFmt = (d) => d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
  return {
    en: `${enFmt(start)}–${enFmt(end)}`,
    zh: `${start.getFullYear()}年${start.getMonth() + 1}月–${end.getFullYear()}年${end.getMonth() + 1}月`,
  };
}

/* --- Section text (bilingual, derived from the original tables) ---------- */
function sec(en, zh) { return { en, zh }; }
function baziSections(b, dom, weak, dmTxt, lang) {
  const domE = elName(dom, 'en'), weakE = elName(weak, 'en');
  return {
    overview: sec(
      `Your Day Master is ${STEM_EN[b.dayMaster]} (${STEM_ZH[b.dayMaster]}). The chart runs strongest in ${domE} and lightest in ${weakE}; both your working style and what you need to deliberately supply come from that imbalance.`,
      `你的日主是${STEM_ZH[b.dayMaster]}。整体五行以${elName(dom, 'zh')}最旺、${elName(weak, 'zh')}最弱——行事风格与需要补足的方向，都从这里读出来。`),
    dayMaster: sec(dmTxt.en, dmTxt.zh),
    strengths: sec(
      `Your strongest element, ${domE}, is the mode you run without effort — ${D.EL_TXT[dom].en} is a default strength. ${D.DM_PORTRAIT[b.dayMaster].sEn}.`,
      `你最旺的${elName(dom, 'zh')}是你不费力就做到的模式——${D.EL_TXT[dom].zh}。${D.DM_PORTRAIT[b.dayMaster].sZh}。`),
    challenges: sec(
      `Your lightest element, ${weakE}, is the one to cultivate deliberately — ${D.EL_TXT[weak].en} does not switch on by itself. ${D.DM_PORTRAIT[b.dayMaster].gEn}.`,
      `你最弱的${elName(weak, 'zh')}需要刻意经营——${D.EL_TXT[weak].zh}。${D.DM_PORTRAIT[b.dayMaster].gZh}。`),
    career: sec(
      `At work, ${domE} energy is how you deliver without forcing it: ${D.EL_TXT[dom].en} Lower your reliance on willpower in ${weakE} areas — put structure, a checklist or a collaborator there instead. Your useful god is ${weakE}: feed the lightest element to balance the chart.`,
      `工作上，${elName(dom, 'zh')}是你不费力的工作方式：${D.EL_TXT[dom].zh}。在${elName(weak, 'zh')}的范畴，少靠意志力，多靠结构、清单或合作者。你的用神是${elName(weak, 'zh')}：补最弱者，平衡全局。`),
    relationships: sec(
      `In relationships, your Day Master sets the tone: ${dmTxt.en} People experience you as steady in your own direction — say what you need plainly, rather than letting correctness or habit speak for it.`,
      `在关系中，日主定下基调：${dmTxt.zh}别人感受到你朝着自己的方向稳定前行——直接说出需要，不要让「正确」或习惯代替你说话。`),
    health: sec(
      `Energy management: ${domE} is your natural fuel, ${weakE} is where you leak. Schedule deliberate slack in your ${weakE}-light months and protect rest the way you protect deadlines — ${D.EL_PORTRAIT[weak].pEn}`,
      `精力管理：${elName(dom, 'zh')}是你的天然燃料，${elName(weak, 'zh')}是你漏气的地方。在${elName(weak, 'zh')}较弱的月份主动留白，像守约一样保护恢复——${D.EL_PORTRAIT[weak].pZh}`),
    timing: sec(
      `This year is ${chineseYearLabel(currentYear()).en} — it feeds your ${domE}. The current luck pillar runs a decade at a time; the theme now is building. Over the next twelve months (${nextTwelveMonths().en}), keep the pace steady: this is a year for consolidating, not expanding.`,
      `今年是${chineseYearLabel(currentYear()).zh}，与你的${elName(dom, 'zh')}相生。当前大运十年一步，现行主题是建立。未来十二个月（${nextTwelveMonths().zh}），保持节奏稳定：今年适合整固，而非扩张。`),
  };
}
function horoscopeSections(a, lang) {
  const t = (s) => D.SIGN_TRAITS.en[s.en];
  const tz = (s) => D.SIGN_TRAITS.zh[s.en];
  return {
    overview: sec(
      `People meet your ${a.rising.en} Rising first; decisions are made by your ${a.sun.en} Sun; and your ${a.moon.en} Moon explains why some days you are unstoppable and others you simply want the door closed.`,
      `别人先遇到的，是你上升${a.rising.zh}的门面；真正做决定的，是太阳${a.sun.zh}；而月亮${a.moon.zh}解释了你为何在某些日子特别高效、某些日子只想关门。`),
    sun: sec(`Your core identity and fuel centre on ${t(a.sun)}. When your life is arranged around it you feel recognisably yourself; drift too far from it for too long and even a stable life slowly deflates.`, `你的核心身份与动力围绕${tz(a.sun)}。当生活安排与这主题同向，你会感到「这才是我」；长期偏离它，再稳定的日子也会慢慢漏气。`),
    moon: sec(`Your emotional rhythm and recharging style are governed by ${t(a.moon)}. This is what you privately need in order to feel safe; under pressure, feed the Moon first and your judgement comes back online.`, `你的情绪节奏与充电方式由${tz(a.moon)}主导。这是你私下需要被照顾的方式——压力大时，先满足月亮的需求，判断力才会回来。`),
    rising: sec(`First impressions of you are filtered through ${t(a.rising)} — it is the style you open doors with, and where strangers most often misread you. For interviews, first meetings and public appearances, presenting in this style costs you the least energy.`, `别人对你的第一印象来自${tz(a.rising)}——这是你开门的方式，也是陌生人误读你的地方。面试、初次见面与公开露面时，顺着上升星座的风格呈现自己最省力。`),
    career: sec(`Career follows your Sun: work that lets you live ${t(a.sun)} will feel like yours; work that only uses your Rising style will pay but not satisfy. Choose roles where the Sun's theme is the job, not a hobby you fit around it.`, `事业跟随你的太阳：能让你活出${tz(a.sun)}的工作，会感觉真正属于你；只用上升风格的工作能赚钱，却不满足。选择太阳主题本身就是工作内容的岗位。`),
    relationships: sec(`In relationships, your Moon sets the private terms: you need ${t(a.moon)} to feel safe. Say that plainly early — a partner cannot meet a need you have only hinted at.`, `在关系中，月亮定下私下条件：你需要${tz(a.moon)}才感到安全。及早直接说出来——伴侣无法满足你只暗示过的需要。`),
    health: sec(`Your Moon is your recovery gauge. When ${t(a.moon)} is starved, judgement goes first. Protect the Moon's recharge the way you protect a deadline.`, `月亮是你的恢复仪表。当${tz(a.moon)}被亏待，判断力最先离场。像守死线一样保护月亮的充电方式。`),
    timing: sec(`Your Sun's timing is the clue: the moments when you feel most yourself — ${t(a.sun)} — are usually the moments when the answer is clearest. Do not decide when you are tired or rushed — decide in the window when you are most like yourself, and let your ${a.moon.en} Moon rest first.`, `太阳的时机就是线索：你感觉最像自己的时刻——${tz(a.sun)}——通常也是答案最清晰的时刻。不要在疲惫或匆忙时决定——先让月亮${a.moon.zh}休息好，再在最像自己的时段决定。`),
  };
}
function numerologySections(n, lang) {
  // LP_PORTRAIT rows carry only gEn/gZh (the "what's lacking" lesson) — there
  // is no .en/.zh field on them. Reading .en produced the literal string
  // "undefined" in the Relationships line (bug found live 7 Nov 2026).
  // Fall back to the Life Path text itself if a portrait row is ever missing.
  const lpLesson = (l) => {
    const row = D.LP_PORTRAIT[n.lp];
    if (row) return l === 'zh' ? row.gZh : row.gEn;
    return l === 'zh' ? D.LP.zh[String(n.lp)] : D.LP.en[String(n.lp)];
  };
  return {
    overview: sec(`Life Path ${n.lp}: ${D.LP.en[String(n.lp)]} This is the lesson your life keeps re-teaching in new costumes. Work with it and effort compounds; work against it and the same frustration returns wearing different clothes.`, `生命灵数 ${n.lp}：${D.LP.zh[String(n.lp)]}这是你反复要学的一课：顺着它走，事情有累积感；逆着它硬闯，同一类挫折会以不同面貌回来。`),
    lifePath: sec(D.LP.en[String(n.lp)], D.LP.zh[String(n.lp)]),
    destiny: n.dest ? sec(`Destiny ${n.dest}: ${D.LP.en[String(n.dest)]} This is the outward assignment your name carries — the direction the world keeps asking you to practise.`, `命运数 ${n.dest}：${D.LP.zh[String(n.dest)]}这是你的名字带出的外在功课——世界不断要求你练习的方向。`) : sec('No name was given, so no Destiny number was calculated.', '未提供姓名，因此没有计算命运数。'),
    personalYear: sec(`${currentYear()} is ${D.PY_TXT.en[String(n.py)]}`, `${currentYear()} 年是${D.PY_TXT.zh[String(n.py)]}`),
    career: sec(`Career follows Life Path ${n.lp}: roles that let you practise ${D.LP.en[String(n.lp)].split('.')[0].toLowerCase()} will compound; roles that ask you to do the opposite will feel like pushing uphill every week.`, `事业跟随生命灵数 ${n.lp}：能让你练习「${D.LP.zh[String(n.lp)]}」的岗位会有累积感；要求你做相反事的岗位，每周都会像推石上山。`),
    relationships: sec(`In relationships, Life Path ${n.lp} asks for the same lesson in a different room: ${lpLesson('en')}`, `在关系中，生命灵数 ${n.lp} 要求同一课在另一个房间重演：${lpLesson('zh')}`),
    health: sec(`Your Personal Year ${n.py} sets the energy budget for ${currentYear()}: ${D.PY_TXT.en[String(n.py)]} Plan rest and effort around that theme, not against it.`, `你的个人年 ${n.py} 定下 ${currentYear()} 年的能量预算：${D.PY_TXT.zh[String(n.py)]}按这个主题安排休息与努力，而不是逆着它。`),
    timing: sec(`${currentYear()} is ${D.PY_TXT.en[String(n.py)]} Across the year, the strongest windows are the months that match this theme — use them for the big move, and let the other months be for preparation.`, `${currentYear()} 年是${D.PY_TXT.zh[String(n.py)]}全年最强的窗口，是与这个主题相符的月份——大事放在那些月份，其他月份用来准备。`),
  };
}
function yijingSections(cast, lang) {
  const hex = cast.hex;
  return {
    overview: sec(`Hexagram ${hex[0]} · ${hex[1]} (${hex[2]}) — ${D.HEX_THEME.en[hex[0]]} The upper trigram is ${cast.upper[0]}, the lower is ${cast.lower[0]}: the upper is the outer environment you are moving through; the lower is your inner position and starting point.`, `第 ${hex[0]} 卦 · ${hex[2]}（${hex[1]}）——${D.HEX_THEME.zh[hex[0]]}上卦为${cast.upper[1]}（${cast.upper[0]}）、下卦为${cast.lower[1]}（${cast.lower[0]}）：上卦是你身处的外在环境，下卦是你的内在位置与起点。`),
    judgement: sec(D.HEX_THEME.en[hex[0]], D.HEX_THEME.zh[hex[0]]),
    lines: cast.lines.map((l) => ({ line: l.line, sum: l.sum, yang: l.yang, changing: l.changing, text: sec(D.COIN_TXT.en[String(l.sum)] || (l.yang ? 'Yang line' : 'Yin line'), D.COIN_TXT.zh[String(l.sum)] || (l.yang ? '阳爻' : '阴爻')) })),
    changing: cast.changingLines.length
      ? sec(`Changing line(s) at position ${cast.changingLines.join(', ')} — the situation is in motion, so the answer is not static. ${cast.changingLines.map((p) => `Line ${p}: ${D.LINE_POS.en[p - 1]}`).join(' ')} Transformed hexagram: ${cast.transformed[0]} · ${cast.transformed[1]} — ${D.HEX_THEME.en[cast.transformed[0]]} Read them together: live by the first hexagram now, while leaving room for the direction of the second.`,
        `变爻在第 ${cast.changingLines.join('、')} 爻——情况正在移动，答案不是静止的。${cast.changingLines.map((p) => `第 ${p} 爻：${D.LINE_POS.zh[p - 1]}`).join(' ')}变卦：第 ${cast.transformed[0]} 卦 · ${cast.transformed[2]}——${D.HEX_THEME.zh[cast.transformed[0]]}两卦一起读：先活在本卦的指示里，同时为变卦的方向留位置。`)
      : sec('No changing lines: the hexagram is stable, with no hinge in motion — act on the interpretation above, give it a month to play out, and do not re-ask the same question in the meantime.', '无变爻：卦象稳定，没有铰链在移动——直接按上面解读行事，并以一个月为观察期，不要急于再问同一问题。'),
    career: sec(`For work, this hexagram instructs you to move at the pace the Judgement sets, not the pace of your anxiety. This week, do one thing that is in the same direction as the hexagram — ${D.HEX_THEME.en[hex[0]]}`, `工作上，此卦的指示是先按卦辞的节奏行事，而不是按你的焦急行事。本周只做一件与卦象同向的事——${D.HEX_THEME.zh[hex[0]]}`),
    relationships: sec(`In relationships, the hexagram's image — ${cast.upper[0]} over ${cast.lower[0]} — is the structure of the answer: the outer environment and your inner position are not in conflict, they are in dialogue. Let the outer set the pace and the inner set the standard.`, `在关系中，卦象——上${cast.upper[1]}、下${cast.lower[1]}——就是答案的结构：外在环境与内在位置不是冲突，而是对话。让外在定节奏，内在定标准。`),
    health: sec(`For energy, Hexagram ${hex[0]} asks for one honest step, not a grand plan. Note the result and re-read this in a week; you will see which event the hexagram was pointing at.`, `精力方面，第 ${hex[0]} 卦「${hex[2]}」邀请一个小而诚实的行动，而不是宏大计划。把结果记下来，一周后再回看，你会看见此卦指的是哪一件事。`),
    timing: sec(`Give Hexagram ${hex[0]} · ${hex[1]} a month to play out${cast.changingLines.length ? ` — with ${cast.changingLines.length} changing line(s), watch for the shift the transformed hexagram points to` : ''}. Do not re-ask the same question in the meantime — the answer is already moving.`, `给第 ${hex[0]} 卦「${hex[2]}」一个月时间发酵${cast.changingLines.length ? `——有 ${cast.changingLines.length} 个变爻，留意变卦指出的转向` : ''}。期间不要急于再问同一问题——答案已经在动。`),
  };
}
function tarotSections(draw, lang) {
  const posEn = ['Past', 'Present', 'Path'], posZh = ['过去', '现在', '路径'];
  const cards = draw.map((c, i) => {
    const card = D.TAROT[c.idx];
    return {
      position: { en: posEn[i], zh: posZh[i] }, idx: c.idx, number: card[0], name: { en: card[1], zh: card[2] },
      emoji: card[3], keywords: card[4], keywordsZh: D.TAROT_ZH_KEYWORDS[c.idx], reversed: c.rev,
      meaning: { en: c.rev ? D.TAROT_REV.en[c.idx] : card[5], zh: c.rev ? D.TAROT_REV.zh[c.idx] : D.TAROT_ZH_MEANING[c.idx] },
      positionText: { en: D.TAROT_POS.en[i], zh: D.TAROT_POS.zh[i] },
      forQuestion: sec(
        `For your question, this card in the ${posEn[i]} position asks you to deal first with the element it names — ${card[4]} — before moving to the next step. ${c.rev ? 'Reversed, its energy turns inward first: clear the blockage and outer progress follows.' : 'Upright, its energy is available outwardly: take one small action this week that answers it, and the reading becomes real.'}`,
        `就你的问题而言，这张牌落在${posZh[i]}位，提示你先处理它指出的那一环——${D.TAROT_ZH_KEYWORDS[c.idx]}——再谈下一步。${c.rev ? '因为是逆位，能量先向内：先清障碍，外在进展随后。' : '此牌正位，能量向外可用：本周内做一个与它呼应的小行动，让解读落地。'}`),
    };
  });
  const story = sec(
    `Read as one story: it begins in the root named by ${cards[0].name.en}, passes through the present energy of ${cards[1].name.en}, and leans toward ${cards[2].name.en}. In one sentence: acknowledge how the past shaped the present, then walk the direction the third card points — do not skip the middle card; it is the bridge.`,
    `连起来读：故事由「${cards[0].name.zh}」的根源出发，经过「${cards[1].name.zh}」的现在，倾向走向「${cards[2].name.zh}」。一句话版本：先承认过去如何塑造了现在，再顺着第三张牌指出的方向走——不要跳过中间那张，它是桥。`);
  return {
    cards, story,
    overview: sec(`Past — ${cards[0].name.en}. Present — ${cards[1].name.en}. Near future — ${cards[2].name.en}. The thread between them is the choice you are already making.`, `过去——${cards[0].name.zh}。现在——${cards[1].name.zh}。近期未来——${cards[2].name.zh}。贯穿其中的，是你已经在做的选择。`),
    career: sec(`At work, the ${cards[1].name.en} in the Present position is the card to sit with longest — it names the energy that is already moving, whether or not you have named it yet.`, `工作上，现在位置的「${cards[1].name.zh}」最值得久坐——它说的是已经在动的能量，无论你是否已为它命名。`),
    relationships: sec(`In relationships, the Path card — ${cards[2].name.en} — does not decide for you; it shows the shape of the path you are already on, so you can choose whether to stay on it.`, `在关系中，路径位置的「${cards[2].name.zh}」不是替你决定，而是显示你已经走在的路的形状，让你选择是否继续走下去。`),
    health: sec(`For energy, the Past card — ${cards[0].name.en} — names what you carry. Acknowledge it before you try to fix the present; the fix lands differently once the root is named.`, `精力方面，过去位置的「${cards[0].name.zh}」说出你携带的东西。先承认它，再去处理现在；根源被说出来之后，修正的方式会不同。`),
    timing: sec(`Take one small action this week that matches the Present card, ${cards[1].name.en}, and watch what changes. That is how a reading earns its keep.`, `本周做一件与现在这张牌「${cards[1].name.zh}」相符的小事，看看什么改变了。`),
  };
}
// Zi Wei palaces — verbatim from the original prototype (sample, NOT computed).
const ZIWEI_PALACES = [
  { key: 'life', en: 'Life Palace', zh: '命宫', star: { en: 'Tian Ji', zh: '天机' }, text: { en: 'Tian Ji — strategy and adaptability lead', zh: '天机——以谋略与变化见长' } },
  { key: 'wealth', en: 'Wealth Palace', zh: '财帛宫', star: { en: 'Wu Qu', zh: '武曲' }, text: { en: 'Wu Qu — wealth through skill and execution', zh: '武曲化禄：财来自专业与执行' } },
  { key: 'career', en: 'Career Palace', zh: '官禄宫', star: { en: 'Tai Yang', zh: '太阳' }, text: { en: 'The Sun — a reputation-led career', zh: '太阳：名声型事业，宜公开场合' } },
  { key: 'spouse', en: 'Spouse Palace', zh: '夫妻宫', star: { en: 'Tai Yin', zh: '太阴' }, text: { en: 'The Moon — emotional safety first in partners', zh: '太阴：伴侣重情绪安全感' } },
];
function ziweiSections(lang) {
  return {
    overview: sec(
      'Your Life Palace star is Tian Ji, the strategist: your operating core is think it through, then move. Strategy and adaptability are your strongest assets, and you perform better amid change than inside fixed routines. The shadow of Tian Ji is over-thinking and slow starts — a personal rule of act at seventy percent clarity serves this star better than waiting for one hundred.',
      '命宫主星天机：你的行事核心是「先想通、再行动」——谋略与适应力是你最强的资产，在变化中比在固定流程中表现更好。天机的阴影是想得太多、启动太慢：给自己一个「想通七成便动手」的规则，比追求想通十成更合这颗星。'),
    career: sec('Career Palace — Tai Yang, the Sun: a reputation-led career. Work that is seen, named and trusted in public suits this palace; work done entirely in the background starves it.', '官禄宫——太阳：名声型事业，宜公开场合。能被看见、被指名、被信任的工作适合此宫；完全在幕后的工作会令它挨饿。'),
    relationships: sec('Spouse Palace — Tai Yin, the Moon: emotional safety first in partners. The relationship works when both people feel safe enough to say the plain thing, not only the polished one.', '夫妻宫——太阴：伴侣重情绪安全感。关系要好，双方都要感到安全，敢说平实的话，而不只说漂亮的话。'),
    wealth: sec('Wealth Palace — Wu Qu: wealth through skill and execution. Money follows demonstrated competence and finished work, not speculation or waiting to be discovered.', '财帛宫——武曲化禄：财来自专业与执行。金钱跟随被证明的专业与完成的工作，而不是投机或等待被发现。'),
    health: sec('Life Palace energy is mental: Tian Ji thinks first and acts second. Protect thinking time and sleep — when the mind is tired, the strategist starts second-guessing instead of deciding.', '命宫能量是心智型的：天机先想后动。保护思考时间与睡眠——心累时，谋略家会开始反复质疑，而不是作决定。'),
    timing: sec('Tian Ji timing is seasonal: think in the quiet season, move in the open one. A full twelve-palace computed chart with decade luck is a Phase 2 layer — this sample does not claim to be it.', '天机的时机是季节性的：安静的季节思考，公开的季节行动。完整十二宫排盘与大限走势属第二阶段——此样本并不声称是它。'),
  };
}

/* --- Full reading (paid only — NEVER returned by /api/hook) ---------------- */
function buildFullReading(profile, personality) {
  const { birthDate, birthTime, name, focus, question } = profile;
  const { year, month, day, date } = parseBirth(birthDate, birthTime);
  const b = calcBazi(date, birthTime);
  const a = calcAstro(date, birthTime);
  const n = calcNumbers(date, name);
  const seed = `${birthDate}|${birthTime || ''}|${name || ''}`;
  const dmTxt = D.DAYMASTER_TXT[b.dayMaster];
  const counts = b.counts;
  const dom = Object.keys(counts).reduce((x, y) => (counts[x] >= counts[y] ? x : y));
  const weak = Object.keys(counts).reduce((x, y) => (counts[x] <= counts[y] ? x : y));
  const draw = drawTarot(seed);
  const cast = castYijing(seed + '|yi');
  const pillars = [pillarObj(b.pillars[0], 'Year', '年柱'), pillarObj(b.pillars[1], 'Month', '月柱'), pillarObj(b.pillars[2], 'Day', '日柱'), pillarObj(b.pillars[3], 'Hour', '时柱')];
  const tarot = tarotSections(draw, 'en');
  const yijing = yijingSections(cast, 'en');

  const bazi = {
    system: 'Bazi',
    dayMaster: { en: STEM_EN[b.dayMaster], zh: STEM_ZH[b.dayMaster], element: D.STEMS[b.dayMaster][2], elementKey: D.STEMS[b.dayMaster][3] },
    pillars, yearPillar: pillars[0], monthPillar: pillars[1], dayPillar: pillars[2], hourPillar: pillars[3],
    counts, dominant: dom, weakest: weak, usefulGod: weak,
    element: D.STEMS[b.dayMaster][2],
    zodiac: { en: b.zodiac[0], zh: b.zodiac[1] },
    dayMasterText: { en: dmTxt.en, zh: dmTxt.zh },
    guidance: { en: dmTxt.en, zh: dmTxt.zh },
    elementBalance: { en: D.EL_TXT[dom].en, zh: D.EL_TXT[dom].zh },
    luckPillar: { en: `${D.STEMS[(b.pillars[1].stem + 3) % 10][0]}${D.BRANCHES[(b.pillars[1].branch + 3) % 12][0]}`, zh: `${D.STEMS[(b.pillars[1].stem + 3) % 10][0]}${D.BRANCHES[(b.pillars[1].branch + 3) % 12][0]}`, note: { en: 'Indicative only — one pillar per decade, current theme: building.', zh: '仅供参考——十年一步，现行主题：建立。' } },
    currentYear: chineseYearLabel(currentYear()),
    sections: baziSections(b, dom, weak, dmTxt, 'en'),
    note: 'Simplified engine — no true solar-time correction yet.',
    noteZh: '简化引擎——尚未做真太阳时校正。',
  };
  const ziwei = {
    system: 'Zi Wei Dou Shu',
    lifePalace: 'Tian Ji Palace', lifePalaceZh: '天机宫',
    mainStar: { en: 'Tian Ji', zh: '天机' },
    palaces: ZIWEI_PALACES,
    guidance: { en: 'Illustrative sample reading — Zi Wei content here is a sample, not a fully computed chart. Read it as a reflection prompt, not a prediction.', zh: '示范样本内容——此处紫微内容为样本，并非完整排盘。请当作反思提示，而非预测。' },
    sections: ziweiSections('en'),
    note: 'Illustrative sample content, not computed.',
    noteZh: '示范样本内容，并非完整计算。',
    sample: true,
  };
  const horoscope = {
    system: 'Western Horoscope',
    sunSign: { en: a.sun.en, zh: a.sun.zh, symbol: a.sun.sym },
    sun: { en: a.sun.en, zh: a.sun.zh, symbol: a.sun.sym, trait: { en: D.SIGN_TRAITS.en[a.sun.en], zh: D.SIGN_TRAITS.zh[a.sun.en] } },
    moon: { en: a.moon.en, zh: a.moon.zh, symbol: a.moon.sym, trait: { en: D.SIGN_TRAITS.en[a.moon.en], zh: D.SIGN_TRAITS.zh[a.moon.en] }, note: { en: 'Approximation from the original prototype.', zh: '原型的近似计算。' } },
    rising: { en: a.rising.en, zh: a.rising.zh, symbol: a.rising.sym, trait: { en: D.SIGN_TRAITS.en[a.rising.en], zh: D.SIGN_TRAITS.zh[a.rising.en] }, note: { en: 'Approximation from birth time in the original prototype.', zh: '原型的近似计算。' } },
    guidance: { en: `As a ${a.sun.en}, your next chapter is about using your natural timing — not forcing it.`, zh: `作为${a.sun.zh}，你的下一章是关于运用你自然的节奏——而不是强迫它。` },
    sections: horoscopeSections(a, 'en'),
  };
  const numerology = {
    system: 'Numerology',
    lifePath: n.lp, destiny: n.dest, personalYear: n.py,
    lifePathText: { en: D.LP.en[String(n.lp)], zh: D.LP.zh[String(n.lp)] },
    destinyText: n.dest ? { en: D.LP.en[String(n.dest)], zh: D.LP.zh[String(n.dest)] } : null,
    personalYearText: { en: D.PY_TXT.en[String(n.py)], zh: D.PY_TXT.zh[String(n.py)] },
    guidance: { en: `Life Path ${n.lp} points to the lesson you keep meeting: what you practise, you become.`, zh: `生命灵数 ${n.lp} 指向你不断遇到的课题：你练习什么，就成为什么。` },
    sections: numerologySections(n, 'en'),
  };
  const yijingOut = {
    system: 'Yi-Jing',
    hexagram: `${cast.hex[0]} · ${cast.hex[1]} (${cast.hex[2]})`,
    hexagramNumber: cast.hex[0], hexagramEn: cast.hex[1], hexagramZh: cast.hex[2],
    upper: { en: cast.upper[0], zh: cast.upper[1] }, lower: { en: cast.lower[0], zh: cast.lower[1] },
    theme: { en: D.HEX_THEME.en[cast.hex[0]], zh: D.HEX_THEME.zh[cast.hex[0]] },
    lines: yijing.lines,
    changingLines: cast.changingLines,
    transformed: cast.transformed ? { number: cast.transformed[0], en: cast.transformed[1], zh: cast.transformed[2], theme: { en: D.HEX_THEME.en[cast.transformed[0]], zh: D.HEX_THEME.zh[cast.transformed[0]] } } : null,
    guidance: { en: `Hexagram ${cast.hex[0]} · ${cast.hex[1]} asks: what is the smallest honest step you can take today?`, zh: `卦象「${cast.hex[2]}」在问：今天你能采取的最小诚实一步是什么？` },
    sections: yijing,
  };
  const tarotOut = {
    system: 'Tarot',
    spread: ['Past', 'Present', 'Path'],
    cards: tarot.cards.map((c) => c.name.en),
    cardsZh: tarot.cards.map((c) => c.name.zh),
    cardsDetailed: tarot.cards,
    story: tarot.story,
    guidance: { en: `Past — ${tarot.cards[0].name.en}. Present — ${tarot.cards[1].name.en}. Near future — ${tarot.cards[2].name.en}. ${tarot.story.en}`, zh: `过去——${tarot.cards[0].name.zh}。现在——${tarot.cards[1].name.zh}。近期未来——${tarot.cards[2].name.zh}。${tarot.story.zh}` },
    sections: { overview: tarot.overview, career: tarot.career, relationships: tarot.relationships, health: tarot.health, timing: tarot.timing },
  };
  const portrait = buildPortrait({ bazi, horoscope, numerology, dom, weak, dayMaster: b.dayMaster }, personality);
  const synthesis = {
    en: `Across all six systems, one thread repeats: ${bazi.element} steadiness, ${a.sun.en} timing, and Life Path ${n.lp}. They do not agree on the details — they agree on the direction: start small, keep going, and let the result catch up. Where they agree: your Bazi chart leans ${dom}-heavy, your life-path ${n.lp} and your first tarot card all reward the same working style — accumulation and craft over luck or shortcuts. Where they tension: your Moon in ${a.moon.en} runs a fast emotional cycle, yet the chart is light on ${weak} — quick to process, slow to replenish.`,
    zh: `在六个系统中，一条线不断重复：${elName(bazi.dayMaster.elementKey, 'zh')}的稳定、${a.sun.zh}的时机，以及生命灵数 ${n.lp}。它们在细节上并不一致，但在方向上一致：从小开始，持续前行，让结果跟上来。一致之处：八字以${elName(dom, 'zh')}最旺、生命灵数 ${n.lp}与塔罗第一张牌都奖励同一种工作方式——累积与手艺，而非运气或捷径。张力之处：月亮在${a.moon.zh}令你情绪节奏较快，但八字缺${elName(weak, 'zh')}——想得快、补给慢。`,
    agree: { en: `Your Bazi chart leans ${dom}-heavy, your life-path ${n.lp} and your first tarot card all reward the same working style: accumulation and craft over luck or shortcuts.`, zh: `八字五行以${elName(dom, 'zh')}最旺、数字命理生命灵数 ${n.lp}、塔罗第一张牌，三者都指向同一种工作方式：靠累积与手艺，而非靠运气或人脉捷径。` },
    tension: { en: `Your Moon in ${a.moon.en} runs a fast emotional cycle, yet the chart is light on ${weak} — quick to process, slow to replenish. The full report turns this into a concrete 12-month pacing plan.`, zh: `月亮在${a.moon.zh}令你情绪节奏较快，但八字缺${elName(weak, 'zh')}——想得快、补给慢。完整报告会把这点展开为具体的十二个月安排。` },
    full: { en: `Full synthesis: over the next twelve months (${nextTwelveMonths().en}), keep the pace steady. On relationships, the Yi-Jing changing line and the third tarot card give the same instruction — boundaries before commitments. Health-wise, schedule deliberate slack in your ${weak}-light months. Your Zi Wei life-palace star and your Bazi useful god point, unusually, at the same conclusion: this is a year for consolidating, not expanding.`, zh: `完整综合：未来十二个月（${nextTwelveMonths().zh}），保持节奏稳定；感情层面，易经变爻与塔罗第三张牌同时提示「先定界线，后谈承诺」。健康上，缺${elName(weak, 'zh')}的月份要主动留白。紫微命宫主星与八字用神罕有地指向同一结论：今年适合整固，而非扩张。` },
    personalityLens: personality ? personalityLensText(personality) : null,
  };

  return {
    profile: { name: name || null, birthDate, birthTime: birthTime || null, focus: focus || 'general', question: question || null },
    generatedAt: new Date().toISOString(),
    bazi, ziwei, horoscope, numerology, yijing: yijingOut, tarot: tarotOut,
    portrait, synthesis,
    limits: [
      'Bazi simplified engine, no true solar-time correction yet.',
      'Zi Wei paid content is illustrative sample, not computed.',
      'Moon / Rising are approximations from the original prototype.',
      'Self-reflection / entertainment only — no medical, financial or legal claims.',
    ],
  };
}
function personalityLensText(p) {
  const parts = [];
  if (p.enneagram) parts.push({ en: `Enneagram Type ${p.enneagram.core}w${p.enneagram.wing} · ${p.enneagram.nameEn}. `, zh: `九型人格 ${p.enneagram.core}w${p.enneagram.wing} · ${p.enneagram.nameZh}。` });
  if (p.mbti) parts.push({ en: `MBTI ${p.mbti.type} · ${p.mbti.nickEn}. `, zh: `MBTI ${p.mbti.type} · ${p.mbti.nickZh}。` });
  return {
    en: parts.map((x) => x.en).join('') + 'This lens comes from your own questionnaire answers, not from your birth data. Your personality pattern explains how you respond to the timing the charts describe. Where your habits and the charts point the same way, things move fast. Where they pull apart, that is exactly where this reading deserves your attention.',
    zh: parts.map((x) => x.zh).join('') + '这是人格视角，来自你自己的问卷答案，不是出生计算。对照来看：你的人格模式解释了你「如何回应」命盘所指的时机——当人格的惯性与命盘的建议同向，事情推进得快；相左之处，正是这份判读最值得你留意的地方。',
  };
}

/* --- Complete Portrait (original renderPortrait logic, server-side) ------ */
function buildPortrait(birth, personality) {
  const { bazi, horoscope, numerology, dom, weak, dayMaster } = birth;
  const ennea = personality?.enneagram || null;
  const mbti = personality?.mbti || null;
  const strengths = [], lacking = [];
  if (bazi) {
    strengths.push({ text: { en: D.DM_PORTRAIT[dayMaster].sEn, zh: D.DM_PORTRAIT[dayMaster].sZh }, source: { en: 'Bazi · Day Master', zh: '八字 · 日主' } });
    strengths.push({ text: { en: D.EL_PORTRAIT[dom].sEn, zh: D.EL_PORTRAIT[dom].sZh }, source: { en: `Bazi · strongest element ${dom}`, zh: `八字 · 最旺五行 ${elName(dom, 'zh')}` } });
    lacking.push({ text: { en: D.EL_PORTRAIT[weak].gEn, zh: D.EL_PORTRAIT[weak].gZh }, source: { en: `Bazi · lightest element ${weak}`, zh: `八字 · 最弱五行 ${elName(weak, 'zh')}` } });
    lacking.push({ text: { en: D.DM_PORTRAIT[dayMaster].gEn, zh: D.DM_PORTRAIT[dayMaster].gZh }, source: { en: 'Bazi · Day Master lesson', zh: '八字 · 日主课题' } });
    if (D.LP_PORTRAIT[numerology.lifePath]) lacking.push({ text: { en: D.LP_PORTRAIT[numerology.lifePath].gEn, zh: D.LP_PORTRAIT[numerology.lifePath].gZh }, source: { en: `Numerology · Life Path ${numerology.lifePath}`, zh: `数字命理 · 生命灵数 ${numerology.lifePath}` } });
  }
  if (ennea) {
    strengths.push({ text: { en: D.ENNEA_PORTRAIT[ennea.core].sEn, zh: D.ENNEA_PORTRAIT[ennea.core].sZh }, source: { en: `Enneagram ${ennea.core}w${ennea.wing}`, zh: `九型 ${ennea.core}w${ennea.wing}` } });
    lacking.push({ text: { en: D.ENNEA_PORTRAIT[ennea.core].gEn, zh: D.ENNEA_PORTRAIT[ennea.core].gZh }, source: { en: `Enneagram Type ${ennea.core}`, zh: `九型 ${ennea.core} 号` } });
  }
  if (mbti) {
    const ms = mbtiPart(mbti.type, 's'), mg = mbtiPart(mbti.type, 'g');
    if (ms.en) strengths.push({ text: ms, source: { en: `MBTI ${mbti.type}`, zh: `MBTI ${mbti.type}` } });
    if (mg.en) lacking.push({ text: mg, source: { en: `MBTI ${mbti.type}`, zh: `MBTI ${mbti.type}` } });
  }
  const practices = [];
  if (bazi) practices.push({ en: D.EL_PORTRAIT[weak].pEn, zh: D.EL_PORTRAIT[weak].pZh });
  if (ennea) practices.push({ en: `Take one small weekly rep against your Enneagram growth edge — ${D.ENNEA_PORTRAIT[ennea.core].gEn.charAt(0).toLowerCase()}${D.ENNEA_PORTRAIT[ennea.core].gEn.slice(1)} Each week, pick one real situation that triggers it, notice it arriving, then deliberately do the opposite in a small way once — and log the result in one line.`, zh: `针对九型所缺之处做一个每周小练习——${D.ENNEA_PORTRAIT[ennea.core].gZh}做法：每周选一个会触发它的真实场合，先留意它出现，再刻意做一次相反的小行动，事后用一行字记下结果。` });
  if (mbti) {
    const opp = [['E', 'I'], ['S', 'N'], ['T', 'F'], ['J', 'P']].map(([a, b2]) => (mbti.dims[a] >= mbti.dims[b2] ? b2 : a));
    practices.push({ en: `Give your less-used side (${opp.join(', ')}) one small rep each week: in a situation where ${D.MBTI_LETTER[opp[0]].en}, do it deliberately, once, on purpose.`, zh: `每周给较少使用的一侧（${opp.join('、')}）一次小练习：例如需要${D.MBTI_LETTER[opp[0]].zh}的场合，不要回避，刻意做一次小的。` });
  }
  const essence = {
    en: `${bazi ? `${bazi.dayMaster.en} Day Master, ${horoscope.sun.en} Sun, Life Path ${numerology.lifePath}` : ''}${ennea ? ` · Enneagram ${ennea.core}w${ennea.wing} ${ennea.nameEn}` : ''}${mbti ? ` · MBTI ${mbti.type} ${mbti.nickEn}` : ''} — steady in your own direction, even when the route changes.`,
    zh: `${bazi ? `日主${bazi.dayMaster.zh}、太阳${horoscope.sun.zh}、生命灵数 ${numerology.lifePath}` : ''}${ennea ? ` · 九型 ${ennea.core}w${ennea.wing} ${ennea.nameZh}` : ''}${mbti ? ` · MBTI ${mbti.type} ${mbti.nickZh}` : ''}——即使路线改变，仍朝着自己的方向稳定前行。`,
  };
  return {
    essenceLine: essence,
    character: {
      en: `${D.DAYMASTER_TXT[dayMaster].en} Your Sun in ${horoscope.sun.en} centres your drive on ${D.SIGN_TRAITS.en[horoscope.sun.en]}; your Moon in ${horoscope.moon.en} sets an emotional rhythm governed by ${D.SIGN_TRAITS.en[horoscope.moon.en]}. Life Path ${numerology.lifePath}: ${D.LP.en[String(numerology.lifePath)]}${ennea ? ` Enneagram: ${D.ENNEA_TYPES[ennea.core].core.en}` : ''}${mbti ? ` MBTI: ${D.MBTI_TYPES[mbti.type].en}` : ''}`,
      zh: `${D.DAYMASTER_TXT[dayMaster].zh}你的太阳在${horoscope.sun.zh}，核心动力围绕${D.SIGN_TRAITS.zh[horoscope.sun.en]}；月亮在${horoscope.moon.zh}，情绪节奏与充电方式由${D.SIGN_TRAITS.zh[horoscope.moon.en]}主导。生命灵数 ${numerology.lifePath}：${D.LP.zh[String(numerology.lifePath)]}${ennea ? ` 九型：${D.ENNEA_TYPES[ennea.core].core.zh}` : ''}${mbti ? ` MBTI：${D.MBTI_TYPES[mbti.type].zh}` : ''}`,
    },
    style: {
      think: { en: `${mbti ? `${D.MBTI_LETTER[mbti.dims.S >= mbti.dims.N ? 'S' : 'N'].en}; ${D.MBTI_LETTER[mbti.dims.T >= mbti.dims.F ? 'T' : 'F'].en}. ` : ''}${ennea ? `Underneath, the drive is to ${D.ENNEA_PORTRAIT[ennea.core].dEn} — decisions are rarely purely technical for you; they pass this filter first.` : `Your Day Master and strongest element (${dom}) set the tone: ${D.EL_TXT[dom].en} is your default mode.`}`, zh: `${mbti ? `${D.MBTI_LETTER[mbti.dims.S >= mbti.dims.N ? 'S' : 'N'].zh}；${D.MBTI_LETTER[mbti.dims.T >= mbti.dims.F ? 'T' : 'F'].zh}。` : ''}${ennea ? `底层动力是想要${D.ENNEA_PORTRAIT[ennea.core].dZh}——决定很少是纯技术性的，它们要先过这一关。` : `你的日主与最旺五行（${elName(dom, 'zh')}）定下思考基调：${D.EL_TXT[dom].zh}是你的预设模式。`}` },
      work: { en: `Your work energy runs ${dom}-led — ${D.EL_TXT[dom].en} is how you work without effort.${mbti ? ` ${D.MBTI_LETTER[mbti.dims.J >= mbti.dims.P ? 'J' : 'P'].en}.` : ''}${ennea ? ` At work your Enneagram pattern shows as: ${D.ENNEA_PORTRAIT[ennea.core].sEn.toLowerCase()}.` : ''}`, zh: `工作能量以${elName(dom, 'zh')}为主——${D.EL_TXT[dom].zh}，是你不费力的工作方式。${mbti ? ` ${D.MBTI_LETTER[mbti.dims.J >= mbti.dims.P ? 'J' : 'P'].zh}。` : ''}${ennea ? ` 九型模式在工作上表现为：${D.ENNEA_PORTRAIT[ennea.core].sZh}。` : ''}` },
      connect: { en: `You open doors in a ${D.SIGN_TRAITS.en[horoscope.rising.en]} style (${horoscope.rising.en} Rising) and privately recharge through ${D.SIGN_TRAITS.en[horoscope.moon.en]} (${horoscope.moon.en} Moon).${mbti ? ` ${D.MBTI_LETTER[mbti.dims.E >= mbti.dims.I ? 'E' : 'I'].en}.` : ''}${ennea ? ` In relationships, your core drive — to ${D.ENNEA_PORTRAIT[ennea.core].dEn} — shapes how you give and how you withdraw.` : ''}`, zh: `你以${D.SIGN_TRAITS.zh[horoscope.rising.en]}的风格打开门（上升${horoscope.rising.zh}），私下靠${D.SIGN_TRAITS.zh[horoscope.moon.en]}充电（月亮${horoscope.moon.zh}）。${mbti ? ` ${D.MBTI_LETTER[mbti.dims.E >= mbti.dims.I ? 'E' : 'I'].zh}。` : ''}${ennea ? ` 在关系中，你的核心动力——想要${D.ENNEA_PORTRAIT[ennea.core].dZh}——决定了你付出与退缩的方式。` : ''}` },
    },
    strengths: strengths.slice(0, 5),
    lacking: lacking.slice(0, 5),
    growingEdge: { en: lacking[0] ? lacking[0].text.en : 'Notice where you rush to fix, and pause there first. The pause is part of the work.', zh: lacking[0] ? lacking[0].text.zh : '留意你急着修正的地方，先在那里停一下。停顿也是工作的一部分。' },
    developmentFocus: practices,
    sources: {
      en: `Drawn only from: birth reading (Bazi · Astrology · Numerology)${ennea ? ' · Enneagram' : ''}${mbti ? ' · MBTI' : ''}. ${!ennea || !mbti ? 'Complete the personality tests to add their lens — nothing is guessed at.' : ''}`,
      zh: `只综合已完成的来源：出生解读（八字 · 占星 · 数字命理）${ennea ? ' · 九型人格' : ''}${mbti ? ' · MBTI' : ''}。${!ennea || !mbti ? '完成人格测试后，这里会加入它独有的视角——未完成的部分不会被猜测填补。' : ''}`,
    },
  };
}
function mbtiPart(type, part) {
  const ty = D.MBTI_TYPES[type]; if (!ty) return { en: '', zh: '' };
  const split = (txt, marker, endMarker) => { const a = txt.split(marker)[1]; if (!a) return ''; return endMarker ? a.split(endMarker)[0] : a; };
  return {
    en: part === 's' ? split(ty.en, 'Strengths:', '. Watch-out') : split(ty.en, 'Watch-out:', '.').replace(/\.$/, ''),
    zh: part === 's' ? split(ty.zh, '长处：', '。注意') : split(ty.zh, '注意：', '。'),
  };
}

/* --- Teaser / hook (free — ONLY these fields may leave the server) ---------
   Hook rule: a card name + at most 1–2 lines per system. Never full guidance,
   never synthesis, never interpretations. The frontend blurs / locks the rest. */
function buildTeaser(profile) {
  const full = buildFullReading(profile);
  return {
    profile: { birthDate: full.profile.birthDate },
    teaser: true,
    bazi: {
      dayMaster: full.bazi.dayMaster.en, dayMasterZh: full.bazi.dayMaster.zh,
      hook: { en: firstSentence(full.bazi.dayMasterText.en), zh: firstSentence(full.bazi.dayMasterText.zh) },
    },
    ziwei: {
      lifePalace: full.ziwei.lifePalace, lifePalaceZh: full.ziwei.lifePalaceZh,
      hook: { en: full.ziwei.palaces[0].text.en, zh: full.ziwei.palaces[0].text.zh },
    },
    horoscope: {
      sunSign: full.horoscope.sunSign.en, sunSignZh: full.horoscope.sunSign.zh,
      hook: { en: full.horoscope.sun.trait.en, zh: full.horoscope.sun.trait.zh },
    },
    numerology: {
      lifePath: full.numerology.lifePath,
      hook: { en: firstSentence(full.numerology.lifePathText.en), zh: firstSentence(full.numerology.lifePathText.zh) },
    },
    yijing: {
      hexagram: full.yijing.hexagram,
      hook: { en: full.yijing.theme.en, zh: full.yijing.theme.zh },
      // The six coin-toss lines (line number, coin sum, solid/broken,
      // changing or not) — the casting ritual itself, not the interpretation.
      // The frontend animates these one toss at a time, bottom to top, so
      // the hexagram shown always matches the lines shown. No line text
      // (interpretation) is included here; that stays paid-only.
      lines: full.yijing.lines.map((l) => ({ line: l.line, sum: l.sum, yang: l.yang, changing: l.changing })),
    },
    tarot: {
      firstCard: full.tarot.cards[0],
      // Card names + keywords only — the interpretation stays locked.
      cards: full.tarot.cardsDetailed.map((c) => ({
        idx: c.idx, number: c.number, name: c.name, emoji: c.emoji, keywords: c.keywords, keywordsZh: c.keywordsZh, reversed: c.reversed,
      })),
    },
    portrait: { essenceLine: full.portrait.essenceLine },
    lockedNote: {
      en: 'Full details for each system are unlocked after payment.',
      zh: '每个系统的完整内容需付款后解锁。',
    },
  };
}

/* --- Enneagram / MBTI — original 9+18 / 8+16 scoring ---------------------- */
/**
 * Score Enneagram from the browser's option INDEXES (0,1,2 per question).
 * The index → type mapping lives server-side only (original data), so the
 * browser never sees how answers map to types.
 */
function scoreEnneagramFromChoices(choices) {
  if (!Array.isArray(choices) || (choices.length !== 9 && choices.length !== 27)) return null;
  const all = [...D.ENNEA_Q, ...D.ENNEA_Q2];
  const types = choices.map((idx, i) => {
    const q = all[i]; if (!q || !q.opts) return null;
    const opt = q.opts[Number(idx)];
    return opt ? opt.t : null;
  });
  if (types.some((t) => t === null || t === undefined)) return null;
  return scoreEnneagram(types);
}
function scoreEnneagram(answers) {
  if (!Array.isArray(answers) || (answers.length !== 9 && answers.length !== 27)) return null;
  const types = answers.map((v) => Number(v)).filter((v) => v >= 1 && v <= 9);
  if (types.length !== answers.length) return null;
  const scores = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  types.forEach((t) => scores[t - 1]++);
  let core = 0; scores.forEach((s, i) => { if (s > scores[core]) core = i; });
  const coreType = core + 1;
  const adj = [coreType === 1 ? 9 : coreType - 1, coreType === 9 ? 1 : coreType + 1];
  const wing = scores[adj[0] - 1] >= scores[adj[1] - 1] ? adj[0] : adj[1];
  const sorted = scores.map((s, i) => ({ type: i + 1, score: s })).sort((a, b) => b.score - a.score);
  const second = sorted[1].type;
  const margin = sorted[0].score - sorted[1].score;
  const ty = D.ENNEA_TYPES[coreType];
  return {
    type: coreType, core: coreType, wing, second, margin,
    confidence: margin >= 4 ? 'clear' : margin >= 2 ? 'moderate' : 'close',
    scores, total: answers.length, deep: answers.length === 27,
    nameEn: ty.nameEn, nameZh: ty.nameZh,
    interpretation: { core: { en: ty.core.en, zh: ty.core.zh }, deep: { en: ty.deep.en, zh: ty.deep.zh } },
    summary: {
      en: `Enneagram Type ${coreType}w${wing} · ${ty.nameEn}. ${ty.core.en} ${ty.deep.en}`,
      zh: `九型人格 ${coreType}w${wing} · ${ty.nameZh}。${ty.core.zh} ${ty.deep.zh}`,
    },
    strengths: { en: D.ENNEA_PORTRAIT[coreType].sEn, zh: D.ENNEA_PORTRAIT[coreType].sZh },
    lacking: { en: D.ENNEA_PORTRAIT[coreType].gEn, zh: D.ENNEA_PORTRAIT[coreType].gZh },
  };
}
function scoreMbti(answers) {
  if (!Array.isArray(answers) || (answers.length !== 8 && answers.length !== 24)) return null;
  const dims = [['E', 'I'], ['S', 'N'], ['T', 'F'], ['J', 'P']];
  const all = [...D.MBTI_Q, ...D.MBTI_Q2];
  const counts = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
  answers.forEach((a, i) => {
    const q = all[i]; if (!q) return;
    const letter = a === 'a' ? q.a.l : q.b.l;
    counts[letter]++;
  });
  let code = '';
  const dimOut = {};
  for (const [x, y] of dims) {
    const total = counts[x] + counts[y];
    const pct = total ? Math.round((counts[x] / total) * 100) : 50;
    const letter = counts[x] >= counts[y] ? x : y;
    code += letter;
    const pref = Math.abs(pct - 50);
    dimOut[`${x}${y}`] = { a: counts[x], b: counts[y], pct, letter, strength: pref >= 33 ? 'strong' : pref >= 17 ? 'clear' : pref >= 8 ? 'moderate' : 'slight' };
  }
  const ty = D.MBTI_TYPES[code];
  return {
    type: code, dims: { E: counts.E, I: counts.I, S: counts.S, N: counts.N, T: counts.T, F: counts.F, J: counts.J, P: counts.P },
    dimensions: dimOut, total: answers.length, deep: answers.length === 24,
    nickEn: ty.nickEn, nickZh: ty.nickZh,
    interpretation: { en: ty.en, zh: ty.zh, deepEn: ty.deepEn, deepZh: ty.deepZh },
    summary: { en: `MBTI ${code} · ${ty.nickEn}. ${ty.en} ${ty.deepEn}`, zh: `MBTI ${code} · ${ty.nickZh}。${ty.zh} ${ty.deepZh}` },
  };
}
function getPersonalityQuestions() {
  return {
    enneagram: [...D.ENNEA_Q, ...D.ENNEA_Q2].map((q, i) => ({ n: i + 1, q: q.q, opts: q.opts })),
    mbti: [...D.MBTI_Q, ...D.MBTI_Q2].map((q, i) => ({ n: i + 1, dim: q.dim, q: q.q, a: q.a, b: q.b })),
  };
}
function buildPersonalitySummary(enneagram, mbti) {
  const strengths = [], lacking = [];
  if (enneagram) {
    strengths.push({ text: enneaStrength(enneagram), source: { en: `Enneagram ${enneagram.core}w${enneagram.wing}`, zh: `九型 ${enneagram.core}w${enneagram.wing}` } });
    lacking.push({ text: enneaLacking(enneagram), source: { en: `Enneagram Type ${enneagram.core}`, zh: `九型 ${enneagram.core} 号` } });
  }
  if (mbti) {
    const ms = mbtiPart(mbti.type, 's'), mg = mbtiPart(mbti.type, 'g');
    if (ms.en) strengths.push({ text: ms, source: { en: `MBTI ${mbti.type}`, zh: `MBTI ${mbti.type}` } });
    if (mg.en) lacking.push({ text: mg, source: { en: `MBTI ${mbti.type}`, zh: `MBTI ${mbti.type}` } });
  }
  return { strengths, lacking };
}
function enneaStrength(e) { return { en: D.ENNEA_PORTRAIT[e.core].sEn, zh: D.ENNEA_PORTRAIT[e.core].sZh }; }
function enneaLacking(e) { return { en: D.ENNEA_PORTRAIT[e.core].gEn, zh: D.ENNEA_PORTRAIT[e.core].gZh }; }

/**
 * Locked (pre-payment) personality teaser: type + name + ONE teaser line
 * only. No scores, no interpretation, no strengths/lacking — those unlock
 * only with a valid paid token. Safe to return without a token.
 */
function firstSentence(text) {
  if (!text) return '';
  const m = String(text).match(/^[^.!?。]+[.!?。]?/);
  return (m ? m[0] : String(text)).trim();
}
function lockedPersonalitySummary(enneagram, mbti) {
  const out = { locked: true };
  if (enneagram) {
    out.enneagram = {
      type: enneagram.core, wing: enneagram.wing,
      nameEn: enneagram.nameEn, nameZh: enneagram.nameZh,
      teaser: {
        en: firstSentence(enneagram.interpretation.core.en),
        zh: firstSentence(enneagram.interpretation.core.zh),
      },
      locked: true,
    };
  }
  if (mbti) {
    out.mbti = {
      type: mbti.type, nickEn: mbti.nickEn, nickZh: mbti.nickZh,
      teaser: {
        en: firstSentence(mbti.interpretation.en),
        zh: firstSentence(mbti.interpretation.zh),
      },
      locked: true,
    };
  }
  return out;
}

/* --- Daily encouragement (item F, 7 Nov 2026) ------------------------------
   The daily message is GENERATED for a specific date, from that buyer's
   own birth profile entered at input — never a generic line rotated from
   a fixed list. Same profile on a different day -> different card and
   hexagram (both are seeded by profile + date); different profiles on
   the same day -> different Day Master / elements / Life Path. The
   message names the date, today's card (seeded draw), today's hexagram
   (seeded cast), and the profile's own computed values. */
function buildDailyMessage(profile, dateStr) {
  const date = dateStr || new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Singapore', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
  const full = buildFullReading(profile);
  const seed = `${profile.birthDate}|${date}`;
  const draw = drawTarot(`${seed}|daily`);
  const card = D.TAROT[draw[0].idx];
  const cast = castYijing(`${seed}|daily-yi`);
  const hex = cast.hex;
  const d = new Date(`${date}T00:00:00Z`);
  const wdEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getUTCDay()];
  const wdZh = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][d.getUTCDay()];
  const domEn = elName(full.bazi.dominant, 'en'), domZh = elName(full.bazi.dominant, 'zh');
  const weakEn = elName(full.bazi.weakest, 'en'), weakZh = elName(full.bazi.weakest, 'zh');
  return {
    date,
    en: `Today, ${wdEn} ${date}: your card is ${card[1]} — ${card[4]}. ${D.HEX_THEME.en[hex[0]]} Your strongest element is ${domEn}; lean on it today, and give your lightest element, ${weakEn}, one small break. Life Path ${full.numerology.lifePath} sets the theme: ${firstSentence(full.numerology.lifePathText.en)}`,
    zh: `今天${date}${wdZh}：你的牌是「${card[2]}」——${D.TAROT_ZH_KEYWORDS[draw[0].idx]}。${D.HEX_THEME.zh[hex[0]]}你最旺的五行是${domZh}，今天就靠它；最弱的${weakZh}，给它留一点空。生命灵数 ${full.numerology.lifePath}定下今天的主题：${firstSentence(full.numerology.lifePathText.zh)}`,
    card: { idx: draw[0].idx, number: card[0], name: { en: card[1], zh: card[2] }, emoji: card[3], reversed: draw[0].rev },
    hexagram: { number: hex[0], en: hex[1], zh: hex[2], theme: { en: D.HEX_THEME.en[hex[0]], zh: D.HEX_THEME.zh[hex[0]] } },
    dayMaster: full.bazi.dayMaster, lifePath: full.numerology.lifePath,
  };
}

module.exports = { buildFullReading, buildTeaser, scoreEnneagram, scoreEnneagramFromChoices, scoreMbti, parseBirth, getPersonalityQuestions, buildPersonalitySummary, buildPortrait, lockedPersonalitySummary, buildDailyMessage, elName, elementMeaning, currentYear, chineseYearLabel, nextTwelveMonths };
