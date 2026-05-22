'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import type { BodyMetric, BodyMetricFormData, WeightGoalSync } from '@/types/exercise.types';

interface SaveMetricResult {
  metric: BodyMetric;
  goalSync: WeightGoalSync | null;
}

export function useBodyMetrics() {
  const [isLoading, setIsLoading] = useState(false);

  const fetchMetrics = async (): Promise<BodyMetric[]> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/body-metrics');
      if (!response.ok) throw new Error('Failed to fetch metrics');
      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error fetching body metrics:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const saveMetric = async (data: BodyMetricFormData): Promise<SaveMetricResult | null> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/body-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Error al guardar la medición');
      }
      toast.success(result.message || 'Medición guardada');
      return result.data || null;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error de conexión';
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMetric = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/body-metrics/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Error al eliminar');
      toast.success('Medición eliminada');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error de conexión';
      toast.error(message);
      return false;
    }
  };

  return { isLoading, fetchMetrics, saveMetric, deleteMetric };
}
