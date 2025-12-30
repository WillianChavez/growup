import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import type { Goal, GoalStats, Milestone, GoalCategory } from '@/types/goal.types';
import { getYearRange, getMonthRange } from '@/lib/date-utils';

export class GoalService {
  static async create(
    userId: string,
    data: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'completedAt'>
  ): Promise<Goal> {
    return prisma.goal.create({
      data: {
        ...data,
        userId,
        milestones: data.milestones ? JSON.stringify(data.milestones) : null,
      },
    }) as Promise<Goal>;
  }

  static async findById(id: string, userId: string): Promise<Goal | null> {
    const goal = await prisma.goal.findFirst({
      where: { id, userId },
    });

    if (!goal) return null;

    let milestones = goal.milestones ? JSON.parse(goal.milestones) : null;
    // Asegurar que todos los milestones tengan IDs
    if (milestones && Array.isArray(milestones)) {
      milestones = milestones.map((m: Milestone) => ({
        ...m,
        id: m.id || crypto.randomUUID(),
      }));
    }

    return {
      ...goal,
      milestones,
    } as Goal;
  }

  static async findAllByUser(userId: string, status?: string): Promise<Goal[]> {
    const where: Prisma.GoalWhereInput = { userId };

    if (status) {
      where.status = status;
    }

    const goals = await prisma.goal.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    return goals.map((goal) => {
      let milestones = goal.milestones ? JSON.parse(goal.milestones) : null;
      // Asegurar que todos los milestones tengan IDs
      if (milestones && Array.isArray(milestones)) {
        milestones = milestones.map((m: Milestone) => ({
          ...m,
          id: m.id || crypto.randomUUID(),
        }));
      }
      return {
        ...goal,
        milestones,
      };
    }) as Goal[];
  }

  static async update(
    id: string,
    userId: string,
    data: Partial<Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<Goal | null> {
    const goal = await prisma.goal.findFirst({
      where: { id, userId },
    });

    if (!goal) return null;

    // If completing the goal, set completedAt
    const isCompleting = data.status === 'completed' && goal.status !== 'completed';

    // Asegurar que todos los milestones tengan IDs únicos
    let milestonesToSave = data.milestones;
    if (milestonesToSave) {
      milestonesToSave = milestonesToSave.map((m) => ({
        ...m,
        id: m.id || crypto.randomUUID(),
      }));
    }

    const updated = await prisma.goal.update({
      where: { id },
      data: {
        ...data,
        milestones: milestonesToSave ? JSON.stringify(milestonesToSave) : undefined,
        completedAt: isCompleting ? new Date() : data.completedAt,
      },
    });

    return {
      ...updated,
      milestones: updated.milestones ? JSON.parse(updated.milestones) : null,
    } as Goal;
  }

  static async updateProgress(id: string, userId: string, progress: number): Promise<Goal | null> {
    const goal = await prisma.goal.findFirst({
      where: { id, userId },
    });

    if (!goal) return null;

    const updated = await prisma.goal.update({
      where: { id },
      data: {
        progress,
        status: progress >= 100 ? 'completed' : progress > 0 ? 'in-progress' : goal.status,
        completedAt: progress >= 100 ? new Date() : null,
      },
    });

    return {
      ...updated,
      milestones: updated.milestones ? JSON.parse(updated.milestones) : null,
    } as Goal;
  }

  static async completeMilestone(
    id: string,
    userId: string,
    milestoneId: string
  ): Promise<Goal | null> {
    const goal = await this.findById(id, userId);
    if (!goal || !goal.milestones) return null;

    const updatedMilestones = goal.milestones.map((m: Milestone) =>
      m.id === milestoneId ? { ...m, completed: true, completedAt: new Date() } : m
    );

    const completedCount = updatedMilestones.filter((m: Milestone) => m.completed).length;
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

  // Statistics
  static async getStats(userId: string): Promise<GoalStats> {
    const allGoals = await prisma.goal.findMany({
      where: { userId },
    });

    const yearRange = getYearRange();
    const monthRange = getMonthRange();

    const completed = allGoals.filter((g) => g.status === 'completed');
    const inProgress = allGoals.filter((g) => g.status === 'in-progress');
    const notStarted = allGoals.filter((g) => g.status === 'not-started');

    const completedThisYear = completed.filter(
      (g) => g.completedAt && g.completedAt >= yearRange.start && g.completedAt <= yearRange.end
    );

    const completedThisMonth = completed.filter(
      (g) => g.completedAt && g.completedAt >= monthRange.start && g.completedAt <= monthRange.end
    );

    const completionRate = allGoals.length > 0 ? (completed.length / allGoals.length) * 100 : 0;

    // By category
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
