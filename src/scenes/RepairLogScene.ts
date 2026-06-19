import Phaser from 'phaser';
import { SaveManager } from '../utils/SaveManager';
import { RepairLogManager } from '../utils/RepairLogManager';
import { RepairLogEntry, KeyOperationType } from '../types/GameTypes';
import { formatTime } from '../utils/GameUtils';

type FilterMode = 'all' | 'star_upgrade' | 'new_record' | 'perfect' | 'event' | 'tower';

export class RepairLogScene extends Phaser.Scene {
  private filterMode: FilterMode = 'all';
  private specimenIdFilter: number | null = null;
  private scrollOffset: number = 0;
  private contentContainer!: Phaser.GameObjects.Container;
  private entriesList: RepairLogEntry[] = [];

  constructor() {
    super('RepairLogScene');
  }

  init(data?: { specimenId?: number }): void {
    this.specimenIdFilter = data?.specimenId ?? null;
    this.filterMode = 'all';
    this.scrollOffset = 0;
  }

  create(): void {
    this.addBackground();
    this.addTitle();
    this.addStatsBar();
    this.addFilterTabs();
    this.addEntriesList();
    this.addBackButton();
    this.setupScrolling();
  }

  private addBackground(): void {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    const bg = this.add.graphics();
    bg.fillStyle(0x16213e, 1);
    bg.fillRoundedRect(25, 100, 700, 1150, 20);
  }

  private addTitle(): void {
    this.add.text(375, 60, '植物标本修复', {
      font: 'bold 42px Arial',
      color: '#e94560'
    }).setOrigin(0.5);

    this.add.text(375, 100, this.specimenIdFilter ? '修复日志 - 单株详情' : '修复日志', {
      font: '28px Arial',
      color: '#eaeaea'
    }).setOrigin(0.5);
  }

  private addStatsBar(): void {
    const statsBg = this.add.graphics();
    statsBg.fillStyle(0x0f3460, 0.8);
    statsBg.fillRoundedRect(45, 130, 660, 60, 12);

    const stats = RepairLogManager.getStats();

    this.add.text(65, 160, '📋', { font: '22px Arial' }).setOrigin(0, 0.5);
    this.add.text(95, 160, `${stats.totalCompletions}次`, {
      font: 'bold 16px Arial',
      color: '#4caf50'
    }).setOrigin(0, 0.5);

    this.add.text(200, 160, '💎', { font: '22px Arial' }).setOrigin(0, 0.5);
    this.add.text(230, 160, `完美${stats.perfectClears}`, {
      font: 'bold 16px Arial',
      color: '#e0e0e0'
    }).setOrigin(0, 0.5);

    this.add.text(360, 160, '🏆', { font: '22px Arial' }).setOrigin(0, 0.5);
    this.add.text(390, 160, `破纪录${stats.newRecords}`, {
      font: 'bold 16px Arial',
      color: '#ffd700'
    }).setOrigin(0, 0.5);

    this.add.text(530, 160, '⭐', { font: '22px Arial' }).setOrigin(0, 0.5);
    this.add.text(560, 160, `升星${stats.starUpgrades}`, {
      font: 'bold 16px Arial',
      color: '#ff9800'
    }).setOrigin(0, 0.5);
  }

  private addFilterTabs(): void {
    const tabY = 218;
    const tabW = 105;
    const tabH = 40;
    const spacing = 5;
    const tabs: { key: FilterMode; label: string }[] = [
      { key: 'all', label: '全部' },
      { key: 'star_upgrade', label: '⭐ 升星' },
      { key: 'new_record', label: '🏆 纪录' },
      { key: 'perfect', label: '💎 完美' },
      { key: 'event', label: '🌸 活动' },
      { key: 'tower', label: '🏰 爬塔' },
    ];
    const totalWidth = tabW * tabs.length + spacing * (tabs.length - 1);
    const startX = (750 - totalWidth) / 2 + tabW / 2;

    tabs.forEach((tab, index) => {
      const x = startX + index * (tabW + spacing);
      const isSelected = this.filterMode === tab.key;

      const tabBg = this.add.graphics();
      tabBg.fillStyle(isSelected ? 0xe94560 : 0x0f3460, 1);
      tabBg.fillRoundedRect(x - tabW / 2, tabY - tabH / 2, tabW, tabH, 8);

      if (isSelected) {
        tabBg.lineStyle(2, 0xffffff, 0.6);
        tabBg.strokeRoundedRect(x - tabW / 2, tabY - tabH / 2, tabW, tabH, 8);
      }

      this.add.text(x, tabY, tab.label, {
        font: 'bold 13px Arial',
        color: isSelected ? '#ffffff' : '#aaaaaa'
      }).setOrigin(0.5);

      tabBg.setInteractive(
        new Phaser.Geom.Rectangle(x - tabW / 2, tabY - tabH / 2, tabW, tabH),
        Phaser.Geom.Rectangle.Contains
      );

      tabBg.on('pointerup', () => {
        this.filterMode = tab.key;
        this.scrollOffset = 0;
        this.scene.restart({ specimenId: this.specimenIdFilter });
      });
    });
  }

  private addEntriesList(): void {
    this.contentContainer = this.add.container(0, 0);

    let entries = this.specimenIdFilter
      ? RepairLogManager.getEntriesBySpecimen(this.specimenIdFilter)
      : RepairLogManager.getEntries();

    entries = this.applyFilter(entries);
    this.entriesList = entries;

    if (entries.length === 0) {
      this.add.text(375, 600, '暂无修复记录', {
        font: '24px Arial',
        color: '#888888'
      }).setOrigin(0.5);
      this.add.text(375, 640, '完成关卡后将自动记录修复日志', {
        font: '16px Arial',
        color: '#666666'
      }).setOrigin(0.5);
      return;
    }

    if (this.specimenIdFilter) {
      this.addSpecimenWaveChart();
    }

    const startY = this.specimenIdFilter ? 400 : 280;
    const itemH = 130;
    const itemW = 660;
    const padding = 12;

    const visibleCount = Math.min(entries.length, 8);
    const displayEntries = entries.slice(this.scrollOffset, this.scrollOffset + visibleCount);

    displayEntries.forEach((entry, index) => {
      const y = startY + index * (itemH + padding) + itemH / 2;
      this.createEntryCard(375, y, itemW, itemH, entry);
    });

    if (entries.length > visibleCount + this.scrollOffset) {
      this.add.text(375, startY + visibleCount * (itemH + padding) + 20, '⬇️ 向下滚动查看更多', {
        font: '16px Arial',
        color: '#666666'
      }).setOrigin(0.5);
    }
  }

  private applyFilter(entries: RepairLogEntry[]): RepairLogEntry[] {
    switch (this.filterMode) {
      case 'star_upgrade':
        return entries.filter(e => e.starChange > 0);
      case 'new_record':
        return entries.filter(e => e.keyOperations.includes('new_record'));
      case 'perfect':
        return entries.filter(e => e.keyOperations.includes('perfect_clear'));
      case 'event':
        return entries.filter(e => e.isEventLevel);
      case 'tower':
        return entries.filter(e => e.isTowerFloor);
      default:
        return entries;
    }
  }

  private addSpecimenWaveChart(): void {
    const stats = RepairLogManager.getSpecimenStats(this.specimenIdFilter!);
    if (stats.scoreHistory.length === 0) return;

    const chartX = 75;
    const chartY = 275;
    const chartW = 600;
    const chartH = 100;

    const chartBg = this.add.graphics();
    chartBg.fillStyle(0x0f3460, 0.6);
    chartBg.fillRoundedRect(chartX, chartY, chartW, chartH, 10);
    chartBg.lineStyle(1, 0xffffff, 0.1);
    chartBg.strokeRoundedRect(chartX, chartY, chartW, chartH, 10);

    this.add.text(chartX + chartW / 2, chartY + 12, '📊 成绩与用时波动趋势', {
      font: 'bold 13px Arial',
      color: '#aaaaaa'
    }).setOrigin(0.5, 0);

    const graphY = chartY + 30;
    const graphH = chartH - 40;
    const graphW = chartW - 40;
    const graphX = chartX + 30;

    const recentScores = stats.scoreHistory.slice(-15);
    const recentTimes = stats.timeHistory.slice(-15);
    const maxScore = Math.max(...recentScores, 1);
    const maxTime = Math.max(...recentTimes, 1);
    const step = graphW / Math.max(recentScores.length - 1, 1);

    const scoreLine = this.add.graphics();
    scoreLine.lineStyle(2, 0xffd700, 0.9);
    scoreLine.beginPath();
    recentScores.forEach((score, i) => {
      const px = graphX + i * step;
      const py = graphY + graphH - (score / maxScore) * graphH;
      if (i === 0) scoreLine.moveTo(px, py);
      else scoreLine.lineTo(px, py);
    });
    scoreLine.strokePath();

    const timeLine = this.add.graphics();
    timeLine.lineStyle(2, 0x2196f3, 0.7);
    timeLine.beginPath();
    recentTimes.forEach((time, i) => {
      const px = graphX + i * step;
      const py = graphY + graphH - (time / maxTime) * graphH;
      if (i === 0) timeLine.moveTo(px, py);
      else timeLine.lineTo(px, py);
    });
    timeLine.strokePath();

    this.add.text(graphX, chartY + chartH - 6, '— 分数', {
      font: '10px Arial',
      color: '#ffd700'
    }).setOrigin(0, 1);

    this.add.text(graphX + 65, chartY + chartH - 6, '— 用时', {
      font: '10px Arial',
      color: '#2196f3'
    }).setOrigin(0, 1);
  }

  private createEntryCard(
    x: number,
    y: number,
    w: number,
    h: number,
    entry: RepairLogEntry
  ): void {
    const card = this.add.graphics();
    card.fillStyle(0x0f3460, 0.9);
    card.fillRoundedRect(x - w / 2, y - h / 2, w, h, 12);
    card.lineStyle(2, this.getCardBorderColor(entry), 1);
    card.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 12);

    const diffColors: Record<string, number> = {
      easy: 0x4caf50,
      medium: 0xff9800,
      hard: 0xf44336,
    };
    const diffLabels: Record<string, string> = {
      easy: '简单',
      medium: '中等',
      hard: '困难',
    };

    const diffBg = this.add.graphics();
    const diffColor = diffColors[entry.difficulty] || 0x607d8b;
    diffBg.fillStyle(diffColor, 0.85);
    diffBg.fillRoundedRect(x - w / 2 + 10, y - h / 2 + 10, 55, 22, 6);
    this.add.text(x - w / 2 + 37, y - h / 2 + 21, diffLabels[entry.difficulty] || entry.difficulty, {
      font: 'bold 11px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    if (entry.isEventLevel) {
      const eventBg = this.add.graphics();
      eventBg.fillStyle(0xe91e63, 0.85);
      eventBg.fillRoundedRect(x - w / 2 + 70, y - h / 2 + 10, 80, 22, 6);
      this.add.text(x - w / 2 + 110, y - h / 2 + 21, '🌸 活动', {
        font: 'bold 11px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);
    }

    if (entry.isTowerFloor) {
      const towerBg = this.add.graphics();
      towerBg.fillStyle(0x9c27b0, 0.85);
      towerBg.fillRoundedRect(x - w / 2 + 70, y - h / 2 + 10, 80, 22, 6);
      this.add.text(x - w / 2 + 110, y - h / 2 + 21, '🏰 爬塔', {
        font: 'bold 11px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);
    }

    this.add.text(x - w / 2 + 15, y - h / 2 + 42, entry.specimenName, {
      font: 'bold 20px Arial',
      color: '#ffffff'
    }).setOrigin(0, 0);

    const dateStr = this.formatDate(entry.completedAt);
    this.add.text(x + w / 2 - 15, y - h / 2 + 14, dateStr, {
      font: '12px Arial',
      color: '#888888'
    }).setOrigin(1, 0);

    this.drawStars(x - w / 2 + 25, y + 5, entry.stars, 18);

    if (entry.starChange > 0) {
      const upgradeBg = this.add.graphics();
      upgradeBg.fillStyle(0xff9800, 0.9);
      upgradeBg.fillRoundedRect(x - w / 2 + 85, y - 2, 60, 20, 6);
      this.add.text(x - w / 2 + 115, y + 8, `+${entry.starChange}⭐`, {
        font: 'bold 11px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);
    }

    const scoreColor = entry.scoreDelta > 0 ? '#ffd700' : '#eaeaea';
    this.add.text(x - w / 2 + 15, y + 22, `🏆 ${entry.score.toLocaleString()}`, {
      font: 'bold 16px Arial',
      color: scoreColor
    }).setOrigin(0, 0);

    if (entry.scoreDelta > 0) {
      this.add.text(x - w / 2 + 165, y + 22, `+${entry.scoreDelta}`, {
        font: 'bold 14px Arial',
        color: '#4caf50'
      }).setOrigin(0, 0);
    }

    const timeColor = entry.timeDelta < 0 ? '#2196f3' : '#eaeaea';
    this.add.text(x + 15, y + 22, `⏱ ${formatTime(entry.time)}`, {
      font: 'bold 16px Arial',
      color: timeColor
    }).setOrigin(1, 0);

    if (entry.timeDelta < 0) {
      this.add.text(x + w / 2 - 15, y + 22, `${entry.timeDelta.toFixed(1)}s`, {
        font: 'bold 14px Arial',
        color: '#2196f3'
      }).setOrigin(1, 0);
    }

    const opTags = entry.keyOperations.slice(0, 4);
    let tagX = x - w / 2 + 15;
    const tagY = y + h / 2 - 25;
    opTags.forEach(op => {
      const label = RepairLogManager.getKeyOperationIcon(op) + ' ' + RepairLogManager.getKeyOperationLabel(op);
      const tagW = label.length * 11 + 16;

      const tagBg = this.add.graphics();
      tagBg.fillStyle(this.getOperationTagColor(op), 0.85);
      tagBg.fillRoundedRect(tagX, tagY, tagW, 22, 6);
      this.add.text(tagX + tagW / 2, tagY + 11, label, {
        font: 'bold 10px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);

      tagX += tagW + 6;
    });

    card.setInteractive(
      new Phaser.Geom.Rectangle(x - w / 2, y - h / 2, w, h),
      Phaser.Geom.Rectangle.Contains
    );

    card.on('pointerup', () => {
      this.showEntryDetail(entry);
    });
  }

  private getCardBorderColor(entry: RepairLogEntry): number {
    if (entry.keyOperations.includes('perfect_clear')) return 0xffd700;
    if (entry.keyOperations.includes('first_completion')) return 0x4caf50;
    if (entry.starChange > 0) return 0xff9800;
    if (entry.keyOperations.includes('new_record')) return 0xe94560;
    if (entry.isEventLevel) return 0xe91e63;
    if (entry.isTowerFloor) return 0x9c27b0;
    return 0x334466;
  }

  private getOperationTagColor(op: KeyOperationType): number {
    const colors: Record<KeyOperationType, number> = {
      first_completion: 0x4caf50,
      new_record: 0xffd700,
      new_best_time: 0x2196f3,
      star_upgrade: 0xff9800,
      perfect_clear: 0xe91e63,
      conservation_bonus: 0x66bb6a,
      combo_achieved: 0xff5722,
      no_hints_used: 0x00bcd4,
      event_level: 0xe91e63,
      tower_floor: 0x9c27b0,
      mirror_broken: 0x7c4dff,
    };
    return colors[op] || 0x607d8b;
  }

  private drawStars(x: number, y: number, stars: number, size: number): void {
    const spacing = 5;
    for (let i = 0; i < 3; i++) {
      const starX = x + i * (size + spacing);
      const tex = i < stars ? 'star-filled' : 'star-empty';
      this.add.image(starX, y, tex).setDisplaySize(size, size);
    }
  }

  private showEntryDetail(entry: RepairLogEntry): void {
    const container = this.add.container(0, 0);

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.75);
    overlay.fillRect(0, 0, 750, 1334);
    overlay.setInteractive();
    container.add(overlay);

    const modalH = 680;
    const modalY = (1334 - modalH) / 2;
    const modal = this.add.graphics();
    modal.fillStyle(0x16213e, 1);
    modal.fillRoundedRect(75, modalY, 600, modalH, 20);
    const borderColor = this.getCardBorderColor(entry);
    modal.lineStyle(3, borderColor, 1);
    modal.strokeRoundedRect(75, modalY, 600, modalH, 20);
    container.add(modal);

    this.add.text(375, modalY + 40, entry.specimenName, {
      font: 'bold 32px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    const dateStr = this.formatDateFull(entry.completedAt);
    this.add.text(375, modalY + 75, dateStr, {
      font: '16px Arial',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    this.drawStars(375, modalY + 115, entry.stars, 30);

    const statsBg = this.add.graphics();
    statsBg.fillStyle(0x0f3460, 0.7);
    statsBg.fillRoundedRect(105, modalY + 145, 540, 80, 12);
    container.add(statsBg);

    this.add.text(175, modalY + 175, '🏆 得分', {
      font: '14px Arial',
      color: '#888888'
    }).setOrigin(0.5);
    this.add.text(175, modalY + 200, entry.score.toLocaleString(), {
      font: 'bold 22px Arial',
      color: '#ffd700'
    }).setOrigin(0.5);

    this.add.text(375, modalY + 175, '⏱ 用时', {
      font: '14px Arial',
      color: '#888888'
    }).setOrigin(0.5);
    this.add.text(375, modalY + 200, formatTime(entry.time), {
      font: 'bold 22px Arial',
      color: '#2196f3'
    }).setOrigin(0.5);

    this.add.text(575, modalY + 175, '📊 对比', {
      font: '14px Arial',
      color: '#888888'
    }).setOrigin(0.5);
    const deltaText = entry.scoreDelta >= 0 ? `+${entry.scoreDelta}` : `${entry.scoreDelta}`;
    const deltaColor = entry.scoreDelta > 0 ? '#4caf50' : '#f44336';
    this.add.text(575, modalY + 200, deltaText, {
      font: 'bold 18px Arial',
      color: deltaColor
    }).setOrigin(0.5);

    const waveBg = this.add.graphics();
    waveBg.fillStyle(0x0f3460, 0.5);
    waveBg.fillRoundedRect(105, modalY + 240, 540, 100, 12);
    container.add(waveBg);

    this.add.text(375, modalY + 255, '📈 用时波动', {
      font: 'bold 13px Arial',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    const specStats = RepairLogManager.getSpecimenStats(entry.specimenId);
    const recentTimes = specStats.timeHistory.slice(-12);
    if (recentTimes.length > 1) {
      const gx = 125;
      const gy = modalY + 275;
      const gw = 500;
      const gh = 50;
      const maxT = Math.max(...recentTimes, 1);
      const step = gw / (recentTimes.length - 1);

      const timeGraph = this.add.graphics();
      timeGraph.lineStyle(2, 0x2196f3, 0.9);
      timeGraph.beginPath();
      recentTimes.forEach((t, i) => {
        const px = gx + i * step;
        const py = gy + gh - (t / maxT) * gh;
        if (i === 0) timeGraph.moveTo(px, py);
        else timeGraph.lineTo(px, py);
      });
      timeGraph.strokePath();

      recentTimes.forEach((t, i) => {
        const px = gx + i * step;
        const py = gy + gh - (t / maxT) * gh;
        const dot = this.add.graphics();
        dot.fillStyle(0x2196f3, 1);
        dot.fillCircle(px, py, 3);
      });
    } else {
      this.add.text(375, modalY + 305, '数据不足，需完成更多次数', {
        font: '12px Arial',
        color: '#666666'
      }).setOrigin(0.5);
    }

    const starChangeBg = this.add.graphics();
    starChangeBg.fillStyle(0x0f3460, 0.5);
    starChangeBg.fillRoundedRect(105, modalY + 355, 540, 65, 12);
    container.add(starChangeBg);

    this.add.text(375, modalY + 370, '⭐ 星级变化', {
      font: 'bold 13px Arial',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    const prevStarY = modalY + 398;
    this.add.text(200, prevStarY, '之前:', {
      font: '14px Arial',
      color: '#888888'
    }).setOrigin(0.5);
    this.drawStars(280, prevStarY, entry.previousStars, 16);
    this.add.text(420, prevStarY, '→ 现在:', {
      font: '14px Arial',
      color: '#888888'
    }).setOrigin(0.5);
    this.drawStars(520, prevStarY, entry.stars, 16);

    if (entry.keyOperations.length > 0) {
      const opsBg = this.add.graphics();
      opsBg.fillStyle(0x0f3460, 0.5);
      opsBg.fillRoundedRect(105, modalY + 435, 540, 20 + Math.ceil(entry.keyOperations.length / 3) * 30, 12);
      container.add(opsBg);

      this.add.text(375, modalY + 450, '🔑 关键操作', {
        font: 'bold 13px Arial',
        color: '#aaaaaa'
      }).setOrigin(0.5);

      entry.keyOperations.forEach((op, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const opX = 130 + col * 180;
        const opY = modalY + 472 + row * 28;
        const icon = RepairLogManager.getKeyOperationIcon(op);
        const label = RepairLogManager.getKeyOperationLabel(op);

        const opTag = this.add.graphics();
        opTag.fillStyle(this.getOperationTagColor(op), 0.85);
        opTag.fillRoundedRect(opX, opY, label.length * 12 + 30, 22, 6);
        this.add.text(opX + (label.length * 12 + 30) / 2, opY + 11, `${icon} ${label}`, {
          font: 'bold 11px Arial',
          color: '#ffffff'
        }).setOrigin(0.5);
      });
    }

    const closeBtn = this.add.graphics();
    closeBtn.fillStyle(borderColor, 1);
    const closeBtnY = modalY + modalH - 75;
    closeBtn.fillRoundedRect(250, closeBtnY, 250, 55, 14);
    closeBtn.setInteractive(
      new Phaser.Geom.Rectangle(250, closeBtnY, 250, 55),
      Phaser.Geom.Rectangle.Contains
    );
    container.add(closeBtn);

    this.add.text(375, closeBtnY + 27, '关闭', {
      font: 'bold 22px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    const close = () => container.destroy();
    closeBtn.on('pointerup', close);
    overlay.on('pointerup', close);
  }

  private setupScrolling(): void {
    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: any[], _dx: number, dy: number) => {
      if (this.entriesList.length <= 8) return;

      this.scrollOffset += dy > 0 ? 1 : -1;
      this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, this.entriesList.length - 8));

      this.children.removeAll(true);
      this.addBackground();
      this.addTitle();
      this.addStatsBar();
      this.addFilterTabs();
      this.addEntriesList();
      this.addBackButton();
      this.setupScrolling();
    });
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

    this.add.text(btnX, btnY, '返回', {
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
      if (this.specimenIdFilter) {
        this.scene.start('GalleryScene');
      } else {
        this.scene.start('ChapterSelectScene');
      }
    });
  }

  private formatDate(timestamp: number): string {
    const d = new Date(timestamp);
    return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }

  private formatDateFull(timestamp: number): string {
    const d = new Date(timestamp);
    return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
  }
}
