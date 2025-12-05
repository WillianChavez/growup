import { NextRequest, NextResponse } from 'next/server';
import { HabitService } from '@/services/habit.service';
import { habitSchema } from '@/lib/validations/habit.validation';
import { verifyToken } from '@/lib/jwt';
import type { ApiResponse } from '@/types/api.types';
import { HabitCategoryService } from '@/services/habit-category.service';

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
    const includeArchived = searchParams.get('includeArchived') === 'true';

    const habits = await HabitService.findAllByUser(payload.userId, includeArchived);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: habits,
    });
  } catch (error) {
    console.error('Error fetching habits:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al obtener hábitos' },
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
    const validation = habitSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    // Verificar que la categoría existe y pertenece al usuario
    const category = await HabitCategoryService.findById(
      validation.data.categoryId,
      payload.userId
    );
    if (!category) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Categoría no encontrada' },
        { status: 404 }
      );
    }

    const habit = await HabitService.create(payload.userId, {
      ...validation.data,
      description: validation.data.description ?? null,
      isActive: true,
    });

    return NextResponse.json<ApiResponse>(
      { success: true, data: habit, message: 'Hábito creado exitosamente' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating habit:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al crear hábito' },
      { status: 500 }
    );
  }
}
