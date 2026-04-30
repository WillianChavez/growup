import { NextRequest, NextResponse } from 'next/server';
import { BudgetService } from '@/services/budget.service';
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
    const auth = await getRequestAuth(request);
    if (!auth.isAuthenticated || !auth.payload) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }
    const payload = auth.payload;

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
