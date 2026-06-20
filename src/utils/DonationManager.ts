import {
  DonationSaveData,
  DonationProgress,
  DonationEntry,
  DonationTier,
  DonationReward,
  DonationResult,
  DonationClaimResult,
  AchievementUnlockResult,
  Reward
} from '../types/GameTypes';
import { SaveManager } from './SaveManager';
import {
  DonationTiers,
  DonationCoinConfig,
  getCurrentTier,
  calculateResearchCoin,
  getDonationReward
} from '../data/DonationConfig';
import { getPlantSpecimen } from '../data/PlantSpecimens';
import { Levels } from '../data/Levels';

export class DonationManager {
  private static data: DonationSaveData;

  static init(saveData: DonationSaveData): void {
    this.data = saveData;
  }

  static createDefaultSave(): DonationSaveData {
    const rewardsClaimed: Record<number, boolean> = {};
    DonationTiers.forEach(tier => {
      tier.rewards.forEach(reward => {
        rewardsClaimed[reward.id] = false;
      });
    });

    return {
      progress: {
        totalDonations: 0,
        totalResearchCoin: 0,
        totalResearchCoinEarned: 0,
        donationsBySpecimen: {},
        donations: [],
        rewardsClaimed,
        tierProgress: 0
      }
    };
  }

  static getSaveData(): DonationSaveData {
    return {
      progress: {
        ...this.data.progress,
        donationsBySpecimen: { ...this.data.progress.donationsBySpecimen },
        donations: [...this.data.progress.donations],
        rewardsClaimed: { ...this.data.progress.rewardsClaimed }
      }
    };
  }

  static getProgress(): DonationProgress {
    return { ...this.data.progress };
  }

  static getTotalDonations(): number {
    return this.data.progress.totalDonations;
  }

  static getTotalResearchCoin(): number {
    return this.data.progress.totalResearchCoin;
  }

  static getTotalResearchCoinEarned(): number {
    return this.data.progress.totalResearchCoinEarned;
  }

  static getDonationsBySpecimen(specimenId: number): number {
    return this.data.progress.donationsBySpecimen[specimenId] || 0;
  }

  static isRewardClaimed(rewardId: number): boolean {
    return this.data.progress.rewardsClaimed[rewardId] || false;
  }

  static calculateResearchCoin(specimenId: number): number {
    const check = this._canDonateSpecimenInternal(specimenId);
    const level = Levels.find(l => l.specimen.id === specimenId);
    if (!level) return 0;
    const isFirstDonation = this.getDonationsBySpecimen(specimenId) === 0;
    return calculateResearchCoin({
      stars: check.stars || 1,
      specimenId,
      difficulty: level.rule.difficulty,
      isFirstDonation,
      isWorkshopRestoration: check.isFromWorkshop
    });
  }

  static getDonationStats(): {
    totalDonations: number;
    totalResearchCoin: number;
    uniqueSpecimens: number;
  } {
    const stats = this.getStats();
    return {
      totalDonations: stats.totalDonations,
      totalResearchCoin: stats.totalCoin,
      uniqueSpecimens: stats.uniqueSpecimensDonated
    };
  }

  static getRecentDonations(limit: number = 20): DonationEntry[] {
    return this.data.progress.donations.slice(0, limit);
  }

  static getAllDonations(): DonationEntry[] {
    return [...this.data.progress.donations];
  }

  static getDonationCountBySpecimen(): Record<number, number> {
    return { ...this.data.progress.donationsBySpecimen };
  }

  static getCurrentTierInfo(): { tier: DonationTier; nextTier: DonationTier | null; progress: number } {
    return getCurrentTier(this.data.progress.totalDonations);
  }

  static canDonateSpecimen(specimenId: number): {
    canDonate: boolean;
    reason?: string;
    availableCount?: number;
    stars?: number;
    isFromWorkshop?: boolean;
  } {
    const baseCheck = this._canDonateSpecimenInternal(specimenId);
    if (!baseCheck.canDonate) {
      return baseCheck;
    }
    const count = SaveManager.getSpecimenCount(specimenId);
    const availableForDonation = Math.max(0, count - 1);
    if (availableForDonation <= 0) {
      return { canDonate: false, reason: '需要至少1个副本（保留1个用于图鉴）', availableCount: 0 };
    }
    return { ...baseCheck, availableCount: availableForDonation };
  }

  private static _canDonateSpecimenInternal(specimenId: number): {
    canDonate: boolean;
    reason?: string;
    stars: number;
    isFromWorkshop: boolean;
  } {
    const specimen = getPlantSpecimen(specimenId);
    if (!specimen) {
      return { canDonate: false, reason: '标本不存在', stars: 0, isFromWorkshop: false };
    }

    const isGalleryUnlocked = SaveManager.isGalleryUnlocked(specimenId);
    if (!isGalleryUnlocked) {
      return { canDonate: false, reason: '标本尚未解锁', stars: 0, isFromWorkshop: false };
    }

    const level = Levels.find(l => l.specimen.id === specimenId);
    if (!level) {
      return { canDonate: false, reason: '未找到对应关卡', stars: 0, isFromWorkshop: false };
    }

    const levelProgress = SaveManager.getProgress(level.id);
    const stars = levelProgress?.stars || 0;

    if (stars === 0) {
      return { canDonate: false, reason: '至少需要1星才能捐赠', stars: 0, isFromWorkshop: false };
    }

    const isFromWorkshop = SaveManager.isSpecimenRestored(specimenId);
    return { canDonate: true, reason: '', stars, isFromWorkshop };
  }

  static getEligibleSpecimens(): {
    specimenId: number;
    name: string;
    stars: number;
    donationCount: number;
    estimatedCoin: number;
    isFromWorkshop: boolean;
    family: string;
  }[] {
    const unlockedSpecimens = SaveManager.getUnlockedGalleryItems();
    const eligible: {
      specimenId: number;
      name: string;
      stars: number;
      donationCount: number;
      estimatedCoin: number;
      isFromWorkshop: boolean;
      family: string;
    }[] = [];

    unlockedSpecimens.forEach(specimenId => {
      const check = this._canDonateSpecimenInternal(specimenId);
      if (check.canDonate) {
        const specimen = getPlantSpecimen(specimenId)!;
        const level = Levels.find(l => l.specimen.id === specimenId)!;
        const isFirstDonation = this.getDonationsBySpecimen(specimenId) === 0;
        const canCount = this.canDonateSpecimen(specimenId);
        if (!canCount.canDonate) return;
        const estimatedCoin = calculateResearchCoin({
          stars: check.stars,
          specimenId,
          difficulty: level.rule.difficulty,
          isFirstDonation,
          isWorkshopRestoration: check.isFromWorkshop
        });

        eligible.push({
          specimenId,
          name: specimen.name,
          stars: check.stars,
          donationCount: this.getDonationsBySpecimen(specimenId),
          estimatedCoin,
          isFromWorkshop: check.isFromWorkshop,
          family: specimen.family
        });
      }
    });

    eligible.sort((a, b) => {
      if (b.donationCount === 0 && a.donationCount > 0) return 1;
      if (a.donationCount === 0 && b.donationCount > 0) return -1;
      if (b.stars !== a.stars) return b.stars - a.stars;
      return b.estimatedCoin - a.estimatedCoin;
    });

    return eligible;
  }

  static donateSpecimen(specimenId: number): DonationResult {
    const countCheck = this.canDonateSpecimen(specimenId);
    if (!countCheck.canDonate) {
      return {
        success: false,
        specimenId,
        researchCoin: 0,
        message: countCheck.reason || '无法捐赠',
        newTierUnlocked: null,
        newRewards: []
      };
    }
    const check = this._canDonateSpecimenInternal(specimenId);
    if (!check.canDonate) {
      return {
        success: false,
        specimenId,
        researchCoin: 0,
        message: check.reason || '无法捐赠',
        newTierUnlocked: null,
        newRewards: []
      };
    }

    const specimen = getPlantSpecimen(specimenId)!;
    const level = Levels.find(l => l.specimen.id === specimenId)!;
    const isFirstDonation = this.getDonationsBySpecimen(specimenId) === 0;

    const researchCoin = calculateResearchCoin({
      stars: check.stars,
      specimenId,
      difficulty: level.rule.difficulty,
      isFirstDonation,
      isWorkshopRestoration: check.isFromWorkshop
    });

    const oldTierInfo = this.getCurrentTierInfo();
    const oldTierId = oldTierInfo.tier.id;

    this.data.progress.totalDonations += 1;
    this.data.progress.totalResearchCoin += researchCoin;
    this.data.progress.totalResearchCoinEarned += researchCoin;
    this.data.progress.donationsBySpecimen[specimenId] = (this.data.progress.donationsBySpecimen[specimenId] || 0) + 1;

    const entry: DonationEntry = {
      id: `don_${Date.now()}_${specimenId}`,
      specimenId,
      specimenName: specimen.name,
      stars: check.stars || 0,
      researchCoin,
      donatedAt: Date.now(),
      isFromWorkshop: !!check.isFromWorkshop,
      isFirstDonation
    };

    this.data.progress.donations.unshift(entry);
    if (this.data.progress.donations.length > DonationCoinConfig.maxEntriesStored) {
      this.data.progress.donations = this.data.progress.donations.slice(0, DonationCoinConfig.maxEntriesStored);
    }

    SaveManager.addResearchPoints(researchCoin);

    const newTierInfo = this.getCurrentTierInfo();
    let newTierUnlocked: DonationTier | null = null;
    let newRewards: DonationReward[] = [];

    if (newTierInfo.tier.id > oldTierId) {
      newTierUnlocked = newTierInfo.tier;

      for (let i = oldTierId + 1; i <= newTierInfo.tier.id; i++) {
        const tier = DonationTiers.find(t => t.id === i);
        if (tier) {
          tier.rewards.forEach(reward => {
            if (!this.data.progress.rewardsClaimed[reward.id]) {
              newRewards.push(reward);
            }
          });
        }
      }
    }

    let achievementResult: AchievementUnlockResult | undefined;
    const donationCount = this.data.progress.totalDonations;
    const restoredCount = SaveManager.getRestoredSpecimens().length;
    const unlockedSpecimens = SaveManager.getUnlockedGalleryItems();
    const totalStars = SaveManager.getTotalStars();

    try {
      achievementResult = (window as any).AchievementManager?.onDonation?.(
        donationCount,
        restoredCount,
        unlockedSpecimens,
        totalStars,
        this.data.progress.totalResearchCoinEarned
      );
    } catch (e) {
      // ignore
    }

    SaveManager.save();

    return {
      success: true,
      specimenId,
      researchCoin,
      message: isFirstDonation
        ? `首次捐赠${specimen.name}！获得额外奖励`
        : `成功捐赠${specimen.name}`,
      newTierUnlocked,
      newRewards,
      achievementResult,
      totalDonationsAfter: this.data.progress.totalDonations,
      isFirstDonationOfSpecimen: isFirstDonation
    };
  }

  static claimReward(rewardId: number): DonationClaimResult {
    const reward = getDonationReward(rewardId);
    if (!reward) {
      return { success: false, reward: null, message: '奖励不存在' };
    }

    if (this.data.progress.rewardsClaimed[rewardId]) {
      return { success: false, reward, message: '奖励已领取' };
    }

    const tierInfo = this.getCurrentTierInfo();
    const currentTierId = tierInfo.tier.id;
    const requiredTier = DonationTiers.find(t =>
      t.rewards.some(r => r.id === rewardId)
    );

    if (!requiredTier || requiredTier.id > currentTierId) {
      return { success: false, reward, message: '未达到领取条件' };
    }

    this.data.progress.rewardsClaimed[rewardId] = true;
    this.applyReward(reward);
    SaveManager.save();

    return { success: true, reward, rewards: [reward], message: '领取成功' };
  }

  private static applyReward(reward: DonationReward): void {
    switch (reward.type) {
      case 'research_point':
        if (reward.value) {
          SaveManager.addResearchPoints(reward.value);
        }
        break;
      case 'score':
        if (reward.value) {
          SaveManager.addScore(reward.value);
        }
        break;
      case 'fragment':
        if (reward.fragmentId && reward.value) {
          SaveManager.addFragments(reward.fragmentId, reward.value);
        }
        break;
      case 'material':
        if (reward.materialId && reward.value) {
          SaveManager.addMaterials(reward.materialId, reward.value);
        }
        break;
      case 'badge':
        if (reward.badgeId) {
          const badges = SaveManager.getAllBadges();
          badges[reward.badgeId] = true;
        }
        break;
    }
  }

  static canClaimReward(rewardId: number): boolean {
    if (this.data.progress.rewardsClaimed[rewardId]) {
      return false;
    }

    const tierInfo = this.getCurrentTierInfo();
    const currentTierId = tierInfo.tier.id;
    const requiredTier = DonationTiers.find(t =>
      t.rewards.some(r => r.id === rewardId)
    );

    if (!requiredTier) {
      return false;
    }

    return requiredTier.id <= currentTierId;
  }

  static getClaimableRewards(): DonationReward[] {
    const claimable: DonationReward[] = [];
    const tierInfo = this.getCurrentTierInfo();
    const currentTierId = tierInfo.tier.id;

    DonationTiers.forEach(tier => {
      if (tier.id <= currentTierId) {
        tier.rewards.forEach(reward => {
          if (!this.data.progress.rewardsClaimed[reward.id]) {
            claimable.push(reward);
          }
        });
      }
    });

    return claimable;
  }

  static getClaimableRewardsCount(): number {
    return this.getClaimableRewards().length;
  }

  static getAllRewardsWithStatus(): {
    reward: DonationReward;
    tier: DonationTier;
    claimable: boolean;
    claimed: boolean;
  }[] {
    const result: {
      reward: DonationReward;
      tier: DonationTier;
      claimable: boolean;
      claimed: boolean;
    }[] = [];

    DonationTiers.forEach(tier => {
      tier.rewards.forEach(reward => {
        result.push({
          reward,
          tier,
          claimable: this.canClaimReward(reward.id),
          claimed: this.data.progress.rewardsClaimed[reward.id] || false
        });
      });
    });

    return result;
  }

  static donateAllEligible(): {
    totalDonated: number;
    totalCoin: number;
    results: DonationResult[];
    newTierUnlocked: DonationTier | null;
    allNewRewards: DonationReward[];
  } {
    const eligible = this.getEligibleSpecimens();
    const results: DonationResult[] = [];
    let totalDonated = 0;
    let totalCoin = 0;
    let newTierUnlocked: DonationTier | null = null;
    const allNewRewards: DonationReward[] = [];

    const seenRewards = new Set<number>();

    eligible.forEach(item => {
      const result = this.donateSpecimen(item.specimenId);
      if (result.success) {
        totalDonated += 1;
        totalCoin += result.researchCoin;
        results.push(result);

        if (result.newTierUnlocked && !newTierUnlocked) {
          newTierUnlocked = result.newTierUnlocked;
        }

        result.newRewards.forEach(r => {
          if (!seenRewards.has(r.id)) {
            seenRewards.add(r.id);
            allNewRewards.push(r);
          }
        });
      }
    });

    return {
      totalDonated,
      totalCoin,
      results,
      newTierUnlocked,
      allNewRewards
    };
  }

  static getStats(): {
    totalDonations: number;
    totalCoin: number;
    uniqueSpecimensDonated: number;
    averageCoinPerDonation: number;
    mostDonatedSpecimen: { specimenId: number; name: string; count: number } | null;
    currentTier: DonationTier;
    nextTier: DonationTier | null;
    tierProgress: number;
  } {
    const tierInfo = this.getCurrentTierInfo();
    const uniqueSpecimens = Object.keys(this.data.progress.donationsBySpecimen).length;
    const averageCoin = this.data.progress.totalDonations > 0
      ? Math.round(this.data.progress.totalResearchCoinEarned / this.data.progress.totalDonations)
      : 0;

    let mostDonated: { specimenId: number; name: string; count: number } | null = null;
    let maxCount = 0;
    Object.entries(this.data.progress.donationsBySpecimen).forEach(([idStr, count]) => {
      const id = parseInt(idStr);
      if (count > maxCount) {
        maxCount = count;
        const specimen = getPlantSpecimen(id);
        mostDonated = {
          specimenId: id,
          name: specimen?.name || `标本 #${id}`,
          count
        };
      }
    });

    return {
      totalDonations: this.data.progress.totalDonations,
      totalCoin: this.data.progress.totalResearchCoinEarned,
      uniqueSpecimensDonated: uniqueSpecimens,
      averageCoinPerDonation: averageCoin,
      mostDonatedSpecimen: mostDonated,
      currentTier: tierInfo.tier,
      nextTier: tierInfo.nextTier,
      tierProgress: tierInfo.progress
    };
  }

  static getRarityLabel(rarity: 'common' | 'rare' | 'epic' | 'legendary'): string {
    const labels: Record<string, string> = {
      common: '普通',
      rare: '稀有',
      epic: '史诗',
      legendary: '传说'
    };
    return labels[rarity] || rarity;
  }

  static getRarityColor(rarity: 'common' | 'rare' | 'epic' | 'legendary'): number {
    const colors: Record<string, number> = {
      common: 0x9e9e9e,
      rare: 0x2196f3,
      epic: 0x9c27b0,
      legendary: 0xffd700
    };
    return colors[rarity] || 0x9e9e9e;
  }
}
