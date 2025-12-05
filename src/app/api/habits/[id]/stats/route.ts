import { NextRequest, NextResponse } from 'next/server';
import { HabitService } from '@/services/habit.service';
import { verifyToken } from '@/lib/jwt';
import type { ApiResponse } from '@/types/api.types';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params;
    const stats = await HabitService.getStats(id, payload.userId);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching habit stats:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}
