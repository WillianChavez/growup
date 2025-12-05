'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { MonthlyTransactionGroup } from '@/types/finance.types';

interface FinanceChartProps {
  data: MonthlyTransactionGroup[];
}

type MonthsFilter = '3' | '6' | '12' | 'all';

export function FinanceChart({ data }: FinanceChartProps) {
  const [monthsFilter, setMonthsFilter] = useState<MonthsFilter>('6');

  const getFilteredData = () => {
    if (monthsFilter === 'all') return data;
    const months = parseInt(monthsFilter);
    return data.slice(-months);
  };

  const filteredData = getFilteredData();

  const chartData = filteredData
    .map((group) => {
      const [year, month] = group.month.split('-');
      return {
        mes: format(new Date(parseInt(year), parseInt(month) - 1), 'MMM yy', { locale: es }),
        ingresos: group.totalIncome,
        gastos: group.totalExpenses,
        balance: group.balance,
      };
    })
    .reverse(); // Mostrar del más antiguo al más reciente

  const getFilterLabel = () => {
    switch (monthsFilter) {
      case '3':
        return 'Últimos 3 Meses';
      case '6':
        return 'Últimos 6 Meses';
      case '12':
        return 'Últimos 12 Meses';
      case 'all':
        return 'Todo el Tiempo';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 pb-4">
        <CardTitle>Evolución Financiera - {getFilterLabel()}</CardTitle>
        <Select
          value={monthsFilter}
          onValueChange={(value) => setMonthsFilter(value as MonthsFilter)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">Últimos 3 Meses</SelectItem>
            <SelectItem value="6">Últimos 6 Meses</SelectItem>
            <SelectItem value="12">Últimos 12 Meses</SelectItem>
            <SelectItem value="all">Todo el Tiempo</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" />
            <YAxis />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
                      <p className="font-semibold mb-2">{data.mes}</p>
                      <p className="text-sm text-green-600">
                        Ingresos: ${data.ingresos.toFixed(2)}
                      </p>
                      <p className="text-sm text-red-600">Gastos: ${data.gastos.toFixed(2)}</p>
                      <p
                        className={`text-sm font-medium ${data.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}
                      >
                        Balance: ${data.balance.toFixed(2)}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="ingresos"
              stroke="#10b981"
              strokeWidth={2}
              name="Ingresos"
            />
            <Line type="monotone" dataKey="gastos" stroke="#ef4444" strokeWidth={2} name="Gastos" />
            <Line
              type="monotone"
              dataKey="balance"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Balance"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
