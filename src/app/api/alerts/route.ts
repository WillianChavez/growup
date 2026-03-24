import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '@/types/api.types';
import { getRequestAuth } from '@/lib/api-auth';
import { logError, logWarn } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rate-limit';
import { FocusService } from '@/services/focus.service';

export async function GET(request: NextRequest) {
  const route = '/api/alerts';
  const method = 'GET';

  try {
    const auth = await getRequestAuth(request);
    if (!auth.isAuthenticated || !auth.payload) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const rateLimit = checkRateLimit('alerts', auth.payload.userId || auth.ip, {
      windowMs: 60 * 1000,
      maxRequests: 12,
    });

    if (!rateLimit.allowed) {
      logWarn('Rate limit exceeded for alerts route', {
        route,
        method,
        userId: auth.payload.userId,
        ip: auth.ip,
      });

      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Demasiadas solicitudes.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } }
      );
    }

    const alerts = await FocusService.getAlerts(auth.payload.userId);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: alerts,
    });
  } catch (error) {
    logError('Unhandled error in alerts route', {
      error,
      route,
      method,
    });

    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al obtener alertas' },
      { status: 500 }
    );
  }
}
