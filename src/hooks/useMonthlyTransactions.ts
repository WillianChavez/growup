'use client';

import { useState } from 'react';
import type { MonthlyTransactionGroup } from '@/types/finance.types';

export function useMonthlyTransactions() {
  const [isLoading, setIsLoading] = useState(false);

  const fetchMonthlyGroups = async (year: number): Promise<MonthlyTransactionGroup[]> => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/transactions/monthly/${year}`);
      if (!response.ok) throw new Error('Failed to fetch monthly transactions');
      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error fetching monthly transactions:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    fetchMonthlyGroups,
    isLoading,
  };
}
