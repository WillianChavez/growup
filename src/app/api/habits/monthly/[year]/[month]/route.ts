import { NextRequest, NextResponse } from 'next/server';
import { HabitService } from '@/services/habit.service';
import { verifyToken } from '@/lib/jwt';
import type { ApiResponse } from '@/types/api.types';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ year: string; month: string }> }
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
    const year = parseInt(params.year);
    const month = parseInt(params.month);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Año o mes inválido' },
        { status: 400 }
      );
    }

    const date = new Date(year, month - 1, 1);
    const monthlyData = await HabitService.getMonthlyData(payload.userId, date);

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

