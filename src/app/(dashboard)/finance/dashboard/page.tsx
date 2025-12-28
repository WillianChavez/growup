'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingDown, PiggyBank, CreditCard, Shield, TrendingUp } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Filler,
  Tooltip,
  Legend,
  type TooltipItem,
} from 'chart.js';
import { Line, Pie, Bar } from 'react-chartjs-2';
import { cn } from '@/lib/utils';
import type { FinancialDashboardKPIs } from '@/types/financial.types';
import type { MonthlyTransactionGroup } from '@/types/finance.types';
import type { BudgetSummary } from '@/types/budget.types';
import { formatCurrencyDisplay } from '@/lib/currency-utils';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Filler,
  Tooltip,
  Legend
);

export default function FinancialDashboardPage() {
  const [kpis, setKpis] = useState<FinancialDashboardKPIs | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyTransactionGroup[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadKPIs();
    loadMonthlyData();
    loadBudgetSummary();
  }, []);

  const loadKPIs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/financial/dashboard');
      if (response.ok) {
        const data = await response.json();
        setKpis(data.data);
      }
    } catch (error) {
      console.error('Error loading KPIs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMonthlyData = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const response = await fetch(`/api/transactions/monthly/${currentYear}`);
      if (response.ok) {
        const data = await response.json();
        setMonthlyData(data.data || []);
      }
    } catch (error) {
      console.error('Error loading monthly data:', error);
    }
  };

  const loadBudgetSummary = async () => {
    try {
      const response = await fetch('/api/budget/summary');
      if (response.ok) {
        const data = await response.json();
        setBudgetSummary(data.data);
      }
    } catch (error) {
      console.error('Error loading budget summary:', error);
    }
  };

  if (isLoading || !kpis) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3 animate-pulse" />
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const getSolvencyStatus = (ratio: number) => {
    if (ratio >= 6)
      return { label: 'Excelente', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950' };
    if (ratio >= 3)
      return { label: 'Bueno', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950' };
    if (ratio >= 1)
      return {
        label: 'Aceptable',
        color: 'text-yellow-600',
        bg: 'bg-yellow-50 dark:bg-yellow-950',
      };
    return { label: 'Riesgo', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950' };
  };

  const solvencyStatus = getSolvencyStatus(kpis.solvencyRatio);

  // Preparar datos para el pie chart de activos con Chart.js
  const pieChartJsData = {
    labels: ['Activos Líquidos', 'Activos No Líquidos'],
    datasets: [
      {
        data: [kpis.liquidAssets, kpis.illiquidAssets],
        backgroundColor: ['#669bbc', '#003049'],
        borderColor: ['#669bbc', '#003049'],
        borderWidth: 1,
      },
    ],
  };

  const pieChartJsOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
      },
      tooltip: {
        callbacks: {
          label: function (context: TooltipItem<'pie'>) {
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0) as number;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
            return `${context.label}: ${formatCurrencyDisplay(value)} (${percentage}%)`;
          },
        },
      },
    },
  };

  // Preparar datos para el gráfico de barras horizontal de presupuesto
  const budgetChartData = budgetSummary
    ? {
        labels: budgetSummary.expensesByCategory
          .filter(
            (cat: (typeof budgetSummary.expensesByCategory)[0]) =>
              cat.amount > 0 || cat.actualAmount > 0
          )
          .map((cat: (typeof budgetSummary.expensesByCategory)[0]) => cat.categoryName),
        datasets: [
          {
            label: 'Planeado',
            data: budgetSummary.expensesByCategory
              .filter(
                (cat: (typeof budgetSummary.expensesByCategory)[0]) =>
                  cat.amount > 0 || cat.actualAmount > 0
              )
              .map((cat: (typeof budgetSummary.expensesByCategory)[0]) => cat.amount),
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 1,
          },
          {
            label: 'Real',
            data: budgetSummary.expensesByCategory
              .filter(
                (cat: (typeof budgetSummary.expensesByCategory)[0]) =>
                  cat.amount > 0 || cat.actualAmount > 0
              )
              .map((cat: (typeof budgetSummary.expensesByCategory)[0]) => cat.actualAmount),
            backgroundColor: 'rgba(239, 68, 68, 0.5)',
            borderColor: 'rgb(239, 68, 68)',
            borderWidth: 1,
          },
        ],
      }
    : null;

  const budgetChartOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
      },
      tooltip: {
        callbacks: {
          label: function (context: TooltipItem<'bar'>) {
            const value = context.parsed.x;
            if (value === null || value === undefined) return '';
            const datasetLabel = context.dataset.label || '';
            const total = budgetSummary?.totalMonthlyExpenses || 1;
            const percentage = ((value / total) * 100).toFixed(1);
            return `${datasetLabel}: ${formatCurrencyDisplay(value)} (${percentage}% del ppto total)`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
    },
  };

  // Preparar datos para el gráfico de barras apiladas (ingresos y gastos por mes)
  const monthNames = [
    'Ene',
    'Feb',
    'Mar',
    'Abr',
    'May',
    'Jun',
    'Jul',
    'Ago',
    'Sep',
    'Oct',
    'Nov',
    'Dic',
  ];

  const currentYear = new Date().getFullYear();

  // Crear un mapa de los datos existentes por mes
  const dataByMonth = new Map<string, { income: number; expenses: number }>();
  monthlyData.forEach((group: MonthlyTransactionGroup) => {
    if (group.year === currentYear) {
      const monthKey = group.month; // 'yyyy-MM'
      dataByMonth.set(monthKey, {
        income: group.totalIncome,
        expenses: group.totalExpenses,
      });
    }
  });

  // Crear datos para los 12 meses del año, rellenando con 0 si no hay datos
  const areaChartData = Array.from({ length: 12 }, (_, index) => {
    const monthNumber = index + 1;
    const monthKey = `${currentYear}-${monthNumber.toString().padStart(2, '0')}`;
    const data = dataByMonth.get(monthKey) || { income: 0, expenses: 0 };

    return {
      month: monthNames[index],
      fullMonth: monthKey,
      income: data.income,
      expenses: data.expenses,
    };
  });

  // Preparar datos para Chart.js
  const chartJsData = {
    labels: areaChartData.map((d) => d.month),
    datasets: [
      {
        label: 'Gastos',
        data: areaChartData.map((d) => d.expenses),
        borderColor: 'hsl(0, 84%, 60%)',
        backgroundColor: 'hsla(0, 84%, 60%, 0.4)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Ingresos',
        data: areaChartData.map((d) => d.income),
        borderColor: 'hsl(142, 76%, 36%)',
        backgroundColor: 'hsla(142, 76%, 36%, 0.4)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartJsOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: function (context: TooltipItem<'line'>) {
            const value = context.parsed.y;
            if (value === null) return '';
            return `${context.dataset.label}: ${formatCurrencyDisplay(value)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 12,
          },
        },
      },
      y: {
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: {
            size: 12,
          },
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          Dashboard Financiero
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Panorama completo de tu salud financiera
        </p>
      </motion.div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 xs:grid-cols-2 lg:grid-cols-3">
        {/* ... existing cards ... */}
        {/* Presupuesto vs Real (New Highlights) */}
        {budgetSummary && (
          <Card className="col-span-1 xs:col-span-2 lg:col-span-3 border-2 border-slate-100 dark:border-slate-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">Resumen de Presupuesto</CardTitle>
                  <CardDescription>
                    Comparación de gastos planeados vs reales este mes
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {formatCurrencyDisplay(budgetSummary.actualMonthlyExpenses)}
                    <span className="text-sm font-normal text-slate-500 ml-1">
                      de {formatCurrencyDisplay(budgetSummary.totalMonthlyExpenses)}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Gasto Actual
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Barra de progreso global */}
                <div className="space-y-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      Progreso Total
                    </span>
                    <span
                      className={cn(
                        'font-bold',
                        budgetSummary.actualMonthlyExpenses > budgetSummary.totalMonthlyExpenses
                          ? 'text-red-500'
                          : 'text-blue-500'
                      )}
                    >
                      {(
                        (budgetSummary.actualMonthlyExpenses / budgetSummary.totalMonthlyExpenses) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min((budgetSummary.actualMonthlyExpenses / budgetSummary.totalMonthlyExpenses) * 100, 100)}%`,
                      }}
                      className={cn(
                        'h-full transition-all duration-500',
                        budgetSummary.actualMonthlyExpenses > budgetSummary.totalMonthlyExpenses
                          ? 'bg-red-500'
                          : 'bg-blue-500'
                      )}
                    />
                  </div>
                </div>

                {/* Categorías excedidas */}
                {budgetSummary.expensesByCategory.some(
                  (cat) => cat.amount > 0 && cat.actualAmount > cat.amount
                ) && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/30">
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold text-sm mb-2">
                      <TrendingUp className="h-4 w-4" />
                      <span>Categorías Excedidas</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {budgetSummary.expensesByCategory
                        .filter((cat) => cat.amount > 0 && cat.actualAmount > cat.amount)
                        .map((cat, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between bg-white/50 dark:bg-black/20 p-2 rounded border border-red-50 dark:border-red-900/10"
                          >
                            <span className="text-xs font-semibold">{cat.categoryName}</span>
                            <span className="text-xs font-bold text-red-600">
                              +{formatCurrencyDisplay(cat.actualAmount - cat.amount)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ingreso Mensual */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ingreso Mensual Planeado</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrencyDisplay(kpis.monthlyIncome)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Total de ingresos recurrentes</p>
          </CardContent>
        </Card>

        {/* Gastos Mensuales Planeados */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Gastos Mensuales Planeados</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrencyDisplay(kpis.monthlyExpenses)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {kpis.monthlyIncome > 0
                ? ((kpis.monthlyExpenses / kpis.monthlyIncome) * 100).toFixed(1)
                : 0}
              % del ingreso planeado
            </p>
          </CardContent>
        </Card>

        {/* Pago a Deudas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pago a Deudas Mensual</CardTitle>
            <CreditCard className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrencyDisplay(kpis.monthlyDebts)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {kpis.monthlyIncome > 0
                ? ((kpis.monthlyDebts / kpis.monthlyIncome) * 100).toFixed(1)
                : 0}
              % del ingreso
            </p>
          </CardContent>
        </Card>

        {/* Deuda Total */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Deuda Total</CardTitle>
            <CreditCard className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrencyDisplay(kpis.totalDebt)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Consumo: {formatCurrencyDisplay(kpis.consumptionDebtPayment)}/mes
            </p>
          </CardContent>
        </Card>

        {/* Total Activos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Activos Totales</CardTitle>
            <PiggyBank className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrencyDisplay(kpis.totalAssets)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {kpis.liquidAssetsPercentage.toFixed(1)}% líquidos
            </p>
          </CardContent>
        </Card>

        {/* Nivel de Solvencia */}
        <Card className={solvencyStatus.bg}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Nivel de Solvencia</CardTitle>
            <Shield className={`h-4 w-4 ${solvencyStatus.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${solvencyStatus.color}`}>
              {kpis.solvencyRatio.toFixed(1)}x
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {solvencyStatus.label} • {kpis.solvencyRatio.toFixed(1)} meses de cobertura
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Pie Chart de Activos */}
        {kpis.totalAssets > 0 && (
          <Card className="flex flex-col">
            <CardHeader className="items-center pb-0">
              <CardTitle>Distribución de Activos</CardTitle>
              <CardDescription>Activos líquidos vs no líquidos</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
              <div className="mx-auto aspect-square max-h-[250px]">
                <Pie data={pieChartJsData} options={pieChartJsOptions} />
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-2 text-sm">
              <div className="flex items-center gap-2 leading-none font-medium">
                Activos totales: {formatCurrencyDisplay(kpis.totalAssets)}{' '}
                <TrendingUp className="h-4 w-4" />
              </div>
              <div className="text-muted-foreground leading-none">
                {kpis.liquidAssetsPercentage.toFixed(1)}% líquidos •{' '}
                {kpis.illiquidAssetsPercentage.toFixed(1)}% no líquidos
              </div>
            </CardFooter>
          </Card>
        )}

        {/* Gráfico de Presupuesto - Gastos por Categoría */}
        {budgetSummary && budgetChartData && budgetSummary.expensesByCategory.length > 0 && (
          <Card className="flex flex-col">
            <CardHeader className="items-center pb-0">
              <CardTitle>Gastos del Presupuesto</CardTitle>
              <CardDescription>Distribución de gastos por categoría</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
              <div className="h-[250px] w-full">
                <Bar data={budgetChartData} options={budgetChartOptions} />
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-2 text-sm">
              <div className="flex items-center gap-2 leading-none font-medium">
                Total gastos: {formatCurrencyDisplay(budgetSummary.totalMonthlyExpenses)}/mes
                <TrendingUp className="h-4 w-4" />
              </div>
              <div className="text-muted-foreground leading-none">
                Balance disponible: {formatCurrencyDisplay(budgetSummary.availableBalance)} •{' '}
                {budgetSummary.savingsRate.toFixed(1)}% ahorro
              </div>
            </CardFooter>
          </Card>
        )}

        {/* Deudas por Tipo */}
        {kpis.debtsByType.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Distribución de Deudas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {kpis.debtsByType.map((debt, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{debt.type}</span>
                      <span className="text-slate-600 dark:text-slate-400">
                        {formatCurrencyDisplay(debt.amount)} ({debt.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full"
                          style={{ width: `${debt.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 whitespace-nowrap">
                        {formatCurrencyDisplay(debt.monthlyPayment)}/mes
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Area Chart - Ingresos y Gastos por Mes */}
      <Card>
        <CardHeader>
          <CardTitle>Ingresos y Gastos por Mes</CardTitle>
          <CardDescription>
            {currentYear} - Comparativa mensual de ingresos y gastos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full">
            <Line data={chartJsData} options={chartJsOptions} />
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex w-full items-start gap-2 text-sm">
            <div className="grid gap-2">
              <div className="flex flex-wrap items-center gap-2 leading-none font-medium">
                <span>
                  Total del año: Ingresos $
                  {formatCurrencyDisplay(
                    areaChartData.reduce((sum, d) => sum + d.income, 0)
                  ).replace('$', '')}
                </span>
                <span>•</span>
                <span>
                  Gastos $
                  {formatCurrencyDisplay(
                    areaChartData.reduce((sum, d) => sum + d.expenses, 0)
                  ).replace('$', '')}
                </span>
                <TrendingUp className="h-4 w-4" />
              </div>
              <div className="text-muted-foreground leading-none">
                Comparativa de ingresos y gastos mensuales del año {currentYear}
              </div>
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
          onClick={() => (window.location.href = '/finance/budget')}
        >
          <CardContent className="pt-6 text-center">
            <div className="text-4xl mb-2">📊</div>
            <h3 className="font-semibold">Presupuesto</h3>
            <p className="text-xs text-slate-500 mt-1">Ingresos y gastos</p>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
          onClick={() => (window.location.href = '/finance')}
        >
          <CardContent className="pt-6 text-center">
            <div className="text-4xl mb-2">💰</div>
            <h3 className="font-semibold">Transacciones</h3>
            <p className="text-xs text-slate-500 mt-1">Registros diarios</p>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
          onClick={() => (window.location.href = '/finance/assets')}
        >
          <CardContent className="pt-6 text-center">
            <div className="text-4xl mb-2">💰</div>
            <h3 className="font-semibold">Activos</h3>
            <p className="text-xs text-slate-500 mt-1">Gestión patrimonial</p>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
          onClick={() => (window.location.href = '/finance/debts')}
        >
          <CardContent className="pt-6 text-center">
            <div className="text-4xl mb-2">💳</div>
            <h3 className="font-semibold">Deudas</h3>
            <p className="text-xs text-slate-500 mt-1">Control de deudas</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
