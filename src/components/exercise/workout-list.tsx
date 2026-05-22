'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Trash2, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FOCUS_LABELS, INTENSITY_LABELS } from '@/components/exercise/exercise-labels';
import type { WorkoutSession, WorkoutFocus, WorkoutIntensity } from '@/types/exercise.types';

interface WorkoutListProps {
  workouts: WorkoutSession[];
  onDelete: (id: string) => void;
}

export function WorkoutList({ workouts, onDelete }: WorkoutListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Entrenamientos recientes</CardTitle>
      </CardHeader>
      <CardContent>
        {workouts.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Aún no hay entrenamientos registrados.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {workouts.map((w) => (
              <li key={w.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium capitalize">
                      {format(new Date(w.date), "EEE d 'de' MMM", { locale: es })}
                    </span>
                    <Badge variant="secondary">{FOCUS_LABELS[w.focus as WorkoutFocus]}</Badge>
                    {w.durationMin ? (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <Clock className="h-3 w-3" />
                        {w.durationMin} min
                      </span>
                    ) : null}
                    {w.intensity ? (
                      <span className="text-xs text-slate-400">
                        {INTENSITY_LABELS[w.intensity as WorkoutIntensity]}
                      </span>
                    ) : null}
                  </div>
                  {w.notes ? (
                    <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                      {w.notes}
                    </p>
                  ) : null}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Eliminar"
                  onClick={() => onDelete(w.id)}
                >
                  <Trash2 className="h-4 w-4 text-slate-400" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
