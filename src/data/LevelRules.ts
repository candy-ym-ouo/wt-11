import { LevelRule } from '../types/GameTypes';

export const LevelRules: LevelRule[] = [
  {
    id: 1,
    name: '第一关',
    specimenId: 1,
    difficulty: 'easy',
    rows: 2,
    cols: 2,
    timeLimit: 180,
    snapPositionThreshold: 60,
    snapRotationThreshold: 20
  },
  {
    id: 2,
    name: '第二关',
    specimenId: 2,
    difficulty: 'easy',
    rows: 2,
    cols: 3,
    timeLimit: 180,
    snapPositionThreshold: 55,
    snapRotationThreshold: 18
  },
  {
    id: 3,
    name: '第三关',
    specimenId: 3,
    difficulty: 'medium',
    rows: 3,
    cols: 3,
    timeLimit: 240,
    snapPositionThreshold: 50,
    snapRotationThreshold: 15
  },
  {
    id: 4,
    name: '第四关',
    specimenId: 4,
    difficulty: 'medium',
    rows: 3,
    cols: 4,
    timeLimit: 240,
    snapPositionThreshold: 45,
    snapRotationThreshold: 15
  },
  {
    id: 5,
    name: '第五关',
    specimenId: 5,
    difficulty: 'hard',
    rows: 4,
    cols: 4,
    timeLimit: 300,
    snapPositionThreshold: 40,
    snapRotationThreshold: 12
  },
  {
    id: 6,
    name: '第六关',
    specimenId: 6,
    difficulty: 'hard',
    rows: 4,
    cols: 5,
    timeLimit: 300,
    snapPositionThreshold: 35,
    snapRotationThreshold: 10
  }
];

export function getLevelRule(id: number): LevelRule | undefined {
  return LevelRules.find(rule => rule.id === id);
}
