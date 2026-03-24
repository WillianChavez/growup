import type { NextRequest } from 'next/server';
import type { JWTPayload } from '@/types/auth.types';
import { verifyToken } from '@/lib/jwt';

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
  const token = request.cookies.get('auth-token')?.value || null;
  const ip = getClientIp(request);

  if (!token) {
    return {
      isAuthenticated: false,
      payload: null,
      token: null,
      ip,
    };
  }

  const payload = await verifyToken(token);

  return {
    isAuthenticated: !!payload,
    payload,
    token,
    ip,
  };
}
