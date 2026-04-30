import { NextRequest, NextResponse } from 'next/server';
import { FinancialService } from '@/services/financial.service';
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

    const kpis = await FinancialService.getFinancialKPIs(payload.userId);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: kpis,
    });
  } catch (error) {
    console.error('Error fetching financial KPIs:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al obtener KPIs financieros' },
      { status: 500 }
    );
  }
}
