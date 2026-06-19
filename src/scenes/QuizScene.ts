import Phaser from 'phaser';
import { QuizManager } from '../utils/QuizManager';
import { SaveManager } from '../utils/SaveManager';
import { getQuizById, getQuizQuestion } from '../data/ChapterQuizzes';
import { KnowledgeCategoryInfo } from '../data/ResearchLabConfig';
import { PlantSpecimens } from '../data/PlantSpecimens';
import { GameConfig } from '../config/GameConfig';

export class QuizScene extends Phaser.Scene {
  private quizId: string = '';
  private currentQuestion: any = null;
  private timeLimit: number = 180;
  private remainingTime: number = 180;
  private timerEvent: Phaser.Time.TimerEvent | null = null;
  private selectedOptionIndex: number = -1;
  private isAnswering: boolean = false;
  private showingResult: boolean = false;

  private titleText!: Phaser.GameObjects.Text;
  private questionText!: Phaser.GameObjects.Text;
  private optionButtons: Phaser.GameObjects.Text[] = [];
  private optionBackgrounds: Phaser.GameObjects.Rectangle[] = [];
  private timerText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private progressText!: Phaser.GameObjects.Text;
  private streakText!: Phaser.GameObjects.Text;
  private explanationPanel!: Phaser.GameObjects.Container;
  private explanationText!: Phaser.GameObjects.Text;
  private nextButton!: Phaser.GameObjects.Container;
  private backButton!: Phaser.GameObjects.Container;
  private categoryIcon!: Phaser.GameObjects.Text;
  private specimenNameText!: Phaser.GameObjects.Text;
  private difficultyText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'QuizScene' });
  }

  init(data: { quizId: string }): void {
    this.quizId = data.quizId;
    this.selectedOptionIndex = -1;
    this.isAnswering = false;
    this.showingResult = false;
  }

  create(): void {
    const centerX = GameConfig.width / 2;
    const centerY = GameConfig.height / 2;

    this.add.rectangle(centerX, centerY, GameConfig.width, GameConfig.height, 0x1a1a2e);

    const quiz = getQuizById(this.quizId);
    if (!quiz) {
      this.scene.start('ChapterSelectScene');
      return;
    }

    this.timeLimit = quiz.timeLimit;
    this.remainingTime = quiz.timeLimit;

    const unlockedSpecimens = SaveManager.getUnlockedGalleryItems();
    const session = QuizManager.startQuizSession(this.quizId, unlockedSpecimens);

    if (!session) {
      this.scene.start('ChapterSelectScene');
      return;
    }

    this.createHeader(quiz);
    this.createQuestionPanel();
    this.createOptionButtons();
    this.createExplanationPanel();
    this.createNextButton();
    this.createBackButton();

    this.showQuestion();
    this.startTimer();

    this.events.on('shutdown', () => {
      if (this.timerEvent) {
        this.timerEvent.destroy();
      }
    });
  }

  private createHeader(quiz: any): void {
    const headerBg = this.add.rectangle(
      GameConfig.width / 2,
      90,
      GameConfig.width - 40,
      140,
      quiz.primaryColor,
      0.3
    );
    headerBg.setStrokeStyle(2, quiz.primaryColor);

    const title = this.add.text(
      GameConfig.width / 2,
      60,
      quiz.name,
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '28px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    );
    title.setOrigin(0.5);

    const statsContainer = this.add.container(GameConfig.width / 2, 120);

    this.timerText = this.add.text(
      -200,
      0,
      `⏱️ ${this.formatTime(this.remainingTime)}`,
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        color: '#ff6b6b'
      }
    );
    this.timerText.setOrigin(0.5);

    this.scoreText = this.add.text(
      -50,
      0,
      '⭐ 0',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        color: '#ffd700'
      }
    );
    this.scoreText.setOrigin(0.5);

    this.progressText = this.add.text(
      100,
      0,
      '📝 0/0',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        color: '#81c784'
      }
    );
    this.progressText.setOrigin(0.5);

    this.streakText = this.add.text(
      230,
      0,
      '🔥 0',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        color: '#ff9800'
      }
    );
    this.streakText.setOrigin(0.5);

    statsContainer.add([this.timerText, this.scoreText, this.progressText, this.streakText]);
  }

  private createQuestionPanel(): void {
    const panelY = 280;

    const panelBg = this.add.rectangle(
      GameConfig.width / 2,
      panelY,
      GameConfig.width - 60,
      200,
      0x2d2d44,
      0.9
    );
    panelBg.setStrokeStyle(2, 0x6666aa);

    const questionMetaContainer = this.add.container(GameConfig.width / 2, panelY - 75);

    this.categoryIcon = this.add.text(
      -200,
      0,
      '🔬',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '28px'
      }
    );
    this.categoryIcon.setOrigin(0.5);

    this.specimenNameText = this.add.text(
      -80,
      0,
      '',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        color: '#a0a0ff'
      }
    );
    this.specimenNameText.setOrigin(0, 0.5);

    this.difficultyText = this.add.text(
      200,
      0,
      '',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        color: '#ffb74d'
      }
    );
    this.difficultyText.setOrigin(0.5);

    questionMetaContainer.add([this.categoryIcon, this.specimenNameText, this.difficultyText]);

    this.questionText = this.add.text(
      GameConfig.width / 2,
      panelY + 20,
      '',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '24px',
        color: '#ffffff',
        wordWrap: { width: GameConfig.width - 100 }
      }
    );
    this.questionText.setOrigin(0.5);
  }

  private createOptionButtons(): void {
    const startY = 430;
    const spacing = 110;

    for (let i = 0; i < 4; i++) {
      const y = startY + i * spacing;

      const bg = this.add.rectangle(
        GameConfig.width / 2,
        y,
        GameConfig.width - 60,
        90,
        0x3d3d5c,
        0.9
      );
      bg.setStrokeStyle(2, 0x555588);
      bg.setInteractive({ useHandCursor: true });

      const optionLabel = this.add.text(
        GameConfig.width / 2 - 300,
        y,
        String.fromCharCode(65 + i) + '.',
        {
          fontFamily: 'Arial, sans-serif',
          fontSize: '24px',
          color: '#8888cc',
          fontStyle: 'bold'
        }
      );
      optionLabel.setOrigin(0, 0.5);

      const optionText = this.add.text(
        GameConfig.width / 2 - 250,
        y,
        '',
        {
          fontFamily: 'Arial, sans-serif',
          fontSize: '22px',
          color: '#ffffff',
          wordWrap: { width: GameConfig.width - 120 }
        }
      );
      optionText.setOrigin(0, 0.5);

      bg.on('pointerdown', () => this.onOptionClick(i));
      bg.on('pointerover', () => {
        if (!this.showingResult && !this.isAnswering) {
          bg.setFillStyle(0x4d4d70, 0.9);
          bg.setStrokeStyle(3, 0x8888ff);
        }
      });
      bg.on('pointerout', () => {
        if (!this.showingResult && !this.isAnswering) {
          bg.setFillStyle(0x3d3d5c, 0.9);
          bg.setStrokeStyle(2, 0x555588);
        }
      });

      this.optionBackgrounds.push(bg);
      this.optionButtons.push(optionText);
    }
  }

  private createExplanationPanel(): void {
    this.explanationPanel = this.add.container(GameConfig.width / 2, 880);
    this.explanationPanel.setVisible(false);

    const panelBg = this.add.rectangle(
      0,
      0,
      GameConfig.width - 60,
      150,
      0x1e3a1e,
      0.95
    );
    panelBg.setStrokeStyle(2, 0x4caf50);

    const title = this.add.text(
      -280,
      -55,
      '💡 解析',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        color: '#81c784',
        fontStyle: 'bold'
      }
    );
    title.setOrigin(0, 0.5);

    this.explanationText = this.add.text(
      0,
      10,
      '',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        color: '#a5d6a7',
        wordWrap: { width: GameConfig.width - 100 },
        align: 'center'
      }
    );
    this.explanationText.setOrigin(0.5);

    this.explanationPanel.add([panelBg, title, this.explanationText]);
  }

  private createNextButton(): void {
    this.nextButton = this.add.container(GameConfig.width / 2, 1020);
    this.nextButton.setVisible(false);

    const bg = this.add.rectangle(
      0,
      0,
      200,
      70,
      0x4caf50,
      0.9
    );
    bg.setStrokeStyle(2, 0x81c784);
    bg.setInteractive({ useHandCursor: true });

    const text = this.add.text(
      0,
      0,
      '下一题 →',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    );
    text.setOrigin(0.5);

    bg.on('pointerdown', () => this.onNextClick());
    bg.on('pointerover', () => {
      bg.setFillStyle(0x66bb6a, 0.9);
    });
    bg.on('pointerout', () => {
      bg.setFillStyle(0x4caf50, 0.9);
    });

    this.nextButton.add([bg, text]);
  }

  private createBackButton(): void {
    this.backButton = this.add.container(60, 40);

    const bg = this.add.circle(0, 0, 35, 0x333355, 0.9);
    bg.setStrokeStyle(2, 0x6666aa);
    bg.setInteractive({ useHandCursor: true });

    const text = this.add.text(
      0,
      0,
      '←',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '32px',
        color: '#ffffff'
      }
    );
    text.setOrigin(0.5);

    bg.on('pointerdown', () => {
      if (confirm('确定要退出测验吗？当前进度将不会保存。')) {
        QuizManager.finishQuiz(true);
        this.scene.start('ChapterSelectScene');
      }
    });

    this.backButton.add([bg, text]);
  }

  private showQuestion(): void {
    const question = QuizManager.getCurrentQuestion();
    const session = QuizManager.getSession();

    if (!question || !session) {
      this.finishQuiz();
      return;
    }

    this.currentQuestion = question;
    this.selectedOptionIndex = -1;
    this.showingResult = false;

    const specimen = PlantSpecimens[question.specimenId];
    const categoryInfo = KnowledgeCategoryInfo[question.category];

    this.categoryIcon.setText(categoryInfo?.icon || '🔬');
    this.specimenNameText.setText(specimen?.name || '未知植物');

    const difficultyText = question.difficulty === 'easy' ? '简单' :
      question.difficulty === 'medium' ? '中等' : '困难';
    const difficultyColor = question.difficulty === 'easy' ? '#81c784' :
      question.difficulty === 'medium' ? '#ffb74d' : '#ef5350';
    this.difficultyText.setText(difficultyText);
    this.difficultyText.setColor(difficultyColor);

    this.questionText.setText(question.question);

    question.options.forEach((option: string, index: number) => {
      this.optionButtons[index].setText(option);
      this.optionBackgrounds[index].setFillStyle(0x3d3d5c, 0.9);
      this.optionBackgrounds[index].setStrokeStyle(2, 0x555588);
      this.optionBackgrounds[index].setInteractive();
    });

    for (let i = question.options.length; i < 4; i++) {
      this.optionButtons[i].setVisible(false);
      this.optionBackgrounds[i].setVisible(false);
    }

    this.explanationPanel.setVisible(false);
    this.nextButton.setVisible(false);

    const currentQ = session.currentQuestionIndex + 1;
    const totalQ = session.questions.length;
    this.progressText.setText(`📝 ${currentQ}/${totalQ}`);
    this.scoreText.setText(`⭐ ${session.score}`);
    this.streakText.setText(`🔥 ${session.currentStreak}`);
  }

  private onOptionClick(index: number): void {
    if (this.showingResult || this.isAnswering) return;

    this.isAnswering = true;
    this.selectedOptionIndex = index;

    const result = QuizManager.answerQuestion(index);
    if (!result) {
      this.isAnswering = false;
      return;
    }

    this.showingResult = true;

    if (result.isCorrect) {
      this.optionBackgrounds[index].setFillStyle(0x2e7d32, 0.9);
      this.optionBackgrounds[index].setStrokeStyle(3, 0x4caf50);
    } else {
      this.optionBackgrounds[index].setFillStyle(0xc62828, 0.9);
      this.optionBackgrounds[index].setStrokeStyle(3, 0xef5350);
      this.optionBackgrounds[result.correctAnswerIndex].setFillStyle(0x2e7d32, 0.9);
      this.optionBackgrounds[result.correctAnswerIndex].setStrokeStyle(3, 0x4caf50);
    }

    this.explanationText.setText(result.explanation);
    this.explanationPanel.setVisible(true);

    this.scoreText.setText(`⭐ ${QuizManager.getSession()?.score || 0}`);
    this.streakText.setText(`🔥 ${result.streak}`);

    if (result.isLastQuestion) {
      const nextBtnText = this.nextButton.getAt(1) as Phaser.GameObjects.Text;
      nextBtnText.setText('完成测验 ✓');
    }
    this.nextButton.setVisible(true);

    this.optionBackgrounds.forEach(bg => bg.disableInteractive());
    this.isAnswering = false;
  }

  private onNextClick(): void {
    const session = QuizManager.getSession();
    if (!session) {
      this.finishQuiz();
      return;
    }

    if (session.currentQuestionIndex >= session.questions.length - 1 ||
      session.answers.length >= session.questions.length) {
      this.finishQuiz();
    } else {
      this.showQuestion();
    }
  }

  private startTimer(): void {
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true
    });
  }

  private updateTimer(): void {
    this.remainingTime--;
    this.timerText.setText(`⏱️ ${this.formatTime(this.remainingTime)}`);

    if (this.remainingTime <= 30) {
      this.timerText.setColor('#ff5252');
    }

    if (this.remainingTime <= 0) {
      if (this.timerEvent) {
        this.timerEvent.destroy();
      }
      this.timerText.setText('⏱️ 时间到！');
      this.time.delayedCall(1000, () => this.finishQuiz(true), [], this);
    }
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  private finishQuiz(forceEnd: boolean = false): void {
    if (this.timerEvent) {
      this.timerEvent.destroy();
    }

    const result = QuizManager.finishQuiz(forceEnd);
    if (result) {
      this.scene.start('QuizResultScene', { result });
    } else {
      this.scene.start('ChapterSelectScene');
    }
  }
}
