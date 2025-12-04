'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Target, CheckCircle2, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGoals } from '@/hooks/useGoals';
import { GoalDialog } from '@/components/goals/goal-dialog';
import { GoalAccordionItem } from '@/components/goals/goal-accordion-item';
import { GoalsCalendar } from '@/components/goals/goals-calendar';
import type { Goal, GoalFormData, Milestone } from '@/types/goal.types';

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [activeTab, setActiveTab] = useState('list');
  const [filterTab, setFilterTab] = useState('active');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>();
  const [openGoals, setOpenGoals] = useState<Set<string>>(new Set());
  const { fetchGoals, createGoal, updateGoal, deleteGoal, isLoading } = useGoals();

  const loadGoals = async () => {
    const data = await fetchGoals();
    setGoals(data);
  };

  useEffect(() => {
    loadGoals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenDialog = useCallback((goal?: Goal) => {
    setEditingGoal(goal);
    setDialogOpen(true);
  }, []);

  const handleSaveGoal = useCallback(async (data: GoalFormData) => {
    if (editingGoal) {
      await updateGoal(editingGoal.id, data);
    } else {
      await createGoal(data);
    }
    await loadGoals();
  }, [editingGoal, updateGoal, createGoal]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDeleteGoal = useCallback(async (goalId: string) => {
    if (confirm('¿Estás seguro de eliminar esta meta?')) {
      await deleteGoal(goalId);
      await loadGoals();
    }
  }, [deleteGoal]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleGoal = useCallback((goalId: string) => {
    setOpenGoals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(goalId)) {
        newSet.delete(goalId);
      } else {
        newSet.add(goalId);
      }
      return newSet;
    });
  }, []);

  const handleMilestoneToggle = useCallback(async (goalId: string, milestones: Milestone[]) => {
    // Actualizar el estado local inmediatamente (optimistic update)
    // Preservar la referencia del objeto goal si solo cambian las milestones
    setGoals(prevGoals => {
      const newGoals = prevGoals.map(g => {
        if (g.id !== goalId) return g; // Mantener referencia para otros goals
        
        const newProgress = milestones.length > 0 
          ? Math.round((milestones.filter(m => m.completed).length / milestones.length) * 100) 
          : 0;
        
        // Solo crear nuevo objeto si realmente cambió algo
        if (
          JSON.stringify(g.milestones || []) === JSON.stringify(milestones) &&
          g.progress === newProgress
        ) {
          return g; // Mantener referencia si no cambió nada
        }
        
        return { 
          ...g, 
          milestones, 
          progress: newProgress
        };
      });
      
      return newGoals;
    });

    // Actualizar en el servidor en segundo plano
    try {
      await updateGoal(goalId, { milestones });
    } catch (error) {
      console.error('Error updating milestones:', error);
      // Recargar en caso de error
      await loadGoals();
    }
  }, [updateGoal]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCompleteGoal = useCallback(async (goalId: string) => {
    // Actualizar el estado local inmediatamente (optimistic update)
    setGoals(prevGoals => 
      prevGoals.map(g => 
        g.id === goalId 
          ? { ...g, status: 'completed' as const, completedAt: new Date() }
          : g
      )
    );

    // Actualizar en el servidor
    try {
      await updateGoal(goalId, { status: 'completed' });
    } catch (error) {
      console.error('Error completing goal:', error);
      // Recargar en caso de error
      await loadGoals();
    }
  }, [updateGoal]); // eslint-disable-line react-hooks/exhaustive-deps

  // Calculate stats
  const activeGoals = goals.filter((g) => g.status !== 'completed');
  const completedGoals = goals.filter((g) => g.status === 'completed');
  const totalMilestones = goals.reduce((sum, g) => sum + (g.milestones?.length || 0), 0);
  const completedMilestones = goals.reduce(
    (sum, g) => sum + (g.milestones?.filter((m) => m.completed).length || 0),
    0
  );

  // Filter goals
  const filteredGoals = filterTab === 'active' ? activeGoals : completedGoals;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Mis Metas
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Define y alcanza tus objetivos
          </p>
        </div>
        <Button 
          className="bg-linear-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 w-full sm:w-auto text-sm"
          onClick={() => handleOpenDialog()}
        >
          <Plus className="mr-1 sm:mr-2 h-4 w-4" />
          Nueva Meta
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2">
              <Target className="h-3 w-3 sm:h-4 sm:w-4" />
              Total de Metas
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3 sm:pb-4">
            <div className="text-lg sm:text-2xl font-bold">{goals.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2">
              <Trophy className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
              Completadas
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3 sm:pb-4">
            <div className="text-lg sm:text-2xl font-bold text-green-600">{completedGoals.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2">
              <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
              Hitos Completados
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3 sm:pb-4">
            <div className="text-lg sm:text-2xl font-bold text-blue-600">
              {completedMilestones}/{totalMilestones}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium">Tasa de Éxito</CardTitle>
          </CardHeader>
          <CardContent className="pb-3 sm:pb-4">
            <div className="text-lg sm:text-2xl font-bold text-purple-600">
              {goals.length > 0 ? Math.round((completedGoals.length / goals.length) * 100) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals Views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">Lista</TabsTrigger>
          <TabsTrigger value="calendar">Calendario</TabsTrigger>
        </TabsList>

        {/* List View */}
        <TabsContent value="list" className="mt-6">
          <Tabs value={filterTab} onValueChange={setFilterTab}>
            <TabsList>
              <TabsTrigger value="active">Activas</TabsTrigger>
              <TabsTrigger value="completed">Completadas</TabsTrigger>
            </TabsList>

            <TabsContent value={filterTab} className="mt-6">
              <div className="space-y-3">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-24 animate-pulse bg-slate-100 dark:bg-slate-800 rounded-lg" />
                  ))
                ) : filteredGoals.length === 0 ? (
                  <Card className="col-span-full">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Target className="h-12 w-12 text-slate-400 mb-4" />
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                        No hay metas todavía
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                        Comienza definiendo tu primera meta
                      </p>
                      <Button onClick={() => handleOpenDialog()}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nueva Meta
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  filteredGoals.map((goal) => (
                    <GoalAccordionItem
                      key={goal.id}
                      goal={goal}
                      isOpen={openGoals.has(goal.id)}
                      onToggle={() => handleToggleGoal(goal.id)}
                      onEdit={() => handleOpenDialog(goal)}
                      onDelete={() => handleDeleteGoal(goal.id)}
                      onMilestoneToggle={handleMilestoneToggle}
                      onCompleteGoal={handleCompleteGoal}
                    />
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Calendar View */}
        <TabsContent value="calendar" className="mt-6">
          <GoalsCalendar 
            goals={goals} 
            onGoalClick={(goal) => handleOpenDialog(goal)}
          />
        </TabsContent>
      </Tabs>

      {/* Dialog */}
      <GoalDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingGoal(undefined);
        }}
        goal={editingGoal}
        onSave={handleSaveGoal}
      />
    </div>
  );
}
