'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, MoreVertical, Pencil, Trash2, Circle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Habit } from '@/types/habit.types';
import { cn } from '@/lib/utils';

interface HabitCardProps {
  habit: Habit;
  index: number;
  onToggle: (habitId: string, completed: boolean) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (habitId: string) => void;
}

export function HabitCard({ habit, index, onToggle, onEdit, onDelete }: HabitCardProps) {
  const [isCompleted, setIsCompleted] = useState(false);

  const handleToggle = async () => {
    const newState = !isCompleted;
    setIsCompleted(newState);
    onToggle(habit.id, newState);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card
        className="group cursor-pointer hover:shadow-lg transition-all"
        style={{ borderLeftWidth: '4px', borderLeftColor: habit.category?.color || '#3b82f6' }}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{habit.emoji}</span>
                <CardTitle className="text-lg">{habit.title}</CardTitle>
              </div>
              {habit.description && (
                <CardDescription className="mt-1">{habit.description}</CardDescription>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                className={cn(
                  'transition-all',
                  isCompleted
                    ? 'text-green-600 bg-green-50 hover:bg-green-100'
                    : 'text-slate-400 hover:text-green-600'
                )}
                onClick={handleToggle}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-6 w-6" />
                ) : (
                  <Circle className="h-6 w-6" />
                )}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(habit)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete(habit.id)} className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Badge
              className="flex items-center gap-1"
              style={{ backgroundColor: habit.category?.color || '#3b82f6', color: 'white' }}
            >
              <span>{habit.category?.emoji}</span>
              <span>{habit.category?.name || 'Sin categoría'}</span>
            </Badge>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
