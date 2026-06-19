import Phaser from 'phaser';
import { Levels } from '../data/Levels';
import { SaveManager } from '../utils/SaveManager';
import { getDifficultyColor, getDifficultyText } from '../utils/GameUtils';
import { LevelData } from '../types/GameTypes';
import { Chapters, getChapterById, getChapterByLevelId } from '../data/Chapters';

export class LevelSelectScene extends Phaser.Scene {
  private currentChapterId: number | null = null;
  private selectedChapterId: number = 1;

  constructor() {
    super('LevelSelectScene');
  }

  init(data: { chapterId?: number }): void {
    if (data?.chapterId) {
      this.currentChapterId = data.chapterId;
      this.selectedChapterId = data.chapterId;
    }
  }

  create(): void {
    this.addBackground();
    this.addTitle();
    this.addChapterTabs();
    this.addLevelGrid();
    this.addBottomButtons();
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

    this.add.text(375, 100, this.currentChapterId ? '选择关卡' : '全部关卡', {
      font: '28px Arial',
      color: '#eaeaea'
    }).setOrigin(0.5);
  }

  private addChapterTabs(): void {
    const tabY = 150;
    const tabWidth = 220;
    const tabHeight = 50;
    const spacing = 10;
    const totalWidth = tabWidth * Chapters.length + spacing * (Chapters.length - 1);
    const startX = (750 - totalWidth) / 2 + tabWidth / 2;

    Chapters.forEach((chapter, index) => {
      const x = startX + index * (tabWidth + spacing);
      const isSelected = chapter.id === this.selectedChapterId;
      const unlocked = SaveManager.isChapterUnlocked(chapter.id);

      const tab = this.add.graphics();
      tab.fillStyle(isSelected ? chapter.primaryColor : unlocked ? 0x0f3460 : 0x2a2a3a, 1);
      tab.fillRoundedRect(x - tabWidth / 2, tabY - tabHeight / 2, tabWidth, tabHeight, 10);

      if (isSelected) {
        tab.lineStyle(3, 0xffffff, 0.8);
        tab.strokeRoundedRect(x - tabWidth / 2, tabY - tabHeight / 2, tabWidth, tabHeight, 10);
      }

      const chapterStars = SaveManager.getChapterStars(chapter.id);
      const totalStars = chapter.levelIds.length * 3;

      this.add.text(x, tabY - 8, chapter.theme, {
        font: 'bold 15px Arial',
        color: unlocked ? '#ffffff' : '#666666'
      }).setOrigin(0.5);

      this.add.text(x, tabY + 12, `${chapterStars}/${totalStars} ⭐`, {
        font: '12px Arial',
        color: unlocked ? '#ffd700' : '#555555'
      }).setOrigin(0.5);

      if (unlocked) {
        tab.setInteractive(
          new Phaser.Geom.Rectangle(x - tabWidth / 2, tabY - tabHeight / 2, tabWidth, tabHeight),
          Phaser.Geom.Rectangle.Contains
        );

        tab.on('pointerup', () => {
          this.selectedChapterId = chapter.id;
          this.scene.restart({ chapterId: chapter.id });
        });
      }
    });
  }

  private addLevelGrid(): void {
    const chapter = this.currentChapterId ? getChapterById(this.currentChapterId) : null;
    let levelsToShow: LevelData[];

    if (chapter) {
      levelsToShow = Levels.filter(level => chapter.levelIds.includes(level.id));
    } else {
      levelsToShow = Levels;
    }

    const startY = chapter ? 260 : 260;
    const cardWidth = 320;
    const cardHeight = 240;
    const padding = 30;
    const cols = 2;

    levelsToShow.forEach((level, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = padding + col * (cardWidth + padding) + cardWidth / 2;
      const y = startY + row * (cardHeight + padding) + cardHeight / 2;

      this.createLevelCard(x, y, cardWidth, cardHeight, level);
    });
  }

  private createLevelCard(
    x: number,
    y: number,
    width: number,
    height: number,
    level: LevelData
  ): void {
    const progress = SaveManager.getProgress(level.id);
    const unlocked = progress?.unlocked ?? false;
    const chapter = getChapterByLevelId(level.id);

    const card = this.add.graphics();
    card.fillStyle(unlocked ? 0x0f3460 : 0x333344, 1);
    card.lineStyle(3, unlocked ? 0xe94560 : 0x555566, 1);
    card.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 15);
    card.fillRoundedRect(x - width / 2, y - height / 2, width, height, 15);

    const previewKey = `specimen-${level.specimen.id}-preview`;
    if (unlocked) {
      const previewImg = this.add.image(x, y - 65, previewKey);
      previewImg.setDisplaySize(120, 120);
    } else {
      this.add.image(x, y - 65, 'lock').setScale(1.0);
    }

    this.add.text(x, y + 10, level.name, {
      font: 'bold 22px Arial',
      color: unlocked ? '#ffffff' : '#888888'
    }).setOrigin(0.5);

    this.add.text(x, y + 40, level.specimen.name, {
      font: '18px Arial',
      color: unlocked ? '#eaeaea' : '#777777'
    }).setOrigin(0.5);

    const diffColor = getDifficultyColor(level.rule.difficulty);
    this.add.text(x, y + 68, getDifficultyText(level.rule.difficulty), {
      font: '15px Arial',
      color: '#' + diffColor.toString(16).padStart(6, '0')
    }).setOrigin(0.5);

    if (unlocked && progress) {
      this.drawStars(x, y + 98, progress.stars);
    }

    if (chapter && !this.currentChapterId) {
      const chapterBadge = this.add.graphics();
      chapterBadge.fillStyle(chapter.primaryColor, 0.9);
      chapterBadge.fillRoundedRect(x - width / 2 + 10, y - height / 2 + 10, 70, 24, 6);

      this.add.text(x - width / 2 + 45, y - height / 2 + 22, chapter.theme, {
        font: 'bold 11px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);
    }

    if (unlocked) {
      card.setInteractive(
        new Phaser.Geom.Rectangle(x - width / 2, y - height / 2, width, height),
        Phaser.Geom.Rectangle.Contains
      );

      card.on('pointerover', () => {
        card.lineStyle(3, 0xffffff, 1);
      });

      card.on('pointerout', () => {
        card.lineStyle(3, 0xe94560, 1);
      });

      card.on('pointerup', () => {
        this.scene.start('GameScene', { levelId: level.id });
      });
    }
  }

  private drawStars(x: number, y: number, stars: number): void {
    const starSize = 22;
    const spacing = 6;
    const startX = x - starSize - spacing;

    for (let i = 0; i < 3; i++) {
      const starX = startX + i * (starSize + spacing);
      const texture = i < stars ? 'star-filled' : 'star-empty';
      this.add.image(starX, y, texture).setDisplaySize(starSize, starSize);
    }
  }

  private addBottomButtons(): void {
    const btnY = 1250;
    const btnW = 280;
    const btnH = 65;
    const spacing = 30;

    const chapterBtn = this.createBottomButton(
      375 - btnW / 2 - spacing / 2,
      btnY,
      btnW,
      btnH,
      '📖 章节选择',
      0x9c27b0,
      () => this.scene.start('ChapterSelectScene')
    );

    const galleryBtn = this.createBottomButton(
      375 + btnW / 2 + spacing / 2,
      btnY,
      btnW,
      btnH,
      '📚 图鉴',
      0x4caf50,
      () => this.scene.start('GalleryScene')
    );
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
