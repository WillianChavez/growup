import { NextRequest, NextResponse } from 'next/server';
import { HabitService } from '@/services/habit.service';
import { withUserContext } from '@/lib/api-context-helper';
import type { ApiResponse } from '@/types/api.types';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ year: string; month: string }> }
) {
  try {
    const params = await context.params;
    const year = parseInt(params.year);
    const month = parseInt(params.month);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Año o mes inválido' },
        { status: 400 }
      );
    }

    // Crear fecha en la zona horaria del usuario (será convertida por el middleware)
    const date = new Date(year, month - 1, 1, 12, 0, 0, 0); // Usar mediodía para evitar problemas de zona horaria

    // Ejecutar con contexto de usuario para que el middleware convierta fechas automáticamente
    const monthlyData = await withUserContext(request, async (userContext) => {
      return await HabitService.getMonthlyData(userContext.userId, date);
    });

    // Si withUserContext devuelve una respuesta de error (NextResponse), retornarla directamente
    if (monthlyData instanceof NextResponse) {
      return monthlyData;
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: monthlyData,
    });
  } catch (error) {
    console.error('Error fetching monthly habits:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al obtener datos mensuales' },
      { status: 500 }
    );
  }
}
