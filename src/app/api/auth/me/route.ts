import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/services/user.service';
import { excludePassword } from '@/lib/utils';
import type { ApiResponse } from '@/types/api.types';
import type { UserWithoutPassword } from '@/types/auth.types';
import { getRequestAuth } from '@/lib/api-auth';
import { logError } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const route = '/api/auth/me';
  const method = 'GET';

  try {
    const auth = await getRequestAuth(request);
    if (!auth.isAuthenticated || !auth.payload) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'No autenticado',
        },
        { status: 401 }
      );
    }

    // Obtener usuario
    const user = await UserService.findById(auth.payload.userId);

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
    logError('Unhandled error in auth/me route', {
      error,
      route,
      method,
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
