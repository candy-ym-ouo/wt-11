import Phaser from 'phaser';
import { SaveManager } from '../utils/SaveManager';
import { EventManager } from '../utils/EventManager';
import { getDifficultyColor, getDifficultyText } from '../utils/GameUtils';
import { getEventLevelRulesByEventId, getEventLevelRule } from '../data/EventLevelRules';
import { getPlantSpecimen } from '../data/PlantSpecimens';
import { getEventById } from '../data/Events';
import { EventLevelRule, EventData } from '../types/GameTypes';

export class EventLevelSelectScene extends Phaser.Scene {
  private eventId!: string;
  private eventData!: EventData;
  private eventLevels!: EventLevelRule[];

  constructor() {
    super('EventLevelSelectScene');
  }

  init(data: { eventId: string }): void {
    this.eventId = data.eventId;
    this.eventData = getEventById(data.eventId)!;
    this.eventLevels = getEventLevelRulesByEventId(data.eventId);
  }

  create(): void {
    this.addBackground();
    this.addHeader();
    this.addStatsBar();
    this.addLevelCards();
    this.addBottomButtons();
  }

  private addBackground(): void {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    const bg = this.add.graphics();
    bg.fillStyle(0x16213e, 1);
    bg.fillRoundedRect(20, 120, 710, 1140, 20);

    const decor = this.add.graphics();
    for (let i = 0; i < 10; i++) {
      const x = Phaser.Math.Between(50, 700);
      const y = Phaser.Math.Between(140, 1230);
      decor.fillStyle(this.eventData.primaryColor, 0.04);
      decor.fillCircle(x, y, Phaser.Math.Between(20, 60));
    }
  }

  private addHeader(): void {
    const event = this.eventData;

    const headerBg = this.add.graphics();
    const gradientSteps = 15;
    for (let i = 0; i < gradientSteps; i++) {
      const t = i / gradientSteps;
      const r = Math.floor(((event.primaryColor >> 16) & 0xff) * (1 - t) + ((event.secondaryColor >> 16) & 0xff) * t);
      const g = Math.floor(((event.primaryColor >> 8) & 0xff) * (1 - t) + ((event.secondaryColor >> 8) & 0xff) * t);
      const b = Math.floor((event.primaryColor & 0xff) * (1 - t) + (event.secondaryColor & 0xff) * t);
      const color = (r << 16) | (g << 8) | b;
      headerBg.fillStyle(color, 0.95);
      headerBg.fillRect(20 + (710 * i) / gradientSteps, 25, 710 / gradientSteps + 1, 80);
    }
    headerBg.fillRoundedRect(20, 25, 710, 80, 14);

    this.add.text(375, 50, `${event.banner} ${event.name}`, {
      font: 'bold 28px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(375, 85, '活动关卡', {
      font: '18px Arial',
      color: 'rgba(255,255,255,0.85)'
    }).setOrigin(0.5);

    const countdownTime = EventManager.getTimeRemaining(event.endTime);
    this.add.text(690, 55, `⏰ ${EventManager.formatCountdownShort(countdownTime)}`, {
      font: 'bold 16px Arial',
      color: '#ffffff'
    }).setOrigin(1, 0.5);

    const backBtn = this.add.graphics();
    backBtn.fillStyle(0x000000, 0.25);
    backBtn.fillRoundedRect(35, 40, 50, 50, 10);
    backBtn.setInteractive(
      new Phaser.Geom.Rectangle(35, 40, 50, 50),
      Phaser.Geom.Rectangle.Contains
    );
    this.add.text(60, 65, '←', {
      font: 'bold 28px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    backBtn.on('pointerup', () => {
      this.scene.start('EventScene');
    });
  }

  private addStatsBar(): void {
    const eventId = this.eventId;
    const totalScore = SaveManager.getEventTotalScore(eventId);
    const completedCount = SaveManager.getCompletedEventLevelsCount(eventId);
    const totalStars = SaveManager.getEventTotalStars(eventId);
    const maxStars = this.eventLevels.length * 3;
    const rank = EventManager.getPlayerRank(eventId);

    const statsBg = this.add.graphics();
    statsBg.fillStyle(0x0f3460, 0.9);
    statsBg.fillRoundedRect(40, 135, 670, 70, 12);

    this.add.text(85, 170, '🏆', { font: '24px Arial' }).setOrigin(0, 0.5);
    this.add.text(115, 170, `${totalScore.toLocaleString()} 分`, {
      font: 'bold 18px Arial',
      color: '#ffd700'
    }).setOrigin(0, 0.5);

    this.add.text(275, 170, '⭐', { font: '24px Arial' }).setOrigin(0, 0.5);
    this.add.text(305, 170, `${totalStars}/${maxStars}`, {
      font: 'bold 18px Arial',
      color: '#ffeb3b'
    }).setOrigin(0, 0.5);

    this.add.text(425, 170, '🎯', { font: '24px Arial' }).setOrigin(0, 0.5);
    this.add.text(455, 170, `${completedCount}/${this.eventLevels.length}`, {
      font: 'bold 18px Arial',
      color: '#4caf50'
    }).setOrigin(0, 0.5);

    this.add.text(580, 170, '📊', { font: '24px Arial' }).setOrigin(0, 0.5);
    this.add.text(610, 170, rank > 0 ? `#${rank}` : '未上榜', {
      font: 'bold 18px Arial',
      color: '#ff9800'
    }).setOrigin(0, 0.5);
  }

  private addLevelCards(): void {
    const startY = 250;
    const cardWidth = 670;
    const cardHeight = 170;
    const padding = 20;

    this.eventLevels.forEach((level, index) => {
      const y = startY + index * (cardHeight + padding) + cardHeight / 2;
      this.createLevelCard(375, y, cardWidth, cardHeight, level, index);
    });
  }

  private createLevelCard(
    x: number,
    y: number,
    width: number,
    height: number,
    level: EventLevelRule,
    index: number
  ): void {
    const eventId = this.eventId;
    const progress = SaveManager.getEventLevelProgress(eventId, level.id);
    const unlocked = progress?.unlocked ?? false;
    const completed = progress?.completed ?? false;
    const specimen = getPlantSpecimen(level.specimenId);
    const event = this.eventData;

    const card = this.add.graphics();

    if (unlocked) {
      const gradientSteps = 10;
      for (let i = 0; i < gradientSteps; i++) {
        const t = i / gradientSteps;
        const r = Math.floor(((event.primaryColor >> 16) & 0xff) * (1 - t) * 0.15 + (0x0f >> 2) * (1 - 0.15) + (event.secondaryColor >> 16 & 0xff) * t * 0.15);
        const g = Math.floor(((event.primaryColor >> 8) & 0xff) * (1 - t) * 0.15 + (0x34 >> 1) * (1 - 0.15) + (event.secondaryColor >> 8 & 0xff) * t * 0.15);
        const b = Math.floor((event.primaryColor & 0xff) * (1 - t) * 0.15 + 0x60 * (1 - 0.15) + (event.secondaryColor & 0xff) * t * 0.15);
        const color = (r << 16) | (g << 8) | b;
        card.fillStyle(completed ? 0x1e3a2a : color, 1);
        card.fillRect(x - width / 2 + (width * i) / gradientSteps, y - height / 2, width / gradientSteps + 1, height);
      }
      card.fillStyle(completed ? 0x1e3a2a : 0x0f3460, 0.95);
    } else {
      card.fillStyle(0x2a2a3a, 0.7);
    }
    card.fillRoundedRect(x - width / 2, y - height / 2, width, height, 14);

    const borderColor = unlocked ? (completed ? 0x4caf50 : event.accentColor) : 0x555566;
    card.lineStyle(3, borderColor, unlocked ? 1 : 0.5);
    card.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 14);

    const indexBadge = this.add.graphics();
    indexBadge.fillStyle(unlocked ? event.primaryColor : 0x444455, 1);
    indexBadge.fillRoundedRect(x - width / 2 + 15, y - height / 2 + 15, 44, 36, 8);
    this.add.text(x - width / 2 + 37, y - height / 2 + 33, `No.${index + 1}`, {
      font: 'bold 14px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    const diffColor = getDifficultyColor(level.difficulty);
    const diffBadge = this.add.graphics();
    diffBadge.fillStyle(diffColor, unlocked ? 1 : 0.4);
    diffBadge.fillRoundedRect(x - width / 2 + 70, y - height / 2 + 15, 72, 36, 8);
    this.add.text(x - width / 2 + 106, y - height / 2 + 33, getDifficultyText(level.difficulty), {
      font: 'bold 14px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    const multiplierBadge = this.add.graphics();
    multiplierBadge.fillStyle(0xffd700, unlocked ? 0.9 : 0.3);
    multiplierBadge.fillRoundedRect(x + width / 2 - 95, y - height / 2 + 15, 80, 36, 8);
    this.add.text(x + width / 2 - 55, y - height / 2 + 33, `x${level.scoreMultiplier}`, {
      font: 'bold 15px Arial',
      color: '#1a1a2e'
    }).setOrigin(0.5);

    const previewKey = `specimen-${level.specimenId}-preview`;
    const imgX = x - width / 2 + 95;
    const imgY = y + 10;

    if (unlocked) {
      const previewImg = this.add.image(imgX, imgY, previewKey);
      previewImg.setDisplaySize(110, 110);
    } else {
      this.add.image(imgX, imgY, 'lock').setScale(1.3);
    }

    const textStartX = x - width / 2 + 175;

    this.add.text(textStartX, y - 45, level.name, {
      font: 'bold 22px Arial',
      color: unlocked ? '#ffffff' : '#777777'
    }).setOrigin(0, 0.5);

    this.add.text(textStartX, y - 15, specimen?.name || '???', {
      font: '18px Arial',
      color: unlocked ? '#eaeaea' : '#666666'
    }).setOrigin(0, 0.5);

    this.add.text(textStartX, y + 12, specimen?.family || '', {
      font: '14px Arial',
      color: '#aaaaaa'
    }).setOrigin(0, 0.5);

    const rowsColsText = `${level.rows}×${level.cols} 块 | 限时 ${Math.floor(level.timeLimit / 60)}分${level.timeLimit % 60}秒`;
    this.add.text(textStartX, y + 40, rowsColsText, {
      font: '13px Arial',
      color: unlocked ? '#888888' : '#555555'
    }).setOrigin(0, 0.5);

    if (unlocked && progress) {
      this.drawStars(x + width / 2 - 100, y - 25, progress.stars);

      this.add.text(x + width / 2 - 55, y + 5, `最高分: ${progress.bestScore.toLocaleString()}`, {
        font: '14px Arial',
        color: '#ffd700'
      }).setOrigin(1, 0.5);

      if (progress.bestTime > 0) {
        const mins = Math.floor(progress.bestTime / 60);
        const secs = Math.floor(progress.bestTime % 60);
        this.add.text(x + width / 2 - 55, y + 35, `最快: ${mins}:${secs.toString().padStart(2, '0')}`, {
          font: '14px Arial',
          color: '#2196f3'
        }).setOrigin(1, 0.5);
      }
    }

    if (completed) {
      const completedBadge = this.add.graphics();
      completedBadge.fillStyle(0x4caf50, 1);
      completedBadge.fillCircle(x + width / 2 - 35, y + height / 2 - 30, 20);
      this.add.text(x + width / 2 - 35, y + height / 2 - 30, '✓', {
        font: 'bold 22px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);
    }

    if (progress?.attempts && progress.attempts > 0) {
      this.add.text(x + width / 2 - 35, y + height / 2 - 5, `${progress.attempts}次`, {
        font: '12px Arial',
        color: '#888888'
      }).setOrigin(1, 0.5);
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
        card.lineStyle(3, borderColor, 1);
      });

      card.on('pointerup', () => {
        this.scene.start('GameScene', {
          levelId: level.id,
          isEventLevel: true,
          eventId: this.eventId
        });
      });
    } else {
      this.add.text(x + width / 2 - 60, y + height / 2 - 35, '🔒 完成前置关卡解锁', {
        font: '14px Arial',
        color: '#ff9800',
        align: 'center'
      }).setOrigin(1, 0.5);
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

  private addBottomButtons(): void {
    const btnY = 1250;
    const btnW = 280;
    const btnH = 65;
    const spacing = 20;

    const rankingBtn = this.createBottomButton(
      375 - btnW / 2 - spacing / 2,
      btnY,
      btnW,
      btnH,
      '🏆 积分排行',
      0xff9800,
      () => this.scene.start('EventRankingScene', { eventId: this.eventId })
    );

    const backBtn = this.createBottomButton(
      375 + btnW / 2 + spacing / 2,
      btnY,
      btnW,
      btnH,
      '📖 返回活动',
      this.eventData.primaryColor,
      () => this.scene.start('EventScene')
    );
  }

  private createBottomButton(
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    color: number,
    onClick: () => void
  ): Phaser.GameObjects.Graphics {
    const btn = this.add.graphics();
    btn.fillStyle(color, 1);
    btn.fillRoundedRect(x - w / 2, y - h / 2, w, h, 14);

    btn.setInteractive(
      new Phaser.Geom.Rectangle(x - w / 2, y - h / 2, w, h),
      Phaser.Geom.Rectangle.Contains
    );

    this.add.text(x, y, label, {
      font: 'bold 20px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    btn.on('pointerover', () => {
      btn.clear();
      btn.fillStyle(this.lighten(color, 20), 1);
      btn.fillRoundedRect(x - w / 2, y - h / 2, w, h, 14);
    });

    btn.on('pointerout', () => {
      btn.clear();
      btn.fillStyle(color, 1);
      btn.fillRoundedRect(x - w / 2, y - h / 2, w, h, 14);
    });

    btn.on('pointerup', onClick);

    return btn;
  }

  private lighten(hex: number, amount: number): number {
    const r = Math.min(255, ((hex >> 16) & 0xff) + amount);
    const g = Math.min(255, ((hex >> 8) & 0xff) + amount);
    const b = Math.min(255, (hex & 0xff) + amount);
    return (r << 16) | (g << 8) | b;
  }
}
