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
  EventReward,
  DailyQuest,
  SpecimenResearch,
  ResearchLabProgress,
  TutorialSaveData
} from '../types/GameTypes';
import { TutorialManager } from './TutorialManager';
import { ConservationManager } from './ConservationManager';
import { Levels, EventGalleryItems } from '../data/Levels';
import { Chapters, getChapterById, getChapterByLevelId, getNextChapter, getRewardsByChapterId } from '../data/Chapters';
import { WorkshopRecipes, getRecipeBySpecimenId } from '../data/WorkshopConfig';
import { Events, getActiveEvent, getEventById } from '../data/Events';
import { EventLevelRules, getEventLevelRulesByEventId } from '../data/EventLevelRules';
import { DailyQuestManager } from './DailyQuestManager';
import {
  getResearchLevel,
  getNextResearchLevel,
  getKnowledgeBySpecimen,
  KnowledgeEntries,
  getSpecimenCategory
} from '../data/ResearchLabConfig';
import { PlantFamilies, getPlantFamilyBySpecimenId, isFamilyComplete, getFamilyRewardById } from '../data/PlantFamilies';
import { TowerFloors, getTowerFloor } from '../data/TowerConfig';
import { TowerSaveData, TowerFloorProgress, TowerReward, TowerResultData, ExhibitionSaveData, ExhibitionProgress, ExhibitionSpecimenSubmission, ExhibitionReward, AchievementSaveData, AchievementUnlockResult, ConservationSaveData, ConservationHealthLevel, FamilyCollectionSaveData, FamilyProgress, FamilyReward } from '../types/GameTypes';
import { ExhibitionThemes, getExhibitionTheme, getBadgesByThemeId, getExhibitionBadge } from '../data/ExhibitionConfig';
import { AchievementManager } from './AchievementManager';

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
    this.syncFamilyProgress();
    DailyQuestManager.init(this.data.dailyQuest);
    AchievementManager.init(this.data.achievement);
    TutorialManager.init(this.data.tutorial);
    ConservationManager.init(this.data.conservation);
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
    if (!oldData.dailyQuest) {
      oldData.dailyQuest = defaultData.dailyQuest;
    } else {
      if (!oldData.dailyQuest.quests) {
        oldData.dailyQuest.quests = defaultData.dailyQuest.quests;
      }
      if (!oldData.dailyQuest.progress) {
        oldData.dailyQuest.progress = defaultData.dailyQuest.progress;
      }
      if (!oldData.dailyQuest.claimedQuestIds) {
        oldData.dailyQuest.claimedQuestIds = defaultData.dailyQuest.claimedQuestIds;
      }
      if (oldData.dailyQuest.lastRefreshDate === undefined) {
        oldData.dailyQuest.lastRefreshDate = defaultData.dailyQuest.lastRefreshDate;
      }
      if (oldData.dailyQuest.refreshCount === undefined) {
        oldData.dailyQuest.refreshCount = defaultData.dailyQuest.refreshCount;
      }
      if (oldData.dailyQuest.totalCompleted === undefined) {
        oldData.dailyQuest.totalCompleted = defaultData.dailyQuest.totalCompleted;
      }
      if (oldData.dailyQuest.totalClaimed === undefined) {
        oldData.dailyQuest.totalClaimed = defaultData.dailyQuest.totalClaimed;
      }
    }

    if (oldData.workshop?.restoredSpecimens) {
      oldData.workshop.restoredSpecimens.forEach((specimenId: number) => {
        if (!oldData.galleryUnlocked.includes(specimenId)) {
          oldData.galleryUnlocked.push(specimenId);
        }
      });
    }

    if (!oldData.researchLab) {
      oldData.researchLab = defaultData.researchLab;
    } else {
      if (!oldData.researchLab.specimens) {
        oldData.researchLab.specimens = defaultData.researchLab.specimens;
      }
      if (oldData.researchLab.totalExp === undefined) {
        oldData.researchLab.totalExp = 0;
      }
      if (oldData.researchLab.researcherLevel === undefined) {
        oldData.researchLab.researcherLevel = 1;
      }
      if (oldData.researchLab.researchPoints === undefined) {
        oldData.researchLab.researchPoints = 0;
      }
      if (oldData.researchLab.totalStudies === undefined) {
        oldData.researchLab.totalStudies = 0;
      }
    }

    if (!oldData.tower) {
      oldData.tower = defaultData.tower;
    } else {
      if (!oldData.tower.floorProgress) {
        oldData.tower.floorProgress = defaultData.tower.floorProgress;
      }
      if (!oldData.tower.badges) {
        oldData.tower.badges = defaultData.tower.badges;
      }
      if (oldData.tower.highestFloor === undefined) {
        oldData.tower.highestFloor = 0;
      }
      if (oldData.tower.totalStars === undefined) {
        oldData.tower.totalStars = 0;
      }
      if (oldData.tower.totalScore === undefined) {
        oldData.tower.totalScore = 0;
      }
      if (oldData.tower.currentStreak === undefined) {
        oldData.tower.currentStreak = 0;
      }
      if (oldData.tower.bestStreak === undefined) {
        oldData.tower.bestStreak = 0;
      }
      if (oldData.tower.totalAttempts === undefined) {
        oldData.tower.totalAttempts = 0;
      }
      if (oldData.tower.totalCompletions === undefined) {
        oldData.tower.totalCompletions = 0;
      }
    }

    if (!oldData.exhibition) {
      oldData.exhibition = defaultData.exhibition;
    } else {
      if (!oldData.exhibition.themeProgress) {
        oldData.exhibition.themeProgress = defaultData.exhibition.themeProgress;
      }
      if (!oldData.exhibition.badges) {
        oldData.exhibition.badges = defaultData.exhibition.badges;
      }
      if (oldData.exhibition.totalExhibitionScore === undefined) {
        oldData.exhibition.totalExhibitionScore = 0;
      }
      if (oldData.exhibition.totalParticipations === undefined) {
        oldData.exhibition.totalParticipations = 0;
      }
    }

    if (!oldData.achievement) {
      oldData.achievement = defaultData.achievement;
    } else {
      if (!oldData.achievement.unlockedAchievements) {
        oldData.achievement.unlockedAchievements = defaultData.achievement.unlockedAchievements;
      }
      if (!oldData.achievement.unlockedTitles) {
        oldData.achievement.unlockedTitles = defaultData.achievement.unlockedTitles;
      }
      if (oldData.achievement.currentTitleId === undefined) {
        oldData.achievement.currentTitleId = null;
      }
      if (!oldData.achievement.achievementProgress) {
        oldData.achievement.achievementProgress = defaultData.achievement.achievementProgress;
      }
      if (oldData.achievement.loginStreak === undefined) {
        oldData.achievement.loginStreak = 0;
      }
      if (oldData.achievement.lastLoginDate === undefined) {
        oldData.achievement.lastLoginDate = '';
      }
      if (oldData.achievement.totalLogins === undefined) {
        oldData.achievement.totalLogins = 0;
      }
      if (!oldData.achievement.fastestCompletion) {
        oldData.achievement.fastestCompletion = defaultData.achievement.fastestCompletion;
      }
      if (!oldData.achievement.perfectLevels) {
        oldData.achievement.perfectLevels = [];
      }
      if (oldData.achievement.totalAchievementScore === undefined) {
        oldData.achievement.totalAchievementScore = 0;
      }
    }

    if (!oldData.tutorial) {
      oldData.tutorial = defaultData.tutorial;
    } else {
      if (!oldData.tutorial.completedTutorials) {
        oldData.tutorial.completedTutorials = defaultData.tutorial.completedTutorials;
      }
      if (!oldData.tutorial.skippedTutorials) {
        oldData.tutorial.skippedTutorials = defaultData.tutorial.skippedTutorials;
      }
      if (oldData.tutorial.currentTutorialId === undefined) {
        oldData.tutorial.currentTutorialId = defaultData.tutorial.currentTutorialId;
      }
      if (!oldData.tutorial.progress) {
        oldData.tutorial.progress = defaultData.tutorial.progress;
      } else {
        Object.keys(oldData.tutorial.progress).forEach(key => {
          const p = oldData.tutorial.progress[key];
          if (p.skipped === undefined) {
            p.skipped = false;
          }
          if (p.rewardsClaimed === undefined) {
            p.rewardsClaimed = false;
          }
          if (p.attempts === undefined) {
            p.attempts = 0;
          }
        });
      }
      if (oldData.tutorial.teachingLevelCompleted === undefined) {
        oldData.tutorial.teachingLevelCompleted = defaultData.tutorial.teachingLevelCompleted;
      }
      if (oldData.tutorial.teachingLevelSkipped === undefined) {
        oldData.tutorial.teachingLevelSkipped = defaultData.tutorial.teachingLevelSkipped;
      }
      if (oldData.tutorial.firstTimePlayer === undefined) {
        oldData.tutorial.firstTimePlayer = defaultData.tutorial.firstTimePlayer;
      }
      if (!oldData.tutorial.rewardsClaimed) {
        oldData.tutorial.rewardsClaimed = defaultData.tutorial.rewardsClaimed;
      }
    }

    if (!oldData.conservation) {
      oldData.conservation = defaultData.conservation;
    } else {
      if (!oldData.conservation.specimens) {
        oldData.conservation.specimens = defaultData.conservation.specimens;
      }
      if (oldData.conservation.totalCares === undefined) {
        oldData.conservation.totalCares = 0;
      }
      if (oldData.conservation.decayAccumulator === undefined) {
        oldData.conservation.decayAccumulator = 0;
      }
      if (oldData.conservation.lastDecayProcessTime === undefined) {
        oldData.conservation.lastDecayProcessTime = Date.now();
      }
      if (!oldData.conservation.dismissedReminders) {
        oldData.conservation.dismissedReminders = [];
      }
    }

    if (!oldData.familyCollection) {
      oldData.familyCollection = defaultData.familyCollection;
    } else {
      if (!oldData.familyCollection.familyProgress) {
        oldData.familyCollection.familyProgress = defaultData.familyCollection.familyProgress;
      }
      if (oldData.familyCollection.totalFamiliesCompleted === undefined) {
        oldData.familyCollection.totalFamiliesCompleted = 0;
      }
      if (!oldData.familyCollection.totalSpecimensByFamily) {
        oldData.familyCollection.totalSpecimensByFamily = defaultData.familyCollection.totalSpecimensByFamily;
      }
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
    const dailyQuestSaveData = DailyQuestManager.createDefaultDailyQuestSave();
    const researchLabData = this.createDefaultResearchLabSave();
    const towerSaveData = this.createDefaultTowerSave();
    const exhibitionSaveData = this.createDefaultExhibitionSave();

    const achievementData = AchievementManager.createDefaultAchievementSave();
    const tutorialData = TutorialManager.createDefaultTutorialSave();
    const conservationData = ConservationManager.createDefaultSave();
    const familyCollectionData = this.createDefaultFamilyCollectionSave();

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
      event: eventSaveData,
      dailyQuest: dailyQuestSaveData,
      researchLab: researchLabData,
      tower: towerSaveData,
      exhibition: exhibitionSaveData,
      achievement: achievementData,
      tutorial: tutorialData,
      conservation: conservationData,
      familyCollection: familyCollectionData
    };
  }

  private static createDefaultFamilyCollectionSave(): FamilyCollectionSaveData {
    const familyProgress: Record<string, FamilyProgress> = {};
    const totalSpecimensByFamily: Record<string, number> = {};

    PlantFamilies.forEach(family => {
      const rewardsClaimed: Record<number, boolean> = {};
      family.rewards.forEach(reward => {
        rewardsClaimed[reward.id] = false;
      });

      familyProgress[family.id] = {
        familyId: family.id,
        unlockedSpecimens: [],
        rewardsClaimed,
        illustrationUnlocked: false,
        totalStars: 0
      };

      totalSpecimensByFamily[family.id] = family.specimenIds.length;
    });

    return {
      familyProgress,
      totalFamiliesCompleted: 0,
      totalSpecimensByFamily
    };
  }

  private static createDefaultResearchLabSave(): ResearchLabProgress {
    return {
      totalExp: 0,
      researcherLevel: 1,
      specimens: {},
      researchPoints: 0,
      totalStudies: 0
    };
  }

  private static createDefaultTowerSave(): TowerSaveData {
    const floorProgress: Record<number, TowerFloorProgress> = {};
    TowerFloors.forEach((floor, index) => {
      floorProgress[floor.id] = {
        floorId: floor.id,
        unlocked: index === 0,
        completed: false,
        bestScore: 0,
        bestTime: 0,
        stars: 0,
        attempts: 0,
        bestAccuracy: 0,
        bestCombo: 0,
        rewardsClaimed: false
      };
    });

    const towerBadges: Record<number, boolean> = {};
    TowerFloors.forEach(floor => {
      floor.rewards
        .filter(r => r.type === 'badge')
        .forEach(r => {
          towerBadges[r.id] = false;
        });
    });

    return {
      highestFloor: 0,
      totalStars: 0,
      totalScore: 0,
      floorProgress,
      badges: towerBadges,
      currentStreak: 0,
      bestStreak: 0,
      totalAttempts: 0,
      totalCompletions: 0
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

  private static createDefaultExhibitionSave(): ExhibitionSaveData {
    const themeProgress: Record<string, ExhibitionProgress> = {};

    ExhibitionThemes.forEach(theme => {
      const rewardsClaimed: Record<number, boolean> = {};
      theme.rewards.forEach(reward => {
        rewardsClaimed[reward.id] = false;
      });

      themeProgress[theme.id] = {
        themeId: theme.id,
        participated: false,
        submissions: {},
        completionScore: 0,
        speedScore: 0,
        starScore: 0,
        totalScore: 0,
        rewardsClaimed,
        badgesUnlocked: []
      };
    });

    const exhibitionBadges: Record<number, boolean> = {};
    ExhibitionThemes.forEach(theme => {
      const badges = getBadgesByThemeId(theme.id);
      badges.forEach(badge => {
        exhibitionBadges[badge.id] = false;
      });
    });

    return {
      totalExhibitionScore: 0,
      totalParticipations: 0,
      themeProgress,
      badges: exhibitionBadges
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

  static addScore(value: number): void {
    this.data.totalScore += value;
    this.save();
  }

  static getUnlockedLevels(): number[] {
    return [...this.data.unlockedLevels];
  }

  static getUnlockedChapters(): number[] {
    return [...this.data.unlockedChapters];
  }

  static isGalleryUnlocked(specimenId: number): boolean {
    return this.data.galleryUnlocked.includes(specimenId) 
        || this.data.event.eventGalleryUnlocked.includes(specimenId);
  }

  static getUnlockedGalleryItems(): number[] {
    const combined = [...new Set([...this.data.galleryUnlocked, ...this.data.event.eventGalleryUnlocked])];
    return combined;
  }

  static hasBadge(badgeId: number): boolean {
    return this.data.badges[badgeId] ?? false;
  }

  static completeLevel(levelId: number, score: number, time: number, stars: number): { chapterCompleted: boolean; completedChapterId: number | null; newlyUnlockedChapterId: number | null; updatedQuests: DailyQuest[]; researchRewards: { pointsGained: number; expGained: number }; achievementResult: AchievementUnlockResult; conservationInfo: { specimenId: number | null; healthLevel: ConservationHealthLevel | null; scoreMultiplier: number; researchMultiplier: number; finalScore: number; finalPoints: number }; familyProgressResult: { familyCompleted: boolean; familyId: string | null; newlyUnlockedRewardIds: number[]; illustrationUnlocked: boolean } } {
    const progress = this.data.progress[levelId];
    if (!progress) return { chapterCompleted: false, completedChapterId: null, newlyUnlockedChapterId: null, updatedQuests: [], researchRewards: { pointsGained: 0, expGained: 0 }, achievementResult: { newlyUnlocked: [], newlyUnlockedTitles: [], scoreGained: 0 }, conservationInfo: { specimenId: null, healthLevel: null, scoreMultiplier: 1, researchMultiplier: 1, finalScore: 0, finalPoints: 0 }, familyProgressResult: { familyCompleted: false, familyId: null, newlyUnlockedRewardIds: [], illustrationUnlocked: false } };

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

    const updatedQuests = DailyQuestManager.onLevelComplete(levelId, score, time, stars);

    const level = Levels.find(l => l.id === levelId);
    const specimenId = level?.specimen.id;

    let basePoints = 10 + stars * 15;
    let baseExp = 5 + stars * 10;

    const difficultyMultiplier: Record<string, number> = {
      easy: 1,
      medium: 1.5,
      hard: 2.2
    };
    const diff = level?.rule.difficulty ?? 'easy';
    basePoints = Math.floor(basePoints * difficultyMultiplier[diff]);
    baseExp = Math.floor(baseExp * difficultyMultiplier[diff]);

    if (isFirstCompletion) {
      basePoints += 30;
      baseExp += 20;
    }

    if (stars === 3) {
      basePoints += 20;
      baseExp += 15;
    }

    let finalScore = score;
    let scoreMultiplier = 1;
    let researchMultiplier = 1;
    let healthLevel: ConservationHealthLevel | null = null;
    let finalResearchPoints = basePoints;
    let finalResearchExp = baseExp;

    if (specimenId && ConservationManager.getRegisteredSpecimenIds().includes(specimenId)) {
      healthLevel = ConservationManager.getHealthLevel(specimenId);
      const multiplier = ConservationManager.getRewardMultiplierForSpecimen(specimenId);
      scoreMultiplier = multiplier.scoreMultiplier;
      researchMultiplier = multiplier.researchMultiplier;

      finalScore = Math.max(1, Math.floor(score * scoreMultiplier));
      finalResearchPoints = Math.max(1, Math.floor(basePoints * multiplier.researchMultiplier));
      finalResearchExp = Math.max(1, Math.floor(baseExp * multiplier.researchMultiplier));

      if (finalScore !== score) {
        progress.bestScore = Math.max(progress.bestScore - score + finalScore, finalScore);
        this.recalculateTotalScore();
      }
    }

    if (specimenId && this.isGalleryUnlocked(specimenId)) {
      const specimenResearch = this.getOrCreateSpecimenResearch(specimenId);
      specimenResearch.expPoints += Math.floor(finalResearchExp * 0.6);
      if (!specimenResearch.firstStudiedAt) {
        specimenResearch.firstStudiedAt = Date.now();
      }
      specimenResearch.lastStudiedAt = Date.now();

      const specimenLevelThresholds = [0, 50, 150, 350];
      let newSpecimenLevel = 0;
      for (let i = specimenLevelThresholds.length - 1; i >= 0; i--) {
        if (specimenResearch.expPoints >= specimenLevelThresholds[i]) {
          newSpecimenLevel = i;
          break;
        }
      }
      specimenResearch.researchLevel = newSpecimenLevel;

      const allKnowledge = getKnowledgeBySpecimen(specimenId);
      for (const knowledge of allKnowledge) {
        const alreadyUnlocked = specimenResearch.unlockedKnowledge.includes(knowledge.id);
        const meetsResearcherLevel = this.data.researchLab.researcherLevel >= knowledge.requiredLevel;
        const meetsSpecimenLevel = specimenResearch.researchLevel >= (knowledge.requiredLevel - 1);
        if (!alreadyUnlocked && meetsResearcherLevel && meetsSpecimenLevel) {
          specimenResearch.unlockedKnowledge.push(knowledge.id);
        }
      }
    }

    const currentLevelConfig = getResearchLevel(this.data.researchLab.totalExp);
    const bonus = currentLevelConfig.researchPointBonus;
    const actualPoints = Math.floor(finalResearchPoints * bonus);
    this.data.researchLab.researchPoints += actualPoints;

    const oldResearcherLevel = this.data.researchLab.researcherLevel;
    this.data.researchLab.totalExp += finalResearchExp;
    const newLevelConfig = getResearchLevel(this.data.researchLab.totalExp);
    this.data.researchLab.researcherLevel = newLevelConfig.level;

    if (this.data.researchLab.researcherLevel > oldResearcherLevel && specimenId) {
      const specimenResearch = this.getOrCreateSpecimenResearch(specimenId);
      const allKnowledge = getKnowledgeBySpecimen(specimenId);
      for (const knowledge of allKnowledge) {
        const alreadyUnlocked = specimenResearch.unlockedKnowledge.includes(knowledge.id);
        const meetsResearcherLevel = this.data.researchLab.researcherLevel >= knowledge.requiredLevel;
        const meetsSpecimenLevel = specimenResearch.researchLevel >= (knowledge.requiredLevel - 1);
        if (!alreadyUnlocked && meetsResearcherLevel && meetsSpecimenLevel) {
          specimenResearch.unlockedKnowledge.push(knowledge.id);
        }
      }
    }

    const researchRewards = { pointsGained: actualPoints, expGained: finalResearchExp };

    const completedLevelsCount = Object.values(this.data.progress).filter(p => p.completed).length;
    const totalStars = this.getTotalStars();
    const unlockedSpecimens = this.getUnlockedGalleryItems();
    const allProgress = { ...this.data.progress };

    const achievementResult = AchievementManager.onLevelComplete(
      levelId,
      score,
      time,
      stars,
      completedLevelsCount,
      totalStars,
      unlockedSpecimens,
      allProgress
    );

    if (achievementResult.scoreGained > 0) {
      this.data.totalScore += achievementResult.scoreGained;
    }

    const familyProgressResult = specimenId 
      ? this.updateFamilyProgress(specimenId, stars)
      : { familyCompleted: false, familyId: null, newlyUnlockedRewardIds: [], illustrationUnlocked: false };

    this.save();
    return {
      chapterCompleted: completionResult.chapterCompleted,
      completedChapterId: completionResult.completedChapterId,
      newlyUnlockedChapterId: unlockResult,
      updatedQuests,
      researchRewards,
      achievementResult,
      conservationInfo: {
        specimenId: specimenId ?? null,
        healthLevel,
        scoreMultiplier,
        researchMultiplier,
        finalScore,
        finalPoints: actualPoints
      },
      familyProgressResult
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

  static restoreSpecimen(specimenId: number): { success: boolean; updatedQuests: DailyQuest[]; achievementResult: AchievementUnlockResult; familyProgressResult: { familyCompleted: boolean; familyId: string | null; newlyUnlockedRewardIds: number[]; illustrationUnlocked: boolean } } {
    if (!this.canRestoreSpecimen(specimenId)) return { success: false, updatedQuests: [], achievementResult: { newlyUnlocked: [], newlyUnlockedTitles: [], scoreGained: 0 }, familyProgressResult: { familyCompleted: false, familyId: null, newlyUnlockedRewardIds: [], illustrationUnlocked: false } };

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

    ConservationManager.registerSpecimen(specimenId);

    const updatedQuests = DailyQuestManager.onSpecimenRestored(specimenId);

    const restoredCount = this.data.workshop.restoredSpecimens.length;
    const achievementResult = AchievementManager.onSpecimenRestored(restoredCount);

    if (achievementResult.scoreGained > 0) {
      this.data.totalScore += achievementResult.scoreGained;
    }

    const familyProgressResult = this.updateFamilyProgress(specimenId, 0);

    this.save();
    return { success: true, updatedQuests, achievementResult, familyProgressResult };
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

  static getFamilyCollectionSaveData(): FamilyCollectionSaveData {
    return {
      ...this.data.familyCollection,
      familyProgress: { ...this.data.familyCollection.familyProgress }
    };
  }

  static getFamilyProgress(familyId: string): FamilyProgress | undefined {
    return this.data.familyCollection.familyProgress[familyId];
  }

  static getAllFamilyProgress(): Record<string, FamilyProgress> {
    return { ...this.data.familyCollection.familyProgress };
  }

  static getTotalFamiliesCompleted(): number {
    return this.data.familyCollection.totalFamiliesCompleted;
  }

  static isFamilyRewardClaimed(familyId: string, rewardId: number): boolean {
    return this.data.familyCollection.familyProgress[familyId]?.rewardsClaimed[rewardId] ?? false;
  }

  static isFamilyIllustrationUnlocked(familyId: string): boolean {
    return this.data.familyCollection.familyProgress[familyId]?.illustrationUnlocked ?? false;
  }

  static getFamilyUnlockedSpecimens(familyId: string): number[] {
    return this.data.familyCollection.familyProgress[familyId]?.unlockedSpecimens ?? [];
  }

  static getFamilyProgressPercent(familyId: string): number {
    const family = PlantFamilies.find(f => f.id === familyId);
    if (!family || family.specimenIds.length === 0) return 0;
    
    const unlockedSpecimens = this.getFamilyUnlockedSpecimens(familyId);
    const unlockedCount = family.specimenIds.filter(id => unlockedSpecimens.includes(id)).length;
    return Math.round((unlockedCount / family.specimenIds.length) * 100);
  }

  static canClaimFamilyReward(familyId: string, rewardId: number): boolean {
    const family = PlantFamilies.find(f => f.id === familyId);
    const reward = family?.rewards.find(r => r.id === rewardId);
    if (!family || !reward) return false;
    
    const progress = this.getFamilyProgressPercent(familyId);
    return progress >= reward.requiredProgress && !this.isFamilyRewardClaimed(familyId, rewardId);
  }

  static claimFamilyReward(familyId: string, rewardId: number): { success: boolean; reward: FamilyReward | null } {
    if (!this.canClaimFamilyReward(familyId, rewardId)) {
      return { success: false, reward: null };
    }

    const family = PlantFamilies.find(f => f.id === familyId)!;
    const reward = family.rewards.find(r => r.id === rewardId)!;
    const familyProgress = this.data.familyCollection.familyProgress[familyId];

    familyProgress.rewardsClaimed[rewardId] = true;

    switch (reward.type) {
      case 'score':
        if (reward.value) {
          this.data.totalScore += reward.value;
        }
        break;
      case 'badge':
        this.data.badges[reward.id] = true;
        break;
      case 'research_point':
        if (reward.value) {
          this.grantResearchPoints(reward.value);
        }
        break;
    }

    this.save();
    return { success: true, reward };
  }

  static updateFamilyProgress(specimenId: number, stars: number): { 
    familyCompleted: boolean; 
    familyId: string | null; 
    newlyUnlockedRewardIds: number[];
    illustrationUnlocked: boolean;
  } {
    const family = getPlantFamilyBySpecimenId(specimenId);
    if (!family) {
      return { familyCompleted: false, familyId: null, newlyUnlockedRewardIds: [], illustrationUnlocked: false };
    }

    const unlockedSpecimens = this.getUnlockedGalleryItems();
    const familyProgress = this.data.familyCollection.familyProgress[family.id];
    const newlyUnlockedRewardIds: number[] = [];
    let illustrationUnlocked = false;

    if (!familyProgress.unlockedSpecimens.includes(specimenId)) {
      familyProgress.unlockedSpecimens.push(specimenId);
      if (!familyProgress.firstUnlockedAt) {
        familyProgress.firstUnlockedAt = Date.now();
      }
    }

    familyProgress.totalStars = family.specimenIds.reduce((sum, id) => {
      const levelProgress = this.data.progress[id] || this.data.event.eventProgress?.[Object.keys(this.data.event.eventProgress)[0]]?.levelProgress?.[id];
      return sum + (levelProgress?.stars || 0);
    }, 0);

    const progressPercent = this.getFamilyProgressPercent(family.id);
    const wasCompleted = familyProgress.completedAt !== undefined;
    const isNowComplete = isFamilyComplete(family, unlockedSpecimens);

    if (isNowComplete && !wasCompleted) {
      familyProgress.completedAt = Date.now();
      this.data.familyCollection.totalFamiliesCompleted += 1;
    }

    family.rewards.forEach(reward => {
      if (progressPercent >= reward.requiredProgress && !familyProgress.rewardsClaimed[reward.id]) {
        newlyUnlockedRewardIds.push(reward.id);
      }
    });

    if (progressPercent >= 100 && !familyProgress.illustrationUnlocked) {
      familyProgress.illustrationUnlocked = true;
      illustrationUnlocked = true;
    }

    this.save();

    return {
      familyCompleted: isNowComplete && !wasCompleted,
      familyId: family.id,
      newlyUnlockedRewardIds,
      illustrationUnlocked
    };
  }

  private static syncFamilyProgress(): void {
    const unlockedSpecimens = this.getUnlockedGalleryItems();

    PlantFamilies.forEach(family => {
      const familyProgress = this.data.familyCollection.familyProgress[family.id];
      if (!familyProgress) return;

      const familyUnlocked = family.specimenIds.filter(id => unlockedSpecimens.includes(id));
      familyProgress.unlockedSpecimens = familyUnlocked;

      if (familyUnlocked.length > 0 && !familyProgress.firstUnlockedAt) {
        familyProgress.firstUnlockedAt = Date.now();
      }

      const progressPercent = family.specimenIds.length > 0 
        ? Math.round((familyUnlocked.length / family.specimenIds.length) * 100) 
        : 0;

      if (progressPercent >= 100 && !familyProgress.illustrationUnlocked) {
        familyProgress.illustrationUnlocked = true;
      }

      const isComplete = family.specimenIds.every(id => unlockedSpecimens.includes(id));
      if (isComplete && !familyProgress.completedAt) {
        familyProgress.completedAt = Date.now();
      }
    });

    this.data.familyCollection.totalFamiliesCompleted = PlantFamilies.filter(family => {
      const fp = this.data.familyCollection.familyProgress[family.id];
      return fp && fp.completedAt !== undefined;
    }).length;
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
  ): { newlyUnlockedLevelId: number | null; updatedTotalScore: number; achievementResult: AchievementUnlockResult } {
    const eventProg = this.data.event.eventProgress[eventId];
    if (!eventProg) return { newlyUnlockedLevelId: null, updatedTotalScore: 0, achievementResult: { newlyUnlocked: [], newlyUnlockedTitles: [], scoreGained: 0 } };

    const levelProg = eventProg.levelProgress[levelId];
    if (!levelProg) return { newlyUnlockedLevelId: null, updatedTotalScore: 0, achievementResult: { newlyUnlocked: [], newlyUnlockedTitles: [], scoreGained: 0 } };

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

    const achievementResult = AchievementManager.onEventParticipation();

    const eventSpecimenCount = this.getUnlockedEventGalleryItems().length;
    const eventSpecimenResult = AchievementManager.onEventSpecimenUnlocked(eventSpecimenCount);

    achievementResult.newlyUnlocked.push(...eventSpecimenResult.newlyUnlocked);
    achievementResult.newlyUnlockedTitles.push(...eventSpecimenResult.newlyUnlockedTitles);
    achievementResult.scoreGained += eventSpecimenResult.scoreGained;

    if (achievementResult.scoreGained > 0) {
      this.data.totalScore += achievementResult.scoreGained;
    }

    this.save();
    return { newlyUnlockedLevelId, updatedTotalScore: eventProg.totalScore, achievementResult };
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

  static getResearchLabProgress(): ResearchLabProgress {
    return { ...this.data.researchLab, specimens: { ...this.data.researchLab.specimens } };
  }

  static getResearcherLevel(): number {
    return this.data.researchLab.researcherLevel;
  }

  static getTotalResearchExp(): number {
    return this.data.researchLab.totalExp;
  }

  static getResearchPoints(): number {
    return this.data.researchLab.researchPoints;
  }

  static getTotalStudies(): number {
    return this.data.researchLab.totalStudies;
  }

  static getSpecimenResearch(specimenId: number): SpecimenResearch | undefined {
    return this.data.researchLab.specimens[specimenId];
  }

  static getOrCreateSpecimenResearch(specimenId: number): SpecimenResearch {
    if (!this.data.researchLab.specimens[specimenId]) {
      this.data.researchLab.specimens[specimenId] = {
        specimenId,
        researchLevel: 0,
        expPoints: 0,
        unlockedKnowledge: []
      };
    }
    return this.data.researchLab.specimens[specimenId];
  }

  static getSpecimenResearchLevel(specimenId: number): number {
    return this.data.researchLab.specimens[specimenId]?.researchLevel ?? 0;
  }

  static getUnlockedKnowledge(specimenId: number): string[] {
    return this.data.researchLab.specimens[specimenId]?.unlockedKnowledge ?? [];
  }

  static isKnowledgeUnlocked(specimenId: number, knowledgeId: string): boolean {
    return this.data.researchLab.specimens[specimenId]?.unlockedKnowledge.includes(knowledgeId) ?? false;
  }

  static canStudySpecimen(specimenId: number): boolean {
    if (!this.isGalleryUnlocked(specimenId)) return false;
    const studyCost = 50;
    return this.data.researchLab.researchPoints >= studyCost;
  }

  static studySpecimen(specimenId: number): {
    success: boolean;
    gainedExp: number;
    newlyUnlockedKnowledge: string[];
    leveledUp: boolean;
    newResearcherLevel: number;
    newSpecimenLevel: number;
    unlockMessage?: string;
    achievementResult: AchievementUnlockResult;
  } {
    if (!this.canStudySpecimen(specimenId)) {
      return {
        success: false,
        gainedExp: 0,
        newlyUnlockedKnowledge: [],
        leveledUp: false,
        newResearcherLevel: this.data.researchLab.researcherLevel,
        newSpecimenLevel: this.getSpecimenResearchLevel(specimenId),
        achievementResult: { newlyUnlocked: [], newlyUnlockedTitles: [], scoreGained: 0 }
      };
    }

    const studyCost = 50;
    this.data.researchLab.researchPoints -= studyCost;
    this.data.researchLab.totalStudies += 1;

    const currentLevel = getResearchLevel(this.data.researchLab.totalExp);
    const bonus = currentLevel.researchPointBonus;
    const baseExp = 25;
    const gainedExp = Math.floor(baseExp * bonus);

    this.data.researchLab.totalExp += gainedExp;

    const specimenResearch = this.getOrCreateSpecimenResearch(specimenId);
    if (!specimenResearch.firstStudiedAt) {
      specimenResearch.firstStudiedAt = Date.now();
    }
    specimenResearch.lastStudiedAt = Date.now();
    specimenResearch.expPoints += gainedExp;

    const oldResearcherLevel = this.data.researchLab.researcherLevel;
    const newResearcherLevelConfig = getResearchLevel(this.data.researchLab.totalExp);
    this.data.researchLab.researcherLevel = newResearcherLevelConfig.level;
    const researcherLeveledUp = this.data.researchLab.researcherLevel > oldResearcherLevel;

    const oldSpecimenLevel = specimenResearch.researchLevel;
    const specimenLevelThresholds = [0, 50, 150, 350];
    let newSpecimenLevel = 0;
    for (let i = specimenLevelThresholds.length - 1; i >= 0; i--) {
      if (specimenResearch.expPoints >= specimenLevelThresholds[i]) {
        newSpecimenLevel = i;
        break;
      }
    }
    specimenResearch.researchLevel = newSpecimenLevel;

    const allKnowledge = getKnowledgeBySpecimen(specimenId);
    const newlyUnlockedKnowledge: string[] = [];

    for (const knowledge of allKnowledge) {
      const alreadyUnlocked = specimenResearch.unlockedKnowledge.includes(knowledge.id);
      const meetsResearcherLevel = this.data.researchLab.researcherLevel >= knowledge.requiredLevel;
      const meetsSpecimenLevel = specimenResearch.researchLevel >= (knowledge.requiredLevel - 1);

      if (!alreadyUnlocked && meetsResearcherLevel && meetsSpecimenLevel) {
        specimenResearch.unlockedKnowledge.push(knowledge.id);
        newlyUnlockedKnowledge.push(knowledge.id);
      }
    }

    let unlockMessage: string | undefined;
    if (researcherLeveledUp && newResearcherLevelConfig.unlockMessage) {
      unlockMessage = newResearcherLevelConfig.unlockMessage;
    }

    this.save();

    const knowledgeCount = this.getTotalKnowledgeUnlocked();
    const knowledgeResult = AchievementManager.onKnowledgeUnlocked(knowledgeCount);

    const researcherLevel = this.data.researchLab.researcherLevel;
    const levelResult = AchievementManager.onResearcherLevelUp(researcherLevel);

    const achievementResult: AchievementUnlockResult = {
      newlyUnlocked: [...knowledgeResult.newlyUnlocked, ...levelResult.newlyUnlocked],
      newlyUnlockedTitles: [...knowledgeResult.newlyUnlockedTitles, ...levelResult.newlyUnlockedTitles],
      scoreGained: knowledgeResult.scoreGained + levelResult.scoreGained
    };

    if (achievementResult.scoreGained > 0) {
      this.data.totalScore += achievementResult.scoreGained;
    }

    return {
      success: true,
      gainedExp,
      newlyUnlockedKnowledge,
      leveledUp: researcherLeveledUp || newSpecimenLevel > oldSpecimenLevel,
      newResearcherLevel: this.data.researchLab.researcherLevel,
      newSpecimenLevel: specimenResearch.researchLevel,
      unlockMessage,
      achievementResult
    };
  }

  static grantResearchPoints(amount: number): number {
    const currentLevel = getResearchLevel(this.data.researchLab.totalExp);
    const bonus = currentLevel.researchPointBonus;
    const finalAmount = Math.floor(amount * bonus);
    this.data.researchLab.researchPoints += finalAmount;
    this.save();
    return finalAmount;
  }

  static grantResearchExp(amount: number): { totalAdded: number; leveledUp: boolean; newLevel: number; unlockMessage?: string; achievementResult: AchievementUnlockResult } {
    const oldLevel = this.data.researchLab.researcherLevel;
    this.data.researchLab.totalExp += amount;
    const newLevelConfig = getResearchLevel(this.data.researchLab.totalExp);
    this.data.researchLab.researcherLevel = newLevelConfig.level;
    const leveledUp = this.data.researchLab.researcherLevel > oldLevel;

    const achievementResult = AchievementManager.onResearcherLevelUp(this.data.researchLab.researcherLevel);
    if (achievementResult.scoreGained > 0) {
      this.data.totalScore += achievementResult.scoreGained;
    }

    this.save();
    return {
      totalAdded: amount,
      leveledUp,
      newLevel: this.data.researchLab.researcherLevel,
      unlockMessage: leveledUp ? newLevelConfig.unlockMessage : undefined,
      achievementResult
    };
  }

  static onLevelCompleteGrantResearch(levelId: number, stars: number, score: number): {
    pointsGained: number;
    expGained: number;
  } {
    const levelProgress = this.getProgress(levelId);
    if (!levelProgress) return { pointsGained: 0, expGained: 0 };

    const level = Levels.find(l => l.id === levelId);
    const specimenId = level?.specimen.id;

    let basePoints = 10 + stars * 15;
    let baseExp = 5 + stars * 10;

    const difficultyMultiplier: Record<string, number> = {
      easy: 1,
      medium: 1.5,
      hard: 2.2
    };
    const diff = level?.rule.difficulty ?? 'easy';
    basePoints = Math.floor(basePoints * difficultyMultiplier[diff]);
    baseExp = Math.floor(baseExp * difficultyMultiplier[diff]);

    if (!levelProgress.completed) {
      basePoints += 30;
      baseExp += 20;
    }

    if (stars === 3) {
      basePoints += 20;
      baseExp += 15;
    }

    if (specimenId && this.isGalleryUnlocked(specimenId)) {
      const specimenResearch = this.getOrCreateSpecimenResearch(specimenId);
      specimenResearch.expPoints += Math.floor(baseExp * 0.6);
      if (!specimenResearch.firstStudiedAt) {
        specimenResearch.firstStudiedAt = Date.now();
      }
      specimenResearch.lastStudiedAt = Date.now();
    }

    const actualPoints = this.grantResearchPoints(basePoints);
    const expResult = this.grantResearchExp(baseExp);

    this.save();
    return {
      pointsGained: actualPoints,
      expGained: expResult.totalAdded
    };
  }

  static getStudiedSpecimensCount(): number {
    return Object.values(this.data.researchLab.specimens).filter(s => s.expPoints > 0).length;
  }

  static getTotalKnowledgeUnlocked(): number {
    return Object.values(this.data.researchLab.specimens)
      .reduce((sum, s) => sum + s.unlockedKnowledge.length, 0);
  }

  static getResearchProgressPercent(): number {
    const totalPossible = KnowledgeEntries.length;
    const current = this.getTotalKnowledgeUnlocked();
    return totalPossible > 0 ? (current / totalPossible) * 100 : 0;
  }

  static getTowerSaveData(): TowerSaveData {
    return { ...this.data.tower, floorProgress: { ...this.data.tower.floorProgress } };
  }

  static getTowerFloorProgress(floorId: number): TowerFloorProgress | undefined {
    return this.data.tower.floorProgress[floorId];
  }

  static getAllTowerFloorProgress(): Record<number, TowerFloorProgress> {
    return { ...this.data.tower.floorProgress };
  }

  static isTowerFloorUnlocked(floorId: number): boolean {
    return this.data.tower.floorProgress[floorId]?.unlocked ?? false;
  }

  static getTowerHighestFloor(): number {
    return this.data.tower.highestFloor;
  }

  static getTowerTotalStars(): number {
    return this.data.tower.totalStars;
  }

  static getTowerTotalScore(): number {
    return this.data.tower.totalScore;
  }

  static getTowerCurrentStreak(): number {
    return this.data.tower.currentStreak;
  }

  static getTowerBestStreak(): number {
    return this.data.tower.bestStreak;
  }

  static getTowerTotalAttempts(): number {
    return this.data.tower.totalAttempts;
  }

  static getTowerTotalCompletions(): number {
    return this.data.tower.totalCompletions;
  }

  static hasTowerBadge(badgeId: number): boolean {
    return this.data.tower.badges[badgeId] ?? false;
  }

  static canClaimTowerRewards(floorId: number): boolean {
    const progress = this.data.tower.floorProgress[floorId];
    return progress?.completed === true && progress?.rewardsClaimed === false;
  }

  static completeTowerFloor(
    floorId: number,
    result: TowerResultData
  ): { unlockedNextFloor: boolean; newHighestFloor: number; achievementResult: AchievementUnlockResult } {
    const progress = this.data.tower.floorProgress[floorId];
    if (!progress) return { unlockedNextFloor: false, newHighestFloor: this.data.tower.highestFloor, achievementResult: { newlyUnlocked: [], newlyUnlockedTitles: [], scoreGained: 0 } };

    const floor = getTowerFloor(floorId);
    const isFirstCompletion = !progress.completed;

    progress.completed = true;
    progress.attempts += 1;
    progress.lastPlayedAt = Date.now();

    if (result.score > progress.bestScore) {
      progress.bestScore = result.score;
    }
    if (progress.bestTime === 0 || result.time < progress.bestTime) {
      progress.bestTime = result.time;
    }
    if (result.stars > progress.stars) {
      progress.stars = result.stars;
    }
    if (result.accuracy > (progress.bestAccuracy || 0)) {
      progress.bestAccuracy = result.accuracy;
    }
    if (result.maxCombo > (progress.bestCombo || 0)) {
      progress.bestCombo = result.maxCombo;
    }

    if (isFirstCompletion) {
      progress.completedAt = Date.now();
      this.data.tower.totalCompletions += 1;
    }

    this.data.tower.totalAttempts += 1;
    this.data.tower.currentStreak += 1;
    if (this.data.tower.currentStreak > this.data.tower.bestStreak) {
      this.data.tower.bestStreak = this.data.tower.currentStreak;
    }

    this.recalculateTowerTotals();

    let unlockedNextFloor = false;
    let newHighestFloor = this.data.tower.highestFloor;

    if (isFirstCompletion) {
      const nextFloorId = floorId + 1;
      const nextFloor = getTowerFloor(nextFloorId);
      if (nextFloor && !this.data.tower.floorProgress[nextFloorId]?.unlocked) {
        const totalStars = this.data.tower.totalStars;
        if (totalStars >= nextFloor.requiredStars && this.data.tower.floorProgress[nextFloorId]) {
          this.data.tower.floorProgress[nextFloorId].unlocked = true;
          unlockedNextFloor = true;
          if (nextFloor.floorNumber > this.data.tower.highestFloor) {
            this.data.tower.highestFloor = nextFloor.floorNumber;
            newHighestFloor = nextFloor.floorNumber;
          }
        }
      }

      const scoreReward = result.rewards.find(r => r.type === 'score');
      if (scoreReward?.value) {
        this.data.tower.totalScore += scoreReward.value;
      }
    }

    const scoreReward = floor?.rewards.find(r => r.type === 'score');
    if (scoreReward?.value && isFirstCompletion) {
      this.data.totalScore += scoreReward.value;
    }

    const achievementResult = AchievementManager.onTowerFloor(this.data.tower.highestFloor);

    if (achievementResult.scoreGained > 0) {
      this.data.totalScore += achievementResult.scoreGained;
    }

    this.save();
    return { unlockedNextFloor, newHighestFloor, achievementResult };
  }

  static failTowerFloor(floorId: number): void {
    const progress = this.data.tower.floorProgress[floorId];
    if (!progress) return;

    progress.attempts += 1;
    progress.lastPlayedAt = Date.now();
    this.data.tower.totalAttempts += 1;
    this.data.tower.currentStreak = 0;

    this.save();
  }

  private static recalculateTowerTotals(): void {
    const progressList = Object.values(this.data.tower.floorProgress);
    this.data.tower.totalStars = progressList.reduce((sum, p) => sum + p.stars, 0);

    let highestUnlockedFloor = 0;
    for (const floor of TowerFloors) {
      if (this.data.tower.floorProgress[floor.id]?.unlocked) {
        highestUnlockedFloor = Math.max(highestUnlockedFloor, floor.floorNumber);
      }
    }
  }

  static claimTowerRewards(floorId: number): TowerReward[] {
    const progress = this.data.tower.floorProgress[floorId];
    const floor = getTowerFloor(floorId);
    if (!progress || !progress.completed || progress.rewardsClaimed || !floor) {
      return [];
    }

    const rewards = floor.rewards;

    rewards.forEach(reward => {
      switch (reward.type) {
        case 'score':
          if (reward.value) {
            this.data.totalScore += reward.value;
          }
          break;
        case 'badge':
          this.data.tower.badges[reward.id] = true;
          this.data.badges[reward.id] = true;
          break;
        case 'fragment':
          if (reward.specimenId && reward.value) {
            this.addFragments(reward.specimenId, reward.value);
          }
          break;
        case 'research_point':
          if (reward.value) {
            this.grantResearchPoints(reward.value);
          }
          break;
      }
    });

    progress.rewardsClaimed = true;
    this.save();

    return rewards;
  }

  static getExhibitionSaveData(): ExhibitionSaveData {
    return {
      ...this.data.exhibition,
      themeProgress: { ...this.data.exhibition.themeProgress }
    };
  }

  static getExhibitionThemeProgress(themeId: string): ExhibitionProgress | undefined {
    return this.data.exhibition.themeProgress[themeId];
  }

  static getAllExhibitionThemeProgress(): Record<string, ExhibitionProgress> {
    return { ...this.data.exhibition.themeProgress };
  }

  static getTotalExhibitionScore(): number {
    return this.data.exhibition.totalExhibitionScore;
  }

  static getTotalExhibitionParticipations(): number {
    return this.data.exhibition.totalParticipations;
  }

  static hasExhibitionBadge(badgeId: number): boolean {
    return this.data.exhibition.badges[badgeId] ?? false;
  }

  static isSpecimenSubmitted(themeId: string, specimenId: number): boolean {
    return !!this.data.exhibition.themeProgress[themeId]?.submissions[specimenId];
  }

  static getSubmittedSpecimens(themeId: string): number[] {
    const progress = this.data.exhibition.themeProgress[themeId];
    return progress ? Object.keys(progress.submissions).map(Number) : [];
  }

  static getExhibitionSpecimenSubmission(themeId: string, specimenId: number): ExhibitionSpecimenSubmission | undefined {
    return this.data.exhibition.themeProgress[themeId]?.submissions[specimenId];
  }

  static canSubmitToExhibition(themeId: string, specimenId: number): boolean {
    const theme = getExhibitionTheme(themeId);
    if (!theme) return false;
    if (!theme.requiredSpecimenIds.includes(specimenId)) return false;
    if (!this.isSpecimenRestored(specimenId)) return false;
    if (this.isSpecimenSubmitted(themeId, specimenId)) return false;
    return true;
  }

  static submitSpecimenToExhibition(
    themeId: string,
    specimenId: number
  ): { success: boolean; submission?: ExhibitionSpecimenSubmission; achievementResult: AchievementUnlockResult } {
    if (!this.canSubmitToExhibition(themeId, specimenId)) {
      return { success: false, achievementResult: { newlyUnlocked: [], newlyUnlockedTitles: [], scoreGained: 0 } };
    }

    const themeProgress = this.data.exhibition.themeProgress[themeId];
    if (!themeProgress) return { success: false, achievementResult: { newlyUnlocked: [], newlyUnlockedTitles: [], scoreGained: 0 } };

    const allProgress = this.getAllProgress();
    let specimenStars = 0;
    let specimenBestTime = 0;
    let specimenBestScore = 0;

    for (const levelId of Object.keys(allProgress).map(Number)) {
      const levelProgress = allProgress[levelId];
      const level = Levels.find(l => l.id === levelId);
      if (level && level.specimen.id === specimenId) {
        if (levelProgress.stars > specimenStars) {
          specimenStars = levelProgress.stars;
        }
        if (specimenBestTime === 0 || (levelProgress.bestTime > 0 && levelProgress.bestTime < specimenBestTime)) {
          specimenBestTime = levelProgress.bestTime;
        }
        if (levelProgress.bestScore > specimenBestScore) {
          specimenBestScore = levelProgress.bestScore;
        }
      }
    }

    const submission: ExhibitionSpecimenSubmission = {
      specimenId,
      submittedAt: Date.now(),
      stars: specimenStars,
      bestTime: specimenBestTime,
      bestScore: specimenBestScore
    };

    themeProgress.submissions[specimenId] = submission;

    if (!themeProgress.participated) {
      themeProgress.participated = true;
      themeProgress.joinedAt = Date.now();
      this.data.exhibition.totalParticipations += 1;
    }

    themeProgress.lastSubmittedAt = Date.now();

    const achievementResult = AchievementManager.onExhibitionParticipation();
    if (achievementResult.scoreGained > 0) {
      this.data.totalScore += achievementResult.scoreGained;
    }

    this.save();
    return { success: true, submission, achievementResult };
  }

  static canClaimExhibitionReward(themeId: string, rewardId: number): boolean {
    const themeProgress = this.data.exhibition.themeProgress[themeId];
    const theme = getExhibitionTheme(themeId);
    if (!themeProgress || !theme) return false;

    const reward = theme.rewards.find(r => r.id === rewardId);
    if (!reward) return false;
    if (themeProgress.rewardsClaimed[rewardId]) return false;

    return themeProgress.totalScore >= reward.threshold;
  }

  static claimExhibitionReward(themeId: string, rewardId: number): ExhibitionReward | null {
    if (!this.canClaimExhibitionReward(themeId, rewardId)) return null;

    const themeProgress = this.data.exhibition.themeProgress[themeId];
    const theme = getExhibitionTheme(themeId);
    if (!themeProgress || !theme) return null;

    const reward = theme.rewards.find(r => r.id === rewardId)!;
    themeProgress.rewardsClaimed[rewardId] = true;

    switch (reward.type) {
      case 'score':
        if (reward.value) {
          this.data.totalScore += reward.value;
        }
        break;
      case 'badge':
        if (reward.badgeId) {
          this.data.exhibition.badges[reward.badgeId] = true;
          this.data.badges[reward.badgeId] = true;
          if (!themeProgress.badgesUnlocked.includes(reward.badgeId)) {
            themeProgress.badgesUnlocked.push(reward.badgeId);
          }
        }
        break;
      case 'fragment':
        if (reward.specimenId && reward.value) {
          this.addFragments(reward.specimenId, reward.value);
        }
        break;
      case 'material':
        if (reward.value) {
          this.addMaterials(1, reward.value);
        }
        break;
      case 'research_point':
        if (reward.value) {
          this.grantResearchPoints(reward.value);
        }
        break;
    }

    this.save();
    return reward;
  }

  static getClaimableExhibitionRewards(themeId: string): ExhibitionReward[] {
    const theme = getExhibitionTheme(themeId);
    if (!theme) return [];
    return theme.rewards.filter(r => this.canClaimExhibitionReward(themeId, r.id));
  }

  static updateExhibitionScores(
    themeId: string,
    scores: { completionScore: number; speedScore: number; starScore: number; totalScore: number }
  ): { isNewHighScore: boolean; oldScore: number } {
    const themeProgress = this.data.exhibition.themeProgress[themeId];
    if (!themeProgress) return { isNewHighScore: false, oldScore: 0 };

    const oldScore = themeProgress.totalScore;
    const isNewHighScore = scores.totalScore !== oldScore;

    themeProgress.completionScore = scores.completionScore;
    themeProgress.speedScore = scores.speedScore;
    themeProgress.starScore = scores.starScore;
    themeProgress.totalScore = scores.totalScore;

    this.data.exhibition.totalExhibitionScore = Object.values(this.data.exhibition.themeProgress)
      .reduce((sum, p) => sum + (p?.totalScore ?? 0), 0);

    this.save();
    return { isNewHighScore, oldScore };
  }

  static unlockExhibitionBadge(badgeId: number, themeId: string): boolean {
    const badgeRecord = getExhibitionBadge(badgeId);
    if (!badgeRecord) return false;

    const themeProgress = this.data.exhibition.themeProgress[themeId];
    if (!themeProgress) return false;

    if (!themeProgress.badgesUnlocked.includes(badgeId)) {
      themeProgress.badgesUnlocked.push(badgeId);
    }

    this.data.exhibition.badges[badgeId] = true;
    this.data.badges[badgeId] = true;

    this.save();
    return true;
  }

  static getAchievementSaveData(): AchievementSaveData {
    return { ...this.data.achievement, unlockedAchievements: { ...this.data.achievement.unlockedAchievements } };
  }

  static isAchievementUnlocked(achievementId: number): boolean {
    return this.data.achievement.unlockedAchievements[achievementId] ?? false;
  }

  static isTitleUnlocked(titleId: number): boolean {
    return this.data.achievement.unlockedTitles[titleId] ?? false;
  }

  static getCurrentTitleId(): number | null {
    return this.data.achievement.currentTitleId;
  }

  static setCurrentTitle(titleId: number | null): boolean {
    const result = AchievementManager.setCurrentTitle(titleId);
    if (result) {
      this.save();
    }
    return result;
  }

  static getTotalAchievementScore(): number {
    return this.data.achievement.totalAchievementScore;
  }

  static getLoginStreak(): number {
    return this.data.achievement.loginStreak;
  }

  static getTotalLogins(): number {
    return this.data.achievement.totalLogins;
  }

  static getUnlockedAchievementsCount(): number {
    return Object.values(this.data.achievement.unlockedAchievements).filter(Boolean).length;
  }

  static getUnlockedTitlesCount(): number {
    return Object.values(this.data.achievement.unlockedTitles).filter(Boolean).length;
  }

  static getTutorialSaveData(): TutorialSaveData {
    return { ...this.data.tutorial, progress: { ...this.data.tutorial.progress } };
  }

  static updateTutorialData(tutorialData: TutorialSaveData): void {
    this.data.tutorial = tutorialData;
    this.save();
  }

  static grantBadge(badgeId: number): void {
    this.data.badges[badgeId] = true;
    this.save();
  }

  static unlockGalleryItem(specimenId: number): void {
    if (!this.data.galleryUnlocked.includes(specimenId)) {
      this.data.galleryUnlocked.push(specimenId);
      this.save();
    }
  }

  static isTutorialCompleted(tutorialId: string): boolean {
    return this.data.tutorial.completedTutorials.includes(tutorialId);
  }

  static isTeachingLevelCompleted(): boolean {
    return this.data.tutorial.teachingLevelCompleted;
  }

  static isFirstTimePlayer(): boolean {
    return this.data.tutorial.firstTimePlayer;
  }

  static getCompletedTutorialsCount(): number {
    return this.data.tutorial.completedTutorials.length;
  }

  static getConservationSaveData(): ConservationSaveData {
    return { ...this.data.conservation, specimens: { ...this.data.conservation.specimens } };
  }

  static getConservationHealth(specimenId: number): number {
    return ConservationManager.getHealth(specimenId);
  }

  static getConservationHealthLevel(specimenId: number): ConservationHealthLevel {
    return ConservationManager.getHealthLevel(specimenId);
  }

  static save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  static reset(): void {
    this.data = this.createDefaultSave();
    this.save();
  }
}
