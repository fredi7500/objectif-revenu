export type FeedbackVariant = 'success' | 'progress' | 'warning' | 'milestone';

export type FeedbackState = {
  title: string;
  subtitle?: string;
  meta?: string;
  variant: FeedbackVariant;
  milestoneReached?: number | null;
  isGoalReached?: boolean;
};

export type PaymentFeedbackInput = {
  addedAmount: number;
  previousCollected: number;
  currentCollected: number;
  targetAmount: number;
  remainingAmount: number;
  daysRemaining: number;
  now?: Date;
  targetDate?: string;
};

const MILESTONES = [25, 50, 75, 100] as const;

function formatCurrency(value: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function roundPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function safeProgress(collected: number, target: number) {
  if (!Number.isFinite(target) || target <= 0) return 0;
  return Math.max(0, Math.min(100, (collected / target) * 100));
}

function getCrossedMilestone(previousProgress: number, currentProgress: number) {
  return [...MILESTONES]
    .reverse()
    .find((milestone) => previousProgress < milestone && currentProgress >= milestone) ?? null;
}

function getPaceReferenceDate(now: Date, targetDate?: string) {
  if (targetDate) {
    const parsed = new Date(targetDate);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return new Date(now.getFullYear(), now.getMonth() + 1, 0);
}

function getExpectedProgress(now: Date, targetDate?: string) {
  const referenceDate = getPaceReferenceDate(now, targetDate);
  const startDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endDate = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );

  const totalDays = Math.max(
    1,
    Math.floor((endDate.getTime() - startDate.getTime()) / 86_400_000) + 1
  );
  const elapsedDays = Math.max(
    0,
    Math.min(totalDays, Math.floor((currentDate.getTime() - startDate.getTime()) / 86_400_000) + 1)
  );

  return (elapsedDays / totalDays) * 100;
}

function buildRemainingMeta(progress: number, remainingAmount: number) {
  return `Tu es a ${roundPercent(progress)} % de ton objectif • Encore ${formatCurrency(remainingAmount)} a encaisser`;
}

function buildGoalReachedFeedback(
  addedAmount: number,
  progress: number,
  remainingAmount: number
): FeedbackState {
  return {
    title: `+${formatCurrency(addedAmount)} ajoute`,
    subtitle: 'Objectif atteint.',
    meta:
      remainingAmount > 0
        ? buildRemainingMeta(progress, remainingAmount)
        : 'Ton revenu cible est couvert. Tu peux te verser ton revenu cible ce mois-ci.',
    variant: 'success',
    milestoneReached: 100,
    isGoalReached: true,
  };
}

function buildMilestoneMessage(milestone: number) {
  if (milestone === 25) return 'Cap des 25 % franchi.';
  if (milestone === 50) return 'Cap des 50 % franchi.';
  if (milestone === 75) return 'Tu approches de la ligne d arrivee.';
  return 'Objectif atteint.';
}

function buildPaceFeedback(
  addedAmount: number,
  progress: number,
  remainingAmount: number,
  daysRemaining: number,
  targetDate?: string,
  now = new Date()
): FeedbackState | null {
  if (daysRemaining <= 0) return null;

  const expectedProgress = getExpectedProgress(now, targetDate);
  const delta = progress - expectedProgress;
  const dailyNeeded = remainingAmount > 0 ? remainingAmount / daysRemaining : 0;

  if (delta >= 10) {
    return {
      title: `+${formatCurrency(addedAmount)} ajoute`,
      subtitle: 'Tu es en avance sur ton objectif.',
      meta: `Tu es a ${roundPercent(progress)} % de ton objectif • Encore ${formatCurrency(
        remainingAmount
      )} a encaisser`,
      variant: 'progress',
      milestoneReached: null,
      isGoalReached: false,
    };
  }

  if (delta >= -8) {
    return {
      title: `+${formatCurrency(addedAmount)} ajoute`,
      subtitle: 'Tu tiens le bon rythme.',
      meta:
        remainingAmount > 0
          ? `Encore ${formatCurrency(remainingAmount)} • Environ ${formatCurrency(dailyNeeded)}/jour pour y arriver`
          : `Tu es a ${roundPercent(progress)} % de ton objectif`,
      variant: 'progress',
      milestoneReached: null,
      isGoalReached: false,
    };
  }

  return {
    title: `+${formatCurrency(addedAmount)} ajoute`,
    subtitle: 'Tu es un peu en dessous du rythme.',
    meta: `Encore ${formatCurrency(remainingAmount)} • Environ ${formatCurrency(dailyNeeded)}/jour pour y arriver`,
    variant: 'warning',
    milestoneReached: null,
    isGoalReached: false,
  };
}

export function createPaymentFeedback({
  addedAmount,
  previousCollected,
  currentCollected,
  targetAmount,
  remainingAmount,
  daysRemaining,
  now = new Date(),
  targetDate,
}: PaymentFeedbackInput): FeedbackState {
  const previousProgress = safeProgress(previousCollected, targetAmount);
  const currentProgress = safeProgress(currentCollected, targetAmount);
  const isGoalReached = targetAmount > 0 && currentCollected >= targetAmount;
  const crossedMilestone = getCrossedMilestone(previousProgress, currentProgress);

  if (isGoalReached) {
    return buildGoalReachedFeedback(addedAmount, currentProgress, remainingAmount);
  }

  if (crossedMilestone) {
    return {
      title: `+${formatCurrency(addedAmount)} ajoute`,
      subtitle: buildMilestoneMessage(crossedMilestone),
      meta: buildRemainingMeta(currentProgress, remainingAmount),
      variant: 'milestone',
      milestoneReached: crossedMilestone,
      isGoalReached: false,
    };
  }

  const paceFeedback = buildPaceFeedback(
    addedAmount,
    currentProgress,
    remainingAmount,
    daysRemaining,
    targetDate,
    now
  );

  if (paceFeedback) {
    return paceFeedback;
  }

  return {
    title: `+${formatCurrency(addedAmount)} ajoute`,
    subtitle: 'Tu avances dans le bon sens.',
    meta: buildRemainingMeta(currentProgress, remainingAmount),
    variant: 'progress',
    milestoneReached: null,
    isGoalReached: false,
  };
}
