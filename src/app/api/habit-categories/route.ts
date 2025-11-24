import { NextRequest, NextResponse } from 'next/server';
import { HabitCategoryService } from '@/services/habit-category.service';
import { verifyToken } from '@/lib/jwt';
import type { ApiResponse } from '@/types/api.types';
import { z } from 'zod';

const categorySchema = z.object({
  name: z.string().min(1).max(50),
  emoji: z.string(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

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

    const categories = await HabitCategoryService.findAllByUser(payload.userId);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Error fetching habit categories:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al obtener categorías' },
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
    const validation = categorySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const category = await HabitCategoryService.create(payload.userId, validation.data);

    return NextResponse.json<ApiResponse>(
      { success: true, data: category, message: 'Categoría creada exitosamente' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating habit category:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al crear categoría' },
      { status: 500 }
    );
  }
}

