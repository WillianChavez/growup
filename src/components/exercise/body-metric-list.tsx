'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MEASUREMENT_FIELDS, MEASUREMENT_LABELS } from '@/components/exercise/exercise-labels';
import type { BodyMetric } from '@/types/exercise.types';

interface BodyMetricListProps {
  metrics: BodyMetric[];
  onDelete: (id: string) => void;
}

export function BodyMetricList({ metrics, onDelete }: BodyMetricListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de mediciones</CardTitle>
      </CardHeader>
      <CardContent>
        {metrics.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Aún no hay mediciones registradas.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {metrics.map((m) => {
              const parts = MEASUREMENT_FIELDS.filter((f) => m[f] !== null).map((f) => {
                const { label, unit } = MEASUREMENT_LABELS[f];
                return `${label}: ${m[f]} ${unit}`;
              });
              return (
                <li key={m.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium capitalize">
                      {format(new Date(m.date), "EEE d 'de' MMM", { locale: es })}
                    </span>
                    <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                      {parts.join('  ·  ')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Eliminar"
                    onClick={() => onDelete(m.id)}
                  >
                    <Trash2 className="h-4 w-4 text-slate-400" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
