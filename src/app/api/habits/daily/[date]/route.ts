import { NextRequest, NextResponse } from 'next/server';
import { HabitService } from '@/services/habit.service';
import { withUserContext } from '@/lib/api-context-helper';
import type { ApiResponse } from '@/types/api.types';

export async function GET(request: NextRequest, context: { params: Promise<{ date: string }> }) {
  try {
    const params = await context.params;
    // Parsear la fecha como fecha local (será normalizada según la zona horaria del usuario)
    const [year, month, day] = params.date.split('-').map(Number);
    const date = new Date(year, month - 1, day, 12, 0, 0, 0); // Usar mediodía para evitar problemas de zona horaria

    if (isNaN(date.getTime())) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Fecha inválida' },
        { status: 400 }
      );
    }

    // Ejecutar con contexto de usuario para que el middleware convierta fechas automáticamente
    const dailyView = await withUserContext(request, async (userContext) => {
      return await HabitService.getDailyView(userContext.userId, date);
    });

    if (!dailyView) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: dailyView,
    });
  } catch (error) {
    console.error('Error fetching daily habits:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al obtener hábitos del día' },
      { status: 500 }
    );
  }
}
