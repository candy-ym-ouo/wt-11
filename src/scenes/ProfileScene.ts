import Phaser from 'phaser';
import { SaveManager } from '../utils/SaveManager';
import { AchievementManager } from '../utils/AchievementManager';
import {
  Achievement,
  Title,
  AchievementRarity
} from '../types/GameTypes';
import {
  Achievements,
  Titles,
  getTitleById,
  getTotalAchievementCount,
  getTotalTitleCount,
  RarityColors,
  TitleRarityColors
} from '../data/Achievements';
import { AllGalleryItems, GalleryItems, EventGalleryItems } from '../data/Levels';
import { PlantFamilies } from '../data/PlantFamilies';
import { ExhibitionThemes } from '../data/ExhibitionConfig';
import { Chapters } from '../data/Chapters';

export class ProfileScene extends Phaser.Scene {
  private scrollY = 0;
  private maxScrollY = 0;
  private isDragging = false;
  private dragStartY = 0;
  private contentStartY = 0;
  private contentContainer: Phaser.GameObjects.Container | null = null;
  private fromScene: string = 'ChapterSelectScene';

  constructor() {
    super('ProfileScene');
  }

  init(data: { from?: string }): void {
    this.fromScene = data.from || 'ChapterSelectScene';
  }

  create(): void {
    this.addBackground();
    this.addTitle();
    this.addBackButton();
    this.addHomeButton();
    this.createContent();
    this.setupScrolling();
  }

  private addBackground(): void {
    this.cameras.main.setBackgroundColor('#1a1a2e');
  }

  private addTitle(): void {
    this.add.text(375, 55, '🌱 个人成长', {
      font: 'bold 32px Arial',
      color: '#ffd700'
    }).setOrigin(0.5);
  }

  private addBackButton(): void {
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x0f3460, 0.8);
    btnBg.fillRoundedRect(15, 35, 110, 40, 12);
    btnBg.lineStyle(1, 0x4a90d9, 0.5);
    btnBg.strokeRoundedRect(15, 35, 110, 40, 12);

    const backLabel = this.fromScene === 'ChapterSelectScene' ? '← 日志' : '← 返回';
    const btn = this.add.text(70, 55, backLabel, {
      font: 'bold 18px Arial',
      color: '#ffffff'
    }).setOrigin(0.5).setInteractive();

    btn.on('pointerdown', () => {
      this.scene.start(this.fromScene);
    });

    btn.on('pointerover', () => {
      btn.setColor('#ffd700');
      btnBg.clear();
      btnBg.fillStyle(0x0f3460, 1);
      btnBg.fillRoundedRect(15, 35, 110, 40, 12);
      btnBg.lineStyle(1, 0xffd700, 0.8);
      btnBg.strokeRoundedRect(15, 35, 110, 40, 12);
    });

    btn.on('pointerout', () => {
      btn.setColor('#ffffff');
      btnBg.clear();
      btnBg.fillStyle(0x0f3460, 0.8);
      btnBg.fillRoundedRect(15, 35, 110, 40, 12);
      btnBg.lineStyle(1, 0x4a90d9, 0.5);
      btnBg.strokeRoundedRect(15, 35, 110, 40, 12);
    });
  }

  private addHomeButton(): void {
    const homeBg = this.add.graphics();
    homeBg.fillStyle(0xe94560, 0.9);
    homeBg.fillRoundedRect(630, 35, 100, 40, 12);
    homeBg.setInteractive(
      new Phaser.Geom.Rectangle(630, 35, 100, 40),
      Phaser.Geom.Rectangle.Contains
    );

    this.add.text(680, 55, '🏠 主页', {
      font: 'bold 16px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    homeBg.on('pointerup', () => {
      this.scene.start('ChapterSelectScene');
    });

    homeBg.on('pointerover', () => {
      homeBg.clear();
      homeBg.fillStyle(0xff6b81, 1);
      homeBg.fillRoundedRect(630, 35, 100, 40, 12);
    });

    homeBg.on('pointerout', () => {
      homeBg.clear();
      homeBg.fillStyle(0xe94560, 0.9);
      homeBg.fillRoundedRect(630, 35, 100, 40, 12);
    });
  }

  private createContent(): void {
    this.contentContainer = this.add.container(0, 0);

    let y = 110;

    y = this.addProfileHeader(y);
    y = this.addCoreStats(y);
    y = this.addPlantsSection(y);
    y = this.addSpeedRecordSection(y);
    y = this.addAchievementsSection(y);
    y = this.addCollectionsSection(y);

    this.maxScrollY = Math.max(0, y - 1280);
  }

  private addProfileHeader(y: number): number {
    const cardHeight = 180;

    const bg = this.add.graphics();
    bg.fillStyle(0x16213e, 1);
    bg.fillRoundedRect(25, y, 700, cardHeight, 20);
    bg.lineStyle(2, 0x4a90d9, 0.6);
    bg.strokeRoundedRect(25, y, 700, cardHeight, 20);

    const avatarBg = this.add.graphics();
    avatarBg.fillStyle(0x0f3460, 1);
    avatarBg.fillCircle(110, y + 90, 55);
    avatarBg.lineStyle(3, 0xffd700, 1);
    avatarBg.strokeCircle(110, y + 90, 55);

    this.add.text(110, y + 90, '🌿', {
      font: '48px Arial'
    }).setOrigin(0.5);

    const currentTitleId = SaveManager.getCurrentTitleId();
    const currentTitle = currentTitleId ? getTitleById(currentTitleId) : null;

    if (currentTitle) {
      const titleColor = '#' + TitleRarityColors[currentTitle.rarity].toString(16).padStart(6, '0');
      this.add.text(200, y + 55, `${currentTitle.icon} ${currentTitle.name}`, {
        font: 'bold 22px Arial',
        color: titleColor
      });
    } else {
      this.add.text(200, y + 55, '植物学徒', {
        font: 'bold 22px Arial',
        color: '#ffffff'
      });
    }

    const researcherLevel = SaveManager.getResearcherLevel();
    this.add.text(200, y + 90, `研究员等级 Lv.${researcherLevel}`, {
      font: '16px Arial',
      color: '#90caf9'
    });

    const loginStreak = SaveManager.getLoginStreak();
    const totalLogins = SaveManager.getTotalLogins();
    this.add.text(200, y + 120, `📅 连续登录 ${loginStreak} 天 · 累计 ${totalLogins} 天`, {
      font: '14px Arial',
      color: '#aaaaaa'
    });

    const totalStars = SaveManager.getTotalStars();
    this.add.text(620, y + 60, '⭐', {
      font: '28px Arial'
    }).setOrigin(0.5);
    this.add.text(620, y + 95, totalStars.toString(), {
      font: 'bold 28px Arial',
      color: '#ffd700'
    }).setOrigin(0.5);
    this.add.text(620, y + 130, '总星星', {
      font: '12px Arial',
      color: '#888888'
    }).setOrigin(0.5);

    this.contentContainer!.add([bg, avatarBg]);
    return y + cardHeight + 20;
  }

  private addCoreStats(y: number): number {
    const cardHeight = 130;

    const bg = this.add.graphics();
    bg.fillStyle(0x16213e, 1);
    bg.fillRoundedRect(25, y, 700, cardHeight, 16);

    const stats = this.getCoreStats();
    const colWidth = 700 / stats.length;

    stats.forEach((stat, index) => {
      const cx = 25 + index * colWidth + colWidth / 2;

      this.add.text(cx, y + 35, stat.icon, {
        font: '28px Arial'
      }).setOrigin(0.5);

      this.add.text(cx, y + 70, stat.value, {
        font: 'bold 24px Arial',
        color: stat.color
      }).setOrigin(0.5);

      this.add.text(cx, y + 100, stat.label, {
        font: '13px Arial',
        color: '#888888'
      }).setOrigin(0.5);
    });

    this.contentContainer!.add(bg);
    return y + cardHeight + 20;
  }

  private getCoreStats(): { icon: string; label: string; value: string; color: string }[] {
    const totalScore = SaveManager.getTotalScore();
    const unlockedSpecimens = SaveManager.getUnlockedGalleryItems().length;
    const totalSpecimens = AllGalleryItems.length;
    const completedLevels = Object.values(SaveManager.getAllProgress()).filter(p => p.completed).length;
    const achievementCount = SaveManager.getUnlockedAchievementsCount();
    const totalAchievements = getTotalAchievementCount();

    return [
      { icon: '💰', label: '总分', value: totalScore.toLocaleString(), color: '#ffd700' },
      { icon: '🌺', label: '通关植物', value: `${unlockedSpecimens}/${totalSpecimens}`, color: '#4caf50' },
      { icon: '🎮', label: '完成关卡', value: completedLevels.toString(), color: '#2196f3' },
      { icon: '🏆', label: '成就', value: `${achievementCount}/${totalAchievements}`, color: '#ff9800' }
    ];
  }

  private addPlantsSection(y: number): number {
    const sectionTitleY = y;
    this.add.text(45, sectionTitleY, '🌿 通关植物', {
      font: 'bold 20px Arial',
      color: '#ffffff'
    });

    const unlockedSpecimens = SaveManager.getUnlockedGalleryItems();
    const mainSpecimens = GalleryItems.map(g => g.specimenId);
    const eventSpecimens = EventGalleryItems.map(g => g.specimenId);

    const unlockedMain = unlockedSpecimens.filter(id => mainSpecimens.includes(id)).length;
    const unlockedEvent = unlockedSpecimens.filter(id => eventSpecimens.includes(id)).length;

    const cardHeight = 180;
    const cardY = sectionTitleY + 35;

    const bg = this.add.graphics();
    bg.fillStyle(0x16213e, 1);
    bg.fillRoundedRect(25, cardY, 700, cardHeight, 16);

    this.add.text(55, cardY + 25, `主线植物: ${unlockedMain}/${mainSpecimens.length}`, {
      font: '15px Arial',
      color: '#90caf9'
    });

    this.add.text(400, cardY + 25, `活动限定: ${unlockedEvent}/${eventSpecimens.length}`, {
      font: '15px Arial',
      color: '#ce93d8'
    });

    const totalMain = mainSpecimens.length;
    const totalEvent = eventSpecimens.length;
    const barWidth = 300;
    const barHeight = 14;

    const mainProgress = totalMain > 0 ? unlockedMain / totalMain : 0;
    const mainBarBg = this.add.graphics();
    mainBarBg.fillStyle(0x0f3460, 1);
    mainBarBg.fillRoundedRect(55, cardY + 55, barWidth, barHeight, 7);
    const mainBar = this.add.graphics();
    mainBar.fillStyle(0x4caf50, 1);
    mainBar.fillRoundedRect(55, cardY + 55, Math.max(2, barWidth * mainProgress), barHeight, 7);

    const eventProgress = totalEvent > 0 ? unlockedEvent / totalEvent : 0;
    const eventBarBg = this.add.graphics();
    eventBarBg.fillStyle(0x0f3460, 1);
    eventBarBg.fillRoundedRect(400, cardY + 55, barWidth, barHeight, 7);
    const eventBar = this.add.graphics();
    eventBar.fillStyle(0x9c27b0, 1);
    eventBar.fillRoundedRect(400, cardY + 55, Math.max(2, barWidth * eventProgress), barHeight, 7);

    const previewStartY = cardY + 90;
    const itemSize = 56;
    const itemSpacing = 12;
    const itemsPerRow = 9;
    const maxPreview = itemsPerRow;

    const allGallery = [...GalleryItems, ...EventGalleryItems];
    const sortedItems = allGallery
      .filter(item => unlockedSpecimens.includes(item.specimenId))
      .slice(0, maxPreview);

    sortedItems.forEach((item, index) => {
      const col = index % itemsPerRow;
      const x = 55 + col * (itemSize + itemSpacing) + itemSize / 2;
      const row = Math.floor(index / itemsPerRow);
      const itemY = previewStartY + row * (itemSize + itemSpacing) + itemSize / 2;

      const isEvent = item.isEventExclusive;
      const itemBg = this.add.graphics();
      itemBg.fillStyle(isEvent ? 0x4a148c : 0x1b5e20, 0.8);
      itemBg.fillRoundedRect(x - itemSize / 2, itemY - itemSize / 2, itemSize, itemSize, 10);

      const icon = this.getPlantEmoji(item.specimenId);
      this.add.text(x, itemY, icon, {
        font: '28px Arial'
      }).setOrigin(0.5);
    });

    const totalUnlocked = unlockedSpecimens.length;
    if (totalUnlocked > maxPreview) {
      this.add.text(670, previewStartY + 30, `+${totalUnlocked - maxPreview}`, {
        font: 'bold 16px Arial',
        color: '#888888'
      }).setOrigin(0.5);
    }

    this.contentContainer!.add([bg, mainBarBg, mainBar, eventBarBg, eventBar]);
    return cardY + cardHeight + 20;
  }

  private getPlantEmoji(specimenId: number): string {
    const emojiMap: Record<number, string> = {
      1: '🍂',
      2: '🌹',
      3: '🌻',
      4: '💜',
      5: '🌸',
      6: '🌵',
      101: '🌸',
      102: '🪷',
      103: '🌺',
      104: '🌙',
      105: '❄️'
    };
    return emojiMap[specimenId] || '🌱';
  }

  private addSpeedRecordSection(y: number): number {
    this.add.text(45, y, '⚡ 最快记录', {
      font: 'bold 20px Arial',
      color: '#ffffff'
    });

    const allProgress = SaveManager.getAllProgress();
    const eventProgress = SaveManager.getAllEventProgress();

    const allTimes: { levelId: number; levelName: string; time: number; isEvent: boolean }[] = [];

    Object.entries(allProgress).forEach(([levelId, prog]) => {
      if (prog.bestTime > 0) {
        const level = GalleryItems.find(g => g.id === parseInt(levelId));
        allTimes.push({
          levelId: parseInt(levelId),
          levelName: level?.name || `关卡 ${levelId}`,
          time: prog.bestTime,
          isEvent: false
        });
      }
    });

    Object.entries(eventProgress).forEach(([eventId, ep]) => {
      Object.entries(ep.levelProgress).forEach(([levelId, prog]) => {
        if (prog.bestTime > 0) {
          const level = EventGalleryItems.find(g => g.id === parseInt(levelId));
          allTimes.push({
            levelId: parseInt(levelId),
            levelName: level?.name || `活动关卡 ${levelId}`,
            time: prog.bestTime,
            isEvent: true
          });
        }
      });
    });

    allTimes.sort((a, b) => a.time - b.time);
    const topRecords = allTimes.slice(0, 5);

    const cardHeight = 50 + Math.max(1, topRecords.length) * 60;
    const cardY = y + 35;

    const bg = this.add.graphics();
    bg.fillStyle(0x16213e, 1);
    bg.fillRoundedRect(25, cardY, 700, cardHeight, 16);

    if (topRecords.length === 0) {
      this.add.text(375, cardY + cardHeight / 2, '暂无通关记录，快去挑战吧！', {
        font: '16px Arial',
        color: '#888888'
      }).setOrigin(0.5);
    } else {
      topRecords.forEach((record, index) => {
        const rowY = cardY + 30 + index * 60;

        const rankColors = ['#ffd700', '#c0c0c0', '#cd7f32', '#90caf9', '#90caf9'];
        const rankIcons = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

        this.add.text(70, rowY, rankIcons[index] || `${index + 1}`, {
          font: '24px Arial'
        }).setOrigin(0.5);

        this.add.text(130, rowY - 10, record.levelName, {
          font: 'bold 16px Arial',
          color: '#ffffff'
        });

        if (record.isEvent) {
          this.add.text(130, rowY + 12, '活动限定', {
            font: '11px Arial',
            color: '#ce93d8'
          });
        } else {
          const chapter = Chapters.find(c => c.levelIds.includes(record.levelId));
          if (chapter) {
            this.add.text(130, rowY + 12, chapter.name, {
              font: '11px Arial',
              color: '#888888'
            });
          }
        }

        const timeStr = this.formatTime(record.time);
        this.add.text(660, rowY, timeStr, {
          font: 'bold 22px Arial',
          color: rankColors[index] || '#ffffff'
        }).setOrigin(1, 0.5);

        if (index < topRecords.length - 1) {
          const line = this.add.graphics();
          line.lineStyle(1, 0xffffff, 0.08);
          line.lineBetween(55, rowY + 30, 695, rowY + 30);
          this.contentContainer!.add(line);
        }
      });
    }

    this.contentContainer!.add(bg);
    return cardY + cardHeight + 20;
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    }
    return `${secs}.${ms.toString().padStart(2, '0')}s`;
  }

  private addAchievementsSection(y: number): number {
    this.add.text(45, y, '🏆 成就徽章', {
      font: 'bold 20px Arial',
      color: '#ffffff'
    });

    const unlockedAchievements = AchievementManager.getUnlockedAchievements();
    const totalAchievements = getTotalAchievementCount();
    const unlockedTitles = AchievementManager.getUnlockedTitles();
    const totalTitles = getTotalTitleCount();

    const summaryY = y + 35;
    const summaryBg = this.add.graphics();
    summaryBg.fillStyle(0x16213e, 1);
    summaryBg.fillRoundedRect(25, summaryY, 700, 80, 16);

    this.add.text(140, summaryY + 40, '🎖️ 成就', {
      font: '14px Arial',
      color: '#888888'
    }).setOrigin(0.5);
    this.add.text(140, summaryY + 60, `${unlockedAchievements.length}/${totalAchievements}`, {
      font: 'bold 20px Arial',
      color: '#ffd700'
    }).setOrigin(0.5);

    this.add.text(375, summaryY + 40, '👑 称号', {
      font: '14px Arial',
      color: '#888888'
    }).setOrigin(0.5);
    this.add.text(375, summaryY + 60, `${unlockedTitles.length}/${totalTitles}`, {
      font: 'bold 20px Arial',
      color: '#ff9800'
    }).setOrigin(0.5);

    const achievementScore = SaveManager.getTotalAchievementScore();
    this.add.text(610, summaryY + 40, '💎 成就积分', {
      font: '14px Arial',
      color: '#888888'
    }).setOrigin(0.5);
    this.add.text(610, summaryY + 60, achievementScore.toLocaleString(), {
      font: 'bold 20px Arial',
      color: '#4caf50'
    }).setOrigin(0.5);

    const gridY = summaryY + 100;
    const gridCardHeight = 280;
    const gridBg = this.add.graphics();
    gridBg.fillStyle(0x16213e, 1);
    gridBg.fillRoundedRect(25, gridY, 700, gridCardHeight, 16);

    const allAchievements = AchievementManager.getAllAchievementsWithProgress();
    const sortedAchievements = [...allAchievements].sort((a, b) => {
      if (a.unlocked && !b.unlocked) return -1;
      if (!a.unlocked && b.unlocked) return 1;
      const rarityOrder: Record<AchievementRarity, number> = { legendary: 0, epic: 1, rare: 2, common: 3 };
      return rarityOrder[a.rarity] - rarityOrder[b.rarity];
    });

    const displayAchievements = sortedAchievements.slice(0, 8);
    const itemSize = 72;
    const itemSpacing = 10;
    const itemsPerRow = 7;
    const startX = 45;
    const startY = gridY + 30;

    displayAchievements.forEach((achievement, index) => {
      const col = index % itemsPerRow;
      const row = Math.floor(index / itemsPerRow);
      const x = startX + col * (itemSize + itemSpacing) + itemSize / 2;
      const itemY = startY + row * (itemSize + itemSpacing + 25) + itemSize / 2;

      const color = RarityColors[achievement.rarity];
      const itemBg = this.add.graphics();
      itemBg.fillStyle(achievement.unlocked ? color : 0x333344, achievement.unlocked ? 0.9 : 0.4);
      itemBg.fillRoundedRect(x - itemSize / 2, itemY - itemSize / 2, itemSize, itemSize, 12);

      if (achievement.unlocked) {
        itemBg.lineStyle(2, 0xffffff, 0.6);
        itemBg.strokeRoundedRect(x - itemSize / 2, itemY - itemSize / 2, itemSize, itemSize, 12);
      }

      this.add.text(x, itemY, achievement.unlocked ? achievement.icon : '🔒', {
        font: '32px Arial'
      }).setOrigin(0.5);

      this.add.text(x, itemY + itemSize / 2 + 14, achievement.name, {
        font: '11px Arial',
        color: achievement.unlocked ? '#ffffff' : '#666666'
      }).setOrigin(0.5);
    });

    const totalUnlocked = unlockedAchievements.length;
    const moreCount = allAchievements.length - displayAchievements.length;
    if (moreCount > 0) {
      this.add.text(375, gridY + gridCardHeight - 25, `还有 ${moreCount} 个成就待解锁，点击查看全部 →`, {
        font: '13px Arial',
        color: '#90caf9'
      }).setOrigin(0.5).setInteractive().on('pointerdown', () => {
        this.scene.start('AchievementScene', { from: 'ProfileScene' });
      });
    }

    this.contentContainer!.add([summaryBg, gridBg]);
    return gridY + gridCardHeight + 20;
  }

  private addCollectionsSection(y: number): number {
    this.add.text(45, y, '📚 专题收藏', {
      font: 'bold 20px Arial',
      color: '#ffffff'
    });

    const cardY = y + 35;
    const cardHeight = 220;

    const bg = this.add.graphics();
    bg.fillStyle(0x16213e, 1);
    bg.fillRoundedRect(25, cardY, 700, cardHeight, 16);

    const familyProgress = SaveManager.getAllFamilyProgress();
    let familiesCompleted = 0;
    let totalSpecimensUnlocked = 0;
    let totalSpecimensInFamilies = 0;

    PlantFamilies.forEach(family => {
      totalSpecimensInFamilies += family.specimenIds.length;
      const fp = familyProgress[family.id];
      if (fp) {
        totalSpecimensUnlocked += fp.unlockedSpecimens.length;
        if (fp.completedAt !== undefined) {
          familiesCompleted++;
        }
      }
    });

    this.add.text(60, cardY + 30, '🌳 植物科属', {
      font: 'bold 17px Arial',
      color: '#4caf50'
    });
    this.add.text(60, cardY + 58, `已收集 ${totalSpecimensUnlocked}/${totalSpecimensInFamilies} 种 · 完成 ${familiesCompleted}/${PlantFamilies.length} 个科属`, {
      font: '13px Arial',
      color: '#aaaaaa'
    });

    const familyBarBg = this.add.graphics();
    familyBarBg.fillStyle(0x0f3460, 1);
    familyBarBg.fillRoundedRect(60, cardY + 85, 630, 12, 6);
    const familyProgressRatio = totalSpecimensInFamilies > 0 ? totalSpecimensUnlocked / totalSpecimensInFamilies : 0;
    const familyBar = this.add.graphics();
    familyBar.fillStyle(0x4caf50, 1);
    familyBar.fillRoundedRect(60, cardY + 85, Math.max(2, 630 * familyProgressRatio), 12, 6);

    const exhibitionProgress = SaveManager.getAllExhibitionThemeProgress();
    const exhibitionThemes = ExhibitionThemes;
    let exhibitionsParticipated = 0;
    let exhibitionBadgesUnlocked = 0;

    const allBadges = SaveManager.getAllBadges();
    exhibitionBadgesUnlocked = Object.values(allBadges).filter(v => v).length;

    Object.values(exhibitionProgress).forEach(ep => {
      if (ep.participated) exhibitionsParticipated++;
    });

    this.add.text(60, cardY + 120, '🖼️ 展览主题', {
      font: 'bold 17px Arial',
      color: '#00bcd4'
    });
    this.add.text(60, cardY + 148, `参与 ${exhibitionsParticipated}/${exhibitionThemes.length} 个主题 · 获得 ${exhibitionBadgesUnlocked} 枚展览徽章`, {
      font: '13px Arial',
      color: '#aaaaaa'
    });

    const exhibitionBarBg = this.add.graphics();
    exhibitionBarBg.fillStyle(0x0f3460, 1);
    exhibitionBarBg.fillRoundedRect(60, cardY + 175, 630, 12, 6);
    const exhibitionRatio = exhibitionThemes.length > 0 ? exhibitionsParticipated / exhibitionThemes.length : 0;
    const exhibitionBar = this.add.graphics();
    exhibitionBar.fillStyle(0x00bcd4, 1);
    exhibitionBar.fillRoundedRect(60, cardY + 175, Math.max(2, 630 * exhibitionRatio), 12, 6);

    this.contentContainer!.add([
      bg,
      familyBarBg, familyBar,
      exhibitionBarBg, exhibitionBar
    ]);
    return cardY + cardHeight + 40;
  }

  private setupScrolling(): void {
    const camera = this.cameras.main;

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.y > 100) {
        this.isDragging = true;
        this.dragStartY = pointer.y;
        this.contentStartY = this.scrollY;
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging && this.contentContainer) {
        const delta = this.dragStartY - pointer.y;
        this.scrollY = Phaser.Math.Clamp(this.contentStartY + delta, 0, this.maxScrollY);
        this.contentContainer.y = -this.scrollY;
      }
    });

    this.input.on('pointerup', () => {
      this.isDragging = false;
    });

    this.input.on('pointerupoutside', () => {
      this.isDragging = false;
    });
  }
}
