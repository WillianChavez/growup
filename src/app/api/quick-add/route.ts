import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '@/types/api.types';
import { getRequestAuth } from '@/lib/api-auth';
import { logError, logWarn } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rate-limit';
import { FocusService } from '@/services/focus.service';

export async function POST(request: NextRequest) {
  const route = '/api/quick-add';
  const method = 'POST';

  try {
    const auth = await getRequestAuth(request);
    if (!auth.isAuthenticated || !auth.payload) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const rateLimit = checkRateLimit('quick-add', auth.payload.userId || auth.ip, {
      windowMs: 60 * 1000,
      maxRequests: 8,
    });

    if (!rateLimit.allowed) {
      logWarn('Rate limit exceeded for quick-add route', {
        route,
        method,
        userId: auth.payload.userId,
        ip: auth.ip,
      });

      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Demasiados comandos. Espera unos segundos.',
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
        }
      );
    }

    const body = (await request.json()) as { input?: string };
    const input = body.input?.trim();

    if (!input) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'El comando es requerido' },
        { status: 400 }
      );
    }

    const result = await FocusService.quickAdd(auth.payload.userId, input);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: result,
      message: result.message,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al procesar Quick Add';

    if (error instanceof Error) {
      return NextResponse.json<ApiResponse>({ success: false, error: message }, { status: 400 });
    }

    logError('Unhandled error in quick-add route', {
      error,
      route,
      method,
    });

    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al procesar Quick Add' },
      { status: 500 }
    );
  }
}
