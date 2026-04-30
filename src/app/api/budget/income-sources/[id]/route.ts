import { NextRequest, NextResponse } from 'next/server';
import { getRequestAuth } from '@/lib/api-auth';
import { BudgetService } from '@/services/budget.service';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getRequestAuth(request);
    if (!auth.isAuthenticated || !auth.payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const payload = auth.payload;

    const data = await request.json();
    const { id } = await params;
    const incomeSource = await BudgetService.updateIncomeSource(id, payload.userId, data);

    return NextResponse.json({ success: true, data: incomeSource });
  } catch (error) {
    console.error('Error updating income source:', error);
    return NextResponse.json({ error: 'Error al actualizar fuente de ingreso' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getRequestAuth(request);
    if (!auth.isAuthenticated || !auth.payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const payload = auth.payload;

    const { id } = await params;
    await BudgetService.deleteIncomeSource(id, payload.userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting income source:', error);
    return NextResponse.json({ error: 'Error al eliminar fuente de ingreso' }, { status: 500 });
  }
}
