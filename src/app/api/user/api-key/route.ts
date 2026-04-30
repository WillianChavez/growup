import { NextRequest, NextResponse } from 'next/server';
import { getRequestAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/db';
import type { ApiResponse } from '@/types/api.types';

function generateApiKey(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `gup_${hex}`;
}

export async function GET(request: NextRequest) {
  const auth = await getRequestAuth(request);
  if (!auth.isAuthenticated || !auth.payload) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'No autenticado' },
      { status: 401 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.payload.userId },
    select: { apiKey: true },
  });

  return NextResponse.json<ApiResponse>({
    success: true,
    data: { apiKey: user?.apiKey ?? null },
  });
}

export async function POST(request: NextRequest) {
  const auth = await getRequestAuth(request);
  if (!auth.isAuthenticated || !auth.payload) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'No autenticado' },
      { status: 401 }
    );
  }

  const apiKey = generateApiKey();
  await prisma.user.update({
    where: { id: auth.payload.userId },
    data: { apiKey },
  });

  return NextResponse.json<ApiResponse>({ success: true, data: { apiKey } });
}

export async function DELETE(request: NextRequest) {
  const auth = await getRequestAuth(request);
  if (!auth.isAuthenticated || !auth.payload) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'No autenticado' },
      { status: 401 }
    );
  }

  await prisma.user.update({
    where: { id: auth.payload.userId },
    data: { apiKey: null },
  });

  return NextResponse.json<ApiResponse>({ success: true, data: null });
}
