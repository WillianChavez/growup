'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmojiPickerComponent } from '@/components/ui/emoji-picker';
import { useTransactionCategories } from '@/hooks/useTransactionCategories';
import type { TransactionCategory, TransactionType } from '@/types/finance.types';

interface CategorySelectorProps {
  value: string;
  onChange: (categoryId: string) => void;
  type: TransactionType;
}

export function TransactionCategorySelector({ value, onChange, type }: CategorySelectorProps) {
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', emoji: '💰', type: type });
  const { fetchCategories, createCategory } = useTransactionCategories();

  useEffect(() => {
    const loadCategories = async () => {
      const cats = await fetchCategories(type);
      setCategories(cats);
      if (cats.length > 0 && !value) {
        onChange(cats[0].id);
      }
    };
    void loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  // Sync type when it changes
  useEffect(() => {
    setNewCategory((prev) => ({ ...prev, type }));
  }, [type]);

  const handleCreateCategory = async () => {
    const created = await createCategory(newCategory);
    if (created) {
      const cats = await fetchCategories(type);
      setCategories(cats);
      onChange(created.id);
      setDialogOpen(false);
      setNewCategory({ name: '', emoji: '💰', type: type });
    }
  };

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Categoría *</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setDialogOpen(true)}
            className="h-auto py-1 px-2 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Nueva
          </Button>
        </div>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona una categoría" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                <span className="flex items-center gap-2">
                  <span>{cat.emoji}</span>
                  <span>{cat.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Dialog para crear nueva categoría */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Categoría de {type === 'income' ? 'Ingreso' : 'Gasto'}</DialogTitle>
            <DialogDescription>
              Crea una categoría personalizada para organizar tus transacciones
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder={`Ej: ${type === 'income' ? 'Consultoría' : 'Supermercado'}`}
              />
            </div>

            <div className="space-y-2">
              <Label>Emoji</Label>
              <EmojiPickerComponent
                value={newCategory.emoji}
                onChange={(emoji) => setNewCategory({ ...newCategory, emoji })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleCreateCategory}
              disabled={!newCategory.name.trim()}
            >
              Crear Categoría
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
