/**
 * Helper para envolver rutas API con contexto de Prisma
 * Esto asegura que todas las operaciones de Prisma usen el timezone correcto
 */

import { prisma } from './db';
import { withPrismaContext } from './prisma-context';
import type { NextRequest } from 'next/server';
import { verifyToken } from './jwt';

/**
 * Obtiene el contexto del usuario (userId y timezone) desde el token
 */
export async function getUserContext(request: NextRequest): Promise<{
  userId: string;
  timezone: string;
} | null> {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) {
    return null;
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return null;
  }

  // Obtener timezone del usuario
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { timezone: true },
  });

  return {
    userId: payload.userId,
    timezone: user?.timezone || 'America/El_Salvador',
  };
}

/**
 * Ejecuta una función con el contexto de Prisma del usuario
 * @param request - Request de Next.js
 * @param fn - Función a ejecutar con el contexto
 */
export async function withUserContext<T>(
  request: NextRequest,
  fn: (context: { userId: string; timezone: string }) => Promise<T>
): Promise<T | null> {
  const context = await getUserContext(request);
  if (!context) {
    return null;
  }

  return withPrismaContext(context, () => fn(context));
}
