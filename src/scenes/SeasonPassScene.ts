import Phaser from 'phaser';
import { SeasonPassManager } from '../utils/SeasonPassManager';
import { SaveManager } from '../utils/SaveManager';
import {
  SeasonPassTrackType,
  SeasonPassQuest,
  SeasonPassReward,
  SeasonPassProgress
} from '../types/GameTypes';
import {
  getTrackTiers,
  getTrackTier,
  getTrackName,
  getTrackIcon,
  getTrackColor,
  MAX_TRACK_LEVEL
} from '../data/SeasonPassConfig';
import { getDifficultyColor, getDifficultyText } from '../utils/GameUtils';

export class SeasonPassScene extends Phaser.Scene {
  private currentTab: SeasonPassTrackType | 'quest' = 'restore';
  private tabButtons: Map<string, Phaser.GameObjects.Container> = new Map();
  private contentContainer!: Phaser.GameObjects.Container;
  private scrollY = 0;
  private maxScrollY = 0;

  constructor() {
    super('SeasonPassScene');
  }

  create(): void {
    this.addBackground();
    this.addHeader();
    this.addSeasonInfo();
    this.addTabs();
    this.addContentContainer();
    this.refreshContent();
    this.addBackButton();
    this.addPendingRewardListener();

    SeasonPassManager.addListener(() => {
      this.refreshContent();
      this.updateSeasonInfo();
    });
  }

  private addPendingRewardListener(): void {
    this.processPendingRewards();
    this.time.addEvent({
      delay: 500,
      callback: this.processPendingRewards,
      callbackScope: this,
      loop: true
    });
  }

  private processPendingRewards(): void {
    const pending = SeasonPassManager.getPendingRewards();
    if (pending.length > 0) {
      const rewards = SeasonPassManager.flushPendingRewards();
      this.applyPendingRewardsToSaveManager(rewards);
      this.showRewardNotification(rewards);
    }
  }

  private applyPendingRewardsToSaveManager(rewards: SeasonPassReward[]): void {
    rewards.forEach(reward => {
      switch (reward.type) {
        case 'score':
          if (reward.value) SaveManager.addScore(reward.value);
          break;
        case 'fragment':
          if (reward.fragmentId !== undefined && reward.value) {
            SaveManager.addFragments(reward.fragmentId, reward.value);
          }
          break;
        case 'material':
          if (reward.materialId !== undefined && reward.value) {
            SaveManager.addMaterials(reward.materialId, reward.value);
          }
          break;
        case 'research_point':
          if (reward.value) SaveManager.grantResearchPoints(reward.value);
          break;
        case 'badge':
          if (reward.badgeId !== undefined) SaveManager.grantBadge(reward.badgeId);
          break;
        case 'specimen':
          if (reward.specimenId !== undefined) SaveManager.unlockGallerySpecimen(reward.specimenId);
          break;
        case 'title':
          if (reward.titleId !== undefined) SaveManager.grantTitle(reward.titleId);
          break;
      }
    });
  }

  private showRewardNotification(rewards: SeasonPassReward[]): void {
    const notifications = rewards.slice(0, 3);
    notifications.forEach((reward, idx) => {
      this.time.delayedCall(idx * 800, () => {
        this.showSingleRewardNotification(reward);
      });
    });
  }

  private showSingleRewardNotification(reward: SeasonPassReward): void {
    const container = this.add.container(375, -100);
    const bg = this.add.graphics();
    bg.fillStyle(0x1e3a5f, 0.95);
    bg.lineStyle(2, 0xffd700, 1);
    bg.fillRoundedRect(-180, -40, 360, 80, 12);
    bg.strokeRoundedRect(-180, -40, 360, 80, 12);

    this.add.text(-140, 0, reward.icon, {
      font: '36px Arial'
    }).setOrigin(0, 0.5);

    this.add.text(-80, -18, reward.name, {
      font: 'bold 18px Arial',
      color: '#ffd700'
    }).setOrigin(0, 0.5);

    this.add.text(-80, 12, reward.description, {
      font: '14px Arial',
      color: '#cccccc'
    }).setOrigin(0, 0.5);

    container.add([bg]);
    container.bringToTop(bg);

    this.tweens.add({
      targets: container,
      y: 80,
      duration: 500,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: container,
          y: -100,
          duration: 500,
          delay: 2000,
          ease: 'Back.easeIn',
          onComplete: () => container.destroy()
        });
      }
    });
  }

  private addBackground(): void {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    const bg = this.add.graphics();
    bg.fillStyle(0x16213e, 1);
    bg.fillRoundedRect(25, 180, 700, 1100, 20);

    const gradient = this.add.graphics();
    const gradientColors = [0x0f3460, 0x533483, 0xe94560];
    gradient.fillGradientStyle(gradientColors[0], gradientColors[1], gradientColors[1], gradientColors[2], 0.3);
    gradient.fillRoundedRect(25, 180, 700, 1100, 20);
  }

  private addHeader(): void {
    this.add.text(375, 50, '🎫 赛季通行证', {
      font: 'bold 40px Arial',
      color: '#e94560'
    }).setOrigin(0.5);

    this.add.text(375, 90, '春华秋实赛季 · 收集进度解锁丰厚奖励', {
      font: '18px Arial',
      color: '#aaaaaa'
    }).setOrigin(0.5);
  }

  private addSeasonInfo(): void {
    const info = SeasonPassManager.getSeasonInfo();
    const stats = SeasonPassManager.getTotalStats();
    const isPremium = SeasonPassManager.isPremium();

    const infoBg = this.add.graphics();
    infoBg.fillStyle(isPremium ? 0x4a148c : 0x0f3460, 0.9);
    infoBg.lineStyle(2, isPremium ? 0xffd700 : 0x533483, 1);
    infoBg.fillRoundedRect(45, 130, 660, 80, 15);
    infoBg.strokeRoundedRect(45, 130, 660, 80, 15);

    this.add.text(70, 155, isPremium ? '👑 尊享通行证' : '🎫 免费通行证', {
      font: 'bold 22px Arial',
      color: isPremium ? '#ffd700' : '#ffffff'
    }).setOrigin(0, 0.5);

    this.add.text(70, 185, `剩余 ${info.daysRemaining} 天`, {
      font: '16px Arial',
      color: '#bbbbbb'
    }).setOrigin(0, 0.5);

    this.add.text(400, 155, `修复: ${stats.totalRestores}次`, {
      font: '16px Arial',
      color: '#4caf50'
    }).setOrigin(0, 0.5);

    this.add.text(560, 155, `得分: ${this.formatNumber(stats.totalScoreGain)}`, {
      font: '16px Arial',
      color: '#ffc107'
    }).setOrigin(0, 0.5);

    this.add.text(400, 185, `图鉴: ${stats.totalGalleryUnlocks}种`, {
      font: '16px Arial',
      color: '#2196f3'
    }).setOrigin(0, 0.5);

    this.add.text(560, 185, `任务: ${stats.completedQuests}个`, {
      font: '16px Arial',
      color: '#ff9800'
    }).setOrigin(0, 0.5);

    if (!isPremium) {
      const upgradeBtn = this.add.graphics();
      upgradeBtn.fillStyle(0xffd700, 0.9);
      upgradeBtn.lineStyle(2, 0xffa000, 1);
      upgradeBtn.fillRoundedRect(610, 150, 80, 40, 10);
      upgradeBtn.strokeRoundedRect(610, 150, 80, 40, 10);

      const text = this.add.text(650, 170, '升级', {
        font: 'bold 16px Arial',
        color: '#1a1a2e'
      }).setOrigin(0.5);

      const hitArea = this.add.zone(650, 170, 80, 40).setInteractive({ useHandCursor: true });
      hitArea.on('pointerup', () => {
        if (SeasonPassManager.upgradeToPremium()) {
          this.add.text(375, 400, '🎉 恭喜升级为尊享通行证！', {
            font: 'bold 28px Arial',
            color: '#ffd700'
          }).setOrigin(0.5);
          this.time.delayedCall(2000, () => this.scene.restart());
        }
      });
    }
  }

  private updateSeasonInfo(): void {
  }

  private addTabs(): void {
    const tabs: { key: SeasonPassTrackType | 'quest'; label: string; icon: string; color: number }[] = [
      { key: 'restore', label: '修复', icon: '🧩', color: 0x4caf50 },
      { key: 'score', label: '得分', icon: '🏆', color: 0xffc107 },
      { key: 'gallery', label: '图鉴', icon: '📖', color: 0x2196f3 },
      { key: 'quest', label: '任务', icon: '📋', color: 0xff9800 }
    ];

    const startX = 75;
    const tabWidth = 160;
    const tabHeight = 55;
    const y = 230;

    tabs.forEach((tab, idx) => {
      const x = startX + idx * (tabWidth + 5);
      const container = this.createTabButton(x, y, tabWidth, tabHeight, tab);
      this.tabButtons.set(tab.key, container);
    });

    this.updateTabStates();
  }

  private createTabButton(
    x: number,
    y: number,
    width: number,
    height: number,
    tab: { key: SeasonPassTrackType | 'quest'; label: string; icon: string; color: number }
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a3e, 1);
    bg.lineStyle(2, tab.color, 0.7);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 12);

    const iconText = this.add.text(-width / 4, 0, tab.icon, {
      font: '26px Arial'
    }).setOrigin(0, 0.5);

    const labelText = this.add.text(10, 0, tab.label, {
      font: 'bold 18px Arial',
      color: '#ffffff'
    }).setOrigin(0, 0.5);

    container.add([bg, iconText, labelText]);

    const hitArea = this.add.zone(x, y, width, height).setInteractive({ useHandCursor: true });
    hitArea.on('pointerup', () => {
      this.currentTab = tab.key;
      this.updateTabStates();
      this.scrollY = 0;
      this.refreshContent();
    });

    const badgeY = y - height / 2 - 8;
    const badgeX = x + width / 2 - 15;
    let hasClaimable = false;
    if (tab.key === 'quest') {
      hasClaimable = SeasonPassManager.getCompletedUnclaimedQuests().length > 0;
    } else {
      hasClaimable = SeasonPassManager.getClaimableRewards(tab.key).length > 0;
    }

    if (hasClaimable) {
      const badge = this.add.graphics();
      badge.fillStyle(0xff4444, 1);
      badge.fillCircle(badgeX, badgeY, 10);
      this.add.text(badgeX, badgeY, '!', {
        font: 'bold 14px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);
    }

    return container;
  }

  private updateTabStates(): void {
    this.tabButtons.forEach((container, key) => {
      const isActive = key === this.currentTab;
      const bg = container.getAt(0) as Phaser.GameObjects.Graphics;
      const label = container.getAt(2) as Phaser.GameObjects.Text;

      bg.clear();
      const tabs: { key: string; color: number }[] = [
        { key: 'restore', color: 0x4caf50 },
        { key: 'score', color: 0xffc107 },
        { key: 'gallery', color: 0x2196f3 },
        { key: 'quest', color: 0xff9800 }
      ];
      const tab = tabs.find(t => t.key === key)!;

      if (isActive) {
        bg.fillStyle(tab.color, 0.25);
        bg.lineStyle(3, tab.color, 1);
      } else {
        bg.fillStyle(0x1a1a3e, 1);
        bg.lineStyle(2, tab.color, 0.5);
      }
      bg.fillRoundedRect(-80, -27.5, 160, 55, 12);
      bg.strokeRoundedRect(-80, -27.5, 160, 55, 12);

      label.setColor(isActive ? '#ffffff' : '#bbbbbb');
      label.setFontStyle(isActive ? 'bold' : 'normal');
    });
  }

  private addContentContainer(): void {
    this.contentContainer = this.add.container(375, 310);
  }

  private refreshContent(): void {
    this.contentContainer.removeAll(true);

    if (this.currentTab === 'quest') {
      this.renderQuestTab();
    } else {
      this.renderTrackTab(this.currentTab);
    }
  }

  private renderTrackTab(trackType: SeasonPassTrackType): void {
    const progress = SeasonPassManager.getTrackProgress(trackType);
    const tiers = getTrackTiers(trackType);
    const color = getTrackColor(trackType);
    const isPremium = SeasonPassManager.isPremium();

    const headerY = 0;
    this.renderTrackHeader(headerY, trackType, progress, color);

    const listStartY = 120;
    const tierHeight = 130;
    const spacing = 15;

    tiers.forEach((tier, idx) => {
      const y = listStartY + idx * (tierHeight + spacing);
      this.renderTierCard(y, tier, progress, color, isPremium);
    });

    this.maxScrollY = Math.max(0, listStartY + tiers.length * (tierHeight + spacing) - 950);
    this.setupScrolling();
  }

  private renderTrackHeader(y: number, trackType: SeasonPassTrackType, progress: SeasonPassProgress, color: number): void {
    const container = this.add.container(0, y);

    const nameBg = this.add.graphics();
    nameBg.fillStyle(color, 0.2);
    nameBg.lineStyle(2, color, 0.8);
    nameBg.fillRoundedRect(-330, -40, 660, 80, 15);
    nameBg.strokeRoundedRect(-330, -40, 660, 80, 15);

    this.add.text(-300, -15, getTrackIcon(trackType), {
      font: '40px Arial'
    }).setOrigin(0, 0.5);

    this.add.text(-240, -15, getTrackName(trackType), {
      font: 'bold 26px Arial',
      color: '#ffffff'
    }).setOrigin(0, 0.5);

    this.add.text(-240, 15, `等级 ${progress.currentLevel} / ${MAX_TRACK_LEVEL}`, {
      font: '16px Arial',
      color: '#cccccc'
    }).setOrigin(0, 0.5);

    const progressBarBg = this.add.graphics();
    progressBarBg.fillStyle(0x0a0a1a, 0.8);
    progressBarBg.fillRoundedRect(50, -20, 280, 20, 10);

    const progressPercent = progress.nextLevelThreshold > 0
      ? Math.min(100, ((progress.currentValue - this.getLevelStartThreshold(trackType, progress.currentLevel)) /
          (progress.nextLevelThreshold - this.getLevelStartThreshold(trackType, progress.currentLevel))) * 100)
      : 100;
    const fillWidth = progressPercent > 0 ? (280 * progressPercent) / 100 : 0;

    if (fillWidth > 0) {
      const progressFill = this.add.graphics();
      progressFill.fillStyle(color, 1);
      progressFill.fillRoundedRect(50, -20, fillWidth, 20, 10);
    }

    this.add.text(190, -10, `${this.formatNumber(progress.currentValue)} / ${this.formatNumber(progress.nextLevelThreshold)}`, {
      font: '12px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(50, 15, progressPercent >= 100 ? '已达最高等级！' : `距离下一等级 ${this.formatNumber(progress.nextLevelThreshold - progress.currentValue)}`, {
      font: '14px Arial',
      color: progressPercent >= 100 ? '#4caf50' : '#aaaaaa'
    }).setOrigin(0, 0.5);

    container.add([nameBg, progressBarBg]);

    const claimableCount = SeasonPassManager.getClaimableRewards(trackType).length;
    if (claimableCount > 0) {
      this.add.text(300, 0, `🎁 ${claimableCount}项可领取`, {
        font: 'bold 16px Arial',
        color: '#ffd700'
      }).setOrigin(1, 0.5);
    }

    this.contentContainer.add(container);
  }

  private getLevelStartThreshold(trackType: SeasonPassTrackType, level: number): number {
    const tiers = getTrackTiers(trackType);
    const tier = tiers.find(t => t.level === level);
    return tier?.threshold ?? 0;
  }

  private renderTierCard(
    y: number,
    tier: any,
    progress: SeasonPassProgress,
    color: number,
    isPremium: boolean
  ): void {
    const container = this.add.container(0, y);
    const width = 660;
    const height = 120;

    const isUnlocked = progress.currentLevel >= tier.level;
    const isCurrent = progress.currentLevel === tier.level;

    const cardBg = this.add.graphics();
    if (isCurrent) {
      cardBg.fillStyle(color, 0.25);
      cardBg.lineStyle(3, color, 1);
    } else if (isUnlocked) {
      cardBg.fillStyle(0x1a3d2e, 0.8);
      cardBg.lineStyle(2, 0x4caf50, 0.7);
    } else {
      cardBg.fillStyle(0x1a1a2e, 0.9);
      cardBg.lineStyle(2, 0x444466, 0.5);
    }
    cardBg.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
    cardBg.strokeRoundedRect(-width / 2, -height / 2, width, height, 12);

    const levelBadge = this.add.graphics();
    const badgeColor = isUnlocked ? color : 0x555566;
    levelBadge.fillStyle(badgeColor, 0.9);
    levelBadge.fillCircle(-290, 0, 32);

    this.add.text(-290, -5, `Lv`, {
      font: 'bold 11px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(-290, 15, tier.level.toString(), {
      font: 'bold 20px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(-240, -40, `${getTrackIcon(tier.trackType)} 目标: ${this.formatNumber(tier.threshold)}`, {
      font: '14px Arial',
      color: isUnlocked ? '#ffffff' : '#888888'
    }).setOrigin(0, 0.5);

    if (tier.freeReward) {
      this.renderRewardSlot(-100, 0, tier.freeReward, tier, false, isUnlocked, progress);
    }

    if (tier.premiumReward) {
      this.renderRewardSlot(120, 0, tier.premiumReward, tier, true, isUnlocked && isPremium, progress);
    }

    if (isCurrent) {
      this.add.text(280, -40, '● 当前', {
        font: 'bold 14px Arial',
        color: '#ffd700'
      }).setOrigin(1, 0.5);
    } else if (isUnlocked) {
      this.add.text(280, -40, '✓ 已解锁', {
        font: '14px Arial',
        color: '#4caf50'
      }).setOrigin(1, 0.5);
    } else {
      this.add.text(280, -40, '🔒 未解锁', {
        font: '14px Arial',
        color: '#888888'
      }).setOrigin(1, 0.5);
    }

    container.add([cardBg, levelBadge]);
    this.contentContainer.add(container);
  }

  private renderRewardSlot(
    x: number,
    y: number,
    reward: SeasonPassReward,
    tier: any,
    isPremium: boolean,
    isUnlocked: boolean,
    progress: SeasonPassProgress
  ): void {
    const width = 180;
    const height = 90;

    const rarityColors: Record<string, number> = {
      common: 0x9e9e9e,
      rare: 0x2196f3,
      epic: 0x9c27b0,
      legendary: 0xffd700
    };

    const claimed = this.isRewardClaimed(tier.trackType, tier.level, isPremium);
    const canClaim = isUnlocked && !claimed;

    const slotBg = this.add.graphics();
    if (claimed) {
      slotBg.fillStyle(0x2a2a3a, 0.8);
      slotBg.lineStyle(2, 0x555566, 0.6);
    } else if (canClaim) {
      slotBg.fillStyle(rarityColors[reward.rarity], 0.25);
      slotBg.lineStyle(3, rarityColors[reward.rarity], 1);
    } else {
      slotBg.fillStyle(0x1a1a2e, 0.7);
      slotBg.lineStyle(2, rarityColors[reward.rarity], 0.3);
    }
    slotBg.fillRoundedRect(x - width / 2, y - height / 2, width, height, 10);
    slotBg.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 10);

    if (isPremium) {
      this.add.text(x - width / 2 + 10, y - height / 2 + 15, '👑 尊享', {
        font: 'bold 11px Arial',
        color: '#ffd700'
      }).setOrigin(0, 0.5);
    }

    this.add.text(x - 45, y, reward.icon, {
      font: '32px Arial'
    }).setOrigin(0, 0.5);

    this.add.text(x + 5, y - 18, reward.name, {
      font: 'bold 14px Arial',
      color: claimed ? '#777777' : '#ffffff'
    }).setOrigin(0, 0.5);

    const rarityLabels: Record<string, string> = {
      common: '普通',
      rare: '稀有',
      epic: '史诗',
      legendary: '传说'
    };
    this.add.text(x + 5, y + 5, rarityLabels[reward.rarity], {
      font: '11px Arial',
      color: '#' + rarityColors[reward.rarity].toString(16).padStart(6, '0')
    }).setOrigin(0, 0.5);

    if (canClaim) {
      const btnBg = this.add.graphics();
      btnBg.fillStyle(rarityColors[reward.rarity], 0.9);
      btnBg.fillRoundedRect(x - width / 2 + 10, y + height / 2 - 28, width - 20, 22, 6);

      const btnText = this.add.text(x, y + height / 2 - 17, claimed ? '✓ 已领取' : '🎁 领取', {
        font: 'bold 12px Arial',
        color: '#1a1a2e'
      }).setOrigin(0.5);

      const hitArea = this.add.zone(
        this.contentContainer.x + x,
        this.contentContainer.y + y + y + height / 2 - 17,
        width - 20,
        22
      ).setInteractive({ useHandCursor: true });

      hitArea.on('pointerup', () => {
        const result = SeasonPassManager.claimTrackReward(tier.trackType, tier.level, isPremium);
        if (result.success) {
          this.refreshContent();
        }
      });
    } else if (claimed) {
      this.add.text(x, y + height / 2 - 17, '✓ 已领取', {
        font: 'bold 12px Arial',
        color: '#777777'
      }).setOrigin(0.5);
    }

    this.contentContainer.add([slotBg]);
  }

  private isRewardClaimed(trackType: SeasonPassTrackType, level: number, isPremium: boolean): boolean {
    const data = SeasonPassManager.getData();
    const key = `${isPremium ? 'premium' : 'free'}_${level}`;
    const trackClaimed = data.rewardsClaimed[trackType];
    if (!trackClaimed) return false;
    return (trackClaimed as Record<string, boolean>)[key] ?? false;
  }

  private renderQuestTab(): void {
    const quests = SeasonPassManager.getActiveQuests();
    const completed = SeasonPassManager.getCompletedUnclaimedQuests();

    const headerY = 0;
    this.renderQuestHeader(headerY, completed.length);

    if (quests.length === 0) {
      this.add.text(0, 200, '暂无可用任务，请稍后刷新', {
        font: '20px Arial',
        color: '#888888'
      }).setOrigin(0.5);

      const refreshBtnBg = this.add.graphics();
      refreshBtnBg.fillStyle(0xff9800, 0.9);
      refreshBtnBg.fillRoundedRect(-80, 270, 160, 50, 12);

      this.add.text(0, 295, '🔄 刷新任务', {
        font: 'bold 18px Arial',
        color: '#1a1a2e'
      }).setOrigin(0.5);

      const hitArea = this.add.zone(
        this.contentContainer.x,
        this.contentContainer.y + 295,
        160,
        50
      ).setInteractive({ useHandCursor: true });
      hitArea.on('pointerup', () => {
        SeasonPassManager.refreshDailyQuests();
        this.refreshContent();
      });

      this.contentContainer.add([refreshBtnBg]);
      return;
    }

    const startY = 120;
    const cardHeight = 200;
    const spacing = 20;

    quests.forEach((quest, idx) => {
      const y = startY + idx * (cardHeight + spacing);
      this.renderQuestCard(y, quest);
    });

    this.maxScrollY = Math.max(0, startY + quests.length * (cardHeight + spacing) - 950);
    this.setupScrolling();
  }

  private renderQuestHeader(y: number, claimableCount: number): void {
    const container = this.add.container(0, y);

    const bg = this.add.graphics();
    bg.fillStyle(0xff9800, 0.2);
    bg.lineStyle(2, 0xff9800, 0.8);
    bg.fillRoundedRect(-330, -40, 660, 80, 15);
    bg.strokeRoundedRect(-330, -40, 660, 80, 15);

    this.add.text(-300, -15, '📋', {
      font: '40px Arial'
    }).setOrigin(0, 0.5);

    this.add.text(-240, -15, '赛季任务', {
      font: 'bold 26px Arial',
      color: '#ffffff'
    }).setOrigin(0, 0.5);

    this.add.text(-240, 15, '完成任务获取额外奖励', {
      font: '16px Arial',
      color: '#cccccc'
    }).setOrigin(0, 0.5);

    if (claimableCount > 0) {
      const badgeBg = this.add.graphics();
      badgeBg.fillStyle(0xff4444, 1);
      badgeBg.fillRoundedRect(200, -30, 110, 35, 10);

      this.add.text(255, -12, `🎁 ${claimableCount}可领`, {
        font: 'bold 14px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);
    }

    const refreshBtn = this.add.graphics();
    refreshBtn.fillStyle(0xff9800, 0.9);
    refreshBtn.fillRoundedRect(240, 0, 75, 32, 8);

    this.add.text(278, 16, '🔄 刷新', {
      font: 'bold 13px Arial',
      color: '#1a1a2e'
    }).setOrigin(0.5);

    const hitArea = this.add.zone(
      this.contentContainer.x + 278,
      this.contentContainer.y + 16,
      75,
      32
    ).setInteractive({ useHandCursor: true });
    hitArea.on('pointerup', () => {
      SeasonPassManager.refreshDailyQuests();
      this.refreshContent();
    });

    container.add([bg, refreshBtn]);
    this.contentContainer.add(container);
  }

  private renderQuestCard(y: number, quest: SeasonPassQuest): void {
    const container = this.add.container(0, y);
    const width = 660;
    const height = 190;

    const statusColors: Record<string, number> = {
      pending: 0x2a2a4a,
      in_progress: 0x1a3a5c,
      completed: 0x1a4d2e,
      claimed: 0x2a2a3a
    };
    const borderColors: Record<string, number> = {
      pending: getDifficultyColor(quest.difficulty),
      in_progress: 0x2196f3,
      completed: 0x4caf50,
      claimed: 0x555566
    };

    const cardBg = this.add.graphics();
    cardBg.fillStyle(statusColors[quest.status], 0.95);
    cardBg.lineStyle(3, borderColors[quest.status], 1);
    cardBg.fillRoundedRect(-width / 2, -height / 2, width, height, 15);
    cardBg.strokeRoundedRect(-width / 2, -height / 2, width, height, 15);

    const typeIcons: Record<string, string> = {
      restore: '🧩',
      score: '🏆',
      gallery: '📖'
    };
    const trackColor = getTrackColor(quest.trackType);

    this.add.text(-300, -65, typeIcons[quest.trackType] || '📋', {
      font: '36px Arial'
    }).setOrigin(0, 0.5);

    this.add.text(-240, -70, quest.title, {
      font: 'bold 22px Arial',
      color: quest.status === 'claimed' ? '#888888' : '#ffffff'
    }).setOrigin(0, 0.5);

    const diffColor = getDifficultyColor(quest.difficulty);
    const diffBadge = this.add.graphics();
    diffBadge.fillStyle(diffColor, 0.9);
    diffBadge.fillRoundedRect(180, -82, 90, 28, 8);

    this.add.text(225, -68, getDifficultyText(quest.difficulty), {
      font: 'bold 13px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    const trackBadge = this.add.graphics();
    trackBadge.fillStyle(trackColor, 0.8);
    trackBadge.fillRoundedRect(275, -82, 90, 28, 8);

    this.add.text(320, -68, getTrackName(quest.trackType), {
      font: 'bold 13px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(-300, -25, quest.description, {
      font: '15px Arial',
      color: quest.status === 'claimed' ? '#777777' : '#bbbbbb',
      wordWrap: { width: 580 }
    }).setOrigin(0, 0.5);

    const progressWidth = 560;
    const progressHeight = 22;
    const progressX = -280;
    const progressY = 20;

    const progressBg = this.add.graphics();
    progressBg.fillStyle(0x0a0a1a, 0.8);
    progressBg.fillRoundedRect(progressX, progressY, progressWidth, progressHeight, 11);

    const progressPercent = Math.min(100, (quest.currentProgress / quest.targetCount) * 100);
    const fillWidth = (progressWidth * progressPercent) / 100;

    if (fillWidth > 0) {
      const progressFill = this.add.graphics();
      if (quest.status === 'claimed') {
        progressFill.fillStyle(0x555566, 1);
      } else if (quest.status === 'completed') {
        progressFill.fillStyle(0x4caf50, 1);
      } else {
        progressFill.fillStyle(trackColor, 1);
      }
      progressFill.fillRoundedRect(progressX, progressY, fillWidth, progressHeight, 11);
    }

    this.add.text(progressX + progressWidth / 2, progressY + progressHeight / 2,
      `${quest.currentProgress} / ${quest.targetCount} (${Math.floor(progressPercent)}%)`, {
        font: 'bold 13px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);

    this.renderQuestRewards(y, quest);

    container.add([cardBg, diffBadge, trackBadge, progressBg]);
    this.contentContainer.add(container);
  }

  private renderQuestRewards(cardY: number, quest: SeasonPassQuest): void {
    const startX = -280;
    const rewardWidth = 150;
    const rewardHeight = 45;
    const y = cardY + 60;

    quest.rewards.slice(0, 3).forEach((reward, idx) => {
      const x = startX + idx * (rewardWidth + 10);

      const rarityColors: Record<string, number> = {
        common: 0x9e9e9e,
        rare: 0x2196f3,
        epic: 0x9c27b0,
        legendary: 0xffd700
      };

      const rewardBg = this.add.graphics();
      rewardBg.fillStyle(rarityColors[reward.rarity], 0.2);
      rewardBg.lineStyle(2, rarityColors[reward.rarity], 0.7);
      rewardBg.fillRoundedRect(x, y - rewardHeight / 2, rewardWidth, rewardHeight, 8);
      rewardBg.strokeRoundedRect(x, y - rewardHeight / 2, rewardWidth, rewardHeight, 8);

      this.add.text(x + 15, y, reward.icon, {
        font: '24px Arial'
      }).setOrigin(0, 0.5);

      this.add.text(x + 50, y - 8, reward.name, {
        font: 'bold 12px Arial',
        color: '#ffffff'
      }).setOrigin(0, 0.5);

      this.add.text(x + 50, y + 10, reward.description, {
        font: '10px Arial',
        color: '#cccccc'
      }).setOrigin(0, 0.5);

      this.contentContainer.add([rewardBg]);
    });

    if (quest.status === 'completed') {
      const btnX = 280;
      const btnY = y;

      const btnBg = this.add.graphics();
      btnBg.fillStyle(0x4caf50, 0.95);
      btnBg.fillRoundedRect(btnX - 75, btnY - 22, 150, 44, 10);

      this.add.text(btnX, btnY, '🎁 领取奖励', {
        font: 'bold 15px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);

      const hitArea = this.add.zone(
        this.contentContainer.x + btnX,
        this.contentContainer.y + btnY,
        150,
        44
      ).setInteractive({ useHandCursor: true });

      hitArea.on('pointerup', () => {
        const result = SeasonPassManager.claimQuest(quest.id);
        if (result.success) {
          this.refreshContent();
        }
      });
    } else if (quest.status === 'claimed') {
      this.add.text(280, y, '✓ 已领取', {
        font: 'bold 15px Arial',
        color: '#777777'
      }).setOrigin(0.5);
    }
  }

  private setupScrolling(): void {
    if (this.maxScrollY <= 0) {
      this.contentContainer.y = 310;
      return;
    }

    let isDragging = false;
    let startY = 0;
    let startScrollY = 0;

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.y > 290) {
        isDragging = true;
        startY = pointer.y;
        startScrollY = this.scrollY;
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!isDragging) return;
      const delta = pointer.y - startY;
      this.scrollY = Phaser.Math.Clamp(startScrollY - delta, 0, this.maxScrollY);
      this.contentContainer.y = 310 - this.scrollY;
    });

    this.input.on('pointerup', () => {
      isDragging = false;
    });

    this.input.on('pointerupoutside', () => {
      isDragging = false;
    });
  }

  private addBackButton(): void {
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x0f3460, 0.9);
    btnBg.lineStyle(2, 0x533483, 1);
    btnBg.fillRoundedRect(30, 30, 100, 45, 12);
    btnBg.strokeRoundedRect(30, 30, 100, 45, 12);

    this.add.text(80, 52, '← 返回', {
      font: 'bold 18px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    const hitArea = this.add.zone(80, 52, 100, 45).setInteractive({ useHandCursor: true });
    hitArea.on('pointerup', () => {
      this.scene.start('ChapterSelectScene');
    });
  }

  private formatNumber(n: number): string {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  }
}
