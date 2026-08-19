'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import type { Transaction, TransactionFormData } from '@/types/finance.types';

// Los errores del servidor se muestran al usuario y se relanzan para que el
// diálogo que llama no se cierre como si el guardado hubiera funcionado.
async function readError(response: Response, fallback: string): Promise<string> {
  try {
    const result = await response.json();
    return result?.error || fallback;
  } catch {
    return fallback;
  }
}

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
      toast.error('No se pudieron cargar las transacciones');
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
      if (!response.ok) {
        throw new Error(await readError(response, 'Error al crear transacción'));
      }
      const result = await response.json();
      toast.success(result.message || 'Transacción creada');
      return result.data || null;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error de conexión';
      console.error('Error creating transaction:', error);
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateTransaction = async (
    id: string,
    data: Partial<TransactionFormData>
  ): Promise<Transaction | null> => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(await readError(response, 'Error al actualizar transacción'));
      }
      const result = await response.json();
      toast.success(result.message || 'Transacción actualizada');
      return result.data || null;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error de conexión';
      console.error('Error updating transaction:', error);
      toast.error(message);
      throw error;
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
      if (!response.ok) {
        throw new Error(await readError(response, 'Error al eliminar transacción'));
      }
      toast.success('Transacción eliminada');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error de conexión';
      console.error('Error deleting transaction:', error);
      toast.error(message);
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
