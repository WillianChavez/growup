import { SignJWT, jwtVerify } from 'jose';
import type { JWTPayload } from '@/types/auth.types';

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const secret = new TextEncoder().encode(SECRET_KEY);

export async function signToken(payload: JWTPayload): Promise<string> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);

  return token;
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
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
    console.error('Error verifying token:', error);
    return null;
  }
}
