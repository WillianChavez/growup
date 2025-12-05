'use client';

import { useState } from 'react';
import type { DailyHabitView } from '@/types/habit.types';
import { format } from 'date-fns';

export function useDailyHabits() {
  const [isLoading, setIsLoading] = useState(false);

  const fetchDailyView = async (date: Date): Promise<DailyHabitView | null> => {
    setIsLoading(true);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const response = await fetch(`/api/habits/daily/${dateStr}`);
      if (!response.ok) throw new Error('Failed to fetch daily habits');
      const result = await response.json();
      return result.data || null;
    } catch (error) {
      console.error('Error fetching daily habits:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const toggleHabit = async (habitId: string, date: Date, completed: boolean): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Enviar la fecha tal cual - el backend la normalizará según la zona horaria del usuario
      // Usar mediodía para evitar problemas de zona horaria al parsear
      const dateToSend = new Date(date);
      dateToSend.setHours(12, 0, 0, 0);

      const response = await fetch(`/api/habits/${habitId}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dateToSend.toISOString(),
          completed,
        }),
      });
      return response.ok;
    } catch (error) {
      console.error('Error toggling habit:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    fetchDailyView,
    toggleHabit,
    isLoading,
  };
}
