import { ScoreConfig } from '../config/GameConfig';

export function calculateScore(
  timeElapsed: number,
  timeLimit: number,
  totalPieces: number,
  perfectSnaps: number
): { score: number; stars: number } {
  const timeRemaining = Math.max(0, timeLimit - timeElapsed);
  const timeBonus = Math.floor(timeRemaining * ScoreConfig.timeBonusPerSecond);
  const perfectBonus = perfectSnaps * ScoreConfig.perfectSnapBonus;
  const baseScore = totalPieces * (ScoreConfig.baseScore / totalPieces);

  const totalScore = Math.floor(baseScore + timeBonus + perfectBonus);

  let stars = 0;
  const thresholds = ScoreConfig.starThresholds;
  if (totalScore >= thresholds[0]) stars = 1;
  if (totalScore >= thresholds[1]) stars = 2;
  if (totalScore >= thresholds[2]) stars = 3;

  return { score: totalScore, stars };
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function getDifficultyColor(difficulty: string): number {
  switch (difficulty) {
    case 'easy':
      return 0x4caf50;
    case 'medium':
      return 0xff9800;
    case 'hard':
      return 0xf44336;
    default:
      return 0x9e9e9e;
  }
}

export function getDifficultyText(difficulty: string): string {
  switch (difficulty) {
    case 'easy':
      return '简单';
    case 'medium':
      return '中等';
    case 'hard':
      return '困难';
    default:
      return '未知';
  }
}
