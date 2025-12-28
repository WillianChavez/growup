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
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CashFlowStatement } from '@/types/financial-reports.types';
import { formatCurrency } from '@/lib/utils';

interface CashFlowChartProps {
  data: CashFlowStatement;
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

const getBarColor = (type: string) => {
  switch (type) {
    case 'initial':
      return '#64748b'; // slate
    case 'positive':
      return '#10b981'; // emerald
    case 'negative':
      return '#ef4444'; // red
    case 'final':
      return '#3b82f6'; // blue
    default:
      return '#94a3b8';
  }
};

export function CashFlowChart({ data }: CashFlowChartProps) {
  // Datos para cascada de flujo de efectivo
  const flowData = [
    {
      name: 'Efectivo Inicial',
      value: data.startingCash,
      type: 'initial',
    },
    {
      name: 'Operaciones',
      value: data.operations.net,
      type: data.operations.net >= 0 ? 'positive' : 'negative',
    },
    {
      name: 'Inversión',
      value: data.investing.net,
      type: data.investing.net >= 0 ? 'positive' : 'negative',
    },
    {
      name: 'Financiamiento',
      value: data.financing.net,
      type: data.financing.net >= 0 ? 'positive' : 'negative',
    },
    {
      name: 'Efectivo Final',
      value: data.endingCash,
      type: 'final',
    },
  ];

  // Desglose por categoría de flujo
  const breakdownData = [
    {
      name: 'Operaciones',
      Entradas: data.operations.inflows,
      Salidas: -data.operations.outflows,
      Neto: data.operations.net,
    },
    {
      name: 'Inversión',
      Entradas: data.investing.sales,
      Salidas: -data.investing.purchases,
      Neto: data.investing.net,
    },
    {
      name: 'Financiamiento',
      Entradas: data.financing.borrowing,
      Salidas: -data.financing.repayment,
      Neto: data.financing.net,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Flujo de efectivo agregado */}
      <Card>
        <CardHeader>
          <CardTitle>Flujo de Efectivo por Categoría</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={flowData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="#000" strokeWidth={2} />
              <Bar dataKey="value" name="Flujo" radius={[8, 8, 0, 0]}>
                {flowData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.type)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Desglose de entradas y salidas */}
      <Card>
        <CardHeader>
          <CardTitle>Desglose de Entradas y Salidas</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={breakdownData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <ReferenceLine y={0} stroke="#000" strokeWidth={2} />
              <Bar dataKey="Entradas" fill="#10b981" radius={[8, 8, 0, 0]} />
              <Bar dataKey="Salidas" fill="#ef4444" radius={[8, 8, 0, 0]} />
              <Bar dataKey="Neto" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
