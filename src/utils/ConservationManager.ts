import {
  SpecimenConservationState,
  CareActionType,
  ConservationHealthLevel,
  ConservationReminder,
  ConservationSaveData,
  DailyQuest,
} from '../types/GameTypes';
import {
  CareActions,
  DecayConfig,
  getCareActionDef,
  getHealthLevel,
  getReminderForHealth,
  getRewardMultiplier,
} from '../data/ConservationConfig';
import { SaveManager } from './SaveManager';
import { DailyQuestManager } from './DailyQuestManager';

export class ConservationManager {
  private static data: ConservationSaveData;

  static init(saveData: ConservationSaveData): void {
    this.data = saveData;
    this.processDecay();
  }

  static createDefaultSave(): ConservationSaveData {
    return {
      specimens: {},
      totalCares: 0,
      decayAccumulator: 0,
      lastDecayProcessTime: Date.now(),
      dismissedReminders: [],
    };
  }

  static registerSpecimen(specimenId: number): void {
    if (this.data.specimens[specimenId]) return;
    this.data.specimens[specimenId] = {
      specimenId,
      health: DecayConfig.maxHealth,
      lastCareTimestamp: {} as Record<CareActionType, number>,
      lastDecayTick: Date.now(),
      totalCaresPerformed: 0,
      consecutiveCares: 0,
    };
    SaveManager.save();
  }

  static getSpecimenState(specimenId: number): SpecimenConservationState | undefined {
    return this.data.specimens[specimenId];
  }

  static getHealth(specimenId: number): number {
    return this.data.specimens[specimenId]?.health ?? DecayConfig.maxHealth;
  }

  static getHealthLevel(specimenId: number): ConservationHealthLevel {
    const health = this.getHealth(specimenId);
    return getHealthLevel(health);
  }

  static processDecay(): void {
    const now = Date.now();
    const lastProcess = this.data.lastDecayProcessTime || now;
    const elapsedMs = now - lastProcess;

    if (elapsedMs < 60 * 60 * 1000) return;

    const elapsedHours = elapsedMs / (60 * 60 * 1000);

    for (const specimenId of Object.keys(this.data.specimens).map(Number)) {
      const state = this.data.specimens[specimenId];
      const decayHours = (now - state.lastDecayTick) / (60 * 60 * 1000);

      if (decayHours < 1) continue;

      let decay = DecayConfig.baseDecayPerHour * decayHours;

      if (state.health > DecayConfig.thrivingThreshold) {
        decay *= 1.5;
      } else if (state.health > DecayConfig.healthyThreshold) {
        decay *= 1.0;
      } else if (state.health > DecayConfig.fairThreshold) {
        decay *= 0.7;
      } else {
        decay *= 0.4;
      }

      const streakBonus = Math.min(
        state.consecutiveCares * DecayConfig.consecutiveCareBonusPerLevel,
        DecayConfig.maxConsecutiveCareBonus
      );
      decay = Math.max(0.5, decay - streakBonus * (decayHours / 24));

      state.health = Math.max(DecayConfig.minHealth, state.health - decay);
      state.lastDecayTick = now;
    }

    this.data.lastDecayProcessTime = now;
    SaveManager.save();
  }

  static canPerformCare(specimenId: number, actionType: CareActionType): { canCare: boolean; reason: string } {
    const state = this.data.specimens[specimenId];
    if (!state) return { canCare: false, reason: '标本尚未登记养护档案' };

    const actionDef = getCareActionDef(actionType);
    if (!actionDef) return { canCare: false, reason: '无效的养护操作' };

    const lastCareTime = state.lastCareTimestamp[actionType] || 0;
    const now = Date.now();
    if (now - lastCareTime < actionDef.cooldownMs) {
      const remainingMs = actionDef.cooldownMs - (now - lastCareTime);
      const remainingMin = Math.ceil(remainingMs / (60 * 1000));
      return { canCare: false, reason: `冷却中，还需 ${remainingMin} 分钟` };
    }

    for (const cost of actionDef.materialCost) {
      const owned = SaveManager.getMaterialCount(cost.materialId);
      if (owned < cost.count) {
        return { canCare: false, reason: '材料不足' };
      }
    }

    if (state.health >= DecayConfig.maxHealth) {
      return { canCare: false, reason: '健康值已满，无需养护' };
    }

    return { canCare: true, reason: '' };
  }

  static performCare(specimenId: number, actionType: CareActionType): {
    success: boolean;
    reason: string;
    healthBefore: number;
    healthAfter: number;
    healthLevel: ConservationHealthLevel;
    updatedQuests: DailyQuest[];
  } {
    const check = this.canPerformCare(specimenId, actionType);
    if (!check.canCare) {
      return {
        success: false,
        reason: check.reason,
        healthBefore: this.getHealth(specimenId),
        healthAfter: this.getHealth(specimenId),
        healthLevel: this.getHealthLevel(specimenId),
        updatedQuests: [],
      };
    }

    const state = this.data.specimens[specimenId];
    const actionDef = getCareActionDef(actionType)!;
    const healthBefore = state.health;

    for (const cost of actionDef.materialCost) {
      SaveManager.removeMaterials(cost.materialId, cost.count);
    }

    let recovery = actionDef.healthRecovery;
    const streakBonus = Math.min(
      state.consecutiveCares * DecayConfig.consecutiveCareBonusPerLevel * 0.2,
      DecayConfig.maxConsecutiveCareBonus * 0.2
    );
    recovery = Math.floor(recovery * (1 + streakBonus));

    state.health = Math.min(DecayConfig.maxHealth, state.health + recovery);
    state.lastCareTimestamp[actionType] = Date.now();
    state.totalCaresPerformed += 1;
    state.lastCareAt = Date.now();

    const now = Date.now();
    if (state.lastCareAt && (now - state.lastCareAt) < DecayConfig.streakGracePeriodMs) {
      state.consecutiveCares += 1;
    } else {
      state.consecutiveCares = 1;
    }

    this.data.totalCares += 1;
    const healthLevel = getHealthLevel(state.health);

    const updatedQuests = DailyQuestManager.onSpecimenCare(specimenId);

    SaveManager.save();

    return {
      success: true,
      reason: '',
      healthBefore,
      healthAfter: state.health,
      healthLevel,
      updatedQuests,
    };
  }

  static getReminders(): ConservationReminder[] {
    const reminders: ConservationReminder[] = [];
    const now = Date.now();

    for (const specimenId of Object.keys(this.data.specimens).map(Number)) {
      const state = this.data.specimens[specimenId];
      const reminderDef = getReminderForHealth(state.health);

      if (this.data.dismissedReminders.includes(specimenId)) {
        if (reminderDef.priority !== 'urgent' && reminderDef.priority !== 'high') continue;
      }

      reminders.push({
        specimenId,
        healthLevel: reminderDef.healthLevel,
        message: reminderDef.message,
        priority: reminderDef.priority,
        timestamp: now,
      });
    }

    return reminders.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  static dismissReminder(specimenId: number): void {
    if (!this.data.dismissedReminders.includes(specimenId)) {
      this.data.dismissedReminders.push(specimenId);
      SaveManager.save();
    }
  }

  static getUrgentReminderCount(): number {
    return this.getReminders().filter(r => r.priority === 'urgent' || r.priority === 'high').length;
  }

  static getRewardMultiplierForSpecimen(specimenId: number): { scoreMultiplier: number; fragmentMultiplier: number; researchMultiplier: number } {
    const health = this.getHealth(specimenId);
    return getRewardMultiplier(health);
  }

  static getGlobalRewardMultiplier(): { scoreMultiplier: number; fragmentMultiplier: number; researchMultiplier: number } {
    const specimenIds = Object.keys(this.data.specimens).map(Number);
    if (specimenIds.length === 0) return { scoreMultiplier: 1, fragmentMultiplier: 1, researchMultiplier: 1 };

    let totalScore = 0;
    let totalFragment = 0;
    let totalResearch = 0;

    for (const id of specimenIds) {
      const m = getRewardMultiplier(this.getHealth(id));
      totalScore += m.scoreMultiplier;
      totalFragment += m.fragmentMultiplier;
      totalResearch += m.researchMultiplier;
    }

    const count = specimenIds.length;
    return {
      scoreMultiplier: totalScore / count,
      fragmentMultiplier: totalFragment / count,
      researchMultiplier: totalResearch / count,
    };
  }

  static applySpecimenRewardMultiplier(specimenId: number, baseScore: number, baseFragments: number, baseResearch: number): {
    finalScore: number;
    finalFragments: number;
    finalResearch: number;
    multiplierApplied: boolean;
    scoreMultiplier: number;
    fragmentMultiplier: number;
    researchMultiplier: number;
  } {
    if (!this.data.specimens[specimenId]) {
      return {
        finalScore: baseScore,
        finalFragments: baseFragments,
        finalResearch: baseResearch,
        multiplierApplied: false,
        scoreMultiplier: 1,
        fragmentMultiplier: 1,
        researchMultiplier: 1,
      };
    }

    const m = getRewardMultiplier(this.getHealth(specimenId));
    return {
      finalScore: Math.max(1, Math.floor(baseScore * m.scoreMultiplier)),
      finalFragments: Math.max(0, Math.floor(baseFragments * m.fragmentMultiplier)),
      finalResearch: Math.max(1, Math.floor(baseResearch * m.researchMultiplier)),
      multiplierApplied: true,
      scoreMultiplier: m.scoreMultiplier,
      fragmentMultiplier: m.fragmentMultiplier,
      researchMultiplier: m.researchMultiplier,
    };
  }

  static applyGlobalRewardMultiplier(baseScore: number, baseFragments: number, baseResearch: number): {
    finalScore: number;
    finalFragments: number;
    finalResearch: number;
    scoreMultiplier: number;
    fragmentMultiplier: number;
    researchMultiplier: number;
  } {
    const m = this.getGlobalRewardMultiplier();
    return {
      finalScore: Math.max(1, Math.floor(baseScore * m.scoreMultiplier)),
      finalFragments: Math.max(0, Math.floor(baseFragments * m.fragmentMultiplier)),
      finalResearch: Math.max(1, Math.floor(baseResearch * m.researchMultiplier)),
      scoreMultiplier: m.scoreMultiplier,
      fragmentMultiplier: m.fragmentMultiplier,
      researchMultiplier: m.researchMultiplier,
    };
  }

  static getCooldownRemaining(specimenId: number, actionType: CareActionType): number {
    const state = this.data.specimens[specimenId];
    if (!state) return 0;

    const actionDef = getCareActionDef(actionType);
    if (!actionDef) return 0;

    const lastCareTime = state.lastCareTimestamp[actionType] || 0;
    const elapsed = Date.now() - lastCareTime;
    return Math.max(0, actionDef.cooldownMs - elapsed);
  }

  static getConsecutiveCares(specimenId: number): number {
    return this.data.specimens[specimenId]?.consecutiveCares ?? 0;
  }

  static getTotalCares(): number {
    return this.data.totalCares;
  }

  static getRegisteredSpecimenIds(): number[] {
    return Object.keys(this.data.specimens).map(Number);
  }

  static getAverageHealth(): number {
    const ids = Object.keys(this.data.specimens).map(Number);
    if (ids.length === 0) return DecayConfig.maxHealth;
    const totalHealth = ids.reduce((sum, id) => sum + this.getHealth(id), 0);
    return Math.round(totalHealth / ids.length);
  }

  static getConservationStats(): {
    totalSpecimens: number;
    thrivingCount: number;
    healthyCount: number;
    fairCount: number;
    decliningCount: number;
    criticalCount: number;
    averageHealth: number;
    totalCares: number;
  } {
    const ids = Object.keys(this.data.specimens).map(Number);
    const counts = { thriving: 0, healthy: 0, fair: 0, declining: 0, critical: 0 };

    for (const id of ids) {
      const level = this.getHealthLevel(id);
      counts[level]++;
    }

    return {
      totalSpecimens: ids.length,
      thrivingCount: counts.thriving,
      healthyCount: counts.healthy,
      fairCount: counts.fair,
      decliningCount: counts.declining,
      criticalCount: counts.critical,
      averageHealth: this.getAverageHealth(),
      totalCares: this.data.totalCares,
    };
  }
}
