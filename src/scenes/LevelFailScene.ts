import Phaser from 'phaser';
import { getLevelRule } from '../data/LevelRules';
import { getPlantSpecimen } from '../data/PlantSpecimens';
import { SaveManager } from '../utils/SaveManager';
import { formatTime, getDifficultyColor, getDifficultyText } from '../utils/GameUtils';
import { LevelRule, PlantSpecimen } from '../types/GameTypes';
import { getChapterByLevelId } from '../data/Chapters';

export interface LevelFailData {
  levelId: number;
  score: number;
  snappedCount: number;
  totalPieces: number;
  failType: 'time_up' | 'mistake_limit';
  elapsedTime: number;
  timeLimit: number;
  mistakeCount: number;
  hintsUsed: number;
  maxCombo: number;
  perfectSnaps: number;
  isEventLevel?: boolean;
  eventId?: string;
  isTowerFloor?: boolean;
  towerFloorId?: number;
}

export class LevelFailScene extends Phaser.Scene {
  private failData!: LevelFailData;
  private levelRule!: LevelRule;
  private specimen!: PlantSpecimen | undefined;

  constructor() {
    super('LevelFailScene');
  }

  init(data: LevelFailData): void {
    this.failData = data;
    const rule = getLevelRule(data.levelId);
    if (!rule) {
      this.scene.start('ChapterSelectScene');
      return;
    }
    this.levelRule = rule;
    this.specimen = getPlantSpecimen(this.levelRule.specimenId);
  }

  create(): void {
    this.addBackground();
    this.addTitle();
    this.addLevelInfo();
    this.addGapAnalysis();
    this.addRecommendations();
    this.addButtons();

    this.cameras.main.fadeIn(600, 0, 0, 0);
  }

  private addBackground(): void {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    const bg = this.add.graphics();
    const gradientSteps = 30;
    for (let i = 0; i < gradientSteps; i++) {
      const t = i / gradientSteps;
      const r = Math.floor(26 * (1 - t) + 22 * t);
      const g = Math.floor(26 * (1 - t) + 33 * t);
      const b = Math.floor(46 * (1 - t) + 62 * t);
      const color = (r << 16) | (g << 8) | b;
      bg.fillStyle(color, 1);
      bg.fillRect(0, (1334 * i) / gradientSteps, 750, 1334 / gradientSteps + 1);
    }

    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(30, 720);
      const y = Phaser.Math.Between(100, 1200);
      const size = Phaser.Math.Between(10, 30);
      const alpha = Phaser.Math.FloatBetween(0.02, 0.08);
      this.add.circle(x, y, size, 0xf44336, alpha);
    }
  }

  private addTitle(): void {
    const emoji = this.failData.failType === 'mistake_limit' ? '💔' : '⏰';
    const title = this.failData.failType === 'mistake_limit' ? '挑战失败' : '时间耗尽';
    const subtitle = this.failData.failType === 'mistake_limit' 
      ? '失误次数已达上限，别灰心，再来一次！' 
      : '时间不够用？调整策略，下次一定行！';

    this.time.delayedCall(200, () => {
      this.add.text(375, 80, emoji, {
        font: '60px Arial'
      }).setOrigin(0.5).setAlpha(0).setScale(0.5);

      this.tweens.add({
        targets: this.children.list[this.children.list.length - 1],
        alpha: 1,
        scale: 1,
        duration: 500,
        ease: 'Back.easeOut'
      });
    });

    this.add.text(375, 150, title, {
      font: 'bold 40px Arial',
      color: '#f44336'
    }).setOrigin(0.5);

    this.add.text(375, 195, subtitle, {
      font: '18px Arial',
      color: '#ffcc80'
    }).setOrigin(0.5);
  }

  private addLevelInfo(): void {
    const cardY = 250;
    const diffColor = getDifficultyColor(this.levelRule.difficulty);
    const diffText = getDifficultyText(this.levelRule.difficulty);

    const card = this.add.graphics();
    card.fillStyle(0x0f3460, 0.9);
    card.fillRoundedRect(40, cardY, 670, 130, 16);
    card.lineStyle(3, 0xf44336, 0.5);
    card.strokeRoundedRect(40, cardY, 670, 130, 16);

    if (this.specimen) {
      const previewKey = `specimen-${this.levelRule.specimenId}-preview`;
      if (this.textures.exists(previewKey)) {
        const img = this.add.image(100, cardY + 65, previewKey);
        img.setDisplaySize(90, 90);
        img.setAlpha(0.6);
      }
    }

    this.add.text(170, cardY + 35, this.levelRule.name, {
      font: 'bold 22px Arial',
      color: '#ffffff'
    }).setOrigin(0, 0.5);

    const diffBadge = this.add.graphics();
    diffBadge.fillStyle(diffColor, 0.8);
    diffBadge.fillRoundedRect(170, cardY + 55, 100, 28, 6);
    this.add.text(220, cardY + 69, diffText, {
      font: 'bold 13px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    const chapter = getChapterByLevelId(this.failData.levelId);
    if (chapter) {
      this.add.text(170, cardY + 95, `章节: ${chapter.name}`, {
        font: '14px Arial',
        color: '#888888'
      }).setOrigin(0, 0.5);
    }

    let attempts = 1;
    if (this.failData.isTowerFloor && this.failData.towerFloorId) {
      attempts = SaveManager.getTowerFloorProgress(this.failData.towerFloorId)?.attempts || 1;
    } else if (this.failData.isEventLevel && this.failData.eventId) {
      attempts = SaveManager.getEventLevelProgress(this.failData.eventId, this.failData.levelId)?.attempts || 1;
    }
    this.add.text(670, cardY + 65, `第 ${attempts} 次尝试`, {
      font: 'bold 16px Arial',
      color: '#ff9800'
    }).setOrigin(1, 0.5);
  }

  private addGapAnalysis(): void {
    const sectionY = 410;

    this.add.text(375, sectionY, '📊 差距分析', {
      font: 'bold 24px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    const cardY = sectionY + 30;
    const card = this.add.graphics();
    card.fillStyle(0x2d1a1a, 0.9);
    card.fillRoundedRect(40, cardY, 670, 280, 16);
    card.lineStyle(2, 0xf44336, 0.3);
    card.strokeRoundedRect(40, cardY, 670, 280, 16);

    const progress = (this.failData.snappedCount / this.failData.totalPieces) * 100;
    const timeUsed = (this.failData.elapsedTime / this.failData.timeLimit) * 100;
    const starThresholds = this.levelRule.rewardConfig?.starThresholds || [800, 1600, 2400];
    const oneStarThreshold = starThresholds[0];
    const scoreGap = Math.max(0, oneStarThreshold - this.failData.score);

    const gapItems = [
      {
        icon: '🧩',
        label: '拼图完成度',
        current: `${this.failData.snappedCount} / ${this.failData.totalPieces}`,
        target: `${this.failData.totalPieces} / ${this.failData.totalPieces}`,
        gap: `${this.failData.totalPieces - this.failData.snappedCount} 片未完成`,
        progress: progress,
        color: '#f44336'
      },
      {
        icon: '⏱️',
        label: '时间使用',
        current: formatTime(this.failData.elapsedTime),
        target: formatTime(this.failData.timeLimit),
        gap: timeUsed >= 100 ? '时间完全耗尽' : `剩余 ${formatTime(this.failData.timeLimit - this.failData.elapsedTime)}`,
        progress: Math.min(100, timeUsed),
        color: timeUsed >= 100 ? '#f44336' : '#ff9800'
      },
      {
        icon: '⭐',
        label: '距离一星',
        current: this.failData.score.toLocaleString(),
        target: oneStarThreshold.toLocaleString(),
        gap: scoreGap > 0 ? `还差 ${scoreGap.toLocaleString()} 分` : '已达一星标准',
        progress: Math.min(100, (this.failData.score / oneStarThreshold) * 100),
        color: scoreGap > 0 ? '#f44336' : '#4caf50'
      }
    ];

    gapItems.forEach((item, index) => {
      const itemY = cardY + 45 + index * 85;

      this.add.text(70, itemY, item.icon, {
        font: '28px Arial'
      }).setOrigin(0, 0.5);

      this.add.text(115, itemY - 18, item.label, {
        font: '15px Arial',
        color: '#888888'
      }).setOrigin(0, 0.5);

      this.add.text(115, itemY + 12, `${item.current} / ${item.target}`, {
        font: 'bold 16px Arial',
        color: '#ffffff'
      }).setOrigin(0, 0.5);

      this.add.text(670, itemY, item.gap, {
        font: 'bold 14px Arial',
        color: item.color
      }).setOrigin(1, 0.5);

      const barX = 115;
      const barY = itemY + 25;
      const barW = 555;
      const barH = 8;

      const barBg = this.add.graphics();
      barBg.fillStyle(0x1a1a2e, 1);
      barBg.fillRoundedRect(barX, barY, barW, barH, barH / 2);

      const barFill = this.add.graphics();
      const fillColor = item.color === '#f44336' ? 0xf44336 : 
                      item.color === '#ff9800' ? 0xff9800 : 0x4caf50;
      barFill.fillStyle(fillColor, 0.8);
      barFill.fillRoundedRect(barX, barY, Math.max(4, barW * item.progress / 100), barH, barH / 2);
    });

    const statsY = cardY + 255;
    const stats = [
      { icon: '🎯', value: `${this.failData.mistakeCount}`, label: '失误' },
      { icon: '💡', value: `${this.failData.hintsUsed}`, label: '提示' },
      { icon: '🔥', value: `${this.failData.maxCombo}`, label: '最高连击' },
      { icon: '✨', value: `${this.failData.perfectSnaps}`, label: '完美对齐' }
    ];

    stats.forEach((stat, index) => {
      const x = 120 + index * 160;
      this.add.text(x, statsY, stat.icon, {
        font: '20px Arial'
      }).setOrigin(0.5);
      this.add.text(x, statsY + 22, stat.value, {
        font: 'bold 16px Arial',
        color: '#ff9800'
      }).setOrigin(0.5);
      this.add.text(x, statsY + 42, stat.label, {
        font: '12px Arial',
        color: '#888888'
      }).setOrigin(0.5);
    });
  }

  private addRecommendations(): void {
    const sectionY = 760;

    this.add.text(375, sectionY, '💡 改进建议', {
      font: 'bold 24px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    const recommendations = this.generateRecommendations();

    let currentY = sectionY + 30;
    recommendations.forEach((rec, index) => {
      const cardH = 75;
      const card = this.add.graphics();
      card.fillStyle(0x1a2d1a, 0.9);
      card.fillRoundedRect(40, currentY, 670, cardH, 12);
      card.lineStyle(2, 0x4caf50, 0.3);
      card.strokeRoundedRect(40, currentY, 670, cardH, 12);

      this.add.text(75, currentY + cardH / 2, rec.icon, {
        font: '32px Arial'
      }).setOrigin(0, 0.5);

      this.add.text(125, currentY + 25, rec.title, {
        font: 'bold 16px Arial',
        color: '#81c784'
      }).setOrigin(0, 0.5);

      this.add.text(125, currentY + 50, rec.description, {
        font: '13px Arial',
        color: '#aaaaaa',
        wordWrap: { width: 540 }
      }).setOrigin(0, 0.5);

      currentY += cardH + 12;
    });
  }

  private generateRecommendations(): Array<{ icon: string; title: string; description: string }> {
    const recs: Array<{ icon: string; title: string; description: string }> = [];
    const { failType, mistakeCount, hintsUsed, elapsedTime, timeLimit, snappedCount, totalPieces, maxCombo } = this.failData;

    if (failType === 'time_up') {
      const timeRatio = elapsedTime / timeLimit;
      const completionRatio = snappedCount / totalPieces;
      
      if (completionRatio < 0.5) {
        recs.push({
          icon: '⚡',
          title: '提升操作速度',
          description: '拼图进度较慢，尝试减少犹豫时间，先快速放置确定的拼图块'
        });
      } else {
        recs.push({
          icon: '🎯',
          title: '优化时间分配',
          description: '前期花费时间过长，后期来不及完成。建议先易后难，合理分配时间'
        });
      }

      if (hintsUsed === 0) {
        recs.push({
          icon: '💡',
          title: '善用提示功能',
          description: '提示功能可以帮助你快速找到正确位置，在时间紧张时果断使用'
        });
      }
    }

    if (failType === 'mistake_limit') {
      recs.push({
        icon: '🧘',
        title: '保持冷静，减少失误',
        description: `本次失误 ${mistakeCount} 次。深呼吸，仔细观察后再操作，稳比快更重要`
      });

      if (mistakeCount > 5) {
        recs.push({
          icon: '🔍',
          title: '仔细观察细节',
          description: '建议在放置前对比原图和拼图块的纹理、颜色边缘，确认后再放置'
        });
      }
    }

    if (hintsUsed > 5) {
      recs.push({
        icon: '👀',
        title: '减少对提示的依赖',
        description: `使用了 ${hintsUsed} 次提示。尝试先自己观察思考，实在不确定再用提示`
      });
    }

    if (maxCombo < 3 && totalPieces > 4) {
      recs.push({
        icon: '🔥',
        title: '建立连击节奏',
        description: '连续正确放置可获得连击加分。找到节奏后，连续放置相似区域的拼图块'
      });
    }

    if (recs.length < 3) {
      recs.push({
        icon: '📚',
        title: '熟悉标本特征',
        description: `建议在图鉴中多观察「${this.specimen?.name || '这个标本'}」的形态特征，熟悉后会更容易拼`
      });
    }

    if (recs.length < 3) {
      recs.push({
        icon: '🔄',
        title: '多次练习',
        description: '熟能生巧！多练习几次就能掌握技巧，下次一定能成功'
      });
    }

    return recs.slice(0, 3);
  }

  private addButtons(): void {
    const btnY = 1180;
    const btnW = 300;
    const btnH = 65;
    const spacing = 20;

    const retryBtn = this.createButton(
      375 - btnW / 2 - spacing / 2,
      btnY,
      btnW,
      btnH,
      '🔄 立即重开',
      0x2196f3,
      () => {
        this.scene.start('GameScene', {
          levelId: this.failData.levelId,
          isEventLevel: this.failData.isEventLevel,
          eventId: this.failData.eventId,
          isTowerFloor: this.failData.isTowerFloor,
          towerFloorId: this.failData.towerFloorId
        });
      }
    );

    const backBtn = this.createButton(
      375 + btnW / 2 + spacing / 2,
      btnY,
      btnW,
      btnH,
      '📋 关卡选择',
      0x555566,
      () => {
        if (this.failData.isEventLevel && this.failData.eventId) {
          this.scene.start('EventLevelSelectScene', { eventId: this.failData.eventId });
        } else if (this.failData.isTowerFloor) {
          this.scene.start('TowerSelectScene');
        } else {
          const chapter = getChapterByLevelId(this.failData.levelId);
          if (chapter) {
            this.scene.start('LevelSelectScene', { chapterId: chapter.id });
          } else {
            this.scene.start('ChapterSelectScene');
          }
        }
      }
    );

    const homeBtn = this.createButton(
      375,
      btnY + btnH + 15,
      btnW * 2 + spacing,
      55,
      '🏠 返回主菜单',
      0xe94560,
      () => {
        this.scene.start('ChapterSelectScene');
      }
    );

    const encouragement = this.add.text(375, btnY + btnH + 85, '每一次失败都是向成功迈进的一步 💪', {
      font: '14px Arial',
      color: '#888888'
    }).setOrigin(0.5);
  }

  private createButton(
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
