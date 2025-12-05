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
  isSameDay,
} from 'date-fns';
import { getDayRangeInTimezone } from '@/lib/date-timezone';

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
  // El middleware de Prisma se encarga automáticamente de convertir fechas
  static async logEntry(
    habitId: string,
    userId: string,
    date: Date, // Date viene en la zona horaria del usuario
    completed: boolean,
    notes?: string
  ): Promise<HabitEntry> {
    // Usar la fecha tal cual (con la hora actual) cuando se marca el hábito
    // El middleware convertirá automáticamente a UTC al guardar
    // Para buscar entradas existentes del mismo día, usamos un rango del día
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    // Buscar entrada existente para este día
    // El middleware convertirá automáticamente las fechas en el where
    const existing = await prisma.habitEntry.findFirst({
      where: {
        habitId,
        userId,
        date: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
    });

    if (existing) {
      // El middleware convertirá completedAt automáticamente a UTC
      return prisma.habitEntry.update({
        where: { id: existing.id },
        data: {
          completed,
          notes,
          completedAt: completed ? new Date() : null,
        },
      }) as Promise<HabitEntry>;
    }

    // El middleware convertirá date automáticamente a UTC al guardar
    // Guardamos la fecha con la hora actual, no normalizada a 00:00
    return prisma.habitEntry.create({
      data: {
        habitId,
        userId,
        date: date, // Guardar con la hora actual, el middleware lo convertirá a UTC
        completed,
        notes,
        completedAt: completed ? new Date() : null, // El middleware lo convertirá a UTC
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
  // El middleware de Prisma se encarga automáticamente de convertir fechas
  static async getDailyView(userId: string, date: Date): Promise<DailyHabitView> {
    // Obtener la zona horaria del usuario
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    const timezone = user?.timezone || 'America/El_Salvador';

    // Obtener el rango del día en la zona horaria del usuario
    // El middleware convertirá automáticamente a UTC para buscar
    const { start: dayStart, end: dayEnd } = getDayRangeInTimezone(date, timezone);

    const habits = await this.findAllByUser(userId, false);

    // Buscar entradas - el middleware convertirá automáticamente:
    // - Las fechas en where de zona horaria del usuario a UTC para buscar
    // - Los resultados de UTC a zona horaria del usuario
    const entries = await prisma.habitEntry.findMany({
      where: {
        userId,
        date: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
    });

    const entryMap = new Map(entries.map((e) => [e.habitId, e]));

    // Calcular estadísticas semanales para cada hábito
    // La fecha ya está en la zona horaria del usuario (convertida por el middleware)
    // Calcular el inicio y fin de la semana (lunes 00:00 a domingo 23:59)
    const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Lunes
    const weekEnd = endOfWeek(date, { weekStartsOn: 1 }); // Domingo

    // Asegurar que el inicio de la semana sea lunes 00:00:00
    const weekStartNormalized = new Date(weekStart);
    weekStartNormalized.setHours(0, 0, 0, 0);

    // Asegurar que el fin de la semana sea domingo 23:59:59.999
    const weekEndNormalized = new Date(weekEnd);
    weekEndNormalized.setHours(23, 59, 59, 999);

    // El middleware convertirá automáticamente estas fechas de zona horaria del usuario a UTC
    const weeklyEntries = await prisma.habitEntry.findMany({
      where: {
        userId,
        date: {
          gte: weekStartNormalized,
          lte: weekEndNormalized,
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

    return {
      date: date, // La fecha ya está en la zona horaria del usuario
      habits: habits.map((habit) => {
        const habitWeeklyEntries = weeklyEntriesByHabit.get(habit.id) || [];
        const weeklyCompleted = habitWeeklyEntries.filter((e) => e.completed).length;
        const weeklyTotal = 7; // Siempre 7 días en una semana
        const weeklyPercentage = (weeklyCompleted / weeklyTotal) * 100;

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
    // `date` ya está en la zona horaria del usuario
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);

    const habits = await this.findAllByUser(userId, false);
    const habitIds = habits.map((h) => h.id);

    // El middleware convierte las fechas de UTC a la zona horaria del usuario
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
      // Usar isSameDay para comparar fechas correctamente (ya están en zona horaria del usuario)
      const dayEntries = entries.filter((e) => {
        return isSameDay(new Date(e.date), day);
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
        date: day, // Usar el día directamente (ya está en zona horaria del usuario)
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
