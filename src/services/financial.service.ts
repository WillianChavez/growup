import { prisma } from '@/lib/db';
import type {
  Asset,
  Debt,
  AssetFormData,
  DebtFormData,
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
