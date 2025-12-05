import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { UserService } from '@/services/user.service';
import { excludePassword } from '@/lib/utils';
import type { ApiResponse } from '@/types/api.types';
import type { UserWithoutPassword } from '@/types/auth.types';

export async function GET(request: NextRequest) {
  try {
    // Obtener token de la cookie
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'No autenticado',
        },
        { status: 401 }
      );
    }

    // Verificar token
    const payload = await verifyToken(token);

    if (!payload) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Token inválido',
        },
        { status: 401 }
      );
    }

    // Obtener usuario
    const user = await UserService.findById(payload.userId);

    if (!user) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Usuario no encontrado',
        },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<UserWithoutPassword>>(
      {
        success: true,
        data: excludePassword(user),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}
