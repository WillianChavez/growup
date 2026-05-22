'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import type { WorkoutSession, WorkoutFormData, WorkoutWeeklyStats } from '@/types/exercise.types';

export function useWorkouts() {
  const [isLoading, setIsLoading] = useState(false);

  const fetchWorkouts = async (): Promise<WorkoutSession[]> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/workouts');
      if (!response.ok) throw new Error('Failed to fetch workouts');
      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error fetching workouts:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWeeklyStats = async (): Promise<WorkoutWeeklyStats | null> => {
    try {
      const response = await fetch('/api/workouts/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const result = await response.json();
      return result.data || null;
    } catch (error) {
      console.error('Error fetching workout stats:', error);
      return null;
    }
  };

  const createWorkout = async (data: WorkoutFormData): Promise<WorkoutSession | null> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Error al registrar entrenamiento');
      }
      toast.success(result.message || 'Entrenamiento registrado');
      return result.data || null;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error de conexión';
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteWorkout = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/workouts/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Error al eliminar');
      toast.success('Entrenamiento eliminado');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error de conexión';
      toast.error(message);
      return false;
    }
  };

  return { isLoading, fetchWorkouts, fetchWeeklyStats, createWorkout, deleteWorkout };
}
