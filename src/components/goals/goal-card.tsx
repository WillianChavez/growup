'use client';

import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MoreVertical, Pencil, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Goal, GoalCategory } from '@/types/goal.types';
import { cn } from '@/lib/utils';

interface GoalCardProps {
  goal: Goal;
  index: number;
  onEdit: (goal: Goal) => void;
  onDelete: (goalId: string) => void;
}

const categoryColors: Record<GoalCategory, string> = {
  professional: 'bg-blue-100 text-blue-700 dark:bg-blue-950',
  health: 'bg-green-100 text-green-700 dark:bg-green-950',
  personal: 'bg-purple-100 text-purple-700 dark:bg-purple-950',
  financial: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950',
  learning: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950',
  relationships: 'bg-pink-100 text-pink-700 dark:bg-pink-950',
  creative: 'bg-orange-100 text-orange-700 dark:bg-orange-950',
  other: 'bg-slate-100 text-slate-700 dark:bg-slate-950',
};

const categoryLabels: Record<GoalCategory, string> = {
  professional: 'Profesional',
  health: 'Salud',
  personal: 'Personal',
  financial: 'Financiero',
  learning: 'Aprendizaje',
  relationships: 'Relaciones',
  creative: 'Creativo',
  other: 'Otro',
};

export function GoalCard({ goal, index, onEdit, onDelete }: GoalCardProps) {
  const milestones = goal.milestones || [];
  const completedMilestones = milestones.filter((m) => m.completed).length;
  const totalMilestones = milestones.length;
  const progress =
    totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : goal.progress;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="group hover:shadow-lg transition-all">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate">{goal.title}</CardTitle>
              {goal.description && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {goal.description}
                </p>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(goal)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(goal.id)} className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Progress */}
          {totalMilestones > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Progreso</span>
                <span>
                  {completedMilestones}/{totalMilestones} hitos
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Category and Date */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <Badge className={categoryColors[goal.category]}>{categoryLabels[goal.category]}</Badge>
            {goal.targetDate && (
              <span className="text-xs text-slate-500">
                Meta: {format(new Date(goal.targetDate), 'dd MMM yyyy', { locale: es })}
              </span>
            )}
          </div>

          {/* Milestones Preview */}
          {milestones.length > 0 && (
            <div className="space-y-1">
              {milestones.slice(0, 3).map((milestone, idx) => (
                <div key={milestone.id || idx} className="flex items-center gap-2 text-sm">
                  {milestone.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-slate-400 shrink-0" />
                  )}
                  <span
                    className={cn('truncate', milestone.completed && 'text-slate-400 line-through')}
                  >
                    {milestone.title}
                  </span>
                </div>
              ))}
              {milestones.length > 3 && (
                <p className="text-xs text-slate-400 ml-6">+{milestones.length - 3} más</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
