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

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface ReadingProgressChartProps {
  books: Array<{
    id: string;
    title: string;
    pages: number;
    currentPage: number;
    status: string;
  }>;
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

  const chartData = {
    labels: readingBooks.map((book) => book.title),
    datasets: [
      {
        label: 'Páginas Leídas',
        data: readingBooks.map((book) => book.leídas),
        backgroundColor: '#3b82f6',
      },
      {
        label: 'Páginas Pendientes',
        data: readingBooks.map((book) => book.pendientes),
        backgroundColor: '#cbd5e1',
      },
    ],
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
          afterLabel: (context: { dataIndex: number }) => {
            const book = readingBooks[context.dataIndex];
            return `Progreso: ${book.porcentaje}%`;
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
        <CardTitle>Progreso de Lectura</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <Bar data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}
