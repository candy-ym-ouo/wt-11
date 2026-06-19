import {
  SeasonPassTier,
  SeasonPassReward,
  SeasonPassQuestConfig,
  SeasonPassTrackType
} from '../types/GameTypes';

export const CURRENT_SEASON_ID = 'season_001';
export const CURRENT_SEASON_NAME = '春华秋实赛季';
export const SEASON_DURATION_DAYS = 60;
export const MAX_TRACK_LEVEL = 20;

function createReward(id: number, type: SeasonPassReward['type'], name: string, description: string, icon: string, rarity: SeasonPassReward['rarity'], value?: number, extra?: Partial<SeasonPassReward>): SeasonPassReward {
  return { id, type, name, description, icon, rarity, value, ...extra };
}

export const RestoreTrackTiers: SeasonPassTier[] = [
  { level: 1, trackType: 'restore' as SeasonPassTrackType, threshold: 0,
    freeReward: createReward(1001, 'score', '初始激励', '修复之路，从此启程', '⭐', 'common', 500),
    premiumReward: createReward(1101, 'score', '豪华启程礼', '尊享修复之旅起点', '💎', 'rare', 1000)
  },
  { level: 2, trackType: 'restore' as SeasonPassTrackType, threshold: 5,
    freeReward: createReward(1002, 'fragment', '植物碎片×3', '解锁工坊合成素材', '🧩', 'common', 3, { fragmentId: 1 }),
    premiumReward: createReward(1102, 'fragment', '珍稀碎片×5', '高阶合成关键材料', '💠', 'rare', 5, { fragmentId: 2 })
  },
  { level: 3, trackType: 'restore' as SeasonPassTrackType, threshold: 15,
    freeReward: createReward(1003, 'material', '修复工具包', '专业级修复耗材', '🧰', 'common', 1, { materialId: 1 }),
    premiumReward: createReward(1103, 'material', '高级修复套件', '大师级修复耗材', '🛠️', 'rare', 1, { materialId: 2 })
  },
  { level: 4, trackType: 'restore' as SeasonPassTrackType, threshold: 30,
    freeReward: createReward(1004, 'research_point', '研究点数×100', '解锁标本研究', '🔬', 'rare', 100),
    premiumReward: createReward(1104, 'research_point', '研究点数×250', '深度研究资源', '🔭', 'rare', 250)
  },
  { level: 5, trackType: 'restore' as SeasonPassTrackType, threshold: 50,
    freeReward: createReward(1005, 'badge', '修复学徒徽章', '初级修复师荣誉', '🎖️', 'rare', undefined, { badgeId: 301 }),
    premiumReward: createReward(1105, 'badge', '修复行家徽章', '高阶修复师认证', '🏅', 'epic', undefined, { badgeId: 302 })
  },
  { level: 6, trackType: 'restore' as SeasonPassTrackType, threshold: 75,
    freeReward: createReward(1006, 'score', '技艺精进奖', '修复技能持续提升', '🌟', 'rare', 2000),
    premiumReward: createReward(1106, 'score', '大师之路奖励', '精英修复师专属', '✨', 'epic', 5000)
  },
  { level: 7, trackType: 'restore' as SeasonPassTrackType, threshold: 100,
    freeReward: createReward(1007, 'fragment', '稀有碎片×8', '珍贵合成素材', '💎', 'rare', 8, { fragmentId: 3 }),
    premiumReward: createReward(1107, 'specimen', '限定标本·雪莲', '珍稀高山植物标本', '❄️', 'epic', undefined, { specimenId: 105 })
  },
  { level: 8, trackType: 'restore' as SeasonPassTrackType, threshold: 140,
    freeReward: createReward(1008, 'material', '高级修复材料×2', '批量修复耗材', '📦', 'rare', 2, { materialId: 3 }),
    premiumReward: createReward(1108, 'material', '顶级修复套装', '大师专属工具包', '🎁', 'epic', 3, { materialId: 4 })
  },
  { level: 9, trackType: 'restore' as SeasonPassTrackType, threshold: 180,
    freeReward: createReward(1009, 'research_point', '研究点数×400', '科研深度探索', '🔬', 'rare', 400),
    premiumReward: createReward(1109, 'research_point', '研究点数×1000', '顶级科研资源', '🔭', 'epic', 1000)
  },
  { level: 10, trackType: 'restore' as SeasonPassTrackType, threshold: 230,
    freeReward: createReward(1010, 'badge', '修复专家徽章', '百次修复达成', '🥇', 'epic', undefined, { badgeId: 303 }),
    premiumReward: createReward(1110, 'title', '称号·修复宗师', '尊贵身份象征', '👑', 'legendary', undefined, { titleId: 101 })
  },
  { level: 11, trackType: 'restore' as SeasonPassTrackType, threshold: 290,
    freeReward: createReward(1011, 'fragment', '史诗碎片×10', '传说级合成素材', '🌟', 'epic', 10, { fragmentId: 4 }),
    premiumReward: createReward(1111, 'score', '宗师嘉奖', '传奇修复师认可', '🏆', 'epic', 10000)
  },
  { level: 12, trackType: 'restore' as SeasonPassTrackType, threshold: 360,
    freeReward: createReward(1012, 'score', '进阶奖励', '持续修复的回报', '💫', 'rare', 3000),
    premiumReward: createReward(1112, 'fragment', '传说碎片×15', '终极合成素材', '⭐', 'legendary', 15, { fragmentId: 5 })
  },
  { level: 13, trackType: 'restore' as SeasonPassTrackType, threshold: 440,
    freeReward: createReward(1013, 'material', '珍稀材料×3', '稀有修复耗材', '📜', 'epic', 3, { materialId: 5 }),
    premiumReward: createReward(1113, 'material', '传说材料×5', '神话级修复耗材', '📖', 'legendary', 5, { materialId: 6 })
  },
  { level: 14, trackType: 'restore' as SeasonPassTrackType, threshold: 530,
    freeReward: createReward(1014, 'research_point', '研究点数×700', '探索未知领域', '🔬', 'epic', 700),
    premiumReward: createReward(1114, 'research_point', '研究点数×2000', '科研巅峰资源', '🔭', 'legendary', 2000)
  },
  { level: 15, trackType: 'restore' as SeasonPassTrackType, threshold: 630,
    freeReward: createReward(1015, 'badge', '修复大师徽章', '600次修复成就', '🏆', 'epic', undefined, { badgeId: 304 }),
    premiumReward: createReward(1115, 'specimen', '传说标本·昙花', '月下美人专属', '🌸', 'legendary', undefined, { specimenId: 104 })
  },
  { level: 16, trackType: 'restore' as SeasonPassTrackType, threshold: 750,
    freeReward: createReward(1016, 'score', '坚守者奖励', '不懈修复的见证', '🌟', 'epic', 6000),
    premiumReward: createReward(1116, 'score', '传奇嘉奖', '顶级修复师荣耀', '👑', 'legendary', 15000)
  },
  { level: 17, trackType: 'restore' as SeasonPassTrackType, threshold: 880,
    freeReward: createReward(1017, 'fragment', '传说碎片×12', '神话合成素材', '💫', 'epic', 12, { fragmentId: 6 }),
    premiumReward: createReward(1117, 'fragment', '神话碎片×20', '终极稀有素材', '✨', 'legendary', 20, { fragmentId: 7 })
  },
  { level: 18, trackType: 'restore' as SeasonPassTrackType, threshold: 1020,
    freeReward: createReward(1018, 'material', '传说材料×5', '终极修复耗材', '📜', 'epic', 5, { materialId: 7 }),
    premiumReward: createReward(1118, 'badge', '修复泰斗徽章', '千次修复荣耀', '👑', 'legendary', undefined, { badgeId: 305 })
  },
  { level: 19, trackType: 'restore' as SeasonPassTrackType, threshold: 1200,
    freeReward: createReward(1019, 'research_point', '研究点数×1500', '科研大师资源', '🔭', 'epic', 1500),
    premiumReward: createReward(1119, 'title', '称号·植物泰斗', '最高荣誉称号', '👑', 'legendary', undefined, { titleId: 102 })
  },
  { level: 20, trackType: 'restore' as SeasonPassTrackType, threshold: 1500,
    freeReward: createReward(1020, 'badge', '修复传奇徽章', '赛季终极荣誉', '🏆', 'legendary', undefined, { badgeId: 306 }),
    premiumReward: createReward(1120, 'specimen', '终极限定·彼岸花', '传说级神秘标本', '🌺', 'legendary', undefined, { specimenId: 103 })
  }
];

export const ScoreTrackTiers: SeasonPassTier[] = [
  { level: 1, trackType: 'score' as SeasonPassTrackType, threshold: 0,
    freeReward: createReward(2001, 'score', '起步鼓励', '得分之路开启', '⭐', 'common', 200),
    premiumReward: createReward(2101, 'score', '尊享起点礼', '精英得分手起点', '💎', 'rare', 500)
  },
  { level: 2, trackType: 'score' as SeasonPassTrackType, threshold: 5000,
    freeReward: createReward(2002, 'fragment', '基础碎片×2', '初级合成素材', '🧩', 'common', 2, { fragmentId: 1 }),
    premiumReward: createReward(2102, 'research_point', '研究点数×50', '科研资源加成', '🔬', 'rare', 50)
  },
  { level: 3, trackType: 'score' as SeasonPassTrackType, threshold: 20000,
    freeReward: createReward(2003, 'score', '得分跃进奖', '分数突破里程碑', '🌟', 'common', 800),
    premiumReward: createReward(2103, 'material', '专业修复材料', '提升修复效率', '🧰', 'rare', 1, { materialId: 1 })
  },
  { level: 4, trackType: 'score' as SeasonPassTrackType, threshold: 50000,
    freeReward: createReward(2004, 'research_point', '研究点数×80', '解锁更多知识', '🔬', 'rare', 80),
    premiumReward: createReward(2104, 'fragment', '珍稀碎片×4', '珍贵合成素材', '💠', 'rare', 4, { fragmentId: 2 })
  },
  { level: 5, trackType: 'score' as SeasonPassTrackType, threshold: 100000,
    freeReward: createReward(2005, 'badge', '得分新星徽章', '十万分达成', '🎖️', 'rare', undefined, { badgeId: 311 }),
    premiumReward: createReward(2105, 'badge', '得分高手徽章', '精英得分手认证', '🏅', 'epic', undefined, { badgeId: 312 })
  },
  { level: 6, trackType: 'score' as SeasonPassTrackType, threshold: 200000,
    freeReward: createReward(2006, 'fragment', '稀有碎片×5', '高阶合成材料', '💎', 'rare', 5, { fragmentId: 3 }),
    premiumReward: createReward(2106, 'score', '得分王奖励', '高分玩家专属', '✨', 'epic', 3000)
  },
  { level: 7, trackType: 'score' as SeasonPassTrackType, threshold: 350000,
    freeReward: createReward(2007, 'material', '高级修复材料', '提升修复品质', '📦', 'rare', 1, { materialId: 2 }),
    premiumReward: createReward(2107, 'research_point', '研究点数×300', '深度研究支持', '🔭', 'epic', 300)
  },
  { level: 8, trackType: 'score' as SeasonPassTrackType, threshold: 550000,
    freeReward: createReward(2008, 'score', '高分精进奖', '持续突破自我', '💫', 'rare', 2500),
    premiumReward: createReward(2108, 'fragment', '史诗碎片×7', '顶级合成素材', '🌟', 'epic', 7, { fragmentId: 4 })
  },
  { level: 9, trackType: 'score' as SeasonPassTrackType, threshold: 800000,
    freeReward: createReward(2009, 'research_point', '研究点数×200', '科研探索资源', '🔬', 'rare', 200),
    premiumReward: createReward(2109, 'material', '顶级修复套装×2', '大师级修复耗材', '🎁', 'epic', 2, { materialId: 3 })
  },
  { level: 10, trackType: 'score' as SeasonPassTrackType, threshold: 1100000,
    freeReward: createReward(2010, 'badge', '得分精英徽章', '百万分里程碑', '🥇', 'epic', undefined, { badgeId: 313 }),
    premiumReward: createReward(2110, 'title', '称号·得分大师', '高分玩家荣耀', '👑', 'legendary', undefined, { titleId: 111 })
  },
  { level: 11, trackType: 'score' as SeasonPassTrackType, threshold: 1500000,
    freeReward: createReward(2011, 'fragment', '史诗碎片×8', '传说级素材', '🌟', 'epic', 8, { fragmentId: 5 }),
    premiumReward: createReward(2111, 'score', '精英得分奖', '顶尖玩家认可', '🏆', 'epic', 8000)
  },
  { level: 12, trackType: 'score' as SeasonPassTrackType, threshold: 2000000,
    freeReward: createReward(2012, 'score', '超越奖励', '突破两百万分', '💫', 'epic', 5000),
    premiumReward: createReward(2112, 'specimen', '限定标本·睡莲', '水中女神专属', '🪷', 'epic', undefined, { specimenId: 102 })
  },
  { level: 13, trackType: 'score' as SeasonPassTrackType, threshold: 2600000,
    freeReward: createReward(2013, 'material', '珍稀材料×2', '稀有修复耗材', '📜', 'epic', 2, { materialId: 4 }),
    premiumReward: createReward(2113, 'research_point', '研究点数×800', '科研巅峰资源', '🔭', 'legendary', 800)
  },
  { level: 14, trackType: 'score' as SeasonPassTrackType, threshold: 3300000,
    freeReward: createReward(2014, 'research_point', '研究点数×500', '科研进阶资源', '🔬', 'epic', 500),
    premiumReward: createReward(2114, 'fragment', '传说碎片×12', '神话级合成素材', '⭐', 'legendary', 12, { fragmentId: 6 })
  },
  { level: 15, trackType: 'score' as SeasonPassTrackType, threshold: 4200000,
    freeReward: createReward(2015, 'badge', '得分大师徽章', '高分成就认证', '🏆', 'epic', undefined, { badgeId: 314 }),
    premiumReward: createReward(2115, 'specimen', '限定标本·樱花', '春日浪漫专属', '🌸', 'legendary', undefined, { specimenId: 101 })
  },
  { level: 16, trackType: 'score' as SeasonPassTrackType, threshold: 5200000,
    freeReward: createReward(2016, 'score', '攀登者奖励', '五百万分达成', '🌟', 'epic', 10000),
    premiumReward: createReward(2116, 'score', '传奇得分奖', '顶尖玩家荣耀', '👑', 'legendary', 20000)
  },
  { level: 17, trackType: 'score' as SeasonPassTrackType, threshold: 6400000,
    freeReward: createReward(2017, 'fragment', '传说碎片×10', '终极合成素材', '💫', 'epic', 10, { fragmentId: 7 }),
    premiumReward: createReward(2117, 'material', '神话材料×8', '终极修复耗材', '📖', 'legendary', 8, { materialId: 5 })
  },
  { level: 18, trackType: 'score' as SeasonPassTrackType, threshold: 7800000,
    freeReward: createReward(2018, 'material', '传说材料×3', '顶级修复耗材', '📜', 'epic', 3, { materialId: 6 }),
    premiumReward: createReward(2118, 'badge', '得分传奇徽章', '赛季最高得分荣誉', '👑', 'legendary', undefined, { badgeId: 315 })
  },
  { level: 19, trackType: 'score' as SeasonPassTrackType, threshold: 9500000,
    freeReward: createReward(2019, 'research_point', '研究点数×1200', '科研大师资源', '🔭', 'epic', 1200),
    premiumReward: createReward(2119, 'title', '称号·得分之神', '最高分玩家称号', '👑', 'legendary', undefined, { titleId: 112 })
  },
  { level: 20, trackType: 'score' as SeasonPassTrackType, threshold: 12000000,
    freeReward: createReward(2020, 'badge', '得分传奇徽章', '赛季终极荣誉', '🏆', 'legendary', undefined, { badgeId: 316 }),
    premiumReward: createReward(2120, 'title', '称号·标本之巅', '全能大师荣誉', '👑', 'legendary', undefined, { titleId: 113 })
  }
];

export const GalleryTrackTiers: SeasonPassTier[] = [
  { level: 1, trackType: 'gallery' as SeasonPassTrackType, threshold: 0,
    freeReward: createReward(3001, 'score', '收藏起点', '图鉴收集之旅开启', '⭐', 'common', 300),
    premiumReward: createReward(3101, 'fragment', '初始碎片×3', '助力标本收集', '🧩', 'rare', 3, { fragmentId: 1 })
  },
  { level: 2, trackType: 'gallery' as SeasonPassTrackType, threshold: 2,
    freeReward: createReward(3002, 'research_point', '研究点数×30', '初识植物世界', '🔬', 'common', 30),
    premiumReward: createReward(3102, 'score', '收藏鼓励奖', '图鉴收集加成', '💎', 'rare', 600)
  },
  { level: 3, trackType: 'gallery' as SeasonPassTrackType, threshold: 4,
    freeReward: createReward(3003, 'fragment', '基础碎片×3', '合成更多标本', '🧩', 'common', 3, { fragmentId: 1 }),
    premiumReward: createReward(3103, 'material', '基础修复材料×2', '修复更多标本', '🧰', 'rare', 2, { materialId: 1 })
  },
  { level: 4, trackType: 'gallery' as SeasonPassTrackType, threshold: 6,
    freeReward: createReward(3004, 'score', '图鉴扩展奖', '收藏家族壮大', '🌟', 'rare', 1200),
    premiumReward: createReward(3104, 'research_point', '研究点数×120', '深入植物研究', '🔬', 'rare', 120)
  },
  { level: 5, trackType: 'gallery' as SeasonPassTrackType, threshold: 8,
    freeReward: createReward(3005, 'badge', '收藏入门徽章', '8种标本收集', '🎖️', 'rare', undefined, { badgeId: 321 }),
    premiumReward: createReward(3105, 'fragment', '珍稀碎片×5', '稀有合成素材', '💠', 'rare', 5, { fragmentId: 2 })
  },
  { level: 6, trackType: 'gallery' as SeasonPassTrackType, threshold: 10,
    freeReward: createReward(3006, 'material', '高级修复材料', '解锁更多标本', '📦', 'rare', 1, { materialId: 2 }),
    premiumReward: createReward(3106, 'score', '收藏家奖励', '图鉴爱好者专属', '✨', 'epic', 3500)
  },
  { level: 7, trackType: 'gallery' as SeasonPassTrackType, threshold: 12,
    freeReward: createReward(3007, 'research_point', '研究点数×200', '研究多样化植物', '🔬', 'rare', 200),
    premiumReward: createReward(3107, 'fragment', '稀有碎片×6', '高阶合成素材', '💎', 'epic', 6, { fragmentId: 3 })
  },
  { level: 8, trackType: 'gallery' as SeasonPassTrackType, threshold: 14,
    freeReward: createReward(3008, 'score', '收藏精进奖', '持续收藏的回报', '💫', 'rare', 2500),
    premiumReward: createReward(3108, 'material', '顶级修复套装', '大师级修复耗材', '🎁', 'epic', 1, { materialId: 3 })
  },
  { level: 9, trackType: 'gallery' as SeasonPassTrackType, threshold: 16,
    freeReward: createReward(3009, 'fragment', '稀有碎片×5', '珍贵合成素材', '💎', 'rare', 5, { fragmentId: 3 }),
    premiumReward: createReward(3109, 'research_point', '研究点数×500', '深度研究资源', '🔭', 'epic', 500)
  },
  { level: 10, trackType: 'gallery' as SeasonPassTrackType, threshold: 18,
    freeReward: createReward(3010, 'badge', '收藏达人徽章', '18种标本认证', '🥇', 'epic', undefined, { badgeId: 322 }),
    premiumReward: createReward(3110, 'title', '称号·收藏专家', '图鉴收藏家荣耀', '👑', 'legendary', undefined, { titleId: 121 })
  },
  { level: 11, trackType: 'gallery' as SeasonPassTrackType, threshold: 20,
    freeReward: createReward(3011, 'score', '收藏里程碑', '20种标本达成', '🌟', 'epic', 6000),
    premiumReward: createReward(3111, 'specimen', '限定标本·睡莲', '水中女神', '🪷', 'epic', undefined, { specimenId: 102 })
  },
  { level: 12, trackType: 'gallery' as SeasonPassTrackType, threshold: 22,
    freeReward: createReward(3012, 'material', '珍稀材料×2', '稀有修复耗材', '📜', 'epic', 2, { materialId: 4 }),
    premiumReward: createReward(3112, 'fragment', '史诗碎片×8', '顶级合成素材', '🌟', 'epic', 8, { fragmentId: 4 })
  },
  { level: 13, trackType: 'gallery' as SeasonPassTrackType, threshold: 24,
    freeReward: createReward(3013, 'research_point', '研究点数×400', '科研进阶资源', '🔬', 'epic', 400),
    premiumReward: createReward(3113, 'score', '资深收藏家奖', '图鉴专家专属', '🏆', 'epic', 12000)
  },
  { level: 14, trackType: 'gallery' as SeasonPassTrackType, threshold: 26,
    freeReward: createReward(3014, 'fragment', '史诗碎片×6', '传说级素材', '🌟', 'epic', 6, { fragmentId: 5 }),
    premiumReward: createReward(3114, 'material', '神话材料×3', '终极修复耗材', '📖', 'legendary', 3, { materialId: 5 })
  },
  { level: 15, trackType: 'gallery' as SeasonPassTrackType, threshold: 28,
    freeReward: createReward(3015, 'badge', '收藏大师徽章', '图鉴大师认证', '🏆', 'epic', undefined, { badgeId: 323 }),
    premiumReward: createReward(3115, 'specimen', '限定标本·樱花', '春日专属', '🌸', 'legendary', undefined, { specimenId: 101 })
  },
  { level: 16, trackType: 'gallery' as SeasonPassTrackType, threshold: 30,
    freeReward: createReward(3016, 'score', '全图鉴奖励', '30种标本达成', '🌟', 'epic', 15000),
    premiumReward: createReward(3116, 'research_point', '研究点数×1500', '科研终极资源', '🔭', 'legendary', 1500)
  },
  { level: 17, trackType: 'gallery' as SeasonPassTrackType, threshold: 33,
    freeReward: createReward(3017, 'material', '传说材料×3', '顶级修复耗材', '📜', 'epic', 3, { materialId: 6 }),
    premiumReward: createReward(3117, 'fragment', '传说碎片×15', '终极合成素材', '⭐', 'legendary', 15, { fragmentId: 6 })
  },
  { level: 18, trackType: 'gallery' as SeasonPassTrackType, threshold: 36,
    freeReward: createReward(3018, 'research_point', '研究点数×800', '科研大师资源', '🔭', 'epic', 800),
    premiumReward: createReward(3118, 'badge', '收藏泰斗徽章', '全图鉴终极荣誉', '👑', 'legendary', undefined, { badgeId: 324 })
  },
  { level: 19, trackType: 'gallery' as SeasonPassTrackType, threshold: 40,
    freeReward: createReward(3019, 'fragment', '传说碎片×10', '神话级合成素材', '💫', 'epic', 10, { fragmentId: 7 }),
    premiumReward: createReward(3119, 'title', '称号·博物学家', '植物界终极荣耀', '👑', 'legendary', undefined, { titleId: 122 })
  },
  { level: 20, trackType: 'gallery' as SeasonPassTrackType, threshold: 50,
    freeReward: createReward(3020, 'badge', '收藏传奇徽章', '赛季终极收藏荣誉', '🏆', 'legendary', undefined, { badgeId: 325 }),
    premiumReward: createReward(3120, 'specimen', '终极限定·彼岸花', '传说神秘标本', '🌺', 'legendary', undefined, { specimenId: 103 })
  }
];

export const SeasonPassQuestPool: SeasonPassQuestConfig[] = [
  {
    id: 'sp_restore_1',
    title: '修复新手',
    description: '完成3次标本修复',
    trackType: 'restore' as SeasonPassTrackType,
    targetCount: 3,
    difficulty: 'easy',
    durationDays: 1,
    rewards: [createReward(4001, 'score', '任务奖励', '修复新手任务完成', '⭐', 'common', 300)]
  },
  {
    id: 'sp_restore_2',
    title: '修复进阶',
    description: '完成8次标本修复',
    trackType: 'restore' as SeasonPassTrackType,
    targetCount: 8,
    difficulty: 'easy',
    durationDays: 1,
    rewards: [createReward(4002, 'fragment', '碎片奖励', '修复进阶奖励', '🧩', 'common', 2, { fragmentId: 1 })]
  },
  {
    id: 'sp_restore_3',
    title: '修复达人',
    description: '完成20次标本修复',
    trackType: 'restore' as SeasonPassTrackType,
    targetCount: 20,
    difficulty: 'medium',
    durationDays: 3,
    rewards: [createReward(4003, 'research_point', '研究点奖励', '修复达人任务完成', '🔬', 'rare', 120)]
  },
  {
    id: 'sp_restore_4',
    title: '修复专家',
    description: '完成50次标本修复',
    trackType: 'restore' as SeasonPassTrackType,
    targetCount: 50,
    difficulty: 'hard',
    durationDays: 7,
    rewards: [createReward(4004, 'score', '专家奖励', '修复专家任务完成', '🌟', 'rare', 3000)]
  },
  {
    id: 'sp_score_1',
    title: '得分积累',
    description: '累计获得5000分',
    trackType: 'score' as SeasonPassTrackType,
    targetCount: 5000,
    difficulty: 'easy',
    durationDays: 1,
    rewards: [createReward(4011, 'score', '得分奖励', '得分积累任务完成', '⭐', 'common', 400)]
  },
  {
    id: 'sp_score_2',
    title: '高分挑战',
    description: '累计获得30000分',
    trackType: 'score' as SeasonPassTrackType,
    targetCount: 30000,
    difficulty: 'medium',
    durationDays: 3,
    rewards: [createReward(4012, 'fragment', '碎片奖励', '高分挑战完成', '💠', 'rare', 3, { fragmentId: 2 })]
  },
  {
    id: 'sp_score_3',
    title: '得分冲刺',
    description: '累计获得150000分',
    trackType: 'score' as SeasonPassTrackType,
    targetCount: 150000,
    difficulty: 'hard',
    durationDays: 7,
    rewards: [createReward(4013, 'research_point', '研究点奖励', '得分冲刺完成', '🔬', 'epic', 400)]
  },
  {
    id: 'sp_gallery_1',
    title: '图鉴入门',
    description: '解锁2种新的植物标本',
    trackType: 'gallery' as SeasonPassTrackType,
    targetCount: 2,
    difficulty: 'easy',
    durationDays: 2,
    rewards: [createReward(4021, 'score', '图鉴奖励', '图鉴入门任务完成', '⭐', 'common', 500)]
  },
  {
    id: 'sp_gallery_2',
    title: '图鉴扩展',
    description: '解锁5种新的植物标本',
    trackType: 'gallery' as SeasonPassTrackType,
    targetCount: 5,
    difficulty: 'medium',
    durationDays: 5,
    rewards: [createReward(4022, 'material', '材料奖励', '图鉴扩展任务完成', '🧰', 'rare', 2, { materialId: 1 })]
  },
  {
    id: 'sp_gallery_3',
    title: '图鉴大师',
    description: '解锁10种新的植物标本',
    trackType: 'gallery' as SeasonPassTrackType,
    targetCount: 10,
    difficulty: 'hard',
    durationDays: 10,
    rewards: [createReward(4023, 'score', '大师奖励', '图鉴大师任务完成', '🌟', 'epic', 6000)]
  },
  {
    id: 'sp_restore_specimen_1',
    title: '银杏守护',
    description: '修复银杏标本3次',
    trackType: 'restore' as SeasonPassTrackType,
    targetCount: 3,
    difficulty: 'easy',
    durationDays: 2,
    targetSpecimenId: 1,
    rewards: [createReward(4031, 'fragment', '银杏碎片', '银杏专属碎片', '🍂', 'rare', 3, { fragmentId: 1 })]
  },
  {
    id: 'sp_restore_specimen_2',
    title: '玫瑰情缘',
    description: '修复玫瑰标本5次',
    trackType: 'restore' as SeasonPassTrackType,
    targetCount: 5,
    difficulty: 'medium',
    durationDays: 3,
    targetSpecimenId: 2,
    rewards: [createReward(4032, 'fragment', '玫瑰碎片', '玫瑰专属碎片', '🌹', 'rare', 5, { fragmentId: 2 })]
  },
  {
    id: 'sp_score_level_1',
    title: '关卡高分',
    description: '在任意关卡获得1000分以上',
    trackType: 'score' as SeasonPassTrackType,
    targetCount: 1,
    difficulty: 'medium',
    durationDays: 2,
    targetScore: 1000,
    rewards: [createReward(4041, 'score', '高分关卡奖励', '单局高分达成', '⭐', 'rare', 1500)]
  }
];

export function getTrackTiers(trackType: SeasonPassTrackType): SeasonPassTier[] {
  switch (trackType) {
    case 'restore': return RestoreTrackTiers;
    case 'score': return ScoreTrackTiers;
    case 'gallery': return GalleryTrackTiers;
  }
}

export function getTrackTier(trackType: SeasonPassTrackType, level: number): SeasonPassTier | undefined {
  const tiers = getTrackTiers(trackType);
  return tiers.find(t => t.level === level);
}

export function getCurrentLevel(trackType: SeasonPassTrackType, currentValue: number): { level: number; nextThreshold: number; currentThreshold: number } {
  const tiers = getTrackTiers(trackType);
  let level = 0;
  let currentThreshold = 0;
  let nextThreshold = tiers[0]?.threshold ?? 0;

  for (let i = 0; i < tiers.length; i++) {
    if (currentValue >= tiers[i].threshold) {
      level = tiers[i].level;
      currentThreshold = tiers[i].threshold;
      nextThreshold = tiers[i + 1]?.threshold ?? tiers[i].threshold;
    } else {
      break;
    }
  }

  return { level, nextThreshold, currentThreshold };
}

export function getTrackName(trackType: SeasonPassTrackType): string {
  const names: Record<SeasonPassTrackType, string> = {
    restore: '修复次数',
    score: '得分目标',
    gallery: '图鉴完成度'
  };
  return names[trackType];
}

export function getTrackIcon(trackType: SeasonPassTrackType): string {
  const icons: Record<SeasonPassTrackType, string> = {
    restore: '🧩',
    score: '🏆',
    gallery: '📖'
  };
  return icons[trackType];
}

export function getTrackColor(trackType: SeasonPassTrackType): number {
  const colors: Record<SeasonPassTrackType, number> = {
    restore: 0x4CAF50,
    score: 0xFFC107,
    gallery: 0x2196F3
  };
  return colors[trackType];
}
