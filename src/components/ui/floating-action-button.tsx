'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  onClick: () => void;
  label?: string;
  icon?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'primary';
}

export function FloatingActionButton({
  onClick,
  label,
  icon = <Plus className="h-5 w-5" />,
  className,
  variant = 'primary',
}: FloatingActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      size="lg"
      className={cn(
        'fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg',
        'sm:hidden', // Solo visible en móvil
        variant === 'primary' && 'bg-linear-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700',
        'transition-all hover:scale-110 active:scale-95',
        className
      )}
      aria-label={label || 'Agregar'}
    >
      {icon}
      {label && <span className="ml-2 hidden sm:inline">{label}</span>}
    </Button>
  );
}

