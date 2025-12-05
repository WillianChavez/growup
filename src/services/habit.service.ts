import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import type {
  Habit,
  HabitEntry,
  HabitStats,
  DailyHabitView,
  MonthlyHabitData,
} from '@/types/habit.types';
import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
} from 'date-fns';

export class HabitService {
  static async create(
    userId: string,
    data: Omit<Habit, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isArchived' | 'category'>
  ): Promise<Habit> {
    return prisma.habit.create({
      data: {
        title: data.title,
        description: data.description,
        emoji: data.emoji,
        categoryId: data.categoryId,
        isActive: data.isActive,
        userId,
      },
      include: {
        category: true,
      },
    }) as Promise<Habit>;
  }

  static async findById(id: string, userId: string): Promise<Habit | null> {
    return prisma.habit.findFirst({
      where: { id, userId },
      include: {
        category: true,
      },
    }) as Promise<Habit | null>;
  }

  static async findAllByUser(userId: string, includeArchived: boolean = false): Promise<Habit[]> {
    const where: Prisma.HabitWhereInput = { userId };

    if (!includeArchived) {
      where.isArchived = false;
    }

    return prisma.habit.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    }) as Promise<Habit[]>;
  }

  static async update(
    id: string,
    userId: string,
    data: Partial<Omit<Habit, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'category'>>
  ): Promise<Habit | null> {
    const habit = await prisma.habit.findFirst({
      where: { id, userId },
    });

    if (!habit) return null;

    const updateData: Prisma.HabitUpdateInput = {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.emoji !== undefined && { emoji: data.emoji }),
      ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.isArchived !== undefined && { isArchived: data.isArchived }),
    };

    return prisma.habit.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
      },
    }) as Promise<Habit>;
  }

  static async delete(id: string, userId: string): Promise<boolean> {
    try {
      await prisma.habit.deleteMany({
        where: { id, userId },
      });
      return true;
    } catch {
      return false;
    }
  }

  // Entry management
  static async logEntry(
    habitId: string,
    userId: string,
    date: Date,
    completed: boolean,
    notes?: string
  ): Promise<HabitEntry> {
    // Normalizar la fecha al inicio del día en UTC para consistencia
    const normalizedDate = new Date(date);
    normalizedDate.setUTCHours(0, 0, 0, 0);

    const existing = await prisma.habitEntry.findFirst({
      where: {
        habitId,
        userId,
        date: normalizedDate,
      },
    });

    if (existing) {
      return prisma.habitEntry.update({
        where: { id: existing.id },
        data: {
          completed,
          notes,
          completedAt: completed ? new Date() : null,
        },
      }) as Promise<HabitEntry>;
    }

    return prisma.habitEntry.create({
      data: {
        habitId,
        userId,
        date: normalizedDate,
        completed,
        notes,
        completedAt: completed ? new Date() : null,
      },
    }) as Promise<HabitEntry>;
  }

  static async getEntries(
    habitId: string,
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<HabitEntry[]> {
    const where: Prisma.HabitEntryWhereInput = { habitId, userId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startOfDay(startDate);
      if (endDate) where.date.lte = endOfDay(endDate);
    }

    return prisma.habitEntry.findMany({
      where,
      orderBy: { date: 'desc' },
    }) as Promise<HabitEntry[]>;
  }

  // Daily view - todos los hábitos del día con su estado
  static async getDailyView(userId: string, date: Date): Promise<DailyHabitView> {
    // Normalizar la fecha al inicio del día en UTC
    const normalizedDate = new Date(date);
    normalizedDate.setUTCHours(0, 0, 0, 0);

    const habits = await this.findAllByUser(userId, false);

    // Buscar entradas exactamente para esta fecha normalizada
    const entries = await prisma.habitEntry.findMany({
      where: {
        userId,
        date: normalizedDate,
      },
    });

    const entryMap = new Map(entries.map((e) => [e.habitId, e]));

    // Calcular estadísticas semanales para cada hábito
    const weekStart = startOfWeek(normalizedDate, { weekStartsOn: 1 });
    // weekEnd se usa para calcular el rango de la semana
    endOfWeek(normalizedDate, { weekStartsOn: 1 });

    // Obtener todas las entradas de la semana
    const weeklyEntries = await prisma.habitEntry.findMany({
      where: {
        userId,
        date: {
          gte: weekStart,
          lte: normalizedDate, // Solo hasta el día actual
        },
      },
    });

    // Agrupar entradas por hábito
    const weeklyEntriesByHabit = new Map<string, HabitEntry[]>();
    weeklyEntries.forEach((entry) => {
      if (!weeklyEntriesByHabit.has(entry.habitId)) {
        weeklyEntriesByHabit.set(entry.habitId, []);
      }
      weeklyEntriesByHabit.get(entry.habitId)!.push(entry);
    });

    // Calcular cuántos días han pasado de la semana (incluyendo hoy)
    const daysSinceWeekStart =
      Math.floor((normalizedDate.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    return {
      date: normalizedDate,
      habits: habits.map((habit) => {
        const habitWeeklyEntries = weeklyEntriesByHabit.get(habit.id) || [];
        const weeklyCompleted = habitWeeklyEntries.filter((e) => e.completed).length;
        const weeklyTotal = daysSinceWeekStart;
        const weeklyPercentage = weeklyTotal > 0 ? (weeklyCompleted / weeklyTotal) * 100 : 0;

        return {
          habit,
          entry: entryMap.get(habit.id) || null,
          weeklyPercentage: Math.round(weeklyPercentage),
          weeklyCompleted,
          weeklyTotal,
        };
      }),
    };
  }

  // Monthly data para el calendario
  static async getMonthlyData(userId: string, date: Date): Promise<MonthlyHabitData[]> {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);

    const habits = await this.findAllByUser(userId, false);
    const habitIds = habits.map((h) => h.id);

    const entries = await prisma.habitEntry.findMany({
      where: {
        userId,
        habitId: { in: habitIds },
        date: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
    });

    // Agrupar por día usando fecha normalizada
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return days.map((day) => {
      // Normalizar el día para comparación
      const normalizedDay = new Date(day);
      normalizedDay.setUTCHours(0, 0, 0, 0);
      const normalizedDayTime = normalizedDay.getTime();

      const dayEntries = entries.filter((e) => {
        const entryDate = new Date(e.date);
        entryDate.setUTCHours(0, 0, 0, 0);
        return entryDate.getTime() === normalizedDayTime;
      });

      const habitDetails = habits.map((habit) => {
        const entry = dayEntries.find((e) => e.habitId === habit.id);
        return {
          habitId: habit.id,
          habitTitle: habit.title,
          completed: entry?.completed || false,
        };
      });

      return {
        date: normalizedDay,
        completedCount: dayEntries.filter((e) => e.completed).length,
        totalCount: habits.length,
        habits: habitDetails,
      };
    });
  }

  // Statistics
  static async getStats(habitId: string, userId: string): Promise<HabitStats> {
    const allEntries = await prisma.habitEntry.findMany({
      where: { habitId, userId },
      orderBy: { date: 'desc' },
    });

    const now = new Date();
    const weekStart = startOfWeek(now);
    const monthStart = startOfMonth(now);

    const completedEntries = allEntries.filter((e) => e.completed);

    const thisWeekEntries = allEntries.filter((e) => e.date >= weekStart && e.date <= now);
    const thisMonthEntries = allEntries.filter((e) => e.date >= monthStart && e.date <= now);

    // Calcular rachas
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const sortedEntries = [...allEntries].sort((a, b) => b.date.getTime() - a.date.getTime());

    for (let i = 0; i < sortedEntries.length; i++) {
      if (sortedEntries[i].completed) {
        tempStreak++;
        if (i === 0) currentStreak = tempStreak;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        if (i > 0) tempStreak = 0;
      }
    }

    return {
      totalEntries: allEntries.length,
      completedEntries: completedEntries.length,
      completionRate:
        allEntries.length > 0 ? (completedEntries.length / allEntries.length) * 100 : 0,
      currentStreak,
      longestStreak,
      thisWeek: {
        completed: thisWeekEntries.filter((e) => e.completed).length,
        total: thisWeekEntries.length,
      },
      thisMonth: {
        completed: thisMonthEntries.filter((e) => e.completed).length,
        total: thisMonthEntries.length,
      },
    };
  }
}
