import Phaser from 'phaser';
import { SaveManager } from '../utils/SaveManager';
import { DonationManager } from '../utils/DonationManager';
import { DonationTiers, DonationRewards, getDonationTier, getNextTier, getDonationTierByDonations } from '../data/DonationConfig';
import { getPlantSpecimen } from '../data/PlantSpecimens';
import { Levels } from '../data/Levels';
import { DonationTier, DonationEntry, DonationReward, DonationResult, DonationClaimResult, Reward } from '../types/GameTypes';

export class DonationScene extends Phaser.Scene {
  private currentTab: 'donate' | 'tiers' | 'history' = 'donate';
  private selectedSpecimenId: number | null = null;
  private donationDetails: Map<number, { available: number; donated: number }> = new Map();

  constructor() {
    super('DonationScene');
  }

  private getSpecimenIcon(specimenId: number): string {
    const shapeIcons: Record<string, string> = {
      ginkgo: '🍂',
      rose: '🌹',
      sunflower: '🌻',
      lavender: '💜',
      orchid: '🌸',
      succulent: '🌵'
    };
    const level = Levels.find(l => l.specimen.id === specimenId);
    return shapeIcons[level?.specimen.shape || ''] || '🌱';
  }

  private getSpecimenRarity(specimenId: number): string {
    const level = Levels.find(l => l.specimen.id === specimenId);
    const diff = level?.rule.difficulty || 'easy';
    const rarityMap: Record<string, string> = {
      easy: '普通',
      medium: '稀有',
      hard: '史诗'
    };
    return rarityMap[diff] || '普通';
  }

  create(): void {
    this.calculateDonationDetails();
    this.addBackground();
    this.addTitle();
    this.addStatsBar();
    this.addTabButtons();

    if (this.currentTab === 'donate') {
      this.addDonateTab();
    } else if (this.currentTab === 'tiers') {
      this.addTiersTab();
    } else {
      this.addHistoryTab();
    }

    this.addBackButton();
  }

  private calculateDonationDetails(): void {
    const restored = SaveManager.getRestoredSpecimenIds();
    restored.forEach(id => {
      const level = Levels.find(l => l.specimen.id === id);
      const available = SaveManager.getSpecimenCount(id) - 1;
      const donated = SaveManager.getDonationsBySpecimen(id);
      this.donationDetails.set(id, { available: Math.max(0, available), donated });
    });
  }

  private addBackground(): void {
    this.cameras.main.setBackgroundColor('#1a1a2e');
    const bg = this.add.graphics();
    bg.fillStyle(0x16213e, 1);
    bg.fillRoundedRect(25, 100, 700, 1150, 20);
  }

  private addTitle(): void {
    this.add.text(375, 60, '标本捐赠馆', {
      font: 'bold 38px Arial',
      color: '#ffb74d'
    }).setOrigin(0.5);

    this.add.text(375, 100, '捐赠重复标本，换取研究币与荣誉', {
      font: '20px Arial',
      color: '#eaeaea'
    }).setOrigin(0.5);
  }

  private addStatsBar(): void {
    const statsBg = this.add.graphics();
    statsBg.fillStyle(0x0f3460, 0.8);
    statsBg.fillRoundedRect(45, 130, 660, 60, 12);

    const totalDonations = SaveManager.getTotalDonations();
    const currentTier = getDonationTierByDonations(totalDonations);
    const nextTier = getNextTier(totalDonations);
    const researchCoin = SaveManager.getResearchPoints();
    const totalResearchCoin = DonationManager.getTotalResearchCoinEarned();

    this.add.text(70, 160, currentTier?.icon || '🌱', { font: '26px Arial' }).setOrigin(0, 0.5);
    this.add.text(105, 160, `等级: ${currentTier?.name || '新手'}`, {
      font: 'bold 16px Arial',
      color: '#ffb74d'
    }).setOrigin(0, 0.5);

    this.add.text(310, 160, '🎁', { font: '22px Arial' }).setOrigin(0, 0.5);
    this.add.text(340, 160, `捐赠: ${totalDonations}次`, {
      font: 'bold 16px Arial',
      color: '#4caf50'
    }).setOrigin(0, 0.5);

    this.add.text(500, 160, '💰', { font: '22px Arial' }).setOrigin(0, 0.5);
    this.add.text(530, 160, `研究币: ${researchCoin.toLocaleString()}`, {
      font: 'bold 16px Arial',
      color: '#2196f3'
    }).setOrigin(0, 0.5);

    if (currentTier && nextTier) {
      const progressBg = this.add.graphics();
      progressBg.fillStyle(0x000000, 0.4);
      progressBg.fillRoundedRect(45, 200, 660, 16, 8);

      const progress = (totalDonations - currentTier.requiredDonations) / (nextTier.requiredDonations - currentTier.requiredDonations);
      const clampedProgress = Math.min(1, Math.max(0, progress));
      const progressFill = this.add.graphics();
      progressFill.fillStyle(0xffb74d, 1);
      progressFill.fillRoundedRect(47, 202, Math.floor(656 * clampedProgress), 12, 6);

      this.add.text(375, 208, `${totalDonations}/${nextTier.requiredDonations} 次捐赠升级`, {
        font: '12px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);
    } else if (currentTier) {
      this.add.text(375, 208, '已达到最高等级！', {
        font: '14px Arial',
        color: '#ffd700'
      }).setOrigin(0.5);
    }
  }

  private addTabButtons(): void {
    const tabY = 235;
    const tabs = [
      { key: 'donate', label: '🧪 捐赠标本' },
      { key: 'tiers', label: '🏆 等级奖励' },
      { key: 'history', label: '📜 捐赠记录' }
    ];
    const tabWidth = 210;
    const spacing = 25;

    tabs.forEach((tab, i) => {
      const x = 70 + i * (tabWidth + spacing);
      const isActive = this.currentTab === tab.key;

      const bg = this.add.graphics();
      bg.fillStyle(isActive ? 0xffb74d : 0x2c3e50, 1);
      bg.fillRoundedRect(x, tabY, tabWidth, 44, 12);

      if (isActive) {
        bg.lineStyle(2, 0xffd700, 1);
        bg.strokeRoundedRect(x, tabY, tabWidth, 44, 12);
      }

      const btn = this.add.text(x + tabWidth / 2, tabY + 22, tab.label, {
        font: isActive ? 'bold 16px Arial' : '16px Arial',
        color: isActive ? '#1a1a2e' : '#eaeaea'
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      btn.on('pointerdown', () => {
        this.currentTab = tab.key as any;
        this.scene.restart();
      });
    });
  }

  private addDonateTab(): void {
    const restored = SaveManager.getRestoredSpecimenIds();
    const donatable: number[] = [];
    const notDonatable: { id: number; reason: string }[] = [];

    restored.forEach(id => {
      const check = SaveManager.canDonateSpecimen(id);
      if (check.canDonate) {
        donatable.push(id);
      } else {
        notDonatable.push({ id, reason: check.reason || '无法捐赠' });
      }
    });

    if (donatable.length === 0) {
      this.add.text(375, 340, '暂无待捐赠的标本', {
        font: 'bold 22px Arial',
        color: '#888888'
      }).setOrigin(0.5);
      this.add.text(375, 380, '通过重复修复关卡可获得重复标本', {
        font: '16px Arial',
        color: '#666666'
      }).setOrigin(0.5);
    } else {
      this.addSpecimenCards(donatable, 300);
    }

    if (notDonatable.length > 0) {
      const startY = 300 + donatable.length * 170 + 30;
      this.add.text(375, startY, '其他标本', {
        font: 'bold 18px Arial',
        color: '#888888'
      }).setOrigin(0.5);
      this.addSpecimenCards(notDonatable.map(x => x.id), startY + 30, true);
    }
  }

  private addSpecimenCards(specimenIds: number[], startY: number, disabled: boolean = false): void {
    const cardWidth = 660;
    const cardHeight = 150;
    const padding = 20;

    specimenIds.forEach((specimenId, index) => {
      const y = startY + index * (cardHeight + padding) + cardHeight / 2;
      this.createSpecimenCard(375, y, cardWidth, cardHeight, specimenId, disabled);
    });
  }

  private createSpecimenCard(
    x: number,
    y: number,
    width: number,
    height: number,
    specimenId: number,
    disabled: boolean
  ): void {
    const specimen = getPlantSpecimen(specimenId);
    const details = this.donationDetails.get(specimenId) || { available: 0, donated: 0 };
    const check = SaveManager.canDonateSpecimen(specimenId);
    const canDonate = check.canDonate;
    const estimatedCoin = canDonate ? DonationManager.calculateResearchCoin(specimenId) : 0;

    const card = this.add.graphics();
    card.fillStyle(disabled || !canDonate ? 0x2c3e50 : 0x34495e, 1);
    card.fillRoundedRect(x - width / 2, y - height / 2, width, height, 12);
    card.lineStyle(2, disabled || !canDonate ? 0x4a5568 : 0x78a083, 1);
    card.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 12);

    const iconX = x - width / 2 + 60;
    const iconBg = this.add.graphics();
    iconBg.fillStyle(0x0f3460, 0.8);
    iconBg.fillRoundedRect(iconX - 40, y - 40, 80, 80, 12);
    this.add.text(iconX, y, this.getSpecimenIcon(specimenId), {
      font: '42px Arial'
    }).setOrigin(0.5);

    this.add.text(x - width / 2 + 120, y - 40, specimen?.name || `标本 #${specimenId}`, {
      font: 'bold 20px Arial',
      color: disabled || !canDonate ? '#888888' : '#ffffff'
    }).setOrigin(0, 0.5);

    this.add.text(x - width / 2 + 120, y - 10, `${specimen?.family || ''} · ${this.getSpecimenRarity(specimenId)}`, {
      font: '14px Arial',
      color: disabled || !canDonate ? '#666666' : '#b0bec5'
    }).setOrigin(0, 0.5);

    this.add.text(x - width / 2 + 120, y + 20, `库存: ${SaveManager.getSpecimenCount(specimenId)}  已捐赠: ${details.donated}`, {
      font: '14px Arial',
      color: disabled || !canDonate ? '#666666' : '#90caf9'
    }).setOrigin(0, 0.5);

    if (!canDonate) {
      this.add.text(x + width / 2 - 20, y - 35, '❌ ' + (check.reason || '不可捐赠'), {
        font: '13px Arial',
        color: '#ef5350'
      }).setOrigin(1, 0.5);
    } else {
      this.add.text(x + width / 2 - 20, y - 35, `预计获得: 💰 ${estimatedCoin} 研究币`, {
        font: 'bold 14px Arial',
        color: '#ffd54f'
      }).setOrigin(1, 0.5);

      const btnX = x + width / 2 - 80;
      const btnBg = this.add.graphics();
      btnBg.fillStyle(0x4caf50, 1);
      btnBg.fillRoundedRect(btnX, y + 5, 140, 40, 10);

      const btn = this.add.text(btnX + 70, y + 25, '📤 捐赠标本', {
        font: 'bold 16px Arial',
        color: '#ffffff'
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      btn.on('pointerover', () => {
        btnBg.clear();
        btnBg.fillStyle(0x45a049, 1);
        btnBg.fillRoundedRect(btnX, y + 5, 140, 40, 10);
      });
      btn.on('pointerout', () => {
        btnBg.clear();
        btnBg.fillStyle(0x4caf50, 1);
        btnBg.fillRoundedRect(btnX, y + 5, 140, 40, 10);
      });
      btn.on('pointerdown', () => this.handleDonate(specimenId));
    }
  }

  private handleDonate(specimenId: number): void {
    const result = SaveManager.donateSpecimen(specimenId);
    this.showDonationResult(result, specimenId);
  }

  private showDonationResult(result: DonationResult, specimenId: number): void {
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, 750, 1334);

    const panel = this.add.graphics();
    panel.fillStyle(0x1a1a2e, 1);
    panel.fillRoundedRect(87.5, 400, 575, 534, 20);
    panel.lineStyle(3, result.success ? 0x4caf50 : 0xef5350, 1);
    panel.strokeRoundedRect(87.5, 400, 575, 534, 20);

    const titleX = 375;
    const titleY = 460;

    this.add.text(titleX, titleY, result.success ? '🎉 捐赠成功' : '❌ 捐赠失败', {
      font: 'bold 32px Arial',
      color: result.success ? '#4caf50' : '#ef5350'
    }).setOrigin(0.5);

    const specimen = getPlantSpecimen(specimenId);
    this.add.text(titleX, titleY + 55, `${this.getSpecimenIcon(specimenId)} ${specimen?.name || `标本 #${specimenId}`}`, {
      font: '22px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    if (result.success) {
      this.add.text(titleX, titleY + 105, `获得研究币: 💰 ${result.researchCoin.toLocaleString()}`, {
        font: 'bold 24px Arial',
        color: '#ffd700'
      }).setOrigin(0.5);

      this.add.text(titleX, titleY + 155, `总捐赠数: ${result.totalDonationsAfter} 次`, {
        font: '18px Arial',
        color: '#90caf9'
      }).setOrigin(0.5);

      if (result.isFirstDonationOfSpecimen) {
        this.add.text(titleX, titleY + 200, '🌟 首次捐赠额外奖励！', {
          font: 'bold 18px Arial',
          color: '#ff9800'
        }).setOrigin(0.5);
      }

      if (result.newTierUnlocked) {
        this.add.text(titleX, titleY + 245, `${result.newTierUnlocked.icon} 解锁等级: ${result.newTierUnlocked.name}`, {
          font: 'bold 22px Arial',
          color: '#e91e63'
        }).setOrigin(0.5);

        this.add.text(titleX, titleY + 285, result.newTierUnlocked.description, {
          font: '15px Arial',
          color: '#b0bec5'
        }).setOrigin(0.5);
      }

      if (result.newRewards && result.newRewards.length > 0) {
        this.add.text(titleX, titleY + 330, '🎁 解锁新奖励！前往等级奖励页领取', {
          font: 'bold 16px Arial',
          color: '#00e676'
        }).setOrigin(0.5);
      }

      if (result.message) {
        this.add.text(titleX, titleY + 380, result.message, {
          font: '14px Arial',
          color: '#b0bec5'
        }).setOrigin(0.5);
      }
    } else {
      this.add.text(titleX, titleY + 105, result.message || '未知错误', {
        font: '18px Arial',
        color: '#ef9a9a'
      }).setOrigin(0.5);
    }

    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x4caf50, 1);
    btnBg.fillRoundedRect(212.5, 860, 325, 55, 12);

    const btn = this.add.text(375, 887.5, '确定', {
      font: 'bold 22px Arial',
      color: '#ffffff'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerdown', () => this.scene.restart());

    overlay.setInteractive();
  }

  private addTiersTab(): void {
    const startY = 310;
    const cardWidth = 660;
    const cardHeight = 200;
    const padding = 20;
    const totalDonations = SaveManager.getTotalDonations();

    DonationTiers.forEach((tier, index) => {
      const y = startY + index * (cardHeight + padding) + cardHeight / 2;
      const isUnlocked = totalDonations >= tier.requiredDonations;
      const isCurrent = !DonationTiers[index + 1] ? isUnlocked : (isUnlocked && totalDonations < DonationTiers[index + 1].requiredDonations);
      this.createTierCard(375, y, cardWidth, cardHeight, tier, isUnlocked, isCurrent);
    });
  }

  private createTierCard(
    x: number,
    y: number,
    width: number,
    height: number,
    tier: DonationTier,
    isUnlocked: boolean,
    isCurrent: boolean
  ): void {
    const card = this.add.graphics();
    const primaryColor = isUnlocked ? tier.primaryColor : 0x3a3a4a;

    const gradientSteps = 10;
    const leftColor = primaryColor;
    const rightColor = isUnlocked ? 0x2c3e50 : 0x333344;
    for (let i = 0; i < gradientSteps; i++) {
      const t = i / gradientSteps;
      const r = Math.floor(((leftColor >> 16) & 0xff) * (1 - t) + ((rightColor >> 16) & 0xff) * t);
      const g = Math.floor(((leftColor >> 8) & 0xff) * (1 - t) + ((rightColor >> 8) & 0xff) * t);
      const b = Math.floor((leftColor & 0xff) * (1 - t) + (rightColor & 0xff) * t);
      const color = (r << 16) | (g << 8) | b;
      card.fillStyle(color, isUnlocked ? 0.9 : 0.5);
      card.fillRect(x - width / 2 + (width * i) / gradientSteps, y - height / 2, width / gradientSteps + 1, height);
    }

    const borderColor = isCurrent ? 0xffd700 : (isUnlocked ? tier.primaryColor : 0x555566);
    card.lineStyle(isCurrent ? 4 : 2, borderColor, 1);
    card.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 16);

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, isUnlocked ? 0.2 : 0.5);
    overlay.fillRoundedRect(x - width / 2, y - height / 2, width, height, 16);

    if (isCurrent) {
      this.add.text(x + width / 2 - 20, y - height / 2 + 25, '⭐ 当前等级', {
        font: 'bold 14px Arial',
        color: '#ffd700'
      }).setOrigin(1, 0.5);
    } else if (!isUnlocked) {
      this.add.text(x + width / 2 - 20, y - height / 2 + 25, `🔒 需${tier.requiredDonations}次捐赠`, {
        font: '14px Arial',
        color: '#888888'
      }).setOrigin(1, 0.5);
    }

    this.add.text(x - width / 2 + 35, y - height / 2 + 55, tier.icon, {
      font: '46px Arial'
    }).setOrigin(0, 0.5);

    this.add.text(x - width / 2 + 100, y - height / 2 + 40, tier.name, {
      font: 'bold 26px Arial',
      color: isUnlocked ? '#ffffff' : '#888888'
    }).setOrigin(0, 0.5);

    this.add.text(x - width / 2 + 100, y - height / 2 + 75, tier.description, {
      font: '14px Arial',
      color: isUnlocked ? 'rgba(255,255,255,0.8)' : '#666666'
    }).setOrigin(0, 0.5);

    const rewardsLabel = tier.rewards && tier.rewards.length > 0 ? '奖励：' : '专属荣誉';
    this.add.text(x - width / 2 + 30, y + 10, rewardsLabel, {
      font: '14px Arial',
      color: isUnlocked ? '#ffd54f' : '#666666'
    }).setOrigin(0, 0);

    if (tier.rewards && tier.rewards.length > 0) {
      tier.rewards.forEach((reward, ri) => {
        const rx = x - width / 2 + 30 + ri * 190;
        const ry = y + 40;
        this.drawRewardBadge(rx, ry, 180, 40, reward, isUnlocked);
      });
    } else {
      this.add.text(x - width / 2 + 30, y + 45, '专属称号与荣誉感', {
        font: '14px Arial',
        color: isUnlocked ? '#b0bec5' : '#666666'
      }).setOrigin(0, 0.5);
    }

    const allClaimed = tier.rewards.every(r => r.id !== undefined && SaveManager.isDonationRewardClaimed(r.id));
    const anyClaimable = tier.rewards.some(r => isUnlocked && r.id !== undefined && !SaveManager.isDonationRewardClaimed(r.id));

    if (anyClaimable) {
      const btnX = x + width / 2 - 120;
      const btnBg = this.add.graphics();
      btnBg.fillStyle(0xff9800, 1);
      btnBg.fillRoundedRect(btnX, y + height / 2 - 55, 100, 40, 10);

      const btn = this.add.text(btnX + 50, y + height / 2 - 35, '🎁 领取', {
        font: 'bold 16px Arial',
        color: '#ffffff'
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      btn.on('pointerover', () => {
        btnBg.clear();
        btnBg.fillStyle(0xf57c00, 1);
        btnBg.fillRoundedRect(btnX, y + height / 2 - 55, 100, 40, 10);
      });
      btn.on('pointerout', () => {
        btnBg.clear();
        btnBg.fillStyle(0xff9800, 1);
        btnBg.fillRoundedRect(btnX, y + height / 2 - 55, 100, 40, 10);
      });
      btn.on('pointerdown', () => {
        tier.rewards.forEach(r => {
          if (r.id !== undefined) {
            SaveManager.claimDonationReward(r.id);
          }
        });
        this.scene.restart();
      });
    } else if (allClaimed && isUnlocked && tier.rewards.length > 0) {
      this.add.text(x + width / 2 - 70, y + height / 2 - 35, '✅ 已领取', {
        font: 'bold 16px Arial',
        color: '#4caf50'
      }).setOrigin(0.5);
    }
  }

  private drawRewardBadge(x: number, y: number, w: number, h: number, reward: DonationReward, enabled: boolean): void {
    const bg = this.add.graphics();
    bg.fillStyle(enabled ? 0x2e7d32 : 0x333344, 0.9);
    bg.fillRoundedRect(x, y - h / 2, w, h, 8);

    let icon = '🎁';
    let label = '';
    switch (reward.type) {
      case 'score':
        icon = '⭐';
        label = `${reward.value} 分数`;
        break;
      case 'badge':
        icon = '🎖️';
        label = '荣誉徽章';
        break;
      case 'research_point':
        icon = '💰';
        label = `${reward.value} 研究币`;
        break;
      case 'fragment':
        icon = '🧩';
        label = `${reward.fragmentId ? getPlantSpecimen(reward.fragmentId)?.name || '碎片' : '碎片'} x${reward.value}`;
        break;
      case 'material':
        icon = '🔧';
        label = `材料 x${reward.value}`;
        break;
    }

    this.add.text(x + 15, y, icon, { font: '20px Arial' }).setOrigin(0, 0.5);
    this.add.text(x + 45, y, label, {
      font: '13px Arial',
      color: enabled ? '#ffffff' : '#666666'
    }).setOrigin(0, 0.5);
  }

  private addHistoryTab(): void {
    const entries = DonationManager.getRecentDonations(100);
    const startY = 310;

    if (entries.length === 0) {
      this.add.text(375, 400, '暂无捐赠记录', {
        font: 'bold 22px Arial',
        color: '#888888'
      }).setOrigin(0.5);
      return;
    }

    const headerBg = this.add.graphics();
    headerBg.fillStyle(0x0f3460, 0.9);
    headerBg.fillRoundedRect(45, startY - 10, 660, 40, 8);

    this.add.text(80, startY + 10, '时间', {
      font: 'bold 14px Arial',
      color: '#b0bec5'
    }).setOrigin(0, 0.5);
    this.add.text(250, startY + 10, '标本', {
      font: 'bold 14px Arial',
      color: '#b0bec5'
    }).setOrigin(0, 0.5);
    this.add.text(430, startY + 10, '星级', {
      font: 'bold 14px Arial',
      color: '#b0bec5'
    }).setOrigin(0, 0.5);
    this.add.text(580, startY + 10, '研究币', {
      font: 'bold 14px Arial',
      color: '#b0bec5'
    }).setOrigin(0, 0.5);

    const rowHeight = 50;
    entries.forEach((entry, i) => {
      const rowY = startY + 30 + i * rowHeight + rowHeight / 2;
      if (rowY > 1200) return;

      const rowBg = this.add.graphics();
      rowBg.fillStyle(i % 2 === 0 ? 0x2c3e50 : 0x34495e, 0.6);
      rowBg.fillRoundedRect(45, startY + 30 + i * rowHeight, 660, rowHeight - 2, 4);

      const specimen = getPlantSpecimen(entry.specimenId);
      const date = new Date(entry.donatedAt);
      const timeStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

      this.add.text(80, rowY, timeStr, {
        font: '13px Arial',
        color: '#90a4ae'
      }).setOrigin(0, 0.5);

      this.add.text(230, rowY, `${this.getSpecimenIcon(entry.specimenId)} ${specimen?.name || `#${entry.specimenId}`}`, {
        font: '14px Arial',
        color: '#ffffff'
      }).setOrigin(0, 0.5);

      const starsStr = '⭐'.repeat(entry.stars) + '☆'.repeat(Math.max(0, 3 - entry.stars));
      this.add.text(410, rowY, starsStr, {
        font: '14px Arial',
        color: '#ffd700'
      }).setOrigin(0, 0.5);

      const coinColor = entry.isFirstDonation ? '#ff9800' : '#ffd54f';
      this.add.text(560, rowY, `💰 ${entry.researchCoin}${entry.isFirstDonation ? ' +' : ''}`, {
        font: 'bold 14px Arial',
        color: coinColor
      }).setOrigin(0, 0.5);
    });

    const stats = DonationManager.getDonationStats();
    const statsY = 1220;
    const statsBg = this.add.graphics();
    statsBg.fillStyle(0x0f3460, 0.9);
    statsBg.fillRoundedRect(45, statsY, 660, 60, 12);

    this.add.text(80, statsY + 30, `📊 累计统计`, {
      font: 'bold 16px Arial',
      color: '#ffb74d'
    }).setOrigin(0, 0.5);

    this.add.text(250, statsY + 30, `总捐赠: ${stats.totalDonations}次`, {
      font: '14px Arial',
      color: '#ffffff'
    }).setOrigin(0, 0.5);

    this.add.text(430, statsY + 30, `累计币: 💰${stats.totalResearchCoin}`, {
      font: '14px Arial',
      color: '#ffd700'
    }).setOrigin(0, 0.5);

    this.add.text(600, statsY + 30, `标本数: ${stats.uniqueSpecimens}种`, {
      font: '14px Arial',
      color: '#4caf50'
    }).setOrigin(0, 0.5);
  }

  private addBackButton(): void {
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x2c3e50, 1);
    btnBg.fillRoundedRect(25, 45, 120, 42, 10);

    const btn = this.add.text(85, 66, '← 返回', {
      font: 'bold 18px Arial',
      color: '#eaeaea'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => {
      btnBg.clear();
      btnBg.fillStyle(0x34495e, 1);
      btnBg.fillRoundedRect(25, 45, 120, 42, 10);
    });
    btn.on('pointerout', () => {
      btnBg.clear();
      btnBg.fillStyle(0x2c3e50, 1);
      btnBg.fillRoundedRect(25, 45, 120, 42, 10);
    });
    btn.on('pointerdown', () => this.scene.start('MainMenuScene'));
  }
}
