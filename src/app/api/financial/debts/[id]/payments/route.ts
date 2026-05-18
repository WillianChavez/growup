import { NextRequest, NextResponse } from 'next/server';
import { getRequestAuth } from '@/lib/api-auth';
import { FinancialService } from '@/services/financial.service';
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

    const { id } = await params;
    const payments = await FinancialService.getDebtPayments(auth.payload.userId, id);
    return NextResponse.json<ApiResponse>({ success: true, data: payments });
  } catch (error) {
    console.error('Error fetching debt payments:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al obtener abonos' },
      { status: 500 }
    );
  }
}
