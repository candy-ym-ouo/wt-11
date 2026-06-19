import Phaser from 'phaser';
import { EventManager } from '../utils/EventManager';
import { SaveManager } from '../utils/SaveManager';
import { EventData, EventReward } from '../types/GameTypes';
import { getEventLevelRulesByEventId } from '../data/EventLevelRules';
import { getRarityColor, getRarityText } from '../data/Events';

export class EventScene extends Phaser.Scene {
  private eventData!: EventData;
  private countdownText!: Phaser.GameObjects.Text;
  private countdownTimer!: Phaser.Time.TimerEvent;
  private scoreText!: Phaser.GameObjects.Text;
  private rankText!: Phaser.GameObjects.Text;
  private progressText!: Phaser.GameObjects.Text;

  constructor() {
    super('EventScene');
  }

  create(): void {
    const event = EventManager.getCurrentEvent();
    if (!event) {
      this.showNoActiveEvent();
      return;
    }

    const access = EventManager.canAccessEvent(event.id);
    if (!access.allowed) {
      this.showLockedEvent(event, access);
      return;
    }

    this.eventData = event;

    this.addBackground();
    this.addEventBanner();
    this.addCountdown();
    this.addStatsPanel();
    this.addQuickActions();
    this.addRewardsSection();
    this.addLevelPreview();
    this.addBackButton();
    this.startCountdownTimer();
  }

  private showLockedEvent(event: EventData, access: { allowed: boolean; reason: string; required: number; current: number }): void {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    const bg = this.add.graphics();
    bg.fillStyle(0x16213e, 1);
    bg.fillRoundedRect(25, 80, 700, 1180, 20);

    this.add.text(375, 200, '🔒', {
      font: '120px Arial'
    }).setOrigin(0.5);

    this.add.text(375, 320, event.name, {
      font: 'bold 36px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(375, 380, '活动未解锁', {
      font: 'bold 28px Arial',
      color: '#ff7043'
    }).setOrigin(0.5);

    this.add.text(375, 450, access.reason, {
      font: '20px Arial',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    const progressBg = this.add.graphics();
    progressBg.fillStyle(0x0f3460, 1);
    progressBg.fillRoundedRect(125, 500, 500, 40, 20);

    const progress = access.current / access.required;
    const progressFill = this.add.graphics();
    progressFill.fillStyle(0xff9800, 1);
    progressFill.fillRoundedRect(125, 500, 500 * Math.min(progress, 1), 40, 20);

    this.add.text(375, 520, `主线通关进度: ${access.current} / ${access.required}`, {
      font: 'bold 16px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(375, 620, '💡 先去完成主线关卡解锁活动吧！', {
      font: '18px Arial',
      color: '#81c784'
    }).setOrigin(0.5);

    const backBtn = this.add.graphics();
    backBtn.fillStyle(0xe94560, 1);
    backBtn.fillRoundedRect(200, 750, 350, 70, 15);
    backBtn.setInteractive(
      new Phaser.Geom.Rectangle(200, 750, 350, 70),
      Phaser.Geom.Rectangle.Contains
    );

    this.add.text(375, 785, '返回主线', {
      font: 'bold 22px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    backBtn.on('pointerup', () => {
      this.scene.start('ChapterSelectScene');
    });

    backBtn.on('pointerover', () => {
      backBtn.clear();
      backBtn.fillStyle(0xff6b8a, 1);
      backBtn.fillRoundedRect(200, 750, 350, 70, 15);
    });

    backBtn.on('pointerout', () => {
      backBtn.clear();
      backBtn.fillStyle(0xe94560, 1);
      backBtn.fillRoundedRect(200, 750, 350, 70, 15);
    });
  }

  private showNoActiveEvent(): void {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    this.add.text(375, 300, '😢', { font: '100px Arial' }).setOrigin(0.5);
    this.add.text(375, 420, '暂无进行中的活动', {
      font: 'bold 32px Arial',
      color: '#eaeaea'
    }).setOrigin(0.5);
    this.add.text(375, 480, '请等待下次活动开启~', {
      font: '20px Arial',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    const btn = this.add.graphics();
    btn.fillStyle(0xe94560, 1);
    btn.fillRoundedRect(225, 600, 300, 70, 16);
    btn.setInteractive(
      new Phaser.Geom.Rectangle(225, 600, 300, 70),
      Phaser.Geom.Rectangle.Contains
    );
    this.add.text(375, 635, '返回章节选择', {
      font: 'bold 24px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    btn.on('pointerup', () => {
      this.scene.start('ChapterSelectScene');
    });
  }

  private addBackground(): void {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    const bg = this.add.graphics();
    bg.fillStyle(0x16213e, 1);
    bg.fillRoundedRect(20, 100, 710, 1180, 24);

    const decor = this.add.graphics();
    const shapes = ['🌸', '🌺', '🌷', '🌻', '🌼', '💐'];
    for (let i = 0; i < 12; i++) {
      const x = Phaser.Math.Between(50, 700);
      const y = Phaser.Math.Between(120, 1250);
      const emoji = shapes[Phaser.Math.Between(0, shapes.length - 1)];
      const alpha = Phaser.Math.FloatBetween(0.04, 0.08);
      const size = Phaser.Math.Between(30, 70);
      this.add.text(x, y, emoji, {
        font: `${size}px Arial`
      }).setAlpha(alpha).setOrigin(0.5);
    }
  }

  private addEventBanner(): void {
    const event = this.eventData;
    const bannerY = 170;

    const banner = this.add.graphics();
    const gradientSteps = 20;
    for (let i = 0; i < gradientSteps; i++) {
      const t = i / gradientSteps;
      const r = Math.floor(((event.primaryColor >> 16) & 0xff) * (1 - t) + ((event.secondaryColor >> 16) & 0xff) * t);
      const g = Math.floor(((event.primaryColor >> 8) & 0xff) * (1 - t) + ((event.secondaryColor >> 8) & 0xff) * t);
      const b = Math.floor((event.primaryColor & 0xff) * (1 - t) + (event.secondaryColor & 0xff) * t);
      const color = (r << 16) | (g << 8) | b;
      banner.fillStyle(color, 0.95);
      banner.fillRect(40 + (670 * i) / gradientSteps, bannerY - 70, 670 / gradientSteps + 1, 140);
    }
    banner.fillRoundedRect(40, bannerY - 70, 670, 140, 20);

    banner.lineStyle(4, event.accentColor, 1);
    banner.strokeRoundedRect(40, bannerY - 70, 670, 140, 20);

    this.add.text(90, bannerY - 35, event.banner, {
      font: '50px Arial'
    }).setOrigin(0, 0.5);

    const themeBadge = this.add.graphics();
    themeBadge.fillStyle(0xffffff, 0.9);
    themeBadge.fillRoundedRect(640, bannerY - 55, 55, 30, 8);
    this.add.text(667, bannerY - 40, '限时', {
      font: 'bold 14px Arial',
      color: '#' + event.primaryColor.toString(16).padStart(6, '0')
    }).setOrigin(0.5);

    this.add.text(170, bannerY - 35, event.name, {
      font: 'bold 32px Arial',
      color: '#ffffff'
    }).setOrigin(0, 0.5);

    this.add.text(170, bannerY + 10, event.description, {
      font: '14px Arial',
      color: 'rgba(255,255,255,0.9)',
      wordWrap: { width: 480 }
    }).setOrigin(0, 0.5);
  }

  private addCountdown(): void {
    const event = this.eventData;
    const y = 340;

    const status = EventManager.getEventStatus(event);
    const statusBg = this.add.graphics();

    let statusText = '';
    let statusColor = 0;
    if (status === 'not_started') {
      statusText = '距离活动开始';
      statusColor = 0xff9800;
    } else if (status === 'active') {
      statusText = '距离活动结束';
      statusColor = 0xe94560;
    } else {
      statusText = '活动已结束';
      statusColor = 0x9e9e9e;
    }

    statusBg.fillStyle(statusColor, 1);
    statusBg.fillRoundedRect(40, y - 35, 670, 70, 14);

    this.add.text(80, y, `⏰ ${statusText}`, {
      font: 'bold 22px Arial',
      color: '#ffffff'
    }).setOrigin(0, 0.5);

    this.countdownText = this.add.text(670, y, '计算中...', {
      font: 'bold 24px Arial',
      color: '#ffffff'
    }).setOrigin(1, 0.5);

    this.updateCountdown();
  }

  private updateCountdown(): void {
    const event = this.eventData;
    const status = EventManager.getEventStatus(event);

    if (status === 'not_started') {
      const time = EventManager.getTimeUntilStart(event.startTime);
      this.countdownText.setText(EventManager.formatCountdownShort(time));
    } else if (status === 'active') {
      const time = EventManager.getTimeRemaining(event.endTime);
      this.countdownText.setText(EventManager.formatCountdownShort(time));
    } else {
      this.countdownText.setText('已结束');
    }
  }

  private startCountdownTimer(): void {
    this.countdownTimer = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        this.updateCountdown();
      }
    });
  }

  private addStatsPanel(): void {
    const event = this.eventData;
    const eventId = event.id;
    const y = 445;

    const summary = EventManager.getEventCompletionSummary(eventId);

    const panel = this.add.graphics();
    panel.fillStyle(0x0f3460, 0.9);
    panel.fillRoundedRect(40, y, 670, 130, 16);

    const stats = [
      { icon: '🏆', label: '活动积分', value: summary.score.toLocaleString(), color: '#ffd700', x: 120 },
      { icon: '📊', label: '当前排名', value: summary.rank > 0 ? `#${summary.rank}` : '未上榜', color: '#ff9800', x: 315 },
      { icon: '⭐', label: '获得星星', value: `${summary.earnedStars}/${summary.totalStars}`, color: '#4caf50', x: 510 },
      { icon: '🎯', label: '完成进度', value: `${summary.completedLevels}/${summary.totalLevels}`, color: '#2196f3', x: 650 }
    ];

    stats.forEach(stat => {
      this.add.text(stat.x, y + 45, stat.icon, { font: '28px Arial' }).setOrigin(0.5);
      this.add.text(stat.x, y + 80, stat.label, {
        font: '13px Arial',
        color: '#888888'
      }).setOrigin(0.5);
      this.add.text(stat.x, y + 105, stat.value, {
        font: 'bold 18px Arial',
        color: stat.color
      }).setOrigin(0.5);
    });

    const divider = this.add.graphics();
    divider.lineStyle(1, 0xffffff, 0.1);
    divider.beginPath();
    divider.moveTo(220, y + 30);
    divider.lineTo(220, y + 120);
    divider.moveTo(410, y + 30);
    divider.lineTo(410, y + 120);
    divider.moveTo(600, y + 30);
    divider.lineTo(600, y + 120);
    divider.strokePath();
  }

  private addQuickActions(): void {
    const y = 625;
    const btnW = 205;
    const btnH = 90;
    const spacing = 15;
    const totalW = btnW * 3 + spacing * 2;
    const startX = (750 - totalW) / 2 + btnW / 2;

    const actions = [
      {
        icon: '🎮',
        title: '活动关卡',
        desc: '挑战限定关卡',
        color: 0xe94560,
        onClick: () => this.scene.start('EventLevelSelectScene', { eventId: this.eventData.id })
      },
      {
        icon: '🏆',
        title: '积分排行',
        desc: '查看排名',
        color: 0xff9800,
        onClick: () => this.scene.start('EventRankingScene', { eventId: this.eventData.id })
      },
      {
        icon: '🎁',
        title: '奖励领取',
        desc: '专属图鉴',
        color: 0x9c27b0,
        onClick: () => this.showRewardsModal()
      }
    ];

    actions.forEach((action, index) => {
      const x = startX + index * (btnW + spacing);

      const btn = this.add.graphics();
      btn.fillStyle(action.color, 1);
      btn.fillRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 14);

      btn.setInteractive(
        new Phaser.Geom.Rectangle(x - btnW / 2, y - btnH / 2, btnW, btnH),
        Phaser.Geom.Rectangle.Contains
      );

      this.add.text(x, y - 20, action.icon, { font: '30px Arial' }).setOrigin(0.5);
      this.add.text(x, y + 15, action.title, {
        font: 'bold 16px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);
      this.add.text(x, y + 35, action.desc, {
        font: '12px Arial',
        color: 'rgba(255,255,255,0.75)'
      }).setOrigin(0.5);

      btn.on('pointerover', () => {
        btn.clear();
        btn.fillStyle(this.lighten(action.color, 20), 1);
        btn.fillRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 14);
      });

      btn.on('pointerout', () => {
        btn.clear();
        btn.fillStyle(action.color, 1);
        btn.fillRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 14);
      });

      btn.on('pointerup', action.onClick);
    });

    const claimableRewards = SaveManager.getClaimableEventRewards(this.eventData.id);
    if (claimableRewards.length > 0) {
      const badge = this.add.graphics();
      const badgeX = startX + 2 * (btnW + spacing) + btnW / 2 - 10;
      const badgeY = y - btnH / 2 + 10;
      badge.fillStyle(0xffeb3b, 1);
      badge.fillCircle(badgeX + 80, badgeY, 18);
      this.add.text(badgeX + 80, badgeY, claimableRewards.length.toString(), {
        font: 'bold 16px Arial',
        color: '#1a1a2e'
      }).setOrigin(0.5);
    }
  }

  private addRewardsSection(): void {
    const event = this.eventData;
    const eventId = event.id;
    const myScore = SaveManager.getEventTotalScore(eventId);
    const yStart = 760;

    const sectionBg = this.add.graphics();
    sectionBg.fillStyle(0x0f3460, 0.7);
    sectionBg.fillRoundedRect(40, yStart, 670, 320, 16);

    this.add.text(75, yStart + 25, '🎁 奖励进度', {
      font: 'bold 22px Arial',
      color: '#ffffff'
    }).setOrigin(0, 0.5);

    const nextReward = EventManager.getNextReward(eventId);
    if (nextReward) {
      const progressY = yStart + 75;

      this.add.text(75, progressY - 20, `下一奖励: ${nextReward.reward.icon} ${nextReward.reward.name}`, {
        font: '15px Arial',
        color: '#aaaaaa'
      }).setOrigin(0, 0.5);

      this.add.text(675, progressY - 20, `${myScore.toLocaleString()} / ${nextReward.reward.threshold.toLocaleString()}`, {
        font: 'bold 14px Arial',
        color: '#ffd700'
      }).setOrigin(1, 0.5);

      const barBg = this.add.graphics();
      barBg.fillStyle(0x000000, 0.35);
      barBg.fillRoundedRect(75, progressY, 600, 22, 6);

      const barFill = this.add.graphics();
      const fillW = (nextReward.progress / 100) * 600;
      barFill.fillStyle(event.accentColor, 1);
      barFill.fillRoundedRect(75, progressY, fillW, 22, 6);

      this.add.text(375, progressY + 11, `${Math.floor(nextReward.progress)}%`, {
        font: 'bold 13px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);
    }

    const rewardsPerRow = 4;
    const rewardW = 145;
    const rewardH = 110;
    const rewardSpacing = 12;
    const totalRewardW = rewardW * rewardsPerRow + rewardSpacing * (rewardsPerRow - 1);
    const rewardStartX = (750 - totalRewardW) / 2 + rewardW / 2;
    const rewardStartY = yStart + 140;

    event.rewards.slice(0, 4).forEach((reward, index) => {
      const row = Math.floor(index / rewardsPerRow);
      const col = index % rewardsPerRow;
      const x = rewardStartX + col * (rewardW + rewardSpacing);
      const y = rewardStartY + row * (rewardH + rewardSpacing);

      this.createRewardCard(x, y, rewardW, rewardH, reward, myScore);
    });

    const viewAllBtn = this.add.graphics();
    const viewAllBtnY = yStart + 280;
    viewAllBtn.fillStyle(0x5e35b2, 1);
    viewAllBtn.fillRoundedRect(500, viewAllBtnY, 190, 36, 10);
    viewAllBtn.setInteractive(
      new Phaser.Geom.Rectangle(500, viewAllBtnY, 190, 36),
      Phaser.Geom.Rectangle.Contains
    );
    this.add.text(595, viewAllBtnY + 18, '查看全部奖励 →', {
      font: 'bold 14px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    viewAllBtn.on('pointerup', () => this.showRewardsModal());
  }

  private createRewardCard(
    x: number,
    y: number,
    w: number,
    h: number,
    reward: EventReward,
    myScore: number
  ): void {
    const eventId = this.eventData.id;
    const achieved = myScore >= reward.threshold;
    const claimed = SaveManager.getEventProgress(eventId)?.rewardsClaimed[reward.id] ?? false;
    const rarityColor = getRarityColor(reward.rarity);

    const card = this.add.graphics();
    card.fillStyle(achieved ? 0x1e3a5f : 0x2a2a3a, claimed ? 0.5 : 1);
    card.lineStyle(2, achieved ? rarityColor : 0x555566, claimed ? 0.3 : 1);
    card.fillRoundedRect(x - w / 2, y - h / 2, w, h, 10);
    card.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 10);

    const rarityBar = this.add.graphics();
    rarityBar.fillStyle(rarityColor, achieved ? 1 : 0.3);
    rarityBar.fillRoundedRect(x - w / 2 + 8, y - h / 2 + 8, 36, 16, 4);
    this.add.text(x - w / 2 + 26, y - h / 2 + 16, getRarityText(reward.rarity), {
      font: 'bold 10px Arial',
      color: achieved ? '#ffffff' : '#888888'
    }).setOrigin(0.5);

    this.add.text(x, y - 5, reward.icon, { font: '32px Arial' })
      .setOrigin(0.5)
      .setAlpha(achieved || claimed ? 1 : 0.4);

    this.add.text(x, y + 25, reward.name, {
      font: 'bold 12px Arial',
      color: achieved || claimed ? '#ffffff' : '#777777'
    }).setOrigin(0.5);

    this.add.text(x, y + 42, `${reward.threshold.toLocaleString()}分`, {
      font: '11px Arial',
      color: achieved ? '#ffd700' : '#666666'
    }).setOrigin(0.5);

    if (claimed) {
      this.add.text(x, y - h / 2 + 15, '✓', {
        font: 'bold 16px Arial',
        color: '#4caf50'
      }).setOrigin(0.5, 0.5).setX(x + w / 2 - 18);
    }
  }

  private addLevelPreview(): void {
    const eventId = this.eventData.id;
    const eventLevels = getEventLevelRulesByEventId(eventId);
    const yStart = 1110;

    const sectionBg = this.add.graphics();
    sectionBg.fillStyle(0x0f3460, 0.5);
    sectionBg.fillRoundedRect(40, yStart, 670, 110, 14);

    this.add.text(75, yStart + 28, '🌿 活动关卡预览', {
      font: 'bold 20px Arial',
      color: '#ffffff'
    }).setOrigin(0, 0.5);

    const completedCount = SaveManager.getCompletedEventLevelsCount(eventId);
    this.add.text(675, yStart + 28, `${completedCount}/${eventLevels.length} 已完成`, {
      font: 'bold 14px Arial',
      color: '#4caf50'
    }).setOrigin(1, 0.5);

    const levelW = 115;
    const levelH = 55;
    const levelSpacing = 8;
    const totalLevelW = levelW * eventLevels.length + levelSpacing * (eventLevels.length - 1);
    const levelStartX = (750 - totalLevelW) / 2 + levelW / 2;
    const levelY = yStart + 75;

    eventLevels.forEach((level, index) => {
      const x = levelStartX + index * (levelW + levelSpacing);
      const progress = SaveManager.getEventLevelProgress(eventId, level.id);
      const unlocked = progress?.unlocked ?? false;
      const completed = progress?.completed ?? false;

      const card = this.add.graphics();
      const color = completed ? 0x4caf50 : unlocked ? this.eventData.primaryColor : 0x444455;
      card.fillStyle(color, unlocked ? 1 : 0.5);
      card.fillRoundedRect(x - levelW / 2, levelY - levelH / 2, levelW, levelH, 8);

      if (!unlocked) {
        this.add.text(x, levelY, '🔒', { font: '22px Arial' }).setOrigin(0.5);
      } else {
        this.add.text(x, levelY - 10, level.name.split('·')[0], {
          font: 'bold 13px Arial',
          color: '#ffffff'
        }).setOrigin(0.5);

        const stars = progress?.stars ?? 0;
        let starStr = '';
        for (let i = 0; i < 3; i++) {
          starStr += i < stars ? '⭐' : '☆';
        }
        this.add.text(x, levelY + 14, starStr, {
          font: '12px Arial'
        }).setOrigin(0.5);
      }

      if (unlocked) {
        card.setInteractive(
          new Phaser.Geom.Rectangle(x - levelW / 2, levelY - levelH / 2, levelW, levelH),
          Phaser.Geom.Rectangle.Contains
        );
        card.on('pointerup', () => {
          this.scene.start('GameScene', { levelId: level.id, isEventLevel: true, eventId });
        });
      }
    });
  }

  private showRewardsModal(): void {
    const event = this.eventData;
    const eventId = event.id;
    const myScore = SaveManager.getEventTotalScore(eventId);

    const container = this.add.container(0, 0);

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.85);
    overlay.fillRect(0, 0, 750, 1334);
    overlay.setInteractive();
    container.add(overlay);

    const modal = this.add.graphics();
    modal.fillStyle(0x16213e, 1);
    modal.fillRoundedRect(40, 180, 670, 950, 24);
    modal.lineStyle(4, event.accentColor, 1);
    modal.strokeRoundedRect(40, 180, 670, 950, 24);
    container.add(modal);

    container.add(this.add.text(375, 225, '🎁 活动奖励', {
      font: 'bold 30px Arial',
      color: '#ffffff'
    }).setOrigin(0.5));

    const scoreBg = this.add.graphics();
    scoreBg.fillStyle(0x0f3460, 0.9);
    scoreBg.fillRoundedRect(75, 260, 600, 50, 10);
    container.add(scoreBg);
    container.add(this.add.text(110, 285, '🏆 当前活动积分', {
      font: '16px Arial',
      color: '#aaaaaa'
    }).setOrigin(0, 0.5));
    container.add(this.add.text(640, 285, myScore.toLocaleString(), {
      font: 'bold 24px Arial',
      color: '#ffd700'
    }).setOrigin(1, 0.5));

    const rewardsStartY = 340;
    const rewardW = 600;
    const rewardH = 85;
    const rewardSpacing = 12;

    event.rewards.forEach((reward, index) => {
      const y = rewardsStartY + index * (rewardH + rewardSpacing);
      const achieved = myScore >= reward.threshold;
      const claimed = SaveManager.getEventProgress(eventId)?.rewardsClaimed[reward.id] ?? false;
      const canClaim = achieved && !claimed;
      const rarityColor = getRarityColor(reward.rarity);

      const rewardCard = this.add.graphics();
      rewardCard.fillStyle(0x0f3460, 1);
      rewardCard.lineStyle(2, canClaim ? rarityColor : (claimed ? 0x4caf50 : 0x3a3a4a), 1);
      rewardCard.fillRoundedRect(75, y - rewardH / 2, rewardW, rewardH, 12);
      rewardCard.strokeRoundedRect(75, y - rewardH / 2, rewardW, rewardH, 12);
      container.add(rewardCard);

      const progress = Math.min(100, (myScore / reward.threshold) * 100);
      const miniBarBg = this.add.graphics();
      miniBarBg.fillStyle(0x000000, 0.3);
      miniBarBg.fillRoundedRect(75, y + rewardH / 2 - 6, rewardW, 6, 3);
      container.add(miniBarBg);
      const miniBarFill = this.add.graphics();
      miniBarFill.fillStyle(achieved ? rarityColor : 0x555566, 1);
      miniBarFill.fillRoundedRect(75, y + rewardH / 2 - 6, (progress / 100) * rewardW, 6, 3);
      container.add(miniBarFill);

      container.add(this.add.text(115, y, reward.icon, { font: '36px Arial' }).setOrigin(0, 0.5));

      container.add(this.add.text(170, y - 12, reward.name, {
        font: 'bold 17px Arial',
        color: '#ffffff'
      }).setOrigin(0, 0.5));
      container.add(this.add.text(170, y + 12, reward.description, {
        font: '13px Arial',
        color: '#aaaaaa',
        wordWrap: { width: 300 }
      }).setOrigin(0, 0.5));

      const rarityText = this.add.text(510, y - 18, getRarityText(reward.rarity), {
        font: 'bold 12px Arial',
        color: '#' + rarityColor.toString(16).padStart(6, '0')
      }).setOrigin(0, 0.5);
      container.add(rarityText);

      const thresholdText = this.add.text(510, y + 8, `${reward.threshold.toLocaleString()} 分`, {
        font: '14px Arial',
        color: achieved ? '#4caf50' : '#888888'
      }).setOrigin(0, 0.5);
      container.add(thresholdText);

      if (claimed) {
        const claimedBadge = this.add.graphics();
        claimedBadge.fillStyle(0x4caf50, 1);
        claimedBadge.fillRoundedRect(590, y - 20, 70, 40, 8);
        container.add(claimedBadge);
        container.add(this.add.text(625, y, '已领取', {
          font: 'bold 13px Arial',
          color: '#ffffff'
        }).setOrigin(0.5));
      } else if (canClaim) {
        const claimBtn = this.add.graphics();
        claimBtn.fillStyle(rarityColor, 1);
        claimBtn.fillRoundedRect(580, y - 22, 85, 44, 10);
        claimBtn.setInteractive(
          new Phaser.Geom.Rectangle(580, y - 22, 85, 44),
          Phaser.Geom.Rectangle.Contains
        );
        container.add(claimBtn);
        container.add(this.add.text(622, y, '领取', {
          font: 'bold 15px Arial',
          color: '#ffffff'
        }).setOrigin(0.5));

        claimBtn.on('pointerup', () => {
          const claimedReward = SaveManager.claimEventReward(eventId, reward.id);
          if (claimedReward) {
            this.showRewardClaimedToast(claimedReward);
            container.destroy();
            this.scene.restart();
          }
        });
      }
    });

    const closeBtn = this.add.graphics();
    closeBtn.fillStyle(event.primaryColor, 1);
    closeBtn.fillRoundedRect(225, 1070, 300, 60, 14);
    closeBtn.setInteractive(
      new Phaser.Geom.Rectangle(225, 1070, 300, 60),
      Phaser.Geom.Rectangle.Contains
    );
    container.add(closeBtn);
    container.add(this.add.text(375, 1100, '关闭', {
      font: 'bold 22px Arial',
      color: '#ffffff'
    }).setOrigin(0.5));

    const close = () => container.destroy();
    closeBtn.on('pointerup', close);
    overlay.on('pointerup', close);
  }

  private showRewardClaimedToast(reward: EventReward): void {
    const toast = this.add.container(0, 0);
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, 750, 1334);
    toast.add(overlay);

    const y = 500;
    const modal = this.add.graphics();
    modal.fillStyle(0x16213e, 1);
    modal.fillRoundedRect(150, y - 120, 450, 240, 20);
    modal.lineStyle(4, getRarityColor(reward.rarity), 1);
    modal.strokeRoundedRect(150, y - 120, 450, 240, 20);
    toast.add(modal);

    toast.add(this.add.text(375, y - 75, '🎉 奖励领取成功', {
      font: 'bold 24px Arial',
      color: '#4caf50'
    }).setOrigin(0.5));

    toast.add(this.add.text(375, y - 10, reward.icon, { font: '60px Arial' }).setOrigin(0.5));

    toast.add(this.add.text(375, y + 50, reward.name, {
      font: 'bold 22px Arial',
      color: '#ffffff'
    }).setOrigin(0.5));

    toast.add(this.add.text(375, y + 80, reward.description, {
      font: '14px Arial',
      color: '#aaaaaa',
      align: 'center',
      wordWrap: { width: 400 }
    }).setOrigin(0.5));

    this.time.delayedCall(1800, () => toast.destroy());
  }

  private addBackButton(): void {
    const btnX = 375;
    const btnY = 1260;

    const btn = this.add.graphics();
    btn.fillStyle(0xe94560, 1);
    btn.fillRoundedRect(btnX - 160, btnY - 35, 320, 70, 16);
    btn.setInteractive(
      new Phaser.Geom.Rectangle(btnX - 160, btnY - 35, 320, 70),
      Phaser.Geom.Rectangle.Contains
    );

    this.add.text(btnX, btnY, '← 返回章节选择', {
      font: 'bold 24px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    btn.on('pointerover', () => {
      btn.clear();
      btn.fillStyle(0xff6b8a, 1);
      btn.fillRoundedRect(btnX - 160, btnY - 35, 320, 70, 16);
    });

    btn.on('pointerout', () => {
      btn.clear();
      btn.fillStyle(0xe94560, 1);
      btn.fillRoundedRect(btnX - 160, btnY - 35, 320, 70, 16);
    });

    btn.on('pointerup', () => {
      this.scene.start('ChapterSelectScene');
    });
  }

  private lighten(hex: number, amount: number): number {
    const r = Math.min(255, ((hex >> 16) & 0xff) + amount);
    const g = Math.min(255, ((hex >> 8) & 0xff) + amount);
    const b = Math.min(255, (hex & 0xff) + amount);
    return (r << 16) | (g << 8) | b;
  }

  destroy(): void {
    if (this.countdownTimer) {
      this.countdownTimer.remove();
    }
  }
}
