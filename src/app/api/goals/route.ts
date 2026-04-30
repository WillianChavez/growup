import { NextRequest, NextResponse } from 'next/server';
import { GoalService } from '@/services/goal.service';
import { goalSchema } from '@/lib/validations/goal.validation';
import { getRequestAuth } from '@/lib/api-auth';
import type { ApiResponse } from '@/types/api.types';

export async function GET(request: NextRequest) {
  try {
    const auth = await getRequestAuth(request);
    if (!auth.isAuthenticated || !auth.payload) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }
    const payload = auth.payload;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;

    const goals = await GoalService.findAllByUser(payload.userId, status);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: goals,
    });
  } catch (error) {
    console.error('Error fetching goals:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al obtener objetivos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    const validation = goalSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const goal = await GoalService.create(payload.userId, {
      ...validation.data,
      description: validation.data.description ?? null,
      targetDate: validation.data.targetDate ?? null,
      milestones: validation.data.milestones
        ? validation.data.milestones.map((m) => ({
            id: crypto.randomUUID(),
            title: m.title,
            completed: m.completed,
            status: m.status,
            startDate: m.startDate ?? undefined,
            targetDate: m.targetDate ?? undefined,
            completedAt: m.completedAt ?? undefined,
          }))
        : null,
    });

    return NextResponse.json<ApiResponse>(
      { success: true, data: goal, message: 'Objetivo creado exitosamente' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating goal:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al crear objetivo' },
      { status: 500 }
    );
  }
}
