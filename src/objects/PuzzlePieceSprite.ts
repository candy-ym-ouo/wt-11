import Phaser from 'phaser';
import { PuzzlePieceData } from '../types/GameTypes';
import { HintConfig } from '../config/GameConfig';

export class PuzzlePieceSprite extends Phaser.GameObjects.Container {
  private pieceData: PuzzlePieceData;
  private pieceImage: Phaser.GameObjects.Image;
  private isDragging: boolean = false;
  private isSnapped: boolean = false;
  private isSelected: boolean = false;
  private targetX: number;
  private targetY: number;
  private targetRotation: number = 0;
  private dragOffsetX: number = 0;
  private dragOffsetY: number = 0;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private hasMoved: boolean = false;
  private initialX: number;
  private initialY: number;
  private highlightBorder!: Phaser.GameObjects.Graphics;
  private selectedGlow!: Phaser.GameObjects.Graphics;
  private snapThreshold: { position: number; rotation: number };
  private _isMirror: boolean = false;
  private outlineFlashTween: Phaser.Tweens.Tween | null = null;
  private highlightTween: Phaser.Tweens.Tween | null = null;
  private targetIndicatorGraphics: Phaser.GameObjects.Graphics | null = null;
  private targetIndicatorTween: Phaser.Tweens.Tween | null = null;
  private pieceHighlightGraphics: Phaser.GameObjects.Graphics | null = null;

  private static selectedPiece: PuzzlePieceSprite | null = null;

  constructor(
    scene: Phaser.Scene,
    pieceData: PuzzlePieceData,
    snapThreshold: { position: number; rotation: number }
  ) {
    super(scene, pieceData.initialX, pieceData.initialY);
    this.pieceData = pieceData;
    this.targetX = pieceData.targetX;
    this.targetY = pieceData.targetY;
    this.initialX = pieceData.initialX;
    this.initialY = pieceData.initialY;
    this.snapThreshold = snapThreshold;

    this.pieceImage = this.scene.add.image(0, 0, pieceData.textureKey);
    this.pieceImage.setDisplaySize(pieceData.width + 8, pieceData.height + 8);
    this.add(this.pieceImage);

    this.setSize(pieceData.width, pieceData.height);
    this.setInteractive({ useHandCursor: true, pixelPerfect: false });

    this.createEffects();
    this.setupInputHandlers();

    const randomRotation = Phaser.Math.Between(0, 3) * 90;
    this.rotation = Phaser.Math.DegToRad(randomRotation);

    scene.add.existing(this);
  }

  private createEffects(): void {
    this.highlightBorder = this.scene.add.graphics();
    this.highlightBorder.lineStyle(3, 0x4caf50, 0);
    this.drawRoundedRect(
      this.highlightBorder,
      -this.pieceData.width / 2 - 2,
      -this.pieceData.height / 2 - 2,
      this.pieceData.width + 4,
      this.pieceData.height + 4,
      8
    );
    this.highlightBorder.strokePath();
    this.add(this.highlightBorder);

    this.selectedGlow = this.scene.add.graphics();
    this.selectedGlow.lineStyle(4, 0x2196f3, 0);
    this.drawRoundedRect(
      this.selectedGlow,
      -this.pieceData.width / 2 - 6,
      -this.pieceData.height / 2 - 6,
      this.pieceData.width + 12,
      this.pieceData.height + 12,
      12
    );
    this.selectedGlow.strokePath();

    this.selectedGlow.fillStyle(0x2196f3, 0.12);
    this.drawRoundedRect(
      this.selectedGlow,
      -this.pieceData.width / 2 - 6,
      -this.pieceData.height / 2 - 6,
      this.pieceData.width + 12,
      this.pieceData.height + 12,
      12
    );
    this.selectedGlow.fillPath();
    this.add(this.selectedGlow);
  }

  private drawRoundedRect(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ): void {
    g.beginPath();
    g.moveTo(x + r, y);
    g.lineTo(x + w - r, y);
    g.arc(x + w - r, y + r, r, -Math.PI / 2, 0);
    g.lineTo(x + w, y + h - r);
    g.arc(x + w - r, y + h - r, r, 0, Math.PI / 2);
    g.lineTo(x + r, y + h);
    g.arc(x + r, y + h - r, r, Math.PI / 2, Math.PI);
    g.lineTo(x, y + r);
    g.arc(x + r, y + r, r, Math.PI, Math.PI * 1.5);
    g.closePath();
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

    this.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging) {
        this.endDrag(pointer);
      }
    });

    this.on('pointerupoutside', (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging) {
        this.endDrag(pointer);
      }
    });
  }

  private startDrag(pointer: Phaser.Input.Pointer): void {
    this.isDragging = true;
    this.hasMoved = false;
    this.dragStartX = pointer.x;
    this.dragStartY = pointer.y;

    this.setSelected(true);
    this.scene.children.bringToTop(this);

    const localPoint = this.getLocalPoint(pointer.x, pointer.y);
    this.dragOffsetX = localPoint.x;
    this.dragOffsetY = localPoint.y;

    this.setAlpha(0.92);
    this.setScale(1.03);
  }

  private onDrag(pointer: Phaser.Input.Pointer): void {
    const moveDist = Phaser.Math.Distance.Between(
      pointer.x,
      pointer.y,
      this.dragStartX,
      this.dragStartY
    );
    if (moveDist > 5) {
      this.hasMoved = true;
    }

    this.x = pointer.x - this.dragOffsetX * this.scaleX;
    this.y = pointer.y - this.dragOffsetY * this.scaleY;
    this.checkSnapProximity();
  }

  private endDrag(_pointer: Phaser.Input.Pointer): void {
    this.isDragging = false;
    this.setAlpha(1);
    this.setScale(1);

    if (this.canSnap()) {
      this.snap();
    } else if (this.hasMoved && this._isMirror) {
      this.scene.events.emit('piece-missed', { pieceId: this.pieceData.id, piece: this });
    } else if (this.hasMoved) {
      this.scene.events.emit('piece-missed', { pieceId: this.pieceData.id, piece: this });
    }
  }

  private checkSnapProximity(): void {
    const [tx, ty] = this.getEffectiveTarget();
    const dist = Phaser.Math.Distance.Between(this.x, this.y, tx, ty);
    const angleDiff = this.getAngleDifference();

    if (dist < this.snapThreshold.position * 1.8 && angleDiff < this.snapThreshold.rotation * 1.8) {
      this.highlightBorder.lineStyle(3, 0x4caf50, 0.7);
    } else {
      this.highlightBorder.lineStyle(3, 0x4caf50, 0);
    }
    this.drawRoundedRect(
      this.highlightBorder,
      -this.pieceData.width / 2 - 2,
      -this.pieceData.height / 2 - 2,
      this.pieceData.width + 4,
      this.pieceData.height + 4,
      8
    );
    this.highlightBorder.strokePath();
  }

  private getEffectiveTarget(): [number, number] {
    const liveX = this.getData('liveTargetX');
    const liveY = this.getData('liveTargetY');
    if (liveX !== undefined && liveY !== undefined) {
      return [liveX as number, liveY as number];
    }
    return [this.targetX, this.targetY];
  }

  private getAngleDifference(): number {
    let diff = Math.abs(Phaser.Math.RadToDeg(this.rotation) - this.targetRotation) % 360;
    if (diff > 180) diff = 360 - diff;
    return diff;
  }

  canSnap(): boolean {
    const [tx, ty] = this.getEffectiveTarget();
    const dist = Phaser.Math.Distance.Between(this.x, this.y, tx, ty);
    const angleDiff = this.getAngleDifference();

    return dist < this.snapThreshold.position && angleDiff < this.snapThreshold.rotation;
  }

  private snap(): void {
    const [tx, ty] = this.getEffectiveTarget();
    const snapDistance = Phaser.Math.Distance.Between(this.x, this.y, tx, ty);
    const angleDiff = this.getAngleDifference();
    const isPerfect = snapDistance < this.snapThreshold.position * 0.3 && angleDiff < this.snapThreshold.rotation * 0.3;

    this.isSnapped = true;
    this.disableInteractive();
    this.setSelected(false);

    this.scene.tweens.add({
      targets: this,
      x: tx,
      y: ty,
      rotation: Phaser.Math.DegToRad(this.targetRotation),
      scale: 1,
      alpha: 1,
      duration: 220,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.highlightBorder.lineStyle(3, 0x4caf50, 0);
        this.drawRoundedRect(
          this.highlightBorder,
          -this.pieceData.width / 2 - 2,
          -this.pieceData.height / 2 - 2,
          this.pieceData.width + 4,
          this.pieceData.height + 4,
          8
        );
        this.highlightBorder.strokePath();
        this.scene.events.emit('piece-snapped', {
          pieceId: this.pieceData.id,
          piece: this,
          distance: snapDistance,
          isPerfect
        });
      }
    });
  }

  setSelected(selected: boolean): void {
    if (this.isSnapped) return;

    if (selected && PuzzlePieceSprite.selectedPiece && PuzzlePieceSprite.selectedPiece !== this) {
      PuzzlePieceSprite.selectedPiece.setSelected(false);
    }

    this.isSelected = selected;
    PuzzlePieceSprite.selectedPiece = selected ? this : (PuzzlePieceSprite.selectedPiece === this ? null : PuzzlePieceSprite.selectedPiece);

    this.selectedGlow.lineStyle(4, 0x2196f3, selected ? 1 : 0);
    this.selectedGlow.fillStyle(0x2196f3, selected ? 0.12 : 0);
    this.drawRoundedRect(
      this.selectedGlow,
      -this.pieceData.width / 2 - 6,
      -this.pieceData.height / 2 - 6,
      this.pieceData.width + 12,
      this.pieceData.height + 12,
      12
    );
    this.selectedGlow.strokePath();
    this.selectedGlow.fillPath();

    if (selected) {
      this.scene.children.bringToTop(this);
    }
  }

  static getSelectedPiece(): PuzzlePieceSprite | null {
    return PuzzlePieceSprite.selectedPiece;
  }

  static clearSelection(): void {
    if (PuzzlePieceSprite.selectedPiece) {
      PuzzlePieceSprite.selectedPiece.setSelected(false);
      PuzzlePieceSprite.selectedPiece = null;
    }
  }

  rotatePiece(): void {
    if (this.isSnapped) return;
    this.scene.tweens.add({
      targets: this,
      rotation: this.rotation + Phaser.Math.DegToRad(90),
      duration: 160,
      ease: 'Cubic.easeOut'
    });
  }

  isPieceSnapped(): boolean {
    return this.isSnapped;
  }

  setSnapped(snapped: boolean): void {
    this.isSnapped = snapped;
    if (snapped) {
      this.disableInteractive();
    } else {
      this.setInteractive();
    }
  }

  getPieceId(): number {
    return this.pieceData.id;
  }

  reset(): void {
    this.isSnapped = false;
    this.isSelected = false;
    this.setInteractive();
    this.x = this.initialX;
    this.y = this.initialY;
    const randomRotation = Phaser.Math.Between(0, 3) * 90;
    this.rotation = Phaser.Math.DegToRad(randomRotation);
    this.highlightBorder.lineStyle(3, 0x4caf50, 0);
    this.selectedGlow.lineStyle(4, 0x2196f3, 0);
    this.selectedGlow.fillStyle(0x2196f3, 0);
    this.setAlpha(1);
    this.setScale(1);
    PuzzlePieceSprite.selectedPiece = null;
  }

  updateInitialPosition(x: number, y: number): void {
    this.initialX = x;
    this.initialY = y;
  }

  set isMirror(value: boolean) {
    this._isMirror = value;
  }

  get isMirror(): boolean {
    return this._isMirror;
  }

  getTargetX(): number {
    return this.targetX;
  }

  getTargetY(): number {
    return this.targetY;
  }

  getSnapThreshold(): { position: number; rotation: number } {
    return this.snapThreshold;
  }

  startOutlineFlash(duration: number = HintConfig.outlineFlashDuration, flashCount: number = HintConfig.outlineFlashCount): void {
    this.stopOutlineFlash();

    const totalDuration = duration;
    const halfCycle = totalDuration / (flashCount * 2);

    this.outlineFlashTween = this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: halfCycle,
      yoyo: true,
      repeat: flashCount * 2 - 1,
      ease: 'Sine.easeInOut',
      onUpdate: (tween) => {
        const value = tween.getValue() ?? 0;
        this.highlightBorder.lineStyle(5, 0xffeb3b, value);
        this.drawRoundedRect(
          this.highlightBorder,
          -this.pieceData.width / 2 - 4,
          -this.pieceData.height / 2 - 4,
          this.pieceData.width + 8,
          this.pieceData.height + 8,
          10
        );
        this.highlightBorder.strokePath();
      },
      onComplete: () => {
        this.highlightBorder.lineStyle(3, 0x4caf50, 0);
        this.drawRoundedRect(
          this.highlightBorder,
          -this.pieceData.width / 2 - 2,
          -this.pieceData.height / 2 - 2,
          this.pieceData.width + 4,
          this.pieceData.height + 4,
          8
        );
        this.highlightBorder.strokePath();
        this.outlineFlashTween = null;
      }
    });
  }

  stopOutlineFlash(): void {
    if (this.outlineFlashTween) {
      this.outlineFlashTween.stop();
      this.outlineFlashTween = null;
      this.highlightBorder.lineStyle(3, 0x4caf50, 0);
      this.drawRoundedRect(
        this.highlightBorder,
        -this.pieceData.width / 2 - 2,
        -this.pieceData.height / 2 - 2,
        this.pieceData.width + 4,
        this.pieceData.height + 4,
        8
      );
      this.highlightBorder.strokePath();
    }
  }

  startPieceHighlight(duration: number = HintConfig.pieceHighlightDuration): void {
    this.stopPieceHighlight();

    if (!this.pieceHighlightGraphics) {
      this.pieceHighlightGraphics = this.scene.add.graphics();
      this.addAt(this.pieceHighlightGraphics, this.list.length);
    }

    const totalDuration = duration;
    const pulseDuration = 600;
    const repeatCount = Math.floor(totalDuration / pulseDuration) - 1;

    this.pieceHighlightGraphics!.clear();
    this.highlightTween = this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: pulseDuration / 2,
      yoyo: true,
      repeat: repeatCount * 2,
      ease: 'Sine.easeInOut',
      onUpdate: (tween) => {
        const value = tween.getValue() ?? 0;
        if (this.pieceHighlightGraphics) {
          this.pieceHighlightGraphics.clear();
          this.pieceHighlightGraphics.lineStyle(6, 0x00e5ff, 0.85 * value);
          this.drawRoundedRect(
            this.pieceHighlightGraphics,
            -this.pieceData.width / 2 - 10,
            -this.pieceData.height / 2 - 10,
            this.pieceData.width + 20,
            this.pieceData.height + 20,
            16
          );
          this.pieceHighlightGraphics.strokePath();

          this.pieceHighlightGraphics.fillStyle(0x00e5ff, 0.22 * value);
          this.drawRoundedRect(
            this.pieceHighlightGraphics,
            -this.pieceData.width / 2 - 10,
            -this.pieceData.height / 2 - 10,
            this.pieceData.width + 20,
            this.pieceData.height + 20,
            16
          );
          this.pieceHighlightGraphics.fillPath();
        }
      },
      onComplete: () => {
        this.stopPieceHighlight();
      }
    });
  }

  stopPieceHighlight(): void {
    if (this.highlightTween) {
      this.highlightTween.stop();
      this.highlightTween = null;
    }
    if (this.pieceHighlightGraphics) {
      this.pieceHighlightGraphics.clear();
      this.pieceHighlightGraphics.destroy();
      this.pieceHighlightGraphics = null;
    }
  }

  showTargetIndicator(duration: number = 3000): void {
    this.hideTargetIndicator();

    const [tx, ty] = this.getEffectiveTarget();

    this.targetIndicatorGraphics = this.scene.add.graphics();
    this.targetIndicatorGraphics.setDepth(this.depth + 5);

    const drawIndicator = (progress: number) => {
      if (!this.targetIndicatorGraphics) return;
      this.targetIndicatorGraphics.clear();

      const pulseSize = 1 + Math.sin(progress * Math.PI * 4) * 0.1;
      const alpha = 0.7 * (1 - Math.abs(progress - 0.5) * 2);

      this.targetIndicatorGraphics.lineStyle(4, 0x76ff03, alpha);
      const w = (this.pieceData.width + 16) * pulseSize;
      const h = (this.pieceData.height + 16) * pulseSize;
      this.drawRoundedRect(
        this.targetIndicatorGraphics,
        tx - w / 2,
        ty - h / 2,
        w,
        h,
        12
      );
      this.targetIndicatorGraphics.strokePath();

      this.targetIndicatorGraphics.lineStyle(2, 0xb2ff59, alpha * 0.6);
      this.targetIndicatorGraphics.beginPath();
      this.targetIndicatorGraphics.moveTo(this.x, this.y);
      this.targetIndicatorGraphics.lineTo(tx, ty);
      this.targetIndicatorGraphics.strokePath();
    };

    this.targetIndicatorTween = this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: duration,
      ease: 'Linear',
      onUpdate: (tween) => {
        drawIndicator(tween.getValue() ?? 0);
      },
      onComplete: () => {
        this.hideTargetIndicator();
      }
    });
  }

  hideTargetIndicator(): void {
    if (this.targetIndicatorTween) {
      this.targetIndicatorTween.stop();
      this.targetIndicatorTween = null;
    }
    if (this.targetIndicatorGraphics) {
      this.targetIndicatorGraphics.clear();
      this.targetIndicatorGraphics.destroy();
      this.targetIndicatorGraphics = null;
    }
  }

  clearAllHints(): void {
    this.stopOutlineFlash();
    this.stopPieceHighlight();
    this.hideTargetIndicator();
  }

  pauseAllHints(): void {
    if (this.outlineFlashTween) {
      this.outlineFlashTween.pause();
    }
    if (this.highlightTween) {
      this.highlightTween.pause();
    }
    if (this.targetIndicatorTween) {
      this.targetIndicatorTween.pause();
    }
  }

  resumeAllHints(): void {
    if (this.outlineFlashTween) {
      this.outlineFlashTween.resume();
    }
    if (this.highlightTween) {
      this.highlightTween.resume();
    }
    if (this.targetIndicatorTween) {
      this.targetIndicatorTween.resume();
    }
  }
}
