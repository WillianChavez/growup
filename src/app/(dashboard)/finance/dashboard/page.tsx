'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingDown, PiggyBank, CreditCard, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { FinancialDashboardKPIs } from '@/types/financial.types';

export default function FinancialDashboardPage() {
  const [kpis, setKpis] = useState<FinancialDashboardKPIs | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadKPIs();
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

  // Gráfico de activos líquidos vs no líquidos
  const assetsChartData = [
    { name: 'Activos Líquidos', value: kpis.liquidAssets, color: '#10b981' },
    { name: 'Activos No Líquidos', value: kpis.illiquidAssets, color: '#3b82f6' },
  ].filter((item) => item.value > 0);

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
        {/* Ingreso Mensual */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ingreso Mensual</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${kpis.monthlyIncome.toFixed(2)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Total de ingresos recurrentes</p>
          </CardContent>
        </Card>

        {/* Gastos Mensuales */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Gastos Mensuales</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ${kpis.monthlyExpenses.toFixed(2)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {kpis.monthlyIncome > 0
                ? ((kpis.monthlyExpenses / kpis.monthlyIncome) * 100).toFixed(1)
                : 0}
              % del ingreso
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
            <div className="text-2xl font-bold text-red-600">${kpis.monthlyDebts.toFixed(2)}</div>
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
            <div className="text-2xl font-bold text-red-600">${kpis.totalDebt.toFixed(2)}</div>
            <p className="text-xs text-slate-500 mt-1">
              Consumo: ${kpis.consumptionDebtPayment.toFixed(2)}/mes
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
            <div className="text-2xl font-bold text-blue-600">${kpis.totalAssets.toFixed(2)}</div>
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
        {/* Activos Líquidos vs No Líquidos */}
        {assetsChartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Distribución de Activos</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={assetsChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {assetsChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
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
                        ${debt.amount.toFixed(2)} ({debt.percentage.toFixed(1)}%)
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
                        ${debt.monthlyPayment.toFixed(2)}/mes
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

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
