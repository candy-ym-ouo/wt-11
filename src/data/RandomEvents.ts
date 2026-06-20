import { RandomEventData, RandomEventType, RandomEventRarity } from '../types/GameTypes';

export const RANDOM_EVENT_ENABLED = true;
export const EVENT_TRIGGER_INTERVAL_MIN = 20;
export const EVENT_TRIGGER_INTERVAL_MAX = 45;
export const MAX_CONCURRENT_EVENTS = 2;
export const EVENT_DURATION_DEFAULT = 15;

const randomEvents: RandomEventData[] = [
  {
    id: 'fragment_damage_minor',
    name: '轻微破损',
    description: '有1片已修复的碎片不慎滑落！',
    type: 'fragment_damage',
    rarity: 'common',
    direction: 'negative',
    icon: '💔',
    color: 0xf44336,
    effects: [
      { type: 'piece_damage_count', value: 1 }
    ],
    weight: 15,
    triggerCondition: 'random',
    minDifficulty: 'easy'
  },
  {
    id: 'fragment_damage_moderate',
    name: '碎片散落',
    description: '有2片已修复的碎片不慎掉落！',
    type: 'fragment_damage',
    rarity: 'rare',
    direction: 'negative',
    icon: '💥',
    color: 0xff5722,
    effects: [
      { type: 'piece_damage_count', value: 2 }
    ],
    weight: 8,
    triggerCondition: 'random',
    minDifficulty: 'medium'
  },
  {
    id: 'fragment_damage_major',
    name: '标本损坏',
    description: '有3片已修复的碎片严重损坏！',
    type: 'fragment_damage',
    rarity: 'epic',
    direction: 'negative',
    icon: '🔥',
    color: 0xff1744,
    effects: [
      { type: 'piece_damage_count', value: 3 }
    ],
    weight: 3,
    triggerCondition: 'random',
    minDifficulty: 'hard'
  },
  {
    id: 'time_compression_minor',
    name: '时间紧迫',
    description: '时限压缩！减少10秒时间',
    type: 'time_compression',
    rarity: 'common',
    direction: 'negative',
    icon: '⏱️',
    color: 0xff9800,
    effects: [
      { type: 'time_penalty', value: 10 }
    ],
    weight: 12,
    triggerCondition: 'time_elapsed',
    triggerValue: 30,
    minDifficulty: 'easy'
  },
  {
    id: 'time_compression_moderate',
    name: '分秒必争',
    description: '时限压缩！减少20秒时间',
    type: 'time_compression',
    rarity: 'rare',
    direction: 'negative',
    icon: '⌛',
    color: 0xff5722,
    effects: [
      { type: 'time_penalty', value: 20 }
    ],
    weight: 6,
    triggerCondition: 'time_elapsed',
    triggerValue: 45,
    minDifficulty: 'medium'
  },
  {
    id: 'time_compression_severe',
    name: '光阴似箭',
    description: '时限压缩！减少35秒时间',
    type: 'time_compression',
    rarity: 'epic',
    direction: 'negative',
    icon: '⏰',
    color: 0xd32f2f,
    effects: [
      { type: 'time_penalty', value: 35 }
    ],
    weight: 2,
    triggerCondition: 'time_elapsed',
    triggerValue: 60,
    minDifficulty: 'hard'
  },
  {
    id: 'hint_disabled_short',
    name: '提示失效',
    description: '提示功能暂时失效8秒',
    type: 'hint_disabled',
    rarity: 'common',
    direction: 'negative',
    icon: '🚫',
    color: 0x9c27b0,
    effects: [
      { type: 'hint_disable', value: 1, duration: 8 }
    ],
    weight: 10,
    triggerCondition: 'random',
    minDifficulty: 'easy'
  },
  {
    id: 'hint_disabled_long',
    name: '迷雾重重',
    description: '提示功能失效15秒，考验你的记忆力！',
    type: 'hint_disabled',
    rarity: 'rare',
    direction: 'negative',
    icon: '🌫️',
    color: 0x673ab7,
    effects: [
      { type: 'hint_disable', value: 1, duration: 15 }
    ],
    weight: 5,
    triggerCondition: 'random',
    minDifficulty: 'medium'
  },
  {
    id: 'score_boost_minor',
    name: '灵光一闪',
    description: '得分倍率提升1.2倍，持续10秒',
    type: 'score_boost',
    rarity: 'common',
    direction: 'positive',
    icon: '✨',
    color: 0xffd700,
    effects: [
      { type: 'score_multiplier', value: 1.2, duration: 10 }
    ],
    weight: 10,
    triggerCondition: 'pieces_snapped',
    triggerValue: 3,
    minDifficulty: 'easy'
  },
  {
    id: 'score_boost_moderate',
    name: '灵感迸发',
    description: '得分倍率提升1.5倍，持续12秒',
    type: 'score_boost',
    rarity: 'rare',
    direction: 'positive',
    icon: '🌟',
    color: 0xffc107,
    effects: [
      { type: 'score_multiplier', value: 1.5, duration: 12 }
    ],
    weight: 6,
    triggerCondition: 'pieces_snapped',
    triggerValue: 5,
    minDifficulty: 'medium'
  },
  {
    id: 'score_boost_major',
    name: '完美时刻',
    description: '得分倍率提升2倍，持续10秒！',
    type: 'score_boost',
    rarity: 'epic',
    direction: 'positive',
    icon: '💫',
    color: 0xffeb3b,
    effects: [
      { type: 'score_multiplier', value: 2, duration: 10 }
    ],
    weight: 2,
    triggerCondition: 'pieces_snapped',
    triggerValue: 8,
    minDifficulty: 'hard'
  },
  {
    id: 'piece_bonus_minor',
    name: '意外收获',
    description: '获得额外碎片奖励加成！',
    type: 'piece_bonus',
    rarity: 'rare',
    direction: 'positive',
    icon: '🎁',
    color: 0x4caf50,
    effects: [
      { type: 'reward_multiplier', value: 1.5 }
    ],
    weight: 5,
    triggerCondition: 'random',
    minDifficulty: 'medium'
  },
  {
    id: 'double_reward',
    name: '双倍奖励',
    description: '本局碎片和材料奖励翻倍！',
    type: 'double_reward',
    rarity: 'legendary',
    direction: 'positive',
    icon: '🏆',
    color: 0xffd700,
    effects: [
      { type: 'reward_multiplier', value: 2 }
    ],
    weight: 1,
    triggerCondition: 'random',
    minDifficulty: 'hard'
  },
  {
    id: 'combo_boost',
    name: '连击大师',
    description: '连击加成提升，更容易保持连击！',
    type: 'score_boost',
    rarity: 'rare',
    direction: 'positive',
    icon: '🔥',
    color: 0xff5722,
    effects: [
      { type: 'combo_boost', value: 1.3, duration: 20 }
    ],
    weight: 4,
    triggerCondition: 'pieces_snapped',
    triggerValue: 4,
    minDifficulty: 'medium'
  }
];

export function getRandomEvents(): RandomEventData[] {
  return randomEvents;
}

export function getRandomEventById(id: string): RandomEventData | undefined {
  return randomEvents.find(e => e.id === id);
}

export function getEventsByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): RandomEventData[] {
  const difficultyOrder: Record<string, number> = { easy: 0, medium: 1, hard: 2 };
  const currentLevel = difficultyOrder[difficulty];

  return randomEvents.filter(event => {
    const minLevel = event.minDifficulty ? difficultyOrder[event.minDifficulty] : 0;
    const maxLevel = event.maxDifficulty ? difficultyOrder[event.maxDifficulty] : 2;
    return currentLevel >= minLevel && currentLevel <= maxLevel;
  });
}

export function getEventsByType(type: RandomEventType): RandomEventData[] {
  return randomEvents.filter(e => e.type === type);
}

export function getEventsByRarity(rarity: RandomEventRarity): RandomEventData[] {
  return randomEvents.filter(e => e.rarity === rarity);
}

export function getEventsByDirection(direction: 'positive' | 'negative' | 'mixed'): RandomEventData[] {
  return randomEvents.filter(e => e.direction === direction);
}

export function getRarityColor(rarity: RandomEventRarity): number {
  switch (rarity) {
    case 'common': return 0x9e9e9e;
    case 'rare': return 0x2196f3;
    case 'epic': return 0x9c27b0;
    case 'legendary': return 0xffd700;
    default: return 0x9e9e9e;
  }
}

export function getRarityText(rarity: RandomEventRarity): string {
  switch (rarity) {
    case 'common': return '普通';
    case 'rare': return '稀有';
    case 'epic': return '史诗';
    case 'legendary': return '传说';
    default: return '普通';
  }
}

export function getEventTypeName(type: RandomEventType): string {
  switch (type) {
    case 'fragment_damage': return '碎片受损';
    case 'time_compression': return '时限压缩';
    case 'hint_disabled': return '提示失效';
    case 'score_boost': return '得分加成';
    case 'piece_bonus': return '碎片加成';
    case 'double_reward': return '双倍奖励';
    default: return '未知事件';
  }
}
