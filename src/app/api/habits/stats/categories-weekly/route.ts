import { NextRequest, NextResponse } from 'next/server';
import { HabitService } from '@/services/habit.service';
import { verifyToken } from '@/lib/jwt';
import type { ApiResponse } from '@/types/api.types';
import { subDays, startOfDay } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Token inválido' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const weeksParam = searchParams.get('weeks');
    const weeks = weeksParam ? parseInt(weeksParam) : 4;

    // Obtener todos los hábitos activos
    const habits = await HabitService.findAllByUser(payload.userId, false);

    // Agrupar por categoría
    const categoryMap = new Map<
      string,
      {
        name: string;
        emoji: string;
        color: string;
        weeklyData: number[];
      }
    >();

    // Inicializar categorías
    habits.forEach((habit) => {
      if (habit.category && !categoryMap.has(habit.category.id)) {
        categoryMap.set(habit.category.id, {
          name: habit.category.name,
          emoji: habit.category.emoji,
          color: habit.category.color,
          weeklyData: new Array(weeks).fill(0),
        });
      }
    });

    // Obtener datos de cada semana
    const today = startOfDay(new Date());
    for (let weekIndex = 0; weekIndex < weeks; weekIndex++) {
      const weekEnd = subDays(today, (weeks - weekIndex - 1) * 7);

      // Para cada día de la semana
      for (let day = 0; day < 7; day++) {
        const date = subDays(weekEnd, day);
        if (date <= today) {
          const dailyView = await HabitService.getDailyView(payload.userId, date);

          // Contar completados por categoría
          dailyView.habits.forEach((habitView) => {
            if (habitView.entry?.completed && habitView.habit.category) {
              const categoryData = categoryMap.get(habitView.habit.category.id);
              if (categoryData) {
                categoryData.weeklyData[weekIndex]++;
              }
            }
          });
        }
      }
    }

    // Convertir a array con formato para el gráfico
    const result = Array.from(categoryMap.values()).map((cat) => ({
      category: `${cat.emoji} ${cat.name}`,
      color: cat.color,
      ...Object.fromEntries(cat.weeklyData.map((count, index) => [`semana${index + 1}`, count])),
    }));

    return NextResponse.json<ApiResponse>({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching categories weekly stats:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al obtener estadísticas por categoría' },
      { status: 500 }
    );
  }
}
