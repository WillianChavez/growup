'use client';

import { useState } from 'react';
import type { TransactionCategory, TransactionCategoryFormData } from '@/types/finance.types';

export function useTransactionCategories() {
  const [isLoading, setIsLoading] = useState(false);

  const fetchCategories = async (type?: string): Promise<TransactionCategory[]> => {
    setIsLoading(true);
    try {
      const url = type ? `/api/transaction-categories?type=${type}` : '/api/transaction-categories';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch categories');
      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error fetching transaction categories:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const createCategory = async (
    data: TransactionCategoryFormData
  ): Promise<TransactionCategory | null> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/transaction-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create category');
      const result = await response.json();
      return result.data || null;
    } catch (error) {
      console.error('Error creating transaction category:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateCategory = async (
    id: string,
    data: Partial<TransactionCategoryFormData>
  ): Promise<TransactionCategory | null> => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/transaction-categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update category');
      const result = await response.json();
      return result.data || null;
    } catch (error) {
      console.error('Error updating transaction category:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCategory = async (id: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/transaction-categories/${id}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting transaction category:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    isLoading,
  };
}
