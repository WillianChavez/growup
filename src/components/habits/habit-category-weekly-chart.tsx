'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hábitos Completados por Categoría (Últimas {weeks} Semanas)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="category" type="category" width={120} />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
                      <p className="font-semibold mb-2">{data.category}</p>
                      {Array.from({ length: weeks }).map((_, i) => {
                        const weekKey = `semana${i + 1}`;
                        const value = data[weekKey];
                        return (
                          <p key={weekKey} className="text-sm">
                            Semana {i + 1}: {value} completados
                          </p>
                        );
                      })}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            {Array.from({ length: weeks }).map((_, i) => {
              const weekKey = `semana${i + 1}`;
              const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];
              return (
                <Bar 
                  key={weekKey}
                  dataKey={weekKey}
                  fill={colors[i % colors.length]}
                  name={`Semana ${i + 1}`}
                  stackId="a"
                />
              );
            })}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

