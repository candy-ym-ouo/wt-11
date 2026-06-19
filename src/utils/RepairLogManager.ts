import {
  RepairLogEntry,
  RepairLogSaveData,
  KeyOperationType,
} from '../types/GameTypes';
import { SaveManager } from './SaveManager';

const MAX_ENTRIES = 200;

export class RepairLogManager {
  private static data: RepairLogSaveData;

  static init(saveData: RepairLogSaveData): void {
    this.data = saveData;
  }

  static createDefaultSave(): RepairLogSaveData {
    return {
      entries: [],
      totalEntries: 0,
    };
  }

  static recordEntry(params: {
    levelId: number;
    specimenId: number;
    specimenName: string;
    score: number;
    time: number;
    stars: number;
    previousStars: number;
    previousBestScore: number;
    previousBestTime: number;
    difficulty: 'easy' | 'medium' | 'hard';
    isEventLevel: boolean;
    eventId: string | null;
    isTowerFloor: boolean;
    towerFloorId: number | null;
    comboCount?: number;
    hintsUsed?: number;
    hasConservationBonus?: boolean;
    mirrorBrokenCount?: number;
  }): RepairLogEntry {
    const scoreDelta = params.score - params.previousBestScore;
    const timeDelta = params.previousBestTime === 0
      ? 0
      : params.time - params.previousBestTime;
    const starChange = params.stars - params.previousStars;

    const keyOperations: KeyOperationType[] = [];

    if (params.previousStars === 0 && params.stars > 0) {
      keyOperations.push('first_completion');
    }
    if (scoreDelta > 0 && params.previousBestScore > 0) {
      keyOperations.push('new_record');
    }
    if (timeDelta < 0 && params.previousBestTime > 0) {
      keyOperations.push('new_best_time');
    }
    if (starChange > 0) {
      keyOperations.push('star_upgrade');
    }
    if (params.stars === 3) {
      keyOperations.push('perfect_clear');
    }
    if (params.hasConservationBonus) {
      keyOperations.push('conservation_bonus');
    }
    if ((params.comboCount ?? 0) >= 5) {
      keyOperations.push('combo_achieved');
    }
    if ((params.hintsUsed ?? 0) === 0) {
      keyOperations.push('no_hints_used');
    }
    if (params.isEventLevel) {
      keyOperations.push('event_level');
    }
    if (params.isTowerFloor) {
      keyOperations.push('tower_floor');
    }
    if ((params.mirrorBrokenCount ?? 0) > 0) {
      keyOperations.push('mirror_broken');
    }

    const entry: RepairLogEntry = {
      id: `log_${Date.now()}_${params.levelId}`,
      levelId: params.levelId,
      specimenId: params.specimenId,
      specimenName: params.specimenName,
      score: params.score,
      time: params.time,
      stars: params.stars,
      previousStars: params.previousStars,
      previousBestScore: params.previousBestScore,
      previousBestTime: params.previousBestTime,
      scoreDelta,
      timeDelta,
      starChange,
      keyOperations,
      difficulty: params.difficulty,
      isEventLevel: params.isEventLevel,
      eventId: params.eventId,
      isTowerFloor: params.isTowerFloor,
      towerFloorId: params.towerFloorId,
      completedAt: Date.now(),
    };

    this.data.entries.unshift(entry);
    this.data.totalEntries += 1;

    if (this.data.entries.length > MAX_ENTRIES) {
      this.data.entries = this.data.entries.slice(0, MAX_ENTRIES);
    }

    SaveManager.save();
    return entry;
  }

  static getEntries(limit?: number): RepairLogEntry[] {
    const entries = this.data.entries;
    return limit ? entries.slice(0, limit) : [...entries];
  }

  static getEntriesBySpecimen(specimenId: number): RepairLogEntry[] {
    return this.data.entries.filter(e => e.specimenId === specimenId);
  }

  static getEntriesByLevel(levelId: number): RepairLogEntry[] {
    return this.data.entries.filter(e => e.levelId === levelId);
  }

  static getEntriesByEvent(eventId: string): RepairLogEntry[] {
    return this.data.entries.filter(e => e.eventId === eventId);
  }

  static getEntriesByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): RepairLogEntry[] {
    return this.data.entries.filter(e => e.difficulty === difficulty);
  }

  static getStarUpgrades(): RepairLogEntry[] {
    return this.data.entries.filter(e => e.starChange > 0);
  }

  static getNewRecords(): RepairLogEntry[] {
    return this.data.entries.filter(e => e.keyOperations.includes('new_record'));
  }

  static getTotalEntries(): number {
    return this.data.totalEntries;
  }

  static getRecentEntries(count: number): RepairLogEntry[] {
    return this.data.entries.slice(0, count);
  }

  static getStats(): {
    totalCompletions: number;
    perfectClears: number;
    newRecords: number;
    starUpgrades: number;
    bestComboCount: number;
    noHintRuns: number;
    averageScore: number;
    averageTime: number;
  } {
    const entries = this.data.entries;
    const perfectClears = entries.filter(e => e.keyOperations.includes('perfect_clear')).length;
    const newRecords = entries.filter(e => e.keyOperations.includes('new_record')).length;
    const starUpgrades = entries.filter(e => e.starChange > 0).length;
    const noHintRuns = entries.filter(e => e.keyOperations.includes('no_hints_used')).length;

    const totalScore = entries.reduce((sum, e) => sum + e.score, 0);
    const totalTime = entries.reduce((sum, e) => sum + e.time, 0);
    const count = entries.length || 1;

    return {
      totalCompletions: entries.length,
      perfectClears,
      newRecords,
      starUpgrades,
      bestComboCount: 0,
      noHintRuns,
      averageScore: Math.round(totalScore / count),
      averageTime: Math.round(totalTime / count),
    };
  }

  static getSpecimenStats(specimenId: number): {
    playCount: number;
    bestScore: number;
    bestTime: number;
    currentStars: number;
    scoreHistory: number[];
    timeHistory: number[];
    starHistory: number[];
  } {
    const entries = this.getEntriesBySpecimen(specimenId);
    if (entries.length === 0) {
      return {
        playCount: 0,
        bestScore: 0,
        bestTime: 0,
        currentStars: 0,
        scoreHistory: [],
        timeHistory: [],
        starHistory: [],
      };
    }

    const sorted = [...entries].reverse();
    const scoreHistory = sorted.map(e => e.score);
    const timeHistory = sorted.map(e => e.time);
    const starHistory = sorted.map(e => e.stars);

    return {
      playCount: entries.length,
      bestScore: Math.max(...entries.map(e => e.score)),
      bestTime: Math.min(...entries.filter(e => e.time > 0).map(e => e.time)) || 0,
      currentStars: entries[0].stars,
      scoreHistory,
      timeHistory,
      starHistory,
    };
  }

  static getKeyOperationLabel(op: KeyOperationType): string {
    const labels: Record<KeyOperationType, string> = {
      first_completion: '首次通关',
      new_record: '刷新纪录',
      new_best_time: '最快用时',
      star_upgrade: '星级提升',
      perfect_clear: '完美通关',
      conservation_bonus: '养护加成',
      combo_achieved: '连击达人',
      no_hints_used: '零提示通关',
      event_level: '活动关卡',
      tower_floor: '爬塔挑战',
      mirror_broken: '识破幻影',
    };
    return labels[op] || op;
  }

  static getKeyOperationIcon(op: KeyOperationType): string {
    const icons: Record<KeyOperationType, string> = {
      first_completion: '🎯',
      new_record: '🏆',
      new_best_time: '⚡',
      star_upgrade: '⭐',
      perfect_clear: '💎',
      conservation_bonus: '🌿',
      combo_achieved: '🔥',
      no_hints_used: '🧠',
      event_level: '🌸',
      tower_floor: '🏰',
      mirror_broken: '👁️',
    };
    return icons[op] || '📌';
  }
}
