import { NextRequest, NextResponse } from 'next/server';
import { HabitService } from '@/services/habit.service';
import { verifyToken } from '@/lib/jwt';
import type { ApiResponse } from '@/types/api.types';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ date: string }> }
) {
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

    const params = await context.params;
    // Parsear la fecha como UTC para evitar problemas de zona horaria
    const [year, month, day] = params.date.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

    if (isNaN(date.getTime())) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Fecha inválida' },
        { status: 400 }
      );
    }

    const dailyView = await HabitService.getDailyView(payload.userId, date);

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

