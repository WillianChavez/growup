'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { EmojiPickerComponent } from '@/components/ui/emoji-picker';
import { HabitCategorySelector } from '@/components/habits/category-selector';
import type { Habit, HabitFormData } from '@/types/habit.types';

interface HabitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habit?: Habit;
  onSave: (data: HabitFormData) => Promise<void>;
}

export function HabitDialog({ open, onOpenChange, habit, onSave }: HabitDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<HabitFormData>({
    title: habit?.title || '',
    description: habit?.description || '',
    emoji: habit?.emoji || '🎯',
    categoryId: habit?.categoryId || '',
  });

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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{habit ? 'Editar Hábito' : 'Nuevo Hábito'}</DialogTitle>
          <DialogDescription>
            {habit ? 'Modifica los detalles de tu hábito' : 'Crea un nuevo hábito para seguir'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ej: Meditar 10 minutos"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="¿Por qué es importante este hábito?"
              rows={3}
            />
          </div>

          {/* Category */}
          <HabitCategorySelector
            value={formData.categoryId}
            onChange={(categoryId) => setFormData({ ...formData, categoryId })}
          />

          {/* Emoji */}
          <div className="space-y-2">
            <Label>Emoji</Label>
            <EmojiPickerComponent
              value={formData.emoji}
              onChange={(emoji) => setFormData({ ...formData, emoji })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {habit ? 'Guardar Cambios' : 'Crear Hábito'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
