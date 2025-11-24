'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  BookOpen,
  Wallet,
  Target,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/date-utils';
import { HabitStatsChart } from '@/components/habits/habit-stats-chart';
import { HabitCategoryWeeklyChart } from '@/components/habits/habit-category-weekly-chart';
import { FinanceChart } from '@/components/finance/finance-chart';
import { ExpenseCategoryChart } from '@/components/finance/expense-category-chart';
import { GoalProgressChart } from '@/components/goals/goal-progress-chart';
import { ReadingProgressChart } from '@/components/books/reading-progress-chart';
import { useHabits } from '@/hooks/useHabits';
import { useDailyHabits } from '@/hooks/useDailyHabits';
import { useTransactions } from '@/hooks/useTransactions';
import { useMonthlyTransactions } from '@/hooks/useMonthlyTransactions';
import { useGoals } from '@/hooks/useGoals';
import { useBooks } from '@/hooks/useBooks';
import type { Habit } from '@/types/habit.types';
import type { Transaction, MonthlyTransactionGroup } from '@/types/finance.types';
import type { Goal } from '@/types/goal.types';
import type { Book } from '@/types/book.types';
import type { DailyHabitView } from '@/types/habit.types';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  const today = new Date();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlyGroups, setMonthlyGroups] = useState<MonthlyTransactionGroup[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [dailyView, setDailyView] = useState<DailyHabitView | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<Array<{date: string; completed: number; total: number}>>([]);
  const [categoriesWeekly, setCategoriesWeekly] = useState<Array<{category: string; color: string; [key: string]: string | number}>>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { fetchHabits } = useHabits();
  const { fetchTransactions } = useTransactions();
  const { fetchMonthlyGroups } = useMonthlyTransactions();
  const { fetchGoals } = useGoals();
  const { fetchBooks } = useBooks();
  const { fetchDailyView } = useDailyHabits();

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Cargar datos básicos
      const [habitsData, transactionsData, goalsData, booksData, dailyData] = await Promise.all([
        fetchHabits(false),
        fetchTransactions(),
        fetchGoals(),
        fetchBooks(),
        fetchDailyView(today),
      ]);

      setHabits(habitsData);
      setTransactions(transactionsData);
      setGoals(goalsData);
      setBooks(booksData);
      setDailyView(dailyData);

      // Cargar estadísticas semanales de hábitos
      const weeklyStatsResponse = await fetch('/api/habits/stats/weekly?days=7');
      if (weeklyStatsResponse.ok) {
        const result = await weeklyStatsResponse.json();
        setWeeklyStats(result.data || []);
      }

      // Cargar categorías por semana
      const categoriesWeeklyResponse = await fetch('/api/habits/stats/categories-weekly?weeks=4');
      if (categoriesWeeklyResponse.ok) {
        const result = await categoriesWeeklyResponse.json();
        setCategoriesWeekly(result.data || []);
      }

      // Cargar últimos 12 meses de finanzas
      const currentYear = today.getFullYear();
      const groups = await fetchMonthlyGroups(currentYear);
      setMonthlyGroups(groups);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calcular estadísticas
  const totalActiveHabits = habits.filter(h => h.isActive).length;
  const completedToday = dailyView?.habits.filter((h) => h.entry?.completed).length || 0;

  // Calcular estadísticas financieras del mes actual
  const monthlyIncome = transactions
    .filter(t => {
      const transactionDate = new Date(t.date);
      return t.type === 'income' &&
        transactionDate.getMonth() === today.getMonth() &&
        transactionDate.getFullYear() === today.getFullYear();
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpenses = transactions
    .filter(t => {
      const transactionDate = new Date(t.date);
      return t.type === 'expense' &&
        transactionDate.getMonth() === today.getMonth() &&
        transactionDate.getFullYear() === today.getFullYear();
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlySavings = monthlyIncome - monthlyExpenses;
  const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;

  // Balance total (todos los tiempos)
  const totalBalance = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0) -
    transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const stats = {
    habitsToday: {
      completed: completedToday,
      total: totalActiveHabits,
    },
    reading: {
      booksReading: books.filter(b => b.status === 'reading').length,
      pagesThisWeek: books
        .filter(b => b.status === 'reading')
        .reduce((sum, book) => sum + book.currentPage, 0),
    },
    finance: {
      balance: totalBalance,
      monthlyIncome,
      monthlyExpenses,
      monthlySavings,
      savingsRate,
    },
    goals: {
      active: goals.filter(g => g.status !== 'completed').length,
      completedThisMonth: goals.filter(g => {
        if (g.status !== 'completed' || !g.completedAt) return false;
        const completedDate = new Date(g.completedAt);
        return completedDate.getMonth() === today.getMonth() &&
          completedDate.getFullYear() === today.getFullYear();
      }).length,
    },
  };

  const motivationalQuote = {
    quote: 'El éxito es la suma de pequeños esfuerzos repetidos día tras día.',
    author: 'Robert Collier'
  };

  // Datos para gráfico de hábitos (últimos 7 días) - datos reales de la API
  const habitStatsData = weeklyStats.map(stat => ({
    date: new Date(stat.date),
    completed: stat.completed,
    total: stat.total,
  }));

  // Datos para gráfico de progreso de metas
  const goalProgressData = goals
    .filter(g => g.status !== 'completed')
    .slice(0, 5)
    .map(goal => ({
      title: goal.title,
      progress: goal.progress || 0,
    }));

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3 mb-2" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
        </div>
        <div className="grid gap-4 sm:gap-6 grid-cols-1 xs:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          Dashboard de Análisis
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          {formatDate(today, 'EEEE, d \'de\' MMMM \'de\' yyyy')}
        </p>
      </motion.div>

      {/* Motivational Quote */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
          <CardContent className="pt-6">
            <p className="text-lg font-medium italic text-slate-700 dark:text-slate-300">
              &ldquo;{motivationalQuote.quote}&rdquo;
            </p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              — {motivationalQuote.author}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4 sm:gap-6 grid-cols-1 xs:grid-cols-2 lg:grid-cols-3"
      >
        {/* Habits Card */}
        <motion.div variants={item}>
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hábitos de Hoy</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.habitsToday.completed}/{stats.habitsToday.total}
              </div>
              <Progress
                value={(stats.habitsToday.completed / stats.habitsToday.total) * 100}
                className="mt-3"
              />
              <p className="mt-2 text-xs text-slate-500">
                {Math.round((stats.habitsToday.completed / stats.habitsToday.total) * 100)}% completado
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Monthly Income Card */}
        <motion.div variants={item}>
          <Card className="overflow-hidden border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                +${stats.finance.monthlyIncome.toFixed(2)}
              </div>
              <p className="text-xs text-slate-500 mt-1">ingresos este mes</p>
              <div className="mt-2">
                <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                  {stats.finance.savingsRate >= 20 ? '🎯 Excelente' : stats.finance.savingsRate >= 10 ? '✅ Bien' : '⚠️ Mejorar'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Monthly Expenses Card */}
        <motion.div variants={item}>
          <Card className="overflow-hidden border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gastos del Mes</CardTitle>
              <Wallet className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                -${stats.finance.monthlyExpenses.toFixed(2)}
              </div>
              <p className="text-xs text-slate-500 mt-1">gastos este mes</p>
              <div className="mt-2">
                <p className={`text-xs font-medium ${stats.finance.monthlySavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.finance.monthlySavings >= 0 ? 'Ahorro: ' : 'Déficit: '}
                  ${Math.abs(stats.finance.monthlySavings).toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Savings Rate Card */}
        <motion.div variants={item}>
          <Card className="overflow-hidden border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Ahorro</CardTitle>
              <Target className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.finance.savingsRate.toFixed(1)}%
              </div>
              <p className="text-xs text-slate-500 mt-1">del ingreso mensual</p>
              <Progress
                value={Math.min(stats.finance.savingsRate, 100)}
                className="mt-3"
              />
              <p className="mt-2 text-xs text-slate-500">
                Meta: 20%
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Balance Card */}
        <motion.div variants={item}>
          <Card className="overflow-hidden border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Balance Total</CardTitle>
              <Wallet className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.finance.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.finance.balance >= 0 ? '+' : ''}${stats.finance.balance.toFixed(2)}
              </div>
              <p className="text-xs text-slate-500 mt-1">acumulado total</p>
              <div className="mt-2">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Todas las transacciones
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Goals Card */}
        <motion.div variants={item}>
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Objetivos</CardTitle>
              <Target className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.goals.active}</div>
              <p className="text-xs text-slate-500 mt-1">objetivos activos</p>
              <div className="mt-2">
                <Badge variant="secondary" className="text-xs">
                  {stats.goals.completedThisMonth} completados este mes
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Charts Section */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Hábitos - Progreso Últimos 7 Días */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <HabitStatsChart data={habitStatsData} />
        </motion.div>

        {/* Finanzas - Evolución */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <FinanceChart data={monthlyGroups} />
        </motion.div>

        {/* Hábitos - Categorías Completadas por Semana */}
        {categoriesWeekly.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <HabitCategoryWeeklyChart data={categoriesWeekly} weeks={4} />
          </motion.div>
        )}

        {/* Gastos por Categoría */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <ExpenseCategoryChart transactions={transactions} />
        </motion.div>

        {/* Progreso de Metas */}
        {goalProgressData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="lg:col-span-2"
          >
            <GoalProgressChart data={goalProgressData} />
          </motion.div>
        )}

        {/* Progreso de Lectura */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="lg:col-span-2"
        >
          <ReadingProgressChart books={books} />
        </motion.div>
      </div>
    </div>
  );
}

