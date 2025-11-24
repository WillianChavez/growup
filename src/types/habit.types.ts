export interface Habit {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  emoji: string;
  categoryId: string;
  isActive: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  category?: HabitCategory;
}

export interface HabitCategory {
  id: string;
  userId: string;
  name: string;
  emoji: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface HabitEntry {
  id: string;
  habitId: string;
  userId: string;
  date: Date;
  completed: boolean;
  notes: string | null;
  completedAt: Date | null;
  createdAt: Date;
}

export interface HabitFormData {
  title: string;
  description?: string;
  emoji: string;
  categoryId: string;
}

export interface HabitCategoryFormData {
  name: string;
  emoji: string;
  color: string;
}

export interface HabitStats {
  totalEntries: number;
  completedEntries: number;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  thisWeek: {
    completed: number;
    total: number;
  };
  thisMonth: {
    completed: number;
    total: number;
  };
}

export interface DailyHabitView {
  date: Date;
  habits: Array<{
    habit: Habit;
    entry: HabitEntry | null;
    weeklyPercentage: number; // Porcentaje de completitud de la semana (0-100)
    weeklyCompleted: number; // Días completados esta semana
    weeklyTotal: number; // Total de días en la semana hasta hoy
  }>;
}

export interface MonthlyHabitData {
  date: Date;
  completedCount: number;
  totalCount: number;
  habits: Array<{
    habitId: string;
    habitTitle: string;
    completed: boolean;
  }>;
}
