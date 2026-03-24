import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { ApiResponse } from '@/types/api.types';
import { getRequestAuth } from '@/lib/api-auth';
import { logError } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const route = '/api/data/export';
  const method = 'GET';

  try {
    const auth = await getRequestAuth(request);
    if (!auth.isAuthenticated || !auth.payload) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const userId = auth.payload.userId;

    // Exportar todos los datos del usuario
    const [
      habits,
      habitCategories,
      habitEntries,
      books,
      bookQuotes,
      transactions,
      transactionCategories,
      goals,
      incomeSources,
      recurringExpenses,
      assets,
      debts,
    ] = await Promise.all([
      prisma.habit.findMany({ where: { userId } }),
      prisma.habitCategory.findMany({ where: { userId } }),
      prisma.habitEntry.findMany({ where: { userId } }),
      prisma.book.findMany({
        where: { userId },
        include: {
          tags: {
            orderBy: { order: 'asc' },
          },
        },
      }),
      prisma.bookQuote.findMany({ where: { userId } }),
      prisma.transaction.findMany({
        where: { userId },
        include: {
          tags: {
            orderBy: { order: 'asc' },
          },
        },
      }),
      prisma.transactionCategory.findMany({ where: { userId } }),
      prisma.goal.findMany({
        where: { userId },
        include: {
          milestones: {
            orderBy: { order: 'asc' },
          },
        },
      }),
      prisma.incomeSource.findMany({ where: { userId } }),
      prisma.recurringExpense.findMany({ where: { userId } }),
      prisma.asset.findMany({ where: { userId } }),
      prisma.debt.findMany({ where: { userId } }),
    ]);

    const exportData = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      userId,
      data: {
        habits,
        habitCategories,
        habitEntries,
        books: books.map(({ tags, ...book }) => ({
          ...book,
          tags: tags.map((tag) => tag.name),
        })),
        bookQuotes,
        transactions: transactions.map(({ tags, ...transaction }) => ({
          ...transaction,
          tags: tags.map((tag) => tag.name),
        })),
        transactionCategories,
        goals,
        incomeSources,
        recurringExpenses,
        assets,
        debts,
      },
    };

    return NextResponse.json<ApiResponse>({
      success: true,
      data: exportData,
    });
  } catch (error) {
    logError('Unhandled error in export route', {
      error,
      route,
      method,
    });

    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al exportar datos' },
      { status: 500 }
    );
  }
}
