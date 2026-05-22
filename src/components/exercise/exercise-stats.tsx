'use client';

import { Dumbbell, Clock, Scale, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { WorkoutWeeklyStats } from '@/types/exercise.types';

interface ExerciseStatsProps {
  weekly: WorkoutWeeklyStats | null;
  currentWeight: number | null;
  targetWeight: number | null;
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
          <p className="text-lg font-semibold">{value}</p>
          {hint ? <p className="text-xs text-slate-400">{hint}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function ExerciseStats({ weekly, currentWeight, targetWeight }: ExerciseStatsProps) {
  const sessions = weekly?.sessionCount ?? 0;
  const target = weekly?.targetPerWeek ?? 5;
  const minutes = weekly?.totalMinutes ?? 0;

  const toGoal =
    currentWeight !== null && targetWeight !== null
      ? Math.max(0, Math.round((currentWeight - targetWeight) * 10) / 10)
      : null;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        icon={<Dumbbell className="h-5 w-5" />}
        label="Esta semana"
        value={`${sessions}/${target}`}
        hint="entrenamientos"
      />
      <StatCard
        icon={<Clock className="h-5 w-5" />}
        label="Minutos (semana)"
        value={`${minutes}`}
        hint="min entrenados"
      />
      <StatCard
        icon={<Scale className="h-5 w-5" />}
        label="Peso actual"
        value={currentWeight !== null ? `${currentWeight} lb` : '—'}
        hint={currentWeight === null ? 'sin registro' : undefined}
      />
      <StatCard
        icon={<Target className="h-5 w-5" />}
        label="Falta para la meta"
        value={toGoal !== null ? `${toGoal} lb` : '—'}
        hint={targetWeight !== null ? `meta ${targetWeight} lb` : 'sin objetivo'}
      />
    </div>
  );
}
