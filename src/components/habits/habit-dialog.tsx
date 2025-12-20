'use client';

import { useState, useEffect } from 'react';
import {
  Loader2,
  X,
  BookOpen,
  Dumbbell,
  Droplets,
  Moon,
  Star,
  Bell,
  Flame,
  Trophy,
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { HabitCategorySelector } from '@/components/habits/category-selector';
import type { Habit, HabitFormData } from '@/types/habit.types';
import { cn } from '@/lib/utils';

interface HabitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habit?: Habit;
  onSave: (data: HabitFormData) => Promise<void>;
}

const iconOptions = [
  { icon: BookOpen, name: 'Lectura', emoji: '📖' },
  { icon: Dumbbell, name: 'Ejercicio', emoji: '🏋️' },
  { icon: Droplets, name: 'Agua', emoji: '💧' },
  { icon: Moon, name: 'Sueño', emoji: '🌙' },
  { icon: Star, name: 'Estrella', emoji: '⭐' },
  { icon: Bell, name: 'Recordatorio', emoji: '🔔' },
  { icon: Flame, name: 'Racha', emoji: '🔥' },
  { icon: Trophy, name: 'Logro', emoji: '🏆' },
];

export function HabitDialog({ open, onOpenChange, habit, onSave }: HabitDialogProps) {
  const [loading, setLoading] = useState(false);
  const [selectedIconIndex, setSelectedIconIndex] = useState(0);
  const [formData, setFormData] = useState<HabitFormData>({
    title: habit?.title || '',
    description: habit?.description || '',
    emoji: habit?.emoji || iconOptions[0].emoji,
    categoryId: habit?.categoryId || '',
  });

  useEffect(() => {
    if (habit) {
      // Encontrar el índice del icono basado en el emoji del hábito
      const iconIndex = iconOptions.findIndex((opt) => opt.emoji === habit.emoji);
      if (iconIndex !== -1) {
        setSelectedIconIndex(iconIndex);
      }
      setFormData({
        title: habit.title,
        description: habit.description || '',
        emoji: habit.emoji,
        categoryId: habit.categoryId,
      });
    } else {
      setSelectedIconIndex(0);
      setFormData({
        title: '',
        description: '',
        emoji: iconOptions[0].emoji,
        categoryId: '',
      });
    }
  }, [habit, open]);

  const handleIconSelect = (index: number) => {
    setSelectedIconIndex(index);
    setFormData({ ...formData, emoji: iconOptions[index].emoji });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId) {
      alert('Por favor selecciona una categoría');
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving habit:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 rounded-[3rem] overflow-hidden sm:rounded-[3rem]">
        <DialogTitle className="sr-only">{habit ? 'Editar Hábito' : 'Nuevo Hábito'}</DialogTitle>
        {/* Modal Content */}
        <div className="relative w-full bg-white dark:bg-slate-900 rounded-[3rem] p-8 animate-in slide-in-from-bottom sm:slide-in-from-top duration-300">
          {/* Handle móvil */}
          <div className="sm:hidden w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-8" />

          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-1">
                Configuración
              </p>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter uppercase">
                {habit ? 'Editar Hábito' : 'Nuevo Hábito'}
              </h2>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title Input */}
            <div>
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">
                ¿Qué quieres lograr?
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ej: Meditar 10 minutos"
                required
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all outline-none"
              />
            </div>

            {/* Category Selector */}
            <div>
              <HabitCategorySelector
                value={formData.categoryId}
                onChange={(categoryId) => setFormData({ ...formData, categoryId })}
              />
            </div>

            {/* Icon Selection */}
            <div>
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">
                Elige un recordatorio
              </label>
              <div className="grid grid-cols-4 gap-3">
                {iconOptions.map((option, index) => {
                  const IconComponent = option.icon;
                  const isSelected = selectedIconIndex === index;
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleIconSelect(index)}
                      className={cn(
                        'aspect-square bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 transition-all border-2',
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
                          : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300'
                      )}
                    >
                      <IconComponent size={24} strokeWidth={2.5} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !formData.title.trim() || !formData.categoryId}
              className={cn(
                'w-full py-5 bg-indigo-600 dark:bg-indigo-500 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-100 dark:shadow-indigo-900/50 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
              )}
            >
              {loading && <Loader2 className="h-5 w-5 animate-spin" />}
              {habit ? 'GUARDAR CAMBIOS' : 'AGREGAR HÁBITO'}
            </button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
