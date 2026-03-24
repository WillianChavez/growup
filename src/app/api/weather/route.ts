import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '@/types/api.types';
import { getRequestAuth } from '@/lib/api-auth';
import { logError, logWarn } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rate-limit';
import { getWeatherSummary } from '@/services/weather.service';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const route = '/api/weather';
  const method = 'GET';

  try {
    const auth = await getRequestAuth(request);
    if (!auth.isAuthenticated || !auth.payload) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const rateLimit = checkRateLimit('weather', auth.payload.userId || auth.ip, {
      windowMs: 5 * 60 * 1000,
      maxRequests: 6,
    });

    if (!rateLimit.allowed) {
      logWarn('Rate limit exceeded for weather route', {
        route,
        method,
        userId: auth.payload.userId,
        ip: auth.ip,
      });

      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Demasiadas solicitudes de clima.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.payload.userId },
      select: { timezone: true },
    });
    const timezone = user?.timezone || 'America/New_York';

    const weather = await getWeatherSummary(timezone);
    if (!weather) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No se pudo obtener el clima' },
        { status: 503 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: weather,
    });
  } catch (error) {
    logError('Unhandled error in weather route', {
      error,
      route,
      method,
    });
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al obtener clima' },
      { status: 500 }
    );
  }
}
