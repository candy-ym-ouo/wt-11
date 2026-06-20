import Phaser from 'phaser';
import { Levels } from '../data/Levels';
import { SaveManager } from '../utils/SaveManager';
import { getDifficultyColor, getDifficultyText, formatTime } from '../utils/GameUtils';
import { LevelData, PuzzleSaveData } from '../types/GameTypes';
import { Chapters, getChapterById, getChapterByLevelId, getHiddenLevelsForChapter, isHiddenLevel, getHiddenLevelData } from '../data/Chapters';
import { DailyQuestManager } from '../utils/DailyQuestManager';
import { TutorialManager } from '../utils/TutorialManager';
import { PlantFamilies, getPlantFamilyBySpecimenId } from '../data/PlantFamilies';
import { RepairLogManager } from '../utils/RepairLogManager';

type DifficultyFilter = 'all' | 'easy' | 'medium' | 'hard';
type CompletionFilter = 'all' | 'completed' | 'incomplete';
type SortType = 'default' | 'difficulty' | 'score' | 'stars' | 'name';

export class LevelSelectScene extends Phaser.Scene {
  private currentChapterId: number | null = null;
  private selectedChapterId: number = 1;
  private hiddenHintsHeight: number = 0;

  private difficultyFilter: DifficultyFilter = 'all';
  private familyFilter: string = 'all';
  private completionFilter: CompletionFilter = 'all';
  private sortType: SortType = 'default';

  private filterContainer: Phaser.GameObjects.Container | null = null;
  private levelGridContainer: Phaser.GameObjects.Container | null = null;
  private hasResumeSave: boolean = false;
  private contentOffsetY: number = 0;

  constructor() {
    super('LevelSelectScene');
  }

  init(data: { chapterId?: number }): void {
    if (data?.chapterId) {
      this.currentChapterId = data.chapterId;
      this.selectedChapterId = data.chapterId;
    }
  }

  create(): void {
    this.checkForResumeSave();
    this.addBackground();
    this.addTitle();
    if (this.hasResumeSave) {
      this.addResumeButton();
    }
    this.addRecommendedChallenges();
    this.addRecentPlaySection();
    this.addChapterTabs();
    this.addTutorialCard();
    this.addHiddenLevelHints();
    this.addFilterBar();
    this.addLevelGrid();
    this.addBottomButtons();
  }

  private checkForResumeSave(): void {
    const allSaves = SaveManager.getAllPuzzleSaves();
    const saveEntries = Object.entries(allSaves);
    this.hasResumeSave = saveEntries.length > 0;
    let offset = this.hasResumeSave ? 110 : 0;

    const recommendations = SaveManager.getRecommendedChallenges(4);
    if (recommendations.length > 0) offset += 170;

    const recentRecords = SaveManager.getRecentPlayRecords(3);
    if (recentRecords.length > 0) offset += 170;

    this.contentOffsetY = offset;
  }

  private addResumeButton(): void {
    const allSaves = SaveManager.getAllPuzzleSaves();
    const saveEntries = Object.entries(allSaves);

    if (saveEntries.length === 0) return;

    const latestSave = saveEntries.reduce((latest, [key, save]) => {
      return save.savedAt > latest[1].savedAt ? [key, save] : latest;
    })[1];

    const level = Levels.find(l => l.id === latestSave.levelId);
    if (!level) return;

    const btnY = 170;
    const btnW = 680;
    const btnH = 80;

    const btn = this.add.graphics();
    btn.fillStyle(0x2196f3, 0.95);
    btn.fillRoundedRect(375 - btnW / 2, btnY - btnH / 2, btnW, btnH, 16);
    btn.lineStyle(3, 0xffffff, 0.3);
    btn.strokeRoundedRect(375 - btnW / 2, btnY - btnH / 2, btnW, btnH, 16);

    btn.setInteractive(
      new Phaser.Geom.Rectangle(375 - btnW / 2, btnY - btnH / 2, btnW, btnH),
      Phaser.Geom.Rectangle.Contains
    );

    this.add.text(80, btnY - 15, '💾 继续上次游戏', {
      font: 'bold 22px Arial',
      color: '#ffffff'
    }).setOrigin(0, 0.5);

    const saveDate = new Date(latestSave.savedAt);
    const timeStr = saveDate.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    this.add.text(80, btnY + 15, `${level.name} · 剩余 ${formatTime(latestSave.remainingTime)} · 进度 ${latestSave.snappedCount}/${latestSave.pieces.length} · ${timeStr}`, {
      font: '14px Arial',
      color: 'rgba(255,255,255,0.8)'
    }).setOrigin(0, 0.5);

    this.add.text(670, btnY, '开始 →', {
      font: 'bold 18px Arial',
      color: '#ffffff'
    }).setOrigin(1, 0.5);

    btn.on('pointerover', () => {
      btn.clear();
      btn.fillStyle(0x42a5f5, 0.95);
      btn.fillRoundedRect(375 - btnW / 2, btnY - btnH / 2, btnW, btnH, 16);
      btn.lineStyle(3, 0xffffff, 0.5);
      btn.strokeRoundedRect(375 - btnW / 2, btnY - btnH / 2, btnW, btnH, 16);
    });

    btn.on('pointerout', () => {
      btn.clear();
      btn.fillStyle(0x2196f3, 0.95);
      btn.fillRoundedRect(375 - btnW / 2, btnY - btnH / 2, btnW, btnH, 16);
      btn.lineStyle(3, 0xffffff, 0.3);
      btn.strokeRoundedRect(375 - btnW / 2, btnY - btnH / 2, btnW, btnH, 16);
    });

    btn.on('pointerup', () => {
      this.scene.start('GameScene', {
        levelId: latestSave.levelId,
        isEventLevel: latestSave.isEventLevel,
        eventId: latestSave.eventId ?? undefined,
        isTowerFloor: latestSave.isTowerFloor,
        towerFloorId: latestSave.towerFloorId ?? undefined,
        loadSave: true
      });
    });
  }

  private addRecommendedChallenges(): void {
    const recommendations = SaveManager.getRecommendedChallenges(4);
    if (recommendations.length === 0) return;

    const baseY = this.hasResumeSave ? 280 : 170;
    const sectionY = baseY;
    const sectionH = 160;

    const sectionBg = this.add.graphics();
    sectionBg.fillStyle(0x0f3460, 0.8);
    sectionBg.fillRoundedRect(40, sectionY - sectionH / 2, 670, sectionH, 12);

    this.add.text(60, sectionY - sectionH / 2 + 25, '💡 推荐挑战', {
      font: 'bold 20px Arial',
      color: '#ffffff'
    }).setOrigin(0, 0.5);

    const cardW = 150;
    const cardH = 95;
    const padding = 12;
    const count = Math.min(recommendations.length, 4);
    const totalW = cardW * count + padding * (count - 1);
    const startX = 375 - totalW / 2 + cardW / 2;

    recommendations.slice(0, count).forEach((rec, index) => {
      const x = startX + index * (cardW + padding);
      const y = sectionY + 10;

      const card = this.add.graphics();
      card.fillStyle(rec.color, 0.9);
      card.fillRoundedRect(x - cardW / 2, y - cardH / 2, cardW, cardH, 12);
      card.lineStyle(2, 0xffffff, 0.2);
      card.strokeRoundedRect(x - cardW / 2, y - cardH / 2, cardW, cardH, 12);

      this.add.text(x, y - 20, rec.icon, {
        font: '28px Arial'
      }).setOrigin(0.5);

      this.add.text(x, y + 8, rec.title, {
        font: 'bold 15px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);

      this.add.text(x, y + 28, rec.description, {
        font: '10px Arial',
        color: 'rgba(255,255,255,0.8)',
        wordWrap: { width: cardW - 10 },
        align: 'center'
      }).setOrigin(0.5);

      card.setInteractive(
        new Phaser.Geom.Rectangle(x - cardW / 2, y - cardH / 2, cardW, cardH),
        Phaser.Geom.Rectangle.Contains
      );

      card.on('pointerup', () => {
        switch (rec.type) {
          case 'next_level':
          case 'incomplete':
          case 'low_stars':
          case 'hard_challenge':
            if (rec.levelId) {
              this.scene.start('GameScene', { levelId: rec.levelId });
            }
            break;
          case 'daily_quest':
            this.scene.start('DailyQuestScene');
            break;
          case 'tower':
            this.scene.start('TowerSelectScene');
            break;
          case 'event':
            this.scene.start('EventScene');
            break;
        }
      });

      card.on('pointerover', () => card.lineStyle(2, 0xffffff, 0.6));
      card.on('pointerout', () => card.lineStyle(2, 0xffffff, 0.2));
    });
  }

  private addRecentPlaySection(): void {
    const records = SaveManager.getRecentPlayRecords(5);
    if (records.length === 0) return;

    const baseY = this.hasResumeSave ? 280 : 170;
    const recCount = SaveManager.getRecommendedChallenges(4).length;
    const sectionY = baseY + (recCount > 0 ? 170 : 0);
    const sectionH = 160;

    const sectionBg = this.add.graphics();
    sectionBg.fillStyle(0x0f3460, 0.8);
    sectionBg.fillRoundedRect(40, sectionY - sectionH / 2, 670, sectionH, 12);

    this.add.text(60, sectionY - sectionH / 2 + 25, '🕒 最近游玩', {
      font: 'bold 20px Arial',
      color: '#ffffff'
    }).setOrigin(0, 0.5);

    const cardW = 195;
    const cardH = 95;
    const padding = 12;
    const count = Math.min(records.length, 3);
    const totalW = cardW * count + padding * (count - 1);
    const startX = 375 - totalW / 2 + cardW / 2;

    records.slice(0, count).forEach((record, index) => {
      const x = startX + index * (cardW + padding);
      const y = sectionY + 10;

      const level = Levels.find(l => l.id === record.levelId);
      const chapter = getChapterByLevelId(record.levelId);
      if (!level) return;

      const card = this.add.graphics();
      const color = chapter?.primaryColor ?? 0xe94560;
      card.fillStyle(color, 0.9);
      card.fillRoundedRect(x - cardW / 2, y - cardH / 2, cardW, cardH, 12);
      card.lineStyle(2, 0xffffff, 0.2);
      card.strokeRoundedRect(x - cardW / 2, y - cardH / 2, cardW, cardH, 12);

      const previewKey = `specimen-${level.specimen.id}-preview`;
      if (this.textures.exists(previewKey)) {
        const img = this.add.image(x - cardW / 2 + 28, y, previewKey);
        img.setDisplaySize(45, 45);
      }

      this.add.text(x - cardW / 2 + 60, y - 15, level.name, {
        font: 'bold 14px Arial',
        color: '#ffffff'
      }).setOrigin(0, 0.5);

      const progress = SaveManager.getProgress(record.levelId);
      const stars = progress?.stars ?? 0;
      const starStr = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
      this.add.text(x - cardW / 2 + 60, y + 8, starStr, {
        font: '12px Arial',
        color: '#ffd700'
      }).setOrigin(0, 0.5);

      const playDate = new Date(record.playedAt);
      const dateStr = playDate.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
      this.add.text(x + cardW / 2 - 10, y + 28, dateStr, {
        font: '11px Arial',
        color: 'rgba(255,255,255,0.6)'
      }).setOrigin(1, 0.5);

      card.setInteractive(
        new Phaser.Geom.Rectangle(x - cardW / 2, y - cardH / 2, cardW, cardH),
        Phaser.Geom.Rectangle.Contains
      );

      card.on('pointerup', () => {
        this.scene.start('GameScene', {
          levelId: record.levelId,
          isEventLevel: record.isEventLevel,
          eventId: record.eventId ?? undefined,
          isTowerFloor: record.isTowerFloor,
          towerFloorId: record.towerFloorId ?? undefined
        });
      });

      card.on('pointerover', () => card.lineStyle(2, 0xffffff, 0.6));
      card.on('pointerout', () => card.lineStyle(2, 0xffffff, 0.2));
    });
  }

  private addBackground(): void {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    const bg = this.add.graphics();
    bg.fillStyle(0x16213e, 1);
    bg.fillRoundedRect(25, 100, 700, 1400, 20);
  }

  private addTitle(): void {
    this.add.text(375, 60, '植物标本修复', {
      font: 'bold 42px Arial',
      color: '#e94560'
    }).setOrigin(0.5);

    this.add.text(375, 100, this.currentChapterId ? '选择关卡' : '全部关卡', {
      font: '28px Arial',
      color: '#eaeaea'
    }).setOrigin(0.5);
  }

  private addChapterTabs(): void {
    const tabY = 150 + this.contentOffsetY;
    const tabWidth = 220;
    const tabHeight = 50;
    const spacing = 10;
    const totalWidth = tabWidth * Chapters.length + spacing * (Chapters.length - 1);
    const startX = (750 - totalWidth) / 2 + tabWidth / 2;

    Chapters.forEach((chapter, index) => {
      const x = startX + index * (tabWidth + spacing);
      const isSelected = chapter.id === this.selectedChapterId;
      const unlocked = SaveManager.isChapterUnlocked(chapter.id);

      const tab = this.add.graphics();
      tab.fillStyle(isSelected ? chapter.primaryColor : unlocked ? 0x0f3460 : 0x2a2a3a, 1);
      tab.fillRoundedRect(x - tabWidth / 2, tabY - tabHeight / 2, tabWidth, tabHeight, 10);

      if (isSelected) {
        tab.lineStyle(3, 0xffffff, 0.8);
        tab.strokeRoundedRect(x - tabWidth / 2, tabY - tabHeight / 2, tabWidth, tabHeight, 10);
      }

      const chapterStars = SaveManager.getChapterStars(chapter.id);
      const totalStars = chapter.levelIds.length * 3;

      this.add.text(x, tabY - 8, chapter.theme, {
        font: 'bold 15px Arial',
        color: unlocked ? '#ffffff' : '#666666'
      }).setOrigin(0.5);

      this.add.text(x, tabY + 12, `${chapterStars}/${totalStars} ⭐`, {
        font: '12px Arial',
        color: unlocked ? '#ffd700' : '#555555'
      }).setOrigin(0.5);

      if (unlocked) {
        tab.setInteractive(
          new Phaser.Geom.Rectangle(x - tabWidth / 2, tabY - tabHeight / 2, tabWidth, tabHeight),
          Phaser.Geom.Rectangle.Contains
        );

        tab.on('pointerup', () => {
          this.selectedChapterId = chapter.id;
          this.scene.restart({ chapterId: chapter.id });
        });
      }
    });
  }

  private addTutorialCard(): void {
    const isCompleted = TutorialManager.isTeachingLevelCompleted();
    const isSkipped = TutorialManager.isTeachingLevelSkipped();
    const cardWidth = 670;
    const cardHeight = 120;
    const x = 375;
    const y = 260 + this.contentOffsetY;

    const card = this.add.graphics();

    let cardColor: number;
    let borderColor: number;
    let titleText: string;
    let descText: string;
    let btnLabel: string;
    let showBtn: boolean;

    if (isCompleted) {
      cardColor = 0x2e7d32;
      borderColor = 0x1b5e20;
      titleText = '新手教学（已完成）';
      descText = '恭喜你已经掌握了基本操作！';
      btnLabel = '再来一次';
      showBtn = true;
    } else if (isSkipped) {
      cardColor = 0xff9800;
      borderColor = 0xf57c00;
      titleText = '新手教学（已跳过）';
      descText = '跳过不影响游戏，随时可以回来学习';
      btnLabel = '重新学习';
      showBtn = true;
    } else {
      cardColor = 0x4caf50;
      borderColor = 0x81c784;
      titleText = '新手教学';
      descText = '点击开始学习游戏基本操作';
      btnLabel = '开始';
      showBtn = true;
    }

    card.fillStyle(cardColor, 1);
    card.lineStyle(3, borderColor, 1);
    card.strokeRoundedRect(x - cardWidth / 2, y - cardHeight / 2, cardWidth, cardHeight, 15);
    card.fillRoundedRect(x - cardWidth / 2, y - cardHeight / 2, cardWidth, cardHeight, 15);

    this.add.text(x - 280, y - 30, '🎓', {
      font: '40px Arial',
      color: '#ffffff'
    }).setOrigin(0, 0.5);

    this.add.text(x - 220, y - 30, titleText, {
      font: 'bold 22px Arial',
      color: '#ffffff'
    }).setOrigin(0, 0.5);

    this.add.text(x - 220, y + 10, descText, {
      font: '16px Arial',
      color: '#e8f5e9'
    }).setOrigin(0, 0.5);

    if (isCompleted) {
      this.add.text(x + 200, y - 10, '✓ 完成', {
        font: 'bold 16px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);
      this.add.text(x + 200, y + 20, '奖励已领取', {
        font: '13px Arial',
        color: '#c8e6c9'
      }).setOrigin(0.5);
    } else if (isSkipped) {
      this.add.text(x + 200, y - 10, '⏭ 已跳过', {
        font: 'bold 16px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);
      this.add.text(x + 200, y + 20, '奖励待领取', {
        font: '13px Arial',
        color: '#fff3e0'
      }).setOrigin(0.5);
    }

    if (showBtn) {
      const btnX = x + 280;
      const btnY = y;
      const btnW = 110;
      const btnH = 48;

      const startBtn = this.add.graphics();
      startBtn.fillStyle(0xffffff, 1);
      startBtn.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 12);
      startBtn.setInteractive(
        new Phaser.Geom.Rectangle(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH),
        Phaser.Geom.Rectangle.Contains
      );

      const btnTextColor = isCompleted ? '#2e7d32' : (isSkipped ? '#e65100' : '#4caf50');
      this.add.text(btnX, btnY, btnLabel, {
        font: 'bold 18px Arial',
        color: btnTextColor
      }).setOrigin(0.5);

      startBtn.on('pointerup', () => {
        this.scene.start('TutorialScene', { levelId: 0 });
      });
    }

    card.setInteractive(
      new Phaser.Geom.Rectangle(x - cardWidth / 2, y - cardHeight / 2, cardWidth, cardHeight),
      Phaser.Geom.Rectangle.Contains
    );

    card.on('pointerup', () => {
      this.scene.start('TutorialScene', { levelId: 0 });
    });
  }

  private addHiddenLevelHints(): void {
    this.hiddenHintsHeight = 0;
    if (!this.currentChapterId) return;

    const chapter = getChapterById(this.currentChapterId);
    if (!chapter || !chapter.hiddenLevels || chapter.hiddenLevels.length === 0) return;

    const hintH = 80;
    const startY = 395 + this.contentOffsetY;

    chapter.hiddenLevels.forEach((hl, index) => {
      const hintY = startY + index * hintH;
      const isRevealed = SaveManager.isHiddenLevelRevealed(chapter.id, hl.levelRuleId);

      const hintBg = this.add.graphics();
      hintBg.fillStyle(isRevealed ? 0x4a148c : 0x1a0a3e, 0.9);
      hintBg.fillRoundedRect(40, hintY, 670, 70, 12);

      if (isRevealed) {
        hintBg.lineStyle(2, 0xce93d8, 0.8);
      } else {
        hintBg.lineStyle(2, 0x7b1fa2, 0.5);
      }
      hintBg.strokeRoundedRect(40, hintY, 670, 70, 12);

      this.add.text(60, hintY + 20, isRevealed ? '🔮 隐藏关卡已解锁！' : '🔒 隐藏关卡', {
        font: 'bold 18px Arial',
        color: isRevealed ? '#ce93d8' : '#7b1fa2'
      }).setOrigin(0, 0.5);

      if (isRevealed) {
        const hlData = getHiddenLevelData(hl.levelRuleId);
        this.add.text(60, hintY + 48, hlData?.revealedDescription ?? '隐藏关卡已出现', {
          font: '14px Arial',
          color: 'rgba(206,147,216,0.85)'
        }).setOrigin(0, 0.5);

        const goBtn = this.add.graphics();
        goBtn.fillStyle(0x9c27b0, 1);
        goBtn.fillRoundedRect(580, hintY + 15, 110, 40, 10);
        goBtn.setInteractive(new Phaser.Geom.Rectangle(580, hintY + 15, 110, 40), Phaser.Geom.Rectangle.Contains);

        this.add.text(635, hintY + 35, '挑战 →', {
          font: 'bold 16px Arial',
          color: '#ffffff'
        }).setOrigin(0.5);

        goBtn.on('pointerup', () => {
          this.scene.start('GameScene', { levelId: hl.levelRuleId });
        });
      } else {
        const triggerDescs = hl.triggers.map(t => t.description);
        const hintText = triggerDescs.length > 0
          ? `解锁条件: ${triggerDescs.join(' 且 ')}`
          : '神秘条件尚未揭示...';
        this.add.text(60, hintY + 48, hintText, {
          font: '13px Arial',
          color: 'rgba(123,31,162,0.7)'
        }).setOrigin(0, 0.5);
      }
    });

    this.hiddenHintsHeight = chapter.hiddenLevels.length * hintH;
  }

  private addFilterBar(): void {
    const barY = 350 + this.contentOffsetY + this.hiddenHintsHeight;
    const barHeight = 160;

    const barBg = this.add.graphics();
    barBg.fillStyle(0x0f3460, 0.8);
    barBg.fillRoundedRect(40, barY, 670, barHeight, 12);

    this.add.text(60, barY + 15, '🔍 筛选与排序', {
      font: 'bold 18px Arial',
      color: '#ffffff'
    }).setOrigin(0, 0);

    this.addDifficultyFilter(60, barY + 50);
    this.addFamilyFilter(60, barY + 90);
    this.addCompletionFilter(375, barY + 50);
    this.addSortSelector(375, barY + 90);

    const resetBtn = this.createFilterButton(
      640,
      barY + 20,
      80,
      30,
      '重置',
      0x78909c,
      () => this.resetFilters()
    );
  }

  private addDifficultyFilter(x: number, y: number): void {
    this.add.text(x, y, '难度:', {
      font: '14px Arial',
      color: '#b0bec5'
    }).setOrigin(0, 0.5);

    const options: { value: DifficultyFilter; label: string; color: number }[] = [
      { value: 'all', label: '全部', color: 0x546e7a },
      { value: 'easy', label: '简单', color: 0x4caf50 },
      { value: 'medium', label: '中等', color: 0xff9800 },
      { value: 'hard', label: '困难', color: 0xf44336 }
    ];

    let currentX = x + 50;
    options.forEach(opt => {
      const isSelected = this.difficultyFilter === opt.value;
      const btn = this.createFilterButton(
        currentX + 30,
        y,
        55,
        28,
        opt.label,
        isSelected ? opt.color : 0x37474f,
        () => {
          this.difficultyFilter = opt.value;
          this.refreshLevelGrid();
        }
      );
      if (isSelected) {
        btn.lineStyle(2, 0xffffff, 1);
        btn.strokeRoundedRect(currentX + 30 - 27.5, y - 14, 55, 28, 6);
      }
      currentX += 65;
    });
  }

  private addFamilyFilter(x: number, y: number): void {
    this.add.text(x, y, '科属:', {
      font: '14px Arial',
      color: '#b0bec5'
    }).setOrigin(0, 0.5);

    const families = PlantFamilies.filter(f => !f.isLimited);
    const familyOptions = [
      { value: 'all', label: '全部' },
      ...families.map(f => ({ value: f.id, label: f.genusName }))
    ];

    let currentX = x + 50;
    familyOptions.forEach((opt, index) => {
      if (index > 4) return;
      const isSelected = this.familyFilter === opt.value;
      const btn = this.createFilterButton(
        currentX + 35,
        y,
        65,
        28,
        opt.label,
        isSelected ? 0x9c27b0 : 0x37474f,
        () => {
          this.familyFilter = opt.value;
          this.refreshLevelGrid();
        }
      );
      if (isSelected) {
        btn.lineStyle(2, 0xffffff, 1);
        btn.strokeRoundedRect(currentX + 35 - 32.5, y - 14, 65, 28, 6);
      }
      currentX += 75;
    });
  }

  private addCompletionFilter(x: number, y: number): void {
    this.add.text(x, y, '状态:', {
      font: '14px Arial',
      color: '#b0bec5'
    }).setOrigin(0, 0.5);

    const options: { value: CompletionFilter; label: string; color: number }[] = [
      { value: 'all', label: '全部', color: 0x546e7a },
      { value: 'completed', label: '已完成', color: 0x4caf50 },
      { value: 'incomplete', label: '未完成', color: 0xff9800 }
    ];

    let currentX = x + 50;
    options.forEach(opt => {
      const isSelected = this.completionFilter === opt.value;
      const btn = this.createFilterButton(
        currentX + 35,
        y,
        65,
        28,
        opt.label,
        isSelected ? opt.color : 0x37474f,
        () => {
          this.completionFilter = opt.value;
          this.refreshLevelGrid();
        }
      );
      if (isSelected) {
        btn.lineStyle(2, 0xffffff, 1);
        btn.strokeRoundedRect(currentX + 35 - 32.5, y - 14, 65, 28, 6);
      }
      currentX += 75;
    });
  }

  private addSortSelector(x: number, y: number): void {
    this.add.text(x, y, '排序:', {
      font: '14px Arial',
      color: '#b0bec5'
    }).setOrigin(0, 0.5);

    const options: { value: SortType; label: string }[] = [
      { value: 'default', label: '默认' },
      { value: 'difficulty', label: '难度' },
      { value: 'score', label: '分数' },
      { value: 'stars', label: '星级' },
      { value: 'name', label: '名称' }
    ];

    let currentX = x + 50;
    options.forEach(opt => {
      const isSelected = this.sortType === opt.value;
      const btn = this.createFilterButton(
        currentX + 30,
        y,
        55,
        28,
        opt.label,
        isSelected ? 0x00bcd4 : 0x37474f,
        () => {
          this.sortType = opt.value;
          this.refreshLevelGrid();
        }
      );
      if (isSelected) {
        btn.lineStyle(2, 0xffffff, 1);
        btn.strokeRoundedRect(currentX + 30 - 27.5, y - 14, 55, 28, 6);
      }
      currentX += 65;
    });
  }

  private createFilterButton(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    color: number,
    onClick: () => void
  ): Phaser.GameObjects.Graphics {
    const btn = this.add.graphics();
    btn.fillStyle(color, 1);
    btn.fillRoundedRect(x - width / 2, y - height / 2, width, height, 6);

    btn.setInteractive(
      new Phaser.Geom.Rectangle(x - width / 2, y - height / 2, width, height),
      Phaser.Geom.Rectangle.Contains
    );

    this.add.text(x, y, label, {
      font: '13px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    btn.on('pointerup', onClick);

    return btn;
  }

  private resetFilters(): void {
    this.difficultyFilter = 'all';
    this.familyFilter = 'all';
    this.completionFilter = 'all';
    this.sortType = 'default';
    this.refreshLevelGrid();
  }

  private getFilteredLevels(): LevelData[] {
    const chapter = this.currentChapterId ? getChapterById(this.currentChapterId) : null;
    let levels: LevelData[];

    if (chapter) {
      levels = Levels.filter(level => chapter.levelIds.includes(level.id));

      const hiddenLevels = getHiddenLevelsForChapter(chapter.id);
      for (const hl of hiddenLevels) {
        if (SaveManager.isHiddenLevelRevealed(chapter.id, hl.levelRuleId)) {
          const hiddenLevel = Levels.find(l => l.id === hl.levelRuleId);
          if (hiddenLevel && !levels.find(l => l.id === hl.levelRuleId)) {
            levels.push(hiddenLevel);
          }
        }
      }
    } else {
      levels = [...Levels];
    }

    if (this.difficultyFilter !== 'all') {
      levels = levels.filter(l => l.rule.difficulty === this.difficultyFilter);
    }

    if (this.familyFilter !== 'all') {
      const family = PlantFamilies.find(f => f.id === this.familyFilter);
      if (family) {
        levels = levels.filter(l => family.specimenIds.includes(l.specimen.id));
      }
    }

    if (this.completionFilter === 'completed') {
      levels = levels.filter(l => SaveManager.getProgress(l.id)?.completed === true);
    } else if (this.completionFilter === 'incomplete') {
      levels = levels.filter(l => !SaveManager.getProgress(l.id)?.completed);
    }

    levels = this.sortLevels(levels);

    return levels;
  }

  private sortLevels(levels: LevelData[]): LevelData[] {
    const sorted = [...levels];

    switch (this.sortType) {
      case 'difficulty':
        const diffOrder: Record<string, number> = { easy: 0, medium: 1, hard: 2 };
        sorted.sort((a, b) => diffOrder[a.rule.difficulty] - diffOrder[b.rule.difficulty]);
        break;
      case 'score':
        sorted.sort((a, b) => {
          const scoreA = SaveManager.getProgress(a.id)?.bestScore ?? 0;
          const scoreB = SaveManager.getProgress(b.id)?.bestScore ?? 0;
          return scoreB - scoreA;
        });
        break;
      case 'stars':
        sorted.sort((a, b) => {
          const starsA = SaveManager.getProgress(a.id)?.stars ?? 0;
          const starsB = SaveManager.getProgress(b.id)?.stars ?? 0;
          return starsB - starsA;
        });
        break;
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
        break;
      default:
        break;
    }

    return sorted;
  }

  private addLevelGrid(): void {
    this.levelGridContainer = this.add.container(0, 0);
    this.renderLevelGrid();
  }

  private refreshLevelGrid(): void {
    if (this.levelGridContainer) {
      this.levelGridContainer.removeAll(true);
      this.renderLevelGrid();
    }
  }

  private renderLevelGrid(): void {
    if (!this.levelGridContainer) return;

    const levelsToShow = this.getFilteredLevels();
    const startY = 540 + this.contentOffsetY + this.hiddenHintsHeight;
    const cardWidth = 320;
    const cardHeight = 320;
    const padding = 30;
    const cols = 2;

    if (levelsToShow.length === 0) {
      const emptyText = this.add.text(375, startY + 50, '没有符合条件的关卡', {
        font: '20px Arial',
        color: '#90a4ae'
      }).setOrigin(0.5);
      this.levelGridContainer.add(emptyText);
      return;
    }

    levelsToShow.forEach((level, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = padding + col * (cardWidth + padding) + cardWidth / 2;
      const y = startY + row * (cardHeight + padding) + cardHeight / 2;

      this.createLevelCard(x, y, cardWidth, cardHeight, level);
    });
  }

  private createLevelCard(
    x: number,
    y: number,
    width: number,
    height: number,
    level: LevelData
  ): void {
    const progress = SaveManager.getProgress(level.id);
    const unlocked = progress?.unlocked ?? false;
    const chapter = getChapterByLevelId(level.id);
    const family = getPlantFamilyBySpecimenId(level.specimen.id);
    const isFirstCompletion = progress?.completed ?? false;
    const levelEntries = RepairLogManager.getEntriesByLevel(level.id);
    const firstCompletionEntry = levelEntries.find(e => e.keyOperations.includes('first_completion'));
    const hidden = isHiddenLevel(level.id);

    const card = this.add.graphics();
    const cardBgColor = hidden ? (unlocked ? 0x1a0a3e : 0x2a1a4e) : (unlocked ? 0x0f3460 : 0x333344);
    const cardBorderColor = hidden ? (unlocked ? 0x9c27b0 : 0x553388) : (unlocked ? 0xe94560 : 0x555566);
    card.fillStyle(cardBgColor, 1);
    card.lineStyle(3, cardBorderColor, 1);
    card.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 15);
    card.fillRoundedRect(x - width / 2, y - height / 2, width, height, 15);

    if (this.levelGridContainer) {
      this.levelGridContainer.add(card);
    }

    if (hidden) {
      const hiddenBadge = this.add.graphics();
      hiddenBadge.fillStyle(0x9c27b0, 0.95);
      hiddenBadge.fillRoundedRect(x - width / 2 + 10, y - height / 2 + 10, 60, 22, 6);
      const hiddenLabel = this.add.text(x - width / 2 + 40, y - height / 2 + 21, '🔮 隐藏', {
        font: 'bold 11px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);
      if (this.levelGridContainer) {
        this.levelGridContainer.add(hiddenBadge);
        this.levelGridContainer.add(hiddenLabel);
      }
    }

    const previewKey = `specimen-${level.specimen.id}-preview`;
    if (unlocked) {
      const previewImg = this.add.image(x, y - 105, previewKey);
      previewImg.setDisplaySize(100, 100);
      if (this.levelGridContainer) this.levelGridContainer.add(previewImg);
    } else {
      const lockImg = this.add.image(x, y - 105, 'lock').setScale(0.8);
      if (this.levelGridContainer) this.levelGridContainer.add(lockImg);
    }

    const nameText = this.add.text(x, y - 40, level.name, {
      font: hidden ? 'bold 18px Arial' : 'bold 20px Arial',
      color: unlocked ? '#ffffff' : '#888888'
    }).setOrigin(0.5);
    if (this.levelGridContainer) this.levelGridContainer.add(nameText);

    const specimenText = this.add.text(x, y - 18, level.specimen.name, {
      font: '15px Arial',
      color: unlocked ? '#b0bec5' : '#777777'
    }).setOrigin(0.5);
    if (this.levelGridContainer) this.levelGridContainer.add(specimenText);

    const diffColor = getDifficultyColor(level.rule.difficulty);
    const diffText = this.add.text(x, y + 5, getDifficultyText(level.rule.difficulty), {
      font: '14px Arial',
      color: '#' + diffColor.toString(16).padStart(6, '0')
    }).setOrigin(0.5);
    if (this.levelGridContainer) this.levelGridContainer.add(diffText);

    if (unlocked && progress) {
      this.drawStars(x, y + 30, progress.stars);
    }

    if (unlocked && progress?.completed) {
      const bestScoreY = y + 55;
      const scoreLabel = this.add.text(x - 70, bestScoreY, '🏆 最佳', {
        font: '12px Arial',
        color: '#ffd700'
      }).setOrigin(0, 0.5);
      const scoreValue = this.add.text(x - 10, bestScoreY, `${progress.bestScore}`, {
        font: 'bold 13px Arial',
        color: '#ffffff'
      }).setOrigin(0, 0.5);

      const timeLabel = this.add.text(x + 30, bestScoreY, '⚡', {
        font: '12px Arial',
        color: '#4fc3f7'
      }).setOrigin(0, 0.5);
      const timeValue = this.add.text(x + 50, bestScoreY, formatTime(progress.bestTime), {
        font: 'bold 13px Arial',
        color: '#ffffff'
      }).setOrigin(0, 0.5);

      if (this.levelGridContainer) {
        this.levelGridContainer.add([scoreLabel, scoreValue, timeLabel, timeValue]);
      }
    }

    if (firstCompletionEntry) {
      const firstText = this.add.text(x, y + 78, '🎯 首次通关', {
        font: '12px Arial',
        color: '#81c784'
      }).setOrigin(0.5);
      if (this.levelGridContainer) this.levelGridContainer.add(firstText);
    } else if (progress?.completed) {
      const completedText = this.add.text(x, y + 78, '✓ 已完成', {
        font: '12px Arial',
        color: '#81c784'
      }).setOrigin(0.5);
      if (this.levelGridContainer) this.levelGridContainer.add(completedText);
    }

    if (family && unlocked) {
      const rewardPreviewY = y + 105;
      const rewardLabel = this.add.text(x - 70, rewardPreviewY, '🎁 奖励', {
        font: '12px Arial',
        color: '#ce93d8'
      }).setOrigin(0, 0.5);

      const rewards = family.rewards.slice(0, 2);
      rewards.forEach((reward, idx) => {
        const rewardIcon = this.add.text(x - 10 + idx * 50, rewardPreviewY, reward.icon, {
          font: '16px Arial',
          color: '#ffffff'
        }).setOrigin(0, 0.5);
        if (this.levelGridContainer) this.levelGridContainer.add(rewardIcon);
      });

      if (this.levelGridContainer) this.levelGridContainer.add(rewardLabel);
    }

    if (chapter && !this.currentChapterId) {
      const chapterBadge = this.add.graphics();
      chapterBadge.fillStyle(chapter.primaryColor, 0.9);
      chapterBadge.fillRoundedRect(x - width / 2 + 10, y - height / 2 + 10, 70, 24, 6);

      const chapterLabel = this.add.text(x - width / 2 + 45, y - height / 2 + 22, chapter.theme, {
        font: 'bold 11px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);

      if (this.levelGridContainer) {
        this.levelGridContainer.add(chapterBadge);
        this.levelGridContainer.add(chapterLabel);
      }
    }

    if (isFirstCompletion && firstCompletionEntry) {
      const firstBadge = this.add.graphics();
      firstBadge.fillStyle(0xff9800, 0.95);
      firstBadge.fillRoundedRect(x + width / 2 - 65, y - height / 2 + 10, 55, 22, 6);

      const firstLabel = this.add.text(x + width / 2 - 37, y - height / 2 + 21, '首次', {
        font: 'bold 11px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);

      if (this.levelGridContainer) {
        this.levelGridContainer.add(firstBadge);
        this.levelGridContainer.add(firstLabel);
      }
    }

    if (unlocked) {
      card.setInteractive(
        new Phaser.Geom.Rectangle(x - width / 2, y - height / 2, width, height),
        Phaser.Geom.Rectangle.Contains
      );

      card.on('pointerover', () => {
        card.lineStyle(3, 0xffffff, 1);
      });

      card.on('pointerout', () => {
        card.lineStyle(3, 0xe94560, 1);
      });

      card.on('pointerup', () => {
        this.scene.start('GameScene', { levelId: level.id });
      });
    }
  }

  private drawStars(x: number, y: number, stars: number): void {
    const starSize = 20;
    const spacing = 5;
    const startX = x - starSize - spacing;

    for (let i = 0; i < 3; i++) {
      const starX = startX + i * (starSize + spacing);
      const texture = i < stars ? 'star-filled' : 'star-empty';
      const starImg = this.add.image(starX, y, texture).setDisplaySize(starSize, starSize);
      if (this.levelGridContainer) this.levelGridContainer.add(starImg);
    }
  }

  private addBottomButtons(): void {
    const btnY = 1470;
    const btnW = 220;
    const btnH = 65;
    const spacing = 15;

    const hasClaimable = DailyQuestManager.hasClaimableQuests();
    const claimableCount = DailyQuestManager.getClaimableQuestsCount();
    const dailyQuestLabel = hasClaimable
      ? `📋 委托 (${claimableCount})`
      : '📋 每日委托';

    const chapterBtn = this.createBottomButton(
      375 - btnW - spacing,
      btnY,
      btnW,
      btnH,
      '📖 章节',
      0x9c27b0,
      () => this.scene.start('ChapterSelectScene')
    );

    const questBtn = this.createBottomButton(
      375,
      btnY,
      btnW,
      btnH,
      dailyQuestLabel,
      hasClaimable ? 0xff9800 : 0x03a9f4,
      () => this.scene.start('DailyQuestScene')
    );

    const galleryBtn = this.createBottomButton(
      375 + btnW + spacing,
      btnY,
      btnW,
      btnH,
      '📚 图鉴',
      0x4caf50,
      () => this.scene.start('GalleryScene')
    );
  }

  private createBottomButton(
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

    btn.on('pointerup', onClick);

    return btn;
  }

  private lighten(hex: number, amount: number): number {
    const r = Math.min(255, ((hex >> 16) & 0xff) + amount);
    const g = Math.min(255, ((hex >> 8) & 0xff) + amount);
    const b = Math.min(255, (hex & 0xff) + amount);
    return (r << 16) | (g << 8) | b;
  }
}
