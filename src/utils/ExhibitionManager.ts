import {
  ExhibitionTheme,
  ExhibitionProgress,
  ExhibitionSpecimenSubmission,
  ExhibitionBadge,
  ExhibitionResultData
} from '../types/GameTypes';
import { SaveManager } from './SaveManager';
import {
  getExhibitionTheme,
  getAllExhibitionThemes,
  getExhibitionBadge,
  getBadgesByThemeId,
  ExhibitionScoreConfig
} from '../data/ExhibitionConfig';
import { getPlantSpecimen } from '../data/PlantSpecimens';

export class ExhibitionManager {
  static canAccessTheme(themeId: string): { allowed: boolean; reason: string; current: number; required: number } {
    const theme = getExhibitionTheme(themeId);
    if (!theme) {
      return { allowed: false, reason: '展览不存在', current: 0, required: 0 };
    }

    const totalStars = SaveManager.getTotalStars();
    if (totalStars < theme.requiredStars) {
      return {
        allowed: false,
        reason: `需要 ${theme.requiredStars} 颗星星解锁`,
        current: totalStars,
        required: theme.requiredStars
      };
    }

    return { allowed: true, reason: '', current: totalStars, required: theme.requiredStars };
  }

  static getAvailableThemes(): ExhibitionTheme[] {
    return getAllExhibitionThemes().filter(theme => this.canAccessTheme(theme.id).allowed);
  }

  static getLockedThemes(): ExhibitionTheme[] {
    return getAllExhibitionThemes().filter(theme => !this.canAccessTheme(theme.id).allowed);
  }

  static calculateCompletionScore(themeId: string): number {
    const theme = getExhibitionTheme(themeId);
    if (!theme) return 0;

    const submitted = SaveManager.getSubmittedSpecimens(themeId);
    const totalRequired = theme.requiredSpecimenIds.length;

    if (totalRequired === 0) return 0;

    const ratio = submitted.length / totalRequired;
    return Math.floor(ratio * ExhibitionScoreConfig.completionBaseScore);
  }

  static calculateSpeedScore(themeId: string): number {
    const theme = getExhibitionTheme(themeId);
    if (!theme) return 0;

    const submissions: ExhibitionSpecimenSubmission[] = [];
    for (const specimenId of theme.requiredSpecimenIds) {
      const sub = SaveManager.getExhibitionSpecimenSubmission(themeId, specimenId);
      if (sub && sub.bestTime > 0) {
        submissions.push(sub);
      }
    }

    if (submissions.length === 0) return 0;

    let totalSpeedRatio = 0;
    for (const sub of submissions) {
      const time = sub.bestTime;
      if (time <= ExhibitionScoreConfig.perfectTimeThreshold) {
        totalSpeedRatio += 1;
      } else if (time >= ExhibitionScoreConfig.maxTime) {
        totalSpeedRatio += 0.1;
      } else {
        const range = ExhibitionScoreConfig.maxTime - ExhibitionScoreConfig.perfectTimeThreshold;
        const progress = (time - ExhibitionScoreConfig.perfectTimeThreshold) / range;
        totalSpeedRatio += 1 - (progress * 0.9);
      }
    }

    const avgSpeedRatio = totalSpeedRatio / submissions.length;
    return Math.floor(avgSpeedRatio * ExhibitionScoreConfig.speedBaseScore);
  }

  static calculateStarScore(themeId: string): number {
    const theme = getExhibitionTheme(themeId);
    if (!theme) return 0;

    let totalStars = 0;
    let maxPossibleStars = 0;

    for (const specimenId of theme.requiredSpecimenIds) {
      const sub = SaveManager.getExhibitionSpecimenSubmission(themeId, specimenId);
      if (sub) {
        totalStars += sub.stars;
      }
      maxPossibleStars += 3;
    }

    if (maxPossibleStars === 0) return 0;

    const ratio = totalStars / maxPossibleStars;
    return Math.floor(ratio * ExhibitionScoreConfig.starBaseScore);
  }

  static calculateTotalScore(themeId: string): {
    completionScore: number;
    speedScore: number;
    starScore: number;
    totalScore: number;
  } {
    const completionScore = this.calculateCompletionScore(themeId);
    const speedScore = this.calculateSpeedScore(themeId);
    const starScore = this.calculateStarScore(themeId);
    const totalScore = completionScore + speedScore + starScore;

    return { completionScore, speedScore, starScore, totalScore };
  }

  static checkBadgeUnlocks(themeId: string): ExhibitionBadge[] {
    const themeProgress = SaveManager.getExhibitionThemeProgress(themeId);
    if (!themeProgress) return [];

    const scores = this.calculateTotalScore(themeId);
    const badges = getBadgesByThemeId(themeId);
    const newlyUnlocked: ExhibitionBadge[] = [];

    for (const badge of badges) {
      if (!themeProgress.badgesUnlocked.includes(badge.id) && scores.totalScore >= badge.requiredScore) {
        newlyUnlocked.push(badge);
      }
    }

    return newlyUnlocked;
  }

  static submitAllEligibleSpecimens(themeId: string): {
    submitted: number[];
    alreadySubmitted: number[];
    notEligible: number[];
  } {
    const theme = getExhibitionTheme(themeId);
    if (!theme) {
      return { submitted: [], alreadySubmitted: [], notEligible: [] };
    }

    const submitted: number[] = [];
    const alreadySubmitted: number[] = [];
    const notEligible: number[] = [];

    for (const specimenId of theme.requiredSpecimenIds) {
      if (SaveManager.isSpecimenSubmitted(themeId, specimenId)) {
        alreadySubmitted.push(specimenId);
      } else if (SaveManager.canSubmitToExhibition(themeId, specimenId)) {
        const result = SaveManager.submitSpecimenToExhibition(themeId, specimenId);
        if (result.success) {
          submitted.push(specimenId);
        } else {
          notEligible.push(specimenId);
        }
      } else {
        notEligible.push(specimenId);
      }
    }

    return { submitted, alreadySubmitted, notEligible };
  }

  static finalizeExhibition(themeId: string): ExhibitionResultData {
    const themeProgress = SaveManager.getExhibitionThemeProgress(themeId);
    const isFirstParticipation = !themeProgress?.participated;

    const scores = this.calculateTotalScore(themeId);
    const updateResult = SaveManager.updateExhibitionScores(themeId, scores);

    const newlyUnlockedBadges = this.checkBadgeUnlocks(themeId);
    for (const badge of newlyUnlockedBadges) {
      const themeProg = SaveManager.getExhibitionThemeProgress(themeId);
      if (themeProg && !themeProg.badgesUnlocked.includes(badge.id)) {
        themeProg.badgesUnlocked.push(badge.id);
      }
      SaveManager['data'].exhibition.badges[badge.id] = true;
      SaveManager['data'].badges[badge.id] = true;
    }

    const theme = getExhibitionTheme(themeId);
    const newRewards: any[] = [];
    if (theme) {
      for (const reward of theme.rewards) {
        if (SaveManager.canClaimExhibitionReward(themeId, reward.id)) {
          newRewards.push(reward);
        }
      }
    }

    SaveManager.save();

    const submittedSpecimens = SaveManager.getSubmittedSpecimens(themeId);

    return {
      themeId,
      submittedSpecimens,
      completionScore: scores.completionScore,
      speedScore: scores.speedScore,
      starScore: scores.starScore,
      totalScore: scores.totalScore,
      newlyUnlockedBadges,
      newRewards,
      isFirstParticipation,
      isNewHighScore: updateResult.isNewHighScore
    };
  }

  static getExhibitionProgressInfo(themeId: string): {
    theme: ExhibitionTheme | undefined;
    progress: ExhibitionProgress | undefined;
    scores: { completionScore: number; speedScore: number; starScore: number; totalScore: number };
    submittedCount: number;
    totalRequired: number;
    eligibleSpecimens: number[];
    missingSpecimens: number[];
    badges: { badge: ExhibitionBadge; unlocked: boolean }[];
    rewards: { reward: any; claimable: boolean; claimed: boolean }[];
  } {
    const theme = getExhibitionTheme(themeId);
    const progress = SaveManager.getExhibitionThemeProgress(themeId);
    const scores = this.calculateTotalScore(themeId);

    let submittedCount = 0;
    let totalRequired = 0;
    const eligibleSpecimens: number[] = [];
    const missingSpecimens: number[] = [];

    if (theme) {
      totalRequired = theme.requiredSpecimenIds.length;
      for (const specimenId of theme.requiredSpecimenIds) {
        const specimen = getPlantSpecimen(specimenId);
        if (SaveManager.isSpecimenSubmitted(themeId, specimenId)) {
          submittedCount++;
        } else if (SaveManager.canSubmitToExhibition(themeId, specimenId)) {
          eligibleSpecimens.push(specimenId);
        } else {
          missingSpecimens.push(specimenId);
        }
      }
    }

    const badges = getBadgesByThemeId(themeId).map(badge => ({
      badge,
      unlocked: SaveManager.hasExhibitionBadge(badge.id)
    }));

    const rewards = theme ? theme.rewards.map(reward => ({
      reward,
      claimable: SaveManager.canClaimExhibitionReward(themeId, reward.id),
      claimed: progress?.rewardsClaimed[reward.id] ?? false
    })) : [];

    return {
      theme,
      progress,
      scores,
      submittedCount,
      totalRequired,
      eligibleSpecimens,
      missingSpecimens,
      badges,
      rewards
    };
  }

  static getTotalBadgesUnlocked(): number {
    const saveData = SaveManager.getExhibitionSaveData();
    return Object.values(saveData.badges).filter(v => v).length;
  }

  static getTotalBadgesCount(): number {
    return getAllExhibitionThemes().reduce((sum, theme) => {
      return sum + getBadgesByThemeId(theme.id).length;
    }, 0);
  }
}
