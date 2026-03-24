'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Plus,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  History,
  Menu,
  PieChart,
  CreditCard,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTransactions } from '@/hooks/useTransactions';
import { TransactionDialog } from '@/components/finance/transaction-dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/useIsMobile';
import {
  format,
  isSameDay,
  subDays,
  addDays,
  subWeeks,
  addWeeks,
  subMonths,
  addMonths,
  differenceInCalendarDays,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isSameMonth,
  isSameWeek,
} from 'date-fns';
import { es } from 'date-fns/locale';
import type { Transaction, TransactionFormData } from '@/types/finance.types';
import { formatCurrencyDisplay } from '@/lib/currency-utils';
import { cn } from '@/lib/utils';

type TimeRange = 'Día' | 'Semana' | 'Mes';

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('Semana');
  const [referenceDate, setReferenceDate] = useState(new Date());
  const isMobile = useIsMobile();

  const { fetchTransactions, createTransaction, updateTransaction, deleteTransaction, isLoading } =
    useTransactions();

  const loadTransactions = async () => {
    const data = await fetchTransactions();
    setTransactions(data);
  };

  useEffect(() => {
    void loadTransactions();
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
  };

  const handleConfirmDelete = async () => {
    if (transactionToDelete) {
      await deleteTransaction(transactionToDelete);
      await loadTransactions();
      setTransactionToDelete(null);
    }
  };

  // Calcular estadísticas por período
  const getStatsByTimeRange = useMemo(() => {
    let startDate: Date;
    let endDate: Date = endOfDay(referenceDate);

    switch (timeRange) {
      case 'Día':
        startDate = startOfDay(referenceDate);
        break;
      case 'Semana':
        startDate = startOfWeek(referenceDate, { locale: es });
        endDate = endOfWeek(referenceDate, { locale: es });
        break;
      case 'Mes':
        startDate = startOfMonth(referenceDate);
        endDate = endOfMonth(referenceDate);
        break;
    }

    const filteredTransactions = transactions.filter((t) => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });

    const ingresos = filteredTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const egresos = filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Calcular gastos por categoría
    const expensesByCategory = filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce(
        (acc, transaction) => {
          const categoryName = transaction.category?.name || 'Sin categoría';
          if (!acc[categoryName]) {
            acc[categoryName] = {
              name: categoryName,
              amount: 0,
              emoji: transaction.category?.emoji || '💰',
            };
          }
          acc[categoryName].amount += transaction.amount;
          return acc;
        },
        {} as Record<string, { name: string; amount: number; emoji: string }>
      );

    const totalExpenses = Object.values(expensesByCategory).reduce(
      (sum, cat) => sum + cat.amount,
      0
    );

    const categoryBreakdown = Object.values(expensesByCategory)
      .map((cat) => ({
        ...cat,
        percentage: totalExpenses > 0 ? (cat.amount / totalExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return {
      startDate,
      endDate,
      balance: ingresos - egresos,
      ingresos,
      egresos,
      categoryBreakdown,
      transactions: filteredTransactions.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      }),
    };
  }, [referenceDate, transactions, timeRange]);

  const goToPreviousPeriod = () => {
    setReferenceDate((current) => {
      switch (timeRange) {
        case 'Día':
          return subDays(current, 1);
        case 'Semana':
          return subWeeks(current, 1);
        case 'Mes':
          return subMonths(current, 1);
      }
    });
  };

  const goToNextPeriod = () => {
    setReferenceDate((current) => {
      switch (timeRange) {
        case 'Día':
          return addDays(current, 1);
        case 'Semana':
          return addWeeks(current, 1);
        case 'Mes':
          return addMonths(current, 1);
      }
    });
  };

  const isCurrentPeriod = useMemo(() => {
    const now = new Date();

    switch (timeRange) {
      case 'Día':
        return isSameDay(referenceDate, now);
      case 'Semana':
        return isSameWeek(referenceDate, now, { locale: es });
      case 'Mes':
        return isSameMonth(referenceDate, now);
    }
  }, [referenceDate, timeRange]);

  const periodLabel = useMemo(() => {
    const { startDate, endDate } = getStatsByTimeRange;

    switch (timeRange) {
      case 'Día':
        return format(startDate, "EEEE, d 'de' MMMM", { locale: es });
      case 'Semana':
        return `${format(startDate, 'd MMM', { locale: es })} - ${format(endDate, 'd MMM yyyy', {
          locale: es,
        })}`;
      case 'Mes':
        return format(startDate, "MMMM 'de' yyyy", { locale: es });
    }
  }, [getStatsByTimeRange, timeRange]);

  // Formatear fecha relativa
  const formatRelativeDate = (date: Date): string => {
    if (isSameDay(date, referenceDate)) return 'Hoy';
    if (isSameDay(date, subDays(referenceDate, 1))) return 'Ayer';
    const daysDiff = differenceInCalendarDays(referenceDate, date);
    if (daysDiff <= 7) {
      return format(date, 'EEEE', { locale: es });
    }
    return format(date, 'd MMM', { locale: es });
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header Compacto */}
      <header className="px-4 sm:px-6 lg:px-10 pt-6 sm:pt-8 pb-4 lg:py-6 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0">
        <div className="flex justify-between items-center mb-4 sm:mb-6 lg:mb-0">
          <div className="lg:hidden flex-1">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
              Resumen
            </p>
            <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
              Mi Cartera
            </h1>
          </div>
          <div className="hidden lg:block">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
              Dashboard General
            </h2>
            <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">
              Gestiona tus finanzas de un vistazo
            </p>
          </div>
          {/* Menú de navegación - Móvil */}
          <div className="lg:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => (window.location.href = '/finance/dashboard')}
                  className="flex items-center gap-2"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => (window.location.href = '/finance/reports')}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Reportes
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => (window.location.href = '/finance/budget')}
                  className="flex items-center gap-2"
                >
                  <PieChart className="h-4 w-4" />
                  Presupuesto
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => (window.location.href = '/finance/assets')}
                  className="flex items-center gap-2"
                >
                  <Wallet className="h-4 w-4" />
                  Activos
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => (window.location.href = '/finance/debts')}
                  className="flex items-center gap-2"
                >
                  <CreditCard className="h-4 w-4" />
                  Deudas
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {/* Botones de navegación - Desktop */}
          <div className="hidden lg:flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => (window.location.href = '/finance/dashboard')}
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => (window.location.href = '/finance/reports')}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <FileText className="mr-2 h-4 w-4" />
              Reportes
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => (window.location.href = '/finance/budget')}
            >
              Presupuesto
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => (window.location.href = '/finance/assets')}
            >
              Activos
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => (window.location.href = '/finance/debts')}
            >
              Deudas
            </Button>
          </div>
        </div>

        {/* Selector de Tiempo y Botones de Acción - Desktop */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 lg:mt-6">
          <div className="flex flex-col gap-3 w-full md:w-auto">
            <div className="flex p-1 bg-slate-200/50 dark:bg-slate-800 rounded-2xl w-full md:w-80">
              {(['Día', 'Semana', 'Mes'] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={cn(
                    'flex-1 py-2.5 text-xs font-black rounded-xl transition-all',
                    timeRange === range
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                  )}
                >
                  {range}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-2 py-2 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <Button
                variant="ghost"
                size="icon"
                onClick={goToPreviousPeriod}
                className="h-9 w-9 rounded-xl shrink-0"
                aria-label={`Ir al ${timeRange.toLowerCase()} anterior`}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0 flex-1 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                  Período seleccionado
                </p>
                <p className="truncate text-sm font-bold text-slate-700 dark:text-slate-200 capitalize">
                  {periodLabel}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={goToNextPeriod}
                disabled={isCurrentPeriod}
                className="h-9 w-9 rounded-xl shrink-0"
                aria-label={`Ir al siguiente ${timeRange.toLowerCase()}`}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Botones de acción - Solo Desktop */}
          <div className="hidden lg:flex items-center gap-3">
            <Button
              onClick={() => handleOpenDialog('expense')}
              variant="outline"
              className="flex items-center gap-2 px-6 py-3 bg-white border border-rose-100 dark:border-rose-900 text-rose-500 dark:text-rose-400 rounded-2xl font-black text-sm hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all shadow-sm shadow-rose-100 dark:shadow-rose-900/20"
            >
              <Minus size={18} strokeWidth={3} /> GASTO
            </Button>
            <Button
              onClick={() => handleOpenDialog('income')}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm transition-all shadow-lg shadow-indigo-100 dark:shadow-indigo-900/50"
            >
              <Plus size={18} strokeWidth={3} /> INGRESO
            </Button>
          </div>
        </div>
      </header>

      {/* Contenido Desplazable */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-10 py-4 sm:py-6 lg:py-8 pb-24 lg:pb-10 space-y-6 lg:space-y-8">
        {/* Grid Layout para Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Columna Izquierda: Balance y Stats (Desktop) */}
          <div className="lg:col-span-1 space-y-6">
            {/* Card de Balance Principal - Móvil */}
            <div className="lg:hidden bg-linear-to-br from-indigo-600 to-indigo-800 rounded-3xl p-6 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50">
              <div className="flex justify-between items-start">
                <p className="text-indigo-100 text-sm font-medium">Balance total ({timeRange})</p>
                <Wallet size={20} className="text-indigo-200" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mt-2">
                {formatCurrencyDisplay(getStatsByTimeRange.balance)}
              </h2>

              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-400/20 rounded-full">
                    <TrendingUp size={14} className="text-emerald-300" />
                  </div>
                  <div>
                    <p className="text-[10px] text-indigo-200 font-bold uppercase">Ingresos</p>
                    <p className="font-bold text-sm text-emerald-300">
                      +{formatCurrencyDisplay(getStatsByTimeRange.ingresos)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-rose-400/20 rounded-full">
                    <TrendingDown size={14} className="text-rose-300" />
                  </div>
                  <div>
                    <p className="text-[10px] text-indigo-200 font-bold uppercase">Egresos</p>
                    <p className="font-bold text-sm text-rose-300">
                      -{formatCurrencyDisplay(getStatsByTimeRange.egresos)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card de Balance Principal - Desktop */}
            <div className="hidden lg:block bg-slate-900 dark:bg-slate-950 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex justify-between items-center opacity-70 mb-2">
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Balance Disponible
                  </span>
                  <Wallet size={18} />
                </div>
                <h2 className="text-4xl font-black tracking-tighter mb-8">
                  {formatCurrencyDisplay(getStatsByTimeRange.balance)}
                </h2>

                <div className="space-y-4">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/5 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-bold text-emerald-400 uppercase">Ingresos</p>
                      <p className="text-lg font-black text-white">
                        +{formatCurrencyDisplay(getStatsByTimeRange.ingresos)}
                      </p>
                    </div>
                    <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                      <TrendingUp size={20} />
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/5 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-bold text-rose-400 uppercase">Egresos</p>
                      <p className="text-lg font-black text-white">
                        -{formatCurrencyDisplay(getStatsByTimeRange.egresos)}
                      </p>
                    </div>
                    <div className="p-2 bg-rose-500/20 rounded-lg text-rose-400">
                      <TrendingDown size={20} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            </div>

            {/* Mini Gráfico de Categorías - Solo Desktop */}
            {getStatsByTimeRange.categoryBreakdown.length > 0 && (
              <div className="hidden lg:block bg-white dark:bg-slate-900 p-6 rounded-4xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-4">
                  Gasto por categoría
                </h4>
                <div className="space-y-3">
                  {getStatsByTimeRange.categoryBreakdown.map((cat, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        <span>
                          {cat.emoji} {cat.name}
                        </span>
                        <span>{cat.percentage.toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 dark:bg-indigo-400"
                          style={{ width: `${cat.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Columna Derecha: Historial de Transacciones */}
          <div className="lg:col-span-2 space-y-4 flex flex-col">
            <div className="flex items-center justify-between px-1 shrink-0">
              <h3 className="font-black text-slate-800 dark:text-white uppercase text-xs tracking-widest">
                Actividad Reciente
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                onClick={() => (window.location.href = '/finance/dashboard')}
              >
                Ver reporte completo
              </Button>
            </div>

            {/* Contenedor con scroll para desktop */}
            <div className="flex-1 lg:overflow-y-auto lg:max-h-[calc(100vh-280px)] lg:pr-2">
              {isLoading ? (
                <div className="grid grid-cols-1 gap-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-3xl" />
                  ))}
                </div>
              ) : getStatsByTimeRange.transactions.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12 px-4">
                    <div className="relative mb-4 inline-block">
                      <div className="absolute inset-0 bg-linear-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full blur-2xl" />
                      <Wallet className="relative h-16 w-16 text-blue-500 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                      No hay transacciones
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 text-center max-w-md">
                      Comienza a registrar tus ingresos y gastos para tener un mejor control de tus
                      finanzas.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleOpenDialog('income')}
                        className="bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Agregar Ingreso
                      </Button>
                      <Button
                        onClick={() => handleOpenDialog('expense')}
                        className="bg-linear-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700"
                      >
                        <Minus className="mr-2 h-4 w-4" />
                        Agregar Gasto
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {getStatsByTimeRange.transactions.map((transaction) => {
                    const isIncome = transaction.type === 'income';
                    const transactionDate = new Date(transaction.date);

                    return (
                      <div
                        key={transaction.id}
                        className={cn(
                          'bg-white dark:bg-slate-900 p-4 lg:p-5 rounded-2xl lg:rounded-3xl flex items-center justify-between shadow-sm border border-slate-100 dark:border-slate-800 active:scale-95 lg:hover:border-indigo-100 dark:lg:hover:border-indigo-900 lg:hover:shadow-md transition-all cursor-pointer group',
                          isMobile ? '' : 'lg:group'
                        )}
                        onClick={() => handleOpenDialog(transaction.type, transaction)}
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div
                            className={cn(
                              'p-3 rounded-xl lg:rounded-2xl shrink-0 transition-colors',
                              isIncome
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 lg:group-hover:bg-emerald-100 dark:lg:group-hover:bg-emerald-900/30'
                                : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 lg:group-hover:bg-rose-100 dark:lg:group-hover:bg-rose-900/30'
                            )}
                          >
                            {isIncome ? (
                              <ArrowUpRight size={20} strokeWidth={isMobile ? 2 : 3} />
                            ) : (
                              <ArrowDownRight size={20} strokeWidth={isMobile ? 2 : 3} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm text-slate-800 dark:text-white truncate">
                              {transaction.description}
                            </h4>
                            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-tighter truncate">
                              {transaction.category?.emoji || '💰'}{' '}
                              {transaction.category?.name || 'Sin categoría'} •{' '}
                              {formatRelativeDate(transactionDate)}{' '}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 lg:gap-6 shrink-0">
                          <p
                            className={cn(
                              'font-black text-base',
                              isIncome
                                ? 'text-emerald-500 dark:text-emerald-400'
                                : 'text-slate-800 dark:text-white'
                            )}
                          >
                            {isIncome ? '+' : '-'}
                            {formatCurrencyDisplay(transaction.amount)}
                          </p>
                          <ChevronRight
                            size={18}
                            className="text-slate-200 dark:text-slate-700 lg:group-hover:text-slate-400 dark:lg:group-hover:text-slate-500 transition-colors"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Barra de Navegación Inferior - Solo Móvil */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-6 py-3 pb-6 flex items-center justify-between z-20">
          <Button
            variant="ghost"
            className="flex flex-col items-center gap-1 text-indigo-600 dark:text-indigo-400"
            onClick={() => (window.location.href = '/finance/dashboard')}
          >
            <LayoutDashboard size={22} />
            <span className="text-[10px] font-bold">Inicio</span>
          </Button>

          {/* Botones de Acción Centrales (FAB) */}
          <div className="flex items-center gap-4 -mt-12 bg-white dark:bg-slate-900 p-2 rounded-full shadow-xl shadow-slate-200 dark:shadow-slate-800 border border-slate-50 dark:border-slate-800">
            <Button
              onClick={() => handleOpenDialog('expense')}
              className="w-12 h-12 rounded-full bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-200 dark:shadow-rose-900/50 active:scale-90 transition-transform"
            >
              <Minus size={24} />
            </Button>
            <Button
              onClick={() => handleOpenDialog('income')}
              className="w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50 active:scale-90 transition-transform"
            >
              <Plus size={28} />
            </Button>
          </div>

          <Button
            variant="ghost"
            className="flex flex-col items-center gap-1 text-slate-400 dark:text-slate-500"
            onClick={() => (window.location.href = '/finance/dashboard')}
          >
            <History size={22} />
            <span className="text-[10px] font-bold">Reportes</span>
          </Button>
        </nav>
      )}

      {/* Botones de acción - Desktop */}
      {!isMobile && (
        <div className="fixed bottom-6 right-6 z-50 flex gap-3">
          <Button
            onClick={() => handleOpenDialog('expense')}
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg bg-linear-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 transition-all hover:scale-110 active:scale-95"
            aria-label="Agregar Gasto"
          >
            <Minus className="h-5 w-5" />
          </Button>
          <Button
            onClick={() => handleOpenDialog('income')}
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all hover:scale-110 active:scale-95"
            aria-label="Agregar Ingreso"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Degradado para indicar que hay más contenido al hacer scroll - Solo Móvil */}
      {isMobile && (
        <div className="fixed bottom-20 left-0 right-0 h-12 bg-linear-to-t from-slate-50 dark:from-slate-950 to-transparent pointer-events-none z-10" />
      )}

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
    </div>
  );
}
