import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '@/types/api.types';
import { prisma } from '@/lib/db';
import { getRequestAuth } from '@/lib/api-auth';
import { logError, logWarn } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rate-limit';
import { convertCurrency } from '@/services/currency.service';

export async function GET(request: NextRequest) {
  const route = '/api/currency/convert';
  const method = 'GET';

  try {
    const auth = await getRequestAuth(request);
    if (!auth.isAuthenticated || !auth.payload) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const rateLimit = checkRateLimit('currency-convert', auth.payload.userId || auth.ip, {
      windowMs: 30 * 60 * 1000,
      maxRequests: 10,
    });

    if (!rateLimit.allowed) {
      logWarn('Rate limit exceeded for currency convert route', {
        route,
        method,
        userId: auth.payload.userId,
        ip: auth.ip,
      });

      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Demasiadas conversiones.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } }
      );
    }

    const { searchParams } = new URL(request.url);
    const user = await prisma.user.findUnique({
      where: { id: auth.payload.userId },
      select: { currency: true },
    });
    const base = searchParams.get('from') || user?.currency || 'USD';
    const amountParam = searchParams.get('amount');
    const symbolsParam = searchParams.get('symbols') || 'USD,EUR';
    const amount = amountParam ? Number(amountParam) : 1;

    if (!base || Number.isNaN(amount) || amount <= 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Parámetros inválidos' },
        { status: 400 }
      );
    }

    const targets = symbolsParam
      .split(',')
      .map((symbol) => symbol.trim())
      .filter(Boolean);

    const result = await convertCurrency({
      base,
      amount,
      targets,
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: result,
    });
  } catch (error) {
    logError('Unhandled error in currency convert route', {
      error,
      route,
      method,
    });
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al convertir moneda' },
      { status: 500 }
    );
  }
}
