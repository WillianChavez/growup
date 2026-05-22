'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FOCUS_OPTIONS,
  FOCUS_LABELS,
  INTENSITY_OPTIONS,
  INTENSITY_LABELS,
} from '@/components/exercise/exercise-labels';
import type { WorkoutFocus, WorkoutFormData, WorkoutIntensity } from '@/types/exercise.types';

interface WorkoutFormProps {
  onSubmit: (data: WorkoutFormData) => Promise<void>;
  isLoading?: boolean;
}

export function WorkoutForm({ onSubmit, isLoading }: WorkoutFormProps) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [date, setDate] = useState(today);
  const [focus, setFocus] = useState<WorkoutFocus>('fuerza');
  const [durationMin, setDurationMin] = useState('');
  const [intensity, setIntensity] = useState<WorkoutIntensity>('medium');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      date,
      focus,
      durationMin: durationMin ? Number(durationMin) : undefined,
      intensity,
      notes: notes.trim() || undefined,
    });
    // Reset (mantiene foco y fecha de hoy)
    setDurationMin('');
    setNotes('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar entrenamiento</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="workout-date">Fecha</Label>
              <Input
                id="workout-date"
                type="date"
                value={date}
                max={today}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Enfoque</Label>
              <Select value={focus} onValueChange={(v) => setFocus(v as WorkoutFocus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FOCUS_OPTIONS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {FOCUS_LABELS[f]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="workout-duration">Duración (min)</Label>
              <Input
                id="workout-duration"
                type="number"
                min={1}
                max={600}
                placeholder="Ej. 60"
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Intensidad</Label>
              <Select value={intensity} onValueChange={(v) => setIntensity(v as WorkoutIntensity)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTENSITY_OPTIONS.map((i) => (
                    <SelectItem key={i} value={i}>
                      {INTENSITY_LABELS[i]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="workout-notes">Notas</Label>
            <Textarea
              id="workout-notes"
              placeholder="¿Qué hiciste? ¿Cómo te sentiste?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
          <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? 'Guardando…' : 'Registrar'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
