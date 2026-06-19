export interface PuzzlePiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  width: number;
  height: number;
  textureKey: string;
  frameIndex: number;
}

export interface LevelData {
  id: number;
  name: string;
  description: string;
  plantName: string;
  plantFamily: string;
  difficulty: 'easy' | 'medium' | 'hard';
  pieces: PuzzlePiece[];
  targetImage: string;
  previewImage: string;
  timeLimit: number;
  rows: number;
  cols: number;
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
  image: string;
  unlocked: boolean;
}
