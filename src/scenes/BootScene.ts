import Phaser from 'phaser';
import { SaveManager } from '../utils/SaveManager';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    this.load.setBaseURL('assets/');
  }

  create(): void {
    SaveManager.init();
    this.scene.start('PreloadScene');
  }
}
