'use client';

import { useState, useEffect } from 'react';
import { PlusCircle, MinusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTransactions } from '@/hooks/useTransactions';
import { useMonthlyTransactions } from '@/hooks/useMonthlyTransactions';
import { TransactionDialog } from '@/components/finance/transaction-dialog';
import { TransactionCard } from '@/components/finance/transaction-card';
import { MonthlyGroupView } from '@/components/finance/monthly-group-view';
import type { Transaction, TransactionFormData, MonthlyTransactionGroup } from '@/types/finance.types';

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlyGroups, setMonthlyGroups] = useState<MonthlyTransactionGroup[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>();
  
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

  const handleDeleteTransaction = async (transactionId: string) => {
    if (confirm('¿Estás seguro de eliminar esta transacción?')) {
      await deleteTransaction(transactionId);
      await loadTransactions();
      await loadMonthlyGroups();
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
              className="bg-linear-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 flex-1 sm:flex-none text-sm"
              onClick={() => handleOpenDialog('income')}
            >
              <PlusCircle className="mr-1 sm:mr-2 h-4 w-4" />
              <span className="hidden xs:inline">Agregar </span>Ingreso
            </Button>
            <Button
              className="bg-linear-to-r from-red-500 to-orange-600 text-white hover:from-red-600 hover:to-orange-700 flex-1 sm:flex-none text-sm"
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

      {/* Main Content with Tabs */}
      <Tabs defaultValue="monthly" className="w-full">
        <TabsList>
          <TabsTrigger value="monthly">Vista Mensual</TabsTrigger>
          <TabsTrigger value="all">Todas las Transacciones</TabsTrigger>
        </TabsList>

        {/* Monthly Grouped View */}
        <TabsContent value="monthly" className="mt-6">
          <MonthlyGroupView
            groups={monthlyGroups}
            onEdit={(t) => handleOpenDialog(t.type, t)}
            onDelete={handleDeleteTransaction}
          />
        </TabsContent>

        {/* All Transactions */}
        <TabsContent value="all" className="mt-6">
          <div className="space-y-2">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-20 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
              ))
            ) : transactions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-slate-500 mb-4">No tienes transacciones todavía</p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={() => handleOpenDialog('income')}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Agregar Ingreso
                    </Button>
                    <Button onClick={() => handleOpenDialog('expense')}>
                      <MinusCircle className="mr-2 h-4 w-4" />
                      Agregar Gasto
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              transactions.map((transaction, index) => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  index={index}
                  onEdit={(t) => handleOpenDialog(t.type, t)}
                  onDelete={handleDeleteTransaction}
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog */}
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
    </div>
  );
}
