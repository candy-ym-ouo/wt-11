import {
  DailyQuest,
  DailyQuestType,
  DailyQuestReward,
  DailyQuestSaveData,
  DailyQuestProgress,
  DailyQuestStatus
} from '../types/GameTypes';
import { LevelRules } from '../data/LevelRules';
import { PlantSpecimens } from '../data/PlantSpecimens';
import { WorkshopRecipes } from '../data/WorkshopConfig';
import { SaveManager } from './SaveManager';
import { ConservationManager } from './ConservationManager';

const QUEST_COUNT_PER_DAY = 4;
const DAILY_REFRESH_HOUR = 0;
const DAILY_REFRESH_MINUTE = 0;

const FRAGMENT_IDS = [101, 102, 103, 104, 105, 1, 2, 3, 4, 5, 6];
const MATERIAL_IDS = [201, 202, 203, 204, 205];

const MATERIAL_NAMES: Record<number, string> = {
  201: '营养液',
  202: '修复剂',
  203: '生长素',
  204: '防腐剂',
  205: '染色剂'
};

export class DailyQuestManager {
  private static data: DailyQuestSaveData;

  static init(saveData: DailyQuestSaveData): void {
    this.data = saveData;
    this.checkAndRefreshDaily();
  }

  static getTodayDateString(): string {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  }

  static getNextRefreshTime(): number {
    const now = new Date();
    const nextRefresh = new Date();
    nextRefresh.setDate(now.getDate() + 1);
    nextRefresh.setHours(DAILY_REFRESH_HOUR, DAILY_REFRESH_MINUTE, 0, 0);
    return nextRefresh.getTime();
  }

  static getTimeUntilNextRefresh(): {
    hours: number;
    minutes: number;
    seconds: number;
    totalMs: number;
  } {
    const now = Date.now();
    const nextRefresh = this.getNextRefreshTime();
    const diff = Math.max(0, nextRefresh - now);
    const hours = Math.floor(diff / (60 * 60 * 1000));
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((diff % (60 * 1000)) / 1000);
    return { hours, minutes, seconds, totalMs: diff };
  }

  static checkAndRefreshDaily(): void {
    const today = this.getTodayDateString();
    if (this.data.lastRefreshDate !== today) {
      this.refreshDailyQuests();
    }
  }

  static refreshDailyQuests(): void {
    const today = this.getTodayDateString();
    this.data.lastRefreshDate = today;
    this.data.refreshCount++;
    this.data.quests = {};

    this.resetDailyProgress();
    this.generateDailyQuests();
    SaveManager.save();
  }

  private static resetDailyProgress(): void {
    this.data.progress = {
      consecutiveWins: this.data.progress.consecutiveWins,
      lastWinTime: this.data.progress.lastWinTime,
      todayPlayedLevels: [],
      todayBestScores: {},
      todayBestTimes: {},
      restoredToday: []
    };
  }

  private static generateDailyQuests(): void {
    const questTypes: DailyQuestType[] = ['restore_plant', 'timed_score', 'win_streak', 'care_specimen'];
    const usedSpecimenIds: number[] = [];

    for (let i = 0; i < QUEST_COUNT_PER_DAY; i++) {
      const type = questTypes[i % questTypes.length];
      const quest = this.createQuest(type, i, usedSpecimenIds);
      if (quest) {
        this.data.quests[quest.id] = quest;
      }
    }
  }

  private static createQuest(
    type: DailyQuestType,
    index: number,
    usedSpecimenIds: number[]
  ): DailyQuest | null {
    const now = Date.now();
    const expiresAt = this.getNextRefreshTime();
    const difficulties: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard'];
    const difficulty = difficulties[index % difficulties.length];

    const id = `daily_${this.getTodayDateString()}_${index}_${type}`;

    switch (type) {
      case 'restore_plant':
        return this.createRestorePlantQuest(id, difficulty, expiresAt, now, usedSpecimenIds);
      case 'timed_score':
        return this.createTimedScoreQuest(id, difficulty, expiresAt, now);
      case 'win_streak':
        return this.createWinStreakQuest(id, difficulty, expiresAt, now);
      case 'care_specimen':
        return this.createCareSpecimenQuest(id, difficulty, expiresAt, now, usedSpecimenIds);
      default:
        return null;
    }
  }

  private static createRestorePlantQuest(
    id: string,
    difficulty: 'easy' | 'medium' | 'hard',
    expiresAt: number,
    now: number,
    usedSpecimenIds: number[]
  ): DailyQuest {
    const mainSpecimenIds = Object.values(PlantSpecimens)
      .filter(s => s.id < 100)
      .filter(s => !usedSpecimenIds.includes(s.id))
      .map(s => s.id);

    const targetSpecimenId = mainSpecimenIds[Math.floor(Math.random() * mainSpecimenIds.length)] || 1;
    usedSpecimenIds.push(targetSpecimenId);

    const targetCount = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3;
    const specimen = PlantSpecimens[targetSpecimenId];

    const rewards = this.generateRewards(difficulty, 'restore_plant', targetSpecimenId);

    return {
      id,
      type: 'restore_plant',
      title: `修复${specimen?.name || '植物'}标本`,
      description: `在工坊中修复 ${targetCount} 个${specimen?.name || ''}标本`,
      targetSpecimenId,
      targetCount,
      currentProgress: 0,
      targetProgress: targetCount,
      status: 'pending',
      rewards,
      difficulty,
      expiresAt,
      createdAt: now
    };
  }

  private static createTimedScoreQuest(
    id: string,
    difficulty: 'easy' | 'medium' | 'hard',
    expiresAt: number,
    now: number
  ): DailyQuest {
    const unlockedLevels = LevelRules.filter(rule => {
      return SaveManager.isLevelUnlocked(rule.id);
    });

    const targetRule = unlockedLevels[Math.floor(Math.random() * unlockedLevels.length)] || LevelRules[0];
    const targetScore = difficulty === 'easy' ? 1500 : difficulty === 'medium' ? 2500 : 3500;
    const targetTimeLimit = difficulty === 'easy' ? targetRule.timeLimit :
      difficulty === 'medium' ? Math.floor(targetRule.timeLimit * 0.8) :
        Math.floor(targetRule.timeLimit * 0.6);

    const rewards = this.generateRewards(difficulty, 'timed_score', targetRule.specimenId);

    return {
      id,
      type: 'timed_score',
      title: '限时高分挑战',
      description: `在 ${targetTimeLimit} 秒内完成关卡「${targetRule.name}」并获得 ${targetScore} 分以上`,
      targetLevelId: targetRule.id,
      targetScore,
      targetTimeLimit,
      currentProgress: 0,
      targetProgress: targetScore,
      status: 'pending',
      rewards,
      difficulty,
      expiresAt,
      createdAt: now
    };
  }

  private static createWinStreakQuest(
    id: string,
    difficulty: 'easy' | 'medium' | 'hard',
    expiresAt: number,
    now: number
  ): DailyQuest {
    const targetStreak = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 3 : 5;
    const rewards = this.generateRewards(difficulty, 'win_streak');

    return {
      id,
      type: 'win_streak',
      title: '连胜挑战',
      description: `连续成功完成 ${targetStreak} 个关卡（中途失败将重置连胜）`,
      targetStreak,
      currentProgress: this.data.progress.consecutiveWins || 0,
      targetProgress: targetStreak,
      status: 'pending',
      rewards,
      difficulty,
      expiresAt,
      createdAt: now
    };
  }

  private static createCareSpecimenQuest(
    id: string,
    difficulty: 'easy' | 'medium' | 'hard',
    expiresAt: number,
    now: number,
    usedSpecimenIds: number[]
  ): DailyQuest {
    const registeredIds = ConservationManager.getRegisteredSpecimenIds();
    const mainSpecimenIds = registeredIds.filter(id => id < 100 && !usedSpecimenIds.includes(id));

    const targetSpecimenId = mainSpecimenIds.length > 0
      ? mainSpecimenIds[Math.floor(Math.random() * mainSpecimenIds.length)]
      : (registeredIds.length > 0 ? registeredIds[0] : 1);

    if (!usedSpecimenIds.includes(targetSpecimenId)) {
      usedSpecimenIds.push(targetSpecimenId);
    }

    const specimen = PlantSpecimens[targetSpecimenId];
    const targetCount = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3;
    const rewards = this.generateRewards(difficulty, 'care_specimen', targetSpecimenId);

    return {
      id,
      type: 'care_specimen',
      title: `养护${specimen?.name || '标本'}`,
      description: `对${specimen?.name || '标本'}进行 ${targetCount} 次养护操作`,
      targetSpecimenId,
      targetCount,
      currentProgress: 0,
      targetProgress: targetCount,
      status: 'pending',
      rewards,
      difficulty,
      expiresAt,
      createdAt: now
    };
  }

  private static generateRewards(
    difficulty: 'easy' | 'medium' | 'hard',
    questType: DailyQuestType,
    specimenId?: number
  ): DailyQuestReward[] {
    const rewards: DailyQuestReward[] = [];
    const scoreMultiplier = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3;

    rewards.push({
      type: 'score',
      id: 0,
      name: '积分奖励',
      description: '获得游戏积分',
      value: 500 * scoreMultiplier,
      rarity: 'common'
    });

    if (questType === 'restore_plant' && specimenId) {
      rewards.push({
        type: 'fragment',
        id: specimenId,
        name: `${PlantSpecimens[specimenId]?.name || '植物'}碎片`,
        description: '用于修复植物标本',
        value: difficulty === 'easy' ? 2 : difficulty === 'medium' ? 4 : 6,
        rarity: difficulty === 'hard' ? 'rare' : 'common'
      });
    } else {
      const randomFragmentId = FRAGMENT_IDS[Math.floor(Math.random() * FRAGMENT_IDS.length)];
      rewards.push({
        type: 'fragment',
        id: randomFragmentId,
        name: `${PlantSpecimens[randomFragmentId]?.name || '神秘'}碎片`,
        description: '用于修复植物标本',
        value: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        rarity: difficulty === 'hard' ? 'rare' : 'common'
      });
    }

    if (difficulty === 'medium' || difficulty === 'hard') {
      const randomMaterialId = MATERIAL_IDS[Math.floor(Math.random() * MATERIAL_IDS.length)];
      rewards.push({
        type: 'material',
        id: randomMaterialId,
        name: MATERIAL_NAMES[randomMaterialId] || '神秘材料',
        description: '工坊修复所需材料',
        value: difficulty === 'medium' ? 2 : 4,
        rarity: difficulty === 'hard' ? 'epic' : 'rare'
      });
    }

    return rewards;
  }

  static getAllQuests(): DailyQuest[] {
    this.checkAndRefreshDaily();
    return Object.values(this.data.quests).sort((a, b) => a.createdAt - b.createdAt);
  }

  static getQuestById(questId: string): DailyQuest | undefined {
    this.checkAndRefreshDaily();
    return this.data.quests[questId];
  }

  static getQuestsByStatus(status: DailyQuestStatus): DailyQuest[] {
    return this.getAllQuests().filter(q => q.status === status);
  }

  static hasClaimableQuests(): boolean {
    return this.getQuestsByStatus('completed').length > 0;
  }

  static getClaimableQuestsCount(): number {
    return this.getQuestsByStatus('completed').length;
  }

  static onLevelComplete(levelId: number, score: number, time: number, stars: number): DailyQuest[] {
    this.checkAndRefreshDaily();

    const updatedQuests: DailyQuest[] = [];

    if (!this.data.progress.todayPlayedLevels.includes(levelId)) {
      this.data.progress.todayPlayedLevels.push(levelId);
    }

    if (!this.data.progress.todayBestScores[levelId] || score > this.data.progress.todayBestScores[levelId]) {
      this.data.progress.todayBestScores[levelId] = score;
    }

    if (!this.data.progress.todayBestTimes[levelId] || time < this.data.progress.todayBestTimes[levelId]) {
      this.data.progress.todayBestTimes[levelId] = time;
    }

    this.data.progress.consecutiveWins = (this.data.progress.consecutiveWins || 0) + 1;
    this.data.progress.lastWinTime = Date.now();

    const quests = this.getAllQuests();
    for (const quest of quests) {
      const wasCompleted = quest.status === 'completed' || quest.status === 'claimed';
      if (wasCompleted) continue;

      let progressUpdated = false;

      switch (quest.type) {
        case 'timed_score':
          if (quest.targetLevelId === levelId && quest.targetTimeLimit) {
            if (time <= quest.targetTimeLimit && score >= (quest.targetScore || 0)) {
              quest.currentProgress = Math.max(quest.currentProgress, score);
              progressUpdated = true;
            }
          }
          break;

        case 'win_streak':
          quest.currentProgress = this.data.progress.consecutiveWins;
          progressUpdated = true;
          break;
      }

      if (progressUpdated) {
        this.checkQuestCompletion(quest);
        updatedQuests.push(quest);
      }
    }

    if (updatedQuests.length > 0) {
      SaveManager.save();
    }

    return updatedQuests;
  }

  static onLevelFail(): void {
    this.data.progress.consecutiveWins = 0;

    const quests = this.getAllQuests();
    for (const quest of quests) {
      if (quest.type === 'win_streak' && quest.status === 'pending') {
        quest.currentProgress = 0;
      }
    }

    SaveManager.save();
  }

  static onSpecimenRestored(specimenId: number): DailyQuest[] {
    this.checkAndRefreshDaily();

    if (!this.data.progress.restoredToday.includes(specimenId)) {
      this.data.progress.restoredToday.push(specimenId);
    }

    const updatedQuests: DailyQuest[] = [];
    const quests = this.getAllQuests();

    for (const quest of quests) {
      if (quest.status === 'completed' || quest.status === 'claimed') continue;

      if (quest.type === 'restore_plant' && quest.targetSpecimenId === specimenId) {
        quest.currentProgress = Math.min(
          (quest.currentProgress || 0) + 1,
          quest.targetProgress
        );
        this.checkQuestCompletion(quest);
        updatedQuests.push(quest);
      }
    }

    if (updatedQuests.length > 0) {
      SaveManager.save();
    }

    return updatedQuests;
  }

  static onSpecimenCare(specimenId: number): DailyQuest[] {
    this.checkAndRefreshDaily();

    const updatedQuests: DailyQuest[] = [];
    const quests = this.getAllQuests();

    for (const quest of quests) {
      if (quest.status === 'completed' || quest.status === 'claimed') continue;

      if (quest.type === 'care_specimen' && quest.targetSpecimenId === specimenId) {
        quest.currentProgress = Math.min(
          (quest.currentProgress || 0) + 1,
          quest.targetProgress
        );
        this.checkQuestCompletion(quest);
        updatedQuests.push(quest);
      }
    }

    if (updatedQuests.length > 0) {
      SaveManager.save();
    }

    return updatedQuests;
  }

  private static checkQuestCompletion(quest: DailyQuest): void {
    const isCompleted = quest.currentProgress >= quest.targetProgress;

    if (isCompleted && quest.status === 'pending') {
      quest.status = 'completed';
      quest.completedAt = Date.now();
      this.data.totalCompleted++;
    }
  }

  static canClaimQuest(questId: string): boolean {
    const quest = this.getQuestById(questId);
    if (!quest) return false;
    return quest.status === 'completed';
  }

  static claimQuest(questId: string): { success: boolean; rewards: DailyQuestReward[]; finalRewards: DailyQuestReward[]; quest?: DailyQuest; conservationApplied: boolean; conservationMultiplier: { score: number; fragment: number } } {
    const quest = this.getQuestById(questId);
    if (!quest || !this.canClaimQuest(questId)) {
      return { success: false, rewards: [], finalRewards: [], conservationApplied: false, conservationMultiplier: { score: 1, fragment: 1 } };
    }

    const globalMultiplier = ConservationManager.getGlobalRewardMultiplier();
    const conservationApplied = globalMultiplier.scoreMultiplier < 1 || globalMultiplier.fragmentMultiplier < 1;
    const finalRewards: DailyQuestReward[] = [];

    for (const reward of quest.rewards) {
      let finalValue = reward.value;

      switch (reward.type) {
        case 'score':
          finalValue = Math.max(1, Math.floor(reward.value * globalMultiplier.scoreMultiplier));
          SaveManager.addScore(finalValue);
          break;
        case 'fragment':
          finalValue = Math.max(0, Math.floor(reward.value * globalMultiplier.fragmentMultiplier));
          if (finalValue > 0) {
            SaveManager.addFragments(reward.id, finalValue);
          }
          break;
        case 'material':
          SaveManager.addMaterials(reward.id, reward.value);
          break;
      }

      finalRewards.push({ ...reward, value: finalValue });
    }

    quest.status = 'claimed';
    quest.claimedAt = Date.now();
    this.data.totalClaimed++;

    if (!this.data.claimedQuestIds.includes(questId)) {
      this.data.claimedQuestIds.push(questId);
    }

    SaveManager.save();
    return {
      success: true,
      rewards: quest.rewards,
      finalRewards,
      quest,
      conservationApplied,
      conservationMultiplier: { score: globalMultiplier.scoreMultiplier, fragment: globalMultiplier.fragmentMultiplier }
    };
  }

  static claimAllQuests(): { success: boolean; totalRewards: DailyQuestReward[]; claimedQuests: DailyQuest[]; conservationApplied: boolean; conservationMultiplier: { score: number; fragment: number } } {
    const claimableQuests = this.getQuestsByStatus('completed');
    const totalRewards: DailyQuestReward[] = [];
    const claimedQuests: DailyQuest[] = [];
    let globalConservationApplied = false;
    let globalConservationMultiplier = { score: 1, fragment: 1 };

    for (const quest of claimableQuests) {
      const result = this.claimQuest(quest.id);
      if (result.success && result.quest) {
        claimedQuests.push(result.quest);
        if (result.conservationApplied) {
          globalConservationApplied = true;
          globalConservationMultiplier = result.conservationMultiplier;
        }
        for (const reward of result.finalRewards) {
          const existing = totalRewards.find(
            r => r.type === reward.type && r.id === reward.id
          );
          if (existing) {
            existing.value += reward.value;
          } else {
            totalRewards.push({ ...reward });
          }
        }
      }
    }

    SaveManager.save();
    return {
      success: claimedQuests.length > 0,
      totalRewards,
      claimedQuests,
      conservationApplied: globalConservationApplied,
      conservationMultiplier: globalConservationMultiplier
    };
  }

  static getDailyStats(): {
    totalQuests: number;
    completedQuests: number;
    claimedQuests: number;
    pendingQuests: number;
    totalCompleted: number;
    refreshCount: number;
    consecutiveWins: number;
    todayPlayedCount: number;
  } {
    const quests = this.getAllQuests();
    return {
      totalQuests: quests.length,
      completedQuests: quests.filter(q => q.status === 'completed').length,
      claimedQuests: quests.filter(q => q.status === 'claimed').length,
      pendingQuests: quests.filter(q => q.status === 'pending').length,
      totalCompleted: this.data.totalCompleted,
      refreshCount: this.data.refreshCount,
      consecutiveWins: this.data.progress.consecutiveWins || 0,
      todayPlayedCount: this.data.progress.todayPlayedLevels.length
    };
  }

  static getConsecutiveWins(): number {
    return this.data.progress.consecutiveWins || 0;
  }

  static getDailyProgress(): DailyQuestProgress {
    return { ...this.data.progress };
  }

  static createDefaultDailyQuestSave(): DailyQuestSaveData {
    return {
      quests: {},
      lastRefreshDate: '',
      refreshCount: 0,
      totalCompleted: 0,
      totalClaimed: 0,
      progress: {
        consecutiveWins: 0,
        todayPlayedLevels: [],
        todayBestScores: {},
        todayBestTimes: {},
        restoredToday: []
      },
      claimedQuestIds: []
    };
  }

  static getQuestProgressText(quest: DailyQuest): string {
    switch (quest.type) {
      case 'restore_plant':
        return `已修复: ${quest.currentProgress}/${quest.targetProgress}`;
      case 'timed_score':
        return `最高得分: ${quest.currentProgress}/${quest.targetProgress}`;
      case 'win_streak':
        return `连胜: ${quest.currentProgress}/${quest.targetProgress}`;
      case 'care_specimen':
        return `已养护: ${quest.currentProgress}/${quest.targetProgress}`;
      default:
        return `${quest.currentProgress}/${quest.targetProgress}`;
    }
  }
}
