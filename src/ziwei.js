'use strict';

const { astro } = require('iztro');

const PALACES = [
  { key: 'soul', name: { en: 'Life Palace', zh: '命宫' }, area: { en: 'identity, temperament and personal approach', zh: '性格、气质与个人行事方式' } },
  { key: 'siblings', name: { en: 'Siblings Palace', zh: '兄弟宫' }, area: { en: 'siblings, peers and close collaboration', zh: '手足、同辈与近距离合作' } },
  { key: 'spouse', name: { en: 'Spouse Palace', zh: '夫妻宫' }, area: { en: 'partnership and close relationships', zh: '伴侣关系与亲密关系' } },
  { key: 'children', name: { en: 'Children Palace', zh: '子女宫' }, area: { en: 'children, mentoring and what you nurture', zh: '子女、指导他人及你所培育的事物' } },
  { key: 'wealth', name: { en: 'Wealth Palace', zh: '财帛宫' }, area: { en: 'earning, resources and money habits', zh: '收入、资源与金钱习惯' } },
  { key: 'health', name: { en: 'Health Palace', zh: '疾厄宫' }, area: { en: 'energy, stress patterns and self-care', zh: '精力、压力模式与自我照顾' } },
  { key: 'surface', name: { en: 'Travel Palace', zh: '迁移宫' }, area: { en: 'change, travel and how you meet the wider world', zh: '变化、出行及你如何面对外部世界' } },
  { key: 'friends', name: { en: 'Friends Palace', zh: '仆役宫' }, area: { en: 'friends, networks and support', zh: '朋友、人脉与支持' } },
  { key: 'career', name: { en: 'Career Palace', zh: '官禄宫' }, area: { en: 'work, responsibility and public contribution', zh: '工作、责任与社会贡献' } },
  { key: 'property', name: { en: 'Property Palace', zh: '田宅宫' }, area: { en: 'home, stability and material foundations', zh: '家庭、稳定感与物质基础' } },
  { key: 'spirit', name: { en: 'Spirit Palace', zh: '福德宫' }, area: { en: 'inner life, rest and sources of meaning', zh: '内在生活、休息与意义来源' } },
  { key: 'parents', name: { en: 'Parents Palace', zh: '父母宫' }, area: { en: 'parents, elders and authority figures', zh: '父母、长辈与权威人物' } },
];

const BRANCH_PINYIN = { zi: 'Zi', chou: 'Chou', yin: 'Yin', mao: 'Mao', chen: 'Chen', si: 'Si', wu: 'Wu', woo: 'Wu', wei: 'Wei', shen: 'Shen', you: 'You', xu: 'Xu', hai: 'Hai' };
const STEM_PINYIN = { jia: 'Jia', yi: 'Yi', bing: 'Bing', ding: 'Ding', wu: 'Wu', ji: 'Ji', geng: 'Geng', xin: 'Xin', ren: 'Ren', gui: 'Gui' };
const MAIN_STAR_PINYIN = {
  emperor: 'Zi Wei', advisor: 'Tian Ji', sun: 'Tai Yang', warrior: 'Wu Qu', fortunate: 'Tian Tong',
  judge: 'Lian Zhen', empress: 'Tian Fu', moon: 'Tai Yin', wolf: 'Tan Lang', advocator: 'Ju Men',
  minister: 'Tian Xiang', sage: 'Tian Liang', marshal: 'Qi Sha', rebel: 'Po Jun',
};

function timeIndex(birthTime) {
  const match = String(birthTime || '').match(/^(\d{2}):(\d{2})$/);
  if (!match) throw new Error('Birth time is required to calculate the Zi Wei chart.');
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) throw new Error('Enter a valid birth time to calculate the Zi Wei chart.');
  if (hour === 23) return 12; // Late Zi hour.
  if (hour === 0) return 0;   // Early Zi hour.
  return Math.ceil(hour / 2);
}

function mapStars(enStars = [], zhStars = []) {
  return enStars.map((star, i) => {
    const zh = zhStars[i] || {};
    const canonical = MAIN_STAR_PINYIN[star.name] || star.name;
    return {
      en: canonical,
      zh: zh.name || star.name,
      type: star.type,
      scope: star.scope,
      brightness: { en: star.brightness || '', zh: zh.brightness || '' },
      mutagen: star.mutagen || null,
    };
  });
}

function sectionText(def, palace) {
  const hasMajorStars = palace.majorStars.length > 0;
  const majorEn = hasMajorStars ? palace.majorStars.map(s => s.en).join(' and ') : '';
  const majorZh = hasMajorStars ? palace.majorStars.map(s => s.zh).join('、') : '';
  const branchEn = palace.branch.en;
  const branchZh = palace.branch.zh;
  const areaEn = def.area.en;
  const areaZh = def.area.zh;
  return {
    en: `${def.name.en} is placed in the ${branchEn} branch and ${hasMajorStars ? `carries ${majorEn}` : 'has no major star'}. In Zi Wei Dou Shu, this palace is used to reflect on ${areaEn}. Read the specific star placement as a prompt to examine how this part of life works for you; it does not predict a guaranteed event.`,
    zh: `${def.name.zh}落在${branchZh}${hasMajorStars ? `，主星为${majorZh}` : '，没有主星入宫'}。紫微斗数以此宫观察${areaZh}。这项具体星曜位置可作为认识相关生活领域的参考，不代表某件事情必然发生。`,
  };
}

function buildZiweiChart({ birthDate, birthTime, ziweiGender }) {
  if (!birthDate) throw new Error('Birth date is required to calculate the Zi Wei chart.');
  if (!birthTime) throw new Error('Birth time is required to calculate the Zi Wei chart.');
  if (!['male', 'female'].includes(ziweiGender)) throw new Error('Choose a chart sex to calculate the Zi Wei chart.');
  const index = timeIndex(birthTime);
  const en = astro.bySolar(birthDate, index, ziweiGender, true, 'en-US');
  const zh = astro.bySolar(birthDate, index, ziweiGender, true, 'zh-CN');
  const palaces = PALACES.map((def) => {
    const e = en.palace(def.key);
    const z = zh.palace(def.key);
    if (!e || !z) throw new Error(`Could not calculate the Zi Wei ${def.name.en}.`);
    const majorStars = mapStars(e.majorStars, z.majorStars);
    const minorStars = mapStars(e.minorStars, z.minorStars);
    const adjectiveStars = mapStars(e.adjectiveStars, z.adjectiveStars);
    const palace = {
      key: def.key,
      en: def.name.en,
      zh: def.name.zh,
      branch: { en: BRANCH_PINYIN[e.earthlyBranch] || e.earthlyBranch, zh: z.earthlyBranch },
      heavenlyStem: { en: STEM_PINYIN[e.heavenlyStem] || e.heavenlyStem, zh: z.heavenlyStem },
      star: majorStars[0] || { en: 'No major star', zh: '无主星' },
      majorStars,
      minorStars,
      adjectiveStars,
      decadal: e.decadal ? { startAge: e.decadal.range[0], endAge: e.decadal.range[1], stem: { en: STEM_PINYIN[e.decadal.heavenlyStem] || e.decadal.heavenlyStem, zh: z.decadal?.heavenlyStem || '' }, branch: { en: BRANCH_PINYIN[e.decadal.earthlyBranch] || e.decadal.earthlyBranch, zh: z.decadal?.earthlyBranch || '' } } : null,
      ages: e.ages || [],
      isBodyPalace: !!e.isBodyPalace,
      text: sectionText(def, { branch: { en: BRANCH_PINYIN[e.earthlyBranch] || e.earthlyBranch, zh: z.earthlyBranch }, majorStars }),
    };
    return palace;
  });
  const life = palaces[0];
  const body = palaces.find(p => p.isBodyPalace) || null;
  const overview = sectionText(PALACES[0], life);
  const career = sectionText(PALACES.find(p => p.key === 'career'), palaces.find(p => p.key === 'career'));
  const wealth = sectionText(PALACES.find(p => p.key === 'wealth'), palaces.find(p => p.key === 'wealth'));
  const relationships = sectionText(PALACES.find(p => p.key === 'spouse'), palaces.find(p => p.key === 'spouse'));
  const health = sectionText(PALACES.find(p => p.key === 'health'), palaces.find(p => p.key === 'health'));
  const bodyText = body ? sectionText({ name: { en: 'Body Palace', zh: '身宫' }, area: { en: 'the area where actions and lived experience are emphasized', zh: '行动与现实体验较为集中的领域' } }, body) : overview;
  const enMainStars = life.majorStars.map(s => s.en).join(' and ') || 'No major star';
  const zhMainStars = life.majorStars.map(s => s.zh).join('、') || '无主星';
  return {
    system: 'Zi Wei Dou Shu',
    calculated: true,
    algorithm: 'iztro 2.6.5',
    birthDate,
    birthTime,
    ziweiGender,
    chartGender: { en: ziweiGender === 'female' ? 'Female' : 'Male', zh: ziweiGender === 'female' ? '女' : '男' },
    solarDate: en.solarDate,
    lunarDate: { en: en.lunarDate, zh: zh.lunarDate },
    chineseDate: { en: en.chineseDate, zh: zh.chineseDate },
    timeRange: { en: en.timeRange, zh: zh.timeRange },
    zodiac: { en: en.zodiac, zh: zh.zodiac },
    soul: { en: MAIN_STAR_PINYIN[en.soul] || en.soul, zh: zh.soul },
    body: { en: MAIN_STAR_PINYIN[en.body] || en.body, zh: zh.body },
    fiveElementsClass: { en: en.fiveElementsClass, zh: zh.fiveElementsClass },
    lifePalace: `${life.en} (${life.branch.en})`,
    lifePalaceZh: `${life.zh}（${life.branch.zh}）`,
    lifePalaceText: overview,
    mainStar: { en: enMainStars, zh: zhMainStars },
    palaces,
    guidance: {
      en: `Your Zi Wei chart is calculated from your birth date, birth time, and chart sex. Its Life Palace is in ${life.branch.en} with ${enMainStars}; the chart also locates all twelve palaces and their star placements.`,
      zh: `这份紫微命盘根据你的出生日期、出生时间及排盘性别计算。命宫落在${life.branch.zh}，主星为${zhMainStars}；以下列出十二宫及各宫星曜。`,
    },
    sections: {
      overview,
      strengths: overview,
      challenges: bodyText,
      career,
      wealth,
      relationships,
      health,
      timing: {
        en: `The age ranges shown in each palace are the chart's calculated ten-year cycles, based on the birth inputs above and the selected chart sex. The current cycle can be found by matching your age to a palace's range.`,
        zh: `各宫显示的年龄范围是根据以上出生资料及排盘性别计算的十年大限。将你的年龄与各宫范围对应，即可找到当前大限。`,
      },
    },
    note: 'Calculated chart from birth date, birth time and selected chart sex. Entered clock time is used without a true-solar-time location correction.',
    noteZh: '根据出生日期、出生时间与所选排盘性别计算。使用输入的钟表时间，未作真太阳时地点校正。',
    sample: false,
  };
}

module.exports = { buildZiweiChart, timeIndex };
