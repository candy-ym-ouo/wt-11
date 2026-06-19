import Phaser from 'phaser';
import { EventManager } from '../utils/EventManager';
import { SaveManager } from '../utils/SaveManager';
import { getEventById } from '../data/Events';
import { getEventLevelRulesByEventId } from '../data/EventLevelRules';
import { EventData, EventRankingData, RankingEntry } from '../types/GameTypes';

export class EventRankingScene extends Phaser.Scene {
  private eventId!: string;
  private eventData!: EventData;
  private rankingData!: EventRankingData;
  private lastUpdatedText!: Phaser.GameObjects.Text;
  private refreshTimer!: Phaser.Time.TimerEvent;

  constructor() {
    super('EventRankingScene');
  }

  init(data: { eventId: string }): void {
    this.eventId = data.eventId;
    this.eventData = getEventById(data.eventId)!;
  }

  create(): void {
    this.addBackground();
    this.addHeader();
    this.loadRankingData();
    this.addTopThreePodium();
    this.addRankingList();
    this.addMyRankingCard();
    this.addBottomButtons();
    this.startAutoRefresh();
  }

  private addBackground(): void {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    const bg = this.add.graphics();
    bg.fillStyle(0x16213e, 1);
    bg.fillRoundedRect(20, 120, 710, 1150, 20);

    const decor = this.add.graphics();
    for (let i = 0; i < 8; i++) {
      const x = Phaser.Math.Between(50, 700);
      const y = Phaser.Math.Between(140, 1230);
      const size = Phaser.Math.Between(15, 50);
      decor.fillStyle(0xffd700, 0.03);
      decor.fillCircle(x, y, size);
    }
  }

  private addHeader(): void {
    const event = this.eventData;

    const headerBg = this.add.graphics();
    headerBg.fillStyle(0xff9800, 1);
    headerBg.fillRoundedRect(20, 25, 710, 80, 14);

    this.add.text(375, 50, '🏆 积分排行榜', {
      font: 'bold 30px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(375, 85, event.name, {
      font: '16px Arial',
      color: 'rgba(255,255,255,0.9)'
    }).setOrigin(0.5);

    const countdownTime = EventManager.getTimeRemaining(event.endTime);
    this.add.text(680, 55, `⏰ ${EventManager.formatCountdownShort(countdownTime)}`, {
      font: 'bold 15px Arial',
      color: '#ffffff'
    }).setOrigin(1, 0.5);

    this.lastUpdatedText = this.add.text(680, 82, '刷新中...', {
      font: '12px Arial',
      color: 'rgba(255,255,255,0.75)'
    }).setOrigin(1, 0.5);

    const backBtn = this.add.graphics();
    backBtn.fillStyle(0x000000, 0.2);
    backBtn.fillRoundedRect(35, 40, 50, 50, 10);
    backBtn.setInteractive(
      new Phaser.Geom.Rectangle(35, 40, 50, 50),
      Phaser.Geom.Rectangle.Contains
    );
    this.add.text(60, 65, '←', {
      font: 'bold 28px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    backBtn.on('pointerup', () => {
      this.scene.start('EventScene');
    });
  }

  private loadRankingData(forceRefresh: boolean = false): void {
    this.rankingData = EventManager.generateRanking(this.eventId, forceRefresh);
    this.updateLastUpdatedText();
  }

  private updateLastUpdatedText(): void {
    const elapsed = Math.floor((Date.now() - this.rankingData.lastUpdated) / 1000);
    if (elapsed < 60) {
      this.lastUpdatedText.setText(`刚刚更新`);
    } else if (elapsed < 3600) {
      this.lastUpdatedText.setText(`${Math.floor(elapsed / 60)}分钟前更新`);
    } else {
      this.lastUpdatedText.setText(`${Math.floor(elapsed / 3600)}小时前更新`);
    }
  }

  private startAutoRefresh(): void {
    this.refreshTimer = this.time.addEvent({
      delay: 30000,
      loop: true,
      callback: () => {
        this.updateLastUpdatedText();
      }
    });
  }

  private addTopThreePodium(): void {
    const podiumY = 260;
    const entries = this.rankingData.entries.slice(0, 3);

    const titleBg = this.add.graphics();
    titleBg.fillStyle(0x0f3460, 0.8);
    titleBg.fillRoundedRect(40, 145, 670, 50, 10);
    this.add.text(375, 170, '🌟 荣耀三甲 🌟', {
      font: 'bold 22px Arial',
      color: '#ffd700'
    }).setOrigin(0.5);

    const positions = [
      { rank: 2, x: 220, y: podiumY + 40, height: 120, width: 150, color: 0xb0bec5, medal: '🥈' },
      { rank: 1, x: 375, y: podiumY, height: 180, width: 170, color: 0xffd700, medal: '🥇' },
      { rank: 3, x: 530, y: podiumY + 70, height: 90, width: 150, color: 0xcd7f32, medal: '🥉' }
    ];

    positions.forEach(pos => {
      const entry = entries.find(e => e.rank === pos.rank);
      if (!entry) return;

      const podium = this.add.graphics();
      podium.fillStyle(pos.color, 0.9);
      podium.fillRoundedRect(pos.x - pos.width / 2, pos.y - pos.height + 60, pos.width, pos.height, 8);
      podium.lineStyle(3, pos.color, 1);
      podium.strokeRoundedRect(pos.x - pos.width / 2, pos.y - pos.height + 60, pos.width, pos.height, 8);

      this.add.text(pos.x, pos.y - pos.height + 25, pos.medal, { font: '32px Arial' }).setOrigin(0.5);

      const avatarBg = this.add.graphics();
      avatarBg.fillStyle(0x16213e, 1);
      avatarBg.fillCircle(pos.x, pos.y - pos.height + 70, 30);
      avatarBg.lineStyle(3, pos.color, 1);
      avatarBg.strokeCircle(pos.x, pos.y - pos.height + 70, 30);

      this.add.text(pos.x, pos.y - pos.height + 70, entry.avatar, { font: '28px Arial' }).setOrigin(0.5);

      this.add.text(pos.x, pos.y - pos.height + 115, entry.playerName, {
        font: 'bold 15px Arial',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: pos.width - 20 }
      }).setOrigin(0.5);

      this.add.text(pos.x, pos.y - 15, entry.score.toLocaleString(), {
        font: 'bold 22px Arial',
        color: '#1a1a2e'
      }).setOrigin(0.5);

      this.add.text(pos.x, pos.y + 12, `${entry.stars}⭐ ${entry.levelsCompleted}关`, {
        font: '12px Arial',
        color: 'rgba(0,0,0,0.7)'
      }).setOrigin(0.5);
    });
  }

  private addRankingList(): void {
    const listStartY = 440;
    const itemHeight = 75;
    const itemSpacing = 8;
    const maxVisible = 8;

    const listBg = this.add.graphics();
    listBg.fillStyle(0x0f3460, 0.6);
    listBg.fillRoundedRect(40, listStartY - 10, 670, (itemHeight + itemSpacing) * maxVisible + 20, 12);

    const header = this.add.graphics();
    header.fillStyle(0x0f3460, 0.95);
    header.fillRoundedRect(50, listStartY, 650, 45, 8);

    this.add.text(85, listStartY + 22, '排名', {
      font: 'bold 14px Arial',
      color: '#888888'
    }).setOrigin(0, 0.5);

    this.add.text(150, listStartY + 22, '玩家', {
      font: 'bold 14px Arial',
      color: '#888888'
    }).setOrigin(0, 0.5);

    this.add.text(480, listStartY + 22, '星星', {
      font: 'bold 14px Arial',
      color: '#888888'
    }).setOrigin(0, 0.5);

    this.add.text(560, listStartY + 22, '关卡', {
      font: 'bold 14px Arial',
      color: '#888888'
    }).setOrigin(0, 0.5);

    this.add.text(670, listStartY + 22, '积分', {
      font: 'bold 14px Arial',
      color: '#888888'
    }).setOrigin(1, 0.5);

    const entries = this.rankingData.entries.slice(3, 3 + maxVisible);

    entries.forEach((entry, index) => {
      const y = listStartY + 55 + index * (itemHeight + itemSpacing) + itemHeight / 2;
      this.createRankingItem(y, entry);
    });
  }

  private createRankingItem(y: number, entry: RankingEntry): void {
    const x = 375;
    const w = 650;
    const h = 75;

    const item = this.add.graphics();
    const bgColor = entry.isCurrentPlayer ? 0x2e4a6b : 0x1a2a40;
    item.fillStyle(bgColor, 1);
    item.fillRoundedRect(x - w / 2, y - h / 2, w, h, 10);

    if (entry.isCurrentPlayer) {
      item.lineStyle(2, 0x4caf50, 1);
      item.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 10);
    }

    let rankColor = 0x888888;
    if (entry.rank <= 10) rankColor = 0xffd700;
    else if (entry.rank <= 50) rankColor = 0xff9800;

    this.add.text(x - w / 2 + 35, y, `#${entry.rank}`, {
      font: 'bold 18px Arial',
      color: '#' + rankColor.toString(16).padStart(6, '0')
    }).setOrigin(0, 0.5);

    const avatarX = x - w / 2 + 100;
    const avatarBg = this.add.graphics();
    avatarBg.fillStyle(0x16213e, 1);
    avatarBg.fillCircle(avatarX, y, 22);
    this.add.text(avatarX, y, entry.avatar, { font: '22px Arial' }).setOrigin(0.5);

    this.add.text(x - w / 2 + 140, y - 10, entry.playerName, {
      font: 'bold 16px Arial',
      color: entry.isCurrentPlayer ? '#4caf50' : '#ffffff'
    }).setOrigin(0, 0.5);

    if (entry.isCurrentPlayer) {
      this.add.text(x - w / 2 + 140, y + 12, '(我)', {
        font: '12px Arial',
        color: '#4caf50'
      }).setOrigin(0, 0.5);
    }

    this.add.text(x - w / 2 + 440, y, `${entry.stars} ⭐`, {
      font: 'bold 14px Arial',
      color: '#ffd700'
    }).setOrigin(0, 0.5);

    this.add.text(x - w / 2 + 520, y, `${entry.levelsCompleted}关`, {
      font: '14px Arial',
      color: '#aaaaaa'
    }).setOrigin(0, 0.5);

    this.add.text(x + w / 2 - 20, y, entry.score.toLocaleString(), {
      font: 'bold 18px Arial',
      color: '#ff9800'
    }).setOrigin(1, 0.5);
  }

  private addMyRankingCard(): void {
    const myEntry = this.rankingData.currentPlayerEntry;
    if (!myEntry) return;

    const eventLevels = getEventLevelRulesByEventId(this.eventId);
    const myProgress = SaveManager.getEventProgress(this.eventId);
    const totalRewards = this.eventData.rewards.length;
    const claimedRewards = myProgress
      ? Object.values(myProgress.rewardsClaimed).filter(Boolean).length
      : 0;

    const cardY = 1120;

    const card = this.add.graphics();
    card.fillStyle(0x1e3a5f, 1);
    card.fillRoundedRect(40, cardY, 670, 100, 14);
    card.lineStyle(3, 0x4caf50, 1);
    card.strokeRoundedRect(40, cardY, 670, 100, 14);

    this.add.text(65, cardY + 25, '🎯 我的排名', {
      font: 'bold 16px Arial',
      color: '#aaaaaa'
    }).setOrigin(0, 0.5);

    const rankColor = myEntry.rank <= 10 ? 0xffd700 : myEntry.rank <= 50 ? 0xff9800 : 0x4caf50;
    this.add.text(65, cardY + 65, myEntry.rank > 0 ? `#${myEntry.rank}` : '未上榜', {
      font: 'bold 32px Arial',
      color: '#' + rankColor.toString(16).padStart(6, '0')
    }).setOrigin(0, 0.5);

    const divider = this.add.graphics();
    divider.lineStyle(1, 0xffffff, 0.15);
    divider.beginPath();
    divider.moveTo(250, cardY + 20);
    divider.lineTo(250, cardY + 80);
    divider.strokePath();

    const miniStats = [
      { label: '积分', value: myEntry.score.toLocaleString(), color: '#ffd700', x: 330 },
      { label: '星星', value: `${myEntry.stars}/${eventLevels.length * 3}`, color: '#ffeb3b', x: 460 },
      { label: '奖励', value: `${claimedRewards}/${totalRewards}`, color: '#e91e63', x: 590 }
    ];

    miniStats.forEach(stat => {
      this.add.text(stat.x, cardY + 28, stat.label, {
        font: '13px Arial',
        color: '#888888'
      }).setOrigin(0.5);

      this.add.text(stat.x, cardY + 62, stat.value, {
        font: 'bold 18px Arial',
        color: stat.color
      }).setOrigin(0.5);
    });
  }

  private addBottomButtons(): void {
    const btnY = 1260;
    const btnW = 280;
    const btnH = 60;
    const spacing = 20;

    const refreshBtn = this.createBottomButton(
      375 - btnW / 2 - spacing / 2,
      btnY,
      btnW,
      btnH,
      '🔄 刷新排名',
      0x2196f3,
      () => {
        this.loadRankingData(true);
        this.scene.restart({ eventId: this.eventId });
      }
    );

    const backBtn = this.createBottomButton(
      375 + btnW / 2 + spacing / 2,
      btnY,
      btnW,
      btnH,
      '📖 返回活动',
      this.eventData.primaryColor,
      () => this.scene.start('EventScene')
    );
  }

  private createBottomButton(
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
      font: 'bold 19px Arial',
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

  destroy(): void {
    if (this.refreshTimer) {
      this.refreshTimer.remove();
    }
  }
}
