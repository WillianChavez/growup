import { prisma } from '@/lib/db';
import type {
  IncomeSource,
  RecurringExpense,
  IncomeSourceFormData,
  RecurringExpenseFormData,
  BudgetSummary,
} from '@/types/budget.types';

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
    const [incomeSources, recurringExpenses] = await Promise.all([
      this.getIncomeSources(userId),
      this.getRecurringExpenses(userId),
    ]);

    // Calcular ingresos mensuales
    const totalMonthlyIncome = incomeSources
      .filter((source) => source.isActive)
      .reduce((sum, source) => sum + this.convertToMonthly(source.amount, source.frequency), 0);

    // Calcular gastos mensuales
    const totalMonthlyExpenses = recurringExpenses
      .filter((expense) => expense.isActive)
      .reduce((sum, expense) => sum + this.convertToMonthly(expense.amount, expense.frequency), 0);

    const availableBalance = totalMonthlyIncome - totalMonthlyExpenses;
    const savingsRate = totalMonthlyIncome > 0 ? (availableBalance / totalMonthlyIncome) * 100 : 0;

    // Agrupar gastos por categoría
    const expensesByCategory = recurringExpenses
      .filter((expense) => expense.isActive)
      .reduce(
        (acc, expense) => {
          const monthlyAmount = this.convertToMonthly(expense.amount, expense.frequency);
          const existing = acc.find((item) => item.category === expense.category);

          if (existing) {
            existing.amount += monthlyAmount;
          } else {
            acc.push({
              category: expense.category,
              categoryName: this.getCategoryLabel(expense.category),
              amount: monthlyAmount,
              percentage: 0,
              isEssential: expense.isEssential,
            });
          }
          return acc;
        },
        [] as BudgetSummary['expensesByCategory']
      );

    // Calcular porcentajes
    expensesByCategory.forEach((category) => {
      category.percentage =
        totalMonthlyIncome > 0 ? (category.amount / totalMonthlyIncome) * 100 : 0;
    });

    // Agrupar ingresos por categoría
    const incomeByCategory = incomeSources
      .filter((source) => source.isActive)
      .reduce(
        (acc, source) => {
          const monthlyAmount = this.convertToMonthly(source.amount, source.frequency);
          const existing = acc.find((item) => item.category === source.category);

          if (existing) {
            existing.amount += monthlyAmount;
          } else {
            acc.push({
              category: source.category,
              amount: monthlyAmount,
              percentage: 0,
            });
          }
          return acc;
        },
        [] as BudgetSummary['incomeByCategory']
      );

    // Calcular porcentajes de ingresos
    incomeByCategory.forEach((category) => {
      category.percentage =
        totalMonthlyIncome > 0 ? (category.amount / totalMonthlyIncome) * 100 : 0;
    });

    return {
      totalMonthlyIncome,
      totalMonthlyExpenses,
      availableBalance,
      savingsRate,
      expensesByCategory: expensesByCategory.sort((a, b) => b.amount - a.amount),
      incomeByCategory: incomeByCategory.sort((a, b) => b.amount - a.amount),
    };
  }

  // Convertir cualquier frecuencia a monto mensual
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
      other: 'Otros',
    };
    return labels[category] || category;
  }
}
