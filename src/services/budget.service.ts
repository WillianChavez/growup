import { prisma } from '@/lib/db';
import type {
  IncomeSource,
  RecurringExpense,
  IncomeSourceFormData,
  RecurringExpenseFormData,
  BudgetSummary,
} from '@/types/budget.types';
import type { TransactionCategory } from '@/types/finance.types';
import { normalizeMoney, sumAsMoney, toCents, fromCents } from '@/lib/money';

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
        amount: normalizeMoney(data.amount),
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
      data: {
        ...data,
        ...(data.amount !== undefined && { amount: normalizeMoney(data.amount) }),
      },
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
        amount: normalizeMoney(data.amount),
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
      data: {
        ...data,
        ...(data.amount !== undefined && { amount: normalizeMoney(data.amount) }),
      },
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
    const monthEndExclusive = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [incomeSources, recurringExpenses, transactionsRaw, transactionCategories] =
      await Promise.all([
        this.getIncomeSources(userId),
        this.getRecurringExpenses(userId),
        prisma.transaction.findMany({
          where: {
            userId,
            OR: [{ flowType: null }, { flowType: 'operating' }],
            date: {
              gte: monthStart,
              lt: monthEndExclusive,
            },
          },
          include: {
            category: true,
          },
        }),
        prisma.transactionCategory.findMany({ where: { userId } }),
      ]);

    // Tipar las transacciones correctamente
    const transactions: TransactionWithCategory[] = transactionsRaw as TransactionWithCategory[];
    const categoryEmojiByName = new Map(
      transactionCategories.map((category) => [category.name, category.emoji])
    );

    // Calcular ingresos mensuales planeados
    const totalMonthlyIncome = sumAsMoney(
      incomeSources
        .filter((source: IncomeSource) => source.isActive)
        .map((source: IncomeSource) => this.convertToMonthly(source.amount, source.frequency))
    );

    // Calcular gastos mensuales planeados
    const totalMonthlyExpenses = sumAsMoney(
      recurringExpenses
        .filter((expense: RecurringExpense) => expense.isActive)
        .map((expense: RecurringExpense) =>
          this.convertToMonthly(expense.amount, expense.frequency)
        )
    );

    // Calcular gastos reales del mes
    const actualMonthlyExpenses = sumAsMoney(
      transactions
        .filter((t: TransactionWithCategory) => t.type === 'expense')
        .map((t: TransactionWithCategory) => t.amount)
    );

    const availableBalance = normalizeMoney(totalMonthlyIncome - totalMonthlyExpenses);
    const savingsRate = totalMonthlyIncome > 0 ? (availableBalance / totalMonthlyIncome) * 100 : 0;

    // Agrupar gastos planeados por categoría y asignar gastos reales
    const expensesByCategory = recurringExpenses
      .filter((expense: RecurringExpense) => expense.isActive)
      .reduce(
        (acc: BudgetSummary['expensesByCategory'], expense: RecurringExpense) => {
          const monthlyAmount = this.convertToMonthly(expense.amount, expense.frequency);
          const categoryName = this.normalizeExpenseCategory(expense.category);
          const existing = acc.find(
            (item: BudgetSummary['expensesByCategory'][number]) => item.category === categoryName
          );

          if (existing) {
            existing.amount = fromCents(toCents(existing.amount) + toCents(monthlyAmount));
          } else {
            acc.push({
              category: categoryName,
              categoryName,
              emoji: categoryEmojiByName.get(categoryName) || '💸',
              amount: monthlyAmount,
              actualAmount: 0,
              remainingAmount: monthlyAmount,
              usagePercentage: 0,
              isBudgeted: true,
              isOverBudget: false,
              isUnbudgeted: false,
              percentage: 0,
              isEssential: expense.isEssential,
            });
          }
          return acc;
        },
        [] as BudgetSummary['expensesByCategory']
      );

    // Incluir también las categorías de gasto que todavía no tienen presupuesto ni movimientos.
    // Así el dashboard puede señalar cuáles siguen sin contemplarse, en lugar de ocultarlas.
    transactionCategories
      .filter((category) => category.type === 'expense' || category.type === 'both')
      .forEach((transactionCategory) => {
        if (expensesByCategory.some((category) => category.category === transactionCategory.name)) {
          return;
        }

        expensesByCategory.push({
          category: transactionCategory.name,
          categoryName: transactionCategory.name,
          emoji: transactionCategory.emoji || '💸',
          amount: 0,
          actualAmount: 0,
          remainingAmount: 0,
          usagePercentage: 0,
          isBudgeted: false,
          isOverBudget: false,
          isUnbudgeted: false,
          percentage: 0,
          isEssential: false,
        });
      });

    // Asignar gastos reales por categoría
    transactions
      .filter((t: TransactionWithCategory) => t.type === 'expense')
      .forEach((t: TransactionWithCategory) => {
        const catName = t.category?.name || 'Otro';
        const existing = expensesByCategory.find(
          (item: BudgetSummary['expensesByCategory'][number]) => item.category === catName
        );

        if (existing) {
          existing.actualAmount = fromCents(toCents(existing.actualAmount) + toCents(t.amount));
        } else {
          // Si no existe, usamos el nombre de la categoría directamente
          expensesByCategory.push({
            category: catName,
            categoryName: catName,
            emoji: t.category?.emoji || '💸',
            amount: 0,
            actualAmount: normalizeMoney(t.amount),
            remainingAmount: normalizeMoney(-t.amount),
            usagePercentage: 0,
            isBudgeted: false,
            isOverBudget: false,
            isUnbudgeted: true,
            percentage: 0,
            isEssential: false,
          });
        }
      });

    // Calcular porcentajes
    expensesByCategory.forEach((category: BudgetSummary['expensesByCategory'][number]) => {
      category.percentage =
        totalMonthlyIncome > 0 ? (category.amount / totalMonthlyIncome) * 100 : 0;
      category.remainingAmount = normalizeMoney(category.amount - category.actualAmount);
      category.usagePercentage =
        category.amount > 0 ? (category.actualAmount / category.amount) * 100 : 0;
      category.isBudgeted = category.amount > 0;
      category.isOverBudget = category.amount > 0 && category.actualAmount > category.amount;
      category.isUnbudgeted = category.amount === 0 && category.actualAmount > 0;
    });

    const totalUnbudgetedExpenses = sumAsMoney(
      expensesByCategory
        .filter((category) => category.isUnbudgeted)
        .map((category) => category.actualAmount)
    );
    const remainingMonthlyBudget = normalizeMoney(totalMonthlyExpenses - actualMonthlyExpenses);
    const budgetUsagePercentage =
      totalMonthlyExpenses > 0 ? (actualMonthlyExpenses / totalMonthlyExpenses) * 100 : 0;

    // Agrupar ingresos planeados por categoría
    const incomeByCategory = incomeSources
      .filter((source: IncomeSource) => source.isActive)
      .reduce(
        (acc: BudgetSummary['incomeByCategory'], source: IncomeSource) => {
          const monthlyAmount = BudgetService.convertToMonthly(source.amount, source.frequency);
          const categoryName = BudgetService.normalizeIncomeCategory(source.category);
          const existing = acc.find(
            (item: BudgetSummary['incomeByCategory'][number]) => item.category === categoryName
          );

          if (existing) {
            existing.amount = fromCents(toCents(existing.amount) + toCents(monthlyAmount));
          } else {
            acc.push({
              category: categoryName,
              amount: normalizeMoney(monthlyAmount),
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
        const existing = incomeByCategory.find(
          (item: BudgetSummary['incomeByCategory'][number]) => item.category === catName
        );

        if (existing) {
          existing.actualAmount = fromCents(toCents(existing.actualAmount) + toCents(t.amount));
        } else {
          incomeByCategory.push({
            category: catName,
            amount: 0,
            actualAmount: normalizeMoney(t.amount),
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
      remainingMonthlyBudget,
      budgetUsagePercentage,
      totalUnbudgetedExpenses,
      unbudgetedCategoryCount: expensesByCategory.filter((category) => category.isUnbudgeted)
        .length,
      overBudgetCategoryCount: expensesByCategory.filter((category) => category.isOverBudget)
        .length,
      availableBalance,
      savingsRate,
      expensesByCategory: expensesByCategory.sort((a, b) => {
        if (a.isUnbudgeted !== b.isUnbudgeted) return a.isUnbudgeted ? -1 : 1;
        if (a.isOverBudget !== b.isOverBudget) return a.isOverBudget ? -1 : 1;
        return b.actualAmount - a.actualAmount || b.amount - a.amount;
      }),
      incomeByCategory: incomeByCategory.sort(
        (
          a: BudgetSummary['incomeByCategory'][number],
          b: BudgetSummary['incomeByCategory'][number]
        ) => b.amount - a.amount
      ),
    };
  }

  private static normalizeExpenseCategory(category: string): string {
    const legacyCategories: Record<string, string> = {
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
    return legacyCategories[category] || category;
  }

  private static normalizeIncomeCategory(category: string): string {
    const legacyCategories: Record<string, string> = {
      salary: 'Salario',
      freelance: 'Freelance',
      business: 'Negocio',
      investment: 'Inversiones',
      rental: 'Alquiler',
      other: 'Otro Ingreso',
    };
    return legacyCategories[category] || category;
  }

  private static convertToMonthly(amount: number, frequency: string): number {
    const normalizedAmount = normalizeMoney(amount);

    switch (frequency) {
      case 'weekly':
        return normalizeMoney(normalizedAmount * 4.33); // Promedio de semanas por mes
      case 'biweekly':
        return normalizeMoney(normalizedAmount * 2.17); // Promedio de quincenas por mes
      case 'monthly':
        return normalizedAmount;
      case 'annual':
        return normalizeMoney(normalizedAmount / 12);
      default:
        return normalizedAmount;
    }
  }
}
