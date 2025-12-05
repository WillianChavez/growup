import { NextRequest, NextResponse } from 'next/server';
import { HabitService } from '@/services/habit.service';
import { withUserContext } from '@/lib/api-context-helper';
import { toZonedTime } from 'date-fns-tz';
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
      // La fecha viene como ISO string desde el frontend (ej: "2025-12-04T12:00:00.000Z")
      // JavaScript la interpreta como UTC, pero necesitamos tratarla como fecha en la zona horaria del usuario
      // Para esto, parseamos la fecha ISO y la convertimos a la zona horaria del usuario
      const dateObj = new Date(date);
      // Extraer año, mes y día de la fecha ISO (que está en UTC)
      const year = dateObj.getUTCFullYear();
      const month = dateObj.getUTCMonth();
      const day = dateObj.getUTCDate();

      // Crear una fecha "naive" (sin zona horaria) con esos componentes
      // y luego convertirla a la zona horaria del usuario usando toZonedTime
      const naiveDate = new Date(year, month, day, 12, 0, 0, 0);
      // Convertir a la zona horaria del usuario (esto crea una fecha que representa el mismo día en la zona horaria del usuario)
      const userDate = toZonedTime(naiveDate, userContext.timezone);

      return await HabitService.logEntry(
        id, // habitId primero
        userContext.userId, // userId segundo
        userDate,
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
