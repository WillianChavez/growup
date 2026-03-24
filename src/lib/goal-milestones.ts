import { addDays, differenceInCalendarDays, endOfDay, max, startOfDay } from 'date-fns';
import type { GoalStatus, Milestone } from '@/types/goal.types';

interface NormalizeMilestonesOptions {
  goalStart: Date;
  goalEnd: Date;
  goalStatus?: GoalStatus;
  goalProgress?: number;
  referenceDate?: Date;
}

function toDate(value: Date | string | undefined | null): Date | undefined {
  if (!value) return undefined;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function normalizeDateRange(start: Date, end: Date): { start: Date; end: Date } {
  if (end < start) {
    return {
      start,
      end: start,
    };
  }

  return { start, end };
}

export function parseGoalMilestones(raw: string | null): Milestone[] | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Milestone[];
    if (!Array.isArray(parsed)) return null;

    return parsed.map((milestone) => ({
      ...milestone,
      startDate: toDate(milestone.startDate),
      targetDate: toDate(milestone.targetDate),
      completedAt: toDate(milestone.completedAt),
    }));
  } catch {
    return null;
  }
}

export function serializeGoalMilestones(milestones: Milestone[] | null | undefined): string | null {
  if (!milestones || milestones.length === 0) return null;
  return JSON.stringify(milestones);
}

export function normalizeGoalStatusFromMilestones(
  currentStatus: GoalStatus,
  progress: number,
  milestones: Milestone[]
): GoalStatus {
  if (currentStatus === 'abandoned') return 'abandoned';
  if (
    progress >= 100 ||
    (milestones.length > 0 && milestones.every((milestone) => milestone.completed))
  ) {
    return 'completed';
  }
  if (
    progress > 0 ||
    milestones.some((milestone) => milestone.completed) ||
    currentStatus === 'in-progress'
  ) {
    return 'in-progress';
  }
  return 'not-started';
}

export function normalizeGoalMilestones(
  milestones: Milestone[] | null | undefined,
  options: NormalizeMilestonesOptions
): Milestone[] {
  if (!milestones || milestones.length === 0) return [];

  const goalStart = startOfDay(options.goalStart);
  const goalEnd = endOfDay(options.goalEnd);
  const referenceDate = startOfDay(options.referenceDate ?? new Date());

  const prepared = milestones.map((milestone) => ({
    ...milestone,
    startDate: toDate(milestone.startDate),
    targetDate: toDate(milestone.targetDate),
    completedAt: toDate(milestone.completedAt),
  }));

  const completedMilestones = prepared.filter((milestone) => milestone.completed);
  const incompleteMilestones = prepared.filter((milestone) => !milestone.completed);
  const goalIsInProgress =
    (options.goalProgress ?? 0) > 0 ||
    completedMilestones.length > 0 ||
    options.goalStatus === 'in-progress' ||
    options.goalStatus === 'completed';

  const totalDays = Math.max(differenceInCalendarDays(goalEnd, goalStart) + 1, prepared.length * 7);
  const segmentDays = Math.max(Math.floor(totalDays / prepared.length), 7);

  const normalizedCompleted = completedMilestones.map((milestone, index) => {
    const completedAt =
      milestone.completedAt ??
      endOfDay(addDays(goalStart, Math.min(index * segmentDays + segmentDays - 1, totalDays - 1)));
    const defaultStart = startOfDay(
      addDays(completedAt, -Math.max(Math.floor(segmentDays * 0.6), 2))
    );
    const start = milestone.startDate ?? max([goalStart, defaultStart]);
    const end = milestone.targetDate ?? completedAt;
    const normalized = normalizeDateRange(startOfDay(start), endOfDay(end));

    return {
      ...milestone,
      completed: true,
      status: 'completed' as const,
      startDate: normalized.start,
      targetDate: completedAt,
      completedAt,
    };
  });

  const lastCompletedDate =
    normalizedCompleted.length > 0
      ? normalizedCompleted
          .map((milestone) => milestone.completedAt ?? milestone.targetDate ?? goalStart)
          .sort((a, b) => a.getTime() - b.getTime())
          .at(-1)
      : undefined;

  const remainingStartBase = max([
    lastCompletedDate ? addDays(startOfDay(lastCompletedDate), 1) : goalStart,
    goalIsInProgress ? referenceDate : goalStart,
    goalStart,
  ]);

  const remainingDays = Math.max(
    differenceInCalendarDays(goalEnd, remainingStartBase) + 1,
    incompleteMilestones.length * 7
  );
  const remainingSegmentDays =
    incompleteMilestones.length > 0
      ? Math.max(Math.floor(remainingDays / incompleteMilestones.length), 7)
      : 7;

  const normalizedIncomplete = incompleteMilestones.map((milestone, index) => {
    const plannedStart = startOfDay(addDays(remainingStartBase, index * remainingSegmentDays));
    const plannedEnd =
      index === incompleteMilestones.length - 1
        ? goalEnd
        : endOfDay(addDays(remainingStartBase, (index + 1) * remainingSegmentDays - 1));

    const start = milestone.startDate ?? plannedStart;
    const end = milestone.targetDate ?? plannedEnd;
    const normalized = normalizeDateRange(startOfDay(start), endOfDay(end));

    return {
      ...milestone,
      completed: false,
      status: goalIsInProgress && index === 0 ? ('in-progress' as const) : ('not-started' as const),
      startDate: normalized.start,
      targetDate: normalized.end,
      completedAt: undefined,
    };
  });

  const byId = new Map<string, Milestone>();
  [...normalizedCompleted, ...normalizedIncomplete].forEach((milestone) => {
    byId.set(milestone.id, milestone);
  });

  return prepared.map((milestone) => byId.get(milestone.id) || milestone);
}
