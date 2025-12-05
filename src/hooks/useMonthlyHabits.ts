'use client';

import { useState, useCallback } from 'react';
import type { MonthlyHabitData } from '@/types/habit.types';

export function useMonthlyHabits() {
  const [isLoading, setIsLoading] = useState(false);

  const fetchMonthlyData = useCallback(
    async (year: number, month: number): Promise<MonthlyHabitData[]> => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/habits/monthly/${year}/${month}`);
        if (!response.ok) throw new Error('Failed to fetch monthly habits');
        const result = await response.json();
        const data = result.data || [];
        // Convertir las fechas de string ISO a objetos Date y normalizarlas a mediodía local
        return data.map((item: MonthlyHabitData) => {
          const date = typeof item.date === 'string' ? new Date(item.date) : new Date(item.date);
          // Normalizar al mediodía local para evitar problemas de zona horaria
          date.setHours(12, 0, 0, 0);
          return {
            ...item,
            date,
          };
        });
      } catch (error) {
        console.error('Error fetching monthly habits:', error);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    fetchMonthlyData,
    isLoading,
  };
}
