'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Wallet, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatDate } from '@/lib/date-utils';
import { HabitStatsChart } from '@/components/habits/habit-stats-chart';
import { FinanceChart } from '@/components/finance/finance-chart';
import type { DashboardData } from '@/services/dashboard.service';

export default function DashboardPage() {
  const today = new Date();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/api/dashboard');
        if (response.ok) {
          const result = await response.json();
          setDashboardData(result.data);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    void loadData();
  }, []);

  if (isLoading || !dashboardData) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3 mb-2" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const { stats, habitWeeklyStats, monthlyTransactions } = dashboardData;

  const habitStatsData = habitWeeklyStats.map((stat) => ({
    date: stat.date,
    completed: stat.completed,
    total: stat.total,
  }));

  const habitsTotal = stats.habitsToday.total || 1;
  const habitsPercent = Math.round((stats.habitsToday.completed / habitsTotal) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {formatDate(today, "EEEE, d 'de' MMMM 'de' yyyy")}
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-4 grid-cols-1 sm:grid-cols-3"
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Hábitos de hoy</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.habitsToday.completed}/{stats.habitsToday.total}
            </div>
            <Progress value={habitsPercent} className="mt-3" />
            <p className="mt-1 text-xs text-slate-500">{habitsPercent}% completado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
            <Wallet className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${stats.finance.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
            >
              {stats.finance.balance >= 0 ? '+' : ''}${stats.finance.balance.toFixed(2)}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Ahorro este mes: ${stats.finance.monthlySavings.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Objetivos</CardTitle>
            <Target className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.goals.active}</div>
            <p className="mt-1 text-xs text-slate-500">
              {stats.goals.completedThisMonth} completados este mes
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid gap-4 lg:grid-cols-2"
      >
        <HabitStatsChart data={habitStatsData} />
        <FinanceChart data={monthlyTransactions} />
      </motion.div>
    </div>
  );
}
