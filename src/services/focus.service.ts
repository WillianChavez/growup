import { subDays, startOfDay, endOfDay, differenceInCalendarDays, format } from 'date-fns';
import { prisma } from '@/lib/db';
import { normalizeMoney, sumAsMoney } from '@/lib/money';
import { HabitService } from '@/services/habit.service';
import { BudgetService } from '@/services/budget.service';
import { getTimezoneConfig } from '@/lib/location-utils';
import { getNextHoliday } from '@/services/holiday.service';

export interface QuickAddResult {
  type: 'transaction' | 'habit' | 'goal';
  message: string;
}

export interface FocusAlert {
  id: string;
  type: 'budget' | 'habit' | 'goal' | 'expense_due' | 'holiday';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  actionLabel?: string;
  actionUrl?: string;
}

export interface WeeklyReview {
  finance: {
    income: number;
    expenses: number;
    balance: number;
    deltaBalance: number;
  };
  habits: {
    completionRate: number;
    previousCompletionRate: number;
    deltaCompletionRate: number;
  };
  goals: {
    completedThisWeek: number;
    completedPreviousWeek: number;
    deltaCompleted: number;
  };
  insights: string[];
}

function parseAmount(rawAmount: string): number | null {
  const normalized = rawAmount.replace(',', '.');
  const amount = Number.parseFloat(normalized);
  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return normalizeMoney(amount);
}

function extractQuickAddIntent(input: string): {
  intent: 'expense' | 'income' | 'habit' | 'goal';
  amount?: number;
  description: string;
} | null {
  const trimmed = input.trim();

  const transactionMatch = trimmed.match(
    /^\+?\s*(gasto|expense|ingreso|income)\s+([0-9]+(?:[.,][0-9]{1,2})?)\s+(.+)$/i
  );

  if (transactionMatch) {
    const [, type, amountText, description] = transactionMatch;
    const amount = parseAmount(amountText);
    if (!amount) return null;

    return {
      intent: /ingreso|income/i.test(type) ? 'income' : 'expense',
      amount,
      description: description.trim(),
    };
  }

  const habitMatch = trimmed.match(/^\+?\s*(h[aá]bito|habit)\s+(.+)$/i);
  if (habitMatch) {
    return {
      intent: 'habit',
      description: habitMatch[2].trim(),
    };
  }

  const goalMatch = trimmed.match(/^\+?\s*(meta|goal)\s+(.+)$/i);
  if (goalMatch) {
    return {
      intent: 'goal',
      description: goalMatch[2].trim(),
    };
  }

  return null;
}

export class FocusService {
  static async quickAdd(userId: string, input: string): Promise<QuickAddResult> {
    const intent = extractQuickAddIntent(input);

    if (!intent) {
      throw new Error(
        'Formato no reconocido. Usa: "gasto 12 cafe", "ingreso 100 salario", "habito leer", "meta correr 5k"'
      );
    }

    if (intent.intent === 'income' || intent.intent === 'expense') {
      const category = await prisma.transactionCategory.findFirst({
        where: {
          userId,
          OR: [{ type: intent.intent }, { type: 'both' }],
        },
        orderBy: { createdAt: 'asc' },
      });

      if (!category) {
        throw new Error('No hay categorías de transacciones disponibles para crear el registro');
      }

      await prisma.transaction.create({
        data: {
          userId,
          amount: intent.amount!,
          type: intent.intent,
          categoryId: category.id,
          description: intent.description,
          date: new Date(),
          notes: null,
          isRecurring: false,
          recurringFrequency: null,
        },
      });

      return {
        type: 'transaction',
        message:
          intent.intent === 'income'
            ? `Ingreso registrado: $${intent.amount!.toFixed(2)}`
            : `Gasto registrado: $${intent.amount!.toFixed(2)}`,
      };
    }

    if (intent.intent === 'habit') {
      let category = await prisma.habitCategory.findFirst({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      });

      if (!category) {
        category = await prisma.habitCategory.create({
          data: {
            userId,
            name: 'General',
            emoji: '📁',
            color: '#64748b',
          },
        });
      }

      await prisma.habit.create({
        data: {
          userId,
          title: intent.description,
          description: null,
          emoji: '🎯',
          categoryId: category.id,
          isActive: true,
          isArchived: false,
        },
      });

      return {
        type: 'habit',
        message: `Hábito creado: ${intent.description}`,
      };
    }

    await prisma.goal.create({
      data: {
        userId,
        title: intent.description,
        description: null,
        category: 'personal',
        priority: 'medium',
        status: 'not-started',
        progress: 0,
      },
    });

    return {
      type: 'goal',
      message: `Meta creada: ${intent.description}`,
    };
  }

  static async getAlerts(userId: string): Promise<FocusAlert[]> {
    const alerts: FocusAlert[] = [];
    const today = new Date();
    const dayOfMonth = today.getDate();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const { countryCode } = getTimezoneConfig(user.timezone);

    const [budgetSummary, recurringExpenses, goals, dailyView] = await Promise.all([
      BudgetService.getBudgetSummary(userId),
      prisma.recurringExpense.findMany({
        where: { userId, isActive: true, dueDay: { not: null } },
        orderBy: { dueDay: 'asc' },
      }),
      prisma.goal.findMany({
        where: {
          userId,
          status: { in: ['not-started', 'in-progress'] },
        },
        orderBy: { updatedAt: 'asc' },
        take: 5,
      }),
      HabitService.getDailyView(userId, today),
    ]);

    const budgetUsage =
      budgetSummary.totalMonthlyIncome > 0
        ? (budgetSummary.actualMonthlyExpenses / budgetSummary.totalMonthlyIncome) * 100
        : 0;

    if (budgetUsage >= 90) {
      alerts.push({
        id: 'budget-over-90',
        type: 'budget',
        severity: 'high',
        title: 'Presión de presupuesto',
        description: `Ya usaste ${budgetUsage.toFixed(1)}% de tus ingresos mensuales en gastos.`,
        actionLabel: 'Ver presupuesto',
        actionUrl: '/finance/budget',
      });
    }

    const dueSoonExpenses = recurringExpenses.filter((expense) => {
      const dueDay = expense.dueDay ?? 0;
      return dueDay >= dayOfMonth && dueDay - dayOfMonth <= 2;
    });

    dueSoonExpenses.slice(0, 3).forEach((expense) => {
      const isTodayDue = expense.dueDay === dayOfMonth;
      alerts.push({
        id: `expense-${expense.id}`,
        type: 'expense_due',
        severity: isTodayDue ? 'high' : 'medium',
        title: isTodayDue ? `Vence hoy: ${expense.name}` : `Próximo vencimiento: ${expense.name}`,
        description: `Monto estimado: $${expense.amount.toFixed(2)}.`,
        actionLabel: 'Ver finanzas',
        actionUrl: '/finance/budget',
      });
    });

    const pendingHabits = dailyView.habits.filter((item) => !item.entry?.completed).length;
    if (pendingHabits > 0) {
      alerts.push({
        id: 'pending-habits',
        type: 'habit',
        severity: pendingHabits >= 3 ? 'medium' : 'low',
        title: 'Hábitos pendientes hoy',
        description: `Tienes ${pendingHabits} hábito(s) por completar hoy.`,
        actionLabel: 'Completar ahora',
        actionUrl: '/habits',
      });
    }

    const upcomingHoliday = await getNextHoliday(countryCode, today);
    if (upcomingHoliday) {
      const holidayDate = new Date(upcomingHoliday.date);
      const daysAway = differenceInCalendarDays(holidayDate, today);
      if (daysAway >= 0 && daysAway <= 30) {
        const severity =
          daysAway <= 1 ? 'high' : daysAway <= 5 ? 'medium' : daysAway <= 14 ? 'low' : 'low';
        alerts.push({
          id: `holiday-${upcomingHoliday.date}`,
          type: 'holiday',
          severity,
          title: `Próximo feriado: ${upcomingHoliday.localName}`,
          description: `${upcomingHoliday.name} (${format(holidayDate, 'dd MMM')})`,
          actionLabel: 'Preparar agenda',
          actionUrl: '/habits',
        });
      }
    }

    const staleGoals = goals.filter((goal) => goal.updatedAt < subDays(today, 7));
    if (staleGoals.length > 0) {
      alerts.push({
        id: 'stale-goals',
        type: 'goal',
        severity: 'medium',
        title: 'Metas sin movimiento',
        description: `${staleGoals.length} meta(s) no se actualizan hace más de 7 días.`,
        actionLabel: 'Revisar metas',
        actionUrl: '/goals',
      });
    }

    const severityOrder: Record<FocusAlert['severity'], number> = {
      high: 3,
      medium: 2,
      low: 1,
    };

    return alerts.sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]);
  }

  static async getWeeklyReview(userId: string): Promise<WeeklyReview> {
    const now = new Date();
    const currentEnd = endOfDay(now);
    const currentStart = startOfDay(subDays(now, 6));
    const previousEnd = endOfDay(subDays(currentStart, 1));
    const previousStart = startOfDay(subDays(previousEnd, 6));

    const [transactions, activeHabitsCount, habitEntries, goals] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          userId,
          date: { gte: previousStart, lte: currentEnd },
        },
      }),
      prisma.habit.count({
        where: {
          userId,
          isArchived: false,
          isActive: true,
        },
      }),
      prisma.habitEntry.findMany({
        where: {
          userId,
          completed: true,
          date: { gte: previousStart, lte: currentEnd },
        },
      }),
      prisma.goal.findMany({
        where: {
          userId,
          status: 'completed',
          completedAt: { gte: previousStart, lte: currentEnd },
        },
      }),
    ]);

    const currentTransactions = transactions.filter((t) => t.date >= currentStart);
    const previousTransactions = transactions.filter((t) => t.date <= previousEnd);

    const currentIncome = sumAsMoney(
      currentTransactions.filter((t) => t.type === 'income').map((t) => t.amount)
    );
    const currentExpenses = sumAsMoney(
      currentTransactions.filter((t) => t.type === 'expense').map((t) => t.amount)
    );
    const previousIncome = sumAsMoney(
      previousTransactions.filter((t) => t.type === 'income').map((t) => t.amount)
    );
    const previousExpenses = sumAsMoney(
      previousTransactions.filter((t) => t.type === 'expense').map((t) => t.amount)
    );

    const currentBalance = normalizeMoney(currentIncome - currentExpenses);
    const previousBalance = normalizeMoney(previousIncome - previousExpenses);
    const deltaBalance = normalizeMoney(currentBalance - previousBalance);

    const currentHabitCompletions = habitEntries.filter(
      (entry) => entry.date >= currentStart
    ).length;
    const previousHabitCompletions = habitEntries.filter(
      (entry) => entry.date <= previousEnd
    ).length;
    const totalHabitSlotsPerWeek = Math.max(1, activeHabitsCount * 7);

    const currentCompletionRate = normalizeMoney(
      (currentHabitCompletions / totalHabitSlotsPerWeek) * 100
    );
    const previousCompletionRate = normalizeMoney(
      (previousHabitCompletions / totalHabitSlotsPerWeek) * 100
    );
    const deltaCompletionRate = normalizeMoney(currentCompletionRate - previousCompletionRate);

    const completedThisWeek = goals.filter(
      (goal) => (goal.completedAt ?? now) >= currentStart
    ).length;
    const completedPreviousWeek = goals.filter(
      (goal) => (goal.completedAt ?? now) <= previousEnd
    ).length;
    const deltaCompleted = completedThisWeek - completedPreviousWeek;

    const insights: string[] = [];

    if (deltaBalance > 0) {
      insights.push(`Tu balance semanal mejoró $${deltaBalance.toFixed(2)} vs la semana pasada.`);
    } else if (deltaBalance < 0) {
      insights.push(
        `Tu balance semanal cayó $${Math.abs(deltaBalance).toFixed(2)}; revisa tus gastos variables.`
      );
    } else {
      insights.push('Tu balance semanal se mantuvo estable respecto a la semana pasada.');
    }

    if (deltaCompletionRate > 0) {
      insights.push(`Subiste ${deltaCompletionRate.toFixed(1)} puntos en cumplimiento de hábitos.`);
    } else if (deltaCompletionRate < 0) {
      insights.push(
        `Bajaste ${Math.abs(deltaCompletionRate).toFixed(1)} puntos en hábitos; prioriza 1 hábito clave diario.`
      );
    } else {
      insights.push('Tu ritmo de hábitos fue similar al de la semana pasada.');
    }

    if (deltaCompleted > 0) {
      insights.push(`Completaste ${completedThisWeek} meta(s) esta semana. Mantén ese impulso.`);
    } else if (completedThisWeek === 0) {
      insights.push('No cerraste metas esta semana; define una meta pequeña para completar hoy.');
    } else {
      insights.push(`Completaste ${completedThisWeek} meta(s) esta semana.`);
    }

    return {
      finance: {
        income: currentIncome,
        expenses: currentExpenses,
        balance: currentBalance,
        deltaBalance,
      },
      habits: {
        completionRate: currentCompletionRate,
        previousCompletionRate,
        deltaCompletionRate,
      },
      goals: {
        completedThisWeek,
        completedPreviousWeek,
        deltaCompleted,
      },
      insights,
    };
  }
}
