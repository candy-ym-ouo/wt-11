import Phaser from 'phaser';
import { Chapters, getChapterById, Badges, getChapterTotalStars } from '../data/Chapters';
import { SaveManager } from '../utils/SaveManager';
import { ChapterData } from '../types/GameTypes';

export class ChapterSelectScene extends Phaser.Scene {
  constructor() {
    super('ChapterSelectScene');
  }

  create(): void {
    this.addBackground();
    this.addTitle();
    this.addStatsBar();
    this.addChapterCards();
    this.addBottomButtons();
  }

  private addBackground(): void {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    const bg = this.add.graphics();
    bg.fillStyle(0x16213e, 1);
    bg.fillRoundedRect(25, 80, 700, 1180, 20);

    const decor = this.add.graphics();
    for (let i = 0; i < 8; i++) {
      const x = Phaser.Math.Between(50, 700);
      const y = Phaser.Math.Between(100, 1250);
      const size = Phaser.Math.Between(20, 60);
      decor.fillStyle(0xffffff, 0.03);
      decor.fillCircle(x, y, size);
    }
  }

  private addTitle(): void {
    this.add.text(375, 45, '植物考察日志', {
      font: 'bold 38px Arial',
      color: '#e94560'
    }).setOrigin(0.5);

    this.add.text(375, 85, '选择考察章节', {
      font: '24px Arial',
      color: '#eaeaea'
    }).setOrigin(0.5);
  }

  private addStatsBar(): void {
    const statsBg = this.add.graphics();
    statsBg.fillStyle(0x0f3460, 0.8);
    statsBg.fillRoundedRect(45, 120, 660, 80, 12);

    const totalStars = SaveManager.getTotalStars();
    const totalLevels = 6;
    const completedLevels = Object.values(SaveManager.getAllProgress()).filter(p => p.completed).length;

    const starIcon = this.add.text(85, 160, '⭐', { font: '28px Arial' }).setOrigin(0, 0.5);
    this.add.text(125, 160, `${totalStars} / ${totalLevels * 3}`, {
      font: 'bold 22px Arial',
      color: '#ffd700'
    }).setOrigin(0, 0.5);

    const trophyIcon = this.add.text(265, 160, '🏆', { font: '28px Arial' }).setOrigin(0, 0.5);
    this.add.text(305, 160, `${SaveManager.getTotalScore().toLocaleString()}`, {
      font: 'bold 22px Arial',
      color: '#ff9800'
    }).setOrigin(0, 0.5);

    const plantIcon = this.add.text(465, 160, '🌿', { font: '28px Arial' }).setOrigin(0, 0.5);
    this.add.text(505, 160, `${completedLevels} / ${totalLevels}`, {
      font: 'bold 22px Arial',
      color: '#4caf50'
    }).setOrigin(0, 0.5);
  }

  private addChapterCards(): void {
    const startY = 240;
    const cardWidth = 660;
    const cardHeight = 300;
    const padding = 30;

    Chapters.forEach((chapter, index) => {
      const y = startY + index * (cardHeight + padding) + cardHeight / 2;
      this.createChapterCard(375, y, cardWidth, cardHeight, chapter);
    });
  }

  private createChapterCard(
    x: number,
    y: number,
    width: number,
    height: number,
    chapter: ChapterData
  ): void {
    const progress = SaveManager.getChapterProgress(chapter.id);
    const unlocked = progress?.unlocked ?? chapter.unlocked;
    const completed = progress?.completed ?? false;
    const chapterStars = SaveManager.getChapterStars(chapter.id);
    const totalStars = getChapterTotalStars(chapter.id);
    const canClaimRewards = SaveManager.canClaimRewards(chapter.id);
    const requiredStars = chapter.requiredStars;
    const totalCollectedStars = SaveManager.getTotalStars();
    const starsLocked = totalCollectedStars < requiredStars;

    const card = this.add.graphics();
    const leftColor = unlocked ? chapter.primaryColor : 0x333344;
    const rightColor = unlocked ? chapter.secondaryColor : 0x3a3a4a;

    const gradientSteps = 10;
    for (let i = 0; i < gradientSteps; i++) {
      const t = i / gradientSteps;
      const r = Math.floor(((leftColor >> 16) & 0xff) * (1 - t) + ((rightColor >> 16) & 0xff) * t);
      const g = Math.floor(((leftColor >> 8) & 0xff) * (1 - t) + ((rightColor >> 8) & 0xff) * t);
      const b = Math.floor((leftColor & 0xff) * (1 - t) + (rightColor & 0xff) * t);
      const color = (r << 16) | (g << 8) | b;
      card.fillStyle(color, unlocked ? 0.9 : 0.5);
      card.fillRect(x - width / 2 + (width * i) / gradientSteps, y - height / 2, width / gradientSteps + 1, height);
    }

    card.lineStyle(4, unlocked ? chapter.primaryColor : 0x555566, 1);
    card.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 16);

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, unlocked ? 0.15 : 0.4);
    overlay.fillRoundedRect(x - width / 2, y - height / 2, width, height, 16);

    const themeBadge = this.add.graphics();
    themeBadge.fillStyle(0xffffff, 0.9);
    themeBadge.fillRoundedRect(x - width / 2 + 20, y - height / 2 + 20, 120, 36, 8);

    this.add.text(x - width / 2 + 80, y - height / 2 + 38, chapter.theme, {
      font: 'bold 16px Arial',
      color: '#' + chapter.primaryColor.toString(16).padStart(6, '0')
    }).setOrigin(0.5);

    if (completed) {
      const completedBadge = this.add.graphics();
      completedBadge.fillStyle(0x4caf50, 1);
      completedBadge.fillCircle(x + width / 2 - 35, y - height / 2 + 35, 22);
      this.add.text(x + width / 2 - 35, y - height / 2 + 35, '✓', {
        font: 'bold 24px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);
    }

    if (canClaimRewards) {
      const claimBadge = this.add.graphics();
      claimBadge.fillStyle(0xff9800, 1);
      claimBadge.fillRoundedRect(x + width / 2 - 120, y - height / 2 + 20, 90, 36, 8);

      this.add.text(x + width / 2 - 75, y - height / 2 + 38, '领取奖励', {
        font: 'bold 14px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);

      this.tweens.add({
        targets: claimBadge,
        scale: 1.05,
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    this.add.text(x - width / 2 + 30, y - 30, chapter.name, {
      font: 'bold 26px Arial',
      color: unlocked ? '#ffffff' : '#888888'
    }).setOrigin(0, 0.5);

    const descY = y + 20;
    this.add.text(x - width / 2 + 30, descY, chapter.description, {
      font: '15px Arial',
      color: unlocked ? 'rgba(255,255,255,0.85)' : '#666666',
      wordWrap: { width: width - 60 }
    }).setOrigin(0, 0);

    const levelsText = `包含 ${chapter.levelIds.length} 个关卡`;
    this.add.text(x - width / 2 + 30, y + height / 2 - 55, levelsText, {
      font: '14px Arial',
      color: unlocked ? 'rgba(255,255,255,0.7)' : '#555555'
    }).setOrigin(0, 0);

    const starBarBg = this.add.graphics();
    starBarBg.fillStyle(0x000000, 0.3);
    starBarBg.fillRoundedRect(x - width / 2 + 30, y + height / 2 - 40, 200, 24, 6);

    const starBarFill = this.add.graphics();
    const fillWidth = totalStars > 0 ? (chapterStars / totalStars) * 200 : 0;
    starBarFill.fillStyle(0xffd700, 0.9);
    starBarFill.fillRoundedRect(x - width / 2 + 30, y + height / 2 - 40, fillWidth, 24, 6);

    this.add.text(x - width / 2 + 240, y + height / 2 - 28, `${chapterStars} / ${totalStars} ⭐`, {
      font: 'bold 16px Arial',
      color: unlocked ? '#ffd700' : '#555555'
    }).setOrigin(0, 0.5);

    if (!unlocked) {
      this.add.image(x, y, 'lock').setScale(1.5);

      const lockText = starsLocked
        ? `需要 ${requiredStars} 颗星星解锁 (当前: ${totalCollectedStars})`
        : '完成前一章节解锁';

      this.add.text(x, y + 100, lockText, {
        font: '16px Arial',
        color: '#ff9800',
        align: 'center'
      }).setOrigin(0.5);
    }

    if (unlocked) {
      card.setInteractive(
        new Phaser.Geom.Rectangle(x - width / 2, y - height / 2, width, height),
        Phaser.Geom.Rectangle.Contains
      );

      card.on('pointerover', () => {
        card.lineStyle(4, 0xffffff, 1);
      });

      card.on('pointerout', () => {
        card.lineStyle(4, chapter.primaryColor, 1);
      });

      card.on('pointerup', () => {
        if (canClaimRewards) {
          this.claimRewards(chapter.id);
        } else {
          this.scene.start('LevelSelectScene', { chapterId: chapter.id });
        }
      });
    }
  }

  private claimRewards(chapterId: number): void {
    const rewards = SaveManager.claimChapterRewards(chapterId);
    if (rewards.length === 0) return;

    const chapter = getChapterById(chapterId);
    if (!chapter) return;

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.85);
    overlay.fillRect(0, 0, 750, 1334);
    overlay.setInteractive();

    const modal = this.add.graphics();
    modal.fillStyle(0x16213e, 1);
    modal.fillRoundedRect(60, 350, 630, 600, 24);
    modal.lineStyle(4, chapter.primaryColor, 1);
    modal.strokeRoundedRect(60, 350, 630, 600, 24);

    this.add.text(375, 410, '🎉 恭喜完成章节！', {
      font: 'bold 32px Arial',
      color: '#4caf50'
    }).setOrigin(0.5);

    this.add.text(375, 450, chapter.name, {
      font: '20px Arial',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    this.add.text(375, 510, '获得奖励：', {
      font: 'bold 22px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    rewards.forEach((reward, index) => {
      const rewardY = 570 + index * 90;

      const rewardBg = this.add.graphics();
      rewardBg.fillStyle(0x0f3460, 0.8);
      rewardBg.fillRoundedRect(100, rewardY - 35, 550, 70, 12);

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
          valueText = '徽章解锁';
          break;
        case 'specimen':
          icon = '🌱';
          valueText = '标本解锁';
          break;
      }

      this.add.text(140, rewardY, icon, { font: '32px Arial' }).setOrigin(0, 0.5);

      this.add.text(190, rewardY - 8, reward.name, {
        font: 'bold 18px Arial',
        color: '#ffffff'
      }).setOrigin(0, 0.5);

      this.add.text(190, rewardY + 12, reward.description, {
        font: '14px Arial',
        color: '#aaaaaa'
      }).setOrigin(0, 0.5);

      this.add.text(590, rewardY, valueText, {
        font: 'bold 18px Arial',
        color: '#ffd700'
      }).setOrigin(1, 0.5);
    });

    const confirmBtn = this.add.graphics();
    confirmBtn.fillStyle(chapter.primaryColor, 1);
    confirmBtn.fillRoundedRect(225, 850, 300, 65, 16);
    confirmBtn.setInteractive(
      new Phaser.Geom.Rectangle(225, 850, 300, 65),
      Phaser.Geom.Rectangle.Contains
    );

    this.add.text(375, 882, '继续考察', {
      font: 'bold 22px Arial',
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

  private addBottomButtons(): void {
    const btnY = 1230;
    const btnW = 280;
    const btnH = 65;
    const spacing = 30;

    const galleryBtn = this.createBottomButton(
      375 - btnW / 2 - spacing / 2,
      btnY,
      btnW,
      btnH,
      '📚 图鉴',
      0x4caf50,
      () => this.scene.start('GalleryScene')
    );

    const levelsBtn = this.createBottomButton(
      375 + btnW / 2 + spacing / 2,
      btnY,
      btnW,
      btnH,
      '🎮 全部关卡',
      0x2196f3,
      () => this.scene.start('LevelSelectScene')
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
