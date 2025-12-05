'use client';

import { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  RecurringExpense,
  RecurringExpenseFormData,
  ExpenseFrequency,
  ExpenseCategory,
} from '@/types/budget.types';

interface RecurringExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: RecurringExpense;
  onSave: (data: RecurringExpenseFormData) => Promise<void>;
}

export function RecurringExpenseDialog({
  open,
  onOpenChange,
  expense,
  onSave,
}: RecurringExpenseDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<RecurringExpenseFormData>({
    name: '',
    amount: 0,
    frequency: 'monthly',
    category: 'utilities',
    isEssential: true,
  });

  useEffect(() => {
    if (open) {
      setFormData({
        name: expense?.name || '',
        amount: expense?.amount || 0,
        frequency: expense?.frequency || 'monthly',
        category: expense?.category || 'utilities',
        isEssential: expense?.isEssential || true,
      });
    }
  }, [open, expense]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving recurring expense:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {expense ? 'Editar Gasto Recurrente' : 'Nuevo Gasto Recurrente'}
          </DialogTitle>
          <DialogDescription>
            {expense ? 'Modifica los detalles del gasto' : 'Registra un nuevo gasto recurrente'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Internet"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Monto *</Label>
              <Input
                id="amount"
                type="text"
                inputMode="decimal"
                value={formData.amount || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    setFormData({ ...formData, amount: value === '' ? 0 : parseFloat(value) || 0 });
                  }
                }}
                placeholder="50"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Frecuencia *</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value: ExpenseFrequency) =>
                  setFormData({ ...formData, frequency: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="biweekly">Quincenal</SelectItem>
                  <SelectItem value="monthly">Mensual</SelectItem>
                  <SelectItem value="annual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Categoría *</Label>
            <Select
              value={formData.category}
              onValueChange={(value: ExpenseCategory) =>
                setFormData({ ...formData, category: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="utilities">💡 Servicios (Luz, Agua, etc)</SelectItem>
                <SelectItem value="internet">📶 Internet/Telefonía</SelectItem>
                <SelectItem value="subscriptions">📺 Suscripciones</SelectItem>
                <SelectItem value="transportation">🚗 Transporte</SelectItem>
                <SelectItem value="groceries">🛒 Alimentos</SelectItem>
                <SelectItem value="health">🏥 Salud/Seguros</SelectItem>
                <SelectItem value="rent">🏠 Renta/Hipoteca</SelectItem>
                <SelectItem value="education">📚 Educación</SelectItem>
                <SelectItem value="entertainment">🎮 Entretenimiento</SelectItem>
                <SelectItem value="other">📦 Otros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isEssential"
              checked={formData.isEssential}
              onChange={(e) => setFormData({ ...formData, isEssential: e.target.checked })}
              className="rounded border-slate-300"
            />
            <Label htmlFor="isEssential" className="font-normal cursor-pointer">
              Gasto esencial (necesario para vivir)
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {expense ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
