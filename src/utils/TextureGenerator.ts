import Phaser from 'phaser';

export class TextureGenerator {
  static generateAll(scene: Phaser.Scene): void {
    this.generateUIElements(scene);
    this.generateLevelImages(scene);
  }

  private static generateUIElements(scene: Phaser.Scene): void {
    this.generateStarFilled(scene);
    this.generateStarEmpty(scene);
    this.generateLock(scene);
    this.generateBtnPlay(scene);
    this.generateBtnBack(scene);
    this.generateBtnGallery(scene);
    this.generateBtnRotate(scene);
    this.generateFrame(scene);
    this.generateBgPattern(scene);
  }

  private static generateStarFilled(scene: Phaser.Scene): void {
    const g = scene.add.graphics();
    const size = 60;
    const cx = size / 2;
    const cy = size / 2;
    const outerRadius = 25;
    const innerRadius = 10;
    const points = 5;

    g.fillStyle(0xffd700, 1);
    g.beginPath();

    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      if (i === 0) {
        g.moveTo(x, y);
      } else {
        g.lineTo(x, y);
      }
    }

    g.closePath();
    g.fillPath();

    g.generateTexture('star-filled', size, size);
    g.destroy();
  }

  private static generateStarEmpty(scene: Phaser.Scene): void {
    const g = scene.add.graphics();
    const size = 60;
    const cx = size / 2;
    const cy = size / 2;
    const outerRadius = 25;
    const innerRadius = 10;
    const points = 5;

    g.lineStyle(3, 0x666666, 1);
    g.beginPath();

    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      if (i === 0) {
        g.moveTo(x, y);
      } else {
        g.lineTo(x, y);
      }
    }

    g.closePath();
    g.strokePath();

    g.generateTexture('star-empty', size, size);
    g.destroy();
  }

  private static generateLock(scene: Phaser.Scene): void {
    const g = scene.add.graphics();
    const size = 60;
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

  private static generateBtnPlay(scene: Phaser.Scene): void {
    const g = scene.add.graphics();
    const width = 200;
    const height = 70;

    g.fillStyle(0x4caf50, 1);
    g.fillRoundedRect(0, 0, width, height, 15);

    g.fillStyle(0xffffff, 1);
    g.beginPath();
    g.moveTo(width / 2 - 10, height / 2 - 15);
    g.lineTo(width / 2 + 15, height / 2);
    g.lineTo(width / 2 - 10, height / 2 + 15);
    g.closePath();
    g.fillPath();

    g.generateTexture('btn-play', width, height);
    g.destroy();
  }

  private static generateBtnBack(scene: Phaser.Scene): void {
    const g = scene.add.graphics();
    const size = 60;

    g.fillStyle(0xe94560, 1);
    g.fillRoundedRect(0, 0, size, size, 12);

    g.lineStyle(4, 0xffffff, 1);
    g.beginPath();
    g.moveTo(size * 0.65, size * 0.3);
    g.lineTo(size * 0.35, size * 0.5);
    g.lineTo(size * 0.65, size * 0.7);
    g.strokePath();

    g.generateTexture('btn-back', size, size);
    g.destroy();
  }

  private static generateBtnGallery(scene: Phaser.Scene): void {
    const g = scene.add.graphics();
    const width = 200;
    const height = 70;

    g.fillStyle(0xff9800, 1);
    g.fillRoundedRect(0, 0, width, height, 15);

    g.fillStyle(0xffffff, 1);
    g.fillRect(30, 20, 25, 30);
    g.fillRect(60, 20, 25, 30);
    g.fillRect(45, 40, 25, 20);

    g.generateTexture('btn-gallery', width, height);
    g.destroy();
  }

  private static generateBtnRotate(scene: Phaser.Scene): void {
    const g = scene.add.graphics();
    const size = 60;

    g.fillStyle(0x2196f3, 1);
    g.fillRoundedRect(0, 0, size, size, 12);

    g.lineStyle(3, 0xffffff, 1);
    g.beginPath();
    g.arc(size / 2, size / 2, 18, -Math.PI * 0.3, Math.PI * 1.3, false);
    g.strokePath();

    g.fillStyle(0xffffff, 1);
    g.beginPath();
    g.moveTo(size * 0.75, size * 0.25);
    g.lineTo(size * 0.85, size * 0.4);
    g.lineTo(size * 0.65, size * 0.35);
    g.closePath();
    g.fillPath();

    g.generateTexture('btn-rotate', size, size);
    g.destroy();
  }

  private static generateFrame(scene: Phaser.Scene): void {
    const g = scene.add.graphics();
    const width = 520;
    const height = 420;

    g.lineStyle(10, 0x8b4513, 1);
    g.strokeRoundedRect(0, 0, width, height, 5);

    g.fillStyle(0xf5f5dc, 1);
    g.fillRoundedRect(10, 10, width - 20, height - 20, 2);

    g.generateTexture('frame', width, height);
    g.destroy();
  }

  private static generateBgPattern(scene: Phaser.Scene): void {
    const g = scene.add.graphics();
    const size = 200;

    g.fillStyle(0x1a1a2e, 1);
    g.fillRect(0, 0, size, size);

    g.fillStyle(0x16213e, 0.5);
    for (let i = 0; i < 5; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = 20 + Math.random() * 30;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fillPath();
    }

    g.generateTexture('bg-pattern', size, size);
    g.destroy();
  }

  private static generateLevelImages(scene: Phaser.Scene): void {
    const levels = [
      { id: 1, color: 0xffd700, name: '银杏', shape: 'leaf' },
      { id: 2, color: 0xe91e63, name: '玫瑰', shape: 'flower' },
      { id: 3, color: 0xffeb3b, name: '向日葵', shape: 'sunflower' },
      { id: 4, color: 0x9c27b0, name: '薰衣草', shape: 'lavender' },
      { id: 5, color: 0x00bcd4, name: '兰花', shape: 'orchid' },
      { id: 6, color: 0x4caf50, name: '多肉', shape: 'succulent' }
    ];

    levels.forEach(level => {
      this.generatePlantImage(scene, level.id, level.color, level.name, level.shape);
    });
  }

  private static generatePlantImage(
    scene: Phaser.Scene,
    levelId: number,
    color: number,
    name: string,
    shape: string
  ): void {
    const width = 500;
    const height = 400;
    const g = scene.add.graphics();

    g.fillStyle(0xf5f5dc, 1);
    g.fillRoundedRect(0, 0, width, height, 10);

    g.lineStyle(8, 0x8b4513, 1);
    g.strokeRoundedRect(4, 4, width - 8, height - 8, 8);

    const cx = width / 2;
    const cy = height / 2;

    this.drawPlantShape(g, cx, cy, color, shape, 1);

    g.generateTexture(`level${levelId}-target`, width, height);
    g.destroy();

    const g2 = scene.add.graphics();
    g2.fillStyle(0xf5f5dc, 1);
    g2.fillRoundedRect(0, 0, 200, 200, 10);
    this.drawPlantShape(g2, 100, 100, color, shape, 0.5);
    g2.generateTexture(`level${levelId}-preview`, 200, 200);
    g2.destroy();
  }

  private static drawPlantShape(
    g: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    color: number,
    shape: string,
    scale: number
  ): void {
    switch (shape) {
      case 'leaf':
        this.drawLeaf(g, cx, cy, color, scale);
        break;
      case 'flower':
        this.drawFlower(g, cx, cy, color, scale);
        break;
      case 'sunflower':
        this.drawSunflower(g, cx, cy, color, scale);
        break;
      case 'lavender':
        this.drawLavender(g, cx, cy, color, scale);
        break;
      case 'orchid':
        this.drawOrchid(g, cx, cy, color, scale);
        break;
      case 'succulent':
        this.drawSucculent(g, cx, cy, color, scale);
        break;
      default:
        this.drawLeaf(g, cx, cy, color, scale);
    }
  }

  private static drawLeaf(
    g: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    color: number,
    scale: number
  ): void {
    g.fillStyle(color, 0.9);
    g.beginPath();
    g.moveTo(cx, cy - 90 * scale);
    g.lineTo(cx - 70 * scale, cy - 30 * scale);
    g.lineTo(cx - 80 * scale, cy + 30 * scale);
    g.lineTo(cx, cy + 90 * scale);
    g.lineTo(cx + 80 * scale, cy + 30 * scale);
    g.lineTo(cx + 70 * scale, cy - 30 * scale);
    g.closePath();
    g.fillPath();

    g.lineStyle(2, 0x8b7500, 0.5);
    g.beginPath();
    g.moveTo(cx, cy - 80 * scale);
    g.lineTo(cx, cy + 80 * scale);
    g.strokePath();

    for (let i = -3; i <= 3; i++) {
      g.beginPath();
      g.moveTo(cx + i * 15 * scale, cy + 30 * scale);
      g.lineTo(cx + i * 25 * scale, cy - 20 * scale);
      g.strokePath();
    }
  }

  private static drawFlower(
    g: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    color: number,
    scale: number
  ): void {
    const petalCount = 8;
    const petalDistance = 45 * scale;
    const petalSize = 35 * scale;

    for (let i = 0; i < petalCount; i++) {
      const angle = (i / petalCount) * Math.PI * 2;
      const px = cx + Math.cos(angle) * petalDistance;
      const py = cy + Math.sin(angle) * petalDistance;

      g.fillStyle(this.adjustColor(color, i * 10), 0.85);
      g.beginPath();
      g.arc(px, py, petalSize, 0, Math.PI * 2);
      g.fillPath();
    }

    g.fillStyle(this.adjustColor(color, -30), 1);
    g.beginPath();
    g.arc(cx, cy, 30 * scale, 0, Math.PI * 2);
    g.fillPath();

    g.fillStyle(0x2e7d32, 0.9);
    g.fillRect(cx - 6 * scale, cy + 40 * scale, 12 * scale, 80 * scale);

    g.fillStyle(0x4caf50, 0.9);
    g.beginPath();
    g.arc(cx - 30 * scale, cy + 70 * scale, 20 * scale, 0, Math.PI * 2);
    g.fillPath();
    g.beginPath();
    g.arc(cx + 30 * scale, cy + 85 * scale, 20 * scale, 0, Math.PI * 2);
    g.fillPath();
  }

  private static drawSunflower(
    g: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    color: number,
    scale: number
  ): void {
    const petalCount = 16;
    const petalDistance = 55 * scale;

    for (let i = 0; i < petalCount; i++) {
      const angle = (i / petalCount) * Math.PI * 2;
      const px = cx + Math.cos(angle) * petalDistance;
      const py = cy + Math.sin(angle) * petalDistance;

      g.fillStyle(color, 0.9);
      g.beginPath();
      g.arc(px, py, 15 * scale, 0, Math.PI * 2);
      g.fillPath();
    }

    g.fillStyle(0x5d4037, 1);
    g.beginPath();
    g.arc(cx, cy, 45 * scale, 0, Math.PI * 2);
    g.fillPath();

    g.fillStyle(0x3e2723, 0.8);
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 35 * scale;
      const px = cx + Math.cos(angle) * dist;
      const py = cy + Math.sin(angle) * dist;
      g.beginPath();
      g.arc(px, py, 3 * scale, 0, Math.PI * 2);
      g.fillPath();
    }

    g.fillStyle(0x2e7d32, 0.9);
    g.fillRect(cx - 8 * scale, cy + 55 * scale, 16 * scale, 70 * scale);

    g.fillStyle(0x4caf50, 0.9);
    g.beginPath();
    g.arc(cx - 35 * scale, cy + 80 * scale, 25 * scale, 0, Math.PI * 2);
    g.fillPath();
  }

  private static drawLavender(
    g: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    color: number,
    scale: number
  ): void {
    const stems = 5;
    const stemHeight = 120 * scale;

    for (let i = 0; i < stems; i++) {
      const offsetX = (i - 2) * 30 * scale;
      const sx = cx + offsetX;
      const sy = cy + 60 * scale;

      g.fillStyle(0x2e7d32, 0.9);
      g.fillRect(sx - 3 * scale, sy, 6 * scale, stemHeight);

      const flowerCount = 8;
      for (let j = 0; j < flowerCount; j++) {
        const fy = sy - j * 15 * scale;
        const fsize = (flowerCount - j) * 5 * scale + 3 * scale;

        g.fillStyle(this.adjustColor(color, j * 5), 0.9);
        g.beginPath();
        g.arc(sx, fy, fsize, 0, Math.PI * 2);
        g.fillPath();
      }
    }

    g.fillStyle(0x4caf50, 0.8);
    for (let i = 0; i < 6; i++) {
      const lx = cx - 60 * scale + i * 25 * scale;
      const ly = cy + 100 * scale + Math.sin(i) * 10 * scale;
      g.beginPath();
      g.arc(lx, ly, 12 * scale, 0, Math.PI * 2);
      g.fillPath();
    }
  }

  private static drawOrchid(
    g: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    color: number,
    scale: number
  ): void {
    g.fillStyle(0x2e7d32, 0.9);
    g.fillRect(cx - 8 * scale, cy + 30 * scale, 16 * scale, 80 * scale);

    const petalConfigs = [
      { angle: -Math.PI / 2, dist: 55, size: 25 },
      { angle: -Math.PI / 6, dist: 45, size: 28 },
      { angle: Math.PI / 6, dist: 45, size: 28 },
      { angle: Math.PI * 5 / 6, dist: 40, size: 20 },
      { angle: -Math.PI * 5 / 6, dist: 40, size: 20 }
    ];

    petalConfigs.forEach((config, i) => {
      const px = cx + Math.cos(config.angle) * config.dist * scale;
      const py = cy + Math.sin(config.angle) * config.dist * scale;

      g.fillStyle(this.adjustColor(color, i * 15), 0.85);
      g.beginPath();
      g.arc(px, py, config.size * scale, 0, Math.PI * 2);
      g.fillPath();
    });

    g.fillStyle(this.adjustColor(color, 30), 1);
    g.beginPath();
    g.arc(cx, cy + 10 * scale, 18 * scale, 0, Math.PI * 2);
    g.fillPath();

    g.fillStyle(0xffffff, 0.9);
    g.beginPath();
    g.arc(cx, cy - 5 * scale, 8 * scale, 0, Math.PI * 2);
    g.fillPath();

    g.fillStyle(0x4caf50, 0.9);
    g.beginPath();
    g.arc(cx - 40 * scale, cy + 90 * scale, 30 * scale, 0, Math.PI * 2);
    g.fillPath();
    g.beginPath();
    g.arc(cx + 40 * scale, cy + 100 * scale, 30 * scale, 0, Math.PI * 2);
    g.fillPath();
  }

  private static drawSucculent(
    g: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    color: number,
    scale: number
  ): void {
    const leaves = 10;
    const layers = 3;

    for (let layer = 0; layer < layers; layer++) {
      const layerScale = 1 - layer * 0.25;
      const layerOffset = layer * 15 * scale;

      for (let i = 0; i < leaves; i++) {
        const angle = (i / leaves) * Math.PI * 2 + layer * 0.3;
        const leafLength = 50 * layerScale * scale;
        const leafWidth = 18 * layerScale * scale;

        const lx = cx + Math.cos(angle) * leafLength * 0.5;
        const ly = cy + layerOffset + Math.sin(angle) * leafLength * 0.3;

        g.fillStyle(this.adjustColor(color, layer * 20 + i * 3), 0.9);
        g.beginPath();
        g.arc(lx, ly, leafWidth, 0, Math.PI * 2);
        g.fillPath();
      }
    }

    g.fillStyle(this.adjustColor(color, -30), 1);
    g.beginPath();
    g.arc(cx, cy + 10 * scale, 20 * scale, 0, Math.PI * 2);
    g.fillPath();

    g.fillStyle(0x795548, 0.9);
    g.fillRoundedRect(cx - 50 * scale, cy + 80 * scale, 100 * scale, 50 * scale, 5);

    g.fillStyle(0x5d4037, 1);
    for (let i = 0; i < 15; i++) {
      const px = cx - 40 * scale + Math.random() * 80 * scale;
      const py = cy + 90 * scale + Math.random() * 30 * scale;
      g.beginPath();
      g.arc(px, py, 3 + Math.random() * 4, 0, Math.PI * 2);
      g.fillPath();
    }
  }

  private static adjustColor(color: number, amount: number): number {
    const r = Math.min(255, Math.max(0, ((color >> 16) & 0xff) + amount));
    const g = Math.min(255, Math.max(0, ((color >> 8) & 0xff) + amount));
    const b = Math.min(255, Math.max(0, (color & 0xff) + amount));
    return (r << 16) | (g << 8) | b;
  }
}
