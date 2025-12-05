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
import type { Book } from '@/types/book.types';

interface ReadingProgressChartProps {
  books: Book[];
}

export function ReadingProgressChart({ books }: ReadingProgressChartProps) {
  const readingBooks = books
    .filter((book) => book.status === 'reading' && book.pages > 0)
    .slice(0, 5)
    .map((book) => ({
      title: book.title.length > 15 ? book.title.substring(0, 15) + '...' : book.title,
      leídas: book.currentPage,
      pendientes: book.pages - book.currentPage,
      total: book.pages,
      porcentaje: Math.round((book.currentPage / book.pages) * 100),
    }));

  if (readingBooks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Progreso de Lectura</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px] text-slate-500">
          <p>No hay libros en lectura actualmente</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progreso de Lectura</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={readingBooks} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="title" type="category" width={100} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
                      <p className="font-semibold mb-2">{data.title}</p>
                      <p className="text-sm text-blue-600">Leídas: {data.leídas} páginas</p>
                      <p className="text-sm text-slate-500">
                        Pendientes: {data.pendientes} páginas
                      </p>
                      <p className="text-sm font-medium">Progreso: {data.porcentaje}%</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Bar dataKey="leídas" stackId="a" fill="#3b82f6" name="Páginas Leídas" />
            <Bar dataKey="pendientes" stackId="a" fill="#cbd5e1" name="Páginas Pendientes" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
