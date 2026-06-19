import Phaser from 'phaser';
import { GalleryItems } from '../data/Levels';
import { SaveManager } from '../utils/SaveManager';

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
    const itemHeight = 280;
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
    item: typeof GalleryItems[0]
  ): void {
    const progress = SaveManager.getProgress(item.id);
    const unlocked = progress?.completed ?? false;

    const card = this.add.graphics();
    card.fillStyle(unlocked ? 0x0f3460 : 0x333344, 1);
    card.lineStyle(2, unlocked ? 0x4caf50 : 0x555566, 1);
    card.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 12);
    card.fillRoundedRect(x - width / 2, y - height / 2, width, height, 12);

    const imageY = y - 70;
    if (unlocked) {
      const img = this.add.image(x, imageY, item.image);
      img.setDisplaySize(120, 120);
    } else {
      this.add.image(x, imageY, 'lock').setScale(1.2);
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

      this.add.text(x, y + 115, `最高分: ${progress.bestScore}`, {
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
        this.showDetail(item);
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

  private showDetail(item: typeof GalleryItems[0]): void {
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, 750, 1334);
    overlay.setInteractive();

    const modal = this.add.graphics();
    modal.fillStyle(0x16213e, 1);
    modal.fillRoundedRect(75, 300, 600, 600, 20);
    modal.lineStyle(3, 0xe94560, 1);
    modal.strokeRoundedRect(75, 300, 600, 600, 20);

    this.add.image(375, 420, item.image).setDisplaySize(180, 180);

    this.add.text(375, 560, item.name, {
      font: 'bold 32px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(375, 600, item.family, {
      font: '20px Arial',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    this.add.text(375, 680, item.description, {
      font: '18px Arial',
      color: '#eaeaea',
      wordWrap: { width: 500 }
    }).setOrigin(0.5);

    const closeBtn = this.add.graphics();
    closeBtn.fillStyle(0xe94560, 1);
    closeBtn.fillRoundedRect(275, 820, 200, 60, 15);
    closeBtn.setInteractive(
      new Phaser.Geom.Rectangle(275, 820, 200, 60),
      Phaser.Geom.Rectangle.Contains
    );

    this.add.text(375, 850, '关闭', {
      font: 'bold 22px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    const close = () => {
      overlay.destroy();
      modal.destroy();
      closeBtn.destroy();
      this.children.each(child => {
        if ((child as any).y > 800 && (child as any).type === 'Text') {
          // do nothing
        }
      });
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
