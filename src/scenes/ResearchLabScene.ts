import Phaser from 'phaser';
import { SaveManager } from '../utils/SaveManager';
import {
  PlantCategories,
  SpecimenCategoryMap,
  KnowledgeCategoryInfo,
  getKnowledgeBySpecimen,
  getResearchLevel,
  getExpToNextLevel,
  KnowledgeEntries
} from '../data/ResearchLabConfig';
import { PlantCategory, KnowledgeEntry } from '../types/GameTypes';
import { PlantSpecimens, getPlantSpecimen } from '../data/PlantSpecimens';
import { AllGalleryItems } from '../data/Levels';

type CategoryFilter = 'all' | PlantCategory;

export class ResearchLabScene extends Phaser.Scene {
  private categoryFilter: CategoryFilter = 'all';
  private scrollOffset: number = 0;
  private selectedSpecimenId: number | null = null;

  constructor() {
    super('ResearchLabScene');
  }

  create(): void {
    this.scrollOffset = 0;
    this.addBackground();
    this.addTitle();
    this.addResearcherStats();
    this.addCategoryFilters();
    this.addSpecimenList();
    this.addBackButton();

    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: any[], _dx: number, dy: number) => {
      const maxScroll = this.getMaxScroll();
      this.scrollOffset = Phaser.Math.Clamp(this.scrollOffset + dy, 0, maxScroll);
      this.scene.restart();
    });
  }

  private addBackground(): void {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    const bg = this.add.graphics();
    bg.fillStyle(0x16213e, 1);
    bg.fillRoundedRect(25, 100, 700, 1150, 20);
  }

  private addTitle(): void {
    this.add.text(375, 50, '🔬 植物图鉴研究室', {
      font: 'bold 36px Arial',
      color: '#e94560'
    }).setOrigin(0.5);

    this.add.text(375, 90, '深入研究植物，解锁知识条目', {
      font: '18px Arial',
      color: '#aaaaaa'
    }).setOrigin(0.5);
  }

  private addResearcherStats(): void {
    const statsBg = this.add.graphics();
    statsBg.fillStyle(0x0f3460, 0.9);
    statsBg.fillRoundedRect(45, 115, 660, 95, 15);

    const totalExp = SaveManager.getTotalResearchExp();
    const levelConfig = getResearchLevel(totalExp);
    const expData = getExpToNextLevel(totalExp);
    const points = SaveManager.getResearchPoints();
    const studied = SaveManager.getStudiedSpecimensCount();
    const unlocked = SaveManager.getTotalKnowledgeUnlocked();
    const totalKnowledge = KnowledgeEntries.length;
    const totalSpecimens = Object.keys(PlantSpecimens).length;
    const galleryUnlocked = SaveManager.getUnlockedGalleryItems().length;

    this.add.text(70, 142, '🎓', { font: '26px Arial' }).setOrigin(0, 0.5);
    this.add.text(105, 135, `Lv.${levelConfig.level}`, {
      font: 'bold 22px Arial',
      color: '#ffd700'
    }).setOrigin(0, 0.5);
    this.add.text(105, 158, levelConfig.title, {
      font: '13px Arial',
      color: '#aaaaaa'
    }).setOrigin(0, 0.5);

    const barX = 205;
    const barY = 145;
    const barW = 220;
    const barH = 14;

    this.add.graphics()
      .fillStyle(0x1a1a3a, 1)
      .fillRoundedRect(barX, barY - barH / 2, barW, barH, 7);

    const progressW = Math.floor(barW * expData.progress);
    if (progressW > 0) {
      this.add.graphics()
        .fillStyle(0xffd700, 1)
        .fillRoundedRect(barX, barY - barH / 2, progressW, barH, 7);
    }

    this.add.text(barX + barW / 2, barY, `${expData.current}/${expData.required} EXP`, {
      font: 'bold 11px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(450, 142, '💡', { font: '22px Arial' }).setOrigin(0, 0.5);
    this.add.text(480, 142, `研究点: ${points}`, {
      font: 'bold 16px Arial',
      color: '#00e5ff'
    }).setOrigin(0, 0.5);

    this.add.text(610, 135, `📖 ${unlocked}/${totalKnowledge}`, {
      font: 'bold 13px Arial',
      color: '#4caf50'
    }).setOrigin(0, 0.5);
    this.add.text(610, 158, `🌱 ${studied}/${galleryUnlocked}`, {
      font: 'bold 13px Arial',
      color: '#81c784'
    }).setOrigin(0, 0.5);
  }

  private addCategoryFilters(): void {
    const filterY = 235;
    const filterW = 95;
    const filterH = 40;
    const spacing = 8;

    const allFilter: { id: CategoryFilter; name: string; icon: string; color: number }[] = [
      { id: 'all', name: '全部', icon: '📚', color: 0x607d8b },
      ...PlantCategories.map(c => ({ id: c.id as CategoryFilter, name: c.name, icon: c.icon, color: c.color }))
    ];

    const totalW = filterW * allFilter.length + spacing * (allFilter.length - 1);
    const startX = (750 - totalW) / 2;

    allFilter.forEach((f, index) => {
      const x = startX + index * (filterW + spacing) + filterW / 2;
      const isSelected = this.categoryFilter === f.id;

      const tabBg = this.add.graphics();
      tabBg.fillStyle(isSelected ? f.color : 0x0f3460, isSelected ? 1 : 0.7);
      tabBg.fillRoundedRect(x - filterW / 2, filterY - filterH / 2, filterW, filterH, 8);

      if (isSelected) {
        tabBg.lineStyle(2, 0xffffff, 0.8);
        tabBg.strokeRoundedRect(x - filterW / 2, filterY - filterH / 2, filterW, filterH, 8);
      }

      this.add.text(x, filterY - 4, f.icon, {
        font: '16px Arial'
      }).setOrigin(0.5);
      this.add.text(x, filterY + 13, f.name, {
        font: 'bold 10px Arial',
        color: isSelected ? '#ffffff' : '#aaaaaa'
      }).setOrigin(0.5);

      tabBg.setInteractive(
        new Phaser.Geom.Rectangle(x - filterW / 2, filterY - filterH / 2, filterW, filterH),
        Phaser.Geom.Rectangle.Contains
      );
      tabBg.on('pointerup', () => {
        this.categoryFilter = f.id;
        this.scrollOffset = 0;
        this.scene.restart();
      });
    });
  }

  private getFilteredSpecimens(): number[] {
    const unlockedSpecimenIds = SaveManager.getUnlockedGalleryItems();

    let filtered = unlockedSpecimenIds;
    if (this.categoryFilter !== 'all') {
      filtered = unlockedSpecimenIds.filter(id => SpecimenCategoryMap[id] === this.categoryFilter);
    }

    return filtered.sort((a, b) => {
      const levelA = SaveManager.getSpecimenResearchLevel(a);
      const levelB = SaveManager.getSpecimenResearchLevel(b);
      if (levelB !== levelA) return levelB - levelA;
      return a - b;
    });
  }

  private addSpecimenList(): void {
    const specimens = this.getFilteredSpecimens();
    const allUnlocked = SaveManager.getUnlockedGalleryItems();

    const startY = 295 - this.scrollOffset;
    const cardW = 325;
    const cardH = 200;
    const padding = 15;
    const cols = 2;

    if (specimens.length === 0) {
      this.add.text(375, 550, allUnlocked.length === 0 ? '先完成关卡解锁图鉴标本吧！' : '暂无该分类的标本', {
        font: '20px Arial',
        color: '#888888'
      }).setOrigin(0.5);
      return;
    }

    specimens.forEach((specimenId, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = padding + 25 + col * (cardW + padding) + cardW / 2;
      const y = startY + row * (cardH + padding) + cardH / 2;

      if (y < 230 || y > 1260) return;

      this.createSpecimenCard(x, y, cardW, cardH, specimenId);
    });
  }

  private createSpecimenCard(x: number, y: number, w: number, h: number, specimenId: number): void {
    const specimen = getPlantSpecimen(specimenId);
    if (!specimen) return;

    const category = PlantCategories.find(c => c.id === SpecimenCategoryMap[specimenId]);
    const research = SaveManager.getOrCreateSpecimenResearch(specimenId);
    const knowledgeTotal = getKnowledgeBySpecimen(specimenId).length;
    const knowledgeUnlocked = research.unlockedKnowledge.length;
    const specimenLevel = research.researchLevel;

    const levelColors = [0x9e9e9e, 0x4caf50, 0x2196f3, 0xff9800, 0x9c27b0];
    const borderColor = levelColors[specimenLevel] || 0x9e9e9e;

    const card = this.add.graphics();
    card.fillStyle(0x0f3460, 0.95);
    card.fillRoundedRect(x - w / 2, y - h / 2, w, h, 12);
    card.lineStyle(2.5, borderColor, 0.9);
    card.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 12);

    if (category) {
      const catBadge = this.add.graphics();
      catBadge.fillStyle(category.color, 0.85);
      catBadge.fillRoundedRect(x - w / 2 + 10, y - h / 2 + 10, 80, 24, 6);
      this.add.text(x - w / 2 + 50, y - h / 2 + 22, `${category.icon} ${category.name}`, {
        font: 'bold 10px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);
    }

    const levelBadge = this.add.graphics();
    levelBadge.fillStyle(borderColor, 1);
    levelBadge.fillRoundedRect(x + w / 2 - 55, y - h / 2 + 10, 45, 24, 6);
    this.add.text(x + w / 2 - 32, y - h / 2 + 22, `Lv.${specimenLevel}`, {
      font: 'bold 12px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    const previewKey = `specimen-${specimenId}-preview`;
    if (this.textures.exists(previewKey)) {
      const img = this.add.image(x - w / 2 + 60, y, previewKey);
      img.setDisplaySize(85, 85);
    }

    const infoX = x - w / 2 + 115;
    this.add.text(infoX, y - h / 2 + 50, specimen.name, {
      font: 'bold 19px Arial',
      color: '#ffffff'
    }).setOrigin(0, 0.5);

    this.add.text(infoX, y - h / 2 + 72, specimen.family, {
      font: '13px Arial',
      color: '#aaaaaa'
    }).setOrigin(0, 0.5);

    const expBarX = infoX;
    const expBarY = y - h / 2 + 100;
    const expBarW = w - 140;
    const expBarH = 10;

    this.add.graphics()
      .fillStyle(0x1a1a3a, 1)
      .fillRoundedRect(expBarX, expBarY, expBarW, expBarH, 5);

    const thresholds = [0, 50, 150, 350];
    const currentThreshold = thresholds[specimenLevel] || 0;
    const nextThreshold = thresholds[specimenLevel + 1] || 350;
    const range = nextThreshold - currentThreshold;
    const progress = range > 0 ? Math.min(1, (research.expPoints - currentThreshold) / range) : 1;
    const progressW = Math.floor(expBarW * progress);

    if (progressW > 0) {
      this.add.graphics()
        .fillStyle(borderColor, 1)
        .fillRoundedRect(expBarX, expBarY, progressW, expBarH, 5);
    }

    this.add.text(expBarX + expBarW / 2, expBarY + expBarH / 2 + 1,
      specimenLevel >= 3 ? 'MAX' : `${research.expPoints - currentThreshold}/${range}`, {
      font: 'bold 9px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    const knowledgeBg = this.add.graphics();
    knowledgeBg.fillStyle(0x1a1a3a, 0.8);
    knowledgeBg.fillRoundedRect(infoX, expBarY + 18, expBarW, 30, 6);

    this.add.text(infoX + 10, expBarY + 33, '📖 知识', {
      font: '12px Arial',
      color: '#888888'
    }).setOrigin(0, 0.5);

    this.add.text(infoX + expBarW - 10, expBarY + 33, `${knowledgeUnlocked}/${knowledgeTotal}`, {
      font: 'bold 14px Arial',
      color: knowledgeUnlocked === knowledgeTotal ? '#4caf50' : '#ffd700'
    }).setOrigin(1, 0.5);

    card.setInteractive(
      new Phaser.Geom.Rectangle(x - w / 2, y - h / 2, w, h),
      Phaser.Geom.Rectangle.Contains
    );
    card.on('pointerup', () => {
      this.showSpecimenDetail(specimenId);
    });
  }

  private showSpecimenDetail(specimenId: number): void {
    const specimen = getPlantSpecimen(specimenId);
    if (!specimen) return;

    const research = SaveManager.getOrCreateSpecimenResearch(specimenId);
    const knowledgeEntries = getKnowledgeBySpecimen(specimenId);
    const category = PlantCategories.find(c => c.id === SpecimenCategoryMap[specimenId]);

    const container = this.add.container(0, 0);

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.75);
    overlay.fillRect(0, 0, 750, 1334);
    overlay.setInteractive();
    container.add(overlay);

    const modal = this.add.graphics();
    modal.fillStyle(0x16213e, 1);
    modal.fillRoundedRect(35, 120, 680, 1120, 20);
    modal.lineStyle(3, 0xe94560, 1);
    modal.strokeRoundedRect(35, 120, 680, 1120, 20);
    container.add(modal);

    this.add.text(375, 155, specimen.name, {
      font: 'bold 30px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(375, 185, specimen.family, {
      font: '17px Arial',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    const tagsBg = this.add.graphics();
    tagsBg.fillStyle(0x0f3460, 0.8);
    tagsBg.fillRoundedRect(70, 205, 610, 38, 10);
    container.add(tagsBg);

    let tagX = 105;
    if (category) {
      this.add.text(tagX, 224, `${category.icon} ${category.name}`, {
        font: 'bold 13px Arial',
        color: '#' + category.color.toString(16).padStart(6, '0')
      }).setOrigin(0, 0.5);
      tagX += 150;
    }

    const specimenLevel = research.researchLevel;
    const levelColors = [0x9e9e9e, 0x4caf50, 0x2196f3, 0xff9800, 0x9c27b0];
    const lvlColor = levelColors[specimenLevel] || 0x9e9e9e;
    this.add.text(tagX, 224, `🔬 研究等级: Lv.${specimenLevel}`, {
      font: 'bold 13px Arial',
      color: '#' + lvlColor.toString(16).padStart(6, '0')
    }).setOrigin(0, 0.5);
    tagX += 150;

    const kunlocked = research.unlockedKnowledge.length;
    const ktotal = knowledgeEntries.length;
    this.add.text(tagX, 224, `📖 ${kunlocked}/${ktotal}`, {
      font: 'bold 13px Arial',
      color: kunlocked === ktotal ? '#4caf50' : '#ffd700'
    }).setOrigin(0, 0.5);

    const targetKey = `specimen-${specimenId}-target`;
    const previewKey = `specimen-${specimenId}-preview`;
    const displayKey = this.textures.exists(targetKey) ? targetKey : previewKey;
    if (this.textures.exists(displayKey)) {
      const img = this.add.image(375, 335, displayKey);
      img.setDisplaySize(280, 224);
      container.add(img);
    }

    const expSectionY = 475;
    const expBg = this.add.graphics();
    expBg.fillStyle(0x0f3460, 0.9);
    expBg.fillRoundedRect(65, expSectionY, 620, 70, 12);
    container.add(expBg);

    const thresholds = [0, 50, 150, 350];
    const nextIdx = Math.min(specimenLevel + 1, thresholds.length - 1);
    const currThresh = thresholds[specimenLevel];
    const nextThresh = thresholds[nextIdx];
    const range = nextThresh - currThresh;
    const progressPct = specimenLevel >= 3 ? 1 : Math.min(1, (research.expPoints - currThresh) / Math.max(1, range));

    this.add.text(90, expSectionY + 22, `研究经验`, {
      font: 'bold 15px Arial',
      color: '#ffd700'
    }).setOrigin(0, 0.5);
    this.add.text(660, expSectionY + 22,
      specimenLevel >= 3 ? 'MAX' : `${research.expPoints - currThresh}/${range}`, {
      font: 'bold 14px Arial',
      color: '#ffd700'
    }).setOrigin(1, 0.5);

    const barX = 90;
    const barY = expSectionY + 42;
    const barW = 570;
    const barH = 14;

    this.add.graphics()
      .fillStyle(0x1a1a3a, 1)
      .fillRoundedRect(barX, barY - barH / 2, barW, barH, 7);

    const pw = Math.floor(barW * progressPct);
    if (pw > 0) {
      this.add.graphics()
        .fillStyle(lvlColor, 1)
        .fillRoundedRect(barX, barY - barH / 2, pw, barH, 7);
    }

    const studyBtnBg = this.add.graphics();
    const canStudy = SaveManager.canStudySpecimen(specimenId);
    const studyCost = 50;
    const studyBtnY = expSectionY + 90;
    studyBtnBg.fillStyle(canStudy ? 0x4caf50 : 0x555566, canStudy ? 1 : 0.6);
    studyBtnBg.fillRoundedRect(65, studyBtnY, 620, 50, 12);
    container.add(studyBtnBg);

    this.add.text(375, studyBtnY + 25,
      canStudy ? `🔬 开始研究（消耗 ${studyCost} 研究点）` : `💡 研究点不足（需要 ${studyCost} 点）`, {
      font: 'bold 17px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    if (canStudy) {
      studyBtnBg.setInteractive(
        new Phaser.Geom.Rectangle(65, studyBtnY, 620, 50),
        Phaser.Geom.Rectangle.Contains
      );
      studyBtnBg.on('pointerup', () => {
        const result = SaveManager.studySpecimen(specimenId);
        if (result.success) {
          this.cameras.main.flash(250, 76, 175, 80);
          container.destroy();
          this.showStudyResult(specimenId, result);
        }
      });
    }

    const knowledgeSectionY = studyBtnY + 75;
    this.add.text(75, knowledgeSectionY, '📜 知识条目', {
      font: 'bold 18px Arial',
      color: '#e94560'
    }).setOrigin(0, 0.5);

    this.add.text(665, knowledgeSectionY, `${kunlocked}/${ktotal}`, {
      font: 'bold 15px Arial',
      color: kunlocked === ktotal ? '#4caf50' : '#ffd700'
    }).setOrigin(1, 0.5);

    const categories: Array<'biology' | 'ecology' | 'culture' | 'usage'> = ['biology', 'ecology', 'culture', 'usage'];
    let cardY = knowledgeSectionY + 30;

    categories.forEach(catKey => {
      const catInfo = KnowledgeCategoryInfo[catKey];
      const entries = knowledgeEntries.filter(k => k.category === catKey);
      if (entries.length === 0) return;

      const catBg = this.add.graphics();
      catBg.fillStyle(catInfo.color, 0.15);
      catBg.fillRoundedRect(65, cardY, 620, 28, 6);
      catBg.lineStyle(1, catInfo.color, 0.4);
      catBg.strokeRoundedRect(65, cardY, 620, 28, 6);
      container.add(catBg);

      this.add.text(85, cardY + 14, `${catInfo.icon} ${catInfo.name}`, {
        font: 'bold 13px Arial',
        color: '#' + catInfo.color.toString(16).padStart(6, '0')
      }).setOrigin(0, 0.5);

      cardY += 38;

      entries.forEach(entry => {
        const isUnlocked = research.unlockedKnowledge.includes(entry.id);
        const reqSpecimenLevel = entry.requiredLevel - 1;
        const meetsSpecimen = specimenLevel >= reqSpecimenLevel;
        const meetsResearcher = SaveManager.getResearcherLevel() >= entry.requiredLevel;
        const canUnlockSoon = meetsSpecimen && meetsResearcher;

        const entryH = isUnlocked ? 90 : 55;
        const entryBg = this.add.graphics();
        entryBg.fillStyle(isUnlocked ? 0x0f3460 : 0x1e1e30, 0.9);
        entryBg.fillRoundedRect(65, cardY, 620, entryH, 10);
        entryBg.lineStyle(1.5, isUnlocked ? catInfo.color : 0x333344, isUnlocked ? 0.6 : 0.3);
        entryBg.strokeRoundedRect(65, cardY, 620, entryH, 10);
        container.add(entryBg);

        if (isUnlocked) {
          this.add.text(85, cardY + 22, `✅ ${entry.title}`, {
            font: 'bold 15px Arial',
            color: '#' + catInfo.color.toString(16).padStart(6, '0')
          }).setOrigin(0, 0.5);

          this.add.text(665, cardY + 22, `需Lv.${entry.requiredLevel}`, {
            font: '11px Arial',
            color: '#666666'
          }).setOrigin(1, 0.5);

          this.add.text(85, cardY + 55, entry.content, {
            font: '13px Arial',
            color: '#cccccc',
            align: 'left',
            wordWrap: { width: 580 }
          }).setOrigin(0, 0);
        } else {
          this.add.text(85, cardY + 18, `🔒 ${entry.title}`, {
            font: 'bold 14px Arial',
            color: canUnlockSoon ? '#ffd700' : '#555566'
          }).setOrigin(0, 0.5);

          let hint = '';
          if (!meetsResearcher) {
            hint = `研究员Lv.${entry.requiredLevel}解锁`;
          } else if (!meetsSpecimen) {
            hint = `标本Lv.${reqSpecimenLevel}解锁 (当前Lv.${specimenLevel})`;
          }

          this.add.text(665, cardY + 18, hint, {
            font: '11px Arial',
            color: canUnlockSoon ? '#ffd700' : '#555566'
          }).setOrigin(1, 0.5);

          if (canUnlockSoon) {
            this.add.text(375, cardY + 40, '💡 继续研究即可解锁！', {
              font: '11px Arial',
              color: '#81c784'
            }).setOrigin(0.5);
          }
        }

        cardY += entryH + 8;
      });

      cardY += 10;
    });

    const closeBtn = this.add.graphics();
    const closeBtnY = cardY + 20;
    closeBtn.fillStyle(0xe94560, 1);
    closeBtn.fillRoundedRect(225, closeBtnY, 300, 55, 14);
    container.add(closeBtn);

    this.add.text(375, closeBtnY + 27, '关闭', {
      font: 'bold 20px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    const close = () => {
      container.destroy();
      this.scene.restart();
    };

    closeBtn.setInteractive(
      new Phaser.Geom.Rectangle(225, closeBtnY, 300, 55),
      Phaser.Geom.Rectangle.Contains
    );
    closeBtn.on('pointerup', close);
    overlay.on('pointerup', () => {
      container.destroy();
      this.scene.restart();
    });
  }

  private showStudyResult(
    specimenId: number,
    result: {
      success: boolean;
      gainedExp: number;
      newlyUnlockedKnowledge: string[];
      leveledUp: boolean;
      newResearcherLevel: number;
      newSpecimenLevel: number;
      unlockMessage?: string;
    }
  ): void {
    const specimen = getPlantSpecimen(specimenId);
    if (!specimen) return;

    const container = this.add.container(0, 0);

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.85);
    overlay.fillRect(0, 0, 750, 1334);
    overlay.setInteractive();
    container.add(overlay);

    const hasNewKnowledge = result.newlyUnlockedKnowledge.length > 0;
    const hasLevelUp = result.leveledUp;
    const baseH = hasNewKnowledge ? 780 : 520;
    const modalY = hasNewKnowledge ? 260 : 380;

    const modal = this.add.graphics();
    modal.fillStyle(0x16213e, 1);
    modal.fillRoundedRect(75, modalY, 600, baseH, 24);
    modal.lineStyle(4, 0x4caf50, 1);
    modal.strokeRoundedRect(75, modalY, 600, baseH, 24);
    container.add(modal);

    this.add.text(375, modalY + 55, '🎉 研究成功！', {
      font: 'bold 34px Arial',
      color: '#4caf50'
    }).setOrigin(0.5);

    const previewKey = `specimen-${specimenId}-preview`;
    if (this.textures.exists(previewKey)) {
      const img = this.add.image(375, modalY + 165, previewKey);
      img.setDisplaySize(180, 144);
      container.add(img);
    }

    this.add.text(375, modalY + 260, specimen.name, {
      font: 'bold 24px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    const rewardsBg = this.add.graphics();
    rewardsBg.fillStyle(0x0f3460, 0.9);
    rewardsBg.fillRoundedRect(110, modalY + 290, 530, 70, 12);
    container.add(rewardsBg);

    this.add.text(150, modalY + 315, '✨ 获得经验', {
      font: 'bold 16px Arial',
      color: '#aaaaaa'
    }).setOrigin(0, 0.5);

    this.add.text(600, modalY + 315, `+${result.gainedExp} EXP`, {
      font: 'bold 22px Arial',
      color: '#ffd700'
    }).setOrigin(1, 0.5);

    const levelsBg = this.add.graphics();
    levelsBg.fillStyle(0x0f3460, 0.9);
    levelsBg.fillRoundedRect(110, modalY + 375, 530, 60, 12);
    container.add(levelsBg);

    this.add.text(150, modalY + 395, `🎓 研究员 Lv.${result.newResearcherLevel}`, {
      font: 'bold 15px Arial',
      color: '#00e5ff'
    }).setOrigin(0, 0.5);

    this.add.text(600, modalY + 395, `🌱 标本 Lv.${result.newSpecimenLevel}`, {
      font: 'bold 15px Arial',
      color: '#81c784'
    }).setOrigin(1, 0.5);

    if (hasLevelUp && result.unlockMessage) {
      const levelUpBg = this.add.graphics();
      levelUpBg.fillStyle(0xffd700, 0.15);
      levelUpBg.fillRoundedRect(110, modalY + 450, 530, 40, 10);
      levelUpBg.lineStyle(2, 0xffd700, 0.5);
      levelUpBg.strokeRoundedRect(110, modalY + 450, 530, 40, 10);
      container.add(levelUpBg);
      this.add.text(375, modalY + 470, `⬆️ ${result.unlockMessage}`, {
        font: 'bold 15px Arial',
        color: '#ffd700'
      }).setOrigin(0.5);
    }

    let currentY = modalY + (hasLevelUp ? 510 : 500);

    if (hasNewKnowledge) {
      this.add.text(130, currentY, `📖 解锁知识条目 (${result.newlyUnlockedKnowledge.length})`, {
        font: 'bold 17px Arial',
        color: '#e94560'
      }).setOrigin(0, 0.5);
      currentY += 35;

      const allKnowledge = getKnowledgeBySpecimen(specimenId);
      result.newlyUnlockedKnowledge.slice(0, 2).forEach(kId => {
        const entry = allKnowledge.find(k => k.id === kId);
        if (!entry) return;
        const catInfo = KnowledgeCategoryInfo[entry.category];

        const kBg = this.add.graphics();
        kBg.fillStyle(catInfo.color, 0.12);
        kBg.fillRoundedRect(110, currentY, 530, 75, 10);
        kBg.lineStyle(1.5, catInfo.color, 0.5);
        kBg.strokeRoundedRect(110, currentY, 530, 75, 10);
        container.add(kBg);

        this.add.text(135, currentY + 18, `${catInfo.icon} ${entry.title}`, {
          font: 'bold 14px Arial',
          color: '#' + catInfo.color.toString(16).padStart(6, '0')
        }).setOrigin(0, 0.5);

        this.add.text(135, currentY + 42, entry.content, {
          font: '12px Arial',
          color: '#cccccc',
          align: 'left',
          wordWrap: { width: 480 }
        }).setOrigin(0, 0);

        currentY += 85;
      });

      if (result.newlyUnlockedKnowledge.length > 2) {
        this.add.text(375, currentY + 10, `...还有 ${result.newlyUnlockedKnowledge.length - 2} 条新知识`, {
          font: '13px Arial',
          color: '#81c784'
        }).setOrigin(0.5);
        currentY += 30;
      }
    }

    const btnY = currentY + 15;
    const confirmBtn = this.add.graphics();
    confirmBtn.fillStyle(0x4caf50, 1);
    confirmBtn.fillRoundedRect(200, btnY, 350, 55, 14);
    container.add(confirmBtn);

    this.add.text(375, btnY + 27, hasNewKnowledge ? '查看详情' : '继续研究', {
      font: 'bold 20px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    confirmBtn.setInteractive(
      new Phaser.Geom.Rectangle(200, btnY, 350, 55),
      Phaser.Geom.Rectangle.Contains
    );
    confirmBtn.on('pointerup', () => {
      container.destroy();
      this.showSpecimenDetail(specimenId);
    });

    overlay.on('pointerup', () => {
      container.destroy();
      this.scene.restart();
    });
  }

  private addBackButton(): void {
    const btnX = 375;
    const btnY = 1260;

    const btn = this.add.graphics();
    btn.fillStyle(0xe94560, 1);
    btn.fillRoundedRect(btnX - 150, btnY - 30, 300, 60, 15);
    btn.setInteractive(
      new Phaser.Geom.Rectangle(btnX - 150, btnY - 30, 300, 60),
      Phaser.Geom.Rectangle.Contains
    );

    this.add.text(btnX, btnY, '返回', {
      font: 'bold 24px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    btn.on('pointerover', () => {
      btn.clear();
      btn.fillStyle(0xff6b8a, 1);
      btn.fillRoundedRect(btnX - 150, btnY - 30, 300, 60, 15);
    });

    btn.on('pointerout', () => {
      btn.clear();
      btn.fillStyle(0xe94560, 1);
      btn.fillRoundedRect(btnX - 150, btnY - 30, 300, 60, 15);
    });

    btn.on('pointerup', () => {
      this.scene.start('ChapterSelectScene');
    });
  }

  private getMaxScroll(): number {
    const specimens = this.getFilteredSpecimens();
    const rows = Math.ceil(specimens.length / 2);
    const contentH = rows * 215 + 295;
    return Math.max(0, contentH - 970);
  }
}
