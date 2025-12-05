import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import { BudgetService } from '@/services/budget.service';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

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
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { id } = await params;
    await BudgetService.deleteIncomeSource(id, payload.userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting income source:', error);
    return NextResponse.json({ error: 'Error al eliminar fuente de ingreso' }, { status: 500 });
  }
}
