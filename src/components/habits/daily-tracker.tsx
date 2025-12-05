'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CircularProgress } from '@/components/ui/circular-progress';
import { useDailyHabits } from '@/hooks/useDailyHabits';
import type { DailyHabitView } from '@/types/habit.types';
import { format, addDays, subDays, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export function DailyTracker() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dailyView, setDailyView] = useState<DailyHabitView | null>(null);
  const { fetchDailyView, toggleHabit } = useDailyHabits();

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      const view = await fetchDailyView(currentDate);
      if (!cancelled) {
        setDailyView(view);
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate]);

  const handleToggle = async (habitId: string, completed: boolean) => {
    await toggleHabit(habitId, currentDate, completed);
    // Recargar datos después de toggle
    const view = await fetchDailyView(currentDate);
    setDailyView(view);
  };

  const goToPrevDay = () => setCurrentDate(subDays(currentDate, 1));
  const goToNextDay = () => setCurrentDate(addDays(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  if (!dailyView) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-pulse">Cargando...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Weekly Overview - Horizontal scrollable */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent snap-x snap-mandatory">
            {dailyView.habits.map((item, index) => (
              <motion.div
                key={item.habit.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex flex-col items-center gap-2 min-w-[70px] sm:min-w-[80px] group cursor-pointer snap-start"
                onClick={() => {
                  // Scroll to habit in list
                  const element = document.getElementById(`habit-${item.habit.id}`);
                  element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
              >
                {/* Emoji and title */}
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xl sm:text-2xl">{item.habit.emoji}</span>
                  <span className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 text-center line-clamp-2 max-w-[70px] sm:max-w-[80px] group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                    {item.habit.title}
                  </span>
                </div>

                {/* Progress circle */}
                <CircularProgress percentage={item.weeklyPercentage} size="md" showLabel={true} />
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Daily Habits List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Título y botón "Hoy" - Apilados en móvil */}
            <div className="flex flex-col items-center sm:items-start gap-3 w-full sm:w-auto">
              <CardTitle className="text-xl text-center sm:text-left w-full sm:w-auto">
                Hábitos de Hoy
              </CardTitle>
              {!isToday(currentDate) && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={goToToday}
                  className="w-full sm:w-auto"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Hoy
                </Button>
              )}
            </div>

            {/* Selector de fecha - Abajo en móvil, a la derecha en desktop */}
            <div className="flex items-center justify-center gap-2 w-full sm:w-auto">
              <Button size="icon" variant="outline" onClick={goToPrevDay}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-[200px] text-center">
                <p className="font-semibold">{format(currentDate, 'EEEE', { locale: es })}</p>
                <p className="text-sm text-slate-500">
                  {format(currentDate, 'dd MMMM yyyy', { locale: es })}
                </p>
              </div>
              <Button
                size="icon"
                variant="outline"
                onClick={goToNextDay}
                disabled={isToday(currentDate)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {dailyView.habits.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No tienes hábitos activos. ¡Crea uno para empezar!
            </div>
          ) : (
            <div className="space-y-2">
              {dailyView.habits.map((item, index) => {
                const isCompleted = item.entry?.completed || false;

                return (
                  <motion.div
                    key={item.habit.id}
                    id={`habit-${item.habit.id}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div
                      className={cn(
                        'flex items-center gap-2 sm:gap-4 p-3 sm:p-4 rounded-lg border-2 transition-all cursor-pointer',
                        isCompleted
                          ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      )}
                      onClick={() => handleToggle(item.habit.id, !isCompleted)}
                    >
                      {/* Checkbox */}
                      <div
                        className={cn(
                          'flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 transition-all shrink-0',
                          isCompleted
                            ? 'bg-green-500 border-green-500'
                            : 'border-slate-300 dark:border-slate-700'
                        )}
                      >
                        {isCompleted && <Check className="h-4 w-4 sm:h-5 sm:w-5 text-white" />}
                      </div>

                      {/* Habit Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-lg sm:text-xl shrink-0">{item.habit.emoji}</span>
                          <h3
                            className={cn(
                              'font-medium text-sm sm:text-base truncate',
                              isCompleted && 'line-through text-slate-500'
                            )}
                          >
                            {item.habit.title}
                          </h3>
                        </div>
                        {item.habit.description && (
                          <p className="text-xs sm:text-sm text-slate-500 mt-1 line-clamp-1 sm:line-clamp-none">
                            {item.habit.description}
                          </p>
                        )}
                      </div>

                      {/* Category Badge - Desktop */}
                      <Badge
                        style={{
                          backgroundColor: item.habit.category?.color || '#3b82f6',
                          color: 'white',
                        }}
                        className="items-center gap-1 text-[10px] sm:text-xs shrink-0 hidden sm:flex"
                      >
                        <span>{item.habit.category?.emoji}</span>
                        <span className="hidden sm:inline">{item.habit.category?.name}</span>
                      </Badge>
                      {/* Badge solo emoji en móvil */}
                      <div
                        className="shrink-0 sm:hidden"
                        style={{ color: item.habit.category?.color || '#3b82f6' }}
                      >
                        <span className="text-lg">{item.habit.category?.emoji}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
