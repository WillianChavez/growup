import 'dotenv/config';
import { createClient } from '@libsql/client';
import { mkdirSync } from 'node:fs';

const USER_EMAIL = 'williamchavezamaya@gmail.com';

type BudgetRecord = {
  id: string;
  name: string;
  category: string;
};

function expenseCategory(record: BudgetRecord): string {
  const name = record.name.toLocaleLowerCase('es');
  if (record.category === 'health' && /gym|gimnasio|smart fit/.test(name)) return 'Deportes';
  if (
    record.category === 'subscriptions' &&
    /cursor|claude|chatgpt|openai|anthropic| ia\b/.test(name)
  ) {
    return 'IA';
  }
  if (record.category === 'utilities' && /aporte.*casa|casa/.test(name)) return 'Vivienda';

  const legacy: Record<string, string> = {
    utilities: 'Servicios',
    internet: 'Internet',
    subscriptions: 'Servicios',
    transportation: 'Transporte',
    groceries: 'Alimentación',
    health: 'Salud',
    rent: 'Vivienda',
    education: 'Educación',
    entertainment: 'Entretenimiento',
    other: 'Otro Gasto',
  };
  return legacy[record.category] || record.category;
}

function incomeCategory(record: BudgetRecord): string {
  const name = record.name.toLocaleLowerCase('es');
  if (record.category === 'other' && /remesa/.test(name)) return 'Remesa';

  const legacy: Record<string, string> = {
    salary: 'Salario',
    freelance: 'Freelance',
    business: 'Negocio',
    investment: 'Inversiones',
    rental: 'Alquiler',
    other: 'Otro Ingreso',
  };
  return legacy[record.category] || record.category;
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL no está configurada');
  const client = createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  const user = await client.execute({
    sql: 'SELECT id FROM User WHERE email = ?',
    args: [USER_EMAIL],
  });
  if (user.rows.length !== 1) throw new Error('No se encontró un usuario único');
  const userId = String(user.rows[0].id);

  const [expenseResult, incomeResult, categoryResult] = await Promise.all([
    client.execute({
      sql: 'SELECT id, name, category FROM RecurringExpense WHERE userId = ?',
      args: [userId],
    }),
    client.execute({
      sql: 'SELECT id, name, category FROM IncomeSource WHERE userId = ?',
      args: [userId],
    }),
    client.execute({
      sql: 'SELECT name, type FROM TransactionCategory WHERE userId = ?',
      args: [userId],
    }),
  ]);

  const expenses = expenseResult.rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    category: String(row.category),
  }));
  const incomes = incomeResult.rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    category: String(row.category),
  }));
  const expenseChanges = expenses
    .map((record) => ({ ...record, nextCategory: expenseCategory(record) }))
    .filter((record) => record.category !== record.nextCategory);
  const incomeChanges = incomes
    .map((record) => ({ ...record, nextCategory: incomeCategory(record) }))
    .filter((record) => record.category !== record.nextCategory);

  const validExpenseCategories = new Set(
    categoryResult.rows
      .filter((row) => row.type === 'expense' || row.type === 'both')
      .map((row) => String(row.name))
  );
  const validIncomeCategories = new Set(
    categoryResult.rows
      .filter((row) => row.type === 'income' || row.type === 'both')
      .map((row) => String(row.name))
  );
  const invalid = [
    ...expenseChanges
      .filter((record) => !validExpenseCategories.has(record.nextCategory))
      .map((record) => `Gasto: ${record.nextCategory}`),
    ...incomeChanges
      .filter((record) => !validIncomeCategories.has(record.nextCategory))
      .map((record) => `Ingreso: ${record.nextCategory}`),
  ];
  if (invalid.length > 0) throw new Error(`Categorías inexistentes: ${invalid.join(', ')}`);

  console.log({ expenseChanges, incomeChanges });

  if (process.env.APPLY_BUDGET_ALIGNMENT === '1') {
    mkdirSync('data', { recursive: true });
    const timestamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-');
    const backupPath = `data/budget-category-alignment-${timestamp}.db`;
    const backup = createClient({ url: `file:${backupPath}` });
    await backup.execute(`
      CREATE TABLE BackupEntry (
        tableName TEXT PRIMARY KEY,
        rowsJson TEXT NOT NULL,
        createdAt TEXT NOT NULL
      )
    `);
    for (const [tableName, rows] of [
      ['RecurringExpense', expenseResult.rows],
      ['IncomeSource', incomeResult.rows],
    ] as const) {
      await backup.execute({
        sql: 'INSERT INTO BackupEntry (tableName, rowsJson, createdAt) VALUES (?, ?, ?)',
        args: [tableName, JSON.stringify(rows), new Date().toISOString()],
      });
    }
    backup.close();

    const tx = await client.transaction('write');
    try {
      const now = new Date().toISOString();
      for (const record of expenseChanges) {
        await tx.execute({
          sql: 'UPDATE RecurringExpense SET category = ?, updatedAt = ? WHERE id = ? AND userId = ?',
          args: [record.nextCategory, now, record.id, userId],
        });
      }
      for (const record of incomeChanges) {
        await tx.execute({
          sql: 'UPDATE IncomeSource SET category = ?, updatedAt = ? WHERE id = ? AND userId = ?',
          args: [record.nextCategory, now, record.id, userId],
        });
      }
      await tx.commit();
    } catch (error) {
      await tx.rollback();
      throw error;
    }
    console.log(`Categorías alineadas. Respaldo: ${backupPath}`);
  }

  client.close();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
