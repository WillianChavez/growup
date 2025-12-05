import { NextRequest, NextResponse } from 'next/server';
import { HabitService } from '@/services/habit.service';
import { withUserContext } from '@/lib/api-context-helper';
import type { ApiResponse } from '@/types/api.types';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json();
    const { date, completed, notes } = body;

    if (!date) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'La fecha es requerida' },
        { status: 400 }
      );
    }

    const { id } = await params;

    // Ejecutar con contexto de usuario para que el middleware convierta fechas automáticamente
    const entry = await withUserContext(request, async (userContext) => {
      return await HabitService.logEntry(
        id, // habitId primero
        userContext.userId, // userId segundo
        new Date(date),
        completed ?? false,
        notes
      );
    });

    if (!entry) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: entry,
      message: 'Entrada registrada exitosamente',
    });
  } catch (error) {
    console.error('Error logging habit entry:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al registrar entrada' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : undefined;
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : undefined;

    const { id } = await params;

    const entries = await withUserContext(request, async (userContext) => {
      return await HabitService.getEntries(id, userContext.userId, startDate, endDate);
    });

    if (!entries) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: entries,
    });
  } catch (error) {
    console.error('Error fetching habit entries:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al obtener entradas' },
      { status: 500 }
    );
  }
}
