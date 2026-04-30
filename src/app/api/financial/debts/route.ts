import { NextRequest, NextResponse } from 'next/server';
import { FinancialService } from '@/services/financial.service';
import { getRequestAuth } from '@/lib/api-auth';
import type { ApiResponse } from '@/types/api.types';

export async function GET(request: NextRequest) {
  try {
    const auth = await getRequestAuth(request);
    if (!auth.isAuthenticated || !auth.payload)
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    const payload = auth.payload;

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    const debts = await FinancialService.getDebts(payload.userId, activeOnly);
    return NextResponse.json<ApiResponse>({ success: true, data: debts });
  } catch (error) {
    console.error('Error fetching debts:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al obtener deudas' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getRequestAuth(request);
    if (!auth.isAuthenticated || !auth.payload)
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    const payload = auth.payload;

    const body = await request.json();
    const debt = await FinancialService.createDebt(payload.userId, body);
    return NextResponse.json<ApiResponse>({ success: true, data: debt });
  } catch (error) {
    console.error('Error creating debt:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al crear deuda' },
      { status: 500 }
    );
  }
}
