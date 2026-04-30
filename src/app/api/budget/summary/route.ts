import { NextRequest, NextResponse } from 'next/server';
import { BudgetService } from '@/services/budget.service';
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

    const summary = await BudgetService.getBudgetSummary(payload.userId);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Error fetching budget summary:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al obtener resumen de presupuesto' },
      { status: 500 }
    );
  }
}
