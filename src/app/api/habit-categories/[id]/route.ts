import { NextRequest, NextResponse } from 'next/server';
import { HabitCategoryService } from '@/services/habit-category.service';
import { verifyToken } from '@/lib/jwt';
import type { ApiResponse } from '@/types/api.types';
import { z } from 'zod';

const categorySchema = z.object({
  name: z.string().min(1).max(50).optional(),
  emoji: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
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

    const params = await context.params;
    const body = await request.json();
    const validation = categorySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const category = await HabitCategoryService.update(
      params.id,
      payload.userId,
      validation.data
    );

    if (!category) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Categoría no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: category,
      message: 'Categoría actualizada exitosamente',
    });
  } catch (error) {
    console.error('Error updating habit category:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al actualizar categoría' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
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

    const params = await context.params;
    const success = await HabitCategoryService.delete(params.id, payload.userId);

    if (!success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No se pudo eliminar la categoría (puede tener hábitos asociados)' },
        { status: 400 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Categoría eliminada exitosamente',
    });
  } catch (error) {
    console.error('Error deleting habit category:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al eliminar categoría' },
      { status: 500 }
    );
  }
}

