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
   "龍"
  ],
  [
   "Snake",
   "蛇"
  ],
  [
   "Horse",
   "馬"
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
   "雞"
  ],
  [
   "Dog",
   "狗"
  ],
  [
   "Pig",
   "豬"
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
   "zh": "雙子座",
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
   "zh": "獅子座",
   "sym": "♌",
   "d": "Jul 23 – Aug 22"
  },
  {
   "en": "Virgo",
   "zh": "處女座",
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
   "zh": "天蠍座",
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
   "zh": "雙魚座",
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
   "Aries": "衝勁與率先行動",
   "Taurus": "穩定與實在的成果",
   "Gemini": "好奇心與溝通",
   "Cancer": "家、記憶與守護",
   "Leo": "被看見與慷慨的溫度",
   "Virgo": "手藝、秩序與實用的細節",
   "Libra": "夥伴關係與平衡",
   "Scorpio": "深度、私密與蛻變",
   "Sagittarius": "遠方、旅行與大問題",
   "Capricorn": "結構與長線佈局",
   "Aquarius": "原創性與群體思維",
   "Pisces": "直覺、夢境與慈悲"
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
   "魔術師",
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
   "戀人",
   "💞",
   "choice, union, values",
   "The real question is not who or what — it is which value you refuse to trade away."
  ],
  [
   "VII",
   "The Chariot",
   "戰車",
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
   "隱者",
   "🏮",
   "solitude, inner light",
   "Withdraw briefly on purpose. The answer is quieter than the noise around it."
  ],
  [
   "X",
   "Wheel of Fortune",
   "命運之輪",
   "🎡",
   "cycles, turning points",
   "The wheel is mid-turn. Do not sign long contracts with a temporary season."
  ],
  [
   "XI",
   "Justice",
   "正義",
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
   "節制",
   "🏺",
   "blending, moderation, timing",
   "Mix the two things slowly. The middle path here is a skill, not a compromise."
  ],
  [
   "XV",
   "The Devil",
   "惡魔",
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
   "太陽",
   "☀️",
   "clarity, joy, plain success",
   "Say the simple true thing. Visibility helps you now, it does not hurt."
  ],
  [
   "XX",
   "Judgement",
   "審判",
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
   "風",
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
   "澤",
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
    "坤為地"
   ],
   [
    15,
    "Modesty",
    "地山謙"
   ],
   [
    8,
    "Holding Together",
    "水地比"
   ],
   [
    20,
    "Contemplation",
    "風地觀"
   ],
   [
    16,
    "Enthusiasm",
    "雷地豫"
   ],
   [
    35,
    "Progress",
    "火地晉"
   ],
   [
    45,
    "Gathering Together",
    "澤地萃"
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
    "山地剝"
   ],
   [
    52,
    "Keeping Still",
    "艮為山"
   ],
   [
    4,
    "Youthful Folly",
    "山水蒙"
   ],
   [
    18,
    "Work on the Decayed",
    "山風蠱"
   ],
   [
    27,
    "Nourishment",
    "山雷頤"
   ],
   [
    22,
    "Grace",
    "山火賁"
   ],
   [
    41,
    "Decrease",
    "山澤損"
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
    "地水師"
   ],
   [
    39,
    "Obstruction",
    "水山蹇"
   ],
   [
    29,
    "The Abysmal",
    "坎為水"
   ],
   [
    59,
    "Dispersion",
    "風水渙"
   ],
   [
    3,
    "Difficulty at the Beginning",
    "水雷屯"
   ],
   [
    64,
    "Before Completion",
    "火水未濟"
   ],
   [
    47,
    "Oppression",
    "澤水困"
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
    "地風升"
   ],
   [
    53,
    "Gradual Progress",
    "風山漸"
   ],
   [
    48,
    "The Well",
    "水風井"
   ],
   [
    57,
    "The Gentle",
    "巽為風"
   ],
   [
    42,
    "Increase",
    "風雷益"
   ],
   [
    50,
    "The Cauldron",
    "火風鼎"
   ],
   [
    28,
    "Great Excess",
    "澤風大過"
   ],
   [
    9,
    "Small Taming",
    "風天小畜"
   ]
  ],
  [
   [
    24,
    "Return",
    "地雷復"
   ],
   [
    62,
    "Small Excess",
    "雷山小過"
   ],
   [
    40,
    "Deliverance",
    "雷水解"
   ],
   [
    32,
    "Duration",
    "雷風恆"
   ],
   [
    51,
    "The Arousing",
    "震為雷"
   ],
   [
    55,
    "Abundance",
    "雷火豐"
   ],
   [
    54,
    "The Marrying Maiden",
    "雷澤歸妹"
   ],
   [
    34,
    "Great Power",
    "雷天大壯"
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
    "水火既濟"
   ],
   [
    37,
    "The Family",
    "風火家人"
   ],
   [
    21,
    "Biting Through",
    "火雷噬嗑"
   ],
   [
    30,
    "The Clinging",
    "離為火"
   ],
   [
    38,
    "Opposition",
    "火澤睽"
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
    "地澤臨"
   ],
   [
    31,
    "Influence",
    "澤山咸"
   ],
   [
    60,
    "Limitation",
    "水澤節"
   ],
   [
    61,
    "Inner Truth",
    "風澤中孚"
   ],
   [
    17,
    "Following",
    "澤雷隨"
   ],
   [
    49,
    "Revolution",
    "澤火革"
   ],
   [
    58,
    "The Joyous",
    "兌為澤"
   ],
   [
    43,
    "Breakthrough",
    "澤天夬"
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
    "天水訟"
   ],
   [
    44,
    "Coming to Meet",
    "天風姤"
   ],
   [
    25,
    "Innocence",
    "天雷無妄"
   ],
   [
    13,
    "Fellowship",
    "天火同人"
   ],
   [
    10,
    "Treading",
    "天澤履"
   ],
   [
    1,
    "The Creative",
    "乾為天"
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
   "1": "純粹的進取——開始，但要控制力度。",
   "2": "承載與配合——以柔韌成事。",
   "3": "萌芽遇阻——秩序慢慢成形，宜借助外力。",
   "4": "誠實的無知——請教、聆聽，不裝懂。",
   "5": "有養分的等待——雨未至，先準備。",
   "6": "爭端升溫——和解勝於全勝。",
   "7": "有組織的行動——紀律與清晰的分工。",
   "8": "結盟——及早找到對的人靠攏。",
   "9": "小處的節制與累積——把小事打磨好。",
   "10": "在虎尾邊行走——禮貌與謹慎保平安。",
   "11": "天地交泰——窗口大開，順勢而行。",
   "12": "閉塞——收斂保存，不要硬推。",
   "13": "公開的同盟——以共同目標聚人。",
   "14": "豐盛而謙——資源充足，更要謙遜。",
   "15": "山在地中——低調而長久。",
   "16": "雷出地上——定下節奏，人自然跟上。",
   "17": "順勢——在對的時候跟對的方向。",
   "18": "整治腐壞——直接面對老問題。",
   "19": "好事臨近——以仁厚監臨其成長。",
   "20": "退後看全局——先看清，再行動。",
   "21": "咬斷阻礙——果斷決定，清楚執行。",
   "22": "文飾——形式重要，但別把包裝當內容。",
   "23": "由下而上的侵蝕——別在崩塌處建設。",
   "24": "轉折點——微光回來，回到源頭。",
   "25": "無心之行——誠實、不盤算的行動反而有效。",
   "26": "蓄勢——現在收住，日後釋放。",
   "27": "看你餵養什麼——身體、心智與圈子。",
   "28": "樑木受壓——重新分配重量，或離開。",
   "29": "重險——保持誠信，在風險中前行。",
   "30": "如火之明——依附光源，穩定發亮。",
   "31": "感應——以開放打動對方。",
   "32": "長久之道——靠每日更新，而非衝刺。",
   "33": "策略性退後——在被推之前先退。",
   "34": "力量頂峰——力量必須守在正道之內。",
   "35": "日出地上——在光天化日下晉升、被看見。",
   "36": "明受其傷——保護內在的光，低調行事。",
   "37": "家內有序——先整頓內部角色。",
   "38": "火澤相違——有建設性的分歧，找小的共同點。",
   "39": "前有大山——繞路，並尋求幫助。",
   "40": "結鬆開了——放下、寬恕、乾淨收尾。",
   "41": "減損——真誠的簡樸，為日後的增益儲蓄。",
   "42": "風雷相益——乘上升之勢，也讓別人受惠。",
   "43": "公開決斷——在日光下解決，不帶惡意。",
   "44": "不期而遇的強勢相遇——別讓它無聲無息地生根。",
   "45": "聚眾於中心——團結中也要防意外。",
   "46": "拾級而上——小努力疊加，也能登高。",
   "47": "澤中無水——言語無力，以行動與耐力說話。",
   "48": "眾人汲取的源頭——維護它，它不隨潮流搬遷。",
   "49": "時節已轉——時機真正成熟時，公開地改變秩序。",
   "50": "以禮養物——你承載事物的方式，改變事物的本質。",
   "51": "雷震——驚擾到來時保持鎮定，不失手中之重。",
   "52": "適時的靜止——止，也是行動。",
   "53": "山上有木——緩慢、紮根、按次序成長。",
   "54": "以非主位入局——誠實接受位置，否則婉拒。",
   "55": "日中之盛——豐盛到頂，享受而不試圖凍結它。",
   "56": "異鄉之旅——輕裝、謹慎，暫不落戶。",
   "57": "風行——以柔和而持續的方式滲透。",
   "58": "澤相悅——共享的喜悅與坦誠減輕負擔。",
   "59": "冰消牆解——以共同之物重新聚人。",
   "60": "健康的界線——保護流動，而非扼殺它。",
   "61": "內在誠信——真誠能抵達意想不到的心。",
   "62": "小事過用心——低調精準，不作大姿態。",
   "63": "事已成——成功之後的一刻，最需要謹慎。",
   "64": "臨渡未渡——最後幾步定成敗，別趕結尾。"
  }
 },
 "FOCUS_LABEL": {
  "career": {
   "en": "Career & work",
   "zh": "事業與工作"
  },
  "love": {
   "en": "Love & relationships",
   "zh": "感情與關係"
  },
  "wealth": {
   "en": "Money & wealth",
   "zh": "財富與金錢"
  },
  "health": {
   "en": "Health & energy",
   "zh": "健康與精力"
  },
  "general": {
   "en": "General direction",
   "zh": "整體方向"
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
   "1": "領袖型——獨立、主動、自力更生。你在「開始」中學習。",
   "2": "外交型——夥伴、耐心、敏感。你在「聆聽」中學習。",
   "3": "創造型——表達、樂觀、文字。你在「創作與分享」中學習。",
   "4": "建造型——秩序、耐力、手藝。你在「完成」中學習。",
   "5": "旅人型——自由、變化、體驗。你在「移動」中學習。",
   "6": "守護型——責任、照顧、家。你在「照料」中學習。",
   "7": "探索型——分析、深度、獨處。你在「提問」中學習。",
   "8": "掌舵型——力量、資源、成果。你在「駕馭現實世界」中學習。",
   "9": "博愛型——慈悲、放下、大局。你在「放手」中學習。",
   "11": "大師數 11——照亮者：直覺敏銳，是 2 號的敏感加上更強的訊號。",
   "22": "大師數 22——大師建造者：以遠見的規模實踐 4 號的手藝。",
   "33": "大師數 33——大師教師：把 6 號的照顧，擴展到許多人。"
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
   "逆位：躍進前的遲疑——先正視你一直揮手略過的實際風險，再小步跳。",
   "逆位：工具散亂、樣樣半途——先完成一件事，再召喚下一件。",
   "逆位：有事被隱瞞，對你或由你——在它浮面之前不要簽署。",
   "逆位：過度照料或創作阻塞——休息與界線，才是這裡的肥料。",
   "逆位：僵化或權力拉鋸——鬆開那條正在製造摩擦的規則。",
   "逆位：質疑一條繼承而來的信念——反叛或順從之前，先廣泛研讀。",
   "逆位：價值錯位或抉擇拖延——先說清你絕不交換的東西，再決定。",
   "逆位：失去方向或兩股力量相爭——停下，重新瞄準，再出發。",
   "逆位：不耐煩或暗自懷疑——溫柔的方法需要更多時間，不是更大力氣。",
   "逆位：逃避獨處——內在的答案正被人群與噪音淹沒。",
   "逆位：抗拒已經發生的轉變——配合新的季節，而不是舊的。",
   "逆位：一筆未清的帳——即使對話尷尬，也要把失衡糾正過來。",
   "逆位：在停頓中焦躁——新的角度尚未落定，再靜一會兒。",
   "逆位：抓緊已結束之物——放手只是延遲，不是取消。",
   "逆位：失衡或時行時止的節奏——慢慢調配比例，不要在極端之間擺盪。",
   "逆位：開始看清那條鎖鏈——習慣一旦被說出口，就會鬆動。",
   "逆位：險險避過崩塌，或殘局未清——檢查這次震盪揭示了什麼。",
   "逆位：希望變暗或復原緩慢——光是真的，只是還遠；保持每日的步伐。",
   "逆位：焦慮、夢境鮮明、半真半假——等天光再判斷你所恐懼的。",
   "逆位：喜悅被壓低或成功被淡化——讓自己被看見，不要縮小好消息。",
   "逆位：一個舊召喚被忽視——清算會一直回來，直到你誠實回應。",
   "逆位：圈子差一點才閉合——一個未完成的小節，正卡住整件事的完成。"
  ]
 },
 "TAROT_POS": {
  "en": [
   "In the Past position, this card names the root: the pattern, event or habit that set your question in motion. Read it as cause, not blame.",
   "In the Present position, this card is the live energy around you right now — the force to work with this week, not someday.",
   "In the Path position, this card shows the direction events lean if nothing changes — an invitation to steer, not a fixed fate."
  ],
  "zh": [
   "在「過去」位置，這張牌指出根源：令你的問題啟動的那個模式、事件或習慣。把它讀作因由，而非責怪。",
   "在「現在」位置，這張牌是你此刻身邊正在運作的能量——是這一週就要配合的力量，不是某一天。",
   "在「路徑」位置，這張牌顯示若一切不變，事情傾向走向的方向——是邀請你掌舵，不是既定的命運。"
  ]
 },
 "DAYMASTER_TXT": [
  {
   "en": "Yang Wood (甲) grows like a tree: upright, principled and always reaching upward. You do best with a clear direction and room to grow, and worst when forced into constant bending. Your lesson is flexibility — a tree that cannot sway snaps in the storm.",
   "zh": "甲木如大樹：正直、有原則、永遠向上生長。有清晰方向與成長空間時你表現最好，被迫不斷彎腰時最差。你的課題是柔韌——不能搖擺的樹，會在風暴中折斷。"
  },
  {
   "en": "Yin Wood (乙) is the vine and the flower stem: adaptable, diplomatic and quietly persistent. You win by winding around obstacles rather than charging them. Your lesson is to hold a core direction while you bend, so flexibility does not become drift.",
   "zh": "乙木如藤蔓與花莖：靈活、外交手腕好、安靜地堅持。你以繞過障礙取勝，而非硬衝。你的課題是彎曲時仍守住核心方向，令靈活不變成漂流。"
  },
  {
   "en": "Yang Fire (丙) is the sun: warm, visible and generous with energy for everyone in range. You lead by presence and optimism. Your lesson is pacing — the sun that tries to shine all night burns out and lights nothing.",
   "zh": "丙火如太陽：溫暖、顯眼、慷慨地把能量給予範圍內的每個人。你以存在感與樂觀帶領別人。你的課題是節奏——想整夜發光的太陽，只會耗盡自己、照亮不了什麼。"
  },
  {
   "en": "Yin Fire (丁) is the candle flame: focused, refined and quietly illuminating. You notice what others miss and give steady, personal warmth. Your lesson is protection — small flames need shelter from other people's weather, and fuel of your own.",
   "zh": "丁火如燭光：專注、細膩、安靜地照亮。你留意到別人錯過的東西，給予穩定而親近的溫暖。你的課題是保護——小火焰需要遮擋別人的風雨，也需要自己的燃料。"
  },
  {
   "en": "Yang Earth (戊) is the mountain: dependable, immovable and trusted by everyone. People build plans on your steadiness. Your lesson is movement — a mountain that never shifts becomes a roadblock, so schedule change before life imposes it.",
   "zh": "戊土如高山：可靠、不動搖、人人信賴。別人把計劃建在你的穩定之上。你的課題是移動——從不移動的山會變成路障，所以要在生活強加改變之前，先為自己安排變化。"
  },
  {
   "en": "Yin Earth (己) is the garden soil: nurturing, practical and quietly productive. You make other people's growth possible and keep many small things alive. Your lesson is boundaries — a garden that feeds everyone and is never fed itself turns barren.",
   "zh": "己土如園土：滋養、務實、安靜地生產。你成就別人的成長，養活許多小事。你的課題是界線——只餵養別人、從不被餵養的花園，終會貧瘠。"
  },
  {
   "en": "Yang Metal (庚) is the sword and the ore: decisive, direct and built for hard tasks. You cut through delay and say what others avoid. Your lesson is tempering — a blade used for everything dulls; choose which fights deserve your edge.",
   "zh": "庚金如刀劍與礦石：果斷、直接、為艱難任務而生。你斬斷拖延，說出別人迴避的話。你的課題是淬煉——什麼都砍的刀會變鈍；要挑選哪些仗值得你的鋒芒。"
  },
  {
   "en": "Yin Metal (辛) is the jewel: precise, discerning and quietly proud of quality. You refine, polish and notice flaws early. Your lesson is softness — a jewel does not need to prove hardness daily, and criticism lands better when it is rare.",
   "zh": "辛金如珠寶：精準、有鑑別力、安靜地以質素自豪。你提煉、打磨、及早察覺瑕疵。你的課題是柔和——珠寶不必每天證明硬度，而批評愈少出現，愈有份量。"
  },
  {
   "en": "Yang Water (壬) is the river and the sea: resourceful, far-seeing and hard to contain. You think in systems and routes, and find a way around most walls. Your lesson is banks — a river without edges floods; give your breadth one channel at a time.",
   "zh": "壬水如江海：足智多謀、目光遠大、難以圍堵。你以系統與路線思考，繞得過大多數牆。你的課題是河岸——沒有邊的水會泛濫；讓你的廣度一次只走一條河道。"
  },
  {
   "en": "Yin Water (癸) is rain and dew: perceptive, patient and quietly transformative. You change things drop by drop and sense shifts before they are spoken. Your lesson is accumulation — do not underestimate your method; steady rain is what fills reservoirs.",
   "zh": "癸水如雨露：敏銳、耐性、安靜地帶來改變。你一滴一滴改變事情，在言語之前已感知變化。你的課題是累積——不要低估自己的方法；水庫就是靠持續的雨水注滿的。"
  }
 ],
 "EL_TXT": {
  "wood": {
   "en": "Wood is growth, planning and new starts",
   "zh": "木主生長、規劃與新開始"
  },
  "fire": {
   "en": "Fire is visibility, warmth and momentum",
   "zh": "火主被看見、溫度與衝勁"
  },
  "earth": {
   "en": "Earth is stability, care and follow-through",
   "zh": "土主穩定、照顧與完成"
  },
  "metal": {
   "en": "Metal is precision, boundaries and standards",
   "zh": "金主精準、界線與標準"
  },
  "water": {
   "en": "Water is reflection, adaptability and recovery",
   "zh": "水主反思、適應與恢復"
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
   "1": "個人年 1——新開始。用心播種；現在開始的事，會走一個九年週期。",
   "2": "個人年 2——耐性與夥伴關係。經營關係，不要強求結果。",
   "3": "個人年 3——表達與社交能量。開口說、發表、聚人。",
   "4": "個人年 4——建設與秩序。修好根基、系統與健康習慣。",
   "5": "個人年 5——改變與移動。預期計劃會被改寫；輕裝上路。",
   "6": "個人年 6——責任與家。承諾加深；要有意識地選擇它們。",
   "7": "個人年 7——反思與研習。較安靜、向內的一年；簽約前先研究。",
   "8": "個人年 8——力量與金錢。談判、合理收費、認領成果。",
   "9": "個人年 9——完成與放下。收尾、寬恕、清空空間迎接下一個週期。"
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
   "初爻（根基）：事情剛開始——你如何入局，決定一切。此爻變，代表根基本身在移動。",
   "二爻（內卦中位）：你在局內的行止——守中正；此爻變，先動的是你自己的做法。",
   "三爻（門檻）：內外之間的危險交界——宜謹慎；此爻變，警告硬推會有摩擦。",
   "四爻（入外場）：你開始接近有影響力的人——宜開放承接；此爻變，你在他們之間的位置會改。",
   "五爻（君位）：事情的核心、決策落點——此爻變，整個結果都會動。",
   "上爻（頂點）：事情已完成或過度——此爻變，代表過極而反；要懂得停。"
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
   "6": "老陰（6）——三字：一條陰爻，正在變為陽。局勢中柔順、退讓的部分，即將變得堅定。",
   "7": "少陽（7）——二字一背：一條穩定的陽爻。踏實向前、維持不變的能量。",
   "8": "少陰（8）——二背一字：一條穩定的陰爻。開放、承接、維持不變的能量。",
   "9": "老陽（9）——三字：一條陽爻，正在變為陰。局勢中強勢的部分，即將柔和、退讓。"
  }
 },
 "ENNEA_Q": [
  {
   "q": {
    "en": "When something goes wrong, my first instinct is to…",
    "zh": "當事情出錯時，我的第一反應是……"
   },
   "opts": [
    {
     "t": 1,
     "en": "Fix it properly and work out what should have been done",
     "zh": "把它妥善做好，想清楚本來應該怎樣做"
    },
    {
     "t": 2,
     "en": "Check how the people involved are feeling",
     "zh": "先看看相關的人感受如何"
    },
    {
     "t": 3,
     "en": "Focus on the outcome — what does success look like now?",
     "zh": "聚焦結果——現在怎樣才算成功？"
    }
   ]
  },
  {
   "q": {
    "en": "The criticism that would sting me most is…",
    "zh": "最刺痛我的批評是……"
   },
   "opts": [
    {
     "t": 4,
     "en": "That I am ordinary, with nothing distinctive to offer",
     "zh": "說我平凡、沒有什麼獨特之處"
    },
    {
     "t": 5,
     "en": "That I am intrusive or demand too much of people",
     "zh": "說我打擾別人、或要求太多"
    },
    {
     "t": 6,
     "en": "That I cannot be relied on when it matters",
     "zh": "說我在關鍵時刻靠不住"
    }
   ]
  },
  {
   "q": {
    "en": "On a free weekend, I most want…",
    "zh": "一個空閒週末，我最想……"
   },
   "opts": [
    {
     "t": 7,
     "en": "Options — new places, new people, something I have not tried",
     "zh": "保持選擇開放——新地方、新朋友、沒試過的事"
    },
    {
     "t": 8,
     "en": "To be in charge of my own time, answerable to no one",
     "zh": "自己時間自己話事，不用向任何人交代"
    },
    {
     "t": 9,
     "en": "Calm — no demands, no conflict, everyone relaxed",
     "zh": "平靜——沒有要求、沒有衝突、人人放鬆"
    }
   ]
  },
  {
   "q": {
    "en": "In a group project, I naturally become the one who…",
    "zh": "在小組項目中，我自然會成為那個……"
   },
   "opts": [
    {
     "t": 1,
     "en": "Sets the standard and quietly corrects the details",
     "zh": "定下標準、安靜地修正細節的人"
    },
    {
     "t": 5,
     "en": "Researches deeply before saying much",
     "zh": "先深入研究、很少先開口的人"
    },
    {
     "t": 9,
     "en": "Keeps the peace so everyone can keep working",
     "zh": "維持和氣、讓大家能繼續做事的人"
    }
   ]
  },
  {
   "q": {
    "en": "I feel most valued when people…",
    "zh": "當別人這樣對我時，我最感到被重視……"
   },
   "opts": [
    {
     "t": 2,
     "en": "Genuinely need me and say so",
     "zh": "真心需要我，並且說出口"
    },
    {
     "t": 6,
     "en": "Trust me and include me in the inner circle",
     "zh": "信任我、把我納入核心圈子"
    },
    {
     "t": 7,
     "en": "Join my plans and bring energy to them",
     "zh": "加入我的計劃、為它帶來能量"
    }
   ]
  },
  {
   "q": {
    "en": "Under pressure, my biggest trap is…",
    "zh": "在壓力下，我最大的陷阱是……"
   },
   "opts": [
    {
     "t": 3,
     "en": "Becoming image-focused — looking successful matters too much",
     "zh": "太在意形象——看起來成功變得太重要"
    },
    {
     "t": 4,
     "en": "Withdrawing and dwelling on what is missing",
     "zh": "退縮、反覆想著缺失的部分"
    },
    {
     "t": 8,
     "en": "Taking over and pushing harder than the situation needs",
     "zh": "接管一切、比局勢所需推得更硬"
    }
   ]
  },
  {
   "q": {
    "en": "Before a big decision, I usually…",
    "zh": "做重大決定之前，我通常會……"
   },
   "opts": [
    {
     "t": 1,
     "en": "Weigh what is right and principled, even if it is harder",
     "zh": "衡量什麼是正確、有原則的，即使更難"
    },
    {
     "t": 6,
     "en": "Run the worst cases and check with people I trust",
     "zh": "先想最壞情況，再問我信任的人"
    },
    {
     "t": 8,
     "en": "Decide fast and trust my gut over endless analysis",
     "zh": "快速決定，信直覺多於無止境分析"
    }
   ]
  },
  {
   "q": {
    "en": "What I most want people to understand about me is…",
    "zh": "我最想別人明白我的是……"
   },
   "opts": [
    {
     "t": 2,
     "en": "How much I quietly do for the people I care about",
     "zh": "我為在乎的人，安靜地做了多少"
    },
    {
     "t": 4,
     "en": "That my inner world is deeper than I usually show",
     "zh": "我的內心世界，比我平時表現的深得多"
    },
    {
     "t": 9,
     "en": "That I have views too, even when I do not push them",
     "zh": "即使我不強推，我也是有看法的"
    }
   ]
  },
  {
   "q": {
    "en": "My ideal way to recharge is…",
    "zh": "我最理想的充電方式是……"
   },
   "opts": [
    {
     "t": 3,
     "en": "Achieving something visible, then resting properly",
     "zh": "先完成一件看得見的事，再好好休息"
    },
    {
     "t": 5,
     "en": "Time alone with a book, a problem, or my own thoughts",
     "zh": "獨處——一本書、一個問題、或自己的思緒"
    },
    {
     "t": 7,
     "en": "Variety — a trip, a new skill, a plan for the next adventure",
     "zh": "多樣性——一趟旅行、一項新技能、下一個冒險的計劃"
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
    "zh": "核心動力：做得好、做得對、守原則。你看得見事情可以更好，並覺得自己有責任收窄那個差距。長處：正直、可靠、對質素有眼光。注意：一個從不下班的內在批評者，以及別人不認真時積起的怨氣。"
   },
   "deep": {
    "en": "Under stress you borrow Type 4 patterns — withdrawing and feeling uniquely burdened. In growth you borrow Type 7 lightness — spontaneity, humour, permission to enjoy. At work: give feedback as an invitation, not a verdict. In love: say the need plainly instead of letting correctness speak for it.",
    "zh": "壓力下你會借用 4 號模式——退縮、覺得只有自己在承受。成長時你借用 7 號的輕盈——自發、幽默、允許自己享受。工作上：把意見當邀請提出，而非判決。感情上：直接說出需要，不要讓「正確」代替你說話。"
   }
  },
  "2": {
   "nameEn": "The Helper",
   "nameZh": "助人者",
   "core": {
    "en": "Core drive: to be loved and needed. You track other people's needs almost automatically and meet them before being asked. Strengths: warmth, generosity, emotional radar. Watch-out: helping with invisible strings attached, and neglecting your own needs until they erupt.",
    "zh": "核心動力：被愛、被需要。你幾乎自動地追蹤別人的需要，並在對方開口前已滿足。長處：溫暖、慷慨、情緒雷達敏銳。注意：帶著隱形條件的幫助，以及忽略自己的需要直到爆發。"
   },
   "deep": {
    "en": "Under stress you borrow Type 8 force — blunt, controlling, keeping score. In growth you borrow Type 4 honesty — naming your own feelings and needs directly. At work: let people carry their share. In love: ask, do not hint; receive without immediately repaying.",
    "zh": "壓力下你會借用 8 號的力量——直接、控制、計較付出。成長時你借用 4 號的誠實——直接說出自己的感受與需要。工作上：讓別人承擔他們的一份。感情上：開口要求，不要暗示；接受時不必立刻回報。"
   }
  },
  "3": {
   "nameEn": "The Achiever",
   "nameZh": "成就者",
   "core": {
    "en": "Core drive: to be successful and seen as capable. You adapt quickly, set targets and usually hit them. Strengths: drive, polish, pragmatic optimism. Watch-out: confusing your image with yourself, and workaholism dressed up as ambition.",
    "zh": "核心動力：成功、被視為有能力。你適應快、定下目標、通常都能達成。長處：幹勁、形象、務實的樂觀。注意：把形象與自我混淆，以及包裝成上進心的工作狂。"
   },
   "deep": {
    "en": "Under stress you borrow Type 9 shutdown — going numb and coasting. In growth you borrow Type 6 loyalty — committing to people and causes beyond your own scoreboard. At work: share credit early. In love: be known without performing; let someone see an unpolished day.",
    "zh": "壓力下你會借用 9 號的關機模式——麻木、滑行。成長時你借用 6 號的忠誠——為自己成績表以外的人與事作出承諾。工作上：及早分享功勞。感情上：不表演地被了解；讓某人看見你不修飾的一天。"
   }
  },
  "4": {
   "nameEn": "The Individualist",
   "nameZh": "自我型 / 藝術型",
   "core": {
    "en": "Core drive: to be authentic and find what is uniquely yours. You feel things deeply and resist anything generic. Strengths: depth, originality, emotional honesty. Watch-out: comparing your insides to other people's outsides, and withdrawing when you feel misunderstood.",
    "zh": "核心動力：真實、找到獨屬於自己的東西。你感受深刻，抗拒一切公式化。長處：深度、原創、情緒誠實。注意：拿自己的內心與別人的外表比較，以及感到不被理解時退縮。"
   },
   "deep": {
    "en": "Under stress you borrow Type 2 cling — over-involving yourself in other people's feelings. In growth you borrow Type 1 discipline — turning feeling into finished, principled work. At work: ship the imperfect version. In love: say what you need in plain words, not only in atmosphere.",
    "zh": "壓力下你會借用 2 號的依附——過度捲入別人的感受。成長時你借用 1 號的紀律——把感受變成完成、有原則的作品。工作上：先交出不完美的版本。感情上：用平實的語言說出需要，不要只靠氛圍傳達。"
   }
  },
  "5": {
   "nameEn": "The Investigator",
   "nameZh": "探索者 / 觀察者",
   "core": {
    "en": "Core drive: to understand and to be competent. You conserve energy, observe first and speak when it counts. Strengths: analysis, independence, calm in complexity. Watch-out: withdrawing into research instead of acting, and guarding time so tightly that people feel shut out.",
    "zh": "核心動力：理解、勝任。你保存能量、先觀察、在關鍵時才開口。長處：分析、獨立、在複雜中保持冷靜。注意：退入研究代替行動，以及把時間守得太緊，令人覺得被關在門外。"
   },
   "deep": {
    "en": "Under stress you borrow Type 7 scatter — restless, jumping between interests. In growth you borrow Type 8 presence — engaging directly and deciding in the room. At work: share drafts early. In love: presence is the gift; schedule it like you mean it.",
    "zh": "壓力下你會借用 7 號的散亂——坐立不安、在興趣之間跳躍。成長時你借用 8 號的臨場感——直接參與、當場決定。工作上：及早分享草稿。感情上：陪伴就是禮物；認真地把它排進日程。"
   }
  },
  "6": {
   "nameEn": "The Loyalist",
   "nameZh": "忠誠者",
   "core": {
    "en": "Core drive: to be secure and supported. You scan for what could go wrong and prepare for it, which makes you the person others trust in a crisis. Strengths: loyalty, foresight, dry humour under pressure. Watch-out: anxiety loops and testing people's reliability instead of simply asking.",
    "zh": "核心動力：安全、被支持。你掃描可能出錯的地方並預先準備，因此在危機中你是別人信任的人。長處：忠誠、遠見、壓力下的冷幽默。注意：焦慮循環，以及試探別人的可靠性，而非直接開口問。"
   },
   "deep": {
    "en": "Under stress you borrow Type 3 image-management — busy, performative coping. In growth you borrow Type 9 calm — trusting that most feared outcomes will not arrive. At work: decide with the evidence you have. In love: name the fear once, clearly, instead of auditing the relationship.",
    "zh": "壓力下你會借用 3 號的形象管理——忙碌、表演式的應對。成長時你借用 9 號的平靜——相信大多數恐懼的結果不會發生。工作上：用手上的證據做決定。感情上：把恐懼清楚說一次，而不是審計這段關係。"
   }
  },
  "7": {
   "nameEn": "The Enthusiast",
   "nameZh": "熱情者 / 享樂型",
   "core": {
    "en": "Core drive: to be happy, free and full of options. You generate ideas and energy wherever you land. Strengths: optimism, versatility, rapid reframing. Watch-out: fleeing discomfort into the next plan, and leaving a trail of 80-percent finishes.",
    "zh": "核心動力：快樂、自由、選擇多多。你去到哪裡都帶來點子和能量。長處：樂觀、多才、快速轉念。注意：逃避不適、奔向下一個計劃，以及留下一串完成八成的事。"
   },
   "deep": {
    "en": "Under stress you borrow Type 1 criticism — suddenly rigid and fault-finding. In growth you borrow Type 5 depth — finishing, focusing, sitting with one thing. At work: one flagship project at a time. In love: stay for the ordinary Tuesdays, not only the highlights.",
    "zh": "壓力下你會借用 1 號的批評——突然僵硬、挑剔。成長時你借用 5 號的深度——完成、專注、與一件事相處。工作上：同一時間只推一個旗艦項目。感情上：留下來過平凡的星期二，不只過精彩時刻。"
   }
  },
  "8": {
   "nameEn": "The Challenger",
   "nameZh": "挑戰者 / 領袖型",
   "core": {
    "en": "Core drive: to be strong, self-reliant and in control of your own life. You protect your people fiercely and confront problems head-on. Strengths: decisiveness, courage, big-hearted protection. Watch-out: intensity that lands as intimidation, and treating vulnerability as a security risk.",
    "zh": "核心動力：強大、自立、主宰自己的人生。你全心全意保護自己人，正面迎擊問題。長處：果斷、勇氣、大方地保護別人。注意：會被感受為威嚇的強度，以及把脆弱當成安全風險。"
   },
   "deep": {
    "en": "Under stress you borrow Type 5 withdrawal — pulling back and going silent. In growth you borrow Type 2 openness — tenderness expressed directly, not only through protection. At work: invite dissent before you decide. In love: let yourself be looked after sometimes; it is not a debt.",
    "zh": "壓力下你會借用 5 號的退縮——後退、沉默。成長時你借用 2 號的開放——直接表達溫柔，而非只透過保護。工作上：決定之前先邀請異見。感情上：偶爾讓自己被照顧；那不是欠債。"
   }
  },
  "9": {
   "nameEn": "The Peacemaker",
   "nameZh": "和平者 / 調停型",
   "core": {
    "en": "Core drive: to keep inner and outer peace. You see every side of an argument and make rooms calmer by being in them. Strengths: patience, acceptance, steady presence. Watch-out: merging with other people's agendas and going numb on your own — your preferences surface late or never.",
    "zh": "核心動力：保持內外和平。你看得見爭論的每一面，你在場，房間就 calm 下來。長處：耐性、接納、穩定的陪伴。注意：與別人的議程合併、對自己的需要麻木——你的偏好總是遲來，甚至不來。"
   },
   "deep": {
    "en": "Under stress you borrow Type 6 anxiety — worrying while appearing calm. In growth you borrow Type 3 energy — stating your own goals and acting on them visibly. At work: voice the preference in the meeting, not after it. In love: small honest disagreements early prevent large silent ones later.",
    "zh": "壓力下你會借用 6 號的焦慮——表面平靜、內裡擔憂。成長時你借用 3 號的能量——說出自己的目標，並 visibly 地行動。工作上：在會議中說出偏好，不要會後才說。感情上：及早的小分歧，可避免日後大的沉默。"
   }
  }
 },
 "MBTI_Q": [
  {
   "dim": "EI",
   "q": {
    "en": "After a demanding week, I recharge by…",
    "zh": "辛苦一週後，我靠這樣充電……"
   },
   "a": {
    "l": "E",
    "en": "Meeting friends — being around people gives me energy back",
    "zh": "見朋友——與人在一起令我恢復能量"
   },
   "b": {
    "l": "I",
    "en": "Time alone or with one close person — quiet restores me",
    "zh": "獨處或與一位親近的人一起——安靜令我恢復"
   }
  },
  {
   "dim": "EI",
   "q": {
    "en": "In a group discussion, I usually…",
    "zh": "在小組討論中，我通常……"
   },
   "a": {
    "l": "E",
    "en": "Think out loud — ideas form while I am speaking",
    "zh": "邊說邊想——說話時想法才成形"
   },
   "b": {
    "l": "I",
    "en": "Think first, then speak once my view is formed",
    "zh": "先想清楚，觀點成形後才開口"
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
    "zh": "事實、細節與過去實際有效的方法"
   },
   "b": {
    "l": "N",
    "en": "Patterns, possibilities and where things could go",
    "zh": "模式、可能性與事情可以走向何方"
   }
  },
  {
   "dim": "SN",
   "q": {
    "en": "When learning something new, I prefer…",
    "zh": "學新東西時，我偏好……"
   },
   "a": {
    "l": "S",
    "en": "Step-by-step instructions with concrete examples",
    "zh": "有具體例子的逐步說明"
   },
   "b": {
    "l": "N",
    "en": "The big picture first — details can fill in later",
    "zh": "先看全局——細節之後再補"
   }
  },
  {
   "dim": "TF",
   "q": {
    "en": "When I must decide something that affects others, I lead with…",
    "zh": "當我要做影響別人的決定時，我先考慮……"
   },
   "a": {
    "l": "T",
    "en": "Logic and fairness — the same rules for everyone",
    "zh": "邏輯與公平——人人同一套規則"
   },
   "b": {
    "l": "F",
    "en": "Impact on people — how each person will feel about it",
    "zh": "對人的影響——每個人會有什麼感受"
   }
  },
  {
   "dim": "TF",
   "q": {
    "en": "Feedback lands best with me when it is…",
    "zh": "我最能接受的意見方式是……"
   },
   "a": {
    "l": "T",
    "en": "Direct and analytical, even if it is blunt",
    "zh": "直接、有分析，即使有點直接"
   },
   "b": {
    "l": "F",
    "en": "Considerate of feelings, even if it is softer",
    "zh": "顧及感受，即使較委婉"
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
    "zh": "預先計劃、及早決定、在死線前完成"
   },
   "b": {
    "l": "P",
    "en": "Stay flexible, decide as things unfold, use the deadline as fuel",
    "zh": "保持彈性、隨事情發展再決定、用死線作動力"
   }
  },
  {
   "dim": "JP",
   "q": {
    "en": "On holiday, I prefer…",
    "zh": "旅行時，我偏好……"
   },
   "a": {
    "l": "J",
    "en": "A loose itinerary booked in advance — then relax into it",
    "zh": "預先訂好一個鬆動行程——然後安心享受"
   },
   "b": {
    "l": "P",
    "en": "A starting point and freedom to improvise each day",
    "zh": "一個起點，每天自由即興"
   }
  }
 ],
 "ENNEA_Q2": [
  {
   "q": {
    "en": "When I join a new team or group, I…",
    "zh": "加入一個新團隊或群體時，我會……"
   },
   "opts": [
    {
     "t": 1,
     "en": "Learn the standards first and quietly make sure my work meets them",
     "zh": "先了解標準，安靜地確保自己的工作達標"
    },
    {
     "t": 2,
     "en": "Get to know people and find where I can be useful",
     "zh": "先認識大家，找自己可以幫上忙的位置"
    },
    {
     "t": 3,
     "en": "Set a personal target and get moving fast",
     "zh": "先為自己定一個目標，快速動起來"
    }
   ]
  },
  {
   "q": {
    "en": "The compliment I would most like to hear is…",
    "zh": "我最想聽到的稱讚是……"
   },
   "opts": [
    {
     "t": 4,
     "en": "“No one else sees it the way you do.”",
     "zh": "「只有你看事情的角度是這樣的。」"
    },
    {
     "t": 5,
     "en": "“You really understand how this works.”",
     "zh": "「你真的很懂這件事如何運作。」"
    },
    {
     "t": 6,
     "en": "“We knew we could count on you.”",
     "zh": "「我們就知道可以靠你。」"
    }
   ]
  },
  {
   "q": {
    "en": "When plans fall through at the last minute, I…",
    "zh": "計劃在最後一刻告吹時，我會……"
   },
   "opts": [
    {
     "t": 7,
     "en": "Immediately look for a more interesting alternative",
     "zh": "立刻找一個更有趣的替代方案"
    },
    {
     "t": 8,
     "en": "Take charge and set a new plan myself",
     "zh": "接手，自己定一個新計劃"
    },
    {
     "t": 9,
     "en": "Go along with whatever keeps everyone comfortable",
     "zh": "隨大家都舒服的方向走"
    }
   ]
  },
  {
   "q": {
    "en": "My desk, phone and files tend to be…",
    "zh": "我的書桌、手機與檔案通常是……"
   },
   "opts": [
    {
     "t": 1,
     "en": "Organised — everything has a place and a standard",
     "zh": "井井有條——每樣東西都有位置與標準"
    },
    {
     "t": 4,
     "en": "Personal — arranged by mood and meaning, not by rules",
     "zh": "很個人——按感覺與意義擺放，不按規矩"
    },
    {
     "t": 7,
     "en": "In motion — piles of current enthusiasms, sorted later",
     "zh": "流動中——一堆當前的熱情所在，之後再整理"
    }
   ]
  },
  {
   "q": {
    "en": "When a friend is struggling and has not asked for help, I…",
    "zh": "當朋友有困難又沒有開口求助時，我會……"
   },
   "opts": [
    {
     "t": 2,
     "en": "Step in gently — I can usually tell what they need",
     "zh": "溫和地介入——我通常看得出他們需要什麼"
    },
    {
     "t": 5,
     "en": "Wait and stay available — they will ask when ready",
     "zh": "等待並保持開放——他們準備好自然會開口"
    },
    {
     "t": 8,
     "en": "Tell them directly what I think they should do",
     "zh": "直接告訴他們我認為應該怎麼做"
    }
   ]
  },
  {
   "q": {
    "en": "In a crisis at work, people rely on me to…",
    "zh": "工作上出事時，大家靠我來……"
   },
   "opts": [
    {
     "t": 3,
     "en": "Keep the outcome in sight and drive delivery",
     "zh": "盯住成果、推動交付"
    },
    {
     "t": 6,
     "en": "Spot the risks early and prepare for them",
     "zh": "及早發現風險並作準備"
    },
    {
     "t": 9,
     "en": "Keep everyone calm and stop the panic spreading",
     "zh": "讓大家冷靜下來，阻止恐慌蔓延"
    }
   ]
  },
  {
   "q": {
    "en": "My relationship with rules is…",
    "zh": "我與規則的關係是……"
   },
   "opts": [
    {
     "t": 1,
     "en": "Rules exist for a reason — follow them, and improve them properly",
     "zh": "規則存在必有理由——應遵守，要改就正正經經地改"
    },
    {
     "t": 5,
     "en": "Rules are information — I decide case by case what applies",
     "zh": "規則是資訊——我逐件事判斷哪些適用"
    },
    {
     "t": 9,
     "en": "Rules are fine until they create friction — then I work around them",
     "zh": "規則可以，直到它製造摩擦——那時我會繞過去"
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
     "zh": "為之付出很多的人不領情"
    },
    {
     "t": 6,
     "en": "Uncertainty — not knowing where I stand or what comes next",
     "zh": "不確定——不知道自己的位置與下一步"
    },
    {
     "t": 7,
     "en": "Being stuck in a routine with nothing new ahead",
     "zh": "困在例行公事中，前面沒有新事物"
    }
   ]
  },
  {
   "q": {
    "en": "When I feel overlooked, I tend to…",
    "zh": "當我覺得被忽略時，我傾向……"
   },
   "opts": [
    {
     "t": 3,
     "en": "Work harder and make the results impossible to ignore",
     "zh": "更努力，讓成果無法被忽視"
    },
    {
     "t": 4,
     "en": "Withdraw and wonder what is wrong with me",
     "zh": "退縮，反覆想自己哪裡不好"
    },
    {
     "t": 8,
     "en": "Speak up — I would rather confront it than fade",
     "zh": "出聲——我寧願正面對質，也不要淡出"
    }
   ]
  },
  {
   "q": {
    "en": "Before I trust someone's work, I need to see…",
    "zh": "在我信任一個人的工作之前，我需要看到……"
   },
   "opts": [
    {
     "t": 1,
     "en": "That it was done carefully and correctly",
     "zh": "它被認真、正確地完成"
    },
    {
     "t": 6,
     "en": "Consistency — that they deliver the same way every time",
     "zh": "一致性——他們每次都以同樣方式交付"
    },
    {
     "t": 8,
     "en": "That they stand behind it when challenged",
     "zh": "他們在被質疑時會挺身捍衛它"
    }
   ]
  },
  {
   "q": {
    "en": "The role I slip into at gatherings is…",
    "zh": "在聚會中，我不自覺擔當的角色是……"
   },
   "opts": [
    {
     "t": 2,
     "en": "The host in spirit — checking everyone has what they need",
     "zh": "像主人一樣——留意每個人是否有所需"
    },
    {
     "t": 4,
     "en": "The one in a deep one-to-one conversation in the corner",
     "zh": "在角落與人作一對一深談的那個"
    },
    {
     "t": 9,
     "en": "The easy presence everyone finds comfortable to be near",
     "zh": "令人舒服、自在的那個存在"
    }
   ]
  },
  {
   "q": {
    "en": "Success, to me, mostly means…",
    "zh": "對我來說，成功主要是……"
   },
   "opts": [
    {
     "t": 3,
     "en": "Achieving the goal and being recognised for it",
     "zh": "達成目標，並因此獲得認可"
    },
    {
     "t": 5,
     "en": "Mastering something difficult, on my own terms",
     "zh": "按自己的方式，精通一件困難的事"
    },
    {
     "t": 7,
     "en": "A life full of experiences I chose myself",
     "zh": "一個充滿自己選擇的體驗的人生"
    }
   ]
  },
  {
   "q": {
    "en": "When I make a mistake, my inner voice says…",
    "zh": "當我犯錯時，內心的聲音會說……"
   },
   "opts": [
    {
     "t": 1,
     "en": "“That should not have happened — do it properly next time.”",
     "zh": "「不應該發生的——下次要做得妥妥當當。」"
    },
    {
     "t": 2,
     "en": "“Will they still think well of me?”",
     "zh": "「他們還會對我有好印象嗎？」"
    },
    {
     "t": 3,
     "en": "“Fix the impression fast — get a win on the board.”",
     "zh": "「快修補印象——先贏一仗回來。」"
    }
   ]
  },
  {
   "q": {
    "en": "I am most likely to lose track of time when I am…",
    "zh": "我最容易忘記時間，是在……的時候"
   },
   "opts": [
    {
     "t": 4,
     "en": "Making, writing or feeling something deeply",
     "zh": "創作、寫作，或深深感受某件事"
    },
    {
     "t": 5,
     "en": "Deep in research, a system or a hard problem",
     "zh": "深入研究、鑽研一個系統或難題"
    },
    {
     "t": 6,
     "en": "With my trusted people, talking things through",
     "zh": "與我信任的人在一起、把事情談透"
    }
   ]
  },
  {
   "q": {
    "en": "My attitude to conflict is…",
    "zh": "我對衝突的態度是……"
   },
   "opts": [
    {
     "t": 7,
     "en": "Reframe it or leave it — life is too short for heavy scenes",
     "zh": "轉念或離場——人生太短，不值得困在沉重場面"
    },
    {
     "t": 8,
     "en": "Meet it head-on — a clear fight beats a slow resentment",
     "zh": "正面迎擊——一場清楚的交鋒勝過慢慢積怨"
    },
    {
     "t": 9,
     "en": "Smooth it over — most things are not worth the friction",
     "zh": "和緩處理——大多數事不值得起摩擦"
    }
   ]
  },
  {
   "q": {
    "en": "What I secretly envy in others is…",
    "zh": "我暗暗羨慕別人的，是……"
   },
   "opts": [
    {
     "t": 1,
     "en": "People who can relax without feeling they should be improving something",
     "zh": "能真正放鬆、不覺得自己應該在改進什麼的人"
    },
    {
     "t": 4,
     "en": "People who seem complete and at home in themselves",
     "zh": "看起來完整、自在地做自己的人"
    },
    {
     "t": 7,
     "en": "People who finish one thing deeply, contentedly",
     "zh": "能滿足地把一件事做深做完的人"
    }
   ]
  },
  {
   "q": {
    "en": "When I am angry, I usually…",
    "zh": "當我生氣時，我通常會……"
   },
   "opts": [
    {
     "t": 2,
     "en": "Go quiet and extra helpful — the anger comes out sideways later",
     "zh": "變得安靜又加倍幫忙——怒氣之後才從側面出來"
    },
    {
     "t": 5,
     "en": "Withdraw until I have sorted it out privately",
     "zh": "退開，直到我私下把事情想通"
    },
    {
     "t": 8,
     "en": "Say it straight, at volume if needed — then it is done",
     "zh": "直接說出來，必要時大聲——說完就完"
    }
   ]
  },
  {
   "q": {
    "en": "At the end of a good day, I feel it was good because…",
    "zh": "美好的一天結束時，我覺得它好，是因為……"
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
     "zh": "我依靠的人都在，我也在他們身邊"
    },
    {
     "t": 9,
     "en": "It was peaceful, and nobody needed anything from me",
     "zh": "那天平靜，沒有人向我索取什麼"
    }
   ]
  }
 ],
 "MBTI_Q2": [
  {
   "dim": "EI",
   "q": {
    "en": "At a party, I am more likely to…",
    "zh": "在派對上，我比較會……"
   },
   "a": {
    "l": "E",
    "en": "Move between groups, meeting new people",
    "zh": "在不同小組間走動，認識新朋友"
   },
   "b": {
    "l": "I",
    "en": "Settle into one or two real conversations",
    "zh": "安頓下來，投入一兩場真正的對話"
   }
  },
  {
   "dim": "SN",
   "q": {
    "en": "When reading instructions, I…",
    "zh": "看指示時，我會……"
   },
   "a": {
    "l": "S",
    "en": "Follow them literally the first time, then adjust",
    "zh": "第一次先按字面照做，之後再調整"
   },
   "b": {
    "l": "N",
    "en": "Skim for the idea and improvise the steps",
    "zh": "先抓大意，步驟即興發揮"
   }
  },
  {
   "dim": "TF",
   "q": {
    "en": "When two people disagree, I first…",
    "zh": "當兩個人意見不合時，我先……"
   },
   "a": {
    "l": "T",
    "en": "Look for the facts and the fairest principle",
    "zh": "找事實與最公平的原則"
   },
   "b": {
    "l": "F",
    "en": "Consider what each person needs in order to feel heard",
    "zh": "考慮每個人需要什麼，才會覺得被聽見"
   }
  },
  {
   "dim": "JP",
   "q": {
    "en": "My inbox and desk tend to be…",
    "zh": "我的收件箱與書桌傾向於……"
   },
   "a": {
    "l": "J",
    "en": "Cleared and sorted as I go",
    "zh": "隨手清理、分類"
   },
   "b": {
    "l": "P",
    "en": "Handled in bursts, when it starts to matter",
    "zh": "在開始重要時，才一口氣處理"
   }
  },
  {
   "dim": "EI",
   "q": {
    "en": "When I have an idea at work, I prefer to…",
    "zh": "在工作上有新想法時，我偏好……"
   },
   "a": {
    "l": "E",
    "en": "Talk it through with someone right away",
    "zh": "立刻找人談一談"
   },
   "b": {
    "l": "I",
    "en": "Let it settle, then share it in writing or when asked",
    "zh": "先讓它沉澱，之後以書面或被問及時才分享"
   }
  },
  {
   "dim": "SN",
   "q": {
    "en": "I am more interested in…",
    "zh": "我對以下哪樣較有興趣……"
   },
   "a": {
    "l": "S",
    "en": "What is actually happening now",
    "zh": "現在實際在發生的事"
   },
   "b": {
    "l": "N",
    "en": "What could happen next, or underneath the surface",
    "zh": "接下來可能發生、或表面之下的事"
   }
  },
  {
   "dim": "TF",
   "q": {
    "en": "I would rather be seen as…",
    "zh": "我寧願被視為……"
   },
   "a": {
    "l": "T",
    "en": "Competent and fair, even if not always warm",
    "zh": "有能力、公平，即使不總是溫暖"
   },
   "b": {
    "l": "F",
    "en": "Kind and understanding, even if not always firm",
    "zh": "善良、體諒，即使不總是堅定"
   }
  },
  {
   "dim": "JP",
   "q": {
    "en": "I feel most comfortable when…",
    "zh": "我在以下情況最自在……"
   },
   "a": {
    "l": "J",
    "en": "The plan is set and I know what happens next",
    "zh": "計劃已定，知道下一步是什麼"
   },
   "b": {
    "l": "P",
    "en": "Options stay open and I can adapt",
    "zh": "選擇保持開放，可以隨時調整"
   }
  },
  {
   "dim": "EI",
   "q": {
    "en": "Strangers would probably describe me as…",
    "zh": "陌生人大概會形容我為……"
   },
   "a": {
    "l": "E",
    "en": "Easy to approach and quick to engage",
    "zh": "容易親近、很快投入"
   },
   "b": {
    "l": "I",
    "en": "Reserved at first, warmer once you know me",
    "zh": "起初較拘謹，熟了之後才溫暖"
   }
  },
  {
   "dim": "SN",
   "q": {
    "en": "When I describe something, I mostly use…",
    "zh": "我形容事情時，多用……"
   },
   "a": {
    "l": "S",
    "en": "Concrete details — what I saw and heard",
    "zh": "具體細節——我看到與聽到的"
   },
   "b": {
    "l": "N",
    "en": "Impressions and meanings — what it added up to",
    "zh": "印象與意義——它總體代表什麼"
   }
  },
  {
   "dim": "TF",
   "q": {
    "en": "When giving criticism, I…",
    "zh": "給予批評時，我會……"
   },
   "a": {
    "l": "T",
    "en": "Say it plainly — honesty helps most",
    "zh": "直說——誠實最有幫助"
   },
   "b": {
    "l": "F",
    "en": "Soften the edges so it can be received",
    "zh": "把邊角放軟，讓對方接得住"
   }
  },
  {
   "dim": "JP",
   "q": {
    "en": "Deadlines work best for me as…",
    "zh": "死線對我最有效的作用是……"
   },
   "a": {
    "l": "J",
    "en": "A line I finish well ahead of",
    "zh": "一條我會早早完成的界線"
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
    "zh": "完美的自由日傾向於……"
   },
   "a": {
    "l": "E",
    "en": "Plans with people, out in the world",
    "zh": "與人有約、在外面的世界活動"
   },
   "b": {
    "l": "I",
    "en": "Unscheduled time, mostly my own company",
    "zh": "沒有行程，大部分時間自己作主"
   }
  },
  {
   "dim": "SN",
   "q": {
    "en": "In planning, I put more weight on…",
    "zh": "做規劃時，我較看重……"
   },
   "a": {
    "l": "S",
    "en": "Proven methods and past results",
    "zh": "已被驗證的方法與過往成果"
   },
   "b": {
    "l": "N",
    "en": "New approaches and untested potential",
    "zh": "新做法與未試過的潛力"
   }
  },
  {
   "dim": "TF",
   "q": {
    "en": "A decision feels right to me when…",
    "zh": "決定在以下情況令我覺得對……"
   },
   "a": {
    "l": "T",
    "en": "It holds up under logical scrutiny",
    "zh": "它經得起邏輯推敲"
   },
   "b": {
    "l": "F",
    "en": "It sits well with the people affected",
    "zh": "受影響的人都覺得可以接受"
   }
  },
  {
   "dim": "JP",
   "q": {
    "en": "When travelling with others, I prefer…",
    "zh": "與別人旅行時，我偏好……"
   },
   "a": {
    "l": "J",
    "en": "Knowing where we sleep and roughly what each day holds",
    "zh": "知道睡在哪裡、大概每天做什麼"
   },
   "b": {
    "l": "P",
    "en": "Booking the first night and deciding the rest on the road",
    "zh": "只訂第一晚，其餘在路上決定"
   }
  }
 ],
 "MBTI_TYPES": {
  "INTJ": {
   "nickEn": "The Architect",
   "nickZh": "建築師",
   "en": "INTJ — The Architect. You think in systems and long arcs, and you improve things by redesigning them, not patching them. Strengths: strategic clarity, independence, high standards. Watch-out: impatience with inefficiency can read as dismissal; bring people along earlier than feels necessary.",
   "zh": "INTJ——建築師。你以系統與長線思考，透過重新設計而非修補來改善事情。長處：策略清晰、獨立、標準高。注意：對低效率的不耐煩會被感受為否定；比你覺得需要的更早一點，把人帶進來。",
   "deepEn": "At work you excel where strategy, research or building something durable matters. In relationships you show love through competence and planning — say the feeling sometimes too; your partner cannot read the blueprint in your head.",
   "deepZh": "工作上，你在策略、研究或建造耐久之物上出色。感情上你以能力與規劃表達愛——偶爾也把感受說出來；伴侶讀不到你腦中的藍圖。"
  },
  "INTP": {
   "nickEn": "The Logician",
   "nickZh": "邏輯學家",
   "en": "INTP — The Logician. You are driven by how things actually work, and you keep asking why until the model is clean. Strengths: original analysis, honesty, calm curiosity. Watch-out: endless analysis can stall delivery; a good-enough answer shipped beats a perfect one pending.",
   "zh": "INTP——邏輯學家。你被「事情到底如何運作」驅動，一直追問為什麼，直到模型乾淨為止。長處：原創分析、誠實、冷靜的好奇。注意：無止境分析會拖住交付；交出夠好的答案，勝過 pending 的完美答案。",
   "deepEn": "At work you thrive in research, design and problem diagnosis. In relationships you connect through ideas and respect for autonomy — check in emotionally on purpose, not only when there is a problem to solve.",
   "deepZh": "工作上，你在研究、設計與問題診斷中如魚得水。感情上你透過想法與尊重自主來連結——有意識地做情感 check-in，不要只在有問題要解決時才做。"
  },
  "ENTJ": {
   "nickEn": "The Commander",
   "nickZh": "指揮官",
   "en": "ENTJ — The Commander. You organise people and resources toward a goal almost instinctively, and you are energised by momentum. Strengths: leadership, decisiveness, long-range planning. Watch-out: efficiency can steamroll feelings; slower consensus sometimes produces faster execution.",
   "zh": "ENTJ——指揮官。你幾乎本能地組織人與資源邁向目標，並被 momentum 充電。長處：領導力、果斷、長線規劃。注意：效率會輾過感受；較慢的共識，有時反而帶來更快的執行。",
   "deepEn": "At work you belong where outcomes are owned and teams are built. In relationships you respect competence and honesty — soften the briefing tone; home is not a headquarters.",
   "deepZh": "工作上，你屬於要 own 結果、建團隊的位置。感情上你尊重能力與誠實——放軟簡報式的語氣；家不是總部。"
  },
  "ENTP": {
   "nickEn": "The Debater",
   "nickZh": "辯論家",
   "en": "ENTP — The Debater. You generate possibilities faster than most people finish a sentence, and you test ideas by sparring with them. Strengths: inventiveness, wit, strategic improvisation. Watch-out: boredom is your leak — finish rates suffer when the novel part ends.",
   "zh": "ENTP——辯論家。你產生可能性的速度比大多數人說完一句話還快，並透過交鋒來測試想法。長處：創意、機智、策略即興。注意：無聊是你的漏洞——新鮮部分結束後，完成率就會下跌。",
   "deepEn": "At work you shine in founding, pitching and rescuing stuck projects. In relationships you need a partner who enjoys the sparring — and who can tell play-argument from real disagreement.",
   "deepZh": "工作上，你在創業、提案與拯救卡住的項目上發光。感情上你需要享受交鋒的伴侶——而且能分辨玩笑式爭論與真正分歧。"
  },
  "INFJ": {
   "nickEn": "The Advocate",
   "nickZh": "提倡者",
   "en": "INFJ — The Advocate. You read people and patterns quietly, then act on a vision of how things should be. Strengths: insight, integrity, quiet determination. Watch-out: you absorb other people's emotions as data about yourself, and burn out in private.",
   "zh": "INFJ——提倡者。你安靜地讀人與模式，然後按一個「事情應該如何」的願景行動。長處：洞察、正直、安靜的決心。注意：你會把別人的情緒當作關於自己的數據吸收，並在私下耗盡自己。",
   "deepEn": "At work you do best where purpose and people intersect — coaching, writing, strategy with a human core. In relationships you need depth and honesty; small talk as a permanent diet starves you.",
   "deepZh": "工作上，你在目的與人交匯處表現最好——輔導、寫作、有人本核心的策略。感情上你需要深度與誠實；長期只吃閒聊這種餐單會令你枯竭。"
  },
  "INFP": {
   "nickEn": "The Mediator",
   "nickZh": "調停者",
   "en": "INFP — The Mediator. You run an inner compass check on everything: does this fit what I believe? Strengths: empathy, originality, loyalty to values. Watch-out: idealism can turn practical steps into disappointments; small concrete actions protect big dreams.",
   "zh": "INFP——調停者。你對每件事都做一次內在指南針檢查：這符合我的信念嗎？長處：同理心、原創、忠於價值。注意：理想主義會令實際步驟變成失望；小的具體行動能保護大的夢想。",
   "deepEn": "At work you thrive where meaning and craft meet — writing, design, care, advocacy. In relationships you are devoted and perceptive; say needs early, before they become quiet tests.",
   "deepZh": "工作上，你在意義與手藝相遇處茁壯——寫作、設計、照顧、倡議。感情上你專一而敏銳；及早說出需要，不要讓它變成安靜的試探。"
  },
  "ENFJ": {
   "nickEn": "The Protagonist",
   "nickZh": "主人公",
   "en": "ENFJ — The Protagonist. You organise around people: their growth, their morale, their next step. Strengths: warmth, leadership, reading a room instantly. Watch-out: your own needs queue last, and other people's opinions of you can steer decisions more than they should.",
   "zh": "ENFJ——主人公。你圍繞人來組織：他們的成長、士氣、下一步。長處：溫暖、領導力、即刻讀懂全場。注意：自己的需要排最後，而別人對你的看法，會比應有的程度更影響你的決定。",
   "deepEn": "At work you excel at teaching, leading and building communities. In relationships you give generously — choose partners who notice the giver also needs refilling, and let them.",
   "deepZh": "工作上，你在教學、領導與建構社群上出色。感情上你慷慨付出——選擇會留意「付出者也需要被補給」的人，並讓他們這樣做。"
  },
  "ENFP": {
   "nickEn": "The Campaigner",
   "nickZh": "競選者",
   "en": "ENFP — The Campaigner. You connect people and possibilities with contagious energy, and you feel a room's weather before anyone names it. Strengths: enthusiasm, creativity, emotional range. Watch-out: follow-through and routine are your tax; systems, not willpower, pay it.",
   "zh": "ENFP——競選者。你以具感染力的能量連結人與可能性，並在任何人說出之前，已感到全場的天氣。長處：熱情、創意、情緒幅度。注意：完成與 routine 是你的稅；要靠系統而非意志力去繳。",
   "deepEn": "At work you light up brainstorming, community and client-facing creation. In relationships you bring sparkle and sincerity — pick partners who love the energy and help anchor the calendar.",
   "deepZh": "工作上，你點亮腦力激盪、社群與面向客戶的創作。感情上你帶來火花與真誠——選擇欣賞這份能量、又能協助你 anchor 日程的伴侶。"
  },
  "ISTJ": {
   "nickEn": "The Logistician",
   "nickZh": "物流師",
   "en": "ISTJ — The Logistician. You are the load-bearing wall: reliable, factual and thorough, in good weeks and bad ones. Strengths: dependability, memory for detail, honoured commitments. Watch-out: proven methods can become a cage; schedule experiments so change arrives on your terms.",
   "zh": "ISTJ——物流師。你是承重牆：可靠、重事實、徹底，好週壞週都一樣。長處：值得信賴、記得細節、說到做到。注意： proven 的方法會變成籠子；把實驗排進日程，讓改變按你的條件到來。",
   "deepEn": "At work you excel in operations, quality, finance and anywhere accuracy compounds. In relationships you show love by doing — add words occasionally; dependability plus expression is the full language.",
   "deepZh": "工作上，你在營運、品質、財務及任何準確性能複利的地方出色。感情上你以行動表達愛——偶爾加上言語；可靠加上表達，才是完整的語言。"
  },
  "ISFJ": {
   "nickEn": "The Defender",
   "nickZh": "守衛者",
   "en": "ISFJ — The Defender. You care in practical detail: remembering, preparing, quietly preventing problems. Strengths: loyalty, attentiveness, steady warmth. Watch-out: you say yes past your capacity and keep the resentment private; a kind no protects the yeses.",
   "zh": "ISFJ——守衛者。你以實際細節去關心：記得、準備、安靜地預防問題。長處：忠誠、體貼、穩定的溫暖。注意：你會答應超出自己能力的請求，並把怨氣私藏；一個善意的「不」，能保護你的「好」。",
   "deepEn": "At work you shine in care, coordination and craft that serves real people. In relationships you are devoted and observant — let your needs be as visible as your care is.",
   "deepZh": "工作上，你在照顧、協調與服務真人的手藝上發光。感情上你專一而細心——讓你的需要，像你的關心一樣清楚可見。"
  },
  "ESTJ": {
   "nickEn": "The Executive",
   "nickZh": "總經理",
   "en": "ESTJ — The Executive. You bring order: clear roles, clear standards, things finished. Strengths: organisation, candour, getting groups moving. Watch-out: correctness delivered at volume can silence useful dissent; ask one more question before deciding for the room.",
   "zh": "ESTJ——總經理。你帶來秩序：角色清晰、標準清晰、事情完成。長處：組織、坦率、令團隊動起來。注意：大聲 delivered 的正確，會令有用的異見沉默；替全場決定之前，多問一個問題。",
   "deepEn": "At work you belong in management, operations and anywhere standards matter. In relationships you value loyalty and effort — appreciation spoken aloud lands deeper than another task completed.",
   "deepZh": "工作上，你屬於管理、營運及任何標準重要的地方。感情上你重視忠誠與努力——說出口的欣賞，比多完成一件事更入心。"
  },
  "ESFJ": {
   "nickEn": "The Consul",
   "nickZh": "執政官",
   "en": "ESFJ — The Consul. You are the social glue: hosting, harmonising, remembering what matters to people. Strengths: warmth, reliability, practical care. Watch-out: harmony can outrank honesty in your decisions; a relationship that cannot survive one honest sentence is not yet harmony.",
   "zh": "ESFJ——執政官。你是社交黏合劑：款待、協調、記得對人重要的事。長處：溫暖、可靠、實際的關心。注意：在你的決定中，和諧會排在誠實之前；一段經不起一句真心話的關係，還不是和諧。",
   "deepEn": "At work you excel in service, events, teams and client care. In relationships you give structure and celebration — choose people who reciprocate care, not only receive it.",
   "deepZh": "工作上，你在服務、活動、團隊與客戶關懷上出色。感情上你帶來結構與慶祝——選擇會回報關心的人，而非只接收。"
  },
  "ISTP": {
   "nickEn": "The Virtuoso",
   "nickZh": "鑑賞家",
   "en": "ISTP — The Virtuoso. You learn by taking things apart and putting them back together, preferably with your hands. Strengths: calm problem-solving, adaptability, mechanical and situational logic. Watch-out: boredom and emotional conversations both tempt you to exit quietly; stay ten minutes longer than instinct says.",
   "zh": "ISTP——鑑賞家。你透過拆開再裝回去來學習，最好是親手做。長處：冷靜解難、適應力、機械與情境邏輯。注意：無聊與情感對話都會誘使你安靜離場；比直覺所說的多留十分鐘。",
   "deepEn": "At work you thrive in technical, field and crisis work where judgement beats procedure. In relationships you show care by fixing and doing — pair it with occasional plain statements of feeling.",
   "deepZh": "工作上，你在技術、現場與危機工作中茁壯，那裡判斷勝過程序。感情上你以修理與行動表達關心——偶爾配上平實的感受表達。"
  },
  "ISFP": {
   "nickEn": "The Adventurer",
   "nickZh": "探險家",
   "en": "ISFP — The Adventurer. You live close to your senses and values, and you express yourself through what you make and how you live. Strengths: aesthetic eye, gentleness, quiet courage about being yourself. Watch-out: conflict avoidance can let small hurts compound; gentle and direct beats gentle and silent.",
   "zh": "ISFP——探險家。你貼近自己的感官與價值生活，並透過所造之物與生活方式表達自己。長處：審美眼光、溫柔、做自己的安靜勇氣。注意：逃避衝突會令小傷害複利；溫柔而直接，勝過溫柔而沉默。",
   "deepEn": "At work you shine in design, craft, care and any role with tangible, human results. In relationships you are warm and loyal — ask for the space you need instead of disappearing to get it.",
   "deepZh": "工作上，你在設計、手藝、照顧及任何有實在、以人為本結果的崗位上發光。感情上你溫暖忠誠——開口要求你需要的空間，而非消失去取得它。"
  },
  "ESTP": {
   "nickEn": "The Entrepreneur",
   "nickZh": "企業家",
   "en": "ESTP — The Entrepreneur. You read the moment and act in it — negotiating, fixing, performing, moving. Strengths: boldness, social radar, crisis composure. Watch-out: consequences arrive on a delay your instincts discount; build one pause into big commitments.",
   "zh": "ESTP——企業家。你讀懂當下並在當下行動——談判、修理、表現、推進。長處：大膽、社交雷達、危機中的鎮定。注意：後果會延遲到達，而你的直覺會把它打折；在重大承諾中加入一個停頓。",
   "deepEn": "At work you excel in sales, founding, events and live problem-solving. In relationships you bring fun and momentum — reliability in small promises is what turns excitement into trust.",
   "deepZh": "工作上，你在銷售、創業、活動與即時解難上出色。感情上你帶來樂趣與 momentum——在小承諾上的可靠，是把興奮變成信任的關鍵。"
  },
  "ESFP": {
   "nickEn": "The Entertainer",
   "nickZh": "表演者",
   "en": "ESFP — The Entertainer. You make ordinary moments feel like occasions, and people relax around your warmth. Strengths: presence, generosity, emotional immediacy. Watch-out: applause and novelty can outbid long-term plans; anchor one boring system — money, health or calendar — and let it run itself.",
   "zh": "ESFP——表演者。你令平凡時刻像特別場合，人們在你的溫暖旁放鬆。長處：臨場感、慷慨、情緒的即時性。注意：掌聲與新鮮感會蓋過長期計劃； 固定一個無聊的系統——金錢、健康或日程——讓它自動運作。",
   "deepEn": "At work you thrive in hosting, sales, performance and people-facing craft. In relationships you are affectionate and fun — choose partners who join the joy and share the planning load.",
   "deepZh": "工作上，你在款待、銷售、表演與面向人的手藝上茁壯。感情上你深情又有趣——選擇會一同享受、又分擔計劃負擔的伴侶。"
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
   " 今日重心在%T。中午前踏出一小步，勝過今晚三個計劃。",
   " 今日利於%T——行程放鬆，承諾要準確。",
   " 今日%T被 spotlight 照亮。婉拒一件好事，守住更好的那件。",
   " 今日靜靜獎勵%T：檢查一下別人略過的細節。",
   " 今日攪動%T；散步十分鐘，比多一杯咖啡更能重置狀態。",
   " 今日凸顯%T。多問第二個問題——第一個答案只是禮貌。"
  ]
 },
 "DM_PORTRAIT": [
  {
   "sEn": "Principled, upright and growth-oriented — you commit to a direction and keep reaching",
   "sZh": "有原則、正直、以成長為向——定下方向便持續向上",
   "gEn": "Rigidity when forced to bend — flexibility has to be practised, not assumed",
   "gZh": "被迫彎腰時容易僵硬——柔韌需要刻意練習，不能假設它會自動出現"
  },
  {
   "sEn": "Adaptable, diplomatic and quietly persistent — you find a way around obstacles",
   "sZh": "靈活、善交際、安靜地堅持——你總能繞過障礙",
   "gEn": "Flexibility can drift — without a held core direction, bending becomes wandering",
   "gZh": "靈活有時會變成漂流——守不住核心方向，彎曲就會變成漫遊"
  },
  {
   "sEn": "Warm, visible and generous with energy — you lift a room by being in it",
   "sZh": "溫暖、顯眼、慷慨地給予能量——你在場，氣氛就被帶起",
   "gEn": "Burn-out from being “on” for everyone — pacing and off-time do not happen by themselves",
   "gZh": "為所有人保持「開機」而耗盡——節奏與休息時間不會自己出現"
  },
  {
   "sEn": "Focused, refined and observant — you notice what others miss",
   "sZh": "專注、細膩、觀察入微——你留意到別人錯過的東西",
   "gEn": "Easily drained by other people's weather — you need shelter and fuel of your own",
   "gZh": "容易被別人的情緒天氣耗損——你需要自己的遮擋與燃料"
  },
  {
   "sEn": "Dependable, steady and trusted — people build plans on your word",
   "sZh": "可靠、穩定、值得信賴——別人把計劃建在你的承諾上",
   "gEn": "Movement and change — a strength for stability can become a roadblock if nothing ever shifts",
   "gZh": "移動與改變——穩定的長處若從不轉移，就會變成路障"
  },
  {
   "sEn": "Nurturing, practical and quietly productive — you keep many small things alive and growing",
   "sZh": "滋養、務實、安靜地生產——你令許多小事存活並成長",
   "gEn": "Boundaries — a garden that feeds everyone and is never fed itself turns barren",
   "gZh": "界線——只餵養別人、從不被餵養的花園終會貧瘠"
  },
  {
   "sEn": "Decisive, direct and built for hard tasks — you cut through delay",
   "sZh": "果斷、直接、為艱難任務而生——你斬斷拖延",
   "gEn": "Choosing your fights — an edge used for everything dulls, and can cut where it should not",
   "gZh": "挑選戰場——什麼都砍的鋒芒會變鈍，也會傷及不應傷之處"
  },
  {
   "sEn": "Precise, discerning and quality-focused — you spot flaws early and polish well",
   "sZh": "精準、有鑑別力、重質素——你及早察覺瑕疵並打磨得好",
   "gEn": "Softness — perfectionism and frequent criticism can land harder than you intend",
   "gZh": "柔和——完美主義與頻密的批評，會比你預期更重地落在別人身上"
  },
  {
   "sEn": "Resourceful, far-seeing and systems-minded — you find routes around most walls",
   "sZh": "足智多謀、目光遠大、以系統思考——你繞得過大多數牆",
   "gEn": "Focus and banks — breadth without one channel at a time floods and finishes less",
   "gZh": "聚焦與河岸——廣度若不一次只走一條河道，就會泛濫、完成得更少"
  },
  {
   "sEn": "Perceptive, patient and quietly transformative — you change things drop by drop",
   "sZh": "敏銳、有耐性、安靜地帶來改變——你一滴一滴改變事情",
   "gEn": "Accumulation and self-belief — your method works slowly, and you can underestimate it and stop too early",
   "gZh": "累積與自信——你的方法見效較慢，你可能低估它而太早停下"
  }
 ],
 "EL_PORTRAIT": {
  "wood": {
   "sEn": "Growth, planning and new starts come naturally — you see how things could develop",
   "sZh": "生長、規劃與新開始是你的自然模式——你看得見事物如何發展",
   "gEn": "Wood is your lightest element: starting deliberately, planning ahead and growing in one chosen direction do not switch on by themselves — they need structure in your schedule",
   "gZh": "木是你最弱的五行：刻意開展、預先規劃、朝一個選定方向生長，不會自動啟動——需要在日程中加入結構",
   "pEn": "Put growth on the calendar: one planning session and one small new start each week, in the same slot, so starting stops depending on mood.",
   "pZh": "把「生長」放上日程：每週固定一個時段做一次規劃與一個小的新開始，讓開展不再取決於心情。"
  },
  "fire": {
   "sEn": "Visibility, warmth and momentum — you energise people and move things in public",
   "sZh": "被看見、溫度與衝勁——你為人注入能量、在公開場合推動事情",
   "gEn": "Fire is your lightest element: being seen, warming a room and building momentum do not come automatically — visibility has to be scheduled, and rest protected, rather than left to chance",
   "gZh": "火是你最弱的五行：被看見、帶起氣氛與建立勢頭不會自動出現——要主動安排曝光，並保護休息，而非聽天由命",
   "pEn": "Schedule visibility and rest as a pair: one deliberate moment to be seen each week, and protected off-time after it, so momentum does not cost you recovery.",
   "pZh": "把曝光與休息成對安排：每週一次主動被看見的時刻，其後留有受保護的休息，讓勢頭不以恢復為代價。"
  },
  "earth": {
   "sEn": "Stability, care and follow-through — you finish what you start and look after people properly",
   "sZh": "穩定、照顧與完成——你把開始的事做完，也好好照顧人",
   "gEn": "Earth is your lightest element: follow-through, routine and closing loops are your thinner ground — things can stay open and untended unless you build finishing rituals",
   "gZh": "土是你最弱的五行：貫徹、日常規律與收尾是你較薄的地面——若不建立收尾習慣，事情容易一直敞開、無人打理",
   "pEn": "Build a closing ritual: a short weekly review that finishes, files or consciously drops every open loop — follow-through as a system, not a hope.",
   "pZh": "建立收尾習慣：每週一次短回顧，把每個未完的環節完成、歸檔或有意識地放棄——讓貫徹成為系統，而非盼望。"
  },
  "metal": {
   "sEn": "Precision, boundaries and standards — you know what “good enough” should actually mean",
   "sZh": "精準、界線與標準——你清楚「夠好」真正應該是什麼水平",
   "gEn": "Metal is your lightest element: precision, clear standards and firm boundaries are thinner for you — quality checks and saying no need to be deliberate, not improvised",
   "gZh": "金是你最弱的五行：精準、清晰標準與堅定界線是你較弱的一環——品質檢查與說「不」需要刻意為之，不能即興",
   "pEn": "Write your standards down once — a one-page checklist for your main work and one sentence for your main boundary — so precision and “no” do not depend on willpower in the moment.",
   "pZh": "把標準寫下來一次——主要工作一頁清單、主要界線一句話——讓精準與「不」不再取決於當下的意志力。"
  },
  "water": {
   "sEn": "Reflection, adaptability and recovery — you adjust, sense shifts early and restore well",
   "sZh": "反思、適應與恢復——你懂得調整、及早感知變化、好好恢復",
   "gEn": "Water is your lightest element: reflection, rest and recovery do not happen by themselves — without deliberate stillness you process fast but replenish slowly",
   "gZh": "水是你最弱的五行：反思、休息與恢復不會自動發生——沒有刻意的靜止，你會處理得快、補給得慢",
   "pEn": "Protect recovery like an appointment: regular stillness — a walk without input, an early night, a quiet morning — booked before the week fills, not fitted in after.",
   "pZh": "像守約一樣保護恢復：定期的靜止——不接收資訊的散步、早睡一晚、安靜的早晨——在週程填滿之前先訂下，而非事後硬塞。"
  }
 },
 "ENNEA_PORTRAIT": {
  "1": {
   "sEn": "Integrity, reliability and an eye for quality",
   "sZh": "正直、可靠、對質素有眼光",
   "gEn": "An inner critic that never clocks off, and resentment when others seem careless — “good enough, released” is a skill you have to practise",
   "gZh": "一個從不下班的內在批評者，以及別人不認真時積起的怨氣——「夠好，就放行」是你需要練習的技巧",
   "dEn": "be good, right and principled",
   "dZh": "做得好、做得對、守原則"
  },
  "2": {
   "sEn": "Warmth, generosity and a sharp emotional radar for what people need",
   "sZh": "溫暖、慷慨、對別人需要有敏銳的情緒雷達",
   "gEn": "Your own needs — you meet everyone else's first, and yours surface late, sometimes as exhaustion or quiet score-keeping",
   "gZh": "你自己的需要——你先滿足所有人，自己的需要遲遲才浮面，有時以疲憊或暗自計較的形式出現",
   "dEn": "be loved and needed",
   "dZh": "被愛、被需要"
  },
  "3": {
   "sEn": "Drive, polish and pragmatic optimism — you set targets and usually hit them",
   "sZh": "幹勁、形象與務實的樂觀——你定下目標，通常都能達成",
   "gEn": "Being known without performing — image can crowd out self, and rest can feel like falling behind",
   "gZh": "不表演地被了解——形象會擠掉自我，而休息會令你覺得自己在落後",
   "dEn": "succeed and be seen as capable",
   "dZh": "成功、被視為有能力"
  },
  "4": {
   "sEn": "Depth, originality and emotional honesty — nothing generic survives your filter",
   "sZh": "深度、原創與情緒誠實——公式化的東西過不了你的過濾",
   "gEn": "Steady, ordinary follow-through — comparison and withdrawal when misunderstood can stall work that needs plain, repeated steps",
   "gZh": "穩定、平凡的貫徹——比較與在不被理解時退縮，會卡住需要平實、重複步驟的工作",
   "dEn": "be authentic and find what is uniquely yours",
   "dZh": "真實、找到獨屬於自己的東西"
  },
  "5": {
   "sEn": "Analysis, independence and calm inside complexity",
   "sZh": "分析、獨立、在複雜中保持冷靜",
   "gEn": "Acting and engaging before you feel fully ready — research can become a shelter, and people can feel shut out",
   "gZh": "在感覺完全準備好之前就行動與參與——研究會變成庇護所，人也會覺得被關在門外",
   "dEn": "understand deeply and be competent",
   "dZh": "深入理解、勝任"
  },
  "6": {
   "sEn": "Loyalty, foresight and steadiness in a crisis — others trust you when it matters",
   "sZh": "忠誠、遠見、危機中的穩定——關鍵時刻別人信任你",
   "gEn": "Trusting your own judgement without another check — anxiety loops and testing people's reliability can replace simply asking and deciding",
   "gZh": "不再三核實就相信自己的判斷——焦慮循環與試探別人的可靠，會取代直接開口問與作決定",
   "dEn": "feel secure and supported",
   "dZh": "感到安全、被支持"
  },
  "7": {
   "sEn": "Optimism, versatility and rapid reframing — you generate options and energy",
   "sZh": "樂觀、多才、快速轉念——你產生選項與能量",
   "gEn": "Staying with discomfort and finishing — the next plan is tempting, and 80-percent finishes pile up",
   "gZh": "與不適相處並把事完成——下一個計劃太吸引，完成八成的事會積起來",
   "dEn": "stay happy, free and full of options",
   "dZh": "快樂、自由、選擇多多"
  },
  "8": {
   "sEn": "Decisiveness, courage and big-hearted protection of your people",
   "sZh": "果斷、勇氣、慷慨地保護自己人",
   "gEn": "Vulnerability and softness — intensity can land as intimidation, and being looked after can feel like a debt or a risk",
   "gZh": "脆弱與柔和——強度會被感受為威嚇，而被照顧會令你覺得像欠債或冒險",
   "dEn": "stay strong, self-reliant and in control of your own life",
   "dZh": "強大、自立、主宰自己的人生"
  },
  "9": {
   "sEn": "Patience, acceptance and a steady, calming presence",
   "sZh": "耐性、接納、穩定而令人安心的陪伴",
   "gEn": "Stating your own preference early and out loud — yours surface late or never, and numbness can replace a decision",
   "gZh": "及早、大聲說出自己的偏好——你的偏好總遲來甚至不來，麻木會取代決定",
   "dEn": "keep inner and outer peace",
   "dZh": "保持內外和平"
  }
 },
 "LP_PORTRAIT": {
  "1": {
   "gEn": "Collaboration — the lesson of Life Path 1 is learning to ask for help and share the lead, not only to start alone",
   "gZh": "合作——生命靈數 1 的課題是學會求助與分享主導，而非只獨自開展"
  },
  "2": {
   "gEn": "Stating needs directly — the lesson of Life Path 2 is asking plainly, not only sensing what others need",
   "gZh": "直接說出需要——生命靈數 2 的課題是平實地開口要求，而非只感知別人的需要"
  },
  "3": {
   "gEn": "Focus and follow-through — the lesson of Life Path 3 is finishing and depth beneath the expression",
   "gZh": "專注與貫徹——生命靈數 3 的課題是完成，以及表達之下的深度"
  },
  "4": {
   "gEn": "Flexibility — the lesson of Life Path 4 is letting a solid system bend without feeling it has failed",
   "gZh": "彈性——生命靈數 4 的課題是讓穩固的系統彎曲，而不覺得那是失敗"
  },
  "5": {
   "gEn": "Steadiness and commitment — the lesson of Life Path 5 is staying when the novelty fades",
   "gZh": "穩定與承諾——生命靈數 5 的課題是新鮮感退去後仍然留下"
  },
  "6": {
   "gEn": "Boundaries in caring — the lesson of Life Path 6 is tending without carrying everyone",
   "gZh": "照顧中的界線——生命靈數 6 的課題是照料而不背起所有人"
  },
  "7": {
   "gEn": "Trust and openness — the lesson of Life Path 7 is letting people in before every question is answered",
   "gZh": "信任與開放——生命靈數 7 的課題是在所有問題有答案之前，先讓人走近"
  },
  "8": {
   "gEn": "Ease with receiving and rest — the lesson of Life Path 8 is that worth is not only what you produce or control",
   "gZh": "安然接受與休息——生命靈數 8 的課題是：價值不只在於你生產或掌控了什麼"
  },
  "9": {
   "gEn": "Receiving and holding on lightly — the lesson of Life Path 9 is letting yourself be helped, and not releasing everything too soon",
   "gZh": "接受與輕握——生命靈數 9 的課題是讓自己被幫助，以及不要太快放開一切"
  },
  "11": {
   "gEn": "Grounding the signal — the lesson of Master 11 is rest, body and routine beneath heightened intuition",
   "gZh": "讓訊號落地——大師數 11 的課題是敏銳直覺之下的休息、身體與日常規律"
  },
  "22": {
   "gEn": "Pacing the vision — the lesson of Master 22 is building at a human speed without shrinking the vision",
   "gZh": "為遠見定步速——大師數 22 的課題是以人的速度建造，而不縮小遠見"
  },
  "33": {
   "gEn": "Boundaries at scale — the lesson of Master 33 is care that does not consume the carer",
   "gZh": "大規模下的界線——大師數 33 的課題是關懷而不耗盡關懷者"
  }
 },
 "MBTI_LETTER": {
  "E": {
   "en": "you recharge with people and think out loud — ideas form while you speak",
   "zh": "你靠與人相處充電、邊說邊想——說話時想法才成形"
  },
  "I": {
   "en": "you recharge alone or with one close person and think before you speak",
   "zh": "你靠獨處或與一位親近的人相處充電、先想後說"
  },
  "S": {
   "en": "you trust facts, details and what has actually worked before",
   "zh": "你信任事實、細節與過去實際有效的方法"
  },
  "N": {
   "en": "you trust patterns, possibilities and the big picture first",
   "zh": "你信任模式、可能性、先看全局"
  },
  "T": {
   "en": "you decide by logic and fairness — the same rules for everyone",
   "zh": "你以邏輯與公平作決定——人人同一套規則"
  },
  "F": {
   "en": "you decide by impact on people — how each person will feel",
   "zh": "你以對人的影響作決定——每個人會有什麼感受"
  },
  "J": {
   "en": "you plan ahead, decide early and like things finished before the deadline",
   "zh": "你預先計劃、及早決定、喜歡在死線前完成"
  },
  "P": {
   "en": "you stay flexible, decide as things unfold and use the deadline as fuel",
   "zh": "你保持彈性、隨事情發展再決定、用死線作動力"
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
   "在覺得準備好之前先開始——準備好，通常是獎賞，不是入場費。",
   "對自己許下的小承諾並守住，複利比許下又打破的大承諾更快。",
   "你每天餵養的，會成為你的性格；審視的是日常飲食，不只是某一天。",
   "休息不是野心的相反——它是野心中能持久的那部分。",
   "先說簡單而真實的話；修飾若仍有需要，之後再加。",
   "整固的季節不是失去的季節——力量就是在那裡儲存的。",
   "留意不斷回來的事。那個模式就是訊息本身，不是干擾。"
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
   "你不需要完美的一天——你需要在中午前，踏出一步誠實的步伐。",
   "你安靜地做過的工作，依然是工作。讓它算數。",
   "有人因為你的出現而更安定。那不是小事。",
   "能在壞心情中存活的進展，是真正的進展。你已經做到了。",
   "你可以同時是進行中的作品，和一句已完成的句子。",
   "昨天的證據說：你能慢慢地做困難的事。相信證據。",
   "開口求你樂意給予別人的那種幫助。它們是同一個份量。"
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
   "今日一個重點：完成你清單上最小的一件未完成之事，並好好收尾。",
   "今日一個重點：保護一小時，做只有你能做的工作。",
   "今日一個重點：把那封自昨天起在腦中寫著的訊息，真正發出去。",
   "今日一個重點：留一小時空白——並像守住一場會議一樣守住它。",
   "今日一個重點：把一個數字寫下來——一個價錢、一個日期、一條界線。",
   "今日一個重點：整理你每天早上第一眼看到的那個表面。",
   "今日一個重點：點名一件已完成的事，並停止再改進它。"
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
   "智慧語與鼓勵",
   "塔羅——今日一張牌",
   "星座——你今日的運勢",
   "易經——今日一卦",
   "鼓勵與一個實際重點",
   "數字命理與五行平衡",
   "每週反思"
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
   "zh": "會員有效期間"
  }
 }
};
