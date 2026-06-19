import {
  Achievement,
  Title,
  AchievementSaveData,
  AchievementUnlockResult,
  AchievementCategory
} from '../types/GameTypes';
import {
  Achievements,
  Titles,
  getAchievementById,
  getTitleById,
  getAchievementsByCategory
} from '../data/Achievements';
import { Levels } from '../data/Levels';
import { AllGalleryItems, EventGalleryItems } from '../data/Levels';
import { Chapters } from '../data/Chapters';
import { KnowledgeEntries } from '../data/ResearchLabConfig';

export class AchievementManager {
  private static saveData: AchievementSaveData;
  private static initialized = false;

  static init(saveData: AchievementSaveData): void {
    this.saveData = saveData;
    this.initialized = true;
    this.checkDailyLogin();
  }

  static getSaveData(): AchievementSaveData {
    return { ...this.saveData };
  }

  static setSaveData(data: AchievementSaveData): void {
    this.saveData = data;
  }

  private static checkDailyLogin(): void {
    const today = new Date().toDateString();
    const lastLogin = this.saveData.lastLoginDate;

    if (lastLogin !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastLogin === yesterday.toDateString()) {
        this.saveData.loginStreak += 1;
      } else if (lastLogin !== today) {
        this.saveData.loginStreak = 1;
      }

      this.saveData.lastLoginDate = today;
      this.saveData.totalLogins += 1;

      this.checkLoginAchievements();
    }
  }

  static isAchievementUnlocked(achievementId: number): boolean {
    return this.saveData.unlockedAchievements[achievementId] ?? false;
  }

  static isTitleUnlocked(titleId: number): boolean {
    return this.saveData.unlockedTitles[titleId] ?? false;
  }

  static getCurrentTitleId(): number | null {
    return this.saveData.currentTitleId;
  }

  static setCurrentTitle(titleId: number | null): boolean {
    if (titleId === null) {
      this.saveData.currentTitleId = null;
      return true;
    }
    if (this.isTitleUnlocked(titleId)) {
      this.saveData.currentTitleId = titleId;
      return true;
    }
    return false;
  }

  static getUnlockedAchievements(): Achievement[] {
    return Achievements.filter(a => this.isAchievementUnlocked(a.id));
  }

  static getUnlockedTitles(): Title[] {
    return Titles.filter(t => this.isTitleUnlocked(t.id));
  }

  static getAchievementProgress(achievementId: number): number {
    return this.saveData.achievementProgress[achievementId] ?? 0;
  }

  static getTotalAchievementScore(): number {
    return this.saveData.totalAchievementScore;
  }

  static getLoginStreak(): number {
    return this.saveData.loginStreak;
  }

  static getTotalLogins(): number {
    return this.saveData.totalLogins;
  }

  static onLevelComplete(
    levelId: number,
    score: number,
    time: number,
    stars: number,
    completedLevelsCount: number,
    totalStars: number,
    unlockedSpecimens: number[],
    allProgress: Record<number, any>
  ): AchievementUnlockResult {
    const newlyUnlocked: Achievement[] = [];
    let scoreGained = 0;

    const level = Levels.find(l => l.id === levelId);
    const difficulty = level?.rule.difficulty;

    const checkAndUnlock = (achievement: Achievement): boolean => {
      if (this.isAchievementUnlocked(achievement.id)) return false;

      let unlocked = false;
      const cond = achievement.condition;

      switch (cond.type) {
        case 'complete_levels':
          unlocked = completedLevelsCount >= cond.target;
          break;
        case 'complete_all_levels':
          const mainLevels = Levels.filter(l => !AllGalleryItems.find(g => g.id === l.id)?.isEventExclusive);
          const allCompleted = mainLevels.every(l => allProgress[l.id]?.completed);
          unlocked = allCompleted;
          break;
        case 'perfect_level':
          unlocked = stars === 3;
          break;
        case 'total_stars':
          unlocked = totalStars >= cond.target;
          break;
        case 'complete_chapter':
          if (cond.chapterId) {
            const chapter = Chapters.find(c => c.id === cond.chapterId);
            if (chapter) {
              const chapterComplete = chapter.levelIds.every(id => allProgress[id]?.completed);
              unlocked = chapterComplete;
            }
          }
          break;
        case 'speed_complete':
          unlocked = time <= cond.target;
          break;
        case 'speed_difficulty':
          if (difficulty === cond.difficulty) {
            unlocked = time <= cond.target;
          }
          break;
        case 'all_levels_speed':
          const allFast = Levels.every(l => {
            const p = allProgress[l.id];
            return p?.bestTime > 0 && p.bestTime <= cond.target;
          });
          unlocked = allFast;
          break;
        case 'unlock_specimens':
          unlocked = unlockedSpecimens.length >= cond.target;
          break;
        case 'unlock_all_specimens':
          const allSpecimens = AllGalleryItems.length;
          unlocked = unlockedSpecimens.length >= allSpecimens;
          break;
        default:
          break;
      }

      if (unlocked) {
        this.unlockAchievement(achievement.id);
        newlyUnlocked.push({ ...achievement, unlocked: true, unlockedAt: Date.now() });
        if (achievement.rewardScore) {
          scoreGained += achievement.rewardScore;
        }
        return true;
      }
      return false;
    };

    const relevantAchievements = [
      ...getAchievementsByCategory('level'),
      ...getAchievementsByCategory('speed'),
      ...getAchievementsByCategory('gallery')
    ];

    relevantAchievements.forEach(achievement => {
      checkAndUnlock(achievement);
    });

    this.checkMultiCategoryAchievement(newlyUnlocked);

    const newlyUnlockedTitles = this.checkTitles();

    return {
      newlyUnlocked,
      newlyUnlockedTitles,
      scoreGained
    };
  }

  static onSpecimenRestored(restoredCount: number): AchievementUnlockResult {
    const newlyUnlocked: Achievement[] = [];
    let scoreGained = 0;

    const collectionAchievements = getAchievementsByCategory('collection');

    collectionAchievements.forEach(achievement => {
      if (this.isAchievementUnlocked(achievement.id)) return;

      const cond = achievement.condition;
      let unlocked = false;

      switch (cond.type) {
        case 'restore_specimens':
          unlocked = restoredCount >= cond.target;
          break;
        default:
          break;
      }

      if (unlocked) {
        this.unlockAchievement(achievement.id);
        newlyUnlocked.push({ ...achievement, unlocked: true, unlockedAt: Date.now() });
        if (achievement.rewardScore) {
          scoreGained += achievement.rewardScore;
        }
      }
    });

    this.checkMultiCategoryAchievement(newlyUnlocked);
    const newlyUnlockedTitles = this.checkTitles();

    return { newlyUnlocked, newlyUnlockedTitles, scoreGained };
  }

  static onKnowledgeUnlocked(knowledgeCount: number): AchievementUnlockResult {
    const newlyUnlocked: Achievement[] = [];
    let scoreGained = 0;

    const collectionAchievements = getAchievementsByCategory('collection');

    collectionAchievements.forEach(achievement => {
      if (this.isAchievementUnlocked(achievement.id)) return;

      const cond = achievement.condition;
      let unlocked = false;

      switch (cond.type) {
        case 'unlock_knowledge':
          unlocked = knowledgeCount >= cond.target;
          break;
        case 'unlock_all_knowledge':
          unlocked = knowledgeCount >= KnowledgeEntries.length;
          break;
        default:
          break;
      }

      if (unlocked) {
        this.unlockAchievement(achievement.id);
        newlyUnlocked.push({ ...achievement, unlocked: true, unlockedAt: Date.now() });
        if (achievement.rewardScore) {
          scoreGained += achievement.rewardScore;
        }
      }
    });

    this.checkMultiCategoryAchievement(newlyUnlocked);
    const newlyUnlockedTitles = this.checkTitles();

    return { newlyUnlocked, newlyUnlockedTitles, scoreGained };
  }

  static onResearcherLevelUp(level: number): AchievementUnlockResult {
    const newlyUnlocked: Achievement[] = [];
    let scoreGained = 0;

    const collectionAchievements = getAchievementsByCategory('collection');

    collectionAchievements.forEach(achievement => {
      if (this.isAchievementUnlocked(achievement.id)) return;

      const cond = achievement.condition;
      let unlocked = false;

      switch (cond.type) {
        case 'researcher_level':
          unlocked = level >= cond.target;
          break;
        default:
          break;
      }

      if (unlocked) {
        this.unlockAchievement(achievement.id);
        newlyUnlocked.push({ ...achievement, unlocked: true, unlockedAt: Date.now() });
        if (achievement.rewardScore) {
          scoreGained += achievement.rewardScore;
        }
      }
    });

    this.checkMultiCategoryAchievement(newlyUnlocked);
    const newlyUnlockedTitles = this.checkTitles();

    return { newlyUnlocked, newlyUnlockedTitles, scoreGained };
  }

  static onTowerFloor(floor: number): AchievementUnlockResult {
    const newlyUnlocked: Achievement[] = [];
    let scoreGained = 0;

    const specialAchievements = getAchievementsByCategory('special');

    specialAchievements.forEach(achievement => {
      if (this.isAchievementUnlocked(achievement.id)) return;

      const cond = achievement.condition;
      let unlocked = false;

      switch (cond.type) {
        case 'tower_floor':
          unlocked = floor >= cond.target;
          break;
        default:
          break;
      }

      if (unlocked) {
        this.unlockAchievement(achievement.id);
        newlyUnlocked.push({ ...achievement, unlocked: true, unlockedAt: Date.now() });
        if (achievement.rewardScore) {
          scoreGained += achievement.rewardScore;
        }
      }
    });

    this.checkMultiCategoryAchievement(newlyUnlocked);
    const newlyUnlockedTitles = this.checkTitles();

    return { newlyUnlocked, newlyUnlockedTitles, scoreGained };
  }

  static onEventParticipation(): AchievementUnlockResult {
    const newlyUnlocked: Achievement[] = [];
    let scoreGained = 0;

    const specialAchievements = getAchievementsByCategory('special');

    specialAchievements.forEach(achievement => {
      if (this.isAchievementUnlocked(achievement.id)) return;

      const cond = achievement.condition;
      let unlocked = false;

      switch (cond.type) {
        case 'participate_event':
          unlocked = true;
          break;
        default:
          break;
      }

      if (unlocked) {
        this.unlockAchievement(achievement.id);
        newlyUnlocked.push({ ...achievement, unlocked: true, unlockedAt: Date.now() });
        if (achievement.rewardScore) {
          scoreGained += achievement.rewardScore;
        }
      }
    });

    this.checkMultiCategoryAchievement(newlyUnlocked);
    const newlyUnlockedTitles = this.checkTitles();

    return { newlyUnlocked, newlyUnlockedTitles, scoreGained };
  }

  static onExhibitionParticipation(): AchievementUnlockResult {
    const newlyUnlocked: Achievement[] = [];
    let scoreGained = 0;

    const specialAchievements = getAchievementsByCategory('special');

    specialAchievements.forEach(achievement => {
      if (this.isAchievementUnlocked(achievement.id)) return;

      const cond = achievement.condition;
      let unlocked = false;

      switch (cond.type) {
        case 'participate_exhibition':
          unlocked = true;
          break;
        default:
          break;
      }

      if (unlocked) {
        this.unlockAchievement(achievement.id);
        newlyUnlocked.push({ ...achievement, unlocked: true, unlockedAt: Date.now() });
        if (achievement.rewardScore) {
          scoreGained += achievement.rewardScore;
        }
      }
    });

    this.checkMultiCategoryAchievement(newlyUnlocked);
    const newlyUnlockedTitles = this.checkTitles();

    return { newlyUnlocked, newlyUnlockedTitles, scoreGained };
  }

  static onEventSpecimenUnlocked(eventSpecimenCount: number): AchievementUnlockResult {
    const newlyUnlocked: Achievement[] = [];
    let scoreGained = 0;

    const galleryAchievements = getAchievementsByCategory('gallery');

    galleryAchievements.forEach(achievement => {
      if (this.isAchievementUnlocked(achievement.id)) return;

      const cond = achievement.condition;
      let unlocked = false;

      switch (cond.type) {
        case 'unlock_event_specimens':
          unlocked = eventSpecimenCount >= cond.target;
          break;
        default:
          break;
      }

      if (unlocked) {
        this.unlockAchievement(achievement.id);
        newlyUnlocked.push({ ...achievement, unlocked: true, unlockedAt: Date.now() });
        if (achievement.rewardScore) {
          scoreGained += achievement.rewardScore;
        }
      }
    });

    this.checkMultiCategoryAchievement(newlyUnlocked);
    const newlyUnlockedTitles = this.checkTitles();

    return { newlyUnlocked, newlyUnlockedTitles, scoreGained };
  }

  static onTutorialComplete(): AchievementUnlockResult {
    const newlyUnlocked: Achievement[] = [];
    let scoreGained = 0;

    const specialAchievements = getAchievementsByCategory('special');

    specialAchievements.forEach(achievement => {
      if (this.isAchievementUnlocked(achievement.id)) return;

      const cond = achievement.condition;
      let unlocked = false;

      switch (cond.type) {
        case 'complete_tutorial':
          unlocked = true;
          break;
        default:
          break;
      }

      if (unlocked) {
        this.unlockAchievement(achievement.id);
        newlyUnlocked.push({ ...achievement, unlocked: true, unlockedAt: Date.now() });
        if (achievement.rewardScore) {
          scoreGained += achievement.rewardScore;
        }
      }
    });

    this.checkMultiCategoryAchievement(newlyUnlocked);
    const newlyUnlockedTitles = this.checkTitles();

    return { newlyUnlocked, newlyUnlockedTitles, scoreGained };
  }

  private static checkLoginAchievements(): AchievementUnlockResult {
    const newlyUnlocked: Achievement[] = [];
    let scoreGained = 0;

    const loginAchievements = getAchievementsByCategory('login');

    loginAchievements.forEach(achievement => {
      if (this.isAchievementUnlocked(achievement.id)) return;

      const cond = achievement.condition;
      let unlocked = false;

      switch (cond.type) {
        case 'login_days':
          unlocked = this.saveData.totalLogins >= cond.target;
          break;
        case 'login_streak':
          unlocked = this.saveData.loginStreak >= cond.target;
          break;
        case 'total_logins':
          unlocked = this.saveData.totalLogins >= cond.target;
          break;
        default:
          break;
      }

      if (unlocked) {
        this.unlockAchievement(achievement.id);
        newlyUnlocked.push({ ...achievement, unlocked: true, unlockedAt: Date.now() });
        if (achievement.rewardScore) {
          scoreGained += achievement.rewardScore;
        }
      }
    });

    this.checkMultiCategoryAchievement(newlyUnlocked);
    const newlyUnlockedTitles = this.checkTitles();

    return { newlyUnlocked, newlyUnlockedTitles, scoreGained };
  }

  private static checkMultiCategoryAchievement(newlyUnlocked: Achievement[]): void {
    const multiCatAchievement = Achievements.find(a => a.condition.type === 'multi_category');
    if (!multiCatAchievement || this.isAchievementUnlocked(multiCatAchievement.id)) return;

    const unlockedCategories = new Set<AchievementCategory>();
    Achievements.forEach(a => {
      if (this.isAchievementUnlocked(a.id) || newlyUnlocked.find(n => n.id === a.id)) {
        unlockedCategories.add(a.category);
      }
    });

    if (unlockedCategories.size >= multiCatAchievement.condition.target) {
      this.unlockAchievement(multiCatAchievement.id);
      newlyUnlocked.push({ ...multiCatAchievement, unlocked: true, unlockedAt: Date.now() });
      if (multiCatAchievement.rewardScore) {
        this.saveData.totalAchievementScore += multiCatAchievement.rewardScore;
      }
    }
  }

  private static checkTitles(): Title[] {
    const newlyUnlocked: Title[] = [];

    Titles.forEach(title => {
      if (this.isTitleUnlocked(title.id)) return;

      const allRequired = title.requiredAchievementIds.every(id => this.isAchievementUnlocked(id));

      if (allRequired) {
        this.saveData.unlockedTitles[title.id] = true;
        newlyUnlocked.push({ ...title, unlocked: true, unlockedAt: Date.now() });
      }
    });

    return newlyUnlocked;
  }

  private static unlockAchievement(achievementId: number): void {
    if (this.isAchievementUnlocked(achievementId)) return;

    this.saveData.unlockedAchievements[achievementId] = true;
    const achievement = getAchievementById(achievementId);

    if (achievement?.rewardScore) {
      this.saveData.totalAchievementScore += achievement.rewardScore;
    }
  }

  static getAllAchievementsWithProgress(): Achievement[] {
    return Achievements.map(a => ({
      ...a,
      unlocked: this.isAchievementUnlocked(a.id),
      progress: this.getAchievementProgress(a.id),
      totalProgress: a.condition.target
    }));
  }

  static getAllTitlesWithStatus(): Title[] {
    return Titles.map(t => ({
      ...t,
      unlocked: this.isTitleUnlocked(t.id)
    }));
  }

  static createDefaultAchievementSave(): AchievementSaveData {
    const unlockedAchievements: Record<number, boolean> = {};
    const unlockedTitles: Record<number, boolean> = {};
    const achievementProgress: Record<number, number> = {};
    const fastestCompletion: Record<number, number> = {};

    Achievements.forEach(a => {
      unlockedAchievements[a.id] = false;
      achievementProgress[a.id] = 0;
    });

    Titles.forEach(t => {
      unlockedTitles[t.id] = false;
    });

    return {
      unlockedAchievements,
      unlockedTitles,
      currentTitleId: null,
      achievementProgress,
      loginStreak: 0,
      lastLoginDate: '',
      totalLogins: 0,
      fastestCompletion,
      perfectLevels: [],
      totalAchievementScore: 0
    };
  }
}
