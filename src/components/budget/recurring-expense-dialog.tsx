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
import type {
  RecurringExpense,
  RecurringExpenseFormData,
  ExpenseFrequency,
} from '@/types/budget.types';
import { parseCurrencyInput } from '@/lib/currency-utils';

interface RecurringExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: RecurringExpense;
  onSave: (data: RecurringExpenseFormData) => Promise<void>;
}

const LEGACY_EXPENSE_CATEGORIES: Record<string, string> = {
  groceries: 'Alimentación',
  transportation: 'Transporte',
  rent: 'Vivienda',
  entertainment: 'Entretenimiento',
  health: 'Salud',
  education: 'Educación',
  utilities: 'Servicios',
  subscriptions: 'Servicios',
  internet: 'Internet',
  other: 'Otro Gasto',
};

function normalizeExpenseCategory(category: string | undefined): string {
  if (!category) return 'Servicios';
  return LEGACY_EXPENSE_CATEGORIES[category] || category;
}

export function RecurringExpenseDialog({
  open,
  onOpenChange,
  expense,
  onSave,
}: RecurringExpenseDialogProps) {
  const [loading, setLoading] = useState(false);
  const [amountInput, setAmountInput] = useState<string>('');
  const [formData, setFormData] = useState<RecurringExpenseFormData>({
    name: '',
    amount: 0,
    frequency: 'monthly',
    category: 'Servicios',
    isEssential: true,
  });
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const { fetchCategories } = useTransactionCategories();

  useEffect(() => {
    if (open) {
      const amount = expense?.amount || 0;
      setAmountInput(amount ? String(amount) : '');
      setFormData({
        name: expense?.name || '',
        amount,
        frequency: expense?.frequency || 'monthly',
        category: normalizeExpenseCategory(expense?.category),
        isEssential: expense?.isEssential ?? true,
      });

      const loadCategories = async () => {
        const cats = await fetchCategories('expense');
        setCategories(cats);
      };
      void loadCategories();
    }
  }, [open, expense, fetchCategories]);

  const selectedCategory = categories.find(
    (c: TransactionCategory) => c.name === normalizeExpenseCategory(formData.category)
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
                value={amountInput}
                onChange={(e) => {
                  setAmountInput(e.target.value);
                }}
                placeholder="Ej: 50 o 50.00"
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
              <PopoverContent
                className="w-80 p-4 max-h-[400px] overflow-hidden flex flex-col"
                align="start"
              >
                <TransactionCategorySelector
                  value={selectedCategory?.id || ''}
                  onChange={(categoryId: string) => {
                    const cat = categories.find((c: TransactionCategory) => c.id === categoryId);
                    if (cat) {
                      setFormData({ ...formData, category: cat.name });
                      setShowCategorySelector(false);
                    }
                  }}
                  type="expense"
                />
              </PopoverContent>
            </Popover>
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
