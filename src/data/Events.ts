import { EventData, EventReward } from '../types/GameTypes';
import { EVENT_ID_SPRING_FESTIVAL } from './EventLevelRules';

const EVENT_START_OFFSET_DAYS = -1;
const EVENT_END_OFFSET_DAYS = 30;

function createEventTime(): { start: number; end: number } {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  return {
    start: now + EVENT_START_OFFSET_DAYS * oneDay,
    end: now + EVENT_END_OFFSET_DAYS * oneDay
  };
}

const eventTime = createEventTime();

const eventRewards: EventReward[] = [
  {
    id: 10001,
    type: 'score',
    name: '参与奖励',
    description: '完成任意活动关卡即可获得',
    icon: '💰',
    rarity: 'common',
    threshold: 500,
    value: 1000
  },
  {
    id: 10002,
    type: 'material',
    name: '春日礼盒',
    description: '积累积分达到3000分解锁',
    icon: '🎁',
    rarity: 'common',
    threshold: 3000,
    value: 500
  },
  {
    id: 10003,
    type: 'fragment',
    name: '樱花碎片',
    description: '活动限定标本碎片x5',
    icon: '🌸',
    rarity: 'rare',
    threshold: 6000,
    value: 5,
    specimenId: 101
  },
  {
    id: 10004,
    type: 'specimen',
    name: '樱花标本',
    description: '解锁限定植物图鉴：樱花',
    icon: '🌺',
    rarity: 'rare',
    threshold: 10000,
    specimenId: 101
  },
  {
    id: 10005,
    type: 'badge',
    name: '春日使者徽章',
    description: '完成所有活动关卡解锁',
    icon: '🏅',
    rarity: 'epic',
    threshold: 15000
  },
  {
    id: 10006,
    type: 'specimen',
    name: '全部限定标本',
    description: '累积积分达到20000分解锁所有活动标本图鉴',
    icon: '🌷',
    rarity: 'epic',
    threshold: 20000
  },
  {
    id: 10007,
    type: 'badge',
    name: '花卉大师',
    description: '排行榜前10%专属荣誉徽章',
    icon: '👑',
    rarity: 'legendary',
    threshold: 30000
  }
];

export const Events: Record<string, EventData> = {
  [EVENT_ID_SPRING_FESTIVAL]: {
    id: EVENT_ID_SPRING_FESTIVAL,
    name: '春日花卉节',
    description: '春风十里，花开满园！在这个浪漫的春天，修复珍稀的限定植物标本，收集独特的图鉴奖励，登上积分排行榜赢取专属荣誉！',
    theme: '限时活动',
    banner: '🌸',
    primaryColor: 0xe91e63,
    secondaryColor: 0xff80ab,
    accentColor: 0xff4081,
    startTime: eventTime.start,
    endTime: eventTime.end,
    levelIds: [1001, 1002, 1003, 1004, 1005],
    rewards: eventRewards,
    requiredMainProgress: 1
  }
};

export function getActiveEvent(): EventData | null {
  const now = Date.now();
  for (const event of Object.values(Events)) {
    if (now >= event.startTime && now <= event.endTime) {
      return event;
    }
  }
  return null;
}

export function getEventById(id: string): EventData | undefined {
  return Events[id];
}

export function getEventRewards(eventId: string): EventReward[] {
  const event = getEventById(eventId);
  return event?.rewards || [];
}

export function getRarityColor(rarity: string): number {
  switch (rarity) {
    case 'common': return 0x9e9e9e;
    case 'rare': return 0x2196f3;
    case 'epic': return 0x9c27b0;
    case 'legendary': return 0xffd700;
    default: return 0x9e9e9e;
  }
}

export function getRarityText(rarity: string): string {
  switch (rarity) {
    case 'common': return '普通';
    case 'rare': return '稀有';
    case 'epic': return '史诗';
    case 'legendary': return '传说';
    default: return '普通';
  }
}
