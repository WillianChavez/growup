import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

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
      prisma.habit.findMany({ where: { userId: payload.userId } }),
      prisma.habitCategory.findMany({ where: { userId: payload.userId } }),
      prisma.habitEntry.findMany({ where: { userId: payload.userId } }),
      prisma.book.findMany({ where: { userId: payload.userId } }),
      prisma.bookQuote.findMany({ where: { userId: payload.userId } }),
      prisma.transaction.findMany({ where: { userId: payload.userId } }),
      prisma.transactionCategory.findMany({ where: { userId: payload.userId } }),
      prisma.goal.findMany({ where: { userId: payload.userId } }),
      prisma.incomeSource.findMany({ where: { userId: payload.userId } }),
      prisma.recurringExpense.findMany({ where: { userId: payload.userId } }),
      prisma.asset.findMany({ where: { userId: payload.userId } }),
      prisma.debt.findMany({ where: { userId: payload.userId } }),
    ]);

    const exportData = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      userId: payload.userId,
      data: {
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
      },
    };

    return NextResponse.json({
      success: true,
      data: exportData,
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { error: 'Error al exportar datos' },
      { status: 500 }
    );
  }
}

