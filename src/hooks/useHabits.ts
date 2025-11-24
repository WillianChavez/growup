'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { Habit, HabitFormData, HabitEntry, HabitStats } from '@/types/habit.types';
import type { ApiResponse } from '@/types/api.types';

export function useHabits() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHabits = useCallback(async (includeArchived: boolean = false): Promise<Habit[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/habits?includeArchived=${includeArchived}`);
      const data = await response.json() as ApiResponse<Habit[]>;

      if (!data.success) {
        throw new Error(data.error || 'Error al obtener hábitos');
      }

      return data.data || [];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error de conexión';
      setError(message);
      toast.error(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createHabit = useCallback(async (data: HabitFormData): Promise<Habit | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json() as ApiResponse<Habit>;

      if (!result.success) {
        throw new Error(result.error || 'Error al crear hábito');
      }

      toast.success('Hábito creado exitosamente');
      return result.data || null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error de conexión';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateHabit = useCallback(async (id: string, data: Partial<HabitFormData>): Promise<Habit | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/habits/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json() as ApiResponse<Habit>;

      if (!result.success) {
        throw new Error(result.error || 'Error al actualizar hábito');
      }

      toast.success('Hábito actualizado exitosamente');
      return result.data || null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error de conexión';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteHabit = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/habits/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json() as ApiResponse;

      if (!result.success) {
        throw new Error(result.error || 'Error al eliminar hábito');
      }

      toast.success('Hábito eliminado exitosamente');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error de conexión';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logEntry = useCallback(async (
    habitId: string,
    date: Date,
    completed: boolean,
    notes?: string
  ): Promise<HabitEntry | null> => {
    try {
      const response = await fetch(`/api/habits/${habitId}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: date.toISOString(), completed, notes }),
      });

      const result = await response.json() as ApiResponse<HabitEntry>;

      if (!result.success) {
        throw new Error(result.error || 'Error al registrar entrada');
      }

      toast.success(completed ? '¡Hábito completado!' : 'Entrada actualizada');
      return result.data || null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error de conexión';
      toast.error(message);
      return null;
    }
  }, []);

  const fetchEntries = useCallback(async (
    habitId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<HabitEntry[]> => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());

      const response = await fetch(`/api/habits/${habitId}/entries?${params}`);
      const data = await response.json() as ApiResponse<HabitEntry[]>;

      if (!data.success) {
        throw new Error(data.error || 'Error al obtener entradas');
      }

      return data.data || [];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error de conexión';
      toast.error(message);
      return [];
    }
  }, []);

  const fetchStats = useCallback(async (habitId: string): Promise<HabitStats | null> => {
    try {
      const response = await fetch(`/api/habits/${habitId}/stats`);
      const data = await response.json() as ApiResponse<HabitStats>;

      if (!data.success) {
        throw new Error(data.error || 'Error al obtener estadísticas');
      }

      return data.data || null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error de conexión';
      toast.error(message);
      return null;
    }
  }, []);

  return {
    isLoading,
    error,
    fetchHabits,
    createHabit,
    updateHabit,
    deleteHabit,
    logEntry,
    fetchEntries,
    fetchStats,
  };
}

