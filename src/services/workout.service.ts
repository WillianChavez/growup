import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';
import type {
  WorkoutSession,
  WorkoutFocus,
  WorkoutIntensity,
  WorkoutWeeklyStats,
} from '@/types/exercise.types';

const WEEKLY_TARGET = 5; // gimnasio 5 días por semana

interface CreateWorkoutData {
  date: Date;
  focus: WorkoutFocus;
  durationMin?: number | null;
  intensity?: WorkoutIntensity | null;
  notes?: string | null;
}

type UpdateWorkoutData = Partial<CreateWorkoutData>;

export class WorkoutService {
  static async create(userId: string, data: CreateWorkoutData): Promise<WorkoutSession> {
    return prisma.workoutSession.create({
      data: {
        userId,
        date: data.date,
        focus: data.focus,
        durationMin: data.durationMin ?? null,
        intensity: data.intensity ?? null,
        notes: data.notes ?? null,
      },
    }) as Promise<WorkoutSession>;
  }

  static async findAllByUser(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<WorkoutSession[]> {
    const where: Prisma.WorkoutSessionWhereInput = { userId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startOfDay(startDate);
      if (endDate) where.date.lte = endOfDay(endDate);
    }

    return prisma.workoutSession.findMany({
      where,
      orderBy: { date: 'desc' },
    }) as Promise<WorkoutSession[]>;
  }

  static async findById(id: string, userId: string): Promise<WorkoutSession | null> {
    return prisma.workoutSession.findFirst({
      where: { id, userId },
    }) as Promise<WorkoutSession | null>;
  }

  static async update(
    id: string,
    userId: string,
    data: UpdateWorkoutData
  ): Promise<WorkoutSession | null> {
    const existing = await prisma.workoutSession.findFirst({ where: { id, userId } });
    if (!existing) return null;

    const updateData: Prisma.WorkoutSessionUpdateInput = {
      ...(data.date !== undefined && { date: data.date }),
      ...(data.focus !== undefined && { focus: data.focus }),
      ...(data.durationMin !== undefined && { durationMin: data.durationMin }),
      ...(data.intensity !== undefined && { intensity: data.intensity }),
      ...(data.notes !== undefined && { notes: data.notes }),
    };

    return prisma.workoutSession.update({
      where: { id },
      data: updateData,
    }) as Promise<WorkoutSession>;
  }

  static async delete(id: string, userId: string): Promise<boolean> {
    try {
      await prisma.workoutSession.deleteMany({ where: { id, userId } });
      return true;
    } catch {
      return false;
    }
  }

  /** Estadísticas de la semana (lunes–domingo) que contiene `referenceDate`. */
  static async getWeeklyStats(
    userId: string,
    referenceDate: Date = new Date()
  ): Promise<WorkoutWeeklyStats> {
    const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(referenceDate, { weekStartsOn: 1 });

    const sessions = await prisma.workoutSession.findMany({
      where: { userId, date: { gte: weekStart, lte: weekEnd } },
    });

    const totalMinutes = sessions.reduce((sum, s) => sum + (s.durationMin ?? 0), 0);

    const focusCounts = new Map<WorkoutFocus, number>();
    sessions.forEach((s) => {
      const focus = s.focus as WorkoutFocus;
      focusCounts.set(focus, (focusCounts.get(focus) ?? 0) + 1);
    });

    return {
      weekStart,
      weekEnd,
      sessionCount: sessions.length,
      targetPerWeek: WEEKLY_TARGET,
      totalMinutes,
      byFocus: Array.from(focusCounts.entries()).map(([focus, count]) => ({ focus, count })),
    };
  }
}
