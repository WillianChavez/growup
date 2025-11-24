'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useHabits } from '@/hooks/useHabits';
import { HabitDialog } from '@/components/habits/habit-dialog';
import { HabitCard } from '@/components/habits/habit-card';
import { DailyTracker } from '@/components/habits/daily-tracker';
import { MonthlyCalendar } from '@/components/habits/monthly-calendar';
import type { Habit, HabitFormData } from '@/types/habit.types';

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>();
  const { fetchHabits, createHabit, updateHabit, deleteHabit, logEntry, isLoading } = useHabits();

  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = async () => {
    const data = await fetchHabits(false);
    setHabits(data);
  };

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

  const handleDeleteHabit = async (habitId: string) => {
    if (confirm('¿Estás seguro de eliminar este hábito?')) {
      await deleteHabit(habitId);
      await loadHabits();
    }
  };

  const handleToggleHabit = async (habitId: string, completed: boolean) => {
    await logEntry(habitId, new Date(), completed);
    await loadHabits();
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
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 w-full sm:w-auto text-sm"
          onClick={() => handleOpenDialog()}
        >
          <Plus className="mr-1 sm:mr-2 h-4 w-4" />
          Nuevo Hábito
        </Button>
      </div>

      {/* Main Content with Tabs */}
      <Tabs defaultValue="today" className="w-full">
        <TabsList>
          <TabsTrigger value="today">Hoy</TabsTrigger>
          <TabsTrigger value="calendar">Calendario</TabsTrigger>
          <TabsTrigger value="all">Todos los Hábitos</TabsTrigger>
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
                <div key={i} className="h-48 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
              ))
            ) : habits.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-slate-500 mb-4">No tienes hábitos todavía</p>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear tu Primer Hábito
                </Button>
              </div>
            ) : (
              habits.map((habit, index) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  index={index}
                  onToggle={handleToggleHabit}
                  onEdit={handleOpenDialog}
                  onDelete={handleDeleteHabit}
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog */}
      <HabitDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingHabit(undefined);
        }}
        habit={editingHabit}
        onSave={handleSaveHabit}
      />
    </div>
  );
}
