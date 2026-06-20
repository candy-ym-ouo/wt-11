import Phaser from 'phaser';
import { GameConfig } from './config/GameConfig';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { ChapterSelectScene } from './scenes/ChapterSelectScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { GameScene } from './scenes/GameScene';
import { GalleryScene } from './scenes/GalleryScene';
import { ChapterCompleteScene } from './scenes/ChapterCompleteScene';
import { WorkshopScene } from './scenes/WorkshopScene';
import { EventScene } from './scenes/EventScene';
import { EventLevelSelectScene } from './scenes/EventLevelSelectScene';
import { EventRankingScene } from './scenes/EventRankingScene';
import { DailyQuestScene } from './scenes/DailyQuestScene';
import { ResearchLabScene } from './scenes/ResearchLabScene';
import { TowerSelectScene } from './scenes/TowerSelectScene';
import { TowerResultScene } from './scenes/TowerResultScene';
import { ExhibitionScene } from './scenes/ExhibitionScene';
import { AchievementScene } from './scenes/AchievementScene';
import { TutorialScene } from './scenes/TutorialScene';
import { ConservationScene } from './scenes/ConservationScene';
import { PlantFamilyScene } from './scenes/PlantFamilyScene';
import { SeasonPassScene } from './scenes/SeasonPassScene';
import { CustomPuzzleScene } from './scenes/CustomPuzzleScene';
import { CustomPuzzleGameScene } from './scenes/CustomPuzzleGameScene';
import { RepairLogScene } from './scenes/RepairLogScene';
import { NotificationScene } from './scenes/NotificationScene';
import { QuizScene } from './scenes/QuizScene';
import { QuizResultScene } from './scenes/QuizResultScene';
import { ChapterMapScene } from './scenes/ChapterMapScene';
import { EndingScene } from './scenes/EndingScene';
import { DonationScene } from './scenes/DonationScene';
import { ProfileScene } from './scenes/ProfileScene';
import { ReplayScene } from './scenes/ReplayScene';
import { FirstShowcaseScene } from './scenes/FirstShowcaseScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GameConfig.width,
  height: GameConfig.height,
  backgroundColor: GameConfig.backgroundColor,
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [
    BootScene,
    PreloadScene,
    ChapterSelectScene,
    LevelSelectScene,
    GameScene,
    GalleryScene,
    ChapterCompleteScene,
    WorkshopScene,
    EventScene,
    EventLevelSelectScene,
    EventRankingScene,
    DailyQuestScene,
    ResearchLabScene,
    TowerSelectScene,
    TowerResultScene,
    ExhibitionScene,
    AchievementScene,
    TutorialScene,
    ConservationScene,
    PlantFamilyScene,
    SeasonPassScene,
    CustomPuzzleScene,
    CustomPuzzleGameScene,
    RepairLogScene,
    NotificationScene,
    QuizScene,
    QuizResultScene,
    ChapterMapScene,
    EndingScene,
    DonationScene,
    ProfileScene,
    ReplayScene,
    FirstShowcaseScene
  ],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 }
    }
  }
};

new Phaser.Game(config);
