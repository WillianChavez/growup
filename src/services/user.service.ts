import { prisma } from '@/lib/db';
import type { User } from '@/types/auth.types';

// Categorías por defecto para nuevos usuarios
const DEFAULT_HABIT_CATEGORIES = [
  { name: 'Salud', emoji: '💪', color: '#10b981' },
  { name: 'Productividad', emoji: '🚀', color: '#3b82f6' },
  { name: 'Aprendizaje', emoji: '📚', color: '#8b5cf6' },
  { name: 'Fitness', emoji: '🏃', color: '#f59e0b' },
  { name: 'Mindfulness', emoji: '🧘', color: '#06b6d4' },
  { name: 'Social', emoji: '👥', color: '#ec4899' },
  { name: 'Creatividad', emoji: '🎨', color: '#f59e0b' },
  { name: 'Nutrición', emoji: '🥗', color: '#10b981' },
  { name: 'Sueño', emoji: '😴', color: '#6366f1' },
  { name: 'Otro', emoji: '📁', color: '#64748b' },
];

const DEFAULT_TRANSACTION_CATEGORIES = [
  // Gastos
  { name: 'Alimentación', emoji: '🍔', type: 'expense' },
  { name: 'Transporte', emoji: '🚗', type: 'expense' },
  { name: 'Vivienda', emoji: '🏠', type: 'expense' },
  { name: 'Entretenimiento', emoji: '🎬', type: 'expense' },
  { name: 'Salud', emoji: '💊', type: 'expense' },
  { name: 'Educación', emoji: '📚', type: 'expense' },
  { name: 'Servicios', emoji: '💡', type: 'expense' },
  { name: 'Compras', emoji: '🛍️', type: 'expense' },
  { name: 'Viajes', emoji: '✈️', type: 'expense' },
  { name: 'Deportes', emoji: '⚽', type: 'expense' },
  { name: 'Tecnología', emoji: '💻', type: 'expense' },
  { name: 'Ropa', emoji: '👔', type: 'expense' },
  { name: 'Mascotas', emoji: '🐕', type: 'expense' },
  { name: 'Regalos', emoji: '🎁', type: 'expense' },
  { name: 'Otro Gasto', emoji: '💰', type: 'expense' },
  // Ingresos
  { name: 'Salario', emoji: '💼', type: 'income' },
  { name: 'Freelance', emoji: '💻', type: 'income' },
  { name: 'Inversiones', emoji: '📈', type: 'income' },
  { name: 'Negocio', emoji: '🏢', type: 'income' },
  { name: 'Bonos', emoji: '🎁', type: 'income' },
  { name: 'Ventas', emoji: '💵', type: 'income' },
  { name: 'Alquiler', emoji: '🏘️', type: 'income' },
  { name: 'Otro Ingreso', emoji: '💰', type: 'income' },
];

export class UserService {
  static async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  static async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  static async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    // Crear usuario y sus categorías por defecto en una transacción
    const user = await prisma.$transaction(async (tx) => {
      // 1. Crear el usuario
      const newUser = await tx.user.create({
        data: userData,
      });

      // 2. Crear categorías de hábitos por defecto
      await tx.habitCategory.createMany({
        data: DEFAULT_HABIT_CATEGORIES.map(cat => ({
          ...cat,
          userId: newUser.id,
        })),
      });

      // 3. Crear categorías de transacciones por defecto
      await tx.transactionCategory.createMany({
        data: DEFAULT_TRANSACTION_CATEGORIES.map(cat => ({
          ...cat,
          userId: newUser.id,
        })),
      });

      return newUser;
    });

    console.log(`✅ Usuario creado con ${DEFAULT_HABIT_CATEGORIES.length} categorías de hábitos y ${DEFAULT_TRANSACTION_CATEGORIES.length} categorías de transacciones`);

    return user;
  }

  static async update(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | null> {
    try {
      return await prisma.user.update({
        where: { id },
        data: updates,
      });
    } catch {
      return null;
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      await prisma.user.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }

  static async getAllUsers(): Promise<User[]> {
    return prisma.user.findMany();
  }
}
