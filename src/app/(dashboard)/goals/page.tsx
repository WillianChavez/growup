'use client';

import { useState, useEffect } from 'react';
import { Plus, Target, CheckCircle2, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGoals } from '@/hooks/useGoals';
import { GoalDialog } from '@/components/goals/goal-dialog';
import { GoalCard } from '@/components/goals/goal-card';
import type { Goal, GoalFormData } from '@/types/goal.types';

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [activeTab, setActiveTab] = useState('active');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>();
  const { fetchGoals, createGoal, updateGoal, deleteGoal, isLoading } = useGoals();

  const loadGoals = async () => {
    const data = await fetchGoals();
    setGoals(data);
  };

  useEffect(() => {
    loadGoals();
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
    await loadGoals();
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (confirm('¿Estás seguro de eliminar esta meta?')) {
      await deleteGoal(goalId);
      await loadGoals();
    }
  };

  // Calculate stats
  const activeGoals = goals.filter((g) => g.status !== 'completed');
  const completedGoals = goals.filter((g) => g.status === 'completed');
  const totalMilestones = goals.reduce((sum, g) => sum + (g.milestones?.length || 0), 0);
  const completedMilestones = goals.reduce(
    (sum, g) => sum + (g.milestones?.filter((m) => m.completed).length || 0),
    0
  );

  // Filter goals
  const filteredGoals = activeTab === 'active' ? activeGoals : completedGoals;

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

      {/* Goals List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">Activas</TabsTrigger>
          <TabsTrigger value="completed">Completadas</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="h-48" />
                </Card>
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
              filteredGoals.map((goal, index) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  index={index}
                  onEdit={handleOpenDialog}
                  onDelete={handleDeleteGoal}
                />
              ))
            )}
          </div>
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
