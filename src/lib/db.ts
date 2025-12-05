import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db';

  // Configuración base con tipos correctos para log
  const logLevels: Array<'error' | 'warn' | 'info' | 'query'> =
    process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'];

  const baseConfig = {
    log: logLevels,
  };

  // Detectar si es Turso basándose en la URL (libsql:// o turso://)
  const isTurso = databaseUrl.startsWith('libsql://') || databaseUrl.startsWith('turso://');

  if (isTurso) {
    // Para Turso, necesitamos el token de autenticación
    const tursoToken = process.env.TURSO_AUTH_TOKEN;

    if (!tursoToken) {
      throw new Error('TURSO_AUTH_TOKEN debe estar configurada cuando DATABASE_URL apunta a Turso');
    }

    const libsqlClient = createClient({
      url: databaseUrl,
      authToken: tursoToken,
    });

    // PrismaLibSQL para Prisma 5.22.0
    const adapter = new PrismaLibSQL(libsqlClient);

    // Type assertion needed: Prisma types don't fully support adapter in constructor
    // This is a known limitation with Prisma 5.22.0 and driver adapters
    const config = {
      ...baseConfig,
      adapter,
    };

    // @ts-expect-error - adapter property not in PrismaClient constructor types
    return new PrismaClient(config);
  }

  // SQLite (file://) - conexión directa sin adapter
  return new PrismaClient(baseConfig);
}

export const prisma = globalForPrisma.prisma ?? getPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
