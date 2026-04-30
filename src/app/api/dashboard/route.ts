import { NextRequest, NextResponse } from 'next/server';
import { DashboardService } from '@/services/dashboard.service';
import { getRequestAuth } from '@/lib/api-auth';
import type { ApiResponse } from '@/types/api.types';

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

    const dashboardData = await DashboardService.getDashboardData(payload.userId);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al obtener datos del dashboard' },
      { status: 500 }
    );
  }
}
