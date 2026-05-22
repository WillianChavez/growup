'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MEASUREMENT_FIELDS, MEASUREMENT_LABELS } from '@/components/exercise/exercise-labels';
import type { BodyMetricField, BodyMetricFormData } from '@/types/exercise.types';

interface BodyMetricFormProps {
  onSubmit: (data: BodyMetricFormData) => Promise<void>;
  isLoading?: boolean;
}

export function BodyMetricForm({ onSubmit, isLoading }: BodyMetricFormProps) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [date, setDate] = useState(today);
  const [values, setValues] = useState<Record<BodyMetricField, string>>({
    weight: '',
    waist: '',
    chest: '',
    hip: '',
    arm: '',
    thigh: '',
  });

  const setField = (field: BodyMetricField, value: string) =>
    setValues((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: BodyMetricFormData = { date };
    for (const field of MEASUREMENT_FIELDS) {
      const raw = values[field];
      if (raw !== '') payload[field] = Number(raw);
    }
    await onSubmit(payload);
    setValues({ weight: '', waist: '', chest: '', hip: '', arm: '', thigh: '' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar peso y medidas</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="metric-date">Fecha</Label>
            <Input
              id="metric-date"
              type="date"
              value={date}
              max={today}
              onChange={(e) => setDate(e.target.value)}
              className="sm:max-w-xs"
            />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {MEASUREMENT_FIELDS.map((field) => (
              <div key={field} className="space-y-2">
                <Label htmlFor={`metric-${field}`}>
                  {MEASUREMENT_LABELS[field].label}{' '}
                  <span className="text-xs text-slate-400">({MEASUREMENT_LABELS[field].unit})</span>
                </Label>
                <Input
                  id={`metric-${field}`}
                  type="number"
                  step="0.1"
                  min={0}
                  placeholder="—"
                  value={values[field]}
                  onChange={(e) => setField(field, e.target.value)}
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Registra al menos un valor. El peso avanza automáticamente los hitos de tu objetivo de
            salud.
          </p>
          <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? 'Guardando…' : 'Guardar medición'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
