'use client';

import { Wallet, TrendingDown, PiggyBank, Activity, Download } from 'lucide-react';
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
import { BalanceSheetChart } from './balance-sheet-chart';
import type { BalanceSheet } from '@/types/financial-reports.types';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface BalanceSheetViewProps {
  data: BalanceSheet;
}

export function BalanceSheetView({ data }: BalanceSheetViewProps) {
  const isPositiveEquity = data.equity >= 0;

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `balance-general-${new Date().toISOString().split('T')[0]}.json`;
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
            <CardTitle className="text-sm font-medium">Activos Totales</CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(data.assets.total)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Líquidos: {formatCurrency(data.assets.liquid.reduce((sum, a) => sum + a.amount, 0))}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pasivos Totales</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(data.liabilities.total)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Ratio: {(data.ratios.debtToAssets * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card
          className={cn(
            isPositiveEquity
              ? 'border-emerald-200 dark:border-emerald-800'
              : 'border-red-200 dark:border-red-800'
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patrimonio Neto</CardTitle>
            <PiggyBank
              className={cn('h-4 w-4', isPositiveEquity ? 'text-emerald-600' : 'text-red-600')}
            />
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                'text-2xl font-bold',
                isPositiveEquity ? 'text-emerald-600' : 'text-red-600'
              )}
            >
              {formatCurrency(Math.abs(data.netWorth))}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {isPositiveEquity ? 'Posición saludable' : 'Requiere atención'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Liquidez</CardTitle>
            <Activity className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">
              {data.ratios.liquidityMonths.toFixed(1)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">meses de cobertura</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficas */}
      <BalanceSheetChart data={data} />

      {/* Tablas de activos y pasivos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-blue-600">Activos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Activos Líquidos */}
            <div>
              <h4 className="text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                Activos Líquidos
              </h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.assets.liquid.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-slate-500">
                        No hay activos líquidos
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.assets.liquid.map((asset) => (
                      <TableRow key={asset.id}>
                        <TableCell className="font-medium">{asset.name}</TableCell>
                        <TableCell className="text-right">{formatCurrency(asset.amount)}</TableCell>
                        <TableCell className="text-right text-slate-600 dark:text-slate-400">
                          {asset.percentage.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Activos Ilíquidos */}
            <div>
              <h4 className="text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                Activos Ilíquidos
              </h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.assets.illiquid.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-slate-500">
                        No hay activos ilíquidos
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.assets.illiquid.map((asset) => (
                      <TableRow key={asset.id}>
                        <TableCell className="font-medium">{asset.name}</TableCell>
                        <TableCell className="text-right">{formatCurrency(asset.amount)}</TableCell>
                        <TableCell className="text-right text-slate-600 dark:text-slate-400">
                          {asset.percentage.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="pt-2 border-t">
              <div className="flex justify-between items-center font-bold">
                <span>Total Activos</span>
                <span className="text-blue-600">{formatCurrency(data.assets.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pasivos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-orange-600">Pasivos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Pasivos Corrientes */}
            <div>
              <h4 className="text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                Pasivos Corrientes (Corto Plazo)
              </h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Acreedor</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead className="text-right">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.liabilities.current.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-slate-500">
                        No hay pasivos corrientes
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.liabilities.current.map((debt) => (
                      <TableRow key={debt.id}>
                        <TableCell className="font-medium">{debt.creditor}</TableCell>
                        <TableCell className="text-right">{formatCurrency(debt.amount)}</TableCell>
                        <TableCell className="text-right text-slate-600 dark:text-slate-400">
                          {debt.percentage.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pasivos a Largo Plazo */}
            <div>
              <h4 className="text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                Pasivos a Largo Plazo
              </h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Acreedor</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead className="text-right">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.liabilities.longTerm.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-slate-500">
                        No hay pasivos a largo plazo
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.liabilities.longTerm.map((debt) => (
                      <TableRow key={debt.id}>
                        <TableCell className="font-medium">{debt.creditor}</TableCell>
                        <TableCell className="text-right">{formatCurrency(debt.amount)}</TableCell>
                        <TableCell className="text-right text-slate-600 dark:text-slate-400">
                          {debt.percentage.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="pt-2 border-t">
              <div className="flex justify-between items-center font-bold">
                <span>Total Pasivos</span>
                <span className="text-orange-600">{formatCurrency(data.liabilities.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ecuación contable */}
      <Card>
        <CardHeader>
          <CardTitle>Ecuación Contable</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400">Activos Totales</span>
              <span className="font-semibold text-blue-600">
                {formatCurrency(data.assets.total)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400">Pasivos Totales</span>
              <span className="font-semibold text-orange-600">
                - {formatCurrency(data.liabilities.total)}
              </span>
            </div>
            <div className="h-px bg-slate-200 dark:bg-slate-700" />
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-900 dark:text-white">Patrimonio Neto</span>
              <span
                className={cn(
                  'text-xl font-bold',
                  isPositiveEquity ? 'text-emerald-600' : 'text-red-600'
                )}
              >
                {formatCurrency(data.netWorth)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
