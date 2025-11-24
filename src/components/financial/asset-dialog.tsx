'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Asset, AssetFormData } from '@/types/financial.types';

interface AssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset?: Asset;
  onSave: (data: AssetFormData) => Promise<void>;
}

export function AssetDialog({ open, onOpenChange, asset, onSave }: AssetDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<AssetFormData>({
    name: '',
    value: 0,
    type: 'liquid',
    category: 'cash',
    description: '',
  });

  useEffect(() => {
    if (open) {
      setFormData({
        name: asset?.name || '',
        value: asset?.value || 0,
        type: asset?.type || 'liquid',
        category: asset?.category || 'cash',
        description: asset?.description || '',
        purchaseDate: asset?.purchaseDate || undefined,
      });
    }
  }, [open, asset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving asset:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{asset ? 'Editar Activo' : 'Nuevo Activo'}</DialogTitle>
          <DialogDescription>
            {asset ? 'Modifica los detalles del activo' : 'Registra un nuevo activo'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Cuenta de ahorros"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">Valor *</Label>
            <Input
              id="value"
              type="text"
              inputMode="decimal"
              value={formData.value || ''}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                  setFormData({ ...formData, value: value === '' ? 0 : parseFloat(value) || 0 });
                }
              }}
              placeholder="Ej: 5000.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo de Activo *</Label>
            <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="liquid">💧 Líquido (fácilmente convertible)</SelectItem>
                <SelectItem value="illiquid">🏠 No Líquido (propiedades, etc)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Categoría *</Label>
            <Select value={formData.category} onValueChange={(value: any) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">💵 Efectivo / Cuentas</SelectItem>
                <SelectItem value="investment">📈 Inversiones</SelectItem>
                <SelectItem value="property">🏠 Propiedades</SelectItem>
                <SelectItem value="vehicle">🚗 Vehículos</SelectItem>
                <SelectItem value="other">📦 Otros</SelectItem>
              </SelectContent>
            </Select>
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
              {asset ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

