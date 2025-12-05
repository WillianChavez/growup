'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMonthlyHabits } from '@/hooks/useMonthlyHabits';
import type { MonthlyHabitData } from '@/types/habit.types';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameMonth,
  isToday,
  isFuture,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function MonthlyCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthlyData, setMonthlyData] = useState<MonthlyHabitData[]>([]);
  const { fetchMonthlyData } = useMonthlyHabits();

  useEffect(() => {
    const loadMonthlyData = async () => {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      const data = await fetchMonthlyData(year, month);
      setMonthlyData(data);
    };
    void loadMonthlyData();
  }, [currentMonth, fetchMonthlyData]);

  const goToPrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  // Obtener días del mes
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Días de relleno al inicio
  const startDayOfWeek = getDay(monthStart);
  const paddingDays = Array(startDayOfWeek).fill(null);

  // Función para obtener color según completitud
  const getCompletionColor = (completedCount: number, totalCount: number) => {
    if (totalCount === 0) return 'bg-slate-100 dark:bg-slate-800';
    const rate = completedCount / totalCount;
    if (rate === 1) return 'bg-green-500';
    if (rate >= 0.75) return 'bg-green-400';
    if (rate >= 0.5) return 'bg-yellow-400';
    if (rate >= 0.25) return 'bg-orange-400';
    if (rate > 0) return 'bg-red-300';
    return 'bg-slate-200 dark:bg-slate-700';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          {/* Title and Today Button */}
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg sm:text-xl">Calendario de Hábitos</CardTitle>
            <Button size="sm" variant="outline" onClick={goToToday} className="shrink-0">
              <span className="hidden xs:inline">Hoy</span>
              <span className="xs:hidden">📅</span>
            </Button>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-center gap-2">
            <Button
              size="icon"
              variant="outline"
              onClick={goToPrevMonth}
              className="shrink-0 h-9 w-9"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0 flex-1 max-w-[250px] text-center font-semibold text-sm sm:text-base">
              {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </div>
            <Button
              size="icon"
              variant="outline"
              onClick={goToNextMonth}
              className="shrink-0 h-9 w-9"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="text-center text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 py-1 sm:py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {/* Padding days */}
          {paddingDays.map((_, index) => (
            <div key={`padding-${index}`} className="aspect-square" />
          ))}

          {/* Actual days */}
          {daysInMonth.map((day, index) => {
            const dayData = monthlyData.find(
              (d) => format(d.date, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
            );

            const completedCount = dayData?.completedCount || 0;
            const totalCount = dayData?.totalCount || 0;
            const colorClass = getCompletionColor(completedCount, totalCount);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isDayToday = isToday(day);
            const isFutureDay = isFuture(day) && !isDayToday;

            return (
              <motion.div
                key={day.toISOString()}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.01 }}
                className={cn(
                  'aspect-square relative rounded-lg transition-all',
                  isCurrentMonth ? 'opacity-100' : 'opacity-30',
                  !isFutureDay && 'cursor-pointer hover:ring-2 hover:ring-blue-400',
                  isFutureDay && 'opacity-30 cursor-not-allowed'
                )}
              >
                <div
                  className={cn(
                    'w-full h-full rounded-lg p-1.5 sm:p-2 flex flex-col',
                    colorClass,
                    isDayToday && 'ring-2 ring-blue-500'
                  )}
                >
                  {/* Day Number */}
                  <div
                    className={cn(
                      'text-xs sm:text-sm font-medium',
                      completedCount === totalCount && totalCount > 0
                        ? 'text-white'
                        : 'text-slate-900 dark:text-white'
                    )}
                  >
                    {format(day, 'd')}
                  </div>

                  {/* Completion Info */}
                  {totalCount > 0 && (
                    <div className="mt-auto text-[10px] sm:text-xs font-medium text-center">
                      {completedCount}/{totalCount}
                    </div>
                  )}
                </div>

                {/* Today indicator */}
                {isDayToday && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full" />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-slate-200 dark:bg-slate-700 shrink-0" />
            <span className="whitespace-nowrap">Sin hábitos</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-red-300 shrink-0" />
            <span className="whitespace-nowrap">{'< 25%'}</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-orange-400 shrink-0" />
            <span className="whitespace-nowrap">25-50%</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-yellow-400 shrink-0" />
            <span className="whitespace-nowrap">50-75%</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-green-400 shrink-0" />
            <span className="whitespace-nowrap">75-99%</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-green-500 shrink-0" />
            <span className="whitespace-nowrap">100%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
