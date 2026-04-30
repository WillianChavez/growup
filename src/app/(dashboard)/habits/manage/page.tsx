'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { HabitDialog } from '@/components/habits/habit-dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useHabits } from '@/hooks/useHabits';
import { toast } from 'sonner';
import type { Habit, HabitFormData } from '@/types/habit.types';
import { cn } from '@/lib/utils';

export default function ManageHabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { fetchHabits, updateHabit, deleteHabit, isLoading } = useHabits();

  const loadHabits = async () => {
    const data = await fetchHabits(true);
    setHabits(data);
  };

  useEffect(() => {
    void loadHabits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleActive = async (habit: Habit) => {
    setTogglingId(habit.id);
    try {
      const response = await fetch(`/api/habits/${habit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !habit.isActive }),
      });
      if (response.ok) {
        setHabits((prev) =>
          prev.map((h) => (h.id === habit.id ? { ...h, isActive: !habit.isActive } : h))
        );
        toast.success(habit.isActive ? 'Hábito desactivado' : 'Hábito activado');
      }
    } catch {
      toast.error('Error al actualizar hábito');
    } finally {
      setTogglingId(null);
    }
  };

  const handleSaveHabit = async (data: HabitFormData) => {
    if (editingHabit) {
      await updateHabit(editingHabit.id, data);
      await loadHabits();
    }
  };

  const handleConfirmDelete = async () => {
    if (habitToDelete) {
      await deleteHabit(habitToDelete);
      await loadHabits();
      setHabitToDelete(null);
    }
  };

  const activeHabits = habits.filter((h) => h.isActive);
  const inactiveHabits = habits.filter((h) => !h.isActive);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="px-4 sm:px-6 lg:px-10 pt-6 pb-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Link href="/habits">
            <Button variant="ghost" size="icon" className="rounded-2xl">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
              Gestionar Hábitos
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              Activa o desactiva tus hábitos
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-10 py-6 space-y-8 pb-24 lg:pb-10">
        {isLoading && habits.length === 0 ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-3xl" />
            ))}
          </div>
        ) : (
          <>
            {activeHabits.length > 0 && (
              <section className="space-y-3">
                <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Activos ({activeHabits.length})
                </h3>
                {activeHabits.map((habit) => (
                  <HabitRow
                    key={habit.id}
                    habit={habit}
                    toggling={togglingId === habit.id}
                    onToggle={handleToggleActive}
                    onEdit={(h) => {
                      setEditingHabit(h);
                      setDialogOpen(true);
                    }}
                    onDelete={(id) => {
                      setHabitToDelete(id);
                      setDeleteDialogOpen(true);
                    }}
                  />
                ))}
              </section>
            )}

            {inactiveHabits.length > 0 && (
              <section className="space-y-3">
                <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Inactivos ({inactiveHabits.length})
                </h3>
                {inactiveHabits.map((habit) => (
                  <HabitRow
                    key={habit.id}
                    habit={habit}
                    toggling={togglingId === habit.id}
                    onToggle={handleToggleActive}
                    onEdit={(h) => {
                      setEditingHabit(h);
                      setDialogOpen(true);
                    }}
                    onDelete={(id) => {
                      setHabitToDelete(id);
                      setDeleteDialogOpen(true);
                    }}
                  />
                ))}
              </section>
            )}

            {habits.length === 0 && (
              <div className="text-center py-16 text-slate-400 dark:text-slate-500">
                <p className="font-bold">No tienes hábitos todavía</p>
                <Link href="/habits" className="text-indigo-500 text-sm font-bold hover:underline">
                  Crear mi primer hábito
                </Link>
              </div>
            )}
          </>
        )}
      </main>

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
        description="Esta acción no se puede deshacer. Se eliminará el hábito y todo su historial."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

interface HabitRowProps {
  habit: Habit;
  toggling: boolean;
  onToggle: (habit: Habit) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (id: string) => void;
}

function HabitRow({ habit, toggling, onToggle, onEdit, onDelete }: HabitRowProps) {
  const categoryColor = habit.category?.color || '#6366f1';

  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-900 rounded-3xl p-4 flex items-center gap-4 border transition-all',
        habit.isActive
          ? 'border-slate-100 dark:border-slate-800 shadow-sm'
          : 'border-slate-100 dark:border-slate-800 opacity-60'
      )}
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${categoryColor}15`, color: categoryColor }}
      >
        <span className="text-xl">{habit.emoji}</span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-black text-slate-800 dark:text-white truncate">{habit.title}</p>
        {habit.category && (
          <span
            className="text-[10px] font-bold uppercase tracking-tighter px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}
          >
            {habit.category.name}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => onEdit(habit)}
          className="p-2 text-slate-400 hover:text-indigo-500 transition-colors"
        >
          <Pencil size={15} />
        </button>
        <button
          onClick={() => onDelete(habit.id)}
          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
        >
          <Trash2 size={15} />
        </button>
        <Switch
          checked={habit.isActive}
          onCheckedChange={() => onToggle(habit)}
          disabled={toggling}
        />
      </div>
    </div>
  );
}
