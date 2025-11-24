'use client';

import { useState } from 'react';
import type { HabitCategory, HabitCategoryFormData } from '@/types/habit.types';

export function useHabitCategories() {
  const [isLoading, setIsLoading] = useState(false);

  const fetchCategories = async (): Promise<HabitCategory[]> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/habit-categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error fetching habit categories:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const createCategory = async (data: HabitCategoryFormData): Promise<HabitCategory | null> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/habit-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create category');
      const result = await response.json();
      return result.data || null;
    } catch (error) {
      console.error('Error creating habit category:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateCategory = async (id: string, data: Partial<HabitCategoryFormData>): Promise<HabitCategory | null> => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/habit-categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update category');
      const result = await response.json();
      return result.data || null;
    } catch (error) {
      console.error('Error updating habit category:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCategory = async (id: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/habit-categories/${id}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting habit category:', error);
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

