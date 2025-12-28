'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, DollarSign, Receipt, Edit, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BudgetDistributionChart } from '@/components/budget/budget-distribution-chart';
import { IncomeSourceDialog } from '@/components/budget/income-source-dialog';
import { RecurringExpenseDialog } from '@/components/budget/recurring-expense-dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useIsMobile } from '@/hooks/useIsMobile';
import type {
  BudgetSummary,
  IncomeSource,
  RecurringExpense,
  IncomeSourceFormData,
  RecurringExpenseFormData,
} from '@/types/budget.types';

export default function BudgetPage() {
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeSource | undefined>();
  const [editingExpense, setEditingExpense] = useState<RecurringExpense | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<'income' | 'expense' | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    loadBudgetData();
  }, []);

  const loadBudgetData = async () => {
    try {
      setIsLoading(true);
      const [summaryRes, incomeRes, expensesRes] = await Promise.all([
        fetch('/api/budget/summary'),
        fetch('/api/budget/income-sources'),
        fetch('/api/budget/recurring-expenses'),
      ]);

      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setSummary(summaryData.data);
      }
      if (incomeRes.ok) {
        const incomeData = await incomeRes.json();
        setIncomeSources(incomeData.data);
      }
      if (expensesRes.ok) {
        const expensesData = await expensesRes.json();
        setRecurringExpenses(expensesData.data);
      }
    } catch (error) {
      console.error('Error loading budget data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveIncome = async (data: IncomeSourceFormData) => {
    const url = editingIncome
      ? `/api/budget/income-sources/${editingIncome.id}`
      : '/api/budget/income-sources';
    const method = editingIncome ? 'PATCH' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      await loadBudgetData();
    }
  };

  const handleDeleteIncome = (id: string) => {
    setDeleteType('income');
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleSaveExpense = async (data: RecurringExpenseFormData) => {
    const url = editingExpense
      ? `/api/budget/recurring-expenses/${editingExpense.id}`
      : '/api/budget/recurring-expenses';
    const method = editingExpense ? 'PATCH' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      await loadBudgetData();
    }
  };

  const handleDeleteExpense = (id: string) => {
    setDeleteType('expense');
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete || !deleteType) return;

    const endpoint =
      deleteType === 'income'
        ? `/api/budget/income-sources/${itemToDelete}`
        : `/api/budget/recurring-expenses/${itemToDelete}`;

    const response = await fetch(endpoint, { method: 'DELETE' });
    if (response.ok) {
      await loadBudgetData();
      setItemToDelete(null);
      setDeleteType(null);
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      weekly: 'Semanal',
      biweekly: 'Quincenal',
      monthly: 'Mensual',
      annual: 'Anual',
    };
    return labels[frequency] || frequency;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3 animate-pulse" />
        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          Presupuesto
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Gestiona tus fuentes de ingreso y gastos recurrentes
        </p>
      </motion.div>

      {/* Budget Distribution Chart */}
      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <BudgetDistributionChart summary={summary} />
        </motion.div>
      )}

      {/* Tabs for Income & Expenses */}
      <Tabs defaultValue="income" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="income">
            <DollarSign className="h-4 w-4 mr-2" />
            Fuentes de Ingreso
          </TabsTrigger>
          <TabsTrigger value="expenses">
            <Receipt className="h-4 w-4 mr-2" />
            Gastos Recurrentes
          </TabsTrigger>
        </TabsList>

        {/* Income Sources Tab */}
        <TabsContent value="income" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Fuentes de Ingreso</CardTitle>
              <Button
                size="sm"
                onClick={() => {
                  setEditingIncome(undefined);
                  setIncomeDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar
              </Button>
            </CardHeader>
            <CardContent>
              {incomeSources.length === 0 ? (
                <p className="text-center py-8 text-slate-500">
                  No hay fuentes de ingreso. Agrega tu primera fuente.
                </p>
              ) : (
                <div className="space-y-2">
                  {incomeSources.map((source) => (
                    <div
                      key={source.id}
                      className="flex items-start justify-between p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900"
                    >
                      {isMobile ? (
                        // Layout móvil: badges en una fila, nombre y precio en otra, menú de 3 puntos
                        <div className="flex-1 min-w-0">
                          {/* Primera fila: Badges */}
                          <div className="flex items-center gap-2 mb-1">
                            {source.isPrimary && (
                              <Badge variant="default" className="text-xs">
                                Principal
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {getFrequencyLabel(source.frequency)}
                            </Badge>
                          </div>
                          {/* Segunda fila: Nombre y precio */}
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium truncate">{source.name}</p>
                            <p className="font-bold text-green-600 whitespace-nowrap shrink-0">
                              ${source.amount.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ) : (
                        // Layout desktop: layout original
                        <>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{source.name}</p>
                              {source.isPrimary && (
                                <Badge variant="default" className="text-xs">
                                  Principal
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-500 mt-0.5">
                              {getFrequencyLabel(source.frequency)} •{' '}
                              <span className="text-slate-400 capitalize">{source.category}</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <p className="font-bold text-green-600 whitespace-nowrap">
                              ${source.amount.toFixed(2)}
                            </p>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setEditingIncome(source);
                                setIncomeDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600"
                              onClick={() => handleDeleteIncome(source.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      )}
                      {/* Menú de 3 puntos solo en móvil */}
                      {isMobile && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 ml-2 shrink-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingIncome(source);
                                setIncomeDialogOpen(true);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteIncome(source.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recurring Expenses Tab */}
        <TabsContent value="expenses" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Gastos Recurrentes</CardTitle>
              <Button
                size="sm"
                onClick={() => {
                  setEditingExpense(undefined);
                  setExpenseDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar
              </Button>
            </CardHeader>
            <CardContent>
              {recurringExpenses.length === 0 ? (
                <p className="text-center py-8 text-slate-500">
                  No hay gastos recurrentes. Agrega tu primer gasto.
                </p>
              ) : (
                <div className="space-y-2">
                  {recurringExpenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-start justify-between p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900"
                    >
                      {isMobile ? (
                        // Layout móvil: badges en una fila, nombre y precio en otra, menú de 3 puntos
                        <div className="flex-1 min-w-0">
                          {/* Primera fila: Badges */}
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              variant={expense.isEssential ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {expense.isEssential ? 'Esencial' : 'No esencial'}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {getFrequencyLabel(expense.frequency)}
                            </Badge>
                          </div>
                          {/* Segunda fila: Nombre y precio */}
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium truncate">{expense.name}</p>
                            <p className="font-bold text-red-600 whitespace-nowrap shrink-0">
                              ${expense.amount.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ) : (
                        // Layout desktop: layout original
                        <>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{expense.name}</p>
                              <Badge
                                variant={expense.isEssential ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {expense.isEssential ? 'Esencial' : 'No esencial'}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-500 mt-0.5">
                              {getFrequencyLabel(expense.frequency)} •{' '}
                              <span className="text-slate-400 capitalize">{expense.category}</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <p className="font-bold text-red-600 whitespace-nowrap">
                              ${expense.amount.toFixed(2)}
                            </p>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setEditingExpense(expense);
                                setExpenseDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600"
                              onClick={() => handleDeleteExpense(expense.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      )}
                      {/* Menú de 3 puntos solo en móvil */}
                      {isMobile && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 ml-2 shrink-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingExpense(expense);
                                setExpenseDialogOpen(true);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteExpense(expense.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <IncomeSourceDialog
        open={incomeDialogOpen}
        onOpenChange={(open) => {
          setIncomeDialogOpen(open);
          if (!open) setEditingIncome(undefined);
        }}
        incomeSource={editingIncome}
        onSave={handleSaveIncome}
      />

      <RecurringExpenseDialog
        open={expenseDialogOpen}
        onOpenChange={(open) => {
          setExpenseDialogOpen(open);
          if (!open) setEditingExpense(undefined);
        }}
        expense={editingExpense}
        onSave={handleSaveExpense}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={
          deleteType === 'income' ? '¿Eliminar fuente de ingreso?' : '¿Eliminar gasto recurrente?'
        }
        description={`Esta acción no se puede deshacer. Se eliminará ${deleteType === 'income' ? 'la fuente de ingreso' : 'el gasto recurrente'} permanentemente.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
