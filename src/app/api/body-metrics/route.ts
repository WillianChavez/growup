import { NextRequest, NextResponse } from 'next/server';
import { BodyMetricService } from '@/services/body-metric.service';
import { bodyMetricSchema } from '@/lib/validations/exercise.validation';
import { withUserContext } from '@/lib/api-context-helper';
import { toZonedTime } from 'date-fns-tz';
import type { ApiResponse } from '@/types/api.types';
import type { BodyMetric, WeightGoalSync } from '@/types/exercise.types';

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

    const metrics = await withUserContext(request, (ctx) =>
      BodyMetricService.findAllByUser(ctx.userId, from, to)
    );

    if (!metrics) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    return NextResponse.json<ApiResponse>({ success: true, data: metrics });
  } catch (error) {
    console.error('Error fetching body metrics:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al obtener métricas' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = bodyMetricSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const result = await withUserContext(request, async (ctx) => {
      const { date, ...fields } = validation.data;
      const metric = await BodyMetricService.upsertForDate(
        ctx.userId,
        toUserDate(date, ctx.timezone),
        fields
      );

      // Si se registró peso, intentar avanzar el objetivo de salud.
      let goalSync: WeightGoalSync | null = null;
      if (fields.weight !== null && fields.weight !== undefined) {
        goalSync = await BodyMetricService.syncWeightGoal(ctx.userId, fields.weight);
      }

      return { metric, goalSync };
    });

    if (!result) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const completedCount = result.goalSync?.completedMilestones.length ?? 0;
    const message =
      completedCount > 0
        ? `Medición guardada. ¡Avanzaste ${completedCount} hito(s) del objetivo de salud!`
        : 'Medición guardada';

    return NextResponse.json<ApiResponse<{ metric: BodyMetric; goalSync: WeightGoalSync | null }>>(
      { success: true, data: result, message },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error saving body metric:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al guardar la medición' },
      { status: 500 }
    );
  }
}
