'use client';

import { useState } from 'react';
import { LoaderCircle, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type {
  ExerciseRecordUnit,
  ExerciseTracking,
  ExerciseWeightRecord,
  WeightUnit,
} from '@/types/exercise.types';

interface ExerciseWeightInputProps {
  exerciseName: string;
  label?: string;
  tracking?: ExerciseTracking;
  latestRecord?: ExerciseWeightRecord;
  recordCount: number;
  isSaving: boolean;
  onSave: (value: number, unit: ExerciseRecordUnit) => Promise<boolean>;
}

/** Textos y límites del campo según lo que se registre en cada ejercicio. */
const TRACKING_CONFIG: Record<
  ExerciseTracking,
  { label: string; placeholder: string; min: string; max: string; step: string; suffix: string }
> = {
  weight: {
    label: 'Peso levantado',
    placeholder: 'Peso',
    min: '0.1',
    max: '2000',
    step: '0.1',
    suffix: '',
  },
  reps: {
    label: 'Repeticiones por set',
    placeholder: 'Reps',
    min: '1',
    max: '500',
    step: '1',
    suffix: 'reps',
  },
  minutes: {
    label: 'Minutos de sesión',
    placeholder: 'Minutos',
    min: '1',
    max: '600',
    step: '1',
    suffix: 'min',
  },
};

function formatRecordDate(value: string) {
  return new Intl.DateTimeFormat('es-SV', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function ExerciseWeightInput({
  exerciseName,
  label,
  tracking = 'weight',
  latestRecord,
  recordCount,
  isSaving,
  onSave,
}: ExerciseWeightInputProps) {
  const config = TRACKING_CONFIG[tracking];
  const [value, setValue] = useState('');
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(() =>
    latestRecord?.unit === 'lb' ? 'lb' : 'kg'
  );

  const fieldLabel = label ?? config.label;
  const isWeightMode = tracking === 'weight';

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue <= 0) return;
    if (!isWeightMode && !Number.isInteger(numericValue)) return;

    const unit: ExerciseRecordUnit = isWeightMode
      ? weightUnit
      : tracking === 'reps'
        ? 'reps'
        : 'min';

    if (await onSave(numericValue, unit)) setValue('');
  };

  const isInvalid =
    !value ||
    Number(value) <= 0 ||
    (!isWeightMode && !Number.isInteger(Number(value))) ||
    Number(value) > Number(config.max);

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
          inputMode={isWeightMode ? 'decimal' : 'numeric'}
          min={config.min}
          max={config.max}
          step={config.step}
          required
          aria-label={`${fieldLabel} en ${exerciseName}`}
          placeholder={config.placeholder}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          disabled={isSaving}
          className="h-8 min-w-0 flex-1 text-xs"
        />
        {isWeightMode ? (
          <select
            aria-label={`Unidad de peso para ${exerciseName}`}
            value={weightUnit}
            onChange={(event) => setWeightUnit(event.target.value as WeightUnit)}
            disabled={isSaving}
            className="h-8 rounded-md border border-input bg-transparent px-2 text-xs shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
          >
            <option value="kg">kg</option>
            <option value="lb">lb</option>
          </select>
        ) : (
          <span className="flex h-8 shrink-0 items-center rounded-md border border-input px-2 text-xs text-slate-500 dark:text-slate-400">
            {config.suffix}
          </span>
        )}
        <Button
          type="submit"
          size="icon-sm"
          disabled={isSaving || isInvalid}
          aria-label={`Guardar ${fieldLabel.toLowerCase()} para ${exerciseName}`}
          title={`Guardar ${fieldLabel.toLowerCase()}`}
          className="bg-violet-600 text-white hover:bg-violet-700"
        >
          {isSaving ? <LoaderCircle className="animate-spin" /> : <Save />}
        </Button>
      </form>
    </div>
  );
}
