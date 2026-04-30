import { NextRequest, NextResponse } from 'next/server';
import { GoalService } from '@/services/goal.service';
import { getRequestAuth } from '@/lib/api-auth';
import type { ApiResponse } from '@/types/api.types';

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

    const { id } = await params;
    const body = await request.json();

    const goal = await GoalService.update(id, payload.userId, body);

    if (!goal) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Meta no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: goal,
      message: 'Meta actualizada exitosamente',
    });
  } catch (error) {
    console.error('Error updating goal:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al actualizar meta' },
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
    await GoalService.delete(id, payload.userId);

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Meta eliminada exitosamente',
    });
  } catch (error) {
    console.error('Error deleting goal:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al eliminar meta' },
      { status: 500 }
    );
  }
}
