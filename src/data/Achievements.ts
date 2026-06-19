import { Achievement, Title, AchievementCategory, AchievementRarity, TitleRarity } from '../types/GameTypes';

export const Achievements: Achievement[] = [
  {
    id: 1001,
    name: '初入植物世界',
    description: '完成第一个关卡',
    icon: '🌱',
    category: 'level',
    rarity: 'common',
    condition: { type: 'complete_levels', target: 1 },
    rewardScore: 100,
    unlocked: false
  },
  {
    id: 1002,
    name: '拼图新手',
    description: '完成10个关卡',
    icon: '🌿',
    category: 'level',
    rarity: 'common',
    condition: { type: 'complete_levels', target: 10 },
    rewardScore: 300,
    unlocked: false
  },
  {
    id: 1003,
    name: '标本修复师',
    description: '完成30个关卡',
    icon: '🌳',
    category: 'level',
    rarity: 'rare',
    condition: { type: 'complete_levels', target: 30 },
    rewardScore: 800,
    unlocked: false
  },
  {
    id: 1004,
    name: '植物学家',
    description: '完成所有主线关卡',
    icon: '🌲',
    category: 'level',
    rarity: 'epic',
    condition: { type: 'complete_all_levels', target: 1 },
    rewardScore: 2000,
    unlocked: false
  },
  {
    id: 1005,
    name: '完美通关',
    description: '任意关卡获得3星评价',
    icon: '⭐',
    category: 'level',
    rarity: 'common',
    condition: { type: 'perfect_level', target: 1 },
    rewardScore: 200,
    unlocked: false
  },
  {
    id: 1006,
    name: '星之收藏家',
    description: '累计获得50颗星星',
    icon: '🌟',
    category: 'level',
    rarity: 'rare',
    condition: { type: 'total_stars', target: 50 },
    rewardScore: 600,
    unlocked: false
  },
  {
    id: 1007,
    name: '银河漫游者',
    description: '累计获得150颗星星',
    icon: '💫',
    category: 'level',
    rarity: 'epic',
    condition: { type: 'total_stars', target: 150 },
    rewardScore: 1500,
    unlocked: false
  },
  {
    id: 1008,
    name: '第一章·入门',
    description: '完成第一章所有关卡',
    icon: '📗',
    category: 'level',
    rarity: 'common',
    condition: { type: 'complete_chapter', target: 1, chapterId: 1 },
    rewardScore: 400,
    unlocked: false
  },
  {
    id: 1009,
    name: '第二章·进阶',
    description: '完成第二章所有关卡',
    icon: '📘',
    category: 'level',
    rarity: 'rare',
    condition: { type: 'complete_chapter', target: 1, chapterId: 2 },
    rewardScore: 600,
    unlocked: false
  },
  {
    id: 1010,
    name: '第三章·精通',
    description: '完成第三章所有关卡',
    icon: '📕',
    category: 'level',
    rarity: 'epic',
    condition: { type: 'complete_chapter', target: 1, chapterId: 3 },
    rewardScore: 1000,
    unlocked: false
  },

  {
    id: 2001,
    name: '图鉴开启者',
    description: '解锁第一个植物标本',
    icon: '📖',
    category: 'gallery',
    rarity: 'common',
    condition: { type: 'unlock_specimens', target: 1 },
    rewardScore: 100,
    unlocked: false
  },
  {
    id: 2002,
    name: '小小收藏家',
    description: '解锁5个植物标本',
    icon: '📚',
    category: 'gallery',
    rarity: 'common',
    condition: { type: 'unlock_specimens', target: 5 },
    rewardScore: 250,
    unlocked: false
  },
  {
    id: 2003,
    name: '植物爱好者',
    description: '解锁15个植物标本',
    icon: '🌺',
    category: 'gallery',
    rarity: 'rare',
    condition: { type: 'unlock_specimens', target: 15 },
    rewardScore: 700,
    unlocked: false
  },
  {
    id: 2004,
    name: '标本馆馆长',
    description: '解锁所有植物标本',
    icon: '🏛️',
    category: 'gallery',
    rarity: 'legendary',
    condition: { type: 'unlock_all_specimens', target: 1 },
    rewardScore: 3000,
    unlocked: false
  },
  {
    id: 2005,
    name: '稀有猎人',
    description: '解锁3个活动限定标本',
    icon: '✨',
    category: 'gallery',
    rarity: 'epic',
    condition: { type: 'unlock_event_specimens', target: 3 },
    rewardScore: 1200,
    unlocked: false
  },

  {
    id: 3001,
    name: '极速修复',
    description: '在60秒内完成任意关卡',
    icon: '⚡',
    category: 'speed',
    rarity: 'common',
    condition: { type: 'speed_complete', target: 60 },
    rewardScore: 200,
    unlocked: false
  },
  {
    id: 3002,
    name: '风驰电掣',
    description: '在30秒内完成任意关卡',
    icon: '🌪️',
    category: 'speed',
    rarity: 'rare',
    condition: { type: 'speed_complete', target: 30 },
    rewardScore: 500,
    unlocked: false
  },
  {
    id: 3003,
    name: '闪电之手',
    description: '在15秒内完成任意关卡',
    icon: '⚡',
    category: 'speed',
    rarity: 'epic',
    condition: { type: 'speed_complete', target: 15 },
    rewardScore: 1500,
    unlocked: false
  },
  {
    id: 3004,
    name: '速度之王',
    description: '所有关卡都进入60秒以内',
    icon: '👑',
    category: 'speed',
    rarity: 'legendary',
    condition: { type: 'all_levels_speed', target: 60 },
    rewardScore: 5000,
    unlocked: false
  },
  {
    id: 3005,
    name: '困难极速',
    description: '在90秒内完成困难关卡',
    icon: '🔥',
    category: 'speed',
    rarity: 'rare',
    condition: { type: 'speed_difficulty', target: 90, difficulty: 'hard' },
    rewardScore: 600,
    unlocked: false
  },

  {
    id: 4001,
    name: '初见',
    description: '第一天登录游戏',
    icon: '🌅',
    category: 'login',
    rarity: 'common',
    condition: { type: 'login_days', target: 1 },
    rewardScore: 50,
    unlocked: false
  },
  {
    id: 4002,
    name: '坚持不懈',
    description: '连续登录3天',
    icon: '📅',
    category: 'login',
    rarity: 'common',
    condition: { type: 'login_streak', target: 3 },
    rewardScore: 150,
    unlocked: false
  },
  {
    id: 4003,
    name: '周更达人',
    description: '连续登录7天',
    icon: '🗓️',
    category: 'login',
    rarity: 'rare',
    condition: { type: 'login_streak', target: 7 },
    rewardScore: 400,
    unlocked: false
  },
  {
    id: 4004,
    name: '月度冠军',
    description: '连续登录30天',
    icon: '🏆',
    category: 'login',
    rarity: 'epic',
    condition: { type: 'login_streak', target: 30 },
    rewardScore: 2000,
    unlocked: false
  },
  {
    id: 4005,
    name: '忠实玩家',
    description: '累计登录50天',
    icon: '💎',
    category: 'login',
    rarity: 'epic',
    condition: { type: 'total_logins', target: 50 },
    rewardScore: 1500,
    unlocked: false
  },

  {
    id: 5001,
    name: '工坊入门',
    description: '修复第一个植物标本',
    icon: '🔧',
    category: 'collection',
    rarity: 'common',
    condition: { type: 'restore_specimens', target: 1 },
    rewardScore: 150,
    unlocked: false
  },
  {
    id: 5002,
    name: '修复专家',
    description: '修复10个植物标本',
    icon: '🛠️',
    category: 'collection',
    rarity: 'rare',
    condition: { type: 'restore_specimens', target: 10 },
    rewardScore: 800,
    unlocked: false
  },
  {
    id: 5003,
    name: '碎片收集者',
    description: '收集50个碎片',
    icon: '🧩',
    category: 'collection',
    rarity: 'common',
    condition: { type: 'collect_fragments', target: 50 },
    rewardScore: 200,
    unlocked: false
  },
  {
    id: 5004,
    name: '知识探索者',
    description: '解锁10条知识条目',
    icon: '🔬',
    category: 'collection',
    rarity: 'rare',
    condition: { type: 'unlock_knowledge', target: 10 },
    rewardScore: 600,
    unlocked: false
  },
  {
    id: 5005,
    name: '研究员',
    description: '研究员等级达到5级',
    icon: '🥼',
    category: 'collection',
    rarity: 'rare',
    condition: { type: 'researcher_level', target: 5 },
    rewardScore: 500,
    unlocked: false
  },
  {
    id: 5006,
    name: '知识大师',
    description: '解锁25条知识条目',
    icon: '📚',
    category: 'collection',
    rarity: 'epic',
    condition: { type: 'unlock_knowledge', target: 25 },
    rewardScore: 1500,
    unlocked: false
  },
  {
    id: 5007,
    name: '高级研究员',
    description: '研究员等级达到10级',
    icon: '👨‍🔬',
    category: 'collection',
    rarity: 'epic',
    condition: { type: 'researcher_level', target: 10 },
    rewardScore: 1500,
    unlocked: false
  },
  {
    id: 5008,
    name: '百科全书',
    description: '解锁全部知识条目',
    icon: '📖',
    category: 'collection',
    rarity: 'legendary',
    condition: { type: 'unlock_all_knowledge', target: 1 },
    rewardScore: 3000,
    unlocked: false
  },
  {
    id: 5009,
    name: '首席科学家',
    description: '研究员等级达到15级',
    icon: '🧑‍🚀',
    category: 'collection',
    rarity: 'legendary',
    condition: { type: 'researcher_level', target: 15 },
    rewardScore: 4000,
    unlocked: false
  },
  {
    id: 5010,
    name: '碎片大亨',
    description: '收集300个碎片',
    icon: '💎',
    category: 'collection',
    rarity: 'epic',
    condition: { type: 'collect_fragments', target: 300 },
    rewardScore: 1200,
    unlocked: false
  },
  {
    id: 5011,
    name: '修复宗师',
    description: '修复30个植物标本',
    icon: '🏆',
    category: 'collection',
    rarity: 'epic',
    condition: { type: 'restore_specimens', target: 30 },
    rewardScore: 2000,
    unlocked: false
  },

  {
    id: 6001,
    name: '活动达人',
    description: '参与一次活动',
    icon: '🎉',
    category: 'special',
    rarity: 'rare',
    condition: { type: 'participate_event', target: 1 },
    rewardScore: 300,
    unlocked: false
  },
  {
    id: 6002,
    name: '高塔攀登者',
    description: '通过高塔第5层',
    icon: '🗼',
    category: 'special',
    rarity: 'rare',
    condition: { type: 'tower_floor', target: 5 },
    rewardScore: 700,
    unlocked: false
  },
  {
    id: 6003,
    name: '展览新星',
    description: '参与一次展览',
    icon: '🖼️',
    category: 'special',
    rarity: 'rare',
    condition: { type: 'participate_exhibition', target: 1 },
    rewardScore: 400,
    unlocked: false
  },
  {
    id: 6004,
    name: '全能玩家',
    description: '同时拥有3个不同分类的成就',
    icon: '🎯',
    category: 'special',
    rarity: 'epic',
    condition: { type: 'multi_category', target: 3 },
    rewardScore: 1000,
    unlocked: false
  },
  {
    id: 6005,
    name: '高塔征服者',
    description: '通过高塔第10层',
    icon: '🏰',
    category: 'special',
    rarity: 'epic',
    condition: { type: 'tower_floor', target: 10 },
    rewardScore: 1500,
    unlocked: false
  },
  {
    id: 6006,
    name: '登峰造极',
    description: '通过高塔第15层',
    icon: '⛰️',
    category: 'special',
    rarity: 'legendary',
    condition: { type: 'tower_floor', target: 15 },
    rewardScore: 3000,
    unlocked: false
  },
  {
    id: 6007,
    name: '活动狂热者',
    description: '完成所有活动关卡',
    icon: '🎪',
    category: 'special',
    rarity: 'epic',
    condition: { type: 'complete_event_levels', target: 1 },
    rewardScore: 1500,
    unlocked: false
  },
  {
    id: 6008,
    name: '展览收藏家',
    description: '获得3个展览徽章',
    icon: '🏵️',
    category: 'special',
    rarity: 'epic',
    condition: { type: 'exhibition_badges', target: 3 },
    rewardScore: 1200,
    unlocked: false
  },
  {
    id: 6009,
    name: '展览大师',
    description: '完成一个展览主题的全部提交',
    icon: '🎨',
    category: 'special',
    rarity: 'rare',
    condition: { type: 'complete_exhibition', target: 1 },
    rewardScore: 800,
    unlocked: false
  }
];

export const Titles: Title[] = [
  {
    id: 1,
    name: '植物学徒',
    description: '初入植物世界的新手',
    icon: '🌱',
    rarity: 'bronze',
    requiredAchievementIds: [1001],
    unlocked: false
  },
  {
    id: 2,
    name: '标本修复师',
    description: '熟练掌握标本修复技术',
    icon: '🔧',
    rarity: 'bronze',
    requiredAchievementIds: [1003, 5001],
    unlocked: false
  },
  {
    id: 3,
    name: '图鉴收藏家',
    description: '热爱收集植物标本',
    icon: '📚',
    rarity: 'silver',
    requiredAchievementIds: [2003, 5002],
    unlocked: false
  },
  {
    id: 4,
    name: '疾风修复师',
    description: '修复速度惊人',
    icon: '⚡',
    rarity: 'silver',
    requiredAchievementIds: [3002, 3005],
    unlocked: false
  },
  {
    id: 5,
    name: '坚定的探索者',
    description: '每日坚持探索植物世界',
    icon: '📅',
    rarity: 'silver',
    requiredAchievementIds: [4003, 4001],
    unlocked: false
  },
  {
    id: 6,
    name: '植物学家',
    description: '精通植物学知识',
    icon: '🌲',
    rarity: 'gold',
    requiredAchievementIds: [1004, 5005, 2003],
    unlocked: false
  },
  {
    id: 7,
    name: '闪电大师',
    description: '拥有无与伦比的速度',
    icon: '⚡',
    rarity: 'gold',
    requiredAchievementIds: [3003, 3004],
    unlocked: false
  },
  {
    id: 8,
    name: '星之守护者',
    description: '收集了大量星星',
    icon: '💫',
    rarity: 'gold',
    requiredAchievementIds: [1007, 1005],
    unlocked: false
  },
  {
    id: 9,
    name: '月度达人',
    description: '连续登录一个月',
    icon: '🏆',
    rarity: 'gold',
    requiredAchievementIds: [4004, 4005],
    unlocked: false
  },
  {
    id: 10,
    name: '标本馆馆长',
    description: '收集了所有植物标本',
    icon: '🏛️',
    rarity: 'platinum',
    requiredAchievementIds: [2004, 1004, 5002],
    unlocked: false
  },
  {
    id: 11,
    name: '传奇修复师',
    description: '站在修复技艺的顶峰',
    icon: '👑',
    rarity: 'platinum',
    requiredAchievementIds: [3004, 1004, 2004],
    unlocked: false
  },
  {
    id: 12,
    name: '植物世界之王',
    description: '完成了所有挑战',
    icon: '🌟',
    rarity: 'platinum',
    requiredAchievementIds: [1004, 2004, 3004, 4004, 6004],
    unlocked: false
  }
];

export const getAchievementById = (id: number): Achievement | undefined => {
  return Achievements.find(a => a.id === id);
};

export const getTitleById = (id: number): Title | undefined => {
  return Titles.find(t => t.id === id);
};

export const getAchievementsByCategory = (category: AchievementCategory): Achievement[] => {
  return Achievements.filter(a => a.category === category);
};

export const getTitlesByRarity = (rarity: TitleRarity): Title[] => {
  return Titles.filter(t => t.rarity === rarity);
};

export const getTotalAchievementCount = (): number => Achievements.length;

export const getTotalTitleCount = (): number => Titles.length;

export const AchievementCategoryInfo: Record<AchievementCategory, { name: string; icon: string; color: number }> = {
  level: { name: '关卡通关', icon: '🎮', color: 0x4caf50 },
  gallery: { name: '图鉴收集', icon: '📚', color: 0x2196f3 },
  speed: { name: '极速修复', icon: '⚡', color: 0xff9800 },
  login: { name: '连续登录', icon: '📅', color: 0x9c27b0 },
  collection: { name: '收集成就', icon: '🎁', color: 0xe91e63 },
  special: { name: '特殊成就', icon: '✨', color: 0x00bcd4 }
};

export const RarityColors: Record<AchievementRarity, number> = {
  common: 0x9e9e9e,
  rare: 0x2196f3,
  epic: 0x9c27b0,
  legendary: 0xff9800
};

export const TitleRarityColors: Record<TitleRarity, number> = {
  bronze: 0xcd7f32,
  silver: 0xc0c0c0,
  gold: 0xffd700,
  platinum: 0xe5e4e2
};
