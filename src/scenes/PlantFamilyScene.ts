import Phaser from 'phaser';
import { PlantFamilies, getPlantFamilyById, getFamilyRewardById } from '../data/PlantFamilies';
import { SaveManager } from '../utils/SaveManager';
import { PlantFamily, FamilyReward, PlantSpecimen } from '../types/GameTypes';
import { PlantSpecimens, getPlantSpecimen } from '../data/PlantSpecimens';
import { getGalleryItemById } from '../data/Levels';

type ViewMode = 'list' | 'detail';

export class PlantFamilyScene extends Phaser.Scene {
  private viewMode: ViewMode = 'list';
  private selectedFamilyId: string | null = null;
  private scrollContainer: Phaser.GameObjects.Container | null = null;
  private scrollStartY = 0;
  private scrollContentY = 0;
  private isDragging = false;

  constructor() {
    super('PlantFamilyScene');
  }

  create(): void {
    this.addBackground();
    this.addTitle();
    this.addStatsBar();
    this.addFamilyList();
    this.addBackButton();
  }

  private addBackground(): void {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    const bg = this.add.graphics();
    bg.fillStyle(0x16213e, 1);
    bg.fillRoundedRect(25, 100, 700, 1150, 20);
  }

  private addTitle(): void {
    this.add.text(375, 60, '植物家族收藏册', {
      font: 'bold 42px Arial',
      color: '#e94560'
    }).setOrigin(0.5);

    const subtitle = this.viewMode === 'list' ? '按科属探索植物世界' : '家族详情';
    this.add.text(375, 100, subtitle, {
      font: '28px Arial',
      color: '#eaeaea'
    }).setOrigin(0.5);
  }

  private addStatsBar(): void {
    const statsBg = this.add.graphics();
    statsBg.fillStyle(0x0f3460, 0.8);
    statsBg.fillRoundedRect(45, 130, 660, 60, 12);

    const totalFamilies = PlantFamilies.length;
    const completedFamilies = SaveManager.getTotalFamiliesCompleted();
    const unlockedSpecimens = SaveManager.getUnlockedGalleryItems().length;
    const totalSpecimens = Object.values(PlantSpecimens).length;

    this.add.text(65, 160, '🌿', { font: '22px Arial' }).setOrigin(0, 0.5);
    this.add.text(95, 160, `${completedFamilies}/${totalFamilies}`, {
      font: 'bold 16px Arial',
      color: '#4caf50'
    }).setOrigin(0, 0.5);

    this.add.text(240, 160, '🌸', { font: '22px Arial' }).setOrigin(0, 0.5);
    this.add.text(270, 160, `${unlockedSpecimens}/${totalSpecimens}`, {
      font: 'bold 16px Arial',
      color: '#ffd700'
    }).setOrigin(0, 0.5);

    const limitedFamilies = PlantFamilies.filter(f => f.isLimited).length;
    this.add.text(420, 160, '✨', { font: '22px Arial' }).setOrigin(0, 0.5);
    this.add.text(450, 160, `限定: ${limitedFamilies}`, {
      font: 'bold 16px Arial',
      color: '#e91e63'
    }).setOrigin(0, 0.5);
  }

  private addFamilyList(): void {
    this.viewMode = 'list';
    this.clearScrollContent();

    const scrollBg = this.add.graphics();
    scrollBg.fillStyle(0x16213e, 0);
    scrollBg.fillRect(0, 210, 750, 1000);

    this.scrollContainer = this.add.container(0, 0);
    this.scrollContainer.setSize(750, 1000);
    this.scrollContainer.setInteractive(
      new Phaser.Geom.Rectangle(0, 210, 750, 1000),
      Phaser.Geom.Rectangle.Contains
    );

    this.scrollContainer.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.isDragging = true;
      this.scrollStartY = pointer.y;
      this.scrollContentY = this.scrollContainer!.y;
    });

    this.scrollContainer.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging) return;
      const deltaY = pointer.y - this.scrollStartY;
      const newY = this.scrollContentY + deltaY;
      const maxY = 0;
      const minY = -Math.max(0, PlantFamilies.length * 200 - 900);
      this.scrollContainer!.y = Phaser.Math.Clamp(newY, minY, maxY);
    });

    this.scrollContainer.on('pointerup', () => {
      this.isDragging = false;
    });

    this.scrollContainer.on('pointerout', () => {
      this.isDragging = false;
    });

    const startY = 290;
    const itemHeight = 180;
    const padding = 20;

    PlantFamilies.forEach((family, index) => {
      const y = startY + index * (itemHeight + padding);
      this.createFamilyCard(375, y, 660, itemHeight, family);
    });
  }

  private createFamilyCard(
    x: number,
    y: number,
    width: number,
    height: number,
    family: PlantFamily
  ): void {
    const progressPercent = SaveManager.getFamilyProgressPercent(family.id);
    const isComplete = progressPercent >= 100;
    const hasUnlocked = SaveManager.getFamilyUnlockedSpecimens(family.id).length > 0;

    const card = this.add.graphics();
    card.fillStyle(hasUnlocked ? family.primaryColor : 0x333344, 0.15);
    
    const borderColor = isComplete 
      ? family.primaryColor 
      : (hasUnlocked ? family.secondaryColor : 0x555566);
    
    card.lineStyle(3, borderColor, hasUnlocked ? 1 : 0.5);
    card.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 16);
    card.fillRoundedRect(x - width / 2, y - height / 2, width, height, 16);

    const scrollItems: Phaser.GameObjects.GameObject[] = [card];

    const iconBg = this.add.graphics();
    iconBg.fillStyle(family.primaryColor, hasUnlocked ? 0.9 : 0.5);
    iconBg.fillCircle(x - width / 2 + 70, y, 55);
    scrollItems.push(iconBg);

    this.add.text(x - width / 2 + 70, y, family.icon, {
      font: '40px Arial'
    }).setOrigin(0.5);

    this.add.text(x - width / 2 + 150, y - 40, `${family.familyName} · ${family.genusName}`, {
      font: 'bold 22px Arial',
      color: hasUnlocked ? '#ffffff' : '#888888'
    }).setOrigin(0, 0.5);

    this.add.text(x - width / 2 + 150, y - 5, family.description, {
      font: '14px Arial',
      color: hasUnlocked ? '#aaaaaa' : '#666666',
      wordWrap: { width: 400 }
    }).setOrigin(0, 0.5);

    const unlockedCount = SaveManager.getFamilyUnlockedSpecimens(family.id).length;
    const totalCount = family.specimenIds.length;
    
    this.add.text(x - width / 2 + 150, y + 35, `收藏: ${unlockedCount}/${totalCount}`, {
      font: 'bold 16px Arial',
      color: '#4caf50'
    }).setOrigin(0, 0.5);

    const progressBg = this.add.graphics();
    progressBg.fillStyle(0x333344, 1);
    progressBg.fillRoundedRect(x - width / 2 + 150, y + 55, 350, 12, 6);
    scrollItems.push(progressBg);

    const progressFill = this.add.graphics();
    progressFill.fillStyle(family.primaryColor, 1);
    progressFill.fillRoundedRect(x - width / 2 + 150, y + 55, 350 * (progressPercent / 100), 12, 6);
    scrollItems.push(progressFill);

    this.add.text(x + width / 2 - 60, y + 61, `${progressPercent}%`, {
      font: 'bold 14px Arial',
      color: '#ffffff'
    }).setOrigin(1, 0.5);

    if (family.isLimited) {
      const limitedBadge = this.add.graphics();
      limitedBadge.fillStyle(0xe91e63, 0.9);
      limitedBadge.fillRoundedRect(x + width / 2 - 80, y - height / 2 + 15, 70, 26, 13);
      this.add.text(x + width / 2 - 45, y - height / 2 + 28, '限定', {
        font: 'bold 12px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);
      scrollItems.push(limitedBadge);
    }

    const availableRewards = family.rewards.filter(r => 
      SaveManager.canClaimFamilyReward(family.id, r.id)
    );
    if (availableRewards.length > 0) {
      const rewardBadge = this.add.graphics();
      rewardBadge.fillStyle(0xffd700, 1);
      rewardBadge.fillCircle(x + width / 2 - 25, y - height / 2 + 25, 16);
      this.add.text(x + width / 2 - 25, y - height / 2 + 25, '!', {
        font: 'bold 18px Arial',
        color: '#1a1a2e'
      }).setOrigin(0.5);
      scrollItems.push(rewardBadge);
    }

    card.setInteractive(
      new Phaser.Geom.Rectangle(x - width / 2, y - height / 2, width, height),
      Phaser.Geom.Rectangle.Contains
    );

    card.on('pointerover', () => {
      if (!this.isDragging) {
        card.clear();
        card.fillStyle(hasUnlocked ? family.primaryColor : 0x444455, 0.25);
        card.lineStyle(3, borderColor, 1);
        card.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 16);
        card.fillRoundedRect(x - width / 2, y - height / 2, width, height, 16);
      }
    });

    card.on('pointerout', () => {
      card.clear();
      card.fillStyle(hasUnlocked ? family.primaryColor : 0x333344, 0.15);
      card.lineStyle(3, borderColor, hasUnlocked ? 1 : 0.5);
      card.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 16);
      card.fillRoundedRect(x - width / 2, y - height / 2, width, height, 16);
    });

    card.on('pointerup', () => {
      if (!this.isDragging) {
        this.showFamilyDetail(family);
      }
    });

    this.scrollContainer?.add(scrollItems);
  }

  private showFamilyDetail(family: PlantFamily): void {
    this.viewMode = 'detail';
    this.selectedFamilyId = family.id;
    this.clearScrollContent();

    const container = this.add.container(0, 0);

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.85);
    overlay.fillRect(0, 0, 750, 1334);
    overlay.setInteractive();
    container.add(overlay);

    const modalBg = this.add.graphics();
    modalBg.fillStyle(0x16213e, 1);
    modalBg.fillRoundedRect(25, 120, 700, 1100, 24);
    modalBg.lineStyle(4, family.primaryColor, 1);
    modalBg.strokeRoundedRect(25, 120, 700, 1100, 24);
    container.add(modalBg);

    const headerBg = this.add.graphics();
    headerBg.fillStyle(family.primaryColor, 0.3);
    headerBg.fillRoundedRect(45, 140, 660, 100, 16);
    container.add(headerBg);

    this.add.text(85, 170, family.icon, {
      font: '50px Arial'
    }).setOrigin(0, 0.5);

    this.add.text(160, 160, `${family.familyName} · ${family.genusName}`, {
      font: 'bold 26px Arial',
      color: '#ffffff'
    }).setOrigin(0, 0.5);

    this.add.text(160, 195, family.featureDescription, {
      font: '14px Arial',
      color: '#cccccc',
      wordWrap: { width: 500 }
    }).setOrigin(0, 0.5);

    const progressPercent = SaveManager.getFamilyProgressPercent(family.id);
    const isComplete = progressPercent >= 100;

    const progressLabel = this.add.text(605, 170, `${progressPercent}%`, {
      font: 'bold 28px Arial',
      color: isComplete ? '#4caf50' : '#ffd700'
    }).setOrigin(1, 0.5);
    container.add(progressLabel);

    const sectionsStartY = 270;
    let currentY = sectionsStartY;

    const sectionTitleSpecimens = this.add.text(60, currentY, '🌱 家族成员', {
      font: 'bold 22px Arial',
      color: '#e94560'
    }).setOrigin(0, 0.5);
    container.add(sectionTitleSpecimens);
    currentY += 30;

    family.specimenIds.forEach((specimenId, index) => {
      const specimen = getPlantSpecimen(specimenId);
      const isUnlocked = SaveManager.isGalleryUnlocked(specimenId);
      
      const itemBg = this.add.graphics();
      itemBg.fillStyle(0x0f3460, 0.8);
      itemBg.fillRoundedRect(60, currentY, 630, 80, 12);
      container.add(itemBg);

      if (isUnlocked) {
        const previewKey = `specimen-${specimenId}-preview`;
        const img = this.add.image(100, currentY + 40, previewKey);
        img.setDisplaySize(60, 60);
        container.add(img);

        this.add.text(150, currentY + 25, specimen?.name || '未知', {
          font: 'bold 18px Arial',
          color: '#ffffff'
        }).setOrigin(0, 0.5);

        this.add.text(150, currentY + 55, `${specimen?.family} · ${specimen?.genus}`, {
          font: '13px Arial',
          color: '#aaaaaa'
        }).setOrigin(0, 0.5);

        const galleryItem = getGalleryItemById(specimenId);
        if (galleryItem) {
          const progress = SaveManager.getProgress(galleryItem.id);
          if (progress) {
            this.drawMiniStars(640, currentY + 40, progress.stars, container);
          }
        }
      } else {
        this.add.image(100, currentY + 40, 'lock').setScale(0.8);
        
        this.add.text(150, currentY + 40, '???', {
          font: 'bold 18px Arial',
          color: '#666666'
        }).setOrigin(0, 0.5);
      }

      currentY += 90;
    });

    currentY += 20;

    const sectionTitleRewards = this.add.text(60, currentY, '🎁 套装奖励', {
      font: 'bold 22px Arial',
      color: '#e94560'
    }).setOrigin(0, 0.5);
    container.add(sectionTitleRewards);
    currentY += 30;

    family.rewards.forEach((reward, index) => {
      const isClaimed = SaveManager.isFamilyRewardClaimed(family.id, reward.id);
      const canClaim = SaveManager.canClaimFamilyReward(family.id, reward.id);
      
      const rewardBg = this.add.graphics();
      const bgColor = isClaimed ? 0x2e7d32 : (canClaim ? family.primaryColor : 0x333344);
      rewardBg.fillStyle(bgColor, isClaimed || canClaim ? 0.9 : 0.6);
      rewardBg.fillRoundedRect(60, currentY, 630, 70, 12);
      
      if (canClaim) {
        rewardBg.lineStyle(2, 0xffd700, 1);
        rewardBg.strokeRoundedRect(60, currentY, 630, 70, 12);
      }
      container.add(rewardBg);

      const rarityColors: Record<string, number> = {
        common: 0x9e9e9e,
        rare: 0x2196f3,
        epic: 0x9c27b0,
        legendary: 0xffd700
      };
      const rarityColor = rarityColors[reward.rarity] || 0x9e9e9e;

      const rarityBadge = this.add.graphics();
      rarityBadge.fillStyle(rarityColor, 1);
      rarityBadge.fillCircle(95, currentY + 35, 22);
      container.add(rarityBadge);

      this.add.text(95, currentY + 35, reward.icon, {
        font: '20px Arial'
      }).setOrigin(0.5);

      this.add.text(135, currentY + 22, reward.name, {
        font: 'bold 16px Arial',
        color: isClaimed || canClaim ? '#ffffff' : '#888888'
      }).setOrigin(0, 0.5);

      this.add.text(135, currentY + 48, reward.description, {
        font: '12px Arial',
        color: isClaimed || canClaim ? '#cccccc' : '#666666'
      }).setOrigin(0, 0.5);

      this.add.text(620, currentY + 35, `进度: ${reward.requiredProgress}%`, {
        font: 'bold 12px Arial',
        color: '#aaaaaa'
      }).setOrigin(1, 0.5);

      if (isClaimed) {
        this.add.text(620, currentY + 55, '✓ 已领取', {
          font: 'bold 12px Arial',
          color: '#4caf50'
        }).setOrigin(1, 0.5);
      } else if (canClaim) {
        const claimBtn = this.add.graphics();
        claimBtn.fillStyle(0xffd700, 1);
        claimBtn.fillRoundedRect(620 - 60, currentY + 20, 60, 30, 6);
        container.add(claimBtn);

        this.add.text(620 - 30, currentY + 35, '领取', {
          font: 'bold 13px Arial',
          color: '#1a1a2e'
        }).setOrigin(0.5);

        claimBtn.setInteractive(
          new Phaser.Geom.Rectangle(620 - 60, currentY + 20, 60, 30),
          Phaser.Geom.Rectangle.Contains
        );

        claimBtn.on('pointerup', () => {
          this.claimReward(family.id, reward.id, container);
        });
      }

      currentY += 80;
    });

    currentY += 20;

    const sectionTitleIllustration = this.add.text(60, currentY, '🖼️ 专属插画', {
      font: 'bold 22px Arial',
      color: '#e94560'
    }).setOrigin(0, 0.5);
    container.add(sectionTitleIllustration);
    currentY += 30;

    const illustrationUnlocked = SaveManager.isFamilyIllustrationUnlocked(family.id);
    const illustrationBg = this.add.graphics();
    
    if (illustrationUnlocked) {
      illustrationBg.fillStyle(family.primaryColor, 0.15);
      illustrationBg.lineStyle(3, family.primaryColor, 0.8);
    } else {
      illustrationBg.fillStyle(0x333344, 0.8);
      illustrationBg.lineStyle(2, 0x555566, 0.5);
    }
    illustrationBg.fillRoundedRect(60, currentY, 630, 200, 16);
    illustrationBg.strokeRoundedRect(60, currentY, 630, 200, 16);
    container.add(illustrationBg);

    if (illustrationUnlocked) {
      const illustrationColors = [family.primaryColor, family.secondaryColor, family.accentColor];
      this.createIllustrationArt(375, currentY + 100, 500, 160, illustrationColors, family);
      
      this.add.text(375, currentY + 180, family.illustrationTitle, {
        font: 'bold 18px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);

      const viewBtn = this.add.graphics();
      viewBtn.fillStyle(family.primaryColor, 1);
      viewBtn.fillRoundedRect(375 - 80, currentY + 200, 160, 40, 8);
      container.add(viewBtn);

      this.add.text(375, currentY + 220, '查看大图', {
        font: 'bold 15px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);

      viewBtn.setInteractive(
        new Phaser.Geom.Rectangle(375 - 80, currentY + 200, 160, 40),
        Phaser.Geom.Rectangle.Contains
      );

      viewBtn.on('pointerup', () => {
        this.showFullIllustration(family);
      });
    } else {
      this.add.image(375, currentY + 80, 'lock').setScale(1.5);
      
      this.add.text(375, currentY + 140, '收集进度达到100%解锁', {
        font: 'bold 16px Arial',
        color: '#888888'
      }).setOrigin(0.5);

      this.add.text(375, currentY + 170, `当前进度: ${progressPercent}%`, {
        font: '14px Arial',
        color: '#666666'
      }).setOrigin(0.5);
    }

    const closeBtn = this.add.graphics();
    closeBtn.fillStyle(0xe94560, 1);
    closeBtn.fillRoundedRect(275, 1180, 200, 55, 15);
    closeBtn.setInteractive(
      new Phaser.Geom.Rectangle(275, 1180, 200, 55),
      Phaser.Geom.Rectangle.Contains
    );
    container.add(closeBtn);

    this.add.text(375, 1207, '返回列表', {
      font: 'bold 20px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    const close = () => {
      container.destroy();
      this.addFamilyList();
    };

    closeBtn.on('pointerup', close);
    overlay.on('pointerup', close);
  }

  private drawEllipse(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    radiusX: number,
    radiusY: number,
    rotation: number
  ): void {
    const points = 32;
    graphics.beginPath();
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const px = x + Math.cos(angle) * radiusX * Math.cos(rotation) - Math.sin(angle) * radiusY * Math.sin(rotation);
      const py = y + Math.cos(angle) * radiusX * Math.sin(rotation) + Math.sin(angle) * radiusY * Math.cos(rotation);
      if (i === 0) {
        graphics.moveTo(px, py);
      } else {
        graphics.lineTo(px, py);
      }
    }
    graphics.closePath();
  }

  private createIllustrationArt(
    x: number,
    y: number,
    width: number,
    height: number,
    colors: number[],
    family: PlantFamily
  ): void {
    const art = this.add.graphics();
    
    art.fillGradientStyle(colors[0], colors[1], colors[1], colors[0], 1);
    art.fillRoundedRect(x - width / 2, y - height / 2, width, height, 12);

    for (let i = 0; i < 5; i++) {
      const leafX = x - width / 2 + 50 + i * 100;
      const leafY = y + (i % 2 === 0 ? -20 : 20);
      const leafSize = 30 + Math.random() * 20;
      
      art.fillStyle(colors[2] || 0x4caf50, 0.7);
      this.drawEllipse(art, leafX, leafY, leafSize, leafSize * 0.6, Math.PI / 4);
      art.fill();
    }

    for (let i = 0; i < 3; i++) {
      const flowerX = x - width / 2 + 100 + i * 150;
      const flowerY = y - 10 + (i % 2 === 0 ? 15 : -15);
      
      art.fillStyle(colors[1], 0.9);
      for (let p = 0; p < 6; p++) {
        const angle = (p / 6) * Math.PI * 2;
        const petalX = flowerX + Math.cos(angle) * 18;
        const petalY = flowerY + Math.sin(angle) * 18;
        this.drawEllipse(art, petalX, petalY, 15, 10, angle);
        art.fill();
      }
      
      art.fillStyle(0xffd700, 1);
      art.beginPath();
      art.arc(flowerX, flowerY, 10, 0, Math.PI * 2);
      art.fill();
    }
  }

  private showFullIllustration(family: PlantFamily): void {
    const container = this.add.container(0, 0);

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.95);
    overlay.fillRect(0, 0, 750, 1334);
    overlay.setInteractive();
    container.add(overlay);

    const frame = this.add.graphics();
    frame.lineStyle(4, family.primaryColor, 1);
    frame.strokeRoundedRect(50, 200, 650, 800, 20);
    container.add(frame);

    const illustrationColors = [family.primaryColor, family.secondaryColor, family.accentColor];
    
    const bg = this.add.graphics();
    bg.fillGradientStyle(illustrationColors[0], illustrationColors[1], illustrationColors[1], illustrationColors[0], 1);
    bg.fillRoundedRect(60, 210, 630, 780, 16);
    container.add(bg);

    for (let i = 0; i < 8; i++) {
      const leafX = 100 + (i % 4) * 150;
      const leafY = 300 + Math.floor(i / 4) * 500;
      const leafSize = 50 + Math.random() * 30;
      
      const leaf = this.add.graphics();
      leaf.fillStyle(illustrationColors[2] || 0x4caf50, 0.6);
      this.drawEllipse(leaf, leafX, leafY, leafSize, leafSize * 0.6, Math.PI / 4);
      leaf.fill();
      container.add(leaf);
    }

    for (let i = 0; i < 6; i++) {
      const flowerX = 150 + (i % 3) * 200;
      const flowerY = 450 + Math.floor(i / 3) * 300;
      
      const flower = this.add.graphics();
      flower.fillStyle(illustrationColors[1], 0.9);
      for (let p = 0; p < 8; p++) {
        const angle = (p / 8) * Math.PI * 2;
        const petalX = flowerX + Math.cos(angle) * 35;
        const petalY = flowerY + Math.sin(angle) * 35;
        this.drawEllipse(flower, petalX, petalY, 30, 20, angle);
        flower.fill();
      }
      
      flower.fillStyle(0xffd700, 1);
      flower.beginPath();
      flower.arc(flowerX, flowerY, 18, 0, Math.PI * 2);
      flower.fill();
      container.add(flower);
    }

    this.add.text(375, 150, family.illustrationTitle, {
      font: 'bold 32px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    const descBg = this.add.graphics();
    descBg.fillStyle(0x000000, 0.6);
    descBg.fillRoundedRect(60, 1020, 630, 80, 12);
    container.add(descBg);

    this.add.text(375, 1060, family.illustrationDescription, {
      font: '16px Arial',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: 580 }
    }).setOrigin(0.5);

    const closeBtn = this.add.graphics();
    closeBtn.fillStyle(family.primaryColor, 1);
    closeBtn.fillRoundedRect(275, 1150, 200, 60, 15);
    closeBtn.setInteractive(
      new Phaser.Geom.Rectangle(275, 1150, 200, 60),
      Phaser.Geom.Rectangle.Contains
    );
    container.add(closeBtn);

    this.add.text(375, 1180, '关闭', {
      font: 'bold 22px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    const close = () => {
      container.destroy();
    };

    closeBtn.on('pointerup', close);
    overlay.on('pointerup', close);
  }

  private claimReward(familyId: string, rewardId: number, container: Phaser.GameObjects.Container): void {
    const result = SaveManager.claimFamilyReward(familyId, rewardId);
    if (result.success && result.reward) {
      const notification = this.add.container(0, 0);
      
      const notifBg = this.add.graphics();
      notifBg.fillStyle(0x2e7d32, 0.95);
      notifBg.fillRoundedRect(125, 600, 500, 120, 16);
      notification.add(notifBg);

      this.add.text(375, 635, '🎉 奖励领取成功！', {
        font: 'bold 24px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);

      this.add.text(375, 675, `获得: ${result.reward.name}`, {
        font: '18px Arial',
        color: '#ffd700'
      }).setOrigin(0.5);

      this.time.delayedCall(2000, () => {
        notification.destroy();
        const family = getPlantFamilyById(familyId);
        if (family) {
          container.destroy();
          this.showFamilyDetail(family);
        }
      });
    }
  }

  private drawMiniStars(x: number, y: number, stars: number, container: Phaser.GameObjects.Container): void {
    const starSize = 16;
    const spacing = 4;
    const startX = x - starSize - spacing;

    for (let i = 0; i < 3; i++) {
      const starX = startX + i * (starSize + spacing);
      const texture = i < stars ? 'star-filled' : 'star-empty';
      const star = this.add.image(starX, y, texture).setDisplaySize(starSize, starSize);
      container.add(star);
    }
  }

  private clearScrollContent(): void {
    if (this.scrollContainer) {
      this.scrollContainer.destroy();
      this.scrollContainer = null;
    }
  }

  private addBackButton(): void {
    const btnX = 375;
    const btnY = 1250;

    const btn = this.add.graphics();
    btn.fillStyle(0xe94560, 1);
    btn.fillRoundedRect(btnX - 150, btnY - 35, 300, 70, 15);
    btn.setInteractive(
      new Phaser.Geom.Rectangle(btnX - 150, btnY - 35, 300, 70),
      Phaser.Geom.Rectangle.Contains
    );

    this.add.text(btnX, btnY, '返回主菜单', {
      font: 'bold 26px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    btn.on('pointerover', () => {
      btn.clear();
      btn.fillStyle(0xff6b8a, 1);
      btn.fillRoundedRect(btnX - 150, btnY - 35, 300, 70, 15);
    });

    btn.on('pointerout', () => {
      btn.clear();
      btn.fillStyle(0xe94560, 1);
      btn.fillRoundedRect(btnX - 150, btnY - 35, 300, 70, 15);
    });

    btn.on('pointerup', () => {
      this.scene.start('ChapterSelectScene');
    });
  }

  private lighten(hex: number, amount: number): number {
    const r = Math.min(255, ((hex >> 16) & 0xff) + amount);
    const g = Math.min(255, ((hex >> 8) & 0xff) + amount);
    const b = Math.min(255, (hex & 0xff) + amount);
    return (r << 16) | (g << 8) | b;
  }
}
