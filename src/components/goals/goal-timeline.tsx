'use client';

import { format, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Goal, Milestone } from '@/types/goal.types';
import { cn } from '@/lib/utils';

interface GoalTimelineProps {
  goal: Goal;
}

interface TimelineEvent {
  date: Date;
  type: 'milestone' | 'goal';
  title: string;
  description?: string;
  milestone?: Milestone;
}

export function GoalTimeline({ goal }: GoalTimelineProps) {
  const events: TimelineEvent[] = [];

  // Agregar eventos de milestones completados
  if (goal.milestones) {
    goal.milestones
      .filter((m) => m.completed && m.completedAt)
      .forEach((milestone) => {
        events.push({
          date: new Date(milestone.completedAt!),
          type: 'milestone',
          title: milestone.title,
          description: 'Hito completado',
          milestone,
        });
      });
  }

  // Agregar evento de goal completado
  if (goal.status === 'completed' && goal.completedAt) {
    events.push({
      date: new Date(goal.completedAt),
      type: 'goal',
      title: goal.title,
      description: 'Meta completada',
    });
  }

  // Agregar fecha de creación
  events.push({
    date: new Date(goal.createdAt),
    type: 'goal',
    title: 'Meta creada',
    description: goal.title,
  });

  // Ordenar eventos por fecha (más reciente primero)
  events.sort((a, b) => b.date.getTime() - a.date.getTime());

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Historial de Progreso</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
            Aún no hay eventos en el historial
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Historial de Progreso
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Línea vertical del timeline */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-800" />

          <div className="space-y-6">
            {events.map((event, index) => {
              const isToday = isSameDay(event.date, new Date());
              const isMilestone = event.type === 'milestone';
              const isGoalCompleted = event.type === 'goal' && event.description === 'Meta completada';

              return (
                <div key={index} className="relative flex gap-4">
                  {/* Punto del timeline */}
                  <div className="relative z-10 flex-shrink-0">
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full border-2 bg-white dark:bg-slate-950',
                        isMilestone && 'border-blue-500',
                        isGoalCompleted && 'border-green-500',
                        !isMilestone && !isGoalCompleted && 'border-slate-300 dark:border-slate-700'
                      )}
                    >
                      {isMilestone ? (
                        <CheckCircle2 className="h-4 w-4 text-blue-500" />
                      ) : isGoalCompleted ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <Circle className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Contenido del evento */}
                  <div className="flex-1 pb-6">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                          {event.title}
                        </h4>
                        {event.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {event.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isToday && (
                          <Badge variant="outline" className="text-xs">
                            Hoy
                          </Badge>
                        )}
                        <span className="text-xs text-slate-400 whitespace-nowrap">
                          {format(event.date, 'dd MMM yyyy', { locale: es })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

