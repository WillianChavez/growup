import type { HabitStats } from './habit.types';

export interface DashboardData {
  habits: {
    todayCompleted: number;
    todayTotal: number;
    weekProgress: number;
    currentStreaks: HabitStats[];
  };
  reading: {
    currentBooks: number;
    pagesThisWeek: number;
    yearlyGoalProgress: number;
  };
  finance: {
    monthlyBalance: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    savingsRate: number;
  };
  goals: {
    active: number;
    completedThisMonth: number;
    overallProgress: number;
  };
}

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  enabled: boolean;
  position: number;
}

export type WidgetType =
  | 'habits-today'
  | 'reading-progress'
  | 'finance-summary'
  | 'goals-active'
  | 'weekly-overview'
  | 'motivational-quote';

export interface MotivationalQuote {
  id: string;
  quote: string;
  author: string;
  category: string;
}
