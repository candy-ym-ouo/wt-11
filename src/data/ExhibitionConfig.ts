import { ExhibitionTheme, ExhibitionBadge } from '../types/GameTypes';

export const ExhibitionBadges: Record<number, ExhibitionBadge> = {
  301: {
    id: 301,
    name: '秋日铜章',
    description: '在"秋日金韵"展览中获得300分以上',
    icon: '🥉',
    tier: 'bronze',
    requiredScore: 300,
    exhibitionThemeId: 'autumn_gold'
  },
  302: {
    id: 302,
    name: '秋日银章',
    description: '在"秋日金韵"展览中获得600分以上',
    icon: '🥈',
    tier: 'silver',
    requiredScore: 600,
    exhibitionThemeId: 'autumn_gold'
  },
  303: {
    id: 303,
    name: '秋日金章',
    description: '在"秋日金韵"展览中获得900分以上',
    icon: '🥇',
    tier: 'gold',
    requiredScore: 900,
    exhibitionThemeId: 'autumn_gold'
  },
  304: {
    id: 304,
    name: '秋日铂金章',
    description: '在"秋日金韵"展览中获得满分',
    icon: '🏆',
    tier: 'platinum',
    requiredScore: 1000,
    exhibitionThemeId: 'autumn_gold'
  },
  305: {
    id: 305,
    name: '繁花铜章',
    description: '在"繁花似锦"展览中获得300分以上',
    icon: '🥉',
    tier: 'bronze',
    requiredScore: 300,
    exhibitionThemeId: 'blooming_flowers'
  },
  306: {
    id: 306,
    name: '繁花银章',
    description: '在"繁花似锦"展览中获得600分以上',
    icon: '🥈',
    tier: 'silver',
    requiredScore: 600,
    exhibitionThemeId: 'blooming_flowers'
  },
  307: {
    id: 307,
    name: '繁花金章',
    description: '在"繁花似锦"展览中获得900分以上',
    icon: '🥇',
    tier: 'gold',
    requiredScore: 900,
    exhibitionThemeId: 'blooming_flowers'
  },
  308: {
    id: 308,
    name: '繁花铂金章',
    description: '在"繁花似锦"展览中获得满分',
    icon: '🏆',
    tier: 'platinum',
    requiredScore: 1000,
    exhibitionThemeId: 'blooming_flowers'
  },
  309: {
    id: 309,
    name: '绿意铜章',
    description: '在"绿意盎然"展览中获得300分以上',
    icon: '🥉',
    tier: 'bronze',
    requiredScore: 300,
    exhibitionThemeId: 'evergreen'
  },
  310: {
    id: 310,
    name: '绿意银章',
    description: '在"绿意盎然"展览中获得600分以上',
    icon: '🥈',
    tier: 'silver',
    requiredScore: 600,
    exhibitionThemeId: 'evergreen'
  },
  311: {
    id: 311,
    name: '绿意金章',
    description: '在"绿意盎然"展览中获得900分以上',
    icon: '🥇',
    tier: 'gold',
    requiredScore: 900,
    exhibitionThemeId: 'evergreen'
  },
  312: {
    id: 312,
    name: '绿意铂金章',
    description: '在"绿意盎然"展览中获得满分',
    icon: '🏆',
    tier: 'platinum',
    requiredScore: 1000,
    exhibitionThemeId: 'evergreen'
  },
  313: {
    id: 313,
    name: '珍品铜章',
    description: '在"稀世珍藏"展览中获得300分以上',
    icon: '🥉',
    tier: 'bronze',
    requiredScore: 300,
    exhibitionThemeId: 'rare_treasures'
  },
  314: {
    id: 314,
    name: '珍品银章',
    description: '在"稀世珍藏"展览中获得600分以上',
    icon: '🥈',
    tier: 'silver',
    requiredScore: 600,
    exhibitionThemeId: 'rare_treasures'
  },
  315: {
    id: 315,
    name: '珍品金章',
    description: '在"稀世珍藏"展览中获得900分以上',
    icon: '🥇',
    tier: 'gold',
    requiredScore: 900,
    exhibitionThemeId: 'rare_treasures'
  },
  316: {
    id: 316,
    name: '珍品铂金章',
    description: '在"稀世珍藏"展览中获得满分',
    icon: '🏆',
    tier: 'platinum',
    requiredScore: 1000,
    exhibitionThemeId: 'rare_treasures'
  }
};

export const ExhibitionThemes: ExhibitionTheme[] = [
  {
    id: 'autumn_gold',
    name: '秋日金韵',
    description: '金黄色调的植物专属展览，展示秋天最美的色彩。收集并提交银杏、向日葵等温暖色调的植物标本。',
    type: 'color',
    icon: '🍂',
    primaryColor: 0xffa500,
    secondaryColor: 0xffd700,
    accentColor: 0xff8c00,
    requiredSpecimenIds: [1, 3],
    requiredStars: 2,
    rewards: [
      {
        id: 401,
        type: 'score',
        name: '参与奖励',
        description: '参与秋日金韵展览的基础奖励',
        icon: '💰',
        rarity: 'common',
        threshold: 100,
        value: 200
      },
      {
        id: 402,
        type: 'research_point',
        name: '研究资助',
        description: '展览委员会提供的研究经费',
        icon: '🔬',
        rarity: 'rare',
        threshold: 400,
        value: 100
      },
      {
        id: 403,
        type: 'fragment',
        name: '珍稀碎片',
        description: '展览特别奖励的兰花花瓣碎片',
        icon: '🌸',
        rarity: 'epic',
        threshold: 700,
        value: 2,
        specimenId: 9
      },
      {
        id: 404,
        type: 'badge',
        name: '秋日金章',
        description: '授予在秋日金韵展览中表现卓越的参展者',
        icon: '🥇',
        rarity: 'legendary',
        threshold: 900,
        badgeId: 303
      }
    ]
  },
  {
    id: 'blooming_flowers',
    name: '繁花似锦',
    description: '绽放之美的盛会！玫瑰、兰花、薰衣草等缤纷花卉齐聚一堂，打造最绚丽的花之展览。',
    type: 'shape',
    icon: '🌸',
    primaryColor: 0xe91e63,
    secondaryColor: 0xff69b4,
    accentColor: 0x9c27b0,
    requiredSpecimenIds: [2, 4, 5],
    requiredStars: 4,
    rewards: [
      {
        id: 411,
        type: 'score',
        name: '参与奖励',
        description: '参与繁花似锦展览的基础奖励',
        icon: '💰',
        rarity: 'common',
        threshold: 100,
        value: 300
      },
      {
        id: 412,
        type: 'material',
        name: '金箔粉',
        description: '用于珍稀标本修复的珍贵材料',
        icon: '✨',
        rarity: 'rare',
        threshold: 400,
        value: 2
      },
      {
        id: 413,
        type: 'fragment',
        name: '稀有碎片包',
        description: '展览特别奖励的多种稀有碎片',
        icon: '💎',
        rarity: 'epic',
        threshold: 700,
        value: 3,
        specimenId: 10
      },
      {
        id: 414,
        type: 'badge',
        name: '繁花金章',
        description: '授予在繁花似锦展览中表现卓越的参展者',
        icon: '🥇',
        rarity: 'legendary',
        threshold: 900,
        badgeId: 307
      }
    ]
  },
  {
    id: 'evergreen',
    name: '绿意盎然',
    description: '常绿植物的专属舞台，展示多肉、兰花等生命力旺盛的绿色植物，感受自然的生机与活力。',
    type: 'color',
    icon: '🌿',
    primaryColor: 0x4caf50,
    secondaryColor: 0x66bb6a,
    accentColor: 0x2e7d32,
    requiredSpecimenIds: [5, 6],
    requiredStars: 3,
    rewards: [
      {
        id: 421,
        type: 'score',
        name: '参与奖励',
        description: '参与绿意盎然展览的基础奖励',
        icon: '💰',
        rarity: 'common',
        threshold: 100,
        value: 250
      },
      {
        id: 422,
        type: 'research_point',
        name: '研究资助',
        description: '展览委员会提供的研究经费',
        icon: '🔬',
        rarity: 'rare',
        threshold: 400,
        value: 120
      },
      {
        id: 423,
        type: 'material',
        name: '防腐药剂',
        description: '高级修复材料，防止标本退化',
        icon: '🧪',
        rarity: 'epic',
        threshold: 700,
        value: 3
      },
      {
        id: 424,
        type: 'badge',
        name: '绿意金章',
        description: '授予在绿意盎然展览中表现卓越的参展者',
        icon: '🥇',
        rarity: 'legendary',
        threshold: 900,
        badgeId: 311
      }
    ]
  },
  {
    id: 'rare_treasures',
    name: '稀世珍藏',
    description: '珍稀植物的顶级展览！只有修复难度最高的植物才能参展，展示你作为植物学家的顶尖实力。',
    type: 'rarity',
    icon: '💎',
    primaryColor: 0x9c27b0,
    secondaryColor: 0xce93d8,
    accentColor: 0x6a1b9a,
    requiredSpecimenIds: [5, 6],
    requiredStars: 10,
    rewards: [
      {
        id: 431,
        type: 'score',
        name: '参与奖励',
        description: '参与稀世珍藏展览的基础奖励',
        icon: '💰',
        rarity: 'rare',
        threshold: 100,
        value: 500
      },
      {
        id: 432,
        type: 'fragment',
        name: '史诗碎片包',
        description: '展览特别奖励的史诗级碎片',
        icon: '💠',
        rarity: 'epic',
        threshold: 400,
        value: 3,
        specimenId: 12
      },
      {
        id: 433,
        type: 'material',
        name: '金箔粉套装',
        description: '大量珍稀的金箔粉材料',
        icon: '✨',
        rarity: 'epic',
        threshold: 700,
        value: 5
      },
      {
        id: 434,
        type: 'badge',
        name: '珍品铂金章',
        description: '授予稀世珍藏展览的最高荣誉',
        icon: '🏆',
        rarity: 'legendary',
        threshold: 1000,
        badgeId: 316
      }
    ]
  }
];

export function getExhibitionTheme(id: string): ExhibitionTheme | undefined {
  return ExhibitionThemes.find(t => t.id === id);
}

export function getAllExhibitionThemes(): ExhibitionTheme[] {
  return [...ExhibitionThemes];
}

export function getExhibitionBadge(id: number): ExhibitionBadge | undefined {
  return ExhibitionBadges[id];
}

export function getBadgesByThemeId(themeId: string): ExhibitionBadge[] {
  return Object.values(ExhibitionBadges).filter(b => b.exhibitionThemeId === themeId);
}

export function getBadgeTierColor(tier: 'bronze' | 'silver' | 'gold' | 'platinum'): number {
  switch (tier) {
    case 'bronze': return 0xcd7f32;
    case 'silver': return 0xc0c0c0;
    case 'gold': return 0xffd700;
    case 'platinum': return 0xe5e4e2;
  }
}

export function getBadgeTierName(tier: 'bronze' | 'silver' | 'gold' | 'platinum'): string {
  switch (tier) {
    case 'bronze': return '铜';
    case 'silver': return '银';
    case 'gold': return '金';
    case 'platinum': return '铂金';
  }
}

export const ExhibitionScoreConfig = {
  completionBaseScore: 400,
  speedBaseScore: 300,
  starBaseScore: 300,
  perfectTimeThreshold: 60,
  maxTime: 300
};
