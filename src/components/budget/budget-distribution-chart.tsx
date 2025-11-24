'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { BudgetSummary } from '@/types/budget.types';

interface BudgetDistributionChartProps {
  summary: BudgetSummary;
}

const COLORS = {
  essential: '#ef4444', // Red for essential expenses
  nonEssential: '#f97316', // Orange for non-essential
  savings: '#10b981', // Green for savings
};

export function BudgetDistributionChart({ summary }: BudgetDistributionChartProps) {
  const essentialExpenses = summary.expensesByCategory
    .filter(cat => cat.isEssential)
    .reduce((sum, cat) => sum + cat.amount, 0);

  const nonEssentialExpenses = summary.expensesByCategory
    .filter(cat => !cat.isEssential)
    .reduce((sum, cat) => sum + cat.amount, 0);

  const savings = summary.availableBalance > 0 ? summary.availableBalance : 0;

  const chartData = [
    {
      name: 'Gastos Esenciales',
      value: essentialExpenses,
      percentage: summary.totalMonthlyIncome > 0 
        ? ((essentialExpenses / summary.totalMonthlyIncome) * 100).toFixed(1)
        : '0',
      color: COLORS.essential,
    },
    {
      name: 'Gastos No Esenciales',
      value: nonEssentialExpenses,
      percentage: summary.totalMonthlyIncome > 0 
        ? ((nonEssentialExpenses / summary.totalMonthlyIncome) * 100).toFixed(1)
        : '0',
      color: COLORS.nonEssential,
    },
    {
      name: 'Ahorro Disponible',
      value: savings,
      percentage: summary.totalMonthlyIncome > 0 
        ? ((savings / summary.totalMonthlyIncome) * 100).toFixed(1)
        : '0',
      color: COLORS.savings,
    },
  ].filter(item => item.value > 0);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribución de Presupuesto</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[350px] text-slate-500">
          <p>Agrega fuentes de ingreso y gastos para ver la distribución</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribución de Presupuesto Mensual</CardTitle>
        <p className="text-sm text-slate-500 mt-1">
          Distribución de tus ingresos mensuales en porcentajes
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, payload }) => `${name} (${payload?.percentage ?? 0}%)`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
                      <p className="font-semibold">{data.name}</p>
                      <p className="text-sm">${data.value.toFixed(2)}</p>
                      <p className="text-sm text-slate-500">{data.percentage}% del ingreso</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value, entry) => {
                const data = entry.payload ?? { value: 0 };
                return `${value}: $${data.value.toFixed(2)}`;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-xs text-slate-500">Ingresos Mensuales</p>
            <p className="text-lg font-bold text-blue-600">
              ${summary.totalMonthlyIncome.toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500">Gastos Totales</p>
            <p className="text-lg font-bold text-red-600">
              ${summary.totalMonthlyExpenses.toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500">Tasa de Ahorro</p>
            <p className={`text-lg font-bold ${summary.savingsRate > 20 ? 'text-green-600' : summary.savingsRate > 10 ? 'text-yellow-600' : 'text-red-600'}`}>
              {summary.savingsRate.toFixed(1)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

