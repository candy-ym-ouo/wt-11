import { DonationTier, DonationReward } from '../types/GameTypes';

export const DonationRewards: Record<number, DonationReward> = {
  501: {
    id: 501,
    type: 'research_point',
    name: '捐赠启动金',
    description: '首次参与捐赠的研究经费奖励',
    icon: '🔬',
    rarity: 'common',
    value: 50
  },
  502: {
    id: 502,
    type: 'score',
    name: '捐赠鼓励金',
    description: '捐赠馆委员会颁发的鼓励积分',
    icon: '💰',
    rarity: 'common',
    value: 500
  },
  503: {
    id: 503,
    type: 'research_point',
    name: '科研资助',
    description: '用于深入研究的经费支持',
    icon: '🔬',
    rarity: 'rare',
    value: 150
  },
  504: {
    id: 504,
    type: 'fragment',
    name: '兰花碎片',
    description: '珍贵的兰花标本碎片',
    icon: '🌸',
    rarity: 'rare',
    value: 2,
    fragmentId: 5
  },
  505: {
    id: 505,
    type: 'material',
    name: '防腐药剂',
    description: '用于标本长期保存的专业药剂',
    icon: '🧪',
    rarity: 'rare',
    value: 3,
    materialId: 102
  },
  506: {
    id: 506,
    type: 'score',
    name: '杰出贡献奖',
    description: '对捐赠事业杰出贡献的积分奖励',
    icon: '🏆',
    rarity: 'epic',
    value: 2000
  },
  507: {
    id: 507,
    type: 'research_point',
    name: '重点项目经费',
    description: '重点科研项目的专项经费',
    icon: '🔬',
    rarity: 'epic',
    value: 300
  },
  508: {
    id: 508,
    type: 'fragment',
    name: '稀有碎片包',
    description: '包含多种珍稀标本碎片的礼包',
    icon: '💎',
    rarity: 'epic',
    value: 5,
    fragmentId: 6
  },
  509: {
    id: 509,
    type: 'badge',
    name: '青铜捐赠者',
    description: '授予累计捐赠达到10次的植物学家',
    icon: '🥉',
    rarity: 'common',
    badgeId: 401
  },
  510: {
    id: 510,
    type: 'badge',
    name: '白银捐赠者',
    description: '授予累计捐赠达到25次的植物学家',
    icon: '🥈',
    rarity: 'rare',
    badgeId: 402
  },
  511: {
    id: 511,
    type: 'badge',
    name: '黄金捐赠者',
    description: '授予累计捐赠达到50次的植物学家',
    icon: '🥇',
    rarity: 'epic',
    badgeId: 403
  },
  512: {
    id: 512,
    type: 'badge',
    name: '铂金捐赠者',
    description: '授予累计捐赠达到100次的顶尖植物学家',
    icon: '🏆',
    rarity: 'legendary',
    badgeId: 404
  },
  513: {
    id: 513,
    type: 'material',
    name: '金箔粉',
    description: '用于珍贵标本镀金处理的顶级材料',
    icon: '✨',
    rarity: 'epic',
    value: 3,
    materialId: 101
  },
  514: {
    id: 514,
    type: 'score',
    name: '终生成就奖',
    description: '对植物学事业终身贡献的最高荣誉积分',
    icon: '👑',
    rarity: 'legendary',
    value: 5000
  }
};

export const DonationTiers: DonationTier[] = [
  {
    id: 1,
    name: '新晋捐赠者',
    description: '欢迎加入植物标本捐赠计划，你的每一次捐赠都在为科学研究添砖加瓦。',
    icon: '🌱',
    requiredDonations: 1,
    rewards: [DonationRewards[501]],
    primaryColor: 0x4caf50
  },
  {
    id: 2,
    name: '热心收藏家',
    description: '你对植物收藏的热情令人钦佩，继续为馆藏贡献力量！',
    icon: '🌿',
    requiredDonations: 5,
    rewards: [DonationRewards[502], DonationRewards[509]],
    primaryColor: 0x8bc34a
  },
  {
    id: 3,
    name: '资深研究员',
    description: '你已成为捐赠馆的中坚力量，研究经费将大幅提升。',
    icon: '🔬',
    requiredDonations: 10,
    rewards: [DonationRewards[503], DonationRewards[504]],
    primaryColor: 0x2196f3
  },
  {
    id: 4,
    name: '荣誉馆员',
    description: '你的贡献获得了馆藏委员会的认可，授予荣誉馆员称号！',
    icon: '📚',
    requiredDonations: 25,
    rewards: [DonationRewards[505], DonationRewards[506], DonationRewards[510]],
    primaryColor: 0x9c27b0
  },
  {
    id: 5,
    name: '首席植物学家',
    description: '你在植物学界的声望已如日中天，珍贵资源向你敞开大门。',
    icon: '🎓',
    requiredDonations: 50,
    rewards: [DonationRewards[507], DonationRewards[508], DonationRewards[511]],
    primaryColor: 0xff9800
  },
  {
    id: 6,
    name: '传奇守护者',
    description: '你是植物界的传奇，毕生致力于保护和研究植物多样性，名垂青史！',
    icon: '👑',
    requiredDonations: 100,
    rewards: [DonationRewards[513], DonationRewards[514], DonationRewards[512]],
    primaryColor: 0xffd700
  }
];

export const DonationCoinConfig = {
  baseCoinPerStar: 15,
  firstDonationBonus: 30,
  workshopRestorationBonus: 20,
  perfectThreeStarBonus: 25,
  difficultyMultiplier: {
    easy: 1,
    medium: 1.4,
    hard: 2
  } as Record<string, number>,
  maxEntriesStored: 200
};

export function getDonationTier(id: number): DonationTier | undefined {
  return DonationTiers.find(t => t.id === id);
}

export function getAllDonationTiers(): DonationTier[] {
  return [...DonationTiers];
}

export function getDonationReward(id: number): DonationReward | undefined {
  return DonationRewards[id];
}

export function getDonationTierByDonations(totalDonations: number): DonationTier | undefined {
  const result = getCurrentTier(totalDonations);
  if (result.tier.id === 0 && totalDonations < DonationTiers[0].requiredDonations) {
    return undefined;
  }
  return result.tier;
}

export function getNextTier(totalDonations: number): DonationTier | null {
  const result = getCurrentTier(totalDonations);
  return result.nextTier;
}

export function getCurrentTier(totalDonations: number): { tier: DonationTier; nextTier: DonationTier | null; progress: number } {
  let currentTier = DonationTiers[0];
  let nextTier: DonationTier | null = null;

  for (let i = DonationTiers.length - 1; i >= 0; i--) {
    if (totalDonations >= DonationTiers[i].requiredDonations) {
      currentTier = DonationTiers[i];
      nextTier = DonationTiers[i + 1] || null;
      break;
    }
  }

  if (totalDonations < DonationTiers[0].requiredDonations) {
    currentTier = { ...DonationTiers[0], id: 0, name: '未开始', description: '捐赠你的第一个标本吧！', requiredDonations: 0, rewards: [], icon: '🚫', primaryColor: 0x607d8b };
    nextTier = DonationTiers[0];
  }

  const progress = nextTier
    ? Math.min(1, (totalDonations - currentTier.requiredDonations) / Math.max(1, (nextTier.requiredDonations - currentTier.requiredDonations)))
    : 1;

  return { tier: currentTier, nextTier, progress };
}

export function calculateResearchCoin(params: {
  stars: number;
  specimenId: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  isFirstDonation?: boolean;
  isWorkshopRestoration?: boolean;
}): number {
  const { stars, difficulty = 'easy', isFirstDonation = false, isWorkshopRestoration = false } = params;

  let coin = stars * DonationCoinConfig.baseCoinPerStar;

  const diffMult = DonationCoinConfig.difficultyMultiplier[difficulty] || 1;
  coin = Math.floor(coin * diffMult);

  if (stars === 3) {
    coin += DonationCoinConfig.perfectThreeStarBonus;
  }

  if (isFirstDonation) {
    coin += DonationCoinConfig.firstDonationBonus;
  }

  if (isWorkshopRestoration) {
    coin += DonationCoinConfig.workshopRestorationBonus;
  }

  return Math.max(1, coin);
}

export const DonationBadgeIds = {
  bronze: 401,
  silver: 402,
  gold: 403,
  platinum: 404
};
