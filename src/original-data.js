'use strict';
/**
 * Original prototype tables — VERBATIM port from
 * ~/workspace/ts-spaces/fortune-telling-service/index.html (2 Nov 2026).
 * Extracted mechanically (see /tmp/extract.js); no values were edited.
 * Zi Wei palaces, Bazi pillars and Moon/Rising in the original are themselves
 * simplified / sample — the reading code marks those as such in the UI.
 */
module.exports = {
 "STEMS": [
  [
   "甲",
   "Jiǎ",
   "Wood",
   "wood"
  ],
  [
   "乙",
   "Yǐ",
   "Wood",
   "wood"
  ],
  [
   "丙",
   "Bǐng",
   "Fire",
   "fire"
  ],
  [
   "丁",
   "Dīng",
   "Fire",
   "fire"
  ],
  [
   "戊",
   "Wù",
   "Earth",
   "earth"
  ],
  [
   "己",
   "Jǐ",
   "Earth",
   "earth"
  ],
  [
   "庚",
   "Gēng",
   "Metal",
   "metal"
  ],
  [
   "辛",
   "Xīn",
   "Metal",
   "metal"
  ],
  [
   "壬",
   "Rén",
   "Water",
   "water"
  ],
  [
   "癸",
   "Guǐ",
   "Water",
   "water"
  ]
 ],
 "BRANCHES": [
  [
   "子",
   "Zǐ",
   "Rat",
   "water"
  ],
  [
   "丑",
   "Chǒu",
   "Ox",
   "earth"
  ],
  [
   "寅",
   "Yín",
   "Tiger",
   "wood"
  ],
  [
   "卯",
   "Mǎo",
   "Rabbit",
   "wood"
  ],
  [
   "辰",
   "Chén",
   "Dragon",
   "earth"
  ],
  [
   "巳",
   "Sì",
   "Snake",
   "fire"
  ],
  [
   "午",
   "Wǔ",
   "Horse",
   "fire"
  ],
  [
   "未",
   "Wèi",
   "Goat",
   "earth"
  ],
  [
   "申",
   "Shēn",
   "Monkey",
   "metal"
  ],
  [
   "酉",
   "Yǒu",
   "Rooster",
   "metal"
  ],
  [
   "戌",
   "Xū",
   "Dog",
   "earth"
  ],
  [
   "亥",
   "Hài",
   "Pig",
   "water"
  ]
 ],
 "ELNAME": {
  "wood": "Wood 木",
  "fire": "Fire 火",
  "earth": "Earth 土",
  "metal": "Metal 金",
  "water": "Water 水"
 },
 "ELCOL": {
  "wood": "#3e8e4f",
  "fire": "#b23a2a",
  "earth": "#a97b1e",
  "metal": "#9a958a",
  "water": "#3a6ea5"
 },
 "ZODIAC": [
  [
   "Rat",
   "鼠"
  ],
  [
   "Ox",
   "牛"
  ],
  [
   "Tiger",
   "虎"
  ],
  [
   "Rabbit",
   "兔"
  ],
  [
   "Dragon",
   "龙"
  ],
  [
   "Snake",
   "蛇"
  ],
  [
   "Horse",
   "马"
  ],
  [
   "Goat",
   "羊"
  ],
  [
   "Monkey",
   "猴"
  ],
  [
   "Rooster",
   "鸡"
  ],
  [
   "Dog",
   "狗"
  ],
  [
   "Pig",
   "猪"
  ]
 ],
 "SIGNS": [
  {
   "en": "Aries",
   "zh": "白羊座",
   "sym": "♈",
   "d": "Mar 21 – Apr 19"
  },
  {
   "en": "Taurus",
   "zh": "金牛座",
   "sym": "♉",
   "d": "Apr 20 – May 20"
  },
  {
   "en": "Gemini",
   "zh": "双子座",
   "sym": "♊",
   "d": "May 21 – Jun 20"
  },
  {
   "en": "Cancer",
   "zh": "巨蟹座",
   "sym": "♋",
   "d": "Jun 21 – Jul 22"
  },
  {
   "en": "Leo",
   "zh": "狮子座",
   "sym": "♌",
   "d": "Jul 23 – Aug 22"
  },
  {
   "en": "Virgo",
   "zh": "处女座",
   "sym": "♍",
   "d": "Aug 23 – Sep 22"
  },
  {
   "en": "Libra",
   "zh": "天秤座",
   "sym": "♎",
   "d": "Sep 23 – Oct 22"
  },
  {
   "en": "Scorpio",
   "zh": "天蝎座",
   "sym": "♏",
   "d": "Oct 23 – Nov 21"
  },
  {
   "en": "Sagittarius",
   "zh": "射手座",
   "sym": "♐",
   "d": "Nov 22 – Dec 21"
  },
  {
   "en": "Capricorn",
   "zh": "摩羯座",
   "sym": "♑",
   "d": "Dec 22 – Jan 19"
  },
  {
   "en": "Aquarius",
   "zh": "水瓶座",
   "sym": "♒",
   "d": "Jan 20 – Feb 18"
  },
  {
   "en": "Pisces",
   "zh": "双鱼座",
   "sym": "♓",
   "d": "Feb 19 – Mar 20"
  }
 ],
 "SIGN_TRAITS": {
  "en": {
   "Aries": "momentum and first moves",
   "Taurus": "steadiness and tangible results",
   "Gemini": "curiosity and conversation",
   "Cancer": "home, memory and protection",
   "Leo": "visibility and generous warmth",
   "Virgo": "craft, order and useful detail",
   "Libra": "partnership and balance",
   "Scorpio": "depth, privacy and transformation",
   "Sagittarius": "range, travel and big questions",
   "Capricorn": "structure and the long game",
   "Aquarius": "originality and the group mind",
   "Pisces": "intuition, dreams and compassion"
  },
  "zh": {
   "Aries": "冲劲与率先行动",
   "Taurus": "稳定与实在的成果",
   "Gemini": "好奇心与沟通",
   "Cancer": "家、记忆与守护",
   "Leo": "被看见与慷慨的温度",
   "Virgo": "手艺、秩序与实用的细节",
   "Libra": "伙伴关系与平衡",
   "Scorpio": "深度、私密与蜕变",
   "Sagittarius": "远方、旅行与大问题",
   "Capricorn": "结构与长线布局",
   "Aquarius": "原创性与群体思维",
   "Pisces": "直觉、梦境与慈悲"
  }
 },
 "TAROT": [
  [
   "0",
   "The Fool",
   "愚者",
   "🌅",
   "beginnings, leap of faith",
   "A door opens before the plan is finished. The risk worth taking is the honest one."
  ],
  [
   "I",
   "The Magician",
   "魔术师",
   "🪄",
   "skill, willpower, tools at hand",
   "Everything you need is already on the table — the work is focus, not acquisition."
  ],
  [
   "II",
   "The High Priestess",
   "女祭司",
   "🌙",
   "intuition, hidden knowledge",
   "Wait one beat longer than feels comfortable. What is unsaid is the real message."
  ],
  [
   "III",
   "The Empress",
   "皇后",
   "🌾",
   "abundance, nurture, making",
   "Growth comes from tending what exists, not chasing what is next."
  ],
  [
   "IV",
   "The Emperor",
   "皇帝",
   "🏛️",
   "structure, authority, boundaries",
   "Set the rule once, kindly and clearly, instead of negotiating it daily."
  ],
  [
   "V",
   "The Hierophant",
   "教皇",
   "🗝️",
   "tradition, teachers, belonging",
   "An older way of doing this exists for a reason. Learn it before you improve it."
  ],
  [
   "VI",
   "The Lovers",
   "恋人",
   "💞",
   "choice, union, values",
   "The real question is not who or what — it is which value you refuse to trade away."
  ],
  [
   "VII",
   "The Chariot",
   "战车",
   "🏇",
   "drive, direction, victory",
   "Two forces pull in different directions; hold the reins, do not pick a side."
  ],
  [
   "VIII",
   "Strength",
   "力量",
   "🦁",
   "patience, quiet courage",
   "Soft persistence outperforms force here. Stay in the room."
  ],
  [
   "IX",
   "The Hermit",
   "隐者",
   "🏮",
   "solitude, inner light",
   "Withdraw briefly on purpose. The answer is quieter than the noise around it."
  ],
  [
   "X",
   "Wheel of Fortune",
   "命运之轮",
   "🎡",
   "cycles, turning points",
   "The wheel is mid-turn. Do not sign long contracts with a temporary season."
  ],
  [
   "XI",
   "Justice",
   "正义",
   "⚖️",
   "truth, fairness, accounts",
   "Put the numbers in writing. Fairness you can point to ends the argument."
  ],
  [
   "XII",
   "The Hanged Man",
   "倒吊人",
   "🙃",
   "pause, new angle, surrender",
   "Deliberate stillness is a move. Look at the problem from underneath."
  ],
  [
   "XIII",
   "Death",
   "死神",
   "🦋",
   "endings, release, renewal",
   "Something is finished and pretending otherwise is the expensive option."
  ],
  [
   "XIV",
   "Temperance",
   "节制",
   "🏺",
   "blending, moderation, timing",
   "Mix the two things slowly. The middle path here is a skill, not a compromise."
  ],
  [
   "XV",
   "The Devil",
   "恶魔",
   "⛓️",
   "attachment, habit, appetite",
   "Name the habit honestly and it loses half its rent in your head."
  ],
  [
   "XVI",
   "The Tower",
   "高塔",
   "⚡",
   "sudden truth, clearing",
   "What falls was load-bearing in the wrong place. Let it fall in daylight."
  ],
  [
   "XVII",
   "The Star",
   "星星",
   "⭐",
   "hope, healing, guidance",
   "A longer, kinder timeline is available. Aim at the far light, walk daily."
  ],
  [
   "XVIII",
   "The Moon",
   "月亮",
   "🌕",
   "dreams, uncertainty, tides",
   "Not everything unclear is dangerous. Move by feel, verify by morning."
  ],
  [
   "XIX",
   "The Sun",
   "太阳",
   "☀️",
   "clarity, joy, plain success",
   "Say the simple true thing. Visibility helps you now, it does not hurt."
  ],
  [
   "XX",
   "Judgement",
   "审判",
   "📯",
   "calling, reckoning, rising",
   "An old chapter is asking to be answered properly, not revisited endlessly."
  ],
  [
   "XXI",
   "The World",
   "世界",
   "🌍",
   "completion, integration",
   "Close the loop deliberately — a finished thing frees more energy than a new start."
  ]
 ],
 // Simplified Chinese keywords + upright meanings for the 22 major arcana,
 // in the same order as TAROT above. The original table only carries
 // English keywords/meanings, so the Chinese page was showing English
 // here (language leakage, fixed 7 Nov 2026). Reversed meanings already
 // have zh in TAROT_REV.zh.
 "TAROT_ZH_KEYWORDS": [
  "开始，纵身一跃",
  "技术，意志力，手边的工具",
  "直觉，隐藏的知识",
  "丰盛，滋养，创造",
  "结构，权威，界线",
  "传统，老师，归属",
  "选择，结合，价值观",
  "驱动力，方向，胜利",
  "耐心，安静的勇气",
  "独处，内在的光",
  "循环，转折点",
  "真相，公平，算清账",
  "停顿，新角度，放手",
  "结束，放下，更新",
  "调和，适度，时机",
  "执念，习惯，欲望",
  "突然的真相，清理",
  "希望，疗愈，指引",
  "梦境，不确定，潮汐",
  "清晰，喜悦，实在的成功",
  "召唤，清算，崛起",
  "完成，整合"
 ],
 "TAROT_ZH_MEANING": [
  "门在计划完成之前就打开了。值得冒的险，是诚实的那一个。",
  "你需要的东西都已经在桌上了——要做的是专注，不是再去找。",
  "比觉得舒服的时候，再多等一拍。没说出口的，才是真正的信息。",
  "成长来自照料已有的东西，而不是追逐下一个。",
  "规则定一次就好，温和而清楚，不要每天重新谈判。",
  "做这件事的老方法存在是有原因的。先学会它，再去改进。",
  "真正的问题不是选谁或选什么——而是你绝不拿去交换的价值观。",
  "两股力量往不同方向拉；握紧缰绳，不要急着选边。",
  "在这里，温和的坚持胜过用力。留在房间里。",
  "有目的地短暂独处一会儿。答案比周围的噪音更安静。",
  "轮子正在转动。不要和一个暂时的季节签长期合约。",
  "把数字写下来。能指得出来的公平，才能结束争论。",
  "有意的静止也是一种行动。从下面看看这个问题。",
  "有件事已经结束了，假装没有结束才是更贵的选择。",
  "把两样东西慢慢调和。在这里，走中间的路是一种本事，不是妥协。",
  "诚实地说出那个习惯的名字，它在你脑子里占的位置就少了一半。",
  "倒下的东西，本来就不该承重。让它在白天倒下。",
  "有一条更长、更温和的时间线。望着远处的光，每天走一步。",
  "不是所有不清楚的东西都有危险。凭感觉走，早上再核实。",
  "把简单真实的话说出来。现在被看见对你有帮助，没有坏处。",
  "一个旧章节需要被好好回应，而不是无休止地重温。",
  "有意识地把环扣上——完成一件事，比开始新事更能释放能量。"
 ],
 "TRI": [
  [
   "Earth",
   "地",
   0
  ],
  [
   "Mountain",
   "山",
   1
  ],
  [
   "Water",
   "水",
   2
  ],
  [
   "Wind",
   "风",
   3
  ],
  [
   "Thunder",
   "雷",
   4
  ],
  [
   "Fire",
   "火",
   5
  ],
  [
   "Lake",
   "泽",
   6
  ],
  [
   "Heaven",
   "天",
   7
  ]
 ],
 "TRI_BY_BITS": {
  "0": 0,
  "1": 4,
  "2": 2,
  "3": 6,
  "4": 1,
  "5": 5,
  "6": 3,
  "7": 7
 },
 "HEX": [
  [
   [
    2,
    "The Receptive",
    "坤为地"
   ],
   [
    15,
    "Modesty",
    "地山谦"
   ],
   [
    8,
    "Holding Together",
    "水地比"
   ],
   [
    20,
    "Contemplation",
    "风地观"
   ],
   [
    16,
    "Enthusiasm",
    "雷地豫"
   ],
   [
    35,
    "Progress",
    "火地晋"
   ],
   [
    45,
    "Gathering Together",
    "泽地萃"
   ],
   [
    11,
    "Peace",
    "地天泰"
   ]
  ],
  [
   [
    23,
    "Splitting Apart",
    "山地剥"
   ],
   [
    52,
    "Keeping Still",
    "艮为山"
   ],
   [
    4,
    "Youthful Folly",
    "山水蒙"
   ],
   [
    18,
    "Work on the Decayed",
    "山风蛊"
   ],
   [
    27,
    "Nourishment",
    "山雷颐"
   ],
   [
    22,
    "Grace",
    "山火贲"
   ],
   [
    41,
    "Decrease",
    "山泽损"
   ],
   [
    26,
    "Great Taming",
    "山天大畜"
   ]
  ],
  [
   [
    7,
    "The Army",
    "地水师"
   ],
   [
    39,
    "Obstruction",
    "水山蹇"
   ],
   [
    29,
    "The Abysmal",
    "坎为水"
   ],
   [
    59,
    "Dispersion",
    "风水涣"
   ],
   [
    3,
    "Difficulty at the Beginning",
    "水雷屯"
   ],
   [
    64,
    "Before Completion",
    "火水未济"
   ],
   [
    47,
    "Oppression",
    "泽水困"
   ],
   [
    5,
    "Waiting",
    "水天需"
   ]
  ],
  [
   [
    46,
    "Pushing Upward",
    "地风升"
   ],
   [
    53,
    "Gradual Progress",
    "风山渐"
   ],
   [
    48,
    "The Well",
    "水风井"
   ],
   [
    57,
    "The Gentle",
    "巽为风"
   ],
   [
    42,
    "Increase",
    "风雷益"
   ],
   [
    50,
    "The Cauldron",
    "火风鼎"
   ],
   [
    28,
    "Great Excess",
    "泽风大过"
   ],
   [
    9,
    "Small Taming",
    "风天小畜"
   ]
  ],
  [
   [
    24,
    "Return",
    "地雷复"
   ],
   [
    62,
    "Small Excess",
    "雷山小过"
   ],
   [
    40,
    "Deliverance",
    "雷水解"
   ],
   [
    32,
    "Duration",
    "雷风恒"
   ],
   [
    51,
    "The Arousing",
    "震为雷"
   ],
   [
    55,
    "Abundance",
    "雷火丰"
   ],
   [
    54,
    "The Marrying Maiden",
    "雷泽归妹"
   ],
   [
    34,
    "Great Power",
    "雷天大壮"
   ]
  ],
  [
   [
    36,
    "Darkening of the Light",
    "地火明夷"
   ],
   [
    56,
    "The Wanderer",
    "火山旅"
   ],
   [
    63,
    "After Completion",
    "水火既济"
   ],
   [
    37,
    "The Family",
    "风火家人"
   ],
   [
    21,
    "Biting Through",
    "火雷噬嗑"
   ],
   [
    30,
    "The Clinging",
    "离为火"
   ],
   [
    38,
    "Opposition",
    "火泽睽"
   ],
   [
    14,
    "Great Possession",
    "火天大有"
   ]
  ],
  [
   [
    19,
    "Approach",
    "地泽临"
   ],
   [
    31,
    "Influence",
    "泽山咸"
   ],
   [
    60,
    "Limitation",
    "水泽节"
   ],
   [
    61,
    "Inner Truth",
    "风泽中孚"
   ],
   [
    17,
    "Following",
    "泽雷随"
   ],
   [
    49,
    "Revolution",
    "泽火革"
   ],
   [
    58,
    "The Joyous",
    "兑为泽"
   ],
   [
    43,
    "Breakthrough",
    "泽天夬"
   ]
  ],
  [
   [
    12,
    "Standstill",
    "天地否"
   ],
   [
    33,
    "Retreat",
    "天山遯"
   ],
   [
    6,
    "Conflict",
    "天水讼"
   ],
   [
    44,
    "Coming to Meet",
    "天风姤"
   ],
   [
    25,
    "Innocence",
    "天雷无妄"
   ],
   [
    13,
    "Fellowship",
    "天火同人"
   ],
   [
    10,
    "Treading",
    "天泽履"
   ],
   [
    1,
    "The Creative",
    "干为天"
   ]
  ]
 ],
 "HEX_GLYPH_BASE": 19894,
 "HEX_THEME": {
  "en": {
   "1": "Pure initiative — begin, but pace the force.",
   "2": "Yield and support — strength through receptivity.",
   "3": "A sprout in hard ground — order forms slowly; accept help.",
   "4": "Honest ignorance — ask, listen, and do not pretend to know.",
   "5": "Nourished waiting — prepare while the rain gathers.",
   "6": "A dispute sharpens — compromise beats total victory.",
   "7": "Organised effort — discipline and a clear chain of responsibility.",
   "8": "Alliance — join, or gather, the right people early.",
   "9": "Small restraints, gentle accumulation — polish the small things.",
   "10": "Careful steps near power — courtesy keeps you safe.",
   "11": "Heaven and earth in communion — the window is open; move with the flow.",
   "12": "Blockage — conserve your strength and do not force things.",
   "13": "Open fellowship — shared purpose, in the open, not in secret.",
   "14": "Abundance held humbly — resources are plentiful; stay modest.",
   "15": "The mountain under the earth — understate, and endure.",
   "16": "Thunder over the earth — set the rhythm and people move with it.",
   "17": "Adapt to the season — follow the right lead at the right time.",
   "18": "Repair what has spoiled — face the old problem directly.",
   "19": "Something good draws near — oversee its growth with kindness.",
   "20": "Step back and take in the whole field before acting.",
   "21": "An obstruction to bite through — decide, and enforce clearly.",
   "22": "Form and presentation matter — but never mistake them for substance.",
   "23": "Erosion from below — do not build on what is collapsing.",
   "24": "The turning point — a small light returns; go back to the source.",
   "25": "Act without ulterior motive — the honest, unplanned move works.",
   "26": "Power restrained and accumulating — hold back now, release later.",
   "27": "Watch what you feed — body, mind, and company.",
   "28": "The beam sags under weight — redistribute the load, or move on.",
   "29": "Deep water, twice over — stay sincere and keep moving through the risk.",
   "30": "Clarity like fire — lean on what gives light, and shine steadily.",
   "31": "Attraction and influence — openness is what moves the other side.",
   "32": "Endurance — a long pattern renewed daily, not a sprint.",
   "33": "Strategic retreat — step back before you are pushed.",
   "34": "Strength at its peak — power must stay inside what is right.",
   "35": "The sun rises over the earth — advance in daylight; be seen.",
   "36": "Brightness under pressure — protect the inner light; keep a low profile.",
   "37": "Order inside the household first — roles at home before roles outside.",
   "38": "Productive disagreement — find the small common point.",
   "39": "A mountain blocks the path — turn, take another route, and get help.",
   "40": "The knot loosens — release, forgive, and finish it cleanly.",
   "41": "Trim the excess — sincere simplicity now funds increase later.",
   "42": "Wind and thunder amplify each other — ride the updraft, and let others benefit too.",
   "43": "Speak the truth openly — resolve it in daylight, without malice.",
   "44": "A strong encounter arrives uninvited — do not let it take root unchecked.",
   "45": "Gather the group around a centre — and stay ready for the unexpected.",
   "46": "Step-by-step ascent — small efforts, stacked, reach high.",
   "47": "The lake is empty — words will not carry; let deeds and endurance speak.",
   "48": "The well everyone draws from — maintain the source; it does not move with fashion.",
   "49": "The season has turned — change the order openly, when the time is truly ripe.",
   "50": "The cauldron — how you hold a thing changes what it becomes.",
   "51": "Thunder and shock — when the jolt comes, keep your composure and do not drop what is sacred.",
   "52": "The mountain rests — stillness, on time, is also an action.",
   "53": "The tree grows on the mountain — slow, rooted, in the right order.",
   "54": "Entering without the lead role — accept the position honestly, or decline it.",
   "55": "Fullness at noon — plenty peaks; enjoy it without trying to freeze it.",
   "56": "A stranger on the road — travel light, tread carefully, do not settle yet.",
   "57": "Wind over wind — penetrate softly and persistently, like water and time.",
   "58": "Open lakes — shared joy and honest talk lighten the work.",
   "59": "Ice melts and walls dissolve — gather people again around something shared.",
   "60": "Healthy boundaries — limits that protect the flow, not choke it.",
   "61": "Inner truth — sincerity that reaches even unlikely hearts.",
   "62": "Small matters deserve extra care — stay low and precise; no grand gestures.",
   "63": "Everything in place — the moment right after success needs the most care.",
   "64": "Nearly across the river — the last steps decide it; do not rush the ending."
  },
  "zh": {
   "1": "纯粹的进取——开始，但要控制力度。",
   "2": "承载与配合——以柔韧成事。",
   "3": "萌芽遇阻——秩序慢慢成形，宜借助外力。",
   "4": "诚实的无知——请教、聆听，不装懂。",
   "5": "有养分的等待——雨未至，先准备。",
   "6": "争端升温——和解胜于全胜。",
   "7": "有组织的行动——纪律与清晰的分工。",
   "8": "结盟——及早找到对的人靠拢。",
   "9": "小处的节制与累积——把小事打磨好。",
   "10": "在虎尾边行走——礼貌与谨慎保平安。",
   "11": "天地交泰——窗口大开，顺势而行。",
   "12": "闭塞——收敛保存，不要硬推。",
   "13": "公开的同盟——以共同目标聚人。",
   "14": "丰盛而谦——资源充足，更要谦逊。",
   "15": "山在地中——低调而长久。",
   "16": "雷出地上——定下节奏，人自然跟上。",
   "17": "顺势——在对的时候跟对的方向。",
   "18": "整治腐坏——直接面对老问题。",
   "19": "好事临近——以仁厚监临其成长。",
   "20": "退后看全局——先看清，再行动。",
   "21": "咬断阻碍——果断决定，清楚执行。",
   "22": "文饰——形式重要，但别把包装当内容。",
   "23": "由下而上的侵蚀——别在崩塌处建设。",
   "24": "转折点——微光回来，回到源头。",
   "25": "无心之行——诚实、不盘算的行动反而有效。",
   "26": "蓄势——现在收住，日后释放。",
   "27": "看你喂养什么——身体、心智与圈子。",
   "28": "梁木受压——重新分配重量，或离开。",
   "29": "重险——保持诚信，在风险中前行。",
   "30": "如火之明——依附光源，稳定发亮。",
   "31": "感应——以开放打动对方。",
   "32": "长久之道——靠每日更新，而非冲刺。",
   "33": "策略性退后——在被推之前先退。",
   "34": "力量顶峰——力量必须守在正道之内。",
   "35": "日出地上——在光天化日下晋升、被看见。",
   "36": "明受其伤——保护内在的光，低调行事。",
   "37": "家内有序——先整顿内部角色。",
   "38": "火泽相违——有建设性的分歧，找小的共同点。",
   "39": "前有大山——绕路，并寻求帮助。",
   "40": "结松开了——放下、宽恕、干净收尾。",
   "41": "减损——真诚的简朴，为日后的增益储蓄。",
   "42": "风雷相益——乘上升之势，也让别人受惠。",
   "43": "公开决断——在日光下解决，不带恶意。",
   "44": "不期而遇的强势相遇——别让它无声无息地生根。",
   "45": "聚众于中心——团结中也要防意外。",
   "46": "拾级而上——小努力叠加，也能登高。",
   "47": "泽中无水——言语无力，以行动与耐力说话。",
   "48": "众人汲取的源头——维护它，它不随潮流搬迁。",
   "49": "时节已转——时机真正成熟时，公开地改变秩序。",
   "50": "以礼养物——你承载事物的方式，改变事物的本质。",
   "51": "雷震——惊扰到来时保持镇定，不失手中之重。",
   "52": "适时的静止——止，也是行动。",
   "53": "山上有木——缓慢、扎根、按次序成长。",
   "54": "以非主位入局——诚实接受位置，否则婉拒。",
   "55": "日中之盛——丰盛到顶，享受而不试图冻结它。",
   "56": "异乡之旅——轻装、谨慎，暂不落户。",
   "57": "风行——以柔和而持续的方式渗透。",
   "58": "泽相悦——共享的喜悦与坦诚减轻负担。",
   "59": "冰消墙解——以共同之物重新聚人。",
   "60": "健康的界线——保护流动，而非扼杀它。",
   "61": "内在诚信——真诚能抵达意想不到的心。",
   "62": "小事过用心——低调精准，不作大姿态。",
   "63": "事已成——成功之后的一刻，最需要谨慎。",
   "64": "临渡未渡——最后几步定成败，别赶结尾。"
  }
 },
 "FOCUS_LABEL": {
  "career": {
   "en": "Career & work",
   "zh": "事业与工作"
  },
  "love": {
   "en": "Love & relationships",
   "zh": "感情与关系"
  },
  "wealth": {
   "en": "Money & wealth",
   "zh": "财富与金钱"
  },
  "health": {
   "en": "Health & energy",
   "zh": "健康与精力"
  },
  "general": {
   "en": "General direction",
   "zh": "整体方向"
  }
 },
 "LP": {
  "en": {
   "1": "The Leader — independence, initiative, self-reliance. You learn by starting.",
   "2": "The Diplomat — partnership, patience, sensitivity. You learn by listening.",
   "3": "The Creator — expression, optimism, words. You learn by making and sharing.",
   "4": "The Builder — order, endurance, craft. You learn by finishing.",
   "5": "The Traveller — freedom, change, experience. You learn by moving.",
   "6": "The Guardian — responsibility, care, home. You learn by tending.",
   "7": "The Seeker — analysis, depth, solitude. You learn by questioning.",
   "8": "The Executive — power, resources, results. You learn by mastering the material world.",
   "9": "The Humanitarian — compassion, release, the big picture. You learn by letting go.",
   "11": "Master 11 — The Illuminator: heightened intuition; the 2's sensitivity with a louder signal.",
   "22": "Master 22 — The Master Builder: the 4's craft at visionary scale.",
   "33": "Master 33 — The Master Teacher: the 6's care turned toward many, not one."
  },
  "zh": {
   "1": "领袖型——独立、主动、自力更生。你在「开始」中学习。",
   "2": "外交型——伙伴、耐心、敏感。你在「聆听」中学习。",
   "3": "创造型——表达、乐观、文字。你在「创作与分享」中学习。",
   "4": "建造型——秩序、耐力、手艺。你在「完成」中学习。",
   "5": "旅人型——自由、变化、体验。你在「移动」中学习。",
   "6": "守护型——责任、照顾、家。你在「照料」中学习。",
   "7": "探索型——分析、深度、独处。你在「提问」中学习。",
   "8": "掌舵型——力量、资源、成果。你在「驾驭现实世界」中学习。",
   "9": "博爱型——慈悲、放下、大局。你在「放手」中学习。",
   "11": "大师数 11——照亮者：直觉敏锐，是 2 号的敏感加上更强的讯号。",
   "22": "大师数 22——大师建造者：以远见的规模实践 4 号的手艺。",
   "33": "大师数 33——大师教师：把 6 号的照顾，扩展到许多人。"
  }
 },
 "TAROT_REV": {
  "en": [
   "Reversed: hesitation before the leap — check the practical risk you have been waving away, then jump smaller.",
   "Reversed: scattered tools and half-started efforts — finish one thing before invoking the next.",
   "Reversed: something is being withheld, by you or to you — do not sign until it surfaces.",
   "Reversed: over-tending or creative block — rest and boundaries are the fertiliser here.",
   "Reversed: rigidity or a power struggle — loosen the rule that is causing the friction.",
   "Reversed: questioning a belief you inherited — study widely before you rebel or conform.",
   "Reversed: a values mismatch or a delayed choice — name what you will not trade, then decide.",
   "Reversed: loss of direction or competing pulls — stop, re-aim, then move.",
   "Reversed: impatience or quiet self-doubt — the gentle approach needs more time, not more force.",
   "Reversed: avoidance of solitude — the inner answer is being drowned out by company and noise.",
   "Reversed: resisting a turn that has already happened — work with the new season, not the old one.",
   "Reversed: an account left unsettled — correct the imbalance, even if the conversation is awkward.",
   "Reversed: restlessness in the pause — the new angle has not landed yet; stay still a little longer.",
   "Reversed: clinging to what has ended — the release is delayed, not cancelled.",
   "Reversed: imbalance or stop-start rhythm — adjust the mixture gradually instead of swinging extremes.",
   "Reversed: beginning to see the chain clearly — the habit loosens once it is named out loud.",
   "Reversed: a collapse narrowly avoided, or debris still to clear — inspect what the shock revealed.",
   "Reversed: dimmed hope or slow healing — the light is real but distant; keep the daily walk.",
   "Reversed: anxiety, vivid dreams, half-truths — wait for daylight before judging what you fear.",
   "Reversed: muted joy or success downplayed — let yourself be seen; do not shrink the good news.",
   "Reversed: an old call ignored — the reckoning returns until it is answered honestly.",
   "Reversed: a loop left almost closed — one unfinished detail is holding the completion."
  ],
  "zh": [
   "逆位：跃进前的迟疑——先正视你一直挥手略过的实际风险，再小步跳。",
   "逆位：工具散乱、样样半途——先完成一件事，再召唤下一件。",
   "逆位：有事被隐瞒，对你或由你——在它浮面之前不要签署。",
   "逆位：过度照料或创作阻塞——休息与界线，才是这里的肥料。",
   "逆位：僵化或权力拉锯——松开那条正在制造摩擦的规则。",
   "逆位：质疑一条继承而来的信念——反叛或顺从之前，先广泛研读。",
   "逆位：价值错位或抉择拖延——先说清你绝不交换的东西，再决定。",
   "逆位：失去方向或两股力量相争——停下，重新瞄准，再出发。",
   "逆位：不耐烦或暗自怀疑——温柔的方法需要更多时间，不是更大力气。",
   "逆位：逃避独处——内在的答案正被人群与噪音淹没。",
   "逆位：抗拒已经发生的转变——配合新的季节，而不是旧的。",
   "逆位：一笔未清的帐——即使对话尴尬，也要把失衡纠正过来。",
   "逆位：在停顿中焦躁——新的角度尚未落定，再静一会儿。",
   "逆位：抓紧已结束之物——放手只是延迟，不是取消。",
   "逆位：失衡或时行时止的节奏——慢慢调配比例，不要在极端之间摆荡。",
   "逆位：开始看清那条锁链——习惯一旦被说出口，就会松动。",
   "逆位：险险避过崩塌，或残局未清——检查这次震荡揭示了什么。",
   "逆位：希望变暗或复原缓慢——光是真的，只是还远；保持每日的步伐。",
   "逆位：焦虑、梦境鲜明、半真半假——等天光再判断你所恐惧的。",
   "逆位：喜悦被压低或成功被淡化——让自己被看见，不要缩小好消息。",
   "逆位：一个旧召唤被忽视——清算会一直回来，直到你诚实回应。",
   "逆位：圈子差一点才闭合——一个未完成的小节，正卡住整件事的完成。"
  ]
 },
 "TAROT_POS": {
  "en": [
   "In the Past position, this card names the root: the pattern, event or habit that set your question in motion. Read it as cause, not blame.",
   "In the Present position, this card is the live energy around you right now — the force to work with this week, not someday.",
   "In the Path position, this card shows the direction events lean if nothing changes — an invitation to steer, not a fixed fate."
  ],
  "zh": [
   "在「过去」位置，这张牌指出根源：令你的问题启动的那个模式、事件或习惯。把它读作因由，而非责怪。",
   "在「现在」位置，这张牌是你此刻身边正在运作的能量——是这一周就要配合的力量，不是某一天。",
   "在「路径」位置，这张牌显示若一切不变，事情倾向走向的方向——是邀请你掌舵，不是既定的命运。"
  ]
 },
 "DAYMASTER_TXT": [
  {
   "en": "Yang Wood (甲) grows like a tree: upright, principled and always reaching upward. You do best with a clear direction and room to grow, and worst when forced into constant bending. Your lesson is flexibility — a tree that cannot sway snaps in the storm.",
   "zh": "甲木如大树：正直、有原则、永远向上生长。有清晰方向与成长空间时你表现最好，被迫不断弯腰时最差。你的课题是柔韧——不能摇摆的树，会在风暴中折断。"
  },
  {
   "en": "Yin Wood (乙) is the vine and the flower stem: adaptable, diplomatic and quietly persistent. You win by winding around obstacles rather than charging them. Your lesson is to hold a core direction while you bend, so flexibility does not become drift.",
   "zh": "乙木如藤蔓与花茎：灵活、外交手腕好、安静地坚持。你以绕过障碍取胜，而非硬冲。你的课题是弯曲时仍守住核心方向，令灵活不变成漂流。"
  },
  {
   "en": "Yang Fire (丙) is the sun: warm, visible and generous with energy for everyone in range. You lead by presence and optimism. Your lesson is pacing — the sun that tries to shine all night burns out and lights nothing.",
   "zh": "丙火如太阳：温暖、显眼、慷慨地把能量给予范围内的每个人。你以存在感与乐观带领别人。你的课题是节奏——想整夜发光的太阳，只会耗尽自己、照亮不了什么。"
  },
  {
   "en": "Yin Fire (丁) is the candle flame: focused, refined and quietly illuminating. You notice what others miss and give steady, personal warmth. Your lesson is protection — small flames need shelter from other people's weather, and fuel of your own.",
   "zh": "丁火如烛光：专注、细腻、安静地照亮。你留意到别人错过的东西，给予稳定而亲近的温暖。你的课题是保护——小火焰需要遮挡别人的风雨，也需要自己的燃料。"
  },
  {
   "en": "Yang Earth (戊) is the mountain: dependable, immovable and trusted by everyone. People build plans on your steadiness. Your lesson is movement — a mountain that never shifts becomes a roadblock, so schedule change before life imposes it.",
   "zh": "戊土如高山：可靠、不动摇、人人信赖。别人把计划建在你的稳定之上。你的课题是移动——从不移动的山会变成路障，所以要在生活强加改变之前，先为自己安排变化。"
  },
  {
   "en": "Yin Earth (己) is the garden soil: nurturing, practical and quietly productive. You make other people's growth possible and keep many small things alive. Your lesson is boundaries — a garden that feeds everyone and is never fed itself turns barren.",
   "zh": "己土如园土：滋养、务实、安静地生产。你成就别人的成长，养活许多小事。你的课题是界线——只喂养别人、从不被喂养的花园，终会贫瘠。"
  },
  {
   "en": "Yang Metal (庚) is the sword and the ore: decisive, direct and built for hard tasks. You cut through delay and say what others avoid. Your lesson is tempering — a blade used for everything dulls; choose which fights deserve your edge.",
   "zh": "庚金如刀剑与矿石：果断、直接、为艰难任务而生。你斩断拖延，说出别人回避的话。你的课题是淬炼——什么都砍的刀会变钝；要挑选哪些仗值得你的锋芒。"
  },
  {
   "en": "Yin Metal (辛) is the jewel: precise, discerning and quietly proud of quality. You refine, polish and notice flaws early. Your lesson is softness — a jewel does not need to prove hardness daily, and criticism lands better when it is rare.",
   "zh": "辛金如珠宝：精准、有鉴别力、安静地以质素自豪。你提炼、打磨、及早察觉瑕疵。你的课题是柔和——珠宝不必每天证明硬度，而批评愈少出现，愈有份量。"
  },
  {
   "en": "Yang Water (壬) is the river and the sea: resourceful, far-seeing and hard to contain. You think in systems and routes, and find a way around most walls. Your lesson is banks — a river without edges floods; give your breadth one channel at a time.",
   "zh": "壬水如江海：足智多谋、目光远大、难以围堵。你以系统与路线思考，绕得过大多数墙。你的课题是河岸——没有边的水会泛滥；让你的广度一次只走一条河道。"
  },
  {
   "en": "Yin Water (癸) is rain and dew: perceptive, patient and quietly transformative. You change things drop by drop and sense shifts before they are spoken. Your lesson is accumulation — do not underestimate your method; steady rain is what fills reservoirs.",
   "zh": "癸水如雨露：敏锐、耐性、安静地带来改变。你一滴一滴改变事情，在言语之前已感知变化。你的课题是累积——不要低估自己的方法；水库就是靠持续的雨水注满的。"
  }
 ],
 "EL_TXT": {
  "wood": {
   "en": "Wood is growth, planning and new starts",
   "zh": "木主生长、规划与新开始"
  },
  "fire": {
   "en": "Fire is visibility, warmth and momentum",
   "zh": "火主被看见、温度与冲劲"
  },
  "earth": {
   "en": "Earth is stability, care and follow-through",
   "zh": "土主稳定、照顾与完成"
  },
  "metal": {
   "en": "Metal is precision, boundaries and standards",
   "zh": "金主精准、界线与标准"
  },
  "water": {
   "en": "Water is reflection, adaptability and recovery",
   "zh": "水主反思、适应与恢复"
  }
 },
 "PY_TXT": {
  "en": {
   "1": "a Personal Year 1 — new beginnings. Plant deliberately; what starts now runs a nine-year cycle.",
   "2": "a Personal Year 2 — patience and partnership. Tend relationships; do not force outcomes.",
   "3": "a Personal Year 3 — expression and social energy. Speak, publish, gather people.",
   "4": "a Personal Year 4 — building and order. Fix foundations, systems and health routines.",
   "5": "a Personal Year 5 — change and movement. Expect the plan to be revised; travel light.",
   "6": "a Personal Year 6 — responsibility and home. Commitments deepen; choose them consciously.",
   "7": "a Personal Year 7 — reflection and study. A quieter, inward year; research before signing.",
   "8": "a Personal Year 8 — power and money. Negotiate, charge properly, claim results.",
   "9": "a Personal Year 9 — completion and release. Finish, forgive and clear space for the next cycle."
  },
  "zh": {
   "1": "个人年 1——新开始。用心播种；现在开始的事，会走一个九年周期。",
   "2": "个人年 2——耐性与伙伴关系。经营关系，不要强求结果。",
   "3": "个人年 3——表达与社交能量。开口说、发表、聚人。",
   "4": "个人年 4——建设与秩序。修好根基、系统与健康习惯。",
   "5": "个人年 5——改变与移动。预期计划会被改写；轻装上路。",
   "6": "个人年 6——责任与家。承诺加深；要有意识地选择它们。",
   "7": "个人年 7——反思与研习。较安静、向内的一年；签约前先研究。",
   "8": "个人年 8——力量与金钱。谈判、合理收费、认领成果。",
   "9": "个人年 9——完成与放下。收尾、宽恕、清空空间迎接下一个周期。"
  }
 },
 "LINE_POS": {
  "en": [
   "Line 1 (the foundation): the matter is just beginning — how you enter it sets everything. Changing here means the root itself is shifting.",
   "Line 2 (the inner field): your conduct inside the situation — stay centred and correct; changing here moves your own behaviour first.",
   "Line 3 (the threshold): the risky crossing between inner and outer — caution; changing here warns of friction if you push.",
   "Line 4 (entering the outer field): you approach people with influence — be receptive; changing here repositions you among them.",
   "Line 5 (the ruling line): the heart of the matter, where decisions land — changing here moves the whole outcome.",
   "Line 6 (the top line): the matter is complete or overextended — changing here means excess turns into its opposite; know when to stop."
  ],
  "zh": [
   "初爻（根基）：事情刚开始——你如何入局，决定一切。此爻变，代表根基本身在移动。",
   "二爻（内卦中位）：你在局内的行止——守中正；此爻变，先动的是你自己的做法。",
   "三爻（门槛）：内外之间的危险交界——宜谨慎；此爻变，警告硬推会有摩擦。",
   "四爻（入外场）：你开始接近有影响力的人——宜开放承接；此爻变，你在他们之间的位置会改。",
   "五爻（君位）：事情的核心、决策落点——此爻变，整个结果都会动。",
   "上爻（顶点）：事情已完成或过度——此爻变，代表过极而反；要懂得停。"
  ]
 },
 "COIN_TXT": {
  "en": {
   "6": "Old Yin (6) — three tails: a broken line that is changing into Yang. The soft, yielding part of the situation is about to firm up.",
   "7": "Young Yang (7) — two heads, one tail: a solid, stable line. Steady forward energy that stays as it is.",
   "8": "Young Yin (8) — two tails, one head: a broken, stable line. Receptive, open energy that stays as it is.",
   "9": "Old Yang (9) — three heads: a solid line that is changing into Yin. The forceful part of the situation is about to soften and yield."
  },
  "zh": {
   "6": "老阴（6）——三字：一条阴爻，正在变为阳。局势中柔顺、退让的部分，即将变得坚定。",
   "7": "少阳（7）——二字一背：一条稳定的阳爻。踏实向前、维持不变的能量。",
   "8": "少阴（8）——二背一字：一条稳定的阴爻。开放、承接、维持不变的能量。",
   "9": "老阳（9）——三字：一条阳爻，正在变为阴。局势中强势的部分，即将柔和、退让。"
  }
 },
 "ENNEA_Q": [
  {
   "q": {
    "en": "When something goes wrong, my first instinct is to…",
    "zh": "当事情出错时，我的第一反应是……"
   },
   "opts": [
    {
     "t": 1,
     "en": "Fix it properly and work out what should have been done",
     "zh": "把它妥善做好，想清楚本来应该怎样做"
    },
    {
     "t": 2,
     "en": "Check how the people involved are feeling",
     "zh": "先看看相关的人感受如何"
    },
    {
     "t": 3,
     "en": "Focus on the outcome — what does success look like now?",
     "zh": "聚焦结果——现在怎样才算成功？"
    }
   ]
  },
  {
   "q": {
    "en": "The criticism that would sting me most is…",
    "zh": "最刺痛我的批评是……"
   },
   "opts": [
    {
     "t": 4,
     "en": "That I am ordinary, with nothing distinctive to offer",
     "zh": "说我平凡、没有什么独特之处"
    },
    {
     "t": 5,
     "en": "That I am intrusive or demand too much of people",
     "zh": "说我打扰别人、或要求太多"
    },
    {
     "t": 6,
     "en": "That I cannot be relied on when it matters",
     "zh": "说我在关键时刻靠不住"
    }
   ]
  },
  {
   "q": {
    "en": "On a free weekend, I most want…",
    "zh": "一个空闲周末，我最想……"
   },
   "opts": [
    {
     "t": 7,
     "en": "Options — new places, new people, something I have not tried",
     "zh": "保持选择开放——新地方、新朋友、没试过的事"
    },
    {
     "t": 8,
     "en": "To be in charge of my own time, answerable to no one",
     "zh": "自己时间自己话事，不用向任何人交代"
    },
    {
     "t": 9,
     "en": "Calm — no demands, no conflict, everyone relaxed",
     "zh": "平静——没有要求、没有冲突、人人放松"
    }
   ]
  },
  {
   "q": {
    "en": "In a group project, I naturally become the one who…",
    "zh": "在小组项目中，我自然会成为那个……"
   },
   "opts": [
    {
     "t": 1,
     "en": "Sets the standard and quietly corrects the details",
     "zh": "定下标准、安静地修正细节的人"
    },
    {
     "t": 5,
     "en": "Researches deeply before saying much",
     "zh": "先深入研究、很少先开口的人"
    },
    {
     "t": 9,
     "en": "Keeps the peace so everyone can keep working",
     "zh": "维持和气、让大家能继续做事的人"
    }
   ]
  },
  {
   "q": {
    "en": "I feel most valued when people…",
    "zh": "当别人这样对我时，我最感到被重视……"
   },
   "opts": [
    {
     "t": 2,
     "en": "Genuinely need me and say so",
     "zh": "真心需要我，并且说出口"
    },
    {
     "t": 6,
     "en": "Trust me and include me in the inner circle",
     "zh": "信任我、把我纳入核心圈子"
    },
    {
     "t": 7,
     "en": "Join my plans and bring energy to them",
     "zh": "加入我的计划、为它带来能量"
    }
   ]
  },
  {
   "q": {
    "en": "Under pressure, my biggest trap is…",
    "zh": "在压力下，我最大的陷阱是……"
   },
   "opts": [
    {
     "t": 3,
     "en": "Becoming image-focused — looking successful matters too much",
     "zh": "太在意形象——看起来成功变得太重要"
    },
    {
     "t": 4,
     "en": "Withdrawing and dwelling on what is missing",
     "zh": "退缩、反复想着缺失的部分"
    },
    {
     "t": 8,
     "en": "Taking over and pushing harder than the situation needs",
     "zh": "接管一切、比局势所需推得更硬"
    }
   ]
  },
  {
   "q": {
    "en": "Before a big decision, I usually…",
    "zh": "做重大决定之前，我通常会……"
   },
   "opts": [
    {
     "t": 1,
     "en": "Weigh what is right and principled, even if it is harder",
     "zh": "衡量什么是正确、有原则的，即使更难"
    },
    {
     "t": 6,
     "en": "Run the worst cases and check with people I trust",
     "zh": "先想最坏情况，再问我信任的人"
    },
    {
     "t": 8,
     "en": "Decide fast and trust my gut over endless analysis",
     "zh": "快速决定，信直觉多于无止境分析"
    }
   ]
  },
  {
   "q": {
    "en": "What I most want people to understand about me is…",
    "zh": "我最想别人明白我的是……"
   },
   "opts": [
    {
     "t": 2,
     "en": "How much I quietly do for the people I care about",
     "zh": "我为在乎的人，安静地做了多少"
    },
    {
     "t": 4,
     "en": "That my inner world is deeper than I usually show",
     "zh": "我的内心世界，比我平时表现的深得多"
    },
    {
     "t": 9,
     "en": "That I have views too, even when I do not push them",
     "zh": "即使我不强推，我也是有看法的"
    }
   ]
  },
  {
   "q": {
    "en": "My ideal way to recharge is…",
    "zh": "我最理想的充电方式是……"
   },
   "opts": [
    {
     "t": 3,
     "en": "Achieving something visible, then resting properly",
     "zh": "先完成一件看得见的事，再好好休息"
    },
    {
     "t": 5,
     "en": "Time alone with a book, a problem, or my own thoughts",
     "zh": "独处——一本书、一个问题、或自己的思绪"
    },
    {
     "t": 7,
     "en": "Variety — a trip, a new skill, a plan for the next adventure",
     "zh": "多样性——一趟旅行、一项新技能、下一个冒险的计划"
    }
   ]
  }
 ],
 "ENNEA_TYPES": {
  "1": {
   "nameEn": "The Reformer",
   "nameZh": "改革者",
   "core": {
    "en": "Core drive: to be good, right and principled. You see how things could be better and feel responsible for closing the gap. Strengths: integrity, reliability, an eye for quality. Watch-out: an inner critic that never clocks off, and resentment when others seem careless.",
    "zh": "核心动力：做得好、做得对、守原则。你看得见事情可以更好，并觉得自己有责任收窄那个差距。长处：正直、可靠、对质素有眼光。注意：一个从不下班的内在批评者，以及别人不认真时积起的怨气。"
   },
   "deep": {
    "en": "Under stress you borrow Type 4 patterns — withdrawing and feeling uniquely burdened. In growth you borrow Type 7 lightness — spontaneity, humour, permission to enjoy. At work: give feedback as an invitation, not a verdict. In love: say the need plainly instead of letting correctness speak for it.",
    "zh": "压力下你会借用 4 号模式——退缩、觉得只有自己在承受。成长时你借用 7 号的轻盈——自发、幽默、允许自己享受。工作上：把意见当邀请提出，而非判决。感情上：直接说出需要，不要让「正确」代替你说话。"
   }
  },
  "2": {
   "nameEn": "The Helper",
   "nameZh": "助人者",
   "core": {
    "en": "Core drive: to be loved and needed. You track other people's needs almost automatically and meet them before being asked. Strengths: warmth, generosity, emotional radar. Watch-out: helping with invisible strings attached, and neglecting your own needs until they erupt.",
    "zh": "核心动力：被爱、被需要。你几乎自动地追踪别人的需要，并在对方开口前已满足。长处：温暖、慷慨、情绪雷达敏锐。注意：带着隐形条件的帮助，以及忽略自己的需要直到爆发。"
   },
   "deep": {
    "en": "Under stress you borrow Type 8 force — blunt, controlling, keeping score. In growth you borrow Type 4 honesty — naming your own feelings and needs directly. At work: let people carry their share. In love: ask, do not hint; receive without immediately repaying.",
    "zh": "压力下你会借用 8 号的力量——直接、控制、计较付出。成长时你借用 4 号的诚实——直接说出自己的感受与需要。工作上：让别人承担他们的一份。感情上：开口要求，不要暗示；接受时不必立刻回报。"
   }
  },
  "3": {
   "nameEn": "The Achiever",
   "nameZh": "成就者",
   "core": {
    "en": "Core drive: to be successful and seen as capable. You adapt quickly, set targets and usually hit them. Strengths: drive, polish, pragmatic optimism. Watch-out: confusing your image with yourself, and workaholism dressed up as ambition.",
    "zh": "核心动力：成功、被视为有能力。你适应快、定下目标、通常都能达成。长处：干劲、形象、务实的乐观。注意：把形象与自我混淆，以及包装成上进心的工作狂。"
   },
   "deep": {
    "en": "Under stress you borrow Type 9 shutdown — going numb and coasting. In growth you borrow Type 6 loyalty — committing to people and causes beyond your own scoreboard. At work: share credit early. In love: be known without performing; let someone see an unpolished day.",
    "zh": "压力下你会借用 9 号的关机模式——麻木、滑行。成长时你借用 6 号的忠诚——为自己成绩表以外的人与事作出承诺。工作上：及早分享功劳。感情上：不表演地被了解；让某人看见你不修饰的一天。"
   }
  },
  "4": {
   "nameEn": "The Individualist",
   "nameZh": "自我型 / 艺术型",
   "core": {
    "en": "Core drive: to be authentic and find what is uniquely yours. You feel things deeply and resist anything generic. Strengths: depth, originality, emotional honesty. Watch-out: comparing your insides to other people's outsides, and withdrawing when you feel misunderstood.",
    "zh": "核心动力：真实、找到独属于自己的东西。你感受深刻，抗拒一切公式化。长处：深度、原创、情绪诚实。注意：拿自己的内心与别人的外表比较，以及感到不被理解时退缩。"
   },
   "deep": {
    "en": "Under stress you borrow Type 2 cling — over-involving yourself in other people's feelings. In growth you borrow Type 1 discipline — turning feeling into finished, principled work. At work: ship the imperfect version. In love: say what you need in plain words, not only in atmosphere.",
    "zh": "压力下你会借用 2 号的依附——过度卷入别人的感受。成长时你借用 1 号的纪律——把感受变成完成、有原则的作品。工作上：先交出不完美的版本。感情上：用平实的语言说出需要，不要只靠氛围传达。"
   }
  },
  "5": {
   "nameEn": "The Investigator",
   "nameZh": "探索者 / 观察者",
   "core": {
    "en": "Core drive: to understand and to be competent. You conserve energy, observe first and speak when it counts. Strengths: analysis, independence, calm in complexity. Watch-out: withdrawing into research instead of acting, and guarding time so tightly that people feel shut out.",
    "zh": "核心动力：理解、胜任。你保存能量、先观察、在关键时才开口。长处：分析、独立、在复杂中保持冷静。注意：退入研究代替行动，以及把时间守得太紧，令人觉得被关在门外。"
   },
   "deep": {
    "en": "Under stress you borrow Type 7 scatter — restless, jumping between interests. In growth you borrow Type 8 presence — engaging directly and deciding in the room. At work: share drafts early. In love: presence is the gift; schedule it like you mean it.",
    "zh": "压力下你会借用 7 号的散乱——坐立不安、在兴趣之间跳跃。成长时你借用 8 号的临场感——直接参与、当场决定。工作上：及早分享草稿。感情上：陪伴就是礼物；认真地把它排进日程。"
   }
  },
  "6": {
   "nameEn": "The Loyalist",
   "nameZh": "忠诚者",
   "core": {
    "en": "Core drive: to be secure and supported. You scan for what could go wrong and prepare for it, which makes you the person others trust in a crisis. Strengths: loyalty, foresight, dry humour under pressure. Watch-out: anxiety loops and testing people's reliability instead of simply asking.",
    "zh": "核心动力：安全、被支持。你扫描可能出错的地方并预先准备，因此在危机中你是别人信任的人。长处：忠诚、远见、压力下的冷幽默。注意：焦虑循环，以及试探别人的可靠性，而非直接开口问。"
   },
   "deep": {
    "en": "Under stress you borrow Type 3 image-management — busy, performative coping. In growth you borrow Type 9 calm — trusting that most feared outcomes will not arrive. At work: decide with the evidence you have. In love: name the fear once, clearly, instead of auditing the relationship.",
    "zh": "压力下你会借用 3 号的形象管理——忙碌、表演式的应对。成长时你借用 9 号的平静——相信大多数恐惧的结果不会发生。工作上：用手上的证据做决定。感情上：把恐惧清楚说一次，而不是审计这段关系。"
   }
  },
  "7": {
   "nameEn": "The Enthusiast",
   "nameZh": "热情者 / 享乐型",
   "core": {
    "en": "Core drive: to be happy, free and full of options. You generate ideas and energy wherever you land. Strengths: optimism, versatility, rapid reframing. Watch-out: fleeing discomfort into the next plan, and leaving a trail of 80-percent finishes.",
    "zh": "核心动力：快乐、自由、选择多多。你去到哪里都带来点子和能量。长处：乐观、多才、快速转念。注意：逃避不适、奔向下一个计划，以及留下一串完成八成的事。"
   },
   "deep": {
    "en": "Under stress you borrow Type 1 criticism — suddenly rigid and fault-finding. In growth you borrow Type 5 depth — finishing, focusing, sitting with one thing. At work: one flagship project at a time. In love: stay for the ordinary Tuesdays, not only the highlights.",
    "zh": "压力下你会借用 1 号的批评——突然僵硬、挑剔。成长时你借用 5 号的深度——完成、专注、与一件事相处。工作上：同一时间只推一个旗舰项目。感情上：留下来过平凡的星期二，不只过精彩时刻。"
   }
  },
  "8": {
   "nameEn": "The Challenger",
   "nameZh": "挑战者 / 领袖型",
   "core": {
    "en": "Core drive: to be strong, self-reliant and in control of your own life. You protect your people fiercely and confront problems head-on. Strengths: decisiveness, courage, big-hearted protection. Watch-out: intensity that lands as intimidation, and treating vulnerability as a security risk.",
    "zh": "核心动力：强大、自立、主宰自己的人生。你全心全意保护自己人，正面迎击问题。长处：果断、勇气、大方地保护别人。注意：会被感受为威吓的强度，以及把脆弱当成安全风险。"
   },
   "deep": {
    "en": "Under stress you borrow Type 5 withdrawal — pulling back and going silent. In growth you borrow Type 2 openness — tenderness expressed directly, not only through protection. At work: invite dissent before you decide. In love: let yourself be looked after sometimes; it is not a debt.",
    "zh": "压力下你会借用 5 号的退缩——后退、沉默。成长时你借用 2 号的开放——直接表达温柔，而非只透过保护。工作上：决定之前先邀请异见。感情上：偶尔让自己被照顾；那不是欠债。"
   }
  },
  "9": {
   "nameEn": "The Peacemaker",
   "nameZh": "和平者 / 调停型",
   "core": {
    "en": "Core drive: to keep inner and outer peace. You see every side of an argument and make rooms calmer by being in them. Strengths: patience, acceptance, steady presence. Watch-out: merging with other people's agendas and going numb on your own — your preferences surface late or never.",
    "zh": "核心动力：保持内外和平。你看得见争论的每一面，你在场，房间就 calm 下来。长处：耐性、接纳、稳定的陪伴。注意：与别人的议程合并、对自己的需要麻木——你的偏好总是迟来，甚至不来。"
   },
   "deep": {
    "en": "Under stress you borrow Type 6 anxiety — worrying while appearing calm. In growth you borrow Type 3 energy — stating your own goals and acting on them visibly. At work: voice the preference in the meeting, not after it. In love: small honest disagreements early prevent large silent ones later.",
    "zh": "压力下你会借用 6 号的焦虑——表面平静、内里担忧。成长时你借用 3 号的能量——说出自己的目标，并 visibly 地行动。工作上：在会议中说出偏好，不要会后才说。感情上：及早的小分歧，可避免日后大的沉默。"
   }
  }
 },
 "MBTI_Q": [
  {
   "dim": "EI",
   "q": {
    "en": "After a demanding week, I recharge by…",
    "zh": "辛苦一周后，我靠这样充电……"
   },
   "a": {
    "l": "E",
    "en": "Meeting friends — being around people gives me energy back",
    "zh": "见朋友——与人在一起令我恢复能量"
   },
   "b": {
    "l": "I",
    "en": "Time alone or with one close person — quiet restores me",
    "zh": "独处或与一位亲近的人一起——安静令我恢复"
   }
  },
  {
   "dim": "EI",
   "q": {
    "en": "In a group discussion, I usually…",
    "zh": "在小组讨论中，我通常……"
   },
   "a": {
    "l": "E",
    "en": "Think out loud — ideas form while I am speaking",
    "zh": "边说边想——说话时想法才成形"
   },
   "b": {
    "l": "I",
    "en": "Think first, then speak once my view is formed",
    "zh": "先想清楚，观点成形后才开口"
   }
  },
  {
   "dim": "SN",
   "q": {
    "en": "I trust more…",
    "zh": "我更信任……"
   },
   "a": {
    "l": "S",
    "en": "Facts, details and what has actually worked before",
    "zh": "事实、细节与过去实际有效的方法"
   },
   "b": {
    "l": "N",
    "en": "Patterns, possibilities and where things could go",
    "zh": "模式、可能性与事情可以走向何方"
   }
  },
  {
   "dim": "SN",
   "q": {
    "en": "When learning something new, I prefer…",
    "zh": "学新东西时，我偏好……"
   },
   "a": {
    "l": "S",
    "en": "Step-by-step instructions with concrete examples",
    "zh": "有具体例子的逐步说明"
   },
   "b": {
    "l": "N",
    "en": "The big picture first — details can fill in later",
    "zh": "先看全局——细节之后再补"
   }
  },
  {
   "dim": "TF",
   "q": {
    "en": "When I must decide something that affects others, I lead with…",
    "zh": "当我要做影响别人的决定时，我先考虑……"
   },
   "a": {
    "l": "T",
    "en": "Logic and fairness — the same rules for everyone",
    "zh": "逻辑与公平——人人同一套规则"
   },
   "b": {
    "l": "F",
    "en": "Impact on people — how each person will feel about it",
    "zh": "对人的影响——每个人会有什么感受"
   }
  },
  {
   "dim": "TF",
   "q": {
    "en": "Feedback lands best with me when it is…",
    "zh": "我最能接受的意见方式是……"
   },
   "a": {
    "l": "T",
    "en": "Direct and analytical, even if it is blunt",
    "zh": "直接、有分析，即使有点直接"
   },
   "b": {
    "l": "F",
    "en": "Considerate of feelings, even if it is softer",
    "zh": "顾及感受，即使较委婉"
   }
  },
  {
   "dim": "JP",
   "q": {
    "en": "My natural working style is…",
    "zh": "我天生的做事方式是……"
   },
   "a": {
    "l": "J",
    "en": "Plan ahead, decide early, finish before the deadline",
    "zh": "预先计划、及早决定、在死线前完成"
   },
   "b": {
    "l": "P",
    "en": "Stay flexible, decide as things unfold, use the deadline as fuel",
    "zh": "保持弹性、随事情发展再决定、用死线作动力"
   }
  },
  {
   "dim": "JP",
   "q": {
    "en": "On holiday, I prefer…",
    "zh": "旅行时，我偏好……"
   },
   "a": {
    "l": "J",
    "en": "A loose itinerary booked in advance — then relax into it",
    "zh": "预先订好一个松动行程——然后安心享受"
   },
   "b": {
    "l": "P",
    "en": "A starting point and freedom to improvise each day",
    "zh": "一个起点，每天自由即兴"
   }
  }
 ],
 "ENNEA_Q2": [
  {
   "q": {
    "en": "When I join a new team or group, I…",
    "zh": "加入一个新团队或群体时，我会……"
   },
   "opts": [
    {
     "t": 1,
     "en": "Learn the standards first and quietly make sure my work meets them",
     "zh": "先了解标准，安静地确保自己的工作达标"
    },
    {
     "t": 2,
     "en": "Get to know people and find where I can be useful",
     "zh": "先认识大家，找自己可以帮上忙的位置"
    },
    {
     "t": 3,
     "en": "Set a personal target and get moving fast",
     "zh": "先为自己定一个目标，快速动起来"
    }
   ]
  },
  {
   "q": {
    "en": "The compliment I would most like to hear is…",
    "zh": "我最想听到的称赞是……"
   },
   "opts": [
    {
     "t": 4,
     "en": "“No one else sees it the way you do.”",
     "zh": "「只有你看事情的角度是这样的。」"
    },
    {
     "t": 5,
     "en": "“You really understand how this works.”",
     "zh": "「你真的很懂这件事如何运作。」"
    },
    {
     "t": 6,
     "en": "“We knew we could count on you.”",
     "zh": "「我们就知道可以靠你。」"
    }
   ]
  },
  {
   "q": {
    "en": "When plans fall through at the last minute, I…",
    "zh": "计划在最后一刻告吹时，我会……"
   },
   "opts": [
    {
     "t": 7,
     "en": "Immediately look for a more interesting alternative",
     "zh": "立刻找一个更有趣的替代方案"
    },
    {
     "t": 8,
     "en": "Take charge and set a new plan myself",
     "zh": "接手，自己定一个新计划"
    },
    {
     "t": 9,
     "en": "Go along with whatever keeps everyone comfortable",
     "zh": "随大家都舒服的方向走"
    }
   ]
  },
  {
   "q": {
    "en": "My desk, phone and files tend to be…",
    "zh": "我的书桌、手机与档案通常是……"
   },
   "opts": [
    {
     "t": 1,
     "en": "Organised — everything has a place and a standard",
     "zh": "井井有条——每样东西都有位置与标准"
    },
    {
     "t": 4,
     "en": "Personal — arranged by mood and meaning, not by rules",
     "zh": "很个人——按感觉与意义摆放，不按规矩"
    },
    {
     "t": 7,
     "en": "In motion — piles of current enthusiasms, sorted later",
     "zh": "流动中——一堆当前的热情所在，之后再整理"
    }
   ]
  },
  {
   "q": {
    "en": "When a friend is struggling and has not asked for help, I…",
    "zh": "当朋友有困难又没有开口求助时，我会……"
   },
   "opts": [
    {
     "t": 2,
     "en": "Step in gently — I can usually tell what they need",
     "zh": "温和地介入——我通常看得出他们需要什么"
    },
    {
     "t": 5,
     "en": "Wait and stay available — they will ask when ready",
     "zh": "等待并保持开放——他们准备好自然会开口"
    },
    {
     "t": 8,
     "en": "Tell them directly what I think they should do",
     "zh": "直接告诉他们我认为应该怎么做"
    }
   ]
  },
  {
   "q": {
    "en": "In a crisis at work, people rely on me to…",
    "zh": "工作上出事时，大家靠我来……"
   },
   "opts": [
    {
     "t": 3,
     "en": "Keep the outcome in sight and drive delivery",
     "zh": "盯住成果、推动交付"
    },
    {
     "t": 6,
     "en": "Spot the risks early and prepare for them",
     "zh": "及早发现风险并作准备"
    },
    {
     "t": 9,
     "en": "Keep everyone calm and stop the panic spreading",
     "zh": "让大家冷静下来，阻止恐慌蔓延"
    }
   ]
  },
  {
   "q": {
    "en": "My relationship with rules is…",
    "zh": "我与规则的关系是……"
   },
   "opts": [
    {
     "t": 1,
     "en": "Rules exist for a reason — follow them, and improve them properly",
     "zh": "规则存在必有理由——应遵守，要改就正正经经地改"
    },
    {
     "t": 5,
     "en": "Rules are information — I decide case by case what applies",
     "zh": "规则是资讯——我逐件事判断哪些适用"
    },
    {
     "t": 9,
     "en": "Rules are fine until they create friction — then I work around them",
     "zh": "规则可以，直到它制造摩擦——那时我会绕过去"
    }
   ]
  },
  {
   "q": {
    "en": "What drains me most is…",
    "zh": "最消耗我的是……"
   },
   "opts": [
    {
     "t": 2,
     "en": "Feeling unappreciated by people I have given a lot to",
     "zh": "为之付出很多的人不领情"
    },
    {
     "t": 6,
     "en": "Uncertainty — not knowing where I stand or what comes next",
     "zh": "不确定——不知道自己的位置与下一步"
    },
    {
     "t": 7,
     "en": "Being stuck in a routine with nothing new ahead",
     "zh": "困在例行公事中，前面没有新事物"
    }
   ]
  },
  {
   "q": {
    "en": "When I feel overlooked, I tend to…",
    "zh": "当我觉得被忽略时，我倾向……"
   },
   "opts": [
    {
     "t": 3,
     "en": "Work harder and make the results impossible to ignore",
     "zh": "更努力，让成果无法被忽视"
    },
    {
     "t": 4,
     "en": "Withdraw and wonder what is wrong with me",
     "zh": "退缩，反复想自己哪里不好"
    },
    {
     "t": 8,
     "en": "Speak up — I would rather confront it than fade",
     "zh": "出声——我宁愿正面对质，也不要淡出"
    }
   ]
  },
  {
   "q": {
    "en": "Before I trust someone's work, I need to see…",
    "zh": "在我信任一个人的工作之前，我需要看到……"
   },
   "opts": [
    {
     "t": 1,
     "en": "That it was done carefully and correctly",
     "zh": "它被认真、正确地完成"
    },
    {
     "t": 6,
     "en": "Consistency — that they deliver the same way every time",
     "zh": "一致性——他们每次都以同样方式交付"
    },
    {
     "t": 8,
     "en": "That they stand behind it when challenged",
     "zh": "他们在被质疑时会挺身捍卫它"
    }
   ]
  },
  {
   "q": {
    "en": "The role I slip into at gatherings is…",
    "zh": "在聚会中，我不自觉担当的角色是……"
   },
   "opts": [
    {
     "t": 2,
     "en": "The host in spirit — checking everyone has what they need",
     "zh": "像主人一样——留意每个人是否有所需"
    },
    {
     "t": 4,
     "en": "The one in a deep one-to-one conversation in the corner",
     "zh": "在角落与人作一对一深谈的那个"
    },
    {
     "t": 9,
     "en": "The easy presence everyone finds comfortable to be near",
     "zh": "令人舒服、自在的那个存在"
    }
   ]
  },
  {
   "q": {
    "en": "Success, to me, mostly means…",
    "zh": "对我来说，成功主要是……"
   },
   "opts": [
    {
     "t": 3,
     "en": "Achieving the goal and being recognised for it",
     "zh": "达成目标，并因此获得认可"
    },
    {
     "t": 5,
     "en": "Mastering something difficult, on my own terms",
     "zh": "按自己的方式，精通一件困难的事"
    },
    {
     "t": 7,
     "en": "A life full of experiences I chose myself",
     "zh": "一个充满自己选择的体验的人生"
    }
   ]
  },
  {
   "q": {
    "en": "When I make a mistake, my inner voice says…",
    "zh": "当我犯错时，内心的声音会说……"
   },
   "opts": [
    {
     "t": 1,
     "en": "“That should not have happened — do it properly next time.”",
     "zh": "「不应该发生的——下次要做得妥妥当当。」"
    },
    {
     "t": 2,
     "en": "“Will they still think well of me?”",
     "zh": "「他们还会对我有好印象吗？」"
    },
    {
     "t": 3,
     "en": "“Fix the impression fast — get a win on the board.”",
     "zh": "「快修补印象——先赢一仗回来。」"
    }
   ]
  },
  {
   "q": {
    "en": "I am most likely to lose track of time when I am…",
    "zh": "我最容易忘记时间，是在……的时候"
   },
   "opts": [
    {
     "t": 4,
     "en": "Making, writing or feeling something deeply",
     "zh": "创作、写作，或深深感受某件事"
    },
    {
     "t": 5,
     "en": "Deep in research, a system or a hard problem",
     "zh": "深入研究、钻研一个系统或难题"
    },
    {
     "t": 6,
     "en": "With my trusted people, talking things through",
     "zh": "与我信任的人在一起、把事情谈透"
    }
   ]
  },
  {
   "q": {
    "en": "My attitude to conflict is…",
    "zh": "我对冲突的态度是……"
   },
   "opts": [
    {
     "t": 7,
     "en": "Reframe it or leave it — life is too short for heavy scenes",
     "zh": "转念或离场——人生太短，不值得困在沉重场面"
    },
    {
     "t": 8,
     "en": "Meet it head-on — a clear fight beats a slow resentment",
     "zh": "正面迎击——一场清楚的交锋胜过慢慢积怨"
    },
    {
     "t": 9,
     "en": "Smooth it over — most things are not worth the friction",
     "zh": "和缓处理——大多数事不值得起摩擦"
    }
   ]
  },
  {
   "q": {
    "en": "What I secretly envy in others is…",
    "zh": "我暗暗羡慕别人的，是……"
   },
   "opts": [
    {
     "t": 1,
     "en": "People who can relax without feeling they should be improving something",
     "zh": "能真正放松、不觉得自己应该在改进什么的人"
    },
    {
     "t": 4,
     "en": "People who seem complete and at home in themselves",
     "zh": "看起来完整、自在地做自己的人"
    },
    {
     "t": 7,
     "en": "People who finish one thing deeply, contentedly",
     "zh": "能满足地把一件事做深做完的人"
    }
   ]
  },
  {
   "q": {
    "en": "When I am angry, I usually…",
    "zh": "当我生气时，我通常会……"
   },
   "opts": [
    {
     "t": 2,
     "en": "Go quiet and extra helpful — the anger comes out sideways later",
     "zh": "变得安静又加倍帮忙——怒气之后才从侧面出来"
    },
    {
     "t": 5,
     "en": "Withdraw until I have sorted it out privately",
     "zh": "退开，直到我私下把事情想通"
    },
    {
     "t": 8,
     "en": "Say it straight, at volume if needed — then it is done",
     "zh": "直接说出来，必要时大声——说完就完"
    }
   ]
  },
  {
   "q": {
    "en": "At the end of a good day, I feel it was good because…",
    "zh": "美好的一天结束时，我觉得它好，是因为……"
   },
   "opts": [
    {
     "t": 3,
     "en": "I achieved something that counts",
     "zh": "我完成了一件有份量的事"
    },
    {
     "t": 6,
     "en": "The people I rely on were there, and I was there for them",
     "zh": "我依靠的人都在，我也在他们身边"
    },
    {
     "t": 9,
     "en": "It was peaceful, and nobody needed anything from me",
     "zh": "那天平静，没有人向我索取什么"
    }
   ]
  }
 ],
 "MBTI_Q2": [
  {
   "dim": "EI",
   "q": {
    "en": "At a party, I am more likely to…",
    "zh": "在派对上，我比较会……"
   },
   "a": {
    "l": "E",
    "en": "Move between groups, meeting new people",
    "zh": "在不同小组间走动，认识新朋友"
   },
   "b": {
    "l": "I",
    "en": "Settle into one or two real conversations",
    "zh": "安顿下来，投入一两场真正的对话"
   }
  },
  {
   "dim": "SN",
   "q": {
    "en": "When reading instructions, I…",
    "zh": "看指示时，我会……"
   },
   "a": {
    "l": "S",
    "en": "Follow them literally the first time, then adjust",
    "zh": "第一次先按字面照做，之后再调整"
   },
   "b": {
    "l": "N",
    "en": "Skim for the idea and improvise the steps",
    "zh": "先抓大意，步骤即兴发挥"
   }
  },
  {
   "dim": "TF",
   "q": {
    "en": "When two people disagree, I first…",
    "zh": "当两个人意见不合时，我先……"
   },
   "a": {
    "l": "T",
    "en": "Look for the facts and the fairest principle",
    "zh": "找事实与最公平的原则"
   },
   "b": {
    "l": "F",
    "en": "Consider what each person needs in order to feel heard",
    "zh": "考虑每个人需要什么，才会觉得被听见"
   }
  },
  {
   "dim": "JP",
   "q": {
    "en": "My inbox and desk tend to be…",
    "zh": "我的收件箱与书桌倾向于……"
   },
   "a": {
    "l": "J",
    "en": "Cleared and sorted as I go",
    "zh": "随手清理、分类"
   },
   "b": {
    "l": "P",
    "en": "Handled in bursts, when it starts to matter",
    "zh": "在开始重要时，才一口气处理"
   }
  },
  {
   "dim": "EI",
   "q": {
    "en": "When I have an idea at work, I prefer to…",
    "zh": "在工作上有新想法时，我偏好……"
   },
   "a": {
    "l": "E",
    "en": "Talk it through with someone right away",
    "zh": "立刻找人谈一谈"
   },
   "b": {
    "l": "I",
    "en": "Let it settle, then share it in writing or when asked",
    "zh": "先让它沉淀，之后以书面或被问及时才分享"
   }
  },
  {
   "dim": "SN",
   "q": {
    "en": "I am more interested in…",
    "zh": "我对以下哪样较有兴趣……"
   },
   "a": {
    "l": "S",
    "en": "What is actually happening now",
    "zh": "现在实际在发生的事"
   },
   "b": {
    "l": "N",
    "en": "What could happen next, or underneath the surface",
    "zh": "接下来可能发生、或表面之下的事"
   }
  },
  {
   "dim": "TF",
   "q": {
    "en": "I would rather be seen as…",
    "zh": "我宁愿被视为……"
   },
   "a": {
    "l": "T",
    "en": "Competent and fair, even if not always warm",
    "zh": "有能力、公平，即使不总是温暖"
   },
   "b": {
    "l": "F",
    "en": "Kind and understanding, even if not always firm",
    "zh": "善良、体谅，即使不总是坚定"
   }
  },
  {
   "dim": "JP",
   "q": {
    "en": "I feel most comfortable when…",
    "zh": "我在以下情况最自在……"
   },
   "a": {
    "l": "J",
    "en": "The plan is set and I know what happens next",
    "zh": "计划已定，知道下一步是什么"
   },
   "b": {
    "l": "P",
    "en": "Options stay open and I can adapt",
    "zh": "选择保持开放，可以随时调整"
   }
  },
  {
   "dim": "EI",
   "q": {
    "en": "Strangers would probably describe me as…",
    "zh": "陌生人大概会形容我为……"
   },
   "a": {
    "l": "E",
    "en": "Easy to approach and quick to engage",
    "zh": "容易亲近、很快投入"
   },
   "b": {
    "l": "I",
    "en": "Reserved at first, warmer once you know me",
    "zh": "起初较拘谨，熟了之后才温暖"
   }
  },
  {
   "dim": "SN",
   "q": {
    "en": "When I describe something, I mostly use…",
    "zh": "我形容事情时，多用……"
   },
   "a": {
    "l": "S",
    "en": "Concrete details — what I saw and heard",
    "zh": "具体细节——我看到与听到的"
   },
   "b": {
    "l": "N",
    "en": "Impressions and meanings — what it added up to",
    "zh": "印象与意义——它总体代表什么"
   }
  },
  {
   "dim": "TF",
   "q": {
    "en": "When giving criticism, I…",
    "zh": "给予批评时，我会……"
   },
   "a": {
    "l": "T",
    "en": "Say it plainly — honesty helps most",
    "zh": "直说——诚实最有帮助"
   },
   "b": {
    "l": "F",
    "en": "Soften the edges so it can be received",
    "zh": "把边角放软，让对方接得住"
   }
  },
  {
   "dim": "JP",
   "q": {
    "en": "Deadlines work best for me as…",
    "zh": "死线对我最有效的作用是……"
   },
   "a": {
    "l": "J",
    "en": "A line I finish well ahead of",
    "zh": "一条我会早早完成的界线"
   },
   "b": {
    "l": "P",
    "en": "A spark that focuses me near the end",
    "zh": "在尾段令我集中精神的火花"
   }
  },
  {
   "dim": "EI",
   "q": {
    "en": "A perfect free day leans toward…",
    "zh": "完美的自由日倾向于……"
   },
   "a": {
    "l": "E",
    "en": "Plans with people, out in the world",
    "zh": "与人有约、在外面的世界活动"
   },
   "b": {
    "l": "I",
    "en": "Unscheduled time, mostly my own company",
    "zh": "没有行程，大部分时间自己作主"
   }
  },
  {
   "dim": "SN",
   "q": {
    "en": "In planning, I put more weight on…",
    "zh": "做规划时，我较看重……"
   },
   "a": {
    "l": "S",
    "en": "Proven methods and past results",
    "zh": "已被验证的方法与过往成果"
   },
   "b": {
    "l": "N",
    "en": "New approaches and untested potential",
    "zh": "新做法与未试过的潜力"
   }
  },
  {
   "dim": "TF",
   "q": {
    "en": "A decision feels right to me when…",
    "zh": "决定在以下情况令我觉得对……"
   },
   "a": {
    "l": "T",
    "en": "It holds up under logical scrutiny",
    "zh": "它经得起逻辑推敲"
   },
   "b": {
    "l": "F",
    "en": "It sits well with the people affected",
    "zh": "受影响的人都觉得可以接受"
   }
  },
  {
   "dim": "JP",
   "q": {
    "en": "When travelling with others, I prefer…",
    "zh": "与别人旅行时，我偏好……"
   },
   "a": {
    "l": "J",
    "en": "Knowing where we sleep and roughly what each day holds",
    "zh": "知道睡在哪里、大概每天做什么"
   },
   "b": {
    "l": "P",
    "en": "Booking the first night and deciding the rest on the road",
    "zh": "只订第一晚，其余在路上决定"
   }
  }
 ],
 "MBTI_TYPES": {
  "INTJ": {
   "nickEn": "The Architect",
   "nickZh": "建筑师",
   "en": "INTJ — The Architect. You think in systems and long arcs, and you improve things by redesigning them, not patching them. Strengths: strategic clarity, independence, high standards. Watch-out: impatience with inefficiency can read as dismissal; bring people along earlier than feels necessary.",
   "zh": "INTJ——建筑师。你以系统与长线思考，透过重新设计而非修补来改善事情。长处：策略清晰、独立、标准高。注意：对低效率的不耐烦会被感受为否定；比你觉得需要的更早一点，把人带进来。",
   "deepEn": "At work you excel where strategy, research or building something durable matters. In relationships you show love through competence and planning — say the feeling sometimes too; your partner cannot read the blueprint in your head.",
   "deepZh": "工作上，你在策略、研究或建造耐久之物上出色。感情上你以能力与规划表达爱——偶尔也把感受说出来；伴侣读不到你脑中的蓝图。"
  },
  "INTP": {
   "nickEn": "The Logician",
   "nickZh": "逻辑学家",
   "en": "INTP — The Logician. You are driven by how things actually work, and you keep asking why until the model is clean. Strengths: original analysis, honesty, calm curiosity. Watch-out: endless analysis can stall delivery; a good-enough answer shipped beats a perfect one pending.",
   "zh": "INTP——逻辑学家。你被「事情到底如何运作」驱动，一直追问为什么，直到模型干净为止。长处：原创分析、诚实、冷静的好奇。注意：无止境分析会拖住交付；交出够好的答案，胜过 pending 的完美答案。",
   "deepEn": "At work you thrive in research, design and problem diagnosis. In relationships you connect through ideas and respect for autonomy — check in emotionally on purpose, not only when there is a problem to solve.",
   "deepZh": "工作上，你在研究、设计与问题诊断中如鱼得水。感情上你透过想法与尊重自主来连结——有意识地做情感 check-in，不要只在有问题要解决时才做。"
  },
  "ENTJ": {
   "nickEn": "The Commander",
   "nickZh": "指挥官",
   "en": "ENTJ — The Commander. You organise people and resources toward a goal almost instinctively, and you are energised by momentum. Strengths: leadership, decisiveness, long-range planning. Watch-out: efficiency can steamroll feelings; slower consensus sometimes produces faster execution.",
   "zh": "ENTJ——指挥官。你几乎本能地组织人与资源迈向目标，并被 momentum 充电。长处：领导力、果断、长线规划。注意：效率会辗过感受；较慢的共识，有时反而带来更快的执行。",
   "deepEn": "At work you belong where outcomes are owned and teams are built. In relationships you respect competence and honesty — soften the briefing tone; home is not a headquarters.",
   "deepZh": "工作上，你属于要 own 结果、建团队的位置。感情上你尊重能力与诚实——放软简报式的语气；家不是总部。"
  },
  "ENTP": {
   "nickEn": "The Debater",
   "nickZh": "辩论家",
   "en": "ENTP — The Debater. You generate possibilities faster than most people finish a sentence, and you test ideas by sparring with them. Strengths: inventiveness, wit, strategic improvisation. Watch-out: boredom is your leak — finish rates suffer when the novel part ends.",
   "zh": "ENTP——辩论家。你产生可能性的速度比大多数人说完一句话还快，并透过交锋来测试想法。长处：创意、机智、策略即兴。注意：无聊是你的漏洞——新鲜部分结束后，完成率就会下跌。",
   "deepEn": "At work you shine in founding, pitching and rescuing stuck projects. In relationships you need a partner who enjoys the sparring — and who can tell play-argument from real disagreement.",
   "deepZh": "工作上，你在创业、提案与拯救卡住的项目上发光。感情上你需要享受交锋的伴侣——而且能分辨玩笑式争论与真正分歧。"
  },
  "INFJ": {
   "nickEn": "The Advocate",
   "nickZh": "提倡者",
   "en": "INFJ — The Advocate. You read people and patterns quietly, then act on a vision of how things should be. Strengths: insight, integrity, quiet determination. Watch-out: you absorb other people's emotions as data about yourself, and burn out in private.",
   "zh": "INFJ——提倡者。你安静地读人与模式，然后按一个「事情应该如何」的愿景行动。长处：洞察、正直、安静的决心。注意：你会把别人的情绪当作关于自己的数据吸收，并在私下耗尽自己。",
   "deepEn": "At work you do best where purpose and people intersect — coaching, writing, strategy with a human core. In relationships you need depth and honesty; small talk as a permanent diet starves you.",
   "deepZh": "工作上，你在目的与人交汇处表现最好——辅导、写作、有人本核心的策略。感情上你需要深度与诚实；长期只吃闲聊这种餐单会令你枯竭。"
  },
  "INFP": {
   "nickEn": "The Mediator",
   "nickZh": "调停者",
   "en": "INFP — The Mediator. You run an inner compass check on everything: does this fit what I believe? Strengths: empathy, originality, loyalty to values. Watch-out: idealism can turn practical steps into disappointments; small concrete actions protect big dreams.",
   "zh": "INFP——调停者。你对每件事都做一次内在指南针检查：这符合我的信念吗？长处：同理心、原创、忠于价值。注意：理想主义会令实际步骤变成失望；小的具体行动能保护大的梦想。",
   "deepEn": "At work you thrive where meaning and craft meet — writing, design, care, advocacy. In relationships you are devoted and perceptive; say needs early, before they become quiet tests.",
   "deepZh": "工作上，你在意义与手艺相遇处茁壮——写作、设计、照顾、倡议。感情上你专一而敏锐；及早说出需要，不要让它变成安静的试探。"
  },
  "ENFJ": {
   "nickEn": "The Protagonist",
   "nickZh": "主人公",
   "en": "ENFJ — The Protagonist. You organise around people: their growth, their morale, their next step. Strengths: warmth, leadership, reading a room instantly. Watch-out: your own needs queue last, and other people's opinions of you can steer decisions more than they should.",
   "zh": "ENFJ——主人公。你围绕人来组织：他们的成长、士气、下一步。长处：温暖、领导力、即刻读懂全场。注意：自己的需要排最后，而别人对你的看法，会比应有的程度更影响你的决定。",
   "deepEn": "At work you excel at teaching, leading and building communities. In relationships you give generously — choose partners who notice the giver also needs refilling, and let them.",
   "deepZh": "工作上，你在教学、领导与建构社群上出色。感情上你慷慨付出——选择会留意「付出者也需要被补给」的人，并让他们这样做。"
  },
  "ENFP": {
   "nickEn": "The Campaigner",
   "nickZh": "竞选者",
   "en": "ENFP — The Campaigner. You connect people and possibilities with contagious energy, and you feel a room's weather before anyone names it. Strengths: enthusiasm, creativity, emotional range. Watch-out: follow-through and routine are your tax; systems, not willpower, pay it.",
   "zh": "ENFP——竞选者。你以具感染力的能量连结人与可能性，并在任何人说出之前，已感到全场的天气。长处：热情、创意、情绪幅度。注意：完成与 routine 是你的税；要靠系统而非意志力去缴。",
   "deepEn": "At work you light up brainstorming, community and client-facing creation. In relationships you bring sparkle and sincerity — pick partners who love the energy and help anchor the calendar.",
   "deepZh": "工作上，你点亮脑力激荡、社群与面向客户的创作。感情上你带来火花与真诚——选择欣赏这份能量、又能协助你 anchor 日程的伴侣。"
  },
  "ISTJ": {
   "nickEn": "The Logistician",
   "nickZh": "物流师",
   "en": "ISTJ — The Logistician. You are the load-bearing wall: reliable, factual and thorough, in good weeks and bad ones. Strengths: dependability, memory for detail, honoured commitments. Watch-out: proven methods can become a cage; schedule experiments so change arrives on your terms.",
   "zh": "ISTJ——物流师。你是承重墙：可靠、重事实、彻底，好周坏周都一样。长处：值得信赖、记得细节、说到做到。注意： proven 的方法会变成笼子；把实验排进日程，让改变按你的条件到来。",
   "deepEn": "At work you excel in operations, quality, finance and anywhere accuracy compounds. In relationships you show love by doing — add words occasionally; dependability plus expression is the full language.",
   "deepZh": "工作上，你在营运、品质、财务及任何准确性能复利的地方出色。感情上你以行动表达爱——偶尔加上言语；可靠加上表达，才是完整的语言。"
  },
  "ISFJ": {
   "nickEn": "The Defender",
   "nickZh": "守卫者",
   "en": "ISFJ — The Defender. You care in practical detail: remembering, preparing, quietly preventing problems. Strengths: loyalty, attentiveness, steady warmth. Watch-out: you say yes past your capacity and keep the resentment private; a kind no protects the yeses.",
   "zh": "ISFJ——守卫者。你以实际细节去关心：记得、准备、安静地预防问题。长处：忠诚、体贴、稳定的温暖。注意：你会答应超出自己能力的请求，并把怨气私藏；一个善意的「不」，能保护你的「好」。",
   "deepEn": "At work you shine in care, coordination and craft that serves real people. In relationships you are devoted and observant — let your needs be as visible as your care is.",
   "deepZh": "工作上，你在照顾、协调与服务真人的手艺上发光。感情上你专一而细心——让你的需要，像你的关心一样清楚可见。"
  },
  "ESTJ": {
   "nickEn": "The Executive",
   "nickZh": "总经理",
   "en": "ESTJ — The Executive. You bring order: clear roles, clear standards, things finished. Strengths: organisation, candour, getting groups moving. Watch-out: correctness delivered at volume can silence useful dissent; ask one more question before deciding for the room.",
   "zh": "ESTJ——总经理。你带来秩序：角色清晰、标准清晰、事情完成。长处：组织、坦率、令团队动起来。注意：大声 delivered 的正确，会令有用的异见沉默；替全场决定之前，多问一个问题。",
   "deepEn": "At work you belong in management, operations and anywhere standards matter. In relationships you value loyalty and effort — appreciation spoken aloud lands deeper than another task completed.",
   "deepZh": "工作上，你属于管理、营运及任何标准重要的地方。感情上你重视忠诚与努力——说出口的欣赏，比多完成一件事更入心。"
  },
  "ESFJ": {
   "nickEn": "The Consul",
   "nickZh": "执政官",
   "en": "ESFJ — The Consul. You are the social glue: hosting, harmonising, remembering what matters to people. Strengths: warmth, reliability, practical care. Watch-out: harmony can outrank honesty in your decisions; a relationship that cannot survive one honest sentence is not yet harmony.",
   "zh": "ESFJ——执政官。你是社交黏合剂：款待、协调、记得对人重要的事。长处：温暖、可靠、实际的关心。注意：在你的决定中，和谐会排在诚实之前；一段经不起一句真心话的关系，还不是和谐。",
   "deepEn": "At work you excel in service, events, teams and client care. In relationships you give structure and celebration — choose people who reciprocate care, not only receive it.",
   "deepZh": "工作上，你在服务、活动、团队与客户关怀上出色。感情上你带来结构与庆祝——选择会回报关心的人，而非只接收。"
  },
  "ISTP": {
   "nickEn": "The Virtuoso",
   "nickZh": "鉴赏家",
   "en": "ISTP — The Virtuoso. You learn by taking things apart and putting them back together, preferably with your hands. Strengths: calm problem-solving, adaptability, mechanical and situational logic. Watch-out: boredom and emotional conversations both tempt you to exit quietly; stay ten minutes longer than instinct says.",
   "zh": "ISTP——鉴赏家。你透过拆开再装回去来学习，最好是亲手做。长处：冷静解难、适应力、机械与情境逻辑。注意：无聊与情感对话都会诱使你安静离场；比直觉所说的多留十分钟。",
   "deepEn": "At work you thrive in technical, field and crisis work where judgement beats procedure. In relationships you show care by fixing and doing — pair it with occasional plain statements of feeling.",
   "deepZh": "工作上，你在技术、现场与危机工作中茁壮，那里判断胜过程序。感情上你以修理与行动表达关心——偶尔配上平实的感受表达。"
  },
  "ISFP": {
   "nickEn": "The Adventurer",
   "nickZh": "探险家",
   "en": "ISFP — The Adventurer. You live close to your senses and values, and you express yourself through what you make and how you live. Strengths: aesthetic eye, gentleness, quiet courage about being yourself. Watch-out: conflict avoidance can let small hurts compound; gentle and direct beats gentle and silent.",
   "zh": "ISFP——探险家。你贴近自己的感官与价值生活，并透过所造之物与生活方式表达自己。长处：审美眼光、温柔、做自己的安静勇气。注意：逃避冲突会令小伤害复利；温柔而直接，胜过温柔而沉默。",
   "deepEn": "At work you shine in design, craft, care and any role with tangible, human results. In relationships you are warm and loyal — ask for the space you need instead of disappearing to get it.",
   "deepZh": "工作上，你在设计、手艺、照顾及任何有实在、以人为本结果的岗位上发光。感情上你温暖忠诚——开口要求你需要的空间，而非消失去取得它。"
  },
  "ESTP": {
   "nickEn": "The Entrepreneur",
   "nickZh": "企业家",
   "en": "ESTP — The Entrepreneur. You read the moment and act in it — negotiating, fixing, performing, moving. Strengths: boldness, social radar, crisis composure. Watch-out: consequences arrive on a delay your instincts discount; build one pause into big commitments.",
   "zh": "ESTP——企业家。你读懂当下并在当下行动——谈判、修理、表现、推进。长处：大胆、社交雷达、危机中的镇定。注意：后果会延迟到达，而你的直觉会把它打折；在重大承诺中加入一个停顿。",
   "deepEn": "At work you excel in sales, founding, events and live problem-solving. In relationships you bring fun and momentum — reliability in small promises is what turns excitement into trust.",
   "deepZh": "工作上，你在销售、创业、活动与即时解难上出色。感情上你带来乐趣与 momentum——在小承诺上的可靠，是把兴奋变成信任的关键。"
  },
  "ESFP": {
   "nickEn": "The Entertainer",
   "nickZh": "表演者",
   "en": "ESFP — The Entertainer. You make ordinary moments feel like occasions, and people relax around your warmth. Strengths: presence, generosity, emotional immediacy. Watch-out: applause and novelty can outbid long-term plans; anchor one boring system — money, health or calendar — and let it run itself.",
   "zh": "ESFP——表演者。你令平凡时刻像特别场合，人们在你的温暖旁放松。长处：临场感、慷慨、情绪的即时性。注意：掌声与新鲜感会盖过长期计划； 固定一个无聊的系统——金钱、健康或日程——让它自动运作。",
   "deepEn": "At work you thrive in hosting, sales, performance and people-facing craft. In relationships you are affectionate and fun — choose partners who join the joy and share the planning load.",
   "deepZh": "工作上，你在款待、销售、表演与面向人的手艺上茁壮。感情上你深情又有趣——选择会一同享受、又分担计划负担的伴侣。"
  }
 },
 "DAILY_HORO": {
  "en": [
   " leans into %T today. One practical step before noon beats three plans tonight.",
   " favours %T — keep the schedule loose and the promises precise.",
   " puts %T in the spotlight. Decline one good thing to protect the better one.",
   " rewards %T quietly: check the detail everyone else skimmed.",
   " stirs %T; a short walk resets more than another coffee.",
   " highlights %T. Ask the second question — the first answer was politeness."
  ],
  "zh": [
   " 今日重心在%T。中午前踏出一小步，胜过今晚三个计划。",
   " 今日利于%T——行程放松，承诺要准确。",
   " 今日%T被 spotlight 照亮。婉拒一件好事，守住更好的那件。",
   " 今日静静奖励%T：检查一下别人略过的细节。",
   " 今日搅动%T；散步十分钟，比多一杯咖啡更能重置状态。",
   " 今日凸显%T。多问第二个问题——第一个答案只是礼貌。"
  ]
 },
 "DM_PORTRAIT": [
  {
   "sEn": "Principled, upright and growth-oriented — you commit to a direction and keep reaching",
   "sZh": "有原则、正直、以成长为向——定下方向便持续向上",
   "gEn": "Rigidity when forced to bend — flexibility has to be practised, not assumed",
   "gZh": "被迫弯腰时容易僵硬——柔韧需要刻意练习，不能假设它会自动出现"
  },
  {
   "sEn": "Adaptable, diplomatic and quietly persistent — you find a way around obstacles",
   "sZh": "灵活、善交际、安静地坚持——你总能绕过障碍",
   "gEn": "Flexibility can drift — without a held core direction, bending becomes wandering",
   "gZh": "灵活有时会变成漂流——守不住核心方向，弯曲就会变成漫游"
  },
  {
   "sEn": "Warm, visible and generous with energy — you lift a room by being in it",
   "sZh": "温暖、显眼、慷慨地给予能量——你在场，气氛就被带起",
   "gEn": "Burn-out from being “on” for everyone — pacing and off-time do not happen by themselves",
   "gZh": "为所有人保持「开机」而耗尽——节奏与休息时间不会自己出现"
  },
  {
   "sEn": "Focused, refined and observant — you notice what others miss",
   "sZh": "专注、细腻、观察入微——你留意到别人错过的东西",
   "gEn": "Easily drained by other people's weather — you need shelter and fuel of your own",
   "gZh": "容易被别人的情绪天气耗损——你需要自己的遮挡与燃料"
  },
  {
   "sEn": "Dependable, steady and trusted — people build plans on your word",
   "sZh": "可靠、稳定、值得信赖——别人把计划建在你的承诺上",
   "gEn": "Movement and change — a strength for stability can become a roadblock if nothing ever shifts",
   "gZh": "移动与改变——稳定的长处若从不转移，就会变成路障"
  },
  {
   "sEn": "Nurturing, practical and quietly productive — you keep many small things alive and growing",
   "sZh": "滋养、务实、安静地生产——你令许多小事存活并成长",
   "gEn": "Boundaries — a garden that feeds everyone and is never fed itself turns barren",
   "gZh": "界线——只喂养别人、从不被喂养的花园终会贫瘠"
  },
  {
   "sEn": "Decisive, direct and built for hard tasks — you cut through delay",
   "sZh": "果断、直接、为艰难任务而生——你斩断拖延",
   "gEn": "Choosing your fights — an edge used for everything dulls, and can cut where it should not",
   "gZh": "挑选战场——什么都砍的锋芒会变钝，也会伤及不应伤之处"
  },
  {
   "sEn": "Precise, discerning and quality-focused — you spot flaws early and polish well",
   "sZh": "精准、有鉴别力、重质素——你及早察觉瑕疵并打磨得好",
   "gEn": "Softness — perfectionism and frequent criticism can land harder than you intend",
   "gZh": "柔和——完美主义与频密的批评，会比你预期更重地落在别人身上"
  },
  {
   "sEn": "Resourceful, far-seeing and systems-minded — you find routes around most walls",
   "sZh": "足智多谋、目光远大、以系统思考——你绕得过大多数墙",
   "gEn": "Focus and banks — breadth without one channel at a time floods and finishes less",
   "gZh": "聚焦与河岸——广度若不一次只走一条河道，就会泛滥、完成得更少"
  },
  {
   "sEn": "Perceptive, patient and quietly transformative — you change things drop by drop",
   "sZh": "敏锐、有耐性、安静地带来改变——你一滴一滴改变事情",
   "gEn": "Accumulation and self-belief — your method works slowly, and you can underestimate it and stop too early",
   "gZh": "累积与自信——你的方法见效较慢，你可能低估它而太早停下"
  }
 ],
 "EL_PORTRAIT": {
  "wood": {
   "sEn": "Growth, planning and new starts come naturally — you see how things could develop",
   "sZh": "生长、规划与新开始是你的自然模式——你看得见事物如何发展",
   "gEn": "Wood is your lightest element: starting deliberately, planning ahead and growing in one chosen direction do not switch on by themselves — they need structure in your schedule",
   "gZh": "木是你最弱的五行：刻意开展、预先规划、朝一个选定方向生长，不会自动启动——需要在日程中加入结构",
   "pEn": "Put growth on the calendar: one planning session and one small new start each week, in the same slot, so starting stops depending on mood.",
   "pZh": "把「生长」放上日程：每周固定一个时段做一次规划与一个小的新开始，让开展不再取决于心情。"
  },
  "fire": {
   "sEn": "Visibility, warmth and momentum — you energise people and move things in public",
   "sZh": "被看见、温度与冲劲——你为人注入能量、在公开场合推动事情",
   "gEn": "Fire is your lightest element: being seen, warming a room and building momentum do not come automatically — visibility has to be scheduled, and rest protected, rather than left to chance",
   "gZh": "火是你最弱的五行：被看见、带起气氛与建立势头不会自动出现——要主动安排曝光，并保护休息，而非听天由命",
   "pEn": "Schedule visibility and rest as a pair: one deliberate moment to be seen each week, and protected off-time after it, so momentum does not cost you recovery.",
   "pZh": "把曝光与休息成对安排：每周一次主动被看见的时刻，其后留有受保护的休息，让势头不以恢复为代价。"
  },
  "earth": {
   "sEn": "Stability, care and follow-through — you finish what you start and look after people properly",
   "sZh": "稳定、照顾与完成——你把开始的事做完，也好好照顾人",
   "gEn": "Earth is your lightest element: follow-through, routine and closing loops are your thinner ground — things can stay open and untended unless you build finishing rituals",
   "gZh": "土是你最弱的五行：贯彻、日常规律与收尾是你较薄的地面——若不建立收尾习惯，事情容易一直敞开、无人打理",
   "pEn": "Build a closing ritual: a short weekly review that finishes, files or consciously drops every open loop — follow-through as a system, not a hope.",
   "pZh": "建立收尾习惯：每周一次短回顾，把每个未完的环节完成、归档或有意识地放弃——让贯彻成为系统，而非盼望。"
  },
  "metal": {
   "sEn": "Precision, boundaries and standards — you know what “good enough” should actually mean",
   "sZh": "精准、界线与标准——你清楚「够好」真正应该是什么水平",
   "gEn": "Metal is your lightest element: precision, clear standards and firm boundaries are thinner for you — quality checks and saying no need to be deliberate, not improvised",
   "gZh": "金是你最弱的五行：精准、清晰标准与坚定界线是你较弱的一环——品质检查与说「不」需要刻意为之，不能即兴",
   "pEn": "Write your standards down once — a one-page checklist for your main work and one sentence for your main boundary — so precision and “no” do not depend on willpower in the moment.",
   "pZh": "把标准写下来一次——主要工作一页清单、主要界线一句话——让精准与「不」不再取决于当下的意志力。"
  },
  "water": {
   "sEn": "Reflection, adaptability and recovery — you adjust, sense shifts early and restore well",
   "sZh": "反思、适应与恢复——你懂得调整、及早感知变化、好好恢复",
   "gEn": "Water is your lightest element: reflection, rest and recovery do not happen by themselves — without deliberate stillness you process fast but replenish slowly",
   "gZh": "水是你最弱的五行：反思、休息与恢复不会自动发生——没有刻意的静止，你会处理得快、补给得慢",
   "pEn": "Protect recovery like an appointment: regular stillness — a walk without input, an early night, a quiet morning — booked before the week fills, not fitted in after.",
   "pZh": "像守约一样保护恢复：定期的静止——不接收资讯的散步、早睡一晚、安静的早晨——在周程填满之前先订下，而非事后硬塞。"
  }
 },
 "ENNEA_PORTRAIT": {
  "1": {
   "sEn": "Integrity, reliability and an eye for quality",
   "sZh": "正直、可靠、对质素有眼光",
   "gEn": "An inner critic that never clocks off, and resentment when others seem careless — “good enough, released” is a skill you have to practise",
   "gZh": "一个从不下班的内在批评者，以及别人不认真时积起的怨气——「够好，就放行」是你需要练习的技巧",
   "dEn": "be good, right and principled",
   "dZh": "做得好、做得对、守原则"
  },
  "2": {
   "sEn": "Warmth, generosity and a sharp emotional radar for what people need",
   "sZh": "温暖、慷慨、对别人需要有敏锐的情绪雷达",
   "gEn": "Your own needs — you meet everyone else's first, and yours surface late, sometimes as exhaustion or quiet score-keeping",
   "gZh": "你自己的需要——你先满足所有人，自己的需要迟迟才浮面，有时以疲惫或暗自计较的形式出现",
   "dEn": "be loved and needed",
   "dZh": "被爱、被需要"
  },
  "3": {
   "sEn": "Drive, polish and pragmatic optimism — you set targets and usually hit them",
   "sZh": "干劲、形象与务实的乐观——你定下目标，通常都能达成",
   "gEn": "Being known without performing — image can crowd out self, and rest can feel like falling behind",
   "gZh": "不表演地被了解——形象会挤掉自我，而休息会令你觉得自己在落后",
   "dEn": "succeed and be seen as capable",
   "dZh": "成功、被视为有能力"
  },
  "4": {
   "sEn": "Depth, originality and emotional honesty — nothing generic survives your filter",
   "sZh": "深度、原创与情绪诚实——公式化的东西过不了你的过滤",
   "gEn": "Steady, ordinary follow-through — comparison and withdrawal when misunderstood can stall work that needs plain, repeated steps",
   "gZh": "稳定、平凡的贯彻——比较与在不被理解时退缩，会卡住需要平实、重复步骤的工作",
   "dEn": "be authentic and find what is uniquely yours",
   "dZh": "真实、找到独属于自己的东西"
  },
  "5": {
   "sEn": "Analysis, independence and calm inside complexity",
   "sZh": "分析、独立、在复杂中保持冷静",
   "gEn": "Acting and engaging before you feel fully ready — research can become a shelter, and people can feel shut out",
   "gZh": "在感觉完全准备好之前就行动与参与——研究会变成庇护所，人也会觉得被关在门外",
   "dEn": "understand deeply and be competent",
   "dZh": "深入理解、胜任"
  },
  "6": {
   "sEn": "Loyalty, foresight and steadiness in a crisis — others trust you when it matters",
   "sZh": "忠诚、远见、危机中的稳定——关键时刻别人信任你",
   "gEn": "Trusting your own judgement without another check — anxiety loops and testing people's reliability can replace simply asking and deciding",
   "gZh": "不再三核实就相信自己的判断——焦虑循环与试探别人的可靠，会取代直接开口问与作决定",
   "dEn": "feel secure and supported",
   "dZh": "感到安全、被支持"
  },
  "7": {
   "sEn": "Optimism, versatility and rapid reframing — you generate options and energy",
   "sZh": "乐观、多才、快速转念——你产生选项与能量",
   "gEn": "Staying with discomfort and finishing — the next plan is tempting, and 80-percent finishes pile up",
   "gZh": "与不适相处并把事完成——下一个计划太吸引，完成八成的事会积起来",
   "dEn": "stay happy, free and full of options",
   "dZh": "快乐、自由、选择多多"
  },
  "8": {
   "sEn": "Decisiveness, courage and big-hearted protection of your people",
   "sZh": "果断、勇气、慷慨地保护自己人",
   "gEn": "Vulnerability and softness — intensity can land as intimidation, and being looked after can feel like a debt or a risk",
   "gZh": "脆弱与柔和——强度会被感受为威吓，而被照顾会令你觉得像欠债或冒险",
   "dEn": "stay strong, self-reliant and in control of your own life",
   "dZh": "强大、自立、主宰自己的人生"
  },
  "9": {
   "sEn": "Patience, acceptance and a steady, calming presence",
   "sZh": "耐性、接纳、稳定而令人安心的陪伴",
   "gEn": "Stating your own preference early and out loud — yours surface late or never, and numbness can replace a decision",
   "gZh": "及早、大声说出自己的偏好——你的偏好总迟来甚至不来，麻木会取代决定",
   "dEn": "keep inner and outer peace",
   "dZh": "保持内外和平"
  }
 },
 "LP_PORTRAIT": {
  "1": {
   "gEn": "Collaboration — the lesson of Life Path 1 is learning to ask for help and share the lead, not only to start alone",
   "gZh": "合作——生命灵数 1 的课题是学会求助与分享主导，而非只独自开展"
  },
  "2": {
   "gEn": "Stating needs directly — the lesson of Life Path 2 is asking plainly, not only sensing what others need",
   "gZh": "直接说出需要——生命灵数 2 的课题是平实地开口要求，而非只感知别人的需要"
  },
  "3": {
   "gEn": "Focus and follow-through — the lesson of Life Path 3 is finishing and depth beneath the expression",
   "gZh": "专注与贯彻——生命灵数 3 的课题是完成，以及表达之下的深度"
  },
  "4": {
   "gEn": "Flexibility — the lesson of Life Path 4 is letting a solid system bend without feeling it has failed",
   "gZh": "弹性——生命灵数 4 的课题是让稳固的系统弯曲，而不觉得那是失败"
  },
  "5": {
   "gEn": "Steadiness and commitment — the lesson of Life Path 5 is staying when the novelty fades",
   "gZh": "稳定与承诺——生命灵数 5 的课题是新鲜感退去后仍然留下"
  },
  "6": {
   "gEn": "Boundaries in caring — the lesson of Life Path 6 is tending without carrying everyone",
   "gZh": "照顾中的界线——生命灵数 6 的课题是照料而不背起所有人"
  },
  "7": {
   "gEn": "Trust and openness — the lesson of Life Path 7 is letting people in before every question is answered",
   "gZh": "信任与开放——生命灵数 7 的课题是在所有问题有答案之前，先让人走近"
  },
  "8": {
   "gEn": "Ease with receiving and rest — the lesson of Life Path 8 is that worth is not only what you produce or control",
   "gZh": "安然接受与休息——生命灵数 8 的课题是：价值不只在于你生产或掌控了什么"
  },
  "9": {
   "gEn": "Receiving and holding on lightly — the lesson of Life Path 9 is letting yourself be helped, and not releasing everything too soon",
   "gZh": "接受与轻握——生命灵数 9 的课题是让自己被帮助，以及不要太快放开一切"
  },
  "11": {
   "gEn": "Grounding the signal — the lesson of Master 11 is rest, body and routine beneath heightened intuition",
   "gZh": "让讯号落地——大师数 11 的课题是敏锐直觉之下的休息、身体与日常规律"
  },
  "22": {
   "gEn": "Pacing the vision — the lesson of Master 22 is building at a human speed without shrinking the vision",
   "gZh": "为远见定步速——大师数 22 的课题是以人的速度建造，而不缩小远见"
  },
  "33": {
   "gEn": "Boundaries at scale — the lesson of Master 33 is care that does not consume the carer",
   "gZh": "大规模下的界线——大师数 33 的课题是关怀而不耗尽关怀者"
  }
 },
 "MBTI_LETTER": {
  "E": {
   "en": "you recharge with people and think out loud — ideas form while you speak",
   "zh": "你靠与人相处充电、边说边想——说话时想法才成形"
  },
  "I": {
   "en": "you recharge alone or with one close person and think before you speak",
   "zh": "你靠独处或与一位亲近的人相处充电、先想后说"
  },
  "S": {
   "en": "you trust facts, details and what has actually worked before",
   "zh": "你信任事实、细节与过去实际有效的方法"
  },
  "N": {
   "en": "you trust patterns, possibilities and the big picture first",
   "zh": "你信任模式、可能性、先看全局"
  },
  "T": {
   "en": "you decide by logic and fairness — the same rules for everyone",
   "zh": "你以逻辑与公平作决定——人人同一套规则"
  },
  "F": {
   "en": "you decide by impact on people — how each person will feel",
   "zh": "你以对人的影响作决定——每个人会有什么感受"
  },
  "J": {
   "en": "you plan ahead, decide early and like things finished before the deadline",
   "zh": "你预先计划、及早决定、喜欢在死线前完成"
  },
  "P": {
   "en": "you stay flexible, decide as things unfold and use the deadline as fuel",
   "zh": "你保持弹性、随事情发展再决定、用死线作动力"
  }
 },
 "DG_WISDOM": {
  "en": [
   "Begin before you feel ready — readiness is usually the reward, not the entry fee.",
   "Small, kept promises to yourself compound faster than large, broken ones.",
   "What you feed daily becomes your character; audit the diet, not just the day.",
   "Rest is not the opposite of ambition. It is the part of ambition that lasts.",
   "Say the simple true thing first; decoration can follow if it is still needed.",
   "A season for consolidating is not a season lost — it is where strength is stored.",
   "Notice what keeps returning. The pattern is the message, not the interruption."
  ],
  "zh": [
   "在觉得准备好之前先开始——准备好，通常是奖赏，不是入场费。",
   "对自己许下的小承诺并守住，复利比许下又打破的大承诺更快。",
   "你每天喂养的，会成为你的性格；审视的是日常饮食，不只是某一天。",
   "休息不是野心的相反——它是野心中能持久的那部分。",
   "先说简单而真实的话；修饰若仍有需要，之后再加。",
   "整固的季节不是失去的季节——力量就是在那里储存的。",
   "留意不断回来的事。那个模式就是讯息本身，不是干扰。"
  ]
 },
 "DG_ENCOURAGE": {
  "en": [
   "You do not need a perfect day — you need one honest step, taken before noon.",
   "The work you did quietly is still work. Let it count.",
   "Someone is steadier because you showed up. That is not a small thing.",
   "Progress that survives a bad mood is real progress. Yours qualifies.",
   "You are allowed to be a work in progress and a finished sentence at the same time.",
   "Yesterday's evidence says you can do hard things slowly. Trust the evidence.",
   "Ask for the help you would gladly give. It is the same size."
  ],
  "zh": [
   "你不需要完美的一天——你需要在中午前，踏出一步诚实的步伐。",
   "你安静地做过的工作，依然是工作。让它算数。",
   "有人因为你的出现而更安定。那不是小事。",
   "能在坏心情中存活的进展，是真正的进展。你已经做到了。",
   "你可以同时是进行中的作品，和一句已完成的句子。",
   "昨天的证据说：你能慢慢地做困难的事。相信证据。",
   "开口求你乐意给予别人的那种帮助。它们是同一个份量。"
  ]
 },
 "DG_FOCUS": {
  "en": [
   "One focus for today: finish the smallest unfinished thing on your list, and close it properly.",
   "One focus for today: protect one hour for the work only you can do.",
   "One focus for today: send the message you have been composing in your head since yesterday.",
   "One focus for today: leave one hour unscheduled — and defend it like a meeting.",
   "One focus for today: put one number in writing — a price, a date, a boundary.",
   "One focus for today: tidy the one surface you see first each morning.",
   "One focus for today: name one thing that is finished, and stop improving it."
  ],
  "zh": [
   "今日一个重点：完成你清单上最小的一件未完成之事，并好好收尾。",
   "今日一个重点：保护一小时，做只有你能做的工作。",
   "今日一个重点：把那封自昨天起在脑中写着的讯息，真正发出去。",
   "今日一个重点：留一小时空白——并像守住一场会议一样守住它。",
   "今日一个重点：把一个数字写下来——一个价钱、一个日期、一条界线。",
   "今日一个重点：整理你每天早上第一眼看到的那个表面。",
   "今日一个重点：点名一件已完成的事，并停止再改进它。"
  ]
 },
 "DG_THEMES": {
  "en": [
   "Words of wisdom & encouragement",
   "Tarot — one card for the day",
   "Horoscope — your sign today",
   "Yi-Jing — hexagram of the day",
   "Encouragement & a practical focus",
   "Numerology & element balance",
   "Weekly reflection"
  ],
  "zh": [
   "智慧语与鼓励",
   "塔罗——今日一张牌",
   "星座——你今日的运势",
   "易经——今日一卦",
   "鼓励与一个实际重点",
   "数字命理与五行平衡",
   "每周反思"
  ]
 },
 "DG_PERIODS": {
  "30": {
   "en": "30 days",
   "zh": "30 天"
  },
  "90": {
   "en": "90 days",
   "zh": "90 天"
  },
  "circle": {
   "en": "while your Circle membership is active",
   "zh": "会员有效期间"
  }
 }
};
