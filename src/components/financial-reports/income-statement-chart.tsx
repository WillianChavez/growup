'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CategoryBreakdown } from '@/types/financial-reports.types';
import { formatCurrency } from '@/lib/utils';

interface IncomeStatementChartProps {
  revenueCategories: CategoryBreakdown[];
  expenseCategories: CategoryBreakdown[];
}

const COLORS = [
  '#10b981', // emerald-500
  '#3b82f6', // blue-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#f59e0b', // amber-500
  '#06b6d4', // cyan-500
  '#6366f1', // indigo-500
  '#ef4444', // red-500
];

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number; payload: { emoji: string } }[];
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
        <p className="font-semibold text-slate-900 dark:text-white">
          {payload[0].payload.emoji} {payload[0].name}
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export function IncomeStatementChart({
  revenueCategories,
  expenseCategories,
}: IncomeStatementChartProps) {
  const revenueData = revenueCategories.map((cat) => ({
    name: cat.categoryName,
    value: cat.amount,
    emoji: cat.emoji,
  }));

  const expenseData = expenseCategories.map((cat) => ({
    name: cat.categoryName,
    value: cat.amount,
    emoji: cat.emoji,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico de Ingresos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-emerald-600">Distribución de Ingresos</CardTitle>
        </CardHeader>
        <CardContent>
          {revenueData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-500">
              No hay datos de ingresos
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revenueData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name.slice(0, 15)}${name.length > 15 ? '...' : ''}: ${(
                      percent * 100
                    ).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {revenueData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Gráfico de Gastos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Distribución de Gastos</CardTitle>
        </CardHeader>
        <CardContent>
          {expenseData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-500">
              No hay datos de gastos
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name.slice(0, 15)}${name.length > 15 ? '...' : ''}: ${(
                      percent * 100
                    ).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
