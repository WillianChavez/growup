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

    const recurringExpenses = await BudgetService.getRecurringExpenses(payload.userId);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: recurringExpenses,
    });
  } catch (error) {
    console.error('Error fetching recurring expenses:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al obtener gastos recurrentes' },
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
    const recurringExpense = await BudgetService.createRecurringExpense(payload.userId, body);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: recurringExpense,
      message: 'Gasto recurrente creado exitosamente',
    });
  } catch (error) {
    console.error('Error creating recurring expense:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al crear gasto recurrente' },
      { status: 500 }
    );
  }
}

