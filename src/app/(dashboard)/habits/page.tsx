'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Circle,
  Calendar,
  Plus,
  LayoutDashboard,
  Flame,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Check,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useHabits } from '@/hooks/useHabits';
import { useDailyHabits } from '@/hooks/useDailyHabits';
import { useMonthlyHabits } from '@/hooks/useMonthlyHabits';
import { HabitDialog } from '@/components/habits/habit-dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/useIsMobile';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  getDay,
  isSameDay,
} from 'date-fns';
import type { Habit, HabitFormData, DailyHabitView, MonthlyHabitData } from '@/types/habit.types';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/stores/user-store';

type ActiveTab = 'today' | 'calendar' | 'history';

export default function HabitsPage() {
  const { user } = useUserStore();
  const [activeTab, setActiveTab] = useState<ActiveTab>('today');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<string | null>(null);
  const [currentDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dailyView, setDailyView] = useState<DailyHabitView | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyHabitData[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<
    Array<{ date: string; completed: number; total: number }>
  >([]);
  const [habitStats, setHabitStats] = useState<Map<string, { currentStreak: number }>>(new Map());
  const isMobile = useIsMobile();

  const { createHabit, updateHabit, deleteHabit, isLoading } = useHabits();
  const { fetchDailyView, toggleHabit } = useDailyHabits();
  const { fetchMonthlyData } = useMonthlyHabits();

  const loadDailyView = async () => {
    const view = await fetchDailyView(currentDate);
    setDailyView(view);
  };

  const loadMonthlyData = async () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    const data = await fetchMonthlyData(year, month);
    setMonthlyData(data);
  };

  const loadWeeklyStats = async () => {
    try {
      const response = await fetch('/api/habits/stats/weekly?days=7');
      if (response.ok) {
        const result = await response.json();
        setWeeklyStats(result.data || []);
      }
    } catch (error) {
      console.error('Error loading weekly stats:', error);
    }
  };

  const loadHabitStats = async () => {
    if (!dailyView || dailyView.habits.length === 0) return;
    const statsPromises = dailyView.habits.map(async (item) => {
      try {
        const response = await fetch(`/api/habits/${item.habit.id}/stats`);
        if (response.ok) {
          const result = await response.json();
          return {
            habitId: item.habit.id,
            currentStreak: result.data?.currentStreak || 0,
          };
        }
      } catch (error) {
        console.error(`Error loading stats for habit ${item.habit.id}:`, error);
      }
      return {
        habitId: item.habit.id,
        currentStreak: 0,
      };
    });

    const stats = await Promise.all(statsPromises);
    const statsMap = new Map(stats.map((s) => [s.habitId, { currentStreak: s.currentStreak }]));
    setHabitStats(statsMap);
  };

  useEffect(() => {
    void loadDailyView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate]);

  useEffect(() => {
    void loadMonthlyData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth]);

  useEffect(() => {
    void loadWeeklyStats();
  }, []);

  useEffect(() => {
    if (dailyView) {
      void loadHabitStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyView]);

  const handleOpenDialog = (habit?: Habit) => {
    setEditingHabit(habit);
    setDialogOpen(true);
  };

  const handleSaveHabit = async (data: HabitFormData) => {
    if (editingHabit) {
      await updateHabit(editingHabit.id, data);
    } else {
      await createHabit(data);
    }
    await loadDailyView();
    await loadMonthlyData();
  };

  const handleConfirmDelete = async () => {
    if (habitToDelete) {
      await deleteHabit(habitToDelete);
      await loadDailyView();
      await loadMonthlyData();
      setHabitToDelete(null);
    }
  };

  const handleToggleHabit = async (habitId: string, completed: boolean) => {
    const success = await toggleHabit(habitId, currentDate, completed);
    if (success) {
      await loadDailyView();
      await loadHabitStats();
    }
  };

  const goToPrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  // Calcular nivel de actividad para el calendario (0-3)
  // const getActivityLevel = (day: Date): number => {
  //   const dayData = monthlyData.find((d) => {
  //     const dataDate = new Date(d.date);
  //     return (
  //       dataDate.getFullYear() === day.getFullYear() &&
  //       dataDate.getMonth() === day.getMonth() &&
  //       dataDate.getDate() === day.getDate()
  //     );
  //   });

  //   if (!dayData || dayData.totalCount === 0) return 0;
  //   const rate = dayData.completedCount / dayData.totalCount;
  //   if (rate === 1) return 3; // Completado
  //   if (rate >= 0.75) return 2; // Mayoría
  //   if (rate >= 0.25) return 1; // Algunos
  //   return 0; // Nada
  // };

  // use useCallback
  const getActivityLevel = useCallback(
    (day: Date): number | undefined | void => {
      const dayData = monthlyData.find((d) => {
        const dataDate = new Date(d.date);
        return isSameDay(dataDate, day);
      });
      if (!dayData) return undefined;
      return dayData.completedCount;
    },
    [monthlyData]
  );

  const getLevelColor = (level: number) => {
    switch (level) {
      case 3:
        return 'bg-indigo-600 border-indigo-700 shadow-sm'; // Completado
      case 2:
        return 'bg-indigo-400 border-indigo-500 opacity-80'; // Mayoría
      case 1:
        return 'bg-indigo-200 border-indigo-300'; // Algunos
      default:
        return 'bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700'; // Nada
    }
  };

  // Calcular total de racha (suma de todas las rachas)
  const totalStreak = useMemo(() => {
    return Array.from(habitStats.values()).reduce((sum, stat) => sum + stat.currentStreak, 0);
  }, [habitStats]);

  // Calcular porcentaje de mejora semanal
  const weeklyImprovement = useMemo(() => {
    if (weeklyStats.length < 7) return 0;
    const firstHalf =
      weeklyStats.slice(0, 3).reduce((sum, s) => sum + (s.completed / s.total || 0), 0) / 3;
    const secondHalf =
      weeklyStats.slice(4, 7).reduce((sum, s) => sum + (s.completed / s.total || 0), 0) / 3;
    if (firstHalf === 0) return 0;
    return ((secondHalf - firstHalf) / firstHalf) * 100;
  }, [weeklyStats]);

  // Obtener datos del calendario para el mes actual
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDayOfWeek = getDay(monthStart);
    const paddingDays = Array(startDayOfWeek).fill(null);

    return {
      paddingDays,
      days: days.map((day) => ({
        date: day,
        level: getActivityLevel(day),
        isToday: isToday(day),
      })),
    };
  }, [currentMonth, getActivityLevel]);

  // Obtener datos semanales para el gráfico
  const weeklyChartData = useMemo(() => {
    if (weeklyStats.length === 0) return [0, 0, 0, 0, 0, 0, 0];
    return weeklyStats.map((stat) => {
      if (stat.total === 0) return 0;
      return (stat.completed / stat.total) * 100;
    });
  }, [weeklyStats]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="px-4 sm:px-6 lg:px-10 pt-6 sm:pt-8 pb-4 lg:py-6 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0">
        <div className="flex justify-between items-center mb-4 lg:mb-0">
          <div className="lg:hidden">
            <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
              ¡Hola!
            </h2>
            <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">
              Llevas una racha increíble este mes.
            </p>
          </div>
          <div className="hidden lg:block">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
              ¡Hola, {user?.name}!
            </h2>
            <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">
              Llevas una racha increíble este mes.
            </p>
          </div>
        </div>
      </header>

      {/* Contenido Scrollable */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-10 py-4 sm:py-6 lg:py-8 space-y-6 lg:space-y-8 pb-24 lg:pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Columna Izquierda: Hábitos del Día */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-800 dark:text-white uppercase text-xs tracking-widest">
                Tus hábitos de hoy
              </h3>
              <div className="flex gap-2">
                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-800 shadow-sm">
                  <Flame size={14} className="text-orange-500" />
                  <span className="text-xs font-black">{totalStreak}</span>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-4xl" />
                ))}
              </div>
            ) : !dailyView || dailyView.habits.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 px-4">
                  <div className="relative mb-4 inline-block">
                    <div className="absolute inset-0 bg-linear-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full blur-2xl" />
                    <Trophy className="relative h-16 w-16 text-blue-500 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                    Comienza tu viaje de crecimiento
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 text-center max-w-md">
                    Los hábitos son la base del éxito. Crea tu primer hábito y comienza a construir
                    una mejor versión de ti mismo.
                  </p>
                  <Button
                    onClick={() => handleOpenDialog()}
                    className="bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Crear mi Primer Hábito
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4">
                  {dailyView.habits.map((item) => {
                    const isCompleted = item.entry?.completed || false;
                    const streak = habitStats.get(item.habit.id)?.currentStreak || 0;
                    const categoryColor = item.habit.category?.color || '#6366f1';

                    return (
                      <div
                        key={item.habit.id}
                        onClick={() => handleToggleHabit(item.habit.id, !isCompleted)}
                        className={cn(
                          'group relative bg-white dark:bg-slate-900 p-5 rounded-4xl flex items-center justify-between border-2 transition-all cursor-pointer',
                          isCompleted
                            ? 'border-indigo-100 dark:border-indigo-900 bg-indigo-50/20 dark:bg-indigo-900/10'
                            : 'border-transparent shadow-sm hover:border-slate-200 dark:hover:border-slate-800'
                        )}
                      >
                        <div className="flex items-center gap-5">
                          <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-active:scale-90"
                            style={{
                              backgroundColor: `${categoryColor}15`,
                              color: categoryColor,
                            }}
                          >
                            <span className="text-2xl">{item.habit.emoji}</span>
                          </div>
                          <div>
                            <h4
                              className={cn(
                                'font-black text-base transition-all',
                                isCompleted
                                  ? 'text-slate-400 dark:text-slate-500 line-through'
                                  : 'text-slate-800 dark:text-white'
                              )}
                            >
                              {item.habit.title}
                            </h4>
                            <div className="flex items-center gap-2">
                              <Star
                                size={12}
                                className={isCompleted ? 'text-yellow-300' : 'text-yellow-500'}
                                fill="currentColor"
                              />
                              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
                                Racha: {streak}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div
                          className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                            isCompleted
                              ? 'bg-indigo-600 text-white shadow-md'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600'
                          )}
                        >
                          {isCompleted ? (
                            <Check size={24} strokeWidth={4} />
                          ) : (
                            <Circle size={24} strokeWidth={3} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => handleOpenDialog()}
                  className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-4xl text-slate-400 dark:text-slate-500 font-bold text-sm flex items-center justify-center gap-2 hover:border-indigo-200 dark:hover:border-indigo-800 hover:text-indigo-400 dark:hover:text-indigo-400 transition-all"
                >
                  <Plus size={18} /> Personalizar mis hábitos
                </button>
              </>
            )}
          </div>

          {/* Columna Derecha: Calendario y Resumen */}
          <div className="lg:col-span-1 space-y-6">
            {/* Calendario Estilo Cuadrícula de Progreso */}
            <div className="bg-white dark:bg-slate-900 p-5 sm:p-7 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-6">
                <h4 className="font-black text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Actividad del Mes
                </h4>
                <div className="flex gap-2 text-slate-400 dark:text-slate-500">
                  <button
                    onClick={goToPrevMonth}
                    className="hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={goToNextMonth}
                    className="hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <div className="grid grid-cols-7 gap-2 sm:gap-3">
                  {calendarDays.paddingDays.map((_, i) => (
                    <div key={`padding-${i}`} className="aspect-square" />
                  ))}
                  {calendarDays.days.map((day, i) => (
                    <div key={`cal-tile-${i}`} className="relative group">
                      <div
                        className={cn(
                          'aspect-square rounded-lg border-2 transition-all cursor-help',
                          getLevelColor(day.level ?? 0),
                          day.isToday &&
                            'ring-2 ring-rose-400 dark:ring-rose-500 ring-offset-2 dark:ring-offset-slate-900'
                        )}
                      />
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 dark:bg-slate-700 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 font-bold uppercase tracking-tighter">
                        Día {format(day.date, 'd')}:{' '}
                        {day.level === 3
                          ? 'Perfecto'
                          : day.level === 2
                            ? 'Bien'
                            : day.level === 1
                              ? 'Parcial'
                              : 'Incompleto'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Leyenda del calendario */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase">
                  Menos
                </span>
                <div className="flex gap-1.5">
                  {[0, 1, 2, 3].map((lvl) => (
                    <div
                      key={`legend-${lvl}`}
                      className={cn('w-3 h-3 rounded-sm border', getLevelColor(lvl))}
                    />
                  ))}
                </div>
                <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase">
                  Más
                </span>
              </div>
            </div>

            {/* Tarjeta de Resumen Semanal */}
            <div className="bg-indigo-600 dark:bg-indigo-700 rounded-[2.5rem] p-5 sm:p-7 text-white shadow-xl shadow-indigo-100 dark:shadow-indigo-900/50 relative overflow-hidden">
              <div className="relative z-10">
                <h4 className="text-[10px] font-black uppercase tracking-widest mb-4 opacity-70">
                  Resumen Semanal
                </h4>
                <p className="text-xl sm:text-2xl font-black mb-6 leading-tight">
                  {weeklyImprovement > 0
                    ? `Vas un ${Math.abs(weeklyImprovement).toFixed(0)}% mejor que la semana pasada 🔥`
                    : weeklyImprovement < 0
                      ? `Vas un ${Math.abs(weeklyImprovement).toFixed(0)}% peor que la semana pasada`
                      : 'Mantén el ritmo 💪'}
                </p>

                <div className="flex justify-between items-end gap-2 h-16">
                  {weeklyChartData.map((height, i) => (
                    <div key={`bar-${i}`} className="flex-1 flex flex-col items-center gap-2">
                      <div
                        className="w-full rounded-t-lg bg-white/20 hover:bg-white/30 transition-all cursor-pointer"
                        style={{ height: `${Math.max(height, 5)}%` }}
                      />
                      <span className="text-[8px] font-black opacity-40">
                        {['L', 'M', 'M', 'J', 'V', 'S', 'D'][i]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
            </div>
          </div>
        </div>
      </main>

      {/* NAV MÓVIL */}
      {isMobile && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 px-10 py-4 pb-8 flex items-center justify-between z-20">
          <Button
            variant="ghost"
            className={cn(
              'text-slate-400 dark:text-slate-500',
              activeTab === 'today' && 'text-indigo-600 dark:text-indigo-400'
            )}
            onClick={() => setActiveTab('today')}
          >
            <LayoutDashboard size={24} strokeWidth={2.5} />
          </Button>
          <Button
            onClick={() => handleOpenDialog()}
            className="w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50 -mt-12 border-4 border-white dark:border-slate-900 active:scale-95 transition-all"
          >
            <Plus size={28} strokeWidth={3} />
          </Button>
          <Button
            variant="ghost"
            className={cn(
              'text-slate-300 dark:text-slate-600',
              activeTab === 'calendar' && 'text-indigo-600 dark:text-indigo-400'
            )}
            onClick={() => setActiveTab('calendar')}
          >
            <Calendar size={24} strokeWidth={2.5} />
          </Button>
        </nav>
      )}

      {/* Degradado para indicar que hay más contenido al hacer scroll - Solo Móvil */}
      {isMobile && (
        <div className="fixed bottom-20 left-0 right-0 h-12 bg-linear-to-t from-slate-50 dark:from-slate-950 to-transparent pointer-events-none z-10" />
      )}

      {/* Dialogs */}
      <HabitDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingHabit(undefined);
        }}
        habit={editingHabit}
        onSave={handleSaveHabit}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="¿Eliminar hábito?"
        description="Esta acción no se puede deshacer. Se eliminará el hábito y todo su historial de entradas."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
