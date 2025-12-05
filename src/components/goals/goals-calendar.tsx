'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Goal } from '@/types/goal.types';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  isToday,
} from 'date-fns';
import { es } from 'date-fns/locale';

interface GoalsCalendarProps {
  goals: Goal[];
  onGoalClick: (goal: Goal) => void;
}

const PRIORITY_COLORS = {
  low: 'bg-blue-500',
  medium: 'bg-yellow-500',
  high: 'bg-red-500',
};

const STATUS_COLORS = {
  'not-started': 'border-slate-300',
  'in-progress': 'border-blue-500',
  completed: 'border-green-500',
  abandoned: 'border-slate-400',
};

export function GoalsCalendar({ goals, onGoalClick }: GoalsCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get goals with target dates
  const goalsWithDates = goals.filter((g) => g.targetDate);

  const getGoalsForDay = (day: Date) => {
    return goalsWithDates.filter(
      (goal) => goal.targetDate && isSameDay(new Date(goal.targetDate), day)
    );
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Calcular el día de inicio de la semana del mes
  const startDayOfWeek = monthStart.getDay();
  const emptyDays = Array.from({ length: startDayOfWeek });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            Calendario de Metas
          </CardTitle>
          <div className="flex items-center justify-center sm:justify-end gap-2">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-semibold min-w-[120px] text-center">
              {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </div>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {/* Week day headers */}
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-slate-600 dark:text-slate-400 py-2"
            >
              {day}
            </div>
          ))}

          {/* Empty cells for days before month starts */}
          {emptyDays.map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square" />
          ))}

          {/* Days of the month */}
          {days.map((day) => {
            const dayGoals = getGoalsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isDayToday = isToday(day);

            return (
              <div
                key={day.toISOString()}
                className={`
                  aspect-square border rounded-lg p-1 sm:p-2 relative
                  ${!isCurrentMonth ? 'bg-slate-50 dark:bg-slate-900/50 opacity-50' : 'bg-white dark:bg-slate-950'}
                  ${isDayToday ? 'ring-2 ring-blue-500' : ''}
                `}
              >
                <div
                  className={`text-xs sm:text-sm font-semibold mb-1 ${isDayToday ? 'text-blue-600' : ''}`}
                >
                  {format(day, 'd')}
                </div>

                {dayGoals.length > 0 && (
                  <div className="space-y-0.5">
                    {dayGoals.slice(0, 2).map((goal) => (
                      <button
                        key={goal.id}
                        onClick={() => onGoalClick(goal)}
                        className={`
                          w-full text-left text-[8px] sm:text-xs p-0.5 sm:p-1 rounded
                          border-l-2 ${STATUS_COLORS[goal.status]}
                          bg-slate-100 dark:bg-slate-800
                          hover:bg-slate-200 dark:hover:bg-slate-700
                          truncate transition-colors
                        `}
                        title={goal.title}
                      >
                        <span
                          className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${PRIORITY_COLORS[goal.priority]}`}
                        />
                        {goal.title}
                      </button>
                    ))}
                    {dayGoals.length > 2 && (
                      <div className="text-[8px] sm:text-xs text-slate-500 dark:text-slate-400 text-center">
                        +{dayGoals.length - 2} más
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Prioridad:</span>
            <div className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${PRIORITY_COLORS.high}`} />
              Alta
            </div>
            <div className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${PRIORITY_COLORS.medium}`} />
              Media
            </div>
            <div className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${PRIORITY_COLORS.low}`} />
              Baja
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">Estado:</span>
            <Badge variant="outline" className="border-blue-500">
              En Progreso
            </Badge>
            <Badge variant="outline" className="border-green-500">
              Completada
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
