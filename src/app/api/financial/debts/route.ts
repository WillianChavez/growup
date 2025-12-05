import { NextRequest, NextResponse } from 'next/server';
import { FinancialService } from '@/services/financial.service';
import { verifyToken } from '@/lib/jwt';
import type { ApiResponse } from '@/types/api.types';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token)
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );

    const payload = await verifyToken(token);
    if (!payload)
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Token inválido' },
        { status: 401 }
      );

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
    const token = request.cookies.get('auth-token')?.value;
    if (!token)
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );

    const payload = await verifyToken(token);
    if (!payload)
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Token inválido' },
        { status: 401 }
      );

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
