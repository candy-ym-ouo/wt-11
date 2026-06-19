import { TutorialData, TutorialStep } from '../types/GameTypes';

const TARGET_AREA_X = 375;
const TARGET_AREA_Y = 420;
const PIECE_AREA_START_Y = 900;

export const TutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: '👋 欢迎来到植物标本修复',
    content: '我是你的向导，将帮助你学习如何修复珍贵的植物标本。让我们开始吧！',
    actionType: 'click',
    autoNext: false,
    canSkip: false,
    position: {
      x: 375,
      y: 400,
      align: 'center'
    }
  },
  {
    id: 'explain-goal',
    title: '🎯 游戏目标',
    content: '你的任务是将散落的拼图碎片拖拽到正确的位置，完整修复植物标本。每个碎片都有自己的位置和方向。',
    actionType: 'click',
    autoNext: false,
    canSkip: false,
    position: {
      x: 375,
      y: 300,
      align: 'center'
    },
    highlight: {
      x: TARGET_AREA_X,
      y: TARGET_AREA_Y,
      width: 500,
      height: 400,
      type: 'rect',
      pulse: true
    }
  },
  {
    id: 'introduce-pieces',
    title: '🧩 认识碎片',
    content: '这些是标本的碎片，它们现在是打乱的。每片碎片都包含植物的一部分。',
    actionType: 'click',
    autoNext: false,
    canSkip: false,
    position: {
      x: 375,
      y: 1100,
      align: 'top'
    },
    highlight: {
      x: 375,
      y: PIECE_AREA_START_Y + 100,
      width: 600,
      height: 200,
      type: 'rect',
      pulse: true
    }
  },
  {
    id: 'demo-drag',
    title: '✋ 学习拖拽',
    content: '点击并按住一片碎片，将它拖向目标区域。看到右上角的那片了吗？让我先演示一下。',
    actionType: 'wait',
    autoNext: true,
    autoNextDelay: 2000,
    canSkip: true,
    showDemo: true,
    demoData: {
      pieceId: 0,
      targetX: TARGET_AREA_X - 120,
      targetY: TARGET_AREA_Y - 90
    },
    position: {
      x: 375,
      y: 650,
      align: 'center'
    }
  },
  {
    id: 'try-drag',
    title: '🎮 现在轮到你了',
    content: '试着将左上角的碎片拖到闪烁的目标位置。点击并按住碎片，然后移动到正确的位置。',
    actionType: 'drag',
    targetPieceId: 1,
    canSkip: false,
    validation: {
      type: 'piece_snapped',
      pieceId: 1
    },
    position: {
      x: 375,
      y: 700,
      align: 'center'
    },
    highlight: {
      x: TARGET_AREA_X + 120,
      y: TARGET_AREA_Y - 90,
      width: 120,
      height: 110,
      type: 'rect',
      pulse: true
    },
    arrow: {
      startX: 150,
      startY: PIECE_AREA_START_Y + 50,
      endX: TARGET_AREA_X + 120,
      endY: TARGET_AREA_Y - 90,
      color: 0x4caf50
    }
  },
  {
    id: 'explain-snap',
    title: '✨ 完美吸附！',
    content: '当你把碎片拖到正确位置附近时，它会自动吸附到位。绿色的光晕表示你放对了！',
    actionType: 'click',
    autoNext: true,
    autoNextDelay: 2500,
    canSkip: true,
    position: {
      x: 375,
      y: 600,
      align: 'center'
    }
  },
  {
    id: 'introduce-rotate',
    title: '🔄 旋转功能',
    content: '有些碎片可能方向不对。你可以使用底部的「旋转」按钮，或者按键盘上的 R 键来旋转选中的碎片。',
    actionType: 'click',
    autoNext: false,
    canSkip: false,
    position: {
      x: 375,
      y: 750,
      align: 'center'
    },
    highlight: {
      x: 250,
      y: 845,
      width: 130,
      height: 58,
      type: 'rect',
      pulse: true
    }
  },
  {
    id: 'demo-rotate',
    title: '🔄 旋转演示',
    content: '看，这片碎片的方向不对。我先演示如何旋转它，然后再放到正确的位置。',
    actionType: 'wait',
    autoNext: true,
    autoNextDelay: 3500,
    canSkip: true,
    showDemo: true,
    demoData: {
      pieceId: 2,
      targetX: TARGET_AREA_X - 120,
      targetY: TARGET_AREA_Y + 90,
      targetRotation: 0
    },
    position: {
      x: 375,
      y: 650,
      align: 'center'
    }
  },
  {
    id: 'try-rotate',
    title: '🎮 你来试试旋转',
    content: '点击选中下方的碎片，然后使用「旋转」按钮调整方向，最后将它拖到闪烁的位置。',
    actionType: 'rotate',
    targetPieceId: 3,
    canSkip: false,
    validation: {
      type: 'piece_snapped',
      pieceId: 3
    },
    position: {
      x: 375,
      y: 700,
      align: 'center'
    },
    highlight: {
      x: TARGET_AREA_X + 120,
      y: TARGET_AREA_Y + 90,
      width: 120,
      height: 110,
      type: 'rect',
      pulse: true
    }
  },
  {
    id: 'introduce-hint',
    title: '💡 提示功能',
    content: '遇到困难时，可以使用「提示」按钮来查看完整的标本图像。它会显示一个半透明的参考图。',
    actionType: 'click',
    autoNext: false,
    canSkip: false,
    position: {
      x: 375,
      y: 750,
      align: 'center'
    },
    highlight: {
      x: 375,
      y: 845,
      width: 130,
      height: 58,
      type: 'rect',
      pulse: true
    }
  },
  {
    id: 'try-hint',
    title: '🎮 点击提示按钮',
    content: '现在点击「提示」按钮，看看完整的标本是什么样子的。',
    actionType: 'click',
    targetElement: 'hint-btn',
    canSkip: false,
    validation: {
      type: 'custom',
      customCheck: 'hint_used'
    },
    position: {
      x: 375,
      y: 700,
      align: 'center'
    },
    arrow: {
      startX: 375,
      startY: 780,
      endX: 375,
      endY: 845,
      color: 0xff9800
    }
  },
  {
    id: 'introduce-reset',
    title: '🔄 重置功能',
    content: '如果想重新开始，可以点击「重置」按钮。所有碎片会回到初始位置，时间也会重置。',
    actionType: 'click',
    autoNext: false,
    canSkip: false,
    position: {
      x: 375,
      y: 750,
      align: 'center'
    },
    highlight: {
      x: 500,
      y: 845,
      width: 130,
      height: 58,
      type: 'rect',
      pulse: true
    }
  },
  {
    id: 'complete-puzzle',
    title: '🏆 完成标本修复',
    content: '你已经学会了所有基本操作！现在把剩下的碎片都放到正确的位置，完成这个标本的修复吧！',
    actionType: 'complete',
    canSkip: false,
    validation: {
      type: 'level_completed'
    },
    position: {
      x: 375,
      y: 650,
      align: 'center'
    }
  },
  {
    id: 'congratulations',
    title: '🎉 太棒了！',
    content: '你成功完成了教学关卡！现在你已经掌握了修复植物标本的所有技巧。作为奖励，你将获得特殊的新手礼包！',
    actionType: 'click',
    autoNext: false,
    canSkip: false,
    position: {
      x: 375,
      y: 400,
      align: 'center'
    }
  }
];

export const Tutorials: TutorialData[] = [
  {
    id: 'beginner-tutorial',
    name: '新手教学',
    description: '学习植物标本修复的基本操作',
    levelId: 0,
    isTeachingLevel: true,
    requiredForProgress: true,
    unlockMessage: '欢迎来到植物标本修复的世界！让我带你了解如何操作。',
    steps: TutorialSteps,
    rewards: [
      {
        type: 'score',
        id: 1001,
        name: '新手积分奖励',
        description: '完成新手教学获得的积分奖励',
        value: 500
      },
      {
        type: 'badge',
        id: 201,
        name: '新手徽章',
        description: '完成新手教学的纪念徽章'
      }
    ]
  }
];

export const GameTutorials: Record<string, TutorialStep[]> = {
  'level-1-intro': [
    {
      id: 'level1-welcome',
      title: '🌱 第一关：银杏叶',
      content: '这是你的第一个正式关卡！这是一片银杏叶，是现存最古老的种子植物之一。',
      actionType: 'click',
      autoNext: true,
      autoNextDelay: 3000,
      canSkip: true,
      position: {
        x: 375,
        y: 250,
        align: 'center'
      }
    }
  ]
};

export function getTutorialById(id: string): TutorialData | undefined {
  return Tutorials.find(t => t.id === id);
}

export function getGameTutorial(levelId: number): TutorialStep[] | undefined {
  return GameTutorials[`level-${levelId}-intro`];
}

export function getTeachingLevelTutorial(): TutorialData {
  return Tutorials[0];
}

export function shouldShowTutorial(levelId: number, tutorialCompleted: boolean): boolean {
  if (levelId === 0) return true;
  if (tutorialCompleted) return false;
  return levelId === 1;
}
