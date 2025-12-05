import { NextRequest, NextResponse } from 'next/server';
import { GoalService } from '@/services/goal.service';
import { verifyToken } from '@/lib/jwt';
import type { ApiResponse } from '@/types/api.types';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
