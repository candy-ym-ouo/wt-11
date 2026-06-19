import { EventLevelRule } from '../types/GameTypes';

export const EVENT_ID_SPRING_FESTIVAL = 'spring_flower_festival_2026';

export const EventLevelRules: EventLevelRule[] = [
  {
    id: 1001,
    name: '春日序曲·樱',
    specimenId: 101,
    difficulty: 'easy',
    rows: 2,
    cols: 3,
    timeLimit: 180,
    snapPositionThreshold: 55,
    snapRotationThreshold: 18,
    eventId: EVENT_ID_SPRING_FESTIVAL,
    scoreMultiplier: 1.2
  },
  {
    id: 1002,
    name: '荷塘月色·莲',
    specimenId: 102,
    difficulty: 'easy',
    rows: 3,
    cols: 3,
    timeLimit: 210,
    snapPositionThreshold: 50,
    snapRotationThreshold: 16,
    eventId: EVENT_ID_SPRING_FESTIVAL,
    scoreMultiplier: 1.3
  },
  {
    id: 1003,
    name: '彼岸传说·红',
    specimenId: 103,
    difficulty: 'medium',
    rows: 3,
    cols: 4,
    timeLimit: 240,
    snapPositionThreshold: 45,
    snapRotationThreshold: 14,
    eventId: EVENT_ID_SPRING_FESTIVAL,
    scoreMultiplier: 1.5
  },
  {
    id: 1004,
    name: '月下美人·昙',
    specimenId: 104,
    difficulty: 'hard',
    rows: 4,
    cols: 4,
    timeLimit: 270,
    snapPositionThreshold: 40,
    snapRotationThreshold: 12,
    eventId: EVENT_ID_SPRING_FESTIVAL,
    scoreMultiplier: 1.8
  },
  {
    id: 1005,
    name: '冰峰圣莲·雪',
    specimenId: 105,
    difficulty: 'hard',
    rows: 4,
    cols: 5,
    timeLimit: 300,
    snapPositionThreshold: 35,
    snapRotationThreshold: 10,
    eventId: EVENT_ID_SPRING_FESTIVAL,
    scoreMultiplier: 2.0
  }
];

export function getEventLevelRule(id: number): EventLevelRule | undefined {
  return EventLevelRules.find(rule => rule.id === id);
}

export function getEventLevelRulesByEventId(eventId: string): EventLevelRule[] {
  return EventLevelRules.filter(rule => rule.eventId === eventId);
}

export function isEventLevel(levelId: number): boolean {
  return EventLevelRules.some(rule => rule.id === levelId);
}
