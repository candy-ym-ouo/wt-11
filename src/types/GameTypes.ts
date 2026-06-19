export interface PuzzlePieceData {
  id: number;
  initialX: number;
  initialY: number;
  targetX: number;
  targetY: number;
  width: number;
  height: number;
  textureKey: string;
  sourceX: number;
  sourceY: number;
}

export interface LevelRule {
  id: number;
  name: string;
  specimenId: number;
  difficulty: 'easy' | 'medium' | 'hard';
  rows: number;
  cols: number;
  timeLimit: number;
  snapPositionThreshold: number;
  snapRotationThreshold: number;
}

export interface PlantSpecimen {
  id: number;
  name: string;
  family: string;
  description: string;
  primaryColor: number;
  secondaryColor: number;
  leafColor: number;
  stemColor: number;
  shape: 'ginkgo' | 'rose' | 'sunflower' | 'lavender' | 'orchid' | 'succulent';
}

export interface LevelData {
  id: number;
  name: string;
  rule: LevelRule;
  specimen: PlantSpecimen;
}

export interface GameState {
  currentLevelId: number;
  isPaused: boolean;
  isCompleted: boolean;
  startTime: number;
  elapsedTime: number;
  score: number;
  snappedPieces: number;
  totalPieces: number;
}

export interface LevelProgress {
  levelId: number;
  unlocked: boolean;
  bestScore: number;
  bestTime: number;
  stars: number;
  completed: boolean;
}

export interface SaveData {
  progress: Record<number, LevelProgress>;
  totalScore: number;
  unlockedLevels: number[];
}

export interface GalleryItem {
  id: number;
  name: string;
  family: string;
  description: string;
  specimenId: number;
  unlocked: boolean;
}
