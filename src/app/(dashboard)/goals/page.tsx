'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Target,
  Plus,
  CheckCircle2,
  Clock,
  Trophy,
  MoreHorizontal,
  TrendingUp,
  Zap,
  Heart,
  BookOpen,
  Wallet,
  Briefcase,
  Users,
  Palette,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGoals } from '@/hooks/useGoals';
import { GoalDialog } from '@/components/goals/goal-dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import type { Goal, GoalFormData, GoalCategory } from '@/types/goal.types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Mapeo de categorías a iconos y colores
const categoryConfig: Record<
  GoalCategory,
  {
    icon: React.ComponentType<{ size?: number; className?: string }>;
    color: string;
    bgColor: string;
    textColor: string;
    label: string;
  }
> = {
  personal: {
    icon: Heart,
    color: 'rose',
    bgColor: 'bg-rose-500 dark:bg-rose-600',
    textColor: 'text-rose-600 dark:text-rose-400',
    label: 'Personal',
  },
  professional: {
    icon: Briefcase,
    color: 'indigo',
    bgColor: 'bg-indigo-500 dark:bg-indigo-600',
    textColor: 'text-indigo-600 dark:text-indigo-400',
    label: 'Profesional',
  },
  health: {
    icon: Heart,
    color: 'emerald',
    bgColor: 'bg-emerald-500 dark:bg-emerald-600',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    label: 'Salud',
  },
  financial: {
    icon: Wallet,
    color: 'emerald',
    bgColor: 'bg-emerald-500 dark:bg-emerald-600',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    label: 'Finanzas',
  },
  relationships: {
    icon: Users,
    color: 'pink',
    bgColor: 'bg-pink-500 dark:bg-pink-600',
    textColor: 'text-pink-600 dark:text-pink-400',
    label: 'Relaciones',
  },
  learning: {
    icon: BookOpen,
    color: 'indigo',
    bgColor: 'bg-indigo-500 dark:bg-indigo-600',
    textColor: 'text-indigo-600 dark:text-indigo-400',
    label: 'Lectura',
  },
  creative: {
    icon: Palette,
    color: 'purple',
    bgColor: 'bg-purple-500 dark:bg-purple-600',
    textColor: 'text-purple-600 dark:text-purple-400',
    label: 'Creatividad',
  },
  other: {
    icon: Target,
    color: 'slate',
    bgColor: 'bg-slate-500 dark:bg-slate-600',
    textColor: 'text-slate-600 dark:text-slate-400',
    label: 'Otro',
  },
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [filter, setFilter] = useState<'todos' | 'proceso' | 'logrados' | 'pausados'>('todos');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);
  const { fetchGoals, createGoal, updateGoal, deleteGoal, isLoading } = useGoals();

  useEffect(() => {
    const loadGoals = async () => {
      const data = await fetchGoals();
      setGoals(data);
    };
    void loadGoals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenDialog = (goal?: Goal) => {
    setEditingGoal(goal);
    setDialogOpen(true);
  };

  const handleSaveGoal = async (data: GoalFormData) => {
    if (editingGoal) {
      await updateGoal(editingGoal.id, data);
    } else {
      await createGoal(data);
    }
    const goalsData = await fetchGoals();
    setGoals(goalsData);
  };

  const handleConfirmDelete = async () => {
    if (goalToDelete) {
      await deleteGoal(goalToDelete);
      const goalsData = await fetchGoals();
      setGoals(goalsData);
      setGoalToDelete(null);
    }
  };

  const toggleMilestone = async (goalId: string, milestoneId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal || !goal.milestones) return;

    const updatedMilestones = goal.milestones.map((m) =>
      m.id === milestoneId
        ? { ...m, completed: !m.completed, completedAt: !m.completed ? new Date() : undefined }
        : m
    );

    const doneCount = updatedMilestones.filter((m) => m.completed).length;
    const newProgress =
      updatedMilestones.length > 0
        ? Math.round((doneCount / updatedMilestones.length) * 100)
        : goal.progress;

    // Optimistic update
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId
          ? {
              ...g,
              milestones: updatedMilestones,
              progress: newProgress,
            }
          : g
      )
    );

    // Update in server
    try {
      await updateGoal(goalId, { milestones: updatedMilestones, progress: newProgress });
    } catch (error) {
      console.error('Error updating milestone:', error);
      const goalsData = await fetchGoals();
      setGoals(goalsData);
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    const completedThisMonth = goals.filter((g) => {
      if (g.status !== 'completed' || !g.completedAt) return false;
      const completedDate = new Date(g.completedAt);
      const now = new Date();
      return (
        completedDate.getMonth() === now.getMonth() &&
        completedDate.getFullYear() === now.getFullYear()
      );
    }).length;

    const totalProgress =
      goals.length > 0
        ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)
        : 0;

    // Calcular días de racha (simplificado - placeholder)
    const activeGoals = goals.filter((g) => g.status === 'in-progress');
    const streakDays = activeGoals.length > 0 ? 12 : 0;

    return {
      completedThisMonth,
      averageProgress: totalProgress,
      streakDays,
    };
  }, [goals]);

  // Filter goals
  const filteredGoals = useMemo(() => {
    if (filter === 'todos') return goals;
    if (filter === 'proceso') return goals.filter((g) => g.status === 'in-progress');
    if (filter === 'logrados') return goals.filter((g) => g.status === 'completed');
    if (filter === 'pausados')
      return goals.filter((g) => g.status === 'not-started' || g.status === 'abandoned');
    return goals;
  }, [goals, filter]);

  const formatDeadline = (date: Date | null) => {
    if (!date) return null;
    return format(new Date(date), 'MMM yyyy', { locale: es });
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* HEADER DE OBJETIVOS */}
      <header className="shrink-0 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-[0.3em]">
              <Target size={16} />
              Propósito & Metas
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Mis Objetivos
            </h1>
            <p className="text-sm text-slate-400 dark:text-slate-500 font-medium max-w-md">
              Visualiza tus ambiciones y divide tus sueños en pasos accionables.
            </p>
          </div>

          <button
            onClick={() => handleOpenDialog()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 dark:shadow-indigo-900/50 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 w-full md:w-auto"
          >
            <Plus size={18} strokeWidth={3} /> NUEVO OBJETIVO
          </button>
        </div>
      </header>

      {/* Contenido */}
      <div className="space-y-6 lg:space-y-8">
        {/* RESUMEN DE LOGROS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {[
            {
              label: 'Logrados este mes',
              val: String(stats.completedThisMonth),
              icon: Trophy,
              color: 'text-amber-500 dark:text-amber-400',
              bg: 'bg-amber-50 dark:bg-amber-900/20',
            },
            {
              label: 'Productividad promedio',
              val: `${stats.averageProgress}%`,
              icon: Zap,
              color: 'text-indigo-500 dark:text-indigo-400',
              bg: 'bg-indigo-50 dark:bg-indigo-900/20',
            },
            {
              label: 'Días de racha',
              val: String(stats.streakDays),
              icon: TrendingUp,
              color: 'text-rose-500 dark:text-rose-400',
              bg: 'bg-rose-50 dark:bg-rose-900/20',
            },
          ].map((s, i) => {
            const IconComponent = s.icon;
            return (
              <div
                key={i}
                className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 sm:gap-5"
              >
                <div
                  className={cn(
                    'w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0',
                    s.bg,
                    s.color
                  )}
                >
                  <IconComponent size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white leading-none">
                    {s.val}
                  </p>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    {s.label}
                  </p>
                </div>
              </div>
            );
          })}
        </section>

        {/* FILTROS */}
        <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl self-start w-fit overflow-x-auto">
          {(['todos', 'proceso', 'logrados', 'pausados'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-4 sm:px-6 py-2 rounded-xl text-xs font-black capitalize whitespace-nowrap transition-all',
                filter === f
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {/* LISTA DE OBJETIVOS (GRID INTELIGENTE) */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-80 w-full rounded-[2.8rem]" />
            ))}
          </div>
        ) : filteredGoals.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-[2.8rem] p-12 sm:p-16 text-center border border-slate-100 dark:border-slate-800">
            <div className="relative mb-6 inline-block">
              <div className="absolute inset-0 bg-linear-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-full blur-2xl" />
              <Target className="relative h-20 w-20 text-indigo-500 dark:text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              No hay objetivos en esta categoría
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              {filter === 'todos'
                ? 'Comienza tu viaje hacia el éxito definiendo tu primera meta.'
                : filter === 'proceso'
                  ? 'No hay objetivos en proceso actualmente.'
                  : filter === 'logrados'
                    ? '¡Excelente trabajo! Los objetivos completados aparecerán aquí.'
                    : 'No hay objetivos pausados.'}
            </p>
            {filter !== 'logrados' && (
              <Button
                onClick={() => handleOpenDialog()}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Crear Objetivo
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {filteredGoals.map((goal) => {
              const config = categoryConfig[goal.category];
              const IconComponent = config.icon;
              const deadline = formatDeadline(goal.targetDate);
              const milestones = goal.milestones || [];
              const completedMilestones = milestones.filter((m) => m.completed).length;

              return (
                <div
                  key={goal.id}
                  className="bg-white dark:bg-slate-900 rounded-[2.8rem] p-6 sm:p-8 shadow-sm border border-slate-50 dark:border-slate-800 flex flex-col group hover:shadow-2xl hover:shadow-indigo-500/5 transition-all relative overflow-hidden"
                >
                  {/* Header de Tarjeta */}
                  <div className="flex justify-between items-start mb-6">
                    <div
                      className={cn(
                        'w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shadow-lg text-white',
                        config.bgColor
                      )}
                    >
                      <IconComponent size={24} />
                    </div>
                    <div className="flex gap-2 items-center">
                      <span
                        className={cn(
                          'px-3 sm:px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter',
                          config.color === 'rose' &&
                            'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400',
                          config.color === 'indigo' &&
                            'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
                          config.color === 'emerald' &&
                            'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
                          config.color === 'pink' &&
                            'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400',
                          config.color === 'purple' &&
                            'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
                          config.color === 'slate' &&
                            'bg-slate-50 dark:bg-slate-900/20 text-slate-600 dark:text-slate-400'
                        )}
                      >
                        {config.label}
                      </span>
                      <button
                        onClick={() => handleOpenDialog(goal)}
                        className="text-slate-300 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400"
                      >
                        <MoreHorizontal size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-tight mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {goal.title}
                    </h3>
                    <div className="flex items-center gap-4 text-slate-400 dark:text-slate-500 mb-6 sm:mb-8 flex-wrap">
                      {deadline && (
                        <div className="flex items-center gap-1.5 text-xs font-bold">
                          <Clock size={14} /> {deadline}
                        </div>
                      )}
                      {milestones.length > 0 && (
                        <div className="flex items-center gap-1.5 text-xs font-bold">
                          <CheckCircle2
                            size={14}
                            className="text-emerald-500 dark:text-emerald-400"
                          />{' '}
                          {completedMilestones} / {milestones.length} Pasos
                        </div>
                      )}
                    </div>

                    {/* HITOS (Sub-tareas) */}
                    {milestones.length > 0 && (
                      <div className="space-y-3 mb-6 sm:mb-8">
                        {milestones.map((milestone, milestoneIndex) => {
                          const milestoneId =
                            milestone.id || `${goal.id}-milestone-${milestoneIndex}`;
                          return (
                            <div
                              key={milestoneId}
                              onClick={() => toggleMilestone(goal.id, milestoneId)}
                              className={cn(
                                'flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer',
                                milestone.completed
                                  ? 'bg-slate-50 dark:bg-slate-800 border-transparent opacity-60'
                                  : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-indigo-100 dark:hover:border-indigo-900/50'
                              )}
                            >
                              <div
                                className={cn(
                                  'w-5 h-5 rounded-md flex items-center justify-center transition-all shrink-0',
                                  milestone.completed
                                    ? 'bg-indigo-500 dark:bg-indigo-600 text-white'
                                    : 'border-2 border-slate-200 dark:border-slate-700'
                                )}
                              >
                                {milestone.completed && <CheckCircle2 size={12} strokeWidth={4} />}
                              </div>
                              <span
                                className={cn(
                                  'text-xs font-bold flex-1',
                                  milestone.completed
                                    ? 'line-through text-slate-400 dark:text-slate-500'
                                    : 'text-slate-600 dark:text-slate-300'
                                )}
                              >
                                {milestone.title}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* BARRA DE PROGRESO INFERIOR */}
                  <div className="mt-auto pt-6 border-t border-slate-50 dark:border-slate-800">
                    <div className="flex justify-between items-end mb-3">
                      <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">
                        Progreso total
                      </p>
                      <p className="text-lg font-black text-slate-800 dark:text-white">
                        {Math.round(goal.progress)}%
                      </p>
                    </div>
                    <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 dark:bg-indigo-600 transition-all duration-700 ease-out"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* TARJETA VACÍA "AGREGAR" */}
            <button
              onClick={() => handleOpenDialog()}
              className="border-4 border-dashed border-slate-200 dark:border-slate-700 rounded-[2.8rem] flex flex-col items-center justify-center p-8 sm:p-12 text-slate-300 dark:text-slate-600 hover:text-indigo-500 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all group"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-dashed border-current flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Plus size={28} strokeWidth={3} />
              </div>
              <p className="font-black text-sm uppercase tracking-[0.2em]">Nuevo Desafío</p>
            </button>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <GoalDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingGoal(undefined);
        }}
        goal={editingGoal}
        onSave={handleSaveGoal}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="¿Eliminar objetivo?"
        description="Esta acción no se puede deshacer. Se eliminará el objetivo y todos sus hitos asociados."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
