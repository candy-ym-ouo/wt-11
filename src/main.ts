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
    EventRankingScene
  ],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 }
    }
  }
};

new Phaser.Game(config);
