import { SignJWT, jwtVerify } from 'jose';
import type { JWTPayload } from '@/types/auth.types';
import { logError, logWarn } from '@/lib/logger';

let hasWarnedAboutJwtSecret = false;

function getJwtSecret(): Uint8Array {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET is required in production');
    }

    if (!hasWarnedAboutJwtSecret) {
      logWarn('JWT_SECRET not set. Using insecure fallback key for development only.');
      hasWarnedAboutJwtSecret = true;
    }

    return new TextEncoder().encode('insecure-dev-secret-change-me');
  }

  return new TextEncoder().encode(jwtSecret);
}

export async function signToken(payload: JWTPayload): Promise<string> {
  const secret = getJwtSecret();

  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);

  return token;
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret);

    // Verificar que el payload tiene las propiedades requeridas
    if (
      typeof payload.userId === 'string' &&
      typeof payload.email === 'string' &&
      typeof payload.name === 'string'
    ) {
      return payload as unknown as JWTPayload;
    }

    return null;
  } catch (error) {
    logError('Error verifying token', {
      error,
      details: { tokenPresent: !!token },
    });
    return null;
  }
}
