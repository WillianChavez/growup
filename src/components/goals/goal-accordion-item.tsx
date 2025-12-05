'use client';

import { useState, useEffect, memo, useRef } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ChevronDown,
  MoreVertical,
  Pencil,
  Trash2,
  GripVertical,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Goal, GoalCategory, Milestone } from '@/types/goal.types';
import { cn } from '@/lib/utils';

interface GoalAccordionItemProps {
  goal: Goal;
  isOpen: boolean;
  onToggle: () => void;
  onEdit: (goal: Goal) => void;
  onDelete: (goalId: string) => void;
  onMilestoneToggle: (goalId: string, milestones: Milestone[]) => Promise<void>;
  onCompleteGoal: (goalId: string) => Promise<void>;
}

const categoryColors: Record<GoalCategory, string> = {
  professional: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  health: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  personal: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  financial: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  learning: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
  relationships: 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300',
  creative: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  other: 'bg-slate-100 text-slate-700 dark:bg-slate-950 dark:text-slate-300',
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

const priorityColors = {
  low: 'border-l-blue-500',
  medium: 'border-l-yellow-500',
  high: 'border-l-red-500',
};

function GoalAccordionItemComponent({
  goal,
  isOpen,
  onToggle,
  onEdit,
  onDelete,
  onMilestoneToggle,
  onCompleteGoal,
}: GoalAccordionItemProps) {
  // Estados locales para las listas de milestones - esto evita re-renders del padre
  const [pendingMilestones, setPendingMilestones] = useState<Milestone[]>(() =>
    (goal.milestones || []).filter((m) => !m.completed)
  );
  const [completedMilestones, setCompletedMilestones] = useState<Milestone[]>(() =>
    (goal.milestones || []).filter((m) => m.completed)
  );

  const [draggedMilestone, setDraggedMilestone] = useState<Milestone | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dragOverColumn, setDragOverColumn] = useState<'pending' | 'completed' | null>(null);
  const lastGoalIdRef = useRef(goal.id);

  // Sincronizar con props solo cuando el goal cambia completamente (nuevo goal)
  // No sincronizamos en cada cambio de milestones porque manejamos eso localmente
  useEffect(() => {
    // Solo sincronizar si cambió el goal ID (nuevo goal)
    if (lastGoalIdRef.current !== goal.id) {
      lastGoalIdRef.current = goal.id;
      const goalMilestones = goal.milestones || [];
      setPendingMilestones(goalMilestones.filter((m) => !m.completed));
      setCompletedMilestones(goalMilestones.filter((m) => m.completed));
    }
  }, [goal.id, goal.milestones]); // Incluir milestones para sincronizar cuando cambien externamente

  const totalMilestones = pendingMilestones.length + completedMilestones.length;
  const progress =
    totalMilestones > 0 ? (completedMilestones.length / totalMilestones) * 100 : goal.progress;

  // Verificar si todos los hitos están completados
  const allMilestonesCompleted =
    totalMilestones > 0 &&
    completedMilestones.length === totalMilestones &&
    goal.status !== 'completed';

  const handleDragStart = (e: React.DragEvent, milestone: Milestone) => {
    setDraggedMilestone(milestone);

    // Crear un elemento fantasma personalizado para el drag
    const dragElement = document.createElement('div');
    dragElement.style.cssText = `
      position: absolute;
      top: -9999px;
      padding: 12px 16px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      max-width: 300px;
      font-size: 14px;
      color: #1e293b;
      font-family: system-ui, -apple-system, sans-serif;
    `;
    dragElement.textContent = milestone.title;
    document.body.appendChild(dragElement);
    e.dataTransfer.setDragImage(dragElement, 0, 0);

    // Remover el elemento después del drag
    setTimeout(() => document.body.removeChild(dragElement), 0);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (column: 'pending' | 'completed') => {
    setDragOverColumn(column);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Solo limpiar si salimos del contenedor principal
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetCompleted: boolean) => {
    e.preventDefault();
    e.stopPropagation();

    setDragOverColumn(null);

    if (!draggedMilestone) return;

    // Si ya está en la columna correcta, no hacer nada
    if (draggedMilestone.completed === targetCompleted) {
      setDraggedMilestone(null);
      return;
    }

    // Actualizar estados locales inmediatamente (sin esperar al servidor)
    const updatedMilestone = {
      ...draggedMilestone,
      completed: targetCompleted,
      completedAt: targetCompleted ? new Date() : undefined,
    };

    if (targetCompleted) {
      // Mover de pending a completed
      setPendingMilestones((prev) => prev.filter((m) => m.id !== draggedMilestone.id));
      setCompletedMilestones((prev) => [...prev, updatedMilestone]);
    } else {
      // Mover de completed a pending
      setCompletedMilestones((prev) => prev.filter((m) => m.id !== draggedMilestone.id));
      setPendingMilestones((prev) => [...prev, updatedMilestone]);
    }

    setDraggedMilestone(null);

    // Sincronizar con el servidor en segundo plano
    const allMilestones = targetCompleted
      ? [
          ...pendingMilestones.filter((m) => m.id !== draggedMilestone.id),
          ...completedMilestones,
          updatedMilestone,
        ]
      : [
          ...pendingMilestones,
          updatedMilestone,
          ...completedMilestones.filter((m) => m.id !== draggedMilestone.id),
        ];

    setIsUpdating(true);
    try {
      await onMilestoneToggle(goal.id, allMilestones);
    } catch (error) {
      console.error('[GoalAccordion] Error updating milestone:', error);
      // Revertir en caso de error
      if (targetCompleted) {
        setPendingMilestones((prev) => [...prev, draggedMilestone]);
        setCompletedMilestones((prev) => prev.filter((m) => m.id !== draggedMilestone.id));
      } else {
        setCompletedMilestones((prev) => [...prev, draggedMilestone]);
        setPendingMilestones((prev) => prev.filter((m) => m.id !== draggedMilestone.id));
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDragEnd = () => {
    setDraggedMilestone(null);
    setDragOverColumn(null);
  };

  const handleMilestoneClick = async (milestone: Milestone) => {
    const newCompleted = !milestone.completed;
    const updatedMilestone = {
      ...milestone,
      completed: newCompleted,
      completedAt: newCompleted ? new Date() : undefined,
    };

    // Actualizar estados locales inmediatamente
    if (newCompleted) {
      // Mover de pending a completed
      setPendingMilestones((prev) => prev.filter((m) => m.id !== milestone.id));
      setCompletedMilestones((prev) => [...prev, updatedMilestone]);
    } else {
      // Mover de completed a pending
      setCompletedMilestones((prev) => prev.filter((m) => m.id !== milestone.id));
      setPendingMilestones((prev) => [...prev, updatedMilestone]);
    }

    // Sincronizar con el servidor en segundo plano
    const allMilestones = newCompleted
      ? [
          ...pendingMilestones.filter((m) => m.id !== milestone.id),
          ...completedMilestones,
          updatedMilestone,
        ]
      : [
          ...pendingMilestones,
          updatedMilestone,
          ...completedMilestones.filter((m) => m.id !== milestone.id),
        ];

    setIsUpdating(true);
    try {
      await onMilestoneToggle(goal.id, allMilestones);
    } catch (error) {
      console.error('Error updating milestone:', error);
      // Revertir en caso de error
      if (newCompleted) {
        setPendingMilestones((prev) => [...prev, milestone]);
        setCompletedMilestones((prev) => prev.filter((m) => m.id !== milestone.id));
      } else {
        setCompletedMilestones((prev) => [...prev, milestone]);
        setPendingMilestones((prev) => prev.filter((m) => m.id !== milestone.id));
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      className={cn(
        'border rounded-lg bg-white dark:bg-slate-950 border-l-4 transition-all duration-300 ease-in-out will-change-transform',
        priorityColors[goal.priority]
      )}
    >
      {/* Header */}
      <div
        className="p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-lg">{goal.title}</h3>
              <Badge className={categoryColors[goal.category]}>
                {categoryLabels[goal.category]}
              </Badge>
              {goal.targetDate && (
                <span className="text-xs text-slate-500">
                  Meta: {format(new Date(goal.targetDate), 'dd MMM yyyy', { locale: es })}
                </span>
              )}
            </div>
            {goal.description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                {goal.description}
              </p>
            )}
            {totalMilestones > 0 && (
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-xs text-slate-500 transition-opacity duration-300">
                  <span>Progreso</span>
                  <span className="tabular-nums">
                    {completedMilestones.length}/{totalMilestones} hitos
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isUpdating && <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button size="icon" variant="ghost">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(goal)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                {allMilestonesCompleted && (
                  <DropdownMenuItem
                    onClick={async () => {
                      await onCompleteGoal(goal.id);
                    }}
                    className="text-green-600 dark:text-green-400"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Marcar como Completada
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onDelete(goal.id)} className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <ChevronDown
              className={cn('h-5 w-5 text-slate-500 transition-transform', isOpen && 'rotate-180')}
            />
          </div>
        </div>
      </div>

      {/* Milestones Content */}
      {isOpen && totalMilestones > 0 && (
        <div className="border-t p-4 bg-slate-50 dark:bg-slate-900/50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pending Milestones */}
            <div
              className={cn(
                'space-y-2 p-2 rounded-lg transition-all duration-300 ease-in-out',
                draggedMilestone &&
                  draggedMilestone.completed &&
                  'bg-blue-50 dark:bg-blue-950/20 ring-2 ring-blue-300 dark:ring-blue-700'
              )}
              onDragOver={handleDragOver}
              onDragEnter={() => handleDragEnter('pending')}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, false)}
            >
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Por Hacer ({pendingMilestones.length})
              </h4>
              <div className="space-y-2 min-h-[100px]">
                {/* Preview cuando se arrastra sobre esta columna */}
                {dragOverColumn === 'pending' && draggedMilestone && draggedMilestone.completed && (
                  <div
                    key={`preview-pending-${draggedMilestone.id}`}
                    className="flex items-center gap-2 p-3 bg-blue-100 dark:bg-blue-900/30 border-2 border-dashed border-blue-400 dark:border-blue-600 rounded-lg animate-pulse"
                  >
                    <GripVertical className="h-4 w-4 text-blue-500 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        {draggedMilestone.title}
                      </p>
                    </div>
                  </div>
                )}
                {pendingMilestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, milestone)}
                    onDragEnd={handleDragEnd}
                    onClick={() => handleMilestoneClick(milestone)}
                    className={cn(
                      'flex items-center gap-2 p-3 bg-white dark:bg-slate-950 border rounded-lg hover:shadow-md transition-all duration-300 ease-out cursor-move group',
                      draggedMilestone?.id === milestone.id && 'opacity-50 scale-95'
                    )}
                  >
                    <GripVertical className="h-4 w-4 text-slate-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex-1">
                      <p className="text-sm">{milestone.title}</p>
                    </div>
                  </div>
                ))}
                {pendingMilestones.length === 0 &&
                  !(
                    dragOverColumn === 'pending' &&
                    draggedMilestone &&
                    draggedMilestone.completed
                  ) && (
                    <div
                      key="empty-pending"
                      className="flex items-center justify-center h-24 text-sm text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg"
                    >
                      Arrastra hitos aquí
                    </div>
                  )}
              </div>
            </div>

            {/* Completed Milestones */}
            <div
              className={cn(
                'space-y-2 p-2 rounded-lg transition-all duration-300 ease-in-out',
                draggedMilestone &&
                  !draggedMilestone.completed &&
                  'bg-green-50 dark:bg-green-950/20 ring-2 ring-green-300 dark:ring-green-700'
              )}
              onDragOver={handleDragOver}
              onDragEnter={() => handleDragEnter('completed')}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, true)}
            >
              <h4 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-3">
                Completadas ({completedMilestones.length})
              </h4>
              <div className="space-y-2 min-h-[100px]">
                {/* Preview cuando se arrastra sobre esta columna */}
                {dragOverColumn === 'completed' &&
                  draggedMilestone &&
                  !draggedMilestone.completed && (
                    <div
                      key={`preview-completed-${draggedMilestone.id}`}
                      className="flex items-center gap-2 p-3 bg-green-100 dark:bg-green-900/30 border-2 border-dashed border-green-400 dark:border-green-600 rounded-lg animate-pulse"
                    >
                      <GripVertical className="h-4 w-4 text-green-500 shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-green-700 dark:text-green-300 line-through">
                          {draggedMilestone.title}
                        </p>
                      </div>
                    </div>
                  )}
                {completedMilestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, milestone)}
                    onDragEnd={handleDragEnd}
                    onClick={() => handleMilestoneClick(milestone)}
                    className={cn(
                      'flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg hover:shadow-md transition-all duration-300 ease-out cursor-move group',
                      draggedMilestone?.id === milestone.id && 'opacity-50 scale-95'
                    )}
                  >
                    <GripVertical className="h-4 w-4 text-slate-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex-1">
                      <p className="text-sm line-through text-slate-500 dark:text-slate-400">
                        {milestone.title}
                      </p>
                      {milestone.completedAt && (
                        <p className="text-xs text-slate-400">
                          {format(new Date(milestone.completedAt), 'dd MMM yyyy', { locale: es })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {completedMilestones.length === 0 &&
                  !(
                    dragOverColumn === 'completed' &&
                    draggedMilestone &&
                    !draggedMilestone.completed
                  ) && (
                    <div
                      key="empty-completed"
                      className="flex items-center justify-center h-24 text-sm text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg"
                    >
                      Arrastra hitos completados aquí
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isOpen && totalMilestones === 0 && (
        <div className="border-t p-4 bg-slate-50 dark:bg-slate-900/50">
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
            No hay hitos definidos para esta meta
          </p>
        </div>
      )}
    </div>
  );
}

// Memoizar para evitar re-renders innecesarios que causan parpadeo
// Ignoramos cambios en funciones inline si el contenido del goal no cambió
export const GoalAccordionItem = memo(GoalAccordionItemComponent, (prevProps, nextProps) => {
  // Si cambia el ID, es un goal diferente
  if (prevProps.goal.id !== nextProps.goal.id) return false;

  // Si cambia el estado de apertura, necesitamos re-renderizar
  if (prevProps.isOpen !== nextProps.isOpen) return false;

  // Comparar milestones - solo re-renderizar si realmente cambiaron
  const prevMilestones = JSON.stringify(prevProps.goal.milestones || []);
  const nextMilestones = JSON.stringify(nextProps.goal.milestones || []);
  if (prevMilestones !== nextMilestones) return false;

  // Comparar progreso
  if (prevProps.goal.progress !== nextProps.goal.progress) return false;

  // Comparar otras propiedades importantes del goal
  if (prevProps.goal.title !== nextProps.goal.title) return false;
  if (prevProps.goal.status !== nextProps.goal.status) return false;
  if (prevProps.goal.description !== nextProps.goal.description) return false;

  // Si el contenido del goal no cambió, ignoramos cambios en funciones inline
  // (las funciones inline se recrean en cada render pero hacen lo mismo)
  return true;
});
