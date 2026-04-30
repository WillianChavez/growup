import { NextRequest, NextResponse } from 'next/server';
import { getRequestAuth } from '@/lib/api-auth';
import { FinancialReportsService } from '@/services/financial-reports.service';
import type { ApiResponse } from '@/types/api.types';
import type { IncomeStatement } from '@/types/financial-reports.types';

export async function GET(request: NextRequest) {
  try {
    const auth = await getRequestAuth(request);
    if (!auth.isAuthenticated || !auth.payload) {
      return NextResponse.json({ success: false, message: 'No autorizado' } as ApiResponse<null>, {
        status: 401,
      });
    }
    const payload = auth.payload;

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

    const incomeStatement = await FinancialReportsService.getIncomeStatement(
      payload.userId,
      startDate,
      endDate
    );

    return NextResponse.json({
      success: true,
      data: incomeStatement,
    } as ApiResponse<IncomeStatement>);
  } catch (error) {
    console.error('Error al obtener estado de resultados:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
