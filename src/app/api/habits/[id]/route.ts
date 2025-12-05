import { NextRequest, NextResponse } from 'next/server';
import { HabitService } from '@/services/habit.service';
import { habitSchema } from '@/lib/validations/habit.validation';
import { verifyToken } from '@/lib/jwt';
import type { ApiResponse } from '@/types/api.types';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const habit = await HabitService.findById(id, payload.userId);

    if (!habit) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Hábito no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: habit,
    });
  } catch (error) {
    console.error('Error fetching habit:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al obtener hábito' },
      { status: 500 }
    );
  }
}

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

    const body = await request.json();
    const validation = habitSchema.partial().safeParse(body);

    if (!validation.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { id } = await params;
    const habit = await HabitService.update(id, payload.userId, validation.data);

    if (!habit) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Hábito no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: habit,
      message: 'Hábito actualizado exitosamente',
    });
  } catch (error) {
    console.error('Error updating habit:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al actualizar hábito' },
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
    const success = await HabitService.delete(id, payload.userId);

    if (!success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Hábito no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Hábito eliminado exitosamente',
    });
  } catch (error) {
    console.error('Error deleting habit:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al eliminar hábito' },
      { status: 500 }
    );
  }
}
