import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import type { TransactionCategory } from '@/types/finance.types';

export class TransactionCategoryService {
  static async create(
    userId: string,
    data: Omit<TransactionCategory, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<TransactionCategory> {
    return prisma.transactionCategory.create({
      data: {
        ...data,
        userId,
      },
    }) as Promise<TransactionCategory>;
  }

  static async findById(id: string, userId: string): Promise<TransactionCategory | null> {
    return prisma.transactionCategory.findFirst({
      where: { id, userId },
    }) as Promise<TransactionCategory | null>;
  }

  static async findAllByUser(userId: string, type?: string): Promise<TransactionCategory[]> {
    const where: Prisma.TransactionCategoryWhereInput = { userId };

    if (type && type !== 'both') {
      where.OR = [{ type }, { type: 'both' }];
    }

    return prisma.transactionCategory.findMany({
      where,
      orderBy: { name: 'asc' },
    }) as Promise<TransactionCategory[]>;
  }

  static async update(
    id: string,
    userId: string,
    data: Partial<Omit<TransactionCategory, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<TransactionCategory | null> {
    const category = await prisma.transactionCategory.findFirst({
      where: { id, userId },
    });

    if (!category) return null;

    return prisma.transactionCategory.update({
      where: { id },
      data,
    }) as Promise<TransactionCategory>;
  }

  static async delete(id: string, userId: string): Promise<boolean> {
    try {
      // Verificar que no hay transacciones usando esta categoría
      const transactionsCount = await prisma.transaction.count({
        where: { categoryId: id, userId },
      });

      if (transactionsCount > 0) {
        throw new Error('No se puede eliminar una categoría con transacciones asociadas');
      }

      await prisma.transactionCategory.deleteMany({
        where: { id, userId },
      });
      return true;
    } catch {
      return false;
    }
  }

  // Crear categorías por defecto para un nuevo usuario
  static async createDefaultCategories(userId: string): Promise<void> {
    const expenseCategories = [
      { name: 'Alimentación', emoji: '🍔', type: 'expense' },
      { name: 'Transporte', emoji: '🚗', type: 'expense' },
      { name: 'Vivienda', emoji: '🏠', type: 'expense' },
      { name: 'Entretenimiento', emoji: '🎬', type: 'expense' },
      { name: 'Salud', emoji: '💊', type: 'expense' },
      { name: 'Educación', emoji: '📚', type: 'expense' },
      { name: 'Servicios', emoji: '💡', type: 'expense' },
      { name: 'Compras', emoji: '🛍️', type: 'expense' },
      { name: 'Otro', emoji: '💰', type: 'expense' },
    ];

    const incomeCategories = [
      { name: 'Salario', emoji: '💼', type: 'income' },
      { name: 'Freelance', emoji: '💻', type: 'income' },
      { name: 'Inversiones', emoji: '📈', type: 'income' },
      { name: 'Negocio', emoji: '🏢', type: 'income' },
      { name: 'Otro', emoji: '💰', type: 'income' },
    ];

    await prisma.transactionCategory.createMany({
      data: [...expenseCategories, ...incomeCategories].map((cat) => ({ ...cat, userId })),
    });
  }
}
