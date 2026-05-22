import { NextRequest, NextResponse } from 'next/server';
import { WorkoutService } from '@/services/workout.service';
import { workoutSchema } from '@/lib/validations/exercise.validation';
import { withUserContext } from '@/lib/api-context-helper';
import { toZonedTime } from 'date-fns-tz';
import type { ApiResponse } from '@/types/api.types';

/**
 * Convierte una fecha ISO (interpretada como UTC) a una fecha que representa
 * el mismo día en la zona horaria del usuario. Mismo patrón que las entradas
 * de hábitos (`api/habits/[id]/entries/route.ts`).
 */
function toUserDate(dateInput: string | Date, timezone: string): Date {
  const dateObj = new Date(dateInput);
  const naiveDate = new Date(
    dateObj.getUTCFullYear(),
    dateObj.getUTCMonth(),
    dateObj.getUTCDate(),
    12,
    0,
    0,
    0
  );
  return toZonedTime(naiveDate, timezone);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') ? new Date(searchParams.get('from')!) : undefined;
    const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined;

    const sessions = await withUserContext(request, (ctx) =>
      WorkoutService.findAllByUser(ctx.userId, from, to)
    );

    if (!sessions) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    return NextResponse.json<ApiResponse>({ success: true, data: sessions });
  } catch (error) {
    console.error('Error fetching workouts:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al obtener entrenamientos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = workoutSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const session = await withUserContext(request, (ctx) =>
      WorkoutService.create(ctx.userId, {
        ...validation.data,
        date: toUserDate(validation.data.date, ctx.timezone),
      })
    );

    if (!session) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    return NextResponse.json<ApiResponse>(
      { success: true, data: session, message: 'Entrenamiento registrado' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating workout:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al registrar entrenamiento' },
      { status: 500 }
    );
  }
}
