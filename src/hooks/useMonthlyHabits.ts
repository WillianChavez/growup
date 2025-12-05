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
        return result.data || [];
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
