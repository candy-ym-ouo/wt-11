import { SaveData, LevelProgress, ChapterProgress, Reward } from '../types/GameTypes';
import { Levels } from '../data/Levels';
import { Chapters, getChapterById, getChapterByLevelId, getNextChapter, getRewardsByChapterId } from '../data/Chapters';

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

    Object.keys(oldData.progress || {}).forEach(levelId => {
      const progress = oldData.progress[levelId];
      if (progress?.completed && !oldData.galleryUnlocked.includes(Number(levelId))) {
        oldData.galleryUnlocked.push(Number(levelId));
      }
    });

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

    return {
      progress,
      chapterProgress,
      badges,
      totalScore: 0,
      unlockedLevels: [1],
      unlockedChapters: [1],
      galleryUnlocked: []
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

    if (isFirstCompletion && !this.data.galleryUnlocked.includes(levelId)) {
      this.data.galleryUnlocked.push(levelId);
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

  private static save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  static reset(): void {
    this.data = this.createDefaultSave();
    this.save();
  }
}
