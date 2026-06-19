import Phaser from 'phaser';
import { PuzzlePieceSprite } from '../objects/PuzzlePieceSprite';
import { getPlantSpecimen } from '../data/PlantSpecimens';
import { SaveManager } from '../utils/SaveManager';
import { calculateScore, formatTime } from '../utils/GameUtils';
import { PlantSpecimen, PuzzlePieceData, TutorialStep, Reward, TutorialCompletionResult } from '../types/GameTypes';
import { TutorialManager } from '../utils/TutorialManager';
import { getTeachingLevelTutorial } from '../data/TutorialConfig';
import { AchievementNotification } from '../utils/AchievementNotification';

export class TutorialScene extends Phaser.Scene {
  private specimen!: PlantSpecimen;
  private pieces: PuzzlePieceSprite[] = [];
  private snappedCount: number = 0;
  private startTime: number = 0;
  private elapsedTime: number = 0;
  private isPaused: boolean = false;
  private isCompleted: boolean = false;
  private timerEvent!: Phaser.Time.TimerEvent;
  private timeText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private hintImage!: Phaser.GameObjects.Image;
  private showHint: boolean = false;
  private targetTextureKey!: string;
  private tutorialContainer!: Phaser.GameObjects.Container;
  private tutorialOverlay!: Phaser.GameObjects.Graphics;
  private tutorialBox!: Phaser.GameObjects.Graphics;
  private tutorialTitle!: Phaser.GameObjects.Text;
  private tutorialContent!: Phaser.GameObjects.Text;
  private nextButton!: Phaser.GameObjects.Graphics;
  private skipButton!: Phaser.GameObjects.Graphics;
  private highlightGraphics!: Phaser.GameObjects.Graphics;
  private arrowGraphics!: Phaser.GameObjects.Graphics;
  private progressIndicator!: Phaser.GameObjects.Text;
  private isDemoPlaying: boolean = false;
  private demoTween: Phaser.Tweens.Tween | null = null;
  private autoNextTimer: Phaser.Time.TimerEvent | null = null;

  private static readonly TARGET_AREA_X = 375;
  private static readonly TARGET_AREA_Y = 420;
  private static readonly TARGET_AREA_W = 500;
  private static readonly TARGET_AREA_H = 400;
  private static readonly PIECE_AREA_START_Y = 900;

  constructor() {
    super('TutorialScene');
  }

  init(): void {
    const tutorial = getTeachingLevelTutorial();
    const specimen = getPlantSpecimen(1);
    if (!specimen) {
      this.scene.start('ChapterSelectScene');
      return;
    }
    this.specimen = specimen;
    TutorialManager.startTeachingLevel();
  }

  create(): void {
    this.targetTextureKey = `specimen-${this.specimen.id}-target`;

    this.addBackground();
    this.addHeader();
    this.addTargetArea();
    this.createPuzzlePieces();
    this.addControlButtons();
    this.setupEvents();
    this.setupTutorialUI();
    this.setupTutorialListeners();
    this.showCurrentStep();
    this.startTimer();
  }

  private addBackground(): void {
    this.cameras.main.setBackgroundColor('#1a1a2e');
    const bg = this.add.graphics();
    bg.fillStyle(0x16213e, 1);
    bg.fillRect(0, 0, 750, 1334);
  }

  private addHeader(): void {
    const header = this.add.graphics();
    header.fillStyle(0x4caf50, 1);
    header.fillRect(0, 0, 750, 120);

    this.add.text(60, 40, '🎓 新手教学', {
      font: 'bold 28px Arial',
      color: '#ffffff'
    });

    this.add.text(60, 80, `${this.specimen.name}  ·  教学模式`, {
      font: '18px Arial',
      color: '#e8f5e9'
    });

    this.timeText = this.add.text(690, 45, '无限', {
      font: 'bold 32px Arial',
      color: '#ffffff'
    }).setOrigin(1, 0);

    this.scoreText = this.add.text(690, 85, '得分: 0', {
      font: '18px Arial',
      color: '#eaeaea'
    }).setOrigin(1, 0);

    const backBtn = this.add.graphics();
    backBtn.fillStyle(0xe94560, 1);
    backBtn.fillRoundedRect(20, 20, 50, 50, 10);
    backBtn.setInteractive(
      new Phaser.Geom.Rectangle(20, 20, 50, 50),
      Phaser.Geom.Rectangle.Contains
    );

    this.add.text(45, 45, '←', {
      font: 'bold 28px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    backBtn.on('pointerup', () => {
      this.showExitConfirm();
    });
  }

  private addTargetArea(): void {
    const x = TutorialScene.TARGET_AREA_X;
    const y = TutorialScene.TARGET_AREA_Y;
    const w = TutorialScene.TARGET_AREA_W;
    const h = TutorialScene.TARGET_AREA_H;

    const frame = this.add.graphics();
    frame.lineStyle(4, 0x4caf50, 0.7);
    frame.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 12);

    const dashPattern = [12, 8];
    frame.lineStyle(2, 0x4caf50, 0.3);
    this.drawDashedRect(frame, x - w / 2 + 8, y - h / 2 + 8, w - 16, h - 16, dashPattern);

    this.hintImage = this.add.image(x, y, this.targetTextureKey);
    this.hintImage.setDisplaySize(w - 24, h - 24);
    this.hintImage.setAlpha(0);
    this.hintImage.setDepth(0);

    this.add.text(x, y - h / 2 - 28, '标本目标区域', {
      font: 'bold 16px Arial',
      color: '#4caf50'
    }).setOrigin(0.5);
  }

  private drawDashedRect(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    w: number,
    h: number,
    pattern: number[]
  ): void {
    const [dash, gap] = pattern;
    g.beginPath();
    let cursor = 0;
    let draw = true;
    while (cursor < w) {
      const segment = draw ? dash : gap;
      const endX = Math.min(x + cursor + segment, x + w);
      if (draw) {
        g.moveTo(x + cursor, y);
        g.lineTo(endX, y);
      }
      cursor += segment;
      draw = !draw;
    }
    cursor = 0;
    draw = true;
    while (cursor < h) {
      const segment = draw ? dash : gap;
      const endY = Math.min(y + cursor + segment, y + h);
      if (draw) {
        g.moveTo(x + w, y + cursor);
        g.lineTo(x + w, endY);
      }
      cursor += segment;
      draw = !draw;
    }
    cursor = 0;
    draw = true;
    while (cursor < w) {
      const segment = draw ? dash : gap;
      const endX = Math.max(x + w - cursor - segment, x);
      if (draw) {
        g.moveTo(x + w - cursor, y + h);
        g.lineTo(endX, y + h);
      }
      cursor += segment;
      draw = !draw;
    }
    cursor = 0;
    draw = true;
    while (cursor < h) {
      const segment = draw ? dash : gap;
      const endY = Math.max(y + h - cursor - segment, y);
      if (draw) {
        g.moveTo(x, y + h - cursor);
        g.lineTo(x, endY);
      }
      cursor += segment;
      draw = !draw;
    }
    g.strokePath();
  }

  private createPuzzlePieces(): void {
    const pieceDataList = this.generatePieceData();
    pieceDataList.forEach((data) => {
      const sprite = new PuzzlePieceSprite(this, data, {
        position: 60,
        rotation: 20
      });
      sprite.setDepth(10);
      this.pieces.push(sprite);
    });
  }

  private generatePieceData(): PuzzlePieceData[] {
    const rows = 2;
    const cols = 2;
    const total = rows * cols;
    const areaW = TutorialScene.TARGET_AREA_W - 24;
    const areaH = TutorialScene.TARGET_AREA_H - 24;
    const pieceW = Math.floor(areaW / cols);
    const pieceH = Math.floor(areaH / rows);

    const startTargetX = TutorialScene.TARGET_AREA_X - ((cols - 1) * pieceW) / 2;
    const startTargetY = TutorialScene.TARGET_AREA_Y - ((rows - 1) * pieceH) / 2;

    const shufflePositions = this.generateShufflePositions(total);
    const dataList: PuzzlePieceData[] = [];

    for (let i = 0; i < total; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      dataList.push({
        id: i,
        initialX: shufflePositions[i].x,
        initialY: shufflePositions[i].y,
        targetX: startTargetX + col * pieceW,
        targetY: startTargetY + row * pieceH,
        width: pieceW,
        height: pieceH,
        textureKey: `specimen-${this.specimen.id}-piece-${i}`,
        sourceX: col * pieceW,
        sourceY: row * pieceH
      });
    }

    return dataList;
  }

  private generateShufflePositions(count: number): Array<{ x: number; y: number }> {
    const positions: Array<{ x: number; y: number }> = [];
    const cols = Math.min(4, count);
    const rows = Math.ceil(count / cols);
    const pieceW = 140;
    const pieceH = 110;
    const totalWidth = cols * pieceW + (cols - 1) * 20;
    const startX = (750 - totalWidth) / 2 + pieceW / 2;
    const startY = TutorialScene.PIECE_AREA_START_Y + pieceH / 2;

    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      positions.push({
        x: startX + col * (pieceW + 20) + Phaser.Math.Between(-15, 15),
        y: startY + row * (pieceH + 20) + Phaser.Math.Between(-8, 8)
      });
    }

    return Phaser.Utils.Array.Shuffle(positions);
  }

  private addControlButtons(): void {
    const btnY = 845;
    const btnW = 130;
    const btnH = 58;
    const spacing = 40;
    const totalW = btnW * 3 + spacing * 2;
    const startX = (750 - totalW) / 2 + btnW / 2;

    const rotateBtn = this.createControlButton(
      startX,
      btnY,
      btnW,
      btnH,
      '旋转',
      0x2196f3,
      () => this.rotateSelectedPiece()
    );
    rotateBtn.setName('rotate-btn');

    this.add.text(startX, btnY + btnH / 2 + 28, '按键 R', {
      font: '12px Arial',
      color: 'rgba(255,255,255,0.5)'
    }).setOrigin(0.5);

    const hintBtn = this.createControlButton(
      startX + (btnW + spacing),
      btnY,
      btnW,
      btnH,
      '提示',
      0xff9800,
      () => this.toggleHint()
    );
    hintBtn.setName('hint-btn');

    const resetBtn = this.createControlButton(
      startX + 2 * (btnW + spacing),
      btnY,
      btnW,
      btnH,
      '重置',
      0xf44336,
      () => {
        this.cameras.main.flash(100, 244, 67, 54, false);
        this.resetLevel();
      }
    );
    resetBtn.setName('reset-btn');

    this.input.keyboard?.on('keydown-R', () => this.rotateSelectedPiece());
    this.input.keyboard?.on('keydown-H', () => this.toggleHint());
    this.input.keyboard?.on('keydown-ESC', () => {
      if (!this.isCompleted) this.showExitConfirm();
    });
  }

  private createControlButton(
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

    btn.on('pointerdown', () => {
      btn.clear();
      btn.fillStyle(this.darken(color, 20), 1);
      btn.fillRoundedRect(x - w / 2, y - h / 2, w, h, 14);
    });

    btn.on('pointerup', () => {
      btn.clear();
      btn.fillStyle(color, 1);
      btn.fillRoundedRect(x - w / 2, y - h / 2, w, h, 14);
      onClick();
    });

    return btn;
  }

  private lighten(hex: number, amount: number): number {
    const r = Math.min(255, ((hex >> 16) & 0xff) + amount);
    const g = Math.min(255, ((hex >> 8) & 0xff) + amount);
    const b = Math.min(255, (hex & 0xff) + amount);
    return (r << 16) | (g << 8) | b;
  }

  private darken(hex: number, amount: number): number {
    const r = Math.max(0, ((hex >> 16) & 0xff) - amount);
    const g = Math.max(0, ((hex >> 8) & 0xff) - amount);
    const b = Math.max(0, (hex & 0xff) - amount);
    return (r << 16) | (g << 8) | b;
  }

  private rotateSelectedPiece(): void {
    const selected = PuzzlePieceSprite.getSelectedPiece();
    if (selected && !selected.isPieceSnapped()) {
      selected.rotatePiece();
      this.cameras.main.shake(40, 0.002, false);
    } else {
      const pieceToRotate = this.pieces.find(p => !p.isPieceSnapped());
      if (pieceToRotate) {
        pieceToRotate.setSelected(true);
        pieceToRotate.rotatePiece();
      }
    }
  }

  private toggleHint(): void {
    this.showHint = !this.showHint;
    this.tweens.add({
      targets: this.hintImage,
      alpha: this.showHint ? 0.28 : 0,
      duration: 250,
      ease: 'Cubic.easeOut'
    });

    if (this.showHint) {
      TutorialManager.validateCurrentStep({
        type: 'custom',
        customCheck: 'hint_used'
      });
      this.checkAutoAdvance();
    }
  }

  private resetLevel(): void {
    this.snappedCount = 0;
    this.isCompleted = false;
    this.elapsedTime = 0;
    this.isPaused = false;
    PuzzlePieceSprite.clearSelection();

    const newPositions = this.generateShufflePositions(this.pieces.length);
    this.pieces.forEach((piece, index) => {
      piece.reset();
      piece.setPosition(newPositions[index].x, newPositions[index].y);
      piece.updateInitialPosition(newPositions[index].x, newPositions[index].y);
    });

    this.startTimer();
    this.updateUI();
  }

  private setupEvents(): void {
    this.events.on('piece-snapped', (data: { pieceId: number; piece: PuzzlePieceSprite; distance: number; isPerfect: boolean }) => {
      this.snappedCount++;
      this.updateUI();
      this.cameras.main.flash(80, 255, 255, 200, false);

      TutorialManager.validateCurrentStep({
        type: 'piece_snapped',
        pieceId: data.pieceId
      });
      this.checkAutoAdvance();

      if (this.snappedCount >= this.pieces.length) {
        this.time.delayedCall(400, () => this.onLevelComplete());
      }
    });

    this.events.on('piece-missed', () => {
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const objects = this.input.hitTestPointer(pointer);
      const pieceHit = objects.some(obj =>
        this.pieces.includes(obj as PuzzlePieceSprite)
      );
      if (!pieceHit) {
        PuzzlePieceSprite.clearSelection();
      }
    });
  }

  private setupTutorialUI(): void {
    this.highlightGraphics = this.add.graphics();
    this.highlightGraphics.setDepth(100);

    this.arrowGraphics = this.add.graphics();
    this.arrowGraphics.setDepth(100);

    this.tutorialOverlay = this.add.graphics();
    this.tutorialOverlay.fillStyle(0x000000, 0.4);
    this.tutorialOverlay.fillRect(0, 0, 750, 1334);
    this.tutorialOverlay.setDepth(90);
    this.tutorialOverlay.setInteractive();

    this.tutorialContainer = this.add.container(0, 0);
    this.tutorialContainer.setDepth(110);

    this.tutorialBox = this.add.graphics();
    this.tutorialBox.fillStyle(0x1a2a4a, 0.98);
    this.tutorialBox.fillRoundedRect(50, 0, 650, 200, 20);
    this.tutorialBox.lineStyle(3, 0x4caf50, 1);
    this.tutorialBox.strokeRoundedRect(50, 0, 650, 200, 20);
    this.tutorialContainer.add(this.tutorialBox);

    this.tutorialTitle = this.add.text(375, 35, '', {
      font: 'bold 24px Arial',
      color: '#4caf50'
    }).setOrigin(0.5);
    this.tutorialContainer.add(this.tutorialTitle);

    this.tutorialContent = this.add.text(375, 85, '', {
      font: '18px Arial',
      color: '#ffffff',
      wordWrap: { width: 580, useAdvancedWrap: true },
      align: 'center'
    }).setOrigin(0.5, 0);
    this.tutorialContainer.add(this.tutorialContent);

    this.progressIndicator = this.add.text(650, 30, '', {
      font: '14px Arial',
      color: '#aaaaaa'
    }).setOrigin(1, 0.5);
    this.tutorialContainer.add(this.progressIndicator);

    this.nextButton = this.add.graphics();
    this.nextButton.fillStyle(0x4caf50, 1);
    this.nextButton.fillRoundedRect(520, 145, 160, 45, 12);
    this.nextButton.setInteractive(
      new Phaser.Geom.Rectangle(520, 145, 160, 45),
      Phaser.Geom.Rectangle.Contains
    );
    this.tutorialContainer.add(this.nextButton);

    const nextBtnText = this.add.text(600, 167, '继续', {
      font: 'bold 18px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.tutorialContainer.add(nextBtnText);

    this.nextButton.on('pointerup', () => {
      this.advanceStep();
    });

    this.skipButton = this.add.graphics();
    this.skipButton.fillStyle(0x666666, 0.8);
    this.skipButton.fillRoundedRect(350, 145, 160, 45, 12);
    this.skipButton.setInteractive(
      new Phaser.Geom.Rectangle(350, 145, 160, 45),
      Phaser.Geom.Rectangle.Contains
    );
    this.tutorialContainer.add(this.skipButton);

    const skipBtnText = this.add.text(430, 167, '跳过教学', {
      font: 'bold 16px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.tutorialContainer.add(skipBtnText);

    this.skipButton.on('pointerup', () => {
      this.showSkipConfirm();
    });

    const prevBtn = this.add.graphics();
    prevBtn.fillStyle(0x2196f3, 1);
    prevBtn.fillRoundedRect(70, 145, 160, 45, 12);
    prevBtn.setInteractive(
      new Phaser.Geom.Rectangle(70, 145, 160, 45),
      Phaser.Geom.Rectangle.Contains
    );
    this.tutorialContainer.add(prevBtn);

    const prevBtnText = this.add.text(150, 167, '上一步', {
      font: 'bold 16px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.tutorialContainer.add(prevBtnText);

    prevBtn.on('pointerup', () => {
      this.goToPreviousStep();
    });

    this.positionTutorialBox();
  }

  private setupTutorialListeners(): void {
    TutorialManager.on('step-changed', (event: string, step: TutorialStep | null) => {
      this.showCurrentStep();
    });

    TutorialManager.on('tutorial-completed', (event: string, data: any) => {
      this.onTutorialComplete(data);
    });

    TutorialManager.on('validation-failed', () => {
      this.cameras.main.shake(100, 0.004, false);
      this.tutorialBox.lineStyle(3, 0xf44336, 1);
      this.time.delayedCall(300, () => {
        this.tutorialBox.lineStyle(3, 0x4caf50, 1);
      });
    });
  }

  private positionTutorialBox(): void {
    const step = TutorialManager.getCurrentStep();
    let boxY = 1050;

    if (step?.position) {
      const pos = step.position;
      if (pos.align === 'top') {
        boxY = pos.y - 200;
      } else if (pos.align === 'bottom') {
        boxY = pos.y;
      } else if (pos.align === 'center') {
        boxY = pos.y - 100;
      }
    }

    this.tweens.add({
      targets: this.tutorialContainer,
      y: boxY,
      duration: 300,
      ease: 'Cubic.easeOut'
    });
  }

  private showCurrentStep(): void {
    const step = TutorialManager.getCurrentStep();
    if (!step) {
      this.hideTutorialUI();
      return;
    }

    this.showTutorialUI();

    this.tutorialTitle.setText(step.title);
    this.tutorialContent.setText(step.content);

    const currentIndex = TutorialManager.getCurrentStepIndex() + 1;
    const totalSteps = TutorialManager.getTotalSteps();
    this.progressIndicator.setText(`${currentIndex}/${totalSteps}`);

    this.updateHighlight(step);
    this.updateArrow(step);
    this.positionTutorialBox();

    if (step.autoNext && step.autoNextDelay) {
      this.scheduleAutoNext(step.autoNextDelay);
    }

    if (step.showDemo && step.demoData) {
      this.playDemo(step.demoData);
    }

    const canGoBack = TutorialManager.getCurrentStepIndex() > 0;
    const prevBtn = this.tutorialContainer.getAt(6) as Phaser.GameObjects.Graphics;
    if (prevBtn) {
      prevBtn.setAlpha(canGoBack ? 1 : 0.3);
      prevBtn.disableInteractive();
      if (canGoBack) {
        prevBtn.setInteractive(
          new Phaser.Geom.Rectangle(70, 145, 160, 45),
          Phaser.Geom.Rectangle.Contains
        );
      }
    }

    if (step.canSkip === false) {
      this.skipButton.setAlpha(0.3);
      this.skipButton.disableInteractive();
    } else {
      this.skipButton.setAlpha(1);
      this.skipButton.setInteractive(
        new Phaser.Geom.Rectangle(350, 145, 160, 45),
        Phaser.Geom.Rectangle.Contains
      );
    }

    this.updateNextButtonState();
  }

  private updateHighlight(step: TutorialStep): void {
    this.highlightGraphics.clear();

    if (step.highlight) {
      const h = step.highlight;
      this.highlightGraphics.lineStyle(4, 0x4caf50, 1);
      this.highlightGraphics.fillStyle(0x4caf50, 0.2);

      if (h.type === 'rect') {
        this.highlightGraphics.strokeRoundedRect(h.x - h.width / 2, h.y - h.height / 2, h.width, h.height, 8);
        this.highlightGraphics.fillRoundedRect(h.x - h.width / 2, h.y - h.height / 2, h.width, h.height, 8);
      } else {
        this.highlightGraphics.strokeCircle(h.x, h.y, h.width / 2);
        this.highlightGraphics.fillCircle(h.x, h.y, h.width / 2);
      }

      if (h.pulse) {
        this.highlightGraphics.setAlpha(0.6);
        this.tweens.add({
          targets: this.highlightGraphics,
          alpha: 1,
          duration: 600,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    }
  }

  private updateArrow(step: TutorialStep): void {
    this.arrowGraphics.clear();

    if (step.arrow) {
      const a = step.arrow;
      const color = a.color || 0x4caf50;

      this.arrowGraphics.lineStyle(4, color, 1);
      this.arrowGraphics.fillStyle(color, 1);

      const angle = Math.atan2(a.endY - a.startY, a.endX - a.startX);
      const headLen = 20;
      const headAngle = Math.PI / 6;

      this.arrowGraphics.beginPath();
      this.arrowGraphics.moveTo(a.startX, a.startY);
      this.arrowGraphics.lineTo(a.endX, a.endY);
      this.arrowGraphics.strokePath();

      this.arrowGraphics.beginPath();
      this.arrowGraphics.moveTo(a.endX, a.endY);
      this.arrowGraphics.lineTo(
        a.endX - headLen * Math.cos(angle - headAngle),
        a.endY - headLen * Math.sin(angle - headAngle)
      );
      this.arrowGraphics.lineTo(
        a.endX - headLen * Math.cos(angle + headAngle),
        a.endY - headLen * Math.sin(angle + headAngle)
      );
      this.arrowGraphics.closePath();
      this.arrowGraphics.fillPath();
    }
  }

  private scheduleAutoNext(delay: number): void {
    if (this.autoNextTimer) {
      this.autoNextTimer.remove();
    }

    this.autoNextTimer = this.time.delayedCall(delay, () => {
      this.advanceStep();
    });
  }

  private playDemo(demoData: { pieceId: number; targetX: number; targetY: number; targetRotation?: number }): void {
    this.isDemoPlaying = true;

    const piece = this.pieces.find(p => p.getPieceId() === demoData.pieceId);
    if (!piece) {
      this.isDemoPlaying = false;
      return;
    }

    piece.setSelected(true);

    const chain = () => {
      if (demoData.targetRotation !== undefined && demoData.targetRotation !== 0) {
        const currentRotation = Phaser.Math.RadToDeg(piece.rotation);
        const targetRotation = demoData.targetRotation;
        const rotationsNeeded = Math.ceil((targetRotation - currentRotation + 360) / 90) % 4;

        let rotationCount = 0;
        const rotateNext = () => {
          if (rotationCount >= rotationsNeeded) {
            movePiece();
            return;
          }
          this.tweens.add({
            targets: piece,
            rotation: piece.rotation + Phaser.Math.DegToRad(90),
            duration: 200,
            ease: 'Cubic.easeOut',
            delay: 200,
            onComplete: () => {
              rotationCount++;
              rotateNext();
            }
          });
        };
        rotateNext();
      } else {
        movePiece();
      }
    };

    const movePiece = () => {
      this.tweens.add({
        targets: piece,
        x: demoData.targetX,
        y: demoData.targetY,
        duration: 1000,
        ease: 'Cubic.easeInOut',
        delay: 300,
        onComplete: () => {
          if (piece.canSnap()) {
            piece['snap']();
          }
          piece.setSelected(false);
          this.isDemoPlaying = false;
        }
      });
    };

    chain();
  }

  private updateNextButtonState(): void {
    const isValidated = TutorialManager.isCurrentStepValidated();
    const step = TutorialManager.getCurrentStep();

    if (step && (step.actionType === 'click' || step.actionType === 'wait')) {
      this.nextButton.clear();
      this.nextButton.fillStyle(0x4caf50, 1);
      this.nextButton.fillRoundedRect(520, 145, 160, 45, 12);
      this.nextButton.setInteractive(
        new Phaser.Geom.Rectangle(520, 145, 160, 45),
        Phaser.Geom.Rectangle.Contains
      );
    } else if (isValidated) {
      this.nextButton.clear();
      this.nextButton.fillStyle(0x4caf50, 1);
      this.nextButton.fillRoundedRect(520, 145, 160, 45, 12);
      this.nextButton.setInteractive(
        new Phaser.Geom.Rectangle(520, 145, 160, 45),
        Phaser.Geom.Rectangle.Contains
      );
    } else {
      this.nextButton.clear();
      this.nextButton.fillStyle(0x666666, 0.6);
      this.nextButton.fillRoundedRect(520, 145, 160, 45, 12);
      this.nextButton.disableInteractive();
    }
  }

  private checkAutoAdvance(): void {
    this.updateNextButtonState();
    const step = TutorialManager.getCurrentStep();
    if (step && step.autoNext && TutorialManager.isCurrentStepValidated()) {
      this.time.delayedCall(500, () => this.advanceStep());
    }
  }

  private advanceStep(): void {
    if (this.autoNextTimer) {
      this.autoNextTimer.remove();
      this.autoNextTimer = null;
    }

    const result = TutorialManager.nextStep();

    if (result.isComplete) {
      const completionResult = TutorialManager.completeTutorial();
      this.onTutorialComplete(completionResult);
    }
  }

  private goToPreviousStep(): void {
    if (this.autoNextTimer) {
      this.autoNextTimer.remove();
      this.autoNextTimer = null;
    }

    if (this.demoTween) {
      this.demoTween.stop();
      this.demoTween = null;
    }
    this.isDemoPlaying = false;

    TutorialManager.previousStep();
  }

  private showTutorialUI(): void {
    this.tutorialOverlay.setAlpha(1);
    this.tutorialContainer.setAlpha(1);
    this.tutorialOverlay.setInteractive();
  }

  private hideTutorialUI(): void {
    this.tutorialOverlay.setAlpha(0);
    this.tutorialContainer.setAlpha(0);
    this.highlightGraphics.clear();
    this.arrowGraphics.clear();
    this.tutorialOverlay.disableInteractive();
  }

  private startTimer(): void {
    if (this.timerEvent) this.timerEvent.remove(false);

    this.startTime = this.time.now;

    this.timerEvent = this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        if (!this.isPaused && !this.isCompleted) {
          this.elapsedTime = (this.time.now - this.startTime) / 1000;
        }
      }
    });
  }

  private updateUI(): void {
    const result = calculateScore(
      this.elapsedTime,
      999,
      this.pieces.length,
      this.snappedCount
    );
    this.scoreText.setText(`得分: ${Math.floor(result.score)}`);
  }

  private onLevelComplete(): void {
    this.isCompleted = true;
    if (this.timerEvent) this.timerEvent.paused = true;

    TutorialManager.validateCurrentStep({
      type: 'level_completed'
    });

    this.time.delayedCall(500, () => {
      this.advanceStep();
    });
  }

  private onTutorialComplete(result: TutorialCompletionResult): void {
    this.hideTutorialUI();
    this.showTutorialComplete(result);
  }

  private showTutorialComplete(result: TutorialCompletionResult): void {
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.85);
    overlay.fillRect(0, 0, 750, 1334);
    overlay.setDepth(200);
    overlay.setInteractive();

    const modal = this.add.graphics();
    modal.fillStyle(0x1a2a4a, 1);
    modal.fillRoundedRect(80, 280, 590, 720, 24);
    modal.lineStyle(4, 0x4caf50, 1);
    modal.strokeRoundedRect(80, 280, 590, 720, 24);
    modal.setDepth(210);

    this.add.text(375, 340, '🎉 教学完成！', {
      font: 'bold 40px Arial',
      color: '#4caf50'
    }).setOrigin(0.5).setDepth(220);

    this.drawStars(375, 420, 3, 50);

    const scoreBg = this.add.graphics();
    scoreBg.fillStyle(0x0f3460, 0.6);
    scoreBg.fillRoundedRect(130, 500, 490, 100, 16);
    scoreBg.setDepth(210);

    this.add.text(375, 530, `教学得分`, {
      font: '20px Arial',
      color: '#aaaaaa'
    }).setOrigin(0.5).setDepth(220);

    const result2 = calculateScore(this.elapsedTime, 999, this.pieces.length, this.snappedCount);
    this.add.text(375, 570, Math.floor(result2.score).toLocaleString(), {
      font: 'bold 40px Arial',
      color: '#ffd700'
    }).setOrigin(0.5).setDepth(220);

    this.add.text(375, 625, `用时 ${formatTime(this.elapsedTime)}  ·  修复 ${this.pieces.length}/${this.pieces.length} 片`, {
      font: '16px Arial',
      color: '#eaeaea'
    }).setOrigin(0.5).setDepth(220);

    let rewardY = 665;
    if (result.rewards.length > 0) {
      const rewardBg = this.add.graphics();
      rewardBg.fillStyle(0x1a1a3a, 0.9);
      rewardBg.fillRoundedRect(130, rewardY, 490, 30 + result.rewards.length * 30, 12);
      rewardBg.lineStyle(2, 0xffd700, 0.5);
      rewardBg.strokeRoundedRect(130, rewardY, 490, 30 + result.rewards.length * 30, 12);
      rewardBg.setDepth(210);

      this.add.text(375, rewardY + 15, '🎁 获得奖励', {
        font: 'bold 16px Arial',
        color: '#ffd700'
      }).setOrigin(0.5).setDepth(220);

      let itemY = rewardY + 40;
      result.rewards.forEach(reward => {
        let icon = '💰';
        let color = '#ffd700';
        if (reward.type === 'badge') {
          icon = '🏅';
          color = '#4caf50';
        } else if (reward.type === 'specimen') {
          icon = '🌿';
          color = '#2196f3';
        }

        const valueText = reward.value ? ` +${reward.value}` : '';
        this.add.text(375, itemY, `${icon} ${reward.name}${valueText}`, {
          font: '15px Arial',
          color: color
        }).setOrigin(0.5).setDepth(220);
        itemY += 30;
      });

      rewardY = rewardY + 30 + result.rewards.length * 30 + 15;
    }

    if (result.newlyCompleted) {
      const badge = this.add.graphics();
      badge.fillStyle(0xff9800, 1);
      badge.fillRoundedRect(140, rewardY, 470, 45, 12);
      badge.setDepth(210);
      this.add.text(375, rewardY + 22, '🎓 恭喜完成新手教学！第一关已解锁', {
        font: 'bold 18px Arial',
        color: '#ffffff'
      }).setOrigin(0.5).setDepth(220);
      rewardY += 55;
    }

    if (result.achievementResult && result.achievementResult.newlyUnlocked.length > 0) {
      AchievementNotification.showAchievement(this, result.achievementResult.newlyUnlocked[0]);
    }

    const btnW = 230;
    const btnH = 68;
    const btnY = rewardY + 20;

    const continueBtn = this.add.graphics();
    continueBtn.fillStyle(0x4caf50, 1);
    continueBtn.fillRoundedRect(135, btnY, btnW, btnH, 16);
    continueBtn.setInteractive(
      new Phaser.Geom.Rectangle(135, btnY, btnW, btnH),
      Phaser.Geom.Rectangle.Contains
    );
    continueBtn.setDepth(210);

    this.add.text(135 + btnW / 2, btnY + btnH / 2, '开始游戏', {
      font: 'bold 22px Arial',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(220);

    continueBtn.on('pointerup', () => {
      this.scene.start('LevelSelectScene');
    });

    const retryBtn = this.add.graphics();
    retryBtn.fillStyle(0x2196f3, 1);
    retryBtn.fillRoundedRect(385, btnY, btnW, btnH, 16);
    retryBtn.setInteractive(
      new Phaser.Geom.Rectangle(385, btnY, btnW, btnH),
      Phaser.Geom.Rectangle.Contains
    );
    retryBtn.setDepth(210);

    this.add.text(385 + btnW / 2, btnY + btnH / 2, '再玩一次', {
      font: 'bold 22px Arial',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(220);

    retryBtn.on('pointerup', () => {
      this.scene.restart();
    });
  }

  private drawStars(x: number, y: number, stars: number, size: number = 40): void {
    const spacing = 15;
    const startX = x - size - spacing;

    for (let i = 0; i < 3; i++) {
      const starX = startX + i * (size + spacing);
      const tex = i < stars ? 'star-filled' : 'star-empty';
      const img = this.add.image(starX, y, tex).setDisplaySize(size, size);
      img.setDepth(220);
      img.setScale(0);
      this.tweens.add({
        targets: img,
        scale: 1,
        delay: i * 150,
        duration: 300,
        ease: 'Back.easeOut'
      });
    }
  }

  private showExitConfirm(): void {
    this.isPaused = true;

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.78);
    overlay.fillRect(0, 0, 750, 1334);
    overlay.setInteractive();
    overlay.setDepth(300);

    const modal = this.add.graphics();
    modal.fillStyle(0x16213e, 1);
    modal.fillRoundedRect(110, 450, 530, 350, 24);
    modal.lineStyle(3, 0xe94560, 1);
    modal.strokeRoundedRect(110, 450, 530, 350, 24);
    modal.setDepth(310);

    this.add.text(375, 510, '⚠ 退出教学', {
      font: 'bold 32px Arial',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(320);

    this.add.text(375, 560, '确定要退出教学吗？\n你可以稍后在关卡选择中重新开始。', {
      font: '18px Arial',
      color: '#aaaaaa',
      align: 'center'
    }).setOrigin(0.5).setDepth(320);

    const btnW = 230;
    const btnH = 66;
    const btnY = 650;

    const resumeBtn = this.add.graphics();
    resumeBtn.fillStyle(0x4caf50, 1);
    resumeBtn.fillRoundedRect(135, btnY, btnW, btnH, 16);
    resumeBtn.setInteractive(
      new Phaser.Geom.Rectangle(135, btnY, btnW, btnH),
      Phaser.Geom.Rectangle.Contains
    );
    resumeBtn.setDepth(310);

    this.add.text(135 + btnW / 2, btnY + btnH / 2, '继续教学', {
      font: 'bold 20px Arial',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(320);

    resumeBtn.on('pointerup', () => {
      this.isPaused = false;
      overlay.destroy();
    });

    const quitBtn = this.add.graphics();
    quitBtn.fillStyle(0xe94560, 1);
    quitBtn.fillRoundedRect(385, btnY, btnW, btnH, 16);
    quitBtn.setInteractive(
      new Phaser.Geom.Rectangle(385, btnY, btnW, btnH),
      Phaser.Geom.Rectangle.Contains
    );
    quitBtn.setDepth(310);

    this.add.text(385 + btnW / 2, btnY + btnH / 2, '退出', {
      font: 'bold 20px Arial',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(320);

    quitBtn.on('pointerup', () => {
      this.scene.start('ChapterSelectScene');
    });
  }

  private showSkipConfirm(): void {
    this.isPaused = true;

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.78);
    overlay.fillRect(0, 0, 750, 1334);
    overlay.setInteractive();
    overlay.setDepth(300);

    const modal = this.add.graphics();
    modal.fillStyle(0x16213e, 1);
    modal.fillRoundedRect(110, 450, 530, 380, 24);
    modal.lineStyle(3, 0xff9800, 1);
    modal.strokeRoundedRect(110, 450, 530, 380, 24);
    modal.setDepth(310);

    this.add.text(375, 510, '⏭ 跳过教学', {
      font: 'bold 32px Arial',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(320);

    this.add.text(375, 565, '跳过教学将无法获得新手奖励。\n建议新手玩家完成教学以了解游戏玩法。', {
      font: '18px Arial',
      color: '#ff9800',
      align: 'center'
    }).setOrigin(0.5).setDepth(320);

    const btnW = 230;
    const btnH = 66;
    const btnY = 680;

    const cancelBtn = this.add.graphics();
    cancelBtn.fillStyle(0x2196f3, 1);
    cancelBtn.fillRoundedRect(135, btnY, btnW, btnH, 16);
    cancelBtn.setInteractive(
      new Phaser.Geom.Rectangle(135, btnY, btnW, btnH),
      Phaser.Geom.Rectangle.Contains
    );
    cancelBtn.setDepth(310);

    this.add.text(135 + btnW / 2, btnY + btnH / 2, '继续学习', {
      font: 'bold 20px Arial',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(320);

    cancelBtn.on('pointerup', () => {
      this.isPaused = false;
      overlay.destroy();
    });

    const skipBtn = this.add.graphics();
    skipBtn.fillStyle(0xe94560, 1);
    skipBtn.fillRoundedRect(385, btnY, btnW, btnH, 16);
    skipBtn.setInteractive(
      new Phaser.Geom.Rectangle(385, btnY, btnW, btnH),
      Phaser.Geom.Rectangle.Contains
    );
    skipBtn.setDepth(310);

    this.add.text(385 + btnW / 2, btnY + btnH / 2, '跳过', {
      font: 'bold 20px Arial',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(320);

    skipBtn.on('pointerup', () => {
      TutorialManager.skipTutorial();
      this.scene.start('ChapterSelectScene');
    });
  }
}
