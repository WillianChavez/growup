import { NextRequest, NextResponse } from 'next/server';
import { WorkoutService } from '@/services/workout.service';
import { workoutSchema } from '@/lib/validations/exercise.validation';
import { withUserContext } from '@/lib/api-context-helper';
import { toZonedTime } from 'date-fns-tz';
import type { ApiResponse } from '@/types/api.types';

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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json();
    const validation = workoutSchema.partial().safeParse(body);

    if (!validation.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { id } = await params;

    const { date, ...fields } = validation.data;

    const session = await withUserContext(request, (ctx) =>
      WorkoutService.update(id, ctx.userId, {
        ...fields,
        ...(date !== undefined && { date: toUserDate(date, ctx.timezone) }),
      })
    );

    if (!session) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Entrenamiento no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: session,
      message: 'Entrenamiento actualizado',
    });
  } catch (error) {
    console.error('Error updating workout:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al actualizar entrenamiento' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const success = await withUserContext(request, (ctx) => WorkoutService.delete(id, ctx.userId));

    if (success === null) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    if (!success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Entrenamiento no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({ success: true, message: 'Entrenamiento eliminado' });
  } catch (error) {
    console.error('Error deleting workout:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al eliminar entrenamiento' },
      { status: 500 }
    );
  }
}
