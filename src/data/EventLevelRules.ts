import { EventLevelRule } from '../types/GameTypes';

export const EVENT_ID_SPRING_FESTIVAL = 'spring_flower_festival_2026';

export const EventLevelRules: EventLevelRule[] = [
  {
    id: 1001,
    name: '春日序曲·樱',
    specimenId: 101,
    difficulty: 'easy',
    rows: 2,
    cols: 3,
    timeLimit: 180,
    snapPositionThreshold: 55,
    snapRotationThreshold: 18,
    eventId: EVENT_ID_SPRING_FESTIVAL,
    scoreMultiplier: 1.2,
    background: {
      cameraBackgroundColor: '#2e1a2e',
      fillGradientFrom: 0x5a1e4a,
      fillGradientTo: 0x3a0f3e,
      headerColor: 0x9c27b0,
      headerAlpha: 0.9,
      particleEffect: 'sakura'
    },
    soundTheme: {
      bgmKey: 'bgm_event_spring',
      snapSfxKey: 'sfx_snap_soft',
      completeSfxKey: 'sfx_complete_gentle',
      failSfxKey: 'sfx_fail_soft',
      ambientKey: 'ambient_spring'
    },
    pieceLayout: {
      pieceWidth: 140,
      pieceHeight: 110,
      pieceSpacing: 20
    },
    rewardConfig: {
      scoreMultiplier: 1.2,
      fragmentDropBonus: 1,
      materialDropBonus: 0,
      bonusResearchPoints: 15,
      starThresholds: [900, 1800, 2700]
    }
  },
  {
    id: 1002,
    name: '荷塘月色·莲',
    specimenId: 102,
    difficulty: 'easy',
    rows: 3,
    cols: 3,
    timeLimit: 210,
    snapPositionThreshold: 50,
    snapRotationThreshold: 16,
    eventId: EVENT_ID_SPRING_FESTIVAL,
    scoreMultiplier: 1.3,
    background: {
      cameraBackgroundColor: '#1a2e2e',
      fillGradientFrom: 0x0a3a4a,
      fillGradientTo: 0x0f2a3e,
      headerColor: 0x00838f,
      headerAlpha: 0.9,
      particleEffect: 'lotus_glow'
    },
    soundTheme: {
      bgmKey: 'bgm_event_lotus',
      snapSfxKey: 'sfx_snap_medium',
      completeSfxKey: 'sfx_complete_medium',
      failSfxKey: 'sfx_fail_medium',
      ambientKey: 'ambient_water'
    },
    pieceLayout: {
      pieceWidth: 130,
      pieceHeight: 100,
      pieceSpacing: 20
    },
    rewardConfig: {
      scoreMultiplier: 1.3,
      fragmentDropBonus: 1,
      materialDropBonus: 1,
      bonusResearchPoints: 20,
      starThresholds: [1000, 2000, 3000]
    }
  },
  {
    id: 1003,
    name: '彼岸传说·红',
    specimenId: 103,
    difficulty: 'medium',
    rows: 3,
    cols: 4,
    timeLimit: 240,
    snapPositionThreshold: 45,
    snapRotationThreshold: 14,
    eventId: EVENT_ID_SPRING_FESTIVAL,
    scoreMultiplier: 1.5,
    background: {
      cameraBackgroundColor: '#2e1a1a',
      fillGradientFrom: 0x5a1a1a,
      fillGradientTo: 0x3a0a0a,
      headerColor: 0xc62828,
      headerAlpha: 0.9,
      particleEffect: 'red_petals'
    },
    soundTheme: {
      bgmKey: 'bgm_event_legend',
      snapSfxKey: 'sfx_snap_medium',
      completeSfxKey: 'sfx_complete_medium',
      failSfxKey: 'sfx_fail_medium',
      ambientKey: 'ambient_legend'
    },
    specialRules: [
      {
        type: 'time_pressure',
        name: '时间压力',
        description: '剩余时间低于40%时计时加速',
        value: 1.2
      }
    ],
    pieceLayout: {
      pieceWidth: 130,
      pieceHeight: 100,
      pieceSpacing: 20
    },
    rewardConfig: {
      scoreMultiplier: 1.5,
      fragmentDropBonus: 2,
      materialDropBonus: 1,
      bonusResearchPoints: 30,
      starThresholds: [1200, 2400, 3600]
    }
  },
  {
    id: 1004,
    name: '月下美人·昙',
    specimenId: 104,
    difficulty: 'hard',
    rows: 4,
    cols: 4,
    timeLimit: 270,
    snapPositionThreshold: 40,
    snapRotationThreshold: 12,
    eventId: EVENT_ID_SPRING_FESTIVAL,
    scoreMultiplier: 1.8,
    background: {
      cameraBackgroundColor: '#1a1a3e',
      fillGradientFrom: 0x1a0a4a,
      fillGradientTo: 0x0a052a,
      headerColor: 0x311b92,
      headerAlpha: 0.9,
      particleEffect: 'moonlight'
    },
    soundTheme: {
      bgmKey: 'bgm_event_moonlight',
      snapSfxKey: 'sfx_snap_hard',
      completeSfxKey: 'sfx_complete_hard',
      failSfxKey: 'sfx_fail_hard',
      ambientKey: 'ambient_night'
    },
    specialRules: [
      {
        type: 'fog_of_war',
        name: '迷雾遮罩',
        description: '未吸附区域被迷雾覆盖',
        value: 0.5
      }
    ],
    pieceLayout: {
      pieceWidth: 120,
      pieceHeight: 90,
      pieceSpacing: 20
    },
    rewardConfig: {
      scoreMultiplier: 1.8,
      fragmentDropBonus: 3,
      materialDropBonus: 2,
      bonusResearchPoints: 40,
      starThresholds: [1400, 2800, 4200]
    }
  },
  {
    id: 1005,
    name: '冰峰圣莲·雪',
    specimenId: 105,
    difficulty: 'hard',
    rows: 4,
    cols: 5,
    timeLimit: 300,
    snapPositionThreshold: 35,
    snapRotationThreshold: 10,
    eventId: EVENT_ID_SPRING_FESTIVAL,
    scoreMultiplier: 2.0,
    background: {
      cameraBackgroundColor: '#1a2e3e',
      fillGradientFrom: 0x0a2a5a,
      fillGradientTo: 0x0f1a3e,
      headerColor: 0x0d47a1,
      headerAlpha: 0.9,
      particleEffect: 'snowflakes'
    },
    soundTheme: {
      bgmKey: 'bgm_event_ice',
      snapSfxKey: 'sfx_snap_hard',
      completeSfxKey: 'sfx_complete_special',
      failSfxKey: 'sfx_fail_hard',
      ambientKey: 'ambient_snow'
    },
    specialRules: [
      {
        type: 'piece_drift',
        name: '碎片漂移',
        description: '未吸附拼图块会缓慢漂移',
        value: 0.4
      },
      {
        type: 'limited_hints',
        name: '提示限制',
        description: '本关提示次数上限降低',
        value: 2
      }
    ],
    pieceLayout: {
      pieceWidth: 120,
      pieceHeight: 90,
      pieceSpacing: 20
    },
    rewardConfig: {
      scoreMultiplier: 2.0,
      fragmentDropBonus: 4,
      materialDropBonus: 3,
      bonusResearchPoints: 60,
      starThresholds: [1600, 3200, 4800]
    }
  }
];

export function getEventLevelRule(id: number): EventLevelRule | undefined {
  return EventLevelRules.find(rule => rule.id === id);
}

export function getEventLevelRulesByEventId(eventId: string): EventLevelRule[] {
  return EventLevelRules.filter(rule => rule.eventId === eventId);
}

export function isEventLevel(levelId: number): boolean {
  return EventLevelRules.some(rule => rule.id === levelId);
}
