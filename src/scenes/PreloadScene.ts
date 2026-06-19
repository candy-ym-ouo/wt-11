import Phaser from 'phaser';
import { TextureGenerator } from '../utils/TextureGenerator';

export class PreloadScene extends Phaser.Scene {
  private progressBar!: Phaser.GameObjects.Graphics;
  private progressBox!: Phaser.GameObjects.Graphics;
  private loadingText!: Phaser.GameObjects.Text;
  private percentText!: Phaser.GameObjects.Text;

  constructor() {
    super('PreloadScene');
  }

  preload(): void {
    this.createProgressBar();
    this.simulateLoading();
  }

  private createProgressBar(): void {
    const width = 400;
    const height = 50;
    const x = (this.cameras.main.width - width) / 2;
    const y = (this.cameras.main.height - height) / 2;

    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(0x222222, 0.8);
    this.progressBox.fillRoundedRect(x, y, width, height, 10);

    this.progressBar = this.add.graphics();

    this.loadingText = this.add.text(
      this.cameras.main.width / 2,
      y - 60,
      '加载中...',
      {
        font: '28px Arial',
        color: '#ffffff'
      }
    ).setOrigin(0.5);

    this.percentText = this.add.text(
      this.cameras.main.width / 2,
      y + height / 2,
      '0%',
      {
        font: '24px Arial',
        color: '#ffffff'
      }
    ).setOrigin(0.5);
  }

  private simulateLoading(): void {
    let progress = 0;
    const interval = this.time.addEvent({
      delay: 30,
      loop: true,
      callback: () => {
        progress += 2;
        if (progress >= 100) {
          progress = 100;
          interval.remove(false);
          this.generateTextures();
          this.time.delayedCall(300, () => {
            this.scene.start('LevelSelectScene');
          });
        }
        this.updateProgressBar(progress / 100);
      }
    });
  }

  private updateProgressBar(value: number): void {
    const width = 380;
    const height = 30;
    const x = (this.cameras.main.width - width) / 2;
    const y = (this.cameras.main.height - height) / 2;

    this.progressBar.clear();
    this.progressBar.fillStyle(0x4caf50, 1);
    this.progressBar.fillRoundedRect(x, y, width * value, height, 8);

    this.percentText.setText(`${Math.floor(value * 100)}%`);
  }

  private generateTextures(): void {
    TextureGenerator.generateAll(this);
  }

  create(): void {}
}
