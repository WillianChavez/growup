'use client';

import { useState, useEffect } from 'react';
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TransactionCategorySelector } from '@/components/finance/category-selector';
import type { Transaction, TransactionFormData, TransactionType } from '@/types/finance.types';
import { cn } from '@/lib/utils';
import { parseCurrencyInput } from '@/lib/currency-utils';

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: Transaction;
  type?: TransactionType; // Para pre-seleccionar el tipo (ingreso o gasto)
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
  const [amountInput, setAmountInput] = useState<string>('');
  const [formData, setFormData] = useState<TransactionFormData>({
    type: 'expense',
    amount: 0,
    categoryId: '',
    description: '',
    date: new Date(),
    notes: '',
  });

  // Actualizar formData cuando cambie la transacción, el tipo o se abra el diálogo
  useEffect(() => {
    if (open) {
      const amount = transaction?.amount || 0;
      setAmountInput(amount ? String(amount) : '');
      setFormData({
        type: transaction?.type || type || 'expense',
        amount,
        categoryId: transaction?.categoryId || '',
        description: transaction?.description || '',
        date: transaction?.date || new Date(),
        notes: transaction?.notes || '',
      });
    }
  }, [open, transaction, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId) {
      alert('Por favor selecciona una categoría');
      return;
    }

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
      console.error('Error saving transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {transaction
              ? 'Editar Transacción'
              : `Nuevo ${formData.type === 'income' ? 'Ingreso' : 'Gasto'}`}
          </DialogTitle>
          <DialogDescription>
            {transaction
              ? 'Modifica los detalles de la transacción'
              : 'Registra un nuevo movimiento'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type (solo si es nuevo) */}
          {!transaction && !type && (
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(value: TransactionType) => {
                  setFormData({ ...formData, type: value, categoryId: '' });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">💰 Ingreso</SelectItem>
                  <SelectItem value="expense">💸 Gasto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Amount */}
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
              placeholder="Ej: 1000.50 o 1,000.50"
              required
            />
          </div>

          {/* Category */}
          <TransactionCategorySelector
            value={formData.categoryId}
            onChange={(categoryId) => setFormData({ ...formData, categoryId })}
            type={formData.type}
          />

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción *</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ej: Compra en supermercado"
              required
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Detalles adicionales..."
              rows={2}
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>Fecha</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !formData.date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.date ? format(formData.date, 'PPP') : <span>Selecciona una fecha</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.date}
                  onSelect={(date) => date && setFormData({ ...formData, date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {transaction ? 'Guardar Cambios' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
