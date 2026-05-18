import { NextRequest, NextResponse } from 'next/server';
import { TransactionService } from '@/services/transaction.service';
import { transactionSchema } from '@/lib/validations/transaction.validation';
import { getRequestAuth } from '@/lib/api-auth';
import type { ApiResponse } from '@/types/api.types';
import { TransactionCategoryService } from '@/services/transaction-category.service';
import { FinancialService } from '@/services/financial.service';

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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'income' | 'expense' | undefined;
    const categoryId = searchParams.get('categoryId') || undefined;

    const transactions = await TransactionService.findAllByUser(payload.userId, {
      type,
      categoryId,
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: transactions,
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al obtener transacciones' },
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
    const validation = transactionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    // Verificar que la categoría existe y pertenece al usuario
    const category = await TransactionCategoryService.findById(
      validation.data.categoryId,
      payload.userId
    );
    if (!category) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Categoría no encontrada' },
        { status: 404 }
      );
    }

    const { debtId, debtInterest, ...transactionData } = validation.data;

    const transaction = await TransactionService.create(payload.userId, {
      ...transactionData,
      notes: transactionData.notes ?? null,
      recurringFrequency: transactionData.recurringFrequency ?? null,
      tags: transactionData.tags ?? null,
    });

    // Si el egreso es un abono a deuda, registrar el abono y bajar el saldo.
    if (debtId && transaction.type === 'expense') {
      try {
        await FinancialService.addDebtPayment(payload.userId, {
          debtId,
          amount: transaction.amount,
          interest: debtInterest ?? 0,
          date: transaction.date,
          note: transaction.description,
          transactionId: transaction.id,
        });
      } catch (debtError) {
        // El egreso ya se creó; revertirlo para no dejar datos inconsistentes.
        await TransactionService.delete(transaction.id, payload.userId);
        const message =
          debtError instanceof Error ? debtError.message : 'Error al registrar el abono';
        return NextResponse.json<ApiResponse>({ success: false, error: message }, { status: 400 });
      }
    }

    return NextResponse.json<ApiResponse>(
      { success: true, data: transaction, message: 'Transacción creada exitosamente' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al crear transacción' },
      { status: 500 }
    );
  }
}
