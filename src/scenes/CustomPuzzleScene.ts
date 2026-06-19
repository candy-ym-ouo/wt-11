import Phaser from 'phaser';
import { PlantSpecimens } from '../data/PlantSpecimens';
import { SliceSchemes, DifficultySchemes, SettlementRules, getSliceScheme, getDifficultyScheme, getSettlementRule, makeCustomPuzzleKey } from '../data/CustomPuzzleConfig';
import { SaveManager } from '../utils/SaveManager';
import { SpecimenTextureGenerator } from '../utils/SpecimenTextureGenerator';
import { SliceScheme, DifficultyScheme, SettlementRule, PlantSpecimen } from '../types/GameTypes';

type StepKey = 'specimen' | 'slice' | 'difficulty' | 'settlement';

export class CustomPuzzleScene extends Phaser.Scene {
  private currentStep: StepKey = 'specimen';
  private selectedSpecimenId: number = 1;
  private selectedSliceId: string = '2x2';
  private selectedDifficultyId: string = 'normal';
  private selectedSettlementId: string = 'standard';
  private scrollOffset: number = 0;

  constructor() {
    super('CustomPuzzleScene');
  }

  create(): void {
    this.scrollOffset = 0;
    this.cameras.main.setBackgroundColor('#1a1a2e');
    this.addBackground();
    this.addTitle();
    this.addStepIndicator();
    this.addContent();
    this.addBottomBar();
    this.addBackButton();

    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: any[], _dx: number, dy: number) => {
      const maxScroll = this.getMaxScroll();
      this.scrollOffset = Phaser.Math.Clamp(this.scrollOffset + dy, 0, maxScroll);
      this.refreshContent();
    });
  }

  private addBackground(): void {
    const bg = this.add.graphics();
    bg.fillStyle(0x16213e, 1);
    bg.fillRoundedRect(25, 100, 700, 1150, 20);
  }

  private addTitle(): void {
    this.add.text(375, 50, '🧩 拼图工坊', {
      font: 'bold 38px Arial',
      color: '#e94560'
    }).setOrigin(0.5);

    this.add.text(375, 90, '自定义拼图 · 自由组合', {
      font: '20px Arial',
      color: '#aaaaaa'
    }).setOrigin(0.5);
  }

  private addStepIndicator(): void {
    const steps: StepKey[] = ['specimen', 'slice', 'difficulty', 'settlement'];
    const labels: Record<StepKey, string> = {
      specimen: '🌿 素材',
      slice: '✂️ 切片',
      difficulty: '⚡ 难度',
      settlement: '📊 结算'
    };
    const stepY = 130;
    const stepW = 155;
    const stepH = 40;
    const gap = 12;
    const totalW = stepW * steps.length + gap * (steps.length - 1);
    const startX = (750 - totalW) / 2;

    steps.forEach((step, i) => {
      const x = startX + i * (stepW + gap);
      const isActive = this.currentStep === step;
      const stepIndex = steps.indexOf(this.currentStep);
      const thisIndex = i;
      const isPast = thisIndex < stepIndex;

      const bg = this.add.graphics();
      if (isActive) {
        bg.fillStyle(0xe94560, 1);
      } else if (isPast) {
        bg.fillStyle(0x4caf50, 0.8);
      } else {
        bg.fillStyle(0x0f3460, 0.7);
      }
      bg.fillRoundedRect(x, stepY, stepW, stepH, 8);

      this.add.text(x + stepW / 2, stepY + stepH / 2, labels[step], {
        font: `bold ${isActive ? 16 : 14}px Arial`,
        color: isActive || isPast ? '#ffffff' : '#888888'
      }).setOrigin(0.5);

      if (isPast) {
        bg.setInteractive(new Phaser.Geom.Rectangle(x, stepY, stepW, stepH), Phaser.Geom.Rectangle.Contains);
        bg.on('pointerup', () => {
          this.currentStep = step;
          this.scrollOffset = 0;
          this.refreshContent();
        });
      }
    });
  }

  private addContent(): void {
    this.renderStepContent();
  }

  private stepContentItems: Phaser.GameObjects.GameObject[] = [];

  private refreshContent(): void {
    this.stepContentItems.forEach(c => c.destroy());
    this.stepContentItems = [];
    this.renderStepContent();
  }

  private renderStepContent(): void {
    switch (this.currentStep) {
      case 'specimen':
        this.renderSpecimenStep();
        break;
      case 'slice':
        this.renderSliceStep();
        break;
      case 'difficulty':
        this.renderDifficultyStep();
        break;
      case 'settlement':
        this.renderSettlementStep();
        break;
    }
  }

  private renderSpecimenStep(): void {
    const startY = 195 - this.scrollOffset;
    const cardW = 320;
    const cardH = 120;
    const padding = 15;
    const cols = 2;
    const specimens = Object.values(PlantSpecimens).filter(s => s.id <= 6);

    this.addSectionLabel(375, 195 - this.scrollOffset, '选择植物素材');

    specimens.forEach((specimen, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = padding + 25 + col * (cardW + padding) + cardW / 2;
      const y = startY + 40 + row * (cardH + padding) + cardH / 2;

      if (y < 160 || y > 1200) return;

      const isSelected = this.selectedSpecimenId === specimen.id;
      const card = this.add.graphics();
      this.track(card);
      card.fillStyle(isSelected ? 0x1a3a5c : 0x0f3460, 0.95);
      card.fillRoundedRect(x - cardW / 2, y - cardH / 2, cardW, cardH, 12);
      if (isSelected) {
        card.lineStyle(3, 0xe94560, 1);
        card.strokeRoundedRect(x - cardW / 2, y - cardH / 2, cardW, cardH, 12);
      }

      const previewKey = `specimen-${specimen.id}-preview`;
      if (this.textures.exists(previewKey)) {
        const img = this.add.image(x - cardW / 2 + 60, y, previewKey).setDisplaySize(80, 80);
        this.track(img);
        if (!isSelected) img.setAlpha(0.6);
      }

      this.track(this.add.text(x - cardW / 2 + 115, y - 20, specimen.name, {
        font: 'bold 18px Arial',
        color: isSelected ? '#ffffff' : '#cccccc'
      }).setOrigin(0, 0.5));

      this.track(this.add.text(x - cardW / 2 + 115, y + 10, specimen.family, {
        font: '13px Arial',
        color: '#aaaaaa'
      }).setOrigin(0, 0.5));

      this.track(this.add.text(x - cardW / 2 + 115, y + 32, specimen.shape, {
        font: '12px Arial',
        color: '#888888'
      }).setOrigin(0, 0.5));

      card.setInteractive(new Phaser.Geom.Rectangle(x - cardW / 2, y - cardH / 2, cardW, cardH), Phaser.Geom.Rectangle.Contains);
      card.on('pointerup', () => {
        this.selectedSpecimenId = specimen.id;
        this.refreshContent();
      });
    });
  }

  private renderSliceStep(): void {
    const startY = 195 - this.scrollOffset;
    const cardW = 660;
    const cardH = 85;
    const padding = 12;

    this.addSectionLabel(375, 195 - this.scrollOffset, '选择切片规格');

    SliceSchemes.forEach((scheme, index) => {
      const y = startY + 40 + index * (cardH + padding) + cardH / 2;
      if (y < 160 || y > 1200) return;

      const isSelected = this.selectedSliceId === scheme.id;
      const card = this.add.graphics();
      this.track(card);
      card.fillStyle(isSelected ? 0x1a3a5c : 0x0f3460, 0.95);
      card.fillRoundedRect(45, y - cardH / 2, cardW, cardH, 10);
      if (isSelected) {
        card.lineStyle(3, 0xe94560, 1);
        card.strokeRoundedRect(45, y - cardH / 2, cardW, cardH, 10);
      }

      this.track(this.add.text(80, y - 15, `${scheme.icon} ${scheme.name}`, {
        font: 'bold 18px Arial',
        color: isSelected ? '#ffffff' : '#cccccc'
      }).setOrigin(0, 0.5));

      this.track(this.add.text(80, y + 15, scheme.description, {
        font: '14px Arial',
        color: '#aaaaaa'
      }).setOrigin(0, 0.5));

      const gridLabel = `${scheme.rows}×${scheme.cols} = ${scheme.rows * scheme.cols}片`;
      this.track(this.add.text(665, y - 10, gridLabel, {
        font: 'bold 20px Arial',
        color: isSelected ? '#e94560' : '#ffd700'
      }).setOrigin(1, 0.5));

      const diffColor = scheme.difficulty === 'easy' ? '#4caf50' : scheme.difficulty === 'medium' ? '#ff9800' : '#f44336';
      const diffText = scheme.difficulty === 'easy' ? '简单' : scheme.difficulty === 'medium' ? '中等' : '困难';
      this.track(this.add.text(665, y + 15, diffText, {
        font: 'bold 13px Arial',
        color: diffColor
      }).setOrigin(1, 0.5));

      card.setInteractive(new Phaser.Geom.Rectangle(45, y - cardH / 2, cardW, cardH), Phaser.Geom.Rectangle.Contains);
      card.on('pointerup', () => {
        this.selectedSliceId = scheme.id;
        this.refreshContent();
      });
    });
  }

  private renderDifficultyStep(): void {
    const startY = 195 - this.scrollOffset;
    const cardW = 660;
    const cardH = 120;
    const padding = 15;

    this.addSectionLabel(375, 195 - this.scrollOffset, '选择难度方案');

    DifficultySchemes.forEach((scheme, index) => {
      const y = startY + 40 + index * (cardH + padding) + cardH / 2;
      if (y < 160 || y > 1200) return;

      const isSelected = this.selectedDifficultyId === scheme.id;
      const card = this.add.graphics();
      this.track(card);
      card.fillStyle(isSelected ? 0x1a3a5c : 0x0f3460, 0.95);
      card.fillRoundedRect(45, y - cardH / 2, cardW, cardH, 10);
      if (isSelected) {
        card.lineStyle(3, scheme.color, 1);
        card.strokeRoundedRect(45, y - cardH / 2, cardW, cardH, 10);
      }

      this.track(this.add.text(80, y - 35, `${scheme.icon} ${scheme.name}`, {
        font: 'bold 20px Arial',
        color: isSelected ? '#ffffff' : '#cccccc'
      }).setOrigin(0, 0.5));

      this.track(this.add.text(80, y - 8, scheme.description, {
        font: '14px Arial',
        color: '#aaaaaa'
      }).setOrigin(0, 0.5));

      const timeLabel = scheme.timeLimit >= 999 ? '∞' : `${scheme.timeLimit}秒`;
      this.track(this.add.text(80, y + 18, `时限: ${timeLabel}`, {
        font: 'bold 14px Arial',
        color: '#ffd700'
      }).setOrigin(0, 0.5));

      this.track(this.add.text(280, y + 18, `吸附: ${scheme.snapPositionThreshold}px`, {
        font: '14px Arial',
        color: '#2196f3'
      }).setOrigin(0, 0.5));

      this.track(this.add.text(460, y + 18, `角度: ±${scheme.snapRotationThreshold}°`, {
        font: '14px Arial',
        color: '#2196f3'
      }).setOrigin(0, 0.5));

      const multBg = this.add.graphics();
      this.track(multBg);
      multBg.fillStyle(scheme.color, 0.9);
      multBg.fillRoundedRect(570, y - 38, 120, 36, 8);
      this.track(this.add.text(630, y - 20, `×${scheme.scoreMultiplier}`, {
        font: 'bold 20px Arial',
        color: '#ffffff'
      }).setOrigin(0.5));

      card.setInteractive(new Phaser.Geom.Rectangle(45, y - cardH / 2, cardW, cardH), Phaser.Geom.Rectangle.Contains);
      card.on('pointerup', () => {
        this.selectedDifficultyId = scheme.id;
        this.refreshContent();
      });
    });
  }

  private renderSettlementStep(): void {
    const startY = 195 - this.scrollOffset;
    const cardW = 660;
    const cardH = 140;
    const padding = 15;

    this.addSectionLabel(375, 195 - this.scrollOffset, '选择结算规则');

    SettlementRules.forEach((rule, index) => {
      const y = startY + 40 + index * (cardH + padding) + cardH / 2;
      if (y < 160 || y > 1200) return;

      const isSelected = this.selectedSettlementId === rule.id;
      const card = this.add.graphics();
      this.track(card);
      card.fillStyle(isSelected ? 0x1a3a5c : 0x0f3460, 0.95);
      card.fillRoundedRect(45, y - cardH / 2, cardW, cardH, 10);
      if (isSelected) {
        card.lineStyle(3, 0xffd700, 1);
        card.strokeRoundedRect(45, y - cardH / 2, cardW, cardH, 10);
      }

      this.track(this.add.text(80, y - 50, `${rule.icon} ${rule.name}`, {
        font: 'bold 20px Arial',
        color: isSelected ? '#ffffff' : '#cccccc'
      }).setOrigin(0, 0.5));

      this.track(this.add.text(80, y - 22, rule.description, {
        font: '14px Arial',
        color: '#aaaaaa'
      }).setOrigin(0, 0.5));

      this.track(this.add.text(80, y + 8, `基础分: ${rule.baseScore}`, {
        font: 'bold 13px Arial',
        color: '#ffd700'
      }).setOrigin(0, 0.5));

      this.track(this.add.text(250, y + 8, `时间奖励: +${rule.timeBonusPerSecond}/s`, {
        font: '13px Arial',
        color: '#2196f3'
      }).setOrigin(0, 0.5));

      this.track(this.add.text(460, y + 8, `完美奖励: +${rule.perfectSnapBonus}`, {
        font: '13px Arial',
        color: '#4caf50'
      }).setOrigin(0, 0.5));

      this.track(this.add.text(80, y + 32, `⭐ 星级: ${rule.starThresholds.join(' / ')}`, {
        font: '13px Arial',
        color: '#ff9800'
      }).setOrigin(0, 0.5));

      const fragMult = rule.fragmentDropBonus;
      const matMult = rule.materialDropBonus;
      const dropColor = fragMult > 1 || matMult > 1 ? '#4caf50' : '#888888';
      this.track(this.add.text(80, y + 54, `掉落加成: 碎片×${fragMult} 材料×${matMult}`, {
        font: 'bold 13px Arial',
        color: dropColor
      }).setOrigin(0, 0.5));

      card.setInteractive(new Phaser.Geom.Rectangle(45, y - cardH / 2, cardW, cardH), Phaser.Geom.Rectangle.Contains);
      card.on('pointerup', () => {
        this.selectedSettlementId = rule.id;
        this.refreshContent();
      });
    });
  }

  private track(obj: Phaser.GameObjects.GameObject): Phaser.GameObjects.GameObject {
    this.stepContentItems.push(obj);
    return obj;
  }

  private addSectionLabel(x: number, y: number, text: string): void {
    this.track(this.add.text(x, y, text, {
      font: 'bold 18px Arial',
      color: '#e94560'
    }).setOrigin(0.5));
  }

  private addBottomBar(): void {
    const barY = 1180;

    const bar = this.add.graphics();
    bar.fillStyle(0x0f3460, 0.9);
    bar.fillRoundedRect(25, barY - 15, 700, 80, 16);

    this.addConfigSummary(barY + 10);

    const previewBtn = this.add.graphics();
    previewBtn.fillStyle(0x2196f3, 1);
    previewBtn.fillRoundedRect(45, barY + 35, 200, 40, 10);
    previewBtn.setInteractive(new Phaser.Geom.Rectangle(45, barY + 35, 200, 40), Phaser.Geom.Rectangle.Contains);
    this.add.text(145, barY + 55, '👁 预览', {
      font: 'bold 18px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    previewBtn.on('pointerup', () => {
      this.showPreviewModal();
    });

    const startBtn = this.add.graphics();
    startBtn.fillStyle(0x4caf50, 1);
    startBtn.fillRoundedRect(270, barY + 35, 440, 40, 10);
    startBtn.setInteractive(new Phaser.Geom.Rectangle(270, barY + 35, 440, 40), Phaser.Geom.Rectangle.Contains);
    this.add.text(490, barY + 55, '🚀 开始拼图', {
      font: 'bold 20px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    startBtn.on('pointerup', () => {
      this.startCustomPuzzle();
    });

    startBtn.on('pointerover', () => {
      startBtn.clear();
      startBtn.fillStyle(0x66bb6a, 1);
      startBtn.fillRoundedRect(270, barY + 35, 440, 40, 10);
    });
    startBtn.on('pointerout', () => {
      startBtn.clear();
      startBtn.fillStyle(0x4caf50, 1);
      startBtn.fillRoundedRect(270, barY + 35, 440, 40, 10);
    });
  }

  private addConfigSummary(y: number): void {
    const specimen = PlantSpecimens[this.selectedSpecimenId];
    const slice = getSliceScheme(this.selectedSliceId);
    const diff = getDifficultyScheme(this.selectedDifficultyId);
    const rule = getSettlementRule(this.selectedSettlementId);

    const parts: string[] = [];
    if (specimen) parts.push(specimen.name);
    if (slice) parts.push(`${slice.rows}×${slice.cols}`);
    if (diff) parts.push(diff.name);
    if (rule) parts.push(rule.name);

    this.add.text(375, y, parts.join('  ·  '), {
      font: 'bold 15px Arial',
      color: '#ffd700'
    }).setOrigin(0.5);
  }

  private showPreviewModal(): void {
    const specimen = PlantSpecimens[this.selectedSpecimenId];
    const slice = getSliceScheme(this.selectedSliceId);
    const diff = getDifficultyScheme(this.selectedDifficultyId);
    const rule = getSettlementRule(this.selectedSettlementId);
    if (!specimen || !slice || !diff || !rule) return;

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.85);
    overlay.fillRect(0, 0, 750, 1334);
    overlay.setInteractive();
    overlay.setDepth(100);

    const container = this.add.container(0, 0).setDepth(101);

    const modalW = 600;
    const modalH = 820;
    const modalX = (750 - modalW) / 2;
    const modalY = 250;

    const modal = this.add.graphics();
    modal.fillStyle(0x16213e, 1);
    modal.fillRoundedRect(modalX, modalY, modalW, modalH, 24);
    modal.lineStyle(3, 0xe94560, 1);
    modal.strokeRoundedRect(modalX, modalY, modalW, modalH, 24);
    container.add(modal);

    container.add(this.add.text(375, modalY + 45, '🔍 拼图预览', {
      font: 'bold 28px Arial',
      color: '#e94560'
    }).setOrigin(0.5));

    const targetKey = `specimen-${specimen.id}-target`;
    const previewKey = `custom-preview-${specimen.id}-${slice.id}`;

    if (!this.textures.exists(previewKey)) {
      SpecimenTextureGenerator.generateSpecimenAndPieces(this, specimen, slice.rows, slice.cols);
    }

    if (this.textures.exists(targetKey)) {
      const img = this.add.image(375, modalY + 250, targetKey).setDisplaySize(420, 340);
      container.add(img);

      const gridOverlay = this.add.graphics();
      const imgW = 420;
      const imgH = 340;
      const cellW = imgW / slice.cols;
      const cellH = imgH / slice.rows;
      const imgStartX = 375 - imgW / 2;
      const imgStartY = modalY + 250 - imgH / 2;

      gridOverlay.lineStyle(2, 0xe94560, 0.7);
      for (let r = 1; r < slice.rows; r++) {
        gridOverlay.lineBetween(imgStartX, imgStartY + r * cellH, imgStartX + imgW, imgStartY + r * cellH);
      }
      for (let c = 1; c < slice.cols; c++) {
        gridOverlay.lineBetween(imgStartX + c * cellW, imgStartY, imgStartX + c * cellW, imgStartY + imgH);
      }
      container.add(gridOverlay);
    }

    let infoY = modalY + 460;
    const infoX = modalX + 40;
    const lineH = 30;

    container.add(this.add.text(infoX, infoY, `🌿 素材: ${specimen.name} (${specimen.family})`, {
      font: '16px Arial', color: '#ffffff'
    }));
    infoY += lineH;

    container.add(this.add.text(infoX, infoY, `✂️ 切片: ${slice.name} — ${slice.rows}×${slice.cols} = ${slice.rows * slice.cols}片`, {
      font: '16px Arial', color: '#ffffff'
    }));
    infoY += lineH;

    const timeLabel = diff.timeLimit >= 999 ? '无限制' : `${diff.timeLimit}秒`;
    container.add(this.add.text(infoX, infoY, `⚡ 难度: ${diff.name} — 时限${timeLabel} 吸附${diff.snapPositionThreshold}px 积分×${diff.scoreMultiplier}`, {
      font: '16px Arial', color: '#ffffff'
    }));
    infoY += lineH;

    container.add(this.add.text(infoX, infoY, `📊 结算: ${rule.name} — 基础${rule.baseScore} 时间+${rule.timeBonusPerSecond}/s 完美+${rule.perfectSnapBonus}`, {
      font: '16px Arial', color: '#ffffff'
    }));
    infoY += lineH + 5;

    const key = makeCustomPuzzleKey(specimen.id, slice.id, diff.id, rule.id);
    const record = SaveManager.getCustomPuzzleRecord(key);
    if (record) {
      container.add(this.add.text(infoX, infoY, `━━━ 历史最佳 ━━━`, {
        font: 'bold 14px Arial', color: '#ff9800'
      }));
      infoY += 24;
      container.add(this.add.text(infoX, infoY, `🏆 最高分: ${record.bestScore.toLocaleString()}   ⏱ 最佳时间: ${record.bestTime.toFixed(1)}s   ⭐ ${record.stars}星`, {
        font: '15px Arial', color: '#ffd700'
      }));
      infoY += lineH;
      container.add(this.add.text(infoX, infoY, `已游玩 ${record.playCount} 次`, {
        font: '13px Arial', color: '#888888'
      }));
    } else {
      container.add(this.add.text(infoX, infoY, '📝 尚未游玩此配置', {
        font: '15px Arial', color: '#888888'
      }));
    }

    const closeBtn = this.add.graphics();
    closeBtn.fillStyle(0xe94560, 1);
    closeBtn.fillRoundedRect(225, modalY + modalH - 70, 300, 50, 12);
    closeBtn.setInteractive(new Phaser.Geom.Rectangle(225, modalY + modalH - 70, 300, 50), Phaser.Geom.Rectangle.Contains);
    container.add(closeBtn);
    container.add(this.add.text(375, modalY + modalH - 45, '关闭预览', {
      font: 'bold 20px Arial', color: '#ffffff'
    }).setOrigin(0.5));

    const close = () => {
      overlay.destroy();
      container.destroy();
    };
    closeBtn.on('pointerup', close);
    overlay.on('pointerup', close);
  }

  private startCustomPuzzle(): void {
    const specimen = PlantSpecimens[this.selectedSpecimenId];
    const slice = getSliceScheme(this.selectedSliceId);
    const diff = getDifficultyScheme(this.selectedDifficultyId);
    const rule = getSettlementRule(this.selectedSettlementId);
    if (!specimen || !slice || !diff || !rule) return;

    this.scene.start('CustomPuzzleGameScene', {
      specimenId: specimen.id,
      sliceSchemeId: slice.id,
      difficultySchemeId: diff.id,
      settlementRuleId: rule.id
    });
  }

  private addBackButton(): void {
    const btnX = 375;
    const btnY = 1280;

    const btn = this.add.graphics();
    btn.fillStyle(0xe94560, 1);
    btn.fillRoundedRect(btnX - 150, btnY - 28, 300, 56, 14);
    btn.setInteractive(new Phaser.Geom.Rectangle(btnX - 150, btnY - 28, 300, 56), Phaser.Geom.Rectangle.Contains);

    this.add.text(btnX, btnY, '返回工坊', {
      font: 'bold 22px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    btn.on('pointerover', () => {
      btn.clear();
      btn.fillStyle(0xff6b8a, 1);
      btn.fillRoundedRect(btnX - 150, btnY - 28, 300, 56, 14);
    });

    btn.on('pointerout', () => {
      btn.clear();
      btn.fillStyle(0xe94560, 1);
      btn.fillRoundedRect(btnX - 150, btnY - 28, 300, 56, 14);
    });

    btn.on('pointerup', () => {
      this.scene.start('WorkshopScene');
    });
  }

  private getMaxScroll(): number {
    switch (this.currentStep) {
      case 'specimen': {
        const count = Object.values(PlantSpecimens).filter(s => s.id <= 6).length;
        const rows = Math.ceil(count / 2);
        return Math.max(0, rows * 135 - 800);
      }
      case 'slice':
        return Math.max(0, SliceSchemes.length * 97 - 800);
      case 'difficulty':
        return Math.max(0, DifficultySchemes.length * 135 - 800);
      case 'settlement':
        return Math.max(0, SettlementRules.length * 155 - 800);
      default:
        return 0;
    }
  }
}
