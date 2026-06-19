import {
  SeasonPassSaveData,
  SeasonPassProgress,
  SeasonPassTrackType,
  SeasonPassReward,
  SeasonPassQuest,
  SeasonPassQuestStatus,
  SeasonPassUpdateResult,
  SeasonPassClaimResult,
  SeasonPassQuestConfig,
  SeasonPassRewardTier,
  SeasonPassTier
} from '../types/GameTypes';
import {
  CURRENT_SEASON_ID,
  CURRENT_SEASON_NAME,
  SEASON_DURATION_DAYS,
  MAX_TRACK_LEVEL,
  SeasonPassQuestPool,
  getTrackTiers,
  getTrackTier,
  getCurrentLevel
} from '../data/SeasonPassConfig';
import { SaveManager } from './SaveManager';

export class SeasonPassManager {
  private static data: SeasonPassSaveData;
  private static listeners: Set<() => void> = new Set();
  private static saveSyncEnabled: boolean = false;

  static init(saveData: SeasonPassSaveData | undefined): void {
    this.saveSyncEnabled = false;
    if (saveData && saveData.seasonId === CURRENT_SEASON_ID) {
      this.data = saveData;
      this.checkAndRefreshQuests();
    } else {
      this.data = this.createDefaultSave();
    }
    this.syncTrackProgress();
    this.saveSyncEnabled = true;
    this.notifyListeners();
    this.persistToSaveManager();
  }

  private static createDefaultSave(): SeasonPassSaveData {
    const now = Date.now();
    const endDate = now + SEASON_DURATION_DAYS * 24 * 60 * 60 * 1000;

    const createTrackProgress = (trackType: SeasonPassTrackType): SeasonPassProgress => ({
      trackType,
      currentValue: 0,
      currentLevel: 0,
      maxLevel: MAX_TRACK_LEVEL,
      nextLevelThreshold: getTrackTiers(trackType)[1]?.threshold ?? 0,
      totalXp: 0
    });

    const rewardsClaimed: Record<string, Record<number, boolean>> = {
      restore: {},
      score: {},
      gallery: {}
    };

    return {
      seasonId: CURRENT_SEASON_ID,
      seasonName: CURRENT_SEASON_NAME,
      isPremium: false,
      startDate: now,
      endDate,
      trackProgress: {
        restore: createTrackProgress('restore'),
        score: createTrackProgress('score'),
        gallery: createTrackProgress('gallery')
      },
      rewardsClaimed,
      quests: {},
      lastRefreshDate: '',
      refreshCount: 0,
      totalRestores: 0,
      totalScoreGain: 0,
      totalGalleryUnlocks: 0,
      completedQuests: 0,
      claimedQuests: 0,
      pendingRewards: []
    };
  }

  static getData(): SeasonPassSaveData {
    return {
      ...this.data,
      trackProgress: { ...this.data.trackProgress },
      rewardsClaimed: { ...this.data.rewardsClaimed },
      quests: { ...this.data.quests },
      pendingRewards: [...this.data.pendingRewards]
    };
  }

  static getSaveData(): SeasonPassSaveData {
    return this.getData();
  }

  private static persistToSaveManager(): void {
    if (!this.saveSyncEnabled) return;
    try {
      SaveManager.setSeasonPassData(this.data);
    } catch {
    }
  }

  private static notifyListeners(): void {
    this.persistToSaveManager();
    this.listeners.forEach(listener => listener());
  }

  static addListener(listener: () => void): void {
    this.listeners.add(listener);
  }

  static removeListener(listener: () => void): void {
    this.listeners.delete(listener);
  }

  private static syncTrackProgress(): void {
    this.updateTrackProgressInternal('restore', this.data.totalRestores, false);
    this.updateTrackProgressInternal('score', this.data.totalScoreGain, false);
    this.updateTrackProgressInternal('gallery', this.data.totalGalleryUnlocks, false);
  }

  private static updateTrackProgressInternal(
    trackType: SeasonPassTrackType,
    newValue: number,
    triggerNotification: boolean
  ): SeasonPassUpdateResult {
    const progress = this.data.trackProgress[trackType];
    const oldValue = progress.currentValue;
    const oldLevel = progress.currentLevel;

    progress.currentValue = Math.max(progress.currentValue, newValue);

    const { level, nextThreshold, currentThreshold } = getCurrentLevel(trackType, progress.currentValue);
    progress.currentLevel = level;
    progress.nextLevelThreshold = nextThreshold;
    progress.totalXp = progress.currentValue;

    const leveledUp = level > oldLevel;
    const newlyUnlockedRewards: { level: number; tier: SeasonPassRewardTier; reward: SeasonPassReward; tierConfig: SeasonPassTier }[] = [];

    if (leveledUp) {
      for (let l = oldLevel + 1; l <= level; l++) {
        const tier = getTrackTier(trackType, l);
        if (tier) {
          if (tier.freeReward) {
            newlyUnlockedRewards.push({ level: l, tier: 'free', reward: tier.freeReward, tierConfig: tier });
          }
          if (this.data.isPremium && tier.premiumReward) {
            newlyUnlockedRewards.push({ level: l, tier: 'premium', reward: tier.premiumReward, tierConfig: tier });
          }
        }
      }
    }

    const result: SeasonPassUpdateResult = {
      trackType,
      oldValue,
      newValue: progress.currentValue,
      oldLevel,
      newLevel: level,
      leveledUp,
      newlyUnlockedRewards
    };

    if (triggerNotification) {
      this.notifyListeners();
    }

    return result;
  }

  static onRestore(specimenId?: number, levelId?: number): SeasonPassUpdateResult {
    this.data.totalRestores += 1;
    const result = this.updateTrackProgressInternal('restore', this.data.totalRestores, true);
    this.updateQuestProgressOnRestore(specimenId, levelId);
    return result;
  }

  static onScoreGain(score: number, levelId?: number, singleScore?: number): SeasonPassUpdateResult {
    this.data.totalScoreGain += score;
    const result = this.updateTrackProgressInternal('score', this.data.totalScoreGain, true);
    this.updateQuestProgressOnScore(score, levelId, singleScore);
    return result;
  }

  static onGalleryUnlock(specimenId?: number): SeasonPassUpdateResult {
    this.data.totalGalleryUnlocks += 1;
    const result = this.updateTrackProgressInternal('gallery', this.data.totalGalleryUnlocks, true);
    this.updateQuestProgressOnGallery(specimenId);
    return result;
  }

  private static updateQuestProgressOnRestore(specimenId?: number, levelId?: number): void {
    Object.values(this.data.quests).forEach(quest => {
      if (quest.trackType !== 'restore') return;
      if (quest.status !== 'pending' && quest.status !== 'in_progress') return;
      if (quest.targetSpecimenId && quest.targetSpecimenId !== specimenId) return;
      if (quest.targetLevelId && quest.targetLevelId !== levelId) return;

      quest.currentProgress = Math.min(quest.currentProgress + 1, quest.targetCount);
      this.updateQuestStatus(quest);
    });
  }

  private static updateQuestProgressOnScore(score: number, levelId?: number, singleScore?: number): void {
    Object.values(this.data.quests).forEach(quest => {
      if (quest.trackType !== 'score') return;
      if (quest.status !== 'pending' && quest.status !== 'in_progress') return;
      if (quest.targetLevelId && quest.targetLevelId !== levelId) return;

      if (quest.targetScore !== undefined) {
        if (singleScore !== undefined && singleScore >= quest.targetScore) {
          quest.currentProgress = Math.min(quest.currentProgress + 1, quest.targetCount);
        }
      } else {
        quest.currentProgress = Math.min(quest.currentProgress + score, quest.targetCount);
      }
      this.updateQuestStatus(quest);
    });
  }

  private static updateQuestProgressOnGallery(specimenId?: number): void {
    Object.values(this.data.quests).forEach(quest => {
      if (quest.trackType !== 'gallery') return;
      if (quest.status !== 'pending' && quest.status !== 'in_progress') return;

      quest.currentProgress = Math.min(quest.currentProgress + 1, quest.targetCount);
      this.updateQuestStatus(quest);
    });
  }

  private static updateQuestStatus(quest: SeasonPassQuest): void {
    const wasNotCompleted = quest.status === 'pending' || quest.status === 'in_progress';
    if (quest.currentProgress >= quest.targetCount && wasNotCompleted) {
      quest.status = 'completed';
      quest.completedAt = Date.now();
      this.data.completedQuests += 1;
    } else if (quest.currentProgress > 0 && quest.status === 'pending') {
      quest.status = 'in_progress';
    }
  }

  static getTrackProgress(trackType: SeasonPassTrackType): SeasonPassProgress {
    return { ...this.data.trackProgress[trackType] };
  }

  static getAllTrackProgress(): Record<SeasonPassTrackType, SeasonPassProgress> {
    return {
      restore: { ...this.data.trackProgress.restore },
      score: { ...this.data.trackProgress.score },
      gallery: { ...this.data.trackProgress.gallery }
    };
  }

  static getClaimableRewards(trackType: SeasonPassTrackType): { level: number; tier: SeasonPassTier; reward: SeasonPassReward; isPremium: boolean }[] {
    const tiers = getTrackTiers(trackType);
    const progress = this.data.trackProgress[trackType];
    const claimed = (this.data.rewardsClaimed[trackType] || {}) as Record<string, boolean>;
    const claimable: { level: number; tier: SeasonPassTier; reward: SeasonPassReward; isPremium: boolean }[] = [];

    tiers.forEach(tier => {
      if (tier.level > progress.currentLevel) return;

      if (tier.freeReward && !claimed[`free_${tier.level}`]) {
        claimable.push({ level: tier.level, tier, reward: tier.freeReward, isPremium: false });
      }
      if (this.data.isPremium && tier.premiumReward && !claimed[`premium_${tier.level}`]) {
        claimable.push({ level: tier.level, tier, reward: tier.premiumReward, isPremium: true });
      }
    });

    return claimable;
  }

  static hasClaimableRewards(): boolean {
    const tracks: SeasonPassTrackType[] = ['restore', 'score', 'gallery'];
    return tracks.some(t => this.getClaimableRewards(t).length > 0) || this.getCompletedUnclaimedQuests().length > 0;
  }

  static claimTrackReward(
    trackType: SeasonPassTrackType,
    level: number,
    isPremium: boolean
  ): SeasonPassClaimResult {
    const tierConfig = getTrackTier(trackType, level);
    const rewardTier: SeasonPassRewardTier = isPremium ? 'premium' : 'free';
    if (!tierConfig) return { success: false, trackType, level, tier: rewardTier, reward: {} as SeasonPassReward };

    const progress = this.data.trackProgress[trackType];
    if (level > progress.currentLevel) {
      return { success: false, trackType, level, tier: rewardTier, reward: {} as SeasonPassReward };
    }

    const key = `${isPremium ? 'premium' : 'free'}_${level}`;
    const trackClaimed = (this.data.rewardsClaimed[trackType] || {}) as Record<string, boolean>;
    if (trackClaimed[key]) {
      return { success: false, trackType, level, tier: rewardTier, reward: {} as SeasonPassReward };
    }

    const reward = isPremium ? tierConfig.premiumReward : tierConfig.freeReward;
    if (!reward) return { success: false, trackType, level, tier: rewardTier, reward: {} as SeasonPassReward };

    if (!this.data.rewardsClaimed[trackType]) {
      this.data.rewardsClaimed[trackType] = {};
    }
    (this.data.rewardsClaimed[trackType] as Record<string, boolean>)[key] = true;

    this.applyReward(reward);

    this.notifyListeners();
    return { success: true, trackType, level, tier: rewardTier, reward };
  }

  private static applyReward(reward: SeasonPassReward): void {
    switch (reward.type) {
      case 'score':
        if (reward.value) {
          this.grantScore(reward.value);
        }
        break;
      case 'fragment':
        if (reward.fragmentId !== undefined && reward.value) {
          this.grantFragments(reward.fragmentId, reward.value);
        }
        break;
      case 'material':
        if (reward.materialId !== undefined && reward.value) {
          this.grantMaterials(reward.materialId, reward.value);
        }
        break;
      case 'research_point':
        if (reward.value) {
          this.grantResearchPoints(reward.value);
        }
        break;
      case 'badge':
        if (reward.badgeId !== undefined) {
          this.grantBadge(reward.badgeId);
        }
        break;
      case 'specimen':
        if (reward.specimenId !== undefined) {
          this.grantSpecimen(reward.specimenId);
        }
        break;
      case 'title':
        if (reward.titleId !== undefined) {
          this.grantTitle(reward.titleId);
        }
        break;
    }
  }

  private static grantScore(value: number): void {
    this.data.pendingRewards.push({
      id: Date.now(),
      type: 'score',
      name: '积分奖励',
      description: `获得 ${value} 积分`,
      icon: '⭐',
      rarity: 'common',
      value
    });
  }

  private static grantFragments(fragmentId: number, count: number): void {
    this.data.pendingRewards.push({
      id: Date.now() + 1,
      type: 'fragment',
      name: '碎片奖励',
      description: `获得 ${count} 个碎片`,
      icon: '🧩',
      rarity: 'common',
      value: count,
      fragmentId
    });
  }

  private static grantMaterials(materialId: number, count: number): void {
    this.data.pendingRewards.push({
      id: Date.now() + 2,
      type: 'material',
      name: '材料奖励',
      description: `获得 ${count} 个材料`,
      icon: '🧰',
      rarity: 'common',
      value: count,
      materialId
    });
  }

  private static grantResearchPoints(value: number): void {
    this.data.pendingRewards.push({
      id: Date.now() + 3,
      type: 'research_point',
      name: '研究点奖励',
      description: `获得 ${value} 研究点`,
      icon: '🔬',
      rarity: 'rare',
      value
    });
  }

  private static grantBadge(badgeId: number): void {
    this.data.pendingRewards.push({
      id: Date.now() + 4,
      type: 'badge',
      name: '徽章奖励',
      description: '获得新徽章',
      icon: '🎖️',
      rarity: 'rare',
      badgeId
    });
  }

  private static grantSpecimen(specimenId: number): void {
    this.data.pendingRewards.push({
      id: Date.now() + 5,
      type: 'specimen',
      name: '标本奖励',
      description: '解锁新标本',
      icon: '🌸',
      rarity: 'epic',
      specimenId
    });
  }

  private static grantTitle(titleId: number): void {
    this.data.pendingRewards.push({
      id: Date.now() + 6,
      type: 'title',
      name: '称号奖励',
      description: '获得新称号',
      icon: '👑',
      rarity: 'legendary',
      titleId
    });
  }

  static flushPendingRewards(): SeasonPassReward[] {
    const rewards = [...this.data.pendingRewards];
    this.data.pendingRewards = [];
    this.notifyListeners();
    return rewards;
  }

  static getPendingRewards(): SeasonPassReward[] {
    return [...this.data.pendingRewards];
  }

  private static checkAndRefreshQuests(): void {
    const today = new Date().toDateString();
    if (this.data.lastRefreshDate !== today) {
      this.refreshDailyQuests();
    }

    Object.values(this.data.quests).forEach(quest => {
      if (quest.status === 'pending' || quest.status === 'in_progress') {
        if (Date.now() > quest.expiresAt) {
          quest.status = 'pending';
          quest.currentProgress = 0;
        }
      }
    });
  }

  static refreshDailyQuests(): SeasonPassQuest[] {
    const today = new Date().toDateString();
    if (this.data.lastRefreshDate === today && this.data.refreshCount > 0) {
      this.data.refreshCount += 1;
    } else {
      this.data.lastRefreshDate = today;
      this.data.refreshCount = 1;
    }

    Object.keys(this.data.quests).forEach(key => {
      const q = this.data.quests[key];
      if (q.status === 'pending' || q.status === 'in_progress') {
        delete this.data.quests[key];
      }
    });

    const newQuests = this.generateNewQuests();
    newQuests.forEach(q => {
      this.data.quests[q.id] = q;
    });

    this.notifyListeners();
    return newQuests;
  }

  private static generateNewQuests(): SeasonPassQuest[] {
    const shuffled = [...SeasonPassQuestPool].sort(() => Math.random() - 0.5);
    const selected: SeasonPassQuestConfig[] = [];

    const countByTrack: Record<SeasonPassTrackType, number> = {
      restore: 0,
      score: 0,
      gallery: 0
    };

    for (const config of shuffled) {
      if (selected.length >= 4) break;
      if (countByTrack[config.trackType] >= 2) continue;
      selected.push(config);
      countByTrack[config.trackType]++;
    }

    const now = Date.now();
    return selected.map(config => {
      const expiresAt = now + config.durationDays * 24 * 60 * 60 * 1000;
      return {
        ...config,
        id: `${config.id}_${now}_${Math.floor(Math.random() * 10000)}`,
        currentProgress: 0,
        status: 'pending' as SeasonPassQuestStatus,
        createdAt: now,
        expiresAt
      };
    });
  }

  static getQuests(): SeasonPassQuest[] {
    return Object.values(this.data.quests).sort((a, b) => {
      const statusOrder: Record<SeasonPassQuestStatus, number> = {
        in_progress: 0,
        completed: 1,
        pending: 2,
        claimed: 3
      };
      return statusOrder[a.status] - statusOrder[b.status];
    });
  }

  static getActiveQuests(): SeasonPassQuest[] {
    return this.getQuests().filter(q => q.status === 'pending' || q.status === 'in_progress' || q.status === 'completed');
  }

  static getCompletedUnclaimedQuests(): SeasonPassQuest[] {
    return this.getQuests().filter(q => q.status === 'completed');
  }

  static claimQuest(questId: string): { success: boolean; quest: SeasonPassQuest | null; rewards: SeasonPassReward[] } {
    const quest = this.data.quests[questId];
    if (!quest || quest.status !== 'completed') {
      return { success: false, quest: null, rewards: [] };
    }

    quest.status = 'claimed';
    quest.claimedAt = Date.now();
    this.data.claimedQuests += 1;

    quest.rewards.forEach(r => this.applyReward(r));

    this.notifyListeners();
    return { success: true, quest, rewards: quest.rewards };
  }

  static isPremium(): boolean {
    return this.data.isPremium;
  }

  static upgradeToPremium(): boolean {
    if (this.data.isPremium) return false;
    this.data.isPremium = true;
    this.syncTrackProgress();
    this.notifyListeners();
    return true;
  }

  static getSeasonInfo(): {
    seasonId: string;
    seasonName: string;
    isPremium: boolean;
    startDate: number;
    endDate: number;
    daysRemaining: number;
  } {
    const now = Date.now();
    const msRemaining = Math.max(0, this.data.endDate - now);
    const daysRemaining = Math.ceil(msRemaining / (24 * 60 * 60 * 1000));

    return {
      seasonId: this.data.seasonId,
      seasonName: this.data.seasonName,
      isPremium: this.data.isPremium,
      startDate: this.data.startDate,
      endDate: this.data.endDate,
      daysRemaining
    };
  }

  static getTotalStats(): {
    totalRestores: number;
    totalScoreGain: number;
    totalGalleryUnlocks: number;
    completedQuests: number;
    claimedQuests: number;
    totalLevels: number;
    levelsCompleted: number;
    premiumAvailable: number;
  } {
    const tracks: SeasonPassTrackType[] = ['restore', 'score', 'gallery'];
    let totalLevels = 0;
    let levelsCompleted = 0;
    let premiumAvailable = 0;

    tracks.forEach(t => {
      totalLevels += MAX_TRACK_LEVEL * 2;
      const progress = this.data.trackProgress[t];
      levelsCompleted += progress.currentLevel;
      if (this.data.isPremium) {
        premiumAvailable += progress.currentLevel;
      }
    });

    return {
      totalRestores: this.data.totalRestores,
      totalScoreGain: this.data.totalScoreGain,
      totalGalleryUnlocks: this.data.totalGalleryUnlocks,
      completedQuests: this.data.completedQuests,
      claimedQuests: this.data.claimedQuests,
      totalLevels,
      levelsCompleted,
      premiumAvailable
    };
  }
}
