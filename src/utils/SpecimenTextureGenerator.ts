import Phaser from 'phaser';
import { PlantSpecimen, IrregularSliceConfig, PieceGenerationConfig } from '../types/GameTypes';

export const SPECIMEN_WIDTH = 500;
export const SPECIMEN_HEIGHT = 400;

export class SpecimenTextureGenerator {
  static generateSpecimenAndPieces(
    scene: Phaser.Scene,
    specimen: PlantSpecimen,
    rows: number,
    cols: number,
    pieceGenerationConfig?: PieceGenerationConfig,
    levelId?: number
  ): {
    targetTextureKey: string;
    previewTextureKey: string;
    pieceKeys: string[];
    pieceWidth: number;
    pieceHeight: number;
  } {
    const hasCustomConfig = pieceGenerationConfig && 
      (pieceGenerationConfig.sliceMode === 'irregular_custom' || 
       pieceGenerationConfig.sliceMode === 'variable_size');

    if (!hasCustomConfig) {
      return this.generateRegularPieces(scene, specimen, rows, cols);
    }

    return this.generateCustomPieces(scene, specimen, rows, cols, pieceGenerationConfig, levelId);
  }

  private static generateRegularPieces(
    scene: Phaser.Scene,
    specimen: PlantSpecimen,
    rows: number,
    cols: number
  ): {
    targetTextureKey: string;
    previewTextureKey: string;
    pieceKeys: string[];
    pieceWidth: number;
    pieceHeight: number;
  } {
    const targetKey = `specimen-${specimen.id}-target`;
    const previewKey = `specimen-${specimen.id}-preview`;

    const canvas = document.createElement('canvas');
    canvas.width = SPECIMEN_WIDTH;
    canvas.height = SPECIMEN_HEIGHT;
    const ctx = canvas.getContext('2d')!;

    this.drawSpecimenBackground(ctx);
    this.drawPlantOnCanvas(ctx, specimen);
    this.drawSpecimenFrame(ctx);

    if (!scene.textures.exists(targetKey)) {
      scene.textures.addCanvas(targetKey, canvas);
    }

    if (!scene.textures.exists(previewKey)) {
      const previewCanvas = document.createElement('canvas');
      previewCanvas.width = 200;
      previewCanvas.height = 200;
      const pctx = previewCanvas.getContext('2d')!;
      pctx.fillStyle = '#f5f5dc';
      pctx.fillRect(0, 0, 200, 200);
      pctx.drawImage(canvas, 0, 0, SPECIMEN_WIDTH, SPECIMEN_HEIGHT, 10, 10, 180, 180);
      scene.textures.addCanvas(previewKey, previewCanvas);
    }

    const basePieceWidth = Math.floor(SPECIMEN_WIDTH / cols);
    const basePieceHeight = Math.floor(SPECIMEN_HEIGHT / rows);
    const pieceKeys: string[] = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const pieceIndex = row * cols + col;
        const pieceKey = `specimen-${specimen.id}-piece-${pieceIndex}`;
        if (!scene.textures.exists(pieceKey)) {
          const pieceCanvas = this.createPieceCanvas(
            canvas,
            col * basePieceWidth,
            row * basePieceHeight,
            basePieceWidth,
            basePieceHeight
          );
          scene.textures.addCanvas(pieceKey, pieceCanvas);
        }
        pieceKeys.push(pieceKey);
      }
    }

    return {
      targetTextureKey: targetKey,
      previewTextureKey: previewKey,
      pieceKeys: pieceKeys,
      pieceWidth: basePieceWidth,
      pieceHeight: basePieceHeight
    };
  }

  private static generateCustomPieces(
    scene: Phaser.Scene,
    specimen: PlantSpecimen,
    rows: number,
    cols: number,
    pieceGenerationConfig: PieceGenerationConfig,
    levelId?: number
  ): {
    targetTextureKey: string;
    previewTextureKey: string;
    pieceKeys: string[];
    pieceWidth: number;
    pieceHeight: number;
  } {
    const suffix = levelId !== undefined ? `lv${levelId}` : `custom_${specimen.id}_${rows}x${cols}`;
    const targetKey = `specimen-${specimen.id}-target`;
    const previewKey = `specimen-${specimen.id}-preview`;

    const canvas = document.createElement('canvas');
    canvas.width = SPECIMEN_WIDTH;
    canvas.height = SPECIMEN_HEIGHT;
    const ctx = canvas.getContext('2d')!;

    this.drawSpecimenBackground(ctx);
    this.drawPlantOnCanvas(ctx, specimen);
    this.drawSpecimenFrame(ctx);

    if (!scene.textures.exists(targetKey)) {
      scene.textures.addCanvas(targetKey, canvas);
    }

    if (!scene.textures.exists(previewKey)) {
      const previewCanvas = document.createElement('canvas');
      previewCanvas.width = 200;
      previewCanvas.height = 200;
      const pctx = previewCanvas.getContext('2d')!;
      pctx.fillStyle = '#f5f5dc';
      pctx.fillRect(0, 0, 200, 200);
      pctx.drawImage(canvas, 0, 0, SPECIMEN_WIDTH, SPECIMEN_HEIGHT, 10, 10, 180, 180);
      scene.textures.addCanvas(previewKey, previewCanvas);
    }

    const basePieceWidth = Math.floor(SPECIMEN_WIDTH / cols);
    const basePieceHeight = Math.floor(SPECIMEN_HEIGHT / rows);
    const pieceKeys: string[] = [];
    const total = rows * cols;

    if (pieceGenerationConfig.sliceMode === 'irregular_custom' && pieceGenerationConfig.irregularSlices) {
      const slices = pieceGenerationConfig.irregularSlices;
      slices.forEach((slice, i) => {
        const pieceKey = `specimen-${specimen.id}-${suffix}-piece-${i}`;
        if (!scene.textures.exists(pieceKey)) {
          const pieceCanvas = this.createPieceCanvas(
            canvas,
            slice.sourceX,
            slice.sourceY,
            slice.width,
            slice.height
          );
          scene.textures.addCanvas(pieceKey, pieceCanvas);
        }
        pieceKeys.push(pieceKey);
      });
    } else if (pieceGenerationConfig.sliceMode === 'variable_size' && pieceGenerationConfig.variableSizeRanges) {
      const ranges = pieceGenerationConfig.variableSizeRanges;
      const deterministicRandom = (seed: number) => {
        const x = Math.sin(seed * 9301 + 49297 + specimen.id * 131) * 233280;
        return x - Math.floor(x);
      };

      for (let i = 0; i < total; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const seedBase = (levelId ?? 0) * 1000 + i;

        const widthRatio = ranges.minWidthRatio + 
          deterministicRandom(seedBase * 7 + 1) * (ranges.maxWidthRatio - ranges.minWidthRatio);
        const heightRatio = ranges.minHeightRatio + 
          deterministicRandom(seedBase * 7 + 2) * (ranges.maxHeightRatio - ranges.minHeightRatio);

        const sw = Math.floor(basePieceWidth * widthRatio);
        const sh = Math.floor(basePieceHeight * heightRatio);
        const sx = col * basePieceWidth;
        const sy = row * basePieceHeight;

        const pieceKey = `specimen-${specimen.id}-${suffix}-piece-${i}`;
        if (!scene.textures.exists(pieceKey)) {
          const pieceCanvas = this.createPieceCanvas(
            canvas,
            sx,
            sy,
            sw,
            sh
          );
          scene.textures.addCanvas(pieceKey, pieceCanvas);
        }
        pieceKeys.push(pieceKey);
      }
    }

    return {
      targetTextureKey: targetKey,
      previewTextureKey: previewKey,
      pieceKeys: pieceKeys,
      pieceWidth: basePieceWidth,
      pieceHeight: basePieceHeight
    };
  }

  static getPieceTextureKey(specimenId: number, levelId: number | undefined, pieceIndex: number): string {
    if (levelId !== undefined) {
      const customKey = `specimen-${specimenId}-lv${levelId}-piece-${pieceIndex}`;
      const scene = (globalThis as any).__phaserScene;
      if (scene && scene.textures && scene.textures.exists(customKey)) {
        return customKey;
      }
    }
    return `specimen-${specimenId}-piece-${pieceIndex}`;
  }

  private static drawSpecimenBackground(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#f5f0e1';
    ctx.fillRect(0, 0, SPECIMEN_WIDTH, SPECIMEN_HEIGHT);

    ctx.fillStyle = 'rgba(210, 180, 140, 0.1)';
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * SPECIMEN_WIDTH;
      const y = Math.random() * SPECIMEN_HEIGHT;
      const r = Math.random() * 3 + 1;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private static drawSpecimenFrame(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = '#5d4037';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, SPECIMEN_WIDTH - 8, SPECIMEN_HEIGHT - 8);

    ctx.strokeStyle = '#8d6e63';
    ctx.lineWidth = 2;
    ctx.strokeRect(12, 12, SPECIMEN_WIDTH - 24, SPECIMEN_HEIGHT - 24);
  }

  private static createPieceCanvas(
    sourceCanvas: HTMLCanvasElement,
    sx: number,
    sy: number,
    sw: number,
    sh: number
  ): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = sw + 8;
    canvas.height = sh + 8;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    this.drawRoundedRect(ctx, 0, 0, canvas.width, canvas.height, 6);
    ctx.fill();

    ctx.drawImage(sourceCanvas, sx, sy, sw, sh, 4, 4, sw, sh);

    ctx.strokeStyle = 'rgba(100, 100, 100, 0.4)';
    ctx.lineWidth = 2;
    this.drawRoundedRect(ctx, 0, 0, canvas.width, canvas.height, 6);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
    ctx.lineWidth = 1;
    this.drawRoundedRect(ctx, 3, 3, canvas.width - 6, canvas.height - 6, 4);
    ctx.stroke();

    return canvas;
  }

  private static drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  private static drawPlantOnCanvas(
    ctx: CanvasRenderingContext2D,
    specimen: PlantSpecimen
  ): void {
    const cx = SPECIMEN_WIDTH / 2;
    const cy = SPECIMEN_HEIGHT / 2;

    ctx.save();

    switch (specimen.shape) {
      case 'ginkgo':
        this.drawGinkgo(ctx, cx, cy, specimen);
        break;
      case 'rose':
        this.drawRose(ctx, cx, cy, specimen);
        break;
      case 'sunflower':
        this.drawSunflower(ctx, cx, cy, specimen);
        break;
      case 'lavender':
        this.drawLavender(ctx, cx, cy, specimen);
        break;
      case 'orchid':
        this.drawOrchid(ctx, cx, cy, specimen);
        break;
      case 'succulent':
        this.drawSucculent(ctx, cx, cy, specimen);
        break;
    }

    ctx.restore();

    this.addLabel(ctx, specimen);
  }

  private static addLabel(
    ctx: CanvasRenderingContext2D,
    specimen: PlantSpecimen
  ): void {
    ctx.fillStyle = 'rgba(93, 64, 55, 0.9)';
    ctx.fillRect(30, SPECIMEN_HEIGHT - 55, 200, 30);

    ctx.font = 'bold 14px serif';
    ctx.fillStyle = '#f5f0e1';
    ctx.fillText(`${specimen.name}  ${specimen.family}`, 42, SPECIMEN_HEIGHT - 35);
  }

  private static hexToRgb(hex: number): { r: number; g: number; b: number } {
    return {
      r: (hex >> 16) & 255,
      g: (hex >> 8) & 255,
      b: hex & 255
    };
  }

  private static rgbToString(rgb: { r: number; g: number; b: number }, alpha: number = 1): string {
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
  }

  private static lightenColor(hex: number, amount: number): string {
    const rgb = this.hexToRgb(hex);
    return this.rgbToString({
      r: Math.min(255, rgb.r + amount),
      g: Math.min(255, rgb.g + amount),
      b: Math.min(255, rgb.b + amount)
    });
  }

  private static darkenColor(hex: number, amount: number): string {
    const rgb = this.hexToRgb(hex);
    return this.rgbToString({
      r: Math.max(0, rgb.r - amount),
      g: Math.max(0, rgb.g - amount),
      b: Math.max(0, rgb.b - amount)
    });
  }

  private static drawGinkgo(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    s: PlantSpecimen
  ): void {
    ctx.save();

    ctx.fillStyle = this.darkenColor(s.stemColor, 10);
    ctx.fillRect(cx - 4, cy + 20, 8, 120);

    const gradient = ctx.createRadialGradient(cx, cy - 20, 10, cx, cy - 20, 150);
    gradient.addColorStop(0, this.lightenColor(s.primaryColor, 30));
    gradient.addColorStop(0.7, this.rgbToString(this.hexToRgb(s.primaryColor)));
    gradient.addColorStop(1, this.darkenColor(s.secondaryColor, 20));
    ctx.fillStyle = gradient;

    ctx.beginPath();
    ctx.moveTo(cx, cy + 50);
    ctx.bezierCurveTo(cx - 130, cy + 30, cx - 150, cy - 80, cx - 80, cy - 120);
    ctx.bezierCurveTo(cx - 30, cy - 150, cx + 30, cy - 150, cx + 80, cy - 120);
    ctx.bezierCurveTo(cx + 150, cy - 80, cx + 130, cy + 30, cx, cy + 50);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = this.darkenColor(s.primaryColor, 60);
    ctx.lineWidth = 1.5;
    for (let i = -4; i <= 4; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + i * 25, cy + 30);
      const endX = cx + i * 40;
      const endY = cy - 60 - Math.abs(i) * 5;
      ctx.quadraticCurveTo(cx + i * 30, cy - 10, endX, endY);
      ctx.stroke();
    }

    ctx.strokeStyle = this.darkenColor(s.primaryColor, 40);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 50);
    ctx.lineTo(cx, cy - 130);
    ctx.stroke();

    ctx.restore();
  }

  private static drawRose(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    s: PlantSpecimen
  ): void {
    ctx.save();

    ctx.fillStyle = this.rgbToString(this.hexToRgb(s.leafColor));
    ctx.beginPath();
    ctx.ellipse(cx - 55, cy + 80, 35, 18, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 55, cy + 100, 35, 18, 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = this.darkenColor(s.leafColor, 30);
    ctx.fillRect(cx - 5, cy + 30, 10, 110);

    ctx.strokeStyle = this.darkenColor(s.leafColor, 20);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 55, cy + 80);
    ctx.lineTo(cx - 20, cy + 85);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 55, cy + 100);
    ctx.lineTo(cx + 20, cy + 100);
    ctx.stroke();

    const layers = 5;
    for (let layer = layers; layer >= 0; layer--) {
      const scale = 1 - layer * 0.12;
      const petals = 8 + layer;
      const color = layer % 2 === 0 ? s.primaryColor : s.secondaryColor;
      const lighten = layer * 15;

      for (let i = 0; i < petals; i++) {
        const angle = (i / petals) * Math.PI * 2 + layer * 0.3;
        const dist = 25 * scale;
        const px = cx + Math.cos(angle) * dist * 0.5;
        const py = cy - 30 + Math.sin(angle) * dist * 0.5;

        const petalGradient = ctx.createRadialGradient(px, py, 2, px, py, 35 * scale);
        petalGradient.addColorStop(0, this.lightenColor(color, lighten));
        petalGradient.addColorStop(0.6, this.rgbToString(this.hexToRgb(color), 0.9));
        petalGradient.addColorStop(1, this.darkenColor(color, 20));
        ctx.fillStyle = petalGradient;

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.ellipse(20 * scale, 0, 25 * scale, 15 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    const centerGradient = ctx.createRadialGradient(cx, cy - 30, 2, cx, cy - 30, 20);
    centerGradient.addColorStop(0, this.darkenColor(s.primaryColor, 30));
    centerGradient.addColorStop(1, this.darkenColor(s.primaryColor, 60));
    ctx.fillStyle = centerGradient;
    ctx.beginPath();
    ctx.arc(cx, cy - 30, 15, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private static drawSunflower(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    s: PlantSpecimen
  ): void {
    ctx.save();

    ctx.fillStyle = this.rgbToString(this.hexToRgb(s.leafColor));
    ctx.beginPath();
    ctx.ellipse(cx - 65, cy + 90, 40, 22, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = this.darkenColor(s.leafColor, 30);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 65, cy + 90);
    ctx.lineTo(cx - 10, cy + 75);
    ctx.stroke();

    ctx.fillStyle = this.darkenColor(s.leafColor, 20);
    ctx.fillRect(cx - 6, cy + 20, 12, 130);

    const petalCount = 28;
    for (let i = 0; i < petalCount; i++) {
      const angle = (i / petalCount) * Math.PI * 2;
      const dist = 70;
      const px = cx + Math.cos(angle) * dist * 0.5;
      const py = cy - 40 + Math.sin(angle) * dist * 0.5;

      const petalGradient = ctx.createRadialGradient(px, py, 5, px, py, 55);
      petalGradient.addColorStop(0, this.lightenColor(s.primaryColor, 40));
      petalGradient.addColorStop(0.5, this.rgbToString(this.hexToRgb(s.primaryColor)));
      petalGradient.addColorStop(1, this.rgbToString(this.hexToRgb(s.secondaryColor), 0.8));
      ctx.fillStyle = petalGradient;

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.quadraticCurveTo(50, -4, 55, 0);
      ctx.quadraticCurveTo(50, 4, 0, 8);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    for (let i = 0; i < petalCount / 2; i++) {
      const angle = (i / (petalCount / 2)) * Math.PI * 2 + 0.1;
      const dist = 90;
      const px = cx + Math.cos(angle) * dist * 0.5;
      const py = cy - 40 + Math.sin(angle) * dist * 0.5;

      ctx.fillStyle = this.rgbToString(this.hexToRgb(s.secondaryColor), 0.7);

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, -5);
      ctx.quadraticCurveTo(40, -2, 45, 0);
      ctx.quadraticCurveTo(40, 2, 0, 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    const centerGradient = ctx.createRadialGradient(cx, cy - 40, 5, cx, cy - 40, 60);
    centerGradient.addColorStop(0, this.darkenColor(0x5d4037, 20));
    centerGradient.addColorStop(0.7, '#5d4037');
    centerGradient.addColorStop(1, this.lightenColor(0x5d4037, 20));
    ctx.fillStyle = centerGradient;
    ctx.beginPath();
    ctx.arc(cx, cy - 40, 55, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#3e2723';
    for (let ring = 0; ring < 5; ring++) {
      const ringRadius = 10 + ring * 9;
      const count = 8 + ring * 6;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + ring * 0.5;
        const px = cx + Math.cos(angle) * ringRadius;
        const py = cy - 40 + Math.sin(angle) * ringRadius;
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  private static drawLavender(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    s: PlantSpecimen
  ): void {
    ctx.save();

    const bottomY = cy + 120;
    for (let i = 0; i < 8; i++) {
      const lx = cx - 80 + i * 23;
      const ly = bottomY - 5 + Math.sin(i * 0.8) * 8;
      ctx.fillStyle = this.rgbToString(this.hexToRgb(s.leafColor), 0.85);
      ctx.beginPath();
      ctx.ellipse(lx, ly, 18, 6, i * 0.2 - 0.6, 0, Math.PI * 2);
      ctx.fill();
    }

    const stems = [
      { offsetX: -55, height: 1.0 },
      { offsetX: -22, height: 0.88 },
      { offsetX: 0, height: 1.0 },
      { offsetX: 22, height: 0.92 },
      { offsetX: 55, height: 0.95 }
    ];

    stems.forEach((stem, idx) => {
      const sx = cx + stem.offsetX;
      const stemTopY = cy - 60 + idx * 8;

      ctx.strokeStyle = this.darkenColor(s.leafColor, 10);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sx, bottomY);
      ctx.quadraticCurveTo(sx + stem.offsetX * 0.3, cy, sx, stemTopY);
      ctx.stroke();

      const flowerCount = 10;
      for (let j = 0; j < flowerCount; j++) {
        const t = j / flowerCount;
        const easeT = 1 - Math.pow(1 - t, 2);
        const fy = bottomY - easeT * (bottomY - stemTopY);
        const curveOffset = Math.sin(t * Math.PI) * stem.offsetX * 0.3;
        const fsize = (flowerCount - j) * 2.5 + 4;
        const alpha = 0.95 - j * 0.03;

        const colorShift = j * 8;
        ctx.fillStyle = `rgba(${Math.min(255, 156 + colorShift)}, ${Math.min(255, 39 + colorShift * 0.5)}, ${Math.min(255, 176 + colorShift)}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(sx + curveOffset, fy, fsize, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.3})`;
        ctx.beginPath();
        ctx.arc(sx + curveOffset - fsize * 0.25, fy - fsize * 0.25, fsize * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    ctx.restore();
  }

  private static drawOrchid(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    s: PlantSpecimen
  ): void {
    ctx.save();

    ctx.fillStyle = this.rgbToString(this.hexToRgb(s.leafColor));
    ctx.beginPath();
    ctx.ellipse(cx - 55, cy + 100, 45, 14, -0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 55, cy + 115, 45, 14, 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = this.darkenColor(s.stemColor, 10);
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, cy + 95);
    ctx.quadraticCurveTo(cx + 10, cy + 40, cx - 5, cy - 20);
    ctx.stroke();

    const flowerCy = cy - 30;

    const petalConfigs = [
      { angle: -Math.PI / 2, length: 70, width: 30, color: s.primaryColor },
      { angle: -Math.PI / 6, length: 55, width: 32, color: s.secondaryColor },
      { angle: Math.PI / 6, length: 55, width: 32, color: s.secondaryColor },
      { angle: Math.PI * 0.85, length: 48, width: 25, color: s.primaryColor },
      { angle: -Math.PI * 0.85, length: 48, width: 25, color: s.primaryColor }
    ];

    petalConfigs.forEach((config, i) => {
      const px = cx + Math.cos(config.angle) * config.length * 0.5;
      const py = flowerCy + Math.sin(config.angle) * config.length * 0.5;

      const gradient = ctx.createRadialGradient(px, py, 5, px, py, config.length);
      gradient.addColorStop(0, this.lightenColor(config.color, 30));
      gradient.addColorStop(0.5, this.rgbToString(this.hexToRgb(config.color), 0.95));
      gradient.addColorStop(1, this.darkenColor(config.color, 15));
      ctx.fillStyle = gradient;

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(config.angle);
      ctx.beginPath();
      ctx.ellipse(config.length * 0.4, 0, config.length * 0.5, config.width * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = this.darkenColor(config.color, 30);
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.restore();
    });

    ctx.fillStyle = this.lightenColor(s.primaryColor, 20);
    ctx.beginPath();
    ctx.moveTo(cx, flowerCy - 10);
    ctx.quadraticCurveTo(cx + 30, flowerCy + 15, cx + 15, flowerCy + 40);
    ctx.quadraticCurveTo(cx, flowerCy + 30, cx, flowerCy + 20);
    ctx.quadraticCurveTo(cx - 15, flowerCy + 30, cx - 15, flowerCy + 40);
    ctx.quadraticCurveTo(cx - 30, flowerCy + 15, cx, flowerCy - 10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = this.darkenColor(s.primaryColor, 30);
    ctx.lineWidth = 1;
    ctx.stroke();

    const centerGrad = ctx.createRadialGradient(cx - 3, flowerCy + 5, 2, cx, flowerCy + 10, 12);
    centerGrad.addColorStop(0, '#fffde7');
    centerGrad.addColorStop(0.5, '#fff59d');
    centerGrad.addColorStop(1, '#fdd835');
    ctx.fillStyle = centerGrad;
    ctx.beginPath();
    ctx.arc(cx - 3, flowerCy + 10, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e65100';
    ctx.beginPath();
    ctx.arc(cx - 3, flowerCy + 10, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private static drawSucculent(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    s: PlantSpecimen
  ): void {
    ctx.save();

    const potTopY = cy + 85;
    const potBottomY = cy + 145;
    ctx.fillStyle = '#795548';
    ctx.beginPath();
    ctx.moveTo(cx - 70, potTopY);
    ctx.lineTo(cx + 70, potTopY);
    ctx.lineTo(cx + 55, potBottomY);
    ctx.lineTo(cx - 55, potBottomY);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#5d4037';
    ctx.fillRect(cx - 75, potTopY - 8, 150, 12);

    ctx.strokeStyle = '#4e342e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 70, potTopY);
    ctx.lineTo(cx + 70, potTopY);
    ctx.moveTo(cx - 63, potTopY + 15);
    ctx.lineTo(cx + 63, potTopY + 15);
    ctx.moveTo(cx - 58, potTopY + 30);
    ctx.lineTo(cx + 58, potTopY + 30);
    ctx.stroke();

    ctx.fillStyle = '#6d4c41';
    for (let i = 0; i < 20; i++) {
      const px = cx - 50 + Math.random() * 100;
      const py = potTopY + 5 + Math.random() * 45;
      ctx.beginPath();
      ctx.arc(px, py, 2 + Math.random() * 4, 0, Math.PI * 2);
      ctx.fill();
    }

    const layers = [
      { leaves: 10, scale: 1.0, offsetY: 55, rotateOffset: 0 },
      { leaves: 8, scale: 0.78, offsetY: 45, rotateOffset: 0.2 },
      { leaves: 6, scale: 0.56, offsetY: 30, rotateOffset: 0.1 },
      { leaves: 5, scale: 0.38, offsetY: 15, rotateOffset: 0.15 }
    ];

    layers.forEach((layer, layerIdx) => {
      for (let i = 0; i < layer.leaves; i++) {
        const angle = (i / layer.leaves) * Math.PI * 2 + layer.rotateOffset;
        const leafLength = 75 * layer.scale;
        const leafWidth = 26 * layer.scale;
        const baseDist = 5 + layerIdx * 3;

        const baseX = cx + Math.cos(angle) * baseDist;
        const baseY = cy + layer.offsetY + Math.sin(angle) * baseDist * 0.3;
        const tipX = cx + Math.cos(angle) * leafLength;
        const tipY = cy + layer.offsetY - leafLength * 0.5 + Math.sin(angle) * leafLength * 0.3;

        const perpAngle = angle + Math.PI / 2;

        const colorAmount = layerIdx * 12 + i * 3;
        const leafGradient = ctx.createLinearGradient(baseX, baseY, tipX, tipY);
        leafGradient.addColorStop(0, this.darkenColor(s.primaryColor, 10 + colorAmount * 0.3));
        leafGradient.addColorStop(0.5, this.rgbToString(this.hexToRgb(s.primaryColor)));
        leafGradient.addColorStop(1, this.lightenColor(s.secondaryColor, colorAmount));
        ctx.fillStyle = leafGradient;

        ctx.beginPath();
        ctx.moveTo(baseX, baseY);
        ctx.quadraticCurveTo(
          baseX + Math.cos(perpAngle) * leafWidth,
          baseY + Math.sin(perpAngle) * leafWidth * 0.5,
          tipX,
          tipY
        );
        ctx.quadraticCurveTo(
          baseX + Math.cos(perpAngle + Math.PI) * leafWidth,
          baseY + Math.sin(perpAngle + Math.PI) * leafWidth * 0.5,
          baseX,
          baseY
        );
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = this.darkenColor(s.primaryColor, 25 + layerIdx * 8);
        ctx.lineWidth = 0.8 + layerIdx * 0.2;
        ctx.beginPath();
        ctx.moveTo(baseX, baseY);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();

        if (i % 2 === 0) {
          const tipRgb = this.hexToRgb(s.leafColor);
          tipRgb.r = Math.max(0, tipRgb.r - 10);
          tipRgb.g = Math.max(0, tipRgb.g - 10);
          tipRgb.b = Math.max(0, tipRgb.b - 10);
          ctx.fillStyle = this.rgbToString(tipRgb, 0.6);
          ctx.beginPath();
          ctx.arc(tipX, tipY, 2.5 + layerIdx * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });

    const centerGrad = ctx.createRadialGradient(cx, cy + 20, 2, cx, cy + 20, 25);
    centerGrad.addColorStop(0, this.lightenColor(s.primaryColor, 20));
    centerGrad.addColorStop(0.5, this.rgbToString(this.hexToRgb(s.primaryColor)));
    centerGrad.addColorStop(1, this.darkenColor(s.primaryColor, 15));
    ctx.fillStyle = centerGrad;
    ctx.beginPath();
    ctx.arc(cx, cy + 20, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
