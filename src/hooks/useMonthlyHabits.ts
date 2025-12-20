'use client';

import { useState, useCallback } from 'react';
import type { MonthlyHabitData } from '@/types/habit.types';

interface MonthlyHabitDataResponse {
  date: string; // YYYY-MM-DD format
  completedCount: number;
  totalCount: number;
  habits: Array<{
    habitId: string;
    habitTitle: string;
    completed: boolean;
  }>;
}

export function useMonthlyHabits() {
  const [isLoading, setIsLoading] = useState(false);

  const fetchMonthlyData = useCallback(
    async (year: number, month: number): Promise<MonthlyHabitData[]> => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/habits/monthly/${year}/${month}`);
        if (!response.ok) throw new Error('Failed to fetch monthly habits');
        const result = await response.json();
        const data = (result.data || []) as MonthlyHabitDataResponse[];
        // Convertir las fechas de string YYYY-MM-DD a objetos Date y normalizarlas a mediodía local
        return data.map((item) => {
          // Parsear YYYY-MM-DD como fecha local (no UTC)
          const [yearStr, monthStr, dayStr] = item.date.split('-');
          const date = new Date(
            parseInt(yearStr),
            parseInt(monthStr) - 1,
            parseInt(dayStr),
            12,
            0,
            0,
            0
          );
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
