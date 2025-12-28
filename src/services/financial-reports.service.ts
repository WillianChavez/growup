import { prisma } from '@/lib/db';
import type {
  IncomeStatement,
  BalanceSheet,
  CashFlowStatement,
  DateRange,
  CategoryBreakdown,
  AssetBreakdown,
  DebtBreakdown,
  CashFlowItem,
  PeriodComparisonMetrics,
  FinancialSnapshot,
} from '@/types/financial-reports.types';
import type { Transaction, TransactionCategory } from '@/types/finance.types';

// Tipo auxiliar para transacciones con categoría
type TransactionWithCategory = Omit<
  Transaction,
  'type' | 'category' | 'recurringFrequency' | 'tags'
> & {
  type: string;
  category: TransactionCategory | null;
  recurringFrequency: string | null;
  tags: string | null;
};

export class FinancialReportsService {
  // ==================== INCOME STATEMENT (Estado de Resultados) ====================

  static async getIncomeStatement(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<IncomeStatement> {
    const transactionsRaw = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        category: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    const transactions: TransactionWithCategory[] = transactionsRaw as TransactionWithCategory[];

    // Agrupar ingresos por categoría
    const revenueByCategory = new Map<string, CategoryBreakdown>();
    const expensesByCategory = new Map<string, CategoryBreakdown>();

    transactions.forEach((transaction) => {
      const isIncome = transaction.type === 'income';
      const map = isIncome ? revenueByCategory : expensesByCategory;

      const categoryId = transaction.categoryId;
      const categoryName = transaction.category?.name || 'Sin categoría';
      const emoji = transaction.category?.emoji || '💰';

      if (!map.has(categoryId)) {
        map.set(categoryId, {
          categoryId,
          categoryName,
          emoji,
          amount: 0,
          percentage: 0,
          transactionCount: 0,
          transactions: [],
        });
      }

      const breakdown = map.get(categoryId)!;
      breakdown.amount += transaction.amount;
      breakdown.transactionCount += 1;
      breakdown.transactions?.push(transaction as unknown as Transaction);
    });

    // Calcular totales
    const totalRevenue = Array.from(revenueByCategory.values()).reduce(
      (sum, cat) => sum + cat.amount,
      0
    );
    const totalExpenses = Array.from(expensesByCategory.values()).reduce(
      (sum, cat) => sum + cat.amount,
      0
    );

    // Calcular porcentajes
    revenueByCategory.forEach((cat) => {
      cat.percentage = totalRevenue > 0 ? (cat.amount / totalRevenue) * 100 : 0;
    });
    expensesByCategory.forEach((cat) => {
      cat.percentage = totalExpenses > 0 ? (cat.amount / totalExpenses) * 100 : 0;
    });

    const netIncome = totalRevenue - totalExpenses;
    const netIncomeMargin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;

    return {
      period: { startDate, endDate },
      revenue: {
        categories: Array.from(revenueByCategory.values()).sort((a, b) => b.amount - a.amount),
        total: totalRevenue,
      },
      expenses: {
        categories: Array.from(expensesByCategory.values()).sort((a, b) => b.amount - a.amount),
        total: totalExpenses,
      },
      netIncome,
      netIncomeMargin,
    };
  }

  // ==================== BALANCE SHEET (Balance General) ====================

  static async getBalanceSheet(userId: string, date: Date): Promise<BalanceSheet> {
    // Intentar obtener snapshot existente
    const snapshot = await prisma.financialSnapshot.findUnique({
      where: {
        userId_date: {
          userId,
          date,
        },
      },
    });

    if (snapshot) {
      return this.convertSnapshotToBalanceSheet(snapshot, date);
    }

    // Si no hay snapshot, calcular en tiempo real
    return this.calculateBalanceSheet(userId, date);
  }

  private static async calculateBalanceSheet(userId: string, date: Date): Promise<BalanceSheet> {
    // Obtener activos activos hasta la fecha
    const assets = await prisma.asset.findMany({
      where: {
        userId,
        isActive: true,
        createdAt: {
          lte: date,
        },
      },
    });

    // Obtener deudas activas hasta la fecha
    const debts = await prisma.debt.findMany({
      where: {
        userId,
        status: 'active',
        startDate: {
          lte: date,
        },
      },
    });

    // Clasificar activos
    const liquidAssets: AssetBreakdown[] = [];
    const illiquidAssets: AssetBreakdown[] = [];
    let totalLiquidAssets = 0;
    let totalIlliquidAssets = 0;

    assets.forEach((asset) => {
      const breakdown: AssetBreakdown = {
        id: asset.id,
        name: asset.name,
        category: asset.category,
        amount: asset.value,
        percentage: 0,
      };

      if (asset.type === 'liquid') {
        liquidAssets.push(breakdown);
        totalLiquidAssets += asset.value;
      } else {
        illiquidAssets.push(breakdown);
        totalIlliquidAssets += asset.value;
      }
    });

    const totalAssets = totalLiquidAssets + totalIlliquidAssets;

    // Calcular porcentajes de activos
    liquidAssets.forEach((asset) => {
      asset.percentage = totalAssets > 0 ? (asset.amount / totalAssets) * 100 : 0;
    });
    illiquidAssets.forEach((asset) => {
      asset.percentage = totalAssets > 0 ? (asset.amount / totalAssets) * 100 : 0;
    });

    // Clasificar deudas (corto y largo plazo)
    const currentLiabilities: DebtBreakdown[] = [];
    const longTermLiabilities: DebtBreakdown[] = [];
    let totalCurrentLiabilities = 0;
    let totalLongTermLiabilities = 0;

    const now = new Date();
    const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

    debts.forEach((debt) => {
      const breakdown: DebtBreakdown = {
        id: debt.id,
        creditor: debt.creditor,
        type: debt.type,
        amount: debt.remainingAmount,
        monthlyPayment: debt.monthlyPayment,
        percentage: 0,
      };

      const isShortTerm = debt.endDate && debt.endDate <= oneYearFromNow;

      if (isShortTerm) {
        currentLiabilities.push(breakdown);
        totalCurrentLiabilities += debt.remainingAmount;
      } else {
        longTermLiabilities.push(breakdown);
        totalLongTermLiabilities += debt.remainingAmount;
      }
    });

    const totalLiabilities = totalCurrentLiabilities + totalLongTermLiabilities;

    // Calcular porcentajes de pasivos
    currentLiabilities.forEach((debt) => {
      debt.percentage = totalLiabilities > 0 ? (debt.amount / totalLiabilities) * 100 : 0;
    });
    longTermLiabilities.forEach((debt) => {
      debt.percentage = totalLiabilities > 0 ? (debt.amount / totalLiabilities) * 100 : 0;
    });

    const equity = totalAssets - totalLiabilities;

    // Calcular ratios financieros
    const debtToAssets = totalAssets > 0 ? totalLiabilities / totalAssets : 0;
    const currentRatio =
      totalCurrentLiabilities > 0 ? totalLiquidAssets / totalCurrentLiabilities : 0;

    // Calcular meses de solvencia (liquidez)
    const monthlyExpenses = await this.getAverageMonthlyExpenses(userId);
    const liquidityMonths = monthlyExpenses > 0 ? totalLiquidAssets / monthlyExpenses : 0;

    return {
      date,
      assets: {
        liquid: liquidAssets.sort((a, b) => b.amount - a.amount),
        illiquid: illiquidAssets.sort((a, b) => b.amount - a.amount),
        total: totalAssets,
      },
      liabilities: {
        current: currentLiabilities.sort((a, b) => b.amount - a.amount),
        longTerm: longTermLiabilities.sort((a, b) => b.amount - a.amount),
        total: totalLiabilities,
      },
      equity,
      netWorth: equity,
      ratios: {
        debtToAssets,
        currentRatio,
        liquidityMonths,
      },
    };
  }

  private static convertSnapshotToBalanceSheet(
    snapshot: FinancialSnapshot,
    date: Date
  ): BalanceSheet {
    // Para simplificar, devolvemos valores agregados del snapshot
    // En una implementación completa, se reconstruiría el detalle completo
    return {
      date,
      assets: {
        liquid: [],
        illiquid: [],
        total: snapshot.totalAssets,
      },
      liabilities: {
        current: [],
        longTerm: [],
        total: snapshot.totalLiabilities,
      },
      equity: snapshot.equity,
      netWorth: snapshot.netWorth,
      ratios: {
        debtToAssets:
          snapshot.totalAssets > 0 ? snapshot.totalLiabilities / snapshot.totalAssets : 0,
        currentRatio:
          snapshot.shortTermLiabilities > 0
            ? snapshot.liquidAssets / snapshot.shortTermLiabilities
            : 0,
        liquidityMonths: 0, // Calcular si se necesita
      },
    };
  }

  // ==================== CASH FLOW (Flujo de Efectivo) ====================

  static async getCashFlowStatement(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CashFlowStatement> {
    // 1. Flujo de operaciones (transacciones normales)
    const operations = await this.getOperatingCashFlow(userId, startDate, endDate);

    // 2. Flujo de inversión (cambios en activos)
    const investing = await this.getInvestingCashFlow(userId, startDate, endDate);

    // 3. Flujo de financiamiento (cambios en deudas)
    const financing = await this.getFinancingCashFlow(userId, startDate, endDate);

    // 4. Calcular efectivo inicial y final
    const startingCash = await this.getCashBalance(userId, startDate);
    const netCashFlow = operations.net + investing.net + financing.net;
    const endingCash = startingCash + netCashFlow;

    return {
      period: { startDate, endDate },
      operations,
      investing,
      financing,
      netCashFlow,
      startingCash,
      endingCash,
    };
  }

  private static async getOperatingCashFlow(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CashFlowStatement['operations']> {
    const transactionsRaw = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        // Solo flujo operativo (no inversiones ni financiamiento)
        OR: [{ flowType: null }, { flowType: 'operating' }],
      },
      include: {
        category: true,
      },
    });

    const transactions: TransactionWithCategory[] = transactionsRaw as TransactionWithCategory[];

    const categoryMap = new Map<string, CategoryBreakdown>();
    let totalInflows = 0;
    let totalOutflows = 0;

    transactions.forEach((transaction) => {
      const isIncome = transaction.type === 'income';
      const categoryId = transaction.categoryId;
      const categoryName = transaction.category?.name || 'Sin categoría';
      const emoji = transaction.category?.emoji || '💰';

      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          categoryId,
          categoryName,
          emoji,
          amount: 0,
          percentage: 0,
          transactionCount: 0,
          transactions: [],
        });
      }

      const breakdown = categoryMap.get(categoryId)!;

      if (isIncome) {
        totalInflows += transaction.amount;
        breakdown.amount += transaction.amount;
      } else {
        totalOutflows += transaction.amount;
        breakdown.amount += transaction.amount;
      }

      breakdown.transactionCount += 1;
      breakdown.transactions?.push(transaction as unknown as Transaction);
    });

    // Calcular porcentajes
    const total = totalInflows + totalOutflows;
    categoryMap.forEach((cat) => {
      cat.percentage = total > 0 ? (cat.amount / total) * 100 : 0;
    });

    return {
      inflows: totalInflows,
      outflows: totalOutflows,
      net: totalInflows - totalOutflows,
      details: Array.from(categoryMap.values()).sort((a, b) => b.amount - a.amount),
    };
  }

  private static async getInvestingCashFlow(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CashFlowStatement['investing']> {
    // Activos comprados en el período
    const purchasedAssets = await prisma.asset.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Activos vendidos/eliminados en el período (inferir por updatedAt si isActive=false)
    const soldAssets = await prisma.asset.findMany({
      where: {
        userId,
        isActive: false,
        updatedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const purchases = purchasedAssets.reduce((sum, asset) => sum + asset.value, 0);
    const sales = soldAssets.reduce((sum, asset) => sum + asset.value, 0);

    const details: CashFlowItem[] = [
      ...purchasedAssets.map((asset) => ({
        description: `Compra: ${asset.name}`,
        amount: -asset.value,
        category: asset.category,
      })),
      ...soldAssets.map((asset) => ({
        description: `Venta: ${asset.name}`,
        amount: asset.value,
        category: asset.category,
      })),
    ];

    return {
      purchases,
      sales,
      net: sales - purchases,
      details,
    };
  }

  private static async getFinancingCashFlow(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CashFlowStatement['financing']> {
    // Deudas iniciadas en el período
    const newDebts = await prisma.debt.findMany({
      where: {
        userId,
        startDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Deudas pagadas en el período
    const paidDebts = await prisma.debt.findMany({
      where: {
        userId,
        status: 'paid',
        paidDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const borrowing = newDebts.reduce((sum, debt) => sum + debt.totalAmount, 0);
    const repayment = paidDebts.reduce((sum, debt) => sum + debt.totalAmount, 0);

    const details: CashFlowItem[] = [
      ...newDebts.map((debt) => ({
        description: `Préstamo: ${debt.creditor}`,
        amount: debt.totalAmount,
      })),
      ...paidDebts.map((debt) => ({
        description: `Pago: ${debt.creditor}`,
        amount: -debt.totalAmount,
      })),
    ];

    return {
      borrowing,
      repayment,
      net: borrowing - repayment,
      details,
    };
  }

  // ==================== UTILITIES ====================

  private static async getCashBalance(userId: string, date: Date): Promise<number> {
    // Calcular balance de efectivo hasta una fecha
    const accounts = await prisma.account.findMany({
      where: {
        userId,
        isActive: true,
        createdAt: {
          lte: date,
        },
      },
    });

    return accounts.reduce((sum, account) => sum + account.currentBalance, 0);
  }

  private static async getAverageMonthlyExpenses(userId: string): Promise<number> {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const expenses = await prisma.transaction.findMany({
      where: {
        userId,
        type: 'expense',
        date: {
          gte: threeMonthsAgo,
        },
      },
    });

    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    return totalExpenses / 3;
  }

  // ==================== COMPARISONS ====================

  static async getIncomeStatementComparison(
    userId: string,
    currentPeriod: DateRange,
    previousPeriod: DateRange
  ): Promise<PeriodComparisonMetrics> {
    const [current, previous] = await Promise.all([
      this.getIncomeStatement(userId, currentPeriod.startDate, currentPeriod.endDate),
      this.getIncomeStatement(userId, previousPeriod.startDate, previousPeriod.endDate),
    ]);

    return {
      netIncome: {
        current: current.netIncome,
        previous: previous.netIncome,
        change: current.netIncome - previous.netIncome,
        changePercent:
          previous.netIncome !== 0
            ? ((current.netIncome - previous.netIncome) / Math.abs(previous.netIncome)) * 100
            : 0,
      },
      totalAssets: { current: 0, previous: 0, change: 0, changePercent: 0 },
      totalLiabilities: { current: 0, previous: 0, change: 0, changePercent: 0 },
      netWorth: { current: 0, previous: 0, change: 0, changePercent: 0 },
      cashFlow: { current: 0, previous: 0, change: 0, changePercent: 0 },
    };
  }

  // ==================== SNAPSHOTS (v2) ====================

  static async createFinancialSnapshot(userId: string, date: Date): Promise<FinancialSnapshot> {
    const balanceSheet = await this.calculateBalanceSheet(userId, date);
    const cashBalance = await this.getCashBalance(userId, date);

    const snapshot = await prisma.financialSnapshot.create({
      data: {
        userId,
        date,
        totalAssets: balanceSheet.assets.total,
        liquidAssets: balanceSheet.assets.liquid.reduce((sum, a) => sum + a.amount, 0),
        illiquidAssets: balanceSheet.assets.illiquid.reduce((sum, a) => sum + a.amount, 0),
        totalLiabilities: balanceSheet.liabilities.total,
        shortTermLiabilities: balanceSheet.liabilities.current.reduce(
          (sum, d) => sum + d.amount,
          0
        ),
        longTermLiabilities: balanceSheet.liabilities.longTerm.reduce(
          (sum, d) => sum + d.amount,
          0
        ),
        equity: balanceSheet.equity,
        cashBalance,
        netWorth: balanceSheet.netWorth,
      },
    });

    return snapshot as FinancialSnapshot;
  }
}
