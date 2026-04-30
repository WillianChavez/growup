import type { NextRequest } from 'next/server';
import type { JWTPayload } from '@/types/auth.types';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/db';

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export interface RequestAuthResult {
  isAuthenticated: boolean;
  payload: JWTPayload | null;
  token: string | null;
  ip: string;
}

export async function getRequestAuth(request: NextRequest): Promise<RequestAuthResult> {
  const ip = getClientIp(request);

  // 1. Cookie auth (existing session)
  const token = request.cookies.get('auth-token')?.value || null;
  if (token) {
    const payload = await verifyToken(token);
    return { isAuthenticated: !!payload, payload, token, ip };
  }

  // 2. API key auth (X-API-Key header)
  const apiKey = request.headers.get('x-api-key');
  if (apiKey) {
    const user = await prisma.user.findUnique({ where: { apiKey } });
    if (user) {
      const payload: JWTPayload = { userId: user.id, email: user.email, name: user.name };
      return { isAuthenticated: true, payload, token: null, ip };
    }
    return { isAuthenticated: false, payload: null, token: null, ip };
  }

  return { isAuthenticated: false, payload: null, token: null, ip };
}
