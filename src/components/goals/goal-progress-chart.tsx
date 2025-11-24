'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface GoalProgressChartProps {
  data: {
    title: string;
    progress: number;
  }[];
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export function GoalProgressChart({ data }: GoalProgressChartProps) {
  const chartData = data.map((item) => ({
    name: item.title.length > 20 ? item.title.substring(0, 20) + '...' : item.title,
    progreso: Math.round(item.progress),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progreso de Metas Activas</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 100]} />
            <YAxis dataKey="name" type="category" width={120} />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
                      <p className="font-semibold">{data.name}</p>
                      <p className="text-sm">Progreso: {data.progreso}%</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="progreso" radius={[0, 8, 8, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

