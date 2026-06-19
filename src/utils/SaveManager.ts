import {
  SaveData,
  LevelProgress,
  ChapterProgress,
  Reward,
  WorkshopProgress,
  EventProgress,
  EventLevelProgress,
  EventSaveData,
  EventRankingData,
  RankingEntry,
  EventReward
} from '../types/GameTypes';
import { Levels } from '../data/Levels';
import { Chapters, getChapterById, getChapterByLevelId, getNextChapter, getRewardsByChapterId } from '../data/Chapters';
import { WorkshopRecipes, getRecipeBySpecimenId } from '../data/WorkshopConfig';
import { Events, getActiveEvent, getEventById } from '../data/Events';
import { EventLevelRules, getEventLevelRulesByEventId } from '../data/EventLevelRules';

const STORAGE_KEY = 'plant_specimen_puzzle_save';

export class SaveManager {
  private static data: SaveData;

  static init(): void {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.data = this.migrateSaveData(parsed);
      } catch {
        this.data = this.createDefaultSave();
      }
    } else {
      this.data = this.createDefaultSave();
    }

    this.recalculateTotalScore();
    this.updateChapterProgress();
    this.syncChapterUnlocks();
    this.save();
  }

  private static migrateSaveData(oldData: any): SaveData {
    const defaultData = this.createDefaultSave();

    if (!oldData.chapterProgress) {
      oldData.chapterProgress = defaultData.chapterProgress;
    }
    if (!oldData.badges) {
      oldData.badges = defaultData.badges;
    }
    if (!oldData.unlockedChapters) {
      oldData.unlockedChapters = [1];
    }
    if (!oldData.galleryUnlocked) {
      oldData.galleryUnlocked = [];
    }
    if (!oldData.workshop) {
      oldData.workshop = defaultData.workshop;
    }
    if (!oldData.event) {
      oldData.event = defaultData.event;
    } else {
      if (!oldData.event.eventProgress) {
        oldData.event.eventProgress = defaultData.event.eventProgress;
      }
      if (!oldData.event.eventBadges) {
        oldData.event.eventBadges = defaultData.event.eventBadges;
      }
      if (!oldData.event.eventGalleryUnlocked) {
        oldData.event.eventGalleryUnlocked = defaultData.event.eventGalleryUnlocked;
      }
      if (!oldData.event.rankingCache) {
        oldData.event.rankingCache = defaultData.event.rankingCache;
      }
    }

    if (oldData.workshop?.restoredSpecimens) {
      oldData.workshop.restoredSpecimens.forEach((specimenId: number) => {
        if (!oldData.galleryUnlocked.includes(specimenId)) {
          oldData.galleryUnlocked.push(specimenId);
        }
      });
    }

    return oldData as SaveData;
  }

  private static createDefaultSave(): SaveData {
    const progress: Record<number, LevelProgress> = {};
    Levels.forEach((level, index) => {
      progress[level.id] = {
        levelId: level.id,
        unlocked: index === 0,
        bestScore: 0,
        bestTime: 0,
        stars: 0,
        completed: false
      };
    });

    const chapterProgress: Record<number, ChapterProgress> = {};
    Chapters.forEach((chapter, index) => {
      chapterProgress[chapter.id] = {
        chapterId: chapter.id,
        unlocked: index === 0,
        completed: false,
        totalStars: 0,
        rewardsClaimed: false
      };
    });

    const badges: Record<number, boolean> = {};
    [201, 202, 203].forEach(id => {
      badges[id] = false;
    });

    const eventSaveData = this.createDefaultEventSave();

    return {
      progress,
      chapterProgress,
      badges,
      totalScore: 0,
      unlockedLevels: [1],
      unlockedChapters: [1],
      galleryUnlocked: [],
      workshop: {
        fragments: {},
        materials: {},
        restoredSpecimens: []
      },
      event: eventSaveData
    };
  }

  private static createDefaultEventSave(): EventSaveData {
    const activeEvent = getActiveEvent();
    const eventProgress: Record<string, EventProgress> = {};

    Object.values(Events).forEach(event => {
      const levelProgress: Record<number, EventLevelProgress> = {};
      const eventLevels = getEventLevelRulesByEventId(event.id);
      eventLevels.forEach((rule, index) => {
        levelProgress[rule.id] = {
          eventLevelId: rule.id,
          unlocked: index === 0,
          bestScore: 0,
          bestTime: 0,
          stars: 0,
          completed: false,
          attempts: 0
        };
      });

      const rewardsClaimed: Record<number, boolean> = {};
      event.rewards.forEach(reward => {
        rewardsClaimed[reward.id] = false;
      });

      eventProgress[event.id] = {
        eventId: event.id,
        participated: false,
        totalScore: 0,
        currentRank: 0,
        levelProgress,
        rewardsClaimed,
        unlockedEventGallery: []
      };
    });

    const eventBadges: Record<number, boolean> = {};
    Object.values(Events).forEach(event => {
      event.rewards
        .filter(r => r.type === 'badge')
        .forEach(r => {
          eventBadges[r.id] = false;
        });
    });

    return {
      activeEventId: activeEvent?.id || null,
      eventProgress,
      eventBadges,
      eventGalleryUnlocked: [],
      rankingCache: {}
    };
  }

  static getProgress(levelId: number): LevelProgress | undefined {
    return this.data.progress[levelId];
  }

  static getAllProgress(): Record<number, LevelProgress> {
    return { ...this.data.progress };
  }

  static isLevelUnlocked(levelId: number): boolean {
    return this.data.progress[levelId]?.unlocked ?? false;
  }

  static getChapterProgress(chapterId: number): ChapterProgress | undefined {
    return this.data.chapterProgress[chapterId];
  }

  static getAllChapterProgress(): Record<number, ChapterProgress> {
    return { ...this.data.chapterProgress };
  }

  static isChapterUnlocked(chapterId: number): boolean {
    return this.data.chapterProgress[chapterId]?.unlocked ?? false;
  }

  static isChapterCompleted(chapterId: number): boolean {
    return this.data.chapterProgress[chapterId]?.completed ?? false;
  }

  static getTotalStars(): number {
    return Object.values(this.data.progress).reduce((sum, p) => sum + p.stars, 0);
  }

  static getChapterStars(chapterId: number): number {
    const chapter = getChapterById(chapterId);
    if (!chapter) return 0;
    return chapter.levelIds.reduce((sum, levelId) => {
      return sum + (this.data.progress[levelId]?.stars || 0);
    }, 0);
  }

  static getTotalScore(): number {
    return this.data.totalScore;
  }

  static getUnlockedLevels(): number[] {
    return [...this.data.unlockedLevels];
  }

  static getUnlockedChapters(): number[] {
    return [...this.data.unlockedChapters];
  }

  static isGalleryUnlocked(specimenId: number): boolean {
    return this.data.galleryUnlocked.includes(specimenId);
  }

  static getUnlockedGalleryItems(): number[] {
    return [...this.data.galleryUnlocked];
  }

  static hasBadge(badgeId: number): boolean {
    return this.data.badges[badgeId] ?? false;
  }

  static completeLevel(levelId: number, score: number, time: number, stars: number): { chapterCompleted: boolean; completedChapterId: number | null; newlyUnlockedChapterId: number | null } {
    const progress = this.data.progress[levelId];
    if (!progress) return { chapterCompleted: false, completedChapterId: null, newlyUnlockedChapterId: null };

    const isFirstCompletion = !progress.completed;
    const starsImproved = stars > progress.stars;

    progress.completed = true;
    if (score > progress.bestScore) {
      progress.bestScore = score;
    }
    if (progress.bestTime === 0 || time < progress.bestTime) {
      progress.bestTime = time;
    }
    if (starsImproved) {
      progress.stars = stars;
    }

    const nextLevelId = levelId + 1;
    if (this.data.progress[nextLevelId]) {
      this.data.progress[nextLevelId].unlocked = true;
      if (!this.data.unlockedLevels.includes(nextLevelId)) {
        this.data.unlockedLevels.push(nextLevelId);
      }
    }

    this.recalculateTotalScore();
    this.updateChapterProgress();

    const completionResult = this.checkChapterCompletion(levelId);
    const unlockResult = this.syncChapterUnlocks();

    this.save();
    return {
      chapterCompleted: completionResult.chapterCompleted,
      completedChapterId: completionResult.completedChapterId,
      newlyUnlockedChapterId: unlockResult
    };
  }

  private static recalculateTotalScore(): void {
    this.data.totalScore = Object.values(this.data.progress).reduce(
      (sum, p) => sum + p.bestScore,
      0
    );
  }

  private static updateChapterProgress(): void {
    Chapters.forEach(chapter => {
      const chapterProgress = this.data.chapterProgress[chapter.id];
      if (chapterProgress) {
        chapterProgress.totalStars = this.getChapterStars(chapter.id);
      }
    });
  }

  private static checkChapterCompletion(levelId: number): { chapterCompleted: boolean; completedChapterId: number | null } {
    const chapter = getChapterByLevelId(levelId);
    if (!chapter) return { chapterCompleted: false, completedChapterId: null };

    const chapterProgress = this.data.chapterProgress[chapter.id];
    if (!chapterProgress || chapterProgress.completed) {
      return { chapterCompleted: false, completedChapterId: null };
    }

    const allLevelsCompleted = chapter.levelIds.every(id => {
      return this.data.progress[id]?.completed ?? false;
    });

    if (allLevelsCompleted) {
      chapterProgress.completed = true;
      chapterProgress.completedAt = Date.now();
      return { chapterCompleted: true, completedChapterId: chapter.id };
    }

    return { chapterCompleted: false, completedChapterId: null };
  }

  private static syncChapterUnlocks(): number | null {
    const totalStars = this.getTotalStars();
    let newlyUnlocked: number | null = null;

    for (const chapter of Chapters) {
      const chapterProgress = this.data.chapterProgress[chapter.id];
      if (!chapterProgress) continue;
      if (chapterProgress.unlocked) continue;

      const prevChapter = Chapters.find(c => c.id === chapter.id - 1);
      const prevCompleted = prevChapter ? this.data.chapterProgress[prevChapter.id]?.completed ?? false : true;

      if (prevCompleted && totalStars >= chapter.requiredStars) {
        chapterProgress.unlocked = true;
        if (!this.data.unlockedChapters.includes(chapter.id)) {
          this.data.unlockedChapters.push(chapter.id);
        }

        const firstLevelId = chapter.levelIds[0];
        if (this.data.progress[firstLevelId]) {
          this.data.progress[firstLevelId].unlocked = true;
          if (!this.data.unlockedLevels.includes(firstLevelId)) {
            this.data.unlockedLevels.push(firstLevelId);
          }
        }

        if (newlyUnlocked === null) {
          newlyUnlocked = chapter.id;
        }
      }
    }

    return newlyUnlocked;
  }

  static claimChapterRewards(chapterId: number): Reward[] {
    const chapterProgress = this.data.chapterProgress[chapterId];
    if (!chapterProgress || !chapterProgress.completed || chapterProgress.rewardsClaimed) {
      return [];
    }

    const rewards = getRewardsByChapterId(chapterId);

    rewards.forEach(reward => {
      if (reward.type === 'score' && reward.value) {
        this.data.totalScore += reward.value;
      } else if (reward.type === 'badge') {
        this.data.badges[reward.id] = true;
      }
    });

    chapterProgress.rewardsClaimed = true;
    this.save();

    return rewards;
  }

  static canClaimRewards(chapterId: number): boolean {
    const chapterProgress = this.data.chapterProgress[chapterId];
    return chapterProgress?.completed === true && chapterProgress.rewardsClaimed === false;
  }

  static getFragmentCount(fragmentId: number): number {
    return this.data.workshop.fragments[fragmentId] || 0;
  }

  static getAllFragments(): Record<number, number> {
    return { ...this.data.workshop.fragments };
  }

  static addFragments(fragmentId: number, count: number): void {
    if (!this.data.workshop.fragments[fragmentId]) {
      this.data.workshop.fragments[fragmentId] = 0;
    }
    this.data.workshop.fragments[fragmentId] += count;
    this.save();
  }

  static removeFragments(fragmentId: number, count: number): boolean {
    const current = this.data.workshop.fragments[fragmentId] || 0;
    if (current < count) return false;
    this.data.workshop.fragments[fragmentId] = current - count;
    if (this.data.workshop.fragments[fragmentId] <= 0) {
      delete this.data.workshop.fragments[fragmentId];
    }
    this.save();
    return true;
  }

  static getMaterialCount(materialId: number): number {
    return this.data.workshop.materials[materialId] || 0;
  }

  static getAllMaterials(): Record<number, number> {
    return { ...this.data.workshop.materials };
  }

  static addMaterials(materialId: number, count: number): void {
    if (!this.data.workshop.materials[materialId]) {
      this.data.workshop.materials[materialId] = 0;
    }
    this.data.workshop.materials[materialId] += count;
    this.save();
  }

  static removeMaterials(materialId: number, count: number): boolean {
    const current = this.data.workshop.materials[materialId] || 0;
    if (current < count) return false;
    this.data.workshop.materials[materialId] = current - count;
    if (this.data.workshop.materials[materialId] <= 0) {
      delete this.data.workshop.materials[materialId];
    }
    this.save();
    return true;
  }

  static isSpecimenRestored(specimenId: number): boolean {
    return this.data.workshop.restoredSpecimens.includes(specimenId);
  }

  static getRestoredSpecimens(): number[] {
    return [...this.data.workshop.restoredSpecimens];
  }

  static canRestoreSpecimen(specimenId: number): boolean {
    if (this.isSpecimenRestored(specimenId)) return false;
    const recipe = getRecipeBySpecimenId(specimenId);
    if (!recipe) return false;

    for (const req of recipe.requiredFragments) {
      if (this.getFragmentCount(req.fragmentId) < req.count) return false;
    }
    for (const req of recipe.requiredMaterials) {
      if (this.getMaterialCount(req.materialId) < req.count) return false;
    }
    return true;
  }

  static restoreSpecimen(specimenId: number): boolean {
    if (!this.canRestoreSpecimen(specimenId)) return false;

    const recipe = getRecipeBySpecimenId(specimenId)!;

    for (const req of recipe.requiredFragments) {
      this.removeFragments(req.fragmentId, req.count);
    }
    for (const req of recipe.requiredMaterials) {
      this.removeMaterials(req.materialId, req.count);
    }

    this.data.workshop.restoredSpecimens.push(specimenId);

    if (!this.data.galleryUnlocked.includes(specimenId)) {
      this.data.galleryUnlocked.push(specimenId);
    }

    this.save();
    return true;
  }

  static addWorkshopDrops(drops: { fragments: { id: number; count: number }[]; materials: { id: number; count: number }[] }): void {
    drops.fragments.forEach(f => this.addFragments(f.id, f.count));
    drops.materials.forEach(m => this.addMaterials(m.id, m.count));
  }

  static getActiveEventId(): string | null {
    return this.data.event.activeEventId;
  }

  static getEventProgress(eventId: string): EventProgress | undefined {
    return this.data.event.eventProgress[eventId];
  }

  static getAllEventProgress(): Record<string, EventProgress> {
    return { ...this.data.event.eventProgress };
  }

  static getEventLevelProgress(eventId: string, levelId: number): EventLevelProgress | undefined {
    return this.data.event.eventProgress[eventId]?.levelProgress[levelId];
  }

  static getEventTotalScore(eventId: string): number {
    return this.data.event.eventProgress[eventId]?.totalScore ?? 0;
  }

  static isEventLevelUnlocked(eventId: string, levelId: number): boolean {
    return this.data.event.eventProgress[eventId]?.levelProgress[levelId]?.unlocked ?? false;
  }

  static hasEventParticipated(eventId: string): boolean {
    return this.data.event.eventProgress[eventId]?.participated ?? false;
  }

  static isEventGalleryUnlocked(specimenId: number): boolean {
    return this.data.event.eventGalleryUnlocked.includes(specimenId);
  }

  static getUnlockedEventGalleryItems(): number[] {
    return [...this.data.event.eventGalleryUnlocked];
  }

  static hasEventBadge(badgeId: number): boolean {
    return this.data.event.eventBadges[badgeId] ?? false;
  }

  static completeEventLevel(
    eventId: string,
    levelId: number,
    score: number,
    time: number,
    stars: number
  ): { newlyUnlockedLevelId: number | null; updatedTotalScore: number } {
    const eventProg = this.data.event.eventProgress[eventId];
    if (!eventProg) return { newlyUnlockedLevelId: null, updatedTotalScore: 0 };

    const levelProg = eventProg.levelProgress[levelId];
    if (!levelProg) return { newlyUnlockedLevelId: null, updatedTotalScore: 0 };

    const scoreImproved = score > levelProg.bestScore;
    const starsImproved = stars > levelProg.stars;

    if (scoreImproved) {
      const diff = score - levelProg.bestScore;
      eventProg.totalScore += diff;
      levelProg.bestScore = score;
    }

    if (levelProg.bestTime === 0 || time < levelProg.bestTime) {
      levelProg.bestTime = time;
    }

    if (starsImproved) {
      levelProg.stars = stars;
    }

    levelProg.completed = true;
    levelProg.attempts += 1;
    levelProg.lastPlayedAt = Date.now();

    if (!eventProg.participated) {
      eventProg.participated = true;
      eventProg.joinedAt = Date.now();
    }
    eventProg.lastActiveAt = Date.now();

    let newlyUnlockedLevelId: number | null = null;
    const eventLevels = getEventLevelRulesByEventId(eventId);
    const currentIndex = eventLevels.findIndex(r => r.id === levelId);
    if (currentIndex >= 0 && currentIndex < eventLevels.length - 1) {
      const nextLevelId = eventLevels[currentIndex + 1].id;
      const nextProg = eventProg.levelProgress[nextLevelId];
      if (nextProg && !nextProg.unlocked) {
        nextProg.unlocked = true;
        newlyUnlockedLevelId = nextLevelId;
      }
    }

    this.save();
    return { newlyUnlockedLevelId, updatedTotalScore: eventProg.totalScore };
  }

  static canClaimEventReward(eventId: string, rewardId: number): boolean {
    const eventProg = this.data.event.eventProgress[eventId];
    const event = getEventById(eventId);
    if (!eventProg || !event) return false;

    const reward = event.rewards.find(r => r.id === rewardId);
    if (!reward) return false;
    if (eventProg.rewardsClaimed[rewardId]) return false;

    return eventProg.totalScore >= reward.threshold;
  }

  static claimEventReward(eventId: string, rewardId: number): EventReward | null {
    if (!this.canClaimEventReward(eventId, rewardId)) return null;

    const eventProg = this.data.event.eventProgress[eventId];
    const event = getEventById(eventId);
    if (!eventProg || !event) return null;

    const reward = event.rewards.find(r => r.id === rewardId)!;
    eventProg.rewardsClaimed[rewardId] = true;

    switch (reward.type) {
      case 'score':
        if (reward.value) {
          this.data.totalScore += reward.value;
        }
        break;
      case 'badge':
        this.data.event.eventBadges[reward.id] = true;
        this.data.badges[reward.id] = true;
        break;
      case 'specimen':
        if (reward.specimenId) {
          if (!this.data.event.eventGalleryUnlocked.includes(reward.specimenId)) {
            this.data.event.eventGalleryUnlocked.push(reward.specimenId);
          }
          if (!this.data.galleryUnlocked.includes(reward.specimenId)) {
            this.data.galleryUnlocked.push(reward.specimenId);
          }
        } else {
          const eventLevels = getEventLevelRulesByEventId(eventId);
          eventLevels.forEach(rule => {
            if (!this.data.event.eventGalleryUnlocked.includes(rule.specimenId)) {
              this.data.event.eventGalleryUnlocked.push(rule.specimenId);
            }
            if (!this.data.galleryUnlocked.includes(rule.specimenId)) {
              this.data.galleryUnlocked.push(rule.specimenId);
            }
          });
        }
        break;
      case 'fragment':
        if (reward.specimenId && reward.value) {
          this.addFragments(reward.specimenId, reward.value);
        }
        break;
      case 'material':
        if (reward.value) {
          this.data.totalScore += reward.value;
        }
        break;
    }

    this.save();
    return reward;
  }

  static getRankingCache(eventId: string): EventRankingData | undefined {
    return this.data.event.rankingCache[eventId];
  }

  static setRankingCache(eventId: string, data: EventRankingData): void {
    this.data.event.rankingCache[eventId] = data;
    this.save();
  }

  static getClaimableEventRewards(eventId: string): EventReward[] {
    const event = getEventById(eventId);
    if (!event) return [];
    return event.rewards.filter(r => this.canClaimEventReward(eventId, r.id));
  }

  static getCompletedEventLevelsCount(eventId: string): number {
    const eventProg = this.data.event.eventProgress[eventId];
    if (!eventProg) return 0;
    return Object.values(eventProg.levelProgress).filter(p => p.completed).length;
  }

  static getEventTotalStars(eventId: string): number {
    const eventProg = this.data.event.eventProgress[eventId];
    if (!eventProg) return 0;
    return Object.values(eventProg.levelProgress).reduce((sum, p) => sum + p.stars, 0);
  }

  private static save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  static reset(): void {
    this.data = this.createDefaultSave();
    this.save();
  }
}
