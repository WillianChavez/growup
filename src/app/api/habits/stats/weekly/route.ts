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
    const daysParam = searchParams.get('days');
    const days = daysParam ? parseInt(daysParam) : 7;

    // Obtener estadísticas de los últimos N días
    const today = startOfDay(new Date());
    const statsPromises = Array.from({ length: days }, async (_, i) => {
      const date = subDays(today, days - 1 - i);
      const dailyView = await HabitService.getDailyView(payload.userId, date);
      
      return {
        date: date.toISOString(),
        completed: dailyView.habits.filter(h => h.entry?.completed).length,
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

