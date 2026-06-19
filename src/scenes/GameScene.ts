import Phaser from 'phaser';
import { PuzzlePieceSprite } from '../objects/PuzzlePieceSprite';
import { getLevelRule } from '../data/LevelRules';
import { getPlantSpecimen } from '../data/PlantSpecimens';
import { SaveManager } from '../utils/SaveManager';
import { calculateScore, formatTime, getDifficultyColor, getDifficultyText } from '../utils/GameUtils';
import { LevelRule, PlantSpecimen, PuzzlePieceData } from '../types/GameTypes';

export class GameScene extends Phaser.Scene {
  private levelRule!: LevelRule;
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

  private static readonly TARGET_AREA_X = 375;
  private static readonly TARGET_AREA_Y = 420;
  private static readonly TARGET_AREA_W = 500;
  private static readonly TARGET_AREA_H = 400;
  private static readonly PIECE_AREA_START_Y = 900;

  constructor() {
    super('GameScene');
  }

  init(data: { levelId: number }): void {
    const rule = getLevelRule(data.levelId);
    if (!rule) {
      this.scene.start('LevelSelectScene');
      return;
    }
    this.levelRule = rule;

    const specimen = getPlantSpecimen(rule.specimenId);
    if (!specimen) {
      this.scene.start('LevelSelectScene');
      return;
    }
    this.specimen = specimen;
  }

  create(): void {
    this.targetTextureKey = `specimen-${this.specimen.id}-target`;

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

    this.add.text(60, 40, this.levelRule.name, {
      font: 'bold 28px Arial',
      color: '#ffffff'
    });

    this.add.text(60, 80, `${this.specimen.name}  ·  ${getDifficultyText(this.levelRule.difficulty)}`, {
      font: '18px Arial',
      color: '#' + getDifficultyColor(this.levelRule.difficulty).toString(16).padStart(6, '0')
    });

    this.timeText = this.add.text(690, 45, formatTime(this.levelRule.timeLimit), {
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
    const x = GameScene.TARGET_AREA_X;
    const y = GameScene.TARGET_AREA_Y;
    const w = GameScene.TARGET_AREA_W;
    const h = GameScene.TARGET_AREA_H;

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

    pieceDataList.forEach(data => {
      const sprite = new PuzzlePieceSprite(this, data, {
        position: this.levelRule.snapPositionThreshold,
        rotation: this.levelRule.snapRotationThreshold
      });
      sprite.setDepth(10);
      this.pieces.push(sprite);
    });
  }

  private generatePieceData(): PuzzlePieceData[] {
    const { rows, cols } = this.levelRule;
    const total = rows * cols;
    const areaW = GameScene.TARGET_AREA_W - 24;
    const areaH = GameScene.TARGET_AREA_H - 24;
    const pieceW = Math.floor(areaW / cols);
    const pieceH = Math.floor(areaH / rows);

    const startTargetX = GameScene.TARGET_AREA_X - ((cols - 1) * pieceW) / 2;
    const startTargetY = GameScene.TARGET_AREA_Y - ((rows - 1) * pieceH) / 2;

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

    const pieceW = this.levelRule.id <= 2 ? 140 : this.levelRule.id <= 4 ? 130 : 120;
    const pieceH = this.levelRule.id <= 2 ? 110 : this.levelRule.id <= 4 ? 100 : 90;

    const totalWidth = cols * pieceW + (cols - 1) * 20;
    const startX = (750 - totalWidth) / 2 + pieceW / 2;
    const startY = GameScene.PIECE_AREA_START_Y + pieceH / 2;

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

    const keyHint = this.add.text(startX, btnY + btnH / 2 + 28, '按键 R', {
      font: '12px Arial',
      color: 'rgba(255,255,255,0.5)'
    }).setOrigin(0.5);

    const hintBtn = this.createControlButton(
      startX + btnW + spacing,
      btnY,
      btnW,
      btnH,
      '提示',
      0xff9800,
      () => this.toggleHint()
    );

    const resetBtn = this.createControlButton(
      startX + (btnW + spacing) * 2,
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

    this.input.keyboard?.on('keydown-R', () => this.rotateSelectedPiece());
    this.input.keyboard?.on('keydown-H', () => this.toggleHint());
    this.input.keyboard?.on('keydown-ESC', () => {
      if (!this.isCompleted) this.showPauseMenu();
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
    this.events.on('piece-snapped', () => {
      this.snappedCount++;
      this.updateUI();

      this.cameras.main.flash(80, 255, 255, 200, false);

      if (this.snappedCount >= this.pieces.length) {
        this.time.delayedCall(400, () => this.onLevelComplete());
      }
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

  private startTimer(): void {
    if (this.timerEvent) this.timerEvent.remove(false);

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
    const remaining = Math.max(0, this.levelRule.timeLimit - this.elapsedTime);
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
      this.levelRule.timeLimit,
      this.pieces.length,
      this.snappedCount
    );
    this.scoreText.setText(`得分: ${result.score}`);
  }

  private onLevelComplete(): void {
    this.isCompleted = true;
    if (this.timerEvent) this.timerEvent.paused = true;

    const result = calculateScore(
      this.elapsedTime,
      this.levelRule.timeLimit,
      this.pieces.length,
      this.snappedCount
    );

    SaveManager.completeLevel(
      this.levelRule.id,
      result.score,
      this.elapsedTime,
      result.stars
    );

    this.cameras.main.zoomTo(1.05, 400, 'Cubic.easeInOut', true);
    this.time.delayedCall(450, () => {
      this.cameras.main.zoomTo(1.0, 400, 'Cubic.easeInOut', true);
      this.showVictory(result.score, result.stars, this.elapsedTime);
    });
  }

  private onTimeUp(): void {
    this.isCompleted = true;
    if (this.timerEvent) this.timerEvent.paused = true;

    const result = calculateScore(
      this.levelRule.timeLimit,
      this.levelRule.timeLimit,
      this.snappedCount,
      this.snappedCount
    );

    this.showGameOver(result.score, this.snappedCount, this.pieces.length);
  }

  private createModal(
    title: string,
    titleColor: string,
    borderColor: number
  ): { overlay: Phaser.GameObjects.Graphics; modal: Phaser.GameObjects.Graphics } {
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.78);
    overlay.fillRect(0, 0, 750, 1334);
    overlay.setInteractive();

    const modal = this.add.graphics();
    modal.fillStyle(0x16213e, 1);
    modal.fillRoundedRect(80, 330, 590, 650, 24);
    modal.lineStyle(4, borderColor, 1);
    modal.strokeRoundedRect(80, 330, 590, 650, 24);

    this.add.text(375, 395, title, {
      font: 'bold 40px Arial',
      color: titleColor
    }).setOrigin(0.5);

    return { overlay, modal };
  }

  private drawStars(x: number, y: number, stars: number, size: number = 40): void {
    const spacing = 15;
    const startX = x - size - spacing;

    for (let i = 0; i < 3; i++) {
      const starX = startX + i * (size + spacing);
      const tex = i < stars ? 'star-filled' : 'star-empty';
      const img = this.add.image(starX, y, tex).setDisplaySize(size, size);
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

  private showVictory(score: number, stars: number, time: number): void {
    const { overlay } = this.createModal('🎉 修复完成！', '#4caf50', 0x4caf50);

    this.drawStars(375, 480, stars, 50);

    const scoreBg = this.add.graphics();
    scoreBg.fillStyle(0x0f3460, 0.6);
    scoreBg.fillRoundedRect(130, 560, 490, 160, 16);

    this.add.text(375, 600, `最终得分`, {
      font: '20px Arial',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    this.add.text(375, 645, score.toLocaleString(), {
      font: 'bold 52px Arial',
      color: '#ffd700'
    }).setOrigin(0.5);

    this.add.text(375, 695, `用时 ${formatTime(time)}  ·  修复 ${this.pieces.length}/${this.pieces.length} 片`, {
      font: '18px Arial',
      color: '#eaeaea'
    }).setOrigin(0.5);

    this.createResultButtons(overlay, true);
  }

  private showGameOver(score: number, snapped: number, total: number): void {
    const { overlay } = this.createModal('⏰ 时间到', '#f44336', 0xf44336);

    this.add.text(375, 480, '😢', {
      font: '60px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    const scoreBg = this.add.graphics();
    scoreBg.fillStyle(0x0f3460, 0.6);
    scoreBg.fillRoundedRect(130, 560, 490, 160, 16);

    this.add.text(375, 600, `获得分数`, {
      font: '20px Arial',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    this.add.text(375, 645, score.toLocaleString(), {
      font: 'bold 44px Arial',
      color: '#ff9800'
    }).setOrigin(0.5);

    this.add.text(375, 695, `已修复 ${snapped}/${total} 片`, {
      font: '18px Arial',
      color: '#eaeaea'
    }).setOrigin(0.5);

    this.createResultButtons(overlay, false);
  }

  private createResultButtons(
    overlay: Phaser.GameObjects.Graphics,
    isVictory: boolean
  ): void {
    const btnW = 230;
    const btnH = 68;
    const btnY = 780;

    const retryColor = isVictory ? 0x2196f3 : 0x4caf50;
    const retryLabel = isVictory ? '再玩一次' : '重新挑战';
    const retryBtn = this.add.graphics();
    retryBtn.fillStyle(retryColor, 1);
    retryBtn.fillRoundedRect(135, btnY, btnW, btnH, 16);
    retryBtn.setInteractive(
      new Phaser.Geom.Rectangle(135, btnY, btnW, btnH),
      Phaser.Geom.Rectangle.Contains
    );

    this.add.text(135 + btnW / 2, btnY + btnH / 2, retryLabel, {
      font: 'bold 22px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    retryBtn.on('pointerup', () => {
      this.scene.restart({ levelId: this.levelRule.id });
    });

    const backBtn = this.add.graphics();
    backBtn.fillStyle(0xe94560, 1);
    backBtn.fillRoundedRect(385, btnY, btnW, btnH, 16);
    backBtn.setInteractive(
      new Phaser.Geom.Rectangle(385, btnY, btnW, btnH),
      Phaser.Geom.Rectangle.Contains
    );

    this.add.text(385 + btnW / 2, btnY + btnH / 2, '返回关卡', {
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
    overlay.fillStyle(0x000000, 0.78);
    overlay.fillRect(0, 0, 750, 1334);
    overlay.setInteractive();

    const modal = this.add.graphics();
    modal.fillStyle(0x16213e, 1);
    modal.fillRoundedRect(110, 400, 530, 480, 24);
    modal.lineStyle(3, 0xe94560, 1);
    modal.strokeRoundedRect(110, 400, 530, 480, 24);

    this.add.text(375, 465, '⏸ 游戏暂停', {
      font: 'bold 36px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    const infoBg = this.add.graphics();
    infoBg.fillStyle(0x0f3460, 0.5);
    infoBg.fillRoundedRect(150, 515, 450, 70, 12);

    const remaining = Math.max(0, this.levelRule.timeLimit - this.elapsedTime);
    this.add.text(375, 550, `剩余时间 ${formatTime(remaining)}  ·  进度 ${this.snappedCount}/${this.pieces.length}`, {
      font: '18px Arial',
      color: '#eaeaea'
    }).setOrigin(0.5);

    const btnW = 350;
    const btnH = 66;
    const startX = 200;
    let btnY = 620;
    const gap = 22;

    const resumeBtn = this.add.graphics();
    resumeBtn.fillStyle(0x4caf50, 1);
    resumeBtn.fillRoundedRect(startX, btnY, btnW, btnH, 16);
    resumeBtn.setInteractive(
      new Phaser.Geom.Rectangle(startX, btnY, btnW, btnH),
      Phaser.Geom.Rectangle.Contains
    );
    this.add.text(startX + btnW / 2, btnY + btnH / 2, '继续游戏', {
      font: 'bold 22px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    btnY += btnH + gap;

    const restartBtn = this.add.graphics();
    restartBtn.fillStyle(0xff9800, 1);
    restartBtn.fillRoundedRect(startX, btnY, btnW, btnH, 16);
    restartBtn.setInteractive(
      new Phaser.Geom.Rectangle(startX, btnY, btnW, btnH),
      Phaser.Geom.Rectangle.Contains
    );
    this.add.text(startX + btnW / 2, btnY + btnH / 2, '重新开始', {
      font: 'bold 22px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    btnY += btnH + gap;

    const quitBtn = this.add.graphics();
    quitBtn.fillStyle(0xe94560, 1);
    quitBtn.fillRoundedRect(startX, btnY, btnW, btnH, 16);
    quitBtn.setInteractive(
      new Phaser.Geom.Rectangle(startX, btnY, btnW, btnH),
      Phaser.Geom.Rectangle.Contains
    );
    this.add.text(startX + btnW / 2, btnY + btnH / 2, '退出关卡', {
      font: 'bold 22px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    resumeBtn.on('pointerup', () => {
      this.isPaused = false;
      this.startTime = this.time.now - this.elapsedTime * 1000;
      overlay.destroy();
      modal.destroy();
      infoBg.destroy();
      resumeBtn.destroy();
      restartBtn.destroy();
      quitBtn.destroy();
      this.children.each(child => {
        if ((child as Phaser.GameObjects.Text).type === 'Text' && (child as Phaser.GameObjects.Text).y > 450) {
          // do nothing
        }
      });
    });

    restartBtn.on('pointerup', () => {
      this.scene.restart({ levelId: this.levelRule.id });
    });

    quitBtn.on('pointerup', () => {
      this.scene.start('LevelSelectScene');
    });
  }
}
