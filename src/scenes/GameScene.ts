import Phaser from 'phaser';
import { PuzzlePieceSprite } from '../objects/PuzzlePieceSprite';
import { getLevelRule } from '../data/LevelRules';
import { getPlantSpecimen } from '../data/PlantSpecimens';
import { SaveManager } from '../utils/SaveManager';
import { calculateScore, formatTime, getDifficultyColor, getDifficultyText } from '../utils/GameUtils';
import { LevelRule, PlantSpecimen, PuzzlePieceData, EventLevelRule, DailyQuest, TowerFloorData, TowerResultData, TowerScoringCondition, TowerRuleModifier, AchievementUnlockResult, TutorialStep, ConservationHealthLevel, PuzzleSaveData, PuzzlePieceSaveData, HintUsageStats, ComboRewardStats, SnapRecord, MistakeRecord, SpeedSample, ReplayData, LevelSpecialRule } from '../types/GameTypes';
import { getDropRule, getFragmentsBySpecimenId, Fragments, Materials } from '../data/WorkshopConfig';
import { getEventLevelRule, isEventLevel } from '../data/EventLevelRules';
import { getEventById } from '../data/Events';
import { DailyQuestManager } from '../utils/DailyQuestManager';
import { getTowerFloor } from '../data/TowerConfig';
import { TutorialManager } from '../utils/TutorialManager';
import { getGameTutorial } from '../data/TutorialConfig';
import { AchievementNotification } from '../utils/AchievementNotification';
import { ConservationManager } from '../utils/ConservationManager';
import { RepairLogManager } from '../utils/RepairLogManager';
import { RandomEventManager } from '../utils/RandomEventManager';
import { RandomEventData, ActiveRandomEvent, RandomEventSessionStats } from '../types/GameTypes';
import { getRandomEventById, getRarityColor } from '../data/RandomEvents';
import { HintConfig, PieceLayoutConfig } from '../config/GameConfig';
import { PieceGenerationConfig, InitialRotationMode, ScatterAreaMode, SliceMode, InitialRotationRule, ScatterAreaConfig, FamilyBorderStyle, FamilyBackgroundStyle } from '../types/GameTypes';
import { PlantFamilies } from '../data/PlantFamilies';

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

  private isEventLevel: boolean = false;
  private eventId: string | null = null;
  private eventLevelRule: EventLevelRule | null = null;
  private scoreMultiplier: number = 1;

  private isTowerFloor: boolean = false;
  private towerFloorId: number | null = null;
  private towerFloorData: TowerFloorData | null = null;
  private comboCount: number = 0;
  private maxCombo: number = 0;
  private mistakeCount: number = 0;
  private hintsUsed: number = 0;
  private perfectSnaps: number = 0;
  private totalSnapDistance: number = 0;
  private snapCount: number = 0;
  private targetOffsetX: number = 0;
  private targetOffsetY: number = 0;
  private targetTween: Phaser.Tweens.Tween | null = null;
  private snapCountForShuffle: number = 0;
  private comboBonusMultiplier: number = 1;
  private mirrorPieces: PuzzlePieceSprite[] = [];
  private realPiecesCount: number = 0;
  private isLoadingSave: boolean = false;
  private loadedSaveData: PuzzleSaveData | null = null;
  private autoSaveTimer: Phaser.Time.TimerEvent | null = null;
  private snapTimestamps: number[] = [];
  private rotationAdjustCount: number = 0;
  private hintViewTime: number = 0;
  private hintLastEnabledAt: number | null = null;
  private outlineFlashCount: number = 0;
  private pieceHighlightCount: number = 0;
  private fullPreviewCount: number = 0;
  private fullPreviewTimer: Phaser.Time.TimerEvent | null = null;
  private fullPreviewActive: boolean = false;
  private fullPreviewStartAt: number | null = null;

  private snapRecords: SnapRecord[] = [];
  private mistakeRecords: MistakeRecord[] = [];
  private speedSamples: SpeedSample[] = [];
  private speedSampleTimer: Phaser.Time.TimerEvent | null = null;
  private lastSampleSnappedCount: number = 0;

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
  private levelTutorialSteps: TutorialStep[] = [];
  private currentLevelTutorialIndex: number = 0;
  private isShowingLevelTutorial: boolean = false;

  private randomEventsEnabled: boolean = true;
  private randomEventContainer!: Phaser.GameObjects.Container;
  private activeEventIcons: Phaser.GameObjects.Container[] = [];
  private randomEventStats!: RandomEventSessionStats;
  private lastUpdateTime: number = 0;
  private eventNotificationTimer: Phaser.Time.TimerEvent | null = null;

  private currentBgmKey: string | null = null;
  private currentAmbientKey: string | null = null;
  private fogOverlay!: Phaser.GameObjects.Graphics;
  private scoreSurgeMultiplier: number = 1;
  private scoreSurgeTimer: Phaser.Time.TimerEvent | null = null;
  private pieceDriftTimer: Phaser.Time.TimerEvent | null = null;
  private familyParticles: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
  private familyBorderGraphics: Phaser.GameObjects.Graphics | null = null;
  private usedTimeExtensions: number = 0;

  private static readonly TARGET_AREA_X = 375;
  private static readonly TARGET_AREA_Y = 420;
  private static readonly TARGET_AREA_W = 500;
  private static readonly TARGET_AREA_H = 400;
  private static readonly PIECE_AREA_START_Y = 900;

  constructor() {
    super('GameScene');
  }

  init(data: { levelId: number; isEventLevel?: boolean; eventId?: string; isTowerFloor?: boolean; towerFloorId?: number; loadSave?: boolean }): void {
    this.isEventLevel = data.isEventLevel ?? false;
    this.eventId = data.eventId ?? null;
    this.isTowerFloor = data.isTowerFloor ?? false;
    this.towerFloorId = data.towerFloorId ?? null;
    this.comboCount = 0;
    this.maxCombo = 0;
    this.mistakeCount = 0;
    this.hintsUsed = 0;
    this.perfectSnaps = 0;
    this.totalSnapDistance = 0;
    this.snapCount = 0;
    this.snapCountForShuffle = 0;
    this.comboBonusMultiplier = 1;
    this.mirrorPieces = [];
    this.realPiecesCount = 0;
    this.pieces = [];
    this.targetOffsetX = 0;
    this.targetOffsetY = 0;
    this.isLoadingSave = data.loadSave ?? false;
    this.loadedSaveData = null;
    this.snapTimestamps = [];
    this.rotationAdjustCount = 0;
    this.hintViewTime = 0;
    this.hintLastEnabledAt = null;
    this.outlineFlashCount = 0;
    this.pieceHighlightCount = 0;
    this.fullPreviewCount = 0;
    this.fullPreviewTimer = null;
    this.fullPreviewActive = false;
    this.fullPreviewStartAt = null;
    this.snapRecords = [];
    this.mistakeRecords = [];
    this.speedSamples = [];
    this.speedSampleTimer = null;
    this.lastSampleSnappedCount = 0;

    if (this.isTowerFloor && this.towerFloorId) {
      const towerFloor = getTowerFloor(this.towerFloorId);
      if (!towerFloor) {
        this.scene.start('TowerSelectScene');
        return;
      }
      this.towerFloorData = towerFloor;
      this.levelRule = {
        id: towerFloor.id,
        name: towerFloor.name,
        specimenId: towerFloor.specimenId,
        difficulty: 'hard',
        rows: towerFloor.rows,
        cols: towerFloor.cols,
        timeLimit: towerFloor.timeLimit,
        snapPositionThreshold: towerFloor.snapPositionThreshold,
        snapRotationThreshold: towerFloor.snapRotationThreshold
      };
      this.scoreMultiplier = 1;
    } else if (this.isEventLevel || isEventLevel(data.levelId)) {
      const eventRule = getEventLevelRule(data.levelId);
      if (!eventRule) {
        this.scene.start(this.eventId ? 'EventLevelSelectScene' : 'LevelSelectScene', this.eventId ? { eventId: this.eventId } : {});
        return;
      }
      this.eventLevelRule = eventRule;
      this.levelRule = eventRule as LevelRule;
      this.scoreMultiplier = eventRule.scoreMultiplier;
      if (!this.eventId) this.eventId = eventRule.eventId;
    } else {
      const rule = getLevelRule(data.levelId);
      if (!rule) {
        this.scene.start('LevelSelectScene');
        return;
      }
      this.levelRule = rule;
      this.scoreMultiplier = 1;
    }

    const specimen = getPlantSpecimen(this.levelRule.specimenId);
    if (!specimen) {
      if (this.isTowerFloor) {
        this.scene.start('TowerSelectScene');
      } else {
        this.scene.start(this.eventId ? 'EventLevelSelectScene' : 'LevelSelectScene', this.eventId ? { eventId: this.eventId } : {});
      }
      return;
    }
    this.specimen = specimen;

    if (this.isLoadingSave) {
      const save = SaveManager.getPuzzleSave(
        this.levelRule.id,
        this.isEventLevel,
        this.eventId,
        this.isTowerFloor,
        this.towerFloorId
      );
      if (save) {
        this.loadedSaveData = save;
        this.elapsedTime = this.levelRule.timeLimit - save.remainingTime;
        this.hintsUsed = save.hintsUsed;
        this.snappedCount = save.snappedCount;
        this.comboCount = save.comboCount;
        this.maxCombo = save.maxCombo;
        this.mistakeCount = save.mistakeCount;
        this.perfectSnaps = save.perfectSnaps;
      }
    } else {
      SaveManager.clearPuzzleSave(
        this.levelRule.id,
        this.isEventLevel,
        this.eventId,
        this.isTowerFloor,
        this.towerFloorId
      );
    }

    if (this.randomEventsEnabled && !this.isTowerFloor && !this.isEventLevel) {
      RandomEventManager.startSession(this.levelRule.difficulty);
    }
  }

  create(): void {
    this.targetTextureKey = `specimen-${this.specimen.id}-target`;

    this.addBackground();
    this.addHeader();
    this.addTargetArea();
    this.createPuzzlePieces();
    this.addControlButtons();
    this.setupEvents();
    this.setupRandomEventUI();
    this.setupLevelSoundTheme();
    this.setupLevelSpecialRules();

    if (!this.isEventLevel && !this.isTowerFloor && TutorialManager.shouldShowLevelTutorial(this.levelRule.id)) {
      const tutorialSteps = getGameTutorial(this.levelRule.id);
      if (tutorialSteps && tutorialSteps.length > 0) {
        this.levelTutorialSteps = tutorialSteps;
        this.currentLevelTutorialIndex = 0;
        this.setupLevelTutorialUI();
        this.showLevelTutorialStep();
      } else {
        this.startTimer();
      }
    } else {
      this.startTimer();
    }

    this.lastUpdateTime = this.time.now;

    this.setupAutoSave();
  }

  private setupAutoSave(): void {
    if (this.autoSaveTimer) {
      this.autoSaveTimer.remove(false);
    }

    this.autoSaveTimer = this.time.addEvent({
      delay: 30000,
      loop: true,
      callback: () => {
        if (this.isPaused || this.isCompleted) return;
        this.saveCurrentProgress();
      }
    });
  }

  private saveCurrentProgress(): void {
    if (this.isCompleted) return;

    const pieceSaves: PuzzlePieceSaveData[] = this.pieces
      .filter(p => !p.isMirror)
      .map(piece => ({
        id: piece.getPieceId(),
        pieceId: piece.getPieceId(),
        x: piece.x,
        y: piece.y,
        rotation: piece.rotation,
        isSnapped: piece.isPieceSnapped(),
        isMirror: piece.isMirror
      }));

    const remainingTime = Math.max(0, this.levelRule.timeLimit - this.elapsedTime);
    const scoreResult = calculateScore(
      this.elapsedTime,
      this.levelRule.timeLimit,
      this.pieces.length,
      this.snappedCount,
      this.getHintUsageStats(),
      this.getComboRewardStats(),
      this.getLevelStarThresholds()
    );

    SaveManager.savePuzzleProgress({
      levelId: this.levelRule.id,
      isEventLevel: this.isEventLevel,
      eventId: this.eventId,
      isTowerFloor: this.isTowerFloor,
      towerFloorId: this.towerFloorId,
      remainingTime,
      elapsedTime: this.elapsedTime,
      hintsUsed: this.hintsUsed,
      hintViewTime: this.hintViewTime,
      snappedCount: this.snappedCount,
      pieces: pieceSaves,
      comboCount: this.comboCount,
      maxCombo: this.maxCombo,
      mistakeCount: this.mistakeCount,
      mistakes: this.mistakeCount,
      perfectSnaps: this.perfectSnaps,
      score: scoreResult.score
    });
  }

  update(time: number, delta: number): void {
    if (this.isPaused || this.isCompleted || !this.randomEventsEnabled || this.isTowerFloor || this.isEventLevel) {
      return;
    }

    const deltaSeconds = delta / 1000;
    const triggeredEvent = RandomEventManager.update(this.elapsedTime, deltaSeconds, this.snappedCount);

    if (triggeredEvent) {
      this.handleRandomEventTriggered(triggeredEvent);
    }

    this.updateActiveEventUI();

    if (this.hasLevelSpecialRule('time_pressure')) {
      const pressureDelta = this.applyLevelTimePressure(deltaSeconds);
      this.elapsedTime += pressureDelta - deltaSeconds;
    }

    if (this.hasLevelSpecialRule('gravity_pull')) {
      this.applyGravityPull();
    }
  }

  private addBackground(): void {
    const bg = this.levelRule.background;
    const cameraColor = bg?.cameraBackgroundColor ?? '#1a1a2e';
    this.cameras.main.setBackgroundColor(cameraColor);

    const graphics = this.add.graphics();
    const from = bg?.fillGradientFrom ?? 0x16213e;
    const to = bg?.fillGradientTo ?? 0x16213e;

    if (from !== to) {
      const gradientH = 667;
      for (let i = 0; i < gradientH; i++) {
        const t = i / gradientH;
        const r = Math.round(((from >> 16) & 0xff) * (1 - t) + ((to >> 16) & 0xff) * t);
        const g = Math.round(((from >> 8) & 0xff) * (1 - t) + ((to >> 8) & 0xff) * t);
        const b = Math.round((from & 0xff) * (1 - t) + (to & 0xff) * t);
        const color = (r << 16) | (g << 8) | b;
        graphics.fillStyle(color, 1);
        graphics.fillRect(0, i * 2, 750, 2);
      }
    } else {
      graphics.fillStyle(from, 1);
      graphics.fillRect(0, 0, 750, 1334);
    }

    if (bg?.backgroundImageKey) {
      this.add.image(375, 667, bg.backgroundImageKey).setAlpha(0.3).setDepth(0);
    }

    this.applyFamilyBackground();
    this.applyFamilyBorder();
  }

  private applyFamilyBackground(): void {
    const activeBg = SaveManager.getActiveBackground();
    if (!activeBg) return;

    const family = PlantFamilies.find(f => f.id === activeBg.familyId);
    if (!family) return;

    const bgReward = family.rewards.find(r => r.id === activeBg.backgroundId && r.type === 'background');
    if (!bgReward || !bgReward.backgroundStyle) return;

    const style = bgReward.backgroundStyle;

    const overlay = this.add.graphics();
    overlay.setDepth(1);
    if (style.gradientFrom !== style.gradientTo) {
      const gradientH = 667;
      for (let i = 0; i < gradientH; i++) {
        const t = i / gradientH;
        const r = Math.round(((style.gradientFrom >> 16) & 0xff) * (1 - t) + ((style.gradientTo >> 16) & 0xff) * t);
        const g = Math.round(((style.gradientFrom >> 8) & 0xff) * (1 - t) + ((style.gradientTo >> 8) & 0xff) * t);
        const b = Math.round((style.gradientFrom & 0xff) * (1 - t) + (style.gradientTo & 0xff) * t);
        const color = (r << 16) | (g << 8) | b;
        overlay.fillStyle(color, style.overlayOpacity);
        overlay.fillRect(0, i * 2, 750, 2);
      }
    }

    this.addFamilyParticles(style);
  }

  private addFamilyParticles(style: FamilyBackgroundStyle): void {
    const particleColor = '#' + style.particleColor.toString(16).padStart(6, '0');

    if (style.particleType === 'none' || style.particleCount <= 0) return;

    const particleTexture = this.createParticleTexture(style.particleType, particleColor);
    if (!particleTexture) return;

    const emitter = this.add.particles(0, -20, particleTexture, {
      x: { min: 0, max: 750 },
      y: -20,
      lifespan: 8000,
      speedY: { min: 20, max: 50 },
      speedX: { min: -10, max: 10 },
      scale: { start: 0.5, end: 0.2 },
      alpha: { start: 0.8, end: 0.1 },
      quantity: Math.ceil(style.particleCount / 10),
      frequency: 200,
      gravityY: 5,
      rotate: { min: 0, max: 360 },
      rotationVelocity: { min: -30, max: 30 }
    });
    emitter.setDepth(2);
    this.familyParticles.push(emitter);
  }

  private createParticleTexture(type: string, color: string): string | null {
    const key = `family-particle-${type}-${color}`;
    if (this.textures.exists(key)) return key;

    const size = 16;
    const canvas = this.textures.createCanvas(key, size, size);
    if (!canvas) return null;
    const ctx = canvas.getContext();

    ctx.fillStyle = color;

    switch (type) {
      case 'leaf':
        ctx.beginPath();
        ctx.ellipse(size / 2, size / 2, size / 3, size / 2, Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'petal':
        ctx.beginPath();
        ctx.ellipse(size / 2, size / 2, size / 3, size / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'sparkle':
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
          const r = i % 2 === 0 ? size / 2 : size / 4;
          const x = size / 2 + Math.cos(angle) * r;
          const y = size / 2 + Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        break;
      case 'snow':
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 3, 0, Math.PI * 2);
        ctx.fill();
        break;
      default:
        ctx.fillRect(0, 0, size, size);
    }

    canvas.refresh();
    return key;
  }

  private applyFamilyBorder(): void {
    const activeBorder = SaveManager.getActiveBorder();
    if (!activeBorder) return;

    const family = PlantFamilies.find(f => f.id === activeBorder.familyId);
    if (!family) return;

    const borderReward = family.rewards.find(r => r.id === activeBorder.borderId && r.type === 'border');
    if (!borderReward || !borderReward.borderStyle) return;

    const style = borderReward.borderStyle;
    this.familyBorderGraphics = this.add.graphics();
    this.familyBorderGraphics.setDepth(100);

    this.drawFamilyBorder(style);

    if (style.animation === 'pulse' || style.animation === 'shine') {
      this.time.addEvent({
        delay: 50,
        loop: true,
        callback: () => {
          if (!this.familyBorderGraphics || this.scene.isPaused()) return;
          this.drawFamilyBorder(style);
        }
      });
    }
  }

  private drawFamilyBorder(style: FamilyBorderStyle): void {
    if (!this.familyBorderGraphics) return;
    this.familyBorderGraphics.clear();

    const padding = 8;
    const w = 750 - padding * 2;
    const h = 1334 - padding * 2;

    let glowAlpha = style.glowIntensity;
    let borderAlpha = 1;

    if (style.animation === 'pulse') {
      const t = (Date.now() / 500) % (Math.PI * 2);
      glowAlpha = style.glowIntensity * (0.5 + 0.5 * Math.sin(t));
    } else if (style.animation === 'shine') {
      const t = (Date.now() / 800) % (Math.PI * 2);
      borderAlpha = 0.7 + 0.3 * Math.sin(t);
    }

    this.familyBorderGraphics.lineStyle(style.borderWidth, style.glowColor, glowAlpha * 0.5);
    this.familyBorderGraphics.strokeRoundedRect(
      padding - 4,
      padding - 4,
      w + 8,
      h + 8,
      style.cornerRadius + 4
    );

    this.familyBorderGraphics.lineStyle(style.borderWidth, style.borderColor, borderAlpha);
    this.familyBorderGraphics.strokeRoundedRect(padding, padding, w, h, style.cornerRadius);
  }

  private addHeader(): void {
    const header = this.add.graphics();
    const bgConfig = this.levelRule.background;
    const defaultHeaderColor = 0x0f3460;
    let headerColor: number;
    let headerAlpha: number;

    if (this.isEventLevel && this.eventId) {
      headerColor = getEventById(this.eventId)?.primaryColor ?? bgConfig?.headerColor ?? defaultHeaderColor;
      headerAlpha = bgConfig?.headerAlpha ?? 0.9;
    } else {
      headerColor = bgConfig?.headerColor ?? defaultHeaderColor;
      headerAlpha = bgConfig?.headerAlpha ?? 1;
    }

    header.fillStyle(headerColor, headerAlpha);
    header.fillRect(0, 0, 750, 120);

    this.add.text(60, 40, this.levelRule.name, {
      font: 'bold 28px Arial',
      color: '#ffffff'
    });

    this.add.text(60, 80, `${this.specimen.name}  ·  ${getDifficultyText(this.levelRule.difficulty)}`, {
      font: '18px Arial',
      color: '#' + getDifficultyColor(this.levelRule.difficulty).toString(16).padStart(6, '0')
    });

    if (this.isTowerFloor && this.towerFloorData) {
      const rulesY = 128;
      const ruleNames = this.towerFloorData.rules.map(r => r.name);
      const ruleText = ruleNames.join(' · ');
      const ruleBg = this.add.graphics();
      ruleBg.fillStyle(0x9c27b0, 0.8);
      const ruleTextWidth = Math.min(660, ruleText.length * 13 + 24);
      ruleBg.fillRoundedRect(60, rulesY - 10, ruleTextWidth, 22, 6);
      this.add.text(72, rulesY + 1, `📜 ${ruleText}`, {
        font: 'bold 11px Arial',
        color: '#ffffff'
      }).setOrigin(0, 0.5);
    }

    if (this.isEventLevel) {
      const eventBadge = this.add.graphics();
      eventBadge.fillStyle(0xffd700, 0.95);
      eventBadge.fillRoundedRect(60, 102, 130, 22, 6);
      this.add.text(125, 113, `🎯 活动关卡 x${this.scoreMultiplier}`, {
        font: 'bold 13px Arial',
        color: '#1a1a2e'
      }).setOrigin(0.5);
    }

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
    const x = GameScene.TARGET_AREA_X + this.targetOffsetX;
    const y = GameScene.TARGET_AREA_Y + this.targetOffsetY;
    const w = GameScene.TARGET_AREA_W;
    const h = GameScene.TARGET_AREA_H;

    const hasHiddenTarget = this.hasTowerRule('hidden_target');
    const hasMovingTarget = this.hasTowerRule('moving_target');

    const frame = this.add.graphics();
    frame.setName('targetFrame');
    if (!hasHiddenTarget) {
      frame.lineStyle(4, 0x4caf50, 0.7);
      frame.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 12);

      const dashPattern = [12, 8];
      frame.lineStyle(2, 0x4caf50, 0.3);
      this.drawDashedRect(frame, x - w / 2 + 8, y - h / 2 + 8, w - 16, h - 16, dashPattern);
    } else {
      frame.lineStyle(2, 0x4caf50, 0.15);
      frame.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 12);
    }

    this.hintImage = this.add.image(x, y, this.targetTextureKey);
    this.hintImage.setName('hintImage');
    this.hintImage.setDisplaySize(w - 24, h - 24);
    this.hintImage.setAlpha(0);
    this.hintImage.setDepth(0);

    if (!hasHiddenTarget) {
      this.add.text(x, y - h / 2 - 28, '标本目标区域', {
        font: 'bold 16px Arial',
        color: '#4caf50'
      }).setOrigin(0.5).setName('targetLabel');
    }

    if (hasMovingTarget && !this.isPaused && !this.isCompleted) {
      this.startMovingTarget();
    }
  }

  private hasTowerRule(ruleType: string): boolean {
    if (!this.isTowerFloor || !this.towerFloorData) return false;
    return this.towerFloorData.rules.some(r => r.type === ruleType);
  }

  private getTowerRule(ruleType: string): TowerRuleModifier | undefined {
    if (!this.isTowerFloor || !this.towerFloorData) return undefined;
    return this.towerFloorData.rules.find(r => r.type === ruleType);
  }

  private startMovingTarget(): void {
    const range = this.getTowerRule('moving_target')?.value || 20;
    const duration = 3000;

    this.targetTween = this.tweens.add({
      targets: { offsetX: 0, offsetY: 0 },
      offsetX: { from: -range, to: range },
      offsetY: { from: -range / 2, to: range / 2 },
      duration: duration,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onUpdate: (tween) => {
        const data = tween.targets[0] as { offsetX: number; offsetY: number };
        this.targetOffsetX = data.offsetX;
        this.targetOffsetY = data.offsetY;
        this.updateTargetPosition();
      }
    });
  }

  private updateTargetPosition(): void {
    const x = GameScene.TARGET_AREA_X + this.targetOffsetX;
    const y = GameScene.TARGET_AREA_Y + this.targetOffsetY;
    const w = GameScene.TARGET_AREA_W;
    const h = GameScene.TARGET_AREA_H;

    const frame = this.children.getByName('targetFrame') as Phaser.GameObjects.Graphics;
    if (frame) {
      frame.clear();
      const hasHiddenTarget = this.hasTowerRule('hidden_target');
      if (!hasHiddenTarget) {
        frame.lineStyle(4, 0x4caf50, 0.7);
        frame.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 12);
        const dashPattern = [12, 8];
        frame.lineStyle(2, 0x4caf50, 0.3);
        this.drawDashedRect(frame, x - w / 2 + 8, y - h / 2 + 8, w - 16, h - 16, dashPattern);
      } else {
        frame.lineStyle(2, 0x4caf50, 0.15);
        frame.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 12);
      }
    }

    if (this.hintImage) {
      this.hintImage.setPosition(x, y);
    }

    const label = this.children.getByName('targetLabel') as Phaser.GameObjects.Text;
    if (label) {
      label.setPosition(x, y - h / 2 - 28);
    }

    if (this.isTowerFloor && this.hasTowerRule('moving_target')) {
      const baseX = GameScene.TARGET_AREA_X;
      const baseY = GameScene.TARGET_AREA_Y;
      const deltaX = this.targetOffsetX;
      const deltaY = this.targetOffsetY;

      this.pieces.forEach(piece => {
        if (!piece.isMirror && !piece.isPieceSnapped()) {
          const origTargetX = piece.getTargetX();
          const origTargetY = piece.getTargetY();
          const offsetX = origTargetX - baseX;
          const offsetY = origTargetY - baseY;
          piece.setData('liveTargetX', baseX + offsetX + deltaX);
          piece.setData('liveTargetY', baseY + offsetY + deltaY);
        }
      });
    }
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
    const hasRotationLock = this.hasTowerRule('rotation_lock');

    pieceDataList.forEach((data, index) => {
      const sprite = new PuzzlePieceSprite(this, data, {
        position: this.levelRule.snapPositionThreshold,
        rotation: this.levelRule.snapRotationThreshold
      });
      sprite.setDepth(10);

      if (hasRotationLock) {
        const rotations = [90, 180, 270];
        const randomRotation = rotations[Math.floor(Math.random() * rotations.length)];
        sprite.angle = randomRotation;
        sprite.setData('targetRotation', 0);
      } else if (data.initialRotation !== undefined) {
        sprite.rotation = data.initialRotation;
      }

      this.pieces.push(sprite);
    });

    this.realPiecesCount = pieceDataList.length;

    if (this.isTowerFloor && this.hasTowerRule('mirror_pieces')) {
      this.createMirrorPieces();
    }

    if (this.isLoadingSave && this.loadedSaveData) {
      this.restorePiecesFromSave(this.loadedSaveData.pieces);
    }
  }

  private restorePiecesFromSave(savedPieces: PuzzlePieceSaveData[]): void {
    savedPieces.forEach(savedPiece => {
      const piece = this.pieces.find(p => p.getPieceId() === savedPiece.pieceId);
      if (piece) {
        piece.setPosition(savedPiece.x, savedPiece.y);
        piece.rotation = savedPiece.rotation;
        piece.updateInitialPosition(savedPiece.x, savedPiece.y);

        if (savedPiece.isSnapped) {
          piece.setSnapped(true);
          piece.setDepth(5);
        }
      }
    });

    if (this.isTowerFloor) {
      this.updateTowerStatusUI();
    }
  }

  private createMirrorPieces(): void {
    const mirrorCount = this.getTowerRule('mirror_pieces')?.value || 2;
    const realPieces = this.pieces.filter(p => !p.isMirror);

    for (let i = 0; i < mirrorCount && i < realPieces.length; i++) {
      const sourcePiece = realPieces[Phaser.Math.Between(0, realPieces.length - 1)];
      const sourceData: PuzzlePieceData = {
        id: 1000 + i,
        initialX: Phaser.Math.Between(80, 670),
        initialY: Phaser.Math.Between(920, 1100),
        targetX: Phaser.Math.Between(
          GameScene.TARGET_AREA_X - GameScene.TARGET_AREA_W / 2 + 50,
          GameScene.TARGET_AREA_X + GameScene.TARGET_AREA_W / 2 - 50
        ),
        targetY: Phaser.Math.Between(
          GameScene.TARGET_AREA_Y - GameScene.TARGET_AREA_H / 2 + 50,
          GameScene.TARGET_AREA_Y + GameScene.TARGET_AREA_H / 2 - 50
        ),
        width: sourcePiece.width,
        height: sourcePiece.height,
        textureKey: sourcePiece.getData('textureKey') || `specimen-${this.specimen.id}-piece-${sourcePiece.getPieceId()}`,
        sourceX: 0,
        sourceY: 0
      };

      const mirrorSprite = new PuzzlePieceSprite(this, sourceData, {
        position: this.levelRule.snapPositionThreshold * 0.6,
        rotation: this.levelRule.snapRotationThreshold * 0.6
      });
      mirrorSprite.isMirror = true;
      mirrorSprite.setDepth(9);
      mirrorSprite.setAlpha(0.85);

      const mirrorBorder = this.add.graphics();
      mirrorBorder.lineStyle(2, 0xe94560, 0);
      this.add.existing(mirrorBorder);
      mirrorSprite.add(mirrorBorder);

      const rotations = [90, 180, 270];
      const randomRotation = rotations[Math.floor(Math.random() * rotations.length)];
      mirrorSprite.angle = randomRotation;

      this.mirrorPieces.push(mirrorSprite);
      this.pieces.push(mirrorSprite);
    }
  }

  private generatePieceData(): PuzzlePieceData[] {
    const genConfig = this.levelRule.pieceGeneration;
    const sliceMode: SliceMode = genConfig?.sliceMode ?? 'regular_grid';
    const { rows, cols, id: levelId } = this.levelRule;
    const total = rows * cols;
    const areaW = GameScene.TARGET_AREA_W - 24;
    const areaH = GameScene.TARGET_AREA_H - 24;
    const specimenId = this.specimen.id;

    const hasCustomKey = genConfig && 
      (sliceMode === 'irregular_custom' || sliceMode === 'variable_size');
    const keySuffix = hasCustomKey ? `lv${levelId}-` : '';

    const shufflePositions = this.generateShufflePositions(total, genConfig?.scatterArea);
    const initialRotations = this.generateInitialRotations(total, genConfig?.initialRotation);

    const deterministicRandom = (seed: number) => {
      const x = Math.sin(seed * 9301 + 49297 + specimenId * 131) * 233280;
      return x - Math.floor(x);
    };

    const dataList: PuzzlePieceData[] = [];

    if (sliceMode === 'irregular_custom' && genConfig?.irregularSlices) {
      const slices = genConfig.irregularSlices;
      slices.forEach((slice, i) => {
        dataList.push({
          id: i,
          initialX: shufflePositions[i]?.x ?? Phaser.Math.Between(80, 670),
          initialY: shufflePositions[i]?.y ?? Phaser.Math.Between(920, 1100),
          initialRotation: initialRotations[i],
          targetX: slice.targetX,
          targetY: slice.targetY,
          width: slice.width,
          height: slice.height,
          textureKey: `specimen-${specimenId}-${keySuffix}piece-${i}`,
          sourceX: slice.sourceX,
          sourceY: slice.sourceY
        });
      });
    } else if (sliceMode === 'variable_size' && genConfig?.variableSizeRanges) {
      const ranges = genConfig.variableSizeRanges;
      const basePieceW = Math.floor(areaW / cols);
      const basePieceH = Math.floor(areaH / rows);
      const startTargetX = GameScene.TARGET_AREA_X - ((cols - 1) * basePieceW) / 2;
      const startTargetY = GameScene.TARGET_AREA_Y - ((rows - 1) * basePieceH) / 2;

      for (let i = 0; i < total; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const seedBase = levelId * 1000 + i;

        const widthRatio = ranges.minWidthRatio + 
          deterministicRandom(seedBase * 7 + 1) * (ranges.maxWidthRatio - ranges.minWidthRatio);
        const heightRatio = ranges.minHeightRatio + 
          deterministicRandom(seedBase * 7 + 2) * (ranges.maxHeightRatio - ranges.minHeightRatio);
        const pieceW = Math.floor(basePieceW * widthRatio);
        const pieceH = Math.floor(basePieceH * heightRatio);

        dataList.push({
          id: i,
          initialX: shufflePositions[i].x,
          initialY: shufflePositions[i].y,
          initialRotation: initialRotations[i],
          targetX: startTargetX + col * basePieceW,
          targetY: startTargetY + row * basePieceH,
          width: pieceW,
          height: pieceH,
          textureKey: `specimen-${specimenId}-${keySuffix}piece-${i}`,
          sourceX: col * basePieceW,
          sourceY: row * basePieceH
        });
      }
    } else {
      const pieceW = Math.floor(areaW / cols);
      const pieceH = Math.floor(areaH / rows);
      const startTargetX = GameScene.TARGET_AREA_X - ((cols - 1) * pieceW) / 2;
      const startTargetY = GameScene.TARGET_AREA_Y - ((rows - 1) * pieceH) / 2;

      for (let i = 0; i < total; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;

        dataList.push({
          id: i,
          initialX: shufflePositions[i].x,
          initialY: shufflePositions[i].y,
          initialRotation: initialRotations[i],
          targetX: startTargetX + col * pieceW,
          targetY: startTargetY + row * pieceH,
          width: pieceW,
          height: pieceH,
          textureKey: `specimen-${specimenId}-${keySuffix}piece-${i}`,
          sourceX: col * pieceW,
          sourceY: row * pieceH
        });
      }
    }

    return dataList;
  }

  private generateInitialRotations(count: number, rule?: InitialRotationRule): number[] {
    const rotations: number[] = [];
    const mode: InitialRotationMode = rule?.mode ?? 'random_90';

    for (let i = 0; i < count; i++) {
      let angle: number;

      switch (mode) {
        case 'random_90':
          angle = Phaser.Math.Between(0, 3) * 90;
          break;
        case 'random_any':
          angle = rule?.angleRange 
            ? Phaser.Math.FloatBetween(rule.angleRange.min, rule.angleRange.max)
            : Phaser.Math.FloatBetween(0, 360);
          if (rule?.snapTo90) {
            angle = Math.round(angle / 90) * 90;
          }
          break;
        case 'fixed_0':
          angle = 0;
          break;
        case 'fixed_90':
          angle = 90;
          break;
        case 'fixed_180':
          angle = 180;
          break;
        case 'fixed_270':
          angle = 270;
          break;
        case 'alternating':
          angle = (i % 2 === 0) ? 0 : 180;
          break;
        case 'per_piece':
          angle = rule?.perPieceAngles?.[i] ?? Phaser.Math.Between(0, 3) * 90;
          break;
        default:
          angle = Phaser.Math.Between(0, 3) * 90;
      }

      rotations.push(Phaser.Math.DegToRad(angle));
    }

    return rotations;
  }

  private generateShufflePositions(count: number, scatterConfig?: ScatterAreaConfig): Array<{ x: number; y: number }> {
    const positions: Array<{ x: number; y: number }> = [];
    const mode: ScatterAreaMode = scatterConfig?.mode ?? 'bottom';
    const padding = scatterConfig?.padding ?? 20;
    const stackLayers = scatterConfig?.stackLayers ?? 1;
    const allowOverlap = scatterConfig?.allowOverlap ?? false;

    const layout = this.levelRule.pieceLayout;
    const pieceW = Phaser.Math.Clamp(
      layout?.pieceWidth ?? PieceLayoutConfig.defaultPieceWidth,
      PieceLayoutConfig.minPieceWidth,
      PieceLayoutConfig.maxPieceWidth
    );
    const pieceH = Phaser.Math.Clamp(
      layout?.pieceHeight ?? PieceLayoutConfig.defaultPieceHeight,
      PieceLayoutConfig.minPieceHeight,
      PieceLayoutConfig.maxPieceHeight
    );
    const spacing = layout?.pieceSpacing ?? PieceLayoutConfig.defaultPieceSpacing;

    let areaX = 375;
    let areaY = 1000;
    let areaW = 650;
    let areaH = 400;

    if (scatterConfig?.customArea) {
      areaX = scatterConfig.customArea.x;
      areaY = scatterConfig.customArea.y;
      areaW = scatterConfig.customArea.width;
      areaH = scatterConfig.customArea.height;
    } else {
      switch (mode) {
        case 'bottom':
          areaX = 375;
          areaY = 1000;
          areaW = 650;
          areaH = 400;
          break;
        case 'top':
          areaX = 375;
          areaY = 250;
          areaW = 650;
          areaH = 200;
          break;
        case 'left_side':
          areaX = 120;
          areaY = 667;
          areaW = 200;
          areaH = 1000;
          break;
        case 'right_side':
          areaX = 630;
          areaY = 667;
          areaW = 200;
          areaH = 1000;
          break;
        case 'surround':
          areaX = 375;
          areaY = 667;
          areaW = 700;
          areaH = 1100;
          break;
        case 'custom':
          areaX = scatterConfig?.customArea?.x ?? 375;
          areaY = scatterConfig?.customArea?.y ?? 1000;
          areaW = scatterConfig?.customArea?.width ?? 650;
          areaH = scatterConfig?.customArea?.height ?? 400;
          break;
      }
    }

    const minX = areaX - areaW / 2 + padding;
    const maxX = areaX + areaW / 2 - padding;
    const minY = areaY - areaH / 2 + padding;
    const maxY = areaY + areaH / 2 - padding;

    if (mode === 'surround') {
      for (let i = 0; i < count; i++) {
        const side = i % 4;
        let x: number, y: number;
        
        switch (side) {
          case 0:
            x = Phaser.Math.Between(minX, maxX);
            y = Phaser.Math.Between(minY, minY + 80);
            break;
          case 1:
            x = Phaser.Math.Between(minX, maxX);
            y = Phaser.Math.Between(maxY - 80, maxY);
            break;
          case 2:
            x = Phaser.Math.Between(minX, minX + 60);
            y = Phaser.Math.Between(minY + 100, maxY - 100);
            break;
          case 3:
            x = Phaser.Math.Between(maxX - 60, maxX);
            y = Phaser.Math.Between(minY + 100, maxY - 100);
            break;
          default:
            x = Phaser.Math.Between(minX, maxX);
            y = Phaser.Math.Between(minY, maxY);
        }
        
        positions.push({ x, y });
      }
    } else if (allowOverlap) {
      for (let i = 0; i < count; i++) {
        const layerOffset = (i % stackLayers) * 15;
        positions.push({
          x: Phaser.Math.Between(minX, maxX),
          y: Phaser.Math.Between(minY + layerOffset, maxY - layerOffset)
        });
      }
    } else {
      const cols = Math.min(Math.ceil(Math.sqrt(count * (areaW / areaH))), 8);
      const rows = Math.ceil(count / cols);
      const cellW = (areaW - padding * 2) / cols;
      const cellH = (areaH - padding * 2) / rows;

      for (let i = 0; i < count; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const layerOffset = (i % stackLayers) * 10;
        
        positions.push({
          x: minX + col * cellW + cellW / 2 + Phaser.Math.Between(-cellW / 4, cellW / 4),
          y: minY + row * cellH + cellH / 2 + Phaser.Math.Between(-cellH / 4, cellH / 4) + layerOffset
        });
      }
    }

    return Phaser.Utils.Array.Shuffle(positions);
  }

  private addControlButtons(): void {
    const hasNoHintRestriction = this.hasTowerRule('no_hint_restriction');
    const hasTimeExtensions = SaveManager.getTotalTimeExtensionsAvailable() > 0;
    const btnY = 845;
    const btnW = 132;
    const btnH = 52;
    const spacing = 14;

    let buttonCount = 5;
    if (hasNoHintRestriction) buttonCount = 2;
    if (hasTimeExtensions && !this.isTowerFloor && !this.isEventLevel) buttonCount += 1;

    const totalW = btnW * buttonCount + spacing * (buttonCount - 1);
    const startX = (750 - totalW) / 2 + btnW / 2;

    let currentIndex = 0;

    const rotateBtn = this.createControlButton(
      startX + currentIndex * (btnW + spacing),
      btnY,
      btnW,
      btnH,
      '🔄 旋转',
      0x2196f3,
      () => this.rotateSelectedPiece()
    );

    const keyHint = this.add.text(startX + currentIndex * (btnW + spacing), btnY + btnH / 2 + 28, '按键 R', {
      font: '12px Arial',
      color: 'rgba(255,255,255,0.5)'
    }).setOrigin(0.5);
    currentIndex++;

    if (!hasNoHintRestriction) {
      const flashBtn = this.createControlButton(
        startX + currentIndex * (btnW + spacing),
        btnY,
        btnW,
        btnH,
        '⚡ 轮廓闪烁',
        0xffc107,
        () => this.useOutlineFlashHint()
      );
      this.addHintCountBadge(
        startX + currentIndex * (btnW + spacing) + btnW / 2 - 10,
        btnY - btnH / 2 + 10,
        () => this.outlineFlashCount
      );
      currentIndex++;

      const highlightBtn = this.createControlButton(
        startX + currentIndex * (btnW + spacing),
        btnY,
        btnW,
        btnH,
        '🎯 单块高亮',
        0x00bcd4,
        () => this.usePieceHighlightHint()
      );
      this.addHintCountBadge(
        startX + currentIndex * (btnW + spacing) + btnW / 2 - 10,
        btnY - btnH / 2 + 10,
        () => this.pieceHighlightCount
      );
      currentIndex++;

      const previewBtn = this.createControlButton(
        startX + currentIndex * (btnW + spacing),
        btnY,
        btnW,
        btnH,
        '👁️ 完整预览',
        0x9c27b0,
        () => this.useFullPreviewHint()
      );
      this.addHintCountBadge(
        startX + currentIndex * (btnW + spacing) + btnW / 2 - 10,
        btnY - btnH / 2 + 10,
        () => `${this.fullPreviewCount}/${HintConfig.maxFullPreviewCount}`,
        true
      );
      currentIndex++;
    }

    if (hasTimeExtensions && !this.isTowerFloor && !this.isEventLevel) {
      const timeBtn = this.createControlButton(
        startX + currentIndex * (btnW + spacing),
        btnY,
        btnW,
        btnH,
        '⏰ 加时',
        0x4caf50,
        () => this.useFamilyTimeExtension()
      );
      this.addHintCountBadge(
        startX + currentIndex * (btnW + spacing) + btnW / 2 - 10,
        btnY - btnH / 2 + 10,
        () => SaveManager.getTotalTimeExtensionsAvailable()
      );
      currentIndex++;
    }

    const resetBtn = this.createControlButton(
      startX + currentIndex * (btnW + spacing),
      btnY,
      btnW,
      btnH,
      '🔁 重置',
      0xf44336,
      () => {
        this.cameras.main.flash(100, 244, 67, 54, false);
        this.resetLevel();
      }
    );

    this.input.keyboard?.on('keydown-R', () => this.rotateSelectedPiece());
    if (!hasNoHintRestriction) {
      this.input.keyboard?.on('keydown-1', () => this.useOutlineFlashHint());
      this.input.keyboard?.on('keydown-2', () => this.usePieceHighlightHint());
      this.input.keyboard?.on('keydown-3', () => this.useFullPreviewHint());
    }
    if (hasTimeExtensions && !this.isTowerFloor && !this.isEventLevel) {
      this.input.keyboard?.on('keydown-T', () => this.useFamilyTimeExtension());
    }
    this.input.keyboard?.on('keydown-ESC', () => {
      if (!this.isCompleted) this.showPauseMenu();
    });

    if (this.isTowerFloor) {
      this.addTowerStatusUI();
    }
  }

  private useFamilyTimeExtension(): void {
    if (this.isPaused || this.isCompleted) return;
    if (SaveManager.getTotalTimeExtensionsAvailable() <= 0) return;

    const familyProgressData = SaveManager.data.familyCollection.familyProgress;
    let bonusSeconds = 0;
    for (const [familyId, progress] of Object.entries(familyProgressData)) {
      if (progress.timeExtensionsAvailable > 0) {
        bonusSeconds = SaveManager.useTimeExtension(familyId);
        if (bonusSeconds > 0) break;
      }
    }

    if (bonusSeconds <= 0) return;

    this.startTime = this.time.now - (this.elapsedTime - bonusSeconds) * 1000;
    this.usedTimeExtensions++;

    this.cameras.main.flash(500, 76, 175, 80, false);

    const flashText = this.add.text(375, 400, `⏰ +${bonusSeconds}秒！`, {
      font: 'bold 48px Arial',
      color: '#4caf50',
      stroke: '#ffffff',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(200);

    this.tweens.add({
      targets: flashText,
      y: 300,
      alpha: 0,
      duration: 1500,
      ease: 'Cubic.easeOut',
      onComplete: () => flashText.destroy()
    });

    this.updateTimerDisplay();
  }

  private addHintCountBadge(
    x: number,
    y: number,
    getValue: () => number | string,
    showMax: boolean = false
  ): void {
    const bg = this.add.graphics();
    const updateBadge = () => {
      const value = getValue();
      bg.clear();
      bg.fillStyle(0x000000, 0.7);
      bg.fillCircle(x, y, 14);
      bg.lineStyle(2, 0xffffff, 0.8);
      bg.strokeCircle(x, y, 14);

      this.add.text(x, y, String(value), {
        font: showMax ? 'bold 10px Arial' : 'bold 12px Arial',
        color: '#ffffff'
      }).setOrigin(0.5).setName('badgeText');
    };
    updateBadge();

    this.events.on('hints-updated', () => {
      const text = this.children.getByName('badgeText') as Phaser.GameObjects.Text;
      if (text) {
        text.setText(String(getValue()));
      }
    });
  }

  private addTowerStatusUI(): void {
    const statusY = 740;

    const statusBg = this.add.graphics();
    statusBg.fillStyle(0x0f3460, 0.8);
    statusBg.fillRoundedRect(50, statusY - 25, 650, 50, 10);
    statusBg.lineStyle(1, 0xffffff, 0.1);
    statusBg.strokeRoundedRect(50, statusY - 25, 650, 50, 10);

    const comboText = this.add.text(100, statusY, `连击: ${this.comboCount}`, {
      font: 'bold 16px Arial',
      color: '#ff9800'
    }).setOrigin(0, 0.5).setName('comboStatus');

    const mistakeText = this.add.text(280, statusY, `失误: ${this.mistakeCount}`, {
      font: 'bold 16px Arial',
      color: '#f44336'
    }).setOrigin(0, 0.5).setName('mistakeStatus');

    const hasLimitedMistakes = this.hasTowerRule('limited_mistake_penalty');
    if (hasLimitedMistakes) {
      const maxMistakes = this.getTowerRule('limited_mistake_penalty')?.value || 3;
      mistakeText.setText(`失误: ${this.mistakeCount}/${maxMistakes}`);
    }

    const perfectText = this.add.text(480, statusY, `完美: ${this.perfectSnaps}`, {
      font: 'bold 16px Arial',
      color: '#4caf50'
    }).setOrigin(0, 0.5).setName('perfectStatus');
  }

  private updateTowerStatusUI(): void {
    const comboText = this.children.getByName('comboStatus') as Phaser.GameObjects.Text;
    const mistakeText = this.children.getByName('mistakeStatus') as Phaser.GameObjects.Text;
    const perfectText = this.children.getByName('perfectStatus') as Phaser.GameObjects.Text;

    if (comboText) {
      comboText.setText(`连击: ${this.comboCount}`);
      if (this.comboCount >= 5) {
        comboText.setColor('#ffd700');
      } else {
        comboText.setColor('#ff9800');
      }
    }

    if (mistakeText) {
      const hasLimitedMistakes = this.hasTowerRule('limited_mistake_penalty');
      if (hasLimitedMistakes) {
        const maxMistakes = this.getTowerRule('limited_mistake_penalty')?.value || 3;
        mistakeText.setText(`失误: ${this.mistakeCount}/${maxMistakes}`);
      } else {
        mistakeText.setText(`失误: ${this.mistakeCount}`);
      }
    }

    if (perfectText) {
      perfectText.setText(`完美: ${this.perfectSnaps}`);
    }
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
    const rotationAngle = this.hasLevelSpecialRule('no_rotation_reset') ? 45 : 90;
    if (selected && !selected.isPieceSnapped()) {
      selected.rotatePieceBy(rotationAngle);
      this.rotationAdjustCount++;
      this.cameras.main.shake(40, 0.002, false);
    } else {
      const pieceToRotate = this.pieces.find(p => !p.isPieceSnapped());
      if (pieceToRotate) {
        pieceToRotate.setSelected(true);
        pieceToRotate.rotatePieceBy(rotationAngle);
        this.rotationAdjustCount++;
      }
    }
  }

  private toggleHint(): void {
    this.useFullPreviewHint();
  }

  private useOutlineFlashHint(): void {
    if (this.hasTowerRule('no_hint_restriction')) return;
    if (this.isPaused || this.isCompleted) return;

    if (this.hasLevelSpecialRule('limited_hints')) {
      const limit = this.getLevelSpecialRule('limited_hints')?.value ?? 2;
      if (this.outlineFlashCount + this.pieceHighlightCount + this.fullPreviewCount >= limit) {
        this.cameras.main.flash(100, 255, 100, 100, false);
        return;
      }
    }

    if (this.randomEventsEnabled && !this.isTowerFloor && !this.isEventLevel && RandomEventManager.isHintDisabled()) {
      this.cameras.main.flash(100, 255, 100, 100, false);
      return;
    }

    const unsnappedRealPieces = this.pieces.filter(p => !p.isPieceSnapped() && !p.isMirror);
    if (unsnappedRealPieces.length === 0) return;

    unsnappedRealPieces.forEach(piece => {
      piece.startOutlineFlash();
    });

    this.outlineFlashCount++;
    this.hintsUsed++;
    this.events.emit('hints-updated');

    this.cameras.main.flash(80, 255, 235, 59, false);
    this.updateUI();
  }

  private usePieceHighlightHint(): void {
    if (this.hasTowerRule('no_hint_restriction')) return;
    if (this.isPaused || this.isCompleted) return;

    if (this.hasLevelSpecialRule('limited_hints')) {
      const limit = this.getLevelSpecialRule('limited_hints')?.value ?? 2;
      if (this.outlineFlashCount + this.pieceHighlightCount + this.fullPreviewCount >= limit) {
        this.cameras.main.flash(100, 255, 100, 100, false);
        return;
      }
    }

    if (this.randomEventsEnabled && !this.isTowerFloor && !this.isEventLevel && RandomEventManager.isHintDisabled()) {
      this.cameras.main.flash(100, 255, 100, 100, false);
      return;
    }

    const unsnappedRealPieces = this.pieces.filter(p => !p.isPieceSnapped() && !p.isMirror);
    if (unsnappedRealPieces.length === 0) return;

    const targetPiece = unsnappedRealPieces[Math.floor(Math.random() * unsnappedRealPieces.length)];

    targetPiece.startPieceHighlight();
    targetPiece.showTargetIndicator();

    this.pieceHighlightCount++;
    this.hintsUsed++;
    this.events.emit('hints-updated');

    this.cameras.main.flash(80, 0, 229, 255, false);
    this.updateUI();
  }

  private useFullPreviewHint(): void {
    if (this.hasTowerRule('no_hint_restriction')) return;
    if (this.isPaused || this.isCompleted) return;

    if (this.hasLevelSpecialRule('limited_hints')) {
      const limit = this.getLevelSpecialRule('limited_hints')?.value ?? 2;
      if (this.outlineFlashCount + this.pieceHighlightCount + this.fullPreviewCount >= limit) {
        this.cameras.main.flash(100, 255, 100, 100, false);
        return;
      }
    }

    if (this.randomEventsEnabled && !this.isTowerFloor && !this.isEventLevel && RandomEventManager.isHintDisabled()) {
      this.cameras.main.flash(100, 255, 100, 100, false);
      return;
    }

    if (this.fullPreviewActive) {
      this.stopFullPreview();
      return;
    }

    if (this.fullPreviewCount >= HintConfig.maxFullPreviewCount) {
      const flashText = this.add.text(375, 300, '完整预览已用完!', {
        font: 'bold 24px Arial',
        color: '#f44336'
      }).setOrigin(0.5).setDepth(100);
      this.tweens.add({
        targets: flashText,
        y: 260,
        alpha: 0,
        duration: 1200,
        ease: 'Cubic.easeOut',
        onComplete: () => flashText.destroy()
      });
      return;
    }

    this.fullPreviewActive = true;
    this.fullPreviewCount++;
    this.hintsUsed++;
    this.fullPreviewStartAt = this.elapsedTime;
    this.showHint = true;

    this.tweens.add({
      targets: this.hintImage,
      alpha: HintConfig.fullPreviewAlpha,
      duration: 300,
      ease: 'Cubic.easeOut'
    });

    const previewText = this.add.text(375, 220, `完整预览 ${this.fullPreviewCount}/${HintConfig.maxFullPreviewCount}`, {
      font: 'bold 20px Arial',
      color: '#e1bee7'
    }).setOrigin(0.5).setDepth(100);

    this.fullPreviewTimer = this.time.delayedCall(HintConfig.fullPreviewDuration, () => {
      previewText.destroy();
      this.stopFullPreview();
    });

    this.events.emit('hints-updated');
    this.cameras.main.flash(80, 156, 39, 176, false);
    this.updateUI();
  }

  private stopFullPreview(): void {
    if (!this.fullPreviewActive) return;

    this.fullPreviewActive = false;
    this.showHint = false;

    if (this.fullPreviewStartAt !== null) {
      this.hintViewTime += this.elapsedTime - this.fullPreviewStartAt;
      this.fullPreviewStartAt = null;
    }

    this.tweens.add({
      targets: this.hintImage,
      alpha: 0,
      duration: 300,
      ease: 'Cubic.easeOut'
    });

    if (this.fullPreviewTimer) {
      this.fullPreviewTimer.remove(false);
      this.fullPreviewTimer = null;
    }
  }

  private resetLevel(): void {
    this.snappedCount = 0;
    this.isCompleted = false;
    this.elapsedTime = 0;
    this.isPaused = false;
    this.comboCount = 0;
    this.maxCombo = 0;
    this.mistakeCount = 0;
    this.hintsUsed = 0;
    this.perfectSnaps = 0;
    this.totalSnapDistance = 0;
    this.snapCount = 0;
    this.snapCountForShuffle = 0;
    this.comboBonusMultiplier = 1;
    this.snapTimestamps = [];
    this.rotationAdjustCount = 0;
    this.hintViewTime = 0;
    this.hintLastEnabledAt = null;
    this.outlineFlashCount = 0;
    this.pieceHighlightCount = 0;
    this.fullPreviewCount = 0;
    this.fullPreviewTimer = null;
    this.fullPreviewActive = false;
    this.fullPreviewStartAt = null;
    this.scoreSurgeMultiplier = 1;

    this.pieces.forEach(piece => piece.clearAllHints());

    PuzzlePieceSprite.clearSelection();

    this.mirrorPieces.forEach(mp => mp.destroy());
    this.mirrorPieces = [];
    this.pieces = this.pieces.filter(p => !p.isMirror);

    const newPositions = this.generateShufflePositions(this.pieces.length);
    this.pieces.forEach((piece, index) => {
      piece.reset();
      piece.setPosition(newPositions[index].x, newPositions[index].y);
      piece.updateInitialPosition(newPositions[index].x, newPositions[index].y);
    });

    if (this.isTowerFloor && this.hasTowerRule('mirror_pieces')) {
      this.createMirrorPieces();
    }

    if (this.randomEventsEnabled && !this.isTowerFloor && !this.isEventLevel) {
      RandomEventManager.startSession(this.levelRule.difficulty);
    }

    this.startTimer();
    this.updateUI();
  }

  private setupEvents(): void {
    this.events.on('piece-snapped', (data: { pieceId: number; piece: PuzzlePieceSprite; distance: number; isPerfect: boolean }) => {
      if (data.piece && data.piece.isMirror) {
        this.handleMirrorSnap(data.piece);
        return;
      }

      this.snappedCount++;
      this.snapCount++;
      this.snapTimestamps.push(this.elapsedTime);

      this.comboCount++;
      if (this.comboCount > this.maxCombo) {
        this.maxCombo = this.comboCount;
      }

      this.totalSnapDistance += data.distance || 0;

      if (data.isPerfect) {
        this.perfectSnaps++;
      }

      const piece = data.piece;
      const targetX = piece.getData('liveTargetX') ?? piece.getTargetX();
      const targetY = piece.getData('liveTargetY') ?? piece.getTargetY();
      this.snapRecords.push({
        pieceId: data.pieceId,
        timestamp: this.elapsedTime,
        distance: data.distance,
        isPerfect: data.isPerfect,
        isMirror: false,
        startX: piece.x,
        startY: piece.y,
        targetX: targetX as number,
        targetY: targetY as number
      });

      if (this.isTowerFloor) {
        if (this.hasTowerRule('combo_bonus')) {
          const comboMultiplier = this.getTowerRule('combo_bonus')?.value || 1.5;
          this.comboBonusMultiplier = 1 + (this.comboCount - 1) * (comboMultiplier - 1) * 0.1;
        }

        this.handleShuffleEveryNPieces();

        this.updateTowerStatusUI();
      }

      this.updateUI();

      this.playLevelSfx('snap');
      this.updateFogOverlay();
      this.handleScoreSurgeOnSnap();

      this.cameras.main.flash(80, 255, 255, 200, false);

      this.saveCurrentProgress();

      if (this.snappedCount >= this.realPiecesCount) {
        this.time.delayedCall(400, () => this.onLevelComplete());
      }
    });

    this.events.on('piece-missed', (data: { pieceId: number; piece: PuzzlePieceSprite }) => {
      this.mistakeRecords.push({
        pieceId: data.pieceId,
        timestamp: this.elapsedTime,
        type: data.piece.isMirror ? 'mirror_snap' : 'missed_snap',
        x: data.piece.x,
        y: data.piece.y
      });

      this.comboCount = 0;
      this.comboBonusMultiplier = 1;

      if (this.isTowerFloor) {
        this.mistakeCount++;

        if (this.hasTowerRule('time_penalty')) {
          const penalty = this.getTowerRule('time_penalty')?.value || 5;
          this.elapsedTime += penalty;
          this.cameras.main.shake(200, 0.005, false);

          const penaltyText = this.add.text(375, 300, `-${penalty}s`, {
            font: 'bold 28px Arial',
            color: '#f44336'
          }).setOrigin(0.5).setDepth(100);
          this.tweens.add({
            targets: penaltyText,
            y: 260,
            alpha: 0,
            duration: 800,
            ease: 'Cubic.easeOut',
            onComplete: () => penaltyText.destroy()
          });
        }

        if (this.hasTowerRule('limited_mistake_penalty')) {
          const maxMistakes = this.getTowerRule('limited_mistake_penalty')?.value || 3;
          if (this.mistakeCount >= maxMistakes) {
            this.onMistakeLimitReached();
            return;
          }
        }

        this.updateTowerStatusUI();
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

  private setupRandomEventUI(): void {
    if (!this.randomEventsEnabled || this.isTowerFloor || this.isEventLevel) return;

    this.randomEventContainer = this.add.container(375, 700);
    this.randomEventContainer.setDepth(50);
    this.randomEventContainer.setVisible(true);
  }

  private setupLevelSoundTheme(): void {
    const theme = this.levelRule.soundTheme;
    if (!theme) return;

    if (theme.bgmKey && this.cache.audio.exists(theme.bgmKey)) {
      this.currentBgmKey = theme.bgmKey;
      this.sound.play(theme.bgmKey, { loop: true, volume: 0.4 });
    }

    if (theme.ambientKey && this.cache.audio.exists(theme.ambientKey)) {
      this.currentAmbientKey = theme.ambientKey;
      this.sound.play(theme.ambientKey, { loop: true, volume: 0.2 });
    }
  }

  private playLevelSfx(sfxType: 'snap' | 'complete' | 'fail'): void {
    const theme = this.levelRule.soundTheme;
    let key: string | undefined;
    switch (sfxType) {
      case 'snap': key = theme?.snapSfxKey; break;
      case 'complete': key = theme?.completeSfxKey; break;
      case 'fail': key = theme?.failSfxKey; break;
    }
    if (key && this.cache.audio.exists(key)) {
      this.sound.play(key, { volume: 0.6 });
    }
  }

  private stopLevelSoundTheme(): void {
    if (this.currentBgmKey) {
      const bgm = this.sound.get(this.currentBgmKey);
      if (bgm && bgm.isPlaying) bgm.stop();
      this.currentBgmKey = null;
    }
    if (this.currentAmbientKey) {
      const ambient = this.sound.get(this.currentAmbientKey);
      if (ambient && ambient.isPlaying) ambient.stop();
      this.currentAmbientKey = null;
    }
  }

  private setupLevelSpecialRules(): void {
    const rules = this.levelRule.specialRules;
    if (!rules || rules.length === 0) return;

    rules.forEach(rule => {
      switch (rule.type) {
        case 'fog_of_war':
          this.setupFogOfWar(rule.value ?? 0.5);
          break;
        case 'piece_drift':
          this.setupPieceDrift(rule.value ?? 0.5);
          break;
        case 'limited_hints':
          break;
        case 'time_pressure':
          break;
        case 'score_surge':
          break;
        case 'no_rotation_reset':
          break;
        case 'gravity_pull':
          break;
      }
    });

    if (rules.some(r => r.type !== 'fog_of_war' && r.type !== 'piece_drift' && r.type !== 'limited_hints')) {
      this.addSpecialRulesIndicator(rules);
    }
  }

  private setupFogOfWar(intensity: number): void {
    this.fogOverlay = this.add.graphics();
    this.fogOverlay.setDepth(8);
    this.updateFogOverlay();
  }

  private updateFogOverlay(): void {
    if (!this.fogOverlay) return;

    const rule = this.getLevelSpecialRule('fog_of_war');
    if (!rule) return;

    const intensity = rule.value ?? 0.5;
    const progress = this.realPiecesCount > 0 ? this.snappedCount / this.realPiecesCount : 0;
    const effectiveIntensity = intensity * (1 - progress * 0.8);

    this.fogOverlay.clear();
    if (effectiveIntensity > 0.01) {
      this.fogOverlay.fillStyle(0x000000, effectiveIntensity);
      this.fogOverlay.fillRect(0, 120, 750, 780);
    }
  }

  private setupPieceDrift(speed: number): void {
    this.pieceDriftTimer = this.time.addEvent({
      delay: 2000,
      loop: true,
      callback: () => {
        if (this.isPaused || this.isCompleted) return;
        const unsnapped = this.pieces.filter(p => !p.isPieceSnapped() && !p.isMirror);
        unsnapped.forEach(piece => {
          const dx = (Math.random() - 0.5) * speed * 20;
          const dy = (Math.random() - 0.5) * speed * 20;
          this.tweens.add({
            targets: piece,
            x: piece.x + dx,
            y: piece.y + dy,
            duration: 1500,
            ease: 'Sine.easeInOut'
          });
        });
      }
    });
  }

  private getLevelSpecialRule(type: string): LevelSpecialRule | undefined {
    return this.levelRule.specialRules?.find(r => r.type === type);
  }

  private hasLevelSpecialRule(type: string): boolean {
    return this.levelRule.specialRules?.some(r => r.type === type) ?? false;
  }

  private addSpecialRulesIndicator(rules: LevelSpecialRule[]): void {
    const displayRules = rules.filter(r => r.type !== 'fog_of_war');
    if (displayRules.length === 0) return;

    const rulesY = this.isTowerFloor ? 128 : 128;
    const ruleNames = displayRules.map(r => r.name);
    const ruleText = ruleNames.join(' · ');
    const ruleBg = this.add.graphics();
    ruleBg.fillStyle(0x9c27b0, 0.8);
    const ruleTextWidth = Math.min(660, ruleText.length * 13 + 24);
    ruleBg.fillRoundedRect(60, rulesY - 10, ruleTextWidth, 22, 6);
    this.add.text(72, rulesY + 1, `📜 ${ruleText}`, {
      font: 'bold 11px Arial',
      color: '#ffffff'
    }).setOrigin(0, 0.5);
  }

  private cleanupSpecialRules(): void {
    if (this.pieceDriftTimer) {
      this.pieceDriftTimer.remove(false);
      this.pieceDriftTimer = null;
    }
    if (this.scoreSurgeTimer) {
      this.scoreSurgeTimer.remove(false);
      this.scoreSurgeTimer = null;
    }
    if (this.fogOverlay) {
      this.fogOverlay.destroy();
      this.fogOverlay = null as any;
    }
    this.scoreSurgeMultiplier = 1;
  }

  private handleScoreSurgeOnSnap(): void {
    if (!this.hasLevelSpecialRule('score_surge')) return;

    const rule = this.getLevelSpecialRule('score_surge');
    if (!rule) return;

    if (this.comboCount >= 3) {
      this.scoreSurgeMultiplier = rule.value ?? 1.5;

      if (this.scoreSurgeTimer) {
        this.scoreSurgeTimer.remove(false);
      }

      this.scoreSurgeTimer = this.time.delayedCall(5000, () => {
        this.scoreSurgeMultiplier = 1;
      });
    }
  }

  private applyLevelTimePressure(deltaSeconds: number): number {
    if (!this.hasLevelSpecialRule('time_pressure')) return deltaSeconds;

    const rule = this.getLevelSpecialRule('time_pressure');
    if (!rule) return deltaSeconds;

    const remaining = this.levelRule.timeLimit - this.elapsedTime;
    const ratio = remaining / this.levelRule.timeLimit;
    const threshold = 0.3;

    if (ratio < threshold) {
      return deltaSeconds * (rule.value ?? 1.3);
    }
    return deltaSeconds;
  }

  private applyGravityPull(): void {
    if (!this.hasLevelSpecialRule('gravity_pull')) return;
    if (this.isPaused || this.isCompleted) return;

    const rule = this.getLevelSpecialRule('gravity_pull');
    const strength = (rule?.value ?? 0.3) * 0.3;

    const unsnapped = this.pieces.filter(p => !p.isPieceSnapped() && !p.isMirror);
    unsnapped.forEach(piece => {
      const dx = GameScene.TARGET_AREA_X - piece.x;
      const dy = GameScene.TARGET_AREA_Y - piece.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 10) {
        piece.x += (dx / dist) * strength;
        piece.y += (dy / dist) * strength;
      }
    });
  }

  private getLevelScoreMultiplier(): number {
    const rewardConfig = this.levelRule.rewardConfig;
    let multiplier = rewardConfig?.scoreMultiplier ?? 1;
    multiplier *= this.scoreSurgeMultiplier;
    return multiplier;
  }

  private getLevelStarThresholds(): number[] | undefined {
    return this.levelRule.rewardConfig?.starThresholds;
  }

  private handleRandomEventTriggered(activeEvent: ActiveRandomEvent): void {
    const eventData = getRandomEventById(activeEvent.eventId);
    if (!eventData) return;

    this.showEventNotification(eventData);

    eventData.effects.forEach(effect => {
      switch (effect.type) {
        case 'time_penalty':
          this.applyTimePenalty(effect.value);
          break;
        case 'piece_damage_count':
          this.applyPieceDamage(effect.value);
          break;
        case 'hint_disable':
          if (this.showHint) {
            this.toggleHint();
          }
          break;
      }
    });
  }

  private showEventNotification(eventData: RandomEventData): void {
    const isPositive = eventData.direction === 'positive';
    const bgColor = isPositive ? 0x4caf50 : eventData.color;

    const notification = this.add.container(375, 200);
    notification.setDepth(100);
    notification.setScale(0);

    const bg = this.add.graphics();
    bg.fillStyle(bgColor, 0.95);
    bg.fillRoundedRect(-200, -50, 400, 100, 16);
    bg.lineStyle(3, 0xffffff, 0.3);
    bg.strokeRoundedRect(-200, -50, 400, 100, 16);
    notification.add(bg);

    const iconText = this.add.text(0, -15, eventData.icon, {
      font: '36px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);
    notification.add(iconText);

    const nameText = this.add.text(0, 20, eventData.name, {
      font: 'bold 18px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);
    notification.add(nameText);

    const descText = this.add.text(0, 42, eventData.description, {
      font: '13px Arial',
      color: 'rgba(255,255,255,0.9)'
    }).setOrigin(0.5);
    notification.add(descText);

    this.tweens.add({
      targets: notification,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut'
    });

    this.tweens.add({
      targets: notification,
      y: 160,
      alpha: 0,
      delay: 2000,
      duration: 400,
      ease: 'Cubic.easeIn',
      onComplete: () => notification.destroy()
    });

    if (!isPositive) {
      this.cameras.main.shake(200, 0.008, false);
    } else {
      this.cameras.main.flash(150, 255, 255, 200, false);
    }
  }

  private applyTimePenalty(penalty: number): void {
    this.elapsedTime += penalty;

    const penaltyText = this.add.text(375, 300, `-${penalty}秒`, {
      font: 'bold 32px Arial',
      color: '#f44336'
    }).setOrigin(0.5).setDepth(100);

    this.tweens.add({
      targets: penaltyText,
      y: 260,
      alpha: 0,
      duration: 800,
      ease: 'Cubic.easeOut',
      onComplete: () => penaltyText.destroy()
    });

    this.updateTimerDisplay();
    this.updateUI();
  }

  private applyPieceDamage(count: number): void {
    const snappedPieces = this.pieces.filter(p => p.isPieceSnapped() && !p.isMirror);
    const damageCount = Math.min(count, snappedPieces.length);

    if (damageCount <= 0) return;

    const shuffled = Phaser.Utils.Array.Shuffle([...snappedPieces]);
    const toDamage = shuffled.slice(0, damageCount);

    toDamage.forEach((piece, index) => {
      this.time.delayedCall(index * 150, () => {
        piece.setSnapped(false);
        piece.setData('snapped', false);

        const targetX = Phaser.Math.Between(80, 670);
        const targetY = Phaser.Math.Between(920, 1100);

        this.tweens.add({
          targets: piece,
          x: targetX,
          y: targetY,
          angle: Phaser.Math.Between(-30, 30),
          duration: 500,
          ease: 'Bounce.easeOut'
        });

        piece.setDepth(10);
        this.snappedCount = Math.max(0, this.snappedCount - 1);
        this.updateUI();
      });
    });

    this.cameras.main.shake(300, 0.01, false);
  }

  private updateActiveEventUI(): void {
    if (!this.randomEventsEnabled || this.isTowerFloor || this.isEventLevel) return;

    const activeEvents = RandomEventManager.getActiveEvents();

    this.activeEventIcons.forEach(icon => icon.destroy());
    this.activeEventIcons = [];

    activeEvents.forEach((event, index) => {
      const eventData = getRandomEventById(event.eventId);
      if (!eventData) return;

      const iconContainer = this.add.container(60 + index * 60, 150);
      iconContainer.setDepth(60);

      const bg = this.add.graphics();
      const bgColor = eventData.color;
      bg.fillStyle(bgColor, 0.85);
      bg.fillRoundedRect(-25, -25, 50, 50, 10);
      bg.lineStyle(2, 0xffffff, 0.5);
      bg.strokeRoundedRect(-25, -25, 50, 50, 10);
      iconContainer.add(bg);

      const icon = this.add.text(0, 0, eventData.icon, {
        font: '24px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);
      iconContainer.add(icon);

      if (event.remainingDuration > 0 && event.duration > 3 && event.duration < 1000) {
        const progress = event.remainingDuration / event.duration;
        const progressBg = this.add.graphics();
        progressBg.fillStyle(0x000000, 0.5);
        progressBg.fillRoundedRect(-22, 22, 44, 6, 3);
        iconContainer.add(progressBg);

        const progressBar = this.add.graphics();
        progressBar.fillStyle(0x4caf50, 1);
        progressBar.fillRoundedRect(-22, 22, 44 * progress, 6, 3);
        iconContainer.add(progressBar);
      } else if (event.duration >= 1000) {
        const badge = this.add.graphics();
        badge.fillStyle(0xffffff, 0.9);
        badge.fillCircle(18, -18, 6);
        iconContainer.add(badge);
        const badgeText = this.add.text(18, -18, '★', {
          font: 'bold 8px Arial',
          color: '#ffd700'
        }).setOrigin(0.5);
        iconContainer.add(badgeText);
      }

      this.activeEventIcons.push(iconContainer);
    });
  }

  private handleShuffleEveryNPieces(): void {
    if (!this.hasTowerRule('shuffle_every_n_pieces')) return;

    const n = this.getTowerRule('shuffle_every_n_pieces')?.value || 3;
    this.snapCountForShuffle++;

    if (this.snapCountForShuffle >= n && this.snappedCount < this.realPiecesCount) {
      this.snapCountForShuffle = 0;
      this.shuffleRemainingPieces();
    }
  }

  private handleMirrorSnap(mirrorPiece: PuzzlePieceSprite): void {
    this.snapRecords.push({
      pieceId: mirrorPiece.getPieceId(),
      timestamp: this.elapsedTime,
      distance: 0,
      isPerfect: false,
      isMirror: true,
      startX: mirrorPiece.x,
      startY: mirrorPiece.y,
      targetX: mirrorPiece.getTargetX(),
      targetY: mirrorPiece.getTargetY()
    });

    this.comboCount = 0;
    this.mistakeCount++;
    this.comboBonusMultiplier = 1;

    this.cameras.main.shake(300, 0.008, false);

    const breakText = this.add.text(mirrorPiece.x, mirrorPiece.y - 40, '幻影!', {
      font: 'bold 22px Arial',
      color: '#e94560'
    }).setOrigin(0.5).setDepth(100);
    this.tweens.add({
      targets: breakText,
      y: breakText.y - 50,
      alpha: 0,
      duration: 800,
      ease: 'Cubic.easeOut',
      onComplete: () => breakText.destroy()
    });

    this.tweens.add({
      targets: mirrorPiece,
      alpha: 0,
      scale: 0.3,
      duration: 400,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        mirrorPiece.destroy();
        const idx = this.mirrorPieces.indexOf(mirrorPiece);
        if (idx >= 0) this.mirrorPieces.splice(idx, 1);
        const pieceIdx = this.pieces.indexOf(mirrorPiece);
        if (pieceIdx >= 0) this.pieces.splice(pieceIdx, 1);
      }
    });

    if (this.hasTowerRule('time_penalty')) {
      const penalty = this.getTowerRule('time_penalty')?.value || 5;
      this.elapsedTime += penalty;
    }

    if (this.hasTowerRule('limited_mistake_penalty')) {
      const maxMistakes = this.getTowerRule('limited_mistake_penalty')?.value || 3;
      if (this.mistakeCount >= maxMistakes) {
        this.onMistakeLimitReached();
        return;
      }
    }

    this.updateTowerStatusUI();
  }

  private shuffleRemainingPieces(): void {
    const unsnapped = this.pieces.filter(p => !p.isPieceSnapped());
    const positions = unsnapped.map(p => ({ x: p.x, y: p.y }));
    const shuffled = Phaser.Utils.Array.Shuffle([...positions]);

    unsnapped.forEach((piece, index) => {
      this.tweens.add({
        targets: piece,
        x: shuffled[index].x,
        y: shuffled[index].y,
        duration: 300,
        ease: 'Cubic.easeInOut'
      });
    });

    this.cameras.main.flash(150, 255, 150, 0, false);
  }

  private onMistakeLimitReached(): void {
    this.isCompleted = true;
    if (this.timerEvent) this.timerEvent.paused = true;

    this.playLevelSfx('fail');
    this.stopLevelSoundTheme();
    this.cleanupSpecialRules();

    if (this.fullPreviewActive) {
      this.stopFullPreview();
    }

    this.pieces.forEach(piece => piece.clearAllHints());

    if (this.targetTween) {
      this.targetTween.stop();
    }

    if (this.autoSaveTimer) {
      this.autoSaveTimer.remove(false);
      this.autoSaveTimer = null;
    }

    SaveManager.clearPuzzleSave(
      this.levelRule.id,
      this.isEventLevel,
      this.eventId,
      this.isTowerFloor,
      this.towerFloorId
    );

    if (this.isTowerFloor && this.towerFloorId) {
      SaveManager.failTowerFloor(this.towerFloorId);
    }

    this.showGameOver(0, this.snappedCount, this.realPiecesCount, 'mistake_limit');
  }

  private startTimer(): void {
    if (this.timerEvent) this.timerEvent.remove(false);
    if (this.speedSampleTimer) this.speedSampleTimer.remove(false);

    this.startTime = this.time.now;
    this.lastSampleSnappedCount = 0;

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

    this.speedSampleTimer = this.time.addEvent({
      delay: 2000,
      loop: true,
      callback: () => {
        if (!this.isPaused && !this.isCompleted) {
          this.recordSpeedSample();
        }
      }
    });
  }

  private recordSpeedSample(): void {
    const newSnapped = this.snappedCount - this.lastSampleSnappedCount;
    const piecesPerSecond = newSnapped / 2;
    this.speedSamples.push({
      timestamp: this.elapsedTime,
      snappedCount: this.snappedCount,
      piecesPerSecond
    });
    this.lastSampleSnappedCount = this.snappedCount;
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

  private getHintUsageStats(): HintUsageStats {
    return {
      outlineFlashCount: this.outlineFlashCount,
      pieceHighlightCount: this.pieceHighlightCount,
      fullPreviewCount: this.fullPreviewCount,
      fullPreviewViewTime: this.hintViewTime,
      totalHintsUsed: this.outlineFlashCount + this.pieceHighlightCount + this.fullPreviewCount
    };
  }

  private getComboRewardStats(): ComboRewardStats {
    return {
      maxCombo: this.maxCombo,
      rotationAdjustCount: this.rotationAdjustCount,
      totalHintsUsed: this.hintsUsed
    };
  }

  private updateUI(): void {
    const result = calculateScore(
      this.elapsedTime,
      this.levelRule.timeLimit,
      this.pieces.length,
      this.snappedCount,
      this.getHintUsageStats(),
      this.getComboRewardStats(),
      this.getLevelStarThresholds()
    );
    let finalMultiplier = this.scoreMultiplier;
    finalMultiplier *= this.getLevelScoreMultiplier();

    if (this.randomEventsEnabled && !this.isTowerFloor && !this.isEventLevel) {
      finalMultiplier *= RandomEventManager.getScoreMultiplier();
    }

    const finalScore = Math.floor(result.score * finalMultiplier);
    this.scoreText.setText(`得分: ${finalScore}`);
  }

  private generateReplayData(score: number, stars: number): ReplayData {
    const pieceTextureKeys = this.pieces
      .filter(p => !p.isMirror)
      .map(p => p.getData('textureKey') as string || `specimen-${this.specimen.id}-piece-${p.getPieceId()}`);

    return {
      replayId: `replay_${this.levelRule.id}_${Date.now()}`,
      levelId: this.levelRule.id,
      specimenId: this.specimen.id,
      levelName: this.levelRule.name,
      difficulty: this.levelRule.difficulty,
      totalTime: this.elapsedTime,
      score,
      stars,
      totalPieces: this.realPiecesCount,
      rows: this.levelRule.rows,
      cols: this.levelRule.cols,
      snapRecords: [...this.snapRecords],
      mistakeRecords: [...this.mistakeRecords],
      speedSamples: [...this.speedSamples],
      targetTextureKey: this.targetTextureKey,
      pieceTextureKeys,
      isEventLevel: this.isEventLevel,
      eventId: this.eventId,
      isTowerFloor: this.isTowerFloor,
      towerFloorId: this.towerFloorId,
      completedAt: Date.now()
    };
  }

  private onLevelComplete(): void {
    this.isCompleted = true;
    if (this.timerEvent) this.timerEvent.paused = true;
    if (this.speedSampleTimer) this.speedSampleTimer.paused = true;

    this.playLevelSfx('complete');
    this.stopLevelSoundTheme();
    this.cleanupSpecialRules();

    if (this.fullPreviewActive) {
      this.stopFullPreview();
    }

    if (this.hintLastEnabledAt !== null) {
      this.hintViewTime += this.elapsedTime - this.hintLastEnabledAt;
      this.hintLastEnabledAt = null;
    }

    this.pieces.forEach(piece => piece.clearAllHints());

    if (this.targetTween) {
      this.targetTween.stop();
    }

    if (this.autoSaveTimer) {
      this.autoSaveTimer.remove(false);
      this.autoSaveTimer = null;
    }

    SaveManager.clearPuzzleSave(
      this.levelRule.id,
      this.isEventLevel,
      this.eventId,
      this.isTowerFloor,
      this.towerFloorId
    );

    if (this.isTowerFloor && this.towerFloorData && this.towerFloorId) {
      const towerPreviousProgress = SaveManager.getTowerFloorProgress(this.towerFloorId);
      const towerResult = this.calculateTowerScore();
      const completeResult = SaveManager.completeTowerFloor(this.towerFloorId, towerResult);

      RepairLogManager.recordEntry({
        levelId: this.towerFloorId,
        specimenId: this.towerFloorData.specimenId,
        specimenName: this.specimen.name,
        score: towerResult.score,
        time: this.elapsedTime,
        stars: towerResult.stars,
        previousStars: towerPreviousProgress?.stars ?? 0,
        previousBestScore: towerPreviousProgress?.bestScore ?? 0,
        previousBestTime: towerPreviousProgress?.bestTime ?? 0,
        difficulty: 'hard',
        isEventLevel: false,
        eventId: null,
        isTowerFloor: true,
        towerFloorId: this.towerFloorId,
        comboCount: this.maxCombo,
        hintsUsed: this.hintsUsed,
        hasConservationBonus: false,
        mirrorBrokenCount: 0,
      });

      this.cameras.main.zoomTo(1.05, 400, 'Cubic.easeInOut', true);
      this.time.delayedCall(450, () => {
        this.cameras.main.zoomTo(1.0, 400, 'Cubic.easeInOut', true);
        this.showTowerVictory(towerResult, completeResult);
      });
      return;
    }

    const result = calculateScore(
      this.elapsedTime,
      this.levelRule.timeLimit,
      this.pieces.length,
      this.snappedCount,
      this.getHintUsageStats(),
      this.getComboRewardStats(),
      this.getLevelStarThresholds()
    );
    let finalScore = Math.floor(result.score * this.scoreMultiplier * this.getLevelScoreMultiplier());
    
    let randomEventStats: RandomEventSessionStats | null = null;
    let rewardMultiplier = 1;
    
    if (this.randomEventsEnabled && !this.isTowerFloor && !this.isEventLevel) {
      const eventScoreMultiplier = RandomEventManager.getScoreMultiplier();
      rewardMultiplier = RandomEventManager.getRewardMultiplier();
      
      finalScore = Math.floor(finalScore * eventScoreMultiplier);
      
      RandomEventManager.onLevelComplete(finalScore);
      randomEventStats = RandomEventManager.endSession();
      SaveManager.save();
    }

    let chapterResult: { chapterCompleted: boolean; completedChapterId: number | null; newlyUnlockedChapterId: number | null; updatedQuests: DailyQuest[]; researchRewards: { pointsGained: number; expGained: number }; achievementResult: AchievementUnlockResult; conservationInfo: { specimenId: number | null; healthLevel: ConservationHealthLevel | null; scoreMultiplier: number; researchMultiplier: number; finalScore: number; finalPoints: number }; levelProgress: { previousStars: number; previousBestScore: number; previousBestTime: number; isNewRecord: boolean; isNewBestTime: boolean; starsImproved: boolean } } | undefined;
    let eventResult: { newlyUnlockedLevelId: number | null; updatedTotalScore: number; achievementResult: AchievementUnlockResult } | undefined;
    let updatedQuests: DailyQuest[] = [];
    let achievementResult: AchievementUnlockResult = { newlyUnlocked: [], newlyUnlockedTitles: [], scoreGained: 0 };
    let conservationMultiplier: { scoreMultiplier: number; fragmentMultiplier: number; researchMultiplier: number } | null = null;
    let levelProgressResult: { previousStars: number; previousBestScore: number; previousBestTime: number; isNewRecord: boolean; isNewBestTime: boolean; starsImproved: boolean } | null = null;

    const accuracy = this.snapCount > 0
      ? Math.round(Math.max(0, Math.min(100, (1 - this.totalSnapDistance / (this.snapCount * this.levelRule.snapPositionThreshold)) * 100)))
      : 0;

    const previousProgress = SaveManager.getProgress(this.levelRule.id);
    const previousStars = previousProgress?.stars ?? 0;
    const previousBestScore = previousProgress?.bestScore ?? 0;
    const previousBestTime = previousProgress?.bestTime ?? 0;

    if (this.isEventLevel && this.eventId) {
      eventResult = SaveManager.completeEventLevel(
        this.eventId,
        this.levelRule.id,
        finalScore,
        this.elapsedTime,
        result.stars
      );
      achievementResult = eventResult.achievementResult;
      levelProgressResult = {
        previousStars,
        previousBestScore,
        previousBestTime,
        isNewRecord: finalScore > previousBestScore,
        isNewBestTime: previousBestTime === 0 || this.elapsedTime < previousBestTime,
        starsImproved: result.stars > previousStars
      };
    } else {
      chapterResult = SaveManager.completeLevel(
        this.levelRule.id,
        result.score,
        this.elapsedTime,
        result.stars,
        {
          accuracy,
          combo: this.maxCombo,
          perfectSnaps: this.perfectSnaps,
          rotations: this.rotationAdjustCount,
          hintTime: this.hintViewTime
        }
      );
      updatedQuests = chapterResult.updatedQuests || [];
      achievementResult = chapterResult.achievementResult;
      levelProgressResult = chapterResult.levelProgress;

      if (chapterResult.conservationInfo.specimenId !== null) {
        finalScore = chapterResult.conservationInfo.finalScore;
        const multiplier = ConservationManager.getRewardMultiplierForSpecimen(chapterResult.conservationInfo.specimenId);
        conservationMultiplier = multiplier;
      }
    }

    const bonusPoints = this.levelRule.rewardConfig?.bonusResearchPoints ?? 0;
    if (bonusPoints > 0 && !this.isEventLevel && !this.isTowerFloor) {
      SaveManager.addResearchPoints(bonusPoints);
    }

    let drops = this.calculateDrops(result.stars);
    if (conservationMultiplier && !this.isEventLevel) {
      drops = {
        ...drops,
        fragments: drops.fragments.map(f => ({
          ...f,
          count: Math.max(0, Math.floor(f.count * conservationMultiplier!.fragmentMultiplier))
        })).filter(f => f.count > 0)
      };
    }
    
    if (rewardMultiplier !== 1 && !this.isEventLevel && !this.isTowerFloor) {
      drops = {
        ...drops,
        fragments: drops.fragments.map(f => ({
          ...f,
          count: Math.max(0, Math.floor(f.count * rewardMultiplier))
        })).filter(f => f.count > 0),
        materials: drops.materials.map(m => ({
          ...m,
          count: Math.max(0, Math.floor(m.count * rewardMultiplier))
        })).filter(m => m.count > 0)
      };
    }
    
    SaveManager.addWorkshopDrops(drops);

    RepairLogManager.recordEntry({
      levelId: this.levelRule.id,
      specimenId: this.specimen.id,
      specimenName: this.specimen.name,
      score: finalScore,
      time: this.elapsedTime,
      stars: result.stars,
      previousStars,
      previousBestScore,
      previousBestTime,
      difficulty: this.levelRule.difficulty,
      isEventLevel: this.isEventLevel,
      eventId: this.eventId,
      isTowerFloor: false,
      towerFloorId: null,
      comboCount: this.comboCount,
      hintsUsed: this.hintsUsed,
      hasConservationBonus: conservationMultiplier !== null && conservationMultiplier.scoreMultiplier !== 1,
      mirrorBrokenCount: this.mirrorPieces.length,
    });

    const replayData = this.generateReplayData(finalScore, result.stars);
    SaveManager.saveReplay(replayData);

    this.cameras.main.zoomTo(1.05, 400, 'Cubic.easeInOut', true);
    this.time.delayedCall(450, () => {
      this.cameras.main.zoomTo(1.0, 400, 'Cubic.easeInOut', true);
      this.showVictory(
        finalScore,
        result.stars,
        this.elapsedTime,
        chapterResult,
        drops,
        eventResult,
        updatedQuests,
        achievementResult,
        conservationMultiplier,
        randomEventStats,
        {
          accuracy,
          perfectSnaps: this.perfectSnaps,
          totalSnapDistance: this.totalSnapDistance,
          snapCount: this.snapCount,
          snapTimestamps: [...this.snapTimestamps],
          realPiecesCount: this.realPiecesCount,
          rotationAdjustCount: this.rotationAdjustCount,
          hintViewTime: this.hintViewTime,
          hintsUsed: this.hintsUsed,
          maxCombo: this.maxCombo,
          mistakeCount: this.mistakeCount
        },
        levelProgressResult,
        replayData
      );
    });
  }

  private calculateTowerScore(): TowerResultData {
    if (!this.towerFloorData) {
      return {
        floorId: this.towerFloorId || 0,
        score: 0,
        stars: 0,
        time: this.elapsedTime,
        accuracy: 0,
        maxCombo: 0,
        mistakes: this.mistakeCount,
        hintsUsed: this.hintsUsed,
        perfectSnaps: 0,
        scoringBreakdown: [],
        isNewRecord: false,
        isNewBestTime: false,
        unlockedNextFloor: false,
        rewards: [],
        snapTimestamps: [...this.snapTimestamps],
        totalSnapDistance: this.totalSnapDistance,
        snapCount: this.snapCount,
        realPiecesCount: this.realPiecesCount,
        rotationAdjustCount: this.rotationAdjustCount,
        hintViewTime: this.hintViewTime,
        previousStars: 0,
        previousBestScore: 0,
        previousBestTime: 0,
        starsImproved: false
      };
    }

    const floor = this.towerFloorData;
    const totalPieces = this.realPiecesCount;
    const scoringConditions = floor.scoringConditions;
    const scoringBreakdown: { condition: string; score: number; maxScore: number }[] = [];

    let totalScore = 0;
    const baseMaxScore = 1000;
    const totalWeight = scoringConditions.reduce((sum, c) => sum + c.weight, 0);

    scoringConditions.forEach(condition => {
      let score = 0;
      const weightRatio = totalWeight > 0 ? condition.weight / totalWeight : 1 / scoringConditions.length;
      const maxScore = Math.floor(baseMaxScore * weightRatio * scoringConditions.length);

      switch (condition.type) {
        case 'time':
          const timeRatio = Math.max(0, 1 - this.elapsedTime / floor.timeLimit);
          score = Math.floor(maxScore * Math.max(0, Math.min(1, timeRatio)));
          break;

        case 'accuracy':
          const avgDistance = this.snapCount > 0 ? this.totalSnapDistance / this.snapCount : floor.snapPositionThreshold;
          const accuracyRatio = Math.max(0, 1 - avgDistance / floor.snapPositionThreshold);
          score = Math.floor(maxScore * accuracyRatio);
          break;

        case 'combo':
          const comboThreshold = condition.threshold || 5;
          const comboRatio = Math.min(1, this.maxCombo / comboThreshold);
          score = Math.floor(maxScore * comboRatio);
          break;

        case 'mistakes':
          const mistakePenalty = Math.min(1, this.mistakeCount / 10);
          score = Math.floor(maxScore * (1 - mistakePenalty));
          break;

        case 'hint_usage':
          const hintStats = this.getHintUsageStats();
          const penalties = HintConfig.penalties;
          const totalWeightedPenalty = (
            hintStats.outlineFlashCount * 0.1 +
            hintStats.pieceHighlightCount * 0.2 +
            hintStats.fullPreviewCount * 0.35 +
            hintStats.fullPreviewViewTime * 0.015
          );
          const towerHintPenalty = Math.min(1, totalWeightedPenalty);
          score = Math.floor(maxScore * (1 - towerHintPenalty));
          break;

        case 'perfect_snap':
          const perfectRatio = totalPieces > 0 ? this.perfectSnaps / totalPieces : 0;
          score = Math.floor(maxScore * perfectRatio);
          break;
      }

      scoringBreakdown.push({
        condition: condition.name,
        score,
        maxScore
      });

      totalScore += score;
    });

    const difficultyMultiplier: Record<string, number> = {
      'hard': 1.2,
      'extreme': 1.5,
      'nightmare': 2.0
    };
    const diffMult = difficultyMultiplier[floor.difficulty] || 1;
    totalScore = Math.floor(totalScore * diffMult);

    let stars = 0;
    if (totalScore >= baseMaxScore * 0.4) stars = 1;
    if (totalScore >= baseMaxScore * 0.65) stars = 2;
    if (totalScore >= baseMaxScore * 0.85) stars = 3;

    const accuracy = this.snapCount > 0
      ? Math.round(Math.max(0, Math.min(100, (1 - this.totalSnapDistance / (this.snapCount * floor.snapPositionThreshold)) * 100)))
      : 0;

    const progress = SaveManager.getTowerFloorProgress(floor.id);
    const prevStars = progress?.stars ?? 0;
    const prevScore = progress?.bestScore ?? 0;
    const prevTime = progress?.bestTime ?? 0;
    const isNewRecord = !progress || totalScore > progress.bestScore;
    const isNewBestTime = !progress || progress.bestTime === 0 || this.elapsedTime < progress.bestTime;
    const starsImproved = stars > prevStars;

    return {
      floorId: floor.id,
      score: totalScore,
      stars,
      time: this.elapsedTime,
      accuracy,
      maxCombo: this.maxCombo,
      mistakes: this.mistakeCount,
      hintsUsed: this.hintsUsed,
      perfectSnaps: this.perfectSnaps,
      scoringBreakdown,
      isNewRecord,
      isNewBestTime,
      unlockedNextFloor: false,
      rewards: floor.rewards,
      snapTimestamps: [...this.snapTimestamps],
      totalSnapDistance: this.totalSnapDistance,
      snapCount: this.snapCount,
      realPiecesCount: this.realPiecesCount,
      rotationAdjustCount: this.rotationAdjustCount,
      hintViewTime: this.hintViewTime,
      previousStars: prevStars,
      previousBestScore: prevScore,
      previousBestTime: prevTime,
      starsImproved
    };
  }

  private onTimeUp(): void {
    this.isCompleted = true;
    if (this.timerEvent) this.timerEvent.paused = true;

    this.playLevelSfx('fail');
    this.stopLevelSoundTheme();
    this.cleanupSpecialRules();

    if (this.fullPreviewActive) {
      this.stopFullPreview();
    }

    this.pieces.forEach(piece => piece.clearAllHints());

    if (this.targetTween) {
      this.targetTween.stop();
    }

    if (this.autoSaveTimer) {
      this.autoSaveTimer.remove(false);
      this.autoSaveTimer = null;
    }

    SaveManager.clearPuzzleSave(
      this.levelRule.id,
      this.isEventLevel,
      this.eventId,
      this.isTowerFloor,
      this.towerFloorId
    );

    if (this.isTowerFloor && this.towerFloorId) {
      SaveManager.failTowerFloor(this.towerFloorId);
      this.showGameOver(0, this.snappedCount, this.realPiecesCount, 'time_up');
      return;
    }

    if (!this.isEventLevel) {
      DailyQuestManager.onLevelFail();
    }

    const result = calculateScore(
      this.levelRule.timeLimit,
      this.levelRule.timeLimit,
      this.snappedCount,
      this.snappedCount,
      this.getHintUsageStats(),
      this.getComboRewardStats(),
      this.getLevelStarThresholds()
    );

    this.showGameOver(result.score, this.snappedCount, this.pieces.length);
  }

  private calculateDrops(stars: number): { fragments: { id: number; count: number }[]; materials: { id: number; count: number }[] } {
    const rule = getDropRule(this.levelRule.difficulty, stars);
    if (!rule) return { fragments: [], materials: [] };

    const rewardConfig = this.levelRule.rewardConfig;
    const fragBonus = rewardConfig?.fragmentDropBonus ?? 0;
    const matBonus = rewardConfig?.materialDropBonus ?? 0;

    const specimenFragments = getFragmentsBySpecimenId(this.specimen.id);
    const fragmentDrops: { id: number; count: number }[] = [];
    const materialDrops: { id: number; count: number }[] = [];

    rule.fragmentDrops.forEach(drop => {
      const matching = specimenFragments.filter(f => f.rarity === drop.rarity);
      if (matching.length > 0) {
        const frag = matching[Phaser.Math.Between(0, matching.length - 1)];
        let count = Phaser.Math.Between(drop.minCount, drop.maxCount);
        count += fragBonus;
        if (count > 0) {
          const existing = fragmentDrops.find(d => d.id === frag.id);
          if (existing) {
            existing.count += count;
          } else {
            fragmentDrops.push({ id: frag.id, count });
          }
        }
      }
    });

    rule.materialDrops.forEach(drop => {
      let count = Phaser.Math.Between(drop.minCount, drop.maxCount);
      count += matBonus;
      if (count > 0) {
        const existing = materialDrops.find(d => d.id === drop.materialId);
        if (existing) {
          existing.count += count;
        } else {
          materialDrops.push({ id: drop.materialId, count });
        }
      }
    });

    return { fragments: fragmentDrops, materials: materialDrops };
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

  private calculateTimeBreakdown(
    snapTimestamps: number[],
    totalTime: number,
    totalPieces: number
  ): { firstPiece: number; firstHalf: number; secondHalf: number; avgPerPiece: number } {
    const firstPiece = snapTimestamps.length > 0 ? snapTimestamps[0] : totalTime;

    const sorted = [...snapTimestamps].sort((a, b) => a - b);
    const halfCount = Math.ceil(totalPieces / 2);

    let firstHalfTime = totalTime;
    let secondHalfTime = 0;

    if (sorted.length >= halfCount) {
      const firstHalfEnd = sorted[halfCount - 1];
      firstHalfTime = firstHalfEnd;
      secondHalfTime = Math.max(0, totalTime - firstHalfEnd);
    } else if (sorted.length > 0) {
      firstHalfTime = sorted[sorted.length - 1];
      secondHalfTime = Math.max(0, totalTime - sorted[sorted.length - 1]);
    }

    const avgPerPiece = sorted.length > 0 ? totalTime / sorted.length : totalTime;

    return {
      firstPiece,
      firstHalf: firstHalfTime,
      secondHalf: secondHalfTime,
      avgPerPiece
    };
  }

  private showVictory(
    score: number,
    stars: number,
    time: number,
    chapterResult?: { chapterCompleted: boolean; completedChapterId: number | null; newlyUnlockedChapterId: number | null; updatedQuests: DailyQuest[]; achievementResult: AchievementUnlockResult; conservationInfo?: { specimenId: number | null; healthLevel: ConservationHealthLevel | null; scoreMultiplier: number; researchMultiplier: number; finalScore: number; finalPoints: number }; levelProgress?: { previousStars: number; previousBestScore: number; previousBestTime: number; isNewRecord: boolean; isNewBestTime: boolean; starsImproved: boolean } },
    drops?: { fragments: { id: number; count: number }[]; materials: { id: number; count: number }[] },
    eventResult?: { newlyUnlockedLevelId: number | null; updatedTotalScore: number },
    updatedQuests: DailyQuest[] = [],
    achievementResult: AchievementUnlockResult = { newlyUnlocked: [], newlyUnlockedTitles: [], scoreGained: 0 },
    conservationMultiplier?: { scoreMultiplier: number; fragmentMultiplier: number; researchMultiplier: number } | null,
    randomEventStats?: RandomEventSessionStats | null,
    stats?: {
      accuracy: number;
      perfectSnaps: number;
      totalSnapDistance: number;
      snapCount: number;
      snapTimestamps: number[];
      realPiecesCount: number;
      rotationAdjustCount: number;
      hintViewTime: number;
      hintsUsed: number;
      maxCombo: number;
      mistakeCount: number;
    },
    progress?: { previousStars: number; previousBestScore: number; previousBestTime: number; isNewRecord: boolean; isNewBestTime: boolean; starsImproved: boolean } | null,
    replayData?: ReplayData
  ): void {
    const { overlay } = this.createModal('🎉 修复完成！', '#4caf50', 0x4caf50);

    let newRecordBadgeY = 458;
    const hasNewRecord = progress?.isNewRecord || progress?.isNewBestTime || progress?.starsImproved;
    if (hasNewRecord) {
      const recordBg = this.add.graphics();
      recordBg.fillStyle(0xff9800, 1);
      recordBg.fillRoundedRect(240, newRecordBadgeY - 18, 270, 34, 10);

      const badgeTexts: string[] = [];
      if (progress?.starsImproved) badgeTexts.push('⭐ 星级提升！');
      if (progress?.isNewRecord) badgeTexts.push('🏆 新纪录！');
      if (progress?.isNewBestTime && !progress?.isNewRecord) badgeTexts.push('⏱️ 最快速度！');

      this.add.text(375, newRecordBadgeY, badgeTexts.join('  '), {
        font: 'bold 16px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);

      this.tweens.add({
        targets: recordBg,
        scaleX: { from: 0, to: 1 },
        scaleY: { from: 0, to: 1 },
        duration: 400,
        ease: 'Back.easeOut'
      });
    }

    const previousStarsForDraw = progress?.previousStars ?? 0;
    const starsContainer = this.add.container(375, hasNewRecord ? 515 : 485);
    const starSize = 50;
    const starSpacing = 15;
    const starStartX = -starSize - starSpacing;

    for (let i = 0; i < 3; i++) {
      const starX = starStartX + i * (starSize + starSpacing);
      const isFilled = i < stars;
      const wasFilled = i < previousStarsForDraw;

      const tex = isFilled ? 'star-filled' : 'star-empty';
      const starImg = this.add.image(starX, 0, tex).setDisplaySize(starSize, starSize);
      starImg.setScale(0);
      starsContainer.add(starImg);

      const isNewlyUpgraded = progress?.starsImproved && !wasFilled && isFilled;
      if (isNewlyUpgraded) {
        const glow = this.add.graphics();
        glow.fillStyle(0xffd700, 0);
        glow.fillCircle(starX, 0, starSize * 0.8);
        starsContainer.add(glow);

        this.tweens.add({
          targets: starImg,
          scale: { from: 0, to: 1.3 },
          delay: 600 + i * 200,
          duration: 350,
          ease: 'Back.easeOut',
          yoyo: true,
          onYoyo: () => {
            this.tweens.add({
              targets: starImg,
              scale: 1,
              duration: 200,
              ease: 'Cubic.easeOut'
            });
          }
        });

        this.tweens.add({
          targets: glow,
          alpha: { from: 0, to: 0.8 },
          scale: { from: 0.3, to: 1.5 },
          delay: 600 + i * 200,
          duration: 500,
          ease: 'Cubic.easeOut',
          yoyo: true,
          onYoyo: () => glow.destroy()
        });
      } else {
        this.tweens.add({
          targets: starImg,
          scale: 1,
          delay: i * 150,
          duration: 300,
          ease: 'Back.easeOut'
        });
      }
    }

    let contentStartY = hasNewRecord ? 595 : 565;

    const scoreBg = this.add.graphics();
    scoreBg.fillStyle(0x0f3460, 0.6);
    scoreBg.fillRoundedRect(130, contentStartY, 490, 120, 16);

    this.add.text(375, contentStartY + 28, `最终得分`, {
      font: '18px Arial',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    const scoreText = this.add.text(375, contentStartY + 72, score.toLocaleString(), {
      font: 'bold 38px Arial',
      color: '#ffd700'
    }).setOrigin(0.5);

    if (progress?.isNewRecord && progress.previousBestScore > 0) {
      const diff = score - progress.previousBestScore;
      if (diff > 0) {
        this.add.text(375, contentStartY + 102,
          `↑ 超越历史最佳 +${diff.toLocaleString()} 分`,
          {
            font: 'bold 13px Arial',
            color: '#4caf50'
          }
        ).setOrigin(0.5);
      }
    } else if (progress && progress.previousBestScore > 0 && !progress.isNewRecord) {
      const diff = progress.previousBestScore - score;
      this.add.text(375, contentStartY + 102,
        `距离最高分还差 ${diff.toLocaleString()} 分`,
        {
          font: '12px Arial',
          color: '#ff9800'
        }
      ).setOrigin(0.5);
    }

    let infoY = contentStartY + 140;

    const timeParts = this.calculateTimeBreakdown(stats?.snapTimestamps || [], time, stats?.realPiecesCount || this.pieces.length);

    this.add.text(375, infoY, '⏱️ 用时分解', {
      font: 'bold 16px Arial',
      color: '#2196f3'
    }).setOrigin(0.5);
    infoY += 22;

    const breakdownBg = this.add.graphics();
    breakdownBg.fillStyle(0x1a2a4a, 0.9);
    breakdownBg.fillRoundedRect(130, infoY, 490, 80, 12);
    breakdownBg.lineStyle(1, 0x2196f3, 0.3);
    breakdownBg.strokeRoundedRect(130, infoY, 490, 80, 12);

    const breakdownItems = [
      { label: '首片吸附', value: formatTime(timeParts.firstPiece), icon: '🌱' },
      { label: '前半段', value: formatTime(timeParts.firstHalf), icon: '📖' },
      { label: '后半段', value: formatTime(timeParts.secondHalf), icon: '💪' },
      { label: '总用时', value: formatTime(time), icon: '🏁', highlight: true }
    ];

    breakdownItems.forEach((item, idx) => {
      const bx = 155 + idx * 120;
      this.add.text(bx, infoY + 22, item.icon, {
        font: '20px Arial'
      }).setOrigin(0.5);
      this.add.text(bx, infoY + 45, item.label, {
        font: '11px Arial',
        color: '#888888'
      }).setOrigin(0.5);
      this.add.text(bx, infoY + 64, item.value, {
        font: item.highlight ? 'bold 14px Arial' : '13px Arial',
        color: item.highlight ? '#ffd700' : '#eaeaea'
      }).setOrigin(0.5);
    });

    infoY += 95;

    if (stats) {
      const accuracyPercent = Math.max(0, Math.min(100, stats.accuracy));
      const perfectRate = stats.snapCount > 0 ? Math.round((stats.perfectSnaps / stats.snapCount) * 100) : 0;
      const avgDist = stats.snapCount > 0 ? (stats.totalSnapDistance / stats.snapCount).toFixed(1) : '0';

      this.add.text(375, infoY, '🎯 精准吸附统计', {
        font: 'bold 16px Arial',
        color: '#4caf50'
      }).setOrigin(0.5);
      infoY += 22;

      const snapBg = this.add.graphics();
      snapBg.fillStyle(0x1a2a1a, 0.9);
      snapBg.fillRoundedRect(130, infoY, 490, 85, 12);
      snapBg.lineStyle(1, 0x4caf50, 0.3);
      snapBg.strokeRoundedRect(130, infoY, 490, 85, 12);

      const snapItems = [
        { label: '精准度', value: `${accuracyPercent}%`, color: accuracyPercent >= 80 ? '#4caf50' : accuracyPercent >= 50 ? '#ff9800' : '#f44336' },
        { label: '完美吸附', value: `${stats.perfectSnaps}/${stats.snapCount}`, subValue: `${perfectRate}%`, color: '#9c27b0' },
        { label: '平均偏差', value: `${avgDist}px`, color: '#2196f3' },
        { label: '旋转次数', value: `${stats.rotationAdjustCount}`, color: '#ffc107' }
      ];

      snapItems.forEach((item, idx) => {
        const bx = 155 + idx * 120;
        this.add.text(bx, infoY + 25, item.label, {
          font: '11px Arial',
          color: '#888888'
        }).setOrigin(0.5);
        this.add.text(bx, infoY + 46, item.value, {
          font: 'bold 16px Arial',
          color: item.color
        }).setOrigin(0.5);
        if (item.subValue) {
          this.add.text(bx, infoY + 66, item.subValue, {
            font: '11px Arial',
            color: '#aaaaaa'
          }).setOrigin(0.5);
        }
      });

      infoY += 100;

      const barBg = this.add.graphics();
      barBg.fillStyle(0x0a1a2a, 1);
      barBg.fillRoundedRect(150, infoY, 450, 20, 6);
      const barRatio = accuracyPercent / 100;
      const barColor = accuracyPercent >= 80 ? 0x4caf50 : accuracyPercent >= 50 ? 0xff9800 : 0xf44336;
      const barFill = this.add.graphics();
      barFill.fillStyle(barColor, 1);
      barFill.fillRoundedRect(150, infoY, 450 * barRatio, 20, 6);

      const accuracyLabels: { threshold: number; label: string }[] = [
        { threshold: 95, label: '神乎其技！' },
        { threshold: 80, label: '技艺精湛！' },
        { threshold: 60, label: '手法熟练' },
        { threshold: 40, label: '初窥门径' },
        { threshold: 0, label: '继续努力' }
      ];
      const skillLabel = accuracyLabels.find(l => accuracyPercent >= l.threshold)?.label || '';
      this.add.text(375, infoY + 10, `吸附精准度  ${skillLabel}`, {
        font: 'bold 11px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);

      infoY += 32;
    }

    if (stats && stats.maxCombo > 0) {
      const comboRewardResult = calculateScore(
        this.elapsedTime,
        this.levelRule.timeLimit,
        this.pieces.length,
        this.snappedCount,
        this.getHintUsageStats(),
        this.getComboRewardStats(),
        this.getLevelStarThresholds()
      );

      this.add.text(375, infoY, '🔥 连贯操作奖励', {
        font: 'bold 16px Arial',
        color: '#ff9800'
      }).setOrigin(0.5);
      infoY += 22;

      const comboBg = this.add.graphics();
      comboBg.fillStyle(0x2a1a0a, 0.9);
      comboBg.fillRoundedRect(130, infoY, 490, 85, 12);
      comboBg.lineStyle(1, 0xff9800, 0.3);
      comboBg.strokeRoundedRect(130, infoY, 490, 85, 12);

      const comboRewardDetail = comboRewardResult.scoringBreakdown.find(b => b.name === '连击奖励');
      const rotationRewardDetail = comboRewardResult.scoringBreakdown.find(b => b.name === '少旋转奖励');
      const hintRewardDetail = comboRewardResult.scoringBreakdown.find(b => b.name === '少提示奖励');

      const comboItems = [
        { label: '最高连击', value: `${stats.maxCombo}连`, reward: comboRewardDetail?.score ?? 0, color: '#ff9800' },
        { label: '旋转调整', value: `${stats.rotationAdjustCount}次`, reward: rotationRewardDetail?.score ?? 0, color: '#ffc107' },
        { label: '提示使用', value: `${stats.hintsUsed}次`, reward: hintRewardDetail?.score ?? 0, color: '#2196f3' }
      ];

      comboItems.forEach((item, idx) => {
        const bx = 155 + idx * 160;
        this.add.text(bx, infoY + 22, item.label, {
          font: '11px Arial',
          color: '#888888'
        }).setOrigin(0.5);
        this.add.text(bx, infoY + 42, item.value, {
          font: 'bold 15px Arial',
          color: item.color
        }).setOrigin(0.5);
        if (item.reward > 0) {
          this.add.text(bx, infoY + 62, `+${item.reward}`, {
            font: 'bold 13px Arial',
            color: '#4caf50'
          }).setOrigin(0.5);
        } else if (item.reward === 0 && (item.label === '旋转调整' || item.label === '提示使用')) {
          this.add.text(bx, infoY + 62, '-', {
            font: '13px Arial',
            color: '#666666'
          }).setOrigin(0.5);
        }
      });

      infoY += 100;

      if (comboRewardResult.starThresholdAdjustment < 0) {
        const threshBg = this.add.graphics();
        threshBg.fillStyle(0x1a2a4a, 0.8);
        threshBg.fillRoundedRect(150, infoY, 450, 24, 6);
        this.add.text(375, infoY + 12, `⚡ 连贯操作降低星级门槛 ${comboRewardResult.starThresholdAdjustment} 分`, {
          font: 'bold 12px Arial',
          color: '#ffd700'
        }).setOrigin(0.5);
        infoY += 32;
      }
    }

    if (progress && (progress.previousBestTime > 0 || progress.previousBestScore > 0)) {
      this.add.text(375, infoY, '📊 历史最佳对比', {
        font: 'bold 16px Arial',
        color: '#ce93d8'
      }).setOrigin(0.5);
      infoY += 22;

      const histBg = this.add.graphics();
      histBg.fillStyle(0x2a1a4a, 0.9);
      histBg.fillRoundedRect(130, infoY, 490, 60, 12);
      histBg.lineStyle(1, 0x9c27b0, 0.3);
      histBg.strokeRoundedRect(130, infoY, 490, 60, 12);

      const histItems = [
        {
          label: '分数',
          current: score.toLocaleString(),
          best: progress.previousBestScore > 0 ? progress.previousBestScore.toLocaleString() : '首通',
          currentColor: '#ffd700',
          isBetter: progress.isNewRecord
        },
        {
          label: '用时',
          current: formatTime(time),
          best: progress.previousBestTime > 0 ? formatTime(progress.previousBestTime) : '首通',
          currentColor: '#2196f3',
          isBetter: progress.isNewBestTime
        },
        {
          label: '星级',
          current: '★'.repeat(stars) + '☆'.repeat(3 - stars),
          best: '★'.repeat(previousStarsForDraw) + '☆'.repeat(3 - previousStarsForDraw),
          currentColor: '#ff9800',
          isBetter: progress.starsImproved
        }
      ];

      histItems.forEach((item, idx) => {
        const hx = 150 + idx * 165;
        this.add.text(hx + 40, infoY + 16, item.label, {
          font: '11px Arial',
          color: '#888888'
        }).setOrigin(0.5);

        this.add.text(hx + 40, infoY + 36, `本次: ${item.current}`, {
          font: item.isBetter ? 'bold 12px Arial' : '12px Arial',
          color: item.isBetter ? '#4caf50' : item.currentColor
        }).setOrigin(0.5);

        const arrow = item.isBetter ? ' ↓' : '';
        this.add.text(hx + 40, infoY + 52, `最佳: ${item.best}${arrow}`, {
          font: '11px Arial',
          color: '#aaaaaa'
        }).setOrigin(0.5);
      });

      infoY += 75;
    }

    let dropBannerY = infoY + 5;

    if (conservationMultiplier && (conservationMultiplier.scoreMultiplier < 1 || conservationMultiplier.fragmentMultiplier < 1 || conservationMultiplier.researchMultiplier < 1)) {
      const warnBg = this.add.graphics();
      const healthLevel = chapterResult?.conservationInfo?.healthLevel;
      const labelMap: Record<string, { label: string; color: string; bgColor: number }> = {
        thriving: { label: '🌿 养护极佳', color: '#4caf50', bgColor: 0x1b5e20 },
        healthy: { label: '✅ 养护良好', color: '#2196f3', bgColor: 0x0f3460 },
        fair: { label: '⚡ 养护尚可', color: '#ffc107', bgColor: 0x4a3800 },
        declining: { label: '⚠️ 养护不足', color: '#ff9800', bgColor: 0x663300 },
        critical: { label: '🚨 濒危警告', color: '#ff1744', bgColor: 0x550000 }
      };
      const info = healthLevel ? labelMap[healthLevel] : labelMap.fair;
      warnBg.fillStyle(info.bgColor, 0.9);
      warnBg.fillRoundedRect(130, dropBannerY, 490, 58, 12);
      warnBg.lineStyle(2, info.bgColor, 1);
      warnBg.strokeRoundedRect(130, dropBannerY, 490, 58, 12);

      this.add.text(150, dropBannerY + 18, info.label, {
        font: 'bold 15px Arial',
        color: info.color
      }).setOrigin(0, 0.5);

      this.add.text(150, dropBannerY + 42, `奖励倍率: 积分×${conservationMultiplier.scoreMultiplier.toFixed(1)} 碎片×${conservationMultiplier.fragmentMultiplier.toFixed(1)} 研究×${conservationMultiplier.researchMultiplier.toFixed(1)}`, {
        font: '12px Arial',
        color: conservationMultiplier.scoreMultiplier < 0.7 ? '#ff1744' : '#ffc107'
      }).setOrigin(0, 0.5);

      this.add.text(600, dropBannerY + 30, '前往养护→', {
        font: 'bold 12px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);

      warnBg.setInteractive(new Phaser.Geom.Rectangle(130, dropBannerY, 490, 58), Phaser.Geom.Rectangle.Contains);
      warnBg.on('pointerup', () => {
        overlay.destroy();
        this.scene.start('ConservationScene');
      });

      dropBannerY += 68;
    }
    if (drops && (drops.fragments.length > 0 || drops.materials.length > 0)) {
      const dropBg = this.add.graphics();
      dropBg.fillStyle(0x1a2a4a, 0.9);
      dropBg.fillRoundedRect(130, dropBannerY, 490, 28 + (drops.fragments.length + drops.materials.length) * 22, 12);
      dropBg.lineStyle(2, 0xff9800, 0.5);
      dropBg.strokeRoundedRect(130, dropBannerY, 490, 28 + (drops.fragments.length + drops.materials.length) * 22, 12);

      this.add.text(375, dropBannerY + 14, '🧩 获得碎片与材料', {
        font: 'bold 14px Arial',
        color: '#ff9800'
      }).setOrigin(0.5);

      let itemY = dropBannerY + 34;
      drops.fragments.forEach(drop => {
        const frag = Fragments.find(f => f.id === drop.id);
        if (frag) {
          this.add.text(165, itemY, `🧩 ${frag.name} ×${drop.count}`, {
            font: '13px Arial',
            color: '#4caf50'
          }).setOrigin(0, 0.5);
          itemY += 22;
        }
      });
      drops.materials.forEach(drop => {
        const mat = Materials.find(m => m.id === drop.id);
        if (mat) {
          this.add.text(165, itemY, `${mat.icon} ${mat.name} ×${drop.count}`, {
            font: '13px Arial',
            color: '#2196f3'
          }).setOrigin(0, 0.5);
          itemY += 22;
        }
      });

      dropBannerY = dropBannerY + 28 + (drops.fragments.length + drops.materials.length) * 22 + 10;
    }

    if (randomEventStats && randomEventStats.eventsEncountered.length > 0) {
      const eventBg = this.add.graphics();
      const eventCount = randomEventStats.eventsEncountered.length;
      const height = 50 + eventCount * 24;
      eventBg.fillStyle(0x2a1a4a, 0.9);
      eventBg.fillRoundedRect(130, dropBannerY, 490, height, 12);
      eventBg.lineStyle(2, 0x9c27b0, 0.5);
      eventBg.strokeRoundedRect(130, dropBannerY, 490, height, 12);

      this.add.text(375, dropBannerY + 22, `🎲 本局随机事件 (${eventCount}个)`, {
        font: 'bold 15px Arial',
        color: '#ce93d8'
      }).setOrigin(0.5);

      let eventY = dropBannerY + 42;
      randomEventStats.eventsEncountered.forEach(eventId => {
        const eventData = getRandomEventById(eventId);
        if (eventData) {
          const color = eventData.direction === 'positive' ? '#4caf50' : '#f44336';
          const icon = eventData.direction === 'positive' ? '↑' : '↓';
          this.add.text(160, eventY, `${eventData.icon} ${eventData.name}`, {
            font: '13px Arial',
            color: color
          }).setOrigin(0, 0.5);
          this.add.text(590, eventY, `${icon} ${eventData.rarity}`, {
            font: '12px Arial',
            color: '#aaaaaa'
          }).setOrigin(1, 0.5);
          eventY += 24;
        }
      });

      if (randomEventStats.totalTimeLost > 0 || randomEventStats.damagedPieces > 0 || randomEventStats.totalScoreModifier !== 0) {
        const summaryY = eventY + 5;
        this.add.text(375, summaryY,
          `损失时间: ${randomEventStats.totalTimeLost}s  ·  损坏碎片: ${randomEventStats.damagedPieces}片`,
          {
            font: '12px Arial',
            color: '#ff9800'
          }
        ).setOrigin(0.5);
      }

      dropBannerY += height + 10;
    }

    let bannerY = dropBannerY;

    if (this.isEventLevel && eventResult) {
      if (this.eventId) {
        const eventScoreBanner = this.add.graphics();
        eventScoreBanner.fillStyle(0x9c27b0, 1);
        eventScoreBanner.fillRoundedRect(140, bannerY, 470, 45, 12);
        this.add.text(375, bannerY + 22, `🏆 活动总积分: ${eventResult.updatedTotalScore.toLocaleString()}`, {
          font: 'bold 18px Arial',
          color: '#ffffff'
        }).setOrigin(0.5);
        bannerY += 55;
      }

      if (eventResult.newlyUnlockedLevelId) {
        const unlockBanner = this.add.graphics();
        unlockBanner.fillStyle(0x4caf50, 1);
        unlockBanner.fillRoundedRect(140, bannerY, 470, 45, 12);
        this.add.text(375, bannerY + 22, '🔓 下一活动关卡已解锁！', {
          font: 'bold 18px Arial',
          color: '#ffffff'
        }).setOrigin(0.5);
        bannerY += 55;
      }

      const claimableRewards = SaveManager.getClaimableEventRewards(this.eventId!);
      if (claimableRewards.length > 0) {
        const rewardBanner = this.add.graphics();
        rewardBanner.fillStyle(0xffd700, 1);
        rewardBanner.fillRoundedRect(140, bannerY, 470, 45, 12);
        rewardBanner.setInteractive(
          new Phaser.Geom.Rectangle(140, bannerY, 470, 45),
          Phaser.Geom.Rectangle.Contains
        );
        this.add.text(375, bannerY + 22, `🎁 有${claimableRewards.length}个活动奖励可领取！`, {
          font: 'bold 18px Arial',
          color: '#1a1a2e'
        }).setOrigin(0.5);

        rewardBanner.on('pointerup', () => {
          this.scene.start('EventScene');
        });
        bannerY += 55;
      }
    }

    if (!this.isEventLevel && chapterResult?.chapterCompleted && chapterResult.completedChapterId) {
      const chapterBadge = this.add.graphics();
      chapterBadge.fillStyle(0xff9800, 1);
      chapterBadge.fillRoundedRect(180, bannerY, 390, 45, 12);

      this.add.text(375, bannerY + 22, '🎊 章节完成！点击查看章节奖励', {
        font: 'bold 18px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);

      chapterBadge.setInteractive(
        new Phaser.Geom.Rectangle(180, bannerY, 390, 45),
        Phaser.Geom.Rectangle.Contains
      );

      chapterBadge.on('pointerup', () => {
        this.scene.start('ChapterCompleteScene', { chapterId: chapterResult.completedChapterId });
      });

      bannerY += 55;
    }

    if (!this.isEventLevel && chapterResult?.newlyUnlockedChapterId) {
      const unlockBanner = this.add.graphics();
      unlockBanner.fillStyle(0x9c27b0, 1);
      unlockBanner.fillRoundedRect(140, bannerY, 470, 45, 12);

      this.add.text(375, bannerY + 22, '🔓 新章节已解锁！', {
        font: 'bold 18px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);
      bannerY += 55;
    }

    if (!this.isEventLevel && updatedQuests.length > 0) {
      const completedCount = updatedQuests.filter(q => q.status === 'completed').length;
      if (completedCount > 0) {
        const questBanner = this.add.graphics();
        questBanner.fillStyle(0x03a9f4, 1);
        questBanner.fillRoundedRect(140, bannerY, 470, 45, 12);
        questBanner.setInteractive(
          new Phaser.Geom.Rectangle(140, bannerY, 470, 45),
          Phaser.Geom.Rectangle.Contains
        );
        this.add.text(375, bannerY + 22, `📋 有${completedCount}个每日委托可领取！`, {
          font: 'bold 18px Arial',
          color: '#ffffff'
        }).setOrigin(0.5);
        questBanner.on('pointerup', () => {
          this.scene.start('DailyQuestScene');
        });
        bannerY += 55;
      } else {
        const questBanner = this.add.graphics();
        questBanner.fillStyle(0x03a9f4, 0.8);
        questBanner.fillRoundedRect(140, bannerY, 470, 45, 12);
        this.add.text(375, bannerY + 22, `📋 每日委托进度已更新`, {
          font: 'bold 18px Arial',
          color: '#ffffff'
        }).setOrigin(0.5);
        bannerY += 55;
      }
    }

    if (achievementResult.newlyUnlocked.length > 0) {
      const achievementBanner = this.add.graphics();
      achievementBanner.fillStyle(0xffd700, 1);
      achievementBanner.fillRoundedRect(140, bannerY, 470, 45, 12);
      achievementBanner.setInteractive(
        new Phaser.Geom.Rectangle(140, bannerY, 470, 45),
        Phaser.Geom.Rectangle.Contains
      );
      this.add.text(375, bannerY + 22, `🏆 解锁${achievementResult.newlyUnlocked.length}个新成就！`, {
        font: 'bold 18px Arial',
        color: '#1a1a2e'
      }).setOrigin(0.5);
      achievementBanner.on('pointerup', () => {
        this.scene.start('AchievementScene');
      });
      bannerY += 55;

      if (achievementResult.scoreGained > 0) {
        const scoreBanner = this.add.graphics();
        scoreBanner.fillStyle(0xff9800, 0.9);
        scoreBanner.fillRoundedRect(180, bannerY, 390, 35, 10);
        this.add.text(375, bannerY + 17, `💰 成就积分 +${achievementResult.scoreGained.toLocaleString()}`, {
          font: 'bold 15px Arial',
          color: '#ffffff'
        }).setOrigin(0.5);
        bannerY += 45;
      }
    }

    if (achievementResult.newlyUnlockedTitles.length > 0) {
      const titleBanner = this.add.graphics();
      titleBanner.fillStyle(0x9c27b0, 1);
      titleBanner.fillRoundedRect(140, bannerY, 470, 45, 12);
      titleBanner.setInteractive(
        new Phaser.Geom.Rectangle(140, bannerY, 470, 45),
        Phaser.Geom.Rectangle.Contains
      );
      this.add.text(375, bannerY + 22, `👑 获得新称号：${achievementResult.newlyUnlockedTitles[0].name}`, {
        font: 'bold 18px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);
      titleBanner.on('pointerup', () => {
        this.scene.start('AchievementScene');
      });
      bannerY += 55;
    }

    this.createResultButtons(overlay, true, chapterResult, eventResult, updatedQuests, replayData);
  }

  private showGameOver(score: number, snapped: number, total: number, failType?: string): void {
    let title = '⏰ 时间到';
    let titleColor = '#f44336';
    let borderColor = 0xf44336;
    let emoji = '😢';
    let subtitle = '';

    if (this.isTowerFloor && failType === 'mistake_limit') {
      title = '💔 挑战失败';
      titleColor = '#9c27b0';
      borderColor = 0x9c27b0;
      emoji = '😵';
      subtitle = '失误次数已达上限';
    } else if (this.isTowerFloor && failType === 'time_up') {
      title = '⏰ 时间耗尽';
      subtitle = '挑战塔时间到';
    }

    const { overlay } = this.createModal(title, titleColor, borderColor);

    this.add.text(375, 480, emoji, {
      font: '60px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    if (subtitle) {
      this.add.text(375, 530, subtitle, {
        font: '18px Arial',
        color: '#ff9800'
      }).setOrigin(0.5);
    }

    const scoreBg = this.add.graphics();
    scoreBg.fillStyle(0x0f3460, 0.6);
    const scoreBgY = subtitle ? 570 : 560;
    scoreBg.fillRoundedRect(130, scoreBgY, 490, this.isTowerFloor ? 180 : 160, 16);

    this.add.text(375, scoreBgY + 30, `获得分数`, {
      font: '20px Arial',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    this.add.text(375, scoreBgY + 75, score.toLocaleString(), {
      font: 'bold 44px Arial',
      color: '#ff9800'
    }).setOrigin(0.5);

    this.add.text(375, scoreBgY + 115, `已修复 ${snapped}/${this.realPiecesCount || total} 片`, {
      font: '18px Arial',
      color: '#eaeaea'
    }).setOrigin(0.5);

    if (this.isTowerFloor) {
      this.add.text(375, scoreBgY + 145, `连击: ${this.maxCombo}  |  失误: ${this.mistakeCount}  |  完美: ${this.perfectSnaps}`, {
        font: '14px Arial',
        color: '#aaaaaa'
      }).setOrigin(0.5);
    }

    this.createResultButtons(overlay, false);
  }

  private showTowerVictory(
    result: TowerResultData,
    completeResult: { unlockedNextFloor: boolean; newHighestFloor: number; achievementResult: AchievementUnlockResult }
  ): void {
    const { overlay } = this.createModal('🏆 挑战成功！', '#ffd700', 0xffd700);

    let newRecordBadgeY = 458;
    const hasNewRecord = result.isNewRecord || result.isNewBestTime || result.starsImproved;
    if (hasNewRecord) {
      const recordBg = this.add.graphics();
      recordBg.fillStyle(0xff9800, 1);
      recordBg.fillRoundedRect(240, newRecordBadgeY - 18, 270, 34, 10);

      const badgeTexts: string[] = [];
      if (result.starsImproved) badgeTexts.push('⭐ 星级提升！');
      if (result.isNewRecord) badgeTexts.push('🏆 新纪录！');
      if (result.isNewBestTime && !result.isNewRecord) badgeTexts.push('⏱️ 最快速度！');

      this.add.text(375, newRecordBadgeY, badgeTexts.join('  '), {
        font: 'bold 16px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);

      this.tweens.add({
        targets: recordBg,
        scaleX: { from: 0, to: 1 },
        scaleY: { from: 0, to: 1 },
        duration: 400,
        ease: 'Back.easeOut'
      });
    }

    const starsContainer = this.add.container(375, hasNewRecord ? 515 : 485);
    const starSize = 50;
    const starSpacing = 15;
    const starStartX = -starSize - starSpacing;

    for (let i = 0; i < 3; i++) {
      const starX = starStartX + i * (starSize + starSpacing);
      const isFilled = i < result.stars;
      const wasFilled = i < result.previousStars;

      const tex = isFilled ? 'star-filled' : 'star-empty';
      const starImg = this.add.image(starX, 0, tex).setDisplaySize(starSize, starSize);
      starImg.setScale(0);
      starsContainer.add(starImg);

      const isNewlyUpgraded = result.starsImproved && !wasFilled && isFilled;
      if (isNewlyUpgraded) {
        const glow = this.add.graphics();
        glow.fillStyle(0xffd700, 0);
        glow.fillCircle(starX, 0, starSize * 0.8);
        starsContainer.add(glow);

        this.tweens.add({
          targets: starImg,
          scale: { from: 0, to: 1.3 },
          delay: 600 + i * 200,
          duration: 350,
          ease: 'Back.easeOut',
          yoyo: true,
          onYoyo: () => {
            this.tweens.add({
              targets: starImg,
              scale: 1,
              duration: 200,
              ease: 'Cubic.easeOut'
            });
          }
        });

        this.tweens.add({
          targets: glow,
          alpha: { from: 0, to: 0.8 },
          scale: { from: 0.3, to: 1.5 },
          delay: 600 + i * 200,
          duration: 500,
          ease: 'Cubic.easeOut',
          yoyo: true,
          onYoyo: () => glow.destroy()
        });
      } else {
        this.tweens.add({
          targets: starImg,
          scale: 1,
          delay: i * 150,
          duration: 300,
          ease: 'Back.easeOut'
        });
      }
    }

    let contentStartY = hasNewRecord ? 595 : 565;

    const scoreBg = this.add.graphics();
    scoreBg.fillStyle(0x0f3460, 0.6);
    scoreBg.fillRoundedRect(130, contentStartY, 490, 120, 16);

    this.add.text(375, contentStartY + 28, `最终得分`, {
      font: '18px Arial',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    this.add.text(375, contentStartY + 72, result.score.toLocaleString(), {
      font: 'bold 38px Arial',
      color: '#ffd700'
    }).setOrigin(0.5);

    if (result.isNewRecord && result.previousBestScore > 0) {
      const diff = result.score - result.previousBestScore;
      if (diff > 0) {
        this.add.text(375, contentStartY + 102,
          `↑ 超越历史最佳 +${diff.toLocaleString()} 分`,
          {
            font: 'bold 13px Arial',
            color: '#4caf50'
          }
        ).setOrigin(0.5);
      }
    } else if (result.previousBestScore > 0 && !result.isNewRecord) {
      const diff = result.previousBestScore - result.score;
      this.add.text(375, contentStartY + 102,
        `距离最高分还差 ${diff.toLocaleString()} 分`,
        {
          font: '12px Arial',
          color: '#ff9800'
        }
      ).setOrigin(0.5);
    }

    let infoY = contentStartY + 140;

    const timeParts = this.calculateTimeBreakdown(
      result.snapTimestamps || [],
      result.time,
      result.realPiecesCount || this.pieces.length
    );

    this.add.text(375, infoY, '⏱️ 用时分解', {
      font: 'bold 16px Arial',
      color: '#2196f3'
    }).setOrigin(0.5);
    infoY += 22;

    const breakdownBg = this.add.graphics();
    breakdownBg.fillStyle(0x1a2a4a, 0.9);
    breakdownBg.fillRoundedRect(130, infoY, 490, 80, 12);
    breakdownBg.lineStyle(1, 0x2196f3, 0.3);
    breakdownBg.strokeRoundedRect(130, infoY, 490, 80, 12);

    const breakdownItems = [
      { label: '首片吸附', value: formatTime(timeParts.firstPiece), icon: '🌱' },
      { label: '前半段', value: formatTime(timeParts.firstHalf), icon: '📖' },
      { label: '后半段', value: formatTime(timeParts.secondHalf), icon: '💪' },
      { label: '总用时', value: formatTime(result.time), icon: '🏁', highlight: true }
    ];

    breakdownItems.forEach((item, idx) => {
      const bx = 155 + idx * 120;
      this.add.text(bx, infoY + 22, item.icon, {
        font: '20px Arial'
      }).setOrigin(0.5);
      this.add.text(bx, infoY + 45, item.label, {
        font: '11px Arial',
        color: '#888888'
      }).setOrigin(0.5);
      this.add.text(bx, infoY + 64, item.value, {
        font: item.highlight ? 'bold 14px Arial' : '13px Arial',
        color: item.highlight ? '#ffd700' : '#eaeaea'
      }).setOrigin(0.5);
    });

    infoY += 95;

    const accuracyPercent = Math.max(0, Math.min(100, result.accuracy));
    const perfectRate = result.snapCount > 0 ? Math.round((result.perfectSnaps / result.snapCount) * 100) : 0;
    const avgDist = result.snapCount > 0 ? (result.totalSnapDistance / result.snapCount).toFixed(1) : '0';

    this.add.text(375, infoY, '🎯 精准吸附统计', {
      font: 'bold 16px Arial',
      color: '#4caf50'
    }).setOrigin(0.5);
    infoY += 22;

    const snapBg = this.add.graphics();
    snapBg.fillStyle(0x1a2a1a, 0.9);
    snapBg.fillRoundedRect(130, infoY, 490, 85, 12);
    snapBg.lineStyle(1, 0x4caf50, 0.3);
    snapBg.strokeRoundedRect(130, infoY, 490, 85, 12);

    const snapItems = [
      { label: '精准度', value: `${accuracyPercent}%`, color: accuracyPercent >= 80 ? '#4caf50' : accuracyPercent >= 50 ? '#ff9800' : '#f44336' },
      { label: '完美吸附', value: `${result.perfectSnaps}/${result.snapCount}`, subValue: `${perfectRate}%`, color: '#9c27b0' },
      { label: '平均偏差', value: `${avgDist}px`, color: '#2196f3' },
      { label: '旋转次数', value: `${result.rotationAdjustCount}`, color: '#ffc107' }
    ];

    snapItems.forEach((item, idx) => {
      const bx = 155 + idx * 120;
      this.add.text(bx, infoY + 25, item.label, {
        font: '11px Arial',
        color: '#888888'
      }).setOrigin(0.5);
      this.add.text(bx, infoY + 46, item.value, {
        font: 'bold 16px Arial',
        color: item.color
      }).setOrigin(0.5);
      if (item.subValue) {
        this.add.text(bx, infoY + 66, item.subValue, {
          font: '11px Arial',
          color: '#aaaaaa'
        }).setOrigin(0.5);
      }
    });

    infoY += 100;

    const barBg = this.add.graphics();
    barBg.fillStyle(0x0a1a2a, 1);
    barBg.fillRoundedRect(150, infoY, 450, 20, 6);
    const barRatio = accuracyPercent / 100;
    const barColor = accuracyPercent >= 80 ? 0x4caf50 : accuracyPercent >= 50 ? 0xff9800 : 0xf44336;
    const barFill = this.add.graphics();
    barFill.fillStyle(barColor, 1);
    barFill.fillRoundedRect(150, infoY, 450 * barRatio, 20, 6);

    const accuracyLabels: { threshold: number; label: string }[] = [
      { threshold: 95, label: '神乎其技！' },
      { threshold: 80, label: '技艺精湛！' },
      { threshold: 60, label: '手法熟练' },
      { threshold: 40, label: '初窥门径' },
      { threshold: 0, label: '继续努力' }
    ];
    const skillLabel = accuracyLabels.find(l => accuracyPercent >= l.threshold)?.label || '';
    this.add.text(375, infoY + 10, `吸附精准度  ${skillLabel}`, {
      font: 'bold 11px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    infoY += 32;

    if (result.previousBestTime > 0 || result.previousBestScore > 0) {
      this.add.text(375, infoY, '📊 历史最佳对比', {
        font: 'bold 16px Arial',
        color: '#ce93d8'
      }).setOrigin(0.5);
      infoY += 22;

      const histBg = this.add.graphics();
      histBg.fillStyle(0x2a1a4a, 0.9);
      histBg.fillRoundedRect(130, infoY, 490, 60, 12);
      histBg.lineStyle(1, 0x9c27b0, 0.3);
      histBg.strokeRoundedRect(130, infoY, 490, 60, 12);

      const histItems = [
        {
          label: '分数',
          current: result.score.toLocaleString(),
          best: result.previousBestScore > 0 ? result.previousBestScore.toLocaleString() : '首通',
          currentColor: '#ffd700',
          isBetter: result.isNewRecord
        },
        {
          label: '用时',
          current: formatTime(result.time),
          best: result.previousBestTime > 0 ? formatTime(result.previousBestTime) : '首通',
          currentColor: '#2196f3',
          isBetter: result.isNewBestTime
        },
        {
          label: '星级',
          current: '★'.repeat(result.stars) + '☆'.repeat(3 - result.stars),
          best: '★'.repeat(result.previousStars) + '☆'.repeat(3 - result.previousStars),
          currentColor: '#ff9800',
          isBetter: result.starsImproved
        }
      ];

      histItems.forEach((item, idx) => {
        const hx = 150 + idx * 165;
        this.add.text(hx + 40, infoY + 16, item.label, {
          font: '11px Arial',
          color: '#888888'
        }).setOrigin(0.5);

        this.add.text(hx + 40, infoY + 36, `本次: ${item.current}`, {
          font: item.isBetter ? 'bold 12px Arial' : '12px Arial',
          color: item.isBetter ? '#4caf50' : item.currentColor
        }).setOrigin(0.5);

        const arrow = item.isBetter ? ' ↓' : '';
        this.add.text(hx + 40, infoY + 52, `最佳: ${item.best}${arrow}`, {
          font: '11px Arial',
          color: '#aaaaaa'
        }).setOrigin(0.5);
      });

      infoY += 75;
    }

    infoY += 5;

    this.add.text(375, infoY, '📊 评分详情', {
      font: 'bold 16px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);
    infoY += 22;

    result.scoringBreakdown.forEach(item => {
      const barBg2 = this.add.graphics();
      barBg2.fillStyle(0x0a1a2a, 1);
      barBg2.fillRoundedRect(150, infoY, 450, 18, 4);

      const ratio = item.maxScore > 0 ? item.score / item.maxScore : 0;
      const barColor2 = ratio >= 0.8 ? 0x4caf50 : ratio >= 0.5 ? 0xff9800 : 0xf44336;
      const barFill2 = this.add.graphics();
      barFill2.fillStyle(barColor2, 1);
      barFill2.fillRoundedRect(150, infoY, 450 * ratio, 18, 4);

      this.add.text(155, infoY + 9, item.condition, {
        font: '11px Arial',
        color: '#ffffff'
      }).setOrigin(0, 0.5);

      this.add.text(595, infoY + 9, `${item.score}/${item.maxScore}`, {
        font: 'bold 11px Arial',
        color: '#ffffff'
      }).setOrigin(1, 0.5);

      infoY += 22;
    });

    let bannerY = infoY + 10;

    if (completeResult.unlockedNextFloor) {
      const unlockBanner = this.add.graphics();
      unlockBanner.fillStyle(0x4caf50, 1);
      unlockBanner.fillRoundedRect(140, bannerY, 470, 40, 10);
      this.add.text(375, bannerY + 20, '🔓 下一层已解锁！', {
        font: 'bold 16px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);
      bannerY += 50;
    }

    const canClaim = SaveManager.canClaimTowerRewards(result.floorId);
    if (canClaim) {
      const rewardBanner = this.add.graphics();
      rewardBanner.fillStyle(0xffd700, 1);
      rewardBanner.fillRoundedRect(140, bannerY, 470, 40, 10);
      rewardBanner.setInteractive(
        new Phaser.Geom.Rectangle(140, bannerY, 470, 40),
        Phaser.Geom.Rectangle.Contains
      );
      this.add.text(375, bannerY + 20, '🎁 有奖励可领取！', {
        font: 'bold 16px Arial',
        color: '#1a1a2e'
      }).setOrigin(0.5);
      rewardBanner.on('pointerup', () => {
        this.scene.start('TowerResultScene', { floorId: result.floorId, result });
      });
      bannerY += 50;
    }

    if (completeResult.achievementResult.newlyUnlocked.length > 0) {
      const achievementBanner = this.add.graphics();
      achievementBanner.fillStyle(0xffd700, 1);
      achievementBanner.fillRoundedRect(140, bannerY, 470, 45, 12);
      achievementBanner.setInteractive(
        new Phaser.Geom.Rectangle(140, bannerY, 470, 45),
        Phaser.Geom.Rectangle.Contains
      );
      this.add.text(375, bannerY + 22, `🏆 解锁${completeResult.achievementResult.newlyUnlocked.length}个新成就！`, {
        font: 'bold 18px Arial',
        color: '#1a1a2e'
      }).setOrigin(0.5);
      achievementBanner.on('pointerup', () => {
        this.scene.start('AchievementScene');
      });
      bannerY += 55;

      if (completeResult.achievementResult.scoreGained > 0) {
        const scoreBanner = this.add.graphics();
        scoreBanner.fillStyle(0xff9800, 0.9);
        scoreBanner.fillRoundedRect(180, bannerY, 390, 35, 10);
        this.add.text(375, bannerY + 17, `💰 成就积分 +${completeResult.achievementResult.scoreGained.toLocaleString()}`, {
          font: 'bold 15px Arial',
          color: '#ffffff'
        }).setOrigin(0.5);
        bannerY += 45;
      }
    }

    if (completeResult.achievementResult.newlyUnlockedTitles.length > 0) {
      const titleBanner = this.add.graphics();
      titleBanner.fillStyle(0x9c27b0, 1);
      titleBanner.fillRoundedRect(140, bannerY, 470, 45, 12);
      titleBanner.setInteractive(
        new Phaser.Geom.Rectangle(140, bannerY, 470, 45),
        Phaser.Geom.Rectangle.Contains
      );
      this.add.text(375, bannerY + 22, `👑 获得新称号：${completeResult.achievementResult.newlyUnlockedTitles[0].name}`, {
        font: 'bold 18px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);
      titleBanner.on('pointerup', () => {
        this.scene.start('AchievementScene');
      });
      bannerY += 55;
    }

    this.createTowerResultButtons(overlay, completeResult);
  }

  private createTowerResultButtons(
    overlay: Phaser.GameObjects.Graphics,
    completeResult: { unlockedNextFloor: boolean; newHighestFloor: number }
  ): void {
    const btnW = 230;
    const btnH = 68;
    const btnY = 1120;

    const continueBtn = this.add.graphics();
    continueBtn.fillStyle(0x4caf50, 1);
    continueBtn.fillRoundedRect(135, btnY, btnW, btnH, 16);
    continueBtn.setInteractive(
      new Phaser.Geom.Rectangle(135, btnY, btnW, btnH),
      Phaser.Geom.Rectangle.Contains
    );

    this.add.text(135 + btnW / 2, btnY + btnH / 2, '领取奖励', {
      font: 'bold 20px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    continueBtn.on('pointerup', () => {
      if (this.towerFloorId) {
        this.scene.start('TowerResultScene', { floorId: this.towerFloorId });
      }
    });

    const backBtn = this.add.graphics();
    backBtn.fillStyle(0xe94560, 1);
    backBtn.fillRoundedRect(385, btnY, btnW, btnH, 16);
    backBtn.setInteractive(
      new Phaser.Geom.Rectangle(385, btnY, btnW, btnH),
      Phaser.Geom.Rectangle.Contains
    );

    this.add.text(385 + btnW / 2, btnY + btnH / 2, '返回塔层', {
      font: 'bold 20px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    backBtn.on('pointerup', () => {
      this.scene.start('TowerSelectScene');
    });
  }

  private createResultButtons(
    overlay: Phaser.GameObjects.Graphics,
    isVictory: boolean,
    chapterResult?: { chapterCompleted: boolean; completedChapterId: number | null; newlyUnlockedChapterId: number | null; updatedQuests: DailyQuest[] },
    eventResult?: { newlyUnlockedLevelId: number | null; updatedTotalScore: number },
    updatedQuests: DailyQuest[] = [],
    replayData?: ReplayData
  ): void {
    const btnW = 230;
    const btnH = 68;
    let hasBanner = false;
    if (this.isEventLevel) {
      hasBanner = !!eventResult;
    } else {
      hasBanner = !!(chapterResult?.chapterCompleted || chapterResult?.newlyUnlockedChapterId || updatedQuests.length > 0);
    }
    let btnY = hasBanner ? 865 : 780;

    if (!this.isEventLevel && chapterResult?.chapterCompleted && chapterResult.completedChapterId) {
      const chapterBtn = this.add.graphics();
      chapterBtn.fillStyle(0xff9800, 1);
      chapterBtn.fillRoundedRect(135, btnY - 70, 480, 58, 14);
      chapterBtn.setInteractive(
        new Phaser.Geom.Rectangle(135, btnY - 70, 480, 58),
        Phaser.Geom.Rectangle.Contains
      );

      this.add.text(135 + 240, btnY - 41, '🎁 查看章节奖励', {
        font: 'bold 20px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);

      chapterBtn.on('pointerup', () => {
        this.scene.start('ChapterCompleteScene', { chapterId: chapterResult.completedChapterId });
      });
    }

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
      this.scene.restart({
        levelId: this.levelRule.id,
        isEventLevel: this.isEventLevel,
        eventId: this.eventId
      });
    });

    const backBtn = this.add.graphics();
    backBtn.fillStyle(0xe94560, 1);
    backBtn.fillRoundedRect(385, btnY, btnW, btnH, 16);
    backBtn.setInteractive(
      new Phaser.Geom.Rectangle(385, btnY, btnW, btnH),
      Phaser.Geom.Rectangle.Contains
    );

    const backLabel = this.isEventLevel ? '返回活动' : '返回关卡';
    this.add.text(385 + btnW / 2, btnY + btnH / 2, backLabel, {
      font: 'bold 22px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    backBtn.on('pointerup', () => {
      if (this.isEventLevel && this.eventId) {
        this.scene.start('EventLevelSelectScene', { eventId: this.eventId });
      } else {
        this.scene.start('LevelSelectScene');
      }
    });

    if (replayData && isVictory) {
      const replayBtnY = btnY + btnH + 16;
      const replayBtn = this.add.graphics();
      replayBtn.fillStyle(0x9c27b0, 1);
      replayBtn.fillRoundedRect(135, replayBtnY, 480, 56, 16);
      replayBtn.setInteractive(
        new Phaser.Geom.Rectangle(135, replayBtnY, 480, 56),
        Phaser.Geom.Rectangle.Contains
      );

      this.add.text(135 + 240, replayBtnY + 28, '📹 查看复盘', {
        font: 'bold 20px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);

      replayBtn.on('pointerup', () => {
        this.scene.start('ReplayScene', { replayData });
      });
    }
  }

  private pauseGameState(): void {
    if (this.isPaused || this.isCompleted) return;
    this.isPaused = true;

    if (this.timerEvent) this.timerEvent.paused = true;
    if (this.speedSampleTimer) this.speedSampleTimer.paused = true;

    if (this.fullPreviewActive) {
      this.stopFullPreview();
    }

    if (this.targetTween) {
      this.targetTween.pause();
    }

    if (this.autoSaveTimer) {
      this.autoSaveTimer.paused = true;
    }

    this.pieces.forEach(piece => piece.pauseAllHints());
  }

  private resumeGameState(): void {
    if (!this.isPaused || this.isCompleted) return;
    this.isPaused = false;

    this.startTime = this.time.now - this.elapsedTime * 1000;

    if (this.timerEvent) this.timerEvent.paused = false;
    if (this.speedSampleTimer) this.speedSampleTimer.paused = false;

    if (this.targetTween && this.hasTowerRule('moving_target')) {
      this.targetTween.resume();
    }

    if (this.autoSaveTimer) {
      this.autoSaveTimer.paused = false;
    }

    this.pieces.forEach(piece => piece.resumeAllHints());
  }

  private cleanupGameStateForExit(): void {
    this.isCompleted = true;
    this.isPaused = false;

    if (this.fullPreviewActive) {
      this.stopFullPreview();
    }

    this.pieces.forEach(piece => piece.clearAllHints());

    if (this.targetTween) {
      this.targetTween.stop();
    }

    if (this.autoSaveTimer) {
      this.autoSaveTimer.remove(false);
      this.autoSaveTimer = null;
    }

    if (this.timerEvent) {
      this.timerEvent.remove(false);
    }
    if (this.speedSampleTimer) {
      this.speedSampleTimer.remove(false);
    }

    if (this.randomEventsEnabled && !this.isTowerFloor && !this.isEventLevel) {
      RandomEventManager.endSession();
    }
  }

  private navigateToPreviousScene(): void {
    if (this.isTowerFloor) {
      this.scene.start('TowerSelectScene');
    } else if (this.isEventLevel && this.eventId) {
      this.scene.start('EventLevelSelectScene', { eventId: this.eventId });
    } else {
      this.scene.start('LevelSelectScene');
    }
  }

  private showObjectiveModal(parentOverlay: Phaser.GameObjects.Graphics, cleanupCallback: () => void): void {
    const modalObjects: Phaser.GameObjects.GameObject[] = [];
    const track = <T extends Phaser.GameObjects.GameObject>(obj: T, depth: number): T => {
      (obj as any).setDepth(depth);
      modalObjects.push(obj);
      return obj;
    };

    const objOverlay = track(this.add.graphics(), 1000);
    objOverlay.fillStyle(0x000000, 0.6);
    objOverlay.fillRect(0, 0, 750, 1334);
    objOverlay.setInteractive();

    const objModal = track(this.add.graphics(), 1001);
    objModal.fillStyle(0x16213e, 1);
    objModal.fillRoundedRect(70, 280, 610, 780, 24);
    objModal.lineStyle(3, 0x00bcd4, 1);
    objModal.strokeRoundedRect(70, 280, 610, 780, 24);

    track(this.add.text(375, 330, '🎯 关卡目标', {
      font: 'bold 32px Arial',
      color: '#00bcd4'
    }).setOrigin(0.5), 1002);

    let contentY = 385;

    const targetImg = track(this.add.image(375, contentY + 80, this.targetTextureKey), 1002);
    targetImg.setDisplaySize(280, 220);
    targetImg.setAlpha(0.9);

    const imgFrame = track(this.add.graphics(), 1001);
    imgFrame.lineStyle(3, 0x00bcd4, 0.6);
    imgFrame.strokeRoundedRect(235, contentY - 5, 280, 220, 12);

    contentY += 240;

    const nameBg = track(this.add.graphics(), 1001);
    nameBg.fillStyle(0x0f3460, 0.8);
    nameBg.fillRoundedRect(100, contentY, 550, 58, 12);

    track(this.add.text(375, contentY + 18, `🌿 ${this.specimen.name}`, {
      font: 'bold 22px Arial',
      color: '#ffffff'
    }).setOrigin(0.5), 1002);

    track(this.add.text(375, contentY + 42, `${this.specimen.family} · ${this.specimen.genus}`, {
      font: '13px Arial',
      color: '#888888'
    }).setOrigin(0.5), 1002);

    contentY += 78;

    const descBg = track(this.add.graphics(), 1001);
    descBg.fillStyle(0x1a2a4a, 0.9);
    descBg.fillRoundedRect(100, contentY, 550, 90, 12);
    descBg.lineStyle(1, 0x00bcd4, 0.2);
    descBg.strokeRoundedRect(100, contentY, 550, 90, 12);

    track(this.add.text(375, contentY + 18, '📖 标本简介', {
      font: 'bold 15px Arial',
      color: '#00bcd4'
    }).setOrigin(0.5), 1002);

    track(this.add.text(375, contentY + 50, this.specimen.description, {
      font: '13px Arial',
      color: '#cccccc',
      wordWrap: { width: 510, useAdvancedWrap: true },
      align: 'center'
    }).setOrigin(0.5, 0), 1002);

    contentY += 110;

    const goalBg = track(this.add.graphics(), 1001);
    goalBg.fillStyle(0x1a4a2a, 0.9);
    goalBg.fillRoundedRect(100, contentY, 550, 115, 12);
    goalBg.lineStyle(1, 0x4caf50, 0.3);
    goalBg.strokeRoundedRect(100, contentY, 550, 115, 12);

    track(this.add.text(375, contentY + 18, '🏆 修复目标', {
      font: 'bold 15px Arial',
      color: '#4caf50'
    }).setOrigin(0.5), 1002);

    const remaining = Math.max(0, this.levelRule.timeLimit - this.elapsedTime);
    const goalItems = [
      { icon: '🧩', label: '碎片数量', value: `${this.realPiecesCount} 块`, color: '#ffc107' },
      { icon: '⏱️', label: '时间限制', value: formatTime(this.levelRule.timeLimit), color: '#2196f3' },
      { icon: '📊', label: '当前进度', value: `${this.snappedCount}/${this.realPiecesCount} (剩 ${formatTime(remaining)})`, color: '#4caf50' }
    ];

    goalItems.forEach((item) => {
      const gx = 130 + goalItems.indexOf(item) * 170;
      track(this.add.text(gx, contentY + 48, item.icon, {
        font: '18px Arial'
      }).setOrigin(0.5), 1002);
      track(this.add.text(gx, contentY + 68, item.label, {
        font: '11px Arial',
        color: '#888888'
      }).setOrigin(0.5), 1002);
      track(this.add.text(gx, contentY + 88, item.value, {
        font: 'bold 12px Arial',
        color: item.color
      }).setOrigin(0.5), 1002);
    });

    contentY += 135;

    if (this.isTowerFloor && this.towerFloorData && this.towerFloorData.rules.length > 0) {
      const ruleBg = track(this.add.graphics(), 1001);
      ruleBg.fillStyle(0x4a1a4a, 0.9);
      ruleBg.fillRoundedRect(100, contentY, 550, 50 + Math.ceil(this.towerFloorData.rules.length / 2) * 28, 12);
      ruleBg.lineStyle(1, 0x9c27b0, 0.3);
      ruleBg.strokeRoundedRect(100, contentY, 550, 50 + Math.ceil(this.towerFloorData.rules.length / 2) * 28, 12);

      track(this.add.text(375, contentY + 18, '⚔️ 塔楼特殊规则', {
        font: 'bold 15px Arial',
        color: '#ce93d8'
      }).setOrigin(0.5), 1002);

      this.towerFloorData.rules.forEach((rule, idx) => {
        const rx = 130 + (idx % 2) * 260;
        const ry = contentY + 42 + Math.floor(idx / 2) * 28;
        track(this.add.text(rx, ry, `• ${rule.name}: ${rule.description}`, {
          font: '12px Arial',
          color: '#e1bee7',
          wordWrap: { width: 240 }
        }).setOrigin(0, 0.5), 1002);
      });

      contentY += 60 + Math.ceil(this.towerFloorData.rules.length / 2) * 28;
    }

    const closeBtnW = 420;
    const closeBtnH = 56;
    const closeBtnX = (750 - closeBtnW) / 2;
    const closeBtnY = contentY + 10;

    const closeBtn = track(this.add.graphics(), 1001);
    closeBtn.fillStyle(0x00bcd4, 1);
    closeBtn.fillRoundedRect(closeBtnX, closeBtnY, closeBtnW, closeBtnH, 14);
    closeBtn.setInteractive(
      new Phaser.Geom.Rectangle(closeBtnX, closeBtnY, closeBtnW, closeBtnH),
      Phaser.Geom.Rectangle.Contains
    );

    track(this.add.text(closeBtnX + closeBtnW / 2, closeBtnY + closeBtnH / 2, '关闭，返回暂停菜单', {
      font: 'bold 19px Arial',
      color: '#ffffff'
    }).setOrigin(0.5), 1002);

    closeBtn.on('pointerover', () => {
      closeBtn.clear();
      closeBtn.fillStyle(this.lighten(0x00bcd4, 20), 1);
      closeBtn.fillRoundedRect(closeBtnX, closeBtnY, closeBtnW, closeBtnH, 14);
    });

    closeBtn.on('pointerout', () => {
      closeBtn.clear();
      closeBtn.fillStyle(0x00bcd4, 1);
      closeBtn.fillRoundedRect(closeBtnX, closeBtnY, closeBtnW, closeBtnH, 14);
    });

    closeBtn.on('pointerup', () => {
      modalObjects.forEach(obj => {
        if (obj && obj.destroy) obj.destroy();
      });
      cleanupCallback();
    });
  }

  private showAbandonConfirm(parentOverlay: Phaser.GameObjects.Graphics, cleanupCallback: () => void): void {
    const confirmObjects: Phaser.GameObjects.GameObject[] = [];
    const track = <T extends Phaser.GameObjects.GameObject>(obj: T, depth: number): T => {
      (obj as any).setDepth(depth);
      confirmObjects.push(obj);
      return obj;
    };

    const confirmOverlay = track(this.add.graphics(), 1000);
    confirmOverlay.fillStyle(0x000000, 0.7);
    confirmOverlay.fillRect(0, 0, 750, 1334);
    confirmOverlay.setInteractive();

    const confirmModal = track(this.add.graphics(), 1001);
    confirmModal.fillStyle(0x16213e, 1);
    confirmModal.fillRoundedRect(100, 480, 550, 360, 24);
    confirmModal.lineStyle(3, 0xf44336, 1);
    confirmModal.strokeRoundedRect(100, 480, 550, 360, 24);

    track(this.add.text(375, 540, '⚠️ 确认放弃？', {
      font: 'bold 30px Arial',
      color: '#f44336'
    }).setOrigin(0.5), 1002);

    const warnBg = track(this.add.graphics(), 1001);
    warnBg.fillStyle(0x4a1a1a, 0.8);
    warnBg.fillRoundedRect(140, 580, 470, 120, 12);

    const warnItems = [
      '• 本次游戏进度将不会保存',
      '• 已完成的拼图碎片进度将丢失',
      this.isTowerFloor ? '• 塔楼挑战将标记为失败' : '• 关卡不会获得任何奖励'
    ];

    warnItems.forEach((item, idx) => {
      track(this.add.text(375, 610 + idx * 28, item, {
        font: '14px Arial',
        color: '#ffcdd2',
        align: 'center'
      }).setOrigin(0.5), 1002);
    });

    const btnW = 220;
    const btnH = 58;
    const btnY = 740;
    const gap = 30;
    const startX = (750 - btnW * 2 - gap) / 2;

    const cancelBtn = track(this.add.graphics(), 1001);
    cancelBtn.fillStyle(0x757575, 1);
    cancelBtn.fillRoundedRect(startX, btnY, btnW, btnH, 14);
    cancelBtn.setInteractive(
      new Phaser.Geom.Rectangle(startX, btnY, btnW, btnH),
      Phaser.Geom.Rectangle.Contains
    );
    track(this.add.text(startX + btnW / 2, btnY + btnH / 2, '再想想', {
      font: 'bold 20px Arial',
      color: '#ffffff'
    }).setOrigin(0.5), 1002);

    const abandonBtn = track(this.add.graphics(), 1001);
    abandonBtn.fillStyle(0xf44336, 1);
    abandonBtn.fillRoundedRect(startX + btnW + gap, btnY, btnW, btnH, 14);
    abandonBtn.setInteractive(
      new Phaser.Geom.Rectangle(startX + btnW + gap, btnY, btnW, btnH),
      Phaser.Geom.Rectangle.Contains
    );
    track(this.add.text(startX + btnW + gap + btnW / 2, btnY + btnH / 2, '确认放弃', {
      font: 'bold 20px Arial',
      color: '#ffffff'
    }).setOrigin(0.5), 1002);

    const destroyConfirm = () => {
      confirmObjects.forEach(obj => {
        if (obj && obj.destroy) obj.destroy();
      });
    };

    cancelBtn.on('pointerover', () => {
      cancelBtn.clear();
      cancelBtn.fillStyle(this.lighten(0x757575, 20), 1);
      cancelBtn.fillRoundedRect(startX, btnY, btnW, btnH, 14);
    });
    cancelBtn.on('pointerout', () => {
      cancelBtn.clear();
      cancelBtn.fillStyle(0x757575, 1);
      cancelBtn.fillRoundedRect(startX, btnY, btnW, btnH, 14);
    });
    cancelBtn.on('pointerup', () => {
      destroyConfirm();
      cleanupCallback();
    });

    abandonBtn.on('pointerover', () => {
      abandonBtn.clear();
      abandonBtn.fillStyle(this.lighten(0xf44336, 20), 1);
      abandonBtn.fillRoundedRect(startX + btnW + gap, btnY, btnW, btnH, 14);
    });
    abandonBtn.on('pointerout', () => {
      abandonBtn.clear();
      abandonBtn.fillStyle(0xf44336, 1);
      abandonBtn.fillRoundedRect(startX + btnW + gap, btnY, btnW, btnH, 14);
    });
    abandonBtn.on('pointerup', () => {
      destroyConfirm();
      SaveManager.clearPuzzleSave(
        this.levelRule.id,
        this.isEventLevel,
        this.eventId,
        this.isTowerFloor,
        this.towerFloorId
      );
      if (this.isTowerFloor && this.towerFloorId) {
        SaveManager.failTowerFloor(this.towerFloorId);
      }
      this.cleanupGameStateForExit();
      this.navigateToPreviousScene();
    });
  }

  private showPauseMenu(): void {
    if (this.isCompleted) return;
    this.pauseGameState();

    const pauseMenuObjects: Phaser.GameObjects.GameObject[] = [];

    const track = <T extends Phaser.GameObjects.GameObject>(obj: T): T => {
      pauseMenuObjects.push(obj);
      return obj;
    };

    const overlay = track(this.add.graphics());
    overlay.fillStyle(0x000000, 0.78);
    overlay.fillRect(0, 0, 750, 1334);
    overlay.setInteractive();

    const modal = track(this.add.graphics());
    modal.fillStyle(0x16213e, 1);
    modal.fillRoundedRect(90, 300, 570, 730, 24);
    modal.lineStyle(3, 0xe94560, 1);
    modal.strokeRoundedRect(90, 300, 570, 730, 24);

    track(this.add.text(375, 360, '⏸ 游戏暂停', {
      font: 'bold 36px Arial',
      color: '#ffffff'
    }).setOrigin(0.5));

    const infoBg = track(this.add.graphics());
    infoBg.fillStyle(0x0f3460, 0.5);
    infoBg.fillRoundedRect(130, 400, 490, 78, 12);

    const remaining = Math.max(0, this.levelRule.timeLimit - this.elapsedTime);
    track(this.add.text(375, 428, `🌿 ${this.specimen.name}`, {
      font: 'bold 17px Arial',
      color: '#4caf50'
    }).setOrigin(0.5));
    track(this.add.text(375, 455, `剩余时间 ${formatTime(remaining)}  ·  进度 ${this.snappedCount}/${this.realPiecesCount}`, {
      font: '17px Arial',
      color: '#eaeaea'
    }).setOrigin(0.5));

    const btnW = 245;
    const btnH = 62;
    const gapX = 25;
    const gapY = 18;
    const startX = 140;
    let btnY = 515;

    const createPauseButton = (
      x: number,
      y: number,
      label: string,
      subLabel: string | null,
      color: number,
      onClick: () => void
    ): Phaser.GameObjects.Graphics => {
      const btn = track(this.add.graphics());
      btn.fillStyle(color, 1);
      btn.fillRoundedRect(x, y, btnW, btnH, 14);
      btn.setInteractive(
        new Phaser.Geom.Rectangle(x, y, btnW, btnH),
        Phaser.Geom.Rectangle.Contains
      );

      if (subLabel) {
        track(this.add.text(x + btnW / 2, y + btnH / 2 - 9, label, {
          font: 'bold 17px Arial',
          color: '#ffffff'
        }).setOrigin(0.5));
        track(this.add.text(x + btnW / 2, y + btnH / 2 + 13, subLabel, {
          font: '11px Arial',
          color: 'rgba(255,255,255,0.7)'
        }).setOrigin(0.5));
      } else {
        track(this.add.text(x + btnW / 2, y + btnH / 2, label, {
          font: 'bold 19px Arial',
          color: '#ffffff'
        }).setOrigin(0.5));
      }

      btn.on('pointerover', () => {
        btn.clear();
        btn.fillStyle(this.lighten(color, 20), 1);
        btn.fillRoundedRect(x, y, btnW, btnH, 14);
      });

      btn.on('pointerout', () => {
        btn.clear();
        btn.fillStyle(color, 1);
        btn.fillRoundedRect(x, y, btnW, btnH, 14);
      });

      btn.on('pointerdown', () => {
        btn.clear();
        btn.fillStyle(this.darken(color, 20), 1);
        btn.fillRoundedRect(x, y, btnW, btnH, 14);
      });

      btn.on('pointerup', () => {
        btn.clear();
        btn.fillStyle(color, 1);
        btn.fillRoundedRect(x, y, btnW, btnH, 14);
        onClick();
      });

      return btn;
    };

    const destroyPauseMenu = () => {
      pauseMenuObjects.forEach(obj => {
        if (obj && obj.active && !obj.scene) return;
        if (obj && obj.destroy) obj.destroy();
      });
    };

    const cleanupAfterModal = () => {
    };

    createPauseButton(
      startX, btnY,
      '▶️ 继续游戏', '继续修复',
      0x4caf50,
      () => {
        destroyPauseMenu();
        this.resumeGameState();
      }
    );

    createPauseButton(
      startX + btnW + gapX, btnY,
      '🎯 查看目标', '标本&规则',
      0x00bcd4,
      () => {
        this.showObjectiveModal(overlay, cleanupAfterModal);
      }
    );

    btnY += btnH + gapY;

    const saveNotification = track(this.add.text(375, 488, '', {
      font: 'bold 15px Arial',
      color: '#4caf50'
    }).setOrigin(0.5).setAlpha(0)) as Phaser.GameObjects.Text;

    createPauseButton(
      startX, btnY,
      '💾 保存进度', '下次可继续',
      0x2196f3,
      () => {
        this.saveCurrentProgress();
        saveNotification.setText('✓ 进度已保存！下次进入可继续');
        saveNotification.setAlpha(1);
        this.tweens.add({
          targets: saveNotification,
          alpha: 0,
          delay: 2000,
          duration: 500
        });
      }
    );

    createPauseButton(
      startX + btnW + gapX, btnY,
      '🔄 重新开始', '重置本关',
      0xff9800,
      () => {
        SaveManager.clearPuzzleSave(
          this.levelRule.id,
          this.isEventLevel,
          this.eventId,
          this.isTowerFloor,
          this.towerFloorId
        );
        this.cleanupGameStateForExit();
        this.scene.restart({
          levelId: this.levelRule.id,
          isEventLevel: this.isEventLevel,
          eventId: this.eventId,
          isTowerFloor: this.isTowerFloor,
          towerFloorId: this.towerFloorId
        });
      }
    );

    btnY += btnH + gapY;

    createPauseButton(
      startX, btnY,
      '🗑️ 放弃本局', '不保存退出',
      0xf44336,
      () => {
        this.showAbandonConfirm(overlay, cleanupAfterModal);
      }
    );

    createPauseButton(
      startX + btnW + gapX, btnY,
      '🏠 快捷返回', '保存并退出',
      0x9c27b0,
      () => {
        this.saveCurrentProgress();
        this.cleanupGameStateForExit();
        this.navigateToPreviousScene();
      }
    );

    btnY += btnH + gapY + 5;

    const tipBg = track(this.add.graphics());
    tipBg.fillStyle(0x1a2a4a, 0.8);
    tipBg.fillRoundedRect(130, btnY, 490, 48, 10);
    tipBg.lineStyle(1, 0x4caf50, 0.3);
    tipBg.strokeRoundedRect(130, btnY, 490, 48, 10);

    const sceneLabel = this.isTowerFloor ? '塔楼挑战' : this.isEventLevel ? '活动关卡' : '主线关卡';
    track(this.add.text(375, btnY + 24, `💡 按 ESC 键快速暂停/继续  ·  当前: ${sceneLabel}`, {
      font: '13px Arial',
      color: '#888888',
      align: 'center'
    }).setOrigin(0.5));
  }

  private setupLevelTutorialUI(): void {
    this.isShowingLevelTutorial = true;

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
    this.tutorialBox.fillRoundedRect(50, 1050, 650, 180, 20);
    this.tutorialBox.lineStyle(3, 0x4caf50, 1);
    this.tutorialBox.strokeRoundedRect(50, 1050, 650, 180, 20);
    this.tutorialContainer.add(this.tutorialBox);

    this.tutorialTitle = this.add.text(375, 1085, '', {
      font: 'bold 24px Arial',
      color: '#4caf50'
    }).setOrigin(0.5);
    this.tutorialContainer.add(this.tutorialTitle);

    this.tutorialContent = this.add.text(375, 1125, '', {
      font: '18px Arial',
      color: '#ffffff',
      wordWrap: { width: 580, useAdvancedWrap: true },
      align: 'center'
    }).setOrigin(0.5, 0);
    this.tutorialContainer.add(this.tutorialContent);

    this.progressIndicator = this.add.text(650, 1080, '', {
      font: '14px Arial',
      color: '#aaaaaa'
    }).setOrigin(1, 0.5);
    this.tutorialContainer.add(this.progressIndicator);

    this.nextButton = this.add.graphics();
    this.nextButton.fillStyle(0x4caf50, 1);
    this.nextButton.fillRoundedRect(520, 1180, 160, 40, 12);
    this.nextButton.setInteractive(
      new Phaser.Geom.Rectangle(520, 1180, 160, 40),
      Phaser.Geom.Rectangle.Contains
    );
    this.tutorialContainer.add(this.nextButton);

    const nextBtnText = this.add.text(600, 1200, '开始', {
      font: 'bold 18px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.tutorialContainer.add(nextBtnText);

    this.nextButton.on('pointerup', () => {
      this.advanceLevelTutorialStep();
    });

    this.skipButton = this.add.graphics();
    this.skipButton.fillStyle(0x666666, 0.8);
    this.skipButton.fillRoundedRect(70, 1180, 160, 40, 12);
    this.skipButton.setInteractive(
      new Phaser.Geom.Rectangle(70, 1180, 160, 40),
      Phaser.Geom.Rectangle.Contains
    );
    this.tutorialContainer.add(this.skipButton);

    const skipBtnText = this.add.text(150, 1200, '跳过', {
      font: 'bold 16px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.tutorialContainer.add(skipBtnText);

    this.skipButton.on('pointerup', () => {
      this.hideLevelTutorialUI();
      this.startTimer();
    });
  }

  private showLevelTutorialStep(): void {
    const step = this.levelTutorialSteps[this.currentLevelTutorialIndex];
    if (!step) {
      this.hideLevelTutorialUI();
      this.startTimer();
      return;
    }

    this.tutorialTitle.setText(step.title);
    this.tutorialContent.setText(step.content);

    const currentIndex = this.currentLevelTutorialIndex + 1;
    const totalSteps = this.levelTutorialSteps.length;
    this.progressIndicator.setText(`${currentIndex}/${totalSteps}`);

    this.updateLevelTutorialHighlight(step);
    this.updateLevelTutorialArrow(step);

    if (step.autoNext && step.autoNextDelay) {
      this.time.delayedCall(step.autoNextDelay, () => {
        this.advanceLevelTutorialStep();
      });
    }

    const isLastStep = this.currentLevelTutorialIndex >= this.levelTutorialSteps.length - 1;
    const nextBtnText = this.tutorialContainer.getAt(5) as Phaser.GameObjects.Text;
    if (nextBtnText) {
      nextBtnText.setText(isLastStep ? '开始游戏' : '继续');
    }
  }

  private updateLevelTutorialHighlight(step: TutorialStep): void {
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

  private updateLevelTutorialArrow(step: TutorialStep): void {
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

  private advanceLevelTutorialStep(): void {
    this.currentLevelTutorialIndex++;

    if (this.currentLevelTutorialIndex >= this.levelTutorialSteps.length) {
      this.hideLevelTutorialUI();
      this.startTimer();
    } else {
      this.showLevelTutorialStep();
    }
  }

  private hideLevelTutorialUI(): void {
    this.isShowingLevelTutorial = false;
    if (this.tutorialOverlay) {
      this.tutorialOverlay.setAlpha(0);
      this.tutorialOverlay.disableInteractive();
    }
    if (this.tutorialContainer) {
      this.tutorialContainer.setAlpha(0);
    }
    if (this.highlightGraphics) {
      this.highlightGraphics.clear();
    }
    if (this.arrowGraphics) {
      this.arrowGraphics.clear();
    }
  }
}
