import { LevelRule } from '../types/GameTypes';

export const LevelRules: LevelRule[] = [
  {
    id: 0,
    name: '教学关卡',
    specimenId: 1,
    difficulty: 'easy',
    rows: 2,
    cols: 2,
    timeLimit: 600,
    snapPositionThreshold: 80,
    snapRotationThreshold: 30,
    background: {
      cameraBackgroundColor: '#1a1a2e',
      fillGradientFrom: 0x1e3a5f,
      fillGradientTo: 0x16213e,
      headerColor: 0x0f3460,
      headerAlpha: 1
    },
    soundTheme: {
      bgmKey: 'bgm_tutorial',
      snapSfxKey: 'sfx_snap_soft',
      completeSfxKey: 'sfx_complete_gentle',
      failSfxKey: 'sfx_fail_soft',
      ambientKey: 'ambient_garden'
    },
    pieceLayout: {
      pieceWidth: 140,
      pieceHeight: 110,
      pieceSpacing: 20
    },
    rewardConfig: {
      scoreMultiplier: 0.5,
      fragmentDropBonus: 0,
      materialDropBonus: 0,
      bonusResearchPoints: 5
    }
  },
  {
    id: 1,
    name: '第一关',
    specimenId: 1,
    difficulty: 'easy',
    rows: 2,
    cols: 2,
    timeLimit: 180,
    snapPositionThreshold: 60,
    snapRotationThreshold: 20,
    background: {
      cameraBackgroundColor: '#1a1a2e',
      fillGradientFrom: 0x1e3a5f,
      fillGradientTo: 0x16213e,
      headerColor: 0x0f3460,
      headerAlpha: 1
    },
    soundTheme: {
      bgmKey: 'bgm_spring',
      snapSfxKey: 'sfx_snap_soft',
      completeSfxKey: 'sfx_complete_gentle',
      failSfxKey: 'sfx_fail_soft',
      ambientKey: 'ambient_garden'
    },
    pieceLayout: {
      pieceWidth: 140,
      pieceHeight: 110,
      pieceSpacing: 20
    },
    rewardConfig: {
      scoreMultiplier: 1,
      fragmentDropBonus: 0,
      materialDropBonus: 0,
      bonusResearchPoints: 10
    }
  },
  {
    id: 2,
    name: '第二关',
    specimenId: 2,
    difficulty: 'easy',
    rows: 2,
    cols: 3,
    timeLimit: 180,
    snapPositionThreshold: 55,
    snapRotationThreshold: 18,
    background: {
      cameraBackgroundColor: '#1a2e1a',
      fillGradientFrom: 0x1a4a2e,
      fillGradientTo: 0x0f2e1a,
      headerColor: 0x1b5e20,
      headerAlpha: 1
    },
    soundTheme: {
      bgmKey: 'bgm_forest',
      snapSfxKey: 'sfx_snap_soft',
      completeSfxKey: 'sfx_complete_gentle',
      failSfxKey: 'sfx_fail_soft',
      ambientKey: 'ambient_forest'
    },
    pieceLayout: {
      pieceWidth: 140,
      pieceHeight: 110,
      pieceSpacing: 20
    },
    rewardConfig: {
      scoreMultiplier: 1,
      fragmentDropBonus: 0,
      materialDropBonus: 0,
      bonusResearchPoints: 10
    }
  },
  {
    id: 3,
    name: '第三关',
    specimenId: 3,
    difficulty: 'medium',
    rows: 3,
    cols: 3,
    timeLimit: 240,
    snapPositionThreshold: 50,
    snapRotationThreshold: 15,
    background: {
      cameraBackgroundColor: '#2e1a2e',
      fillGradientFrom: 0x3a1e4a,
      fillGradientTo: 0x2a0f3e,
      headerColor: 0x4a148c,
      headerAlpha: 1
    },
    soundTheme: {
      bgmKey: 'bgm_garden',
      snapSfxKey: 'sfx_snap_medium',
      completeSfxKey: 'sfx_complete_medium',
      failSfxKey: 'sfx_fail_medium',
      ambientKey: 'ambient_garden'
    },
    specialRules: [
      {
        type: 'time_pressure',
        name: '时间压力',
        description: '剩余时间低于30%时计时加速',
        value: 1.3
      }
    ],
    pieceLayout: {
      pieceWidth: 130,
      pieceHeight: 100,
      pieceSpacing: 20
    },
    rewardConfig: {
      scoreMultiplier: 1.2,
      fragmentDropBonus: 1,
      materialDropBonus: 0,
      bonusResearchPoints: 20
    }
  },
  {
    id: 4,
    name: '第四关',
    specimenId: 4,
    difficulty: 'medium',
    rows: 3,
    cols: 4,
    timeLimit: 240,
    snapPositionThreshold: 45,
    snapRotationThreshold: 15,
    background: {
      cameraBackgroundColor: '#2e2a1a',
      fillGradientFrom: 0x4a3a1e,
      fillGradientTo: 0x3a2a0f,
      headerColor: 0xe65100,
      headerAlpha: 1
    },
    soundTheme: {
      bgmKey: 'bgm_twilight',
      snapSfxKey: 'sfx_snap_medium',
      completeSfxKey: 'sfx_complete_medium',
      failSfxKey: 'sfx_fail_medium',
      ambientKey: 'ambient_twilight'
    },
    specialRules: [
      {
        type: 'limited_hints',
        name: '提示限制',
        description: '本关提示次数上限降低',
        value: 1
      }
    ],
    pieceLayout: {
      pieceWidth: 130,
      pieceHeight: 100,
      pieceSpacing: 20
    },
    rewardConfig: {
      scoreMultiplier: 1.3,
      fragmentDropBonus: 1,
      materialDropBonus: 1,
      bonusResearchPoints: 25
    }
  },
  {
    id: 5,
    name: '第五关',
    specimenId: 5,
    difficulty: 'hard',
    rows: 4,
    cols: 4,
    timeLimit: 300,
    snapPositionThreshold: 40,
    snapRotationThreshold: 12,
    background: {
      cameraBackgroundColor: '#1a1a2e',
      fillGradientFrom: 0x0a1a3a,
      fillGradientTo: 0x050f2a,
      headerColor: 0x1a237e,
      headerAlpha: 1
    },
    soundTheme: {
      bgmKey: 'bgm_mystic',
      snapSfxKey: 'sfx_snap_hard',
      completeSfxKey: 'sfx_complete_hard',
      failSfxKey: 'sfx_fail_hard',
      ambientKey: 'ambient_mystic'
    },
    specialRules: [
      {
        type: 'fog_of_war',
        name: '迷雾遮罩',
        description: '未吸附区域被迷雾覆盖',
        value: 0.6
      }
    ],
    pieceLayout: {
      pieceWidth: 120,
      pieceHeight: 90,
      pieceSpacing: 20
    },
    rewardConfig: {
      scoreMultiplier: 1.5,
      fragmentDropBonus: 2,
      materialDropBonus: 1,
      bonusResearchPoints: 35
    }
  },
  {
    id: 6,
    name: '第六关',
    specimenId: 6,
    difficulty: 'hard',
    rows: 4,
    cols: 5,
    timeLimit: 300,
    snapPositionThreshold: 35,
    snapRotationThreshold: 10,
    background: {
      cameraBackgroundColor: '#2e1a1a',
      fillGradientFrom: 0x3a0a0a,
      fillGradientTo: 0x2a0505,
      headerColor: 0xb71c1c,
      headerAlpha: 1
    },
    soundTheme: {
      bgmKey: 'bgm_danger',
      snapSfxKey: 'sfx_snap_hard',
      completeSfxKey: 'sfx_complete_hard',
      failSfxKey: 'sfx_fail_hard',
      ambientKey: 'ambient_danger'
    },
    specialRules: [
      {
        type: 'piece_drift',
        name: '碎片漂移',
        description: '未吸附拼图块会缓慢漂移',
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
      fragmentDropBonus: 2,
      materialDropBonus: 2,
      bonusResearchPoints: 40
    }
  },
  {
    id: 7,
    name: '隐藏关卡·银杏秘境',
    specimenId: 1,
    difficulty: 'hard',
    rows: 4,
    cols: 4,
    timeLimit: 240,
    snapPositionThreshold: 38,
    snapRotationThreshold: 12,
    background: {
      cameraBackgroundColor: '#2a2e1a',
      fillGradientFrom: 0x4a5a1e,
      fillGradientTo: 0x2a3a0f,
      headerColor: 0x33691e,
      headerAlpha: 1,
      particleEffect: 'golden_leaves'
    },
    soundTheme: {
      bgmKey: 'bgm_ginkgo',
      snapSfxKey: 'sfx_snap_hard',
      completeSfxKey: 'sfx_complete_special',
      failSfxKey: 'sfx_fail_hard',
      ambientKey: 'ambient_autumn'
    },
    specialRules: [
      {
        type: 'score_surge',
        name: '分数涌动',
        description: '连续吸附3块后得分倍率短暂提升',
        value: 1.5
      }
    ],
    pieceLayout: {
      pieceWidth: 120,
      pieceHeight: 90,
      pieceSpacing: 20
    },
    rewardConfig: {
      scoreMultiplier: 2.0,
      fragmentDropBonus: 3,
      materialDropBonus: 2,
      bonusResearchPoints: 50
    }
  },
  {
    id: 8,
    name: '隐藏关卡·花语迷踪',
    specimenId: 4,
    difficulty: 'hard',
    rows: 4,
    cols: 5,
    timeLimit: 280,
    snapPositionThreshold: 35,
    snapRotationThreshold: 10,
    background: {
      cameraBackgroundColor: '#2e1a2a',
      fillGradientFrom: 0x5a1e4a,
      fillGradientTo: 0x3a0f2e,
      headerColor: 0x880e4f,
      headerAlpha: 1,
      particleEffect: 'flower_petals'
    },
    soundTheme: {
      bgmKey: 'bgm_flower_mystery',
      snapSfxKey: 'sfx_snap_hard',
      completeSfxKey: 'sfx_complete_special',
      failSfxKey: 'sfx_fail_hard',
      ambientKey: 'ambient_mystery'
    },
    specialRules: [
      {
        type: 'no_rotation_reset',
        name: '旋转锁定',
        description: '拼图块旋转后无法自动归位'
      },
      {
        type: 'fog_of_war',
        name: '迷雾遮罩',
        description: '未吸附区域被迷雾覆盖',
        value: 0.4
      }
    ],
    pieceLayout: {
      pieceWidth: 120,
      pieceHeight: 90,
      pieceSpacing: 20
    },
    rewardConfig: {
      scoreMultiplier: 2.5,
      fragmentDropBonus: 3,
      materialDropBonus: 2,
      bonusResearchPoints: 60
    }
  },
  {
    id: 9,
    name: '隐藏关卡·兰幽深处',
    specimenId: 5,
    difficulty: 'hard',
    rows: 5,
    cols: 5,
    timeLimit: 360,
    snapPositionThreshold: 30,
    snapRotationThreshold: 8,
    background: {
      cameraBackgroundColor: '#1a2e2e',
      fillGradientFrom: 0x0a2a3a,
      fillGradientTo: 0x051a2a,
      headerColor: 0x006064,
      headerAlpha: 1,
      particleEffect: 'orchid_glow'
    },
    soundTheme: {
      bgmKey: 'bgm_orchid_deep',
      snapSfxKey: 'sfx_snap_hard',
      completeSfxKey: 'sfx_complete_special',
      failSfxKey: 'sfx_fail_hard',
      ambientKey: 'ambient_deep'
    },
    specialRules: [
      {
        type: 'gravity_pull',
        name: '重力牵引',
        description: '拼图块会被目标区域缓慢吸引',
        value: 0.3
      },
      {
        type: 'time_pressure',
        name: '时间压力',
        description: '剩余时间低于50%时计时加速',
        value: 1.2
      }
    ],
    pieceLayout: {
      pieceWidth: 120,
      pieceHeight: 90,
      pieceSpacing: 20
    },
    rewardConfig: {
      scoreMultiplier: 3.0,
      fragmentDropBonus: 5,
      materialDropBonus: 3,
      bonusResearchPoints: 80
    }
  }
];

export function getLevelRule(id: number): LevelRule | undefined {
  return LevelRules.find(rule => rule.id === id);
}
