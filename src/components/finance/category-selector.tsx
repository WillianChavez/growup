'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Wallet,
  ShoppingCart,
  Home,
  Car,
  UtensilsCrossed,
  Coffee,
  Gamepad2,
  Heart,
  GraduationCap,
  Briefcase,
  DollarSign,
  Gift,
  Zap,
  Music,
  Film,
  Dumbbell,
  BookOpen,
  Plane,
  Hotel,
  Phone,
  Wifi,
  Droplets,
  ShoppingBag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EmojiPickerComponent } from '@/components/ui/emoji-picker';
import { useTransactionCategories } from '@/hooks/useTransactionCategories';
import type { TransactionCategory, TransactionType } from '@/types/finance.types';
import { cn } from '@/lib/utils';

interface CategorySelectorProps {
  value: string;
  onChange: (categoryId: string) => void;
  type: TransactionType;
}

// Mapeo de emojis comunes a iconos de Lucide
const emojiToIcon: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  '💰': Wallet,
  '💳': Wallet,
  '💵': DollarSign,
  '💸': DollarSign,
  '🛒': ShoppingCart,
  '🛍️': ShoppingBag,
  '🏠': Home,
  '🏡': Home,
  '🚗': Car,
  '🚙': Car,
  '🍔': UtensilsCrossed,
  '🍕': UtensilsCrossed,
  '☕': Coffee,
  '🎮': Gamepad2,
  '❤️': Heart,
  '💚': Heart,
  '🎓': GraduationCap,
  '💼': Briefcase,
  '🎁': Gift,
  '⚡': Zap,
  '🎵': Music,
  '🎬': Film,
  '🏋️': Dumbbell,
  '📚': BookOpen,
  '✈️': Plane,
  '🏨': Hotel,
  '📱': Phone,
  '📶': Wifi,
  '💧': Droplets,
};

const DefaultIcon = Wallet;

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

  const getCategoryIcon = (emoji: string) => {
    return emojiToIcon[emoji] || DefaultIcon;
  };

  return (
    <div
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      className="h-[400px] min-h-0 flex-1 overflow-y-scroll"
    >
      <ScrollArea>
        <div className="space-y-2 p-2">
          {categories.map((cat) => {
            const IconComponent = getCategoryIcon(cat.emoji);
            const isSelected = value === cat.id;
            return (
              <div
                key={cat.id}
                onClick={() => onChange(cat.id)}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer',
                  isSelected
                    ? 'bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-500 dark:border-indigo-400'
                    : 'bg-slate-50 dark:bg-slate-800 border border-transparent hover:bg-slate-100 dark:hover:bg-slate-700'
                )}
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
                    isSelected
                      ? 'bg-indigo-500 dark:bg-indigo-600 text-white'
                      : 'bg-white dark:bg-slate-900'
                  )}
                  style={!isSelected ? { color: cat.color } : undefined}
                >
                  <IconComponent size={20} className={isSelected ? 'text-white' : ''} />
                </div>
                <span
                  className={cn(
                    'text-sm font-medium flex-1',
                    isSelected
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-700 dark:text-slate-300'
                  )}
                >
                  {cat.name}
                </span>
              </div>
            );
          })}

          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all mt-4"
          >
            <Plus size={18} />
            <span className="text-sm font-medium">Nueva Categoría</span>
          </button>
        </div>
      </ScrollArea>

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
              <label className="text-sm font-medium">Nombre *</label>
              <Input
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder={`Ej: ${type === 'income' ? 'Consultoría' : 'Supermercado'}`}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Emoji</label>
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
    </div>
  );
}
