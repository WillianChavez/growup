'use client';

import { useCallback, useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useConfirm } from '@/hooks/useConfirm';
import { useWorkouts } from '@/hooks/useWorkouts';
import { useBodyMetrics } from '@/hooks/useBodyMetrics';
import { ExerciseStats } from '@/components/exercise/exercise-stats';
import { WorkoutForm } from '@/components/exercise/workout-form';
import { WorkoutList } from '@/components/exercise/workout-list';
import { BodyMetricForm } from '@/components/exercise/body-metric-form';
import { BodyMetricList } from '@/components/exercise/body-metric-list';
import { WeightEvolutionChart } from '@/components/exercise/weight-evolution-chart';
import { MeasurementsChart } from '@/components/exercise/measurements-chart';
import type {
  BodyMetric,
  BodyMetricFormData,
  WorkoutSession,
  WorkoutFormData,
  WorkoutWeeklyStats,
} from '@/types/exercise.types';

interface GoalMilestoneLite {
  title: string;
}
interface GoalLite {
  category: string;
  status: string;
  milestones: GoalMilestoneLite[] | null;
}

function parseWeightTargets(goals: GoalLite[]): { target: number | null; start: number | null } {
  const health =
    goals.find(
      (g) => g.category === 'health' && g.status !== 'completed' && g.status !== 'abandoned'
    ) || goals.find((g) => g.category === 'health');
  if (!health || !health.milestones) return { target: null, start: null };

  const re = /(\d+(?:\.\d+)?)\s*lb/i;
  const nums = health.milestones
    .map((m) => {
      const match = m.title.match(re);
      return match ? parseFloat(match[1]) : null;
    })
    .filter((n): n is number => n !== null);

  if (nums.length === 0) return { target: null, start: null };
  return { target: Math.min(...nums), start: Math.max(...nums) };
}

export default function ExercisePage() {
  const {
    fetchWorkouts,
    fetchWeeklyStats,
    createWorkout,
    deleteWorkout,
    isLoading: workoutLoading,
  } = useWorkouts();
  const { fetchMetrics, saveMetric, deleteMetric, isLoading: metricLoading } = useBodyMetrics();
  const { isOpen, options, confirm, handleConfirm, handleCancel } = useConfirm();

  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [metrics, setMetrics] = useState<BodyMetric[]>([]);
  const [weekly, setWeekly] = useState<WorkoutWeeklyStats | null>(null);
  const [targetWeight, setTargetWeight] = useState<number | null>(null);

  const loadWorkouts = useCallback(async () => {
    const [list, stats] = await Promise.all([fetchWorkouts(), fetchWeeklyStats()]);
    setWorkouts(list);
    setWeekly(stats);
  }, [fetchWorkouts, fetchWeeklyStats]);

  const loadMetrics = useCallback(async () => {
    setMetrics(await fetchMetrics());
  }, [fetchMetrics]);

  const loadGoal = useCallback(async () => {
    try {
      const response = await fetch('/api/goals');
      if (!response.ok) return;
      const result = await response.json();
      const { target } = parseWeightTargets(result.data || []);
      setTargetWeight(target);
    } catch {
      // silencioso: el módulo funciona sin objetivo vinculado
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      await Promise.all([loadWorkouts(), loadMetrics(), loadGoal()]);
    };
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateWorkout = async (data: WorkoutFormData) => {
    const created = await createWorkout(data);
    if (created) await loadWorkouts();
  };

  const handleDeleteWorkout = async (id: string) => {
    const ok = await confirm({
      title: 'Eliminar entrenamiento',
      description: '¿Seguro que quieres eliminar este registro?',
      variant: 'destructive',
      confirmText: 'Eliminar',
    });
    if (!ok) return;
    if (await deleteWorkout(id)) await loadWorkouts();
  };

  const handleSaveMetric = async (data: BodyMetricFormData) => {
    const saved = await saveMetric(data);
    if (saved) {
      await loadMetrics();
      // El peso pudo haber avanzado hitos del objetivo: refrescar meta.
      await loadGoal();
    }
  };

  const handleDeleteMetric = async (id: string) => {
    const ok = await confirm({
      title: 'Eliminar medición',
      description: '¿Seguro que quieres eliminar esta medición?',
      variant: 'destructive',
      confirmText: 'Eliminar',
    });
    if (!ok) return;
    if (await deleteMetric(id)) await loadMetrics();
  };

  const currentWeight =
    metrics.find((m) => m.weight !== null && m.weight !== undefined)?.weight ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ejercicio</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Registra tus entrenamientos, peso y medidas, y sigue tu evolución.
        </p>
      </div>

      <ExerciseStats weekly={weekly} currentWeight={currentWeight} targetWeight={targetWeight} />

      <Tabs defaultValue="workouts">
        <TabsList>
          <TabsTrigger value="workouts">Entrenamientos</TabsTrigger>
          <TabsTrigger value="metrics">Peso y medidas</TabsTrigger>
          <TabsTrigger value="evolution">Evolución</TabsTrigger>
        </TabsList>

        <TabsContent value="workouts" className="space-y-4">
          <WorkoutForm onSubmit={handleCreateWorkout} isLoading={workoutLoading} />
          <WorkoutList workouts={workouts} onDelete={handleDeleteWorkout} />
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <BodyMetricForm onSubmit={handleSaveMetric} isLoading={metricLoading} />
          <BodyMetricList metrics={metrics} onDelete={handleDeleteMetric} />
        </TabsContent>

        <TabsContent value="evolution" className="space-y-4">
          <WeightEvolutionChart metrics={metrics} targetWeight={targetWeight} />
          <MeasurementsChart metrics={metrics} />
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) handleCancel();
        }}
        title={options.title}
        description={options.description}
        confirmText={options.confirmText}
        cancelText={options.cancelText}
        variant={options.variant}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
