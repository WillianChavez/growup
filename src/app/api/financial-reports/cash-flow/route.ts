import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { FinancialReportsService } from '@/services/financial-reports.service';
import type { ApiResponse } from '@/types/api.types';
import type { CashFlowStatement } from '@/types/financial-reports.types';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, message: 'No autorizado' } as ApiResponse<null>, {
        status: 401,
      });
    }

    const payload = await verifyToken(token);

    if (!payload) {
      return NextResponse.json({ success: false, message: 'Token inválido' } as ApiResponse<null>, {
        status: 401,
      });
    }

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    if (!startDateParam || !endDateParam) {
      return NextResponse.json(
        {
          success: false,
          message: 'Se requieren los parámetros startDate y endDate',
        } as ApiResponse<null>,
        { status: 400 }
      );
    }

    const startDate = new Date(startDateParam);
    const endDate = new Date(endDateParam);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { success: false, message: 'Fechas inválidas' } as ApiResponse<null>,
        { status: 400 }
      );
    }

    const cashFlow = await FinancialReportsService.getCashFlowStatement(
      payload.userId,
      startDate,
      endDate
    );

    return NextResponse.json({
      success: true,
      data: cashFlow,
    } as ApiResponse<CashFlowStatement>);
  } catch (error) {
    console.error('Error al obtener flujo de efectivo:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
