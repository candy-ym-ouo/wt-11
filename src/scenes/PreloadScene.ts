import Phaser from 'phaser';
import { LevelRules } from '../data/LevelRules';
import { PlantSpecimens } from '../data/PlantSpecimens';
import { SpecimenTextureGenerator } from '../utils/SpecimenTextureGenerator';
import { EventLevelRules } from '../data/EventLevelRules';

export class PreloadScene extends Phaser.Scene {
  private progressBar!: Phaser.GameObjects.Graphics;
  private progressBox!: Phaser.GameObjects.Graphics;
  private loadingText!: Phaser.GameObjects.Text;
  private percentText!: Phaser.GameObjects.Text;

  constructor() {
    super('PreloadScene');
  }

  preload(): void {
    this.createProgressBar();
  }

  create(): void {
    this.generateAllTextures();
    this.simulateLoading();
  }

  private createProgressBar(): void {
    const width = 400;
    const height = 50;
    const x = (this.cameras.main.width - width) / 2;
    const y = (this.cameras.main.height - height) / 2;

    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(0x222222, 0.8);
    this.progressBox.fillRoundedRect(x, y, width, height, 10);

    this.progressBar = this.add.graphics();

    this.loadingText = this.add.text(
      this.cameras.main.width / 2,
      y - 60,
      '正在生成标本...',
      {
        font: '28px Arial',
        color: '#ffffff'
      }
    ).setOrigin(0.5);

    this.percentText = this.add.text(
      this.cameras.main.width / 2,
      y + height / 2,
      '0%',
      {
        font: '24px Arial',
        color: '#ffffff'
      }
    ).setOrigin(0.5);
  }

  private generateAllTextures(): void {
    this.generateUITextures();
    this.generateAllSpecimenTextures();
  }

  private generateUITextures(): void {
    this.createStarTexture('star-filled', true);
    this.createStarTexture('star-empty', false);
    this.createLockTexture();
    this.createButtonTextures();
  }

  private createStarTexture(key: string, filled: boolean): void {
    const size = 60;
    const g = this.add.graphics();
    const cx = size / 2;
    const cy = size / 2;
    const outerR = 25;
    const innerR = 10;
    const points = 5;

    if (filled) {
      g.fillStyle(0xffd700, 1);
    }
    g.lineStyle(3, filled ? 0xffd700 : 0x666666, 1);
    g.beginPath();

    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.closePath();
    if (filled) g.fillPath();
    g.strokePath();

    g.generateTexture(key, size, size);
    g.destroy();
  }

  private createLockTexture(): void {
    const size = 60;
    const g = this.add.graphics();
    const cx = size / 2;
    const cy = size / 2 + 5;

    g.fillStyle(0x666666, 1);
    g.fillRoundedRect(cx - 18, cy - 5, 36, 30, 4);

    g.lineStyle(4, 0x666666, 1);
    g.beginPath();
    g.arc(cx, cy - 5, 12, Math.PI, 0, false);
    g.strokePath();

    g.fillStyle(0x888888, 1);
    g.fillCircle(cx, cy + 8, 5);

    g.generateTexture('lock', size, size);
    g.destroy();
  }

  private createButtonTextures(): void {
    const btns = [
      { key: 'btn-play', color: 0x4caf50, w: 200, h: 70 },
      { key: 'btn-back', color: 0xe94560, w: 60, h: 60 },
      { key: 'btn-gallery', color: 0xff9800, w: 200, h: 70 },
      { key: 'btn-rotate', color: 0x2196f3, w: 60, h: 60 }
    ];

    btns.forEach(btn => {
      const g = this.add.graphics();
      g.fillStyle(btn.color, 1);
      g.fillRoundedRect(0, 0, btn.w, btn.h, Math.min(btn.w, btn.h) / 4);
      g.generateTexture(btn.key, btn.w, btn.h);
      g.destroy();
    });

    const g = this.add.graphics();
    g.fillStyle(0xf5f5dc, 1);
    g.fillRoundedRect(0, 0, 520, 420, 8);
    g.lineStyle(10, 0x8b4513, 1);
    g.strokeRoundedRect(0, 0, 520, 420, 8);
    g.generateTexture('frame', 520, 420);
    g.destroy();
  }

  private generateAllSpecimenTextures(): void {
    const allRules = [...LevelRules, ...EventLevelRules];
    const processedSpecimens = new Set<string>();

    allRules.forEach(rule => {
      const key = `${rule.specimenId}-${rule.rows}-${rule.cols}`;
      if (processedSpecimens.has(key)) return;
      processedSpecimens.add(key);

      const specimen = PlantSpecimens[rule.specimenId];
      if (!specimen) return;

      SpecimenTextureGenerator.generateSpecimenAndPieces(
        this,
        specimen,
        rule.rows,
        rule.cols
      );
    });
  }

  private simulateLoading(): void {
    let progress = 0;
    const interval = this.time.addEvent({
      delay: 25,
      loop: true,
      callback: () => {
        progress += 2;
        if (progress >= 100) {
          progress = 100;
          interval.remove(false);
          this.time.delayedCall(300, () => {
            this.scene.start('ChapterSelectScene');
          });
        }
        this.updateProgressBar(progress / 100);
      }
    });
  }

  private updateProgressBar(value: number): void {
    const width = 380;
    const height = 30;
    const x = (this.cameras.main.width - width) / 2;
    const y = (this.cameras.main.height - height) / 2;

    this.progressBar.clear();
    this.progressBar.fillStyle(0x4caf50, 1);
    this.progressBar.fillRoundedRect(x, y, width * value, height, 8);

    this.percentText.setText(`${Math.floor(value * 100)}%`);
  }
}
