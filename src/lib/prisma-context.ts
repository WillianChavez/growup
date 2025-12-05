/**
 * Contexto para pasar información del usuario a través de las operaciones de Prisma
 * Esto permite que el middleware acceda al userId y timezone sin pasarlos explícitamente
 */

// Usar AsyncLocalStorage para mantener el contexto en cada request
import { AsyncLocalStorage } from 'async_hooks';

interface PrismaContext {
  userId?: string;
  timezone?: string;
}

const contextStorage = new AsyncLocalStorage<PrismaContext>();

/**
 * Ejecuta una función con un contexto de usuario
 * @param context - Contexto con userId y timezone
 * @param fn - Función a ejecutar
 */
export function withPrismaContext<T>(context: PrismaContext, fn: () => Promise<T>): Promise<T> {
  return contextStorage.run(context, fn);
}

/**
 * Obtiene el contexto actual
 */
export function getPrismaContext(): PrismaContext | undefined {
  return contextStorage.getStore();
}

/**
 * Obtiene el userId del contexto actual
 */
export function getContextUserId(): string | undefined {
  return contextStorage.getStore()?.userId;
}

/**
 * Obtiene el timezone del contexto actual
 */
export function getContextTimezone(): string {
  return contextStorage.getStore()?.timezone || 'America/El_Salvador';
}
