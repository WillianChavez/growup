import { HabitService } from '@/services/habit.service';
import { TransactionService } from '@/services/transaction.service';
import { GoalService } from '@/services/goal.service';
import { BookService } from '@/services/book.service';
import { startOfDay, subDays, startOfMonth, endOfMonth } from 'date-fns';
import type { MonthlyTransactionGroup } from '@/types/finance.types';

export interface DashboardStats {
  habitsToday: {
    completed: number;
    total: number;
  };
  reading: {
    booksReading: number;
    pagesThisWeek: number;
  };
  finance: {
    balance: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    monthlySavings: number;
    savingsRate: number;
  };
  goals: {
    active: number;
    completedThisMonth: number;
  };
}

export interface DashboardHabitWeeklyStats {
  date: string;
  completed: number;
  total: number;
}

export interface DashboardHabitCategoryWeekly {
  category: string;
  color: string;
  [key: string]: string | number;
}

export interface DashboardData {
  stats: DashboardStats;
  habitWeeklyStats: DashboardHabitWeeklyStats[];
  habitCategoryWeekly: DashboardHabitCategoryWeekly[];
  monthlyTransactions: MonthlyTransactionGroup[];
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    date: Date;
    category: {
      name: string;
      color: string;
      emoji: string;
    } | null;
  }>;
  goals: Array<{
    id: string;
    title: string;
    progress: number;
    status: string;
    completedAt: Date | null;
  }>;
  books: Array<{
    id: string;
    title: string;
    pages: number;
    currentPage: number;
    status: string;
  }>;
}

export class DashboardService {
  static async getDashboardData(userId: string): Promise<DashboardData> {
    const today = new Date();
    const currentYear = today.getFullYear();

    // Obtener datos básicos en paralelo
    const [habits, transactions, goals, books, dailyView] = await Promise.all([
      HabitService.findAllByUser(userId, false),
      TransactionService.findAllByUser(userId),
      GoalService.findAllByUser(userId),
      BookService.findAllByUser(userId),
      HabitService.getDailyView(userId, today),
    ]);

    // Calcular estadísticas de hábitos
    const totalActiveHabits = habits.filter((h) => h.isActive).length;
    const completedToday = dailyView?.habits.filter((h) => h.entry?.completed).length || 0;

    // Calcular estadísticas financieras del mes actual
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);

    const monthlyIncome = transactions
      .filter((t) => {
        const transactionDate = new Date(t.date);
        return t.type === 'income' && transactionDate >= monthStart && transactionDate <= monthEnd;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpenses = transactions
      .filter((t) => {
        const transactionDate = new Date(t.date);
        return t.type === 'expense' && transactionDate >= monthStart && transactionDate <= monthEnd;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlySavings = monthlyIncome - monthlyExpenses;
    const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;

    // Balance total
    const totalBalance =
      transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) -
      transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    // Estadísticas de lectura
    const booksReading = books.filter((b) => b.status === 'reading').length;
    const pagesThisWeek = books
      .filter((b) => b.status === 'reading')
      .reduce((sum, book) => sum + book.currentPage, 0);

    // Estadísticas de metas
    const activeGoals = goals.filter((g) => g.status !== 'completed').length;
    const completedThisMonth = goals.filter((g) => {
      if (g.status !== 'completed' || !g.completedAt) return false;
      const completedDate = new Date(g.completedAt);
      return (
        completedDate.getMonth() === today.getMonth() &&
        completedDate.getFullYear() === today.getFullYear()
      );
    }).length;

    const stats: DashboardStats = {
      habitsToday: {
        completed: completedToday,
        total: totalActiveHabits,
      },
      reading: {
        booksReading,
        pagesThisWeek,
      },
      finance: {
        balance: totalBalance,
        monthlyIncome,
        monthlyExpenses,
        monthlySavings,
        savingsRate,
      },
      goals: {
        active: activeGoals,
        completedThisMonth,
      },
    };

    // Obtener estadísticas semanales de hábitos (últimos 7 días)
    const days = 7;
    const todayStart = startOfDay(today);
    const habitWeeklyStatsPromises = Array.from({ length: days }, async (_, i) => {
      const date = subDays(todayStart, days - 1 - i);
      const dailyView = await HabitService.getDailyView(userId, date);

      return {
        date: date.toISOString(),
        completed: dailyView.habits.filter((h) => h.entry?.completed).length,
        total: dailyView.habits.length,
      };
    });

    const habitWeeklyStats = await Promise.all(habitWeeklyStatsPromises);

    // Obtener categorías de hábitos por semana (últimas 4 semanas)
    const weeks = 4;
    const categoryMap = new Map<
      string,
      {
        name: string;
        emoji: string;
        color: string;
        weeklyData: number[];
      }
    >();

    // Inicializar categorías
    habits.forEach((habit) => {
      if (habit.category && !categoryMap.has(habit.category.id)) {
        categoryMap.set(habit.category.id, {
          name: habit.category.name,
          emoji: habit.category.emoji,
          color: habit.category.color,
          weeklyData: new Array(weeks).fill(0),
        });
      }
    });

    // Obtener datos de cada semana
    for (let weekIndex = 0; weekIndex < weeks; weekIndex++) {
      const weekEnd = subDays(todayStart, (weeks - weekIndex - 1) * 7);

      // Para cada día de la semana
      for (let day = 0; day < 7; day++) {
        const date = subDays(weekEnd, day);
        if (date <= todayStart) {
          const dailyView = await HabitService.getDailyView(userId, date);

          // Contar completados por categoría
          dailyView.habits.forEach((habitView) => {
            if (habitView.entry?.completed && habitView.habit.category) {
              const categoryData = categoryMap.get(habitView.habit.category.id);
              if (categoryData) {
                categoryData.weeklyData[weekIndex]++;
              }
            }
          });
        }
      }
    }

    // Convertir a array con formato para el gráfico
    const habitCategoryWeekly = Array.from(categoryMap.values()).map((cat) => ({
      category: `${cat.emoji} ${cat.name}`,
      color: cat.color,
      ...Object.fromEntries(cat.weeklyData.map((count, index) => [`semana${index + 1}`, count])),
    }));

    // Obtener transacciones mensuales
    const monthlyTransactions = await TransactionService.getGroupedByMonth(userId, currentYear);

    // Preparar transacciones para el gráfico de categorías
    const transactionsForChart = transactions.map((t) => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      date: t.date,
      category: t.category
        ? {
            name: t.category.name,
            color: t.category.color,
            emoji: t.category.emoji,
          }
        : null,
    }));

    // Preparar metas para el gráfico
    const goalsForChart = goals
      .filter((g) => g.status !== 'completed')
      .slice(0, 5)
      .map((g) => ({
        id: g.id,
        title: g.title,
        progress: g.progress || 0,
        status: g.status,
        completedAt: g.completedAt,
      }));

    // Preparar libros para el gráfico
    const booksForChart = books.map((b) => ({
      id: b.id,
      title: b.title,
      pages: b.pages,
      currentPage: b.currentPage,
      status: b.status,
    }));

    return {
      stats,
      habitWeeklyStats,
      habitCategoryWeekly,
      monthlyTransactions,
      transactions: transactionsForChart,
      goals: goalsForChart,
      books: booksForChart,
    };
  }
}
