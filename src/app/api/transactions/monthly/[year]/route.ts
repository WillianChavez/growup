import { NextRequest, NextResponse } from 'next/server';
import { TransactionService } from '@/services/transaction.service';
import { getRequestAuth } from '@/lib/api-auth';
import type { ApiResponse } from '@/types/api.types';

export async function GET(request: NextRequest, context: { params: Promise<{ year: string }> }) {
  try {
    const auth = await getRequestAuth(request);
    if (!auth.isAuthenticated || !auth.payload) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }
    const payload = auth.payload;

    const params = await context.params;
    const year = parseInt(params.year);

    if (isNaN(year)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Año inválido' },
        { status: 400 }
      );
    }

    const monthlyGroups = await TransactionService.getGroupedByMonth(payload.userId, year);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: monthlyGroups,
    });
  } catch (error) {
    console.error('Error fetching monthly transactions:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al obtener transacciones mensuales' },
      { status: 500 }
    );
  }
}
