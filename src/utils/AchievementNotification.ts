import Phaser from 'phaser';
import { Achievement, Title } from '../types/GameTypes';

export class AchievementNotification {
  private static queue: Array<{ type: 'achievement' | 'title'; data: Achievement | Title }> = [];
  private static isShowing: boolean = false;

  static showAchievement(scene: Phaser.Scene, achievement: Achievement): void {
    this.queue.push({ type: 'achievement', data: achievement });
    this.showNext(scene);
  }

  static showTitle(scene: Phaser.Scene, title: Title): void {
    this.queue.push({ type: 'title', data: title });
    this.showNext(scene);
  }

  private static showNext(scene: Phaser.Scene): void {
    if (this.isShowing || this.queue.length === 0) return;

    this.isShowing = true;
    const item = this.queue.shift()!;

    const container = scene.add.container(750 / 2, -100);
    const isAchievement = item.type === 'achievement';
    const data = item.data;

    const bgColor = isAchievement ? 0xffd700 : 0x9c27b0;
    const icon = data.icon;
    const name = data.name;
    const desc = isAchievement ? '成就解锁！' : '称号获得！';
    const subDesc = isAchievement ? (data as Achievement).description : (data as Title).description;

    const bg = scene.add.graphics();
    bg.fillStyle(0x16213e, 0.95);
    bg.fillRoundedRect(-200, -40, 400, 80, 16);
    bg.lineStyle(3, bgColor, 1);
    bg.strokeRoundedRect(-200, -40, 400, 80, 16);
    container.add(bg);

    const iconText = scene.add.text(-150, 0, icon, {
      font: '36px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);
    container.add(iconText);

    const titleText = scene.add.text(-90, -15, name, {
      font: 'bold 18px Arial',
      color: '#ffffff'
    }).setOrigin(0, 0.5);
    container.add(titleText);

    const descText = scene.add.text(-90, 12, subDesc, {
      font: '13px Arial',
      color: '#aaaaaa'
    }).setOrigin(0, 0.5);
    container.add(descText);

    const badgeText = scene.add.text(150, 0, desc, {
      font: 'bold 12px Arial',
      color: isAchievement ? '#ffd700' : '#ce93d8'
    }).setOrigin(0.5);
    container.add(badgeText);

    scene.tweens.add({
      targets: container,
      y: 80,
      duration: 500,
      ease: 'Back.easeOut',
      onComplete: () => {
        scene.time.delayedCall(2500, () => {
          scene.tweens.add({
            targets: container,
            y: -100,
            duration: 400,
            ease: 'Back.easeIn',
            onComplete: () => {
              container.destroy();
              this.isShowing = false;
              this.showNext(scene);
            }
          });
        });
      }
    });
  }

  static showUnlockResult(scene: Phaser.Scene, result: { newlyUnlocked: Achievement[]; newlyUnlockedTitles: Title[] }): void {
    result.newlyUnlocked.forEach(a => this.queue.push({ type: 'achievement', data: a }));
    result.newlyUnlockedTitles.forEach(t => this.queue.push({ type: 'title', data: t }));
    this.showNext(scene);
  }
}
