import Phaser from 'phaser';
import { NotificationManager } from '../utils/NotificationManager';
import { NotificationData, NotificationType, NotificationPriority } from '../types/GameTypes';

type FilterType = 'all' | 'unread' | 'event' | 'reward' | 'gallery' | 'system';

export class NotificationScene extends Phaser.Scene {
  private notifications: NotificationData[] = [];
  private filterMode: FilterType = 'all';
  private scrollContainer: Phaser.GameObjects.Container | null = null;
  private scrollContent: Phaser.GameObjects.Container | null = null;
  private scrollY: number = 0;
  private maxScrollY: number = 0;
  private isDragging: boolean = false;
  private dragStartY: number = 0;
  private dragStartScrollY: number = 0;
  private unreadBadge: Phaser.GameObjects.Text | null = null;
  private summaryTexts: Phaser.GameObjects.Text[] = [];

  constructor() {
    super('NotificationScene');
  }

  create(): void {
    this.notifications = NotificationManager.getNotifications();
    
    this.addBackground();
    this.addTitle();
    this.addSummaryBar();
    this.addFilterTabs();
    this.addNotificationList();
    this.addBackButton();
    this.addBottomActions();
    
    this.setupScrolling();
  }

  private addBackground(): void {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    const bg = this.add.graphics();
    bg.fillStyle(0x16213e, 1);
    bg.fillRoundedRect(25, 100, 700, 1100, 20);
  }

  private addTitle(): void {
    this.add.text(375, 60, '植物标本修复', {
      font: 'bold 42px Arial',
      color: '#e94560'
    }).setOrigin(0.5);

    this.add.text(375, 100, '消息中心', {
      font: '28px Arial',
      color: '#eaeaea'
    }).setOrigin(0.5);

    const unreadCount = NotificationManager.getUnreadCount();
    if (unreadCount > 0) {
      this.unreadBadge = this.add.text(470, 100, `${unreadCount}`, {
        font: 'bold 16px Arial',
        color: '#ffffff',
        backgroundColor: '#e94560'
      }).setOrigin(0.5);
      
      const badgeBg = this.add.graphics();
      const badgeWidth = Math.max(24, this.unreadBadge.width + 12);
      badgeBg.fillStyle(0xe94560, 1);
      badgeBg.fillCircle(470, 100, badgeWidth / 2);
      badgeBg.setDepth(this.unreadBadge.depth - 1);
    }
  }

  private addSummaryBar(): void {
    const summary = NotificationManager.getSummary();
    const barY = 130;
    const barHeight = 70;

    const statsBg = this.add.graphics();
    statsBg.fillStyle(0x0f3460, 0.8);
    statsBg.fillRoundedRect(45, barY, 660, barHeight, 12);

    const items = [
      { icon: '📬', label: '全部', value: summary.totalCount, color: '#eaeaea' },
      { icon: '🔴', label: '未读', value: summary.unreadCount, color: '#e94560' },
      { icon: '🎁', label: '奖励', value: summary.byType.reward_available, color: '#ffd700' },
      { icon: '🎉', label: '活动', value: summary.byType.event_start + summary.byType.event_end, color: '#9c27b0' },
    ];

    const itemWidth = 660 / items.length;
    items.forEach((item, index) => {
      const x = 45 + itemWidth * (index + 0.5);
      
      this.add.text(x, barY + 20, item.icon, {
        font: '20px Arial'
      }).setOrigin(0.5);

      const valueText = this.add.text(x, barY + 45, `${item.value}`, {
        font: 'bold 16px Arial',
        color: item.color
      }).setOrigin(0.5);
      
      this.summaryTexts.push(valueText);
    });
  }

  private addFilterTabs(): void {
    const tabY = 220;
    const tabWidth = 105;
    const tabHeight = 40;
    const spacing = 5;
    const tabs: { key: FilterType; label: string; color: number }[] = [
      { key: 'all', label: '全部', color: 0x607d8b },
      { key: 'unread', label: '未读', color: 0xe94560 },
      { key: 'event', label: '活动', color: 0x9c27b0 },
      { key: 'reward', label: '奖励', color: 0xffd700 },
      { key: 'gallery', label: '图鉴', color: 0x4caf50 },
      { key: 'system', label: '系统', color: 0x2196f3 },
    ];
    
    const totalWidth = tabWidth * tabs.length + spacing * (tabs.length - 1);
    const startX = (750 - totalWidth) / 2 + tabWidth / 2;

    tabs.forEach((tab, index) => {
      const x = startX + index * (tabWidth + spacing);
      const isActive = this.filterMode === tab.key;
      
      this.createFilterTab(x, tabY, tabWidth, tabHeight, tab.label, isActive, tab.color, () => {
        this.filterMode = tab.key;
        this.updateNotificationList();
      });
    });
  }

  private createFilterTab(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    isActive: boolean,
    color: number,
    callback: () => void
  ): void {
    const bg = this.add.graphics();
    
    if (isActive) {
      bg.fillStyle(color, 1);
    } else {
      bg.fillStyle(0x1a1a2e, 1);
      bg.lineStyle(2, color, 0.5);
    }
    
    bg.fillRoundedRect(x - width / 2, y - height / 2, width, height, 8);
    if (!isActive) {
      bg.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 8);
    }

    const text = this.add.text(x, y, label, {
      font: 'bold 14px Arial',
      color: isActive ? '#ffffff' : '#aaaaaa'
    }).setOrigin(0.5);

    bg.setInteractive(new Phaser.Geom.Rectangle(x - width / 2, y - height / 2, width, height), Phaser.Geom.Rectangle.Contains);
    bg.on('pointerdown', () => {
      callback();
    });
  }

  private addNotificationList(): void {
    const listX = 45;
    const listY = 280;
    const listWidth = 660;
    const listHeight = 820;

    const maskShape = this.add.graphics();
    maskShape.fillStyle(0x000000, 1);
    maskShape.fillRect(listX, listY, listWidth, listHeight);

    this.scrollContainer = this.add.container(listX, listY);
    this.scrollContent = this.add.container(0, 0);
    
    this.scrollContainer.add(this.scrollContent);
    
    const mask = maskShape.createGeometryMask();
    this.scrollContainer.setMask(mask);

    this.renderNotificationItems();
  }

  private getFilteredNotifications(): NotificationData[] {
    const all = NotificationManager.getNotifications();
    
    switch (this.filterMode) {
      case 'unread':
        return all.filter(n => !n.read);
      case 'event':
        return all.filter(n => n.type === 'event_start' || n.type === 'event_end');
      case 'reward':
        return all.filter(n => n.type === 'reward_available' || n.type === 'daily_quest');
      case 'gallery':
        return all.filter(n => n.type === 'gallery_unlock');
      case 'system':
        return all.filter(n => n.type === 'system' || n.type === 'streak_broken' || n.type === 'achievement');
      default:
        return all;
    }
  }

  private renderNotificationItems(): void {
    if (!this.scrollContent) return;
    
    this.scrollContent.removeAll(true);
    
    const filtered = this.getFilteredNotifications();
    const itemHeight = 100;
    const itemSpacing = 12;
    const totalHeight = filtered.length * (itemHeight + itemSpacing) - itemSpacing;
    
    this.maxScrollY = Math.max(0, totalHeight - 820);
    this.scrollY = 0;

    if (filtered.length === 0) {
      const emptyText = this.add.text(330, 300, '暂无消息', {
        font: '20px Arial',
        color: '#666666'
      }).setOrigin(0.5);
      
      const emptyIcon = this.add.text(330, 250, '📭', {
        font: '48px Arial'
      }).setOrigin(0.5);
      
      this.scrollContent.add(emptyIcon);
      this.scrollContent.add(emptyText);
      return;
    }

    filtered.forEach((notification, index) => {
      const y = index * (itemHeight + itemSpacing);
      this.createNotificationItem(0, y, 660, itemHeight, notification);
    });
  }

  private createNotificationItem(
    x: number,
    y: number,
    width: number,
    height: number,
    notification: NotificationData
  ): void {
    if (!this.scrollContent) return;

    const container = this.add.container(x, y);
    
    const priorityColors: Record<NotificationPriority, number> = {
      low: 0x607d8b,
      medium: 0x2196f3,
      high: 0xff9800,
      urgent: 0xe94560
    };

    const typeColors: Record<NotificationType, number> = {
      event_start: 0x9c27b0,
      event_end: 0x607d8b,
      reward_available: 0xffd700,
      gallery_unlock: 0x4caf50,
      streak_broken: 0xe94560,
      daily_quest: 0x03a9f4,
      achievement: 0xffd700,
      season_pass: 0x9c27b0,
      conservation: 0x8bc34a,
      system: 0x607d8b
    };

    const bg = this.add.graphics();
    const bgColor = notification.read ? 0x1a1a2e : 0x1e2a4a;
    bg.fillStyle(bgColor, 1);
    bg.fillRoundedRect(0, 0, width, height, 12);
    
    const leftBorderColor = typeColors[notification.type] || priorityColors[notification.priority];
    bg.fillStyle(leftBorderColor, 1);
    bg.fillRect(0, 0, 6, height);
    
    container.add(bg);

    const iconText = this.add.text(30, height / 2, notification.icon, {
      font: '32px Arial'
    }).setOrigin(0, 0.5);
    container.add(iconText);

    const titleText = this.add.text(80, 18, notification.title, {
      font: 'bold 16px Arial',
      color: notification.read ? '#888888' : '#ffffff'
    }).setOrigin(0, 0);
    container.add(titleText);

    const messageText = this.add.text(80, 42, notification.message, {
      font: '13px Arial',
      color: notification.read ? '#666666' : '#aaaaaa',
      wordWrap: { width: width - 100 }
    }).setOrigin(0, 0);
    container.add(messageText);

    const timeText = this.add.text(width - 20, 18, this.formatTime(notification.timestamp), {
      font: '12px Arial',
      color: '#666666'
    }).setOrigin(1, 0);
    container.add(timeText);

    if (!notification.read) {
      const readDot = this.add.graphics();
      readDot.fillStyle(0xe94560, 1);
      readDot.fillCircle(width - 15, height - 18, 5);
      container.add(readDot);
    }

    if (notification.actionLabel) {
      const actionBtn = this.add.graphics();
      actionBtn.fillStyle(leftBorderColor, 1);
      actionBtn.fillRoundedRect(width - 100, height - 38, 80, 28, 6);
      container.add(actionBtn);

      const actionText = this.add.text(width - 60, height - 24, notification.actionLabel, {
        font: 'bold 12px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);
      container.add(actionText);

      actionBtn.setInteractive(new Phaser.Geom.Rectangle(width - 100, height - 38, 80, 28), Phaser.Geom.Rectangle.Contains);
      actionBtn.on('pointerdown', () => {
        this.handleNotificationAction(notification);
      });
    }

    const dismissBtn = this.add.text(width - 35, height - 24, '✕', {
      font: '16px Arial',
      color: '#666666'
    }).setOrigin(0.5);
    container.add(dismissBtn);

    dismissBtn.setInteractive();
    dismissBtn.on('pointerdown', () => {
      this.dismissNotification(notification.id);
    });

    bg.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);
    bg.on('pointerdown', () => {
      if (!notification.read) {
        NotificationManager.markAsRead(notification.id);
        this.updateNotificationList();
        this.updateSummary();
      }
    });

    this.scrollContent.add(container);
  }

  private formatTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diff < minute) {
      return '刚刚';
    } else if (diff < hour) {
      return `${Math.floor(diff / minute)}分钟前`;
    } else if (diff < day) {
      return `${Math.floor(diff / hour)}小时前`;
    } else if (diff < 7 * day) {
      return `${Math.floor(diff / day)}天前`;
    } else {
      const date = new Date(timestamp);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }
  }

  private handleNotificationAction(notification: NotificationData): void {
    if (!notification.read) {
      NotificationManager.markAsRead(notification.id);
    }

    if (notification.actionScene) {
      this.scene.start(notification.actionScene);
    }
  }

  private dismissNotification(notificationId: string): void {
    NotificationManager.dismissNotification(notificationId);
    this.updateNotificationList();
    this.updateSummary();
  }

  private updateNotificationList(): void {
    this.renderNotificationItems();
  }

  private updateSummary(): void {
    const summary = NotificationManager.getSummary();
    
    if (this.unreadBadge) {
      if (summary.unreadCount > 0) {
        this.unreadBadge.setText(`${summary.unreadCount}`);
      } else {
        this.unreadBadge.destroy();
        this.unreadBadge = null;
      }
    }
  }

  private setupScrolling(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.y >= 280 && pointer.y <= 1100) {
        this.isDragging = true;
        this.dragStartY = pointer.y;
        this.dragStartScrollY = this.scrollY;
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging && this.scrollContent) {
        const deltaY = this.dragStartY - pointer.y;
        this.scrollY = this.dragStartScrollY + deltaY;
        this.scrollY = Phaser.Math.Clamp(this.scrollY, 0, this.maxScrollY);
        this.scrollContent.y = -this.scrollY;
      }
    });

    this.input.on('pointerup', () => {
      this.isDragging = false;
    });

    this.input.on('pointerupoutside', () => {
      this.isDragging = false;
    });
  }

  private addBackButton(): void {
    const backBtn = this.add.graphics();
    backBtn.fillStyle(0x0f3460, 1);
    backBtn.fillRoundedRect(25, 50, 80, 40, 10);

    const backText = this.add.text(65, 70, '返回', {
      font: 'bold 16px Arial',
      color: '#eaeaea'
    }).setOrigin(0.5);

    backBtn.setInteractive(new Phaser.Geom.Rectangle(25, 50, 80, 40), Phaser.Geom.Rectangle.Contains);
    backBtn.on('pointerdown', () => {
      this.scene.start('MainScene');
    });
  }

  private addBottomActions(): void {
    const bottomY = 1200;
    const btnWidth = 200;
    const btnHeight = 50;
    const spacing = 20;

    const readAllBtn = this.add.graphics();
    readAllBtn.fillStyle(0x2196f3, 1);
    readAllBtn.fillRoundedRect(375 - btnWidth - spacing / 2, bottomY, btnWidth, btnHeight, 12);

    const readAllText = this.add.text(375 - spacing / 2 - btnWidth / 2, bottomY + btnHeight / 2, '全部已读', {
      font: 'bold 16px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    readAllBtn.setInteractive(new Phaser.Geom.Rectangle(375 - btnWidth - spacing / 2, bottomY, btnWidth, btnHeight), Phaser.Geom.Rectangle.Contains);
    readAllBtn.on('pointerdown', () => {
      NotificationManager.markAllAsRead();
      this.updateNotificationList();
      this.updateSummary();
    });

    const clearBtn = this.add.graphics();
    clearBtn.fillStyle(0xe94560, 1);
    clearBtn.fillRoundedRect(375 + spacing / 2, bottomY, btnWidth, btnHeight, 12);

    const clearText = this.add.text(375 + spacing / 2 + btnWidth / 2, bottomY + btnHeight / 2, '清空消息', {
      font: 'bold 16px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    clearBtn.setInteractive(new Phaser.Geom.Rectangle(375 + spacing / 2, bottomY, btnWidth, btnHeight), Phaser.Geom.Rectangle.Contains);
    clearBtn.on('pointerdown', () => {
      this.showConfirmDialog('确认清空所有消息？', () => {
        NotificationManager.clearAll();
        this.updateNotificationList();
        this.updateSummary();
      });
    });
  }

  private showConfirmDialog(message: string, onConfirm: () => void): void {
    const mask = this.add.graphics();
    mask.fillStyle(0x000000, 0.7);
    mask.fillRect(0, 0, 750, 1334);

    const dialog = this.add.graphics();
    dialog.fillStyle(0x16213e, 1);
    dialog.fillRoundedRect(125, 500, 500, 200, 16);
    dialog.lineStyle(2, 0x0f3460, 1);
    dialog.strokeRoundedRect(125, 500, 500, 200, 16);

    const messageText = this.add.text(375, 570, message, {
      font: '18px Arial',
      color: '#eaeaea'
    }).setOrigin(0.5);

    const confirmBtn = this.add.graphics();
    confirmBtn.fillStyle(0xe94560, 1);
    confirmBtn.fillRoundedRect(200, 620, 140, 50, 10);

    const confirmText = this.add.text(270, 645, '确认', {
      font: 'bold 16px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    confirmBtn.setInteractive(new Phaser.Geom.Rectangle(200, 620, 140, 50), Phaser.Geom.Rectangle.Contains);
    confirmBtn.on('pointerdown', () => {
      mask.destroy();
      dialog.destroy();
      messageText.destroy();
      confirmBtn.destroy();
      confirmText.destroy();
      cancelBtn.destroy();
      cancelText.destroy();
      onConfirm();
    });

    const cancelBtn = this.add.graphics();
    cancelBtn.fillStyle(0x607d8b, 1);
    cancelBtn.fillRoundedRect(410, 620, 140, 50, 10);

    const cancelText = this.add.text(480, 645, '取消', {
      font: 'bold 16px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    cancelBtn.setInteractive(new Phaser.Geom.Rectangle(410, 620, 140, 50), Phaser.Geom.Rectangle.Contains);
    cancelBtn.on('pointerdown', () => {
      mask.destroy();
      dialog.destroy();
      messageText.destroy();
      confirmBtn.destroy();
      confirmText.destroy();
      cancelBtn.destroy();
      cancelText.destroy();
    });
  }
}
