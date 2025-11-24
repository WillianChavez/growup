import { NextRequest, NextResponse } from 'next/server';
import { TransactionService } from '@/services/transaction.service';
import { transactionSchema } from '@/lib/validations/transaction.validation';
import { verifyToken } from '@/lib/jwt';
import type { ApiResponse } from '@/types/api.types';
import { TransactionCategoryService } from '@/services/transaction-category.service';

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
    const validation = transactionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    // Verificar que la categoría existe y pertenece al usuario
    const category = await TransactionCategoryService.findById(validation.data.categoryId, payload.userId);
    if (!category) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Categoría no encontrada' },
        { status: 404 }
      );
    }

    const transaction = await TransactionService.create(payload.userId, {
      ...validation.data,
      notes: validation.data.notes ?? null,
      recurringFrequency: validation.data.recurringFrequency ?? null,
      tags: validation.data.tags ?? null,
    });

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

