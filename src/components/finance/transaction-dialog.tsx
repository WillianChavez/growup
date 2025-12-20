'use client';

import { useState, useEffect } from 'react';
import { Loader2, X, Tag, Calendar as CalendarIcon, Check, ArrowLeft } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TransactionCategorySelector } from '@/components/finance/category-selector';
import type { Transaction, TransactionFormData, TransactionType } from '@/types/finance.types';
import { cn } from '@/lib/utils';

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: Transaction;
  type?: TransactionType;
  onSave: (data: TransactionFormData) => Promise<void>;
}

export function TransactionDialog({
  open,
  onOpenChange,
  transaction,
  type,
  onSave,
}: TransactionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [amountInput, setAmountInput] = useState<string>('0');
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formData, setFormData] = useState<TransactionFormData>({
    type: 'expense',
    amount: 0,
    categoryId: '',
    description: '',
    date: new Date(),
    notes: '',
  });

  useEffect(() => {
    if (open) {
      const amount = transaction?.amount || 0;
      setAmountInput(amount ? String(amount) : '0');
      setFormData({
        type: transaction?.type || type || 'expense',
        amount,
        categoryId: transaction?.categoryId || '',
        description: transaction?.description || '',
        date: transaction?.date ? new Date(transaction.date) : new Date(),
        notes: transaction?.notes || '',
      });
    }
  }, [open, transaction, type]);

  const handleKeyPress = (key: string | number) => {
    if (key === 'back') {
      setAmountInput((prev) => {
        if (prev.length <= 1) return '0';
        return prev.slice(0, -1);
      });
    } else if (key === '.') {
      setAmountInput((prev) => {
        if (prev.includes('.')) return prev;
        return prev + '.';
      });
    } else {
      setAmountInput((prev) => {
        if (prev === '0') return String(key);
        if (prev.length > 10) return prev; // Limitar longitud
        return prev + String(key);
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId) {
      alert('Por favor selecciona una categoría');
      return;
    }
    if (!formData.description.trim()) {
      alert('Por favor ingresa una descripción');
      return;
    }

    const parsedAmount = parseFloat(amountInput);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Por favor ingresa un monto válido mayor a 0');
      return;
    }

    setLoading(true);
    try {
      await onSave({ ...formData, amount: parsedAmount });
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  const transactionTypeLabel = formData.type === 'income' ? 'INGRESO' : 'EGRESO';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 rounded-[3rem] overflow-hidden sm:rounded-[3rem]">
        <DialogTitle className="sr-only">
          {transaction ? 'Editar Transacción' : `Nuevo ${transactionTypeLabel}`}
        </DialogTitle>
        {/* Modal Content */}
        <div className="relative w-full bg-white dark:bg-slate-900 rounded-[3rem] p-8 animate-in slide-in-from-bottom sm:slide-in-from-top duration-300">
          {/* Handle móvil */}
          <div className="sm:hidden w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-8" />

          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <p
                className={cn(
                  'text-[10px] font-black uppercase tracking-widest mb-1',
                  formData.type === 'income'
                    ? 'text-emerald-500 dark:text-emerald-400'
                    : 'text-rose-500 dark:text-rose-400'
                )}
              >
                Registrar nuevo
              </p>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter uppercase">
                {transaction ? 'Editar Transacción' : transactionTypeLabel}
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
            {/* Amount Display */}
            <div className="text-center mb-8">
              <span className="text-slate-400 dark:text-slate-500 text-xl mr-1 font-bold">$</span>
              <span className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white">
                {amountInput === '0'
                  ? '0'
                  : parseFloat(amountInput).toLocaleString('es-ES', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-center mb-8">
              <Popover open={showCategorySelector} onOpenChange={setShowCategorySelector}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-xl flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                  >
                    <Tag size={14} />
                    Categoría
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4" align="start">
                  <TransactionCategorySelector
                    value={formData.categoryId}
                    onChange={(categoryId) => {
                      setFormData({ ...formData, categoryId });
                      setShowCategorySelector(false);
                    }}
                    type={formData.type}
                  />
                </PopoverContent>
              </Popover>

              <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-xl flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                  >
                    <CalendarIcon size={14} />
                    {isToday(formData.date)
                      ? 'Hoy'
                      : format(formData.date, 'd MMM', { locale: es })}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => {
                      if (date) {
                        setFormData({ ...formData, date });
                        setShowDatePicker(false);
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Description Input (Hidden by default, can be shown with a button) */}
            <div className="mb-8">
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción (opcional)"
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all outline-none text-sm"
              />
            </div>

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, 'back'].map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleKeyPress(key)}
                  className="h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-xl font-black text-slate-700 dark:text-slate-300 active:bg-indigo-600 active:text-white dark:active:bg-indigo-600 dark:active:text-white sm:hover:bg-slate-100 dark:sm:hover:bg-slate-700 transition-all shadow-sm"
                >
                  {key === 'back' ? <ArrowLeft size={24} strokeWidth={3} /> : key}
                </button>
              ))}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !formData.categoryId || parseFloat(amountInput) <= 0}
              className={cn(
                'w-full py-5 rounded-2xl flex items-center justify-center gap-3 text-white font-black text-lg shadow-xl active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed',
                formData.type === 'income'
                  ? 'bg-emerald-500 dark:bg-emerald-600 shadow-emerald-200 dark:shadow-emerald-900/50'
                  : 'bg-rose-500 dark:bg-rose-600 shadow-rose-200 dark:shadow-rose-900/50'
              )}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Check size={24} strokeWidth={4} />
                  GUARDAR {transactionTypeLabel}
                </>
              )}
            </button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
