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
  IncomeSource,
  IncomeSourceFormData,
  IncomeFrequency,
  IncomeCategory,
} from '@/types/budget.types';
import { parseCurrencyInput } from '@/lib/currency-utils';

interface IncomeSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incomeSource?: IncomeSource;
  onSave: (data: IncomeSourceFormData) => Promise<void>;
}

export function IncomeSourceDialog({
  open,
  onOpenChange,
  incomeSource,
  onSave,
}: IncomeSourceDialogProps) {
  const [loading, setLoading] = useState(false);
  const [amountInput, setAmountInput] = useState<string>('');
  const [formData, setFormData] = useState<IncomeSourceFormData>({
    name: '',
    amount: 0,
    frequency: 'monthly',
    category: 'salary',
    isPrimary: false,
  });

  useEffect(() => {
    if (open) {
      const amount = incomeSource?.amount || 0;
      setAmountInput(amount ? String(amount) : '');
      setFormData({
        name: incomeSource?.name || '',
        amount,
        frequency: incomeSource?.frequency || 'monthly',
        category: incomeSource?.category || 'salary',
        isPrimary: incomeSource?.isPrimary || false,
      });
    }
  }, [open, incomeSource]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar y parsear el monto
    const parsedAmount = parseCurrencyInput(amountInput);
    if (parsedAmount <= 0) {
      alert('Por favor ingresa un monto válido mayor a 0');
      return;
    }

    setLoading(true);
    try {
      await onSave({ ...formData, amount: parsedAmount });
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving income source:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {incomeSource ? 'Editar Fuente de Ingreso' : 'Nueva Fuente de Ingreso'}
          </DialogTitle>
          <DialogDescription>
            {incomeSource
              ? 'Modifica los detalles de la fuente'
              : 'Registra una nueva fuente de ingreso'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Salario mensual"
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
                value={amountInput}
                onChange={(e) => {
                  setAmountInput(e.target.value);
                }}
                placeholder="Ej: 5000 o 5,000.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Frecuencia *</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value: IncomeFrequency) =>
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
              onValueChange={(value: IncomeCategory) =>
                setFormData({ ...formData, category: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="salary">💼 Salario</SelectItem>
                <SelectItem value="freelance">🎨 Freelance</SelectItem>
                <SelectItem value="business">🏢 Negocio</SelectItem>
                <SelectItem value="investment">📈 Inversiones</SelectItem>
                <SelectItem value="rental">🏠 Renta</SelectItem>
                <SelectItem value="other">📦 Otros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isPrimary"
              checked={formData.isPrimary}
              onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
              className="rounded border-slate-300"
            />
            <Label htmlFor="isPrimary" className="font-normal cursor-pointer">
              Marcar como fuente principal
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {incomeSource ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
