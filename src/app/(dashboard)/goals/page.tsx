'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Target,
  Plus,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  Heart,
  BookOpen,
  Wallet,
  Briefcase,
  Users,
  Palette,
  List,
  Kanban,
  GripVertical,
  Rows3,
  GitBranch,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useGoals } from '@/hooks/useGoals';
import { GoalDialog } from '@/components/goals/goal-dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import type { Goal, GoalFormData, GoalCategory, GoalStatus, Milestone } from '@/types/goal.types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useUserStore } from '@/stores/user-store';
import { parseUserSettings, type GoalsViewMode } from '@/lib/user-settings';
import { GoalAccordionItem } from '@/components/goals/goal-accordion-item';
import {
  GoalsRoadmapTimeline,
  navigateTimelineDate,
  type TimelineColumnWidths,
  type TimelineScale,
} from '@/components/goals/goals-roadmap-timeline';

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
  const [viewMode, setViewMode] = useState<GoalsViewMode>('list');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);
  const [draggingGoalId, setDraggingGoalId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<GoalStatus | null>(null);
  const [openAccordionGoalId, setOpenAccordionGoalId] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [timelineScale, setTimelineScale] = useState<TimelineScale>('month');
  const [timelineAnchorDate, setTimelineAnchorDate] = useState(new Date());
  const [timelineColumnWidths, setTimelineColumnWidths] = useState<TimelineColumnWidths>({
    activity: 196,
    from: 78,
    to: 78,
  });
  const hydratedPreferencesRef = useRef(false);
  const timelineColumnsPersistTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { fetchGoals, createGoal, updateGoal, deleteGoal } = useGoals();
  const { user, updateUser } = useUserStore();

  useEffect(() => {
    const loadGoals = async () => {
      try {
        const data = await fetchGoals();
        setGoals(data);
      } finally {
        setIsInitialLoading(false);
      }
    };
    void loadGoals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user || hydratedPreferencesRef.current) {
      return;
    }

    const settings = parseUserSettings(user.settings);
    if (settings.goals?.viewMode) {
      setViewMode(settings.goals.viewMode);
    }
    if (settings.goals?.activeFilter) {
      setFilter(settings.goals.activeFilter);
    }
    if (settings.goals?.timelineColumns) {
      setTimelineColumnWidths(settings.goals.timelineColumns);
    }

    hydratedPreferencesRef.current = true;
  }, [user]);

  const persistGoalsPreferences = useCallback(
    async (
      nextViewMode: GoalsViewMode,
      nextFilter: 'todos' | 'proceso' | 'logrados' | 'pausados',
      nextBoardColumn?: GoalStatus,
      nextTimelineColumns?: TimelineColumnWidths
    ) => {
      try {
        const response = await fetch('/api/auth/preferences', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            goals: {
              viewMode: nextViewMode,
              activeFilter: nextFilter,
              activeBoardColumn: nextBoardColumn,
              timelineColumns: nextTimelineColumns,
            },
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save goals preferences');
        }

        const result = await response.json();
        if (result.success && result.data) {
          updateUser(result.data);
        }
      } catch (error) {
        console.error('Error saving goals preferences:', error);
      }
    },
    [updateUser]
  );

  useEffect(() => {
    if (!hydratedPreferencesRef.current) {
      return;
    }

    if (timelineColumnsPersistTimeoutRef.current) {
      clearTimeout(timelineColumnsPersistTimeoutRef.current);
    }

    timelineColumnsPersistTimeoutRef.current = setTimeout(() => {
      void persistGoalsPreferences(viewMode, filter, undefined, timelineColumnWidths);
    }, 250);

    return () => {
      if (timelineColumnsPersistTimeoutRef.current) {
        clearTimeout(timelineColumnsPersistTimeoutRef.current);
      }
    };
  }, [filter, persistGoalsPreferences, timelineColumnWidths, viewMode]);

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

  const handleMilestonesUpdate = useCallback(
    async (goalId: string, milestones: Goal['milestones']) => {
      const doneCount = milestones?.filter((m) => m.completed).length || 0;
      const totalCount = milestones?.length || 0;
      const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
      const status: GoalStatus =
        progress >= 100 ? 'completed' : progress > 0 ? 'in-progress' : 'not-started';
      const serializedMilestones =
        milestones?.map((milestone) => {
          const { id, ...rest } = milestone;
          void id;
          return rest;
        }) || [];

      const updated = await updateGoal(goalId, {
        milestones: serializedMilestones,
        progress,
        status,
        completedAt: status === 'completed' ? new Date() : null,
      });

      if (!updated) {
        throw new Error('Failed to update milestones');
      }

      setGoals((prev) => prev.map((goal) => (goal.id === goalId ? updated : goal)));
    },
    [updateGoal]
  );

  const handleCompleteGoal = useCallback(
    async (goalId: string) => {
      const updated = await updateGoal(goalId, {
        status: 'completed',
        progress: 100,
        completedAt: new Date(),
      });

      if (!updated) {
        throw new Error('Failed to complete goal');
      }

      setGoals((prev) => prev.map((goal) => (goal.id === goalId ? updated : goal)));
    },
    [updateGoal]
  );

  const handleGoalTimelineChange = useCallback(
    async (
      goalId: string,
      updates: Partial<Pick<Goal, 'targetDate' | 'progress' | 'status' | 'completedAt'>>
    ) => {
      const previousGoal = goals.find((goal) => goal.id === goalId);
      if (!previousGoal) {
        return false;
      }

      const optimisticGoal: Goal = {
        ...previousGoal,
        ...updates,
      };

      setGoals((prev) => prev.map((goal) => (goal.id === goalId ? optimisticGoal : goal)));

      const updated = await updateGoal(goalId, updates);
      if (!updated) {
        setGoals((prev) => prev.map((goal) => (goal.id === goalId ? previousGoal : goal)));
        return false;
      }

      setGoals((prev) => prev.map((goal) => (goal.id === goalId ? updated : goal)));
      return true;
    },
    [goals, updateGoal]
  );

  const handleMilestoneTimelineChange = useCallback(
    async (goalId: string, milestoneId: string, updates: Partial<Milestone>) => {
      const previousGoal = goals.find((item) => item.id === goalId);
      if (!previousGoal || !previousGoal.milestones) {
        return false;
      }

      const nextMilestones = previousGoal.milestones.map((milestone) =>
        milestone.id === milestoneId
          ? {
              ...milestone,
              ...updates,
            }
          : milestone
      );

      const completedCount = nextMilestones.filter((milestone) => milestone.completed).length;
      const progress =
        nextMilestones.length > 0 ? Math.round((completedCount / nextMilestones.length) * 100) : 0;
      const status: GoalStatus =
        progress >= 100 ? 'completed' : progress > 0 ? 'in-progress' : 'not-started';
      const completedAt = status === 'completed' ? new Date() : null;
      const optimisticGoal: Goal = {
        ...previousGoal,
        milestones: nextMilestones,
        progress,
        status,
        completedAt,
      };

      setGoals((prev) =>
        prev.map((goalItem) => (goalItem.id === goalId ? optimisticGoal : goalItem))
      );

      const serializedMilestones = nextMilestones.map((milestone) => {
        const { id, ...rest } = milestone;
        void id;
        return rest;
      });

      const updated = await updateGoal(goalId, {
        milestones: serializedMilestones,
        progress,
        status,
        completedAt,
      });

      if (!updated) {
        setGoals((prev) =>
          prev.map((goalItem) => (goalItem.id === goalId ? previousGoal : goalItem))
        );
        return false;
      }

      setGoals((prev) => prev.map((goalItem) => (goalItem.id === goalId ? updated : goalItem)));
      return true;
    },
    [goals, updateGoal]
  );

  const handleMilestoneCreate = useCallback(
    async (
      goalId: string,
      milestone: {
        title: string;
        startDate: Date;
        targetDate: Date;
      }
    ) => {
      const goal = goals.find((item) => item.id === goalId);
      if (!goal) {
        return false;
      }

      const nextMilestones: GoalFormData['milestones'] = [
        ...((goal.milestones || []).map((milestone) => {
          const { id, ...rest } = milestone;
          void id;
          return rest;
        }) || []),
        {
          title: milestone.title,
          completed: false,
          status: milestone.startDate <= new Date() ? 'in-progress' : 'not-started',
          startDate: milestone.startDate,
          targetDate: milestone.targetDate,
        },
      ];

      const completedCount = nextMilestones.filter((item) => item.completed).length;
      const progress =
        nextMilestones.length > 0 ? Math.round((completedCount / nextMilestones.length) * 100) : 0;
      const nextStatus: GoalStatus =
        progress >= 100
          ? 'completed'
          : progress > 0 || nextMilestones.some((item) => item.status === 'in-progress')
            ? 'in-progress'
            : goal.status;
      const nextCompletedAt = progress >= 100 ? new Date() : null;
      const optimisticGoal: Goal = {
        ...goal,
        milestones: nextMilestones as Milestone[],
        progress,
        status: nextStatus,
        completedAt: nextCompletedAt,
      };

      setGoals((prev) => prev.map((item) => (item.id === goalId ? optimisticGoal : item)));

      const updated = await updateGoal(goalId, {
        milestones: nextMilestones,
        progress,
        status: nextStatus,
        completedAt: nextCompletedAt,
      });

      if (!updated) {
        setGoals((prev) => prev.map((item) => (item.id === goalId ? goal : item)));
        return false;
      }

      setGoals((prev) => prev.map((item) => (item.id === goalId ? updated : item)));
      return true;
    },
    [goals, updateGoal]
  );

  const handleViewModeChange = useCallback(
    (nextViewMode: GoalsViewMode) => {
      setViewMode(nextViewMode);
      void persistGoalsPreferences(nextViewMode, filter);
    },
    [filter, persistGoalsPreferences]
  );

  const handleFilterChange = useCallback(
    (nextFilter: 'todos' | 'proceso' | 'logrados' | 'pausados') => {
      setFilter(nextFilter);
      void persistGoalsPreferences(viewMode, nextFilter);
    },
    [persistGoalsPreferences, viewMode]
  );

  const toggleMilestone = async (goalId: string, milestoneId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal || !goal.milestones) return;

    // Normalizar milestones: asegurar que todos tengan IDs
    const normalizedMilestones = goal.milestones.map((m, idx) => ({
      ...m,
      id: m.id || `${goal.id}-milestone-${idx}`,
    }));

    // Encontrar el milestone y actualizar su estado
    const updatedMilestones = normalizedMilestones.map((m) => {
      if (m.id === milestoneId) {
        return {
          ...m,
          completed: !m.completed,
          completedAt: !m.completed ? new Date() : undefined,
        };
      }
      return m;
    });

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

    // Update in server - enviar array completo con todos los milestones
    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestones: updatedMilestones,
          progress: newProgress,
        }),
      });
      if (!response.ok) throw new Error('Failed to update milestone');
      const result = await response.json();
      // Actualizar con la respuesta del servidor para sincronizar
      if (result.success && result.data) {
        setGoals((prev) => prev.map((g) => (g.id === goalId ? result.data : g)));
      }
    } catch (error) {
      console.error('Error updating milestone:', error);
      // Revertir cambios en caso de error
      const goalsData = await fetchGoals();
      setGoals(goalsData);
    }
  };

  // Filter goals
  const filteredGoals = useMemo(() => {
    if (filter === 'todos') return goals;
    if (filter === 'proceso') return goals.filter((g) => g.status === 'in-progress');
    if (filter === 'logrados') return goals.filter((g) => g.status === 'completed');
    if (filter === 'pausados')
      return goals.filter((g) => g.status === 'not-started' || g.status === 'abandoned');
    return goals;
  }, [goals, filter]);

  const visibleGoals = viewMode === 'list' ? filteredGoals : goals;

  const boardColumns: Array<{ status: GoalStatus; title: string; accent: string }> = useMemo(
    () => [
      {
        status: 'not-started',
        title: 'Por iniciar',
        accent:
          'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200',
      },
      {
        status: 'in-progress',
        title: 'En progreso',
        accent:
          'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-300',
      },
      {
        status: 'completed',
        title: 'Completados',
        accent:
          'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300',
      },
    ],
    []
  );

  const boardGoals = useMemo(() => goals.filter((goal) => goal.status !== 'abandoned'), [goals]);

  const moveGoalToStatus = useCallback(
    async (goalId: string, nextStatus: GoalStatus) => {
      const goal = goals.find((item) => item.id === goalId);
      if (!goal || goal.status === nextStatus) {
        return;
      }

      const updates: Partial<GoalFormData> & { completedAt?: Date | null } = {
        status: nextStatus,
      };

      if (nextStatus === 'completed') {
        updates.progress = 100;
        updates.completedAt = new Date();
      } else if (goal.status === 'completed') {
        updates.completedAt = null;
        if (goal.progress === 100) {
          updates.progress = goal.milestones?.length ? goal.progress : 0;
        }
      }

      setGoals((prev) =>
        prev.map((item) =>
          item.id === goalId
            ? {
                ...item,
                status: nextStatus,
                progress: nextStatus === 'completed' ? 100 : (updates.progress ?? item.progress),
                completedAt:
                  nextStatus === 'completed'
                    ? (updates.completedAt ?? item.completedAt)
                    : goal.status === 'completed'
                      ? null
                      : item.completedAt,
              }
            : item
        )
      );

      try {
        const updated = await updateGoal(goalId, updates);
        if (!updated) {
          throw new Error('Failed to persist moved goal');
        }

        setGoals((prev) => prev.map((item) => (item.id === goalId ? updated : item)));
        void persistGoalsPreferences(viewMode, filter, nextStatus);
      } catch (error) {
        setGoals((prev) => prev.map((item) => (item.id === goalId ? goal : item)));
        console.error('Error moving goal:', error);
      }
    },
    [filter, goals, persistGoalsPreferences, updateGoal, viewMode]
  );

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
        {/* FILTROS */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-h-12">
            {viewMode === 'list' ? (
              <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl self-start w-fit overflow-x-auto">
                {(['todos', 'proceso', 'logrados', 'pausados'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => handleFilterChange(f)}
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
            ) : viewMode === 'timeline' ? (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
                  {(
                    [
                      ['day', 'Día'],
                      ['week', 'Semana'],
                      ['month', 'Mes'],
                      ['quarter', 'Trimestre'],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => setTimelineScale(value)}
                      className={cn(
                        'rounded-xl px-3 py-2 text-xs font-black transition-all',
                        timelineScale === value
                          ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400'
                          : 'text-slate-500 dark:text-slate-400'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="rounded-xl"
                    onClick={() =>
                      setTimelineAnchorDate((current) =>
                        navigateTimelineDate(current, timelineScale, 'prev')
                      )
                    }
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="rounded-xl"
                    onClick={() =>
                      setTimelineAnchorDate((current) =>
                        navigateTimelineDate(current, timelineScale, 'next')
                      )
                    }
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-2 self-start rounded-2xl border border-slate-100 bg-white p-1.5 dark:border-slate-800 dark:bg-slate-900">
            <Button
              type="button"
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              className={cn(
                'rounded-xl',
                viewMode === 'list' && 'bg-indigo-600 hover:bg-indigo-700 text-white'
              )}
              onClick={() => handleViewModeChange('list')}
              aria-label="Vista de lista"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={viewMode === 'board' ? 'default' : 'ghost'}
              size="icon"
              className={cn(
                'rounded-xl',
                viewMode === 'board' && 'bg-indigo-600 hover:bg-indigo-700 text-white'
              )}
              onClick={() => handleViewModeChange('board')}
              aria-label="Vista tipo board"
            >
              <Kanban className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={viewMode === 'accordion' ? 'default' : 'ghost'}
              size="icon"
              className={cn(
                'rounded-xl',
                viewMode === 'accordion' && 'bg-indigo-600 hover:bg-indigo-700 text-white'
              )}
              onClick={() => handleViewModeChange('accordion')}
              aria-label="Vista acordeón"
            >
              <Rows3 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={viewMode === 'timeline' ? 'default' : 'ghost'}
              size="icon"
              className={cn(
                'rounded-xl',
                viewMode === 'timeline' && 'bg-indigo-600 hover:bg-indigo-700 text-white'
              )}
              onClick={() => handleViewModeChange('timeline')}
              aria-label="Vista timeline"
            >
              <GitBranch className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* LISTA DE OBJETIVOS (GRID INTELIGENTE) */}
        {isInitialLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-80 w-full rounded-[2.8rem]" />
            ))}
          </div>
        ) : viewMode === 'list' && filteredGoals.length === 0 ? (
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
        ) : viewMode === 'list' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {filteredGoals.map((goal) => {
              const config = categoryConfig[goal.category] ?? categoryConfig['other'];
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="text-slate-300 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400">
                            <MoreHorizontal size={20} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenDialog(goal)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setGoalToDelete(goal.id);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
                    {(() => {
                      // Normalizar milestones: asegurar que todos tengan IDs
                      const normalizedMilestones = milestones.map((m, idx) => ({
                        ...m,
                        id: m.id || `${goal.id}-milestone-${idx}`,
                      }));

                      return normalizedMilestones.length > 0 ? (
                        <div className="space-y-3 mb-6 sm:mb-8">
                          {normalizedMilestones.map((milestone) => (
                            <button
                              key={milestone.id}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                void toggleMilestone(goal.id, milestone.id);
                              }}
                              className={cn(
                                'w-full flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer text-left',
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
                            </button>
                          ))}
                        </div>
                      ) : null;
                    })()}
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
        ) : viewMode === 'board' ? (
          <div className="overflow-x-auto pb-12">
            <div className="grid min-w-[1024px] grid-cols-3 items-start gap-6">
              {boardColumns.map((column) => {
                const columnGoals = boardGoals.filter((goal) => goal.status === column.status);

                return (
                  <div
                    key={column.status}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDragOverStatus(column.status);
                    }}
                    onDragLeave={() => {
                      if (dragOverStatus === column.status) {
                        setDragOverStatus(null);
                      }
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      const goalId = event.dataTransfer.getData('text/plain');
                      setDragOverStatus(null);
                      setDraggingGoalId(null);
                      if (goalId) {
                        void moveGoalToStatus(goalId, column.status);
                      }
                    }}
                    className={cn(
                      'min-h-[460px] rounded-[2rem] border border-dashed p-5 sm:p-6 transition-all',
                      dragOverStatus === column.status
                        ? 'border-indigo-400 bg-indigo-50/80 shadow-sm dark:border-indigo-500 dark:bg-indigo-950/20'
                        : 'border-slate-200 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-900/80'
                    )}
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <div
                        className={cn(
                          'inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em]',
                          column.accent
                        )}
                      >
                        {column.title}
                      </div>
                      <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                        {columnGoals.length}
                      </span>
                    </div>

                    <div className="space-y-4">
                      {columnGoals.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 px-4 py-8 text-center text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-500">
                          Suelta un objetivo aquí
                        </div>
                      ) : (
                        columnGoals.map((goal) => {
                          const config = categoryConfig[goal.category] ?? categoryConfig['other'];
                          const IconComponent = config.icon;
                          const deadline = formatDeadline(goal.targetDate);
                          const milestones = goal.milestones || [];
                          const completedMilestones = milestones.filter((m) => m.completed).length;

                          return (
                            <div
                              key={goal.id}
                              draggable
                              onDragStart={(event) => {
                                event.dataTransfer.setData('text/plain', goal.id);
                                event.dataTransfer.effectAllowed = 'move';
                                setDraggingGoalId(goal.id);
                              }}
                              onDragEnd={() => {
                                setDraggingGoalId(null);
                                setDragOverStatus(null);
                              }}
                              className={cn(
                                'rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition-all dark:border-slate-800 dark:bg-slate-950/90',
                                draggingGoalId === goal.id && 'opacity-60 scale-[0.98]'
                              )}
                            >
                              <div className="mb-4 flex items-start gap-4">
                                <div className="mt-0.5 shrink-0 cursor-grab text-slate-300 dark:text-slate-600">
                                  <GripVertical className="h-4 w-4" />
                                </div>
                                <div
                                  className={cn(
                                    'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg',
                                    config.bgColor
                                  )}
                                >
                                  <IconComponent size={20} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="mb-2 flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <p className="line-clamp-2 text-sm font-black leading-5 text-slate-900 dark:text-white">
                                        {goal.title}
                                      </p>
                                      {goal.description && (
                                        <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                                          {goal.description}
                                        </p>
                                      )}
                                    </div>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <button className="shrink-0 text-slate-300 transition-colors hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400">
                                          <MoreHorizontal size={18} />
                                        </button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleOpenDialog(goal)}>
                                          <Pencil className="mr-2 h-4 w-4" />
                                          Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setGoalToDelete(goal.id);
                                            setDeleteDialogOpen(true);
                                          }}
                                          className="text-red-600 focus:text-red-600"
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Eliminar
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>

                                  <div className="mb-3 flex flex-wrap items-center gap-2">
                                    <span
                                      className={cn(
                                        'rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide',
                                        config.color === 'rose' &&
                                          'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400',
                                        config.color === 'indigo' &&
                                          'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
                                        config.color === 'emerald' &&
                                          'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
                                        config.color === 'pink' &&
                                          'bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400',
                                        config.color === 'purple' &&
                                          'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
                                        config.color === 'slate' &&
                                          'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                      )}
                                    >
                                      {config.label}
                                    </span>
                                    {deadline && (
                                      <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                                        {deadline}
                                      </span>
                                    )}
                                  </div>

                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                      <span>{Math.round(goal.progress)}%</span>
                                      <span>
                                        {completedMilestones}/{milestones.length || 0} hitos
                                      </span>
                                    </div>
                                    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                                      <div
                                        className="h-full rounded-full bg-indigo-500 transition-all dark:bg-indigo-400"
                                        style={{ width: `${goal.progress}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : viewMode === 'accordion' ? (
          <div className="space-y-4">
            {visibleGoals.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-[2.8rem] p-12 sm:p-16 text-center border border-slate-100 dark:border-slate-800">
                <div className="relative mb-6 inline-block">
                  <div className="absolute inset-0 bg-linear-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-full blur-2xl" />
                  <Target className="relative h-20 w-20 text-indigo-500 dark:text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  No hay objetivos en esta categoría
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                  Ajusta el filtro o crea un nuevo objetivo para comenzar.
                </p>
                <Button
                  onClick={() => handleOpenDialog()}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Objetivo
                </Button>
              </div>
            ) : (
              visibleGoals.map((goal) => (
                <GoalAccordionItem
                  key={goal.id}
                  goal={goal}
                  isOpen={openAccordionGoalId === goal.id}
                  onToggle={() =>
                    setOpenAccordionGoalId((current) => (current === goal.id ? null : goal.id))
                  }
                  onEdit={handleOpenDialog}
                  onDelete={(goalId) => {
                    setGoalToDelete(goalId);
                    setDeleteDialogOpen(true);
                  }}
                  onMilestoneToggle={handleMilestonesUpdate}
                  onCompleteGoal={handleCompleteGoal}
                />
              ))
            )}
          </div>
        ) : (
          <GoalsRoadmapTimeline
            goals={visibleGoals}
            scale={timelineScale}
            anchorDate={timelineAnchorDate}
            columnWidths={timelineColumnWidths}
            onColumnWidthsChange={setTimelineColumnWidths}
            onScaleChange={setTimelineScale}
            onAnchorDateChange={setTimelineAnchorDate}
            onGoalClick={handleOpenDialog}
            onGoalTimelineChange={handleGoalTimelineChange}
            onMilestoneTimelineChange={handleMilestoneTimelineChange}
            onMilestoneCreate={handleMilestoneCreate}
          />
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
