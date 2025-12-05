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

    const incomeSources = await BudgetService.getIncomeSources(payload.userId);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: incomeSources,
    });
  } catch (error) {
    console.error('Error fetching income sources:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al obtener fuentes de ingreso' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const incomeSource = await BudgetService.createIncomeSource(payload.userId, body);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: incomeSource,
      message: 'Fuente de ingreso creada exitosamente',
    });
  } catch (error) {
    console.error('Error creating income source:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al crear fuente de ingreso' },
      { status: 500 }
    );
  }
}
