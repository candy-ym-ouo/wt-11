import Phaser from 'phaser';
import { SaveManager } from '../utils/SaveManager';
import { AchievementManager } from '../utils/AchievementManager';
import {
  Achievement,
  Title,
  AchievementCategory,
  AchievementRarity,
  TitleRarity
} from '../types/GameTypes';
import {
  Achievements,
  Titles,
  AchievementCategoryInfo,
  RarityColors,
  TitleRarityColors,
  getTotalAchievementCount,
  getTotalTitleCount
} from '../data/Achievements';

type TabMode = 'achievements' | 'titles';

export class AchievementScene extends Phaser.Scene {
  private tabMode: TabMode = 'achievements';
  private selectedCategory: AchievementCategory | 'all' = 'all';

  constructor() {
    super('AchievementScene');
  }

  create(): void {
    this.addBackground();
    this.addTitle();
    this.addStatsBar();
    this.addMainTabs();
    
    if (this.tabMode === 'achievements') {
      this.addCategoryTabs();
      this.addAchievementList();
    } else {
      this.addTitleList();
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
    this.add.text(375, 60, '🏆 成就与称号', {
      font: 'bold 36px Arial',
      color: '#ffd700'
    }).setOrigin(0.5);
  }

  private addStatsBar(): void {
    const statsBg = this.add.graphics();
    statsBg.fillStyle(0x0f3460, 0.8);
    statsBg.fillRoundedRect(45, 115, 660, 70, 12);

    const achievementCount = SaveManager.getUnlockedAchievementsCount();
    const totalAchievements = getTotalAchievementCount();
    const titleCount = SaveManager.getUnlockedTitlesCount();
    const totalTitles = getTotalTitleCount();
    const score = SaveManager.getTotalAchievementScore();
    const loginStreak = SaveManager.getLoginStreak();

    const stats = [
      { icon: '🎖️', label: '成就', value: `${achievementCount}/${totalAchievements}`, color: '#ffd700' },
      { icon: '👑', label: '称号', value: `${titleCount}/${totalTitles}`, color: '#ff9800' },
      { icon: '💰', label: '积分', value: score.toLocaleString(), color: '#4caf50' },
      { icon: '📅', label: '连续', value: `${loginStreak}天`, color: '#9c27b0' }
    ];

    const colWidth = 660 / 4;
    stats.forEach((stat, index) => {
      const x = 75 + index * colWidth + colWidth / 2;
      
      this.add.text(x, 135, stat.icon, { font: '20px Arial' }).setOrigin(0.5);
      this.add.text(x, 155, stat.value, {
        font: 'bold 16px Arial',
        color: stat.color
      }).setOrigin(0.5);
      this.add.text(x, 175, stat.label, {
        font: '12px Arial',
        color: '#888888'
      }).setOrigin(0.5);
    });
  }

  private addMainTabs(): void {
    const tabY = 220;
    const tabWidth = 200;
    const tabHeight = 50;
    const spacing = 20;
    const startX = 375 - tabWidth - spacing / 2;

    const achievementTab = this.createMainTab(
      startX + tabWidth / 2,
      tabY,
      tabWidth,
      tabHeight,
      '🎖️ 成就',
      this.tabMode === 'achievements',
      0xffd700,
      () => {
        this.tabMode = 'achievements';
        this.scene.restart();
      }
    );

    const titleTab = this.createMainTab(
      startX + tabWidth + spacing + tabWidth / 2,
      tabY,
      tabWidth,
      tabHeight,
      '👑 称号',
      this.tabMode === 'titles',
      0xff9800,
      () => {
        this.tabMode = 'titles';
        this.scene.restart();
      }
    );
  }

  private createMainTab(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    isSelected: boolean,
    color: number,
    onClick: () => void
  ): void {
    const tab = this.add.graphics();
    tab.fillStyle(isSelected ? color : 0x0f3460, isSelected ? 1 : 0.6);
    tab.fillRoundedRect(x - width / 2, y - height / 2, width, height, 12);

    if (isSelected) {
      tab.lineStyle(2, 0xffffff, 0.5);
      tab.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 12);
    }

    this.add.text(x, y, label, {
      font: 'bold 18px Arial',
      color: isSelected ? '#1a1a2e' : '#aaaaaa'
    }).setOrigin(0.5);

    tab.setInteractive(
      new Phaser.Geom.Rectangle(x - width / 2, y - height / 2, width, height),
      Phaser.Geom.Rectangle.Contains
    );

    tab.on('pointerup', onClick);
  }

  private addCategoryTabs(): void {
    const tabY = 295;
    const categories: (AchievementCategory | 'all')[] = ['all', 'level', 'gallery', 'speed', 'login', 'collection', 'special'];
    const tabWidth = 95;
    const tabHeight = 36;
    const spacing = 5;
    const totalWidth = tabWidth * categories.length + spacing * (categories.length - 1);
    const startX = (750 - totalWidth) / 2 + tabWidth / 2;

    categories.forEach((cat, index) => {
      const x = startX + index * (tabWidth + spacing);
      const isSelected = this.selectedCategory === cat;
      const color = cat === 'all' ? 0x607d8b : AchievementCategoryInfo[cat].color;
      const icon = cat === 'all' ? '📋' : AchievementCategoryInfo[cat].icon;
      const label = cat === 'all' ? '全部' : AchievementCategoryInfo[cat].name;

      this.createCategoryTab(
        x,
        tabY,
        tabWidth,
        tabHeight,
        `${icon} ${label}`,
        isSelected,
        color,
        () => {
          this.selectedCategory = cat;
          this.scene.restart();
        }
      );
    });
  }

  private createCategoryTab(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    isSelected: boolean,
    color: number,
    onClick: () => void
  ): void {
    const tab = this.add.graphics();
    tab.fillStyle(isSelected ? color : 0x0f3460, isSelected ? 1 : 0.5);
    tab.fillRoundedRect(x - width / 2, y - height / 2, width, height, 8);

    if (isSelected) {
      tab.lineStyle(2, 0xffffff, 0.5);
      tab.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 8);
    }

    this.add.text(x, y, label, {
      font: 'bold 12px Arial',
      color: isSelected ? '#ffffff' : '#888888'
    }).setOrigin(0.5);

    tab.setInteractive(
      new Phaser.Geom.Rectangle(x - width / 2, y - height / 2, width, height),
      Phaser.Geom.Rectangle.Contains
    );

    tab.on('pointerup', onClick);
  }

  private addAchievementList(): void {
    let achievements: Achievement[];
    
    if (this.selectedCategory === 'all') {
      achievements = AchievementManager.getAllAchievementsWithProgress();
    } else {
      achievements = Achievements
        .filter(a => a.category === this.selectedCategory)
        .map(a => ({
          ...a,
          unlocked: SaveManager.isAchievementUnlocked(a.id),
          progress: AchievementManager.getAchievementProgress(a.id),
          totalProgress: a.condition.target
        }));
    }

    const startY = 355;
    const itemWidth = 660;
    const itemHeight = 90;
    const padding = 15;

    achievements.forEach((achievement, index) => {
      const y = startY + index * (itemHeight + padding);
      this.createAchievementItem(375, y, itemWidth, itemHeight, achievement);
    });

    if (achievements.length === 0) {
      this.add.text(375, 500, '暂无成就', {
        font: '20px Arial',
        color: '#888888'
      }).setOrigin(0.5);
    }
  }

  private createAchievementItem(
    x: number,
    y: number,
    width: number,
    height: number,
    achievement: Achievement
  ): void {
    const unlocked = achievement.unlocked;
    const rarityColor = RarityColors[achievement.rarity];

    const card = this.add.graphics();
    card.fillStyle(unlocked ? 0x0f3460 : 0x1a1a2e, 1);
    
    const borderColor = unlocked ? rarityColor : 0x333344;
    card.lineStyle(2, borderColor, unlocked ? 1 : 0.5);
    card.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 12);
    card.fillRoundedRect(x - width / 2, y - height / 2, width, height, 12);

    const iconBg = this.add.graphics();
    iconBg.fillStyle(unlocked ? rarityColor : 0x333344, unlocked ? 0.2 : 0.3);
    iconBg.fillCircle(x - width / 2 + 50, y, 32);

    this.add.text(x - width / 2 + 50, y, achievement.icon, {
      font: unlocked ? '32px Arial' : '28px Arial'
    }).setOrigin(0.5).setAlpha(unlocked ? 1 : 0.5);

    this.add.text(x - width / 2 + 100, y - 18, achievement.name, {
      font: 'bold 18px Arial',
      color: unlocked ? '#ffffff' : '#666666'
    }).setOrigin(0, 0.5);

    this.add.text(x - width / 2 + 100, y + 12, achievement.description, {
      font: '13px Arial',
      color: unlocked ? '#aaaaaa' : '#555555'
    }).setOrigin(0, 0.5);

    const rarityLabels: Record<AchievementRarity, string> = {
      common: '普通',
      rare: '稀有',
      epic: '史诗',
      legendary: '传说'
    };

    const rarityBadge = this.add.graphics();
    rarityBadge.fillStyle(rarityColor, unlocked ? 0.8 : 0.3);
    rarityBadge.fillRoundedRect(x + width / 2 - 130, y - 28, 70, 24, 6);
    
    this.add.text(x + width / 2 - 95, y - 16, rarityLabels[achievement.rarity], {
      font: 'bold 12px Arial',
      color: unlocked ? '#ffffff' : '#666666'
    }).setOrigin(0.5);

    if (achievement.rewardScore) {
      this.add.text(x + width / 2 - 20, y - 16, `+${achievement.rewardScore}`, {
        font: 'bold 14px Arial',
        color: unlocked ? '#ffd700' : '#555555'
      }).setOrigin(1, 0.5);
    }

    if (unlocked) {
      this.add.text(x + width / 2 - 20, y + 12, '✓ 已解锁', {
        font: 'bold 13px Arial',
        color: '#4caf50'
      }).setOrigin(1, 0.5);
    } else if (achievement.progress !== undefined && achievement.totalProgress !== undefined && achievement.totalProgress > 1) {
      const progress = Math.min(achievement.progress, achievement.totalProgress);
      const percent = (progress / achievement.totalProgress) * 100;
      
      const progressBg = this.add.graphics();
      progressBg.fillStyle(0x333344, 1);
      progressBg.fillRoundedRect(x + width / 2 - 130, y + 8, 120, 10, 5);
      
      const progressFill = this.add.graphics();
      progressFill.fillStyle(rarityColor, 0.8);
      progressFill.fillRoundedRect(x + width / 2 - 130, y + 8, (120 * percent) / 100, 10, 5);

      this.add.text(x + width / 2 - 20, y + 13, `${Math.floor(progress)}/${achievement.totalProgress}`, {
        font: '11px Arial',
        color: '#888888'
      }).setOrigin(1, 0.5);
    } else {
      this.add.text(x + width / 2 - 20, y + 12, '未解锁', {
        font: '13px Arial',
        color: '#666666'
      }).setOrigin(1, 0.5);
    }
  }

  private addTitleList(): void {
    const titles = AchievementManager.getAllTitlesWithStatus();

    const startY = 320;
    const itemWidth = 320;
    const itemHeight = 180;
    const padding = 20;
    const cols = 2;

    titles.forEach((title, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = 55 + col * (itemWidth + padding) + itemWidth / 2;
      const y = startY + row * (itemHeight + padding) + itemHeight / 2;

      this.createTitleItem(x, y, itemWidth, itemHeight, title);
    });

    if (titles.length === 0) {
      this.add.text(375, 500, '暂无称号', {
        font: '20px Arial',
        color: '#888888'
      }).setOrigin(0.5);
    }
  }

  private createTitleItem(
    x: number,
    y: number,
    width: number,
    height: number,
    title: Title
  ): void {
    const unlocked = title.unlocked;
    const rarityColor = TitleRarityColors[title.rarity];

    const card = this.add.graphics();
    card.fillStyle(unlocked ? 0x0f3460 : 0x1a1a2e, 1);
    
    card.lineStyle(3, rarityColor, unlocked ? 1 : 0.3);
    card.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 16);
    card.fillRoundedRect(x - width / 2, y - height / 2, width, height, 16);

    const iconBg = this.add.graphics();
    iconBg.fillStyle(rarityColor, unlocked ? 0.15 : 0.1);
    iconBg.fillCircle(x, y - 35, 40);

    this.add.text(x, y - 35, title.icon, {
      font: unlocked ? '42px Arial' : '36px Arial'
    }).setOrigin(0.5).setAlpha(unlocked ? 1 : 0.4);

    this.add.text(x, y + 25, title.name, {
      font: 'bold 20px Arial',
      color: unlocked ? '#ffffff' : '#666666'
    }).setOrigin(0.5);

    const rarityLabels: Record<TitleRarity, string> = {
      bronze: '青铜',
      silver: '白银',
      gold: '黄金',
      platinum: '白金'
    };

    const rarityBadge = this.add.graphics();
    rarityBadge.fillStyle(rarityColor, unlocked ? 0.7 : 0.3);
    rarityBadge.fillRoundedRect(x - 35, y + 48, 70, 22, 6);
    
    this.add.text(x, y + 59, rarityLabels[title.rarity], {
      font: 'bold 12px Arial',
      color: unlocked ? '#1a1a2e' : '#666666'
    }).setOrigin(0.5);

    const currentTitleId = SaveManager.getCurrentTitleId();
    const isCurrent = currentTitleId === title.id;

    if (unlocked) {
      const btnY = y + height / 2 - 28;
      const btn = this.add.graphics();
      
      if (isCurrent) {
        btn.fillStyle(0x4caf50, 1);
      } else {
        btn.fillStyle(0x2196f3, 0.8);
      }
      btn.fillRoundedRect(x - 80, btnY, 160, 32, 8);
      btn.setInteractive(
        new Phaser.Geom.Rectangle(x - 80, btnY, 160, 32),
        Phaser.Geom.Rectangle.Contains
      );

      this.add.text(x, btnY + 16, isCurrent ? '✓ 使用中' : '使用称号', {
        font: 'bold 14px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);

      if (!isCurrent) {
        btn.on('pointerup', () => {
          this.equipTitle(title.id);
        });
      }
    } else {
      this.add.text(x, y + height / 2 - 20, '🔒 未解锁', {
        font: '13px Arial',
        color: '#666666'
      }).setOrigin(0.5);
    }

    card.setInteractive(
      new Phaser.Geom.Rectangle(x - width / 2, y - height / 2, width, height),
      Phaser.Geom.Rectangle.Contains
    );

    card.on('pointerup', () => {
      this.showTitleDetail(title);
    });
  }

  private equipTitle(titleId: number): void {
    const success = SaveManager.setCurrentTitle(titleId);
    if (success) {
      this.cameras.main.flash(300, 255, 215, 0);
      this.scene.restart();
    }
  }

  private showTitleDetail(title: Title): void {
    const container = this.add.container(0, 0);

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.75);
    overlay.fillRect(0, 0, 750, 1334);
    overlay.setInteractive();
    container.add(overlay);

    const rarityColor = TitleRarityColors[title.rarity];

    const modal = this.add.graphics();
    modal.fillStyle(0x16213e, 1);
    modal.fillRoundedRect(75, 350, 600, 580, 20);
    modal.lineStyle(3, rarityColor, 0.8);
    modal.strokeRoundedRect(75, 350, 600, 580, 20);
    container.add(modal);

    const iconBg = this.add.graphics();
    iconBg.fillStyle(rarityColor, 0.2);
    iconBg.fillCircle(375, 450, 60);
    container.add(iconBg);

    this.add.text(375, 450, title.icon, {
      font: '64px Arial'
    }).setOrigin(0.5).setAlpha(title.unlocked ? 1 : 0.5);
    container.add(this.children.list[this.children.list.length - 1]);

    this.add.text(375, 540, title.name, {
      font: 'bold 28px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);
    container.add(this.children.list[this.children.list.length - 1]);

    const rarityLabels: Record<TitleRarity, string> = {
      bronze: '青铜称号',
      silver: '白银称号',
      gold: '黄金称号',
      platinum: '白金称号'
    };

    const rarityBadge = this.add.graphics();
    rarityBadge.fillStyle(rarityColor, 0.8);
    rarityBadge.fillRoundedRect(290, 575, 170, 30, 8);
    container.add(rarityBadge);
    
    this.add.text(375, 590, rarityLabels[title.rarity], {
      font: 'bold 14px Arial',
      color: '#1a1a2e'
    }).setOrigin(0.5);
    container.add(this.children.list[this.children.list.length - 1]);

    this.add.text(375, 640, title.description, {
      font: '16px Arial',
      color: '#aaaaaa'
    }).setOrigin(0.5);
    container.add(this.children.list[this.children.list.length - 1]);

    const reqBg = this.add.graphics();
    reqBg.fillStyle(0x0f3460, 0.8);
    reqBg.fillRoundedRect(110, 680, 530, 140, 12);
    container.add(reqBg);

    this.add.text(130, 700, '🎯 解锁条件', {
      font: 'bold 16px Arial',
      color: '#ffd700'
    }).setOrigin(0, 0.5);
    container.add(this.children.list[this.children.list.length - 1]);

    title.requiredAchievementIds.forEach((achId, index) => {
      const ach = Achievements.find(a => a.id === achId);
      const achUnlocked = SaveManager.isAchievementUnlocked(achId);
      
      const reqY = 730 + index * 25;
      
      this.add.text(150, reqY, achUnlocked ? '✓' : '○', {
        font: '14px Arial',
        color: achUnlocked ? '#4caf50' : '#666666'
      }).setOrigin(0, 0.5);
      container.add(this.children.list[this.children.list.length - 1]);

      this.add.text(175, reqY, ach?.name || '', {
        font: '14px Arial',
        color: achUnlocked ? '#ffffff' : '#666666'
      }).setOrigin(0, 0.5);
      container.add(this.children.list[this.children.list.length - 1]);
    });

    const closeBtn = this.add.graphics();
    closeBtn.fillStyle(rarityColor, 1);
    closeBtn.fillRoundedRect(250, 850, 250, 55, 14);
    closeBtn.setInteractive(
      new Phaser.Geom.Rectangle(250, 850, 250, 55),
      Phaser.Geom.Rectangle.Contains
    );
    container.add(closeBtn);

    this.add.text(375, 878, '关闭', {
      font: 'bold 18px Arial',
      color: '#1a1a2e'
    }).setOrigin(0.5);
    container.add(this.children.list[this.children.list.length - 1]);

    const close = () => {
      container.destroy();
    };

    closeBtn.on('pointerup', close);
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

    this.add.text(btnX, btnY, '返回', {
      font: 'bold 26px Arial',
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
      this.scene.start('ChapterSelectScene');
    });
  }

  private lighten(hex: number, amount: number): number {
    const r = Math.min(255, ((hex >> 16) & 0xff) + amount);
    const g = Math.min(255, ((hex >> 8) & 0xff) + amount);
    const b = Math.min(255, (hex & 0xff) + amount);
    return (r << 16) | (g << 8) | b;
  }
}
