import { prisma } from '@/lib/db';
import type {
  Transaction,
  FinanceStats,
  CategoryTotal,
  MonthlyTransactionGroup,
} from '@/types/finance.types';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, format } from 'date-fns';

export class TransactionService {
  static async create(
    userId: string,
    data: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'category'>
  ): Promise<Transaction> {
    return prisma.transaction.create({
      data: {
        amount: data.amount,
        type: data.type,
        categoryId: data.categoryId,
        description: data.description,
        notes: data.notes,
        date: data.date,
        isRecurring: data.isRecurring,
        recurringFrequency: data.recurringFrequency,
        tags: data.tags ? JSON.stringify(data.tags) : null,
        userId,
      },
      include: {
        category: true,
      },
    }) as Promise<Transaction>;
  }

  static async findById(id: string, userId: string): Promise<Transaction | null> {
    const transaction = await prisma.transaction.findFirst({
      where: { id, userId },
      include: {
        category: true,
      },
    });

    if (!transaction) return null;

    return {
      ...transaction,
      tags: transaction.tags ? JSON.parse(transaction.tags) : null,
    } as Transaction;
  }

  static async findAllByUser(
    userId: string,
    options?: {
      type?: 'income' | 'expense';
      categoryId?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<Transaction[]> {
    interface WhereClause {
      userId: string;
      type?: 'income' | 'expense';
      categoryId?: string;
      date?: {
        gte?: Date;
        lte?: Date;
      };
    }

    const where: WhereClause = { userId };

    if (options?.type) {
      where.type = options.type;
    }

    if (options?.categoryId) {
      where.categoryId = options.categoryId;
    }

    if (options?.startDate || options?.endDate) {
      where.date = {};
      if (options?.startDate) where.date.gte = options.startDate;
      if (options?.endDate) where.date.lte = options.endDate;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { date: 'desc' },
    });

    return transactions.map((t) => ({
      ...t,
      tags: t.tags ? JSON.parse(t.tags) : null,
    })) as Transaction[];
  }

  // Agrupar transacciones por mes - incluyendo las transacciones completas
  static async getGroupedByMonth(
    userId: string,
    year?: number
  ): Promise<MonthlyTransactionGroup[]> {
    const currentYear = year || new Date().getFullYear();
    const yearStart = startOfYear(new Date(currentYear, 0, 1));
    const yearEnd = endOfYear(new Date(currentYear, 11, 31));

    // Obtener todas las transacciones con sus categorías
    // El middleware convertirá las fechas automáticamente
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: yearStart,
          lte: yearEnd,
        },
      },
      include: {
        category: true,
      },
      orderBy: { date: 'desc' },
    });

    // Agrupar por mes usando los datos ya filtrados
    // Las fechas ya están en la zona horaria del usuario gracias al middleware
    const monthlyGroups: Record<string, MonthlyTransactionGroup> = {};

    transactions.forEach((t) => {
      const monthKey = format(t.date, 'yyyy-MM');
      const transactionYear = t.date.getFullYear();

      if (!monthlyGroups[monthKey]) {
        monthlyGroups[monthKey] = {
          month: monthKey,
          year: transactionYear,
          transactions: [],
          totalIncome: 0,
          totalExpenses: 0,
          balance: 0,
        };
      }

      // Agregar la transacción completa al grupo
      const transaction: Transaction = {
        ...t,
        tags: t.tags ? JSON.parse(t.tags) : null,
      } as Transaction;
      monthlyGroups[monthKey].transactions.push(transaction);

      // Calcular totales
      if (t.type === 'income') {
        monthlyGroups[monthKey].totalIncome += t.amount;
      } else {
        monthlyGroups[monthKey].totalExpenses += t.amount;
      }
    });

    // Calcular balances
    Object.values(monthlyGroups).forEach((group) => {
      group.balance = group.totalIncome - group.totalExpenses;
    });

    return Object.values(monthlyGroups).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month.localeCompare(b.month);
    });
  }

  static async update(
    id: string,
    userId: string,
    data: Partial<Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'category'>>
  ): Promise<Transaction | null> {
    const transaction = await prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!transaction) return null;

    interface UpdateData {
      amount?: number;
      type?: 'income' | 'expense';
      categoryId?: string;
      description?: string;
      notes?: string | null;
      date?: Date;
      isRecurring?: boolean;
      recurringFrequency?: string | null;
      tags?: string | null;
    }

    const updateData: UpdateData = {};
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.date !== undefined) updateData.date = data.date;
    if (data.isRecurring !== undefined) updateData.isRecurring = data.isRecurring;
    if (data.recurringFrequency !== undefined)
      updateData.recurringFrequency = data.recurringFrequency;
    if (data.tags !== undefined) updateData.tags = data.tags ? JSON.stringify(data.tags) : null;

    const updated = await prisma.transaction.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
      },
    });

    return {
      ...updated,
      tags: updated.tags ? JSON.parse(updated.tags) : null,
    } as Transaction;
  }

  static async delete(id: string, userId: string): Promise<boolean> {
    try {
      await prisma.transaction.deleteMany({
        where: { id, userId },
      });
      return true;
    } catch {
      return false;
    }
  }

  // Statistics
  static async getStats(userId: string): Promise<FinanceStats> {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const allTransactions = await this.findAllByUser(userId);
    const thisMonthTransactions = allTransactions.filter(
      (t) => t.date >= monthStart && t.date <= monthEnd
    );

    const totalIncome = allTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = allTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyIncome = thisMonthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpenses = thisMonthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Category totals (este mes, solo gastos)
    const categoryMap: Record<
      string,
      { categoryId: string; categoryName: string; emoji: string; total: number; count: number }
    > = {};

    thisMonthTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        if (!categoryMap[t.categoryId]) {
          categoryMap[t.categoryId] = {
            categoryId: t.categoryId,
            categoryName: t.category?.name || 'Sin categoría',
            emoji: t.category?.emoji || '💰',
            total: 0,
            count: 0,
          };
        }
        categoryMap[t.categoryId].total += t.amount;
        categoryMap[t.categoryId].count += 1;
      });

    const topCategories: CategoryTotal[] = Object.values(categoryMap)
      .map((data) => ({
        categoryId: data.categoryId,
        categoryName: data.categoryName,
        emoji: data.emoji,
        total: data.total,
        percentage: monthlyExpenses > 0 ? (data.total / monthlyExpenses) * 100 : 0,
        transactions: data.count,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      thisMonth: {
        income: monthlyIncome,
        expenses: monthlyExpenses,
        balance: monthlyIncome - monthlyExpenses,
      },
      topCategories,
      recentTransactions: allTransactions.slice(0, 10),
      budgetStatus: [], // TODO: Implementar cuando se agreguen presupuestos
    };
  }
}
