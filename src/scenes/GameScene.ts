import Phaser from 'phaser';
import { PuzzlePieceSprite } from '../objects/PuzzlePieceSprite';
import { getLevelById } from '../data/Levels';
import { SaveManager } from '../utils/SaveManager';
import { calculateScore, formatTime } from '../utils/GameUtils';
import { LevelData } from '../types/GameTypes';

export class GameScene extends Phaser.Scene {
  private levelData!: LevelData;
  private pieces: PuzzlePieceSprite[] = [];
  private snappedCount: number = 0;
  private startTime: number = 0;
  private elapsedTime: number = 0;
  private isPaused: boolean = false;
  private isCompleted: boolean = false;
  private timerEvent!: Phaser.Time.TimerEvent;
  private timeText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private targetArea!: Phaser.GameObjects.Rectangle;
  private selectedPiece: PuzzlePieceSprite | null = null;
  private hintImage!: Phaser.GameObjects.Image;
  private showHint: boolean = false;

  constructor() {
    super('GameScene');
  }

  init(data: { levelId: number }): void {
    const level = getLevelById(data.levelId);
    if (!level) {
      this.scene.start('LevelSelectScene');
      return;
    }
    this.levelData = level;
  }

  create(): void {
    this.addBackground();
    this.addHeader();
    this.addTargetArea();
    this.createPuzzlePieces();
    this.addControlButtons();
    this.setupEvents();
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
    header.fillStyle(0x0f3460, 1);
    header.fillRect(0, 0, 750, 120);

    this.add.text(60, 40, this.levelData.name, {
      font: 'bold 28px Arial',
      color: '#ffffff'
    });

    this.add.text(60, 80, this.levelData.plantName, {
      font: '18px Arial',
      color: '#aaaaaa'
    });

    this.timeText = this.add.text(690, 45, formatTime(this.levelData.timeLimit), {
      font: 'bold 32px Arial',
      color: '#ffd700'
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
      this.showPauseMenu();
    });
  }

  private addTargetArea(): void {
    const targetX = 375;
    const targetY = 450;
    const targetWidth = 500;
    const targetHeight = 400;

    const frame = this.add.graphics();
    frame.lineStyle(4, 0x4caf50, 0.6);
    frame.strokeRoundedRect(
      targetX - targetWidth / 2,
      targetY - targetHeight / 2,
      targetWidth,
      targetHeight,
      10
    );

    this.hintImage = this.add.image(targetX, targetY, this.levelData.targetImage);
    this.hintImage.setDisplaySize(targetWidth - 20, targetHeight - 20);
    this.hintImage.setAlpha(0);
    this.hintImage.setDepth(0);

    const area = this.add.rectangle(targetX, targetY, targetWidth, targetHeight);
    area.setFillStyle(0xffffff, 0.05);
    this.targetArea = area;

    this.add.text(targetX, targetY - targetHeight / 2 - 25, '目标区域', {
      font: '16px Arial',
      color: '#4caf50'
    }).setOrigin(0.5);
  }

  private createPuzzlePieces(): void {
    const targetX = 375;
    const targetY = 450;
    const pieceWidth = 120;
    const pieceHeight = 160;
    const cols = this.levelData.cols;
    const rows = this.levelData.rows;

    const startX = targetX - ((cols - 1) * pieceWidth) / 2;
    const startY = targetY - ((rows - 1) * pieceHeight) / 2;

    const pieceData = this.generatePieces(pieceWidth, pieceHeight);

    pieceData.forEach((piece, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const tx = startX + col * pieceWidth;
      const ty = startY + row * pieceHeight;

      const sprite = new PuzzlePieceSprite(this, piece, tx, ty, 0);
      sprite.setDepth(10);
      this.pieces.push(sprite);
    });

    this.shufflePieces();
  }

  private generatePieces(width: number, height: number) {
    const pieces: any[] = [];
    const total = this.levelData.rows * this.levelData.cols;

    for (let i = 0; i < total; i++) {
      pieces.push({
        id: i,
        x: 375,
        y: 800 + (i % 4) * 100,
        rotation: 0,
        width: width,
        height: height,
        textureKey: `level${this.levelData.id}-pieces`,
        frameIndex: i
      });
    }
    return pieces;
  }

  private shufflePieces(): void {
    const positions = this.generateShufflePositions();

    this.pieces.forEach((piece, index) => {
      piece.setPosition(positions[index].x, positions[index].y);
    });
  }

  private generateShufflePositions(): Array<{ x: number; y: number }> {
    const positions: Array<{ x: number; y: number }> = [];
    const cols = 4;
    const rows = Math.ceil(this.pieces.length / cols);
    const startX = 120;
    const startY = 950;
    const spacingX = 150;
    const spacingY = 120;

    for (let i = 0; i < this.pieces.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      positions.push({
        x: startX + col * spacingX + Phaser.Math.Between(-20, 20),
        y: startY + row * spacingY + Phaser.Math.Between(-10, 10)
      });
    }

    return Phaser.Utils.Array.Shuffle(positions);
  }

  private addControlButtons(): void {
    const btnY = 880;

    const rotateBtn = this.add.graphics();
    rotateBtn.fillStyle(0x2196f3, 1);
    rotateBtn.fillRoundedRect(100, btnY, 120, 60, 15);
    rotateBtn.setInteractive(
      new Phaser.Geom.Rectangle(100, btnY, 120, 60),
      Phaser.Geom.Rectangle.Contains
    );

    this.add.text(160, btnY + 30, '旋转', {
      font: 'bold 20px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    rotateBtn.on('pointerup', () => {
      this.rotateSelectedPiece();
    });

    const hintBtn = this.add.graphics();
    hintBtn.fillStyle(0xff9800, 1);
    hintBtn.fillRoundedRect(315, btnY, 120, 60, 15);
    hintBtn.setInteractive(
      new Phaser.Geom.Rectangle(315, btnY, 120, 60),
      Phaser.Geom.Rectangle.Contains
    );

    this.add.text(375, btnY + 30, '提示', {
      font: 'bold 20px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    hintBtn.on('pointerup', () => {
      this.toggleHint();
    });

    const resetBtn = this.add.graphics();
    resetBtn.fillStyle(0xf44336, 1);
    resetBtn.fillRoundedRect(530, btnY, 120, 60, 15);
    resetBtn.setInteractive(
      new Phaser.Geom.Rectangle(530, btnY, 120, 60),
      Phaser.Geom.Rectangle.Contains
    );

    this.add.text(590, btnY + 30, '重置', {
      font: 'bold 20px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    resetBtn.on('pointerup', () => {
      this.resetLevel();
    });
  }

  private rotateSelectedPiece(): void {
    let found = false;
    for (let i = this.pieces.length - 1; i >= 0; i--) {
      const piece = this.pieces[i];
      if (!piece.isPieceSnapped()) {
        piece.rotatePiece();
        found = true;
        break;
      }
    }

    if (!found && this.pieces.length > 0) {
      this.pieces[0].rotatePiece();
    }
  }

  private toggleHint(): void {
    this.showHint = !this.showHint;
    this.tweens.add({
      targets: this.hintImage,
      alpha: this.showHint ? 0.3 : 0,
      duration: 300
    });
  }

  private resetLevel(): void {
    this.snappedCount = 0;
    this.isCompleted = false;
    this.elapsedTime = 0;
    this.isPaused = false;

    this.pieces.forEach(piece => {
      piece.reset();
    });

    this.shufflePieces();
    this.startTimer();
    this.updateUI();
  }

  private setupEvents(): void {
    this.events.on('piece-snapped', (pieceId: number) => {
      this.snappedCount++;
      this.updateUI();

      if (this.snappedCount >= this.pieces.length) {
        this.onLevelComplete();
      }
    });

    this.input.keyboard?.on('keydown-R', () => {
      this.rotateSelectedPiece();
    });

    this.input.keyboard?.on('keydown-ESC', () => {
      if (!this.isCompleted) {
        this.showPauseMenu();
      }
    });
  }

  private startTimer(): void {
    if (this.timerEvent) {
      this.timerEvent.remove(false);
    }

    this.startTime = this.time.now;

    this.timerEvent = this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        if (!this.isPaused && !this.isCompleted) {
          this.elapsedTime = (this.time.now - this.startTime) / 1000;
          this.updateTimerDisplay();
        }
      }
    });
  }

  private updateTimerDisplay(): void {
    const remaining = Math.max(0, this.levelData.timeLimit - this.elapsedTime);
    this.timeText.setText(formatTime(remaining));

    if (remaining < 30) {
      this.timeText.setColor('#f44336');
    } else if (remaining < 60) {
      this.timeText.setColor('#ff9800');
    } else {
      this.timeText.setColor('#ffd700');
    }

    if (remaining <= 0 && !this.isCompleted) {
      this.onTimeUp();
    }
  }

  private updateUI(): void {
    const result = calculateScore(
      this.elapsedTime,
      this.levelData.timeLimit,
      this.pieces.length,
      this.snappedCount
    );
    this.scoreText.setText(`得分: ${result.score}`);
  }

  private onLevelComplete(): void {
    this.isCompleted = true;
    this.timerEvent.paused = true;

    const result = calculateScore(
      this.elapsedTime,
      this.levelData.timeLimit,
      this.pieces.length,
      this.snappedCount
    );

    SaveManager.completeLevel(
      this.levelData.id,
      result.score,
      this.elapsedTime,
      result.stars
    );

    this.time.delayedCall(500, () => {
      this.showVictory(result.score, result.stars, this.elapsedTime);
    });
  }

  private onTimeUp(): void {
    this.isCompleted = true;
    this.timerEvent.paused = true;

    const result = calculateScore(
      this.levelData.timeLimit,
      this.levelData.timeLimit,
      this.snappedCount,
      this.snappedCount
    );

    this.showGameOver(result.score, this.snappedCount, this.pieces.length);
  }

  private showVictory(score: number, stars: number, time: number): void {
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, 750, 1334);

    const modal = this.add.graphics();
    modal.fillStyle(0x16213e, 1);
    modal.fillRoundedRect(100, 350, 550, 550, 20);
    modal.lineStyle(4, 0x4caf50, 1);
    modal.strokeRoundedRect(100, 350, 550, 550, 20);

    this.add.text(375, 410, '🎉 修复完成！', {
      font: 'bold 36px Arial',
      color: '#4caf50'
    }).setOrigin(0.5);

    this.drawStars(375, 480, stars, 40);

    this.add.text(375, 560, `得分: ${score}`, {
      font: 'bold 32px Arial',
      color: '#ffd700'
    }).setOrigin(0.5);

    this.add.text(375, 610, `用时: ${formatTime(time)}`, {
      font: '22px Arial',
      color: '#eaeaea'
    }).setOrigin(0.5);

    this.add.text(375, 660, `已修复: ${this.pieces.length}/${this.pieces.length} 片`, {
      font: '20px Arial',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    const retryBtn = this.add.graphics();
    retryBtn.fillStyle(0x2196f3, 1);
    retryBtn.fillRoundedRect(150, 720, 200, 65, 15);
    retryBtn.setInteractive(
      new Phaser.Geom.Rectangle(150, 720, 200, 65),
      Phaser.Geom.Rectangle.Contains
    );

    this.add.text(250, 752, '再玩一次', {
      font: 'bold 22px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    retryBtn.on('pointerup', () => {
      this.resetLevel();
      overlay.destroy();
      modal.destroy();
      retryBtn.destroy();
      this.children.each(child => {
        if ((child as any).y > 400 && (child as any).type === 'Text') {
          // cleanup
        }
      });
      this.scene.restart({ levelId: this.levelData.id });
    });

    const backBtn = this.add.graphics();
    backBtn.fillStyle(0xe94560, 1);
    backBtn.fillRoundedRect(400, 720, 200, 65, 15);
    backBtn.setInteractive(
      new Phaser.Geom.Rectangle(400, 720, 200, 65),
      Phaser.Geom.Rectangle.Contains
    );

    this.add.text(500, 752, '返回关卡', {
      font: 'bold 22px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    backBtn.on('pointerup', () => {
      this.scene.start('LevelSelectScene');
    });
  }

  private showGameOver(score: number, snapped: number, total: number): void {
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, 750, 1334);

    const modal = this.add.graphics();
    modal.fillStyle(0x16213e, 1);
    modal.fillRoundedRect(100, 400, 550, 450, 20);
    modal.lineStyle(4, 0xf44336, 1);
    modal.strokeRoundedRect(100, 400, 550, 450, 20);

    this.add.text(375, 470, '⏰ 时间到！', {
      font: 'bold 36px Arial',
      color: '#f44336'
    }).setOrigin(0.5);

    this.add.text(375, 540, `得分: ${score}`, {
      font: 'bold 28px Arial',
      color: '#ffd700'
    }).setOrigin(0.5);

    this.add.text(375, 590, `已修复: ${snapped}/${total} 片`, {
      font: '20px Arial',
      color: '#eaeaea'
    }).setOrigin(0.5);

    const retryBtn = this.add.graphics();
    retryBtn.fillStyle(0x4caf50, 1);
    retryBtn.fillRoundedRect(150, 660, 200, 65, 15);
    retryBtn.setInteractive(
      new Phaser.Geom.Rectangle(150, 660, 200, 65),
      Phaser.Geom.Rectangle.Contains
    );

    this.add.text(250, 692, '重新挑战', {
      font: 'bold 22px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    retryBtn.on('pointerup', () => {
      this.scene.restart({ levelId: this.levelData.id });
    });

    const backBtn = this.add.graphics();
    backBtn.fillStyle(0xe94560, 1);
    backBtn.fillRoundedRect(400, 660, 200, 65, 15);
    backBtn.setInteractive(
      new Phaser.Geom.Rectangle(400, 660, 200, 65),
      Phaser.Geom.Rectangle.Contains
    );

    this.add.text(500, 692, '返回关卡', {
      font: 'bold 22px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    backBtn.on('pointerup', () => {
      this.scene.start('LevelSelectScene');
    });
  }

  private showPauseMenu(): void {
    if (this.isCompleted) return;

    this.isPaused = true;

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, 750, 1334);
    overlay.setInteractive();

    const modal = this.add.graphics();
    modal.fillStyle(0x16213e, 1);
    modal.fillRoundedRect(125, 450, 500, 400, 20);
    modal.lineStyle(3, 0xe94560, 1);
    modal.strokeRoundedRect(125, 450, 500, 400, 20);

    this.add.text(375, 510, '游戏暂停', {
      font: 'bold 32px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    const resumeBtn = this.add.graphics();
    resumeBtn.fillStyle(0x4caf50, 1);
    resumeBtn.fillRoundedRect(225, 570, 300, 65, 15);
    resumeBtn.setInteractive(
      new Phaser.Geom.Rectangle(225, 570, 300, 65),
      Phaser.Geom.Rectangle.Contains
    );

    this.add.text(375, 602, '继续游戏', {
      font: 'bold 22px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    resumeBtn.on('pointerup', () => {
      this.isPaused = false;
      overlay.destroy();
      modal.destroy();
      resumeBtn.destroy();
    });

    const restartBtn = this.add.graphics();
    restartBtn.fillStyle(0xff9800, 1);
    restartBtn.fillRoundedRect(225, 660, 300, 65, 15);
    restartBtn.setInteractive(
      new Phaser.Geom.Rectangle(225, 660, 300, 65),
      Phaser.Geom.Rectangle.Contains
    );

    this.add.text(375, 692, '重新开始', {
      font: 'bold 22px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    restartBtn.on('pointerup', () => {
      this.scene.restart({ levelId: this.levelData.id });
    });

    const quitBtn = this.add.graphics();
    quitBtn.fillStyle(0xe94560, 1);
    quitBtn.fillRoundedRect(225, 750, 300, 65, 15);
    quitBtn.setInteractive(
      new Phaser.Geom.Rectangle(225, 750, 300, 65),
      Phaser.Geom.Rectangle.Contains
    );

    this.add.text(375, 782, '退出关卡', {
      font: 'bold 22px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    quitBtn.on('pointerup', () => {
      this.scene.start('LevelSelectScene');
    });
  }

  private drawStars(x: number, y: number, stars: number, size: number = 30): void {
    const spacing = 15;
    const startX = x - size - spacing;

    for (let i = 0; i < 3; i++) {
      const starX = startX + i * (size + spacing);
      const texture = i < stars ? 'star-filled' : 'star-empty';
      this.add.image(starX, y, texture).setDisplaySize(size, size);
    }
  }
}
