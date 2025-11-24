'use client';

import { useState, useEffect } from 'react';
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { Debt, DebtFormData } from '@/types/financial.types';
import { cn } from '@/lib/utils';

interface DebtDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  debt?: Debt;
  onSave: (data: DebtFormData) => Promise<void>;
}

export function DebtDialog({ open, onOpenChange, debt, onSave }: DebtDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<DebtFormData>({
    creditor: '',
    totalAmount: 0,
    remainingAmount: 0,
    monthlyPayment: 0,
    annualRate: 0,
    type: 'consumption',
    startDate: new Date(),
  });

  useEffect(() => {
    if (open) {
      setFormData({
        creditor: debt?.creditor || '',
        totalAmount: debt?.totalAmount || 0,
        remainingAmount: debt?.remainingAmount || 0,
        monthlyPayment: debt?.monthlyPayment || 0,
        annualRate: debt?.annualRate || 0,
        type: debt?.type || 'consumption',
        description: debt?.description || '',
        startDate: debt?.startDate || new Date(),
        endDate: debt?.endDate || undefined,
      });
    }
  }, [open, debt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving debt:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{debt ? 'Editar Deuda' : 'Nueva Deuda'}</DialogTitle>
          <DialogDescription>
            {debt ? 'Modifica los detalles de la deuda' : 'Registra una nueva deuda'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="creditor">Acreedor *</Label>
            <Input
              id="creditor"
              value={formData.creditor}
              onChange={(e) => setFormData({ ...formData, creditor: e.target.value })}
              placeholder="Ej: Banco XYZ"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalAmount">Monto Total *</Label>
              <Input
                id="totalAmount"
                type="text"
                inputMode="decimal"
                value={formData.totalAmount || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    setFormData({ ...formData, totalAmount: value === '' ? 0 : parseFloat(value) || 0 });
                  }
                }}
                placeholder="10000"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="remainingAmount">Monto Restante *</Label>
              <Input
                id="remainingAmount"
                type="text"
                inputMode="decimal"
                value={formData.remainingAmount || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    setFormData({ ...formData, remainingAmount: value === '' ? 0 : parseFloat(value) || 0 });
                  }
                }}
                placeholder="8000"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthlyPayment">Pago Mensual *</Label>
              <Input
                id="monthlyPayment"
                type="text"
                inputMode="decimal"
                value={formData.monthlyPayment || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    setFormData({ ...formData, monthlyPayment: value === '' ? 0 : parseFloat(value) || 0 });
                  }
                }}
                placeholder="500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="annualRate">Tasa Anual % *</Label>
              <Input
                id="annualRate"
                type="text"
                inputMode="decimal"
                value={formData.annualRate || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    setFormData({ ...formData, annualRate: value === '' ? 0 : parseFloat(value) || 0 });
                  }
                }}
                placeholder="15.5"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tipo de Deuda *</Label>
            <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="consumption">💳 Consumo</SelectItem>
                <SelectItem value="housing">🏠 Vivienda</SelectItem>
                <SelectItem value="education">📚 Educación</SelectItem>
                <SelectItem value="vehicle">🚗 Vehículo</SelectItem>
                <SelectItem value="other">📦 Otros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Fecha de Inicio</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn('w-full justify-start text-left font-normal')}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.startDate ? format(formData.startDate, 'PPP') : <span>Selecciona fecha</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={formData.startDate} onSelect={(date) => date && setFormData({ ...formData, startDate: date })} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detalles adicionales..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {debt ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

