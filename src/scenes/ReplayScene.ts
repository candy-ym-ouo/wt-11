import Phaser from 'phaser';
import { ReplayData, SnapRecord, MistakeRecord, SpeedSample } from '../types/GameTypes';

export class ReplayScene extends Phaser.Scene {
  private replayData!: ReplayData;
  private isPlaying: boolean = false;
  private currentTime: number = 0;
  private playbackSpeed: number = 1;
  private pieces: Map<number, Phaser.GameObjects.Container> = new Map();
  private snapIndex: number = 0;
  private targetImage!: Phaser.GameObjects.Image;
  private timelineGraphics!: Phaser.GameObjects.Graphics;
  private playheadGraphics!: Phaser.GameObjects.Graphics;
  private timeLabel!: Phaser.GameObjects.Text;
  private mistakeMarkers: Phaser.GameObjects.Graphics[] = [];
  private speedChartGraphics!: Phaser.GameObjects.Graphics;

  constructor() {
    super('ReplayScene');
  }

  init(data: { replayData: ReplayData }): void {
    if (!data.replayData) {
      this.scene.start('LevelSelectScene');
      return;
    }
    this.replayData = data.replayData;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0d1117');
    
    this.addTitle();
    this.addStatsPanel();
    this.createPlayArea();
    this.createTimeline();
    this.createSpeedChart();
    this.createMistakesPanel();
    this.createControls();

    this.setupPieces();
    
    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  private addTitle(): void {
    this.add.text(375, 50, '📹 关卡复盘', {
      font: 'bold 28px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(375, 85, this.replayData.levelName, {
      font: '18px Arial',
      color: '#8899aa'
    }).setOrigin(0.5);

    const backBtn = this.add.graphics();
    backBtn.fillStyle(0x2d3748, 1);
    backBtn.fillRoundedRect(20, 30, 80, 40, 10);
    backBtn.setInteractive(
      new Phaser.Geom.Rectangle(20, 30, 80, 40),
      Phaser.Geom.Rectangle.Contains
    );
    
    this.add.text(60, 50, '返回', {
      font: 'bold 16px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    backBtn.on('pointerup', () => {
      this.scene.start('LevelSelectScene');
    });
  }

  private addStatsPanel(): void {
    const panelY = 130;
    const panel = this.add.graphics();
    panel.fillStyle(0x161b22, 0.95);
    panel.fillRoundedRect(20, panelY, 710, 80, 12);
    panel.lineStyle(1, 0x30363d, 1);
    panel.strokeRoundedRect(20, panelY, 710, 80, 12);

    const stats = [
      { icon: '⭐', value: '★'.repeat(this.replayData.stars) + '☆'.repeat(3 - this.replayData.stars), color: '#ffd700' },
      { icon: '🏆', value: this.replayData.score.toLocaleString(), color: '#ff9800' },
      { icon: '⏱️', value: this.formatTime(this.replayData.totalTime), color: '#2196f3' },
      { icon: '🎯', value: `${this.replayData.totalPieces} 片`, color: '#4caf50' }
    ];

    const itemWidth = 710 / stats.length;
    stats.forEach((stat, index) => {
      const x = 20 + itemWidth * (index + 0.5);
      
      this.add.text(x, panelY + 30, stat.icon, {
        font: '24px Arial'
      }).setOrigin(0.5);

      this.add.text(x, panelY + 60, stat.value, {
        font: 'bold 16px Arial',
        color: stat.color
      }).setOrigin(0.5);
    });
  }

  private createPlayArea(): void {
    const areaY = 240;
    const areaHeight = 400;
    
    const area = this.add.graphics();
    area.fillStyle(0x0d1117, 1);
    area.fillRoundedRect(20, areaY, 710, areaHeight, 12);
    area.lineStyle(1, 0x30363d, 1);
    area.strokeRoundedRect(20, areaY, 710, areaHeight, 12);

    const centerX = 375;
    const centerY = areaY + areaHeight / 2;

    const placeholder = this.add.graphics();
    placeholder.fillStyle(0x161b22, 1);
    placeholder.fillRoundedRect(centerX - 150, centerY - 150, 300, 300, 8);
    
    this.add.text(centerX, centerY, '🧩', {
      font: '64px Arial'
    }).setOrigin(0.5);

    this.add.text(centerX, centerY + 50, '碎片还原区', {
      font: '14px Arial',
      color: '#8899aa'
    }).setOrigin(0.5);
  }

  private setupPieces(): void {
    // 简化版：用色块表示碎片位置
    // 实际项目中应该加载纹理
  }

  private createTimeline(): void {
    const timelineY = 670;
    const timelineHeight = 50;
    const timelineWidth = 710;
    const timelineX = 20;

    const bg = this.add.graphics();
    bg.fillStyle(0x161b22, 0.95);
    bg.fillRoundedRect(timelineX, timelineY, timelineWidth, timelineHeight, 8);
    bg.lineStyle(1, 0x30363d, 1);
    bg.strokeRoundedRect(timelineX, timelineY, timelineWidth, timelineHeight, 8);

    this.timelineGraphics = this.add.graphics();
    this.timelineGraphics.setDepth(1);

    this.playheadGraphics = this.add.graphics();
    this.playheadGraphics.setDepth(2);

    this.timeLabel = this.add.text(375, timelineY + 25, '00:00 / ' + this.formatTime(this.replayData.totalTime), {
      font: 'bold 14px Arial',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(3);

    // 添加吸附标记
    this.replayData.snapRecords.forEach((snap) => {
      const progress = snap.timestamp / this.replayData.totalTime;
      const x = timelineX + progress * timelineWidth;
      
      const marker = this.add.graphics();
      marker.fillStyle(snap.isPerfect ? 0x4caf50 : 0x2196f3, 0.6);
      marker.fillRect(x - 1, timelineY + 5, 2, timelineHeight - 10);
      marker.setDepth(1);
    });

    // 添加失误标记
    this.replayData.mistakeRecords.forEach((mistake) => {
      const progress = mistake.timestamp / this.replayData.totalTime;
      const x = timelineX + progress * timelineWidth;
      
      const marker = this.add.graphics();
      marker.fillStyle(0xe94560, 0.8);
      marker.fillTriangle(x, timelineY + 5, x - 5, timelineY + 15, x + 5, timelineY + 15);
      marker.setDepth(2);
      
      this.mistakeMarkers.push(marker);
    });
  }

  private createSpeedChart(): void {
    const chartY = 750;
    const chartHeight = 120;
    const chartWidth = 710;
    const chartX = 20;

    const bg = this.add.graphics();
    bg.fillStyle(0x161b22, 0.95);
    bg.fillRoundedRect(chartX, chartY, chartWidth, chartHeight, 8);
    bg.lineStyle(1, 0x30363d, 1);
    bg.strokeRoundedRect(chartX, chartY, chartWidth, chartHeight, 8);

    this.add.text(chartX + 15, chartY + 15, '📈 速度曲线', {
      font: 'bold 14px Arial',
      color: '#ffffff'
    }).setOrigin(0, 0.5);

    this.speedChartGraphics = this.add.graphics();
    this.speedChartGraphics.setDepth(1);

    if (this.replayData.speedSamples.length > 1) {
      this.drawSpeedChart(chartX, chartY, chartWidth, chartHeight);
    } else {
      this.add.text(chartX + chartWidth / 2, chartY + chartHeight / 2, '速度数据不足', {
        font: '14px Arial',
        color: '#8899aa'
      }).setOrigin(0.5);
    }
  }

  private drawSpeedChart(x: number, y: number, width: number, height: number): void {
    const samples = this.replayData.speedSamples;
    const maxSpeed = Math.max(...samples.map(s => s.piecesPerSecond), 0.1);
    const padding = { top: 30, bottom: 15, left: 40, right: 15 };
    
    const chartInnerWidth = width - padding.left - padding.right;
    const chartInnerHeight = height - padding.top - padding.bottom;

    // 绘制网格线
    this.speedChartGraphics.lineStyle(1, 0x30363d, 0.5);
    for (let i = 0; i <= 3; i++) {
      const lineY = y + padding.top + (chartInnerHeight / 3) * i;
      this.speedChartGraphics.beginPath();
      this.speedChartGraphics.moveTo(x + padding.left, lineY);
      this.speedChartGraphics.lineTo(x + width - padding.right, lineY);
      this.speedChartGraphics.strokePath();
    }

    // 绘制速度曲线
    this.speedChartGraphics.lineStyle(2, 0x2196f3, 1);
    this.speedChartGraphics.beginPath();

    samples.forEach((sample, index) => {
      const progress = sample.timestamp / this.replayData.totalTime;
      const px = x + padding.left + progress * chartInnerWidth;
      const py = y + padding.top + chartInnerHeight - (sample.piecesPerSecond / maxSpeed) * chartInnerHeight;
      
      if (index === 0) {
        this.speedChartGraphics.moveTo(px, py);
      } else {
        this.speedChartGraphics.lineTo(px, py);
      }
    });
    this.speedChartGraphics.strokePath();

    // 填充曲线下方区域
    this.speedChartGraphics.fillStyle(0x2196f3, 0.15);
    this.speedChartGraphics.beginPath();
    this.speedChartGraphics.moveTo(x + padding.left, y + padding.top + chartInnerHeight);
    
    samples.forEach((sample) => {
      const progress = sample.timestamp / this.replayData.totalTime;
      const px = x + padding.left + progress * chartInnerWidth;
      const py = y + padding.top + chartInnerHeight - (sample.piecesPerSecond / maxSpeed) * chartInnerHeight;
      this.speedChartGraphics.lineTo(px, py);
    });
    
    this.speedChartGraphics.lineTo(x + width - padding.right, y + padding.top + chartInnerHeight);
    this.speedChartGraphics.closePath();
    this.speedChartGraphics.fillPath();

    // Y轴标签
    this.add.text(x + 5, y + padding.top, maxSpeed.toFixed(1) + '/s', {
      font: '10px Arial',
      color: '#8899aa'
    }).setOrigin(0, 0.5);

    this.add.text(x + 5, y + height - padding.bottom, '0/s', {
      font: '10px Arial',
      color: '#8899aa'
    }).setOrigin(0, 0.5);
  }

  private createMistakesPanel(): void {
    const panelY = 895;
    const panelHeight = 200;

    const bg = this.add.graphics();
    bg.fillStyle(0x161b22, 0.95);
    bg.fillRoundedRect(20, panelY, 710, panelHeight, 8);
    bg.lineStyle(1, 0x30363d, 1);
    bg.strokeRoundedRect(20, panelY, 710, panelHeight, 8);

    this.add.text(40, panelY + 25, '❌ 关键失误节点', {
      font: 'bold 16px Arial',
      color: '#ffffff'
    }).setOrigin(0, 0.5);

    const mistakes = this.replayData.mistakeRecords;
    
    if (mistakes.length === 0) {
      this.add.text(375, panelY + panelHeight / 2, '🎉 完美通关！没有失误', {
        font: '16px Arial',
        color: '#4caf50'
      }).setOrigin(0.5);
      return;
    }

    const listY = panelY + 50;
    const itemHeight = 40;
    const maxShow = Math.min(mistakes.length, 3);

    mistakes.slice(0, maxShow).forEach((mistake, index) => {
      const itemY = listY + index * itemHeight;
      
      const itemBg = this.add.graphics();
      itemBg.fillStyle(0x0d1117, 0.6);
      itemBg.fillRoundedRect(40, itemY, 670, 35, 6);
      itemBg.lineStyle(1, 0x30363d, 1);
      itemBg.strokeRoundedRect(40, itemY, 670, 35, 6);
      itemBg.setInteractive(
        new Phaser.Geom.Rectangle(40, itemY, 670, 35),
        Phaser.Geom.Rectangle.Contains
      );

      const typeLabels: Record<string, string> = {
        'missed_snap': '吸附偏差',
        'mirror_snap': '镜像碎片',
        'wrong_rotation': '旋转错误'
      };

      const typeLabel = typeLabels[mistake.type] || mistake.type;
      const timeStr = this.formatTime(mistake.timestamp);

      this.add.text(60, itemY + 17.5, `⏱️ ${timeStr}`, {
        font: 'bold 14px Arial',
        color: '#e94560'
      }).setOrigin(0, 0.5);

      this.add.text(200, itemY + 17.5, typeLabel, {
        font: '14px Arial',
        color: '#ffffff'
      }).setOrigin(0, 0.5);

      this.add.text(680, itemY + 17.5, '跳转到 →', {
        font: '13px Arial',
        color: '#8899aa'
      }).setOrigin(1, 0.5);

      itemBg.on('pointerup', () => {
        this.jumpToTime(mistake.timestamp);
      });
    });

    if (mistakes.length > maxShow) {
      this.add.text(375, panelY + panelHeight - 20, `还有 ${mistakes.length - maxShow} 个失误...`, {
        font: '13px Arial',
        color: '#8899aa'
      }).setOrigin(0.5);
    }
  }

  private createControls(): void {
    const controlsY = 1120;
    const btnWidth = 120;
    const btnHeight = 50;

    // 播放/暂停按钮
    const playBtn = this.add.graphics();
    playBtn.fillStyle(0x2196f3, 1);
    playBtn.fillRoundedRect(315, controlsY, 120, 50, 12);
    playBtn.setInteractive(
      new Phaser.Geom.Rectangle(315, controlsY, 120, 50),
      Phaser.Geom.Rectangle.Contains
    );

    const playLabel = this.add.text(375, controlsY + 25, '▶ 播放', {
      font: 'bold 18px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    playBtn.on('pointerup', () => {
      this.togglePlay();
      playLabel.setText(this.isPlaying ? '⏸ 暂停' : '▶ 播放');
    });

    // 速度控制
    const speeds = [0.5, 1, 1.5, 2];
    const speedLabels = ['0.5x', '1x', '1.5x', '2x'];
    
    speeds.forEach((speed, index) => {
      const x = 470 + index * 70;
      const btn = this.add.graphics();
      const isActive = speed === this.playbackSpeed;
      btn.fillStyle(isActive ? 0x9c27b0 : 0x2d3748, 1);
      btn.fillRoundedRect(x, controlsY, 60, 50, 8);
      btn.setInteractive(
        new Phaser.Geom.Rectangle(x, controlsY, 60, 50),
        Phaser.Geom.Rectangle.Contains
      );

      this.add.text(x + 30, controlsY + 25, speedLabels[index], {
        font: 'bold 14px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);

      btn.on('pointerup', () => {
        this.setPlaybackSpeed(speed);
        this.scene.restart({ replayData: this.replayData });
      });
    });

    // 重置按钮
    const resetBtn = this.add.graphics();
    resetBtn.fillStyle(0x2d3748, 1);
    resetBtn.fillRoundedRect(200, controlsY, 100, 50, 12);
    resetBtn.setInteractive(
      new Phaser.Geom.Rectangle(200, controlsY, 100, 50),
      Phaser.Geom.Rectangle.Contains
    );

    this.add.text(250, controlsY + 25, '🔄 重置', {
      font: 'bold 16px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    resetBtn.on('pointerup', () => {
      this.resetPlayback();
      playLabel.setText('▶ 播放');
    });
  }

  private togglePlay(): void {
    this.isPlaying = !this.isPlaying;
    if (this.isPlaying) {
      this.startPlayback();
    }
  }

  private setPlaybackSpeed(speed: number): void {
    this.playbackSpeed = speed;
  }

  private startPlayback(): void {
    // 简化版本，仅更新时间显示
    // 实际项目中需要动画碎片移动
    const totalDuration = this.replayData.totalTime * 1000;
    const startTime = this.time.now - this.currentTime * 1000;
    
    const updatePlayback = () => {
      if (!this.isPlaying) return;
      
      const elapsed = (this.time.now - startTime) / 1000 * this.playbackSpeed;
      this.currentTime = Math.min(elapsed, this.replayData.totalTime);
      
      this.updatePlayhead();
      this.updateTimeLabel();
      
      if (this.currentTime >= this.replayData.totalTime) {
        this.isPlaying = false;
        return;
      }
      
      this.time.delayedCall(16, updatePlayback);
    };
    
    updatePlayback();
  }

  private updatePlayhead(): void {
    const timelineY = 670;
    const timelineHeight = 50;
    const timelineWidth = 710;
    const timelineX = 20;
    
    const progress = this.currentTime / this.replayData.totalTime;
    const x = timelineX + progress * timelineWidth;
    
    this.playheadGraphics.clear();
    this.playheadGraphics.fillStyle(0xffffff, 1);
    this.playheadGraphics.fillRect(x - 2, timelineY + 3, 4, timelineHeight - 6);
  }

  private updateTimeLabel(): void {
    const current = this.formatTime(this.currentTime);
    const total = this.formatTime(this.replayData.totalTime);
    this.timeLabel.setText(`${current} / ${total}`);
  }

  private jumpToTime(time: number): void {
    this.currentTime = time;
    this.snapIndex = 0;
    
    // 找到当前时间对应的吸附索引
    while (
      this.snapIndex < this.replayData.snapRecords.length &&
      this.replayData.snapRecords[this.snapIndex].timestamp <= time
    ) {
      this.snapIndex++;
    }
    
    this.updatePlayhead();
    this.updateTimeLabel();
  }

  private resetPlayback(): void {
    this.isPlaying = false;
    this.currentTime = 0;
    this.snapIndex = 0;
    this.playbackSpeed = 1;
    this.updatePlayhead();
    this.updateTimeLabel();
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  update(time: number, delta: number): void {
    // 播放逻辑在 startPlayback 中通过 delayedCall 处理
  }
}
