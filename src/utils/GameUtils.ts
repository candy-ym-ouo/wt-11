import { ScoreConfig, HintConfig } from '../config/GameConfig';
import { HintUsageStats } from '../types/GameTypes';

export function calculateScore(
  timeElapsed: number,
  timeLimit: number,
  totalPieces: number,
  perfectSnaps: number,
  hintStats: HintUsageStats = {
    outlineFlashCount: 0,
    pieceHighlightCount: 0,
    fullPreviewCount: 0,
    fullPreviewViewTime: 0,
    totalHintsUsed: 0
  }
): { score: number; stars: number; hintPenalty: number; scoringBreakdown: { name: string; score: number }[] } {
  const timeRemaining = Math.max(0, timeLimit - timeElapsed);
  const timeBonus = Math.floor(timeRemaining * ScoreConfig.timeBonusPerSecond);
  const perfectBonus = perfectSnaps * ScoreConfig.perfectSnapBonus;
  const baseScore = totalPieces * (ScoreConfig.baseScore / totalPieces);

  const penalties = HintConfig.penalties;
  const outlinePenalty = hintStats.outlineFlashCount * penalties.outlineFlashPenalty;
  const highlightPenalty = hintStats.pieceHighlightCount * penalties.pieceHighlightPenalty;
  const previewBasePenalty = hintStats.fullPreviewCount * penalties.fullPreviewPenalty;
  const previewTimePenalty = Math.floor(hintStats.fullPreviewViewTime * penalties.fullPreviewTimePenaltyPerSecond);
  const totalHintPenalty = outlinePenalty + highlightPenalty + previewBasePenalty + previewTimePenalty;

  const prePenaltyScore = Math.floor(baseScore + timeBonus + perfectBonus);
  const totalScore = Math.max(0, Math.floor(prePenaltyScore - totalHintPenalty));

  let stars = 0;
  const thresholds = ScoreConfig.starThresholds;
  if (totalScore >= thresholds[0]) stars = 1;
  if (totalScore >= thresholds[1]) stars = 2;
  if (totalScore >= thresholds[2]) stars = 3;

  const scoringBreakdown = [
    { name: '基础分', score: Math.floor(baseScore) },
    { name: '时间奖励', score: timeBonus },
    { name: '完美吸附', score: perfectBonus },
    { name: '轮廓闪烁惩罚', score: -outlinePenalty },
    { name: '单块高亮惩罚', score: -highlightPenalty },
    { name: '完整预览惩罚', score: -(previewBasePenalty + previewTimePenalty) }
  ];

  return { score: totalScore, stars, hintPenalty: totalHintPenalty, scoringBreakdown };
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
