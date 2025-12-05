import { NextRequest, NextResponse } from 'next/server';
import { BookService } from '@/services/book.service';
import { bookSchema } from '@/lib/validations/book.validation';
import { verifyToken } from '@/lib/jwt';
import type { ApiResponse } from '@/types/api.types';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;

    const books = await BookService.findAllByUser(payload.userId, status);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: books,
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al obtener libros' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    const validation = bookSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const book = await BookService.create(payload.userId, {
      ...validation.data,
      isbn: validation.data.isbn ?? null,
      coverUrl: validation.data.coverUrl ?? null,
      rating: validation.data.rating ?? null,
      review: validation.data.review ?? null,
      notes: validation.data.notes ?? null,
      startDate: validation.data.startDate ?? null,
      endDate: validation.data.endDate ?? null,
      genre: validation.data.genre ?? null,
      tags: validation.data.tags ?? null,
    });

    return NextResponse.json<ApiResponse>(
      { success: true, data: book, message: 'Libro agregado exitosamente' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating book:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al crear libro' },
      { status: 500 }
    );
  }
}
