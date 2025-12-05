import { NextRequest, NextResponse } from 'next/server';
import { BookService } from '@/services/book.service';
import { bookSchema } from '@/lib/validations/book.validation';
import { verifyToken } from '@/lib/jwt';
import type { ApiResponse } from '@/types/api.types';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Token inválido' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = bookSchema.partial().safeParse(body);

    if (!validation.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { id } = await params;
    const book = await BookService.update(id, payload.userId, validation.data);

    if (!book) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Libro no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: book,
      message: 'Libro actualizado exitosamente',
    });
  } catch (error) {
    console.error('Error updating book:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al actualizar libro' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Token inválido' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const success = await BookService.delete(id, payload.userId);

    if (!success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Libro no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Libro eliminado exitosamente',
    });
  } catch (error) {
    console.error('Error deleting book:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al eliminar libro' },
      { status: 500 }
    );
  }
}
