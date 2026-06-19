import Phaser from 'phaser';
import { QuizResultData, QuizReward } from '../types/GameTypes';
import { SaveManager } from '../utils/SaveManager';
import { QuizManager } from '../utils/QuizManager';
import { getQuizById, getChapterQuiz, QuizQuestions } from '../data/ChapterQuizzes';
import { getChapterById } from '../data/Chapters';
import { GameConfig } from '../config/GameConfig';

export class QuizResultScene extends Phaser.Scene {
  private result!: QuizResultData;
  private rewardsClaimed: boolean = false;

  constructor() {
    super({ key: 'QuizResultScene' });
  }

  init(data: { result: QuizResultData }): void {
    this.result = data.result;
    this.rewardsClaimed = false;
  }

  create(): void {
    const centerX = GameConfig.width / 2;
    const centerY = GameConfig.height / 2;

    this.add.rectangle(centerX, centerY, GameConfig.width, GameConfig.height, 0x1a1a2e);

    const quiz = getQuizById(this.result.quizId);
    const chapterQuiz = getChapterQuiz(
      quiz?.chapterId || 1
    );

    const primaryColor = chapterQuiz?.primaryColor || 0x4caf50;
    const secondaryColor = chapterQuiz?.secondaryColor || 0x81c784;

    this.createHeader(primaryColor);
    this.createResultPanel(primaryColor, secondaryColor);
    this.createWrongAnswersPanel();
    this.createRewardsPanel(primaryColor, secondaryColor);
    this.createButtons(primaryColor);
  }

  private createHeader(primaryColor: number): void {
    const headerBg = this.add.rectangle(
      GameConfig.width / 2,
      100,
      GameConfig.width - 40,
      120,
      primaryColor,
      0.3
    );
    headerBg.setStrokeStyle(2, primaryColor);

    const title = this.add.text(
      GameConfig.width / 2,
      70,
      this.result.passed ? '🎉 测验通过！' : '📚 继续加油！',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '36px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    );
    title.setOrigin(0.5);

    const subtitle = this.add.text(
      GameConfig.width / 2,
      115,
      getQuizById(this.result.quizId)?.name || '植物百科测验',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        color: '#aaaaaa'
      }
    );
    subtitle.setOrigin(0.5);
  }

  private createResultPanel(primaryColor: number, secondaryColor: number): void {
    const panelY = 280;

    const panelBg = this.add.rectangle(
      GameConfig.width / 2,
      panelY,
      GameConfig.width - 60,
      280,
      0x2d2d44,
      0.9
    );
    panelBg.setStrokeStyle(2, 0x6666aa);

    const scoreText = this.add.text(
      GameConfig.width / 2,
      panelY - 100,
      `${this.result.score}`,
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '72px',
        color: this.result.passed ? '#ffd700' : '#888888',
        fontStyle: 'bold'
      }
    );
    scoreText.setOrigin(0.5);

    const scoreLabel = this.add.text(
      GameConfig.width / 2,
      panelY - 50,
      '总分',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        color: '#aaaaaa'
      }
    );
    scoreLabel.setOrigin(0.5);

    const statsContainer = this.add.container(GameConfig.width / 2, panelY + 60);

    const statItems = [
      { icon: '✅', label: '正确', value: `${this.result.correctCount}/${this.result.totalQuestions}`, color: '#81c784' },
      { icon: '🎯', label: '正确率', value: `${this.result.accuracy}%`, color: '#64b5f6' },
      { icon: '⏱️', label: '用时', value: this.formatTime(this.result.timeTaken), color: '#ffb74d' },
      { icon: '🔥', label: '最高连击', value: `${this.result.highestStreak}`, color: '#ff7043' }
    ];

    const itemWidth = 150;
    const startX = -225;

    statItems.forEach((item, index) => {
      const x = startX + index * itemWidth;

      const iconBg = this.add.circle(x, -20, 25, primaryColor, 0.3);
      iconBg.setStrokeStyle(2, primaryColor);

      const icon = this.add.text(
        x,
        -20,
        item.icon,
        {
          fontFamily: 'Arial, sans-serif',
          fontSize: '24px'
        }
      );
      icon.setOrigin(0.5);

      const value = this.add.text(
        x,
        25,
        item.value,
        {
          fontFamily: 'Arial, sans-serif',
          fontSize: '22px',
          color: item.color,
          fontStyle: 'bold'
        }
      );
      value.setOrigin(0.5);

      const label = this.add.text(
        x,
        55,
        item.label,
        {
          fontFamily: 'Arial, sans-serif',
          fontSize: '16px',
          color: '#888888'
        }
      );
      label.setOrigin(0.5);

      statsContainer.add([iconBg, icon, value, label]);
    });

    if (this.result.isNewRecord) {
      const newRecord = this.add.text(
        GameConfig.width / 2,
        panelY + 160,
        '🏆 新纪录！',
        {
          fontFamily: 'Arial, sans-serif',
          fontSize: '24px',
          color: '#ffd700',
          fontStyle: 'bold'
        }
      );
      newRecord.setOrigin(0.5);
    }
  }

  private createWrongAnswersPanel(): void {
    if (this.result.wrongAnswers.length === 0) return;

    const panelY = 600;

    const panelBg = this.add.rectangle(
      GameConfig.width / 2,
      panelY,
      GameConfig.width - 60,
      120 + Math.min(this.result.wrongAnswers.length, 3) * 80,
      0x3d2d2d,
      0.9
    );
    panelBg.setStrokeStyle(2, 0xef5350);

    const title = this.add.text(
      GameConfig.width / 2,
      panelY - 40,
      '❌ 需要复习的题目',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        color: '#ef5350',
        fontStyle: 'bold'
      }
    );
    title.setOrigin(0.5);

    const displayWrong = this.result.wrongAnswers.slice(0, 3);

    displayWrong.forEach((wrong, index) => {
      const y = panelY + 10 + index * 70;

      const questionPreview = wrong.question.question.length > 30
        ? wrong.question.question.substring(0, 30) + '...'
        : wrong.question.question;

      const qText = this.add.text(
        GameConfig.width / 2 - 280,
        y,
        `${index + 1}. ${questionPreview}`,
        {
          fontFamily: 'Arial, sans-serif',
          fontSize: '16px',
          color: '#ffccbc',
          wordWrap: { width: 400 }
        }
      );
      qText.setOrigin(0, 0.5);

      const originalQ = QuizQuestions.find((q: any) => q.id === wrong.question.id);

      const correctAnswer = originalQ
        ? wrong.question.options.findIndex((opt: string) => opt === originalQ.options[originalQ.correctAnswerIndex])
        : wrong.question.correctAnswerIndex;

      const aText = this.add.text(
        GameConfig.width / 2 + 100,
        y,
        `正确: ${String.fromCharCode(65 + correctAnswer)}`,
        {
          fontFamily: 'Arial, sans-serif',
          fontSize: '16px',
          color: '#81c784',
          fontStyle: 'bold'
        }
      );
      aText.setOrigin(0, 0.5);
    });

    if (this.result.wrongAnswers.length > 3) {
      const moreText = this.add.text(
        GameConfig.width / 2,
        panelY + 10 + 3 * 70,
        `还有 ${this.result.wrongAnswers.length - 3} 道错误题目`,
        {
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px',
          color: '#888888'
        }
      );
      moreText.setOrigin(0.5);
    }
  }

  private createRewardsPanel(primaryColor: number, secondaryColor: number): void {
    if (!this.result.passed) return;

    const panelY = this.result.wrongAnswers.length > 0 ? 780 : 600;

    const panelBg = this.add.rectangle(
      GameConfig.width / 2,
      panelY,
      GameConfig.width - 60,
      180 + Math.ceil(this.result.rewards.length / 2) * 80,
      0x2d3d2d,
      0.9
    );
    panelBg.setStrokeStyle(2, primaryColor);

    const title = this.add.text(
      GameConfig.width / 2,
      panelY - 60,
      '🎁 获得奖励',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '24px',
        color: '#81c784',
        fontStyle: 'bold'
      }
    );
    title.setOrigin(0.5);

    const allRewards = [
      ...this.result.rewards,
      {
        type: 'research_point' as const,
        id: 999,
        name: '额外研究经验',
        description: '答对题目获得的额外经验',
        value: this.result.bonusResearchExp,
        rarity: 'common' as const,
        icon: '📚'
      },
      {
        type: 'research_point' as const,
        id: 998,
        name: '额外研究点数',
        description: '答对题目获得的额外点数',
        value: this.result.bonusResearchPoints,
        rarity: 'common' as const,
        icon: '🔬'
      }
    ];

    const itemWidth = 320;
    const itemHeight = 70;
    const itemsPerRow = 2;

    allRewards.forEach((reward, index) => {
      const row = Math.floor(index / itemsPerRow);
      const col = index % itemsPerRow;
      const x = GameConfig.width / 2 - itemWidth / 2 + col * itemWidth - 20;
      const y = panelY + row * itemHeight;

      this.createRewardItem(x, y, reward, primaryColor);
    });

    const claimBtnY = panelY + Math.ceil(allRewards.length / 2) * itemHeight + 20;

    const claimBtnBg = this.add.rectangle(
      GameConfig.width / 2,
      claimBtnY,
      250,
      70,
      primaryColor,
      0.9
    );
    claimBtnBg.setStrokeStyle(2, secondaryColor);
    claimBtnBg.setInteractive({ useHandCursor: true });

    const claimBtnText = this.add.text(
      GameConfig.width / 2,
      claimBtnY,
      '领取奖励 ✓',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    );
    claimBtnText.setOrigin(0.5);

    claimBtnBg.on('pointerdown', () => this.claimRewards());
    claimBtnBg.on('pointerover', () => {
      claimBtnBg.setFillStyle(secondaryColor, 0.9);
    });
    claimBtnBg.on('pointerout', () => {
      claimBtnBg.setFillStyle(primaryColor, 0.9);
    });
  }

  private createRewardItem(x: number, y: number, reward: QuizReward, primaryColor: number): void {
    const rarityColors: Record<string, number> = {
      common: 0x9e9e9e,
      rare: 0x2196f3,
      epic: 0x9c27b0,
      legendary: 0xff9800
    };

    const borderColor = rarityColors[reward.rarity] || 0x9e9e9e;

    const bg = this.add.rectangle(
      x,
      y,
      300,
      60,
      0x3d4d3d,
      0.9
    );
    bg.setStrokeStyle(2, borderColor);

    const iconBg = this.add.circle(
      x - 110,
      y,
      22,
      primaryColor,
      0.3
    );
    iconBg.setStrokeStyle(2, primaryColor);

    const icon = this.add.text(
      x - 110,
      y,
      reward.icon,
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px'
      }
    );
    icon.setOrigin(0.5);

    const name = this.add.text(
      x - 70,
      y - 12,
      reward.name,
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    );
    name.setOrigin(0, 0.5);

    const value = this.add.text(
      x + 90,
      y - 12,
      `+${reward.value}`,
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        color: '#81c784',
        fontStyle: 'bold'
      }
    );
    value.setOrigin(1, 0.5);

    const rarityText = this.add.text(
      x - 70,
      y + 12,
      this.getRarityText(reward.rarity),
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        color: `#${borderColor.toString(16).padStart(6, '0')}`
      }
    );
    rarityText.setOrigin(0, 0.5);
  }

  private getRarityText(rarity: string): string {
    const texts: Record<string, string> = {
      common: '普通',
      rare: '稀有',
      epic: '史诗',
      legendary: '传说'
    };
    return texts[rarity] || rarity;
  }

  private claimRewards(): void {
    if (this.rewardsClaimed) return;
    this.rewardsClaimed = true;

    const quiz = getQuizById(this.result.quizId);
    if (!quiz) return;

    this.result.rewards.forEach(reward => {
      switch (reward.type) {
        case 'score':
          SaveManager.addScore(reward.value);
          break;
        case 'research_point':
          SaveManager.grantResearchPoints(reward.value);
          break;
        case 'material':
          if (reward.materialId) {
            SaveManager.addMaterials(reward.materialId, reward.value);
          }
          break;
        case 'fragment':
          if (reward.fragmentId) {
            SaveManager.addFragments(reward.fragmentId, reward.value);
          }
          break;
        case 'badge':
          if (reward.badgeId) {
            (SaveManager as any).data.badges[reward.badgeId] = true;
          }
          break;
        case 'star_bonus':
          this.grantChapterStarBonus(quiz.chapterId, reward.value);
          break;
      }
    });

    SaveManager.grantResearchExp(this.result.bonusResearchExp);
    SaveManager.grantResearchPoints(this.result.bonusResearchPoints);

    QuizManager.claimQuizRewards(this.result.quizId);
    SaveManager.save();

    this.showRewardClaimAnimation();
  }

  private grantChapterStarBonus(chapterId: number, bonusStars: number): void {
    const chapter = getChapterById(chapterId);
    if (!chapter) return;

    chapter.levelIds.forEach(levelId => {
      const progress = SaveManager.getProgress(levelId);
      if (progress && progress.completed) {
        const newStars = Math.min(3, progress.stars + bonusStars);
        if (newStars > progress.stars) {
          progress.stars = newStars;
        }
      }
    });
  }

  private showRewardClaimAnimation(): void {
    const overlay = this.add.rectangle(
      GameConfig.width / 2,
      GameConfig.height / 2,
      GameConfig.width,
      GameConfig.height,
      0x000000,
      0.8
    );

    const text = this.add.text(
      GameConfig.width / 2,
      GameConfig.height / 2,
      '🎊 奖励已领取！',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '48px',
        color: '#ffd700',
        fontStyle: 'bold'
      }
    );
    text.setOrigin(0.5);
    text.setAlpha(0);

    this.tweens.add({
      targets: text,
      alpha: 1,
      scale: 1.2,
      duration: 500,
      ease: 'Bounce.easeOut',
      onComplete: () => {
        this.time.delayedCall(1000, () => {
          this.tweens.add({
            targets: [overlay, text],
            alpha: 0,
            duration: 300,
            onComplete: () => {
              overlay.destroy();
              text.destroy();
            }
          });
        }, [], this);
      }
    });
  }

  private createButtons(primaryColor: number): void {
    const buttonY = 1200;

    const retryBtnBg = this.add.rectangle(
      GameConfig.width / 2 - 140,
      buttonY,
      240,
      70,
      0x555588,
      0.9
    );
    retryBtnBg.setStrokeStyle(2, 0x7777aa);
    retryBtnBg.setInteractive({ useHandCursor: true });

    const retryBtnText = this.add.text(
      GameConfig.width / 2 - 140,
      buttonY,
      '🔄 再试一次',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    );
    retryBtnText.setOrigin(0.5);

    retryBtnBg.on('pointerdown', () => {
      this.scene.start('QuizScene', { quizId: this.result.quizId });
    });
    retryBtnBg.on('pointerover', () => {
      retryBtnBg.setFillStyle(0x666699, 0.9);
    });
    retryBtnBg.on('pointerout', () => {
      retryBtnBg.setFillStyle(0x555588, 0.9);
    });

    const backBtnBg = this.add.rectangle(
      GameConfig.width / 2 + 140,
      buttonY,
      240,
      70,
      primaryColor,
      0.9
    );
    backBtnBg.setStrokeStyle(2, primaryColor);
    backBtnBg.setInteractive({ useHandCursor: true });

    const backBtnText = this.add.text(
      GameConfig.width / 2 + 140,
      buttonY,
      '返回章节',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    );
    backBtnText.setOrigin(0.5);

    backBtnBg.on('pointerdown', () => {
      this.scene.start('ChapterSelectScene');
    });
    backBtnBg.on('pointerover', () => {
      backBtnBg.setFillStyle(0x66bb6a, 0.9);
    });
    backBtnBg.on('pointerout', () => {
      backBtnBg.setFillStyle(primaryColor, 0.9);
    });
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs}秒`;
  }
}
