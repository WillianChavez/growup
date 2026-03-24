import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import type { Goal, GoalStats, Milestone, GoalCategory, GoalStatus } from '@/types/goal.types';
import { getYearRange, getMonthRange } from '@/lib/date-utils';
import { normalizeGoalMilestones, normalizeGoalStatusFromMilestones } from '@/lib/goal-milestones';

function mapMilestoneRecord(milestone: {
  id: string;
  title: string;
  completed: boolean;
  status: string;
  startDate: Date | null;
  targetDate: Date | null;
  completedAt: Date | null;
  order: number;
}): Milestone {
  return {
    id: milestone.id,
    title: milestone.title,
    completed: milestone.completed,
    status: milestone.status as Exclude<GoalStatus, 'abandoned'>,
    startDate: milestone.startDate ?? undefined,
    targetDate: milestone.targetDate ?? undefined,
    completedAt: milestone.completedAt ?? undefined,
  };
}

function mapGoalRecord(goal: {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  status: string;
  targetDate: Date | null;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  milestones: Array<{
    id: string;
    title: string;
    completed: boolean;
    status: string;
    startDate: Date | null;
    targetDate: Date | null;
    completedAt: Date | null;
    order: number;
  }>;
}): Goal {
  return {
    ...goal,
    category: goal.category as GoalCategory,
    priority: goal.priority as Goal['priority'],
    status: goal.status as GoalStatus,
    milestones: goal.milestones.map(mapMilestoneRecord),
  };
}

export class GoalService {
  static async create(
    userId: string,
    data: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'completedAt'>
  ): Promise<Goal> {
    const goalStart = new Date();
    const goalEnd = data.targetDate ?? getMonthRange().end;
    const normalizedMilestones = normalizeGoalMilestones(data.milestones, {
      goalStart,
      goalEnd,
      goalStatus: data.status as GoalStatus,
      goalProgress: data.progress,
      referenceDate: new Date(),
    });
    const normalizedProgress =
      normalizedMilestones.length > 0
        ? Math.round(
            (normalizedMilestones.filter((milestone) => milestone.completed).length /
              normalizedMilestones.length) *
              100
          )
        : data.progress;
    const normalizedStatus = normalizeGoalStatusFromMilestones(
      data.status as GoalStatus,
      normalizedProgress,
      normalizedMilestones
    );

    const created = await prisma.goal.create({
      data: {
        userId,
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority,
        status: normalizedStatus,
        targetDate: data.targetDate,
        progress: normalizedProgress,
        milestones: {
          create: normalizedMilestones.map((milestone, index) => ({
            id: milestone.id,
            title: milestone.title,
            completed: milestone.completed,
            status: milestone.status ?? (milestone.completed ? 'completed' : 'not-started'),
            startDate: milestone.startDate ?? null,
            targetDate: milestone.targetDate ?? null,
            completedAt: milestone.completedAt ?? null,
            order: index,
          })),
        },
      },
      include: {
        milestones: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return mapGoalRecord(created);
  }

  static async findById(id: string, userId: string): Promise<Goal | null> {
    const goal = await prisma.goal.findFirst({
      where: { id, userId },
      include: {
        milestones: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!goal) return null;

    return mapGoalRecord(goal);
  }

  static async findAllByUser(userId: string, status?: string): Promise<Goal[]> {
    const where: Prisma.GoalWhereInput = { userId };

    if (status) {
      where.status = status;
    }

    const goals = await prisma.goal.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      include: {
        milestones: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return goals.map(mapGoalRecord);
  }

  static async update(
    id: string,
    userId: string,
    data: Partial<Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<Goal | null> {
    const goal = await prisma.goal.findFirst({
      where: { id, userId },
      include: {
        milestones: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!goal) return null;

    const existingMilestones = goal.milestones.map(mapMilestoneRecord);
    const incomingMilestones = data.milestones
      ? data.milestones.map((milestone) => ({
          ...milestone,
          id: milestone.id || crypto.randomUUID(),
        }))
      : existingMilestones;

    const nextGoalEnd =
      data.targetDate !== undefined
        ? (data.targetDate ?? new Date(goal.updatedAt))
        : (goal.targetDate ?? new Date(goal.updatedAt));

    const normalizedMilestones = normalizeGoalMilestones(incomingMilestones, {
      goalStart: new Date(goal.createdAt),
      goalEnd: nextGoalEnd,
      goalStatus: (data.status as GoalStatus) ?? (goal.status as GoalStatus),
      goalProgress: data.progress ?? goal.progress,
      referenceDate: new Date(),
    });

    const normalizedProgress =
      normalizedMilestones.length > 0
        ? Math.round(
            (normalizedMilestones.filter((milestone) => milestone.completed).length /
              normalizedMilestones.length) *
              100
          )
        : (data.progress ?? goal.progress);

    const normalizedStatus = normalizeGoalStatusFromMilestones(
      (data.status as GoalStatus) ?? (goal.status as GoalStatus),
      normalizedProgress,
      normalizedMilestones
    );

    const updated = await prisma.$transaction(async (tx) => {
      if (data.milestones !== undefined) {
        await tx.goalMilestone.deleteMany({
          where: { goalId: id },
        });
      }

      const updatedGoal = await tx.goal.update({
        where: { id },
        data: {
          title: data.title,
          description: data.description,
          category: data.category,
          priority: data.priority,
          targetDate: data.targetDate,
          progress: normalizedProgress,
          status: normalizedStatus,
          completedAt:
            normalizedStatus === 'completed'
              ? (data.completedAt ?? goal.completedAt ?? new Date())
              : data.completedAt === null
                ? null
                : goal.completedAt,
        },
      });

      if (data.milestones !== undefined && normalizedMilestones.length > 0) {
        await tx.goalMilestone.createMany({
          data: normalizedMilestones.map((milestone, index) => ({
            id: milestone.id,
            goalId: id,
            title: milestone.title,
            completed: milestone.completed,
            status: milestone.status ?? (milestone.completed ? 'completed' : 'not-started'),
            startDate: milestone.startDate ?? null,
            targetDate: milestone.targetDate ?? null,
            completedAt: milestone.completedAt ?? null,
            order: index,
          })),
        });
      }

      return updatedGoal;
    });

    const reloaded = await prisma.goal.findUnique({
      where: { id: updated.id },
      include: {
        milestones: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return reloaded ? mapGoalRecord(reloaded) : null;
  }

  static async updateProgress(id: string, userId: string, progress: number): Promise<Goal | null> {
    const goal = await prisma.goal.findFirst({
      where: { id, userId },
      include: {
        milestones: { orderBy: { order: 'asc' } },
      },
    });

    if (!goal) return null;

    const updated = await prisma.goal.update({
      where: { id },
      data: {
        progress,
        status: progress >= 100 ? 'completed' : progress > 0 ? 'in-progress' : goal.status,
        completedAt: progress >= 100 ? new Date() : null,
      },
      include: {
        milestones: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return mapGoalRecord(updated);
  }

  static async completeMilestone(
    id: string,
    userId: string,
    milestoneId: string
  ): Promise<Goal | null> {
    const goal = await this.findById(id, userId);
    if (!goal || !goal.milestones) return null;

    const updatedMilestones = goal.milestones.map((milestone: Milestone) =>
      milestone.id === milestoneId
        ? {
            ...milestone,
            completed: true,
            status: 'completed' as const,
            completedAt: new Date(),
          }
        : milestone
    ) as Milestone[];

    const completedCount = updatedMilestones.filter((milestone) => milestone.completed).length;
    const totalCount = updatedMilestones.length;
    const newProgress = Math.round((completedCount / totalCount) * 100);

    return this.update(id, userId, {
      milestones: updatedMilestones,
      progress: newProgress,
    });
  }

  static async delete(id: string, userId: string): Promise<boolean> {
    try {
      await prisma.goal.deleteMany({
        where: { id, userId },
      });
      return true;
    } catch {
      return false;
    }
  }

  static async getStats(userId: string): Promise<GoalStats> {
    const allGoals = await prisma.goal.findMany({
      where: { userId },
    });

    const yearRange = getYearRange();
    const monthRange = getMonthRange();

    const completed = allGoals.filter((goal) => goal.status === 'completed');
    const inProgress = allGoals.filter((goal) => goal.status === 'in-progress');
    const notStarted = allGoals.filter((goal) => goal.status === 'not-started');

    const completedThisYear = completed.filter(
      (goal) =>
        goal.completedAt && goal.completedAt >= yearRange.start && goal.completedAt <= yearRange.end
    );

    const completedThisMonth = completed.filter(
      (goal) =>
        goal.completedAt &&
        goal.completedAt >= monthRange.start &&
        goal.completedAt <= monthRange.end
    );

    const completionRate = allGoals.length > 0 ? (completed.length / allGoals.length) * 100 : 0;

    const categoryMap: Record<string, number> = {};
    allGoals.forEach((goal) => {
      categoryMap[goal.category] = (categoryMap[goal.category] || 0) + 1;
    });

    const byCategory = Object.entries(categoryMap).map(([category, count]) => ({
      category: category as GoalCategory,
      count,
    }));

    return {
      total: allGoals.length,
      completed: completed.length,
      inProgress: inProgress.length,
      notStarted: notStarted.length,
      completionRate: Math.round(completionRate),
      completedThisYear: completedThisYear.length,
      completedThisMonth: completedThisMonth.length,
      byCategory,
    };
  }
}
