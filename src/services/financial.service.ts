import { prisma } from '@/lib/db';
import type {
  Asset,
  Debt,
  AssetFormData,
  DebtFormData,
  FinancialDashboardKPIs,
} from '@/types/financial.types';
import { BudgetService } from './budget.service';

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
      data: { userId, ...data },
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
      data,
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
        status: 'active',
      },
    });
    return debt as Debt;
  }

  static async updateDebt(id: string, userId: string, data: Partial<DebtFormData>): Promise<Debt> {
    const debt = await prisma.debt.update({
      where: { id, userId },
      data,
    });
    return debt as Debt;
  }

  static async markDebtAsPaid(id: string, userId: string): Promise<Debt> {
    const debt = await prisma.debt.update({
      where: { id, userId },
      data: {
        status: 'paid',
        paidDate: new Date(),
        remainingAmount: 0,
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
    const liquidAssets = assets
      .filter((a) => a.type === 'liquid')
      .reduce((sum, a) => sum + a.value, 0);
    const illiquidAssets = assets
      .filter((a) => a.type === 'illiquid')
      .reduce((sum, a) => sum + a.value, 0);
    const totalAssets = liquidAssets + illiquidAssets;

    // Debts
    const totalDebt = activeDebts.reduce((sum, d) => sum + d.remainingAmount, 0);
    const monthlyDebts = activeDebts.reduce((sum, d) => sum + d.monthlyPayment, 0);
    const consumptionDebtPayment = activeDebts
      .filter((d) => d.type === 'consumption')
      .reduce((sum, d) => sum + d.monthlyPayment, 0);

    // Debts by type
    const debtsByType = activeDebts.reduce(
      (acc, debt) => {
        const existing = acc.find((item) => item.type === debt.type);
        if (existing) {
          existing.amount += debt.remainingAmount;
          existing.monthlyPayment += debt.monthlyPayment;
        } else {
          acc.push({
            type: this.getDebtTypeLabel(debt.type),
            amount: debt.remainingAmount,
            percentage: 0,
            monthlyPayment: debt.monthlyPayment,
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
