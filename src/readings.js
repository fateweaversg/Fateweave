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
  const pyStr = String(date.getMonth() + 1) + String(date.getDate()) + '2026'; let pySum = 0;
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

/* --- Section text (bilingual, derived from the original tables) ---------- */
function sec(en, zh) { return { en, zh }; }
function baziSections(b, dom, weak, dmTxt, lang) {
  const domE = elName(dom, 'en'), weakE = elName(weak, 'en');
  return {
    overview: sec(
      `Your Day Master is ${STEM_EN[b.dayMaster]} (${STEM_ZH[b.dayMaster]}). The chart runs strongest in ${domE} and lightest in ${weakE}; both your working style and what you need to deliberately supply come from that imbalance.`,
      `你的日主是${STEM_ZH[b.dayMaster]}。整體五行以${elName(dom, 'zh')}最旺、${elName(weak, 'zh')}最弱——行事風格與需要補足的方向，都從這裡讀出來。`),
    dayMaster: sec(dmTxt.en, dmTxt.zh),
    strengths: sec(
      `Your strongest element, ${domE}, is the mode you run without effort — ${D.EL_TXT[dom].en} is a default strength. ${D.DM_PORTRAIT[b.dayMaster].sEn}.`,
      `你最旺的${elName(dom, 'zh')}是你不費力就做到的模式——${D.EL_TXT[dom].zh}。${D.DM_PORTRAIT[b.dayMaster].sZh}。`),
    challenges: sec(
      `Your lightest element, ${weakE}, is the one to cultivate deliberately — ${D.EL_TXT[weak].en} does not switch on by itself. ${D.DM_PORTRAIT[b.dayMaster].gEn}.`,
      `你最弱的${elName(weak, 'zh')}需要刻意經營——${D.EL_TXT[weak].zh}。${D.DM_PORTRAIT[b.dayMaster].gZh}。`),
    career: sec(
      `At work, ${domE} energy is how you deliver without forcing it: ${D.EL_TXT[dom].en} Lower your reliance on willpower in ${weakE} areas — put structure, a checklist or a collaborator there instead. Your useful god is ${weakE}: feed the lightest element to balance the chart.`,
      `工作上，${elName(dom, 'zh')}是你不費力的工作方式：${D.EL_TXT[dom].zh}。在${elName(weak, 'zh')}的範疇，少靠意志力，多靠結構、清單或合作者。你的用神是${elName(weak, 'zh')}：補最弱者，平衡全局。`),
    relationships: sec(
      `In relationships, your Day Master sets the tone: ${dmTxt.en} People experience you as steady in your own direction — say what you need plainly, rather than letting correctness or habit speak for it.`,
      `在關係中，日主定下基調：${dmTxt.zh}別人感受到你朝著自己的方向穩定前行——直接說出需要，不要讓「正確」或習慣代替你說話。`),
    health: sec(
      `Energy management: ${domE} is your natural fuel, ${weakE} is where you leak. Schedule deliberate slack in your ${weakE}-light months and protect rest the way you protect deadlines — ${D.EL_PORTRAIT[weak].pEn}`,
      `精力管理：${elName(dom, 'zh')}是你的天然燃料，${elName(weak, 'zh')}是你漏氣的地方。在${elName(weak, 'zh')}較弱的月份主動留白，像守約一樣保護恢復——${D.EL_PORTRAIT[weak].pZh}`),
    timing: sec(
      `This year is 丙午, Fire Horse 2026 — it feeds your ${domE}. The current luck pillar runs a decade at a time; the theme now is building. Across the next twelve months, career and money windows peak in months 3–4 and again in month 9. This is a year for consolidating, not expanding.`,
      `今年是丙午火馬年 2026，與你的${elName(dom, 'zh')}相生。當前大運十年一步，現行主題是建立。未來十二個月，事業與財務窗口在第 3–4 月及第 9 月最強。今年適合整固，而非擴張。`),
  };
}
function horoscopeSections(a, lang) {
  const t = (s) => D.SIGN_TRAITS.en[s.en];
  const tz = (s) => D.SIGN_TRAITS.zh[s.en];
  return {
    overview: sec(
      `People meet your ${a.rising.en} Rising first; decisions are made by your ${a.sun.en} Sun; and your ${a.moon.en} Moon explains why some days you are unstoppable and others you simply want the door closed.`,
      `別人先遇到的，是你上升${a.rising.zh}的門面；真正做決定的，是太陽${a.sun.zh}；而月亮${a.moon.zh}解釋了你為何在某些日子特別高效、某些日子只想關門。`),
    sun: sec(`Your core identity and fuel centre on ${t(a.sun)}. When your life is arranged around it you feel recognisably yourself; drift too far from it for too long and even a stable life slowly deflates.`, `你的核心身份與動力圍繞${tz(a.sun)}。當生活安排與這主題同向，你會感到「這才是我」；長期偏離它，再穩定的日子也會慢慢漏氣。`),
    moon: sec(`Your emotional rhythm and recharging style are governed by ${t(a.moon)}. This is what you privately need in order to feel safe; under pressure, feed the Moon first and your judgement comes back online.`, `你的情緒節奏與充電方式由${tz(a.moon)}主導。這是你私下需要被照顧的方式——壓力大時，先滿足月亮的需求，判斷力才會回來。`),
    rising: sec(`First impressions of you are filtered through ${t(a.rising)} — it is the style you open doors with, and where strangers most often misread you. For interviews, first meetings and public appearances, presenting in this style costs you the least energy.`, `別人對你的第一印象來自${tz(a.rising)}——這是你開門的方式，也是陌生人誤讀你的地方。面試、初次見面與公開露面時，順著上升星座的風格呈現自己最省力。`),
    career: sec(`Career follows your Sun: work that lets you live ${t(a.sun)} will feel like yours; work that only uses your Rising style will pay but not satisfy. Choose roles where the Sun's theme is the job, not a hobby you fit around it.`, `事業跟隨你的太陽：能讓你活出${tz(a.sun)}的工作，會感覺真正屬於你；只用上升風格的工作能賺錢，卻不滿足。選擇太陽主題本身就是工作內容的崗位。`),
    relationships: sec(`In relationships, your Moon sets the private terms: you need ${t(a.moon)} to feel safe. Say that plainly early — a partner cannot meet a need you have only hinted at.`, `在關係中，月亮定下私下條件：你需要${tz(a.moon)}才感到安全。及早直接說出來——伴侶無法滿足你只暗示過的需要。`),
    health: sec(`Your Moon is your recovery gauge. When ${t(a.moon)} is starved, judgement goes first. Protect the Moon's recharge the way you protect a deadline.`, `月亮是你的恢復儀表。當${tz(a.moon)}被虧待，判斷力最先離場。像守死線一樣保護月亮的充電方式。`),
    timing: sec(`Your Sun's timing is the clue: the moments when you feel most yourself are usually the moments when the answer is clearest. Do not decide when you are tired or rushed — decide in the window when you are most like yourself.`, `太陽的時機就是線索：你感覺最像自己的時刻，通常也是答案最清晰的時刻。不要在疲憊或匆忙時決定——在最像自己的時段決定。`),
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
    overview: sec(`Life Path ${n.lp}: ${D.LP.en[String(n.lp)]} This is the lesson your life keeps re-teaching in new costumes. Work with it and effort compounds; work against it and the same frustration returns wearing different clothes.`, `生命靈數 ${n.lp}：${D.LP.zh[String(n.lp)]}這是你反覆要學的一課：順著它走，事情有累積感；逆著它硬闖，同一類挫折會以不同面貌回來。`),
    lifePath: sec(D.LP.en[String(n.lp)], D.LP.zh[String(n.lp)]),
    destiny: n.dest ? sec(`Destiny ${n.dest}: ${D.LP.en[String(n.dest)]} This is the outward assignment your name carries — the direction the world keeps asking you to practise.`, `命運數 ${n.dest}：${D.LP.zh[String(n.dest)]}這是你的名字帶出的外在功課——世界不斷要求你練習的方向。`) : sec('No name was given, so no Destiny number was calculated.', '未提供姓名，因此沒有計算命運數。'),
    personalYear: sec(`2026 is ${D.PY_TXT.en[String(n.py)]}`, `2026 年是${D.PY_TXT.zh[String(n.py)]}`),
    career: sec(`Career follows Life Path ${n.lp}: roles that let you practise ${D.LP.en[String(n.lp)].split('.')[0].toLowerCase()} will compound; roles that ask you to do the opposite will feel like pushing uphill every week.`, `事業跟隨生命靈數 ${n.lp}：能讓你練習「${D.LP.zh[String(n.lp)]}」的崗位會有累積感；要求你做相反事的崗位，每週都會像推石上山。`),
    relationships: sec(`In relationships, Life Path ${n.lp} asks for the same lesson in a different room: ${lpLesson('en')}`, `在關係中，生命靈數 ${n.lp} 要求同一課在另一個房間重演：${lpLesson('zh')}`),
    health: sec(`Your Personal Year ${n.py} sets the energy budget for 2026: ${D.PY_TXT.en[String(n.py)]} Plan rest and effort around that theme, not against it.`, `你的個人年 ${n.py} 定下 2026 年的能量預算：${D.PY_TXT.zh[String(n.py)]}按這個主題安排休息與努力，而不是逆著它。`),
    timing: sec(`2026 is ${D.PY_TXT.en[String(n.py)]} Across the year, the strongest windows are the months that match this theme — use them for the big move, and let the other months be for preparation.`, `2026 年是${D.PY_TXT.zh[String(n.py)]}全年最強的窗口，是與這個主題相符的月份——大事放在那些月份，其他月份用來準備。`),
  };
}
function yijingSections(cast, lang) {
  const hex = cast.hex;
  return {
    overview: sec(`Hexagram ${hex[0]} · ${hex[1]} (${hex[2]}) — ${D.HEX_THEME.en[hex[0]]} The upper trigram is ${cast.upper[0]}, the lower is ${cast.lower[0]}: the upper is the outer environment you are moving through; the lower is your inner position and starting point.`, `第 ${hex[0]} 卦 · ${hex[2]}（${hex[1]}）——${D.HEX_THEME.zh[hex[0]]}上卦為${cast.upper[1]}（${cast.upper[0]}）、下卦為${cast.lower[1]}（${cast.lower[0]}）：上卦是你身處的外在環境，下卦是你的內在位置與起點。`),
    judgement: sec(D.HEX_THEME.en[hex[0]], D.HEX_THEME.zh[hex[0]]),
    lines: cast.lines.map((l) => ({ line: l.line, sum: l.sum, yang: l.yang, changing: l.changing, text: sec(D.COIN_TXT.en[String(l.sum)] || (l.yang ? 'Yang line' : 'Yin line'), D.COIN_TXT.zh[String(l.sum)] || (l.yang ? '陽爻' : '陰爻')) })),
    changing: cast.changingLines.length
      ? sec(`Changing line(s) at position ${cast.changingLines.join(', ')} — the situation is in motion, so the answer is not static. ${cast.changingLines.map((p) => `Line ${p}: ${D.LINE_POS.en[p - 1]}`).join(' ')} Transformed hexagram: ${cast.transformed[0]} · ${cast.transformed[1]} — ${D.HEX_THEME.en[cast.transformed[0]]} Read them together: live by the first hexagram now, while leaving room for the direction of the second.`,
        `變爻在第 ${cast.changingLines.join('、')} 爻——情況正在移動，答案不是靜止的。${cast.changingLines.map((p) => `第 ${p} 爻：${D.LINE_POS.zh[p - 1]}`).join(' ')}變卦：第 ${cast.transformed[0]} 卦 · ${cast.transformed[2]}——${D.HEX_THEME.zh[cast.transformed[0]]}兩卦一起讀：先活在本卦的指示裡，同時為變卦的方向留位置。`)
      : sec('No changing lines: the hexagram is stable, with no hinge in motion — act on the interpretation above, give it a month to play out, and do not re-ask the same question in the meantime.', '無變爻：卦象穩定，沒有鉸鏈在移動——直接按上面解讀行事，並以一個月為觀察期，不要急於再問同一問題。'),
    career: sec(`For work, this hexagram instructs you to move at the pace the Judgement sets, not the pace of your anxiety. This week, do one thing that is in the same direction as the hexagram — ${D.HEX_THEME.en[hex[0]]}`, `工作上，此卦的指示是先按卦辭的節奏行事，而不是按你的焦急行事。本週只做一件與卦象同向的事——${D.HEX_THEME.zh[hex[0]]}`),
    relationships: sec(`In relationships, the hexagram's image — ${cast.upper[0]} over ${cast.lower[0]} — is the structure of the answer: the outer environment and your inner position are not in conflict, they are in dialogue. Let the outer set the pace and the inner set the standard.`, `在關係中，卦象——上${cast.upper[1]}、下${cast.lower[1]}——就是答案的結構：外在環境與內在位置不是衝突，而是對話。讓外在定節奏，內在定標準。`),
    health: sec(`For energy, the hexagram asks for one honest step, not a grand plan. Note the result and re-read this in a week; you will see which event the hexagram was pointing at.`, `精力方面，卦象邀請一個小而誠實的行動，而不是宏大計劃。把結果記下來，一週後再回看，你會看見此卦指的是哪一件事。`),
    timing: sec('Give this hexagram a month to play out. Do not re-ask the same question in the meantime — the answer is already moving.', '給這卦一個月時間發酵。期間不要急於再問同一問題——答案已經在動。'),
  };
}
function tarotSections(draw, lang) {
  const posEn = ['Past', 'Present', 'Path'], posZh = ['過去', '現在', '路徑'];
  const cards = draw.map((c, i) => {
    const card = D.TAROT[c.idx];
    return {
      position: { en: posEn[i], zh: posZh[i] }, idx: c.idx, number: card[0], name: { en: card[1], zh: card[2] },
      emoji: card[3], keywords: card[4], reversed: c.rev,
      meaning: { en: c.rev ? D.TAROT_REV.en[c.idx] : card[5], zh: c.rev ? D.TAROT_REV.zh[c.idx] : card[5] },
      positionText: { en: D.TAROT_POS.en[i], zh: D.TAROT_POS.zh[i] },
      forQuestion: sec(
        `For your question, this card in the ${posEn[i]} position asks you to deal first with the element it names — ${card[4]} — before moving to the next step. ${c.rev ? 'Reversed, its energy turns inward first: clear the blockage and outer progress follows.' : 'Upright, its energy is available outwardly: take one small action this week that answers it, and the reading becomes real.'}`,
        `就你的問題而言，這張牌落在${posZh[i]}位，提示你先處理它指出的那一環——${card[4]}——再談下一步。${c.rev ? '因為是逆位，能量先向內：先清障礙，外在進展隨後。' : '此牌正位，能量向外可用：本週內做一個與它呼應的小行動，讓解讀落地。'}`),
    };
  });
  const story = sec(
    `Read as one story: it begins in the root named by ${cards[0].name.en}, passes through the present energy of ${cards[1].name.en}, and leans toward ${cards[2].name.en}. In one sentence: acknowledge how the past shaped the present, then walk the direction the third card points — do not skip the middle card; it is the bridge.`,
    `連起來讀：故事由「${cards[0].name.zh}」的根源出發，經過「${cards[1].name.zh}」的現在，傾向走向「${cards[2].name.zh}」。一句話版本：先承認過去如何塑造了現在，再順著第三張牌指出的方向走——不要跳過中間那張，它是橋。`);
  return {
    cards, story,
    overview: sec(`Past — ${cards[0].name.en}. Present — ${cards[1].name.en}. Near future — ${cards[2].name.en}. The thread between them is the choice you are already making.`, `過去——${cards[0].name.zh}。現在——${cards[1].name.zh}。近期未來——${cards[2].name.zh}。貫穿其中的，是你已經在做的選擇。`),
    career: sec(`At work, the ${cards[1].name.en} in the Present position is the card to sit with longest — it names the energy that is already moving, whether or not you have named it yet.`, `工作上，現在位置的「${cards[1].name.zh}」最值得久坐——它說的是已經在動的能量，無論你是否已為它命名。`),
    relationships: sec(`In relationships, the Path card — ${cards[2].name.en} — does not decide for you; it shows the shape of the path you are already on, so you can choose whether to stay on it.`, `在關係中，路徑位置的「${cards[2].name.zh}」不是替你決定，而是顯示你已經走在的路的形狀，讓你選擇是否繼續走下去。`),
    health: sec(`For energy, the Past card — ${cards[0].name.en} — names what you carry. Acknowledge it before you try to fix the present; the fix lands differently once the root is named.`, `精力方面，過去位置的「${cards[0].name.zh}」說出你攜帶的東西。先承認它，再去處理現在；根源被說出來之後，修正的方式會不同。`),
    timing: sec('Take one small action this week that matches the Present card, and watch what changes. That is how a reading earns its keep.', '本週做一件與現在這張牌相符的小事，看看什麼改變了。'),
  };
}
// Zi Wei palaces — verbatim from the original prototype (sample, NOT computed).
const ZIWEI_PALACES = [
  { key: 'life', en: 'Life Palace', zh: '命宮', star: { en: 'Tian Ji', zh: '天機' }, text: { en: 'Tian Ji — strategy and adaptability lead', zh: '天機——以謀略與變化見長' } },
  { key: 'wealth', en: 'Wealth Palace', zh: '財帛宮', star: { en: 'Wu Qu', zh: '武曲' }, text: { en: 'Wu Qu — wealth through skill and execution', zh: '武曲化祿：財來自專業與執行' } },
  { key: 'career', en: 'Career Palace', zh: '官祿宮', star: { en: 'Tai Yang', zh: '太陽' }, text: { en: 'The Sun — a reputation-led career', zh: '太陽：名聲型事業，宜公開場合' } },
  { key: 'spouse', en: 'Spouse Palace', zh: '夫妻宮', star: { en: 'Tai Yin', zh: '太陰' }, text: { en: 'The Moon — emotional safety first in partners', zh: '太陰：伴侶重情緒安全感' } },
];
function ziweiSections(lang) {
  return {
    overview: sec(
      'Your Life Palace star is Tian Ji, the strategist: your operating core is think it through, then move. Strategy and adaptability are your strongest assets, and you perform better amid change than inside fixed routines. The shadow of Tian Ji is over-thinking and slow starts — a personal rule of act at seventy percent clarity serves this star better than waiting for one hundred.',
      '命宮主星天機：你的行事核心是「先想通、再行動」——謀略與適應力是你最強的資產，在變化中比在固定流程中表現更好。天機的陰影是想得太多、啟動太慢：給自己一個「想通七成便動手」的規則，比追求想通十成更合這顆星。'),
    career: sec('Career Palace — Tai Yang, the Sun: a reputation-led career. Work that is seen, named and trusted in public suits this palace; work done entirely in the background starves it.', '官祿宮——太陽：名聲型事業，宜公開場合。能被看見、被指名、被信任的工作適合此宮；完全在幕後的工作會令它挨餓。'),
    relationships: sec('Spouse Palace — Tai Yin, the Moon: emotional safety first in partners. The relationship works when both people feel safe enough to say the plain thing, not only the polished one.', '夫妻宮——太陰：伴侶重情緒安全感。關係要好，雙方都要感到安全，敢說平實的話，而不只說漂亮的話。'),
    wealth: sec('Wealth Palace — Wu Qu: wealth through skill and execution. Money follows demonstrated competence and finished work, not speculation or waiting to be discovered.', '財帛宮——武曲化祿：財來自專業與執行。金錢跟隨被證明的專業與完成的工作，而不是投機或等待被發現。'),
    health: sec('Life Palace energy is mental: Tian Ji thinks first and acts second. Protect thinking time and sleep — when the mind is tired, the strategist starts second-guessing instead of deciding.', '命宮能量是心智型的：天機先想後動。保護思考時間與睡眠——心累時，謀略家會開始反覆質疑，而不是作決定。'),
    timing: sec('Tian Ji timing is seasonal: think in the quiet season, move in the open one. A full twelve-palace computed chart with decade luck is a Phase 2 layer — this sample does not claim to be it.', '天機的時機是季節性的：安靜的季節思考，公開的季節行動。完整十二宮排盤與大限走勢屬第二階段——此樣本並不聲稱是它。'),
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
  const pillars = [pillarObj(b.pillars[0], 'Year', '年柱'), pillarObj(b.pillars[1], 'Month', '月柱'), pillarObj(b.pillars[2], 'Day', '日柱'), pillarObj(b.pillars[3], 'Hour', '時柱')];
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
    luckPillar: { en: `${D.STEMS[(b.pillars[1].stem + 3) % 10][0]}${D.BRANCHES[(b.pillars[1].branch + 3) % 12][0]}`, zh: `${D.STEMS[(b.pillars[1].stem + 3) % 10][0]}${D.BRANCHES[(b.pillars[1].branch + 3) % 12][0]}`, note: { en: 'Indicative only — one pillar per decade, current theme: building.', zh: '僅供參考——十年一步，現行主題：建立。' } },
    currentYear: { en: '2026 · Fire Horse 丙午', zh: '2026 · 火馬年 丙午' },
    sections: baziSections(b, dom, weak, dmTxt, 'en'),
    note: 'Simplified engine — no true solar-time correction yet.',
    noteZh: '簡化引擎——尚未做真太陽時校正。',
  };
  const ziwei = {
    system: 'Zi Wei Dou Shu',
    lifePalace: 'Tian Ji Palace', lifePalaceZh: '天機宮',
    mainStar: { en: 'Tian Ji', zh: '天機' },
    palaces: ZIWEI_PALACES,
    guidance: { en: 'Illustrative sample reading — Zi Wei content here is a sample, not a fully computed chart. Read it as a reflection prompt, not a prediction.', zh: '示範樣本內容——此處紫微內容為樣本，並非完整排盤。請當作反思提示，而非預測。' },
    sections: ziweiSections('en'),
    note: 'Illustrative sample content, not computed.',
    noteZh: '示範樣本內容，並非完整計算。',
    sample: true,
  };
  const horoscope = {
    system: 'Western Horoscope',
    sunSign: { en: a.sun.en, zh: a.sun.zh, symbol: a.sun.sym },
    sun: { en: a.sun.en, zh: a.sun.zh, symbol: a.sun.sym, trait: { en: D.SIGN_TRAITS.en[a.sun.en], zh: D.SIGN_TRAITS.zh[a.sun.en] } },
    moon: { en: a.moon.en, zh: a.moon.zh, symbol: a.moon.sym, trait: { en: D.SIGN_TRAITS.en[a.moon.en], zh: D.SIGN_TRAITS.zh[a.moon.en] }, note: { en: 'Approximation from the original prototype.', zh: '原型的近似計算。' } },
    rising: { en: a.rising.en, zh: a.rising.zh, symbol: a.rising.sym, trait: { en: D.SIGN_TRAITS.en[a.rising.en], zh: D.SIGN_TRAITS.zh[a.rising.en] }, note: { en: 'Approximation from birth time in the original prototype.', zh: '原型的近似計算。' } },
    guidance: { en: `As a ${a.sun.en}, your next chapter is about using your natural timing — not forcing it.`, zh: `作為${a.sun.zh}，你的下一章是關於運用你自然的節奏——而不是強迫它。` },
    sections: horoscopeSections(a, 'en'),
  };
  const numerology = {
    system: 'Numerology',
    lifePath: n.lp, destiny: n.dest, personalYear: n.py,
    lifePathText: { en: D.LP.en[String(n.lp)], zh: D.LP.zh[String(n.lp)] },
    destinyText: n.dest ? { en: D.LP.en[String(n.dest)], zh: D.LP.zh[String(n.dest)] } : null,
    personalYearText: { en: D.PY_TXT.en[String(n.py)], zh: D.PY_TXT.zh[String(n.py)] },
    guidance: { en: `Life Path ${n.lp} points to the lesson you keep meeting: what you practise, you become.`, zh: `生命靈數 ${n.lp} 指向你不斷遇到的課題：你練習什麼，就成為什麼。` },
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
    guidance: { en: `Hexagram ${cast.hex[0]} · ${cast.hex[1]} asks: what is the smallest honest step you can take today?`, zh: `卦象「${cast.hex[2]}」在問：今天你能採取的最小誠實一步是什麼？` },
    sections: yijing,
  };
  const tarotOut = {
    system: 'Tarot',
    spread: ['Past', 'Present', 'Path'],
    cards: tarot.cards.map((c) => c.name.en),
    cardsZh: tarot.cards.map((c) => c.name.zh),
    cardsDetailed: tarot.cards,
    story: tarot.story,
    guidance: { en: `Past — ${tarot.cards[0].name.en}. Present — ${tarot.cards[1].name.en}. Near future — ${tarot.cards[2].name.en}. ${tarot.story.en}`, zh: `過去——${tarot.cards[0].name.zh}。現在——${tarot.cards[1].name.zh}。近期未來——${tarot.cards[2].name.zh}。${tarot.story.zh}` },
    sections: { overview: tarot.overview, career: tarot.career, relationships: tarot.relationships, health: tarot.health, timing: tarot.timing },
  };
  const portrait = buildPortrait({ bazi, horoscope, numerology, dom, weak, dayMaster: b.dayMaster }, personality);
  const synthesis = {
    en: `Across all six systems, one thread repeats: ${bazi.element} steadiness, ${a.sun.en} timing, and Life Path ${n.lp}. They do not agree on the details — they agree on the direction: start small, keep going, and let the result catch up. Where they agree: your Bazi chart leans ${dom}-heavy, your life-path ${n.lp} and your first tarot card all reward the same working style — accumulation and craft over luck or shortcuts. Where they tension: your Moon in ${a.moon.en} runs a fast emotional cycle, yet the chart is light on ${weak} — quick to process, slow to replenish.`,
    zh: `在六個系統中，一條線不斷重複：${bazi.element}的穩定、${a.sun.zh}的時機，以及生命靈數 ${n.lp}。它們在細節上並不一致，但在方向上一致：從小開始，持續前行，讓結果跟上來。一致之處：八字以${dom}最旺、生命靈數 ${n.lp}與塔羅第一張牌都獎勵同一種工作方式——累積與手藝，而非運氣或捷徑。張力之處：月亮在${a.moon.zh}令你情緒節奏較快，但八字缺${weak}——想得快、補給慢。`,
    agree: { en: `Your Bazi chart leans ${dom}-heavy, your life-path ${n.lp} and your first tarot card all reward the same working style: accumulation and craft over luck or shortcuts.`, zh: `八字五行以${dom}最旺、數字命理生命靈數 ${n.lp}、塔羅第一張牌，三者都指向同一種工作方式：靠累積與手藝，而非靠運氣或人脈捷徑。` },
    tension: { en: `Your Moon in ${a.moon.en} runs a fast emotional cycle, yet the chart is light on ${weak} — quick to process, slow to replenish. The full report turns this into a concrete 12-month pacing plan.`, zh: `月亮在${a.moon.zh}令你情緒節奏較快，但八字缺${weak}——想得快、補給慢。完整報告會把這點展開為具體的十二個月安排。` },
    full: { en: `Full synthesis: across the next twelve months, career and money windows peak in months 3–4 and again in month 9. On relationships, the Yi-Jing changing line and the third tarot card give the same instruction — boundaries before commitments. Health-wise, schedule deliberate slack in your ${weak}-light months. Your Zi Wei life-palace star and your Bazi useful god point, unusually, at the same conclusion: this is a year for consolidating, not expanding.`, zh: `完整綜合：未來十二個月，事業與財務的窗口在第 3–4 月及第 9 月最強；感情層面，易經變爻與塔羅第三張牌同時提示「先定界線，後談承諾」。健康上，缺${weak}的月份要主動留白。紫微命宮主星與八字用神罕有地指向同一結論：今年適合整固，而非擴張。` },
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
    zh: parts.map((x) => x.zh).join('') + '這是人格視角，來自你自己的問卷答案，不是出生計算。對照來看：你的人格模式解釋了你「如何回應」命盤所指的時機——當人格的慣性與命盤的建議同向，事情推進得快；相左之處，正是這份判讀最值得你留意的地方。',
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
    strengths.push({ text: { en: D.EL_PORTRAIT[dom].sEn, zh: D.EL_PORTRAIT[dom].sZh }, source: { en: `Bazi · strongest element ${dom}`, zh: `八字 · 最旺五行 ${dom}` } });
    lacking.push({ text: { en: D.EL_PORTRAIT[weak].gEn, zh: D.EL_PORTRAIT[weak].gZh }, source: { en: `Bazi · lightest element ${weak}`, zh: `八字 · 最弱五行 ${weak}` } });
    lacking.push({ text: { en: D.DM_PORTRAIT[dayMaster].gEn, zh: D.DM_PORTRAIT[dayMaster].gZh }, source: { en: 'Bazi · Day Master lesson', zh: '八字 · 日主課題' } });
    if (D.LP_PORTRAIT[numerology.lifePath]) lacking.push({ text: { en: D.LP_PORTRAIT[numerology.lifePath].gEn, zh: D.LP_PORTRAIT[numerology.lifePath].gZh }, source: { en: `Numerology · Life Path ${numerology.lifePath}`, zh: `數字命理 · 生命靈數 ${numerology.lifePath}` } });
  }
  if (ennea) {
    strengths.push({ text: { en: D.ENNEA_PORTRAIT[ennea.core].sEn, zh: D.ENNEA_PORTRAIT[ennea.core].sZh }, source: { en: `Enneagram ${ennea.core}w${ennea.wing}`, zh: `九型 ${ennea.core}w${ennea.wing}` } });
    lacking.push({ text: { en: D.ENNEA_PORTRAIT[ennea.core].gEn, zh: D.ENNEA_PORTRAIT[ennea.core].gZh }, source: { en: `Enneagram Type ${ennea.core}`, zh: `九型 ${ennea.core} 號` } });
  }
  if (mbti) {
    const ms = mbtiPart(mbti.type, 's'), mg = mbtiPart(mbti.type, 'g');
    if (ms.en) strengths.push({ text: ms, source: { en: `MBTI ${mbti.type}`, zh: `MBTI ${mbti.type}` } });
    if (mg.en) lacking.push({ text: mg, source: { en: `MBTI ${mbti.type}`, zh: `MBTI ${mbti.type}` } });
  }
  const practices = [];
  if (bazi) practices.push({ en: D.EL_PORTRAIT[weak].pEn, zh: D.EL_PORTRAIT[weak].pZh });
  if (ennea) practices.push({ en: `Take one small weekly rep against your Enneagram growth edge — ${D.ENNEA_PORTRAIT[ennea.core].gEn.charAt(0).toLowerCase()}${D.ENNEA_PORTRAIT[ennea.core].gEn.slice(1)} Each week, pick one real situation that triggers it, notice it arriving, then deliberately do the opposite in a small way once — and log the result in one line.`, zh: `針對九型所缺之處做一個每週小練習——${D.ENNEA_PORTRAIT[ennea.core].gZh}做法：每週選一個會觸發它的真實場合，先留意它出現，再刻意做一次相反的小行動，事後用一行字記下結果。` });
  if (mbti) {
    const opp = [['E', 'I'], ['S', 'N'], ['T', 'F'], ['J', 'P']].map(([a, b2]) => (mbti.dims[a] >= mbti.dims[b2] ? b2 : a));
    practices.push({ en: `Give your less-used side (${opp.join(', ')}) one small rep each week: in a situation where ${D.MBTI_LETTER[opp[0]].en}, do it deliberately, once, on purpose.`, zh: `每週給較少使用的一側（${opp.join('、')}）一次小練習：例如需要${D.MBTI_LETTER[opp[0]].zh}的場合，不要迴避，刻意做一次小的。` });
  }
  const essence = {
    en: `${bazi ? `${bazi.dayMaster.en} Day Master, ${horoscope.sun.en} Sun, Life Path ${numerology.lifePath}` : ''}${ennea ? ` · Enneagram ${ennea.core}w${ennea.wing} ${ennea.nameEn}` : ''}${mbti ? ` · MBTI ${mbti.type} ${mbti.nickEn}` : ''} — steady in your own direction, even when the route changes.`,
    zh: `${bazi ? `日主${bazi.dayMaster.zh}、太陽${horoscope.sun.zh}、生命靈數 ${numerology.lifePath}` : ''}${ennea ? ` · 九型 ${ennea.core}w${ennea.wing} ${ennea.nameZh}` : ''}${mbti ? ` · MBTI ${mbti.type} ${mbti.nickZh}` : ''}——即使路線改變，仍朝著自己的方向穩定前行。`,
  };
  return {
    essenceLine: essence,
    character: {
      en: `${D.DAYMASTER_TXT[dayMaster].en} Your Sun in ${horoscope.sun.en} centres your drive on ${D.SIGN_TRAITS.en[horoscope.sun.en]}; your Moon in ${horoscope.moon.en} sets an emotional rhythm governed by ${D.SIGN_TRAITS.en[horoscope.moon.en]}. Life Path ${numerology.lifePath}: ${D.LP.en[String(numerology.lifePath)]}${ennea ? ` Enneagram: ${D.ENNEA_TYPES[ennea.core].core.en}` : ''}${mbti ? ` MBTI: ${D.MBTI_TYPES[mbti.type].en}` : ''}`,
      zh: `${D.DAYMASTER_TXT[dayMaster].zh}你的太陽在${horoscope.sun.zh}，核心動力圍繞${D.SIGN_TRAITS.zh[horoscope.sun.en]}；月亮在${horoscope.moon.zh}，情緒節奏與充電方式由${D.SIGN_TRAITS.zh[horoscope.moon.en]}主導。生命靈數 ${numerology.lifePath}：${D.LP.zh[String(numerology.lifePath)]}${ennea ? ` 九型：${D.ENNEA_TYPES[ennea.core].core.zh}` : ''}${mbti ? ` MBTI：${D.MBTI_TYPES[mbti.type].zh}` : ''}`,
    },
    style: {
      think: { en: `${mbti ? `${D.MBTI_LETTER[mbti.dims.S >= mbti.dims.N ? 'S' : 'N'].en}; ${D.MBTI_LETTER[mbti.dims.T >= mbti.dims.F ? 'T' : 'F'].en}. ` : ''}${ennea ? `Underneath, the drive is to ${D.ENNEA_PORTRAIT[ennea.core].dEn} — decisions are rarely purely technical for you; they pass this filter first.` : `Your Day Master and strongest element (${dom}) set the tone: ${D.EL_TXT[dom].en} is your default mode.`}`, zh: `${mbti ? `${D.MBTI_LETTER[mbti.dims.S >= mbti.dims.N ? 'S' : 'N'].zh}；${D.MBTI_LETTER[mbti.dims.T >= mbti.dims.F ? 'T' : 'F'].zh}。` : ''}${ennea ? `底層動力是想要${D.ENNEA_PORTRAIT[ennea.core].dZh}——決定很少是純技術性的，它們要先過這一關。` : `你的日主與最旺五行（${dom}）定下思考基調：${D.EL_TXT[dom].zh}是你的預設模式。`}` },
      work: { en: `Your work energy runs ${dom}-led — ${D.EL_TXT[dom].en} is how you work without effort.${mbti ? ` ${D.MBTI_LETTER[mbti.dims.J >= mbti.dims.P ? 'J' : 'P'].en}.` : ''}${ennea ? ` At work your Enneagram pattern shows as: ${D.ENNEA_PORTRAIT[ennea.core].sEn.toLowerCase()}.` : ''}`, zh: `工作能量以${dom}為主——${D.EL_TXT[dom].zh}，是你不費力的工作方式。${mbti ? ` ${D.MBTI_LETTER[mbti.dims.J >= mbti.dims.P ? 'J' : 'P'].zh}。` : ''}${ennea ? ` 九型模式在工作上表現為：${D.ENNEA_PORTRAIT[ennea.core].sZh}。` : ''}` },
      connect: { en: `You open doors in a ${D.SIGN_TRAITS.en[horoscope.rising.en]} style (${horoscope.rising.en} Rising) and privately recharge through ${D.SIGN_TRAITS.en[horoscope.moon.en]} (${horoscope.moon.en} Moon).${mbti ? ` ${D.MBTI_LETTER[mbti.dims.E >= mbti.dims.I ? 'E' : 'I'].en}.` : ''}${ennea ? ` In relationships, your core drive — to ${D.ENNEA_PORTRAIT[ennea.core].dEn} — shapes how you give and how you withdraw.` : ''}`, zh: `你以${D.SIGN_TRAITS.zh[horoscope.rising.en]}的風格打開門（上升${horoscope.rising.zh}），私下靠${D.SIGN_TRAITS.zh[horoscope.moon.en]}充電（月亮${horoscope.moon.zh}）。${mbti ? ` ${D.MBTI_LETTER[mbti.dims.E >= mbti.dims.I ? 'E' : 'I'].zh}。` : ''}${ennea ? ` 在關係中，你的核心動力——想要${D.ENNEA_PORTRAIT[ennea.core].dZh}——決定了你付出與退縮的方式。` : ''}` },
    },
    strengths: strengths.slice(0, 5),
    lacking: lacking.slice(0, 5),
    growingEdge: { en: lacking[0] ? lacking[0].text.en : 'Notice where you rush to fix, and pause there first. The pause is part of the work.', zh: lacking[0] ? lacking[0].text.zh : '留意你急著修正的地方，先在那裡停一下。停頓也是工作的一部分。' },
    developmentFocus: practices,
    sources: {
      en: `Drawn only from: birth reading (Bazi · Astrology · Numerology)${ennea ? ' · Enneagram' : ''}${mbti ? ' · MBTI' : ''}. ${!ennea || !mbti ? 'Complete the personality tests to add their lens — nothing is guessed at.' : ''}`,
      zh: `只綜合已完成的來源：出生解讀（八字 · 占星 · 數字命理）${ennea ? ' · 九型人格' : ''}${mbti ? ' · MBTI' : ''}。${!ennea || !mbti ? '完成人格測試後，這裡會加入它獨有的視角——未完成的部分不會被猜測填補。' : ''}`,
    },
  };
}
function mbtiPart(type, part) {
  const ty = D.MBTI_TYPES[type]; if (!ty) return { en: '', zh: '' };
  const split = (txt, marker, endMarker) => { const a = txt.split(marker)[1]; if (!a) return ''; return endMarker ? a.split(endMarker)[0] : a; };
  return {
    en: part === 's' ? split(ty.en, 'Strengths:', '. Watch-out') : split(ty.en, 'Watch-out:', '.').replace(/\.$/, ''),
    zh: part === 's' ? split(ty.zh, '長處：', '。注意') : split(ty.zh, '注意：', '。'),
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
    },
    tarot: {
      firstCard: full.tarot.cards[0],
      // Card names + keywords only — the interpretation stays locked.
      cards: full.tarot.cardsDetailed.map((c) => ({
        name: c.name, emoji: c.emoji, keywords: c.keywords, reversed: c.reversed,
      })),
    },
    portrait: { essenceLine: full.portrait.essenceLine },
    lockedNote: {
      en: 'Full details for each system are unlocked after payment.',
      zh: '每個系統的完整內容需付款後解鎖。',
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
    lacking.push({ text: enneaLacking(enneagram), source: { en: `Enneagram Type ${enneagram.core}`, zh: `九型 ${enneagram.core} 號` } });
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

module.exports = { buildFullReading, buildTeaser, scoreEnneagram, scoreEnneagramFromChoices, scoreMbti, parseBirth, getPersonalityQuestions, buildPersonalitySummary, buildPortrait, lockedPersonalitySummary };
