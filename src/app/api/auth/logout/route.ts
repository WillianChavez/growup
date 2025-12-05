import { NextResponse } from 'next/server';
import type { ApiResponse } from '@/types/api.types';

export async function POST() {
  try {
    const response = NextResponse.json<ApiResponse>(
      {
        success: true,
        message: 'Sesión cerrada exitosamente',
      },
      { status: 200 }
    );

    // Eliminar cookie de autenticación
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error en logout:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Error al cerrar sesión',
      },
      { status: 500 }
    );
  }
}
