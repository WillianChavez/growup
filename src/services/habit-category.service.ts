import { prisma } from '@/lib/db';
import type { HabitCategory } from '@/types/habit.types';

export class HabitCategoryService {
  static async create(
    userId: string,
    data: Omit<HabitCategory, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<HabitCategory> {
    return prisma.habitCategory.create({
      data: {
        ...data,
        userId,
      },
    }) as Promise<HabitCategory>;
  }

  static async findById(id: string, userId: string): Promise<HabitCategory | null> {
    return prisma.habitCategory.findFirst({
      where: { id, userId },
    }) as Promise<HabitCategory | null>;
  }

  static async findAllByUser(userId: string): Promise<HabitCategory[]> {
    return prisma.habitCategory.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    }) as Promise<HabitCategory[]>;
  }

  static async update(
    id: string,
    userId: string,
    data: Partial<Omit<HabitCategory, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<HabitCategory | null> {
    const category = await prisma.habitCategory.findFirst({
      where: { id, userId },
    });

    if (!category) return null;

    return prisma.habitCategory.update({
      where: { id },
      data,
    }) as Promise<HabitCategory>;
  }

  static async delete(id: string, userId: string): Promise<boolean> {
    try {
      // Verificar que no hay hábitos usando esta categoría
      const habitsCount = await prisma.habit.count({
        where: { categoryId: id, userId },
      });

      if (habitsCount > 0) {
        throw new Error('No se puede eliminar una categoría con hábitos asociados');
      }

      await prisma.habitCategory.deleteMany({
        where: { id, userId },
      });
      return true;
    } catch {
      return false;
    }
  }

  // Crear categorías por defecto para un nuevo usuario
  static async createDefaultCategories(userId: string): Promise<void> {
    const defaultCategories = [
      { name: 'Salud', emoji: '💪', color: '#10b981' },
      { name: 'Productividad', emoji: '🚀', color: '#3b82f6' },
      { name: 'Aprendizaje', emoji: '📚', color: '#8b5cf6' },
      { name: 'Fitness', emoji: '🏃', color: '#f59e0b' },
      { name: 'Mindfulness', emoji: '🧘', color: '#06b6d4' },
      { name: 'Social', emoji: '👥', color: '#ec4899' },
      { name: 'Otro', emoji: '📁', color: '#64748b' },
    ];

    await prisma.habitCategory.createMany({
      data: defaultCategories.map((cat) => ({ ...cat, userId })),
    });
  }
}
