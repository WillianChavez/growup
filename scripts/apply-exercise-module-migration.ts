/**
 * Aplica la migración `add_exercise_module` a la base de datos Turso.
 *
 * SEGURO: esta migración es puramente aditiva. Solo crea las tablas nuevas
 * `WorkoutSession` y `BodyMetric` con sus índices. NO ejecuta DROP, DELETE ni
 * ALTER sobre tablas existentes, por lo que no afecta los datos de producción.
 *
 * Es idempotente: si una tabla ya existe, no la vuelve a crear.
 *
 * Uso: tsx scripts/apply-exercise-module-migration.ts
 */
import 'dotenv/config';
import { createClient } from '@libsql/client';

const STATEMENTS: Record<string, string> = {
  WorkoutSession: `
    CREATE TABLE "WorkoutSession" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "date" DATETIME NOT NULL,
        "focus" TEXT NOT NULL,
        "durationMin" INTEGER,
        "intensity" TEXT,
        "notes" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        CONSTRAINT "WorkoutSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
    CREATE INDEX "WorkoutSession_userId_date_idx" ON "WorkoutSession"("userId", "date");
  `,
  BodyMetric: `
    CREATE TABLE "BodyMetric" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "date" DATETIME NOT NULL,
        "weight" REAL,
        "waist" REAL,
        "chest" REAL,
        "hip" REAL,
        "arm" REAL,
        "thigh" REAL,
        "notes" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        CONSTRAINT "BodyMetric_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
    CREATE INDEX "BodyMetric_userId_date_idx" ON "BodyMetric"("userId", "date");
    CREATE UNIQUE INDEX "BodyMetric_userId_date_key" ON "BodyMetric"("userId", "date");
  `,
};

async function main() {
  const url = process.env.DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error('DATABASE_URL no está configurada');
  }
  if (!url.startsWith('libsql://') && !url.startsWith('turso://')) {
    throw new Error(`DATABASE_URL no apunta a Turso (${url}). Abortando por seguridad.`);
  }
  if (!authToken) {
    throw new Error('TURSO_AUTH_TOKEN no está configurada');
  }

  const client = createClient({ url, authToken });

  for (const [table, ddl] of Object.entries(STATEMENTS)) {
    const existing = await client.execute({
      sql: "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
      args: [table],
    });

    if (existing.rows.length > 0) {
      console.log(`✅ La tabla "${table}" ya existe. Nada que aplicar.`);
      continue;
    }

    console.log(`➡️  Creando tabla "${table}" e índices (operación aditiva, sin riesgo)...`);
    await client.executeMultiple(ddl);

    const verify = await client.execute({
      sql: "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
      args: [table],
    });
    if (verify.rows.length === 0) {
      throw new Error(`La tabla "${table}" no se creó. Revisa la conexión.`);
    }
    console.log(`✅ Tabla "${table}" creada correctamente en Turso.`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error aplicando la migración:', error);
    process.exit(1);
  });
