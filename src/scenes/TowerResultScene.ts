import Phaser from 'phaser';
import { getTowerFloor, getRarityText, getRarityColor, getDifficultyText, getDifficultyColor } from '../data/TowerConfig';
import { SaveManager } from '../utils/SaveManager';
import { TowerFloorData, TowerReward, TowerResultData } from '../types/GameTypes';
import { getPlantSpecimen } from '../data/PlantSpecimens';
import { formatTime } from '../utils/GameUtils';

export class TowerResultScene extends Phaser.Scene {
  private floorId!: number;
  private floorData!: TowerFloorData;
  private resultData: TowerResultData | null = null;

  constructor() {
    super('TowerResultScene');
  }

  init(data: { floorId: number; result?: TowerResultData }): void {
    this.floorId = data.floorId;
    this.resultData = data.result || null;

    const floor = getTowerFloor(data.floorId);
    if (!floor) {
      this.scene.start('TowerSelectScene');
      return;
    }
    this.floorData = floor;
  }

  create(): void {
    this.addBackground();
    this.addFloorInfo();
    this.addBestRecord();
    this.addRewardsSection();
    this.addButtons();

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

    for (let i = 0; i < 25; i++) {
      const x = Phaser.Math.Between(20, 730);
      const y = Phaser.Math.Between(100, 1250);
      const size = Phaser.Math.Between(1, 3);
      const alpha = Phaser.Math.FloatBetween(0.3, 0.7);
      this.add.circle(x, y, size, 0xffffff, alpha);
    }
  }

  private addFloorInfo(): void {
    const diffColor = getDifficultyColor(this.floorData.difficulty);
    const diffText = getDifficultyText(this.floorData.difficulty);

    this.add.text(375, 70, '🏆 塔层结算', {
      font: 'bold 36px Arial',
      color: '#ffd700'
    }).setOrigin(0.5);

    const cardBg = this.add.graphics();
    cardBg.fillStyle(0x0f3460, 0.9);
    cardBg.fillRoundedRect(40, 120, 670, 180, 16);
    cardBg.lineStyle(3, diffColor, 0.6);
    cardBg.strokeRoundedRect(40, 120, 670, 180, 16);

    const specimen = getPlantSpecimen(this.floorData.specimenId);
    if (specimen) {
      const previewKey = `specimen-${this.floorData.specimenId}-preview`;
      this.add.image(100, 210, previewKey).setDisplaySize(100, 100);
    }

    this.add.text(180, 160, this.floorData.name, {
      font: 'bold 24px Arial',
      color: '#ffffff'
    }).setOrigin(0, 0.5);

    this.add.text(180, 195, this.floorData.description, {
      font: '14px Arial',
      color: '#aaaaaa',
      wordWrap: { width: 450 }
    }).setOrigin(0, 0.5);

    const diffBadge = this.add.graphics();
    diffBadge.fillStyle(diffColor, 1);
    diffBadge.fillRoundedRect(180, 220, 120, 32, 8);
    this.add.text(240, 236, `⚔️ ${diffText}`, {
      font: 'bold 14px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    const floorBadge = this.add.graphics();
    floorBadge.fillStyle(0xff9800, 1);
    floorBadge.fillRoundedRect(320, 220, 100, 32, 8);
    this.add.text(370, 236, `第 ${this.floorData.floorNumber} 层`, {
      font: 'bold 14px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    const progress = SaveManager.getTowerFloorProgress(this.floorId);
    if (progress?.completed) {
      const completedBadge = this.add.graphics();
      completedBadge.fillStyle(0x4caf50, 1);
      completedBadge.fillRoundedRect(440, 220, 100, 32, 8);
      this.add.text(490, 236, '✅ 已通关', {
        font: 'bold 14px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);
    }
  }

  private addBestRecord(): void {
    const progress = SaveManager.getTowerFloorProgress(this.floorId);

    this.add.text(375, 340, '📊 最佳记录', {
      font: 'bold 22px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    const statsBg = this.add.graphics();
    statsBg.fillStyle(0x0f3460, 0.8);
    statsBg.fillRoundedRect(40, 370, 670, 200, 16);
    statsBg.lineStyle(2, 0xffffff, 0.1);
    statsBg.strokeRoundedRect(40, 370, 670, 200, 16);

    const stats = [
      { icon: '🏆', label: '最高分', value: progress?.bestScore?.toLocaleString() || '0', color: '#ffd700' },
      { icon: '⏱️', label: '最快时间', value: progress?.bestTime ? formatTime(progress.bestTime) : '--:--', color: '#2196f3' },
      { icon: '⭐', label: '星级', value: `${progress?.stars || 0}/3`, color: '#ff9800' },
      { icon: '🎯', label: '尝试次数', value: `${progress?.attempts || 0}`, color: '#4caf50' },
      { icon: '🔥', label: '最佳连击', value: `${progress?.bestCombo || 0}`, color: '#e94560' },
      { icon: '🎯', label: '最佳精准度', value: progress?.bestAccuracy ? `${progress.bestAccuracy}%` : '--', color: '#9c27b0' }
    ];

    stats.forEach((stat, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const x = 90 + col * 210;
      const y = 415 + row * 80;

      this.add.text(x - 30, y, stat.icon, {
        font: '28px Arial'
      }).setOrigin(0, 0.5);

      this.add.text(x + 10, y - 15, stat.label, {
        font: '13px Arial',
        color: '#888888'
      }).setOrigin(0, 0.5);

      this.add.text(x + 10, y + 15, stat.value, {
        font: 'bold 18px Arial',
        color: stat.color
      }).setOrigin(0, 0.5);
    });
  }

  private addRewardsSection(): void {
    this.add.text(375, 610, '🎁 塔层奖励', {
      font: 'bold 22px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    const rewards = this.floorData.rewards;
    const canClaim = SaveManager.canClaimTowerRewards(this.floorId);
    const claimed = SaveManager.getTowerFloorProgress(this.floorId)?.rewardsClaimed ?? false;

    let rewardY = 650;

    rewards.forEach((reward, index) => {
      const rarityColor = getRarityColor(reward.rarity);

      const rewardBg = this.add.graphics();
      rewardBg.fillStyle(0x0f3460, 0.9);
      rewardBg.fillRoundedRect(60, rewardY - 30, 630, 60, 12);
      rewardBg.lineStyle(2, rarityColor, canClaim ? 0.7 : (claimed ? 0.3 : 0.2));
      rewardBg.strokeRoundedRect(60, rewardY - 30, 630, 60, 12);

      let icon = '';
      switch (reward.type) {
        case 'score': icon = '💰'; break;
        case 'badge': icon = '🏅'; break;
        case 'fragment': icon = '🧩'; break;
        case 'research_point': icon = '🔬'; break;
        case 'material': icon = '📦'; break;
        default: icon = '🎁';
      }

      this.add.text(90, rewardY, icon, {
        font: '28px Arial'
      }).setOrigin(0, 0.5);

      this.add.text(140, rewardY - 12, reward.name, {
        font: 'bold 16px Arial',
        color: claimed ? '#666666' : '#ffffff'
      }).setOrigin(0, 0.5);

      this.add.text(140, rewardY + 12, reward.description, {
        font: '12px Arial',
        color: claimed ? '#555555' : '#888888'
      }).setOrigin(0, 0.5);

      const rarityText = getRarityText(reward.rarity);
      this.add.text(590, rewardY, rarityText, {
        font: 'bold 13px Arial',
        color: '#' + rarityColor.toString(16).padStart(6, '0')
      }).setOrigin(1, 0.5);

      if (reward.value) {
        const valueText = reward.type === 'score' ? `+${reward.value.toLocaleString()}` : `×${reward.value}`;
        this.add.text(590, rewardY - 18, valueText, {
          font: 'bold 14px Arial',
          color: '#4caf50'
        }).setOrigin(1, 0.5);
      }

      if (claimed) {
        this.add.text(660, rewardY, '✓', {
          font: 'bold 24px Arial',
          color: '#4caf50'
        }).setOrigin(1, 0.5);
      }

      rewardY += 70;
    });

    if (canClaim) {
      const claimBtn = this.add.graphics();
      claimBtn.fillStyle(0x4caf50, 1);
      claimBtn.fillRoundedRect(175, rewardY + 10, 400, 60, 14);
      claimBtn.setInteractive(
        new Phaser.Geom.Rectangle(175, rewardY + 10, 400, 60),
        Phaser.Geom.Rectangle.Contains
      );

      this.add.text(375, rewardY + 40, '🎁 领取奖励', {
        font: 'bold 20px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);

      claimBtn.on('pointerover', () => {
        claimBtn.clear();
        claimBtn.fillStyle(0x66bb6a, 1);
        claimBtn.fillRoundedRect(175, rewardY + 10, 400, 60, 14);
      });

      claimBtn.on('pointerout', () => {
        claimBtn.clear();
        claimBtn.fillStyle(0x4caf50, 1);
        claimBtn.fillRoundedRect(175, rewardY + 10, 400, 60, 14);
      });

      claimBtn.on('pointerup', () => {
        this.claimRewards();
      });
    } else if (claimed) {
      const claimedBadge = this.add.graphics();
      claimedBadge.fillStyle(0x2a3a4a, 1);
      claimedBadge.fillRoundedRect(225, rewardY + 10, 300, 50, 12);
      this.add.text(375, rewardY + 35, '✅ 奖励已领取', {
        font: 'bold 18px Arial',
        color: '#4caf50'
      }).setOrigin(0.5);
    }
  }

  private claimRewards(): void {
    const rewards = SaveManager.claimTowerRewards(this.floorId);
    if (rewards.length === 0) return;

    this.cameras.main.flash(300, 255, 215, 0);

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.85);
    overlay.fillRect(0, 0, 750, 1334);
    overlay.setInteractive();

    const modal = this.add.graphics();
    modal.fillStyle(0x16213e, 1);
    modal.fillRoundedRect(60, 350, 630, 550, 24);
    modal.lineStyle(4, 0xffd700, 1);
    modal.strokeRoundedRect(60, 350, 630, 550, 24);

    this.add.text(375, 410, '✨ 奖励已领取！', {
      font: 'bold 30px Arial',
      color: '#ffd700'
    }).setOrigin(0.5);

    rewards.forEach((reward, index) => {
      const rewardY = 470 + index * 75;
      const rarityColor = getRarityColor(reward.rarity);

      const rewardBg = this.add.graphics();
      rewardBg.fillStyle(0x0f3460, 0.9);
      rewardBg.fillRoundedRect(100, rewardY - 28, 550, 56, 12);
      rewardBg.lineStyle(2, rarityColor, 0.6);
      rewardBg.strokeRoundedRect(100, rewardY - 28, 550, 56, 12);

      let icon = '';
      switch (reward.type) {
        case 'score': icon = '💰'; break;
        case 'badge': icon = '🏅'; break;
        case 'fragment': icon = '🧩'; break;
        case 'research_point': icon = '🔬'; break;
        case 'material': icon = '📦'; break;
        default: icon = '🎁';
      }

      this.add.text(130, rewardY, icon, {
        font: '28px Arial'
      }).setOrigin(0, 0.5);

      this.add.text(180, rewardY - 10, reward.name, {
        font: 'bold 16px Arial',
        color: '#ffffff'
      }).setOrigin(0, 0.5);

      this.add.text(180, rewardY + 12, reward.description, {
        font: '12px Arial',
        color: '#888888'
      }).setOrigin(0, 0.5);

      const valueText = reward.value ? `+${reward.value.toLocaleString()}` : '已解锁';
      this.add.text(620, rewardY, valueText, {
        font: 'bold 16px Arial',
        color: '#4caf50'
      }).setOrigin(1, 0.5);
    });

    const confirmBtn = this.add.graphics();
    confirmBtn.fillStyle(0xffd700, 1);
    confirmBtn.fillRoundedRect(225, 780, 300, 55, 14);
    confirmBtn.setInteractive(
      new Phaser.Geom.Rectangle(225, 780, 300, 55),
      Phaser.Geom.Rectangle.Contains
    );

    this.add.text(375, 807, '太棒了！', {
      font: 'bold 20px Arial',
      color: '#1a1a2e'
    }).setOrigin(0.5);

    const close = () => {
      overlay.destroy();
      modal.destroy();
      confirmBtn.destroy();
      this.scene.restart();
    };

    confirmBtn.on('pointerup', close);
    overlay.on('pointerup', close);
  }

  private addButtons(): void {
    const btnY = 1200;
    const btnW = 280;
    const btnH = 60;
    const spacing = 20;

    const replayBtn = this.createButton(
      375 - btnW / 2 - spacing / 2,
      btnY,
      btnW,
      btnH,
      '🔄 再次挑战',
      0x2196f3,
      () => {
        this.scene.start('GameScene', {
          levelId: this.floorId,
          isTowerFloor: true,
          towerFloorId: this.floorId
        });
      }
    );

    const backBtn = this.createButton(
      375 + btnW / 2 + spacing / 2,
      btnY,
      btnW,
      btnH,
      '🏰 返回塔层',
      0xe94560,
      () => {
        this.scene.start('TowerSelectScene');
      }
    );

    const nextFloorId = this.floorId + 1;
    const nextFloor = getTowerFloor(nextFloorId);
    const nextUnlocked = nextFloor ? SaveManager.isTowerFloorUnlocked(nextFloorId) : false;

    if (nextFloor && nextUnlocked) {
      const nextBtn = this.createButton(
        375,
        btnY + btnH + 15,
        btnW * 2 + spacing,
        55,
        '▶ 挑战下一层',
        0x4caf50,
        () => {
          this.scene.start('GameScene', {
            levelId: nextFloorId,
            isTowerFloor: true,
            towerFloorId: nextFloorId
          });
        }
      );
    }
  }

  private createButton(
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
      font: 'bold 18px Arial',
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
