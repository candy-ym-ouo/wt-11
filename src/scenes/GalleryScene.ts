import Phaser from 'phaser';
import { GalleryItems } from '../data/Levels';
import { SaveManager } from '../utils/SaveManager';
import { GalleryItem } from '../types/GameTypes';
import { Chapters, getChapterById } from '../data/Chapters';

export class GalleryScene extends Phaser.Scene {
  private selectedChapterId: number | null = null;

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
    const totalCount = GalleryItems.length;
    const totalStars = SaveManager.getTotalStars();

    this.add.text(85, 160, '📚', { font: '24px Arial' }).setOrigin(0, 0.5);
    this.add.text(120, 160, `收集进度: ${unlockedCount} / ${totalCount}`, {
      font: 'bold 18px Arial',
      color: '#4caf50'
    }).setOrigin(0, 0.5);

    this.add.text(400, 160, '⭐', { font: '24px Arial' }).setOrigin(0, 0.5);
    this.add.text(435, 160, `总星星: ${totalStars}`, {
      font: 'bold 18px Arial',
      color: '#ffd700'
    }).setOrigin(0, 0.5);
  }

  private addFilterTabs(): void {
    const tabY = 215;
    const tabWidth = 180;
    const tabHeight = 44;
    const spacing = 10;
    const tabs = Chapters.length + 1;
    const totalWidth = tabWidth * tabs + spacing * (tabs - 1);
    const startX = (750 - totalWidth) / 2 + tabWidth / 2;

    const allTab = this.createFilterTab(
      startX,
      tabY,
      tabWidth,
      tabHeight,
      '全部',
      this.selectedChapterId === null,
      0x607d8b,
      () => {
        this.selectedChapterId = null;
        this.scene.restart();
      }
    );

    Chapters.forEach((chapter, index) => {
      const x = startX + (index + 1) * (tabWidth + spacing);
      const isSelected = this.selectedChapterId === chapter.id;
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
    let itemsToShow = GalleryItems;
    if (this.selectedChapterId !== null) {
      itemsToShow = GalleryItems.filter(item => item.chapterId === this.selectedChapterId);
    }

    const startY = 290;
    const itemWidth = 320;
    const itemHeight = 300;
    const padding = 20;
    const cols = 2;

    itemsToShow.forEach((item, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = padding + col * (itemWidth + padding) + itemWidth / 2;
      const y = startY + row * (itemHeight + padding) + itemHeight / 2;

      this.createGalleryItem(x, y, itemWidth, itemHeight, item);
    });
  }

  private createGalleryItem(
    x: number,
    y: number,
    width: number,
    height: number,
    item: GalleryItem
  ): void {
    const progress = SaveManager.getProgress(item.id);
    const unlocked = progress?.completed ?? false;
    const chapter = getChapterById(item.chapterId);

    const card = this.add.graphics();
    card.fillStyle(unlocked ? 0x0f3460 : 0x333344, 1);
    card.lineStyle(2, unlocked ? 0x4caf50 : 0x555566, 1);
    card.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 12);
    card.fillRoundedRect(x - width / 2, y - height / 2, width, height, 12);

    if (chapter && !unlocked) {
      const chapterBadge = this.add.graphics();
      chapterBadge.fillStyle(chapter.primaryColor, 0.7);
      chapterBadge.fillRoundedRect(x - width / 2 + 10, y - height / 2 + 10, 75, 26, 6);

      this.add.text(x - width / 2 + 47, y - height / 2 + 23, chapter.theme, {
        font: 'bold 11px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);
    }

    const previewKey = `specimen-${item.specimenId}-preview`;
    const targetKey = `specimen-${item.specimenId}-target`;
    const imageY = y - 75;

    if (unlocked) {
      const img = this.add.image(x, imageY, previewKey);
      img.setDisplaySize(140, 140);
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
      this.drawStars(x, y + 85, progress.stars);

      this.add.text(x, y + 118, `最高分: ${progress.bestScore}`, {
        font: '14px Arial',
        color: '#ffd700'
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

    const modal = this.add.graphics();
    modal.fillStyle(0x16213e, 1);
    modal.fillRoundedRect(75, 280, 600, 680, 20);
    modal.lineStyle(3, 0xe94560, 1);
    modal.strokeRoundedRect(75, 280, 600, 680, 20);
    container.add(modal);

    const img = this.add.image(375, 420, targetKey);
    img.setDisplaySize(360, 288);
    container.add(img);

    const nameText = this.add.text(375, 585, item.name, {
      font: 'bold 32px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);
    container.add(nameText);

    const familyText = this.add.text(375, 625, item.family, {
      font: '20px Arial',
      color: '#aaaaaa'
    }).setOrigin(0.5);
    container.add(familyText);

    const descText = this.add.text(375, 710, item.description, {
      font: '17px Arial',
      color: '#eaeaea',
      align: 'center',
      wordWrap: { width: 500 }
    }).setOrigin(0.5);
    container.add(descText);

    const progress = SaveManager.getProgress(item.id);
    if (progress) {
      const statsBg = this.add.graphics();
      statsBg.fillStyle(0x0f3460, 0.8);
      statsBg.fillRoundedRect(125, 790, 500, 60, 12);
      container.add(statsBg);

      this.add.text(175, 820, '🏆 最高分', {
        font: '14px Arial',
        color: '#888888'
      }).setOrigin(0, 0.5);
      container.add(this.add.text(275, 820, progress.bestScore.toLocaleString(), {
        font: 'bold 20px Arial',
        color: '#ffd700'
      }).setOrigin(0, 0.5));

      this.add.text(375, 820, '⏱️ 最快', {
        font: '14px Arial',
        color: '#888888'
      }).setOrigin(0, 0.5);
      const mins = Math.floor(progress.bestTime / 60);
      const secs = Math.floor(progress.bestTime % 60);
      container.add(this.add.text(435, 820, `${mins}:${secs.toString().padStart(2, '0')}`, {
        font: 'bold 20px Arial',
        color: '#2196f3'
      }).setOrigin(0, 0.5));

      this.drawStars(545, 820, progress.stars);
    }

    const closeBtn = this.add.graphics();
    closeBtn.fillStyle(0xe94560, 1);
    closeBtn.fillRoundedRect(275, 880, 200, 60, 15);
    closeBtn.setInteractive(
      new Phaser.Geom.Rectangle(275, 880, 200, 60),
      Phaser.Geom.Rectangle.Contains
    );
    container.add(closeBtn);

    const closeBtnText = this.add.text(375, 910, '关闭', {
      font: 'bold 22px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);
    container.add(closeBtnText);

    const playBtn = this.add.graphics();
    playBtn.fillStyle(0x4caf50, 1);
    playBtn.fillRoundedRect(125, 950, 500, 55, 12);
    playBtn.setInteractive(
      new Phaser.Geom.Rectangle(125, 950, 500, 55),
      Phaser.Geom.Rectangle.Contains
    );
    container.add(playBtn);

    this.add.text(375, 977, '🎮 挑战此关卡', {
      font: 'bold 18px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    const close = () => {
      container.destroy();
    };

    closeBtn.on('pointerup', close);
    overlay.on('pointerup', close);

    playBtn.on('pointerup', () => {
      this.scene.start('GameScene', { levelId: item.id });
    });
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
