'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BalanceSheet } from '@/types/financial-reports.types';
import { formatCurrency } from '@/lib/utils';

interface BalanceSheetChartProps {
  data: BalanceSheet;
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number }[];
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
        <p className="font-semibold text-slate-900 dark:text-white">{payload[0].name}</p>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export function BalanceSheetChart({ data }: BalanceSheetChartProps) {
  // Datos para gráfico de barras comparando Activos vs Pasivos
  const comparisonData = [
    {
      name: 'Activos Líquidos',
      value: data.assets.liquid.reduce((sum, a) => sum + a.amount, 0),
      type: 'asset',
    },
    {
      name: 'Activos Ilíquidos',
      value: data.assets.illiquid.reduce((sum, a) => sum + a.amount, 0),
      type: 'asset',
    },
    {
      name: 'Pasivos Corrientes',
      value: data.liabilities.current.reduce((sum, d) => sum + d.amount, 0),
      type: 'liability',
    },
    {
      name: 'Pasivos L. Plazo',
      value: data.liabilities.longTerm.reduce((sum, d) => sum + d.amount, 0),
      type: 'liability',
    },
  ];

  // Ecuación contable
  const equationData = [
    {
      name: 'Activos',
      value: data.assets.total,
      color: '#3b82f6',
    },
    {
      name: 'Pasivos',
      value: data.liabilities.total,
      color: '#f97316',
    },
    {
      name: 'Patrimonio',
      value: data.equity,
      color: data.equity >= 0 ? '#10b981' : '#ef4444',
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico de Composición */}
      <Card>
        <CardHeader>
          <CardTitle>Composición del Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-15} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="value" name="Monto" radius={[8, 8, 0, 0]}>
                {comparisonData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.type === 'asset' ? '#3b82f6' : '#f97316'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Ecuación Contable */}
      <Card>
        <CardHeader>
          <CardTitle>Ecuación Contable</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={equationData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Valor" radius={[0, 8, 8, 0]}>
                {equationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
