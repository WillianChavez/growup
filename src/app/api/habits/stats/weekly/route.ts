import { NextRequest, NextResponse } from 'next/server';
import { HabitService } from '@/services/habit.service';
import { getRequestAuth } from '@/lib/api-auth';
import type { ApiResponse } from '@/types/api.types';
import { subDays, startOfDay } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const auth = await getRequestAuth(request);
    if (!auth.isAuthenticated || !auth.payload) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }
    const payload = auth.payload;

    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get('days');
    const days = daysParam ? parseInt(daysParam) : 7;

    // Obtener estadísticas de los últimos N días
    const today = startOfDay(new Date());
    const statsPromises = Array.from({ length: days }, async (_, i) => {
      const date = subDays(today, days - 1 - i);
      const dailyView = await HabitService.getDailyView(payload.userId, date);

      return {
        date: date.toISOString(),
        completed: dailyView.habits.filter((h) => h.entry?.completed).length,
        total: dailyView.habits.length,
      };
    });

    const stats = await Promise.all(statsPromises);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching weekly stats:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al obtener estadísticas semanales' },
      { status: 500 }
    );
  }
}
