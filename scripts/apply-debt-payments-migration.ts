/**
 * Aplica la migración `add_debt_payments` a la base de datos Turso.
 *
 * SEGURO: esta migración es puramente aditiva. Solo crea la tabla nueva
 * `DebtPayment` y sus índices. NO ejecuta DROP, DELETE ni ALTER sobre
 * tablas existentes, por lo que no afecta los datos de producción.
 *
 * Es idempotente: si la tabla `DebtPayment` ya existe, no hace nada.
 *
 * Uso: tsx scripts/apply-debt-payments-migration.ts
 */
import 'dotenv/config';
import { createClient } from '@libsql/client';

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

  // 1. Verificar si la tabla ya existe (idempotencia)
  const existing = await client.execute({
    sql: "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
    args: ['DebtPayment'],
  });

  if (existing.rows.length > 0) {
    console.log('✅ La tabla "DebtPayment" ya existe. No hay nada que aplicar.');
    return;
  }

  console.log('➡️  Creando tabla "DebtPayment" e índices (operación aditiva, sin riesgo)...');

  // 2. Crear SOLO la tabla nueva y sus índices. Nada destructivo.
  await client.executeMultiple(`
    CREATE TABLE "DebtPayment" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "debtId" TEXT NOT NULL,
        "transactionId" TEXT,
        "amount" REAL NOT NULL,
        "principal" REAL NOT NULL,
        "interest" REAL NOT NULL,
        "remainingAfter" REAL NOT NULL,
        "date" DATETIME NOT NULL,
        "note" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "DebtPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "DebtPayment_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "Debt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "DebtPayment_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction" ("id") ON DELETE SET NULL ON UPDATE CASCADE
    );
    CREATE INDEX "DebtPayment_userId_idx" ON "DebtPayment"("userId");
    CREATE INDEX "DebtPayment_debtId_idx" ON "DebtPayment"("debtId");
    CREATE INDEX "DebtPayment_transactionId_idx" ON "DebtPayment"("transactionId");
  `);

  // 3. Verificar resultado
  const verify = await client.execute({
    sql: "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
    args: ['DebtPayment'],
  });

  if (verify.rows.length === 0) {
    throw new Error('La tabla no se creó. Revisa la conexión.');
  }

  console.log('✅ Tabla "DebtPayment" creada correctamente en Turso.');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error aplicando la migración:', error);
    process.exit(1);
  });
