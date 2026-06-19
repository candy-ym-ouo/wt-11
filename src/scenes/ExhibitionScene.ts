import Phaser from 'phaser';
import { ExhibitionManager } from '../utils/ExhibitionManager';
import { SaveManager } from '../utils/SaveManager';
import { getAllExhibitionThemes, getBadgeTierColor, getBadgeTierName, getExhibitionBadge } from '../data/ExhibitionConfig';
import { getPlantSpecimen } from '../data/PlantSpecimens';
import { ExhibitionTheme, ExhibitionBadge } from '../types/GameTypes';

export class ExhibitionScene extends Phaser.Scene {
  private selectedThemeId: string | null = null;

  constructor() {
    super('ExhibitionScene');
  }

  create(): void {
    this.addBackground();
    this.addTitle();
    this.addStatsBar();

    if (this.selectedThemeId) {
      this.addThemeDetail(this.selectedThemeId);
    } else {
      this.addThemeCards();
    }

    this.addBackButton();
  }

  private addBackground(): void {
    this.cameras.main.setBackgroundColor('#1a1a2e');
    const bg = this.add.graphics();
    bg.fillStyle(0x16213e, 1);
    bg.fillRoundedRect(25, 100, 700, 1150, 20);
  }

  private addTitle(): void {
    this.add.text(375, 60, '植物考察日志', {
      font: 'bold 38px Arial',
      color: '#e94560'
    }).setOrigin(0.5);

    this.add.text(375, 100, this.selectedThemeId ? '展览详情' : '专题展览', {
      font: '26px Arial',
      color: '#eaeaea'
    }).setOrigin(0.5);
  }

  private addStatsBar(): void {
    const statsBg = this.add.graphics();
    statsBg.fillStyle(0x0f3460, 0.8);
    statsBg.fillRoundedRect(45, 130, 660, 60, 12);

    const totalScore = SaveManager.getTotalExhibitionScore();
    const totalBadges = ExhibitionManager.getTotalBadgesUnlocked();
    const totalBadgesMax = ExhibitionManager.getTotalBadgesCount();
    const participations = SaveManager.getTotalExhibitionParticipations();

    this.add.text(70, 160, '🏆', { font: '22px Arial' }).setOrigin(0, 0.5);
    this.add.text(100, 160, `积分: ${totalScore.toLocaleString()}`, {
      font: 'bold 16px Arial',
      color: '#ffd700'
    }).setOrigin(0, 0.5);

    this.add.text(290, 160, '🎖️', { font: '22px Arial' }).setOrigin(0, 0.5);
    this.add.text(320, 160, `徽章: ${totalBadges}/${totalBadgesMax}`, {
      font: 'bold 16px Arial',
      color: '#4caf50'
    }).setOrigin(0, 0.5);

    this.add.text(500, 160, '🎪', { font: '22px Arial' }).setOrigin(0, 0.5);
    this.add.text(530, 160, `参展: ${participations}次`, {
      font: 'bold 16px Arial',
      color: '#2196f3'
    }).setOrigin(0, 0.5);
  }

  private addThemeCards(): void {
    const themes = getAllExhibitionThemes();
    const startY = 220;
    const cardWidth = 660;
    const cardHeight = 220;
    const padding = 20;

    themes.forEach((theme, index) => {
      const y = startY + index * (cardHeight + padding) + cardHeight / 2;
      this.createThemeCard(375, y, cardWidth, cardHeight, theme);
    });
  }

  private createThemeCard(
    x: number,
    y: number,
    width: number,
    height: number,
    theme: ExhibitionTheme
  ): void {
    const access = ExhibitionManager.canAccessTheme(theme.id);
    const canEnter = access.allowed;
    const info = ExhibitionManager.getExhibitionProgressInfo(theme.id);
    const claimableCount = info.rewards.filter(r => r.claimable).length;

    const card = this.add.graphics();
    const leftColor = canEnter ? theme.primaryColor : 0x333344;
    const rightColor = canEnter ? theme.secondaryColor : 0x3a3a4a;

    const gradientSteps = 10;
    for (let i = 0; i < gradientSteps; i++) {
      const t = i / gradientSteps;
      const r = Math.floor(((leftColor >> 16) & 0xff) * (1 - t) + ((rightColor >> 16) & 0xff) * t);
      const g = Math.floor(((leftColor >> 8) & 0xff) * (1 - t) + ((rightColor >> 8) & 0xff) * t);
      const b = Math.floor((leftColor & 0xff) * (1 - t) + (rightColor & 0xff) * t);
      const color = (r << 16) | (g << 8) | b;
      card.fillStyle(color, canEnter ? 0.9 : 0.5);
      card.fillRect(x - width / 2 + (width * i) / gradientSteps, y - height / 2, width / gradientSteps + 1, height);
    }

    const borderColor = canEnter ? theme.accentColor : 0x555566;
    card.lineStyle(3, borderColor, 1);
    card.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 16);

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, canEnter ? 0.2 : 0.4);
    overlay.fillRoundedRect(x - width / 2, y - height / 2, width, height, 16);

    this.add.text(x - width / 2 + 35, y - height / 2 + 45, theme.icon, {
      font: '42px Arial'
    }).setOrigin(0, 0.5);

    this.add.text(x - width / 2 + 100, y - height / 2 + 35, theme.name, {
      font: 'bold 24px Arial',
      color: canEnter ? '#ffffff' : '#888888'
    }).setOrigin(0, 0.5);

    const typeNames: Record<string, string> = {
      color: '色彩主题',
      family: '科属主题',
      shape: '形态主题',
      season: '季节主题',
      rarity: '稀有度主题'
    };
    this.add.text(x - width / 2 + 100, y - height / 2 + 65, typeNames[theme.type] || '主题展览', {
      font: '14px Arial',
      color: canEnter ? 'rgba(255,255,255,0.7)' : '#666666'
    }).setOrigin(0, 0.5);

    this.add.text(x - width / 2 + 30, y + 5, theme.description, {
      font: '14px Arial',
      color: canEnter ? 'rgba(255,255,255,0.85)' : '#666666',
      wordWrap: { width: width - 170 }
    }).setOrigin(0, 0);

    const progressBarBg = this.add.graphics();
    progressBarBg.fillStyle(0x000000, 0.4);
    progressBarBg.fillRoundedRect(x - width / 2 + 30, y + height / 2 - 55, 300, 24, 6);

    const progressFill = this.add.graphics();
    const fillWidth = info.totalRequired > 0 ? (info.submittedCount / info.totalRequired) * 300 : 0;
    progressFill.fillStyle(theme.accentColor, 0.9);
    progressFill.fillRoundedRect(x - width / 2 + 30, y + height / 2 - 55, fillWidth, 24, 6);

    this.add.text(x - width / 2 + 180, y + height / 2 - 43, `${info.submittedCount}/${info.totalRequired} 标本`, {
      font: 'bold 13px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    const savedTotalScore = info.progress?.totalScore ?? 0;
    const displayScore = savedTotalScore > 0 ? savedTotalScore : info.scores.totalScore;

    const scoreBg = this.add.graphics();
    scoreBg.fillStyle(0x000000, 0.4);
    scoreBg.fillRoundedRect(x - width / 2 + 350, y + height / 2 - 55, 130, 48, 8);

    this.add.text(x - width / 2 + 415, y + height / 2 - 43, `${displayScore}`, {
      font: 'bold 22px Arial',
      color: '#ffd700'
    }).setOrigin(0.5);
    this.add.text(x - width / 2 + 415, y + height / 2 - 22, savedTotalScore > 0 ? '已结算' : '当前积分', {
      font: '11px Arial',
      color: savedTotalScore > 0 ? '#4caf50' : 'rgba(255,255,255,0.7)'
    }).setOrigin(0.5);

    const enterBtn = this.add.graphics();
    enterBtn.fillStyle(0xffffff, canEnter ? 1 : 0.4);
    enterBtn.fillRoundedRect(x + width / 2 - 110, y + height / 2 - 55, 80, 48, 10);

    this.add.text(x + width / 2 - 70, y + height / 2 - 31, canEnter ? '进入 →' : '🔒', {
      font: 'bold 15px Arial',
      color: canEnter ? '#' + theme.primaryColor.toString(16).padStart(6, '0') : '#555555'
    }).setOrigin(0.5);

    if (claimableCount > 0 && canEnter) {
      const badge = this.add.graphics();
      badge.fillStyle(0xffeb3b, 1);
      badge.fillCircle(x + width / 2 - 30, y - height / 2 + 30, 14);
      this.add.text(x + width / 2 - 30, y - height / 2 + 30, claimableCount.toString(), {
        font: 'bold 12px Arial',
        color: '#1a1a2e'
      }).setOrigin(0.5);
    }

    if (!canEnter) {
      const lockText = this.add.graphics();
      lockText.fillStyle(0x000000, 0.6);
      lockText.fillRoundedRect(x - width / 2 + 350, y + 15, 280, 30, 8);
      this.add.text(x - width / 2 + 490, y + 30, `需${theme.requiredStars}⭐ (当前${access.current})`, {
        font: 'bold 13px Arial',
        color: '#ffcc80'
      }).setOrigin(0.5);
    }

    if (canEnter) {
      card.setInteractive(
        new Phaser.Geom.Rectangle(x - width / 2, y - height / 2, width, height),
        Phaser.Geom.Rectangle.Contains
      );
      enterBtn.setInteractive(
        new Phaser.Geom.Rectangle(x + width / 2 - 110, y + height / 2 - 55, 80, 48),
        Phaser.Geom.Rectangle.Contains
      );

      const onClick = () => {
        this.selectedThemeId = theme.id;
        this.scene.restart();
      };

      card.on('pointerup', onClick);
      enterBtn.on('pointerup', onClick);

      card.on('pointerover', () => {
        card.lineStyle(3, 0xffffff, 1);
      });
      card.on('pointerout', () => {
        card.lineStyle(3, borderColor, 1);
      });
    }
  }

  private addThemeDetail(themeId: string): void {
    const info = ExhibitionManager.getExhibitionProgressInfo(themeId);
    if (!info.theme) return;

    const theme = info.theme;

    const headerBg = this.add.graphics();
    const gradientSteps = 10;
    for (let i = 0; i < gradientSteps; i++) {
      const t = i / gradientSteps;
      const r = Math.floor(((theme.primaryColor >> 16) & 0xff) * (1 - t) + ((theme.secondaryColor >> 16) & 0xff) * t);
      const g = Math.floor(((theme.primaryColor >> 8) & 0xff) * (1 - t) + ((theme.secondaryColor >> 8) & 0xff) * t);
      const b = Math.floor((theme.primaryColor & 0xff) * (1 - t) + (theme.secondaryColor & 0xff) * t);
      const color = (r << 16) | (g << 8) | b;
      headerBg.fillStyle(color, 0.95);
      headerBg.fillRect(45 + (660 * i) / gradientSteps, 210, 660 / gradientSteps + 1, 100);
    }
    headerBg.fillRoundedRect(45, 210, 660, 100, 16);
    headerBg.lineStyle(3, theme.accentColor, 1);
    headerBg.strokeRoundedRect(45, 210, 660, 100, 16);

    this.add.text(80, 260, theme.icon, { font: '44px Arial' }).setOrigin(0, 0.5);
    this.add.text(145, 245, theme.name, {
      font: 'bold 26px Arial',
      color: '#ffffff'
    }).setOrigin(0, 0.5);
    this.add.text(145, 275, theme.description, {
      font: '13px Arial',
      color: 'rgba(255,255,255,0.85)',
      wordWrap: { width: 450 }
    }).setOrigin(0, 0.5);

    const displayScores = (info.progress?.totalScore !== undefined && info.progress.totalScore > 0)
      ? {
          completionScore: info.progress.completionScore,
          speedScore: info.progress.speedScore,
          starScore: info.progress.starScore,
          totalScore: info.progress.totalScore
        }
      : info.scores;

    this.addScoreBreakdown(375, 355, displayScores, theme);

    this.addSpecimenList(themeId, info, 560);

    this.addBadgesSection(themeId, info, 900);

    this.addRewardsSection(themeId, info, 1080);

    this.addActionButtons(themeId, info, 1240);
  }

  private addScoreBreakdown(
    x: number,
    y: number,
    scores: { completionScore: number; speedScore: number; starScore: number; totalScore: number },
    theme: ExhibitionTheme
  ): void {
    const width = 660;
    const height = 130;

    const bg = this.add.graphics();
    bg.fillStyle(0x0f3460, 0.9);
    bg.fillRoundedRect(x - width / 2, y - height / 2, width, height, 12);
    bg.lineStyle(2, theme.accentColor, 0.6);
    bg.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 12);

    this.add.text(x, y - height / 2 + 22, '📊 积分明细', {
      font: 'bold 18px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    const items = [
      { label: '完整度', value: scores.completionScore, max: 400, color: 0x4caf50, icon: '📦' },
      { label: '速度', value: scores.speedScore, max: 300, color: 0x2196f3, icon: '⚡' },
      { label: '星级', value: scores.starScore, max: 300, color: 0xffd700, icon: '⭐' }
    ];

    const startX = x - 300;
    const barY = y + 10;
    const barWidth = 180;
    const barHeight = 18;
    const spacing = 30;

    items.forEach((item, index) => {
      const bx = startX + index * (barWidth + spacing);

      this.add.text(bx, barY - 12, `${item.icon} ${item.label}`, {
        font: '13px Arial',
        color: '#aaaaaa'
      }).setOrigin(0, 0.5);

      const barBg = this.add.graphics();
      barBg.fillStyle(0x1a1a2e, 1);
      barBg.fillRoundedRect(bx, barY, barWidth, barHeight, 4);

      const fillWidth = item.max > 0 ? (item.value / item.max) * barWidth : 0;
      const barFill = this.add.graphics();
      barFill.fillStyle(item.color, 0.9);
      barFill.fillRoundedRect(bx, barY, fillWidth, barHeight, 4);

      this.add.text(bx + barWidth / 2, barY + barHeight / 2, `${item.value}/${item.max}`, {
        font: 'bold 11px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);
    });

    const totalBg = this.add.graphics();
    totalBg.fillStyle(theme.accentColor, 0.25);
    totalBg.fillRoundedRect(x + 200, y - 25, 95, 75, 10);
    totalBg.lineStyle(2, theme.accentColor, 0.6);
    totalBg.strokeRoundedRect(x + 200, y - 25, 95, 75, 10);

    this.add.text(x + 247, y - 5, scores.totalScore.toString(), {
      font: 'bold 28px Arial',
      color: '#ffd700'
    }).setOrigin(0.5);
    this.add.text(x + 247, y + 25, '总积分', {
      font: '12px Arial',
      color: 'rgba(255,255,255,0.7)'
    }).setOrigin(0.5);
  }

  private addSpecimenList(themeId: string, info: any, startY: number): void {
    if (!info.theme) return;

    const sectionBg = this.add.graphics();
    sectionBg.fillStyle(0x0f3460, 0.6);
    sectionBg.fillRoundedRect(45, startY - 10, 660, 310, 12);

    this.add.text(75, startY + 20, '🖼️ 参展标本', {
      font: 'bold 20px Arial',
      color: '#ffffff'
    }).setOrigin(0, 0.5);

    const specimenIds = info.theme.requiredSpecimenIds;
    const itemWidth = 200;
    const itemHeight = 120;
    const padding = 15;
    const cols = 3;
    const baseY = startY + 90;

    specimenIds.forEach((specimenId: number, index: number) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = 75 + col * (itemWidth + padding) + itemWidth / 2;
      const y = baseY + row * (itemHeight + padding);

      this.createSpecimenSlot(x, y, itemWidth, itemHeight, themeId, specimenId);
    });
  }

  private createSpecimenSlot(
    x: number,
    y: number,
    width: number,
    height: number,
    themeId: string,
    specimenId: number
  ): void {
    const specimen = getPlantSpecimen(specimenId);
    const isRestored = SaveManager.isSpecimenRestored(specimenId);
    const isSubmitted = SaveManager.isSpecimenSubmitted(themeId, specimenId);
    const submission = SaveManager.getExhibitionSpecimenSubmission(themeId, specimenId);
    const canSubmit = SaveManager.canSubmitToExhibition(themeId, specimenId);
    const isGalleryUnlocked = SaveManager.isGalleryUnlocked(specimenId);

    const card = this.add.graphics();

    let bgColor = 0x333344;
    let borderColor = 0x555566;

    if (isSubmitted) {
      bgColor = 0x2e7d32;
      borderColor = 0x4caf50;
    } else if (canSubmit) {
      bgColor = 0x1565c0;
      borderColor = 0x2196f3;
    } else if (isGalleryUnlocked) {
      bgColor = 0x5d4037;
      borderColor = 0x795548;
    }

    card.fillStyle(bgColor, 0.7);
    card.fillRoundedRect(x - width / 2, y - height / 2, width, height, 10);
    card.lineStyle(2, borderColor, 1);
    card.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 10);

    if (isRestored || isSubmitted) {
      const previewKey = `specimen-${specimenId}-preview`;
      const img = this.add.image(x, y - 20, previewKey);
      img.setDisplaySize(60, 60);
    } else if (isGalleryUnlocked) {
      const previewKey = `specimen-${specimenId}-preview`;
      const img = this.add.image(x, y - 20, previewKey);
      img.setDisplaySize(60, 60);
      img.setAlpha(0.5);
    } else {
      this.add.text(x, y - 20, '🔒', { font: '32px Arial' }).setOrigin(0.5);
    }

    this.add.text(x, y + 30, specimen?.name || '???', {
      font: 'bold 14px Arial',
      color: (isRestored || isSubmitted || isGalleryUnlocked) ? '#ffffff' : '#888888'
    }).setOrigin(0.5);

    let statusText = '';
    let statusColor = '';

    if (isSubmitted && submission) {
      const stars = '⭐'.repeat(submission.stars) + '☆'.repeat(3 - submission.stars);
      statusText = stars;
      statusColor = '#ffd700';
    } else if (canSubmit) {
      statusText = '点击提交';
      statusColor = '#64b5f6';
    } else if (isGalleryUnlocked && !isRestored) {
      statusText = '需在工坊修复';
      statusColor = '#ffcc80';
    } else {
      statusText = '未解锁';
      statusColor = '#ff8a80';
    }

    this.add.text(x, y + 50, statusText, {
      font: '12px Arial',
      color: statusColor
    }).setOrigin(0.5);

    if (canSubmit) {
      card.setInteractive(
        new Phaser.Geom.Rectangle(x - width / 2, y - height / 2, width, height),
        Phaser.Geom.Rectangle.Contains
      );

      card.on('pointerup', () => {
        const result = SaveManager.submitSpecimenToExhibition(themeId, specimenId);
        if (result.success) {
          ExhibitionManager.finalizeExhibition(themeId);
          this.scene.restart();
        }
      });

      card.on('pointerover', () => {
        card.lineStyle(3, 0xffffff, 1);
      });
      card.on('pointerout', () => {
        card.lineStyle(2, borderColor, 1);
      });
    }
  }

  private addBadgesSection(themeId: string, info: any, y: number): void {
    this.add.text(75, y, '🎖️ 展览徽章', {
      font: 'bold 20px Arial',
      color: '#ffffff'
    }).setOrigin(0, 0.5);

    const badges = info.badges as { badge: ExhibitionBadge; unlocked: boolean }[];
    const badgeWidth = 145;
    const badgeHeight = 80;
    const padding = 10;

    badges.forEach((item, index) => {
      const x = 75 + index * (badgeWidth + padding) + badgeWidth / 2;
      const by = y + 60;

      const tierColor = getBadgeTierColor(item.badge.tier);

      const bg = this.add.graphics();
      bg.fillStyle(item.unlocked ? tierColor : 0x333344, item.unlocked ? 0.85 : 0.5);
      bg.fillRoundedRect(x - badgeWidth / 2, by - badgeHeight / 2, badgeWidth, badgeHeight, 10);
      bg.lineStyle(2, item.unlocked ? tierColor : 0x555566, item.unlocked ? 1 : 0.5);
      bg.strokeRoundedRect(x - badgeWidth / 2, by - badgeHeight / 2, badgeWidth, badgeHeight, 10);

      this.add.text(x, by - 15, item.unlocked ? item.badge.icon : '🔒', {
        font: '28px Arial'
      }).setOrigin(0.5);

      this.add.text(x, by + 15, item.badge.name, {
        font: 'bold 12px Arial',
        color: item.unlocked ? '#ffffff' : '#888888'
      }).setOrigin(0.5);

      this.add.text(x, by + 32, `${getBadgeTierName(item.badge.tier)}·${item.badge.requiredScore}分`, {
        font: '10px Arial',
        color: item.unlocked ? 'rgba(255,255,255,0.8)' : '#666666'
      }).setOrigin(0.5);
    });
  }

  private addRewardsSection(themeId: string, info: any, y: number): void {
    this.add.text(75, y, '🎁 展览奖励', {
      font: 'bold 20px Arial',
      color: '#ffffff'
    }).setOrigin(0, 0.5);

    const rewards = info.rewards as { reward: any; claimable: boolean; claimed: boolean }[];

    rewards.forEach((item, index) => {
      const ry = y + 45 + index * 55;
      const width = 660;

      const bg = this.add.graphics();
      let bgColor = 0x0f3460;
      if (item.claimed) bgColor = 0x2a2a3a;
      else if (item.claimable) bgColor = 0x1b5e20;

      bg.fillStyle(bgColor, 0.8);
      bg.fillRoundedRect(45, ry - 22, width, 44, 8);

      if (item.claimable && !item.claimed) {
        bg.lineStyle(2, 0xffd700, 0.8);
        bg.strokeRoundedRect(45, ry - 22, width, 44, 8);
      }

      this.add.text(75, ry, item.reward.icon, { font: '24px Arial' }).setOrigin(0, 0.5);

      this.add.text(115, ry - 8, item.reward.name, {
        font: 'bold 14px Arial',
        color: item.claimed ? '#666666' : '#ffffff'
      }).setOrigin(0, 0.5);

      this.add.text(115, ry + 8, item.reward.description, {
        font: '11px Arial',
        color: item.claimed ? '#444444' : '#aaaaaa'
      }).setOrigin(0, 0.5);

      const thresholdX = 520;
      this.add.text(thresholdX, ry, `${item.reward.threshold}分`, {
        font: 'bold 14px Arial',
        color: item.claimed ? '#444444' : '#ffd700'
      }).setOrigin(0, 0.5);

      if (item.claimed) {
        this.add.text(640, ry, '✓ 已领取', {
          font: 'bold 12px Arial',
          color: '#4caf50'
        }).setOrigin(1, 0.5);
      } else if (item.claimable) {
        const claimBtn = this.add.graphics();
        claimBtn.fillStyle(0xffd700, 1);
        claimBtn.fillRoundedRect(600, ry - 16, 90, 32, 6);

        this.add.text(645, ry, '领取', {
          font: 'bold 13px Arial',
          color: '#1a1a2e'
        }).setOrigin(0.5);

        claimBtn.setInteractive(
          new Phaser.Geom.Rectangle(600, ry - 16, 90, 32),
          Phaser.Geom.Rectangle.Contains
        );

        claimBtn.on('pointerup', () => {
          SaveManager.claimExhibitionReward(themeId, item.reward.id);
          this.scene.restart();
        });
      } else {
        this.add.text(640, ry, '未达成', {
          font: '12px Arial',
          color: '#666666'
        }).setOrigin(1, 0.5);
      }
    });
  }

  private addActionButtons(themeId: string, info: any, y: number): void {
    const eligibleCount = info.eligibleSpecimens.length;
    const needRestoreCount = info.needRestoreSpecimens?.length || 0;

    if (needRestoreCount > 0) {
      const hintText = this.add.graphics();
      hintText.fillStyle(0x795548, 0.3);
      hintText.fillRoundedRect(45, y - 70, 660, 32, 8);
      this.add.text(375, y - 54, `⚠️ 还有 ${needRestoreCount} 个标本需在工坊修复后方可参展`, {
        font: 'bold 14px Arial',
        color: '#ffcc80'
      }).setOrigin(0.5);
    }

    if (eligibleCount > 0) {
      const submitBtn = this.add.graphics();
      submitBtn.fillStyle(0x2196f3, 1);
      submitBtn.fillRoundedRect(45, y - 30, 310, 60, 12);

      this.add.text(200, y, `📤 一键提交全部 (${eligibleCount})`, {
        font: 'bold 17px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);

      submitBtn.setInteractive(
        new Phaser.Geom.Rectangle(45, y - 30, 310, 60),
        Phaser.Geom.Rectangle.Contains
      );

      submitBtn.on('pointerup', () => {
        ExhibitionManager.submitAllEligibleSpecimens(themeId);
        ExhibitionManager.finalizeExhibition(themeId);
        this.scene.restart();
      });

      submitBtn.on('pointerover', () => {
        submitBtn.clear();
        submitBtn.fillStyle(0x42a5f5, 1);
        submitBtn.fillRoundedRect(45, y - 30, 310, 60, 12);
      });
      submitBtn.on('pointerout', () => {
        submitBtn.clear();
        submitBtn.fillStyle(0x2196f3, 1);
        submitBtn.fillRoundedRect(45, y - 30, 310, 60, 12);
      });
    }

    const finalizeBtn = this.add.graphics();
    const finalizeX = eligibleCount > 0 ? 395 : 45;
    const finalizeW = eligibleCount > 0 ? 310 : 660;

    finalizeBtn.fillStyle(0xff9800, 1);
    finalizeBtn.fillRoundedRect(finalizeX, y - 30, finalizeW, 60, 12);

    this.add.text(finalizeX + finalizeW / 2, y, '🏅 结算成绩', {
      font: 'bold 17px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    finalizeBtn.setInteractive(
      new Phaser.Geom.Rectangle(finalizeX, y - 30, finalizeW, 60),
      Phaser.Geom.Rectangle.Contains
    );

    finalizeBtn.on('pointerup', () => {
      const result = ExhibitionManager.finalizeExhibition(themeId);
      this.showResultModal(result);
    });

    finalizeBtn.on('pointerover', () => {
      finalizeBtn.clear();
      finalizeBtn.fillStyle(0xffb74d, 1);
      finalizeBtn.fillRoundedRect(finalizeX, y - 30, finalizeW, 60, 12);
    });
    finalizeBtn.on('pointerout', () => {
      finalizeBtn.clear();
      finalizeBtn.fillStyle(0xff9800, 1);
      finalizeBtn.fillRoundedRect(finalizeX, y - 30, finalizeW, 60, 12);
    });
  }

  private showResultModal(result: any): void {
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.85);
    overlay.fillRect(0, 0, 750, 1334);
    overlay.setInteractive();

    const modal = this.add.graphics();
    modal.fillStyle(0x16213e, 1);
    modal.fillRoundedRect(60, 300, 630, 680, 24);
    modal.lineStyle(4, 0xff9800, 1);
    modal.strokeRoundedRect(60, 300, 630, 680, 24);

    this.add.text(375, 360, result.isFirstParticipation ? '🎉 首次参展！' : '📊 展览结算', {
      font: 'bold 30px Arial',
      color: result.isFirstParticipation ? '#4caf50' : '#ff9800'
    }).setOrigin(0.5);

    if (result.isNewHighScore) {
      this.add.text(375, 395, '✨ 新纪录！', {
        font: 'bold 18px Arial',
        color: '#ffd700'
      }).setOrigin(0.5);
    }

    const scoreBg = this.add.graphics();
    scoreBg.fillStyle(0x0f3460, 0.9);
    scoreBg.fillRoundedRect(130, 430, 490, 100, 16);
    scoreBg.lineStyle(2, 0xffd700, 0.5);
    scoreBg.strokeRoundedRect(130, 430, 490, 100, 16);

    this.add.text(375, 470, result.totalScore.toString(), {
      font: 'bold 48px Arial',
      color: '#ffd700'
    }).setOrigin(0.5);
    this.add.text(375, 505, '总展览积分', {
      font: '15px Arial',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    const breakdown = [
      { label: '完整度', value: result.completionScore, color: '#4caf50' },
      { label: '速度', value: result.speedScore, color: '#2196f3' },
      { label: '星级', value: result.starScore, color: '#ffd700' }
    ];

    breakdown.forEach((item, index) => {
      const bx = 130 + index * 165;
      const itemBg = this.add.graphics();
      itemBg.fillStyle(0x0f3460, 0.7);
      itemBg.fillRoundedRect(bx, 555, 150, 55, 10);

      this.add.text(bx + 75, 575, item.label, {
        font: '13px Arial',
        color: '#888888'
      }).setOrigin(0.5);
      this.add.text(bx + 75, 595, item.value.toString(), {
        font: 'bold 20px Arial',
        color: item.color
      }).setOrigin(0.5);
    });

    let contentY = 650;

    if (result.newlyUnlockedBadges && result.newlyUnlockedBadges.length > 0) {
      this.add.text(375, contentY, '🎖️ 新解锁徽章', {
        font: 'bold 18px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);
      contentY += 30;

      result.newlyUnlockedBadges.forEach((badge: ExhibitionBadge) => {
        const tierColor = getBadgeTierColor(badge.tier);
        const badgeBg = this.add.graphics();
        badgeBg.fillStyle(tierColor, 0.25);
        badgeBg.fillRoundedRect(160, contentY, 430, 50, 10);
        badgeBg.lineStyle(2, tierColor, 0.8);
        badgeBg.strokeRoundedRect(160, contentY, 430, 50, 10);

        this.add.text(195, contentY + 25, badge.icon, { font: '26px Arial' }).setOrigin(0, 0.5);
        this.add.text(240, contentY + 15, badge.name, {
          font: 'bold 16px Arial',
          color: '#ffffff'
        }).setOrigin(0, 0.5);
        this.add.text(240, contentY + 35, badge.description, {
          font: '12px Arial',
          color: '#aaaaaa'
        }).setOrigin(0, 0.5);

        contentY += 65;
      });
    }

    if (result.newRewards && result.newRewards.length > 0) {
      this.add.text(375, contentY, '🎁 可领取奖励', {
        font: 'bold 18px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);
      contentY += 30;

      result.newRewards.slice(0, 2).forEach((reward: any) => {
        const rewardBg = this.add.graphics();
        rewardBg.fillStyle(0x0f3460, 0.8);
        rewardBg.fillRoundedRect(160, contentY, 430, 40, 8);

        this.add.text(195, contentY + 20, reward.icon, { font: '22px Arial' }).setOrigin(0, 0.5);
        this.add.text(240, contentY + 20, reward.name, {
          font: 'bold 14px Arial',
          color: '#ffd700'
        }).setOrigin(0, 0.5);
        this.add.text(565, contentY + 20, '点击领取 →', {
          font: '12px Arial',
          color: '#64b5f6'
        }).setOrigin(1, 0.5);

        contentY += 50;
      });
    }

    const confirmBtn = this.add.graphics();
    confirmBtn.fillStyle(0xe94560, 1);
    confirmBtn.fillRoundedRect(225, 900, 300, 60, 16);
    confirmBtn.setInteractive(
      new Phaser.Geom.Rectangle(225, 900, 300, 60),
      Phaser.Geom.Rectangle.Contains
    );

    this.add.text(375, 930, '继续', {
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

  private addBackButton(): void {
    const btnX = 375;
    const btnY = 1250;

    const btn = this.add.graphics();
    btn.fillStyle(0xe94560, 1);
    btn.fillRoundedRect(btnX - 150, btnY - 35, 300, 70, 15);
    btn.setInteractive(
      new Phaser.Geom.Rectangle(btnX - 150, btnY - 35, 300, 70),
      Phaser.Geom.Rectangle.Contains
    );

    const label = this.selectedThemeId ? '← 返回展览列表' : '返回';
    this.add.text(btnX, btnY, label, {
      font: 'bold 24px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    btn.on('pointerover', () => {
      btn.clear();
      btn.fillStyle(0xff6b8a, 1);
      btn.fillRoundedRect(btnX - 150, btnY - 35, 300, 70, 15);
    });

    btn.on('pointerout', () => {
      btn.clear();
      btn.fillStyle(0xe94560, 1);
      btn.fillRoundedRect(btnX - 150, btnY - 35, 300, 70, 15);
    });

    btn.on('pointerup', () => {
      if (this.selectedThemeId) {
        this.selectedThemeId = null;
        this.scene.restart();
      } else {
        this.scene.start('ChapterSelectScene');
      }
    });
  }
}
