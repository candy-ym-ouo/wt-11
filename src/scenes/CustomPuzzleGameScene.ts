import Phaser from 'phaser';
import { PuzzlePieceSprite } from '../objects/PuzzlePieceSprite';
import { getPlantSpecimen } from '../data/PlantSpecimens';
import { SaveManager } from '../utils/SaveManager';
import { SpecimenTextureGenerator } from '../utils/SpecimenTextureGenerator';
import { getSliceScheme, getDifficultyScheme, getSettlementRule, makeCustomPuzzleKey } from '../data/CustomPuzzleConfig';
import { formatTime, getDifficultyText, getDifficultyColor } from '../utils/GameUtils';
import { PlantSpecimen, SliceScheme, DifficultyScheme, SettlementRule, PuzzlePieceData } from '../types/GameTypes';
import { getDropRule, getFragmentsBySpecimenId, Fragments, Materials } from '../data/WorkshopConfig';

export class CustomPuzzleGameScene extends Phaser.Scene {
  private specimen!: PlantSpecimen;
  private sliceScheme!: SliceScheme;
  private diffScheme!: DifficultyScheme;
  private settlementRule!: SettlementRule;

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
  private perfectSnapCount: number = 0;

  private static readonly TARGET_AREA_X = 375;
  private static readonly TARGET_AREA_Y = 420;
  private static readonly TARGET_AREA_W = 500;
  private static readonly TARGET_AREA_H = 400;
  private static readonly PIECE_AREA_START_Y = 900;

  constructor() {
    super('CustomPuzzleGameScene');
  }

  init(data: { specimenId: number; sliceSchemeId: string; difficultySchemeId: string; settlementRuleId: string }): void {
    const specimen = getPlantSpecimen(data.specimenId);
    const slice = getSliceScheme(data.sliceSchemeId);
    const diff = getDifficultyScheme(data.difficultySchemeId);
    const rule = getSettlementRule(data.settlementRuleId);

    if (!specimen || !slice || !diff || !rule) {
      this.scene.start('CustomPuzzleScene');
      return;
    }

    this.specimen = specimen;
    this.sliceScheme = slice;
    this.diffScheme = diff;
    this.settlementRule = rule;
    this.pieces = [];
    this.snappedCount = 0;
    this.elapsedTime = 0;
    this.isPaused = false;
    this.isCompleted = false;
    this.perfectSnapCount = 0;
    this.showHint = false;
  }

  create(): void {
    this.targetTextureKey = `custom-specimen-${this.specimen.id}-${this.sliceScheme.id}-target`;

    if (!this.textures.exists(this.targetTextureKey)) {
      SpecimenTextureGenerator.generateSpecimenAndPieces(
        this,
        this.specimen,
        this.sliceScheme.rows,
        this.sliceScheme.cols
      );
    }

    const previewKey = `specimen-${this.specimen.id}-preview`;
    if (!this.textures.exists(previewKey)) {
      SpecimenTextureGenerator.generateSpecimenAndPieces(this, this.specimen, 2, 2);
    }

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

    this.add.text(60, 40, `🧩 ${this.specimen.name}`, {
      font: 'bold 28px Arial',
      color: '#ffffff'
    });

    const diffLabel = `${this.sliceScheme.name} · ${this.diffScheme.name} · ${this.settlementRule.name}`;
    this.add.text(60, 80, diffLabel, {
      font: '16px Arial',
      color: '#' + this.diffScheme.color.toString(16).padStart(6, '0')
    });

    const customBadge = this.add.graphics();
    customBadge.fillStyle(0xe94560, 0.9);
    customBadge.fillRoundedRect(520, 20, 190, 28, 8);
    this.add.text(615, 34, '🧩 自定义拼图', {
      font: 'bold 14px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.timeText = this.add.text(690, 45, formatTime(this.diffScheme.timeLimit), {
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
    backBtn.setInteractive(new Phaser.Geom.Rectangle(20, 20, 50, 50), Phaser.Geom.Rectangle.Contains);
    this.add.text(45, 45, '←', { font: 'bold 28px Arial', color: '#ffffff' }).setOrigin(0.5);

    backBtn.on('pointerup', () => this.showPauseMenu());
  }

  private addTargetArea(): void {
    const x = CustomPuzzleGameScene.TARGET_AREA_X;
    const y = CustomPuzzleGameScene.TARGET_AREA_Y;
    const w = CustomPuzzleGameScene.TARGET_AREA_W;
    const h = CustomPuzzleGameScene.TARGET_AREA_H;

    const frame = this.add.graphics();
    frame.lineStyle(4, 0x4caf50, 0.7);
    frame.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 12);

    const dashPattern = [12, 8];
    frame.lineStyle(2, 0x4caf50, 0.3);
    this.drawDashedRect(frame, x - w / 2 + 8, y - h / 2 + 8, w - 16, h - 16, dashPattern);

    this.hintImage = this.add.image(x, y, this.targetTextureKey);
    this.hintImage.setDisplaySize(w - 24, h - 24);
    this.hintImage.setAlpha(0);

    this.add.text(x, y - h / 2 - 28, '标本目标区域', {
      font: 'bold 16px Arial',
      color: '#4caf50'
    }).setOrigin(0.5);
  }

  private drawDashedRect(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, pattern: number[]): void {
    const [dash, gap] = pattern;
    g.beginPath();

    let cursor = 0;
    let draw = true;
    while (cursor < w) {
      const segment = draw ? dash : gap;
      const endX = Math.min(x + cursor + segment, x + w);
      if (draw) { g.moveTo(x + cursor, y); g.lineTo(endX, y); }
      cursor += segment;
      draw = !draw;
    }
    cursor = 0; draw = true;
    while (cursor < h) {
      const segment = draw ? dash : gap;
      const endY = Math.min(y + cursor + segment, y + h);
      if (draw) { g.moveTo(x + w, y + cursor); g.lineTo(x + w, endY); }
      cursor += segment;
      draw = !draw;
    }
    cursor = 0; draw = true;
    while (cursor < w) {
      const segment = draw ? dash : gap;
      const endX = Math.max(x + w - cursor - segment, x);
      if (draw) { g.moveTo(x + w - cursor, y + h); g.lineTo(endX, y + h); }
      cursor += segment;
      draw = !draw;
    }
    cursor = 0; draw = true;
    while (cursor < h) {
      const segment = draw ? dash : gap;
      const endY = Math.max(y + h - cursor - segment, y);
      if (draw) { g.moveTo(x, y + h - cursor); g.lineTo(x, endY); }
      cursor += segment;
      draw = !draw;
    }
    g.strokePath();
  }

  private createPuzzlePieces(): void {
    const pieceDataList = this.generatePieceData();
    pieceDataList.forEach(data => {
      const sprite = new PuzzlePieceSprite(this, data, {
        position: this.diffScheme.snapPositionThreshold,
        rotation: this.diffScheme.snapRotationThreshold
      });
      sprite.setDepth(10);
      this.pieces.push(sprite);
    });
  }

  private generatePieceData(): PuzzlePieceData[] {
    const { rows, cols } = this.sliceScheme;
    const total = rows * cols;
    const areaW = CustomPuzzleGameScene.TARGET_AREA_W - 24;
    const areaH = CustomPuzzleGameScene.TARGET_AREA_H - 24;
    const pieceW = Math.floor(areaW / cols);
    const pieceH = Math.floor(areaH / rows);

    const startTargetX = CustomPuzzleGameScene.TARGET_AREA_X - ((cols - 1) * pieceW) / 2;
    const startTargetY = CustomPuzzleGameScene.TARGET_AREA_Y - ((rows - 1) * pieceH) / 2;

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
    const cols = Math.min(5, count);
    const rows = Math.ceil(count / cols);
    const pieceW = count <= 6 ? 140 : count <= 12 ? 120 : 100;
    const pieceH = count <= 6 ? 110 : count <= 12 ? 95 : 80;

    const totalWidth = cols * pieceW + (cols - 1) * 20;
    const startX = (750 - totalWidth) / 2 + pieceW / 2;
    const startY = CustomPuzzleGameScene.PIECE_AREA_START_Y + pieceH / 2;

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

    this.createControlButton(startX, btnY, btnW, btnH, '旋转', 0x2196f3, () => this.rotateSelectedPiece());
    this.createControlButton(startX + btnW + spacing, btnY, btnW, btnH, '提示', 0xff9800, () => this.toggleHint());
    this.createControlButton(startX + 2 * (btnW + spacing), btnY, btnW, btnH, '重置', 0xf44336, () => this.resetLevel());

    this.input.keyboard?.on('keydown-R', () => this.rotateSelectedPiece());
    this.input.keyboard?.on('keydown-H', () => this.toggleHint());
    this.input.keyboard?.on('keydown-ESC', () => { if (!this.isCompleted) this.showPauseMenu(); });
  }

  private createControlButton(x: number, y: number, w: number, h: number, label: string, color: number, onClick: () => void): void {
    const btn = this.add.graphics();
    btn.fillStyle(color, 1);
    btn.fillRoundedRect(x - w / 2, y - h / 2, w, h, 14);
    btn.setInteractive(new Phaser.Geom.Rectangle(x - w / 2, y - h / 2, w, h), Phaser.Geom.Rectangle.Contains);
    this.add.text(x, y, label, { font: 'bold 20px Arial', color: '#ffffff' }).setOrigin(0.5);

    btn.on('pointerover', () => { btn.clear(); btn.fillStyle(this.lighten(color, 20), 1); btn.fillRoundedRect(x - w / 2, y - h / 2, w, h, 14); });
    btn.on('pointerout', () => { btn.clear(); btn.fillStyle(color, 1); btn.fillRoundedRect(x - w / 2, y - h / 2, w, h, 14); });
    btn.on('pointerdown', () => { btn.clear(); btn.fillStyle(this.darken(color, 20), 1); btn.fillRoundedRect(x - w / 2, y - h / 2, w, h, 14); });
    btn.on('pointerup', () => { btn.clear(); btn.fillStyle(color, 1); btn.fillRoundedRect(x - w / 2, y - h / 2, w, h, 14); onClick(); });
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
      const piece = this.pieces.find(p => !p.isPieceSnapped());
      if (piece) { piece.setSelected(true); piece.rotatePiece(); }
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
    this.perfectSnapCount = 0;
    this.showHint = false;
    this.hintImage.setAlpha(0);
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
      if (data.isPerfect) this.perfectSnapCount++;
      this.updateUI();
      this.cameras.main.flash(80, 255, 255, 200, false);

      if (this.snappedCount >= this.pieces.length) {
        this.time.delayedCall(400, () => this.onLevelComplete());
      }
    });

    this.events.on('piece-missed', () => {});

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const objects = this.input.hitTestPointer(pointer);
      const pieceHit = objects.some(obj => this.pieces.includes(obj as PuzzlePieceSprite));
      if (!pieceHit) PuzzlePieceSprite.clearSelection();
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
    const remaining = Math.max(0, this.diffScheme.timeLimit - this.elapsedTime);
    this.timeText.setText(formatTime(remaining));

    if (this.diffScheme.timeLimit >= 999) {
      this.timeText.setText(formatTime(this.elapsedTime));
      this.timeText.setColor('#ffd700');
    } else {
      if (remaining < 30) this.timeText.setColor('#f44336');
      else if (remaining < 60) this.timeText.setColor('#ff9800');
      else this.timeText.setColor('#ffd700');

      if (remaining <= 0 && !this.isCompleted) this.onTimeUp();
    }
  }

  private updateUI(): void {
    const result = this.calculateCustomScore();
    const finalScore = Math.floor(result.score * this.diffScheme.scoreMultiplier);
    this.scoreText.setText(`得分: ${finalScore}`);
  }

  private calculateCustomScore(): { score: number; stars: number } {
    const rule = this.settlementRule;
    const timeRemaining = Math.max(0, this.diffScheme.timeLimit - this.elapsedTime);
    const timeBonus = Math.floor(timeRemaining * rule.timeBonusPerSecond);
    const perfectBonus = this.perfectSnapCount * rule.perfectSnapBonus;
    const baseScore = this.pieces.length * (rule.baseScore / this.pieces.length);

    const totalScore = Math.floor(baseScore + timeBonus + perfectBonus);

    let stars = 0;
    if (totalScore >= rule.starThresholds[0]) stars = 1;
    if (totalScore >= rule.starThresholds[1]) stars = 2;
    if (totalScore >= rule.starThresholds[2]) stars = 3;

    return { score: totalScore, stars };
  }

  private onLevelComplete(): void {
    this.isCompleted = true;
    if (this.timerEvent) this.timerEvent.paused = true;

    const result = this.calculateCustomScore();
    const finalScore = Math.floor(result.score * this.diffScheme.scoreMultiplier);

    const key = makeCustomPuzzleKey(this.specimen.id, this.sliceScheme.id, this.diffScheme.id, this.settlementRule.id);
    SaveManager.saveCustomPuzzleRecord(key, {
      specimenId: this.specimen.id,
      sliceSchemeId: this.sliceScheme.id,
      difficultySchemeId: this.diffScheme.id,
      settlementRuleId: this.settlementRule.id,
      bestScore: finalScore,
      bestTime: this.elapsedTime,
      stars: result.stars,
      playCount: 1,
      lastPlayedAt: Date.now()
    });

    const drops = this.calculateDrops(result.stars);
    SaveManager.addWorkshopDrops(drops);

    this.cameras.main.zoomTo(1.05, 400, 'Cubic.easeInOut', true);
    this.time.delayedCall(450, () => {
      this.cameras.main.zoomTo(1.0, 400, 'Cubic.easeInOut', true);
      this.showVictory(finalScore, result.stars, this.elapsedTime, drops);
    });
  }

  private onTimeUp(): void {
    this.isCompleted = true;
    if (this.timerEvent) this.timerEvent.paused = true;

    const result = this.calculateCustomScore();
    const finalScore = Math.floor(result.score * this.diffScheme.scoreMultiplier);

    const key = makeCustomPuzzleKey(this.specimen.id, this.sliceScheme.id, this.diffScheme.id, this.settlementRule.id);
    SaveManager.saveCustomPuzzleRecord(key, {
      specimenId: this.specimen.id,
      sliceSchemeId: this.sliceScheme.id,
      difficultySchemeId: this.diffScheme.id,
      settlementRuleId: this.settlementRule.id,
      bestScore: finalScore,
      bestTime: this.elapsedTime,
      stars: 0,
      playCount: 1,
      lastPlayedAt: Date.now()
    });

    this.showGameOver(finalScore, this.snappedCount, this.pieces.length);
  }

  private calculateDrops(stars: number): { fragments: { id: number; count: number }[]; materials: { id: number; count: number }[] } {
    const effectiveDifficulty = this.sliceScheme.difficulty;
    const rule = getDropRule(effectiveDifficulty, stars);
    if (!rule) return { fragments: [], materials: [] };

    const specimenFragments = getFragmentsBySpecimenId(this.specimen.id);
    const fragmentDrops: { id: number; count: number }[] = [];
    const materialDrops: { id: number; count: number }[] = [];

    const fragBonus = this.settlementRule.fragmentDropBonus;
    const matBonus = this.settlementRule.materialDropBonus;

    rule.fragmentDrops.forEach(drop => {
      const matching = specimenFragments.filter(f => f.rarity === drop.rarity);
      if (matching.length > 0) {
        const frag = matching[Phaser.Math.Between(0, matching.length - 1)];
        const count = Math.max(1, Math.floor(Phaser.Math.Between(drop.minCount, drop.maxCount) * fragBonus));
        const existing = fragmentDrops.find(d => d.id === frag.id);
        if (existing) existing.count += count;
        else fragmentDrops.push({ id: frag.id, count });
      }
    });

    rule.materialDrops.forEach(drop => {
      const count = Math.max(1, Math.floor(Phaser.Math.Between(drop.minCount, drop.maxCount) * matBonus));
      const existing = materialDrops.find(d => d.id === drop.materialId);
      if (existing) existing.count += count;
      else materialDrops.push({ id: drop.materialId, count });
    });

    return { fragments: fragmentDrops, materials: materialDrops };
  }

  private showVictory(score: number, stars: number, time: number, drops: { fragments: { id: number; count: number }[]; materials: { id: number; count: number }[] }): void {
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.78);
    overlay.fillRect(0, 0, 750, 1334);
    overlay.setInteractive().setDepth(100);

    const container = this.add.container(0, 0).setDepth(101);

    const modalY = 280;
    const modalH = 780;
    const modal = this.add.graphics();
    modal.fillStyle(0x16213e, 1);
    modal.fillRoundedRect(80, modalY, 590, modalH, 24);
    modal.lineStyle(4, 0x4caf50, 1);
    modal.strokeRoundedRect(80, modalY, 590, modalH, 24);
    container.add(modal);

    container.add(this.add.text(375, modalY + 55, '🎉 拼图完成！', {
      font: 'bold 38px Arial', color: '#4caf50'
    }).setOrigin(0.5));

    container.add(this.add.text(375, modalY + 100, `${this.specimen.name} · ${this.sliceScheme.name} · ${this.diffScheme.name}`, {
      font: '16px Arial', color: '#aaaaaa'
    }).setOrigin(0.5));

    for (let i = 0; i < 3; i++) {
      const tex = i < stars ? 'star-filled' : 'star-empty';
      const starX = 375 - 55 + i * 55;
      const img = this.add.image(starX, modalY + 170, tex).setDisplaySize(45, 45);
      img.setScale(0);
      this.tweens.add({ targets: img, scale: 1, delay: i * 150, duration: 300, ease: 'Back.easeOut' });
      container.add(img);
    }

    const scoreBg = this.add.graphics();
    scoreBg.fillStyle(0x0f3460, 0.6);
    scoreBg.fillRoundedRect(130, modalY + 220, 490, 100, 16);
    container.add(scoreBg);

    container.add(this.add.text(375, modalY + 250, '最终得分', {
      font: '20px Arial', color: '#aaaaaa'
    }).setOrigin(0.5));

    container.add(this.add.text(375, modalY + 295, score.toLocaleString(), {
      font: 'bold 40px Arial', color: '#ffd700'
    }).setOrigin(0.5));

    container.add(this.add.text(375, modalY + 330, `用时 ${formatTime(time)}  ·  修复 ${this.pieces.length}/${this.pieces.length} 片  ·  完美 ${this.perfectSnapCount}`, {
      font: '15px Arial', color: '#eaeaea'
    }).setOrigin(0.5));

    let itemY = modalY + 370;
    if (drops.fragments.length > 0 || drops.materials.length > 0) {
      const dropBg = this.add.graphics();
      dropBg.fillStyle(0x1a2a4a, 0.9);
      dropBg.fillRoundedRect(130, itemY, 490, 28 + (drops.fragments.length + drops.materials.length) * 22, 12);
      dropBg.lineStyle(2, 0xff9800, 0.5);
      dropBg.strokeRoundedRect(130, itemY, 490, 28 + (drops.fragments.length + drops.materials.length) * 22, 12);
      container.add(dropBg);

      container.add(this.add.text(375, itemY + 14, '🧩 获得碎片与材料', {
        font: 'bold 14px Arial', color: '#ff9800'
      }).setOrigin(0.5));

      let dy = itemY + 34;
      drops.fragments.forEach(drop => {
        const frag = Fragments.find(f => f.id === drop.id);
        if (frag) {
          container.add(this.add.text(165, dy, `🧩 ${frag.name} ×${drop.count}`, {
            font: '13px Arial', color: '#4caf50'
          }).setOrigin(0, 0.5));
          dy += 22;
        }
      });
      drops.materials.forEach(drop => {
        const mat = Materials.find(m => m.id === drop.id);
        if (mat) {
          container.add(this.add.text(165, dy, `${mat.icon} ${mat.name} ×${drop.count}`, {
            font: '13px Arial', color: '#2196f3'
          }).setOrigin(0, 0.5));
          dy += 22;
        }
      });

      itemY = dy + 15;
    }

    const settlementInfo = this.add.graphics();
    settlementInfo.fillStyle(0x0f3460, 0.7);
    settlementInfo.fillRoundedRect(130, itemY, 490, 80, 12);
    container.add(settlementInfo);

    container.add(this.add.text(375, itemY + 18, `📊 ${this.settlementRule.name}`, {
      font: 'bold 15px Arial', color: '#ffd700'
    }).setOrigin(0.5));

    container.add(this.add.text(375, itemY + 42, `基础${this.settlementRule.baseScore} + 时间×${this.settlementRule.timeBonusPerSecond}/s + 完美×${this.settlementRule.perfectSnapBonus}`, {
      font: '13px Arial', color: '#cccccc'
    }).setOrigin(0.5));

    container.add(this.add.text(375, itemY + 62, `难度倍率 ×${this.diffScheme.scoreMultiplier}  |  碎片加成 ×${this.settlementRule.fragmentDropBonus}  |  材料加成 ×${this.settlementRule.materialDropBonus}`, {
      font: '12px Arial', color: '#999999'
    }).setOrigin(0.5));

    itemY += 95;

    const btn1 = this.add.graphics();
    btn1.fillStyle(0x4caf50, 1);
    btn1.fillRoundedRect(120, itemY, 230, 50, 12);
    btn1.setInteractive(new Phaser.Geom.Rectangle(120, itemY, 230, 50), Phaser.Geom.Rectangle.Contains);
    container.add(btn1);
    container.add(this.add.text(235, itemY + 25, '🔄 再来一次', {
      font: 'bold 18px Arial', color: '#ffffff'
    }).setOrigin(0.5));

    btn1.on('pointerup', () => {
      container.destroy();
      overlay.destroy();
      this.scene.restart({
        specimenId: this.specimen.id,
        sliceSchemeId: this.sliceScheme.id,
        difficultySchemeId: this.diffScheme.id,
        settlementRuleId: this.settlementRule.id
      });
    });

    const btn2 = this.add.graphics();
    btn2.fillStyle(0x2196f3, 1);
    btn2.fillRoundedRect(380, itemY, 230, 50, 12);
    btn2.setInteractive(new Phaser.Geom.Rectangle(380, itemY, 230, 50), Phaser.Geom.Rectangle.Contains);
    container.add(btn2);
    container.add(this.add.text(495, itemY + 25, '🧩 返回工坊', {
      font: 'bold 18px Arial', color: '#ffffff'
    }).setOrigin(0.5));

    btn2.on('pointerup', () => {
      container.destroy();
      overlay.destroy();
      this.scene.start('CustomPuzzleScene');
    });

    overlay.on('pointerup', () => {});
  }

  private showGameOver(score: number, snapped: number, total: number): void {
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.78);
    overlay.fillRect(0, 0, 750, 1334);
    overlay.setInteractive().setDepth(100);

    const container = this.add.container(0, 0).setDepth(101);

    const modalY = 350;
    const modalH = 550;
    const modal = this.add.graphics();
    modal.fillStyle(0x16213e, 1);
    modal.fillRoundedRect(80, modalY, 590, modalH, 24);
    modal.lineStyle(4, 0xf44336, 1);
    modal.strokeRoundedRect(80, modalY, 590, modalH, 24);
    container.add(modal);

    container.add(this.add.text(375, modalY + 55, '⏰ 时间到！', {
      font: 'bold 38px Arial', color: '#f44336'
    }).setOrigin(0.5));

    container.add(this.add.text(375, modalY + 120, `得分: ${score.toLocaleString()}`, {
      font: 'bold 28px Arial', color: '#ffd700'
    }).setOrigin(0.5));

    container.add(this.add.text(375, modalY + 170, `修复 ${snapped}/${total} 片`, {
      font: '20px Arial', color: '#eaeaea'
    }).setOrigin(0.5));

    const btn1 = this.add.graphics();
    btn1.fillStyle(0xff9800, 1);
    btn1.fillRoundedRect(120, modalY + 240, 230, 50, 12);
    btn1.setInteractive(new Phaser.Geom.Rectangle(120, modalY + 240, 230, 50), Phaser.Geom.Rectangle.Contains);
    container.add(btn1);
    container.add(this.add.text(235, modalY + 265, '🔄 重试', {
      font: 'bold 18px Arial', color: '#ffffff'
    }).setOrigin(0.5));

    btn1.on('pointerup', () => {
      container.destroy();
      overlay.destroy();
      this.scene.restart({
        specimenId: this.specimen.id,
        sliceSchemeId: this.sliceScheme.id,
        difficultySchemeId: this.diffScheme.id,
        settlementRuleId: this.settlementRule.id
      });
    });

    const btn2 = this.add.graphics();
    btn2.fillStyle(0xe94560, 1);
    btn2.fillRoundedRect(380, modalY + 240, 230, 50, 12);
    btn2.setInteractive(new Phaser.Geom.Rectangle(380, modalY + 240, 230, 50), Phaser.Geom.Rectangle.Contains);
    container.add(btn2);
    container.add(this.add.text(495, modalY + 265, '🧩 返回工坊', {
      font: 'bold 18px Arial', color: '#ffffff'
    }).setOrigin(0.5));

    btn2.on('pointerup', () => {
      container.destroy();
      overlay.destroy();
      this.scene.start('CustomPuzzleScene');
    });

    overlay.on('pointerup', () => {});
  }

  private showPauseMenu(): void {
    this.isPaused = true;

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, 750, 1334);
    overlay.setInteractive().setDepth(100);

    const container = this.add.container(0, 0).setDepth(101);

    const modalY = 400;
    const modal = this.add.graphics();
    modal.fillStyle(0x16213e, 1);
    modal.fillRoundedRect(120, modalY, 510, 320, 20);
    modal.lineStyle(3, 0xff9800, 1);
    modal.strokeRoundedRect(120, modalY, 510, 320, 20);
    container.add(modal);

    container.add(this.add.text(375, modalY + 50, '⏸ 暂停', {
      font: 'bold 36px Arial', color: '#ff9800'
    }).setOrigin(0.5));

    const resumeBtn = this.add.graphics();
    resumeBtn.fillStyle(0x4caf50, 1);
    resumeBtn.fillRoundedRect(190, modalY + 110, 370, 50, 12);
    resumeBtn.setInteractive(new Phaser.Geom.Rectangle(190, modalY + 110, 370, 50), Phaser.Geom.Rectangle.Contains);
    container.add(resumeBtn);
    container.add(this.add.text(375, modalY + 135, '▶ 继续', {
      font: 'bold 22px Arial', color: '#ffffff'
    }).setOrigin(0.5));

    const quitBtn = this.add.graphics();
    quitBtn.fillStyle(0xe94560, 1);
    quitBtn.fillRoundedRect(190, modalY + 180, 370, 50, 12);
    quitBtn.setInteractive(new Phaser.Geom.Rectangle(190, modalY + 180, 370, 50), Phaser.Geom.Rectangle.Contains);
    container.add(quitBtn);
    container.add(this.add.text(375, modalY + 205, '🧩 返回工坊', {
      font: 'bold 22px Arial', color: '#ffffff'
    }).setOrigin(0.5));

    const resume = () => {
      this.isPaused = false;
      this.startTime = this.time.now - this.elapsedTime * 1000;
      container.destroy();
      overlay.destroy();
    };

    resumeBtn.on('pointerup', resume);
    quitBtn.on('pointerup', () => {
      container.destroy();
      overlay.destroy();
      this.scene.start('CustomPuzzleScene');
    });
  }
}
