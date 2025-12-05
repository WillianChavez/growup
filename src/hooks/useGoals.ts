'use client';

import { useState } from 'react';
import type { Goal, GoalFormData } from '@/types/goal.types';

export function useGoals() {
  const [isLoading, setIsLoading] = useState(false);

  const fetchGoals = async (): Promise<Goal[]> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/goals');
      if (!response.ok) throw new Error('Failed to fetch goals');
      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error fetching goals:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const createGoal = async (data: GoalFormData): Promise<Goal | null> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create goal');
      const result = await response.json();
      return result.data || null;
    } catch (error) {
      console.error('Error creating goal:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateGoal = async (id: string, data: Partial<GoalFormData>): Promise<Goal | null> => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/goals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update goal');
      const result = await response.json();
      return result.data || null;
    } catch (error) {
      console.error('Error updating goal:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteGoal = async (id: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/goals/${id}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting goal:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    fetchGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    isLoading,
  };
}
