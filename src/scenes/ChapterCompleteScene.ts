import Phaser from 'phaser';
import { getChapterById, getNextChapter, Badges, getChapterTotalStars } from '../data/Chapters';
import { SaveManager } from '../utils/SaveManager';
import { ChapterData, Reward } from '../types/GameTypes';

export class ChapterCompleteScene extends Phaser.Scene {
  private chapterId!: number;
  private chapter!: ChapterData;
  private rewards: Reward[] = [];

  constructor() {
    super('ChapterCompleteScene');
  }

  init(data: { chapterId: number }): void {
    this.chapterId = data.chapterId;
    const chapter = getChapterById(data.chapterId);
    if (!chapter) {
      this.scene.start('ChapterSelectScene');
      return;
    }
    this.chapter = chapter;
  }

  create(): void {
    this.addBackground();
    this.addCelebrationEffects();
    this.addTitle();
    this.addChapterInfo();
    this.addStatistics();
    this.addRewards();
    this.addButtons();

    this.cameras.main.fadeIn(800, 0, 0, 0);
  }

  private addBackground(): void {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    const bg = this.add.graphics();
    const gradientSteps = 20;
    for (let i = 0; i < gradientSteps; i++) {
      const t = i / gradientSteps;
      const r = Math.floor(22 * (1 - t) + ((this.chapter.primaryColor >> 16) & 0xff) * 0.15 * t);
      const g = Math.floor(33 * (1 - t) + ((this.chapter.primaryColor >> 8) & 0xff) * 0.15 * t);
      const b = Math.floor(62 * (1 - t) + (this.chapter.primaryColor & 0xff) * 0.15 * t);
      const color = (r << 16) | (g << 8) | b;
      bg.fillStyle(color, 1);
      bg.fillRect(0, (1334 * i) / gradientSteps, 750, 1334 / gradientSteps + 1);
    }

    for (let i = 0; i < 15; i++) {
      const x = Phaser.Math.Between(30, 720);
      const y = Phaser.Math.Between(100, 1200);
      const size = Phaser.Math.Between(15, 40);
      const alpha = Phaser.Math.FloatBetween(0.05, 0.12);
      const sparkle = this.add.graphics();
      sparkle.fillStyle(0xffffff, alpha);
      sparkle.fillCircle(x, y, size);

      this.tweens.add({
        targets: sparkle,
        alpha: { from: alpha, to: alpha * 0.3 },
        scale: { from: 1, to: 0.8 },
        duration: Phaser.Math.Between(1500, 2500),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: Phaser.Math.Between(0, 1000)
      });
    }
  }

  private addCelebrationEffects(): void {
    const confettiColors = [0x4caf50, 0xff9800, 0xe94560, 0x2196f3, 0xffd700, 0x9c27b0];

    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(50, 700);
      const y = Phaser.Math.Between(-100, 50);
      const color = confettiColors[Phaser.Math.Between(0, confettiColors.length - 1)];
      const size = Phaser.Math.Between(6, 14);

      const confetti = this.add.rectangle(x, y, size, size * 1.5, color);
      confetti.setAlpha(0.9);

      const fallDuration = Phaser.Math.Between(2500, 4000);
      const swayAmount = Phaser.Math.Between(30, 80);

      this.tweens.add({
        targets: confetti,
        y: 1400,
        x: x + Phaser.Math.Between(-swayAmount, swayAmount),
        angle: Phaser.Math.Between(-720, 720),
        duration: fallDuration,
        ease: 'Quad.easeIn',
        delay: Phaser.Math.Between(0, 1500),
        onComplete: () => confetti.destroy()
      });
    }
  }

  private addTitle(): void {
    this.time.delayedCall(300, () => {
      this.add.text(375, 100, '🎉 章节完成！', {
        font: 'bold 44px Arial',
        color: '#ffffff'
      }).setOrigin(0.5).setAlpha(0).setScale(0.5);

      this.tweens.add({
        targets: this.children.list[this.children.list.length - 1],
        alpha: 1,
        scale: 1,
        duration: 600,
        ease: 'Back.easeOut'
      });
    });

    this.add.text(375, 150, this.chapter.name, {
      font: 'bold 26px Arial',
      color: '#' + this.chapter.primaryColor.toString(16).padStart(6, '0')
    }).setOrigin(0.5);
  }

  private addChapterInfo(): void {
    const cardY = 230;
    const card = this.add.graphics();
    card.fillStyle(0x0f3460, 0.9);
    card.fillRoundedRect(40, cardY, 670, 120, 16);
    card.lineStyle(3, this.chapter.primaryColor, 0.8);
    card.strokeRoundedRect(40, cardY, 670, 120, 16);

    this.add.text(80, cardY + 35, '✅ 考察成果', {
      font: 'bold 20px Arial',
      color: '#4caf50'
    }).setOrigin(0, 0.5);

    this.add.text(80, cardY + 75, this.chapter.description, {
      font: '15px Arial',
      color: '#aaaaaa',
      wordWrap: { width: 600 }
    }).setOrigin(0, 0.5);
  }

  private addStatistics(): void {
    const statsY = 400;
    const chapterStars = SaveManager.getChapterStars(this.chapterId);
    const totalStars = getChapterTotalStars(this.chapterId);
    const totalScore = this.chapter.levelIds.reduce((sum, id) => {
      return sum + (SaveManager.getProgress(id)?.bestScore || 0);
    }, 0);
    const bestTime = this.chapter.levelIds.reduce((sum, id) => {
      return sum + (SaveManager.getProgress(id)?.bestTime || 0);
    }, 0);

    const stats = [
      { icon: '⭐', label: '星星收集', value: `${chapterStars} / ${totalStars}`, color: '#ffd700' },
      { icon: '🏆', label: '总得分', value: totalScore.toLocaleString(), color: '#ff9800' },
      { icon: '⏱️', label: '总用时', value: this.formatTime(bestTime), color: '#2196f3' },
      { icon: '🎯', label: '完成关卡', value: `${this.chapter.levelIds.length} / ${this.chapter.levelIds.length}`, color: '#4caf50' }
    ];

    stats.forEach((stat, index) => {
      const x = index % 2 === 0 ? 140 : 610;
      const y = statsY + Math.floor(index / 2) * 110;

      const statCard = this.add.graphics();
      statCard.fillStyle(0x16213e, 0.9);
      statCard.fillRoundedRect(x - 110, y - 45, 220, 90, 12);
      statCard.lineStyle(2, 0xffffff, 0.1);
      statCard.strokeRoundedRect(x - 110, y - 45, 220, 90, 12);

      this.add.text(x - 80, y, stat.icon, {
        font: '36px Arial'
      }).setOrigin(0, 0.5);

      this.add.text(x - 20, y - 15, stat.label, {
        font: '14px Arial',
        color: '#888888'
      }).setOrigin(0, 0.5);

      this.add.text(x - 20, y + 15, stat.value, {
        font: 'bold 22px Arial',
        color: stat.color
      }).setOrigin(0, 0.5);
    });
  }

  private addRewards(): void {
    const rewardsY = 660;

    this.add.text(375, rewardsY, '🎁 章节奖励', {
      font: 'bold 24px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    const canClaim = SaveManager.canClaimRewards(this.chapterId);
    this.rewards = getChapterById(this.chapterId)?.rewards || [];

    this.rewards.forEach((reward, index) => {
      const rewardY = rewardsY + 55 + index * 85;

      const rewardBg = this.add.graphics();
      rewardBg.fillStyle(0x0f3460, 0.9);
      rewardBg.fillRoundedRect(70, rewardY - 32, 610, 68, 12);
      rewardBg.lineStyle(2, canClaim ? 0x4caf50 : 0x333355, canClaim ? 0.6 : 0.3);
      rewardBg.strokeRoundedRect(70, rewardY - 32, 610, 68, 12);

      let icon = '';
      let valueText = '';

      switch (reward.type) {
        case 'score':
          icon = '💰';
          valueText = `+${reward.value?.toLocaleString()} 分`;
          break;
        case 'badge':
          const badge = Badges[reward.id as keyof typeof Badges];
          icon = badge?.icon || '🏅';
          valueText = canClaim ? '立即解锁' : '已解锁';
          break;
        case 'specimen':
          icon = '🌱';
          valueText = '标本解锁';
          break;
      }

      this.add.text(110, rewardY, icon, { font: '32px Arial' }).setOrigin(0, 0.5);

      this.add.text(165, rewardY - 10, reward.name, {
        font: 'bold 18px Arial',
        color: '#ffffff'
      }).setOrigin(0, 0.5);

      this.add.text(165, rewardY + 12, reward.description, {
        font: '13px Arial',
        color: '#888888'
      }).setOrigin(0, 0.5);

      const valueColor = canClaim ? '#4caf50' : '#ffd700';
      this.add.text(640, rewardY, valueText, {
        font: 'bold 16px Arial',
        color: valueColor
      }).setOrigin(1, 0.5);
    });

    if (canClaim) {
      const claimBtn = this.add.graphics();
      claimBtn.fillStyle(0x4caf50, 1);
      claimBtn.fillRoundedRect(175, rewardsY + 55 + this.rewards.length * 85, 400, 60, 14);
      claimBtn.setInteractive(
        new Phaser.Geom.Rectangle(175, rewardsY + 55 + this.rewards.length * 85, 400, 60),
        Phaser.Geom.Rectangle.Contains
      );

      this.add.text(375, rewardsY + 55 + this.rewards.length * 85 + 30, '🎁 领取奖励', {
        font: 'bold 22px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);

      claimBtn.on('pointerup', () => {
        this.claimRewards();
      });
    }
  }

  private claimRewards(): void {
    const claimedRewards = SaveManager.claimChapterRewards(this.chapterId);
    if (claimedRewards.length === 0) return;

    this.cameras.main.flash(300, 255, 215, 0);

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.85);
    overlay.fillRect(0, 0, 750, 1334);
    overlay.setInteractive();

    const modal = this.add.graphics();
    modal.fillStyle(0x16213e, 1);
    modal.fillRoundedRect(80, 400, 590, 500, 24);
    modal.lineStyle(4, 0x4caf50, 1);
    modal.strokeRoundedRect(80, 400, 590, 500, 24);

    this.add.text(375, 460, '✨ 奖励已领取！', {
      font: 'bold 30px Arial',
      color: '#4caf50'
    }).setOrigin(0.5);

    claimedRewards.forEach((reward, index) => {
      const rewardY = 530 + index * 80;

      let icon = '';
      let valueText = '';

      switch (reward.type) {
        case 'score':
          icon = '💰';
          valueText = `+${reward.value?.toLocaleString()} 分`;
          break;
        case 'badge':
          const badge = Badges[reward.id as keyof typeof Badges];
          icon = badge?.icon || '🏅';
          valueText = '新徽章';
          break;
        case 'specimen':
          icon = '🌱';
          valueText = '新标本';
          break;
      }

      const rewardBg = this.add.graphics();
      rewardBg.fillStyle(0x0f3460, 0.9);
      rewardBg.fillRoundedRect(120, rewardY - 30, 510, 60, 12);

      this.add.text(160, rewardY, icon, { font: '28px Arial' }).setOrigin(0, 0.5);
      this.add.text(210, rewardY, reward.name, {
        font: 'bold 18px Arial',
        color: '#ffffff'
      }).setOrigin(0, 0.5);
      this.add.text(600, rewardY, valueText, {
        font: 'bold 18px Arial',
        color: '#ffd700'
      }).setOrigin(1, 0.5);
    });

    const confirmBtn = this.add.graphics();
    confirmBtn.fillStyle(0x4caf50, 1);
    confirmBtn.fillRoundedRect(200, 780, 350, 60, 14);
    confirmBtn.setInteractive(
      new Phaser.Geom.Rectangle(200, 780, 350, 60),
      Phaser.Geom.Rectangle.Contains
    );

    this.add.text(375, 810, '太棒了！', {
      font: 'bold 20px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    const close = () => {
      overlay.destroy();
      modal.destroy();
      confirmBtn.destroy();
      this.scene.restart();
    };

    confirmBtn.on('pointerup', close);
    overlay.on('pointerup', close);
  }

  private addButtons(): void {
    const btnY = 1180;
    const btnW = 300;
    const btnH = 65;
    const spacing = 25;

    const nextChapter = getNextChapter(this.chapterId);
    const nextUnlocked = nextChapter ? SaveManager.isChapterUnlocked(nextChapter.id) : false;

    if (nextChapter && nextUnlocked) {
      const nextBtn = this.createButton(
        375 - btnW / 2 - spacing / 2,
        btnY,
        btnW,
        btnH,
        '▶ 下一章节',
        nextChapter.primaryColor,
        () => this.scene.start('LevelSelectScene', { chapterId: nextChapter.id })
      );

      const backBtn = this.createButton(
        375 + btnW / 2 + spacing / 2,
        btnY,
        btnW,
        btnH,
        '📋 章节列表',
        0x555566,
        () => this.scene.start('ChapterSelectScene')
      );
    } else if (nextChapter && !nextUnlocked) {
      const lockBtn = this.add.graphics();
      lockBtn.fillStyle(0x333344, 1);
      lockBtn.fillRoundedRect(375 - btnW / 2 - spacing / 2, btnY, btnW, btnH, 14);

      this.add.text(375 - spacing / 2, btnY + btnH / 2, `🔒 需要 ${nextChapter.requiredStars} ⭐`, {
        font: 'bold 18px Arial',
        color: '#888888'
      }).setOrigin(0.5);

      const backBtn = this.createButton(
        375 + btnW / 2 + spacing / 2,
        btnY,
        btnW,
        btnH,
        '📋 章节列表',
        0x555566,
        () => this.scene.start('ChapterSelectScene')
      );
    } else {
      const finalBtn = this.createButton(
        375,
        btnY,
        btnW * 2 + spacing,
        btnH,
        '🏆 完成所有考察！返回章节列表',
        0x4caf50,
        () => this.scene.start('ChapterSelectScene')
      );
    }

    const replayBtn = this.createButton(
      375,
      btnY + btnH + 20,
      btnW * 2 + spacing,
      55,
      '🔄 重玩本章节关卡',
      0x2196f3,
      () => this.scene.start('LevelSelectScene', { chapterId: this.chapterId })
    );
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

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  private lighten(hex: number, amount: number): number {
    const r = Math.min(255, ((hex >> 16) & 0xff) + amount);
    const g = Math.min(255, ((hex >> 8) & 0xff) + amount);
    const b = Math.min(255, (hex & 0xff) + amount);
    return (r << 16) | (g << 8) | b;
  }
}
