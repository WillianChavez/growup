'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface HabitStatsChartProps {
  data: {
    date: Date;
    completed: number;
    total: number;
  }[];
}

export function HabitStatsChart({ data }: HabitStatsChartProps) {
  const chartData = data.map((item) => ({
    date: format(item.date, 'dd MMM', { locale: es }),
    completados: item.completed,
    total: item.total,
    porcentaje: item.total > 0 ? Math.round((item.completed / item.total) * 100) : 0,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progreso de Hábitos - Últimos 7 Días</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
                      <p className="font-semibold">{data.date}</p>
                      <p className="text-sm text-green-600">Completados: {data.completados}</p>
                      <p className="text-sm text-slate-600">Total: {data.total}</p>
                      <p className="text-sm font-medium">Tasa: {data.porcentaje}%</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Bar dataKey="completados" fill="#10b981" name="Completados" />
            <Bar dataKey="total" fill="#94a3b8" name="Total" opacity={0.3} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
