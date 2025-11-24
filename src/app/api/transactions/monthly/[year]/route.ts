import { NextRequest, NextResponse } from 'next/server';
import { TransactionService } from '@/services/transaction.service';
import { verifyToken } from '@/lib/jwt';
import type { ApiResponse } from '@/types/api.types';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ year: string }> }
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

