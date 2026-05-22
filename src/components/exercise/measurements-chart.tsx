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
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MEASUREMENT_LABELS } from '@/components/exercise/exercise-labels';
import type { BodyMetric, BodyMetricField } from '@/types/exercise.types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const FIELDS: BodyMetricField[] = ['waist', 'chest', 'hip', 'arm', 'thigh'];
const COLORS: Record<BodyMetricField, string> = {
  weight: '#3b82f6',
  waist: '#8b5cf6',
  chest: '#ec4899',
  hip: '#f59e0b',
  arm: '#10b981',
  thigh: '#06b6d4',
};

interface MeasurementsChartProps {
  metrics: BodyMetric[];
}

export function MeasurementsChart({ metrics }: MeasurementsChartProps) {
  const sorted = [...metrics].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const activeFields = FIELDS.filter((f) =>
    sorted.some((m) => m[f] !== null && m[f] !== undefined)
  );

  if (activeFields.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolución de medidas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Registra tus medidas (cintura, etc.) para ver la evolución.
          </p>
        </CardContent>
      </Card>
    );
  }

  const labels = sorted.map((m) => format(new Date(m.date), 'd MMM', { locale: es }));

  const datasets = activeFields.map((field) => ({
    label: `${MEASUREMENT_LABELS[field].label} (cm)`,
    data: sorted.map((m) => m[field] ?? null),
    borderColor: COLORS[field],
    backgroundColor: COLORS[field],
    tension: 0.3,
    spanGaps: true,
    pointRadius: 3,
  }));

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' as const },
    plugins: { legend: { position: 'bottom' as const } },
    scales: {
      y: { ticks: { callback: (value: string | number) => `${value} cm` } },
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolución de medidas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <Line data={{ labels, datasets }} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}
