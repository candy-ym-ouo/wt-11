import Phaser from 'phaser';
import { getEnding, getBranchRoute } from '../data/BranchRoutes';
import { SaveManager } from '../utils/SaveManager';
import { EndingData, BranchRouteType, Reward } from '../types/GameTypes';

export class EndingScene extends Phaser.Scene {
  private endingId: string = '';
  private routeId: BranchRouteType = 'flower';
  private ending!: EndingData;
  private currentStep: number = 0;
  private rewardsShown: boolean = false;

  constructor() {
    super('EndingScene');
  }

  init(data: { endingId: string; routeId: BranchRouteType }): void {
    this.endingId = data.endingId;
    this.routeId = data.routeId;
  }

  create(): void {
    const ending = getEnding(this.endingId);
    if (!ending) {
      this.scene.start('ChapterMapScene', { routeId: this.routeId });
      return;
    }
    this.ending = ending;

    this.addBackground();
    this.showTitle();
  }

  private addBackground(): void {
    const route = getBranchRoute(this.routeId);
    
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0a1a, 1);
    bg.fillRect(0, 0, 750, 1334);

    const gradientSteps = 30;
    for (let i = 0; i < gradientSteps; i++) {
      const t = i / gradientSteps;
      const r = Math.floor(((this.ending.primaryColor >> 16) & 0xff) * (1 - t) * 0.3);
      const g = Math.floor(((this.ending.primaryColor >> 8) & 0xff) * (1 - t) * 0.3);
      const b = Math.floor((this.ending.primaryColor & 0xff) * (1 - t) * 0.3);
      const color = (r << 16) | (g << 8) | b;
      bg.fillStyle(color, 0.5);
      bg.fillRect(0, 600 + i * 25, 750, 26);
    }

    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(50, 700);
      const y = Phaser.Math.Between(100, 1200);
      const size = Phaser.Math.Between(10, 30);
      const alpha = Phaser.Math.FloatBetween(0.1, 0.3);
      
      const particle = this.add.graphics();
      particle.fillStyle(this.ending.primaryColor, alpha);
      particle.fillCircle(x, y, size);

      this.tweens.add({
        targets: particle,
        y: y - 50,
        alpha: 0,
        duration: Phaser.Math.Between(3000, 6000),
        delay: Phaser.Math.Between(0, 3000),
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }

  private showTitle(): void {
    const centerX = 375;
    const centerY = 400;

    const title = this.add.text(centerX, centerY, this.ending.title, {
      font: 'bold 48px Arial',
      color: '#' + this.ending.primaryColor.toString(16).padStart(6, '0')
    }).setOrigin(0.5);
    title.setAlpha(0);

    const subtitle = this.add.text(centerX, centerY + 60, this.ending.subtitle, {
      font: '24px Arial',
      color: '#aaaaaa'
    }).setOrigin(0.5);
    subtitle.setAlpha(0);

    const description = this.add.text(centerX, centerY + 100, this.ending.description, {
      font: '20px Arial',
      color: '#eaeaea',
      align: 'center'
    }).setOrigin(0.5);
    description.setAlpha(0);

    this.tweens.add({
      targets: title,
      alpha: 1,
      y: centerY - 20,
      duration: 1000,
      ease: 'Power2.out'
    });

    this.time.delayedCall(500, () => {
      this.tweens.add({
        targets: subtitle,
        alpha: 1,
        duration: 800,
        ease: 'Power2.out'
      });
    });

    this.time.delayedCall(1000, () => {
      this.tweens.add({
        targets: description,
        alpha: 1,
        duration: 800,
        ease: 'Power2.out'
      });
    });

    this.time.delayedCall(2000, () => {
      this.showStory();
    });

    this.input.on('pointerup', () => {
      if (this.currentStep === 0) {
        this.currentStep = 1;
        this.showStory();
      } else if (this.currentStep === 1) {
        this.currentStep = 2;
        this.showRewards();
      } else if (this.currentStep === 2 && this.rewardsShown) {
        this.finishEnding();
      }
    });
  }

  private showStory(): void {
    if (this.currentStep < 1) {
      this.currentStep = 1;
    }

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, 750, 1334);
    overlay.setAlpha(0);

    const modal = this.add.graphics();
    modal.fillStyle(0x16213e, 1);
    modal.fillRoundedRect(50, 300, 650, 700, 24);
    modal.lineStyle(4, this.ending.primaryColor, 1);
    modal.strokeRoundedRect(50, 300, 650, 700, 24);
    modal.setAlpha(0);

    const icon = this.add.text(375, 360, '🏆', {
      font: '60px Arial'
    }).setOrigin(0.5);
    icon.setAlpha(0);

    const title = this.add.text(375, 430, this.ending.title, {
      font: 'bold 32px Arial',
      color: '#' + this.ending.primaryColor.toString(16).padStart(6, '0')
    }).setOrigin(0.5);
    title.setAlpha(0);

    const subtitle = this.add.text(375, 470, this.ending.subtitle, {
      font: '18px Arial',
      color: '#aaaaaa'
    }).setOrigin(0.5);
    subtitle.setAlpha(0);

    const storyBg = this.add.graphics();
    storyBg.fillStyle(0x0f3460, 0.8);
    storyBg.fillRoundedRect(80, 520, 590, 380, 16);
    storyBg.setAlpha(0);

    const storyText = this.add.text(375, 710, this.ending.longDescription, {
      font: '18px Arial',
      color: '#eaeaea',
      align: 'center',
      wordWrap: { width: 550 }
    }).setOrigin(0.5);
    storyText.setAlpha(0);

    const hint = this.add.text(375, 930, '点击继续', {
      font: '16px Arial',
      color: '#666666'
    }).setOrigin(0.5);
    hint.setAlpha(0);

    this.tweens.add({
      targets: [overlay, modal],
      alpha: 1,
      duration: 500,
      ease: 'Power2.out'
    });

    this.time.delayedCall(300, () => {
      this.tweens.add({
        targets: icon,
        alpha: 1,
        y: 350,
        duration: 600,
        ease: 'Bounce.Out'
      });
    });

    this.time.delayedCall(600, () => {
      this.tweens.add({
        targets: [title, subtitle],
        alpha: 1,
        duration: 500,
        ease: 'Power2.out'
      });
    });

    this.time.delayedCall(900, () => {
      this.tweens.add({
        targets: storyBg,
        alpha: 1,
        duration: 400,
        ease: 'Power2.out'
      });
      this.tweens.add({
        targets: storyText,
        alpha: 1,
        duration: 600,
        ease: 'Power2.out'
      });
    });

    this.time.delayedCall(1500, () => {
      this.tweens.add({
        targets: hint,
        alpha: 1,
        duration: 500,
        repeat: -1,
        yoyo: true,
        ease: 'Sine.easeInOut'
      });
    });
  }

  private showRewards(): void {
    if (this.currentStep < 2) {
      this.currentStep = 2;
    }

    this.children.removeAll(true);

    const bg = this.add.graphics();
    bg.fillStyle(0x0a0a1a, 1);
    bg.fillRect(0, 0, 750, 1334);

    const modal = this.add.graphics();
    modal.fillStyle(0x16213e, 1);
    modal.fillRoundedRect(50, 250, 650, 800, 24);
    modal.lineStyle(4, this.ending.primaryColor, 1);
    modal.strokeRoundedRect(50, 250, 650, 800, 24);

    const titleIcon = this.add.text(375, 310, '🎉', {
      font: '50px Arial'
    }).setOrigin(0.5);

    const title = this.add.text(375, 370, '恭喜通关！', {
      font: 'bold 36px Arial',
      color: '#4caf50'
    }).setOrigin(0.5);

    const subtitle = this.add.text(375, 410, `${this.ending.title} - 奖励解锁`, {
      font: '20px Arial',
      color: '#' + this.ending.primaryColor.toString(16).padStart(6, '0')
    }).setOrigin(0.5);

    const rewards = this.ending.rewards;
    const rewardStartY = 480;
    const rewardHeight = 90;

    rewards.forEach((reward, index) => {
      const rewardY = rewardStartY + index * rewardHeight;
      
      const rewardBg = this.add.graphics();
      rewardBg.fillStyle(0x0f3460, 0.9);
      rewardBg.fillRoundedRect(90, rewardY, 570, 75, 12);
      rewardBg.setAlpha(0);
      rewardBg.setScale(0.8);

      let icon = '🎁';
      let valueText = '';
      
      switch (reward.type) {
        case 'score':
          icon = '💰';
          valueText = `+${reward.value?.toLocaleString()} 分`;
          break;
        case 'badge':
          icon = '🏅';
          valueText = '徽章解锁';
          break;
        case 'specimen':
          icon = '🌱';
          valueText = '标本解锁';
          break;
      }

      const iconText = this.add.text(130, rewardY + 37, icon, {
        font: '36px Arial'
      }).setOrigin(0, 0.5);
      iconText.setAlpha(0);

      const rewardName = this.add.text(190, rewardY + 25, reward.name, {
        font: 'bold 20px Arial',
        color: '#ffffff'
      }).setOrigin(0, 0.5);
      rewardName.setAlpha(0);

      const rewardDesc = this.add.text(190, rewardY + 50, reward.description, {
        font: '15px Arial',
        color: '#aaaaaa'
      }).setOrigin(0, 0.5);
      rewardDesc.setAlpha(0);

      const rewardValue = this.add.text(630, rewardY + 37, valueText, {
        font: 'bold 20px Arial',
        color: '#ffd700'
      }).setOrigin(1, 0.5);
      rewardValue.setAlpha(0);

      this.time.delayedCall(300 + index * 200, () => {
        this.tweens.add({
          targets: [rewardBg, iconText, rewardName, rewardDesc, rewardValue],
          alpha: 1,
          scale: 1,
          duration: 500,
          ease: 'Back.out'
        });
      });
    });

    const totalY = rewardStartY + rewards.length * rewardHeight + 30;
    
    const divider = this.add.graphics();
    divider.fillStyle(0x333344, 0.5);
    divider.fillRect(100, totalY, 550, 2);
    divider.setAlpha(0);

    const route = getBranchRoute(this.routeId);
    const completedText = this.add.text(375, totalY + 30, 
      `${route?.name} 全部完成！`, {
      font: 'bold 22px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);
    completedText.setAlpha(0);

    const statsText = this.add.text(375, totalY + 60, 
      `总完成路线: ${SaveManager.getTotalRoutesCompleted()} / 3`, {
      font: '16px Arial',
      color: '#aaaaaa'
    }).setOrigin(0.5);
    statsText.setAlpha(0);

    this.time.delayedCall(300 + rewards.length * 200 + 200, () => {
      this.tweens.add({
        targets: [divider, completedText, statsText],
        alpha: 1,
        duration: 500,
        ease: 'Power2.out'
      });
    });

    const continueBtn = this.add.graphics();
    const btnY = 960;
    continueBtn.fillStyle(this.ending.primaryColor, 1);
    continueBtn.fillRoundedRect(200, btnY, 350, 65, 16);
    continueBtn.setInteractive(
      new Phaser.Geom.Rectangle(200, btnY, 350, 65),
      Phaser.Geom.Rectangle.Contains
    );
    continueBtn.setAlpha(0);

    this.add.text(375, btnY + 32, '继续探索', {
      font: 'bold 22px Arial',
      color: '#ffffff'
    }).setOrigin(0.5).setAlpha(0);

    this.time.delayedCall(300 + rewards.length * 200 + 600, () => {
      this.tweens.add({
        targets: [continueBtn],
        alpha: 1,
        duration: 500,
        ease: 'Power2.out'
      });
      this.children.list.forEach(child => {
        if (child instanceof Phaser.GameObjects.Text && 
            child.text === '继续探索') {
          this.tweens.add({
            targets: child,
            alpha: 1,
            duration: 500,
            ease: 'Power2.out'
          });
        }
      });
      this.rewardsShown = true;
    });

    continueBtn.on('pointerup', () => {
      this.finishEnding();
    });
  }

  private finishEnding(): void {
    this.cameras.main.fadeOut(500, 0, 0, 0);
    
    this.time.delayedCall(500, () => {
      this.scene.start('ChapterMapScene', { routeId: this.routeId });
    });
  }
}
