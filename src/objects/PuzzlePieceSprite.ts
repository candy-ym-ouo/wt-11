import Phaser from 'phaser';
import { PuzzlePiece } from '../types/GameTypes';
import { SnapConfig } from '../config/GameConfig';

export class PuzzlePieceSprite extends Phaser.GameObjects.Container {
  private pieceData: PuzzlePiece;
  private pieceGraphics: Phaser.GameObjects.Graphics;
  private isDragging: boolean = false;
  private isSnapped: boolean = false;
  private targetX: number;
  private targetY: number;
  private targetRotation: number;
  private dragOffsetX: number = 0;
  private dragOffsetY: number = 0;
  private originalX: number;
  private originalY: number;
  private highlight!: Phaser.GameObjects.Graphics;
  private pieceColor: number;

  constructor(
    scene: Phaser.Scene,
    pieceData: PuzzlePiece,
    targetX: number,
    targetY: number,
    targetRotation: number
  ) {
    super(scene, pieceData.x, pieceData.y);
    this.pieceData = pieceData;
    this.targetX = targetX;
    this.targetY = targetY;
    this.targetRotation = targetRotation;
    this.originalX = pieceData.x;
    this.originalY = pieceData.y;

    const colors = [0xffd700, 0xff9800, 0xe91e63, 0x9c27b0, 0x2196f3, 0x00bcd4, 0x4caf50, 0x8bc34a];
    this.pieceColor = colors[pieceData.frameIndex % colors.length];

    this.pieceGraphics = this.scene.add.graphics();
    this.drawPiece();
    this.add(this.pieceGraphics);

    this.setSize(pieceData.width, pieceData.height);
    this.setInteractive({ useHandCursor: true });

    this.createHighlight();
    this.setupInputHandlers();

    const randomRotation = Phaser.Math.Between(0, 3) * 90;
    this.rotation = Phaser.Math.DegToRad(randomRotation);

    scene.add.existing(this);
  }

  private drawPiece(): void {
    const w = this.pieceData.width;
    const h = this.pieceData.height;

    this.pieceGraphics.clear();

    this.pieceGraphics.fillStyle(this.pieceColor, 0.9);
    this.pieceGraphics.fillRoundedRect(-w / 2, -h / 2, w, h, 8);

    this.pieceGraphics.lineStyle(3, 0x333333, 0.4);
    this.pieceGraphics.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);

    this.pieceGraphics.fillStyle(this.lightenColor(this.pieceColor, 30), 0.7);
    const patternSize = Math.min(w, h) * 0.35;
    const variant = this.pieceData.frameIndex % 4;

    switch (variant) {
      case 0:
        this.pieceGraphics.beginPath();
        this.pieceGraphics.arc(0, 0, patternSize / 2, 0, Math.PI * 2);
        this.pieceGraphics.fillPath();
        break;
      case 1:
        this.pieceGraphics.fillRoundedRect(-patternSize / 2, -patternSize / 2, patternSize, patternSize, 4);
        break;
      case 2:
        this.pieceGraphics.beginPath();
        this.pieceGraphics.moveTo(0, -patternSize / 2);
        this.pieceGraphics.lineTo(patternSize / 2, patternSize / 2);
        this.pieceGraphics.lineTo(-patternSize / 2, patternSize / 2);
        this.pieceGraphics.closePath();
        this.pieceGraphics.fillPath();
        break;
      case 3:
        this.pieceGraphics.beginPath();
        this.pieceGraphics.moveTo(0, -patternSize / 2);
        this.pieceGraphics.lineTo(patternSize / 2, 0);
        this.pieceGraphics.lineTo(0, patternSize / 2);
        this.pieceGraphics.lineTo(-patternSize / 2, 0);
        this.pieceGraphics.closePath();
        this.pieceGraphics.fillPath();
        break;
    }
  }

  private lightenColor(color: number, amount: number): number {
    const r = Math.min(255, ((color >> 16) & 0xff) + amount);
    const g = Math.min(255, ((color >> 8) & 0xff) + amount);
    const b = Math.min(255, (color & 0xff) + amount);
    return (r << 16) | (g << 8) | b;
  }

  private createHighlight(): void {
    this.highlight = this.scene.add.graphics();
    this.highlight.lineStyle(3, 0x4caf50, 0);
    this.highlight.strokeRoundedRect(
      -this.pieceData.width / 2,
      -this.pieceData.height / 2,
      this.pieceData.width,
      this.pieceData.height,
      8
    );
    this.add(this.highlight);
  }

  private setupInputHandlers(): void {
    this.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isSnapped) return;
      this.startDrag(pointer);
    });

    this.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging) {
        this.onDrag(pointer);
      }
    });

    this.on('pointerup', () => {
      if (this.isDragging) {
        this.endDrag();
      }
    });

    this.on('pointerupoutside', () => {
      if (this.isDragging) {
        this.endDrag();
      }
    });
  }

  private startDrag(pointer: Phaser.Input.Pointer): void {
    this.isDragging = true;
    this.scene.children.bringToTop(this);

    const localPoint = this.getLocalPoint(pointer.x, pointer.y);
    this.dragOffsetX = localPoint.x;
    this.dragOffsetY = localPoint.y;

    this.setAlpha(0.85);
    this.setScale(1.05);
  }

  private onDrag(pointer: Phaser.Input.Pointer): void {
    this.x = pointer.x - this.dragOffsetX * this.scaleX;
    this.y = pointer.y - this.dragOffsetY * this.scaleY;
    this.checkSnapProximity();
  }

  private endDrag(): void {
    this.isDragging = false;
    this.setAlpha(1);
    this.setScale(1);

    if (this.canSnap()) {
      this.snap();
    }
  }

  private checkSnapProximity(): void {
    const dist = Phaser.Math.Distance.Between(this.x, this.y, this.targetX, this.targetY);
    const angleDiff = this.getAngleDifference();

    if (dist < SnapConfig.positionThreshold * 2 && angleDiff < SnapConfig.rotationThreshold * 2) {
      this.highlight.lineStyle(3, 0x4caf50, 0.6);
    } else {
      this.highlight.lineStyle(3, 0x4caf50, 0);
    }
  }

  private getAngleDifference(): number {
    let diff = Math.abs(Phaser.Math.RadToDeg(this.rotation) - this.targetRotation) % 360;
    if (diff > 180) diff = 360 - diff;
    return diff;
  }

  private canSnap(): boolean {
    const dist = Phaser.Math.Distance.Between(this.x, this.y, this.targetX, this.targetY);
    const angleDiff = this.getAngleDifference();

    return dist < SnapConfig.positionThreshold && angleDiff < SnapConfig.rotationThreshold;
  }

  private snap(): void {
    this.isSnapped = true;
    this.disableInteractive();

    this.scene.tweens.add({
      targets: this,
      x: this.targetX,
      y: this.targetY,
      rotation: Phaser.Math.DegToRad(this.targetRotation),
      scale: 1,
      alpha: 1,
      duration: SnapConfig.snapAnimationDuration,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.highlight.lineStyle(3, 0x4caf50, 0);
        this.scene.events.emit('piece-snapped', this.pieceData.id);
      }
    });
  }

  rotatePiece(): void {
    if (this.isSnapped) return;
    this.scene.tweens.add({
      targets: this,
      rotation: this.rotation + Phaser.Math.DegToRad(90),
      duration: 150,
      ease: 'Cubic.easeOut'
    });
  }

  isPieceSnapped(): boolean {
    return this.isSnapped;
  }

  getPieceId(): number {
    return this.pieceData.id;
  }

  reset(): void {
    this.isSnapped = false;
    this.setInteractive();
    this.x = this.originalX;
    this.y = this.originalY;
    const randomRotation = Phaser.Math.Between(0, 3) * 90;
    this.rotation = Phaser.Math.DegToRad(randomRotation);
    this.highlight.lineStyle(3, 0x4caf50, 0);
    this.setAlpha(1);
    this.setScale(1);
  }
}
