export const GameConfig = {
  width: 750,
  height: 1334,
  backgroundColor: '#1a1a2e',
  pixelArt: false
};

export const SnapConfig = {
  positionThreshold: 50,
  rotationThreshold: 15,
  snapAnimationDuration: 200
};

export const ScoreConfig = {
  baseScore: 1000,
  timeBonusPerSecond: 10,
  perfectSnapBonus: 50,
  starThresholds: [1000, 2000, 3000]
};

export const HintConfig = {
  maxFullPreviewCount: 3,
  outlineFlashDuration: 2500,
  outlineFlashCount: 4,
  pieceHighlightDuration: 4000,
  fullPreviewDuration: 3000,
  fullPreviewAlpha: 0.35,
  penalties: {
    outlineFlashPenalty: 80,
    pieceHighlightPenalty: 150,
    fullPreviewPenalty: 250,
    fullPreviewTimePenaltyPerSecond: 8
  }
};
