'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Search,
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

// Icono por defecto
const DefaultIcon = Wallet;

// Categorías frecuentes comunes (pueden ser personalizadas)
const frequentCategories = [
  { name: 'Comida', emoji: '🍔', icon: UtensilsCrossed },
  { name: 'Transporte', emoji: '🚗', icon: Car },
  { name: 'Supermercado', emoji: '🛒', icon: ShoppingCart },
  { name: 'Entretenimiento', emoji: '🎮', icon: Gamepad2 },
  { name: 'Salario', emoji: '💼', icon: Briefcase },
  { name: 'Vivienda', emoji: '🏠', icon: Home },
];

export function TransactionCategorySelector({ value, onChange, type }: CategorySelectorProps) {
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
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

  // Filtrar categorías por búsqueda
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const query = searchQuery.toLowerCase();
    return categories.filter(
      (cat) => cat.name.toLowerCase().includes(query) || cat.emoji.includes(query)
    );
  }, [categories, searchQuery]);

  // Obtener icono para una categoría
  const getCategoryIcon = (emoji: string) => {
    return emojiToIcon[emoji] || DefaultIcon;
  };

  return (
    <>
      <div className="space-y-4">
        {/* Barra de búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Buscar categoría..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-50 dark:bg-slate-800 border-none rounded-xl"
          />
        </div>

        {/* Categorías - Scroll horizontal */}
        <div className="space-y-4">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {filteredCategories.map((cat) => {
              const IconComponent = getCategoryIcon(cat.emoji);
              const isSelected = value === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onChange(cat.id)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-3 rounded-xl transition-all shrink-0 min-w-[80px]',
                    isSelected
                      ? 'bg-indigo-100 dark:bg-indigo-900/30 border-2 border-indigo-500 dark:border-indigo-400'
                      : 'bg-slate-50 dark:bg-slate-800 border-2 border-transparent hover:bg-slate-100 dark:hover:bg-slate-700'
                  )}
                >
                  <div
                    className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center transition-colors',
                      isSelected
                        ? 'bg-indigo-500 dark:bg-indigo-600 text-white'
                        : 'bg-white dark:bg-slate-900'
                    )}
                    style={!isSelected ? { color: cat.color } : undefined}
                  >
                    <IconComponent size={24} className={isSelected ? 'text-white' : ''} />
                  </div>
                  <span
                    className={cn(
                      'text-xs font-bold text-center line-clamp-1',
                      isSelected
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-700 dark:text-slate-300'
                    )}
                  >
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Categorías frecuentes */}
          {searchQuery === '' && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Frecuentes
              </p>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {frequentCategories.map((freqCat) => {
                  const existingCategory = categories.find(
                    (cat) => cat.name.toLowerCase() === freqCat.name.toLowerCase()
                  );
                  if (existingCategory) {
                    const IconComponent = getCategoryIcon(existingCategory.emoji);
                    const isSelected = value === existingCategory.id;
                    return (
                      <button
                        key={existingCategory.id}
                        type="button"
                        onClick={() => onChange(existingCategory.id)}
                        className={cn(
                          'flex flex-col items-center gap-2 p-3 rounded-xl transition-all shrink-0 min-w-[80px]',
                          isSelected
                            ? 'bg-indigo-100 dark:bg-indigo-900/30 border-2 border-indigo-500 dark:border-indigo-400'
                            : 'bg-slate-50 dark:bg-slate-800 border-2 border-transparent hover:bg-slate-100 dark:hover:bg-slate-700'
                        )}
                      >
                        <div
                          className={cn(
                            'w-12 h-12 rounded-xl flex items-center justify-center transition-colors',
                            isSelected
                              ? 'bg-indigo-500 dark:bg-indigo-600 text-white'
                              : 'bg-white dark:bg-slate-900'
                          )}
                          style={!isSelected ? { color: existingCategory.color } : undefined}
                        >
                          <IconComponent size={24} className={isSelected ? 'text-white' : ''} />
                        </div>
                        <span
                          className={cn(
                            'text-xs font-bold text-center line-clamp-1',
                            isSelected
                              ? 'text-indigo-600 dark:text-indigo-400'
                              : 'text-slate-700 dark:text-slate-300'
                          )}
                        >
                          {existingCategory.name}
                        </span>
                      </button>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          )}

          {/* Botón para crear nueva categoría */}
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
          >
            <Plus size={18} />
            <span className="text-sm font-bold">Nueva Categoría</span>
          </button>
        </div>
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
    </>
  );
}
