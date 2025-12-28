import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { FinancialReportsService } from '@/services/financial-reports.service';
import type { ApiResponse } from '@/types/api.types';
import type { BalanceSheet } from '@/types/financial-reports.types';

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
    const dateParam = searchParams.get('date');

    if (!dateParam) {
      return NextResponse.json(
        { success: false, message: 'Se requiere el parámetro date' } as ApiResponse<null>,
        { status: 400 }
      );
    }

    const date = new Date(dateParam);

    if (isNaN(date.getTime())) {
      return NextResponse.json({ success: false, message: 'Fecha inválida' } as ApiResponse<null>, {
        status: 400,
      });
    }

    const balanceSheet = await FinancialReportsService.getBalanceSheet(payload.userId, date);

    return NextResponse.json({
      success: true,
      data: balanceSheet,
    } as ApiResponse<BalanceSheet>);
  } catch (error) {
    console.error('Error al obtener balance general:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
