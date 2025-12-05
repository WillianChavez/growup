'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  type TooltipItem,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface HabitCategoryWeeklyChartProps {
  data: Array<{
    category: string;
    color: string;
    [key: string]: string | number;
  }>;
  weeks: number;
}

export function HabitCategoryWeeklyChart({ data, weeks }: HabitCategoryWeeklyChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hábitos Completados por Categoría (Últimas {weeks} Semanas)</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px] text-slate-500">
          <p>No hay datos de hábitos</p>
        </CardContent>
      </Card>
    );
  }

  const weekKeys = Array.from({ length: weeks }, (_, i) => `semana${i + 1}`);
  const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];

  const chartData = {
    labels: data.map((item) => item.category),
    datasets: weekKeys.map((weekKey, index) => ({
      label: `Semana ${index + 1}`,
      data: data.map((item) => (item[weekKey] as number) || 0),
      backgroundColor: colors[index % colors.length],
    })),
  };

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'bar'>) => {
            if (context.parsed.x === null) return '';
            const label = context.dataset.label || '';
            return `${label}: ${context.parsed.x} completados`;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        beginAtZero: true,
      },
      y: {
        stacked: true,
      },
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hábitos Completados por Categoría (Últimas {weeks} Semanas)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <Bar data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}
