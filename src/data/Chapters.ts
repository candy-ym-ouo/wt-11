import { ChapterData, Reward, ChapterUnlockCondition, HiddenLevelData } from '../types/GameTypes';
import { LevelRules } from './LevelRules';

const chapterRewards: Record<number, Reward[]> = {
  1: [
    {
      type: 'score',
      id: 101,
      name: '新手奖励',
      description: '完成入门考察的基础奖励',
      value: 500
    },
    {
      type: 'badge',
      id: 201,
      name: '初级植物学家',
      description: '授予完成入门考察的考察员'
    }
  ],
  2: [
    {
      type: 'score',
      id: 102,
      name: '探索奖励',
      description: '完成深入探索的进阶奖励',
      value: 1000
    },
    {
      type: 'badge',
      id: 202,
      name: '中级植物学家',
      description: '授予完成深入探索的考察员'
    }
  ],
  3: [
    {
      type: 'score',
      id: 103,
      name: '专家奖励',
      description: '完成专家挑战的终极奖励',
      value: 2000
    },
    {
      type: 'badge',
      id: 203,
      name: '高级植物学家',
      description: '授予完成所有考察的专家'
    }
  ]
};

export const Chapters: ChapterData[] = [
  {
    id: 1,
    name: '第一章：初识植物',
    description: '欢迎加入植物考察队！本章将带你认识两种最具代表性的植物，学习基础的标本修复技巧。',
    theme: '入门考察',
    primaryColor: 0x4caf50,
    secondaryColor: 0x81c784,
    levelIds: [1, 2],
    requiredStars: 0,
    rewards: chapterRewards[1],
    unlocked: true,
    unlockCondition: {
      requiredStars: 0,
      prevChapterCompleted: false
    },
    hiddenLevels: [
      {
        levelRuleId: 7,
        triggers: [
          {
            type: 'chapter_perfect',
            description: '本章所有关卡获得满星',
            chapterId: 1,
            requiredStars: 6
          }
        ],
        revealedDescription: '传说在银杏古道的尽头，隐藏着一片被遗忘的银杏秘境……'
      }
    ]
  },
  {
    id: 2,
    name: '第二章：植物多样性',
    description: '植物世界丰富多彩！本章将探索两种不同科属的植物，了解它们的独特之处。',
    theme: '深入探索',
    primaryColor: 0xff9800,
    secondaryColor: 0xffb74d,
    levelIds: [3, 4],
    requiredStars: 4,
    rewards: chapterRewards[2],
    unlocked: false,
    unlockCondition: {
      requiredStars: 4,
      prevChapterStarThreshold: 4,
      prevChapterCompleted: true,
      requiredGalleryIds: [1, 2]
    },
    hiddenLevels: [
      {
        levelRuleId: 8,
        triggers: [
          {
            type: 'gallery_collect',
            description: '收集图鉴中的薰衣草标本',
            requiredGalleryIds: [4]
          },
          {
            type: 'star_threshold',
            description: '本章累计获得5颗星星',
            chapterId: 2,
            requiredStars: 5
          }
        ],
        revealedDescription: '在薰衣草花海的深处，流传着一段关于花语的古老传说……'
      }
    ]
  },
  {
    id: 3,
    name: '第三章：珍稀植物',
    description: '挑战更高难度！本章将修复两种珍稀植物标本，展示你的专业技能。',
    theme: '专家挑战',
    primaryColor: 0xe94560,
    secondaryColor: 0xff6b8a,
    levelIds: [5, 6],
    requiredStars: 8,
    rewards: chapterRewards[3],
    unlocked: false,
    unlockCondition: {
      requiredStars: 8,
      prevChapterStarThreshold: 5,
      prevChapterCompleted: true,
      requiredGalleryIds: [3, 4]
    },
    hiddenLevels: [
      {
        levelRuleId: 9,
        triggers: [
          {
            type: 'gallery_collect',
            description: '收集图鉴中的兰花标本',
            requiredGalleryIds: [5]
          },
          {
            type: 'star_threshold',
            description: '本章累计获得5颗星星',
            chapterId: 3,
            requiredStars: 5
          },
          {
            type: 'chapter_perfect',
            description: '前两章全部通关',
            chapterId: 1,
            requiredStars: 1
          }
        ],
        revealedDescription: '兰幽深处，隐藏着最珍贵的兰花标本，只有真正的植物学家才能到达……'
      }
    ]
  }
];

export const Badges = {
  201: { id: 201, name: '初级植物学家', description: '完成入门考察', icon: '🌱' },
  202: { id: 202, name: '中级植物学家', description: '完成深入探索', icon: '🌿' },
  203: { id: 203, name: '高级植物学家', description: '完成所有考察', icon: '🌳' }
};

export function getChapterById(id: number): ChapterData | undefined {
  return Chapters.find(chapter => chapter.id === id);
}

export function getChapterByLevelId(levelId: number): ChapterData | undefined {
  return Chapters.find(chapter => chapter.levelIds.includes(levelId));
}

export function getChapterLevels(chapterId: number): typeof LevelRules {
  const chapter = getChapterById(chapterId);
  if (!chapter) return [];
  return LevelRules.filter(rule => chapter.levelIds.includes(rule.id));
}

export function getChapterTotalStars(chapterId: number): number {
  const chapter = getChapterById(chapterId);
  if (!chapter) return 0;
  return chapter.levelIds.length * 3;
}

export function getHiddenLevelsForChapter(chapterId: number): HiddenLevelData[] {
  const chapter = getChapterById(chapterId);
  return chapter?.hiddenLevels ?? [];
}

export function getChapterUnlockCondition(chapterId: number): ChapterUnlockCondition | undefined {
  const chapter = getChapterById(chapterId);
  return chapter?.unlockCondition;
}

export function isHiddenLevel(levelId: number): boolean {
  return Chapters.some(ch => ch.hiddenLevels?.some(hl => hl.levelRuleId === levelId));
}

export function getHiddenLevelChapterId(levelId: number): number | null {
  const chapter = Chapters.find(ch => ch.hiddenLevels?.some(hl => hl.levelRuleId === levelId));
  return chapter?.id ?? null;
}

export function getHiddenLevelData(levelId: number): HiddenLevelData | undefined {
  for (const chapter of Chapters) {
    const found = chapter.hiddenLevels?.find(hl => hl.levelRuleId === levelId);
    if (found) return found;
  }
  return undefined;
}

export function getNextChapter(currentChapterId: number): ChapterData | undefined {
  return Chapters.find(chapter => chapter.id === currentChapterId + 1);
}

export function getRewardsByChapterId(chapterId: number): Reward[] {
  return chapterRewards[chapterId] || [];
}
