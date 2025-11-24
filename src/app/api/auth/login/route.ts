import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/services/auth.service';
import { loginSchema } from '@/lib/validations/auth.validation';
import type { ApiResponse } from '@/types/api.types';
import type { AuthResponse } from '@/types/auth.types';

export async function POST(request: NextRequest) {
  try {
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
    console.error('Error en login:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}

