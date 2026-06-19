import { EventData, EventRankingData, RankingEntry } from '../types/GameTypes';
import { getActiveEvent, getEventById } from '../data/Events';
import { SaveManager } from './SaveManager';
import { getEventLevelRulesByEventId } from '../data/EventLevelRules';

export type EventStatus = 'not_started' | 'active' | 'ended';

const MOCK_PLAYERS = [
  { id: 'p1', name: '植物爱好者', avatar: '🧑‍🌾' },
  { id: 'p2', name: '花园守护者', avatar: '👩‍🌾' },
  { id: 'p3', name: '标本收藏家', avatar: '🧑‍🔬' },
  { id: 'p4', name: '绿叶小能手', avatar: '🌱' },
  { id: 'p5', name: '花卉大师', avatar: '🌺' },
  { id: 'p6', name: '森林探险家', avatar: '🌲' },
  { id: 'p7', name: '春日使者', avatar: '🐝' },
  { id: 'p8', name: '蝴蝶园丁', avatar: '🦋' },
  { id: 'p9', name: '阳光花艺师', avatar: '🌻' },
  { id: 'p10', name: '月下美人', avatar: '🌙' },
  { id: 'p11', name: '雪山行者', avatar: '🏔️' },
  { id: 'p12', name: '荷塘月色', avatar: '🪷' },
  { id: 'p13', name: '樱花飘落', avatar: '🌸' },
  { id: 'p14', name: '彼岸花开', avatar: '🌷' },
  { id: 'p15', name: '多肉达人', avatar: '🪴' },
  { id: 'p16', name: '薰衣草田', avatar: '💜' },
  { id: 'p17', name: '向日葵阳', avatar: '☀️' },
  { id: 'p18', name: '玫瑰庄园', avatar: '🌹' },
  { id: 'p19', name: '兰花君子', avatar: '🌿' },
  { id: 'p20', name: '银杏秋意', avatar: '🍂' }
];

export class EventManager {
  static getCurrentEvent(): EventData | null {
    return getActiveEvent();
  }

  static getEventStatus(event: EventData): EventStatus {
    const now = Date.now();
    if (now < event.startTime) return 'not_started';
    if (now > event.endTime) return 'ended';
    return 'active';
  }

  static getCurrentEventStatus(): EventStatus {
    const event = this.getCurrentEvent();
    if (!event) return 'ended';
    return this.getEventStatus(event);
  }

  static getTimeRemaining(endTime: number): {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    totalMs: number;
  } {
    const now = Date.now();
    const diff = Math.max(0, endTime - now);
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((diff % (60 * 1000)) / 1000);
    return { days, hours, minutes, seconds, totalMs: diff };
  }

  static getTimeUntilStart(startTime: number): {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    totalMs: number;
  } {
    const now = Date.now();
    const diff = Math.max(0, startTime - now);
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((diff % (60 * 1000)) / 1000);
    return { days, hours, minutes, seconds, totalMs: diff };
  }

  static formatCountdown(time: { days: number; hours: number; minutes: number; seconds: number }): string {
    const parts: string[] = [];
    if (time.days > 0) parts.push(`${time.days}天`);
    if (time.hours > 0 || time.days > 0) parts.push(`${time.hours}时`);
    parts.push(`${time.minutes.toString().padStart(2, '0')}分`);
    parts.push(`${time.seconds.toString().padStart(2, '0')}秒`);
    return parts.join(' ');
  }

  static formatCountdownShort(time: { days: number; hours: number; minutes: number; seconds: number }): string {
    if (time.days > 0) {
      return `${time.days}天${time.hours}时`;
    }
    return `${time.hours.toString().padStart(2, '0')}:${time.minutes.toString().padStart(2, '0')}:${time.seconds.toString().padStart(2, '0')}`;
  }

  static canAccessEvent(eventId: string): boolean {
    const event = getEventById(eventId);
    if (!event) return false;
    const status = this.getEventStatus(event);
    if (status !== 'active') return false;

    const progress = SaveManager.getCompletedEventLevelsCount('dummy') || 0;
    const totalCompleted = Object.values(SaveManager.getAllProgress()).filter(p => p.completed).length;
    return totalCompleted >= event.requiredMainProgress || progress >= 0;
  }

  static isEventAccessible(): boolean {
    const event = this.getCurrentEvent();
    if (!event) return false;
    return this.canAccessEvent(event.id);
  }

  static generateRanking(eventId: string, forceRefresh: boolean = false): EventRankingData {
    const cached = SaveManager.getRankingCache(eventId);
    const cacheValidMs = 5 * 60 * 1000;

    if (!forceRefresh && cached && Date.now() - cached.lastUpdated < cacheValidMs) {
      return cached;
    }

    const event = getEventById(eventId);
    if (!event) {
      return { eventId, entries: [], lastUpdated: Date.now() };
    }

    const eventLevels = getEventLevelRulesByEventId(eventId);
    const entries: RankingEntry[] = [];

    const myScore = SaveManager.getEventTotalScore(eventId);
    const myStars = SaveManager.getEventTotalStars(eventId);
    const myCompleted = SaveManager.getCompletedEventLevelsCount(eventId);

    MOCK_PLAYERS.forEach((player, index) => {
      const baseScore = Math.floor(Math.random() * 25000) + 2000;
      const variance = Math.floor(Math.random() * 8000) - 2000;
      const score = Math.max(500, baseScore + variance - index * 500);
      const levelsCount = eventLevels.length;
      const completedLevels = Math.min(levelsCount, Math.floor(Math.random() * (levelsCount + 1)));
      const stars = completedLevels * 2 + Math.floor(Math.random() * 3);

      entries.push({
        rank: 0,
        playerId: player.id,
        playerName: player.name,
        avatar: player.avatar,
        score,
        stars: Math.min(levelsCount * 3, stars),
        levelsCompleted: completedLevels
      });
    });

    const currentPlayerEntry: RankingEntry = {
      rank: 0,
      playerId: 'me',
      playerName: '我',
      avatar: '🎮',
      score: myScore,
      stars: myStars,
      levelsCompleted: myCompleted,
      isCurrentPlayer: true
    };

    entries.push(currentPlayerEntry);
    entries.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.stars !== a.stars) return b.stars - a.stars;
      return b.levelsCompleted - a.levelsCompleted;
    });

    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    const top50 = entries.slice(0, 50);

    const result: EventRankingData = {
      eventId,
      entries: top50,
      lastUpdated: Date.now(),
      currentPlayerEntry: entries.find(e => e.isCurrentPlayer)
    };

    SaveManager.setRankingCache(eventId, result);
    return result;
  }

  static getPlayerRank(eventId: string): number {
    const ranking = this.generateRanking(eventId);
    return ranking.currentPlayerEntry?.rank || 0;
  }

  static getScoreProgressPercent(eventId: string, rewardThreshold: number): number {
    const myScore = SaveManager.getEventTotalScore(eventId);
    return Math.min(100, (myScore / rewardThreshold) * 100);
  }

  static getNextReward(eventId: string): { reward: any; progress: number } | null {
    const event = getEventById(eventId);
    if (!event) return null;

    const myScore = SaveManager.getEventTotalScore(eventId);
    const eventProgress = SaveManager.getEventProgress(eventId);

    const unclaimedRewards = event.rewards
      .filter(r => !eventProgress?.rewardsClaimed[r.id])
      .sort((a, b) => a.threshold - b.threshold);

    if (unclaimedRewards.length === 0) return null;

    const nextReward = unclaimedRewards[0];
    const progress = Math.min(100, (myScore / nextReward.threshold) * 100);

    return { reward: nextReward, progress };
  }

  static getEventCompletionSummary(eventId: string): {
    totalLevels: number;
    completedLevels: number;
    totalStars: number;
    earnedStars: number;
    totalRewards: number;
    claimedRewards: number;
    score: number;
    rank: number;
  } {
    const event = getEventById(eventId);
    const eventLevels = getEventLevelRulesByEventId(eventId);
    const eventProgress = SaveManager.getEventProgress(eventId);

    const completedLevels = SaveManager.getCompletedEventLevelsCount(eventId);
    const earnedStars = SaveManager.getEventTotalStars(eventId);
    const score = SaveManager.getEventTotalScore(eventId);
    const rank = this.getPlayerRank(eventId);

    const totalRewards = event?.rewards.length || 0;
    const claimedRewards = eventProgress
      ? Object.values(eventProgress.rewardsClaimed).filter(Boolean).length
      : 0;

    return {
      totalLevels: eventLevels.length,
      completedLevels,
      totalStars: eventLevels.length * 3,
      earnedStars,
      totalRewards,
      claimedRewards,
      score,
      rank
    };
  }
}
