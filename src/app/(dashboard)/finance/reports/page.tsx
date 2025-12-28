'use client';

import { useState, useEffect } from 'react';
import { Loader2, FileText, PieChart, Activity } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { PeriodSelector } from '@/components/financial-reports/period-selector';
import { IncomeStatementView } from '@/components/financial-reports/income-statement-view';
import { BalanceSheetView } from '@/components/financial-reports/balance-sheet-view';
import { CashFlowView } from '@/components/financial-reports/cash-flow-view';
import type {
  PeriodSelection,
  IncomeStatement,
  BalanceSheet,
  CashFlowStatement,
} from '@/types/financial-reports.types';
import type { ApiResponse } from '@/types/api.types';

export default function FinancialReportsPage() {
  const [activeTab, setActiveTab] = useState('income-statement');

  // Período seleccionado (por defecto: este mes)
  const [period, setPeriod] = useState<PeriodSelection>(() => {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return {
      preset: 'month',
      customRange: { startDate, endDate },
    };
  });

  // Estados de carga y datos
  const [incomeStatementData, setIncomeStatementData] = useState<IncomeStatement | null>(null);
  const [balanceSheetData, setBalanceSheetData] = useState<BalanceSheet | null>(null);
  const [cashFlowData, setCashFlowData] = useState<CashFlowStatement | null>(null);

  const [loadingIncome, setLoadingIncome] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [loadingCashFlow, setLoadingCashFlow] = useState(false);

  // Fetch Income Statement
  useEffect(() => {
    if (!period.customRange) return;

    const fetchIncomeStatement = async () => {
      setLoadingIncome(true);
      try {
        const { startDate, endDate } = period.customRange!;
        const params = new URLSearchParams({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });

        const response = await fetch(`/api/financial-reports/income-statement?${params}`);
        const data = (await response.json()) as ApiResponse<IncomeStatement>;

        if (data.success && data.data) {
          setIncomeStatementData(data.data);
        }
      } catch (error) {
        console.error('Error al cargar estado de resultados:', error);
      } finally {
        setLoadingIncome(false);
      }
    };

    void fetchIncomeStatement();
  }, [period]);

  // Fetch Balance Sheet
  useEffect(() => {
    if (!period.customRange) return;

    const fetchBalanceSheet = async () => {
      setLoadingBalance(true);
      try {
        const { endDate } = period.customRange!;
        const params = new URLSearchParams({
          date: endDate.toISOString(),
        });

        const response = await fetch(`/api/financial-reports/balance-sheet?${params}`);
        const data = (await response.json()) as ApiResponse<BalanceSheet>;

        if (data.success && data.data) {
          setBalanceSheetData(data.data);
        }
      } catch (error) {
        console.error('Error al cargar balance general:', error);
      } finally {
        setLoadingBalance(false);
      }
    };

    void fetchBalanceSheet();
  }, [period]);

  // Fetch Cash Flow
  useEffect(() => {
    if (!period.customRange) return;

    const fetchCashFlow = async () => {
      setLoadingCashFlow(true);
      try {
        const { startDate, endDate } = period.customRange!;
        const params = new URLSearchParams({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });

        const response = await fetch(`/api/financial-reports/cash-flow?${params}`);
        const data = (await response.json()) as ApiResponse<CashFlowStatement>;

        if (data.success && data.data) {
          setCashFlowData(data.data);
        }
      } catch (error) {
        console.error('Error al cargar flujo de efectivo:', error);
      } finally {
        setLoadingCashFlow(false);
      }
    };

    void fetchCashFlow();
  }, [period]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Estados Financieros</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Análisis completo de tu situación financiera
        </p>
      </div>

      {/* Selector de período */}
      <Card>
        <CardContent className="pt-6">
          <PeriodSelector value={period} onChange={setPeriod} />
        </CardContent>
      </Card>

      {/* Tabs de reportes */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="income-statement" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Estado de Resultados</span>
            <span className="sm:hidden">Resultados</span>
          </TabsTrigger>
          <TabsTrigger value="balance-sheet" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            <span className="hidden sm:inline">Balance General</span>
            <span className="sm:hidden">Balance</span>
          </TabsTrigger>
          <TabsTrigger value="cash-flow" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Flujo de Efectivo</span>
            <span className="sm:hidden">Flujo</span>
          </TabsTrigger>
        </TabsList>

        {/* Estado de Resultados */}
        <TabsContent value="income-statement" className="space-y-4">
          {loadingIncome ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                </div>
              </CardContent>
            </Card>
          ) : incomeStatementData ? (
            <IncomeStatementView data={incomeStatementData} />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12 text-slate-500">
                  No hay datos disponibles para este período
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Balance General */}
        <TabsContent value="balance-sheet" className="space-y-4">
          {loadingBalance ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                </div>
              </CardContent>
            </Card>
          ) : balanceSheetData ? (
            <BalanceSheetView data={balanceSheetData} />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12 text-slate-500">
                  No hay datos disponibles para esta fecha
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Flujo de Efectivo */}
        <TabsContent value="cash-flow" className="space-y-4">
          {loadingCashFlow ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                </div>
              </CardContent>
            </Card>
          ) : cashFlowData ? (
            <CashFlowView data={cashFlowData} />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12 text-slate-500">
                  No hay datos disponibles para este período
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
