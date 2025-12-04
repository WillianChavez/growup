'use client';

import { useState, useEffect } from 'react';
import { PlusCircle, MinusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTransactions } from '@/hooks/useTransactions';
import { useMonthlyTransactions } from '@/hooks/useMonthlyTransactions';
import { TransactionDialog } from '@/components/finance/transaction-dialog';
import { MonthlyGroupView } from '@/components/finance/monthly-group-view';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { Transaction, TransactionFormData, MonthlyTransactionGroup } from '@/types/finance.types';

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlyGroups, setMonthlyGroups] = useState<MonthlyTransactionGroup[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const isMobile = useIsMobile();
  
  const { fetchTransactions, createTransaction, updateTransaction, deleteTransaction, isLoading } = useTransactions();
  const { fetchMonthlyGroups } = useMonthlyTransactions();

  const loadTransactions = async () => {
    const data = await fetchTransactions();
    setTransactions(data);
  };

  const loadMonthlyGroups = async () => {
    const currentYear = new Date().getFullYear();
    const groups = await fetchMonthlyGroups(currentYear);
    setMonthlyGroups(groups);
  };

  useEffect(() => {
    const loadData = async () => {
      await loadTransactions();
      await loadMonthlyGroups();
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenDialog = (type: 'income' | 'expense', transaction?: Transaction) => {
    setTransactionType(type);
    setEditingTransaction(transaction);
    setDialogOpen(true);
  };

  const handleSaveTransaction = async (data: TransactionFormData) => {
    if (editingTransaction) {
      await updateTransaction(editingTransaction.id, data);
    } else {
      await createTransaction(data);
    }
    await loadTransactions();
    await loadMonthlyGroups();
  };

  const handleDeleteTransaction = (transactionId: string) => {
    setTransactionToDelete(transactionId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (transactionToDelete) {
      await deleteTransaction(transactionToDelete);
      await loadTransactions();
      await loadMonthlyGroups();
      setTransactionToDelete(null);
    }
  };

  // Calcular totales
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Finanzas Personales
          </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Gestiona tus ingresos y gastos
          </p>
        </div>
          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            <Button
              variant="outline"
              className="flex-1 sm:flex-none text-sm"
              onClick={() => window.location.href = '/finance/dashboard'}
            >
              📈 Dashboard
            </Button>
            <Button
              variant="outline"
              className="flex-1 sm:flex-none text-sm"
              onClick={() => window.location.href = '/finance/budget'}
            >
              📊 Presupuesto
            </Button>
            <Button
              variant="outline"
              className="flex-1 sm:flex-none text-sm"
              onClick={() => window.location.href = '/finance/assets'}
            >
              💰 Activos
            </Button>
            <Button
              variant="outline"
              className="flex-1 sm:flex-none text-sm"
              onClick={() => window.location.href = '/finance/debts'}
            >
              💳 Deudas
            </Button>
          <Button
              className="bg-linear-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 flex-1 sm:flex-none text-sm hidden sm:flex"
            onClick={() => handleOpenDialog('income')}
          >
              <PlusCircle className="mr-1 sm:mr-2 h-4 w-4" />
              <span className="hidden xs:inline">Agregar </span>Ingreso
          </Button>
          <Button
              className="bg-linear-to-r from-red-500 to-orange-600 text-white hover:from-red-600 hover:to-orange-700 flex-1 sm:flex-none text-sm hidden sm:flex"
            onClick={() => handleOpenDialog('expense')}
          >
              <MinusCircle className="mr-1 sm:mr-2 h-4 w-4" />
              <span className="hidden xs:inline">Agregar </span>Gasto
          </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-3">
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
              Total Ingresos
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3 sm:pb-4">
            <div className="text-lg sm:text-2xl font-bold text-green-600">
              ${totalIncome.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
              Total Gastos
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3 sm:pb-4">
            <div className="text-lg sm:text-2xl font-bold text-red-600">
              ${totalExpense.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
              Balance
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3 sm:pb-4">
            <div className={`text-lg sm:text-2xl font-bold ${
              balance >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {balance >= 0 ? '+' : ''}${balance.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Monthly View */}
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))
        ) : monthlyGroups.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 px-4">
              <div className="relative mb-6 inline-block">
                <div className="absolute inset-0 bg-linear-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full blur-2xl" />
                <PlusCircle className="relative h-20 w-20 text-blue-500 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                No hay transacciones registradas
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 text-center max-w-md">
                Comienza a registrar tus ingresos y gastos para tener un mejor control de tus finanzas.
              </p>
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleOpenDialog('income')}
                  className="bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Agregar Ingreso
                </Button>
                <Button 
                  onClick={() => handleOpenDialog('expense')}
                  className="bg-linear-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700"
                >
                  <MinusCircle className="mr-2 h-4 w-4" />
                  Agregar Gasto
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <MonthlyGroupView
            groups={monthlyGroups}
            onEdit={(t) => handleOpenDialog(t.type, t)}
            onDelete={handleDeleteTransaction}
          />
        )}
      </div>

      {/* Dialogs */}
      <TransactionDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingTransaction(undefined);
        }}
        transaction={editingTransaction}
        type={transactionType}
        onSave={handleSaveTransaction}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="¿Eliminar transacción?"
        description="Esta acción no se puede deshacer. La transacción será eliminada permanentemente."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />

      {/* Floating Action Buttons para móvil */}
      {isMobile && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 sm:hidden">
          <Button
            onClick={() => handleOpenDialog('income')}
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all hover:scale-110 active:scale-95"
            aria-label="Agregar Ingreso"
          >
            <PlusCircle className="h-5 w-5" />
          </Button>
          <Button
            onClick={() => handleOpenDialog('expense')}
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg bg-linear-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 transition-all hover:scale-110 active:scale-95"
            aria-label="Agregar Gasto"
          >
            <MinusCircle className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
}
