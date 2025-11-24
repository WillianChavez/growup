import { NextRequest, NextResponse } from 'next/server';
import { BudgetService } from '@/services/budget.service';
import { verifyToken } from '@/lib/jwt';
import type { ApiResponse } from '@/types/api.types';

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

