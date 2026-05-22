import { NextRequest, NextResponse } from 'next/server';
import { WorkoutService } from '@/services/workout.service';
import { withUserContext } from '@/lib/api-context-helper';
import type { ApiResponse } from '@/types/api.types';

export async function GET(request: NextRequest) {
  try {
    const stats = await withUserContext(request, (ctx) =>
      WorkoutService.getWeeklyStats(ctx.userId, new Date())
    );

    if (!stats) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    return NextResponse.json<ApiResponse>({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching workout stats:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}
