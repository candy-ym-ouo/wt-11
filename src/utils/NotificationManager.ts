import {
  NotificationData,
  NotificationType,
  NotificationPriority,
  NotificationSaveData,
  NotificationSummary,
} from '../types/GameTypes';
import { SaveManager } from './SaveManager';
import { getActiveEvent, Events, getEventById } from '../data/Events';
import { DailyQuestManager } from './DailyQuestManager';
import { PlantSpecimens } from '../data/PlantSpecimens';

const MAX_STORED_NOTIFICATIONS = 100;

export class NotificationManager {
  private static data: NotificationSaveData;

  static init(saveData: NotificationSaveData): void {
    this.data = saveData;
    this.data.lastCheckTime = Date.now();
    this.checkOfflineEvents();
    this.checkStreakContinuity();
    this.cleanupExpired();
  }

  static createDefaultNotificationSave(): NotificationSaveData {
    return {
      notifications: [],
      lastCheckTime: Date.now(),
      lastStreakCheckDate: '',
      dismissedNotificationIds: [],
      maxStored: MAX_STORED_NOTIFICATIONS,
    };
  }

  private static generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static addNotification(
    type: NotificationType,
    title: string,
    message: string,
    icon: string,
    priority: NotificationPriority = 'medium',
    options: Partial<NotificationData> = {}
  ): NotificationData {
    const notification: NotificationData = {
      id: this.generateId(),
      type,
      title,
      message,
      icon,
      priority,
      timestamp: Date.now(),
      read: false,
      dismissed: false,
      ...options,
    };

    this.data.notifications.unshift(notification);

    if (this.data.notifications.length > this.data.maxStored) {
      this.data.notifications = this.data.notifications.slice(0, this.data.maxStored);
    }

    SaveManager.save();
    return notification;
  }

  static getNotifications(includeDismissed: boolean = false): NotificationData[] {
    if (includeDismissed) {
      return [...this.data.notifications];
    }
    return this.data.notifications.filter(n => !n.dismissed);
  }

  static getUnreadNotifications(): NotificationData[] {
    return this.data.notifications.filter(n => !n.read && !n.dismissed);
  }

  static getNotificationsByType(type: NotificationType): NotificationData[] {
    return this.data.notifications.filter(n => n.type === type && !n.dismissed);
  }

  static markAsRead(notificationId: string): boolean {
    const notification = this.data.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      SaveManager.save();
      return true;
    }
    return false;
  }

  static markAllAsRead(): void {
    this.data.notifications.forEach(n => {
      if (!n.dismissed) n.read = true;
    });
    SaveManager.save();
  }

  static dismissNotification(notificationId: string): boolean {
    const notification = this.data.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.dismissed = true;
      if (!this.data.dismissedNotificationIds.includes(notificationId)) {
        this.data.dismissedNotificationIds.push(notificationId);
      }
      SaveManager.save();
      return true;
    }
    return false;
  }

  static dismissAll(): void {
    this.data.notifications.forEach(n => {
      n.dismissed = true;
      if (!this.data.dismissedNotificationIds.includes(n.id)) {
        this.data.dismissedNotificationIds.push(n.id);
      }
    });
    SaveManager.save();
  }

  static clearAll(): void {
    this.data.notifications = [];
    this.data.dismissedNotificationIds = [];
    SaveManager.save();
  }

  static getUnreadCount(): number {
    return this.getUnreadNotifications().length;
  }

  static hasUnread(): boolean {
    return this.getUnreadCount() > 0;
  }

  private static checkOfflineEvents(): void {
    const activeEvent = getActiveEvent();
    const lastCheck = this.data.lastCheckTime;
    const now = Date.now();

    for (const event of Object.values(Events)) {
      if (event.startTime > lastCheck && event.startTime <= now) {
        this.addNotification(
          'event_start',
          '活动开始！',
          `「${event.name}」活动已开始，快来参与吧！`,
          event.banner || '🎉',
          'high',
          {
            relatedId: event.id,
            relatedType: 'event',
            actionLabel: '去参与',
            actionScene: 'EventScene',
            data: { eventId: event.id },
          }
        );
      }

      if (event.endTime > lastCheck && event.endTime <= now) {
        const eventProgress = SaveManager.getEventProgress(event.id);
        if (eventProgress?.participated) {
          this.addNotification(
            'event_end',
            '活动结束',
            `「${event.name}」活动已结束，感谢参与！`,
            '📮',
            'medium',
            {
              relatedId: event.id,
              relatedType: 'event',
              data: { eventId: event.id },
              expiresAt: now + 7 * 24 * 60 * 60 * 1000,
            }
          );
        }
      }
    }

    this.checkRewardsAvailable();
    this.checkGalleryUnlocks();
  }

  static checkRewardsAvailable(): void {
    let rewardCount = 0;

    const chapters = SaveManager.getAllChapterProgress();
    for (const chapterId of Object.keys(chapters).map(Number)) {
      if (SaveManager.canClaimRewards(chapterId)) {
        rewardCount++;
      }
    }

    const dailyQuestClaimable = DailyQuestManager.getClaimableQuestsCount();
    rewardCount += dailyQuestClaimable;

    const event = getActiveEvent();
    if (event) {
      const eventProgress = SaveManager.getEventProgress(event.id);
      if (eventProgress) {
        for (const reward of event.rewards) {
          if (
            eventProgress.totalScore >= reward.threshold &&
            !eventProgress.rewardsClaimed[reward.id]
          ) {
            rewardCount++;
          }
        }
      }
    }

    if (rewardCount > 0) {
      const existing = this.data.notifications.find(
        n => n.type === 'reward_available' && !n.dismissed && !n.read
      );

      if (!existing) {
        this.addNotification(
          'reward_available',
          '奖励待领取',
          `你有 ${rewardCount} 个奖励可以领取`,
          '🎁',
          'high',
          {
            actionLabel: '去领取',
            data: { rewardCount },
          }
        );
      }
    }
  }

  static checkGalleryUnlocks(): void {
    const newlyUnlocked: number[] = [];
    const galleryUnlocked = SaveManager.getUnlockedGalleryItems();

    for (const specimenId of galleryUnlocked) {
      const notifKey = `gallery_unlock_${specimenId}`;
      const existing = this.data.notifications.find(
        n => n.type === 'gallery_unlock' && n.relatedId === specimenId
      );

      if (!existing) {
        newlyUnlocked.push(specimenId);
      }
    }

    if (newlyUnlocked.length > 0) {
      if (newlyUnlocked.length === 1) {
        const specimen = PlantSpecimens[newlyUnlocked[0]];
        this.addNotification(
          'gallery_unlock',
          '图鉴解锁',
          `恭喜解锁「${specimen?.name || '新植物'}」图鉴！`,
          '🌿',
          'medium',
          {
            relatedId: newlyUnlocked[0],
            relatedType: 'specimen',
            actionLabel: '查看',
            actionScene: 'GalleryScene',
            data: { specimenId: newlyUnlocked[0] },
          }
        );
      } else {
        this.addNotification(
          'gallery_unlock',
          '图鉴解锁',
          `恭喜解锁 ${newlyUnlocked.length} 个新图鉴！`,
          '📚',
          'medium',
          {
            actionLabel: '查看',
            actionScene: 'GalleryScene',
            data: { specimenIds: newlyUnlocked },
          }
        );
      }
    }
  }

  static checkStreakContinuity(): void {
    const today = this.getTodayDateString();
    const lastCheck = this.data.lastStreakCheckDate;

    if (!lastCheck || lastCheck === today) {
      this.data.lastStreakCheckDate = today;
      return;
    }

    const lastDate = new Date(lastCheck);
    const todayDate = new Date(today);
    const diffTime = todayDate.getTime() - lastDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 1) {
      this.addNotification(
        'streak_broken',
        '签到中断',
        `你的连续签到已中断，已连续 ${diffDays} 天未登录`,
        '💔',
        'high',
        {
          data: { missedDays: diffDays },
        }
      );
    }

    this.data.lastStreakCheckDate = today;
    SaveManager.save();
  }

  private static getTodayDateString(): string {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  }

  static notifyEventStart(eventId: string): void {
    const event = getEventById(eventId);
    if (!event) return;

    this.addNotification(
      'event_start',
      '活动开始！',
      `「${event.name}」活动已开始，快来参与吧！`,
      event.banner || '🎉',
      'high',
      {
        relatedId: event.id,
        relatedType: 'event',
        actionLabel: '去参与',
        actionScene: 'EventScene',
        data: { eventId: event.id },
      }
    );
  }

  static notifyRewardAvailable(rewardName: string, source: string): void {
    this.addNotification(
      'reward_available',
      '新奖励可领取',
      `「${rewardName}」奖励可以领取了`,
      '🎁',
      'high',
      {
        actionLabel: '去领取',
        data: { source, rewardName },
      }
    );
  }

  static notifyGalleryUnlock(specimenId: number, specimenName: string): void {
    const existing = this.data.notifications.find(
      n => n.type === 'gallery_unlock' && n.relatedId === specimenId
    );

    if (existing) return;

    this.addNotification(
      'gallery_unlock',
      '图鉴解锁',
      `恭喜解锁「${specimenName}」图鉴！`,
      '🌿',
      'medium',
      {
        relatedId: specimenId,
        relatedType: 'specimen',
        actionLabel: '查看',
        actionScene: 'GalleryScene',
        data: { specimenId },
      }
    );
  }

  static notifyStreakBroken(missedDays: number): void {
    this.addNotification(
      'streak_broken',
      '签到中断',
      `你的连续签到已中断，已连续 ${missedDays} 天未登录`,
      '💔',
      'high',
      {
        data: { missedDays },
      }
    );
  }

  static notifyDailyQuestRefresh(): void {
    this.addNotification(
      'daily_quest',
      '每日任务已更新',
      '新的每日任务已刷新，快来完成吧！',
      '📋',
      'medium',
      {
        actionLabel: '去完成',
        actionScene: 'DailyQuestScene',
      }
    );
  }

  static getSummary(): NotificationSummary {
    const notifications = this.getNotifications();
    const unread = this.getUnreadNotifications();
    const highPriority = notifications.filter(n => n.priority === 'high' || n.priority === 'urgent');

    const byType: Record<NotificationType, number> = {
      event_start: 0,
      event_end: 0,
      reward_available: 0,
      gallery_unlock: 0,
      streak_broken: 0,
      daily_quest: 0,
      achievement: 0,
      season_pass: 0,
      conservation: 0,
      system: 0,
    };

    notifications.forEach(n => {
      byType[n.type]++;
    });

    const activeEvent = getActiveEvent();
    const hasRewards = this.hasClaimableRewards();
    const hasStreakBroken = notifications.some(n => n.type === 'streak_broken' && !n.dismissed);

    return {
      totalCount: notifications.length,
      unreadCount: unread.length,
      highPriorityCount: highPriority.length,
      byType,
      hasRewardsToClaim: hasRewards,
      hasActiveEvent: !!activeEvent,
      streakBroken: hasStreakBroken,
    };
  }

  private static hasClaimableRewards(): boolean {
    const chapters = SaveManager.getAllChapterProgress();
    for (const chapterId of Object.keys(chapters).map(Number)) {
      if (SaveManager.canClaimRewards(chapterId)) {
        return true;
      }
    }

    if (DailyQuestManager.getClaimableQuestsCount() > 0) {
      return true;
    }

    const event = getActiveEvent();
    if (event) {
      const eventProgress = SaveManager.getEventProgress(event.id);
      if (eventProgress) {
        for (const reward of event.rewards) {
          if (
            eventProgress.totalScore >= reward.threshold &&
            !eventProgress.rewardsClaimed[reward.id]
          ) {
            return true;
          }
        }
      }
    }

    return false;
  }

  private static cleanupExpired(): void {
    const now = Date.now();
    this.data.notifications = this.data.notifications.filter(n => {
      if (n.expiresAt && n.expiresAt < now) {
        return false;
      }
      return true;
    });
    SaveManager.save();
  }

  static getSaveData(): NotificationSaveData {
    return {
      ...this.data,
      notifications: [...this.data.notifications],
      dismissedNotificationIds: [...this.data.dismissedNotificationIds],
    };
  }

  static refreshAllChecks(): void {
    this.checkRewardsAvailable();
    this.checkGalleryUnlocks();
    this.checkStreakContinuity();
    this.cleanupExpired();
  }
}
