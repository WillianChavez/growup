'use client';

import { useState, useEffect } from 'react';
import { Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmojiPickerComponent } from '@/components/ui/emoji-picker';
import { useHabitCategories } from '@/hooks/useHabitCategories';
import type { HabitCategory } from '@/types/habit.types';

interface CategorySelectorProps {
  value: string;
  onChange: (categoryId: string) => void;
}

export function HabitCategorySelector({ value, onChange }: CategorySelectorProps) {
  const [categories, setCategories] = useState<HabitCategory[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', emoji: '✨', color: '#3b82f6' });
  const { fetchCategories, createCategory } = useHabitCategories();

  useEffect(() => {
    const loadCategories = async () => {
      const cats = await fetchCategories();
      setCategories(cats);
      if (cats.length > 0 && !value) {
        onChange(cats[0].id);
      }
    };
    void loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateCategory = async () => {
    const created = await createCategory(newCategory);
    if (created) {
      const cats = await fetchCategories();
      setCategories(cats);
      onChange(created.id);
      setDialogOpen(false);
      setNewCategory({ name: '', emoji: '✨', color: '#3b82f6' });
    }
  };

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Categoría *</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setDialogOpen(true)}
            className="h-auto py-1 px-2 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Nueva
          </Button>
        </div>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona una categoría" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                <span className="flex items-center gap-2">
                  <span>{cat.emoji}</span>
                  <span>{cat.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Dialog para crear nueva categoría */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Categoría de Hábito</DialogTitle>
            <DialogDescription>
              Crea una categoría personalizada para organizar tus hábitos
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="Ej: Deportes"
              />
            </div>

            <div className="space-y-2">
              <Label>Emoji</Label>
              <EmojiPickerComponent
                value={newCategory.emoji}
                onChange={(emoji) => setNewCategory({ ...newCategory, emoji })}
              />
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {[
                  '#ef4444',
                  '#f97316',
                  '#f59e0b',
                  '#eab308',
                  '#84cc16',
                  '#22c55e',
                  '#10b981',
                  '#14b8a6',
                  '#06b6d4',
                  '#0ea5e9',
                  '#3b82f6',
                  '#6366f1',
                  '#8b5cf6',
                  '#a855f7',
                  '#d946ef',
                  '#ec4899',
                  '#f43f5e',
                  '#64748b',
                ].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewCategory({ ...newCategory, color })}
                    className="w-8 h-8 rounded-full border-2 border-slate-200 dark:border-slate-700 hover:scale-110 transition-transform relative"
                    style={{ backgroundColor: color }}
                  >
                    {newCategory.color === color && (
                      <Check className="h-4 w-4 text-white absolute inset-0 m-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleCreateCategory}
              disabled={!newCategory.name.trim()}
            >
              Crear Categoría
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
