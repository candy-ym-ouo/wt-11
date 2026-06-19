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
  genus: string;
  description: string;
  primaryColor: number;
  secondaryColor: number;
  leafColor: number;
  stemColor: number;
  shape: 'ginkgo' | 'rose' | 'sunflower' | 'lavender' | 'orchid' | 'succulent';
}

export interface FamilyReward {
  type: 'score' | 'badge' | 'title' | 'research_point' | 'material';
  id: number;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requiredProgress: number;
  value?: number;
}

export interface PlantFamily {
  id: string;
  familyName: string;
  genusName: string;
  description: string;
  featureDescription: string;
  primaryColor: number;
  secondaryColor: number;
  accentColor: number;
  icon: string;
  specimenIds: number[];
  rewards: FamilyReward[];
  illustrationKey: string;
  illustrationTitle: string;
  illustrationDescription: string;
  isLimited?: boolean;
}

export interface FamilyProgress {
  familyId: string;
  unlockedSpecimens: number[];
  rewardsClaimed: Record<number, boolean>;
  illustrationUnlocked: boolean;
  totalStars: number;
  firstUnlockedAt?: number;
  completedAt?: number;
}

export interface FamilyCollectionSaveData {
  familyProgress: Record<string, FamilyProgress>;
  totalFamiliesCompleted: number;
  totalSpecimensByFamily: Record<string, number>;
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
  routeId?: BranchRouteType;
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

export type BranchRouteType = 'flower' | 'tree' | 'herb';

export interface MapNodeData {
  id: string;
  type: 'level' | 'story' | 'boss' | 'reward' | 'ending';
  name: string;
  description: string;
  x: number;
  y: number;
  levelId?: number;
  rewards?: Reward[];
  storyContent?: string;
  endingId?: string;
  requiredStars?: number;
  icon?: string;
}

export interface BranchRouteData {
  id: BranchRouteType;
  name: string;
  description: string;
  theme: string;
  primaryColor: number;
  secondaryColor: number;
  accentColor: number;
  icon: string;
  backgroundPattern: string;
  nodes: MapNodeData[];
  connections: { from: string; to: string }[];
  startingNodeId: string;
  endingNodeId: string;
  totalLevels: number;
  requiredStars: number;
  unlocked: boolean;
}

export interface BranchRouteProgress {
  routeId: BranchRouteType;
  unlocked: boolean;
  completed: boolean;
  currentNodeId: string;
  completedNodeIds: string[];
  unlockedNodeIds: string[];
  totalStars: number;
  rewardsClaimed: Record<string, boolean>;
  endingViewed: boolean;
  completedAt?: number;
  firstUnlockedAt?: number;
}

export interface EndingData {
  id: string;
  routeId: BranchRouteType;
  title: string;
  subtitle: string;
  description: string;
  longDescription: string;
  illustrationKey: string;
  primaryColor: number;
  secondaryColor: number;
  rewards: Reward[];
  badgeId?: number;
}

export interface ChapterMapSaveData {
  routeProgress: Record<BranchRouteType, BranchRouteProgress>;
  totalRoutesCompleted: number;
  activeRouteId: BranchRouteType | null;
  unlockedRoutes: BranchRouteType[];
  endingsViewed: string[];
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

export type DailyQuestType = 'restore_plant' | 'timed_score' | 'win_streak' | 'care_specimen';
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

export type AchievementCategory = 'level' | 'gallery' | 'speed' | 'login' | 'collection' | 'special';
export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type TitleRarity = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface AchievementCondition {
  type: string;
  target: number;
  levelId?: number;
  chapterId?: number;
  difficulty?: string;
  specimenId?: number;
  days?: number;
  tutorialId?: string;
}

export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  condition: AchievementCondition;
  rewardScore?: number;
  unlocked: boolean;
  unlockedAt?: number;
  progress?: number;
  totalProgress?: number;
}

export interface Title {
  id: number;
  name: string;
  description: string;
  icon: string;
  rarity: TitleRarity;
  requiredAchievementIds: number[];
  unlocked: boolean;
  unlockedAt?: number;
}

export interface AchievementSaveData {
  unlockedAchievements: Record<number, boolean>;
  unlockedTitles: Record<number, boolean>;
  currentTitleId: number | null;
  achievementProgress: Record<number, number>;
  loginStreak: number;
  lastLoginDate: string;
  totalLogins: number;
  fastestCompletion: Record<number, number>;
  perfectLevels: number[];
  totalAchievementScore: number;
}

export interface AchievementUnlockResult {
  newlyUnlocked: Achievement[];
  newlyUnlockedTitles: Title[];
  scoreGained: number;
}

export type TutorialActionType = 
  | 'click' 
  | 'drag' 
  | 'rotate' 
  | 'snap' 
  | 'wait' 
  | 'complete';

export interface TutorialHighlight {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'rect' | 'circle';
  pulse?: boolean;
}

export interface TutorialArrow {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color?: number;
}

export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  actionType: TutorialActionType;
  targetElement?: string;
  targetPieceId?: number;
  highlight?: TutorialHighlight;
  arrow?: TutorialArrow;
  autoNext?: boolean;
  autoNextDelay?: number;
  showDemo?: boolean;
  demoData?: {
    pieceId: number;
    targetX: number;
    targetY: number;
    targetRotation?: number;
  };
  validation?: {
    type: 'piece_snapped' | 'piece_rotated' | 'piece_dragged' | 'level_completed' | 'custom';
    pieceId?: number;
    customCheck?: string;
  };
  position?: {
    x: number;
    y: number;
    align?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  };
  canSkip?: boolean;
}

export interface TutorialData {
  id: string;
  name: string;
  description: string;
  levelId: number;
  isTeachingLevel: boolean;
  steps: TutorialStep[];
  rewards: Reward[];
  requiredForProgress: boolean;
  unlockMessage?: string;
}

export interface TutorialProgress {
  tutorialId: string;
  currentStepId: string;
  currentStepIndex: number;
  completed: boolean;
  completedAt?: number;
  skipped: boolean;
  skippedAt?: number;
  rewardsClaimed: boolean;
  attempts: number;
}

export interface TutorialSaveData {
  completedTutorials: string[];
  skippedTutorials: string[];
  currentTutorialId: string | null;
  progress: Record<string, TutorialProgress>;
  teachingLevelCompleted: boolean;
  teachingLevelSkipped: boolean;
  firstTimePlayer: boolean;
  rewardsClaimed: Record<string, boolean>;
}

export interface TutorialCompletionResult {
  newlyCompleted: boolean;
  rewards: Reward[];
  unlockedLevelId?: number;
  achievementResult?: AchievementUnlockResult;
}

export type ConservationHealthLevel = 'thriving' | 'healthy' | 'fair' | 'declining' | 'critical';
export type CareActionType = 'water' | 'prune' | 'fertilize' | 'pest_control' | 'repot';

export interface CareActionDef {
  type: CareActionType;
  name: string;
  icon: string;
  description: string;
  healthRecovery: number;
  materialCost: { materialId: number; count: number }[];
  cooldownMs: number;
}

export interface SpecimenConservationState {
  specimenId: number;
  health: number;
  lastCareTimestamp: Record<CareActionType, number>;
  lastDecayTick: number;
  totalCaresPerformed: number;
  consecutiveCares: number;
  lastCareAt?: number;
}

export interface ConservationReminder {
  specimenId: number;
  healthLevel: ConservationHealthLevel;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: number;
}

export interface ConservationSaveData {
  specimens: Record<number, SpecimenConservationState>;
  totalCares: number;
  decayAccumulator: number;
  lastDecayProcessTime: number;
  dismissedReminders: number[];
}

export type SeasonPassTrackType = 'restore' | 'score' | 'gallery';
export type SeasonPassRewardType = 'score' | 'fragment' | 'material' | 'badge' | 'specimen' | 'research_point' | 'title';
export type SeasonPassQuestStatus = 'pending' | 'in_progress' | 'completed' | 'claimed';
export type SeasonPassRewardTier = 'free' | 'premium';

export interface SeasonPassReward {
  id: number;
  type: SeasonPassRewardType;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  value?: number;
  fragmentId?: number;
  materialId?: number;
  badgeId?: number;
  specimenId?: number;
  titleId?: number;
}

export interface SeasonPassTier {
  level: number;
  trackType: SeasonPassTrackType;
  threshold: number;
  freeReward?: SeasonPassReward;
  premiumReward?: SeasonPassReward;
}

export interface SeasonPassQuest {
  id: string;
  title: string;
  description: string;
  trackType: SeasonPassTrackType;
  targetCount: number;
  currentProgress: number;
  status: SeasonPassQuestStatus;
  rewards: SeasonPassReward[];
  difficulty: 'easy' | 'medium' | 'hard';
  expiresAt: number;
  createdAt: number;
  completedAt?: number;
  claimedAt?: number;
  targetSpecimenId?: number;
  targetLevelId?: number;
  targetScore?: number;
}

export interface SeasonPassQuestConfig {
  id: string;
  title: string;
  description: string;
  trackType: SeasonPassTrackType;
  targetCount: number;
  rewards: SeasonPassReward[];
  difficulty: 'easy' | 'medium' | 'hard';
  durationDays: number;
  targetSpecimenId?: number;
  targetLevelId?: number;
  targetScore?: number;
}

export interface SeasonPassProgress {
  trackType: SeasonPassTrackType;
  currentValue: number;
  currentLevel: number;
  maxLevel: number;
  nextLevelThreshold: number;
  totalXp: number;
}

export interface SeasonPassTrackProgress {
  restore: SeasonPassProgress;
  score: SeasonPassProgress;
  gallery: SeasonPassProgress;
}

export interface SeasonPassSaveData {
  seasonId: string;
  seasonName: string;
  isPremium: boolean;
  startDate: number;
  endDate: number;
  trackProgress: SeasonPassTrackProgress;
  rewardsClaimed: Record<string, Record<number, boolean>>;
  quests: Record<string, SeasonPassQuest>;
  lastRefreshDate: string;
  refreshCount: number;
  totalRestores: number;
  totalScoreGain: number;
  totalGalleryUnlocks: number;
  completedQuests: number;
  claimedQuests: number;
  pendingRewards: SeasonPassReward[];
}

export interface SeasonPassClaimResult {
  success: boolean;
  trackType: SeasonPassTrackType;
  level: number;
  tier: SeasonPassRewardTier;
  reward: SeasonPassReward;
}

export interface SeasonPassUpdateResult {
  trackType: SeasonPassTrackType;
  oldValue: number;
  newValue: number;
  oldLevel: number;
  newLevel: number;
  leveledUp: boolean;
  newlyUnlockedRewards: { level: number; tier: SeasonPassRewardTier; reward: SeasonPassReward; tierConfig: SeasonPassTier }[];
}

export interface SliceScheme {
  id: string;
  name: string;
  rows: number;
  cols: number;
  icon: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface DifficultyScheme {
  id: string;
  name: string;
  icon: string;
  description: string;
  timeLimit: number;
  snapPositionThreshold: number;
  snapRotationThreshold: number;
  scoreMultiplier: number;
  color: number;
}

export interface SettlementRule {
  id: string;
  name: string;
  description: string;
  icon: string;
  baseScore: number;
  timeBonusPerSecond: number;
  perfectSnapBonus: number;
  starThresholds: number[];
  fragmentDropBonus: number;
  materialDropBonus: number;
}

export interface CustomPuzzleConfig {
  specimenId: number;
  sliceSchemeId: string;
  difficultySchemeId: string;
  settlementRuleId: string;
}

export interface CustomPuzzleRecord {
  specimenId: number;
  sliceSchemeId: string;
  difficultySchemeId: string;
  settlementRuleId: string;
  bestScore: number;
  bestTime: number;
  stars: number;
  playCount: number;
  lastPlayedAt?: number;
}

export interface CustomPuzzleSaveData {
  records: Record<string, CustomPuzzleRecord>;
  totalPlays: number;
  totalScore: number;
}

export type KeyOperationType =
  | 'first_completion'
  | 'new_record'
  | 'new_best_time'
  | 'star_upgrade'
  | 'perfect_clear'
  | 'conservation_bonus'
  | 'combo_achieved'
  | 'no_hints_used'
  | 'event_level'
  | 'tower_floor'
  | 'mirror_broken';

export interface RepairLogEntry {
  id: string;
  levelId: number;
  specimenId: number;
  specimenName: string;
  score: number;
  time: number;
  stars: number;
  previousStars: number;
  previousBestScore: number;
  previousBestTime: number;
  scoreDelta: number;
  timeDelta: number;
  starChange: number;
  keyOperations: KeyOperationType[];
  difficulty: 'easy' | 'medium' | 'hard';
  isEventLevel: boolean;
  eventId: string | null;
  isTowerFloor: boolean;
  towerFloorId: number | null;
  completedAt: number;
}

export interface RepairLogSaveData {
  entries: RepairLogEntry[];
  totalEntries: number;
}

export type NotificationType = 
  | 'event_start' 
  | 'event_end' 
  | 'reward_available' 
  | 'gallery_unlock' 
  | 'streak_broken'
  | 'daily_quest'
  | 'achievement'
  | 'season_pass'
  | 'conservation'
  | 'system';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  icon: string;
  priority: NotificationPriority;
  timestamp: number;
  read: boolean;
  dismissed: boolean;
  relatedId?: string | number;
  relatedType?: string;
  actionLabel?: string;
  actionScene?: string;
  data?: Record<string, any>;
  expiresAt?: number;
}

export interface NotificationSummary {
  totalCount: number;
  unreadCount: number;
  highPriorityCount: number;
  byType: Record<NotificationType, number>;
  hasRewardsToClaim: boolean;
  hasActiveEvent: boolean;
  streakBroken: boolean;
}

export interface NotificationSaveData {
  notifications: NotificationData[];
  lastCheckTime: number;
  lastStreakCheckDate: string;
  dismissedNotificationIds: string[];
  maxStored: number;
}

export interface QuizQuestion {
  id: string;
  specimenId: number;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'biology' | 'ecology' | 'culture' | 'usage';
}

export interface ChapterQuizConfig {
  chapterId: number;
  quizId: string;
  name: string;
  description: string;
  requiredSpecimenIds: number[];
  questionIds: string[];
  passingScore: number;
  timeLimit: number;
  rewards: QuizReward[];
  icon: string;
  primaryColor: number;
  secondaryColor: number;
}

export interface QuizReward {
  type: 'score' | 'research_point' | 'material' | 'fragment' | 'badge' | 'star_bonus';
  id: number;
  name: string;
  description: string;
  value: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  icon: string;
  fragmentId?: number;
  materialId?: number;
  badgeId?: number;
}

export interface QuizProgress {
  quizId: string;
  bestScore: number;
  bestTime: number;
  completed: boolean;
  attempts: number;
  rewardsClaimed: boolean;
  lastPlayedAt?: number;
  completedAt?: number;
  highestStreak: number;
}

export interface QuizSession {
  quizId: string;
  currentQuestionIndex: number;
  questions: QuizQuestion[];
  score: number;
  correctCount: number;
  incorrectCount: number;
  currentStreak: number;
  startTime: number;
  elapsedTime: number;
  answers: { questionId: string; selectedIndex: number; isCorrect: boolean; timeTaken: number }[];
}

export interface QuizResultData {
  quizId: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  accuracy: number;
  timeTaken: number;
  passed: boolean;
  isNewRecord: boolean;
  isNewBestTime: boolean;
  highestStreak: number;
  rewards: QuizReward[];
  bonusResearchExp: number;
  bonusResearchPoints: number;
  chapterStarBonus: number;
  wrongAnswers: { question: QuizQuestion; selectedIndex: number }[];
}

export interface QuizSaveData {
  quizProgress: Record<string, QuizProgress>;
  totalQuizScore: number;
  totalQuizzesCompleted: number;
  totalCorrectAnswers: number;
  totalQuestionsAnswered: number;
  currentStreak: number;
  bestStreak: number;
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
  achievement: AchievementSaveData;
  tutorial: TutorialSaveData;
  conservation: ConservationSaveData;
  familyCollection: FamilyCollectionSaveData;
  seasonPass: SeasonPassSaveData;
  customPuzzle: CustomPuzzleSaveData;
  repairLog: RepairLogSaveData;
  notification: NotificationSaveData;
  quiz: QuizSaveData;
  chapterMap: ChapterMapSaveData;
}
