'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { startOfMonth, startOfYear, isAfter, isBefore, endOfMonth, endOfYear } from 'date-fns';

ChartJS.register(ArcElement, Tooltip, Legend);

interface ExpenseCategoryChartProps {
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    date: Date;
    category: {
      name: string;
      color: string;
      emoji: string;
    } | null;
  }>;
}

type TimeFilter = 'month' | 'quarter' | 'year' | 'all';

// Paleta de colores predefinida para categorías sin color
const CATEGORY_COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#ef4444', // red
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#a855f7', // violet
];

/**
 * Obtiene un color determinístico para una categoría basándose en su nombre
 * Siempre devuelve el mismo color para el mismo nombre
 */
function getCategoryColor(categoryName: string): string {
  // Hash simple del nombre para obtener un índice consistente
  let hash = 0;
  for (let i = 0; i < categoryName.length; i++) {
    const char = categoryName.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  // Usar el valor absoluto del hash para obtener un índice de la paleta
  const index = Math.abs(hash) % CATEGORY_COLORS.length;
  return CATEGORY_COLORS[index];
}

export function ExpenseCategoryChart({ transactions }: ExpenseCategoryChartProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');

  // Filtrar transacciones según el período seleccionado
  const filterTransactionsByTime = (
    transactions: ExpenseCategoryChartProps['transactions'],
    filter: TimeFilter
  ): ExpenseCategoryChartProps['transactions'] => {
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
        const defaultColor = '#94a3b8';
        const categoryColor =
          transaction.category?.color && transaction.category.color !== defaultColor
            ? transaction.category.color
            : getCategoryColor(categoryName);
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

  console.log(categoryTotals);
  const chartData = {
    labels: Object.values(categoryTotals)
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
      .map((item) => `${item.emoji} ${item.name}`),
    datasets: [
      {
        data: Object.values(categoryTotals)
          .sort((a, b) => b.value - a.value)
          .slice(0, 8)
          .map((item) => parseFloat(item.value.toFixed(2))),
        backgroundColor: Object.values(categoryTotals)
          .sort((a, b) => b.value - a.value)
          .slice(0, 8)
          .map((item) => item.color),
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      tooltip: {
        callbacks: {
          label: (context: { label: string; parsed: number | null }) => {
            if (context.parsed === null) return '';
            const total = chartData.datasets[0].data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(0);
            return `${context.label}: $${context.parsed.toFixed(2)} (${percentage}%)`;
          },
        },
      },
    },
  };

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

  if (chartData.datasets[0].data.length === 0) {
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
        <div className="h-[300px]">
          <Pie data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}
