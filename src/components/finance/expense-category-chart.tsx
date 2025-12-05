'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Transaction } from '@/types/finance.types';
import { startOfMonth, startOfYear, isAfter, isBefore, endOfMonth, endOfYear } from 'date-fns';

interface ExpenseCategoryChartProps {
  transactions: Transaction[];
}

type TimeFilter = 'month' | 'quarter' | 'year' | 'all';

export function ExpenseCategoryChart({ transactions }: ExpenseCategoryChartProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');

  // Filtrar transacciones según el período seleccionado
  const filterTransactionsByTime = (
    transactions: Transaction[],
    filter: TimeFilter
  ): Transaction[] => {
    const now = new Date();

    switch (filter) {
      case 'month':
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        return transactions.filter((t) => {
          const date = new Date(t.date);
          return (
            (isAfter(date, monthStart) && isBefore(date, monthEnd)) ||
            date.toDateString() === monthStart.toDateString() ||
            date.toDateString() === monthEnd.toDateString()
          );
        });

      case 'quarter':
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        const quarterEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);
        return transactions.filter((t) => {
          const date = new Date(t.date);
          return (
            (isAfter(date, quarterStart) && isBefore(date, quarterEnd)) ||
            date.toDateString() === quarterStart.toDateString() ||
            date.toDateString() === quarterEnd.toDateString()
          );
        });

      case 'year':
        const yearStart = startOfYear(now);
        const yearEnd = endOfYear(now);
        return transactions.filter((t) => {
          const date = new Date(t.date);
          return (
            (isAfter(date, yearStart) && isBefore(date, yearEnd)) ||
            date.toDateString() === yearStart.toDateString() ||
            date.toDateString() === yearEnd.toDateString()
          );
        });

      case 'all':
      default:
        return transactions;
    }
  };

  const filteredTransactions = filterTransactionsByTime(transactions, timeFilter);

  // Agrupar gastos por categoría
  const categoryTotals = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce(
      (acc, transaction) => {
        const categoryName = transaction.category?.name || 'Sin categoría';
        const categoryColor = transaction.category?.color || '#94a3b8';
        const categoryEmoji = transaction.category?.emoji || '💰';

        if (!acc[categoryName]) {
          acc[categoryName] = {
            name: categoryName,
            value: 0,
            color: categoryColor,
            emoji: categoryEmoji,
          };
        }
        acc[categoryName].value += transaction.amount;
        return acc;
      },
      {} as Record<string, { name: string; value: number; color: string; emoji: string }>
    );

  const chartData = Object.values(categoryTotals)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)
    .map((item) => ({
      name: `${item.emoji} ${item.name}`,
      value: parseFloat(item.value.toFixed(2)),
      color: item.color,
    }));

  const getFilterLabel = () => {
    switch (timeFilter) {
      case 'month':
        return 'Este Mes';
      case 'quarter':
        return 'Este Trimestre';
      case 'year':
        return 'Este Año';
      case 'all':
        return 'Todo el Tiempo';
    }
  };

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Gastos por Categoría</CardTitle>
          <Select value={timeFilter} onValueChange={(value) => setTimeFilter(value as TimeFilter)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Este Mes</SelectItem>
              <SelectItem value="quarter">Este Trimestre</SelectItem>
              <SelectItem value="year">Este Año</SelectItem>
              <SelectItem value="all">Todo el Tiempo</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px] text-slate-500">
          <p>No hay gastos registrados en {getFilterLabel().toLowerCase()}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 pb-4">
        <CardTitle>Gastos por Categoría - {getFilterLabel()}</CardTitle>
        <Select value={timeFilter} onValueChange={(value) => setTimeFilter(value as TimeFilter)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Este Mes</SelectItem>
            <SelectItem value="quarter">Este Trimestre</SelectItem>
            <SelectItem value="year">Este Año</SelectItem>
            <SelectItem value="all">Todo el Tiempo</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              outerRadius={80}
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
                  const data = payload[0];
                  return (
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
                      <p className="font-semibold">{data.name}</p>
                      <p className="text-sm text-red-600">Total: ${data.value}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
