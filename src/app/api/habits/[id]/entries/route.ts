import { NextRequest, NextResponse } from 'next/server';
import { HabitService } from '@/services/habit.service';
import { verifyToken } from '@/lib/jwt';
import type { ApiResponse } from '@/types/api.types';

export async function POST(
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

    const body = await request.json();
    const { date, completed, notes } = body;

    if (!date) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'La fecha es requerida' },
        { status: 400 }
      );
    }

    const { id } = await params;
    const entry = await HabitService.logEntry(
      id,              // habitId primero
      payload.userId,  // userId segundo
      new Date(date),
      completed ?? false,
      notes
    );

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

export async function GET(
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

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;

    const { id } = await params;
    const entries = await HabitService.getEntries(
      id,
      payload.userId,
      startDate,
      endDate
    );

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

