import { SliceScheme, DifficultyScheme, SettlementRule } from '../types/GameTypes';

export const SliceSchemes: SliceScheme[] = [
  {
    id: '2x2',
    name: '入门切分',
    rows: 2,
    cols: 2,
    icon: '🔲',
    description: '4片拼图，适合热身',
    difficulty: 'easy'
  },
  {
    id: '2x3',
    name: '初阶切分',
    rows: 2,
    cols: 3,
    icon: '🧩',
    description: '6片拼图，轻松上手',
    difficulty: 'easy'
  },
  {
    id: '3x3',
    name: '标准切分',
    rows: 3,
    cols: 3,
    icon: '🔶',
    description: '9片拼图，经典规格',
    difficulty: 'medium'
  },
  {
    id: '3x4',
    name: '进阶切分',
    rows: 3,
    cols: 4,
    icon: '🔷',
    description: '12片拼图，考验眼力',
    difficulty: 'medium'
  },
  {
    id: '4x4',
    name: '专家切分',
    rows: 4,
    cols: 4,
    icon: '💎',
    description: '16片拼图，高手之路',
    difficulty: 'hard'
  },
  {
    id: '4x5',
    name: '大师切分',
    rows: 4,
    cols: 5,
    icon: '👑',
    description: '20片拼图，极限挑战',
    difficulty: 'hard'
  },
  {
    id: '5x5',
    name: '传奇切分',
    rows: 5,
    cols: 5,
    icon: '🏆',
    description: '25片拼图，传说难度',
    difficulty: 'hard'
  }
];

export const DifficultySchemes: DifficultyScheme[] = [
  {
    id: 'relaxed',
    name: '悠闲模式',
    icon: '🌿',
    description: '无时间压力，自由修复',
    timeLimit: 999,
    snapPositionThreshold: 80,
    snapRotationThreshold: 30,
    scoreMultiplier: 0.5,
    color: 0x4caf50
  },
  {
    id: 'normal',
    name: '标准模式',
    icon: '⚔️',
    description: '适中时限，标准吸附',
    timeLimit: 240,
    snapPositionThreshold: 55,
    snapRotationThreshold: 18,
    scoreMultiplier: 1.0,
    color: 0x2196f3
  },
  {
    id: 'challenge',
    name: '挑战模式',
    icon: '🔥',
    description: '紧凑时限，精确吸附',
    timeLimit: 150,
    snapPositionThreshold: 40,
    snapRotationThreshold: 12,
    scoreMultiplier: 1.5,
    color: 0xff9800
  },
  {
    id: 'extreme',
    name: '极限模式',
    icon: '💀',
    description: '极短时限，极限吸附',
    timeLimit: 90,
    snapPositionThreshold: 30,
    snapRotationThreshold: 8,
    scoreMultiplier: 2.5,
    color: 0xf44336
  }
];

export const SettlementRules: SettlementRule[] = [
  {
    id: 'standard',
    name: '标准评分',
    icon: '📏',
    description: '基础分+时间奖励+完美拼合奖励',
    baseScore: 1000,
    timeBonusPerSecond: 10,
    perfectSnapBonus: 50,
    starThresholds: [1000, 2000, 3000],
    fragmentDropBonus: 1.0,
    materialDropBonus: 1.0
  },
  {
    id: 'speed_focused',
    name: '速度优先',
    icon: '⚡',
    description: '时间奖励翻倍，基础分降低',
    baseScore: 500,
    timeBonusPerSecond: 25,
    perfectSnapBonus: 30,
    starThresholds: [800, 1800, 3200],
    fragmentDropBonus: 1.2,
    materialDropBonus: 0.8
  },
  {
    id: 'precision_focused',
    name: '精准优先',
    icon: '🎯',
    description: '完美拼合奖励翻倍，碎片掉落加成',
    baseScore: 800,
    timeBonusPerSecond: 8,
    perfectSnapBonus: 120,
    starThresholds: [1200, 2400, 3600],
    fragmentDropBonus: 1.5,
    materialDropBonus: 1.3
  },
  {
    id: 'generous',
    name: '丰厚回报',
    icon: '🎁',
    description: '碎片与材料掉落大幅加成',
    baseScore: 700,
    timeBonusPerSecond: 8,
    perfectSnapBonus: 40,
    starThresholds: [600, 1400, 2200],
    fragmentDropBonus: 2.0,
    materialDropBonus: 2.0
  }
];

export function getSliceScheme(id: string): SliceScheme | undefined {
  return SliceSchemes.find(s => s.id === id);
}

export function getDifficultyScheme(id: string): DifficultyScheme | undefined {
  return DifficultySchemes.find(d => d.id === id);
}

export function getSettlementRule(id: string): SettlementRule | undefined {
  return SettlementRules.find(r => r.id === id);
}

export function getSliceSchemesByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): SliceScheme[] {
  return SliceSchemes.filter(s => s.difficulty === difficulty);
}

export function makeCustomPuzzleKey(specimenId: number, sliceId: string, diffId: string, ruleId: string): string {
  return `${specimenId}_${sliceId}_${diffId}_${ruleId}`;
}
