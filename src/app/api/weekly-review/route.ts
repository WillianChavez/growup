import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '@/types/api.types';
import { getRequestAuth } from '@/lib/api-auth';
import { logError, logWarn } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rate-limit';
import { FocusService } from '@/services/focus.service';

export async function GET(request: NextRequest) {
  const route = '/api/weekly-review';
  const method = 'GET';

  try {
    const auth = await getRequestAuth(request);
    if (!auth.isAuthenticated || !auth.payload) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const rateLimit = checkRateLimit('weekly-review', auth.payload.userId || auth.ip, {
      windowMs: 5 * 60 * 1000,
      maxRequests: 8,
    });

    if (!rateLimit.allowed) {
      logWarn('Rate limit exceeded for weekly-review route', {
        route,
        method,
        userId: auth.payload.userId,
        ip: auth.ip,
      });

      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Intenta nuevamente más tarde.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } }
      );
    }

    const review = await FocusService.getWeeklyReview(auth.payload.userId);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: review,
    });
  } catch (error) {
    logError('Unhandled error in weekly-review route', {
      error,
      route,
      method,
    });

    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al obtener cierre semanal' },
      { status: 500 }
    );
  }
}
