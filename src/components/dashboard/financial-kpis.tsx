'use client';

import { useState, useEffect } from 'react';
import { PiggyBank, TrendingUp, Wallet, Activity, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, cn } from '@/lib/utils';
import Link from 'next/link';
import type { ApiResponse } from '@/types/api.types';
import type {
  IncomeStatement,
  BalanceSheet,
  CashFlowStatement,
} from '@/types/financial-reports.types';

export function FinancialKPIs() {
  const [incomeStatement, setIncomeStatement] = useState<IncomeStatement | null>(null);
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheet | null>(null);
  const [cashFlow, setCashFlow] = useState<CashFlowStatement | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        // Configurar fechas del mes actual
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const [incomeRes, balanceRes, cashFlowRes] = await Promise.all([
          fetch(
            `/api/financial-reports/income-statement?startDate=${monthStart.toISOString()}&endDate=${monthEnd.toISOString()}`
          ),
          fetch(`/api/financial-reports/balance-sheet?date=${monthEnd.toISOString()}`),
          fetch(
            `/api/financial-reports/cash-flow?startDate=${monthStart.toISOString()}&endDate=${monthEnd.toISOString()}`
          ),
        ]);

        const [incomeData, balanceData, cashFlowData] = await Promise.all([
          incomeRes.json() as Promise<ApiResponse<IncomeStatement>>,
          balanceRes.json() as Promise<ApiResponse<BalanceSheet>>,
          cashFlowRes.json() as Promise<ApiResponse<CashFlowStatement>>,
        ]);

        if (incomeData.success && incomeData.data) {
          setIncomeStatement(incomeData.data);
        }
        if (balanceData.success && balanceData.data) {
          setBalanceSheet(balanceData.data);
        }
        if (cashFlowData.success && cashFlowData.data) {
          setCashFlow(cashFlowData.data);
        }
      } catch (error) {
        console.error('Error fetching financial KPIs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchFinancialData();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Estados Financieros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Estados Financieros del Mes</CardTitle>
        <Link href="/finance/reports">
          <Button variant="outline" size="sm" className="gap-2">
            Ver Detalles
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Ingreso Neto */}
          {incomeStatement && (
            <div className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Ingreso Neto
                </span>
              </div>
              <div
                className={cn(
                  'text-2xl font-bold',
                  incomeStatement.netIncome >= 0 ? 'text-emerald-600' : 'text-red-600'
                )}
              >
                {formatCurrency(Math.abs(incomeStatement.netIncome))}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Margen: {incomeStatement.netIncomeMargin.toFixed(1)}%
              </p>
            </div>
          )}

          {/* Patrimonio Neto */}
          {balanceSheet && (
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <PiggyBank className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Patrimonio Neto
                </span>
              </div>
              <div
                className={cn(
                  'text-2xl font-bold',
                  balanceSheet.netWorth >= 0 ? 'text-blue-600' : 'text-red-600'
                )}
              >
                {formatCurrency(Math.abs(balanceSheet.netWorth))}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Ratio deuda: {(balanceSheet.ratios.debtToAssets * 100).toFixed(1)}%
              </p>
            </div>
          )}

          {/* Liquidez */}
          {balanceSheet && (
            <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Liquidez
                </span>
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {balanceSheet.ratios.liquidityMonths.toFixed(1)}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">meses de cobertura</p>
            </div>
          )}

          {/* Flujo de Efectivo */}
          {cashFlow && (
            <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Flujo Neto
                </span>
              </div>
              <div
                className={cn(
                  'text-2xl font-bold',
                  cashFlow.netCashFlow >= 0 ? 'text-orange-600' : 'text-red-600'
                )}
              >
                {cashFlow.netCashFlow >= 0 ? '+' : ''}
                {formatCurrency(Math.abs(cashFlow.netCashFlow))}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Efectivo: {formatCurrency(cashFlow.endingCash)}
              </p>
            </div>
          )}
        </div>

        {/* Resumen rápido */}
        {incomeStatement && balanceSheet && cashFlow && (
          <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              <strong>Resumen:</strong>{' '}
              {incomeStatement.netIncome >= 0 ? 'Operaciones rentables' : 'Pérdidas operativas'}
              {' • '}
              {balanceSheet.netWorth >= 0 ? 'Patrimonio positivo' : 'Patrimonio negativo'}
              {' • '}
              Liquidez para{' '}
              {balanceSheet.ratios.liquidityMonths < 3
                ? '⚠️ pocos meses'
                : balanceSheet.ratios.liquidityMonths < 6
                  ? '✅ varios meses'
                  : '🎯 muchos meses'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
