import { CareActionDef, CareActionType, ConservationHealthLevel } from '../types/GameTypes';

export const CareActions: CareActionDef[] = [
  {
    type: 'water',
    name: '浇水',
    icon: '💧',
    description: '为标本补充水分，恢复健康状态',
    healthRecovery: 15,
    materialCost: [{ materialId: 1, count: 1 }],
    cooldownMs: 2 * 60 * 60 * 1000,
  },
  {
    type: 'prune',
    name: '修剪',
    icon: '✂️',
    description: '修剪枯萎部分，保持标本形态',
    healthRecovery: 12,
    materialCost: [{ materialId: 2, count: 1 }],
    cooldownMs: 4 * 60 * 60 * 1000,
  },
  {
    type: 'fertilize',
    name: '施肥',
    icon: '🌱',
    description: '施加营养剂，大幅恢复健康状态',
    healthRecovery: 25,
    materialCost: [{ materialId: 3, count: 1 }],
    cooldownMs: 8 * 60 * 60 * 1000,
  },
  {
    type: 'pest_control',
    name: '除虫',
    icon: '🛡️',
    description: '清除害虫侵扰，恢复并防止衰退',
    healthRecovery: 20,
    materialCost: [{ materialId: 1, count: 1 }, { materialId: 3, count: 1 }],
    cooldownMs: 6 * 60 * 60 * 1000,
  },
  {
    type: 'repot',
    name: '换盆',
    icon: '🏺',
    description: '更换培养基质，全面恢复健康',
    healthRecovery: 35,
    materialCost: [{ materialId: 1, count: 2 }, { materialId: 2, count: 1 }, { materialId: 4, count: 1 }],
    cooldownMs: 24 * 60 * 60 * 1000,
  },
];

export const DecayConfig = {
  baseDecayPerHour: 2,
  minHealth: 5,
  maxHealth: 100,
  thrivingThreshold: 80,
  healthyThreshold: 60,
  fairThreshold: 40,
  decliningThreshold: 20,
  consecutiveCareBonusPerLevel: 3,
  maxConsecutiveCareBonus: 15,
  streakGracePeriodMs: 48 * 60 * 60 * 1000,
};

export const ReminderThresholds: {
  healthLevel: ConservationHealthLevel;
  minHealth: number;
  maxHealth: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  message: string;
}[] = [
  {
    healthLevel: 'thriving',
    minHealth: DecayConfig.thrivingThreshold,
    maxHealth: DecayConfig.maxHealth,
    priority: 'low',
    message: '标本状态良好，继续保持养护节奏',
  },
  {
    healthLevel: 'healthy',
    minHealth: DecayConfig.healthyThreshold,
    maxHealth: DecayConfig.thrivingThreshold - 1,
    priority: 'low',
    message: '标本状态尚可，建议及时养护',
  },
  {
    healthLevel: 'fair',
    minHealth: DecayConfig.fairThreshold,
    maxHealth: DecayConfig.healthyThreshold - 1,
    priority: 'medium',
    message: '标本状态有所下降，需要尽快养护',
  },
  {
    healthLevel: 'declining',
    minHealth: DecayConfig.decliningThreshold,
    maxHealth: DecayConfig.fairThreshold - 1,
    priority: 'high',
    message: '标本正在衰退！请立即进行养护',
  },
  {
    healthLevel: 'critical',
    minHealth: DecayConfig.minHealth,
    maxHealth: DecayConfig.decliningThreshold - 1,
    priority: 'urgent',
    message: '⚠️ 标本濒危！奖励已大幅衰减，紧急养护！',
  },
];

export const RewardDecayConfig = {
  thriving: { scoreMultiplier: 1.0, fragmentMultiplier: 1.0, researchMultiplier: 1.0 },
  healthy: { scoreMultiplier: 0.9, fragmentMultiplier: 0.9, researchMultiplier: 0.95 },
  fair: { scoreMultiplier: 0.7, fragmentMultiplier: 0.7, researchMultiplier: 0.8 },
  declining: { scoreMultiplier: 0.4, fragmentMultiplier: 0.4, researchMultiplier: 0.5 },
  critical: { scoreMultiplier: 0.15, fragmentMultiplier: 0.15, researchMultiplier: 0.2 },
};

export const GalleryDescriptionModifiers: Record<ConservationHealthLevel, { prefix: string; suffix: string }> = {
  thriving: { prefix: '【生机盎然】', suffix: '——标本状态极佳，散发着勃勃生机。' },
  healthy: { prefix: '【状态良好】', suffix: '——标本保存完好，偶有细微退化迹象。' },
  fair: { prefix: '【略有衰退】', suffix: '——标本出现轻微退化，需适当养护。' },
  declining: { prefix: '【明显退化】', suffix: '——标本退化加剧，请尽快养护维护。' },
  critical: { prefix: '【濒危警告】', suffix: '——标本严重退化，濒临损毁边缘！' },
};

export function getCareActionDef(type: CareActionType): CareActionDef | undefined {
  return CareActions.find(a => a.type === type);
}

export function getHealthLevel(health: number): ConservationHealthLevel {
  for (const threshold of ReminderThresholds) {
    if (health >= threshold.minHealth && health <= threshold.maxHealth) {
      return threshold.healthLevel;
    }
  }
  return 'critical';
}

export function getReminderForHealth(health: number): typeof ReminderThresholds[number] {
  const level = getHealthLevel(health);
  return ReminderThresholds.find(r => r.healthLevel === level) || ReminderThresholds[ReminderThresholds.length - 1];
}

export function getRewardMultiplier(health: number): { scoreMultiplier: number; fragmentMultiplier: number; researchMultiplier: number } {
  const level = getHealthLevel(health);
  return RewardDecayConfig[level];
}

export function getGalleryModifiedDescription(originalDescription: string, health: number): string {
  const level = getHealthLevel(health);
  const modifier = GalleryDescriptionModifiers[level];
  return `${modifier.prefix}${originalDescription}${modifier.suffix}`;
}
