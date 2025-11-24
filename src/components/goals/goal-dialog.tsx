'use client';

import { useState, useEffect } from 'react';
import { Loader2, Calendar as CalendarIcon, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { Goal, GoalFormData, GoalCategory } from '@/types/goal.types';
import { cn } from '@/lib/utils';

interface GoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: Goal;
  onSave: (data: GoalFormData) => Promise<void>;
}

const CATEGORIES: GoalCategory[] = [
  'professional', 'health', 'personal', 'financial', 'learning', 'relationships', 'creative', 'other'
];

const CATEGORY_LABELS: Record<GoalCategory, string> = {
  professional: 'Profesional',
  health: 'Salud',
  personal: 'Personal',
  financial: 'Financiero',
  learning: 'Aprendizaje',
  relationships: 'Relaciones',
  creative: 'Creativo',
  other: 'Otro',
};

export function GoalDialog({ open, onOpenChange, goal, onSave }: GoalDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<GoalFormData>({
    title: '',
    description: '',
    category: 'personal',
    priority: 'medium',
    targetDate: undefined,
    milestones: [],
  });

  const [newMilestone, setNewMilestone] = useState('');

  // Actualizar formData cuando cambie el goal o se abra el diálogo
  useEffect(() => {
    if (open) {
      setFormData({
        title: goal?.title || '',
        description: goal?.description || '',
        category: goal?.category || 'personal',
        priority: goal?.priority || 'medium',
        targetDate: goal?.targetDate || undefined,
        milestones: goal?.milestones?.map(m => ({ title: m.title, completed: m.completed, completedAt: m.completedAt })) || [],
      });
      setNewMilestone('');
    }
  }, [open, goal]);

  const handleAddMilestone = () => {
    if (newMilestone.trim()) {
      setFormData({
        ...formData,
        milestones: [
          ...(formData.milestones || []),
          {
            title: newMilestone.trim(),
            completed: false,
          },
        ],
      });
      setNewMilestone('');
    }
  };

  const handleRemoveMilestone = (index: number) => {
    setFormData({
      ...formData,
      milestones: formData.milestones?.filter((_, i) => i !== index) || [],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving goal:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{goal ? 'Editar Meta' : 'Nueva Meta'}</DialogTitle>
          <DialogDescription>
            {goal ? 'Modifica los detalles de tu meta' : 'Define una nueva meta para alcanzar'}
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
              placeholder="Ej: Correr un maratón"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="¿Por qué es importante esta meta?"
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Category */}
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select
                value={formData.category}
                onValueChange={(value: GoalCategory) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {CATEGORY_LABELS[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Target Date */}
            <div className="space-y-2">
              <Label>Fecha Objetivo</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !formData.targetDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.targetDate ? format(formData.targetDate, 'PPP') : <span>Selecciona fecha</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.targetDate}
                    onSelect={(date) => date && setFormData({ ...formData, targetDate: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Milestones */}
          <div className="space-y-2">
            <Label>Hitos / Tareas</Label>
            <div className="flex gap-2">
              <Input
                value={newMilestone}
                onChange={(e) => setNewMilestone(e.target.value)}
                placeholder="Agregar un hito..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddMilestone())}
              />
              <Button type="button" onClick={handleAddMilestone} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {(formData.milestones?.length || 0) > 0 && (
              <div className="space-y-2 mt-3">
                {formData.milestones?.map((milestone, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900 rounded">
                    <span className="flex-1">{milestone.title}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveMilestone(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {goal ? 'Guardar Cambios' : 'Crear Meta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

