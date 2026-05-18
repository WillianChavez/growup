'use client';

import { useState, useEffect } from 'react';
import { Loader2, X, Tag, Calendar as CalendarIcon, Check, ArrowLeft, Wallet } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TransactionCategorySelector } from '@/components/finance/category-selector';
import type { Transaction, TransactionFormData, TransactionType } from '@/types/finance.types';
import type { Debt } from '@/types/financial.types';
import { cn } from '@/lib/utils';

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: Transaction;
  type?: TransactionType;
  onSave: (data: TransactionFormData) => Promise<void>;
}

const formatMoney = (value: number) =>
  value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Interés sugerido del periodo: saldo actual × tasa mensual (tasa anual / 12).
// Con tasa 0% el interés es 0 y todo el abono baja el capital.
const suggestInterest = (remainingAmount: number, annualRate: number) => {
  if (annualRate <= 0 || remainingAmount <= 0) return 0;
  return Math.round(remainingAmount * (annualRate / 100 / 12) * 100) / 100;
};

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

  // Abono a deuda
  const [isDebtPayment, setIsDebtPayment] = useState(false);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loadingDebts, setLoadingDebts] = useState(false);
  const [selectedDebtId, setSelectedDebtId] = useState<string>('');
  const [interestInput, setInterestInput] = useState<string>('0');
  const [interestEdited, setInterestEdited] = useState(false);

  // El editar una transacción existente no permite reconvertirla en abono.
  const canBeDebtPayment = formData.type === 'expense' && !transaction;

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
      setIsDebtPayment(false);
      setSelectedDebtId('');
      setInterestInput('0');
      setInterestEdited(false);
      setDebts([]); // Forzar recarga de deudas al reabrir el diálogo
    }
  }, [open, transaction, type]);

  // Cargar deudas activas cuando se activa el modo abono.
  useEffect(() => {
    if (!open || !isDebtPayment || debts.length > 0) return;
    let cancelled = false;
    setLoadingDebts(true);
    fetch('/api/financial/debts')
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((result) => {
        if (!cancelled) setDebts((result.data as Debt[]) || []);
      })
      .catch(() => {
        if (!cancelled) setDebts([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingDebts(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, isDebtPayment, debts.length]);

  const selectedDebt = debts.find((d) => d.id === selectedDebtId);

  const handleSelectDebt = (debt: Debt) => {
    setSelectedDebtId(debt.id);
    const suggested = suggestInterest(debt.remainingAmount, debt.annualRate);
    setInterestInput(String(suggested));
    setInterestEdited(false);
    setFormData((prev) => ({
      ...prev,
      description: prev.description.trim() ? prev.description : `Abono a ${debt.creditor}`,
    }));
  };

  const parsedAmount = parseFloat(amountInput) || 0;
  const parsedInterest = Math.min(Math.max(parseFloat(interestInput) || 0, 0), parsedAmount);
  const principalAmount = Math.max(0, parsedAmount - parsedInterest);
  const remainingAfter = selectedDebt
    ? Math.max(0, selectedDebt.remainingAmount - principalAmount)
    : 0;

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

    const parsed = parseFloat(amountInput);
    if (isNaN(parsed) || parsed <= 0) {
      alert('Por favor ingresa un monto válido mayor a 0');
      return;
    }

    if (isDebtPayment && !selectedDebtId) {
      alert('Por favor selecciona la deuda a la que deseas abonar');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        ...formData,
        amount: parsed,
        ...(isDebtPayment && selectedDebtId
          ? { debtId: selectedDebtId, debtInterest: parsedInterest }
          : {}),
      });
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
        <div className="relative w-full bg-white dark:bg-slate-900 rounded-[3rem] p-8 animate-in slide-in-from-bottom sm:slide-in-from-top duration-300 max-h-[90vh] overflow-y-auto">
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
                {transaction
                  ? 'Editar Transacción'
                  : isDebtPayment
                    ? 'ABONO A DEUDA'
                    : transactionTypeLabel}
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
            <div className="flex gap-2 justify-center mb-8 flex-wrap">
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

              {canBeDebtPayment && (
                <button
                  type="button"
                  onClick={() => setIsDebtPayment((prev) => !prev)}
                  className={cn(
                    'px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-bold transition-all',
                    isDebtPayment
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  )}
                >
                  <Wallet size={14} />
                  Abono a deuda
                </button>
              )}
            </div>

            {/* Debt Payment Section */}
            {isDebtPayment && (
              <div className="mb-8 space-y-3 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-2xl p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
                  Selecciona la deuda
                </p>

                {loadingDebts ? (
                  <div className="flex items-center justify-center py-6 text-slate-400">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : debts.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 py-2">
                    No tienes deudas activas registradas.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-44 overflow-y-auto">
                    {debts.map((debt) => (
                      <button
                        key={debt.id}
                        type="button"
                        onClick={() => handleSelectDebt(debt)}
                        className={cn(
                          'w-full text-left px-3 py-2 rounded-xl border transition-all',
                          selectedDebtId === debt.id
                            ? 'border-indigo-500 bg-white dark:bg-slate-800 ring-2 ring-indigo-500'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-300'
                        )}
                      >
                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                          {debt.creditor}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Saldo: ${formatMoney(debt.remainingAmount)} · {debt.annualRate}% anual
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                {selectedDebt && (
                  <div className="space-y-3 pt-1">
                    {selectedDebt.annualRate > 0 ? (
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                          Interés de este abono
                        </label>
                        <div className="flex items-center gap-1 mt-1 bg-white dark:bg-slate-800 rounded-xl px-3 border border-slate-200 dark:border-slate-700">
                          <span className="text-slate-400 font-bold text-sm">$</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={interestInput}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                setInterestInput(value);
                                setInterestEdited(true);
                              }
                            }}
                            className="w-full bg-transparent border-none py-2 font-bold text-slate-900 dark:text-white outline-none text-sm"
                          />
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          {interestEdited
                            ? 'El resto del abono baja el capital.'
                            : `Sugerido (${selectedDebt.annualRate}% anual). Puedes ajustarlo; el resto baja el capital.`}
                        </p>
                      </div>
                    ) : (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        Sin interés (0%): todo el abono baja el capital.
                      </p>
                    )}

                    <div className="rounded-xl bg-white dark:bg-slate-800 p-3 text-xs space-y-1">
                      <div className="flex justify-between text-slate-600 dark:text-slate-300">
                        <span>Capital abonado</span>
                        <span className="font-bold">${formatMoney(principalAmount)}</span>
                      </div>
                      {parsedInterest > 0 && (
                        <div className="flex justify-between text-slate-600 dark:text-slate-300">
                          <span>Interés</span>
                          <span className="font-bold">${formatMoney(parsedInterest)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-indigo-600 dark:text-indigo-400 pt-1 border-t border-slate-100 dark:border-slate-700">
                        <span className="font-bold">Saldo después del abono</span>
                        <span className="font-black">${formatMoney(remainingAfter)}</span>
                      </div>
                      {remainingAfter <= 0 && (
                        <p className="text-emerald-600 dark:text-emerald-400 font-bold pt-1">
                          ¡Esta deuda quedará saldada! 🎉
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

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
                  {isDebtPayment ? 'GUARDAR ABONO' : `GUARDAR ${transactionTypeLabel}`}
                </>
              )}
            </button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
