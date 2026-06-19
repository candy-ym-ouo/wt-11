import {
  QuizSaveData,
  QuizProgress,
  QuizSession,
  QuizQuestion,
  QuizResultData,
  QuizReward,
  ChapterQuizConfig
} from '../types/GameTypes';
import {
  getQuizById,
  getQuestionsForQuiz,
  getChapterQuiz,
  shuffleArray,
  canAttemptQuiz
} from '../data/ChapterQuizzes';
import { PlantSpecimens } from '../data/PlantSpecimens';

export class QuizManager {
  private static data: QuizSaveData;
  private static currentSession: QuizSession | null = null;

  static init(saveData: QuizSaveData): void {
    this.data = saveData;
  }

  static createDefaultQuizSave(): QuizSaveData {
    const quizProgress: Record<string, QuizProgress> = {};

    const defaultQuizzes = ['quiz-chapter-1', 'quiz-chapter-2', 'quiz-chapter-3'];
    defaultQuizzes.forEach(quizId => {
      quizProgress[quizId] = {
        quizId,
        bestScore: 0,
        bestTime: 0,
        completed: false,
        attempts: 0,
        rewardsClaimed: false,
        highestStreak: 0
      };
    });

    return {
      quizProgress,
      totalQuizScore: 0,
      totalQuizzesCompleted: 0,
      totalCorrectAnswers: 0,
      totalQuestionsAnswered: 0,
      currentStreak: 0,
      bestStreak: 0
    };
  }

  static getSaveData(): QuizSaveData {
    return { ...this.data };
  }

  static getQuizProgress(quizId: string): QuizProgress | undefined {
    return this.data.quizProgress[quizId];
  }

  static getAllQuizProgress(): Record<string, QuizProgress> {
    return { ...this.data.quizProgress };
  }

  static isQuizUnlocked(quizId: string, unlockedSpecimens: number[]): boolean {
    return canAttemptQuiz(quizId, unlockedSpecimens);
  }

  static isQuizCompleted(quizId: string): boolean {
    return this.data.quizProgress[quizId]?.completed ?? false;
  }

  static canClaimQuizRewards(quizId: string): boolean {
    const progress = this.data.quizProgress[quizId];
    return progress?.completed === true && progress?.rewardsClaimed === false;
  }

  static getTotalQuizScore(): number {
    return this.data.totalQuizScore;
  }

  static getTotalQuizzesCompleted(): number {
    return this.data.totalQuizzesCompleted;
  }

  static getCurrentStreak(): number {
    return this.data.currentStreak;
  }

  static getBestStreak(): number {
    return this.data.bestStreak;
  }

  static startQuizSession(quizId: string, unlockedSpecimens: number[]): QuizSession | null {
    if (!this.isQuizUnlocked(quizId, unlockedSpecimens)) {
      return null;
    }

    const quiz = getQuizById(quizId);
    if (!quiz) return null;

    const allQuestions = getQuestionsForQuiz(quizId);
    const availableQuestions = allQuestions.filter(q =>
      unlockedSpecimens.includes(q.specimenId)
    );

    if (availableQuestions.length === 0) return null;

    const shuffledQuestions = shuffleArray(availableQuestions);
    const selectedQuestions = shuffledQuestions.slice(0, Math.min(6, shuffledQuestions.length));

    const finalQuestions = selectedQuestions.map(q => ({
      ...q,
      options: shuffleArray([...q.options])
    }));

    this.currentSession = {
      quizId,
      currentQuestionIndex: 0,
      questions: finalQuestions,
      score: 0,
      correctCount: 0,
      incorrectCount: 0,
      currentStreak: 0,
      startTime: Date.now(),
      elapsedTime: 0,
      answers: []
    };

    return { ...this.currentSession };
  }

  static getCurrentQuestion(): QuizQuestion | null {
    if (!this.currentSession) return null;
    return this.currentSession.questions[this.currentSession.currentQuestionIndex] || null;
  }

  static getSession(): QuizSession | null {
    return this.currentSession ? { ...this.currentSession } : null;
  }

  static answerQuestion(selectedIndex: number): {
    isCorrect: boolean;
    correctAnswerIndex: number;
    explanation: string;
    question: QuizQuestion;
    scoreGained: number;
    streak: number;
    isLastQuestion: boolean;
    timeTaken: number;
  } | null {
    if (!this.currentSession) return null;

    const session = this.currentSession;
    const question = session.questions[session.currentQuestionIndex];
    if (!question) return null;

    const answerStartTime = session.startTime + session.elapsedTime * 1000;
    const timeTaken = Math.floor((Date.now() - answerStartTime) / 1000);

    const originalQuestion = getQuestionsForQuiz(session.quizId).find(q => q.id === question.id);
    const correctAnswerIndex = originalQuestion
      ? question.options.findIndex(opt => opt === originalQuestion.options[originalQuestion.correctAnswerIndex])
      : question.correctAnswerIndex;

    const isCorrect = selectedIndex === correctAnswerIndex;

    let scoreGained = 0;
    if (isCorrect) {
      session.correctCount++;
      session.currentStreak++;
      this.data.currentStreak++;

      const baseScore = question.difficulty === 'easy' ? 100 : question.difficulty === 'medium' ? 150 : 200;
      const streakBonus = Math.min(session.currentStreak, 5) * 10;
      const timeBonus = timeTaken < 10 ? 30 : timeTaken < 20 ? 15 : 0;
      scoreGained = baseScore + streakBonus + timeBonus;

      session.score += scoreGained;

      if (this.data.currentStreak > this.data.bestStreak) {
        this.data.bestStreak = this.data.currentStreak;
      }
      if (session.currentStreak > session.answers.reduce((max, a) =>
        a.isCorrect ? max + 1 : 0, 0
      )) {
        session.answers[session.answers.length - (session.currentStreak - 1)];
      }
    } else {
      session.incorrectCount++;
      session.currentStreak = 0;
      this.data.currentStreak = 0;
    }

    session.answers.push({
      questionId: question.id,
      selectedIndex,
      isCorrect,
      timeTaken
    });

    this.data.totalQuestionsAnswered++;
    if (isCorrect) {
      this.data.totalCorrectAnswers++;
    }

    const isLastQuestion = session.currentQuestionIndex >= session.questions.length - 1;

    if (!isLastQuestion) {
      session.currentQuestionIndex++;
    }

    session.elapsedTime = Math.floor((Date.now() - session.startTime) / 1000);

    return {
      isCorrect,
      correctAnswerIndex,
      explanation: question.explanation,
      question,
      scoreGained,
      streak: session.currentStreak,
      isLastQuestion,
      timeTaken
    };
  }

  static getElapsedTime(): number {
    if (!this.currentSession) return 0;
    return Math.floor((Date.now() - this.currentSession.startTime) / 1000);
  }

  static finishQuiz(forceEnd: boolean = false): QuizResultData | null {
    if (!this.currentSession) return null;

    const session = this.currentSession;
    const quiz = getQuizById(session.quizId);
    if (!quiz) return null;

    const totalQuestions = session.questions.length;
    const score = session.score;
    const correctCount = session.correctCount;
    const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const timeTaken = Math.floor((Date.now() - session.startTime) / 1000);
    const passed = accuracy >= quiz.passingScore && !forceEnd;
    const highestStreak = this.calculateHighestStreak(session.answers);

    const progress = this.data.quizProgress[session.quizId];
    const isNewRecord = passed && score > (progress?.bestScore || 0);
    const isNewBestTime = passed && (progress?.bestTime === 0 || timeTaken < progress.bestTime);

    const rewards: QuizReward[] = [];
    let bonusResearchExp = 0;
    let bonusResearchPoints = 0;
    let chapterStarBonus = 0;

    if (passed) {
      rewards.push(...quiz.rewards);

      bonusResearchExp = Math.floor(correctCount * 5 + accuracy * 0.5);
      bonusResearchPoints = Math.floor(correctCount * 2 + highestStreak * 3);

      const starBonusReward = quiz.rewards.find(r => r.type === 'star_bonus');
      if (starBonusReward) {
        chapterStarBonus = starBonusReward.value;
      }

      if (progress) {
        progress.attempts++;
        progress.lastPlayedAt = Date.now();

        if (!progress.completed) {
          progress.completed = true;
          progress.completedAt = Date.now();
          this.data.totalQuizzesCompleted++;
        }

        if (isNewRecord) {
          progress.bestScore = score;
        }
        if (isNewBestTime) {
          progress.bestTime = timeTaken;
        }
        if (highestStreak > progress.highestStreak) {
          progress.highestStreak = highestStreak;
        }

        this.data.totalQuizScore += score;
      }
    } else if (progress) {
      progress.attempts++;
      progress.lastPlayedAt = Date.now();
    }

    const wrongAnswers = session.answers
      .filter(a => !a.isCorrect)
      .map(a => ({
        question: session.questions.find(q => q.id === a.questionId)!,
        selectedIndex: a.selectedIndex
      }));

    const result: QuizResultData = {
      quizId: session.quizId,
      score,
      totalQuestions,
      correctCount,
      accuracy,
      timeTaken,
      passed,
      isNewRecord,
      isNewBestTime,
      highestStreak,
      rewards,
      bonusResearchExp,
      bonusResearchPoints,
      chapterStarBonus,
      wrongAnswers
    };

    this.currentSession = null;

    return result;
  }

  private static calculateHighestStreak(
    answers: { questionId: string; selectedIndex: number; isCorrect: boolean; timeTaken: number }[]
  ): number {
    let maxStreak = 0;
    let currentStreak = 0;

    for (const answer of answers) {
      if (answer.isCorrect) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    return maxStreak;
  }

  static claimQuizRewards(quizId: string): QuizReward[] {
    const progress = this.data.quizProgress[quizId];
    if (!progress || !progress.completed || progress.rewardsClaimed) {
      return [];
    }

    const quiz = getQuizById(quizId);
    if (!quiz) return [];

    progress.rewardsClaimed = true;
    return [...quiz.rewards];
  }

  static getQuizForChapter(chapterId: number): ChapterQuizConfig | undefined {
    return getChapterQuiz(chapterId);
  }

  static getRequiredSpecimenNames(quizId: string): string[] {
    const quiz = getQuizById(quizId);
    if (!quiz) return [];
    return quiz.requiredSpecimenIds
      .map(id => PlantSpecimens[id]?.name)
      .filter(Boolean) as string[];
  }

  static getAccuracyRate(): number {
    if (this.data.totalQuestionsAnswered === 0) return 0;
    return Math.round((this.data.totalCorrectAnswers / this.data.totalQuestionsAnswered) * 100);
  }

  static getQuizStatistics(): {
    totalQuizzes: number;
    completedQuizzes: number;
    totalQuestions: number;
    correctAnswers: number;
    accuracy: number;
    currentStreak: number;
    bestStreak: number;
    totalScore: number;
  } {
    return {
      totalQuizzes: Object.keys(this.data.quizProgress).length,
      completedQuizzes: this.data.totalQuizzesCompleted,
      totalQuestions: this.data.totalQuestionsAnswered,
      correctAnswers: this.data.totalCorrectAnswers,
      accuracy: this.getAccuracyRate(),
      currentStreak: this.data.currentStreak,
      bestStreak: this.data.bestStreak,
      totalScore: this.data.totalQuizScore
    };
  }
}
