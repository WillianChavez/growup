import { NextRequest, NextResponse } from 'next/server';
import { getRequestAuth } from '@/lib/api-auth';
import { FinancialService } from '@/services/financial.service';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getRequestAuth(request);
    if (!auth.isAuthenticated || !auth.payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const payload = auth.payload;

    const data = await request.json();
    const { id } = await params;
    const asset = await FinancialService.updateAsset(id, payload.userId, data);

    return NextResponse.json({ success: true, data: asset });
  } catch (error) {
    console.error('Error updating asset:', error);
    return NextResponse.json({ error: 'Error al actualizar activo' }, { status: 500 });
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
    await FinancialService.deleteAsset(id, payload.userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting asset:', error);
    return NextResponse.json({ error: 'Error al eliminar activo' }, { status: 500 });
  }
}
