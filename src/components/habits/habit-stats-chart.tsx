'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface HabitStatsChartProps {
  data: {
    date: string;
    completed: number;
    total: number;
  }[];
}

export function HabitStatsChart({ data }: HabitStatsChartProps) {
  const chartData = {
    labels: data.map((item) => format(new Date(item.date), 'dd MMM', { locale: es })),
    datasets: [
      {
        label: 'Completados',
        data: data.map((item) => item.completed),
        backgroundColor: '#10b981',
      },
      {
        label: 'Total',
        data: data.map((item) => item.total),
        backgroundColor: '#94a3b8',
        opacity: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          afterLabel: (context: { dataIndex: number }) => {
            const item = data[context.dataIndex];
            const percentage = item.total > 0 ? Math.round((item.completed / item.total) * 100) : 0;
            return `Tasa: ${percentage}%`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progreso de Hábitos - Últimos 7 Días</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <Bar data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}
