import Phaser from 'phaser';
import { Chapters, getChapterById, Badges, getChapterTotalStars } from '../data/Chapters';
import { SaveManager } from '../utils/SaveManager';
import { ChapterData, ConservationHealthLevel } from '../types/GameTypes';
import { EventManager } from '../utils/EventManager';
import { getActiveEvent } from '../data/Events';
import { getTotalTowerFloors, getTowerStarsRequired } from '../data/TowerConfig';
import { ExhibitionManager } from '../utils/ExhibitionManager';
import { getAllExhibitionThemes } from '../data/ExhibitionConfig';
import { ConservationManager } from '../utils/ConservationManager';
import { getPlantSpecimen } from '../data/PlantSpecimens';
import { PlantFamilies } from '../data/PlantFamilies';
import { SeasonPassManager } from '../utils/SeasonPassManager';
import { getChapterQuiz, canAttemptQuiz } from '../data/ChapterQuizzes';
import { QuizManager } from '../utils/QuizManager';

export class ChapterSelectScene extends Phaser.Scene {
  constructor() {
    super('ChapterSelectScene');
  }

  create(): void {
    this.addBackground();
    this.addTitle();
    this.addStatsBar();
    this.addEventBanner();
    this.addTowerBanner();
    this.addExhibitionBanner();
    this.addAchievementBanner();
    this.addSeasonPassBanner();
    this.addChapterCards();
    this.addBottomButtons();

    ConservationManager.processDecay();
    this.showEmergencyRemindersIfNeeded();
  }

  private showEmergencyRemindersIfNeeded(): void {
    const reminders = ConservationManager.getReminders();
    const urgentOrHigh = reminders.filter(r => r.priority === 'urgent' || r.priority === 'high');

    if (urgentOrHigh.length === 0) return;

    const displayCount = Math.min(urgentOrHigh.length, 3);
    const container = this.add.container(0, 0);

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, 750, 1334);
    overlay.setInteractive();
    container.add(overlay);

    const modalH = 450 + displayCount * 70;
    const modal = this.add.graphics();
    modal.fillStyle(0x16213e, 1);
    modal.fillRoundedRect(60, 350, 630, modalH, 24);
    modal.lineStyle(3, 0xff1744, 0.9);
    modal.strokeRoundedRect(60, 350, 630, modalH, 24);
    container.add(modal);

    this.add.text(375, 400, '🚨 养护警报', {
      font: 'bold 32px Arial',
      color: '#ff1744'
    }).setOrigin(0.5);

    this.add.text(375, 445, `${urgentOrHigh.length} 个标本状态告急，奖励已衰减！`, {
      font: '17px Arial',
      color: '#ffcc80'
    }).setOrigin(0.5);

    const m = ConservationManager.getGlobalRewardMultiplier();
    const multiplierBg = this.add.graphics();
    multiplierBg.fillStyle(0x550000, 0.7);
    multiplierBg.fillRoundedRect(90, 470, 570, 40, 8);
    container.add(multiplierBg);

    this.add.text(110, 490, `当前全局奖励倍率: 积分×${m.scoreMultiplier.toFixed(1)} 碎片×${m.fragmentMultiplier.toFixed(1)} 研究×${m.researchMultiplier.toFixed(1)}`, {
      font: 'bold 14px Arial',
      color: m.scoreMultiplier < 0.5 ? '#ff1744' : '#ff9800'
    }).setOrigin(0, 0.5);

    let itemY = 540;
    const labelMap: Record<ConservationHealthLevel, { label: string; color: string; bgColor: number }> = {
      thriving: { label: '🌿 生机盎然', color: '#4caf50', bgColor: 0x1b5e20 },
      healthy: { label: '✅ 状态良好', color: '#2196f3', bgColor: 0x0f3460 },
      fair: { label: '⚡ 略有衰退', color: '#ffc107', bgColor: 0x4a3800 },
      declining: { label: '⚠️ 明显退化', color: '#ff9800', bgColor: 0x663300 },
      critical: { label: '🚨 濒危警告', color: '#ff1744', bgColor: 0x550000 }
    };

    for (let i = 0; i < displayCount; i++) {
      const r = urgentOrHigh[i];
      const specimen = getPlantSpecimen(r.specimenId);
      const health = ConservationManager.getHealth(r.specimenId);
      const info = labelMap[r.healthLevel];

      const itemBg = this.add.graphics();
      itemBg.fillStyle(info.bgColor, 0.85);
      itemBg.fillRoundedRect(90, itemY, 570, 60, 10);
      itemBg.lineStyle(1, info.bgColor, 1);
      itemBg.strokeRoundedRect(90, itemY, 570, 60, 10);
      container.add(itemBg);

      const previewKey = `specimen-${r.specimenId}-preview`;
      if (this.textures.exists(previewKey)) {
        const img = this.add.image(120, itemY + 30, previewKey);
        img.setDisplaySize(40, 40);
        if (r.healthLevel === 'critical') img.setAlpha(0.5);
        container.add(img);
      }

      this.add.text(160, itemY + 20, specimen?.name || `标本 #${r.specimenId}`, {
        font: 'bold 16px Arial',
        color: '#ffffff'
      }).setOrigin(0, 0.5);

      this.add.text(160, itemY + 42, info.label, {
        font: '13px Arial',
        color: info.color
      }).setOrigin(0, 0.5);

      const barW = 110;
      const barH = 10;
      const barX = 420;
      const barY = itemY + 25;
      const barBg = this.add.graphics();
      barBg.fillStyle(0x333344, 1);
      barBg.fillRoundedRect(barX, barY, barW, barH, barH / 2);
      container.add(barBg);
      if (health > 0) {
        const healthColors: Record<ConservationHealthLevel, number> = {
          thriving: 0x4caf50, healthy: 0x2196f3, fair: 0xffc107, declining: 0xff9800, critical: 0xff1744
        };
        const barFill = this.add.graphics();
        barFill.fillStyle(healthColors[r.healthLevel], 1);
        barFill.fillRoundedRect(barX, barY, Math.max(4, (barW * health) / 100), barH, barH / 2);
        container.add(barFill);
      }
      this.add.text(545, itemY + 30, `${Math.round(health)}%`, {
        font: 'bold 14px Arial',
        color: info.color
      }).setOrigin(0, 0.5);

      itemBg.setInteractive(new Phaser.Geom.Rectangle(90, itemY, 570, 60), Phaser.Geom.Rectangle.Contains);
      itemBg.on('pointerup', () => {
        container.destroy();
        this.scene.start('ConservationScene');
      });

      itemY += 70;
    }

    const btnY = 350 + modalH - 80;

    const ignoreBtn = this.add.graphics();
    ignoreBtn.fillStyle(0x333344, 1);
    ignoreBtn.fillRoundedRect(100, btnY, 240, 55, 12);
    ignoreBtn.setInteractive(new Phaser.Geom.Rectangle(100, btnY, 240, 55), Phaser.Geom.Rectangle.Contains);
    container.add(ignoreBtn);

    this.add.text(220, btnY + 27, '稍后处理', {
      font: 'bold 17px Arial',
      color: '#cccccc'
    }).setOrigin(0.5);

    const careBtn = this.add.graphics();
    careBtn.fillStyle(0xff1744, 1);
    careBtn.fillRoundedRect(410, btnY, 240, 55, 12);
    careBtn.setInteractive(new Phaser.Geom.Rectangle(410, btnY, 240, 55), Phaser.Geom.Rectangle.Contains);
    container.add(careBtn);

    this.add.text(530, btnY + 27, '🌿 前往养护', {
      font: 'bold 17px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    const close = () => {
      urgentOrHigh.forEach(r => ConservationManager.dismissReminder(r.specimenId));
      container.destroy();
    };

    ignoreBtn.on('pointerup', close);
    overlay.on('pointerup', close);

    careBtn.on('pointerup', () => {
      container.destroy();
      this.scene.start('ConservationScene');
    });
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
    const researcherLevel = SaveManager.getResearcherLevel();
    const researchPoints = SaveManager.getResearchPoints();

    const starIcon = this.add.text(70, 145, '⭐', { font: '24px Arial' }).setOrigin(0, 0.5);
    this.add.text(100, 145, `${totalStars} / ${totalLevels * 3}`, {
      font: 'bold 18px Arial',
      color: '#ffd700'
    }).setOrigin(0, 0.5);

    const trophyIcon = this.add.text(70, 175, '🏆', { font: '24px Arial' }).setOrigin(0, 0.5);
    this.add.text(100, 175, `${SaveManager.getTotalScore().toLocaleString()}`, {
      font: 'bold 18px Arial',
      color: '#ff9800'
    }).setOrigin(0, 0.5);

    const plantIcon = this.add.text(260, 145, '🌿', { font: '24px Arial' }).setOrigin(0, 0.5);
    this.add.text(290, 145, `${completedLevels} / ${totalLevels}`, {
      font: 'bold 18px Arial',
      color: '#4caf50'
    }).setOrigin(0, 0.5);

    const researcherIcon = this.add.text(260, 175, '🎓', { font: '24px Arial' }).setOrigin(0, 0.5);
    this.add.text(290, 175, `Lv.${researcherLevel} 研究员`, {
      font: 'bold 17px Arial',
      color: '#00e5ff'
    }).setOrigin(0, 0.5);

    const labIcon = this.add.text(490, 145, '🔬', { font: '24px Arial' }).setOrigin(0, 0.5);
    this.add.text(520, 145, `研究点`, {
      font: 'bold 16px Arial',
      color: '#aaaaaa'
    }).setOrigin(0, 0.5);
    this.add.text(590, 145, `${researchPoints}`, {
      font: 'bold 20px Arial',
      color: '#ffd700'
    }).setOrigin(1, 0.5);

    const bookIcon = this.add.text(490, 175, '📖', { font: '24px Arial' }).setOrigin(0, 0.5);
    const unlockedK = SaveManager.getTotalKnowledgeUnlocked();
    this.add.text(520, 175, `知识`, {
      font: 'bold 16px Arial',
      color: '#aaaaaa'
    }).setOrigin(0, 0.5);
    this.add.text(590, 175, `${unlockedK}`, {
      font: 'bold 20px Arial',
      color: unlockedK > 0 ? '#81c784' : '#666666'
    }).setOrigin(1, 0.5);
  }

  private addEventBanner(): void {
    const activeEvent = getActiveEvent();
    if (!activeEvent) return;

    const bannerY = 230;
    const bannerH = 90;
    const access = EventManager.canAccessEvent(activeEvent.id);
    const canEnter = access.allowed;
    const eventStatus = EventManager.getEventStatus(activeEvent);

    const banner = this.add.graphics();

    const gradientSteps = 15;
    for (let i = 0; i < gradientSteps; i++) {
      const t = i / gradientSteps;
      const baseColor = canEnter ? activeEvent.primaryColor : 0x555555;
      const baseColor2 = canEnter ? activeEvent.secondaryColor : 0x333333;
      const r = Math.floor(((baseColor >> 16) & 0xff) * (1 - t) + ((baseColor2 >> 16) & 0xff) * t);
      const g = Math.floor(((baseColor >> 8) & 0xff) * (1 - t) + ((baseColor2 >> 8) & 0xff) * t);
      const b = Math.floor((baseColor & 0xff) * (1 - t) + (baseColor2 & 0xff) * t);
      const color = (r << 16) | (g << 8) | b;
      banner.fillStyle(color, canEnter ? 0.95 : 0.6);
      banner.fillRect(45 + (660 * i) / gradientSteps, bannerY - bannerH / 2, 660 / gradientSteps + 1, bannerH);
    }
    banner.fillRoundedRect(45, bannerY - bannerH / 2, 660, bannerH, 16);

    const borderColor = canEnter ? activeEvent.accentColor : 0x666666;
    banner.lineStyle(3, borderColor, 1);
    banner.strokeRoundedRect(45, bannerY - bannerH / 2, 660, bannerH, 16);

    this.add.text(80, bannerY, canEnter ? activeEvent.banner : '🔒', {
      font: '42px Arial'
    }).setOrigin(0, 0.5);

    this.add.text(140, bannerY - 18, `🔥 ${activeEvent.name}`, {
      font: 'bold 22px Arial',
      color: canEnter ? '#ffffff' : '#aaaaaa'
    }).setOrigin(0, 0.5);

    let statusLabel = '';
    let statusColor = '#ffffff';
    if (!canEnter) {
      statusLabel = access.reason;
      statusColor = '#ffcc80';
    } else if (eventStatus === 'active') {
      const time = EventManager.getTimeRemaining(activeEvent.endTime);
      statusLabel = `剩余: ${EventManager.formatCountdown(time)}`;
      statusColor = 'rgba(255,255,255,0.85)';
    } else if (eventStatus === 'not_started') {
      const time = EventManager.getTimeUntilStart(activeEvent.startTime);
      statusLabel = `距开始: ${EventManager.formatCountdown(time)}`;
      statusColor = 'rgba(255,255,255,0.85)';
    } else {
      statusLabel = '活动已结束';
      statusColor = 'rgba(255,255,255,0.6)';
    }

    this.add.text(140, bannerY + 15, statusLabel, {
      font: '14px Arial',
      color: statusColor
    }).setOrigin(0, 0.5);

    if (!canEnter) {
      const lockBg = this.add.graphics();
      lockBg.fillStyle(0x000000, 0.5);
      lockBg.fillRoundedRect(140, bannerY - 38, 200, 22, 6);
      this.add.text(240, bannerY - 27, `进度: ${access.current}/${access.required}`, {
        font: 'bold 12px Arial',
        color: '#ffd54f'
      }).setOrigin(0.5);
    }

    const eventScore = SaveManager.getEventTotalScore(activeEvent.id);
    const btnColor = canEnter ? 0xffffff : 0x888888;

    const goBtn = this.add.graphics();
    goBtn.fillStyle(btnColor, canEnter ? 1 : 0.5);
    goBtn.fillRoundedRect(610, bannerY - 25, 80, 50, 12);

    this.add.text(650, bannerY, canEnter ? '进入 →' : '未解锁', {
      font: 'bold 16px Arial',
      color: canEnter ? '#' + activeEvent.primaryColor.toString(16).padStart(6, '0') : '#555555'
    }).setOrigin(0.5);

    if (eventScore > 0 && canEnter) {
      const scoreBadge = this.add.graphics();
      scoreBadge.fillStyle(0x000000, 0.4);
      scoreBadge.fillRoundedRect(500, bannerY - 25, 100, 22, 6);
      this.add.text(550, bannerY - 14, `🏆 ${eventScore.toLocaleString()}`, {
        font: 'bold 12px Arial',
        color: '#ffd700'
      }).setOrigin(0.5);
    }

    const claimable = SaveManager.getClaimableEventRewards(activeEvent.id);
    if (claimable.length > 0 && canEnter) {
      const badge = this.add.graphics();
      badge.fillStyle(0xffeb3b, 1);
      badge.fillCircle(690, bannerY - 30, 14);
      this.add.text(690, bannerY - 30, claimable.length.toString(), {
        font: 'bold 12px Arial',
        color: '#1a1a2e'
      }).setOrigin(0.5);
    }

    if (canEnter) {
      banner.setInteractive(
        new Phaser.Geom.Rectangle(45, bannerY - bannerH / 2, 660, bannerH),
        Phaser.Geom.Rectangle.Contains
      );
      goBtn.setInteractive(
        new Phaser.Geom.Rectangle(610, bannerY - 25, 80, 50),
        Phaser.Geom.Rectangle.Contains
      );

      const goToEvent = () => {
        if (canEnter) {
          this.scene.start('EventScene');
        }
      };

      banner.on('pointerup', goToEvent);
      goBtn.on('pointerup', goToEvent);

      banner.on('pointerover', () => {
        if (canEnter) {
          banner.lineStyle(3, 0xffffff, 1);
        }
      });
      banner.on('pointerout', () => {
        banner.lineStyle(3, borderColor, 1);
      });
    }
  }

  private addTowerBanner(): void {
    const bannerY = 340;
    const bannerH = 80;
    const totalStars = SaveManager.getTotalStars();
    const requiredStars = getTowerStarsRequired();
    const canEnter = totalStars >= requiredStars;
    const towerSave = SaveManager.getTowerSaveData();
    const completedFloors = towerSave ? Object.values(towerSave.floorProgress).filter(p => p.completed).length : 0;
    const totalFloors = getTotalTowerFloors();

    const banner = this.add.graphics();

    const gradientSteps = 15;
    for (let i = 0; i < gradientSteps; i++) {
      const t = i / gradientSteps;
      const baseColor = canEnter ? 0x9c27b0 : 0x555555;
      const baseColor2 = canEnter ? 0xe94560 : 0x333333;
      const r = Math.floor(((baseColor >> 16) & 0xff) * (1 - t) + ((baseColor2 >> 16) & 0xff) * t);
      const g = Math.floor(((baseColor >> 8) & 0xff) * (1 - t) + ((baseColor2 >> 8) & 0xff) * t);
      const b = Math.floor((baseColor & 0xff) * (1 - t) + (baseColor2 & 0xff) * t);
      const color = (r << 16) | (g << 8) | b;
      banner.fillStyle(color, canEnter ? 0.95 : 0.6);
      banner.fillRect(45 + (660 * i) / gradientSteps, bannerY - bannerH / 2, 660 / gradientSteps + 1, bannerH);
    }
    banner.fillRoundedRect(45, bannerY - bannerH / 2, 660, bannerH, 16);

    const borderColor = canEnter ? 0xffd700 : 0x666666;
    banner.lineStyle(3, borderColor, 1);
    banner.strokeRoundedRect(45, bannerY - bannerH / 2, 660, bannerH, 16);

    this.add.text(80, bannerY, canEnter ? '🏰' : '🔒', {
      font: '38px Arial'
    }).setOrigin(0, 0.5);

    this.add.text(140, bannerY - 15, '困难模式 · 挑战塔', {
      font: 'bold 20px Arial',
      color: canEnter ? '#ffffff' : '#aaaaaa'
    }).setOrigin(0, 0.5);

    const statusText = canEnter
      ? `已通关 ${completedFloors} / ${totalFloors} 层`
      : `需要 ${requiredStars} 颗星星解锁 (当前: ${totalStars})`;
    this.add.text(140, bannerY + 15, statusText, {
      font: '14px Arial',
      color: canEnter ? 'rgba(255,255,255,0.85)' : '#ffcc80'
    }).setOrigin(0, 0.5);

    const goBtn = this.add.graphics();
    goBtn.fillStyle(0xffffff, canEnter ? 1 : 0.5);
    goBtn.fillRoundedRect(610, bannerY - 22, 80, 44, 12);

    this.add.text(650, bannerY, canEnter ? '进入 →' : '未解锁', {
      font: 'bold 15px Arial',
      color: canEnter ? '#9c27b0' : '#555555'
    }).setOrigin(0.5);

    if (towerSave?.totalStars && towerSave.totalStars > 0 && canEnter) {
      const scoreBadge = this.add.graphics();
      scoreBadge.fillStyle(0x000000, 0.4);
      scoreBadge.fillRoundedRect(500, bannerY - 22, 100, 22, 6);
      this.add.text(550, bannerY - 11, `⭐ ${towerSave.totalStars}`, {
        font: 'bold 12px Arial',
        color: '#ffd700'
      }).setOrigin(0.5);
    }

    const claimable = towerSave ? Object.values(towerSave.floorProgress).filter(p => SaveManager.canClaimTowerRewards(p.floorId)).length : 0;
    if (claimable > 0 && canEnter) {
      const badge = this.add.graphics();
      badge.fillStyle(0xffeb3b, 1);
      badge.fillCircle(690, bannerY - 28, 14);
      this.add.text(690, bannerY - 28, claimable.toString(), {
        font: 'bold 12px Arial',
        color: '#1a1a2e'
      }).setOrigin(0.5);
    }

    if (canEnter) {
      banner.setInteractive(
        new Phaser.Geom.Rectangle(45, bannerY - bannerH / 2, 660, bannerH),
        Phaser.Geom.Rectangle.Contains
      );
      goBtn.setInteractive(
        new Phaser.Geom.Rectangle(610, bannerY - 22, 80, 44),
        Phaser.Geom.Rectangle.Contains
      );

      const goToTower = () => {
        if (canEnter) {
          this.scene.start('TowerSelectScene');
        }
      };

      banner.on('pointerup', goToTower);
      goBtn.on('pointerup', goToTower);

      banner.on('pointerover', () => {
        banner.lineStyle(3, 0xffffff, 1);
      });
      banner.on('pointerout', () => {
        banner.lineStyle(3, borderColor, 1);
      });
    }
  }

  private addExhibitionBanner(): void {
    const bannerY = 445;
    const bannerH = 80;
    const totalStars = SaveManager.getTotalStars();
    const allThemes = getAllExhibitionThemes();
    const minRequiredStars = allThemes.length > 0 ? Math.min(...allThemes.map(t => t.requiredStars)) : 0;
    const canEnter = totalStars >= minRequiredStars;
    const exhibitionScore = SaveManager.getTotalExhibitionScore();
    const totalBadges = ExhibitionManager.getTotalBadgesUnlocked();

    let totalClaimable = 0;
    for (const theme of allThemes) {
      if (ExhibitionManager.canAccessTheme(theme.id).allowed) {
        totalClaimable += SaveManager.getClaimableExhibitionRewards(theme.id).length;
      }
    }

    const banner = this.add.graphics();

    const gradientSteps = 15;
    for (let i = 0; i < gradientSteps; i++) {
      const t = i / gradientSteps;
      const baseColor = canEnter ? 0xff9800 : 0x555555;
      const baseColor2 = canEnter ? 0xffc107 : 0x333333;
      const r = Math.floor(((baseColor >> 16) & 0xff) * (1 - t) + ((baseColor2 >> 16) & 0xff) * t);
      const g = Math.floor(((baseColor >> 8) & 0xff) * (1 - t) + ((baseColor2 >> 8) & 0xff) * t);
      const b = Math.floor((baseColor & 0xff) * (1 - t) + (baseColor2 & 0xff) * t);
      const color = (r << 16) | (g << 8) | b;
      banner.fillStyle(color, canEnter ? 0.95 : 0.6);
      banner.fillRect(45 + (660 * i) / gradientSteps, bannerY - bannerH / 2, 660 / gradientSteps + 1, bannerH);
    }
    banner.fillRoundedRect(45, bannerY - bannerH / 2, 660, bannerH, 16);

    const borderColor = canEnter ? 0xffeb3b : 0x666666;
    banner.lineStyle(3, borderColor, 1);
    banner.strokeRoundedRect(45, bannerY - bannerH / 2, 660, bannerH, 16);

    this.add.text(80, bannerY, canEnter ? '🖼️' : '🔒', {
      font: '38px Arial'
    }).setOrigin(0, 0.5);

    this.add.text(140, bannerY - 15, '专题展览 · 植物盛会', {
      font: 'bold 20px Arial',
      color: canEnter ? '#ffffff' : '#aaaaaa'
    }).setOrigin(0, 0.5);

    const statusText = canEnter
      ? `积分 ${exhibitionScore.toLocaleString()} · 徽章 ${totalBadges}`
      : `需要 ${minRequiredStars} 颗星星解锁 (当前: ${totalStars})`;
    this.add.text(140, bannerY + 15, statusText, {
      font: '14px Arial',
      color: canEnter ? 'rgba(255,255,255,0.85)' : '#ffcc80'
    }).setOrigin(0, 0.5);

    const goBtn = this.add.graphics();
    goBtn.fillStyle(0xffffff, canEnter ? 1 : 0.5);
    goBtn.fillRoundedRect(610, bannerY - 22, 80, 44, 12);

    this.add.text(650, bannerY, canEnter ? '进入 →' : '未解锁', {
      font: 'bold 15px Arial',
      color: canEnter ? '#ff9800' : '#555555'
    }).setOrigin(0.5);

    if (exhibitionScore > 0 && canEnter) {
      const scoreBadge = this.add.graphics();
      scoreBadge.fillStyle(0x000000, 0.4);
      scoreBadge.fillRoundedRect(500, bannerY - 22, 100, 22, 6);
      this.add.text(550, bannerY - 11, `🏆 ${exhibitionScore}`, {
        font: 'bold 12px Arial',
        color: '#ffd700'
      }).setOrigin(0.5);
    }

    if (totalClaimable > 0 && canEnter) {
      const badge = this.add.graphics();
      badge.fillStyle(0xffeb3b, 1);
      badge.fillCircle(690, bannerY - 28, 14);
      this.add.text(690, bannerY - 28, totalClaimable.toString(), {
        font: 'bold 12px Arial',
        color: '#1a1a2e'
      }).setOrigin(0.5);
    }

    if (canEnter) {
      banner.setInteractive(
        new Phaser.Geom.Rectangle(45, bannerY - bannerH / 2, 660, bannerH),
        Phaser.Geom.Rectangle.Contains
      );
      goBtn.setInteractive(
        new Phaser.Geom.Rectangle(610, bannerY - 22, 80, 44),
        Phaser.Geom.Rectangle.Contains
      );

      const goToExhibition = () => {
        if (canEnter) {
          this.scene.start('ExhibitionScene');
        }
      };

      banner.on('pointerup', goToExhibition);
      goBtn.on('pointerup', goToExhibition);

      banner.on('pointerover', () => {
        banner.lineStyle(3, 0xffffff, 1);
      });
      banner.on('pointerout', () => {
        banner.lineStyle(3, borderColor, 1);
      });
    }
  }

  private addAchievementBanner(): void {
    const bannerY = 550;
    const bannerH = 80;
    const achievementCount = SaveManager.getUnlockedAchievementsCount();
    const titleCount = SaveManager.getUnlockedTitlesCount();
    const totalScore = SaveManager.getTotalAchievementScore();

    const banner = this.add.graphics();

    const gradientSteps = 15;
    for (let i = 0; i < gradientSteps; i++) {
      const t = i / gradientSteps;
      const baseColor = 0xffd700;
      const baseColor2 = 0xff9800;
      const r = Math.floor(((baseColor >> 16) & 0xff) * (1 - t) + ((baseColor2 >> 16) & 0xff) * t);
      const g = Math.floor(((baseColor >> 8) & 0xff) * (1 - t) + ((baseColor2 >> 8) & 0xff) * t);
      const b = Math.floor((baseColor & 0xff) * (1 - t) + (baseColor2 & 0xff) * t);
      const color = (r << 16) | (g << 8) | b;
      banner.fillStyle(color, 0.95);
      banner.fillRect(45 + (660 * i) / gradientSteps, bannerY - bannerH / 2, 660 / gradientSteps + 1, bannerH);
    }
    banner.fillRoundedRect(45, bannerY - bannerH / 2, 660, bannerH, 16);

    const borderColor = 0xffffff;
    banner.lineStyle(3, borderColor, 0.6);
    banner.strokeRoundedRect(45, bannerY - bannerH / 2, 660, bannerH, 16);

    this.add.text(80, bannerY, '🏆', {
      font: '38px Arial'
    }).setOrigin(0, 0.5);

    this.add.text(140, bannerY - 15, '成就与称号', {
      font: 'bold 20px Arial',
      color: '#1a1a2e'
    }).setOrigin(0, 0.5);

    const statusText = `成就 ${achievementCount} · 称号 ${titleCount} · 积分 ${totalScore.toLocaleString()}`;
    this.add.text(140, bannerY + 15, statusText, {
      font: '14px Arial',
      color: 'rgba(26,26,46,0.85)'
    }).setOrigin(0, 0.5);

    const goBtn = this.add.graphics();
    goBtn.fillStyle(0x1a1a2e, 1);
    goBtn.fillRoundedRect(610, bannerY - 22, 80, 44, 12);

    this.add.text(650, bannerY, '查看 →', {
      font: 'bold 15px Arial',
      color: '#ffd700'
    }).setOrigin(0.5);

    const newAchievements = achievementCount > 0;
    if (newAchievements) {
      const badge = this.add.graphics();
      badge.fillStyle(0xe94560, 1);
      badge.fillCircle(695, bannerY - 28, 14);
      this.add.text(695, bannerY - 28, achievementCount.toString(), {
        font: 'bold 11px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);
    }

    banner.setInteractive(
      new Phaser.Geom.Rectangle(45, bannerY - bannerH / 2, 660, bannerH),
      Phaser.Geom.Rectangle.Contains
    );
    goBtn.setInteractive(
      new Phaser.Geom.Rectangle(610, bannerY - 22, 80, 44),
      Phaser.Geom.Rectangle.Contains
    );

    const goToAchievements = () => {
      this.scene.start('AchievementScene');
    };

    banner.on('pointerup', goToAchievements);
    goBtn.on('pointerup', goToAchievements);

    banner.on('pointerover', () => {
      banner.lineStyle(3, 0xffffff, 1);
    });
    banner.on('pointerout', () => {
      banner.lineStyle(3, borderColor, 0.6);
    });
  }

  private addSeasonPassBanner(): void {
    const bannerY = 655;
    const bannerH = 80;
    const seasonInfo = SeasonPassManager.getSeasonInfo();
    const stats = SeasonPassManager.getTotalStats();
    const trackProgress = SeasonPassManager.getAllTrackProgress();
    const isPremium = SeasonPassManager.isPremium();
    const hasClaimable = SeasonPassManager.hasClaimableRewards();

    const totalProgress = Math.floor(
      ((trackProgress.restore.currentLevel + trackProgress.score.currentLevel + trackProgress.gallery.currentLevel) / 60) * 100
    );

    const banner = this.add.graphics();

    const gradientSteps = 15;
    for (let i = 0; i < gradientSteps; i++) {
      const t = i / gradientSteps;
      const baseColor = isPremium ? 0x9c27b0 : 0x4caf50;
      const baseColor2 = isPremium ? 0xff9800 : 0x2196f3;
      const r = Math.floor(((baseColor >> 16) & 0xff) * (1 - t) + ((baseColor2 >> 16) & 0xff) * t);
      const g = Math.floor(((baseColor >> 8) & 0xff) * (1 - t) + ((baseColor2 >> 8) & 0xff) * t);
      const b = Math.floor((baseColor & 0xff) * (1 - t) + (baseColor2 & 0xff) * t);
      const color = (r << 16) | (g << 8) | b;
      banner.fillStyle(color, 0.95);
      banner.fillRect(45 + (660 * i) / gradientSteps, bannerY - bannerH / 2, 660 / gradientSteps + 1, bannerH);
    }
    banner.fillRoundedRect(45, bannerY - bannerH / 2, 660, bannerH, 16);

    const borderColor = isPremium ? 0xffd700 : 0xffffff;
    banner.lineStyle(3, borderColor, 0.7);
    banner.strokeRoundedRect(45, bannerY - bannerH / 2, 660, bannerH, 16);

    this.add.text(80, bannerY, isPremium ? '👑' : '🎫', {
      font: '38px Arial'
    }).setOrigin(0, 0.5);

    this.add.text(140, bannerY - 15, `${seasonInfo.seasonName} · 赛季通行证`, {
      font: 'bold 20px Arial',
      color: '#ffffff'
    }).setOrigin(0, 0.5);

    const statusText = `进度 ${totalProgress}% · 修复 ${stats.totalRestores}次 · 图鉴 ${stats.totalGalleryUnlocks}种`;
    this.add.text(140, bannerY + 15, statusText, {
      font: '14px Arial',
      color: 'rgba(255,255,255,0.9)'
    }).setOrigin(0, 0.5);

    const goBtn = this.add.graphics();
    goBtn.fillStyle(0xffffff, 1);
    goBtn.fillRoundedRect(610, bannerY - 22, 80, 44, 12);

    const btnColor = isPremium ? '#9c27b0' : '#2e7d32';
    this.add.text(650, bannerY, '查看 →', {
      font: 'bold 15px Arial',
      color: btnColor
    }).setOrigin(0.5);

    if (hasClaimable) {
      const badge = this.add.graphics();
      badge.fillStyle(0xff1744, 1);
      badge.fillCircle(695, bannerY - 28, 14);
      this.add.text(695, bannerY - 28, '!', {
        font: 'bold 14px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);
    }

    banner.setInteractive(
      new Phaser.Geom.Rectangle(45, bannerY - bannerH / 2, 660, bannerH),
      Phaser.Geom.Rectangle.Contains
    );
    goBtn.setInteractive(
      new Phaser.Geom.Rectangle(610, bannerY - 22, 80, 44),
      Phaser.Geom.Rectangle.Contains
    );

    const goToSeasonPass = () => {
      this.scene.start('SeasonPassScene');
    };

    banner.on('pointerup', goToSeasonPass);
    goBtn.on('pointerup', goToSeasonPass);

    banner.on('pointerover', () => {
      banner.lineStyle(3, 0xffffff, 1);
    });
    banner.on('pointerout', () => {
      banner.lineStyle(3, borderColor, 0.7);
    });
  }

  private addChapterCards(): void {
    const startY = 770;
    const cardWidth = 660;
    const cardHeight = 280;
    const padding = 25;

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

    const chapterQuiz = getChapterQuiz(chapter.id);
    const unlockedSpecimens = SaveManager.getUnlockedGalleryItems();
    const canAttemptChapterQuiz = chapterQuiz && canAttemptQuiz(chapterQuiz.quizId, unlockedSpecimens);
    const quizProgress = chapterQuiz ? QuizManager.getQuizProgress(chapterQuiz.quizId) : undefined;
    const quizCompleted = quizProgress?.completed ?? false;

    if (unlocked && chapterQuiz) {
      const quizBtnY = y + height / 2 - 35;
      const quizBtnW = 200;
      const quizBtnH = 50;

      const quizBtn = this.add.graphics();

      const quizBtnColor = canAttemptChapterQuiz
        ? (quizCompleted ? 0x4caf50 : 0xff9800)
        : 0x666666;

      quizBtn.fillStyle(quizBtnColor, 0.95);
      quizBtn.fillRoundedRect(x - width / 2 + 30, quizBtnY - quizBtnH / 2, quizBtnW, quizBtnH, 10);
      quizBtn.lineStyle(2, 0xffffff, 0.3);
      quizBtn.strokeRoundedRect(x - width / 2 + 30, quizBtnY - quizBtnH / 2, quizBtnW, quizBtnH, 10);

      const quizIcon = quizCompleted ? '✅' : '📖';
      const quizLabel = quizCompleted ? '测验已完成' : '百科测验';
      this.add.text(x - width / 2 + 130, quizBtnY, `${quizIcon} ${quizLabel}`, {
        font: 'bold 16px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);

      if (!canAttemptChapterQuiz) {
        const lockedHint = this.add.text(x - width / 2 + 130, quizBtnY + 30, `需解锁: ${QuizManager.getRequiredSpecimenNames(chapterQuiz.quizId).join('、')}`, {
          font: '12px Arial',
          color: '#ffcc80'
        }).setOrigin(0.5);
      }

      if (canAttemptChapterQuiz) {
        quizBtn.setInteractive(
          new Phaser.Geom.Rectangle(x - width / 2 + 30, quizBtnY - quizBtnH / 2, quizBtnW, quizBtnH),
          Phaser.Geom.Rectangle.Contains
        );

        quizBtn.on('pointerover', () => {
          quizBtn.clear();
          quizBtn.fillStyle(this.lighten(quizBtnColor, 20), 0.95);
          quizBtn.fillRoundedRect(x - width / 2 + 30, quizBtnY - quizBtnH / 2, quizBtnW, quizBtnH, 10);
          quizBtn.lineStyle(3, 0xffffff, 0.8);
          quizBtn.strokeRoundedRect(x - width / 2 + 30, quizBtnY - quizBtnH / 2, quizBtnW, quizBtnH, 10);
        });

        quizBtn.on('pointerout', () => {
          quizBtn.clear();
          quizBtn.fillStyle(quizBtnColor, 0.95);
          quizBtn.fillRoundedRect(x - width / 2 + 30, quizBtnY - quizBtnH / 2, quizBtnW, quizBtnH, 10);
          quizBtn.lineStyle(2, 0xffffff, 0.3);
          quizBtn.strokeRoundedRect(x - width / 2 + 30, quizBtnY - quizBtnH / 2, quizBtnW, quizBtnH, 10);
        });

        quizBtn.on('pointerup', (pointer: Phaser.Input.Pointer) => {
          pointer.event.stopPropagation();
          this.scene.start('QuizScene', { quizId: chapterQuiz.quizId });
        });
      }

      const startBtnX = x + width / 2 - 30;
      const startBtnW = 180;
      const startBtnH = 50;

      const startBtn = this.add.graphics();
      startBtn.fillStyle(chapter.primaryColor, 0.95);
      startBtn.fillRoundedRect(startBtnX - startBtnW, quizBtnY - startBtnH / 2, startBtnW, startBtnH, 10);
      startBtn.lineStyle(2, 0xffffff, 0.3);
      startBtn.strokeRoundedRect(startBtnX - startBtnW, quizBtnY - startBtnH / 2, startBtnW, startBtnH, 10);

      this.add.text(startBtnX - startBtnW / 2, quizBtnY, '开始关卡 →', {
        font: 'bold 16px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);

      startBtn.setInteractive(
        new Phaser.Geom.Rectangle(startBtnX - startBtnW, quizBtnY - startBtnH / 2, startBtnW, startBtnH),
        Phaser.Geom.Rectangle.Contains
      );

      startBtn.on('pointerover', () => {
        startBtn.clear();
        startBtn.fillStyle(this.lighten(chapter.primaryColor, 20), 0.95);
        startBtn.fillRoundedRect(startBtnX - startBtnW, quizBtnY - startBtnH / 2, startBtnW, startBtnH, 10);
        startBtn.lineStyle(3, 0xffffff, 0.8);
        startBtn.strokeRoundedRect(startBtnX - startBtnW, quizBtnY - startBtnH / 2, startBtnW, startBtnH, 10);
      });

      startBtn.on('pointerout', () => {
        startBtn.clear();
        startBtn.fillStyle(chapter.primaryColor, 0.95);
        startBtn.fillRoundedRect(startBtnX - startBtnW, quizBtnY - startBtnH / 2, startBtnW, startBtnH, 10);
        startBtn.lineStyle(2, 0xffffff, 0.3);
        startBtn.strokeRoundedRect(startBtnX - startBtnW, quizBtnY - startBtnH / 2, startBtnW, startBtnH, 10);
      });

      startBtn.on('pointerup', (pointer: Phaser.Input.Pointer) => {
        pointer.event.stopPropagation();
        if (canClaimRewards) {
          this.claimRewards(chapter.id);
        } else {
          this.scene.start('LevelSelectScene', { chapterId: chapter.id });
        }
      });
    }

    if (unlocked) {
      card.setInteractive(
        new Phaser.Geom.Rectangle(x - width / 2, y - height / 2, width, height - 70),
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
    const btnW = 83;
    const btnH = 60;
    const spacing = 5;
    const totalW = btnW * 8 + spacing * 7;
    const startX = 375 - totalW / 2 + btnW / 2;

    const labBtn = this.createBottomButton(
      startX,
      btnY,
      btnW,
      btnH,
      '🔬 研究',
      0x9c27b0,
      () => this.scene.start('ResearchLabScene')
    );

    const workshopBtn = this.createBottomButton(
      startX + btnW + spacing,
      btnY,
      btnW,
      btnH,
      '🔧 工坊',
      0xff9800,
      () => this.scene.start('WorkshopScene')
    );

    const conservationBtn = this.createBottomButton(
      startX + 2 * (btnW + spacing),
      btnY,
      btnW,
      btnH,
      '🌿 养护',
      0x2e7d32,
      () => this.scene.start('ConservationScene')
    );

    const galleryBtn = this.createBottomButton(
      startX + 3 * (btnW + spacing),
      btnY,
      btnW,
      btnH,
      '📚 图鉴',
      0x4caf50,
      () => this.scene.start('GalleryScene')
    );

    const seasonBtn = this.createBottomButton(
      startX + 4 * (btnW + spacing),
      btnY,
      btnW,
      btnH,
      '🎫 通行证',
      0x00bcd4,
      () => this.scene.start('SeasonPassScene')
    );

    const familyBtn = this.createBottomButton(
      startX + 5 * (btnW + spacing),
      btnY,
      btnW,
      btnH,
      '🌱 家族',
      0xff5722,
      () => this.scene.start('PlantFamilyScene')
    );

    const levelsBtn = this.createBottomButton(
      startX + 6 * (btnW + spacing),
      btnY,
      btnW,
      btnH,
      '🎮 关卡',
      0x2196f3,
      () => this.scene.start('LevelSelectScene')
    );

    const logBtn = this.createBottomButton(
      startX + 7 * (btnW + spacing),
      btnY,
      btnW,
      btnH,
      '📋 日志',
      0x607d8b,
      () => this.scene.start('RepairLogScene')
    );

    const totalFamilies = SaveManager.getTotalFamiliesCompleted();
    const familyProgress = SaveManager.getAllFamilyProgress();
    const hasClaimableRewards = Object.values(familyProgress).some(fp => {
      const family = PlantFamilies.find(f => f.id === fp.familyId);
      return family?.rewards.some(r => SaveManager.canClaimFamilyReward(fp.familyId, r.id));
    });

    if (hasClaimableRewards) {
      const badge = this.add.graphics();
      badge.fillStyle(0xffeb3b, 1);
      badge.fillCircle(startX + 5 * (btnW + spacing) + btnW / 2 - 15, btnY - btnH / 2 + 10, 12);
      this.add.text(startX + 5 * (btnW + spacing) + btnW / 2 - 15, btnY - btnH / 2 + 10, '!', {
        font: 'bold 12px Arial',
        color: '#1a1a2e'
      }).setOrigin(0.5);
    }

    if (SeasonPassManager.hasClaimableRewards()) {
      const badge = this.add.graphics();
      badge.fillStyle(0xff1744, 1);
      badge.fillCircle(startX + 4 * (btnW + spacing) + btnW / 2 - 10, btnY - btnH / 2 + 10, 12);
      this.add.text(startX + 4 * (btnW + spacing) + btnW / 2 - 10, btnY - btnH / 2 + 10, '!', {
        font: 'bold 12px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);
    }
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
