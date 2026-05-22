import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { startOfDay, endOfDay } from 'date-fns';
import { GoalService } from '@/services/goal.service';
import type { GoalStatus, Milestone } from '@/types/goal.types';
import type { BodyMetric, BodyMetricField, WeightGoalSync } from '@/types/exercise.types';

const MEASUREMENT_FIELDS: BodyMetricField[] = ['weight', 'waist', 'chest', 'hip', 'arm', 'thigh'];

interface BodyMetricData {
  weight?: number | null;
  waist?: number | null;
  chest?: number | null;
  hip?: number | null;
  arm?: number | null;
  thigh?: number | null;
  notes?: string | null;
}

function buildData(data: BodyMetricData): Record<string, number | string | null> {
  const out: Record<string, number | string | null> = {};
  for (const field of MEASUREMENT_FIELDS) {
    if (data[field] !== undefined) out[field] = data[field] ?? null;
  }
  if (data.notes !== undefined) out.notes = data.notes ?? null;
  return out;
}

export class BodyMetricService {
  /** Crea o actualiza la medición del día (una por día). */
  static async upsertForDate(
    userId: string,
    date: Date,
    data: BodyMetricData
  ): Promise<BodyMetric> {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    const existing = await prisma.bodyMetric.findFirst({
      where: { userId, date: { gte: dayStart, lte: dayEnd } },
    });

    if (existing) {
      return prisma.bodyMetric.update({
        where: { id: existing.id },
        data: buildData(data),
      }) as Promise<BodyMetric>;
    }

    return prisma.bodyMetric.create({
      data: { userId, date, ...buildData(data) },
    }) as Promise<BodyMetric>;
  }

  static async findAllByUser(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<BodyMetric[]> {
    const where: Prisma.BodyMetricWhereInput = { userId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startOfDay(startDate);
      if (endDate) where.date.lte = endOfDay(endDate);
    }

    return prisma.bodyMetric.findMany({
      where,
      orderBy: { date: 'desc' },
    }) as Promise<BodyMetric[]>;
  }

  static async findById(id: string, userId: string): Promise<BodyMetric | null> {
    return prisma.bodyMetric.findFirst({ where: { id, userId } }) as Promise<BodyMetric | null>;
  }

  static async update(
    id: string,
    userId: string,
    data: BodyMetricData & { date?: Date }
  ): Promise<BodyMetric | null> {
    const existing = await prisma.bodyMetric.findFirst({ where: { id, userId } });
    if (!existing) return null;

    return prisma.bodyMetric.update({
      where: { id },
      data: {
        ...buildData(data),
        ...(data.date !== undefined && { date: data.date }),
      },
    }) as Promise<BodyMetric>;
  }

  static async delete(id: string, userId: string): Promise<boolean> {
    try {
      await prisma.bodyMetric.deleteMany({ where: { id, userId } });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Avanza automáticamente los hitos de peso del objetivo de salud cuando se
   * registra un peso. Convención: los hitos de peso contienen "NNN lb" en el
   * título (ej. "Bajar a 195 lb"). Solo completa hitos, nunca los descompleta.
   */
  static async syncWeightGoal(userId: string, weightLb: number): Promise<WeightGoalSync | null> {
    const goal = await prisma.goal.findFirst({
      where: { userId, category: 'health', status: { notIn: ['completed', 'abandoned'] } },
      include: { milestones: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });

    if (!goal) return null;

    const weightRe = /(\d+(?:\.\d+)?)\s*lb/i;
    const justCompleted: string[] = [];

    const milestones: Milestone[] = goal.milestones.map((m) => {
      const match = m.title.match(weightRe);
      const target = match ? parseFloat(match[1]) : null;
      const shouldComplete = target !== null && !m.completed && weightLb <= target;
      if (shouldComplete) justCompleted.push(m.title);

      const completed = m.completed || shouldComplete;
      return {
        id: m.id,
        title: m.title,
        completed,
        status:
          (completed ? 'completed' : (m.status as Exclude<GoalStatus, 'abandoned'>)) ??
          'not-started',
        startDate: m.startDate ?? undefined,
        targetDate: m.targetDate ?? undefined,
        completedAt: shouldComplete ? new Date() : (m.completedAt ?? undefined),
      };
    });

    if (justCompleted.length === 0) {
      return { goalId: goal.id, changed: false, completedMilestones: [], progress: goal.progress };
    }

    const updated = await GoalService.update(goal.id, userId, { milestones });

    return {
      goalId: goal.id,
      changed: true,
      completedMilestones: justCompleted,
      progress: updated?.progress ?? goal.progress,
    };
  }
}
