import {
  TutorialSaveData,
  TutorialProgress,
  TutorialData,
  TutorialStep,
  TutorialCompletionResult,
  Reward,
  AchievementUnlockResult
} from '../types/GameTypes';
import { getTutorialById, getTeachingLevelTutorial, shouldShowTutorial } from '../data/TutorialConfig';
import { SaveManager } from './SaveManager';
import { AchievementManager } from './AchievementManager';

export class TutorialManager {
  private static data: TutorialSaveData;
  private static currentStepIndex: number = 0;
  private static currentTutorial: TutorialData | null = null;
  private static stepValidationState: Record<string, boolean> = {};
  private static customValidationState: Record<string, boolean> = {};
  private static listeners: Array<(event: string, data?: any) => void> = [];

  static init(saveData: TutorialSaveData): void {
    this.data = saveData;
    this.stepValidationState = {};
    this.customValidationState = {};
    this.listeners = [];
  }

  static createDefaultTutorialSave(): TutorialSaveData {
    return {
      completedTutorials: [],
      currentTutorialId: null,
      progress: {},
      teachingLevelCompleted: false,
      firstTimePlayer: true,
      rewardsClaimed: {}
    };
  }

  static isFirstTimePlayer(): boolean {
    return this.data.firstTimePlayer;
  }

  static setFirstTimePlayer(value: boolean): void {
    this.data.firstTimePlayer = value;
    this.save();
  }

  static shouldShowTeachingLevel(): boolean {
    return this.data.firstTimePlayer || !this.data.teachingLevelCompleted;
  }

  static isTutorialCompleted(tutorialId: string): boolean {
    return this.data.completedTutorials.includes(tutorialId);
  }

  static isTeachingLevelCompleted(): boolean {
    return this.data.teachingLevelCompleted;
  }

  static getCurrentTutorial(): TutorialData | null {
    return this.currentTutorial;
  }

  static getCurrentStep(): TutorialStep | null {
    if (!this.currentTutorial || this.currentStepIndex >= this.currentTutorial.steps.length) {
      return null;
    }
    return this.currentTutorial.steps[this.currentStepIndex];
  }

  static getCurrentStepIndex(): number {
    return this.currentStepIndex;
  }

  static getTotalSteps(): number {
    return this.currentTutorial?.steps.length || 0;
  }

  static startTutorial(tutorialId: string): boolean {
    const tutorial = getTutorialById(tutorialId);
    if (!tutorial) return false;

    this.currentTutorial = tutorial;
    this.currentStepIndex = 0;
    this.stepValidationState = {};
    this.customValidationState = {};
    this.data.currentTutorialId = tutorialId;

    if (!this.data.progress[tutorialId]) {
      this.data.progress[tutorialId] = {
        tutorialId,
        currentStepId: tutorial.steps[0].id,
        currentStepIndex: 0,
        completed: false,
        rewardsClaimed: false,
        attempts: 0
      };
    }

    this.data.progress[tutorialId].attempts++;
    this.save();
    this.emit('tutorial-started', { tutorialId });
    this.emit('step-changed', this.getCurrentStep());

    return true;
  }

  static startTeachingLevel(): boolean {
    const tutorial = getTeachingLevelTutorial();
    return this.startTutorial(tutorial.id);
  }

  static validateCurrentStep(validationData: {
    type: string;
    pieceId?: number;
    customCheck?: string;
  }): boolean {
    const currentStep = this.getCurrentStep();
    if (!currentStep || !currentStep.validation) return true;

    const validation = currentStep.validation;

    switch (validation.type) {
      case 'piece_snapped':
        if (validation.pieceId !== undefined && validationData.pieceId !== undefined) {
          const isValid = validationData.pieceId === validation.pieceId;
          if (isValid) {
            this.stepValidationState[currentStep.id] = true;
          }
          return isValid;
        }
        return false;

      case 'piece_rotated':
        if (validation.pieceId !== undefined && validationData.pieceId !== undefined) {
          const isValid = validationData.pieceId === validation.pieceId;
          if (isValid) {
            this.stepValidationState[currentStep.id] = true;
          }
          return isValid;
        }
        return false;

      case 'piece_dragged':
        if (validation.pieceId !== undefined && validationData.pieceId !== undefined) {
          const isValid = validationData.pieceId === validation.pieceId;
          if (isValid) {
            this.stepValidationState[currentStep.id] = true;
          }
          return isValid;
        }
        return false;

      case 'level_completed':
        this.stepValidationState[currentStep.id] = true;
        return true;

      case 'custom':
        if (validation.customCheck && validationData.customCheck) {
          const isValid = validation.customCheck === validationData.customCheck;
          if (isValid) {
            this.stepValidationState[currentStep.id] = true;
            this.customValidationState[validation.customCheck] = true;
          }
          return isValid;
        }
        return false;

      default:
        return false;
    }
  }

  static isCurrentStepValidated(): boolean {
    const currentStep = this.getCurrentStep();
    if (!currentStep) return true;
    if (!currentStep.validation) return true;
    return this.stepValidationState[currentStep.id] === true;
  }

  static setCustomValidation(check: string, value: boolean): void {
    this.customValidationState[check] = value;
  }

  static isCustomValidationPassed(check: string): boolean {
    return this.customValidationState[check] === true;
  }

  static nextStep(): { canProceed: boolean; isComplete: boolean; newStep: TutorialStep | null } {
    const currentStep = this.getCurrentStep();
    if (!currentStep) {
      return { canProceed: false, isComplete: true, newStep: null };
    }

    if (!this.isCurrentStepValidated() && currentStep.validation) {
      this.emit('validation-failed', { stepId: currentStep.id });
      return { canProceed: false, isComplete: false, newStep: currentStep };
    }

    this.currentStepIndex++;
    const tutorial = this.currentTutorial;

    if (tutorial && this.currentStepIndex >= tutorial.steps.length) {
      return { canProceed: true, isComplete: true, newStep: null };
    }

    const newStep = this.getCurrentStep();
    if (tutorial && newStep) {
      this.data.progress[tutorial.id].currentStepId = newStep.id;
      this.data.progress[tutorial.id].currentStepIndex = this.currentStepIndex;
      this.save();
    }

    this.emit('step-changed', newStep);

    return { canProceed: true, isComplete: false, newStep };
  }

  static previousStep(): TutorialStep | null {
    if (this.currentStepIndex <= 0) return null;

    this.currentStepIndex--;
    const newStep = this.getCurrentStep();
    const tutorial = this.currentTutorial;

    if (tutorial && newStep) {
      this.data.progress[tutorial.id].currentStepId = newStep.id;
      this.data.progress[tutorial.id].currentStepIndex = this.currentStepIndex;
      this.save();
    }

    this.emit('step-changed', newStep);
    return newStep;
  }

  static goToStep(stepId: string): TutorialStep | null {
    const tutorial = this.currentTutorial;
    if (!tutorial) return null;

    const stepIndex = tutorial.steps.findIndex(s => s.id === stepId);
    if (stepIndex < 0) return null;

    this.currentStepIndex = stepIndex;
    const newStep = this.getCurrentStep();

    if (newStep) {
      this.data.progress[tutorial.id].currentStepId = newStep.id;
      this.data.progress[tutorial.id].currentStepIndex = this.currentStepIndex;
      this.save();
    }

    this.emit('step-changed', newStep);
    return newStep;
  }

  static completeTutorial(): TutorialCompletionResult {
    const tutorial = this.currentTutorial;
    if (!tutorial) {
      return { newlyCompleted: false, rewards: [] };
    }

    const isNewlyCompleted = !this.data.completedTutorials.includes(tutorial.id);

    if (isNewlyCompleted) {
      this.data.completedTutorials.push(tutorial.id);
      this.data.progress[tutorial.id].completed = true;
      this.data.progress[tutorial.id].completedAt = Date.now();

      if (tutorial.isTeachingLevel) {
        this.data.teachingLevelCompleted = true;
        this.data.firstTimePlayer = false;
      }
    }

    this.save();

    const rewards = this.claimTutorialRewards(tutorial.id);

    let achievementResult: AchievementUnlockResult | undefined;
    if (isNewlyCompleted && tutorial.isTeachingLevel) {
      achievementResult = AchievementManager.onTutorialComplete();
      if (achievementResult.scoreGained > 0) {
        SaveManager.addScore(achievementResult.scoreGained);
      }
    }

    this.emit('tutorial-completed', {
      tutorialId: tutorial.id,
      newlyCompleted: isNewlyCompleted,
      rewards
    });

    return {
      newlyCompleted: isNewlyCompleted,
      rewards,
      unlockedLevelId: tutorial.isTeachingLevel ? 1 : undefined,
      achievementResult
    };
  }

  private static claimTutorialRewards(tutorialId: string): Reward[] {
    const tutorial = getTutorialById(tutorialId);
    if (!tutorial) return [];

    if (this.data.rewardsClaimed[tutorialId]) {
      return [];
    }

    const rewards: Reward[] = [];

    tutorial.rewards.forEach(reward => {
      rewards.push(reward);

      switch (reward.type) {
        case 'score':
          if (reward.value) {
            SaveManager.addScore(reward.value);
          }
          break;
        case 'badge':
          SaveManager.grantBadge(reward.id);
          break;
        case 'specimen':
          if (reward.id) {
            SaveManager.unlockGalleryItem(reward.id);
          }
          break;
      }
    });

    this.data.rewardsClaimed[tutorialId] = true;
    this.save();

    return rewards;
  }

  static canClaimRewards(tutorialId: string): boolean {
    const tutorial = getTutorialById(tutorialId);
    if (!tutorial) return false;
    return this.isTutorialCompleted(tutorialId) && !this.data.rewardsClaimed[tutorialId];
  }

  static skipTutorial(): void {
    if (this.currentTutorial) {
      this.data.firstTimePlayer = false;
      this.data.teachingLevelCompleted = true;
      if (!this.data.completedTutorials.includes(this.currentTutorial.id)) {
        this.data.completedTutorials.push(this.currentTutorial.id);
        this.data.progress[this.currentTutorial.id].completed = true;
        this.data.progress[this.currentTutorial.id].completedAt = Date.now();
      }
      this.save();
      this.emit('tutorial-skipped', { tutorialId: this.currentTutorial.id });
    }
    this.currentTutorial = null;
    this.currentStepIndex = 0;
  }

  static resetTutorial(tutorialId: string): void {
    if (this.data.progress[tutorialId]) {
      delete this.data.progress[tutorialId];
    }
    const idx = this.data.completedTutorials.indexOf(tutorialId);
    if (idx >= 0) {
      this.data.completedTutorials.splice(idx, 1);
    }
    delete this.data.rewardsClaimed[tutorialId];

    if (tutorialId === 'beginner-tutorial') {
      this.data.teachingLevelCompleted = false;
    }

    this.save();
  }

  static resetAll(): void {
    this.data = this.createDefaultTutorialSave();
    this.currentTutorial = null;
    this.currentStepIndex = 0;
    this.stepValidationState = {};
    this.customValidationState = {};
    this.save();
  }

  static shouldShowLevelTutorial(levelId: number): boolean {
    return shouldShowTutorial(levelId, this.data.teachingLevelCompleted);
  }

  static getTutorialProgress(tutorialId: string): TutorialProgress | undefined {
    return this.data.progress[tutorialId];
  }

  static getSaveData(): TutorialSaveData {
    return { ...this.data, progress: { ...this.data.progress } };
  }

  static on(event: string, callback: (event: string, data?: any) => void): void {
    this.listeners.push(callback);
  }

  static off(callback: (event: string, data?: any) => void): void {
    const idx = this.listeners.indexOf(callback);
    if (idx >= 0) {
      this.listeners.splice(idx, 1);
    }
  }

  private static emit(event: string, data?: any): void {
    this.listeners.forEach(cb => {
      try {
        cb(event, data);
      } catch (e) {
        console.error('TutorialManager listener error:', e);
      }
    });
  }

  private static save(): void {
    SaveManager.updateTutorialData(this.data);
  }

  static getCompletedCount(): number {
    return this.data.completedTutorials.length;
  }
}
