'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BodyMetric } from '@/types/exercise.types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

interface WeightEvolutionChartProps {
  metrics: BodyMetric[];
  targetWeight?: number | null;
}

export function WeightEvolutionChart({ metrics, targetWeight }: WeightEvolutionChartProps) {
  const points = metrics
    .filter((m) => m.weight !== null && m.weight !== undefined)
    .map((m) => ({ date: new Date(m.date), weight: m.weight as number }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (points.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolución del peso</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Registra tu peso para ver la evolución.
          </p>
        </CardContent>
      </Card>
    );
  }

  const labels = points.map((p) => format(p.date, 'd MMM', { locale: es }));

  const datasets: Parameters<typeof Line>[0]['data']['datasets'] = [
    {
      label: 'Peso (lb)',
      data: points.map((p) => p.weight),
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.3,
      fill: true,
      pointRadius: 3,
    },
  ];

  if (targetWeight) {
    datasets.push({
      label: `Meta (${targetWeight} lb)`,
      data: points.map(() => targetWeight),
      borderColor: '#10b981',
      borderDash: [6, 6],
      pointRadius: 0,
      fill: false,
    });
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' as const },
    plugins: {
      legend: { position: 'bottom' as const },
    },
    scales: {
      y: {
        ticks: { callback: (value: string | number) => `${value} lb` },
      },
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolución del peso</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <Line data={{ labels, datasets }} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}
