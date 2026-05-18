import { prisma } from '@/lib/db';
import type {
  Asset,
  Debt,
  DebtPayment,
  AssetFormData,
  DebtFormData,
  DebtPaymentFormData,
  FinancialDashboardKPIs,
} from '@/types/financial.types';
import { BudgetService } from './budget.service';
import { normalizeMoney, sumAsMoney, toCents, fromCents } from '@/lib/money';

export class FinancialService {
  // ==================== ASSETS ====================

  static async getAssets(userId: string): Promise<Asset[]> {
    const assets = await prisma.asset.findMany({
      where: { userId, isActive: true },
      orderBy: { value: 'desc' },
    });
    return assets as Asset[];
  }

  static async createAsset(userId: string, data: AssetFormData): Promise<Asset> {
    const asset = await prisma.asset.create({
      data: { userId, ...data, value: normalizeMoney(data.value) },
    });
    return asset as Asset;
  }

  static async updateAsset(
    id: string,
    userId: string,
    data: Partial<AssetFormData>
  ): Promise<Asset> {
    const asset = await prisma.asset.update({
      where: { id, userId },
      data: {
        ...data,
        ...(data.value !== undefined && { value: normalizeMoney(data.value) }),
      },
    });
    return asset as Asset;
  }

  static async deleteAsset(id: string, userId: string): Promise<void> {
    await prisma.asset.update({
      where: { id, userId },
      data: { isActive: false },
    });
  }

  // ==================== DEBTS ====================

  static async getDebts(userId: string, activeOnly: boolean = true): Promise<Debt[]> {
    const debts = await prisma.debt.findMany({
      where: {
        userId,
        ...(activeOnly ? { status: 'active' } : {}),
      },
      orderBy: { remainingAmount: 'desc' },
    });
    return debts as Debt[];
  }

  static async createDebt(userId: string, data: DebtFormData): Promise<Debt> {
    const debt = await prisma.debt.create({
      data: {
        userId,
        ...data,
        totalAmount: normalizeMoney(data.totalAmount),
        remainingAmount: normalizeMoney(data.remainingAmount),
        monthlyPayment: normalizeMoney(data.monthlyPayment),
        status: 'active',
      },
    });
    return debt as Debt;
  }

  static async updateDebt(id: string, userId: string, data: Partial<DebtFormData>): Promise<Debt> {
    const debt = await prisma.debt.update({
      where: { id, userId },
      data: {
        ...data,
        ...(data.totalAmount !== undefined && { totalAmount: normalizeMoney(data.totalAmount) }),
        ...(data.remainingAmount !== undefined && {
          remainingAmount: normalizeMoney(data.remainingAmount),
        }),
        ...(data.monthlyPayment !== undefined && {
          monthlyPayment: normalizeMoney(data.monthlyPayment),
        }),
      },
    });
    return debt as Debt;
  }

  static async markDebtAsPaid(id: string, userId: string): Promise<Debt> {
    const debt = await prisma.debt.update({
      where: { id, userId },
      data: {
        status: 'paid',
        paidDate: new Date(),
        remainingAmount: normalizeMoney(0),
      },
    });
    return debt as Debt;
  }

  static async deleteDebt(id: string, userId: string): Promise<void> {
    await prisma.debt.delete({
      where: { id, userId },
    });
  }

  // ==================== DEBT PAYMENTS (ABONOS) ====================

  /**
   * Calcula el interés sugerido para un abono: el interés del periodo se
   * estima aplicando la tasa mensual (tasa anual / 12) sobre el saldo actual.
   * Si la tasa es 0%, el interés sugerido es 0 y todo el abono baja el capital.
   */
  static suggestPaymentInterest(remainingAmount: number, annualRate: number): number {
    if (annualRate <= 0 || remainingAmount <= 0) return 0;
    const monthlyInterest = remainingAmount * (annualRate / 100 / 12);
    return normalizeMoney(monthlyInterest);
  }

  static async getDebtPayments(userId: string, debtId?: string): Promise<DebtPayment[]> {
    const payments = await prisma.debtPayment.findMany({
      where: { userId, ...(debtId ? { debtId } : {}) },
      orderBy: { date: 'desc' },
    });
    return payments as DebtPayment[];
  }

  /**
   * Registra un abono a una deuda. El abono puede separarse en capital e
   * interés: solo la parte de capital reduce el saldo restante de la deuda.
   * Si el interés es 0 (tasa 0%), todo el abono se aplica al capital.
   * Si el saldo llega a 0, la deuda se marca como pagada automáticamente.
   */
  static async addDebtPayment(
    userId: string,
    data: DebtPaymentFormData
  ): Promise<{ payment: DebtPayment; debt: Debt }> {
    return prisma.$transaction(async (tx) => {
      const debt = await tx.debt.findFirst({
        where: { id: data.debtId, userId },
      });
      if (!debt) {
        throw new Error('Deuda no encontrada');
      }

      const amount = normalizeMoney(data.amount);
      if (amount <= 0) {
        throw new Error('El monto del abono debe ser mayor a 0');
      }

      // El interés no puede ser negativo ni mayor que el abono total
      const interest = normalizeMoney(Math.min(Math.max(data.interest ?? 0, 0), amount));
      const principal = normalizeMoney(amount - interest);

      // Solo el capital reduce el saldo de la deuda
      const newRemaining = normalizeMoney(Math.max(0, debt.remainingAmount - principal));
      const isPaid = newRemaining <= 0;

      const updatedDebt = await tx.debt.update({
        where: { id: debt.id },
        data: {
          remainingAmount: newRemaining,
          ...(isPaid ? { status: 'paid', paidDate: new Date() } : {}),
        },
      });

      const payment = await tx.debtPayment.create({
        data: {
          userId,
          debtId: debt.id,
          transactionId: data.transactionId ?? null,
          amount,
          principal,
          interest,
          remainingAfter: newRemaining,
          date: data.date,
          note: data.note ?? null,
        },
      });

      return { payment: payment as DebtPayment, debt: updatedDebt as Debt };
    });
  }

  // ==================== FINANCIAL DASHBOARD KPIs ====================

  static async getFinancialKPIs(userId: string): Promise<FinancialDashboardKPIs> {
    const [budgetSummary, assets, activeDebts] = await Promise.all([
      BudgetService.getBudgetSummary(userId),
      this.getAssets(userId),
      this.getDebts(userId, true),
    ]);

    // Assets
    const liquidAssets = sumAsMoney(assets.filter((a) => a.type === 'liquid').map((a) => a.value));
    const illiquidAssets = sumAsMoney(
      assets.filter((a) => a.type === 'illiquid').map((a) => a.value)
    );
    const totalAssets = normalizeMoney(liquidAssets + illiquidAssets);

    // Debts
    const totalDebt = sumAsMoney(activeDebts.map((d) => d.remainingAmount));
    const monthlyDebts = sumAsMoney(activeDebts.map((d) => d.monthlyPayment));
    const consumptionDebtPayment = sumAsMoney(
      activeDebts.filter((d) => d.type === 'consumption').map((d) => d.monthlyPayment)
    );

    // Debts by type
    const debtsByType = activeDebts.reduce(
      (acc, debt) => {
        const existing = acc.find((item) => item.type === debt.type);
        if (existing) {
          existing.amount = fromCents(toCents(existing.amount) + toCents(debt.remainingAmount));
          existing.monthlyPayment = fromCents(
            toCents(existing.monthlyPayment) + toCents(debt.monthlyPayment)
          );
        } else {
          acc.push({
            type: this.getDebtTypeLabel(debt.type),
            amount: normalizeMoney(debt.remainingAmount),
            percentage: 0,
            monthlyPayment: normalizeMoney(debt.monthlyPayment),
          });
        }
        return acc;
      },
      [] as FinancialDashboardKPIs['debtsByType']
    );

    // Calculate percentages
    debtsByType.forEach((item) => {
      item.percentage = totalDebt > 0 ? (item.amount / totalDebt) * 100 : 0;
    });

    // Solvency ratio: cuántos meses puedes cubrir gastos con activos líquidos
    const totalMonthlyObligations = budgetSummary.totalMonthlyExpenses + monthlyDebts;
    const solvencyRatio = totalMonthlyObligations > 0 ? liquidAssets / totalMonthlyObligations : 0;

    return {
      monthlyIncome: budgetSummary.totalMonthlyIncome,
      monthlyDebts,
      monthlyExpenses: budgetSummary.totalMonthlyExpenses,
      totalDebt,
      consumptionDebtPayment,
      liquidAssets,
      illiquidAssets,
      totalAssets,
      liquidAssetsPercentage: totalAssets > 0 ? (liquidAssets / totalAssets) * 100 : 0,
      illiquidAssetsPercentage: totalAssets > 0 ? (illiquidAssets / totalAssets) * 100 : 0,
      solvencyRatio,
      debtsByType: debtsByType.sort((a, b) => b.amount - a.amount),
    };
  }

  private static getDebtTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      consumption: 'Consumo',
      housing: 'Vivienda',
      education: 'Educación',
      vehicle: 'Vehículo',
      other: 'Otros',
    };
    return labels[type] || type;
  }
}
