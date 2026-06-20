import { ScoreConfig, HintConfig, ComboRewardConfig } from '../config/GameConfig';
import { HintUsageStats, ComboRewardStats } from '../types/GameTypes';

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
  },
  comboStats: ComboRewardStats = {
    maxCombo: 0,
    rotationAdjustCount: 0,
    totalHintsUsed: 0
  }
): { score: number; stars: number; hintPenalty: number; scoringBreakdown: { name: string; score: number }[]; comboReward: number; starThresholdAdjustment: number } {
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

  const comboMultiplier = Math.min(
    ComboRewardConfig.comboMultiplierCap,
    comboStats.maxCombo * ComboRewardConfig.comboMultiplierStep
  );
  const comboBaseReward = comboStats.maxCombo > 0
    ? comboStats.maxCombo * ComboRewardConfig.comboBonusPerPiece
    : 0;
  const comboReward = Math.floor(comboBaseReward * (1 + comboMultiplier));

  let rotationReward = 0;
  if (comboStats.rotationAdjustCount === 0) {
    rotationReward = ComboRewardConfig.noRotationBonus;
  } else if (comboStats.rotationAdjustCount <= ComboRewardConfig.lowRotationThreshold) {
    rotationReward = ComboRewardConfig.lowRotationBonus;
  }

  let hintEfficiencyReward = 0;
  if (comboStats.totalHintsUsed === 0) {
    hintEfficiencyReward = ComboRewardConfig.noHintBonus;
  } else if (comboStats.totalHintsUsed <= ComboRewardConfig.lowHintThreshold) {
    hintEfficiencyReward = ComboRewardConfig.lowHintBonus;
  }

  const totalComboReward = comboReward + rotationReward + hintEfficiencyReward;

  const prePenaltyScore = Math.floor(baseScore + timeBonus + perfectBonus + totalComboReward);
  const totalScore = Math.max(0, Math.floor(prePenaltyScore - totalHintPenalty));

  let starThresholdAdjustment = 0;
  const stb = ComboRewardConfig.starThresholdBonus;
  if (comboStats.maxCombo >= 8) {
    starThresholdAdjustment += stb.combo8;
  } else if (comboStats.maxCombo >= 5) {
    starThresholdAdjustment += stb.combo5;
  } else if (comboStats.maxCombo >= 3) {
    starThresholdAdjustment += stb.combo3;
  }
  if (comboStats.totalHintsUsed === 0) {
    starThresholdAdjustment += stb.noHint;
  }
  if (comboStats.rotationAdjustCount === 0) {
    starThresholdAdjustment += stb.noRotation;
  }

  const adjustedThresholds = ScoreConfig.starThresholds.map(t => Math.max(0, t + starThresholdAdjustment));

  let stars = 0;
  if (totalScore >= adjustedThresholds[0]) stars = 1;
  if (totalScore >= adjustedThresholds[1]) stars = 2;
  if (totalScore >= adjustedThresholds[2]) stars = 3;

  const scoringBreakdown = [
    { name: '基础分', score: Math.floor(baseScore) },
    { name: '时间奖励', score: timeBonus },
    { name: '完美吸附', score: perfectBonus },
    { name: '连击奖励', score: comboReward },
    { name: '少旋转奖励', score: rotationReward },
    { name: '少提示奖励', score: hintEfficiencyReward },
    { name: '轮廓闪烁惩罚', score: -outlinePenalty },
    { name: '单块高亮惩罚', score: -highlightPenalty },
    { name: '完整预览惩罚', score: -(previewBasePenalty + previewTimePenalty) }
  ];

  return { score: totalScore, stars, hintPenalty: totalHintPenalty, scoringBreakdown, comboReward: totalComboReward, starThresholdAdjustment };
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
