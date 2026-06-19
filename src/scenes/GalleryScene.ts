import Phaser from 'phaser';
import { AllGalleryItems, EventGalleryItems } from '../data/Levels';
import { SaveManager } from '../utils/SaveManager';
import { GalleryItem } from '../types/GameTypes';
import { Chapters, getChapterById } from '../data/Chapters';
import { getActiveEvent } from '../data/Events';

type FilterMode = 'all' | 'chapter' | 'event';

export class GalleryScene extends Phaser.Scene {
  private selectedChapterId: number | null = null;
  private filterMode: FilterMode = 'all';

  constructor() {
    super('GalleryScene');
  }

  create(): void {
    this.addBackground();
    this.addTitle();
    this.addStatsBar();
    this.addFilterTabs();
    this.addGalleryItems();
    this.addBackButton();
  }

  private addBackground(): void {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    const bg = this.add.graphics();
    bg.fillStyle(0x16213e, 1);
    bg.fillRoundedRect(25, 100, 700, 1150, 20);
  }

  private addTitle(): void {
    this.add.text(375, 60, '植物标本修复', {
      font: 'bold 42px Arial',
      color: '#e94560'
    }).setOrigin(0.5);

    this.add.text(375, 100, '植物图鉴', {
      font: '28px Arial',
      color: '#eaeaea'
    }).setOrigin(0.5);
  }

  private addStatsBar(): void {
    const statsBg = this.add.graphics();
    statsBg.fillStyle(0x0f3460, 0.8);
    statsBg.fillRoundedRect(45, 130, 660, 60, 12);

    const unlockedCount = SaveManager.getUnlockedGalleryItems().length;
    const totalCount = AllGalleryItems.length;
    const totalStars = SaveManager.getTotalStars();
    const eventUnlocked = SaveManager.getUnlockedEventGalleryItems().length;
    const eventTotal = EventGalleryItems.length;

    this.add.text(65, 160, '📚', { font: '22px Arial' }).setOrigin(0, 0.5);
    this.add.text(95, 160, `${unlockedCount}/${totalCount}`, {
      font: 'bold 16px Arial',
      color: '#4caf50'
    }).setOrigin(0, 0.5);

    this.add.text(240, 160, '⭐', { font: '22px Arial' }).setOrigin(0, 0.5);
    this.add.text(270, 160, `${totalStars}`, {
      font: 'bold 16px Arial',
      color: '#ffd700'
    }).setOrigin(0, 0.5);

    this.add.text(380, 160, '🌸', { font: '22px Arial' }).setOrigin(0, 0.5);
    this.add.text(410, 160, `活动: ${eventUnlocked}/${eventTotal}`, {
      font: 'bold 16px Arial',
      color: '#e91e63'
    }).setOrigin(0, 0.5);
  }

  private addFilterTabs(): void {
    const tabY = 215;
    const tabWidth = 150;
    const tabHeight = 44;
    const spacing = 8;
    const chapterTabs = Chapters.length;
    const extraTabs = 2;
    const totalTabs = chapterTabs + extraTabs;
    const totalWidth = tabWidth * totalTabs + spacing * (totalTabs - 1);
    const startX = (750 - totalWidth) / 2 + tabWidth / 2;

    const allTab = this.createFilterTab(
      startX,
      tabY,
      tabWidth,
      tabHeight,
      '全部',
      this.filterMode === 'all',
      0x607d8b,
      () => {
        this.filterMode = 'all';
        this.selectedChapterId = null;
        this.scene.restart();
      }
    );

    const activeEvent = getActiveEvent();
    const eventColor = activeEvent ? activeEvent.primaryColor : 0xe91e63;
    const eventUnlockedCount = SaveManager.getUnlockedEventGalleryItems().length;
    const hasEventItems = EventGalleryItems.length > 0;

    const eventTab = this.createFilterTab(
      startX + 1 * (tabWidth + spacing),
      tabY,
      tabWidth,
      tabHeight,
      hasEventItems ? `🌸 活动限定` : '🌸 活动',
      this.filterMode === 'event',
      eventColor,
      () => {
        this.filterMode = 'event';
        this.selectedChapterId = null;
        this.scene.restart();
      },
      !hasEventItems
    );

    if (hasEventItems && eventUnlockedCount > 0) {
      const badge = this.add.graphics();
      badge.fillStyle(0xffeb3b, 1);
      const badgeX = startX + 1 * (tabWidth + spacing) + tabWidth / 2 - 8;
      const badgeY = tabY - tabHeight / 2 + 5;
      badge.fillCircle(badgeX, badgeY, 12);
      this.add.text(badgeX, badgeY, eventUnlockedCount.toString(), {
        font: 'bold 11px Arial',
        color: '#1a1a2e'
      }).setOrigin(0.5);
    }

    Chapters.forEach((chapter, index) => {
      const x = startX + (index + extraTabs) * (tabWidth + spacing);
      const isSelected = this.filterMode === 'chapter' && this.selectedChapterId === chapter.id;
      const unlocked = SaveManager.isChapterUnlocked(chapter.id);

      this.createFilterTab(
        x,
        tabY,
        tabWidth,
        tabHeight,
        chapter.theme,
        isSelected,
        chapter.primaryColor,
        () => {
          if (unlocked) {
            this.filterMode = 'chapter';
            this.selectedChapterId = chapter.id;
            this.scene.restart();
          }
        },
        !unlocked
      );
    });
  }

  private createFilterTab(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    isSelected: boolean,
    color: number,
    onClick: () => void,
    disabled: boolean = false
  ): void {
    const tab = this.add.graphics();
    tab.fillStyle(isSelected ? color : disabled ? 0x2a2a3a : 0x0f3460, disabled ? 0.5 : 1);
    tab.fillRoundedRect(x - width / 2, y - height / 2, width, height, 10);

    if (isSelected) {
      tab.lineStyle(2, 0xffffff, 0.8);
      tab.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 10);
    }

    this.add.text(x, y, label, {
      font: 'bold 15px Arial',
      color: isSelected ? '#ffffff' : disabled ? '#555555' : '#aaaaaa'
    }).setOrigin(0.5);

    if (!disabled) {
      tab.setInteractive(
        new Phaser.Geom.Rectangle(x - width / 2, y - height / 2, width, height),
        Phaser.Geom.Rectangle.Contains
      );

      tab.on('pointerover', () => {
        if (!isSelected) {
          tab.clear();
          tab.fillStyle(this.lighten(isSelected ? color : 0x0f3460, 15), 1);
          tab.fillRoundedRect(x - width / 2, y - height / 2, width, height, 10);
        }
      });

      tab.on('pointerout', () => {
        tab.clear();
        tab.fillStyle(isSelected ? color : 0x0f3460, 1);
        tab.fillRoundedRect(x - width / 2, y - height / 2, width, height, 10);
        if (isSelected) {
          tab.lineStyle(2, 0xffffff, 0.8);
          tab.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 10);
        }
      });

      tab.on('pointerup', onClick);
    }
  }

  private addGalleryItems(): void {
    let itemsToShow: GalleryItem[];
    
    if (this.filterMode === 'event') {
      itemsToShow = EventGalleryItems;
    } else if (this.filterMode === 'chapter' && this.selectedChapterId !== null) {
      itemsToShow = AllGalleryItems.filter(item => 
        item.chapterId === this.selectedChapterId && !item.isEventExclusive
      );
    } else {
      itemsToShow = AllGalleryItems;
    }

    const startY = 290;
    const itemWidth = 320;
    const itemHeight = 310;
    const padding = 20;
    const cols = 2;

    itemsToShow.forEach((item, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = padding + col * (itemWidth + padding) + itemWidth / 2;
      const y = startY + row * (itemHeight + padding) + itemHeight / 2;

      this.createGalleryItem(x, y, itemWidth, itemHeight, item);
    });

    if (itemsToShow.length === 0 && this.filterMode === 'event') {
      this.add.text(375, 450, '暂无活动限定图鉴', {
        font: '20px Arial',
        color: '#888888'
      }).setOrigin(0.5);
    }
  }

  private createGalleryItem(
    x: number,
    y: number,
    width: number,
    height: number,
    item: GalleryItem
  ): void {
    const progress = SaveManager.getProgress(item.id);
    const unlocked = SaveManager.isGalleryUnlocked(item.specimenId);
    const chapter = getChapterById(item.chapterId);
    const isEvent = item.isEventExclusive;

    const card = this.add.graphics();
    card.fillStyle(unlocked ? 0x0f3460 : 0x333344, 1);
    
    const borderColor = isEvent 
      ? (unlocked ? 0xe91e63 : 0x662244) 
      : (unlocked ? 0x4caf50 : 0x555566);
    
    card.lineStyle(2, borderColor, 1);
    card.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 12);
    card.fillRoundedRect(x - width / 2, y - height / 2, width, height, 12);

    const badgeBg = this.add.graphics();
    const badgeColor = isEvent ? 0xe91e63 : (chapter?.primaryColor ?? 0x607d8b);
    const badgeText = isEvent ? `🌸 ${item.eventName || '活动限定'}` : (chapter?.theme ?? '主线');
    
    badgeBg.fillStyle(badgeColor, unlocked ? 0.85 : 0.5);
    badgeBg.fillRoundedRect(x - width / 2 + 10, y - height / 2 + 10, isEvent ? 110 : 75, 26, 6);

    this.add.text(x - width / 2 + (isEvent ? 65 : 47), y - height / 2 + 23, badgeText, {
      font: isEvent ? 'bold 11px Arial' : 'bold 11px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    const previewKey = `specimen-${item.specimenId}-preview`;
    const targetKey = `specimen-${item.specimenId}-target`;
    const imageY = y - 70;

    if (unlocked) {
      const img = this.add.image(x, imageY, previewKey);
      img.setDisplaySize(140, 140);
      
      if (isEvent) {
        const cornerBadge = this.add.graphics();
        cornerBadge.fillStyle(0xffd700, 1);
        cornerBadge.fillCircle(x + width / 2 - 15, y - height / 2 + 60, 16);
        this.add.text(x + width / 2 - 15, y - height / 2 + 60, '★', {
          font: 'bold 18px Arial',
          color: '#1a1a2e'
        }).setOrigin(0.5);
      }
    } else {
      this.add.image(x, imageY, 'lock').setScale(1.3);
    }

    this.add.text(x, y + 20, unlocked ? item.name : '???', {
      font: 'bold 22px Arial',
      color: unlocked ? '#ffffff' : '#888888'
    }).setOrigin(0.5);

    this.add.text(x, y + 50, unlocked ? item.family : '', {
      font: '16px Arial',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    if (unlocked && progress) {
      this.drawStars(x, y + 80, progress.stars);

      this.add.text(x, y + 110, `最高分: ${progress.bestScore}`, {
        font: '14px Arial',
        color: '#ffd700'
      }).setOrigin(0.5);
    } else if (unlocked && isEvent && !progress) {
      this.add.text(x, y + 85, '✨ 活动奖励解锁', {
        font: '14px Arial',
        color: '#ff80ab'
      }).setOrigin(0.5);
    }

    if (unlocked) {
      card.setInteractive(
        new Phaser.Geom.Rectangle(x - width / 2, y - height / 2, width, height),
        Phaser.Geom.Rectangle.Contains
      );

      card.on('pointerup', () => {
        this.showDetail(item, targetKey);
      });
    }
  }

  private drawStars(x: number, y: number, stars: number): void {
    const starSize = 20;
    const spacing = 6;
    const startX = x - starSize - spacing;

    for (let i = 0; i < 3; i++) {
      const starX = startX + i * (starSize + spacing);
      const texture = i < stars ? 'star-filled' : 'star-empty';
      this.add.image(starX, y, texture).setDisplaySize(starSize, starSize);
    }
  }

  private showDetail(item: GalleryItem, targetKey: string): void {
    const container = this.add.container(0, 0);

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, 750, 1334);
    overlay.setInteractive();
    container.add(overlay);

    const isEvent = item.isEventExclusive;
    const headerColor = isEvent ? 0xe91e63 : 0xe94560;

    const modal = this.add.graphics();
    modal.fillStyle(0x16213e, 1);
    modal.fillRoundedRect(75, 280, 600, 720, 20);
    modal.lineStyle(3, headerColor, 1);
    modal.strokeRoundedRect(75, 280, 600, 720, 20);
    container.add(modal);

    const img = this.add.image(375, 440, targetKey);
    img.setDisplaySize(360, 288);
    container.add(img);

    if (isEvent) {
      const eventBadge = this.add.graphics();
      eventBadge.fillStyle(0xe91e63, 0.95);
      eventBadge.fillRoundedRect(240, 300, 270, 36, 18);
      this.add.text(375, 318, `🌸 ${item.eventName || '活动限定'} 专属图鉴`, {
        font: 'bold 16px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);
      container.add(eventBadge);
    }

    const nameText = this.add.text(375, 600, item.name, {
      font: 'bold 32px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);
    container.add(nameText);

    const familyText = this.add.text(375, 640, item.family, {
      font: '20px Arial',
      color: '#aaaaaa'
    }).setOrigin(0.5);
    container.add(familyText);

    const descText = this.add.text(375, 725, item.description, {
      font: '17px Arial',
      color: '#eaeaea',
      align: 'center',
      wordWrap: { width: 500 }
    }).setOrigin(0.5);
    container.add(descText);

    if (isEvent) {
      const eventTagBg = this.add.graphics();
      eventTagBg.fillStyle(0x2d0a1a, 0.8);
      eventTagBg.fillRoundedRect(150, 800, 450, 40, 10);
      eventTagBg.lineStyle(1, 0xe91e63, 0.5);
      eventTagBg.strokeRoundedRect(150, 800, 450, 40, 10);
      this.add.text(375, 820, '✨ 通过活动奖励获得的限定标本', {
        font: '15px Arial',
        color: '#ff80ab'
      }).setOrigin(0.5);
      container.add(eventTagBg);
    }

    const progress = SaveManager.getProgress(item.id);
    if (progress) {
      const statsBg = this.add.graphics();
      statsBg.fillStyle(0x0f3460, 0.8);
      statsBg.fillRoundedRect(125, 860, 500, 60, 12);
      container.add(statsBg);

      this.add.text(175, 890, '🏆 最高分', {
        font: '14px Arial',
        color: '#888888'
      }).setOrigin(0, 0.5);
      container.add(this.add.text(275, 890, progress.bestScore.toLocaleString(), {
        font: 'bold 20px Arial',
        color: '#ffd700'
      }).setOrigin(0, 0.5));

      this.add.text(375, 890, '⏱️ 最快', {
        font: '14px Arial',
        color: '#888888'
      }).setOrigin(0, 0.5);
      const mins = Math.floor(progress.bestTime / 60);
      const secs = Math.floor(progress.bestTime % 60);
      container.add(this.add.text(435, 890, `${mins}:${secs.toString().padStart(2, '0')}`, {
        font: 'bold 20px Arial',
        color: '#2196f3'
      }).setOrigin(0, 0.5));

      this.drawStars(545, 890, progress.stars);
    } else if (isEvent) {
      const rewardInfoBg = this.add.graphics();
      rewardInfoBg.fillStyle(0x0f3460, 0.8);
      rewardInfoBg.fillRoundedRect(125, 860, 500, 50, 12);
      this.add.text(375, 885, '🎁 通过参与活动积累积分解锁此图鉴', {
        font: '15px Arial',
        color: '#81c784'
      }).setOrigin(0.5);
      container.add(rewardInfoBg);
    }

    const closeBtn = this.add.graphics();
    closeBtn.fillStyle(headerColor, 1);
    closeBtn.fillRoundedRect(275, 950, 200, 60, 15);
    closeBtn.setInteractive(
      new Phaser.Geom.Rectangle(275, 950, 200, 60),
      Phaser.Geom.Rectangle.Contains
    );
    container.add(closeBtn);

    const closeBtnText = this.add.text(375, 980, '关闭', {
      font: 'bold 22px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);
    container.add(closeBtnText);

    if (!isEvent) {
      const playBtn = this.add.graphics();
      playBtn.fillStyle(0x4caf50, 1);
      playBtn.fillRoundedRect(125, 1020, 500, 55, 12);
      playBtn.setInteractive(
        new Phaser.Geom.Rectangle(125, 1020, 500, 55),
        Phaser.Geom.Rectangle.Contains
      );
      container.add(playBtn);

      this.add.text(375, 1047, '🎮 挑战此关卡', {
        font: 'bold 18px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);

      playBtn.on('pointerup', () => {
        this.scene.start('GameScene', { levelId: item.id });
      });
    }

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
