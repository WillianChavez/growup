'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

interface GoalProgressChartProps {
  data: {
    title: string;
    progress: number;
  }[];
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export function GoalProgressChart({ data }: GoalProgressChartProps) {
  const chartData = {
    labels: data.map((item) =>
      item.title.length > 20 ? item.title.substring(0, 20) + '...' : item.title
    ),
    datasets: [
      {
        label: 'Progreso',
        data: data.map((item) => Math.round(item.progress)),
        backgroundColor: data.map((_, index) => COLORS[index % COLORS.length]),
        borderRadius: 8,
      },
    ],
  };

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: { parsed: { x: number | null } }) => {
            if (context.parsed.x === null) return '';
            return `Progreso: ${context.parsed.x}%`;
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        max: 100,
      },
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progreso de Metas Activas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <Bar data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}
