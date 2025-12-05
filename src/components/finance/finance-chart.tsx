'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
  type TooltipItem,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { MonthlyTransactionGroup } from '@/types/finance.types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

interface FinanceChartProps {
  data: MonthlyTransactionGroup[];
}

type MonthsFilter = '3' | '6' | '12' | 'all';

export function FinanceChart({ data }: FinanceChartProps) {
  const [monthsFilter, setMonthsFilter] = useState<MonthsFilter>('6');

  const filteredData = useMemo(() => {
    if (monthsFilter === 'all') return data;
    const months = parseInt(monthsFilter);
    return data.slice(-months);
  }, [data, monthsFilter]);

  const chartData = useMemo(() => {
    const sortedData = [...filteredData].reverse();

    return {
      labels: sortedData.map((group) => {
        const [year, month] = group.month.split('-');
        // Usar el día 1 del mes explícitamente para evitar problemas de fecha
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        return format(date, 'MMM yy', { locale: es });
      }),
      datasets: [
        {
          label: 'Ingresos',
          data: sortedData.map((group) => group.totalIncome),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Gastos',
          data: sortedData.map((group) => group.totalExpenses),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Balance',
          data: sortedData.map((group) => group.balance),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    };
  }, [filteredData]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'line'>) => {
            if (context.parsed.y === null) return '';
            const label = context.dataset.label || '';
            return `${label}: $${context.parsed.y.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  };

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
        <div className="h-[300px]">
          <Line data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}
