import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { ApiResponse } from '@/types/api.types';
import { getRequestAuth } from '@/lib/api-auth';
import { logError } from '@/lib/logger';

export async function PATCH(request: NextRequest) {
  const route = '/api/auth/update-profile';
  const method = 'PATCH';

  try {
    const auth = await getRequestAuth(request);
    if (!auth.isAuthenticated || !auth.payload) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { name } = await request.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'El nombre es requerido' },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: auth.payload.userId },
      data: { name: name.trim() },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: user,
    });
  } catch (error) {
    logError('Unhandled error in update-profile route', {
      error,
      route,
      method,
    });

    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al actualizar perfil' },
      { status: 500 }
    );
  }
}
