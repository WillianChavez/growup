'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Tag, ChevronDown } from 'lucide-react';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TransactionCategorySelector } from '@/components/finance/category-selector';
import { useTransactionCategories } from '@/hooks/useTransactionCategories';
import type { TransactionCategory } from '@/types/finance.types';
import type { IncomeSource, IncomeSourceFormData, IncomeFrequency } from '@/types/budget.types';
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
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const { fetchCategories } = useTransactionCategories();

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

      const loadCategories = async () => {
        const cats = await fetchCategories('income');
        setCategories(cats);
      };
      void loadCategories();
    }
  }, [open, incomeSource, fetchCategories]);

  const INCOME_MAP_REVERSE: Record<string, string> = {
    salary: 'Salario',
    freelance: 'Freelance',
    business: 'Negocio',
    investment: 'Inversiones',
    rental: 'Renta',
    other: 'Otros',
  };

  const selectedCategory = categories.find(
    (c: TransactionCategory) =>
      c.name === formData.category || INCOME_MAP_REVERSE[formData.category] === c.name
  );

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
            <Popover open={showCategorySelector} onOpenChange={setShowCategorySelector}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Tag size={16} className="text-slate-400" />
                    <span>
                      {selectedCategory
                        ? `${selectedCategory.emoji} ${selectedCategory.name}`
                        : 'Seleccionar categoría'}
                    </span>
                  </div>
                  <ChevronDown size={16} className="text-slate-400" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="start">
                <TransactionCategorySelector
                  value={selectedCategory?.id || ''}
                  onChange={(categoryId: string) => {
                    const cat = categories.find((c: TransactionCategory) => c.id === categoryId);
                    if (cat) {
                      setFormData({ ...formData, category: cat.name });
                      setShowCategorySelector(false);
                    }
                  }}
                  type="income"
                />
              </PopoverContent>
            </Popover>
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
