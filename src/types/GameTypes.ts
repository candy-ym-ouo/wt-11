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

export interface GalleryItem {
  id: number;
  name: string;
  family: string;
  description: string;
  specimenId: number;
  unlocked: boolean;
  chapterId: number;
  isEventExclusive?: boolean;
  eventId?: string;
  eventName?: string;
}

export interface Reward {
  type: 'score' | 'specimen' | 'badge';
  id: number;
  name: string;
  description: string;
  value?: number;
}

export interface ChapterData {
  id: number;
  name: string;
  description: string;
  theme: string;
  primaryColor: number;
  secondaryColor: number;
  levelIds: number[];
  requiredStars: number;
  rewards: Reward[];
  backgroundImage?: string;
  unlocked: boolean;
}

export interface ChapterProgress {
  chapterId: number;
  unlocked: boolean;
  completed: boolean;
  totalStars: number;
  rewardsClaimed: boolean;
  completedAt?: number;
}

export interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

export interface Fragment {
  id: number;
  specimenId: number;
  name: string;
  rarity: 'common' | 'rare' | 'epic';
}

export interface Material {
  id: number;
  name: string;
  icon: string;
  description: string;
}

export interface WorkshopRecipe {
  specimenId: number;
  requiredFragments: { fragmentId: number; count: number }[];
  requiredMaterials: { materialId: number; count: number }[];
}

export interface WorkshopProgress {
  fragments: Record<number, number>;
  materials: Record<number, number>;
  restoredSpecimens: number[];
}

export interface EventLevelRule extends LevelRule {
  eventId: string;
  scoreMultiplier: number;
}

export interface EventData {
  id: string;
  name: string;
  description: string;
  theme: string;
  banner: string;
  primaryColor: number;
  secondaryColor: number;
  accentColor: number;
  startTime: number;
  endTime: number;
  levelIds: number[];
  rewards: EventReward[];
  requiredMainProgress: number;
}

export interface EventReward {
  id: number;
  type: 'score' | 'specimen' | 'badge' | 'material' | 'fragment';
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  threshold: number;
  value?: number;
  specimenId?: number;
}

export interface EventLevelProgress {
  eventLevelId: number;
  unlocked: boolean;
  bestScore: number;
  bestTime: number;
  stars: number;
  completed: boolean;
  attempts: number;
  lastPlayedAt?: number;
}

export interface EventProgress {
  eventId: string;
  participated: boolean;
  totalScore: number;
  currentRank: number;
  levelProgress: Record<number, EventLevelProgress>;
  rewardsClaimed: Record<number, boolean>;
  unlockedEventGallery: number[];
  joinedAt?: number;
  lastActiveAt?: number;
}

export interface RankingEntry {
  rank: number;
  playerId: string;
  playerName: string;
  avatar: string;
  score: number;
  stars: number;
  levelsCompleted: number;
  isCurrentPlayer?: boolean;
}

export interface EventRankingData {
  eventId: string;
  entries: RankingEntry[];
  lastUpdated: number;
  currentPlayerEntry?: RankingEntry;
}

export interface EventSaveData {
  activeEventId: string | null;
  eventProgress: Record<string, EventProgress>;
  eventBadges: Record<number, boolean>;
  eventGalleryUnlocked: number[];
  rankingCache: Record<string, EventRankingData>;
}

export type DailyQuestType = 'restore_plant' | 'timed_score' | 'win_streak';
export type DailyQuestStatus = 'pending' | 'in_progress' | 'completed' | 'claimed';

export interface DailyQuestReward {
  type: 'score' | 'fragment' | 'material';
  id: number;
  name: string;
  description: string;
  value: number;
  rarity: 'common' | 'rare' | 'epic';
}

export interface DailyQuest {
  id: string;
  type: DailyQuestType;
  title: string;
  description: string;
  targetSpecimenId?: number;
  targetLevelId?: number;
  targetScore?: number;
  targetTimeLimit?: number;
  targetStreak?: number;
  targetCount?: number;
  currentProgress: number;
  targetProgress: number;
  status: DailyQuestStatus;
  rewards: DailyQuestReward[];
  difficulty: 'easy' | 'medium' | 'hard';
  expiresAt: number;
  createdAt: number;
  completedAt?: number;
  claimedAt?: number;
}

export interface DailyQuestProgress {
  consecutiveWins: number;
  lastWinTime?: number;
  todayPlayedLevels: number[];
  todayBestScores: Record<number, number>;
  todayBestTimes: Record<number, number>;
  restoredToday: number[];
}

export interface DailyQuestSaveData {
  quests: Record<string, DailyQuest>;
  lastRefreshDate: string;
  refreshCount: number;
  totalCompleted: number;
  totalClaimed: number;
  progress: DailyQuestProgress;
  claimedQuestIds: string[];
}

export type PlantCategory = 'gymnosperm' | 'angiosperm_dicot' | 'angiosperm_monocot' | 'succulent' | 'aquatic' | 'alpine';

export interface PlantCategoryInfo {
  id: PlantCategory;
  name: string;
  description: string;
  icon: string;
  color: number;
}

export interface KnowledgeEntry {
  id: string;
  specimenId: number;
  title: string;
  content: string;
  requiredLevel: number;
  category: 'biology' | 'ecology' | 'culture' | 'usage';
}

export interface SpecimenResearch {
  specimenId: number;
  researchLevel: number;
  expPoints: number;
  unlockedKnowledge: string[];
  firstStudiedAt?: number;
  lastStudiedAt?: number;
}

export interface ResearchLabProgress {
  totalExp: number;
  researcherLevel: number;
  specimens: Record<number, SpecimenResearch>;
  researchPoints: number;
  totalStudies: number;
}

export interface ResearchLevelConfig {
  level: number;
  expRequired: number;
  title: string;
  researchPointBonus: number;
  unlockMessage?: string;
}

export type TowerRuleType = 
  | 'rotation_lock'
  | 'time_penalty'
  | 'mirror_pieces'
  | 'hidden_target'
  | 'moving_target'
  | 'limited_mistake_penalty'
  | 'combo_bonus'
  | 'no_hint_restriction'
  | 'shuffle_every_n_pieces'
  | 'extra_pieces';

export interface TowerRuleModifier {
  type: TowerRuleType;
  name: string;
  description: string;
  value?: number;
}

export interface TowerScoringCondition {
  type: 'time' | 'accuracy' | 'combo' | 'mistakes' | 'hint_usage' | 'perfect_snap';
  name: string;
  weight: number;
  description: string;
  threshold?: number;
}

export interface TowerFloorData {
  id: number;
  name: string;
  description: string;
  floorNumber: number;
  specimenId: number;
  difficulty: 'hard' | 'extreme' | 'nightmare';
  rows: number;
  cols: number;
  timeLimit: number;
  snapPositionThreshold: number;
  snapRotationThreshold: number;
  rules: TowerRuleModifier[];
  scoringConditions: TowerScoringCondition[];
  rewards: TowerReward[];
  requiredStars: number;
  unlockedDefault?: boolean;
}

export interface TowerReward {
  type: 'score' | 'badge' | 'fragment' | 'material' | 'research_point';
  id: number;
  name: string;
  description: string;
  value?: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  specimenId?: number;
}

export interface TowerFloorProgress {
  floorId: number;
  unlocked: boolean;
  completed: boolean;
  bestScore: number;
  bestTime: number;
  stars: number;
  attempts: number;
  bestAccuracy?: number;
  bestCombo?: number;
  rewardsClaimed: boolean;
  lastPlayedAt?: number;
  completedAt?: number;
}

export interface TowerSaveData {
  highestFloor: number;
  totalStars: number;
  totalScore: number;
  floorProgress: Record<number, TowerFloorProgress>;
  badges: Record<number, boolean>;
  currentStreak: number;
  bestStreak: number;
  totalAttempts: number;
  totalCompletions: number;
}

export interface TowerResultData {
  floorId: number;
  score: number;
  stars: number;
  time: number;
  accuracy: number;
  maxCombo: number;
  mistakes: number;
  hintsUsed: number;
  perfectSnaps: number;
  scoringBreakdown: { condition: string; score: number; maxScore: number }[];
  isNewRecord: boolean;
  isNewBestTime: boolean;
  unlockedNextFloor: boolean;
  rewards: TowerReward[];
}

export type ExhibitionThemeType = 'color' | 'family' | 'shape' | 'season' | 'rarity';

export interface ExhibitionTheme {
  id: string;
  name: string;
  description: string;
  type: ExhibitionThemeType;
  icon: string;
  primaryColor: number;
  secondaryColor: number;
  accentColor: number;
  requiredSpecimenIds: number[];
  requiredStars: number;
  startTime?: number;
  endTime?: number;
  rewards: ExhibitionReward[];
}

export interface ExhibitionReward {
  id: number;
  type: 'score' | 'badge' | 'fragment' | 'material' | 'research_point';
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  threshold: number;
  value?: number;
  specimenId?: number;
  badgeId?: number;
}

export interface ExhibitionBadge {
  id: number;
  name: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  requiredScore: number;
  exhibitionThemeId: string;
}

export interface ExhibitionSpecimenSubmission {
  specimenId: number;
  submittedAt: number;
  stars: number;
  bestTime: number;
  bestScore: number;
}

export interface ExhibitionProgress {
  themeId: string;
  participated: boolean;
  joinedAt?: number;
  submissions: Record<number, ExhibitionSpecimenSubmission>;
  completionScore: number;
  speedScore: number;
  starScore: number;
  totalScore: number;
  rewardsClaimed: Record<number, boolean>;
  badgesUnlocked: number[];
  lastSubmittedAt?: number;
}

export interface ExhibitionSaveData {
  totalExhibitionScore: number;
  totalParticipations: number;
  themeProgress: Record<string, ExhibitionProgress>;
  badges: Record<number, boolean>;
}

export interface ExhibitionResultData {
  themeId: string;
  submittedSpecimens: number[];
  completionScore: number;
  speedScore: number;
  starScore: number;
  totalScore: number;
  newlyUnlockedBadges: ExhibitionBadge[];
  newRewards: ExhibitionReward[];
  isFirstParticipation: boolean;
  isNewHighScore: boolean;
}

export interface SaveData {
  progress: Record<number, LevelProgress>;
  chapterProgress: Record<number, ChapterProgress>;
  badges: Record<number, boolean>;
  totalScore: number;
  unlockedLevels: number[];
  unlockedChapters: number[];
  galleryUnlocked: number[];
  workshop: WorkshopProgress;
  event: EventSaveData;
  dailyQuest: DailyQuestSaveData;
  researchLab: ResearchLabProgress;
  tower: TowerSaveData;
  exhibition: ExhibitionSaveData;
}
