import Phaser from 'phaser';
import { Levels } from '../data/Levels';
import { SaveManager } from '../utils/SaveManager';
import { getDifficultyColor, getDifficultyText } from '../utils/GameUtils';
import { LevelData } from '../types/GameTypes';

export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super('LevelSelectScene');
  }

  create(): void {
    this.addBackground();
    this.addTitle();
    this.addLevelGrid();
    this.addGalleryButton();
  }

  private addBackground(): void {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    const bg = this.add.graphics();
    bg.fillStyle(0x16213e, 1);
    bg.fillRoundedRect(25, 100, 700, 1150, 20);
  }

  private addTitle(): void {
    this.add.text(375, 60, '植物标本修复', {
      font: 'bold 42px Arial',
      color: '#e94560'
    }).setOrigin(0.5);

    this.add.text(375, 100, '选择关卡', {
      font: '28px Arial',
      color: '#eaeaea'
    }).setOrigin(0.5);
  }

  private addLevelGrid(): void {
    const startY = 200;
    const cardWidth = 320;
    const cardHeight = 240;
    const padding = 30;
    const cols = 2;

    Levels.forEach((level, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = padding + col * (cardWidth + padding) + cardWidth / 2;
      const y = startY + row * (cardHeight + padding) + cardHeight / 2;

      this.createLevelCard(x, y, cardWidth, cardHeight, level);
    });
  }

  private createLevelCard(
    x: number,
    y: number,
    width: number,
    height: number,
    level: LevelData
  ): void {
    const progress = SaveManager.getProgress(level.id);
    const unlocked = progress?.unlocked ?? false;

    const card = this.add.graphics();
    card.fillStyle(unlocked ? 0x0f3460 : 0x333344, 1);
    card.lineStyle(3, unlocked ? 0xe94560 : 0x555566, 1);
    card.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 15);
    card.fillRoundedRect(x - width / 2, y - height / 2, width, height, 15);

    const previewKey = `specimen-${level.specimen.id}-preview`;
    if (unlocked) {
      const previewImg = this.add.image(x, y - 65, previewKey);
      previewImg.setDisplaySize(120, 120);
    } else {
      this.add.image(x, y - 65, 'lock').setScale(1.0);
    }

    this.add.text(x, y + 10, level.name, {
      font: 'bold 22px Arial',
      color: unlocked ? '#ffffff' : '#888888'
    }).setOrigin(0.5);

    this.add.text(x, y + 40, level.specimen.name, {
      font: '18px Arial',
      color: unlocked ? '#eaeaea' : '#777777'
    }).setOrigin(0.5);

    const diffColor = getDifficultyColor(level.rule.difficulty);
    this.add.text(x, y + 68, getDifficultyText(level.rule.difficulty), {
      font: '15px Arial',
      color: '#' + diffColor.toString(16).padStart(6, '0')
    }).setOrigin(0.5);

    if (unlocked && progress) {
      this.drawStars(x, y + 98, progress.stars);
    }

    if (unlocked) {
      card.setInteractive(
        new Phaser.Geom.Rectangle(x - width / 2, y - height / 2, width, height),
        Phaser.Geom.Rectangle.Contains
      );

      card.on('pointerover', () => {
        card.lineStyle(3, 0xffffff, 1);
      });

      card.on('pointerout', () => {
        card.lineStyle(3, 0xe94560, 1);
      });

      card.on('pointerup', () => {
        this.scene.start('GameScene', { levelId: level.id });
      });
    }
  }

  private drawStars(x: number, y: number, stars: number): void {
    const starSize = 22;
    const spacing = 6;
    const startX = x - starSize - spacing;

    for (let i = 0; i < 3; i++) {
      const starX = startX + i * (starSize + spacing);
      const texture = i < stars ? 'star-filled' : 'star-empty';
      this.add.image(starX, y, texture).setDisplaySize(starSize, starSize);
    }
  }

  private addGalleryButton(): void {
    const btnX = 375;
    const btnY = 1250;

    const btn = this.add.graphics();
    btn.fillStyle(0x4caf50, 1);
    btn.fillRoundedRect(btnX - 150, btnY - 35, 300, 70, 15);
    btn.setInteractive(
      new Phaser.Geom.Rectangle(btnX - 150, btnY - 35, 300, 70),
      Phaser.Geom.Rectangle.Contains
    );

    this.add.text(btnX, btnY, '图鉴', {
      font: 'bold 26px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    btn.on('pointerover', () => {
      btn.clear();
      btn.fillStyle(0x66bb6a, 1);
      btn.fillRoundedRect(btnX - 150, btnY - 35, 300, 70, 15);
    });

    btn.on('pointerout', () => {
      btn.clear();
      btn.fillStyle(0x4caf50, 1);
      btn.fillRoundedRect(btnX - 150, btnY - 35, 300, 70, 15);
    });

    btn.on('pointerup', () => {
      this.scene.start('GalleryScene');
    });
  }
}
