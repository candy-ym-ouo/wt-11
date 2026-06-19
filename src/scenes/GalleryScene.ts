import Phaser from 'phaser';
import { GalleryItems } from '../data/Levels';
import { SaveManager } from '../utils/SaveManager';
import { GalleryItem } from '../types/GameTypes';

export class GalleryScene extends Phaser.Scene {
  constructor() {
    super('GalleryScene');
  }

  create(): void {
    this.addBackground();
    this.addTitle();
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

  private addGalleryItems(): void {
    const startY = 180;
    const itemWidth = 320;
    const itemHeight = 300;
    const padding = 20;
    const cols = 2;

    GalleryItems.forEach((item, index) => {
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

    const card = this.add.graphics();
    card.fillStyle(unlocked ? 0x0f3460 : 0x333344, 1);
    card.lineStyle(2, unlocked ? 0x4caf50 : 0x555566, 1);
    card.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 12);
    card.fillRoundedRect(x - width / 2, y - height / 2, width, height, 12);

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
      this.scene.start('LevelSelectScene');
    });
  }
}
