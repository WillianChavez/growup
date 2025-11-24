'use client';

import { useState } from 'react';
import type { Transaction, TransactionFormData } from '@/types/finance.types';

export function useTransactions() {
  const [isLoading, setIsLoading] = useState(false);

  const fetchTransactions = async (): Promise<Transaction[]> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/transactions');
      if (!response.ok) throw new Error('Failed to fetch transactions');
      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const createTransaction = async (data: TransactionFormData): Promise<Transaction | null> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create transaction');
      const result = await response.json();
      return result.data || null;
    } catch (error) {
      console.error('Error creating transaction:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateTransaction = async (id: string, data: Partial<TransactionFormData>): Promise<Transaction | null> => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update transaction');
      const result = await response.json();
      return result.data || null;
    } catch (error) {
      console.error('Error updating transaction:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTransaction = async (id: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    isLoading,
  };
}

