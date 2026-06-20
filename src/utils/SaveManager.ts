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
  TutorialSaveData,
  CustomPuzzleRecord,
  RepairLogSaveData,
  QuizSaveData,
  ChapterMapSaveData,
  BranchRouteProgress,
  BranchRouteType,
  MapNodeData,
  EndingData,
  DonationSaveData,
  DonationProgress,
  RandomEventSaveData,
  PuzzleSaveData,
  PuzzleSaves,
  PuzzlePieceSaveData,
  LevelProgressResult,
  ReplayData,
  ReplaySaveData,
  SaveMetadata,
  SaveMigrationLogEntry,
  HiddenLevelProgress,
  HiddenLevelTrigger
} from '../types/GameTypes';
import { TutorialManager } from './TutorialManager';
import { ConservationManager } from './ConservationManager';
import { Levels, EventGalleryItems } from '../data/Levels';
import { Chapters, getChapterById, getChapterByLevelId, getNextChapter, getRewardsByChapterId, getHiddenLevelsForChapter, getChapterUnlockCondition, isHiddenLevel, getHiddenLevelChapterId, getHiddenLevelData } from '../data/Chapters';
import { getPlantSpecimen } from '../data/PlantSpecimens';
import { BranchRoutes, BranchRoutesList, getMapNode, getNextNodes, getPrevNodes, getRouteEnding, getRouteByNodeId, getRouteLevelIds } from '../data/BranchRoutes';
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
import { SeasonPassManager } from './SeasonPassManager';
import { SeasonPassSaveData, NotificationSaveData } from '../types/GameTypes';
import { RepairLogManager } from './RepairLogManager';
import { NotificationManager } from './NotificationManager';
import { QuizManager } from './QuizManager';
import { DonationManager } from './DonationManager';
import { RandomEventManager } from './RandomEventManager';

const STORAGE_KEY = 'plant_specimen_puzzle_save';
const BACKUP_STORAGE_KEY = 'plant_specimen_puzzle_save_backup';
const CURRENT_SCHEMA_VERSION = 1;
const MAX_BACKUPS = 3;
const MAX_MIGRATION_LOGS = 50;

export class SaveManager {
  private static data: SaveData;

  private static isObject(value: any): value is Record<string, any> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  private static deepMerge<T extends Record<string, any>>(target: Partial<T>, source: T): T {
    const result: Record<string, any> = { ...target };
    for (const key of Object.keys(source)) {
      const sourceValue = source[key];
      const targetValue = (target as any)[key];
      if (this.isObject(sourceValue)) {
        if (this.isObject(targetValue)) {
          result[key] = this.deepMerge(targetValue, sourceValue);
        } else {
          result[key] = this.deepMerge({}, sourceValue);
        }
      } else if (Array.isArray(sourceValue)) {
        result[key] = Array.isArray(targetValue) ? [...targetValue] : [...sourceValue];
      } else {
        result[key] = targetValue !== undefined ? targetValue : sourceValue;
      }
    }
    return result as T;
  }

  private static computeChecksum(data: any): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  private static createDefaultMetadata(): SaveMetadata {
    const now = Date.now();
    return {
      createdAt: now,
      updatedAt: now,
      saveCount: 0,
      migrationLog: []
    };
  }

  private static writeBackup(data: SaveData): void {
    try {
      const existingBackups = this.readBackups();
      existingBackups.unshift({ version: data.schemaVersion, timestamp: Date.now(), data });
      const trimmed = existingBackups.slice(0, MAX_BACKUPS);
      localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(trimmed));
    } catch (e) {
      console.warn('[SaveManager] Failed to write backup:', e);
    }
  }

  private static readBackups(): Array<{ version: number; timestamp: number; data: SaveData }> {
    try {
      const raw = localStorage.getItem(BACKUP_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private static restoreFromBackup(): SaveData | null {
    const backups = this.readBackups();
    for (const backup of backups) {
      try {
        const migrated = this.migrateSaveData(backup.data);
        if (migrated) {
          console.info(`[SaveManager] Restored from backup (version ${backup.version}, saved at ${new Date(backup.timestamp).toISOString()}`);
          return migrated;
        }
      } catch (e) {
        console.warn('[SaveManager] Backup restore failed, trying next:', e);
      }
    }
    return null;
  }

  private static logMigration(fromVersion: number, toVersion: number, success: boolean, errorMessage?: string): void {
    if (!this.data) return;
    const entry: SaveMigrationLogEntry = {
      fromVersion,
      toVersion,
      migratedAt: Date.now(),
      success,
      errorMessage
    };
    this.data.metadata.migrationLog.unshift(entry);
    if (this.data.metadata.migrationLog.length > MAX_MIGRATION_LOGS) {
      this.data.metadata.migrationLog = this.data.metadata.migrationLog.slice(0, MAX_MIGRATION_LOGS);
    }
    this.data.metadata.lastMigrationAt = entry.migratedAt;
  }

  static init(): void {
    const saved = localStorage.getItem(STORAGE_KEY);
    let loadedSuccessfully = false;

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.data = this.migrateSaveData(parsed);
        loadedSuccessfully = true;
      } catch (e) {
          console.warn('[SaveManager] Failed to parse save data, attempting backup restore:', e);
        }
    }

    if (!loadedSuccessfully) {
      const restored = this.restoreFromBackup();
      if (restored) {
        this.data = restored;
        loadedSuccessfully = true;
      } else {
        this.data = this.createDefaultSave();
      }
    }

    if (!this.data.schemaVersion) {
      this.data.schemaVersion = CURRENT_SCHEMA_VERSION;
    }
    if (!this.data.metadata) {
      this.data.metadata = this.createDefaultMetadata();
    }

    this.recalculateTotalScore();
    this.updateChapterProgress();
    this.syncChapterUnlocks();
    this.syncHiddenLevelProgress();
    this.syncFamilyProgress();
    this.syncRouteUnlocks();
    DailyQuestManager.init(this.data.dailyQuest);
    AchievementManager.init(this.data.achievement);
    TutorialManager.init(this.data.tutorial);
    ConservationManager.init(this.data.conservation);
    SeasonPassManager.init(this.data.seasonPass);
    RepairLogManager.init(this.data.repairLog);
    NotificationManager.init(this.data.notification);
    QuizManager.init(this.data.quiz);
    DonationManager.init(this.data.donation);
    RandomEventManager.init(this.data.randomEvent);
    this.data.notification = NotificationManager.getSaveData();
    this.data.quiz = QuizManager.getSaveData();
    this.data.donation = DonationManager.getSaveData();
    this.data.randomEvent = RandomEventManager.getSaveData();
    this.save();
  }

  private static readonly migrationFunctions: Record<number, (data: any) => any> = {
    0: (data: any) => this.migrateV0ToV1(data),
  };

  private static migrateV0ToV1(data: any): any {
    const defaultData = this.createDefaultSave();
    const migrated: any = { ...data };

    if (!migrated.chapterProgress) {
      migrated.chapterProgress = defaultData.chapterProgress;
    }
    if (!migrated.badges) {
      migrated.badges = defaultData.badges;
    }
    if (!migrated.unlockedChapters) {
      migrated.unlockedChapters = [1];
    }
    if (!migrated.galleryUnlocked) {
      migrated.galleryUnlocked = [];
    }
    if (!migrated.galleryUnlockTimes) {
      migrated.galleryUnlockTimes = {};
    }
    if (!migrated.workshop) {
      migrated.workshop = defaultData.workshop;
    }
    if (!migrated.event) {
      migrated.event = defaultData.event;
    } else {
      if (!migrated.event.eventProgress) {
        migrated.event.eventProgress = defaultData.event.eventProgress;
      }
      if (!migrated.event.eventBadges) {
        migrated.event.eventBadges = defaultData.event.eventBadges;
      }
      if (!migrated.event.eventGalleryUnlocked) {
        migrated.event.eventGalleryUnlocked = defaultData.event.eventGalleryUnlocked;
      }
      if (!migrated.event.eventGalleryUnlockTimes) {
        migrated.event.eventGalleryUnlockTimes = {};
      }
      if (!migrated.event.rankingCache) {
        migrated.event.rankingCache = defaultData.event.rankingCache;
      }
    }
    if (!migrated.dailyQuest) {
      migrated.dailyQuest = defaultData.dailyQuest;
    } else {
      if (!migrated.dailyQuest.quests) {
        migrated.dailyQuest.quests = defaultData.dailyQuest.quests;
      }
      if (!migrated.dailyQuest.progress) {
        migrated.dailyQuest.progress = defaultData.dailyQuest.progress;
      }
      if (!migrated.dailyQuest.claimedQuestIds) {
        migrated.dailyQuest.claimedQuestIds = defaultData.dailyQuest.claimedQuestIds;
      }
      if (migrated.dailyQuest.lastRefreshDate === undefined) {
        migrated.dailyQuest.lastRefreshDate = defaultData.dailyQuest.lastRefreshDate;
      }
      if (migrated.dailyQuest.refreshCount === undefined) {
        migrated.dailyQuest.refreshCount = defaultData.dailyQuest.refreshCount;
      }
      if (migrated.dailyQuest.totalCompleted === undefined) {
        migrated.dailyQuest.totalCompleted = defaultData.dailyQuest.totalCompleted;
      }
      if (migrated.dailyQuest.totalClaimed === undefined) {
        migrated.dailyQuest.totalClaimed = defaultData.dailyQuest.totalClaimed;
      }
    }

    if (migrated.workshop?.restoredSpecimens) {
      migrated.workshop.restoredSpecimens.forEach((specimenId: number) => {
        if (!migrated.galleryUnlocked.includes(specimenId)) {
          migrated.galleryUnlocked.push(specimenId);
        }
      });
    }

    if (!migrated.researchLab) {
      migrated.researchLab = defaultData.researchLab;
    } else {
      if (!migrated.researchLab.specimens) {
        migrated.researchLab.specimens = defaultData.researchLab.specimens;
      }
      if (migrated.researchLab.totalExp === undefined) {
        migrated.researchLab.totalExp = 0;
      }
      if (migrated.researchLab.researcherLevel === undefined) {
        migrated.researchLab.researcherLevel = 1;
      }
      if (migrated.researchLab.researchPoints === undefined) {
        migrated.researchLab.researchPoints = 0;
      }
      if (migrated.researchLab.totalStudies === undefined) {
        migrated.researchLab.totalStudies = 0;
      }
    }

    if (!migrated.tower) {
      migrated.tower = defaultData.tower;
    } else {
      if (!migrated.tower.floorProgress) {
        migrated.tower.floorProgress = defaultData.tower.floorProgress;
      }
      if (!migrated.tower.badges) {
        migrated.tower.badges = defaultData.tower.badges;
      }
      if (migrated.tower.highestFloor === undefined) {
        migrated.tower.highestFloor = 0;
      }
      if (migrated.tower.totalStars === undefined) {
        migrated.tower.totalStars = 0;
      }
      if (migrated.tower.totalScore === undefined) {
        migrated.tower.totalScore = 0;
      }
      if (migrated.tower.currentStreak === undefined) {
        migrated.tower.currentStreak = 0;
      }
      if (migrated.tower.bestStreak === undefined) {
        migrated.tower.bestStreak = 0;
      }
      if (migrated.tower.totalAttempts === undefined) {
        migrated.tower.totalAttempts = 0;
      }
      if (migrated.tower.totalCompletions === undefined) {
        migrated.tower.totalCompletions = 0;
      }
    }

    if (!migrated.exhibition) {
      migrated.exhibition = defaultData.exhibition;
    } else {
      if (!migrated.exhibition.themeProgress) {
        migrated.exhibition.themeProgress = defaultData.exhibition.themeProgress;
      }
      if (!migrated.exhibition.badges) {
        migrated.exhibition.badges = defaultData.exhibition.badges;
      }
      if (migrated.exhibition.totalExhibitionScore === undefined) {
        migrated.exhibition.totalExhibitionScore = 0;
      }
      if (migrated.exhibition.totalParticipations === undefined) {
        migrated.exhibition.totalParticipations = 0;
      }
    }

    if (!migrated.achievement) {
      migrated.achievement = defaultData.achievement;
    } else {
      if (!migrated.achievement.unlockedAchievements) {
        migrated.achievement.unlockedAchievements = defaultData.achievement.unlockedAchievements;
      }
      if (!migrated.achievement.unlockedTitles) {
        migrated.achievement.unlockedTitles = defaultData.achievement.unlockedTitles;
      }
      if (migrated.achievement.currentTitleId === undefined) {
        migrated.achievement.currentTitleId = null;
      }
      if (!migrated.achievement.achievementProgress) {
        migrated.achievement.achievementProgress = defaultData.achievement.achievementProgress;
      }
      if (migrated.achievement.loginStreak === undefined) {
        migrated.achievement.loginStreak = 0;
      }
      if (migrated.achievement.lastLoginDate === undefined) {
        migrated.achievement.lastLoginDate = '';
      }
      if (migrated.achievement.totalLogins === undefined) {
        migrated.achievement.totalLogins = 0;
      }
      if (!migrated.achievement.fastestCompletion) {
        migrated.achievement.fastestCompletion = defaultData.achievement.fastestCompletion;
      }
      if (!migrated.achievement.perfectLevels) {
        migrated.achievement.perfectLevels = [];
      }
      if (migrated.achievement.totalAchievementScore === undefined) {
        migrated.achievement.totalAchievementScore = 0;
      }
    }

    if (!migrated.tutorial) {
      migrated.tutorial = defaultData.tutorial;
    } else {
      if (!migrated.tutorial.completedTutorials) {
        migrated.tutorial.completedTutorials = defaultData.tutorial.completedTutorials;
      }
      if (!migrated.tutorial.skippedTutorials) {
        migrated.tutorial.skippedTutorials = defaultData.tutorial.skippedTutorials;
      }
      if (migrated.tutorial.currentTutorialId === undefined) {
        migrated.tutorial.currentTutorialId = defaultData.tutorial.currentTutorialId;
      }
      if (!migrated.tutorial.progress) {
        migrated.tutorial.progress = defaultData.tutorial.progress;
      } else {
        Object.keys(migrated.tutorial.progress).forEach(key => {
          const p = migrated.tutorial.progress[key];
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
      if (migrated.tutorial.teachingLevelCompleted === undefined) {
        migrated.tutorial.teachingLevelCompleted = defaultData.tutorial.teachingLevelCompleted;
      }
      if (migrated.tutorial.teachingLevelSkipped === undefined) {
        migrated.tutorial.teachingLevelSkipped = defaultData.tutorial.teachingLevelSkipped;
      }
      if (migrated.tutorial.firstTimePlayer === undefined) {
        migrated.tutorial.firstTimePlayer = defaultData.tutorial.firstTimePlayer;
      }
      if (!migrated.tutorial.rewardsClaimed) {
        migrated.tutorial.rewardsClaimed = defaultData.tutorial.rewardsClaimed;
      }
    }

    if (!migrated.conservation) {
      migrated.conservation = defaultData.conservation;
    } else {
      if (!migrated.conservation.specimens) {
        migrated.conservation.specimens = defaultData.conservation.specimens;
      }
      if (migrated.conservation.totalCares === undefined) {
        migrated.conservation.totalCares = 0;
      }
      if (migrated.conservation.decayAccumulator === undefined) {
        migrated.conservation.decayAccumulator = 0;
      }
      if (migrated.conservation.lastDecayProcessTime === undefined) {
        migrated.conservation.lastDecayProcessTime = Date.now();
      }
      if (!migrated.conservation.dismissedReminders) {
        migrated.conservation.dismissedReminders = [];
      }
    }

    if (!migrated.familyCollection) {
      migrated.familyCollection = defaultData.familyCollection;
    } else {
      if (!migrated.familyCollection.familyProgress) {
        migrated.familyCollection.familyProgress = defaultData.familyCollection.familyProgress;
      }
      if (migrated.familyCollection.totalFamiliesCompleted === undefined) {
        migrated.familyCollection.totalFamiliesCompleted = 0;
      }
      if (!migrated.familyCollection.totalSpecimensByFamily) {
        migrated.familyCollection.totalSpecimensByFamily = defaultData.familyCollection.totalSpecimensByFamily;
      }
    }

    if (!migrated.seasonPass) {
      migrated.seasonPass = defaultData.seasonPass;
    } else {
      if (!migrated.seasonPass.trackProgress) {
        migrated.seasonPass.trackProgress = defaultData.seasonPass.trackProgress;
      }
      if (!migrated.seasonPass.rewardsClaimed) {
        migrated.seasonPass.rewardsClaimed = defaultData.seasonPass.rewardsClaimed;
      }
      if (!migrated.seasonPass.quests) {
        migrated.seasonPass.quests = defaultData.seasonPass.quests;
      }
      if (migrated.seasonPass.lastRefreshDate === undefined) {
        migrated.seasonPass.lastRefreshDate = '';
      }
      if (migrated.seasonPass.refreshCount === undefined) {
        migrated.seasonPass.refreshCount = 0;
      }
      if (migrated.seasonPass.totalRestores === undefined) {
        migrated.seasonPass.totalRestores = 0;
      }
      if (migrated.seasonPass.totalScoreGain === undefined) {
        migrated.seasonPass.totalScoreGain = 0;
      }
      if (migrated.seasonPass.totalGalleryUnlocks === undefined) {
        migrated.seasonPass.totalGalleryUnlocks = 0;
      }
      if (migrated.seasonPass.completedQuests === undefined) {
        migrated.seasonPass.completedQuests = 0;
      }
      if (migrated.seasonPass.claimedQuests === undefined) {
        migrated.seasonPass.claimedQuests = 0;
      }
      if (!migrated.seasonPass.pendingRewards) {
        migrated.seasonPass.pendingRewards = [];
      }
      if (migrated.seasonPass.isPremium === undefined) {
        migrated.seasonPass.isPremium = false;
      }
    }

    if (!migrated.customPuzzle) {
      migrated.customPuzzle = { records: {}, totalPlays: 0, totalScore: 0 };
    }

    if (!migrated.repairLog) {
      migrated.repairLog = { entries: [], totalEntries: 0 };
    }

    if (!migrated.notification) {
      migrated.notification = NotificationManager.createDefaultNotificationSave();
    } else {
      if (!migrated.notification.notifications) {
        migrated.notification.notifications = [];
      }
      if (migrated.notification.lastCheckTime === undefined) {
        migrated.notification.lastCheckTime = Date.now();
      }
      if (migrated.notification.lastStreakCheckDate === undefined) {
        migrated.notification.lastStreakCheckDate = '';
      }
      if (!migrated.notification.dismissedNotificationIds) {
        migrated.notification.dismissedNotificationIds = [];
      }
      if (migrated.notification.maxStored === undefined) {
        migrated.notification.maxStored = 100;
      }
    }

    if (!migrated.quiz) {
      migrated.quiz = QuizManager.createDefaultQuizSave();
    } else {
      if (!migrated.quiz.quizProgress) {
        migrated.quiz.quizProgress = QuizManager.createDefaultQuizSave().quizProgress;
      }
      if (migrated.quiz.totalQuizScore === undefined) {
        migrated.quiz.totalQuizScore = 0;
      }
      if (migrated.quiz.totalQuizzesCompleted === undefined) {
        migrated.quiz.totalQuizzesCompleted = 0;
      }
      if (migrated.quiz.totalCorrectAnswers === undefined) {
        migrated.quiz.totalCorrectAnswers = 0;
      }
      if (migrated.quiz.totalQuestionsAnswered === undefined) {
        migrated.quiz.totalQuestionsAnswered = 0;
      }
      if (migrated.quiz.currentStreak === undefined) {
        migrated.quiz.currentStreak = 0;
      }
      if (migrated.quiz.bestStreak === undefined) {
        migrated.quiz.bestStreak = 0;
      }
    }

    if (!migrated.chapterMap) {
      migrated.chapterMap = defaultData.chapterMap;
    } else {
      if (!migrated.chapterMap.routeProgress) {
        migrated.chapterMap.routeProgress = defaultData.chapterMap.routeProgress;
      }
      if (migrated.chapterMap.totalRoutesCompleted === undefined) {
        migrated.chapterMap.totalRoutesCompleted = 0;
      }
      if (!migrated.chapterMap.activeRouteId) {
        migrated.chapterMap.activeRouteId = 'flower';
      }
      if (!migrated.chapterMap.unlockedRoutes) {
        migrated.chapterMap.unlockedRoutes = ['flower'];
      }
      if (!migrated.chapterMap.endingsViewed) {
        migrated.chapterMap.endingsViewed = [];
      }
    }

    if (!migrated.donation) {
      migrated.donation = defaultData.donation;
    } else {
      if (!migrated.donation.progress) {
        migrated.donation.progress = defaultData.donation.progress;
      } else {
        const p = migrated.donation.progress;
        if (p.totalDonations === undefined) p.totalDonations = 0;
        if (p.totalResearchCoin === undefined) p.totalResearchCoin = 0;
        if (p.totalResearchCoinEarned === undefined) p.totalResearchCoinEarned = 0;
        if (!p.donationsBySpecimen) p.donationsBySpecimen = {};
        if (!p.donations) p.donations = [];
        if (!p.rewardsClaimed) p.rewardsClaimed = {};
        if (p.tierProgress === undefined) p.tierProgress = 0;

        const defaultRewards = defaultData.donation.progress.rewardsClaimed;
        Object.keys(defaultRewards).forEach(key => {
          const id = parseInt(key);
          if (p.rewardsClaimed[id] === undefined) {
            p.rewardsClaimed[id] = false;
          }
        });
      }
    }

    if (!migrated.replay) {
      migrated.replay = { replays: [], maxReplaysPerLevel: 3 };
    }

    if (!migrated.randomEvent) {
      migrated.randomEvent = defaultData.randomEvent;
    }

    if (!migrated.puzzleSaves) {
      migrated.puzzleSaves = defaultData.puzzleSaves;
    }

    const fallbackTime = migrated.metadata?.createdAt || Date.now();
    if (migrated.galleryUnlocked && migrated.galleryUnlockTimes) {
      migrated.galleryUnlocked.forEach((specimenId: number) => {
        if (!migrated.galleryUnlockTimes[specimenId]) {
          migrated.galleryUnlockTimes[specimenId] = fallbackTime;
        }
      });
    }
    if (migrated.event?.eventGalleryUnlocked && migrated.event?.eventGalleryUnlockTimes) {
      migrated.event.eventGalleryUnlocked.forEach((specimenId: number) => {
        if (!migrated.event.eventGalleryUnlockTimes[specimenId]) {
          migrated.event.eventGalleryUnlockTimes[specimenId] = fallbackTime;
        }
      });
    }

    return migrated;
  }

  private static migrateSaveData(oldData: any): SaveData {
    const fromVersion: number = typeof oldData?.schemaVersion === 'number' ? oldData.schemaVersion : 0;
    let data = { ...oldData };
    let currentVersion: number = fromVersion;

    try {
      while (currentVersion < CURRENT_SCHEMA_VERSION) {
        const migrationFn = this.migrationFunctions[currentVersion];
        if (migrationFn) {
          data = migrationFn(data);
        }
        currentVersion += 1;
      }

      const defaultData = this.createDefaultSave();
      const merged = this.deepMerge(data, defaultData);

      merged.schemaVersion = CURRENT_SCHEMA_VERSION;
      if (!merged.metadata) {
        merged.metadata = this.createDefaultMetadata();
      }

      const fallbackTime = merged.metadata?.createdAt || Date.now();
      if (merged.galleryUnlocked && merged.galleryUnlockTimes) {
        merged.galleryUnlocked.forEach((specimenId: number) => {
          if (!merged.galleryUnlockTimes[specimenId]) {
            merged.galleryUnlockTimes[specimenId] = fallbackTime;
          }
        });
      }
      if (merged.event?.eventGalleryUnlocked && merged.event?.eventGalleryUnlockTimes) {
        merged.event.eventGalleryUnlocked.forEach((specimenId: number) => {
          if (!merged.event.eventGalleryUnlockTimes[specimenId]) {
            merged.event.eventGalleryUnlockTimes[specimenId] = fallbackTime;
          }
        });
      }

      this.logMigration(fromVersion, CURRENT_SCHEMA_VERSION, true);

      return merged as SaveData;
    } catch (error: any) {
      console.error(`[SaveManager] Migration failed from v${fromVersion}:`, error);
      this.logMigration(fromVersion, CURRENT_SCHEMA_VERSION, false, error?.message);
      const fallback = this.createDefaultSave();
      return this.deepMerge(data, fallback) as SaveData;
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

    const chapterProgress: Record<number, ChapterProgress> = {};
    Chapters.forEach((chapter, index) => {
      const hiddenLevelProgress: Record<number, HiddenLevelProgress> = {};
      chapter.hiddenLevels?.forEach(hl => {
        hiddenLevelProgress[hl.levelRuleId] = {
          levelId: hl.levelRuleId,
          revealed: false,
          unlocked: false
        };
      });

      chapterProgress[chapter.id] = {
        chapterId: chapter.id,
        unlocked: index === 0,
        completed: false,
        totalStars: 0,
        rewardsClaimed: false,
        hiddenLevelProgress
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
    const seasonPassData = this.createDefaultSeasonPassSave();
    const chapterMapData = this.createDefaultChapterMapSave();
    const donationData = DonationManager.createDefaultSave();

    return {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      metadata: this.createDefaultMetadata(),
      progress,
      chapterProgress,
      badges,
      totalScore: 0,
      unlockedLevels: [1],
      unlockedChapters: [1],
      galleryUnlocked: [],
      galleryUnlockTimes: {},
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
      familyCollection: familyCollectionData,
      seasonPass: seasonPassData,
      customPuzzle: { records: {}, totalPlays: 0, totalScore: 0 },
      repairLog: RepairLogManager.createDefaultSave(),
      notification: NotificationManager.createDefaultNotificationSave(),
      quiz: QuizManager.createDefaultQuizSave(),
      chapterMap: chapterMapData,
      donation: donationData,
      randomEvent: RandomEventManager.createDefaultSave(),
      puzzleSaves: { saves: {}, maxSavesPerLevel: 3 },
      replay: { replays: [], maxReplaysPerLevel: 3 }
    };
  }

  private static createDefaultSeasonPassSave(): SeasonPassSaveData {
    const CURRENT_SEASON_ID = 'season_001';
    const CURRENT_SEASON_NAME = '春华秋实赛季';
    const SEASON_DURATION_DAYS = 60;
    const MAX_TRACK_LEVEL = 20;

    const now = Date.now();
    const endDate = now + SEASON_DURATION_DAYS * 24 * 60 * 60 * 1000;

    const createTrackProgress = (trackType: 'restore' | 'score' | 'gallery') => ({
      trackType,
      currentValue: 0,
      currentLevel: 0,
      maxLevel: MAX_TRACK_LEVEL,
      nextLevelThreshold: 0,
      totalXp: 0
    });

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
      rewardsClaimed: {
        restore: {},
        score: {},
        gallery: {}
      },
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

  private static createDefaultChapterMapSave(): ChapterMapSaveData {
    const routeProgress: Record<BranchRouteType, BranchRouteProgress> = {} as Record<BranchRouteType, BranchRouteProgress>;
    
    BranchRoutesList.forEach((route, index) => {
      const rewardsClaimed: Record<string, boolean> = {};
      route.nodes.forEach(node => {
        if (node.rewards) {
          rewardsClaimed[node.id] = false;
        }
      });

      routeProgress[route.id] = {
        routeId: route.id,
        unlocked: index === 0,
        completed: false,
        currentNodeId: route.startingNodeId,
        completedNodeIds: [],
        unlockedNodeIds: index === 0 ? [route.startingNodeId] : [],
        totalStars: 0,
        rewardsClaimed,
        endingViewed: false
      };
    });

    return {
      routeProgress,
      totalRoutesCompleted: 0,
      activeRouteId: 'flower',
      unlockedRoutes: ['flower'],
      endingsViewed: []
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
      eventGalleryUnlockTimes: {},
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

  static getGalleryUnlockTime(specimenId: number): number | null {
    if (this.data.galleryUnlockTimes[specimenId]) {
      return this.data.galleryUnlockTimes[specimenId];
    }
    if (this.data.event.eventGalleryUnlockTimes[specimenId]) {
      return this.data.event.eventGalleryUnlockTimes[specimenId];
    }
    return null;
  }

  static hasBadge(badgeId: number): boolean {
    return this.data.badges[badgeId] ?? false;
  }

  static completeLevel(
    levelId: number,
    score: number,
    time: number,
    stars: number,
    stats?: { accuracy?: number; combo?: number; perfectSnaps?: number; rotations?: number; hintTime?: number }
  ): {
    chapterCompleted: boolean;
    completedChapterId: number | null;
    newlyUnlockedChapterId: number | null;
    updatedQuests: DailyQuest[];
    researchRewards: { pointsGained: number; expGained: number };
    achievementResult: AchievementUnlockResult;
    conservationInfo: {
      specimenId: number | null;
      healthLevel: ConservationHealthLevel | null;
      scoreMultiplier: number;
      researchMultiplier: number;
      finalScore: number;
      finalPoints: number;
    };
    familyProgressResult: {
      familyCompleted: boolean;
      familyId: string | null;
      newlyUnlockedRewardIds: number[];
      illustrationUnlocked: boolean;
    };
    levelProgress: LevelProgressResult;
  } {
    const progress = this.data.progress[levelId];
    if (!progress) return {
      chapterCompleted: false,
      completedChapterId: null,
      newlyUnlockedChapterId: null,
      updatedQuests: [],
      researchRewards: { pointsGained: 0, expGained: 0 },
      achievementResult: { newlyUnlocked: [], newlyUnlockedTitles: [], scoreGained: 0 },
      conservationInfo: {
        specimenId: null,
        healthLevel: null,
        scoreMultiplier: 1,
        researchMultiplier: 1,
        finalScore: 0,
        finalPoints: 0
      },
      familyProgressResult: {
        familyCompleted: false,
        familyId: null,
        newlyUnlockedRewardIds: [],
        illustrationUnlocked: false
      },
      levelProgress: {
        previousStars: 0,
        previousBestScore: 0,
        previousBestTime: 0,
        isNewRecord: false,
        isNewBestTime: false,
        starsImproved: false
      }
    };

    const previousStars = progress.stars;
    const previousBestScore = progress.bestScore;
    const previousBestTime = progress.bestTime;

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
    if (this.data.progress[nextLevelId] && !isHiddenLevel(nextLevelId)) {
      this.data.progress[nextLevelId].unlocked = true;
      if (!this.data.unlockedLevels.includes(nextLevelId)) {
        this.data.unlockedLevels.push(nextLevelId);
      }
    }

    this.recalculateTotalScore();
    this.updateChapterProgress();

    const completionResult = this.checkChapterCompletion(levelId);
    const unlockResult = this.syncChapterUnlocks();

    const levelChapter = getChapterByLevelId(levelId);
    if (levelChapter) {
      this.checkAndRevealHiddenLevels(levelChapter.id);
    }

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

    SeasonPassManager.onRestore(specimenId, levelId);
    const scoreDiff = progress.bestScore > 0 
      ? Math.max(0, finalScore - (progress.bestScore - finalScore))
      : finalScore;
    SeasonPassManager.onScoreGain(scoreDiff, levelId, score);

    this.data.seasonPass = SeasonPassManager.getSaveData();
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
      familyProgressResult,
      levelProgress: {
        previousStars,
        previousBestScore,
        previousBestTime,
        isNewRecord: score > previousBestScore,
        isNewBestTime: previousBestTime === 0 || time < previousBestTime,
        starsImproved
      }
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

  private static syncHiddenLevelProgress(): void {
    Chapters.forEach(chapter => {
      if (!chapter.hiddenLevels || chapter.hiddenLevels.length === 0) return;

      const chapterProgress = this.data.chapterProgress[chapter.id];
      if (!chapterProgress) return;

      if (!chapterProgress.hiddenLevelProgress) {
        chapterProgress.hiddenLevelProgress = {};
      }

      chapter.hiddenLevels.forEach(hl => {
        if (!chapterProgress.hiddenLevelProgress![hl.levelRuleId]) {
          chapterProgress.hiddenLevelProgress![hl.levelRuleId] = {
            levelId: hl.levelRuleId,
            revealed: false,
            unlocked: false
          };
        }
      });

      for (const hiddenLevel of chapter.hiddenLevels) {
        const hlProgress = chapterProgress.hiddenLevelProgress[hiddenLevel.levelRuleId];
        if (!hlProgress) continue;

        if (!hlProgress.revealed) {
          const allTriggersMet = hiddenLevel.triggers.every(t => this.checkHiddenLevelTrigger(t));
          if (allTriggersMet) {
            hlProgress.revealed = true;
            hlProgress.revealedAt = hlProgress.revealedAt || Date.now();
            hlProgress.unlocked = true;
            hlProgress.unlockedAt = hlProgress.unlockedAt || Date.now();

            if (!this.data.progress[hiddenLevel.levelRuleId]) {
              this.data.progress[hiddenLevel.levelRuleId] = {
                levelId: hiddenLevel.levelRuleId,
                unlocked: true,
                bestScore: 0,
                bestTime: 0,
                stars: 0,
                completed: false
              };
            } else {
              this.data.progress[hiddenLevel.levelRuleId].unlocked = true;
            }

            if (!this.data.unlockedLevels.includes(hiddenLevel.levelRuleId)) {
              this.data.unlockedLevels.push(hiddenLevel.levelRuleId);
            }
          }
        }
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

      const condition = chapter.unlockCondition;
      let canUnlock = totalStars >= chapter.requiredStars;

      if (condition) {
        if (condition.prevChapterCompleted) {
          const prevChapter = Chapters.find(c => c.id === chapter.id - 1);
          const prevCompleted = prevChapter ? this.data.chapterProgress[prevChapter.id]?.completed ?? false : true;
          canUnlock = canUnlock && prevCompleted;
        }

        if (condition.prevChapterStarThreshold !== undefined) {
          const prevChapter = Chapters.find(c => c.id === chapter.id - 1);
          if (prevChapter) {
            const prevStars = this.getChapterStars(prevChapter.id);
            canUnlock = canUnlock && prevStars >= condition.prevChapterStarThreshold;
          }
        }

        if (condition.requiredGalleryIds && condition.requiredGalleryIds.length > 0) {
          const unlockedGallery = this.getUnlockedGalleryItems();
          canUnlock = canUnlock && condition.requiredGalleryIds.every(id => unlockedGallery.includes(id));
        }
      }

      if (canUnlock) {
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

  static isHiddenLevelRevealed(chapterId: number, levelId: number): boolean {
    return this.data.chapterProgress[chapterId]?.hiddenLevelProgress?.[levelId]?.revealed ?? false;
  }

  static isHiddenLevelUnlocked(chapterId: number, levelId: number): boolean {
    return this.data.chapterProgress[chapterId]?.hiddenLevelProgress?.[levelId]?.unlocked ?? false;
  }

  static getHiddenLevelProgress(chapterId: number, levelId: number): HiddenLevelProgress | undefined {
    return this.data.chapterProgress[chapterId]?.hiddenLevelProgress?.[levelId];
  }

  static checkHiddenLevelTrigger(trigger: HiddenLevelTrigger): boolean {
    switch (trigger.type) {
      case 'chapter_perfect': {
        if (trigger.chapterId === undefined || trigger.requiredStars === undefined) return false;
        const chapterStars = this.getChapterStars(trigger.chapterId);
        return chapterStars >= trigger.requiredStars;
      }
      case 'chapters_completed': {
        if (!trigger.requiredChapterIds || trigger.requiredChapterIds.length === 0) return false;
        return trigger.requiredChapterIds.every(id => {
          const cp = this.data.chapterProgress[id];
          return cp?.completed === true;
        });
      }
      case 'gallery_collect': {
        if (!trigger.requiredGalleryIds || trigger.requiredGalleryIds.length === 0) return false;
        const unlockedGallery = this.getUnlockedGalleryItems();
        return trigger.requiredGalleryIds.every(id => unlockedGallery.includes(id));
      }
      case 'star_threshold': {
        if (trigger.chapterId === undefined || trigger.requiredStars === undefined) return false;
        const chapterStars = this.getChapterStars(trigger.chapterId);
        return chapterStars >= trigger.requiredStars;
      }
      case 'speed_clear': {
        if (trigger.maxTimeSeconds === undefined) return false;
        const progress = this.data.progress[trigger.chapterId ?? 0];
        return progress?.completed === true && progress.bestTime > 0 && progress.bestTime <= trigger.maxTimeSeconds;
      }
      case 'combo_achieve': {
        if (trigger.requiredCombo === undefined) return false;
        return false;
      }
      default:
        return false;
    }
  }

  static checkAndRevealHiddenLevels(chapterId: number): number[] {
    const chapter = getChapterById(chapterId);
    if (!chapter || !chapter.hiddenLevels) return [];

    const chapterProgress = this.data.chapterProgress[chapterId];
    if (!chapterProgress) return [];

    if (!chapterProgress.hiddenLevelProgress) {
      chapterProgress.hiddenLevelProgress = {};
      chapter.hiddenLevels.forEach(hl => {
        chapterProgress.hiddenLevelProgress![hl.levelRuleId] = {
          levelId: hl.levelRuleId,
          revealed: false,
          unlocked: false
        };
      });
    }

    const newlyRevealed: number[] = [];

    for (const hiddenLevel of chapter.hiddenLevels) {
      const hlProgress = chapterProgress.hiddenLevelProgress[hiddenLevel.levelRuleId];
      if (!hlProgress || hlProgress.revealed) continue;

      const allTriggersMet = hiddenLevel.triggers.every(t => this.checkHiddenLevelTrigger(t));

      if (allTriggersMet) {
        hlProgress.revealed = true;
        hlProgress.revealedAt = Date.now();
        hlProgress.unlocked = true;
        hlProgress.unlockedAt = Date.now();
        newlyRevealed.push(hiddenLevel.levelRuleId);

        if (this.data.progress[hiddenLevel.levelRuleId]) {
          this.data.progress[hiddenLevel.levelRuleId].unlocked = true;
        } else {
          this.data.progress[hiddenLevel.levelRuleId] = {
            levelId: hiddenLevel.levelRuleId,
            unlocked: true,
            bestScore: 0,
            bestTime: 0,
            stars: 0,
            completed: false
          };
        }

        if (!this.data.unlockedLevels.includes(hiddenLevel.levelRuleId)) {
          this.data.unlockedLevels.push(hiddenLevel.levelRuleId);
        }
      }
    }

    if (newlyRevealed.length > 0) {
      this.save();
    }

    return newlyRevealed;
  }

  static getChapterUnlockStatus(chapterId: number): {
    canUnlock: boolean;
    missingConditions: string[];
    progress: { condition: string; met: boolean; current: string }[];
  } {
    const chapter = getChapterById(chapterId);
    if (!chapter) return { canUnlock: false, missingConditions: [], progress: [] };

    const chapterProgress = this.data.chapterProgress[chapterId];
    if (chapterProgress?.unlocked) return { canUnlock: true, missingConditions: [], progress: [] };

    const condition = chapter.unlockCondition;
    const totalStars = this.getTotalStars();
    const missingConditions: string[] = [];
    const progressList: { condition: string; met: boolean; current: string }[] = [];

    const starsMet = totalStars >= chapter.requiredStars;
    progressList.push({
      condition: `累计星星 ≥ ${chapter.requiredStars}`,
      met: starsMet,
      current: `${totalStars}/${chapter.requiredStars}`
    });
    if (!starsMet) missingConditions.push(`需要 ${chapter.requiredStars} 颗星星`);

    if (condition?.prevChapterCompleted) {
      const prevChapter = Chapters.find(c => c.id === chapter.id - 1);
      const prevCompleted = prevChapter ? this.data.chapterProgress[prevChapter.id]?.completed ?? false : true;
      progressList.push({
        condition: `完成前一章节`,
        met: prevCompleted,
        current: prevCompleted ? '已完成' : '未完成'
      });
      if (!prevCompleted) missingConditions.push('完成前一章节');
    }

    if (condition?.prevChapterStarThreshold !== undefined) {
      const prevChapter = Chapters.find(c => c.id === chapter.id - 1);
      if (prevChapter) {
        const prevStars = this.getChapterStars(prevChapter.id);
        const prevStarMet = prevStars >= condition.prevChapterStarThreshold;
        progressList.push({
          condition: `前章星星 ≥ ${condition.prevChapterStarThreshold}`,
          met: prevStarMet,
          current: `${prevStars}/${condition.prevChapterStarThreshold}`
        });
        if (!prevStarMet) missingConditions.push(`前章需 ${condition.prevChapterStarThreshold} 颗星星`);
      }
    }

    if (condition?.requiredGalleryIds && condition.requiredGalleryIds.length > 0) {
      const unlockedGallery = this.getUnlockedGalleryItems();
      const galleryMet = condition.requiredGalleryIds.every(id => unlockedGallery.includes(id));
      const galleryNames = condition.requiredGalleryIds.map(id => {
        const specimen = getPlantSpecimen(id);
        const has = unlockedGallery.includes(id);
        return has ? specimen?.name : `${specimen?.name}(未收集)`;
      });
      progressList.push({
        condition: `收集图鉴: ${condition.requiredGalleryIds.map(id => getPlantSpecimen(id)?.name ?? `#${id}`).join('、')}`,
        met: galleryMet,
        current: galleryNames.join('、')
      });
      if (!galleryMet) missingConditions.push('收集所需图鉴标本');
    }

    return { canUnlock: missingConditions.length === 0, missingConditions, progress: progressList };
  }

  static getChapterMapSaveData(): ChapterMapSaveData {
    return {
      ...this.data.chapterMap,
      routeProgress: { ...this.data.chapterMap.routeProgress }
    };
  }

  static getRouteProgress(routeId: BranchRouteType): BranchRouteProgress | undefined {
    return this.data.chapterMap.routeProgress[routeId];
  }

  static getAllRouteProgress(): Record<BranchRouteType, BranchRouteProgress> {
    return { ...this.data.chapterMap.routeProgress };
  }

  static isRouteUnlocked(routeId: BranchRouteType): boolean {
    return this.data.chapterMap.routeProgress[routeId]?.unlocked ?? false;
  }

  static isRouteCompleted(routeId: BranchRouteType): boolean {
    return this.data.chapterMap.routeProgress[routeId]?.completed ?? false;
  }

  static getActiveRouteId(): BranchRouteType | null {
    return this.data.chapterMap.activeRouteId;
  }

  static setActiveRoute(routeId: BranchRouteType): void {
    if (this.isRouteUnlocked(routeId)) {
      this.data.chapterMap.activeRouteId = routeId;
      this.save();
    }
  }

  static getUnlockedRoutes(): BranchRouteType[] {
    return [...this.data.chapterMap.unlockedRoutes];
  }

  static isNodeUnlocked(routeId: BranchRouteType, nodeId: string): boolean {
    const progress = this.data.chapterMap.routeProgress[routeId];
    return progress?.unlockedNodeIds.includes(nodeId) ?? false;
  }

  static isNodeCompleted(routeId: BranchRouteType, nodeId: string): boolean {
    const progress = this.data.chapterMap.routeProgress[routeId];
    return progress?.completedNodeIds.includes(nodeId) ?? false;
  }

  static getCompletedNodes(routeId: BranchRouteType): string[] {
    const progress = this.data.chapterMap.routeProgress[routeId];
    return progress?.completedNodeIds ?? [];
  }

  static canClaimNodeReward(routeId: BranchRouteType, nodeId: string): boolean {
    return this.canClaimMapNodeRewards(routeId, nodeId);
  }

  static getCurrentNodeId(routeId: BranchRouteType): string | null {
    return this.data.chapterMap.routeProgress[routeId]?.currentNodeId ?? null;
  }

  static getRouteStars(routeId: BranchRouteType): number {
    const progress = this.data.chapterMap.routeProgress[routeId];
    return progress?.totalStars ?? 0;
  }

  static completeNode(routeId: BranchRouteType, nodeId: string): { 
    newlyUnlockedNodes: string[]; 
    routeCompleted: boolean;
    rewards?: Reward[];
  } {
    const progress = this.data.chapterMap.routeProgress[routeId];
    if (!progress || progress.completedNodeIds.includes(nodeId)) {
      return { newlyUnlockedNodes: [], routeCompleted: false };
    }

    progress.completedNodeIds.push(nodeId);

    const node = getMapNode(routeId, nodeId);
    let rewards: Reward[] | undefined;

    if (node?.rewards) {
      rewards = node.rewards;
      this.claimMapNodeRewards(routeId, nodeId);
    }

    if (node?.type === 'level' || node?.type === 'boss') {
      const levelProgress = this.data.progress[node.levelId!];
      if (levelProgress) {
        progress.totalStars = this.calculateRouteStars(routeId);
      }
    }

    const nextNodes = getNextNodes(routeId, nodeId);
    const newlyUnlockedNodes: string[] = [];

    nextNodes.forEach(nextNode => {
      if (!progress.unlockedNodeIds.includes(nextNode.id)) {
        progress.unlockedNodeIds.push(nextNode.id);
        newlyUnlockedNodes.push(nextNode.id);
      }
    });

    if (nextNodes.length > 0) {
      progress.currentNodeId = nextNodes[0].id;
    }

    const route = getRouteByNodeId(nodeId);
    if (route && nodeId === route.endingNodeId) {
      progress.completed = true;
      progress.endingViewed = true;
      progress.completedAt = Date.now();
      this.data.chapterMap.totalRoutesCompleted += 1;

      const ending = getRouteEnding(routeId);
      if (ending && !this.data.chapterMap.endingsViewed.includes(ending.id)) {
        this.data.chapterMap.endingsViewed.push(ending.id);
      }

      if (ending?.rewards) {
        ending.rewards.forEach(reward => {
          if (reward.type === 'score' && reward.value) {
            this.data.totalScore += reward.value;
          } else if (reward.type === 'badge') {
            this.data.badges[reward.id] = true;
          }
        });
      }
    }

    this.syncRouteUnlocks();
    this.save();

    return { newlyUnlockedNodes, routeCompleted: progress.completed, rewards };
  }

  private static calculateRouteStars(routeId: BranchRouteType): number {
    const route = BranchRoutes[routeId];
    if (!route) return 0;

    return route.nodes.reduce((sum, node) => {
      if ((node.type === 'level' || node.type === 'boss') && node.levelId) {
        return sum + (this.data.progress[node.levelId]?.stars || 0);
      }
      return sum;
    }, 0);
  }

  static claimMapNodeRewards(routeId: BranchRouteType, nodeId: string): Reward[] {
    const progress = this.data.chapterMap.routeProgress[routeId];
    const node = getMapNode(routeId, nodeId);
    
    if (!progress || !node?.rewards || progress.rewardsClaimed[nodeId]) {
      return [];
    }

    const rewards = node.rewards;

    rewards.forEach(reward => {
      if (reward.type === 'score' && reward.value) {
        this.data.totalScore += reward.value;
      } else if (reward.type === 'badge') {
        this.data.badges[reward.id] = true;
      }
    });

    progress.rewardsClaimed[nodeId] = true;
    this.save();

    return rewards;
  }

  static canClaimMapNodeRewards(routeId: BranchRouteType, nodeId: string): boolean {
    const progress = this.data.chapterMap.routeProgress[routeId];
    return this.isNodeCompleted(routeId, nodeId) 
      && progress?.rewardsClaimed[nodeId] === false 
      && getMapNode(routeId, nodeId)?.rewards !== undefined;
  }

  static canAccessRoute(routeId: BranchRouteType): { allowed: boolean; reason: string; current: number; required: number } {
    const route = BranchRoutes[routeId];
    if (!route) return { allowed: false, reason: '路线不存在', current: 0, required: 0 };

    const progress = this.data.chapterMap.routeProgress[routeId];
    if (progress?.unlocked) return { allowed: true, reason: '', current: 0, required: 0 };

    const totalStars = this.getTotalStars();
    const requiredStars = route.requiredStars;

    if (totalStars >= requiredStars) {
      return { allowed: true, reason: '', current: totalStars, required: requiredStars };
    }

    return {
      allowed: false,
      reason: `需要 ${requiredStars} 颗星星解锁`,
      current: totalStars,
      required: requiredStars
    };
  }

  private static syncRouteUnlocks(): void {
    const totalStars = this.getTotalStars();

    BranchRoutesList.forEach(route => {
      const progress = this.data.chapterMap.routeProgress[route.id];
      if (!progress || progress.unlocked) return;

      if (totalStars >= route.requiredStars) {
        progress.unlocked = true;
        progress.firstUnlockedAt = Date.now();
        progress.unlockedNodeIds = [route.startingNodeId];
        progress.currentNodeId = route.startingNodeId;
        
        if (!this.data.chapterMap.unlockedRoutes.includes(route.id)) {
          this.data.chapterMap.unlockedRoutes.push(route.id);
        }
      }
    });
  }

  static isEndingViewed(endingId: string): boolean {
    return this.data.chapterMap.endingsViewed.includes(endingId);
  }

  static getViewedEndings(): string[] {
    return [...this.data.chapterMap.endingsViewed];
  }

  static getTotalRoutesCompleted(): number {
    return this.data.chapterMap.totalRoutesCompleted;
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

  static getRestoredSpecimenIds(): number[] {
    return [...this.data.workshop.restoredSpecimens];
  }

  static getSpecimenCount(specimenId: number): number {
    let count = 0;
    if (this.isGalleryUnlocked(specimenId)) {
      count = 1;
    }
    const recipe = getRecipeBySpecimenId(specimenId);
    if (recipe) {
      let minCopiesFromFragments = Infinity;
      for (const req of recipe.requiredFragments) {
        const fragCount = this.getFragmentCount(req.fragmentId);
        const copies = Math.floor(fragCount / req.count);
        minCopiesFromFragments = Math.min(minCopiesFromFragments, copies);
      }
      if (minCopiesFromFragments !== Infinity) {
        count += minCopiesFromFragments;
      }
    }
    return Math.max(0, count);
  }

  static addResearchPoints(value: number): number {
    return this.grantResearchPoints(value);
  }

  static getAllBadges(): Record<number, boolean> {
    return this.data.badges;
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
      this.data.galleryUnlockTimes[specimenId] = Date.now();
    }

    ConservationManager.registerSpecimen(specimenId);

    const updatedQuests = DailyQuestManager.onSpecimenRestored(specimenId);

    const restoredCount = this.data.workshop.restoredSpecimens.length;
    const achievementResult = AchievementManager.onSpecimenRestored(restoredCount);

    if (achievementResult.scoreGained > 0) {
      this.data.totalScore += achievementResult.scoreGained;
    }

    const familyProgressResult = this.updateFamilyProgress(specimenId, 0);

    SeasonPassManager.onGalleryUnlock(specimenId);
    this.data.seasonPass = SeasonPassManager.getSaveData();
    this.save();
    return { success: true, updatedQuests, achievementResult, familyProgressResult };
  }

  static addWorkshopDrops(drops: { fragments: { id: number; count: number }[]; materials: { id: number; count: number }[] }): void {
    drops.fragments.forEach(f => this.addFragments(f.id, f.count));
    drops.materials.forEach(m => this.addMaterials(m.id, m.count));
  }

  static setSeasonPassData(data: SeasonPassSaveData): void {
    if (!this.data) return;
    this.data.seasonPass = data;
    this.save();
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
        const now = Date.now();
        if (reward.specimenId) {
          if (!this.data.event.eventGalleryUnlocked.includes(reward.specimenId)) {
            this.data.event.eventGalleryUnlocked.push(reward.specimenId);
            this.data.event.eventGalleryUnlockTimes[reward.specimenId] = now;
          }
          if (!this.data.galleryUnlocked.includes(reward.specimenId)) {
            this.data.galleryUnlocked.push(reward.specimenId);
            this.data.galleryUnlockTimes[reward.specimenId] = now;
          }
        } else {
          const eventLevels = getEventLevelRulesByEventId(eventId);
          eventLevels.forEach(rule => {
            if (!this.data.event.eventGalleryUnlocked.includes(rule.specimenId)) {
              this.data.event.eventGalleryUnlocked.push(rule.specimenId);
              this.data.event.eventGalleryUnlockTimes[rule.specimenId] = now;
            }
            if (!this.data.galleryUnlocked.includes(rule.specimenId)) {
              this.data.galleryUnlocked.push(rule.specimenId);
              this.data.galleryUnlockTimes[rule.specimenId] = now;
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

  static unlockGallerySpecimen(specimenId: number): void {
    if (!this.data.galleryUnlocked.includes(specimenId)) {
      this.data.galleryUnlocked.push(specimenId);
      this.data.galleryUnlockTimes[specimenId] = Date.now();
      this.syncFamilyProgress();
      SeasonPassManager.onGalleryUnlock(specimenId);
      this.save();
    }
  }

  static grantTitle(titleId: number): void {
    if (this.data.achievement.unlockedTitles) {
      this.data.achievement.unlockedTitles[titleId] = true;
    }
    this.save();
  }

  static unlockGalleryItem(specimenId: number): void {
    if (!this.data.galleryUnlocked.includes(specimenId)) {
      this.data.galleryUnlocked.push(specimenId);
      this.data.galleryUnlockTimes[specimenId] = Date.now();
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

  static getQuizSaveData(): QuizSaveData {
    return {
      ...this.data.quiz,
      quizProgress: { ...this.data.quiz.quizProgress }
    };
  }

  static getDonationSaveData(): DonationSaveData {
    return {
      ...this.data.donation,
      progress: {
        ...this.data.donation.progress,
        donationsBySpecimen: { ...this.data.donation.progress.donationsBySpecimen },
        rewardsClaimed: { ...this.data.donation.progress.rewardsClaimed },
        donations: [...this.data.donation.progress.donations]
      }
    };
  }

  static getDonationProgress(): DonationProgress {
    return DonationManager.getProgress();
  }

  static getTotalDonations(): number {
    return DonationManager.getTotalDonations();
  }

  static getDonationsBySpecimen(specimenId: number): number {
    return DonationManager.getDonationsBySpecimen(specimenId);
  }

  static isDonationRewardClaimed(rewardId: number): boolean {
    return DonationManager.isRewardClaimed(rewardId);
  }

  static canDonateSpecimen(specimenId: number): { canDonate: boolean; reason?: string; availableCount?: number } {
    return DonationManager.canDonateSpecimen(specimenId);
  }

  static donateSpecimen(specimenId: number) {
    const result = DonationManager.donateSpecimen(specimenId);
    if (result.success) {
      this.syncDonationData();
    }
    return result;
  }

  static claimDonationReward(rewardId: number) {
    const result = DonationManager.claimReward(rewardId);
    if (result.success) {
      this.syncDonationData();
    }
    return result;
  }

  private static syncDonationData(): void {
    this.data.donation = DonationManager.getSaveData();
  }

  static save(): void {
    if (!this.data) return;

    this.data.quiz = QuizManager.getSaveData();
    this.data.donation = DonationManager.getSaveData();
    this.data.randomEvent = RandomEventManager.getSaveData();

    this.data.metadata.updatedAt = Date.now();
    this.data.metadata.saveCount += 1;

    try {
      this.writeBackup(this.data);
    } catch (e) {
      console.warn('[SaveManager] Backup write failed during save:', e);
    }

    try {
      const serialized = JSON.stringify(this.data);
      localStorage.setItem(STORAGE_KEY, serialized);
    } catch (e) {
      console.error('[SaveManager] Failed to persist save data:', e);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
  }

  static reset(): void {
    this.data = this.createDefaultSave();
    this.save();
  }

  static getSchemaVersion(): number {
    return this.data?.schemaVersion ?? 0;
  }

  static getSaveMetadata(): SaveMetadata | null {
    return this.data?.metadata ?? null;
  }

  static getMigrationHistory(): SaveMigrationLogEntry[] {
    return this.data?.metadata?.migrationLog ?? [];
  }

  static getAvailableBackups(): Array<{ version: number; timestamp: number }> {
    return this.readBackups().map(b => ({ version: b.version, timestamp: b.timestamp }));
  }

  static saveCustomPuzzleRecord(key: string, record: CustomPuzzleRecord): void {
    const existing = this.data.customPuzzle.records[key];
    if (existing) {
      existing.bestScore = Math.max(existing.bestScore, record.bestScore);
      existing.bestTime = Math.min(existing.bestTime, record.bestTime);
      existing.stars = Math.max(existing.stars, record.stars);
      existing.playCount += record.playCount;
      existing.lastPlayedAt = record.lastPlayedAt;
    } else {
      this.data.customPuzzle.records[key] = { ...record };
    }
    this.data.customPuzzle.totalPlays += record.playCount;
    this.data.customPuzzle.totalScore += record.bestScore;
    this.save();
  }

  static getCustomPuzzleRecord(key: string): CustomPuzzleRecord | undefined {
    return this.data.customPuzzle.records[key];
  }

  static getAllCustomPuzzleRecords(): Record<string, CustomPuzzleRecord> {
    return this.data.customPuzzle.records;
  }

  static getRepairLogSaveData(): RepairLogSaveData {
    return { ...this.data.repairLog, entries: [...this.data.repairLog.entries] };
  }

  static getRepairLogEntries(limit?: number) {
    return RepairLogManager.getEntries(limit);
  }

  static getRepairLogEntriesBySpecimen(specimenId: number) {
    return RepairLogManager.getEntriesBySpecimen(specimenId);
  }

  static getRepairLogStats() {
    return RepairLogManager.getStats();
  }

  static getRepairLogSpecimenStats(specimenId: number) {
    return RepairLogManager.getSpecimenStats(specimenId);
  }

  static getPuzzleSave(
    levelId: number,
    isEventLevel?: boolean,
    eventId?: string | null,
    isTowerFloor?: boolean,
    towerFloorId?: number | null
  ): PuzzleSaveData | undefined {
    const saves = this.getAllPuzzleSaves(levelId);
    const filtered = saves.filter(s => {
      if (isEventLevel !== undefined && s.isEventLevel !== isEventLevel) return false;
      if (eventId !== undefined && s.eventId !== eventId) return false;
      if (isTowerFloor !== undefined && s.isTowerFloor !== isTowerFloor) return false;
      if (towerFloorId !== undefined && s.towerFloorId !== towerFloorId) return false;
      return true;
    });
    return filtered[0];
  }

  static getAllPuzzleSaves(levelId?: number): PuzzleSaveData[] {
    const saves = Object.values(this.data.puzzleSaves.saves);
    if (levelId !== undefined) {
      return saves.filter(s => s.levelId === levelId).sort((a, b) => b.savedAt - a.savedAt);
    }
    return saves.sort((a, b) => b.savedAt - a.savedAt);
  }

  static savePuzzleProgress(puzzleSave: Omit<PuzzleSaveData, 'saveId' | 'savedAt'>): PuzzleSaveData {
    const levelId = puzzleSave.levelId;
    const savesForLevel = this.getAllPuzzleSaves(levelId);
    const saveId = `level_${levelId}_${Date.now()}`;

    const newSave: PuzzleSaveData = {
      saveId,
      savedAt: Date.now(),
      ...puzzleSave
    };

    const maxSaves = this.data.puzzleSaves.maxSavesPerLevel;
    if (savesForLevel.length >= maxSaves) {
      const oldestSave = savesForLevel[savesForLevel.length - 1];
      delete this.data.puzzleSaves.saves[oldestSave.saveId];
    }

    this.data.puzzleSaves.saves[saveId] = newSave;
    this.save();

    return newSave;
  }

  static clearPuzzleSave(
    levelId: number,
    isEventLevel?: boolean,
    eventId?: string | null,
    isTowerFloor?: boolean,
    towerFloorId?: number | null
  ): boolean {
    const saves = this.getAllPuzzleSaves(levelId);
    const filtered = saves.filter(s => {
      if (isEventLevel !== undefined && s.isEventLevel !== isEventLevel) return false;
      if (eventId !== undefined && s.eventId !== eventId) return false;
      if (isTowerFloor !== undefined && s.isTowerFloor !== isTowerFloor) return false;
      if (towerFloorId !== undefined && s.towerFloorId !== towerFloorId) return false;
      return true;
    });

    let deleted = false;
    filtered.forEach(save => {
      delete this.data.puzzleSaves.saves[save.saveId];
      deleted = true;
    });
    if (deleted) {
      this.save();
    }
    return deleted;
  }

  static clearLevelPuzzleSaves(levelId: number): number {
    const saves = this.getAllPuzzleSaves(levelId);
    saves.forEach(save => {
      delete this.data.puzzleSaves.saves[save.saveId];
    });
    this.save();
    return saves.length;
  }

  static saveReplay(replay: ReplayData): void {
    const levelId = replay.levelId;
    const replaysForLevel = this.getReplaysByLevel(levelId);
    
    const maxReplays = this.data.replay.maxReplaysPerLevel;
    if (replaysForLevel.length >= maxReplays) {
      const oldest = replaysForLevel[replaysForLevel.length - 1];
      const idx = this.data.replay.replays.findIndex(r => r.replayId === oldest.replayId);
      if (idx >= 0) {
        this.data.replay.replays.splice(idx, 1);
      }
    }

    this.data.replay.replays.unshift(replay);
    this.save();
  }

  static getReplaysByLevel(levelId: number): ReplayData[] {
    return this.data.replay.replays
      .filter(r => r.levelId === levelId)
      .sort((a, b) => b.completedAt - a.completedAt);
  }

  static getLatestReplay(levelId: number): ReplayData | undefined {
    const replays = this.getReplaysByLevel(levelId);
    return replays[0];
  }

  static getReplayById(replayId: string): ReplayData | undefined {
    return this.data.replay.replays.find(r => r.replayId === replayId);
  }

  static getAllReplays(): ReplayData[] {
    return [...this.data.replay.replays].sort((a, b) => b.completedAt - a.completedAt);
  }

  static deleteReplay(replayId: string): boolean {
    const idx = this.data.replay.replays.findIndex(r => r.replayId === replayId);
    if (idx >= 0) {
      this.data.replay.replays.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  }

  static clearAllReplays(): void {
    this.data.replay.replays = [];
    this.save();
  }
}
