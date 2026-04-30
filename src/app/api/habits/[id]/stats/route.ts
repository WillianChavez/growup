import { NextRequest, NextResponse } from 'next/server';
import { HabitService } from '@/services/habit.service';
import { getRequestAuth } from '@/lib/api-auth';
import type { ApiResponse } from '@/types/api.types';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getRequestAuth(request);
    if (!auth.isAuthenticated || !auth.payload) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }
    const payload = auth.payload;

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
