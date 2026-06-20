import {
  RandomEventData,
  RandomEventSaveData,
  RandomEventSessionStats,
  ActiveRandomEvent,
  RandomEventEffect,
  RandomEventType,
  RandomEventRarity
} from '../types/GameTypes';
import {
  getEventsByDifficulty,
  getRandomEventById,
  RANDOM_EVENT_ENABLED,
  EVENT_TRIGGER_INTERVAL_MIN,
  EVENT_TRIGGER_INTERVAL_MAX,
  MAX_CONCURRENT_EVENTS,
  EVENT_DURATION_DEFAULT
} from '../data/RandomEvents';

export class RandomEventManager {
  private static saveData: RandomEventSaveData;

  private static sessionStats: RandomEventSessionStats = {
    eventsEncountered: [],
    positiveEventsCount: 0,
    negativeEventsCount: 0,
    totalScoreModifier: 0,
    totalTimeLost: 0,
    damagedPieces: 0,
    eventsByRarity: { common: 0, rare: 0, epic: 0, legendary: 0 }
  };

  private static activeEvents: ActiveRandomEvent[] = [];
  private static nextEventTime: number = 0;
  private static currentDifficulty: 'easy' | 'medium' | 'hard' = 'easy';

  static init(saveData: RandomEventSaveData): void {
    this.saveData = saveData;
  }

  static createDefaultSave(): RandomEventSaveData {
    return {
      totalEventsEncountered: 0,
      positiveEventsTotal: 0,
      negativeEventsTotal: 0,
      eventsByType: {
        fragment_damage: 0,
        time_compression: 0,
        hint_disabled: 0,
        score_boost: 0,
        piece_bonus: 0,
        double_reward: 0
      },
      eventsByRarity: { common: 0, rare: 0, epic: 0, legendary: 0 },
      highestScoreWithEvent: 0,
      totalTimeLostToEvents: 0,
      totalDamagedPieces: 0,
      eventStreak: 0,
      bestEventStreak: 0,
      rareEventsUnlocked: []
    };
  }

  static getSaveData(): RandomEventSaveData {
    return { ...this.saveData };
  }

  static startSession(difficulty: 'easy' | 'medium' | 'hard'): void {
    if (!RANDOM_EVENT_ENABLED) return;

    this.currentDifficulty = difficulty;
    this.sessionStats = {
      eventsEncountered: [],
      positiveEventsCount: 0,
      negativeEventsCount: 0,
      totalScoreModifier: 0,
      totalTimeLost: 0,
      damagedPieces: 0,
      eventsByRarity: { common: 0, rare: 0, epic: 0, legendary: 0 }
    };
    this.activeEvents = [];
    this.nextEventTime = this.generateNextEventTime();
  }

  private static generateNextEventTime(): number {
    const min = EVENT_TRIGGER_INTERVAL_MIN;
    const max = EVENT_TRIGGER_INTERVAL_MAX;
    return Math.random() * (max - min) + min;
  }

  static update(elapsedTime: number, deltaTime: number, snappedPieces: number): ActiveRandomEvent | null {
    if (!RANDOM_EVENT_ENABLED) return null;

    this.updateActiveEvents(deltaTime);

    this.nextEventTime -= deltaTime;
    if (this.nextEventTime <= 0 && this.activeEvents.length < MAX_CONCURRENT_EVENTS) {
      const triggeredEvent = this.tryTriggerEvent(elapsedTime, snappedPieces);
      if (triggeredEvent) {
        this.nextEventTime = this.generateNextEventTime();
        return triggeredEvent;
      }
      this.nextEventTime = this.generateNextEventTime();
    }

    return null;
  }

  private static tryTriggerEvent(elapsedTime: number, snappedPieces: number): ActiveRandomEvent | null {
    const availableEvents = getEventsByDifficulty(this.currentDifficulty);

    if (availableEvents.length === 0) return null;

    const eligibleEvents = availableEvents.filter(event => {
      if (!event.triggerCondition || event.triggerCondition === 'random') {
        return true;
      }
      if (event.triggerCondition === 'time_elapsed') {
        return elapsedTime >= (event.triggerValue || 0);
      }
      if (event.triggerCondition === 'pieces_snapped') {
        return snappedPieces >= (event.triggerValue || 0);
      }
      return true;
    });

    if (eligibleEvents.length === 0) return null;

    const selectedEvent = this.weightedRandomSelect(eligibleEvents);
    if (!selectedEvent) return null;

    return this.activateEvent(selectedEvent, elapsedTime);
  }

  private static weightedRandomSelect(events: RandomEventData[]): RandomEventData | null {
    if (events.length === 0) return null;

    const totalWeight = events.reduce((sum, e) => sum + e.weight, 0);
    let random = Math.random() * totalWeight;

    for (const event of events) {
      random -= event.weight;
      if (random <= 0) {
        return event;
      }
    }

    return events[events.length - 1];
  }

  private static activateEvent(eventData: RandomEventData, currentTime: number): ActiveRandomEvent {
    const maxDuration = Math.max(...eventData.effects.map(e => e.duration || EVENT_DURATION_DEFAULT));
    const hasInstantEffect = eventData.effects.some(e => 
      e.type === 'piece_damage_count' || e.type === 'time_penalty' || e.type === 'reward_multiplier'
    );

    const duration = hasInstantEffect ? 3 : maxDuration;

    const activeEvent: ActiveRandomEvent = {
      eventId: eventData.id,
      startTime: currentTime,
      duration: duration,
      remainingDuration: duration,
      effects: [...eventData.effects],
      isActive: true,
      triggeredAt: Date.now()
    };

    this.activeEvents.push(activeEvent);
    this.recordEventEncounter(eventData);
    this.recordInstantEffects(eventData);

    return activeEvent;
  }

  private static recordInstantEffects(eventData: RandomEventData): void {
    eventData.effects.forEach(effect => {
      if (effect.type === 'time_penalty') {
        this.saveData.totalTimeLostToEvents += effect.value;
        this.sessionStats.totalTimeLost += effect.value;
      }
      if (effect.type === 'piece_damage_count') {
        this.saveData.totalDamagedPieces += effect.value;
        this.sessionStats.damagedPieces += effect.value;
      }
      if (effect.type === 'score_multiplier') {
        this.sessionStats.totalScoreModifier += (effect.value - 1) * 100;
      }
    });
  }

  private static updateActiveEvents(deltaTime: number): void {
    const expiredEvents: ActiveRandomEvent[] = [];

    this.activeEvents.forEach(event => {
      if (event.isActive) {
        event.remainingDuration -= deltaTime;
        if (event.remainingDuration <= 0) {
          event.isActive = false;
          expiredEvents.push(event);
        }
      }
    });

    if (expiredEvents.length > 0) {
      this.activeEvents = this.activeEvents.filter(e => e.isActive);
    }
  }

  private static recordEventEncounter(eventData: RandomEventData): void {
    this.saveData.totalEventsEncountered++;

    if (eventData.direction === 'positive') {
      this.saveData.positiveEventsTotal++;
      this.saveData.eventStreak++;
      if (this.saveData.eventStreak > this.saveData.bestEventStreak) {
        this.saveData.bestEventStreak = this.saveData.eventStreak;
      }
    } else if (eventData.direction === 'negative') {
      this.saveData.negativeEventsTotal++;
      this.saveData.eventStreak = 0;
    }

    this.saveData.eventsByType[eventData.type]++;
    this.saveData.eventsByRarity[eventData.rarity]++;

    if (eventData.rarity === 'rare' || eventData.rarity === 'epic' || eventData.rarity === 'legendary') {
      if (!this.saveData.rareEventsUnlocked.includes(eventData.id)) {
        this.saveData.rareEventsUnlocked.push(eventData.id);
      }
    }

    this.sessionStats.eventsEncountered.push(eventData.id);
    if (eventData.direction === 'positive') {
      this.sessionStats.positiveEventsCount++;
    } else if (eventData.direction === 'negative') {
      this.sessionStats.negativeEventsCount++;
    }
    this.sessionStats.eventsByRarity[eventData.rarity]++;
  }

  static getActiveEvents(): ActiveRandomEvent[] {
    return [...this.activeEvents];
  }

  static isHintDisabled(): boolean {
    return this.activeEvents.some(e => 
      e.isActive && e.effects.some(eff => eff.type === 'hint_disable' && eff.value > 0)
    );
  }

  static getScoreMultiplier(): number {
    let multiplier = 1;
    this.activeEvents.forEach(event => {
      if (event.isActive) {
        event.effects.forEach(effect => {
          if (effect.type === 'score_multiplier') {
            multiplier *= effect.value;
          }
        });
      }
    });
    return multiplier;
  }

  static getRewardMultiplier(): number {
    let multiplier = 1;
    this.activeEvents.forEach(event => {
      event.effects.forEach(effect => {
        if (effect.type === 'reward_multiplier') {
          multiplier *= effect.value;
        }
      });
    });
    return multiplier;
  }

  static getComboMultiplier(): number {
    let multiplier = 1;
    this.activeEvents.forEach(event => {
      if (event.isActive) {
        event.effects.forEach(effect => {
          if (effect.type === 'combo_boost') {
            multiplier *= effect.value;
          }
        });
      }
    });
    return multiplier;
  }

  static consumeTimePenalty(): number {
    let totalPenalty = 0;
    const eventsToProcess: string[] = [];

    this.activeEvents.forEach(event => {
      event.effects.forEach(effect => {
        if (effect.type === 'time_penalty') {
          totalPenalty += effect.value;
          if (!eventsToProcess.includes(event.eventId)) {
            eventsToProcess.push(event.eventId);
          }
        }
      });
    });

    if (totalPenalty > 0) {
      this.saveData.totalTimeLostToEvents += totalPenalty;
      this.sessionStats.totalTimeLost += totalPenalty;
    }

    return totalPenalty;
  }

  static consumePieceDamage(): number {
    let totalDamage = 0;
    const eventsToProcess: string[] = [];

    this.activeEvents.forEach(event => {
      event.effects.forEach(effect => {
        if (effect.type === 'piece_damage_count') {
          totalDamage += effect.value;
          if (!eventsToProcess.includes(event.eventId)) {
            eventsToProcess.push(event.eventId);
          }
        }
      });
    });

    if (totalDamage > 0) {
      this.saveData.totalDamagedPieces += totalDamage;
      this.sessionStats.damagedPieces += totalDamage;
    }

    return totalDamage;
  }

  static getSessionStats(): RandomEventSessionStats {
    return { ...this.sessionStats };
  }

  static onLevelComplete(finalScore: number): void {
    if (finalScore > this.saveData.highestScoreWithEvent && this.sessionStats.eventsEncountered.length > 0) {
      this.saveData.highestScoreWithEvent = finalScore;
    }
  }

  static getTotalEventsEncountered(): number {
    return this.saveData.totalEventsEncountered;
  }

  static getPositiveEventsTotal(): number {
    return this.saveData.positiveEventsTotal;
  }

  static getNegativeEventsTotal(): number {
    return this.saveData.negativeEventsTotal;
  }

  static getEventsByTypeCount(type: RandomEventType): number {
    return this.saveData.eventsByType[type] || 0;
  }

  static getEventsByRarityCount(rarity: RandomEventRarity): number {
    return this.saveData.eventsByRarity[rarity] || 0;
  }

  static getEventStreak(): number {
    return this.saveData.eventStreak;
  }

  static getBestEventStreak(): number {
    return this.saveData.bestEventStreak;
  }

  static getUnlockedRareEvents(): string[] {
    return [...this.saveData.rareEventsUnlocked];
  }

  static getHighestScoreWithEvent(): number {
    return this.saveData.highestScoreWithEvent;
  }

  static getTotalTimeLostToEvents(): number {
    return this.saveData.totalTimeLostToEvents;
  }

  static getTotalDamagedPieces(): number {
    return this.saveData.totalDamagedPieces;
  }

  static hasActiveNegativeEvent(): boolean {
    return this.activeEvents.some(e => {
      const eventData = getRandomEventById(e.eventId);
      return e.isActive && eventData?.direction === 'negative';
    });
  }

  static hasActivePositiveEvent(): boolean {
    return this.activeEvents.some(e => {
      const eventData = getRandomEventById(e.eventId);
      return e.isActive && eventData?.direction === 'positive';
    });
  }

  static getEventData(eventId: string): RandomEventData | undefined {
    return getRandomEventById(eventId);
  }

  static endSession(): RandomEventSessionStats {
    const stats = { ...this.sessionStats };
    this.activeEvents = [];
    return stats;
  }
}
