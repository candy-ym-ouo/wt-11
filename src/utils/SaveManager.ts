import { SaveData, LevelProgress } from '../types/GameTypes';
import { Levels } from '../data/Levels';

const STORAGE_KEY = 'plant_specimen_puzzle_save';

export class SaveManager {
  private static data: SaveData;

  static init(): void {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        this.data = JSON.parse(saved);
      } catch {
        this.data = this.createDefaultSave();
      }
    } else {
      this.data = this.createDefaultSave();
    }
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

    return {
      progress,
      totalScore: 0,
      unlockedLevels: [1]
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

  static completeLevel(levelId: number, score: number, time: number, stars: number): void {
    const progress = this.data.progress[levelId];
    if (!progress) return;

    progress.completed = true;
    if (score > progress.bestScore) {
      progress.bestScore = score;
    }
    if (progress.bestTime === 0 || time < progress.bestTime) {
      progress.bestTime = time;
    }
    if (stars > progress.stars) {
      progress.stars = stars;
    }

    this.data.totalScore = Object.values(this.data.progress).reduce(
      (sum, p) => sum + p.bestScore,
      0
    );

    const nextLevelId = levelId + 1;
    if (this.data.progress[nextLevelId]) {
      this.data.progress[nextLevelId].unlocked = true;
      if (!this.data.unlockedLevels.includes(nextLevelId)) {
        this.data.unlockedLevels.push(nextLevelId);
      }
    }

    this.save();
  }

  static getTotalScore(): number {
    return this.data.totalScore;
  }

  static getUnlockedLevels(): number[] {
    return [...this.data.unlockedLevels];
  }

  private static save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  static reset(): void {
    this.data = this.createDefaultSave();
    this.save();
  }
}
