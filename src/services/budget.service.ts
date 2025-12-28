import { prisma } from '@/lib/db';
import type {
  IncomeSource,
  RecurringExpense,
  IncomeSourceFormData,
  RecurringExpenseFormData,
  BudgetSummary,
} from '@/types/budget.types';
import type { TransactionCategory } from '@/types/finance.types';

// Tipo que representa lo que Prisma devuelve con include: { category: true }
type TransactionWithCategory = {
  id: string;
  userId: string;
  amount: number;
  type: string;
  categoryId: string;
  description: string;
  notes: string | null;
  date: Date;
  isRecurring: boolean;
  recurringFrequency: string | null;
  tags: string | null;
  createdAt: Date;
  updatedAt: Date;
  category: TransactionCategory | null;
};

export class BudgetService {
  // ==================== INCOME SOURCES ====================

  static async getIncomeSources(userId: string): Promise<IncomeSource[]> {
    const sources = await prisma.incomeSource.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return sources as IncomeSource[];
  }

  static async createIncomeSource(
    userId: string,
    data: IncomeSourceFormData
  ): Promise<IncomeSource> {
    const source = await prisma.incomeSource.create({
      data: {
        userId,
        ...data,
      },
    });
    return source as IncomeSource;
  }

  static async updateIncomeSource(
    id: string,
    userId: string,
    data: Partial<IncomeSourceFormData>
  ): Promise<IncomeSource> {
    const source = await prisma.incomeSource.update({
      where: { id, userId },
      data,
    });
    return source as IncomeSource;
  }

  static async deleteIncomeSource(id: string, userId: string): Promise<void> {
    await prisma.incomeSource.delete({
      where: { id, userId },
    });
  }

  // ==================== RECURRING EXPENSES ====================

  static async getRecurringExpenses(userId: string): Promise<RecurringExpense[]> {
    const expenses = await prisma.recurringExpense.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return expenses as RecurringExpense[];
  }

  static async createRecurringExpense(
    userId: string,
    data: RecurringExpenseFormData
  ): Promise<RecurringExpense> {
    const expense = await prisma.recurringExpense.create({
      data: {
        userId,
        ...data,
      },
    });
    return expense as RecurringExpense;
  }

  static async updateRecurringExpense(
    id: string,
    userId: string,
    data: Partial<RecurringExpenseFormData>
  ): Promise<RecurringExpense> {
    const expense = await prisma.recurringExpense.update({
      where: { id, userId },
      data,
    });
    return expense as RecurringExpense;
  }

  static async deleteRecurringExpense(id: string, userId: string): Promise<void> {
    await prisma.recurringExpense.delete({
      where: { id, userId },
    });
  }

  // ==================== BUDGET SUMMARY ====================

  static async getBudgetSummary(userId: string): Promise<BudgetSummary> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [incomeSources, recurringExpenses, transactionsRaw] = await Promise.all([
      this.getIncomeSources(userId),
      this.getRecurringExpenses(userId),
      prisma.transaction.findMany({
        where: {
          userId,
          date: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        include: {
          category: true,
        },
      }),
    ]);

    // Tipar las transacciones correctamente
    // Prisma devuelve tags como string | null, pero en runtime es string[] | null
    const transactions: TransactionWithCategory[] = transactionsRaw as TransactionWithCategory[];

    // Calcular ingresos mensuales planeados
    const totalMonthlyIncome = incomeSources
      .filter((source: IncomeSource) => source.isActive)
      .reduce(
        (sum: number, source: IncomeSource) =>
          sum + this.convertToMonthly(source.amount, source.frequency),
        0
      );

    // Calcular gastos mensuales planeados
    const totalMonthlyExpenses = recurringExpenses
      .filter((expense: RecurringExpense) => expense.isActive)
      .reduce(
        (sum: number, expense: RecurringExpense) =>
          sum + this.convertToMonthly(expense.amount, expense.frequency),
        0
      );

    // Calcular gastos reales del mes
    const actualMonthlyExpenses = transactions
      .filter((t: TransactionWithCategory) => t.type === 'expense')
      .reduce((sum: number, t: TransactionWithCategory) => sum + t.amount, 0);

    const availableBalance = totalMonthlyIncome - totalMonthlyExpenses;
    const savingsRate = totalMonthlyIncome > 0 ? (availableBalance / totalMonthlyIncome) * 100 : 0;

    // Agrupar gastos planeados por categoría y asignar gastos reales
    const expensesByCategory = recurringExpenses
      .filter((expense: RecurringExpense) => expense.isActive)
      .reduce(
        (acc: BudgetSummary['expensesByCategory'], expense: RecurringExpense) => {
          const monthlyAmount = this.convertToMonthly(expense.amount, expense.frequency);
          const existing = acc.find(
            (item: BudgetSummary['expensesByCategory'][number]) =>
              item.category === expense.category
          );

          if (existing) {
            existing.amount += monthlyAmount;
          } else {
            acc.push({
              category: expense.category,
              categoryName: this.getCategoryLabel(expense.category),
              amount: monthlyAmount,
              actualAmount: 0,
              percentage: 0,
              isEssential: expense.isEssential,
            });
          }
          return acc;
        },
        [] as BudgetSummary['expensesByCategory']
      );

    // Asignar gastos reales por categoría
    transactions
      .filter((t: TransactionWithCategory) => t.type === 'expense')
      .forEach((t: TransactionWithCategory) => {
        const catName = t.category?.name || 'Otro';
        // Buscamos si hay un item de presupuesto que coincida con el nombre O con el mapeo interno
        const budgetKey = BudgetService.EXPENSE_CATEGORY_MAP[catName];

        const existing = expensesByCategory.find(
          (item: BudgetSummary['expensesByCategory'][number]) =>
            item.category === catName ||
            item.categoryName === catName ||
            (budgetKey && item.category === budgetKey)
        );

        if (existing) {
          existing.actualAmount += t.amount;
        } else {
          // Si no existe, usamos el nombre de la categoría directamente
          expensesByCategory.push({
            category: catName,
            categoryName: catName,
            amount: 0,
            actualAmount: t.amount,
            percentage: 0,
            isEssential: false,
          });
        }
      });

    // Calcular porcentajes
    expensesByCategory.forEach((category: BudgetSummary['expensesByCategory'][number]) => {
      category.percentage =
        totalMonthlyIncome > 0 ? (category.amount / totalMonthlyIncome) * 100 : 0;
    });

    // Agrupar ingresos planeados por categoría
    const incomeByCategory = incomeSources
      .filter((source: IncomeSource) => source.isActive)
      .reduce(
        (acc: BudgetSummary['incomeByCategory'], source: IncomeSource) => {
          const monthlyAmount = BudgetService.convertToMonthly(source.amount, source.frequency);
          const existing = acc.find(
            (item: BudgetSummary['incomeByCategory'][number]) => item.category === source.category
          );

          if (existing) {
            existing.amount += monthlyAmount;
          } else {
            acc.push({
              category: source.category,
              amount: monthlyAmount,
              actualAmount: 0,
              percentage: 0,
            });
          }
          return acc;
        },
        [] as BudgetSummary['incomeByCategory']
      );

    // Asignar ingresos reales
    transactions
      .filter((t: TransactionWithCategory) => t.type === 'income')
      .forEach((t: TransactionWithCategory) => {
        const catName = t.category?.name || 'Otro';
        const budgetKey = BudgetService.INCOME_CATEGORY_MAP[catName];

        const existing = incomeByCategory.find(
          (item: BudgetSummary['incomeByCategory'][number]) =>
            item.category === catName || (budgetKey && item.category === budgetKey)
        );

        if (existing) {
          existing.actualAmount += t.amount;
        } else {
          incomeByCategory.push({
            category: catName,
            amount: 0,
            actualAmount: t.amount,
            percentage: 0,
          });
        }
      });

    // Calcular porcentajes de ingresos
    incomeByCategory.forEach((category: BudgetSummary['incomeByCategory'][number]) => {
      category.percentage =
        totalMonthlyIncome > 0 ? (category.amount / totalMonthlyIncome) * 100 : 0;
    });

    return {
      totalMonthlyIncome,
      totalMonthlyExpenses,
      actualMonthlyExpenses,
      availableBalance,
      savingsRate,
      expensesByCategory: expensesByCategory.sort(
        (
          a: BudgetSummary['expensesByCategory'][number],
          b: BudgetSummary['expensesByCategory'][number]
        ) => b.amount - a.amount
      ),
      incomeByCategory: incomeByCategory.sort(
        (
          a: BudgetSummary['incomeByCategory'][number],
          b: BudgetSummary['incomeByCategory'][number]
        ) => b.amount - a.amount
      ),
    };
  }

  // Mapeo de categorías de transacciones (BD) a categorías de presupuesto (Types)
  private static readonly EXPENSE_CATEGORY_MAP: Record<string, string> = {
    Alimentación: 'groceries',
    Alimentos: 'groceries',
    Transporte: 'transportation',
    Vivienda: 'rent',
    Renta: 'rent',
    Hipoteca: 'rent',
    Entretenimiento: 'entertainment',
    Salud: 'health',
    Educación: 'education',
    Servicios: 'utilities',
    Luz: 'utilities',
    Agua: 'utilities',
    Suscripciones: 'subscriptions',
    Internet: 'subscriptions',
    Compras: 'other',
    Otro: 'other',
    Otros: 'other',
  };

  private static readonly INCOME_CATEGORY_MAP: Record<string, string> = {
    Salario: 'salary',
    Sueldo: 'salary',
    Freelance: 'freelance',
    Proyectos: 'freelance',
    Inversiones: 'investment',
    Investment: 'investment',
    Negocio: 'business',
    Business: 'business',
    Renta: 'rental',
    Alquiler: 'rental',
    Otro: 'other',
    Otros: 'other',
  };

  private static convertToMonthly(amount: number, frequency: string): number {
    switch (frequency) {
      case 'weekly':
        return amount * 4.33; // Promedio de semanas por mes
      case 'biweekly':
        return amount * 2.17; // Promedio de quincenas por mes
      case 'monthly':
        return amount;
      case 'annual':
        return amount / 12;
      default:
        return amount;
    }
  }

  private static getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      utilities: 'Servicios',
      internet: 'Internet/Telefonía',
      subscriptions: 'Suscripciones',
      transportation: 'Transporte',
      groceries: 'Alimentos',
      health: 'Salud/Seguros',
      rent: 'Renta/Hipoteca',
      education: 'Educación',
      entertainment: 'Entretenimiento',
      salary: 'Salario',
      freelance: 'Freelance',
      investment: 'Inversiones',
      business: 'Negocio',
      rental: 'Renta',
      other: 'Otros',
    };
    return labels[category] || category;
  }
}
