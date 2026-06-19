import Phaser from 'phaser';
import { PuzzlePieceData } from '../types/GameTypes';

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
}
