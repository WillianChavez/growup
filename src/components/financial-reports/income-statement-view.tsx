'use client';

import { TrendingUp, TrendingDown, DollarSign, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DrillDownTable } from './drill-down-table';
import { IncomeStatementChart } from './income-statement-chart';
import type { IncomeStatement } from '@/types/financial-reports.types';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface IncomeStatementViewProps {
  data: IncomeStatement;
}

export function IncomeStatementView({ data }: IncomeStatementViewProps) {
  const isProfit = data.netIncome >= 0;

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `estado-resultados-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Botón de exportación */}
      <div className="flex justify-end">
        <Button onClick={handleExportJSON} variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Exportar JSON
        </Button>
      </div>
      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(data.revenue.total)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {data.revenue.categories.length} categorías
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos Totales</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(data.expenses.total)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {data.expenses.categories.length} categorías
            </p>
          </CardContent>
        </Card>

        <Card
          className={cn(
            isProfit
              ? 'border-emerald-200 dark:border-emerald-800'
              : 'border-red-200 dark:border-red-800'
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingreso Neto</CardTitle>
            <DollarSign className={cn('h-4 w-4', isProfit ? 'text-emerald-600' : 'text-red-600')} />
          </CardHeader>
          <CardContent>
            <div
              className={cn('text-2xl font-bold', isProfit ? 'text-emerald-600' : 'text-red-600')}
            >
              {formatCurrency(Math.abs(data.netIncome))}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Margen: {data.netIncomeMargin.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficas */}
      <IncomeStatementChart
        revenueCategories={data.revenue.categories}
        expenseCategories={data.expenses.categories}
      />

      {/* Tablas detalladas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-emerald-600">Ingresos</CardTitle>
          </CardHeader>
          <CardContent>
            <DrillDownTable
              categories={data.revenue.categories}
              total={data.revenue.total}
              title=""
              showTransactions={true}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Gastos</CardTitle>
          </CardHeader>
          <CardContent>
            <DrillDownTable
              categories={data.expenses.categories}
              total={data.expenses.total}
              title=""
              showTransactions={true}
            />
          </CardContent>
        </Card>
      </div>

      {/* Resumen */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen del Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400">Total Ingresos</span>
              <span className="font-semibold text-emerald-600">
                {formatCurrency(data.revenue.total)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400">Total Gastos</span>
              <span className="font-semibold text-red-600">
                - {formatCurrency(data.expenses.total)}
              </span>
            </div>
            <div className="h-px bg-slate-200 dark:bg-slate-700" />
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-900 dark:text-white">Ingreso Neto</span>
              <span
                className={cn('text-xl font-bold', isProfit ? 'text-emerald-600' : 'text-red-600')}
              >
                {isProfit ? '+' : '-'} {formatCurrency(Math.abs(data.netIncome))}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
