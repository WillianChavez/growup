'use client';

import { TrendingUp, TrendingDown, Activity, Wallet, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DrillDownTable } from './drill-down-table';
import { CashFlowChart } from './cash-flow-chart';
import type { CashFlowStatement } from '@/types/financial-reports.types';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface CashFlowViewProps {
  data: CashFlowStatement;
}

export function CashFlowView({ data }: CashFlowViewProps) {
  const isPositiveFlow = data.netCashFlow >= 0;

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `flujo-efectivo-${new Date().toISOString().split('T')[0]}.json`;
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efectivo Inicial</CardTitle>
            <Wallet className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">
              {formatCurrency(data.startingCash)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flujo Neto</CardTitle>
            <Activity
              className={cn('h-4 w-4', isPositiveFlow ? 'text-emerald-600' : 'text-red-600')}
            />
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                'text-2xl font-bold',
                isPositiveFlow ? 'text-emerald-600' : 'text-red-600'
              )}
            >
              {isPositiveFlow ? '+' : ''}
              {formatCurrency(data.netCashFlow)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {isPositiveFlow ? 'Flujo positivo' : 'Flujo negativo'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efectivo Final</CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(data.endingCash)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Variación:{' '}
              {data.startingCash !== 0
                ? `${((data.netCashFlow / data.startingCash) * 100).toFixed(1)}%`
                : 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operaciones Netas</CardTitle>
            {data.operations.net >= 0 ? (
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                'text-2xl font-bold',
                data.operations.net >= 0 ? 'text-emerald-600' : 'text-red-600'
              )}
            >
              {formatCurrency(Math.abs(data.operations.net))}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Flujo operativo</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficas */}
      <CashFlowChart data={data} />

      {/* Desglose por tipo de flujo */}
      <div className="grid grid-cols-1 gap-6">
        {/* Flujo de Operaciones */}
        <Card>
          <CardHeader>
            <CardTitle className="text-blue-600">Flujo de Operaciones</CardTitle>
            <p className="text-sm text-slate-500">
              Ingresos y gastos de las actividades normales del negocio
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Entradas</p>
                <p className="text-xl font-bold text-emerald-600">
                  {formatCurrency(data.operations.inflows)}
                </p>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Salidas</p>
                <p className="text-xl font-bold text-red-600">
                  {formatCurrency(data.operations.outflows)}
                </p>
              </div>
              <div
                className={cn(
                  'text-center p-4 rounded-lg',
                  data.operations.net >= 0
                    ? 'bg-blue-50 dark:bg-blue-900/20'
                    : 'bg-orange-50 dark:bg-orange-900/20'
                )}
              >
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Neto</p>
                <p
                  className={cn(
                    'text-xl font-bold',
                    data.operations.net >= 0 ? 'text-blue-600' : 'text-orange-600'
                  )}
                >
                  {formatCurrency(data.operations.net)}
                </p>
              </div>
            </div>

            <DrillDownTable
              categories={data.operations.details}
              total={data.operations.inflows + data.operations.outflows}
              title=""
              showTransactions={true}
            />
          </CardContent>
        </Card>

        {/* Flujo de Inversión */}
        <Card>
          <CardHeader>
            <CardTitle className="text-purple-600">Flujo de Inversión</CardTitle>
            <p className="text-sm text-slate-500">Compra y venta de activos de largo plazo</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Ventas</p>
                <p className="text-xl font-bold text-emerald-600">
                  {formatCurrency(data.investing.sales)}
                </p>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Compras</p>
                <p className="text-xl font-bold text-red-600">
                  {formatCurrency(data.investing.purchases)}
                </p>
              </div>
              <div
                className={cn(
                  'text-center p-4 rounded-lg',
                  data.investing.net >= 0
                    ? 'bg-purple-50 dark:bg-purple-900/20'
                    : 'bg-orange-50 dark:bg-orange-900/20'
                )}
              >
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Neto</p>
                <p
                  className={cn(
                    'text-xl font-bold',
                    data.investing.net >= 0 ? 'text-purple-600' : 'text-orange-600'
                  )}
                >
                  {formatCurrency(data.investing.net)}
                </p>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.investing.details.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-slate-500">
                      No hay actividades de inversión
                    </TableCell>
                  </TableRow>
                ) : (
                  data.investing.details.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.description}</TableCell>
                      <TableCell
                        className={cn(
                          'text-right font-semibold',
                          item.amount >= 0 ? 'text-emerald-600' : 'text-red-600'
                        )}
                      >
                        {formatCurrency(Math.abs(item.amount))}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Flujo de Financiamiento */}
        <Card>
          <CardHeader>
            <CardTitle className="text-indigo-600">Flujo de Financiamiento</CardTitle>
            <p className="text-sm text-slate-500">Préstamos, pagos de deudas y financiamiento</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Préstamos</p>
                <p className="text-xl font-bold text-emerald-600">
                  {formatCurrency(data.financing.borrowing)}
                </p>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Pagos</p>
                <p className="text-xl font-bold text-red-600">
                  {formatCurrency(data.financing.repayment)}
                </p>
              </div>
              <div
                className={cn(
                  'text-center p-4 rounded-lg',
                  data.financing.net >= 0
                    ? 'bg-indigo-50 dark:bg-indigo-900/20'
                    : 'bg-orange-50 dark:bg-orange-900/20'
                )}
              >
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Neto</p>
                <p
                  className={cn(
                    'text-xl font-bold',
                    data.financing.net >= 0 ? 'text-indigo-600' : 'text-orange-600'
                  )}
                >
                  {formatCurrency(data.financing.net)}
                </p>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.financing.details.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-slate-500">
                      No hay actividades de financiamiento
                    </TableCell>
                  </TableRow>
                ) : (
                  data.financing.details.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.description}</TableCell>
                      <TableCell
                        className={cn(
                          'text-right font-semibold',
                          item.amount >= 0 ? 'text-emerald-600' : 'text-red-600'
                        )}
                      >
                        {formatCurrency(Math.abs(item.amount))}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Resumen del flujo */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Flujo de Efectivo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400">Efectivo Inicial</span>
              <span className="font-semibold">{formatCurrency(data.startingCash)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400 pl-4">
                + Flujo de Operaciones
              </span>
              <span
                className={cn(
                  'font-semibold',
                  data.operations.net >= 0 ? 'text-emerald-600' : 'text-red-600'
                )}
              >
                {formatCurrency(data.operations.net)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400 pl-4">+ Flujo de Inversión</span>
              <span
                className={cn(
                  'font-semibold',
                  data.investing.net >= 0 ? 'text-emerald-600' : 'text-red-600'
                )}
              >
                {formatCurrency(data.investing.net)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400 pl-4">
                + Flujo de Financiamiento
              </span>
              <span
                className={cn(
                  'font-semibold',
                  data.financing.net >= 0 ? 'text-emerald-600' : 'text-red-600'
                )}
              >
                {formatCurrency(data.financing.net)}
              </span>
            </div>
            <div className="h-px bg-slate-200 dark:bg-slate-700" />
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-900 dark:text-white">Efectivo Final</span>
              <span className="text-xl font-bold text-blue-600">
                {formatCurrency(data.endingCash)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
