import { NextRequest, NextResponse } from 'next/server';
import { TransactionService } from '@/services/transaction.service';
import { TransactionCategoryService } from '@/services/transaction-category.service';
import { FinancialService } from '@/services/financial.service';
import { transactionUpdateSchema } from '@/lib/validations/transaction.validation';
import { getRequestAuth } from '@/lib/api-auth';
import type { ApiResponse } from '@/types/api.types';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getRequestAuth(request);
    if (!auth.isAuthenticated || !auth.payload) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const transaction = await TransactionService.findById(id, auth.payload.userId);

    if (!transaction) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Transacción no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({ success: true, data: transaction });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al obtener transacción' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const validation = transactionUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    // Si se cambia la categoría, debe existir y pertenecer al usuario.
    if (validation.data.categoryId) {
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
    }

    const { id } = await params;

    // El monto de un egreso que ya es abono a deuda no puede cambiarse aquí:
    // el saldo de la deuda quedaría desfasado. Hay que borrarlo y registrarlo de nuevo.
    if (validation.data.amount !== undefined) {
      const linkedPayment = await FinancialService.findDebtPaymentByTransaction(payload.userId, id);
      if (linkedPayment && linkedPayment.amount !== validation.data.amount) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error:
              'Este egreso es un abono a deuda. Para cambiar el monto, elimínalo y regístralo de nuevo.',
          },
          { status: 400 }
        );
      }
    }

    const transaction = await TransactionService.update(id, payload.userId, validation.data);

    if (!transaction) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Transacción no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: transaction,
      message: 'Transacción actualizada',
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al actualizar transacción' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getRequestAuth(request);
    if (!auth.isAuthenticated || !auth.payload) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }
    const payload = auth.payload;

    const { id } = await params;
    const transaction = await TransactionService.findById(id, payload.userId);

    if (!transaction) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Transacción no encontrada' },
        { status: 404 }
      );
    }

    // Si el egreso era un abono a deuda, devolver el capital al saldo antes de borrarlo.
    await FinancialService.revertDebtPaymentByTransaction(payload.userId, id);

    await TransactionService.delete(id, payload.userId);

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Transacción eliminada',
    });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al eliminar transacción' },
      { status: 500 }
    );
  }
}
