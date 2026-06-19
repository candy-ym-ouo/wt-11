import Phaser from 'phaser';
import { TowerFloors, getDifficultyText, getDifficultyColor, getRarityText, getRarityColor } from '../data/TowerConfig';
import { SaveManager } from '../utils/SaveManager';
import { TowerFloorData, TowerReward, TowerRuleModifier } from '../types/GameTypes';
import { getPlantSpecimen } from '../data/PlantSpecimens';

export class TowerSelectScene extends Phaser.Scene {
  private selectedFloorId: number | null = null;
  private scrollContainer!: Phaser.GameObjects.Container;
  private scrollContent!: Phaser.GameObjects.Container;
  private detailModal!: Phaser.GameObjects.Container;

  constructor() {
    super('TowerSelectScene');
  }

  create(): void {
    this.addBackground();
    this.addHeader();
    this.addStatsBar();
    this.createTowerView();
    this.addBackButton();

    this.cameras.main.fadeIn(600, 0, 0, 0);
  }

  private addBackground(): void {
    this.cameras.main.setBackgroundColor('#0d0d1a');

    const bg = this.add.graphics();
    const gradientSteps = 30;
    for (let i = 0; i < gradientSteps; i++) {
      const t = i / gradientSteps;
      const r = Math.floor(13 + (22 - 13) * t);
      const g = Math.floor(13 + (33 - 13) * t);
      const b = Math.floor(26 + (62 - 26) * t);
      const color = (r << 16) | (g << 8) | b;
      bg.fillStyle(color, 1);
      bg.fillRect(0, (1334 * i) / gradientSteps, 750, 1334 / gradientSteps + 1);
    }

    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(20, 730);
      const y = Phaser.Math.Between(100, 1250);
      const size = Phaser.Math.Between(1, 3);
      const alpha = Phaser.Math.FloatBetween(0.3, 0.8);
      const star = this.add.circle(x, y, size, 0xffffff, alpha);
      this.tweens.add({
        targets: star,
        alpha: { from: alpha * 0.3, to: alpha },
        duration: Phaser.Math.Between(1500, 3000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: Phaser.Math.Between(0, 1500)
      });
    }
  }

  private addHeader(): void {
    const headerBg = this.add.graphics();
    headerBg.fillStyle(0x1a1a2e, 0.95);
    headerBg.fillRect(0, 0, 750, 160);
    headerBg.lineStyle(2, 0x9c27b0, 0.6);
    headerBg.lineBetween(0, 160, 750, 160);

    this.add.text(375, 45, '🏰 挑战塔', {
      font: 'bold 38px Arial',
      color: '#ffd700'
    }).setOrigin(0.5);

    this.add.text(375, 85, '征服高塔，证明你的实力', {
      font: '18px Arial',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    const highestFloor = SaveManager.getTowerHighestFloor();
    const totalFloors = TowerFloors.length;
    this.add.text(375, 120, `最高记录: 第 ${highestFloor} 层 / 共 ${totalFloors} 层`, {
      font: '16px Arial',
      color: '#e94560'
    }).setOrigin(0.5);
  }

  private addStatsBar(): void {
    const statsY = 185;
    const stats = [
      { icon: '⭐', label: '星星', value: SaveManager.getTowerTotalStars().toString(), color: '#ffd700' },
      { icon: '🏆', label: '总积分', value: SaveManager.getTowerTotalScore().toLocaleString(), color: '#ff9800' },
      { icon: '🔥', label: '连胜', value: SaveManager.getTowerCurrentStreak().toString(), color: '#e94560' },
      { icon: '🎯', label: '完成', value: `${SaveManager.getTowerTotalCompletions()}/${TowerFloors.length}`, color: '#4caf50' }
    ];

    stats.forEach((stat, index) => {
      const x = 60 + index * 165 + 60;
      const statBg = this.add.graphics();
      statBg.fillStyle(0x16213e, 0.8);
      statBg.fillRoundedRect(x - 60, statsY - 25, 120, 50, 10);
      statBg.lineStyle(1, 0xffffff, 0.1);
      statBg.strokeRoundedRect(x - 60, statsY - 25, 120, 50, 10);

      this.add.text(x - 35, statsY - 8, stat.icon, {
        font: '20px Arial'
      }).setOrigin(0, 0.5);

      this.add.text(x - 35, statsY + 12, stat.label, {
        font: '11px Arial',
        color: '#888888'
      }).setOrigin(0, 0.5);

      this.add.text(x + 55, statsY, stat.value, {
        font: 'bold 18px Arial',
        color: stat.color
      }).setOrigin(1, 0.5);
    });
  }

  private createTowerView(): void {
    this.scrollContainer = this.add.container(0, 0);
    this.scrollContent = this.add.container(0, 0);
    this.scrollContainer.add(this.scrollContent);

    const startY = 280;
    const floorHeight = 180;
    const totalHeight = startY + TowerFloors.length * floorHeight + 100;

    for (let i = TowerFloors.length - 1; i >= 0; i--) {
      const floor = TowerFloors[i];
      const y = startY + (TowerFloors.length - 1 - i) * floorHeight;
      this.createFloorCard(375, y, floor);
    }

    const maskGraphics = this.add.graphics();
    maskGraphics.fillRect(25, 260, 700, 950);
    maskGraphics.setVisible(false);
    const mask = new Phaser.Display.Masks.GeometryMask(this, maskGraphics);
    this.scrollContainer.setMask(mask);

    this.setupScrolling(totalHeight);
  }

  private createFloorCard(x: number, y: number, floor: TowerFloorData): void {
    const progress = SaveManager.getTowerFloorProgress(floor.id);
    const unlocked = progress?.unlocked ?? false;
    const completed = progress?.completed ?? false;
    const canClaim = SaveManager.canClaimTowerRewards(floor.id);

    const cardWidth = 650;
    const cardHeight = 160;
    const diffColor = getDifficultyColor(floor.difficulty);

    const card = this.add.graphics();
    card.fillStyle(unlocked ? 0x0f3460 : 0x1a1a2a, 0.9);
    card.fillRoundedRect(x - cardWidth / 2, y - cardHeight / 2, cardWidth, cardHeight, 16);

    if (unlocked) {
      card.lineStyle(3, completed ? 0x4caf50 : diffColor, completed ? 0.8 : 0.6);
    } else {
      card.lineStyle(2, 0x333344, 0.5);
    }
    card.strokeRoundedRect(x - cardWidth / 2, y - cardHeight / 2, cardWidth, cardHeight, 16);

    const floorNumBg = this.add.graphics();
    floorNumBg.fillStyle(diffColor, unlocked ? 1 : 0.4);
    floorNumBg.fillRoundedRect(x - cardWidth / 2 + 20, y - cardHeight / 2 + 20, 70, 50, 10);

    this.add.text(x - cardWidth / 2 + 55, y - cardHeight / 2 + 45, `${floor.floorNumber}F`, {
      font: 'bold 24px Arial',
      color: unlocked ? '#ffffff' : '#666666'
    }).setOrigin(0.5);

    const specimen = getPlantSpecimen(floor.specimenId);
    if (specimen && unlocked) {
      const previewKey = `specimen-${floor.specimenId}-preview`;
      this.add.image(x - cardWidth / 2 + 70, y + 10, previewKey)
        .setDisplaySize(70, 70);
    } else {
      this.add.text(x - cardWidth / 2 + 70, y + 10, '🔒', {
        font: '40px Arial'
      }).setOrigin(0.5);
    }

    this.add.text(x - cardWidth / 2 + 130, y - 35, floor.name, {
      font: 'bold 20px Arial',
      color: unlocked ? '#ffffff' : '#666666'
    }).setOrigin(0, 0.5);

    this.add.text(x - cardWidth / 2 + 130, y - 8, floor.description, {
      font: '13px Arial',
      color: unlocked ? '#aaaaaa' : '#555555',
      wordWrap: { width: 320 }
    }).setOrigin(0, 0.5);

    const diffText = getDifficultyText(floor.difficulty);
    const diffTextColor = '#' + diffColor.toString(16).padStart(6, '0');
    this.add.text(x - cardWidth / 2 + 130, y + 30, `难度: ${diffText}`, {
      font: 'bold 14px Arial',
      color: unlocked ? diffTextColor : '#555555'
    }).setOrigin(0, 0.5);

    const ruleCount = floor.rules.length;
    this.add.text(x - cardWidth / 2 + 260, y + 30, `规则: ${ruleCount}项`, {
      font: '13px Arial',
      color: unlocked ? '#2196f3' : '#555555'
    }).setOrigin(0, 0.5);

    if (unlocked && progress) {
      this.drawStars(x + cardWidth / 2 - 100, y - 20, progress.stars, 18);
      this.add.text(x + cardWidth / 2 - 100, y + 10, `最高: ${progress.bestScore.toLocaleString()}`, {
        font: '13px Arial',
        color: '#ffd700'
      }).setOrigin(0.5);
    }

    if (canClaim) {
      const claimBadge = this.add.graphics();
      claimBadge.fillStyle(0xffd700, 1);
      claimBadge.fillRoundedRect(x + cardWidth / 2 - 70, y + 35, 90, 28, 8);
      this.add.text(x + cardWidth / 2 - 25, y + 49, '🎁 可领取', {
        font: 'bold 12px Arial',
        color: '#1a1a2e'
      }).setOrigin(0.5);
    }

    if (!unlocked) {
      this.add.text(x + cardWidth / 2 - 80, y + 30, `需要 ${floor.requiredStars} ⭐`, {
        font: '13px Arial',
        color: '#666666'
      }).setOrigin(0.5);
    }

    if (unlocked) {
      card.setInteractive(
        new Phaser.Geom.Rectangle(x - cardWidth / 2, y - cardHeight / 2, cardWidth, cardHeight),
        Phaser.Geom.Rectangle.Contains
      );

      card.on('pointerover', () => {
        card.clear();
        card.fillStyle(0x1a4a7a, 0.95);
        card.fillRoundedRect(x - cardWidth / 2, y - cardHeight / 2, cardWidth, cardHeight, 16);
        card.lineStyle(3, 0xffd700, 0.8);
        card.strokeRoundedRect(x - cardWidth / 2, y - cardHeight / 2, cardWidth, cardHeight, 16);
      });

      card.on('pointerout', () => {
        card.clear();
        card.fillStyle(0x0f3460, 0.9);
        card.fillRoundedRect(x - cardWidth / 2, y - cardHeight / 2, cardWidth, cardHeight, 16);
        card.lineStyle(3, completed ? 0x4caf50 : diffColor, completed ? 0.8 : 0.6);
        card.strokeRoundedRect(x - cardWidth / 2, y - cardHeight / 2, cardWidth, cardHeight, 16);
      });

      card.on('pointerup', () => {
        this.showFloorDetail(floor);
      });
    }

    this.scrollContent.add([card, floorNumBg]);
  }

  private drawStars(x: number, y: number, stars: number, size: number): void {
    const spacing = 4;
    const startX = x - size - spacing;

    for (let i = 0; i < 3; i++) {
      const starX = startX + i * (size + spacing);
      const texture = i < stars ? 'star-filled' : 'star-empty';
      this.add.image(starX, y, texture).setDisplaySize(size, size);
    }
  }

  private showFloorDetail(floor: TowerFloorData): void {
    this.selectedFloorId = floor.id;

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.85);
    overlay.fillRect(0, 0, 750, 1334);
    overlay.setInteractive();

    const modal = this.add.graphics();
    modal.fillStyle(0x16213e, 1);
    modal.fillRoundedRect(40, 150, 670, 1000, 24);
    modal.lineStyle(3, getDifficultyColor(floor.difficulty), 0.7);
    modal.strokeRoundedRect(40, 150, 670, 1000, 24);

    this.detailModal = this.add.container(0, 0);
    this.detailModal.add([overlay, modal]);

    this.add.text(375, 200, floor.name, {
      font: 'bold 30px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(375, 240, floor.description, {
      font: '16px Arial',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    const specimen = getPlantSpecimen(floor.specimenId);
    if (specimen) {
      const previewKey = `specimen-${floor.specimenId}-preview`;
      this.add.image(375, 320, previewKey).setDisplaySize(120, 120);
      this.add.text(375, 395, specimen.name, {
        font: '18px Arial',
        color: '#4caf50'
      }).setOrigin(0.5);
    }

    const diffColor = getDifficultyColor(floor.difficulty);
    const diffText = getDifficultyText(floor.difficulty);
    const diffBadge = this.add.graphics();
    diffBadge.fillStyle(diffColor, 1);
    diffBadge.fillRoundedRect(280, 420, 190, 35, 10);
    this.add.text(375, 437, `⚔️ ${diffText}难度`, {
      font: 'bold 16px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    let currentY = 480;

    this.add.text(75, currentY, '📜 挑战规则', {
      font: 'bold 18px Arial',
      color: '#ff9800'
    }).setOrigin(0, 0.5);
    currentY += 35;

    floor.rules.forEach((rule: TowerRuleModifier) => {
      const ruleBg = this.add.graphics();
      ruleBg.fillStyle(0x0f3460, 0.8);
      ruleBg.fillRoundedRect(75, currentY - 20, 600, 40, 8);
      ruleBg.lineStyle(1, 0xff9800, 0.3);
      ruleBg.strokeRoundedRect(75, currentY - 20, 600, 40, 8);

      this.add.text(95, currentY, `⚠️ ${rule.name}`, {
        font: 'bold 14px Arial',
        color: '#ff9800'
      }).setOrigin(0, 0.5);

      this.add.text(400, currentY, rule.description, {
        font: '12px Arial',
        color: '#aaaaaa'
      }).setOrigin(0, 0.5);

      currentY += 50;
    });

    currentY += 15;

    this.add.text(75, currentY, '📊 评分条件', {
      font: 'bold 18px Arial',
      color: '#2196f3'
    }).setOrigin(0, 0.5);
    currentY += 35;

    floor.scoringConditions.forEach(condition => {
      const condBg = this.add.graphics();
      condBg.fillStyle(0x0f3460, 0.8);
      condBg.fillRoundedRect(75, currentY - 18, 600, 36, 8);

      this.add.text(95, currentY, condition.name, {
        font: 'bold 13px Arial',
        color: '#2196f3'
      }).setOrigin(0, 0.5);

      this.add.text(450, currentY, `权重 ${condition.weight}%`, {
        font: '12px Arial',
        color: '#888888'
      }).setOrigin(1, 0.5);

      currentY += 44;
    });

    currentY += 15;

    this.add.text(75, currentY, '🎁 挑战奖励', {
      font: 'bold 18px Arial',
      color: '#4caf50'
    }).setOrigin(0, 0.5);
    currentY += 35;

    floor.rewards.forEach((reward: TowerReward) => {
      const rarityColor = getRarityColor(reward.rarity);
      const rewardBg = this.add.graphics();
      rewardBg.fillStyle(0x0f3460, 0.9);
      rewardBg.fillRoundedRect(75, currentY - 22, 600, 44, 10);
      rewardBg.lineStyle(2, rarityColor, 0.5);
      rewardBg.strokeRoundedRect(75, currentY - 22, 600, 44, 10);

      let icon = '';
      switch (reward.type) {
        case 'score': icon = '💰'; break;
        case 'badge': icon = '🏅'; break;
        case 'fragment': icon = '🧩'; break;
        case 'research_point': icon = '🔬'; break;
        case 'material': icon = '📦'; break;
        default: icon = '🎁';
      }

      this.add.text(100, currentY, icon, {
        font: '24px Arial'
      }).setOrigin(0, 0.5);

      this.add.text(140, currentY - 8, reward.name, {
        font: 'bold 14px Arial',
        color: '#ffffff'
      }).setOrigin(0, 0.5);

      this.add.text(140, currentY + 10, reward.description, {
        font: '11px Arial',
        color: '#888888'
      }).setOrigin(0, 0.5);

      const rarityText = getRarityText(reward.rarity);
      this.add.text(655, currentY, rarityText, {
        font: 'bold 12px Arial',
        color: '#' + rarityColor.toString(16).padStart(6, '0')
      }).setOrigin(1, 0.5);

      currentY += 54;
    });

    const startBtn = this.add.graphics();
    startBtn.fillStyle(0xe94560, 1);
    startBtn.fillRoundedRect(150, 1050, 450, 65, 16);
    startBtn.setInteractive(
      new Phaser.Geom.Rectangle(150, 1050, 450, 65),
      Phaser.Geom.Rectangle.Contains
    );

    this.add.text(375, 1082, '⚔️ 开始挑战', {
      font: 'bold 22px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    startBtn.on('pointerover', () => {
      startBtn.clear();
      startBtn.fillStyle(0xff6b8a, 1);
      startBtn.fillRoundedRect(150, 1050, 450, 65, 16);
    });

    startBtn.on('pointerout', () => {
      startBtn.clear();
      startBtn.fillStyle(0xe94560, 1);
      startBtn.fillRoundedRect(150, 1050, 450, 65, 16);
    });

    startBtn.on('pointerup', () => {
      this.scene.start('GameScene', { levelId: floor.id, isTowerFloor: true, towerFloorId: floor.id });
    });

    const closeBtn = this.add.graphics();
    closeBtn.fillStyle(0x555566, 1);
    closeBtn.fillRoundedRect(275, 1130, 200, 50, 12);
    closeBtn.setInteractive(
      new Phaser.Geom.Rectangle(275, 1130, 200, 50),
      Phaser.Geom.Rectangle.Contains
    );

    this.add.text(375, 1155, '返回', {
      font: 'bold 18px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    closeBtn.on('pointerup', () => {
      this.closeDetailModal();
    });

    overlay.on('pointerup', () => {
      this.closeDetailModal();
    });

    this.detailModal.add([
      diffBadge,
      startBtn,
      closeBtn
    ]);

    this.tweens.add({
      targets: this.detailModal,
      y: [50, 0],
      alpha: [0, 1],
      duration: 300,
      ease: 'Back.easeOut'
    });
  }

  private closeDetailModal(): void {
    if (this.detailModal) {
      this.tweens.add({
        targets: this.detailModal,
        y: 50,
        alpha: 0,
        duration: 200,
        ease: 'Cubic.easeIn',
        onComplete: () => {
          this.detailModal.destroy();
          this.selectedFloorId = null;
        }
      });
    }
  }

  private setupScrolling(contentHeight: number): void {
    let isDragging = false;
    let dragStartY = 0;
    let scrollStartY = 0;
    const maxScroll = Math.max(0, contentHeight - 950);

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.y > 260 && pointer.y < 1210 && !this.detailModal) {
        isDragging = true;
        dragStartY = pointer.y;
        scrollStartY = this.scrollContent.y;
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (isDragging) {
        const deltaY = pointer.y - dragStartY;
        let newY = scrollStartY + deltaY;
        newY = Phaser.Math.Clamp(newY, -maxScroll, 0);
        this.scrollContent.y = newY;
      }
    });

    this.input.on('pointerup', () => {
      isDragging = false;
    });

    this.input.on('pointerupoutside', () => {
      isDragging = false;
    });
  }

  private addBackButton(): void {
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
      this.scene.start('LevelSelectScene');
    });
  }
}
