'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useHabits } from '@/hooks/useHabits';
import { HabitDialog } from '@/components/habits/habit-dialog';
import { HabitCard } from '@/components/habits/habit-card';
import { DailyTracker } from '@/components/habits/daily-tracker';
import { MonthlyCalendar } from '@/components/habits/monthly-calendar';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { FloatingActionButton } from '@/components/ui/floating-action-button';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { Habit, HabitFormData } from '@/types/habit.types';

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const { fetchHabits, createHabit, updateHabit, deleteHabit, isLoading } = useHabits();

  const loadHabits = useCallback(async () => {
    const data = await fetchHabits(false);
    setHabits(data);
  }, [fetchHabits]);

  useEffect(() => {
    void loadHabits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenDialog = (habit?: Habit) => {
    setEditingHabit(habit);
    setDialogOpen(true);
  };

  const handleSaveHabit = async (data: HabitFormData) => {
    if (editingHabit) {
      await updateHabit(editingHabit.id, data);
    } else {
      await createHabit(data);
    }
    await loadHabits();
  };

  const handleDeleteHabit = (habitId: string) => {
    setHabitToDelete(habitId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (habitToDelete) {
      await deleteHabit(habitToDelete);
      await loadHabits();
      setHabitToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Mis Hábitos
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Construye tu mejor versión, un hábito a la vez
          </p>
        </div>
        <Button
          className="bg-linear-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 w-full sm:w-auto text-sm hidden sm:flex"
          onClick={() => handleOpenDialog()}
        >
          <Plus className="mr-1 sm:mr-2 h-4 w-4" />
          Nuevo Hábito
        </Button>
      </div>

      {/* Main Content with Tabs */}
      <Tabs defaultValue="today" className="w-full">
        <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex">
          <TabsTrigger value="today" className="text-xs sm:text-sm">
            Hoy
          </TabsTrigger>
          <TabsTrigger value="calendar" className="text-xs sm:text-sm">
            Calendario
          </TabsTrigger>
          <TabsTrigger value="all" className="text-xs sm:text-sm">
            Todos
          </TabsTrigger>
        </TabsList>

        {/* Today Tab - Daily Tracker */}
        <TabsContent value="today" className="mt-6">
          <DailyTracker />
        </TabsContent>

        {/* Calendar Tab - Monthly View */}
        <TabsContent value="calendar" className="mt-6">
          <MonthlyCalendar />
        </TabsContent>

        {/* All Habits Tab - Grid View */}
        <TabsContent value="all" className="mt-6 space-y-6">
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-lg border bg-white dark:bg-slate-950 p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
              ))
            ) : habits.length === 0 ? (
              <div className="col-span-full">
                <div className="rounded-lg border border-dashed bg-slate-50 dark:bg-slate-900/50 p-12 text-center">
                  <div className="relative mb-6 inline-block">
                    <div className="absolute inset-0 bg-linear-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full blur-2xl" />
                    <div className="relative text-6xl">🎯</div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    Comienza tu viaje de crecimiento
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
                    Los hábitos son la base del éxito. Crea tu primer hábito y comienza a construir
                    una mejor versión de ti mismo.
                  </p>
                  <Button
                    onClick={() => handleOpenDialog()}
                    className="bg-linear-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Crear mi Primer Hábito
                  </Button>
                </div>
              </div>
            ) : (
              habits.map((habit, index) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  index={index}
                  onToggle={undefined}
                  onEdit={handleOpenDialog}
                  onDelete={handleDeleteHabit}
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <HabitDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingHabit(undefined);
        }}
        habit={editingHabit}
        onSave={handleSaveHabit}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="¿Eliminar hábito?"
        description="Esta acción no se puede deshacer. Se eliminará el hábito y todo su historial de entradas."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />

      {/* Floating Action Button para móvil */}
      {isMobile && <FloatingActionButton onClick={() => handleOpenDialog()} label="Nuevo Hábito" />}
    </div>
  );
}
