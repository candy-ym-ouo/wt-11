import Phaser from 'phaser';
import { DailyQuestManager } from '../utils/DailyQuestManager';
import { SaveManager } from '../utils/SaveManager';
import { DailyQuest, DailyQuestReward } from '../types/GameTypes';
import { getPlantSpecimen } from '../data/PlantSpecimens';
import { getDifficultyColor, getDifficultyText } from '../utils/GameUtils';

export class DailyQuestScene extends Phaser.Scene {
  private countdownText!: Phaser.GameObjects.Text;
  private countdownTimer!: Phaser.Time.TimerEvent;

  constructor() {
    super('DailyQuestScene');
  }

  create(): void {
    this.addBackground();
    this.addTitle();
    this.addCountdown();
    this.addStatsBar();
    this.addQuestList();
    this.addBottomButtons();
    this.addBackButton();
  }

  private addBackground(): void {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    const bg = this.add.graphics();
    bg.fillStyle(0x16213e, 1);
    bg.fillRoundedRect(25, 120, 700, 1180, 20);
  }

  private addTitle(): void {
    this.add.text(375, 50, '📋 每日委托', {
      font: 'bold 40px Arial',
      color: '#e94560'
    }).setOrigin(0.5);

    this.add.text(375, 90, '完成每日任务获取丰厚奖励', {
      font: '20px Arial',
      color: '#aaaaaa'
    }).setOrigin(0.5);
  }

  private addCountdown(): void {
    const countdownBg = this.add.graphics();
    countdownBg.fillStyle(0x0f3460, 0.9);
    countdownBg.fillRoundedRect(450, 130, 260, 40, 10);

    this.countdownText = this.add.text(580, 150, '', {
      font: 'bold 18px Arial',
      color: '#ffd700'
    }).setOrigin(0.5);

    this.updateCountdown();
    this.countdownTimer = this.time.addEvent({
      delay: 1000,
      callback: this.updateCountdown,
      callbackScope: this,
      loop: true
    });
  }

  private updateCountdown(): void {
    const time = DailyQuestManager.getTimeUntilNextRefresh();
    this.countdownText.setText(
      `⌛ ${time.hours.toString().padStart(2, '0')}:${time.minutes.toString().padStart(2, '0')}:${time.seconds.toString().padStart(2, '0')} 后刷新`
    );
  }

  private addStatsBar(): void {
    const stats = DailyQuestManager.getDailyStats();
    const statsBg = this.add.graphics();
    statsBg.fillStyle(0x0f3460, 0.8);
    statsBg.fillRoundedRect(45, 130, 390, 40, 10);

    this.add.text(75, 150, `今日进度: ${stats.claimedQuests + stats.completedQuests}/${stats.totalQuests}`, {
      font: 'bold 18px Arial',
      color: '#ffffff'
    }).setOrigin(0, 0.5);

    this.add.text(310, 150, `连胜: ${stats.consecutiveWins}🔥`, {
      font: 'bold 18px Arial',
      color: '#ff9800'
    }).setOrigin(0, 0.5);
  }

  private addQuestList(): void {
    const quests = DailyQuestManager.getAllQuests();
    const startY = 210;
    const cardHeight = 260;
    const spacing = 25;

    quests.forEach((quest, index) => {
      const y = startY + cardHeight / 2 + index * (cardHeight + spacing);
      this.createQuestCard(375, y, quest, index);
    });
  }

  private createQuestCard(x: number, y: number, quest: DailyQuest, index: number): void {
    const width = 660;
    const height = 250;

    const statusColors: Record<string, number> = {
      pending: 0x2a2a4a,
      completed: 0x1a4d2e,
      claimed: 0x2a2a3a
    };
    const borderColors: Record<string, number> = {
      pending: getDifficultyColor(quest.difficulty),
      completed: 0x4caf50,
      claimed: 0x555566
    };

    const card = this.add.graphics();
    card.fillStyle(statusColors[quest.status], 1);
    card.lineStyle(3, borderColors[quest.status], 1);
    card.fillRoundedRect(x - width / 2, y - height / 2, width, height, 15);
    card.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 15);

    this.addQuestHeader(x, y, quest, index);
    this.addQuestProgress(x, y, quest);
    this.addQuestRewards(x, y, quest);
    this.addQuestAction(x, y, quest);
  }

  private addQuestHeader(x: number, y: number, quest: DailyQuest, index: number): void {
    const typeIcons: Record<string, string> = {
      restore_plant: '🌱',
      timed_score: '⏱️',
      win_streak: '🔥'
    };

    const icon = typeIcons[quest.type] || '📋';
    const diffColor = getDifficultyColor(quest.difficulty);

    this.add.text(x - 300, y - 100, icon, {
      font: '36px Arial'
    }).setOrigin(0, 0.5);

    this.add.text(x - 250, y - 100, quest.title, {
      font: 'bold 22px Arial',
      color: quest.status === 'claimed' ? '#888888' : '#ffffff'
    }).setOrigin(0, 0.5);

    const diffBadge = this.add.graphics();
    diffBadge.fillStyle(diffColor, 0.9);
    diffBadge.fillRoundedRect(x + 170, y - 115, 120, 30, 8);

    this.add.text(x + 230, y - 100, getDifficultyText(quest.difficulty), {
      font: 'bold 14px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    if (quest.status === 'claimed') {
      const claimedBadge = this.add.graphics();
      claimedBadge.fillStyle(0x555566, 1);
      claimedBadge.fillRoundedRect(x + 80, y - 115, 80, 30, 8);

      this.add.text(x + 120, y - 100, '已领取', {
        font: 'bold 14px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);
    } else if (quest.status === 'completed') {
      const completedBadge = this.add.graphics();
      completedBadge.fillStyle(0x4caf50, 1);
      completedBadge.fillRoundedRect(x + 80, y - 115, 80, 30, 8);

      this.add.text(x + 120, y - 100, '可领取', {
        font: 'bold 14px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);
    }

    this.add.text(x - 300, y - 65, quest.description, {
      font: '15px Arial',
      color: quest.status === 'claimed' ? '#777777' : '#bbbbbb',
      wordWrap: { width: 620 }
    }).setOrigin(0, 0.5);
  }

  private addQuestProgress(x: number, y: number, quest: DailyQuest): void {
    const progressWidth = 560;
    const progressHeight = 18;
    const progressX = x - progressWidth / 2;
    const progressY = y - 15;

    const progressBg = this.add.graphics();
    progressBg.fillStyle(0x0a0a1a, 0.8);
    progressBg.fillRoundedRect(progressX, progressY, progressWidth, progressHeight, 9);

    const progressPercent = Math.min(100, (quest.currentProgress / quest.targetProgress) * 100);
    const fillWidth = (progressWidth * progressPercent) / 100;

    if (fillWidth > 0) {
      const progressFill = this.add.graphics();
      if (quest.status === 'claimed') {
        progressFill.fillStyle(0x555566, 1);
      } else if (quest.status === 'completed') {
        progressFill.fillStyle(0x4caf50, 1);
      } else {
        progressFill.fillStyle(0xe94560, 1);
      }
      progressFill.fillRoundedRect(progressX, progressY, fillWidth, progressHeight, 9);
    }

    this.add.text(x, y - 6, DailyQuestManager.getQuestProgressText(quest), {
      font: 'bold 13px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    if (quest.type === 'restore_plant' && quest.targetSpecimenId) {
      const specimen = getPlantSpecimen(quest.targetSpecimenId);
      if (specimen) {
        const previewKey = `specimen-${specimen.id}-preview`;
        this.add.image(x - 270, y + 40, previewKey).setDisplaySize(60, 60);
      }
    }
  }

  private addQuestRewards(x: number, y: number, quest: DailyQuest): void {
    const rewardStartX = x - 200;
    const rewardY = y + 45;
    const rewardSpacing = 140;

    quest.rewards.forEach((reward, index) => {
      this.createRewardDisplay(
        rewardStartX + index * rewardSpacing,
        rewardY,
        reward,
        quest.status === 'claimed'
      );
    });
  }

  private createRewardDisplay(x: number, y: number, reward: DailyQuestReward, isClaimed: boolean): void {
    const rarityColors: Record<string, number> = {
      common: 0x9e9e9e,
      rare: 0x2196f3,
      epic: 0x9c27b0
    };
    const rarityBorder = rarityColors[reward.rarity] || 0x9e9e9e;

    const rewardBg = this.add.graphics();
    rewardBg.lineStyle(2, rarityBorder, isClaimed ? 0.5 : 1);
    rewardBg.fillStyle(0x0a0a1a, isClaimed ? 0.5 : 0.8);
    rewardBg.fillRoundedRect(x - 55, y - 25, 110, 50, 8);
    rewardBg.strokeRoundedRect(x - 55, y - 25, 110, 50, 8);

    const rewardIcons: Record<string, string> = {
      score: '💰',
      fragment: '🧩',
      material: '🧪'
    };
    const icon = rewardIcons[reward.type] || '🎁';

    this.add.text(x - 35, y, icon, {
      font: '20px Arial'
    }).setOrigin(0, 0.5);

    const textColor = isClaimed ? '#888888' : '#ffffff';
    this.add.text(x + 15, y - 10, reward.name, {
      font: 'bold 12px Arial',
      color: textColor
    }).setOrigin(0, 0.5);

    this.add.text(x + 15, y + 10, `x${reward.value}`, {
      font: 'bold 14px Arial',
      color: isClaimed ? '#666666' : '#ffd700'
    }).setOrigin(0, 0.5);
  }

  private addQuestAction(x: number, y: number, quest: DailyQuest): void {
    const btnX = x + 260;
    const btnY = y + 45;
    const btnW = 100;
    const btnH = 40;

    if (quest.status === 'completed') {
      const btn = this.add.graphics();
      btn.fillStyle(0x4caf50, 1);
      btn.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 10);
      btn.setInteractive(
        new Phaser.Geom.Rectangle(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH),
        Phaser.Geom.Rectangle.Contains
      );

      this.add.text(btnX, btnY, '🎁 领取', {
        font: 'bold 16px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);

      btn.on('pointerover', () => {
        btn.clear();
        btn.fillStyle(0x66bb6a, 1);
        btn.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 10);
      });

      btn.on('pointerout', () => {
        btn.clear();
        btn.fillStyle(0x4caf50, 1);
        btn.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 10);
      });

      btn.on('pointerup', () => {
        this.claimQuest(quest.id);
      });
    } else if (quest.status === 'pending') {
      if (quest.type === 'timed_score' && quest.targetLevelId) {
        const btn = this.add.graphics();
        btn.fillStyle(0xff9800, 1);
        btn.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 10);
        btn.setInteractive(
          new Phaser.Geom.Rectangle(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH),
          Phaser.Geom.Rectangle.Contains
        );

        this.add.text(btnX, btnY, '🎯 前往', {
          font: 'bold 16px Arial',
          color: '#ffffff'
        }).setOrigin(0.5);

        btn.on('pointerover', () => {
          btn.clear();
          btn.fillStyle(0xffa726, 1);
          btn.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 10);
        });

        btn.on('pointerout', () => {
          btn.clear();
          btn.fillStyle(0xff9800, 1);
          btn.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 10);
        });

        btn.on('pointerup', () => {
          this.scene.start('GameScene', { levelId: quest.targetLevelId });
        });
      } else if (quest.type === 'restore_plant') {
        const btn = this.add.graphics();
        btn.fillStyle(0xff9800, 1);
        btn.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 10);
        btn.setInteractive(
          new Phaser.Geom.Rectangle(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH),
          Phaser.Geom.Rectangle.Contains
        );

        this.add.text(btnX, btnY, '🔧 工坊', {
          font: 'bold 16px Arial',
          color: '#ffffff'
        }).setOrigin(0.5);

        btn.on('pointerover', () => {
          btn.clear();
          btn.fillStyle(0xffa726, 1);
          btn.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 10);
        });

        btn.on('pointerout', () => {
          btn.clear();
          btn.fillStyle(0xff9800, 1);
          btn.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 10);
        });

        btn.on('pointerup', () => {
          this.scene.start('WorkshopScene');
        });
      } else {
        const btn = this.add.graphics();
        btn.fillStyle(0x0f3460, 0.8);
        btn.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 10);

        this.add.text(btnX, btnY, '进行中', {
          font: 'bold 14px Arial',
          color: '#aaaaaa'
        }).setOrigin(0.5);
      }
    } else {
      const btn = this.add.graphics();
      btn.fillStyle(0x2a2a3a, 0.8);
      btn.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 10);

      this.add.text(btnX, btnY, '✓ 已完成', {
        font: 'bold 14px Arial',
        color: '#666666'
      }).setOrigin(0.5);
    }
  }

  private addBottomButtons(): void {
    const btnY = 1240;

    const claimAllBtn = this.createBottomButton(
      375,
      btnY,
      350,
      55,
      DailyQuestManager.hasClaimableQuests() ? `🎁 一键领取全部 (${DailyQuestManager.getClaimableQuestsCount()})` : '🎁 暂无奖励可领取',
      DailyQuestManager.hasClaimableQuests() ? 0xffc107 : 0x555566,
      DailyQuestManager.hasClaimableQuests() ? () => this.claimAllQuests() : undefined
    );
  }

  private createBottomButton(
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    color: number,
    onClick?: () => void
  ): Phaser.GameObjects.Graphics {
    const btn = this.add.graphics();
    btn.fillStyle(color, 1);
    btn.fillRoundedRect(x - w / 2, y - h / 2, w, h, 14);

    if (onClick) {
      btn.setInteractive(
        new Phaser.Geom.Rectangle(x - w / 2, y - h / 2, w, h),
        Phaser.Geom.Rectangle.Contains
      );

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
    }

    this.add.text(x, y, label, {
      font: 'bold 18px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    return btn;
  }

  private addBackButton(): void {
    const backBtn = this.add.graphics();
    backBtn.fillStyle(0xe94560, 1);
    backBtn.fillRoundedRect(20, 20, 60, 50, 10);
    backBtn.setInteractive(
      new Phaser.Geom.Rectangle(20, 20, 60, 50),
      Phaser.Geom.Rectangle.Contains
    );

    this.add.text(50, 45, '←', {
      font: 'bold 28px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    backBtn.on('pointerup', () => {
      this.scene.start('LevelSelectScene');
    });
  }

  private claimQuest(questId: string): void {
    const result = DailyQuestManager.claimQuest(questId);
    if (result.success && result.quest) {
      this.showRewardPopup(
        result.finalRewards,
        result.quest.title,
        result.conservationApplied,
        result.conservationMultiplier
      );
    }
  }

  private claimAllQuests(): void {
    const result = DailyQuestManager.claimAllQuests();
    if (result.success) {
      this.showRewardPopup(
        result.totalRewards,
        '每日委托全部完成',
        result.conservationApplied,
        result.conservationMultiplier
      );
    }
  }

  private showRewardPopup(
    rewards: DailyQuestReward[],
    title: string,
    conservationApplied: boolean = false,
    conservationMultiplier: { score: number; fragment: number } = { score: 1, fragment: 1 }
  ): void {
    this.countdownTimer.remove();

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.85);
    overlay.fillRect(0, 0, 750, 1334);

    const popupW = 600;
    const popupH = 450;
    const popupX = 375;
    const popupY = 667;

    const popup = this.add.graphics();
    popup.fillStyle(0x16213e, 1);
    popup.lineStyle(4, 0xffd700, 1);
    popup.fillRoundedRect(popupX - popupW / 2, popupY - popupH / 2, popupW, popupH, 20);
    popup.strokeRoundedRect(popupX - popupW / 2, popupY - popupH / 2, popupW, popupH, 20);

    this.add.text(popupX, popupY - 180, '🎉 恭喜获得奖励！', {
      font: 'bold 32px Arial',
      color: '#ffd700'
    }).setOrigin(0.5);

    this.add.text(popupX, popupY - 140, title, {
      font: '20px Arial',
      color: '#eaeaea'
    }).setOrigin(0.5);

    let rewardStartY = popupY - 60;
    if (conservationApplied) {
      const warnBg = this.add.graphics();
      warnBg.fillStyle(0x550000, 0.9);
      warnBg.fillRoundedRect(popupX - 260, popupY - 115, 520, 42, 10);
      warnBg.setInteractive(new Phaser.Geom.Rectangle(popupX - 260, popupY - 115, 520, 42), Phaser.Geom.Rectangle.Contains);

      this.add.text(popupX - 240, popupY - 95, '⚠️ 养护不足，奖励已衰减', {
        font: 'bold 14px Arial',
        color: '#ff9800'
      }).setOrigin(0, 0.5);

      this.add.text(popupX + 100, popupY - 95, `前往养护 →`, {
        font: 'bold 12px Arial',
        color: '#ffffff'
      }).setOrigin(0, 0.5);

      warnBg.on('pointerup', () => {
        overlay.destroy();
        this.scene.start('ConservationScene');
      });

      rewardStartY = popupY - 30;
    }
    const rewardSpacing = 90;
    const maxPerRow = 3;
    const totalRows = Math.ceil(rewards.length / maxPerRow);
    const startRowY = rewardStartY - ((totalRows - 1) * rewardSpacing) / 2;

    rewards.forEach((reward, index) => {
      const row = Math.floor(index / maxPerRow);
      const col = index % maxPerRow;
      const rx = popupX - (maxPerRow - 1) * 90 + col * 180;
      const ry = startRowY + row * rewardSpacing;

      this.createPopupReward(rx, ry, reward);
    });

    const closeBtn = this.add.graphics();
    closeBtn.fillStyle(0x4caf50, 1);
    closeBtn.fillRoundedRect(popupX - 120, popupY + 140, 240, 55, 14);
    closeBtn.setInteractive(
      new Phaser.Geom.Rectangle(popupX - 120, popupY + 140, 240, 55),
      Phaser.Geom.Rectangle.Contains
    );

    this.add.text(popupX, popupY + 168, '确认领取', {
      font: 'bold 22px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    closeBtn.on('pointerup', () => {
      this.scene.restart();
    });
  }

  private createPopupReward(x: number, y: number, reward: DailyQuestReward): void {
    const rarityColors: Record<string, number> = {
      common: 0x9e9e9e,
      rare: 0x2196f3,
      epic: 0x9c27b0
    };
    const borderColor = rarityColors[reward.rarity] || 0x9e9e9e;

    const bg = this.add.graphics();
    bg.fillStyle(0x0a0a1a, 1);
    bg.lineStyle(3, borderColor, 1);
    bg.fillRoundedRect(x - 75, y - 55, 150, 110, 12);
    bg.strokeRoundedRect(x - 75, y - 55, 150, 110, 12);

    const rewardIcons: Record<string, string> = {
      score: '💰',
      fragment: '🧩',
      material: '🧪'
    };
    const icon = rewardIcons[reward.type] || '🎁';

    this.add.text(x, y - 30, icon, {
      font: '40px Arial'
    }).setOrigin(0.5);

    this.add.text(x, y + 10, reward.name, {
      font: 'bold 14px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(x, y + 35, `x${reward.value}`, {
      font: 'bold 20px Arial',
      color: '#ffd700'
    }).setOrigin(0.5);
  }

  private lighten(hex: number, amount: number): number {
    const r = Math.min(255, ((hex >> 16) & 0xff) + amount);
    const g = Math.min(255, ((hex >> 8) & 0xff) + amount);
    const b = Math.min(255, (hex & 0xff) + amount);
    return (r << 16) | (g << 8) | b;
  }
}
