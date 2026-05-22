import { NextRequest, NextResponse } from 'next/server';
import { BodyMetricService } from '@/services/body-metric.service';
import { bodyMetricUpdateSchema } from '@/lib/validations/exercise.validation';
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
    const validation = bodyMetricUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { id } = await params;

    const result = await withUserContext(request, async (ctx) => {
      const { date, ...fields } = validation.data;
      const metric = await BodyMetricService.update(id, ctx.userId, {
        ...fields,
        ...(date !== undefined && { date: toUserDate(date, ctx.timezone) }),
      });
      if (metric && fields.weight !== null && fields.weight !== undefined) {
        await BodyMetricService.syncWeightGoal(ctx.userId, fields.weight);
      }
      return metric;
    });

    if (!result) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Medición no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: result,
      message: 'Medición actualizada',
    });
  } catch (error) {
    console.error('Error updating body metric:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al actualizar la medición' },
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

    const success = await withUserContext(request, (ctx) =>
      BodyMetricService.delete(id, ctx.userId)
    );

    if (success === null) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    if (!success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Medición no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({ success: true, message: 'Medición eliminada' });
  } catch (error) {
    console.error('Error deleting body metric:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al eliminar la medición' },
      { status: 500 }
    );
  }
}
