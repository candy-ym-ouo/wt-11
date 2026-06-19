import { TowerFloorData, TowerReward, TowerRuleModifier, TowerScoringCondition } from '../types/GameTypes';

const RULES: Record<string, TowerRuleModifier> = {
  rotation_lock: {
    type: 'rotation_lock',
    name: '旋转锁定',
    description: '拼图块初始角度随机，需要手动旋转到正确角度',
    value: 90
  },
  time_penalty: {
    type: 'time_penalty',
    name: '失误扣时',
    description: '每次错误放置扣除5秒时间',
    value: 5
  },
  hidden_target: {
    type: 'hidden_target',
    name: '隐藏目标',
    description: '目标区域轮廓不可见，需凭记忆完成拼图',
    value: 0
  },
  combo_bonus: {
    type: 'combo_bonus',
    name: '连击奖励',
    description: '连续成功放置获得额外分数加成',
    value: 1.5
  },
  no_hint_restriction: {
    type: 'no_hint_restriction',
    name: '禁止提示',
    description: '无法使用提示功能',
    value: 0
  },
  shuffle_every_n_pieces: {
    type: 'shuffle_every_n_pieces',
    name: '周期打乱',
    description: '每放置3块后，剩余拼图位置随机打乱',
    value: 3
  },
  limited_mistake_penalty: {
    type: 'limited_mistake_penalty',
    name: '容错限制',
    description: '仅允许3次错误放置，超过则挑战失败',
    value: 3
  },
  moving_target: {
    type: 'moving_target',
    name: '移动目标',
    description: '目标区域缓慢移动，增加定位难度',
    value: 20
  },
  mirror_pieces: {
    type: 'mirror_pieces',
    name: '镜像干扰',
    description: '存在镜像干扰块，需辨别真伪',
    value: 2
  },
  extra_pieces: {
    type: 'extra_pieces',
    name: '多余碎片',
    description: '多出2块干扰碎片',
    value: 2
  }
};

const SCORING_CONDITIONS: Record<string, TowerScoringCondition> = {
  time: {
    type: 'time',
    name: '时间评分',
    weight: 25,
    description: '完成时间越短得分越高',
    threshold: 0.7
  },
  accuracy: {
    type: 'accuracy',
    name: '精准度',
    weight: 20,
    description: '放置偏移越小得分越高',
    threshold: 0
  },
  combo: {
    type: 'combo',
    name: '连击奖励',
    weight: 15,
    description: '连续成功放置获得额外分数',
    threshold: 5
  },
  mistakes: {
    type: 'mistakes',
    name: '失误惩罚',
    weight: 15,
    description: '失误越少得分越高',
    threshold: 0
  },
  hint_usage: {
    type: 'hint_usage',
    name: '提示使用',
    weight: 10,
    description: '使用提示次数越少得分越高',
    threshold: 0
  },
  perfect_snap: {
    type: 'perfect_snap',
    name: '完美吸附',
    weight: 15,
    description: '完美吸附的拼图块越多得分越高',
    threshold: 0
  }
};

const BASE_REWARDS: TowerReward[] = [
  {
    type: 'score',
    id: 1001,
    name: '挑战积分',
    description: '完成挑战塔获得的积分奖励',
    value: 500,
    rarity: 'common'
  }
];

export const TowerFloors: TowerFloorData[] = [
  {
    id: 1,
    name: '第一层 · 初入高塔',
    description: '挑战之旅的起点，熟悉高阶规则',
    floorNumber: 1,
    specimenId: 3,
    difficulty: 'hard',
    rows: 3,
    cols: 3,
    timeLimit: 200,
    snapPositionThreshold: 45,
    snapRotationThreshold: 15,
    rules: [RULES.rotation_lock, RULES.combo_bonus],
    scoringConditions: [
      SCORING_CONDITIONS.time,
      SCORING_CONDITIONS.accuracy,
      SCORING_CONDITIONS.combo
    ],
    rewards: [
      { type: 'score', id: 1001, name: '塔层奖励', description: '第一层基础奖励', value: 800, rarity: 'common' },
      { type: 'research_point', id: 2001, name: '研究点数', description: '用于研究室的研究点数', value: 50, rarity: 'common' }
    ],
    requiredStars: 3,
    unlockedDefault: true
  },
  {
    id: 2,
    name: '第二层 · 时间试炼',
    description: '失误会扣除时间，需要更精准的操作',
    floorNumber: 2,
    specimenId: 4,
    difficulty: 'hard',
    rows: 3,
    cols: 4,
    timeLimit: 220,
    snapPositionThreshold: 42,
    snapRotationThreshold: 12,
    rules: [RULES.rotation_lock, RULES.time_penalty, RULES.combo_bonus],
    scoringConditions: [
      SCORING_CONDITIONS.time,
      SCORING_CONDITIONS.accuracy,
      SCORING_CONDITIONS.mistakes,
      SCORING_CONDITIONS.perfect_snap
    ],
    rewards: [
      { type: 'score', id: 1002, name: '塔层奖励', description: '第二层基础奖励', value: 1200, rarity: 'common' },
      { type: 'research_point', id: 2002, name: '研究点数', description: '用于研究室的研究点数', value: 80, rarity: 'rare' },
      { type: 'fragment', id: 3001, name: '珍贵碎片', description: '稀有的植物碎片', value: 2, rarity: 'rare', specimenId: 4 }
    ],
    requiredStars: 6
  },
  {
    id: 3,
    name: '第三层 · 迷雾之中',
    description: '目标区域隐藏，考验你的记忆力',
    floorNumber: 3,
    specimenId: 5,
    difficulty: 'hard',
    rows: 4,
    cols: 4,
    timeLimit: 260,
    snapPositionThreshold: 40,
    snapRotationThreshold: 12,
    rules: [RULES.rotation_lock, RULES.hidden_target, RULES.combo_bonus],
    scoringConditions: [
      SCORING_CONDITIONS.time,
      SCORING_CONDITIONS.accuracy,
      SCORING_CONDITIONS.hint_usage,
      SCORING_CONDITIONS.perfect_snap
    ],
    rewards: [
      { type: 'score', id: 1003, name: '塔层奖励', description: '第三层基础奖励', value: 1800, rarity: 'rare' },
      { type: 'research_point', id: 2003, name: '研究点数', description: '用于研究室的研究点数', value: 120, rarity: 'rare' },
      { type: 'badge', id: 301, name: '迷雾探险家', description: '征服迷雾之塔的证明', rarity: 'rare' }
    ],
    requiredStars: 10
  },
  {
    id: 4,
    name: '第四层 · 无援之境',
    description: '没有提示，全凭你的实力',
    floorNumber: 4,
    specimenId: 6,
    difficulty: 'extreme',
    rows: 4,
    cols: 5,
    timeLimit: 280,
    snapPositionThreshold: 35,
    snapRotationThreshold: 10,
    rules: [RULES.rotation_lock, RULES.no_hint_restriction, RULES.time_penalty, RULES.combo_bonus],
    scoringConditions: [
      SCORING_CONDITIONS.time,
      SCORING_CONDITIONS.accuracy,
      SCORING_CONDITIONS.combo,
      SCORING_CONDITIONS.mistakes,
      SCORING_CONDITIONS.perfect_snap
    ],
    rewards: [
      { type: 'score', id: 1004, name: '塔层奖励', description: '第四层基础奖励', value: 2500, rarity: 'rare' },
      { type: 'research_point', id: 2004, name: '研究点数', description: '用于研究室的研究点数', value: 180, rarity: 'epic' },
      { type: 'fragment', id: 3002, name: '稀有碎片', description: '珍稀的植物碎片', value: 3, rarity: 'epic', specimenId: 6 }
    ],
    requiredStars: 15
  },
  {
    id: 5,
    name: '第五层 · 混乱风暴',
    description: '周期打乱剩余拼图，保持专注！',
    floorNumber: 5,
    specimenId: 1,
    difficulty: 'extreme',
    rows: 5,
    cols: 5,
    timeLimit: 320,
    snapPositionThreshold: 32,
    snapRotationThreshold: 10,
    rules: [RULES.rotation_lock, RULES.shuffle_every_n_pieces, RULES.combo_bonus, RULES.time_penalty],
    scoringConditions: [
      SCORING_CONDITIONS.time,
      SCORING_CONDITIONS.accuracy,
      SCORING_CONDITIONS.combo,
      SCORING_CONDITIONS.mistakes
    ],
    rewards: [
      { type: 'score', id: 1005, name: '塔层奖励', description: '第五层基础奖励', value: 3500, rarity: 'epic' },
      { type: 'research_point', id: 2005, name: '研究点数', description: '用于研究室的研究点数', value: 250, rarity: 'epic' },
      { type: 'badge', id: 302, name: '风暴征服者', description: '在混乱中保持秩序的证明', rarity: 'epic' }
    ],
    requiredStars: 20
  },
  {
    id: 6,
    name: '第六层 · 极限容错',
    description: '仅3次失误机会，一步都不能错',
    floorNumber: 6,
    specimenId: 2,
    difficulty: 'extreme',
    rows: 5,
    cols: 5,
    timeLimit: 300,
    snapPositionThreshold: 28,
    snapRotationThreshold: 8,
    rules: [RULES.rotation_lock, RULES.limited_mistake_penalty, RULES.no_hint_restriction, RULES.combo_bonus],
    scoringConditions: [
      SCORING_CONDITIONS.time,
      SCORING_CONDITIONS.accuracy,
      SCORING_CONDITIONS.mistakes,
      SCORING_CONDITIONS.perfect_snap,
      SCORING_CONDITIONS.hint_usage
    ],
    rewards: [
      { type: 'score', id: 1006, name: '塔层奖励', description: '第六层基础奖励', value: 4500, rarity: 'epic' },
      { type: 'research_point', id: 2006, name: '研究点数', description: '用于研究室的研究点数', value: 350, rarity: 'epic' },
      { type: 'fragment', id: 3003, name: '史诗碎片', description: '极为珍贵的植物碎片', value: 2, rarity: 'epic', specimenId: 2 }
    ],
    requiredStars: 26
  },
  {
    id: 7,
    name: '第七层 · 幻影迷宫',
    description: '镜像干扰，辨别真伪',
    floorNumber: 7,
    specimenId: 3,
    difficulty: 'nightmare',
    rows: 5,
    cols: 6,
    timeLimit: 360,
    snapPositionThreshold: 25,
    snapRotationThreshold: 8,
    rules: [RULES.rotation_lock, RULES.mirror_pieces, RULES.time_penalty, RULES.combo_bonus, RULES.hidden_target],
    scoringConditions: [
      SCORING_CONDITIONS.time,
      SCORING_CONDITIONS.accuracy,
      SCORING_CONDITIONS.combo,
      SCORING_CONDITIONS.mistakes,
      SCORING_CONDITIONS.perfect_snap
    ],
    rewards: [
      { type: 'score', id: 1007, name: '塔层奖励', description: '第七层基础奖励', value: 6000, rarity: 'legendary' },
      { type: 'research_point', id: 2007, name: '研究点数', description: '用于研究室的研究点数', value: 500, rarity: 'legendary' },
      { type: 'badge', id: 303, name: '幻影猎手', description: '识破一切幻象的证明', rarity: 'legendary' }
    ],
    requiredStars: 32
  },
  {
    id: 8,
    name: '第八层 · 漂移目标',
    description: '目标区域会移动，随时调整策略',
    floorNumber: 8,
    specimenId: 4,
    difficulty: 'nightmare',
    rows: 6,
    cols: 6,
    timeLimit: 400,
    snapPositionThreshold: 22,
    snapRotationThreshold: 6,
    rules: [RULES.rotation_lock, RULES.moving_target, RULES.shuffle_every_n_pieces, RULES.combo_bonus, RULES.time_penalty],
    scoringConditions: [
      SCORING_CONDITIONS.time,
      SCORING_CONDITIONS.accuracy,
      SCORING_CONDITIONS.combo,
      SCORING_CONDITIONS.mistakes,
      SCORING_CONDITIONS.perfect_snap,
      SCORING_CONDITIONS.hint_usage
    ],
    rewards: [
      { type: 'score', id: 1008, name: '塔层奖励', description: '第八层基础奖励', value: 8000, rarity: 'legendary' },
      { type: 'research_point', id: 2008, name: '研究点数', description: '用于研究室的研究点数', value: 700, rarity: 'legendary' },
      { type: 'fragment', id: 3004, name: '传说碎片', description: '传说级别的植物碎片', value: 2, rarity: 'legendary', specimenId: 4 }
    ],
    requiredStars: 40
  },
  {
    id: 9,
    name: '第九层 · 绝望深渊',
    description: '多种规则叠加的极限挑战',
    floorNumber: 9,
    specimenId: 5,
    difficulty: 'nightmare',
    rows: 6,
    cols: 7,
    timeLimit: 450,
    snapPositionThreshold: 20,
    snapRotationThreshold: 5,
    rules: [
      RULES.rotation_lock,
      RULES.time_penalty,
      RULES.hidden_target,
      RULES.limited_mistake_penalty,
      RULES.no_hint_restriction,
      RULES.combo_bonus
    ],
    scoringConditions: [
      SCORING_CONDITIONS.time,
      SCORING_CONDITIONS.accuracy,
      SCORING_CONDITIONS.combo,
      SCORING_CONDITIONS.mistakes,
      SCORING_CONDITIONS.perfect_snap,
      SCORING_CONDITIONS.hint_usage
    ],
    rewards: [
      { type: 'score', id: 1009, name: '塔层奖励', description: '第九层基础奖励', value: 12000, rarity: 'legendary' },
      { type: 'research_point', id: 2009, name: '研究点数', description: '用于研究室的研究点数', value: 1000, rarity: 'legendary' },
      { type: 'badge', id: 304, name: '深渊行者', description: '穿越绝望深渊的勇者证明', rarity: 'legendary' }
    ],
    requiredStars: 48
  },
  {
    id: 10,
    name: '第十层 · 塔顶之巅',
    description: '最终挑战，登上塔顶证明你的实力',
    floorNumber: 10,
    specimenId: 6,
    difficulty: 'nightmare',
    rows: 7,
    cols: 7,
    timeLimit: 500,
    snapPositionThreshold: 18,
    snapRotationThreshold: 5,
    rules: [
      RULES.rotation_lock,
      RULES.time_penalty,
      RULES.shuffle_every_n_pieces,
      RULES.limited_mistake_penalty,
      RULES.no_hint_restriction,
      RULES.moving_target,
      RULES.combo_bonus
    ],
    scoringConditions: [
      SCORING_CONDITIONS.time,
      SCORING_CONDITIONS.accuracy,
      SCORING_CONDITIONS.combo,
      SCORING_CONDITIONS.mistakes,
      SCORING_CONDITIONS.perfect_snap,
      SCORING_CONDITIONS.hint_usage
    ],
    rewards: [
      { type: 'score', id: 1010, name: '塔顶荣耀', description: '征服塔顶的至高奖励', value: 20000, rarity: 'legendary' },
      { type: 'research_point', id: 2010, name: '研究点数', description: '用于研究室的研究点数', value: 1500, rarity: 'legendary' },
      { type: 'badge', id: 305, name: '塔顶之王', description: '站在塔顶之巅的无上荣耀', rarity: 'legendary' },
      { type: 'fragment', id: 3005, name: '塔顶圣物', description: '传说中的植物圣物碎片', value: 5, rarity: 'legendary', specimenId: 6 }
    ],
    requiredStars: 56
  }
];

export function getTowerFloor(id: number): TowerFloorData | undefined {
  return TowerFloors.find(floor => floor.id === id);
}

export function getTowerFloorByNumber(floorNumber: number): TowerFloorData | undefined {
  return TowerFloors.find(floor => floor.floorNumber === floorNumber);
}

export function getTowerFloors(): TowerFloorData[] {
  return [...TowerFloors];
}

export function getTotalTowerFloors(): number {
  return TowerFloors.length;
}

export const TOWER_UNLOCK_STARS = 3;

export function getTowerStarsRequired(): number {
  return TOWER_UNLOCK_STARS;
}

export function getTowerRule(type: string): TowerRuleModifier | undefined {
  return RULES[type];
}

export function getAllTowerRules(): TowerRuleModifier[] {
  return Object.values(RULES);
}

export function getTowerScoringCondition(type: string): TowerScoringCondition | undefined {
  return SCORING_CONDITIONS[type];
}

export function getAllTowerScoringConditions(): TowerScoringCondition[] {
  return Object.values(SCORING_CONDITIONS);
}

export function getDifficultyText(difficulty: string): string {
  switch (difficulty) {
    case 'hard': return '困难';
    case 'extreme': return '极难';
    case 'nightmare': return '噩梦';
    default: return '困难';
  }
}

export function getDifficultyColor(difficulty: string): number {
  switch (difficulty) {
    case 'hard': return 0xff9800;
    case 'extreme': return 0xe94560;
    case 'nightmare': return 0x9c27b0;
    default: return 0xff9800;
  }
}

export function getRarityText(rarity: string): string {
  switch (rarity) {
    case 'common': return '普通';
    case 'rare': return '稀有';
    case 'epic': return '史诗';
    case 'legendary': return '传说';
    default: return '普通';
  }
}

export function getRarityColor(rarity: string): number {
  switch (rarity) {
    case 'common': return 0x9e9e9e;
    case 'rare': return 0x2196f3;
    case 'epic': return 0x9c27b0;
    case 'legendary': return 0xff9800;
    default: return 0x9e9e9e;
  }
}
