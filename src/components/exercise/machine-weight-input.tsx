'use client';

import { useState } from 'react';
import { LoaderCircle, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ExerciseWeightRecord, WeightUnit } from '@/types/exercise.types';

interface ExerciseWeightInputProps {
  exerciseName: string;
  label?: string;
  latestRecord?: ExerciseWeightRecord;
  recordCount: number;
  isSaving: boolean;
  onSave: (weight: number, unit: WeightUnit) => Promise<boolean>;
}

function formatRecordDate(value: string) {
  return new Intl.DateTimeFormat('es-SV', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function ExerciseWeightInput({
  exerciseName,
  label = 'Peso levantado',
  latestRecord,
  recordCount,
  isSaving,
  onSave,
}: ExerciseWeightInputProps) {
  const [weight, setWeight] = useState('');
  const [unit, setUnit] = useState<WeightUnit>(latestRecord?.unit ?? 'kg');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const numericWeight = Number(weight);
    if (!Number.isFinite(numericWeight) || numericWeight <= 0) return;

    if (await onSave(numericWeight, unit)) setWeight('');
  };

  return (
    <div className="border-t pt-2.5">
      {latestRecord && (
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <p className="line-clamp-1 text-[11px] text-slate-500 dark:text-slate-400">
            Último:{' '}
            <strong className="text-slate-700 dark:text-slate-200">
              {latestRecord.weight} {latestRecord.unit}
            </strong>
            {' · '}
            {formatRecordDate(latestRecord.recordedAt)}
          </p>
          <span
            className="shrink-0 rounded-full bg-violet-50 px-1.5 py-0.5 text-[9px] font-medium text-violet-700 dark:bg-violet-950 dark:text-violet-300"
            title={`${recordCount} ${recordCount === 1 ? 'registro' : 'registros'}`}
          >
            {recordCount} reg.
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-1.5">
        <Input
          type="number"
          inputMode="decimal"
          min="0.1"
          max="2000"
          step="0.1"
          required
          aria-label={`${label} en ${exerciseName}`}
          placeholder="Peso"
          value={weight}
          onChange={(event) => setWeight(event.target.value)}
          disabled={isSaving}
          className="h-8 min-w-0 flex-1 text-xs"
        />
        <select
          aria-label={`Unidad de peso para ${exerciseName}`}
          value={unit}
          onChange={(event) => setUnit(event.target.value as WeightUnit)}
          disabled={isSaving}
          className="h-8 rounded-md border border-input bg-transparent px-2 text-xs shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
        >
          <option value="kg">kg</option>
          <option value="lb">lb</option>
        </select>
        <Button
          type="submit"
          size="icon-sm"
          disabled={isSaving || !weight || Number(weight) <= 0}
          aria-label={`Guardar peso para ${exerciseName}`}
          title="Guardar peso"
          className="bg-violet-600 text-white hover:bg-violet-700"
        >
          {isSaving ? <LoaderCircle className="animate-spin" /> : <Save />}
        </Button>
      </form>
    </div>
  );
}
