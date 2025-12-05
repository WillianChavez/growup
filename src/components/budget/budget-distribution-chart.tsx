'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import type { BudgetSummary } from '@/types/budget.types';

interface BudgetDistributionChartProps {
  summary: BudgetSummary;
}

// Colores para las categorías (paleta de colores variada)
const CATEGORY_COLORS = [
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Purple
  '#a855f7', // Fuchsia
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#10b981', // Green
  '#f59e0b', // Amber
  '#f97316', // Orange
  '#ef4444', // Red
];

// Función para obtener un color basado en el índice
function getColorForCategory(index: number): string {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
}

export function BudgetDistributionChart({ summary }: BudgetDistributionChartProps) {
  // Crear datos del gráfico basados en categorías individuales
  const categoryData = summary.expensesByCategory
    .filter((cat) => cat.amount > 0)
    .map((cat, index) => {
      const categoryKey = cat.category.toLowerCase().replace(/\s+/g, '-');
      return {
        category: categoryKey,
        name: cat.categoryName,
        value: cat.amount,
        percentage:
          summary.totalMonthlyIncome > 0
            ? ((cat.amount / summary.totalMonthlyIncome) * 100).toFixed(1)
            : '0',
        fill: `var(--color-${categoryKey})`,
        isEssential: cat.isEssential,
        color: getColorForCategory(index),
      };
    });

  // Agregar ahorro disponible si hay balance positivo
  const savings = summary.availableBalance > 0 ? summary.availableBalance : 0;
  const savingsColor = '#10b981';
  const chartData = [
    ...categoryData,
    ...(savings > 0
      ? [
          {
            category: 'ahorro-disponible',
            name: 'Ahorro Disponible',
            value: savings,
            percentage:
              summary.totalMonthlyIncome > 0
                ? ((savings / summary.totalMonthlyIncome) * 100).toFixed(1)
                : '0',
            fill: savingsColor,
            isEssential: false,
            color: savingsColor,
          },
        ]
      : []),
  ];

  // Crear chartConfig dinámicamente
  const chartConfig: ChartConfig = {
    value: {
      label: 'Valor',
    },
    ...chartData.reduce((acc, item) => {
      acc[item.category] = {
        label: item.name,
        color: item.color,
      };
      return acc;
    }, {} as ChartConfig),
  };

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribución de Presupuesto</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[350px] text-slate-500">
          <p>Agrega fuentes de ingreso y gastos para ver la distribución</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Distribución de Presupuesto Mensual</CardTitle>
        <CardDescription>Distribución de tus ingresos mensuales por categoría</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[300px]">
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="category" cx="50%" cy="50%">
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill || entry.color} />
              ))}
            </Pie>
            <ChartLegend
              content={(legendProps) => (
                <ChartLegendContent
                  payload={legendProps?.payload}
                  verticalAlign={legendProps?.verticalAlign}
                  nameKey="category"
                  className="flex-wrap gap-2 *:basis-1/4 *:justify-center"
                />
              )}
              className="-translate-y-2"
            />
          </PieChart>
        </ChartContainer>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-xs text-slate-500">Ingresos Mensuales</p>
            <p className="text-lg font-bold text-blue-600">
              ${summary.totalMonthlyIncome.toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500">Gastos Totales</p>
            <p className="text-lg font-bold text-red-600">
              ${summary.totalMonthlyExpenses.toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500">Tasa de Ahorro</p>
            <p
              className={`text-lg font-bold ${summary.savingsRate > 20 ? 'text-green-600' : summary.savingsRate > 10 ? 'text-yellow-600' : 'text-red-600'}`}
            >
              {summary.savingsRate.toFixed(1)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
