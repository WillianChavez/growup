import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/services/auth.service';
import { loginSchema } from '@/lib/validations/auth.validation';
import type { ApiResponse } from '@/types/api.types';
import type { AuthResponse } from '@/types/auth.types';
import { checkRateLimit } from '@/lib/rate-limit';
import { logError, logWarn } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  try {
    const rateLimit = checkRateLimit('auth:login', ip, {
      windowMs: 5 * 60 * 1000,
      maxRequests: 5,
    });

    if (!rateLimit.allowed) {
      logWarn('Rate limit exceeded for login endpoint', {
        route: '/api/auth/login',
        method: 'POST',
        ip,
      });

      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Demasiados intentos. Intenta nuevamente más tarde.',
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
        }
      );
    }

    const body = await request.json();

    // Validar datos
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: validation.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    // Autenticar usuario
    const result = await AuthService.login(validation.data);

    if (!result.success) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: result.message || 'Error al iniciar sesión',
        },
        { status: 401 }
      );
    }

    // Crear respuesta con cookie
    const response = NextResponse.json<ApiResponse<AuthResponse>>(
      {
        success: true,
        data: result,
        message: result.message,
      },
      { status: 200 }
    );

    // Establecer cookie con el token
    if (result.token) {
      response.cookies.set('auth-token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 días
        path: '/',
      });
    }

    return response;
  } catch (error) {
    logError('Unhandled error in login route', {
      error,
      route: '/api/auth/login',
      method: 'POST',
      ip,
    });

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}
