import Phaser from 'phaser';
import { SaveManager } from '../utils/SaveManager';
import { ConservationManager } from '../utils/ConservationManager';
import { getPlantSpecimen } from '../data/PlantSpecimens';
import { CareActions, DecayConfig, getHealthLevel, getReminderForHealth } from '../data/ConservationConfig';
import { CareActionType, ConservationHealthLevel, ConservationReminder } from '../types/GameTypes';

export class ConservationScene extends Phaser.Scene {
  private scrollOffset: number = 0;
  private selectedSpecimenId: number | null = null;

  constructor() {
    super('ConservationScene');
  }

  create(): void {
    this.scrollOffset = 0;
    this.selectedSpecimenId = null;

    ConservationManager.processDecay();

    this.addBackground();
    this.addTitle();
    this.addStatsBar();
    this.addReminders();
    this.addSpecimenCards();
    this.addBackButton();
  }

  private addBackground(): void {
    this.cameras.main.setBackgroundColor('#1a1a2e');
    const bg = this.add.graphics();
    bg.fillStyle(0x16213e, 1);
    bg.fillRoundedRect(25, 100, 700, 1150, 20);
  }

  private addTitle(): void {
    this.add.text(375, 50, '🌿 标本养护中心', {
      font: 'bold 38px Arial',
      color: '#4caf50'
    }).setOrigin(0.5);

    this.add.text(375, 90, '持续维护植物档案，防止衰退损耗', {
      font: '20px Arial',
      color: '#aaaaaa'
    }).setOrigin(0.5);
  }

  private addStatsBar(): void {
    const statsBg = this.add.graphics();
    statsBg.fillStyle(0x0f3460, 0.8);
    statsBg.fillRoundedRect(45, 120, 660, 55, 12);

    const stats = ConservationManager.getConservationStats();

    this.add.text(75, 147, '🌿', { font: '22px Arial' }).setOrigin(0, 0.5);
    this.add.text(105, 147, `已养护: ${stats.totalSpecimens}`, {
      font: 'bold 16px Arial',
      color: '#4caf50'
    }).setOrigin(0, 0.5);

    this.add.text(250, 147, '❤️', { font: '22px Arial' }).setOrigin(0, 0.5);
    this.add.text(280, 147, `均健康: ${stats.averageHealth}%`, {
      font: 'bold 16px Arial',
      color: this.getHealthColorHex(stats.averageHealth)
    }).setOrigin(0, 0.5);

    this.add.text(440, 147, '🔧', { font: '22px Arial' }).setOrigin(0, 0.5);
    this.add.text(470, 147, `总养护: ${stats.totalCares}`, {
      font: 'bold 16px Arial',
      color: '#ffd700'
    }).setOrigin(0, 0.5);

    const urgentCount = ConservationManager.getUrgentReminderCount();
    if (urgentCount > 0) {
      const alertBg = this.add.graphics();
      alertBg.fillStyle(0xff1744, 0.9);
      alertBg.fillRoundedRect(620, 128, 70, 38, 8);
      this.add.text(655, 147, `${urgentCount}`, {
        font: 'bold 18px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);
    }
  }

  private addReminders(): void {
    const reminders = ConservationManager.getReminders();
    const urgentReminders = reminders.filter(r => r.priority === 'urgent' || r.priority === 'high');

    if (urgentReminders.length === 0) return;

    const startY = 195;
    const cardH = 55;

    urgentReminders.slice(0, 3).forEach((reminder, index) => {
      const y = startY + index * (cardH + 8) + cardH / 2;

      const specimen = getPlantSpecimen(reminder.specimenId);
      const specimenName = specimen?.name || '未知标本';

      const bgColor = reminder.priority === 'urgent' ? 0x880000 : 0x553300;
      const borderColor = reminder.priority === 'urgent' ? 0xff1744 : 0xff9800;

      const card = this.add.graphics();
      card.fillStyle(bgColor, 0.9);
      card.fillRoundedRect(45, y - cardH / 2, 660, cardH, 10);
      card.lineStyle(2, borderColor, 0.8);
      card.strokeRoundedRect(45, y - cardH / 2, 660, cardH, 10);

      const icon = reminder.priority === 'urgent' ? '🚨' : '⚠️';
      this.add.text(70, y - 10, `${icon} ${specimenName}`, {
        font: 'bold 16px Arial',
        color: '#ffffff'
      }).setOrigin(0, 0.5);

      this.add.text(70, y + 12, reminder.message, {
        font: '13px Arial',
        color: '#ffcc80'
      }).setOrigin(0, 0.5);

      const health = ConservationManager.getHealth(reminder.specimenId);
      this.drawMiniHealthBar(580, y, 100, 14, health);

      card.setInteractive(
        new Phaser.Geom.Rectangle(45, y - cardH / 2, 660, cardH),
        Phaser.Geom.Rectangle.Contains
      );
      card.on('pointerup', () => {
        this.selectedSpecimenId = reminder.specimenId;
        this.showCarePanel(reminder.specimenId);
      });
    });
  }

  private addSpecimenCards(): void {
    const specimenIds = ConservationManager.getRegisteredSpecimenIds();

    if (specimenIds.length === 0) {
      this.add.text(375, 600, '暂无养护中的标本', {
        font: '24px Arial',
        color: '#666666'
      }).setOrigin(0.5);
      this.add.text(375, 650, '在工坊修复标本后可开始养护', {
        font: '16px Arial',
        color: '#555555'
      }).setOrigin(0.5);
      return;
    }

    const reminders = ConservationManager.getReminders();
    const startY = 400;
    const cardW = 660;
    const cardH = 160;
    const padding = 15;

    specimenIds.forEach((specimenId, index) => {
      const y = startY + index * (cardH + padding) - this.scrollOffset + cardH / 2;

      if (y < 300 || y > 1230) return;

      const specimen = getPlantSpecimen(specimenId);
      if (!specimen) return;

      const health = ConservationManager.getHealth(specimenId);
      const healthLevel = getHealthLevel(health);
      const streak = ConservationManager.getConsecutiveCares(specimenId);
      const state = ConservationManager.getSpecimenState(specimenId);

      const healthColors: Record<ConservationHealthLevel, number> = {
        thriving: 0x1b5e20,
        healthy: 0x0f3460,
        fair: 0x4a3800,
        declining: 0x663300,
        critical: 0x550000
      };

      const borderColors: Record<ConservationHealthLevel, number> = {
        thriving: 0x4caf50,
        healthy: 0x2196f3,
        fair: 0xffc107,
        declining: 0xff9800,
        critical: 0xff1744
      };

      const card = this.add.graphics();
      card.fillStyle(healthColors[healthLevel], 0.9);
      card.fillRoundedRect(45, y - cardH / 2, cardW, cardH, 12);
      card.lineStyle(2, borderColors[healthLevel], 0.8);
      card.strokeRoundedRect(45, y - cardH / 2, cardW, cardH, 12);

      const previewKey = `specimen-${specimenId}-preview`;
      if (this.textures.exists(previewKey)) {
        const img = this.add.image(115, y - 10, previewKey);
        img.setDisplaySize(80, 80);
        if (healthLevel === 'critical') {
          img.setAlpha(0.5);
          this.add.image(115, y - 10, 'lock').setScale(0.6).setAlpha(0.5);
        }
      }

      const levelLabels: Record<ConservationHealthLevel, string> = {
        thriving: '🌿 生机盎然',
        healthy: '✅ 状态良好',
        fair: '⚡ 略有衰退',
        declining: '⚠️ 明显退化',
        critical: '🚨 濒危警告'
      };

      this.add.text(170, y - 55, specimen.name, {
        font: 'bold 20px Arial',
        color: '#ffffff'
      }).setOrigin(0, 0.5);

      this.add.text(170, y - 30, `${levelLabels[healthLevel]}`, {
        font: 'bold 14px Arial',
        color: this.getHealthColorHex(health)
      }).setOrigin(0, 0.5);

      this.drawHealthBar(170, y - 5, 350, 18, health);

      this.add.text(540, y - 5, `${Math.round(health)}%`, {
        font: 'bold 20px Arial',
        color: this.getHealthColorHex(health)
      }).setOrigin(0, 0.5);

      this.add.text(170, y + 25, `🔥 连续养护: ${streak} 次`, {
        font: '14px Arial',
        color: '#ffd700'
      }).setOrigin(0, 0.5);

      this.add.text(170, y + 47, `🔧 累计养护: ${state?.totalCaresPerformed ?? 0} 次`, {
        font: '14px Arial',
        color: '#aaaaaa'
      }).setOrigin(0, 0.5);

      const careBtn = this.add.graphics();
      careBtn.fillStyle(borderColors[healthLevel], 1);
      careBtn.fillRoundedRect(530, y + 20, 150, 40, 8);
      careBtn.setInteractive(
        new Phaser.Geom.Rectangle(530, y + 20, 150, 40),
        Phaser.Geom.Rectangle.Contains
      );

      this.add.text(605, y + 40, '🔧 养护', {
        font: 'bold 16px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);

      careBtn.on('pointerup', () => {
        this.showCarePanel(specimenId);
      });

      card.setInteractive(
        new Phaser.Geom.Rectangle(45, y - cardH / 2, cardW, cardH),
        Phaser.Geom.Rectangle.Contains
      );
      card.on('pointerup', () => {
        this.showCarePanel(specimenId);
      });
    });
  }

  private showCarePanel(specimenId: number): void {
    const specimen = getPlantSpecimen(specimenId);
    if (!specimen) return;

    const container = this.add.container(0, 0);

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.75);
    overlay.fillRect(0, 0, 750, 1334);
    overlay.setInteractive();
    container.add(overlay);

    const health = ConservationManager.getHealth(specimenId);
    const healthLevel = getHealthLevel(health);
    const streak = ConservationManager.getConsecutiveCares(specimenId);
    const state = ConservationManager.getSpecimenState(specimenId);
    const reminderDef = getReminderForHealth(health);

    const modal = this.add.graphics();
    modal.fillStyle(0x16213e, 1);
    modal.fillRoundedRect(50, 200, 650, 900, 24);
    modal.lineStyle(3, this.getHealthColor(health), 1);
    modal.strokeRoundedRect(50, 200, 650, 900, 24);
    container.add(modal);

    const previewKey = `specimen-${specimenId}-preview`;
    if (this.textures.exists(previewKey)) {
      const img = this.add.image(375, 330, previewKey);
      img.setDisplaySize(160, 160);
      container.add(img);
    }

    this.add.text(375, 440, specimen.name, {
      font: 'bold 30px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(375, 475, specimen.family, {
      font: '18px Arial',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    const levelLabels: Record<ConservationHealthLevel, string> = {
      thriving: '🌿 生机盎然',
      healthy: '✅ 状态良好',
      fair: '⚡ 略有衰退',
      declining: '⚠️ 明显退化',
      critical: '🚨 濒危警告'
    };

    this.add.text(375, 510, levelLabels[healthLevel], {
      font: 'bold 18px Arial',
      color: this.getHealthColorHex(health)
    }).setOrigin(0.5);

    this.drawHealthBar(175, 545, 400, 22, health);

    this.add.text(375, 580, `${Math.round(health)}%`, {
      font: 'bold 24px Arial',
      color: this.getHealthColorHex(health)
    }).setOrigin(0.5);

    const rewardMultiplier = ConservationManager.getRewardMultiplierForSpecimen(specimenId);
    const rewardBg = this.add.graphics();
    rewardBg.fillStyle(0x0f3460, 0.8);
    rewardBg.fillRoundedRect(80, 610, 590, 50, 10);
    container.add(rewardBg);

    this.add.text(100, 635, `奖励倍率`, {
      font: 'bold 14px Arial',
      color: '#aaaaaa'
    }).setOrigin(0, 0.5);

    this.add.text(220, 635, `积分×${rewardMultiplier.scoreMultiplier.toFixed(1)}`, {
      font: 'bold 14px Arial',
      color: this.getMultiplierColor(rewardMultiplier.scoreMultiplier)
    }).setOrigin(0, 0.5);

    this.add.text(360, 635, `碎片×${rewardMultiplier.fragmentMultiplier.toFixed(1)}`, {
      font: 'bold 14px Arial',
      color: this.getMultiplierColor(rewardMultiplier.fragmentMultiplier)
    }).setOrigin(0, 0.5);

    this.add.text(510, 635, `研究×${rewardMultiplier.researchMultiplier.toFixed(1)}`, {
      font: 'bold 14px Arial',
      color: this.getMultiplierColor(rewardMultiplier.researchMultiplier)
    }).setOrigin(0, 0.5);

    this.add.text(375, 680, '选择养护操作', {
      font: 'bold 18px Arial',
      color: '#eaeaea'
    }).setOrigin(0.5);

    const careStartY = 710;
    const careItemH = 70;

    CareActions.forEach((action, index) => {
      const y = careStartY + index * (careItemH + 8) + careItemH / 2;

      const check = ConservationManager.canPerformCare(specimenId, action.type);
      const canCare = check.canCare;
      const cooldownMs = ConservationManager.getCooldownRemaining(specimenId, action.type);

      const actionCard = this.add.graphics();
      actionCard.fillStyle(canCare ? 0x0f3460 : 0x222233, 0.9);
      actionCard.fillRoundedRect(80, y - careItemH / 2, 590, careItemH, 10);
      actionCard.lineStyle(1, canCare ? 0x4caf50 : 0x333344, 0.6);
      actionCard.strokeRoundedRect(80, y - careItemH / 2, 590, careItemH, 10);
      container.add(actionCard);

      this.add.text(100, y - 15, `${action.icon} ${action.name}`, {
        font: 'bold 16px Arial',
        color: canCare ? '#ffffff' : '#666666'
      }).setOrigin(0, 0.5);

      this.add.text(100, y + 8, action.description, {
        font: '12px Arial',
        color: '#888888'
      }).setOrigin(0, 0.5);

      this.add.text(430, y - 10, `+${action.healthRecovery} HP`, {
        font: 'bold 14px Arial',
        color: canCare ? '#4caf50' : '#444444'
      }).setOrigin(0, 0.5);

      if (!canCare && cooldownMs > 0) {
        const remainingMin = Math.ceil(cooldownMs / (60 * 1000));
        this.add.text(430, y + 10, `冷却 ${remainingMin}分`, {
          font: '12px Arial',
          color: '#ff9800'
        }).setOrigin(0, 0.5);
      } else if (!canCare) {
        this.add.text(430, y + 10, check.reason, {
          font: '12px Arial',
          color: '#ff5252'
        }).setOrigin(0, 0.5);
      }

      const costText = action.materialCost.map(c => {
        const owned = SaveManager.getMaterialCount(c.materialId);
        const enough = owned >= c.count;
        return enough ? `✓` : `✗`;
      }).join(' ');

      this.add.text(570, y + 10, `材料${costText}`, {
        font: '12px Arial',
        color: '#aaaaaa'
      }).setOrigin(0, 0.5);

      if (canCare) {
        actionCard.setInteractive(
          new Phaser.Geom.Rectangle(80, y - careItemH / 2, 590, careItemH),
          Phaser.Geom.Rectangle.Contains
        );

        actionCard.on('pointerover', () => {
          actionCard.clear();
          actionCard.fillStyle(0x1a4a7a, 0.9);
          actionCard.fillRoundedRect(80, y - careItemH / 2, 590, careItemH, 10);
          actionCard.lineStyle(2, 0x4caf50, 1);
          actionCard.strokeRoundedRect(80, y - careItemH / 2, 590, careItemH, 10);
        });

        actionCard.on('pointerout', () => {
          actionCard.clear();
          actionCard.fillStyle(0x0f3460, 0.9);
          actionCard.fillRoundedRect(80, y - careItemH / 2, 590, careItemH, 10);
          actionCard.lineStyle(1, 0x4caf50, 0.6);
          actionCard.strokeRoundedRect(80, y - careItemH / 2, 590, careItemH, 10);
        });

        actionCard.on('pointerup', () => {
          const result = ConservationManager.performCare(specimenId, action.type);
          container.destroy();
          if (result.success) {
            this.showCareResult(specimenId, result.healthBefore, result.healthAfter, action.icon, action.name);
          } else {
            this.scene.restart();
          }
        });
      }
    });

    const closeBtn = this.add.graphics();
    closeBtn.fillStyle(0xe94560, 1);
    closeBtn.fillRoundedRect(275, 1060, 200, 50, 12);
    closeBtn.setInteractive(
      new Phaser.Geom.Rectangle(275, 1060, 200, 50),
      Phaser.Geom.Rectangle.Contains
    );
    container.add(closeBtn);

    this.add.text(375, 1085, '关闭', {
      font: 'bold 20px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    const close = () => {
      container.destroy();
    };

    closeBtn.on('pointerup', close);
    overlay.on('pointerup', close);
  }

  private showCareResult(specimenId: number, healthBefore: number, healthAfter: number, icon: string, actionName: string): void {
    const specimen = getPlantSpecimen(specimenId);
    if (!specimen) return;

    const container = this.add.container(0, 0);

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.8);
    overlay.fillRect(0, 0, 750, 1334);
    overlay.setInteractive();
    container.add(overlay);

    const healthDiff = healthAfter - healthBefore;

    const modal = this.add.graphics();
    modal.fillStyle(0x16213e, 1);
    modal.fillRoundedRect(100, 400, 550, 450, 24);
    modal.lineStyle(3, 0x4caf50, 1);
    modal.strokeRoundedRect(100, 400, 550, 450, 24);
    container.add(modal);

    this.add.text(375, 460, `${icon} ${actionName}完成！`, {
      font: 'bold 30px Arial',
      color: '#4caf50'
    }).setOrigin(0.5);

    this.add.text(375, 510, specimen.name, {
      font: 'bold 22px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(375, 560, `健康值: ${Math.round(healthBefore)}% → ${Math.round(healthAfter)}%`, {
      font: 'bold 20px Arial',
      color: '#eaeaea'
    }).setOrigin(0.5);

    this.add.text(375, 600, `+${Math.round(healthDiff)} HP`, {
      font: 'bold 26px Arial',
      color: '#4caf50'
    }).setOrigin(0.5);

    const newLevel = getHealthLevel(healthAfter);
    const levelLabels: Record<ConservationHealthLevel, string> = {
      thriving: '🌿 生机盎然',
      healthy: '✅ 状态良好',
      fair: '⚡ 略有衰退',
      declining: '⚠️ 明显退化',
      critical: '🚨 濒危警告'
    };

    this.add.text(375, 650, levelLabels[newLevel], {
      font: 'bold 18px Arial',
      color: this.getHealthColorHex(healthAfter)
    }).setOrigin(0.5);

    const rewardMultiplier = ConservationManager.getRewardMultiplierForSpecimen(specimenId);
    this.add.text(375, 700, `奖励倍率: 积分×${rewardMultiplier.scoreMultiplier.toFixed(1)} 碎片×${rewardMultiplier.fragmentMultiplier.toFixed(1)}`, {
      font: '14px Arial',
      color: '#ffd700'
    }).setOrigin(0.5);

    const streak = ConservationManager.getConsecutiveCares(specimenId);
    if (streak > 1) {
      this.add.text(375, 740, `🔥 连续养护 ${streak} 次！`, {
        font: 'bold 16px Arial',
        color: '#ff9800'
      }).setOrigin(0.5);
    }

    const confirmBtn = this.add.graphics();
    confirmBtn.fillStyle(0x4caf50, 1);
    confirmBtn.fillRoundedRect(225, 780, 300, 50, 12);
    confirmBtn.setInteractive(
      new Phaser.Geom.Rectangle(225, 780, 300, 50),
      Phaser.Geom.Rectangle.Contains
    );
    container.add(confirmBtn);

    this.add.text(375, 805, '继续', {
      font: 'bold 20px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    const close = () => {
      container.destroy();
      this.scene.restart();
    };

    confirmBtn.on('pointerup', close);
    overlay.on('pointerup', close);
  }

  private addBackButton(): void {
    const btnX = 375;
    const btnY = 1270;

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

  private drawHealthBar(x: number, y: number, width: number, height: number, health: number): void {
    const bg = this.add.graphics();
    bg.fillStyle(0x333344, 1);
    bg.fillRoundedRect(x, y - height / 2, width, height, height / 2);

    const fillWidth = Math.max(0, (width * health) / 100);
    const fillColor = this.getHealthColor(health);

    if (fillWidth > 0) {
      const fill = this.add.graphics();
      fill.fillStyle(fillColor, 1);
      fill.fillRoundedRect(x, y - height / 2, fillWidth, height, height / 2);

      if (health > 60) {
        const highlight = this.add.graphics();
        highlight.fillStyle(0xffffff, 0.15);
        highlight.fillRoundedRect(x, y - height / 2, fillWidth, height / 2, height / 4);
      }
    }
  }

  private drawMiniHealthBar(x: number, y: number, width: number, height: number, health: number): void {
    const bg = this.add.graphics();
    bg.fillStyle(0x333344, 1);
    bg.fillRoundedRect(x, y - height / 2, width, height, height / 2);

    const fillWidth = Math.max(0, (width * health) / 100);
    if (fillWidth > 0) {
      const fill = this.add.graphics();
      fill.fillStyle(this.getHealthColor(health), 1);
      fill.fillRoundedRect(x, y - height / 2, fillWidth, height, height / 2);
    }
  }

  private getHealthColor(health: number): number {
    if (health >= 80) return 0x4caf50;
    if (health >= 60) return 0x2196f3;
    if (health >= 40) return 0xffc107;
    if (health >= 20) return 0xff9800;
    return 0xff1744;
  }

  private getHealthColorHex(health: number): string {
    if (health >= 80) return '#4caf50';
    if (health >= 60) return '#2196f3';
    if (health >= 40) return '#ffc107';
    if (health >= 20) return '#ff9800';
    return '#ff1744';
  }

  private getMultiplierColor(multiplier: number): string {
    if (multiplier >= 0.9) return '#4caf50';
    if (multiplier >= 0.6) return '#ffc107';
    if (multiplier >= 0.3) return '#ff9800';
    return '#ff1744';
  }
}
