import type { Transaction } from './finance.types';

// ==================== BASE TYPES ====================

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  emoji: string;
  amount: number;
  percentage: number;
  transactionCount: number;
  transactions?: Transaction[]; // Para drill-down
}

export interface AssetBreakdown {
  id: string;
  name: string;
  category: string;
  amount: number;
  percentage: number;
}

export interface DebtBreakdown {
  id: string;
  creditor: string;
  type: string;
  amount: number;
  monthlyPayment: number;
  percentage: number;
}

// ==================== INCOME STATEMENT (Estado de Resultados) ====================

export interface IncomeStatement {
  period: DateRange;
  revenue: {
    categories: CategoryBreakdown[];
    total: number;
  };
  expenses: {
    categories: CategoryBreakdown[];
    total: number;
  };
  netIncome: number;
  netIncomeMargin: number; // Porcentaje
}

// ==================== BALANCE SHEET (Balance General) ====================

export interface BalanceSheet {
  date: Date;
  assets: {
    liquid: AssetBreakdown[];
    illiquid: AssetBreakdown[];
    total: number;
  };
  liabilities: {
    current: DebtBreakdown[]; // Deudas a corto plazo
    longTerm: DebtBreakdown[]; // Deudas a largo plazo
    total: number;
  };
  equity: number; // Patrimonio = Activos - Pasivos
  netWorth: number; // Same as equity
  // Ratios financieros
  ratios: {
    debtToAssets: number; // Pasivos / Activos
    currentRatio: number; // Activos líquidos / Pasivos corrientes
    liquidityMonths: number; // Meses de solvencia con activos líquidos
  };
}

// ==================== CASH FLOW (Flujo de Efectivo) ====================

export interface CashFlowItem {
  description: string;
  amount: number;
  category?: string;
}

export interface CashFlowStatement {
  period: DateRange;
  operations: {
    inflows: number;
    outflows: number;
    net: number;
    details: CategoryBreakdown[];
  };
  investing: {
    purchases: number; // Compra de activos
    sales: number; // Venta de activos
    net: number;
    details: CashFlowItem[];
  };
  financing: {
    borrowing: number; // Nuevos préstamos
    repayment: number; // Pagos de deudas
    net: number;
    details: CashFlowItem[];
  };
  netCashFlow: number;
  startingCash: number;
  endingCash: number;
}

// ==================== COMPARISONS (Comparaciones entre períodos) ====================

export interface FinancialComparison<T> {
  current: T;
  previous: T;
  variance: {
    absolute: Partial<Record<keyof T, number>>;
    percentage: Partial<Record<keyof T, number>>;
  };
}

export interface PeriodComparisonMetrics {
  netIncome: {
    current: number;
    previous: number;
    change: number;
    changePercent: number;
  };
  totalAssets: {
    current: number;
    previous: number;
    change: number;
    changePercent: number;
  };
  totalLiabilities: {
    current: number;
    previous: number;
    change: number;
    changePercent: number;
  };
  netWorth: {
    current: number;
    previous: number;
    change: number;
    changePercent: number;
  };
  cashFlow: {
    current: number;
    previous: number;
    change: number;
    changePercent: number;
  };
}

// ==================== ACCOUNT TYPES (v2) ====================

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  currency: string;
  initialBalance: number;
  currentBalance: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type AccountType = 'checking' | 'savings' | 'cash' | 'credit_card';

export interface AccountFormData {
  name: string;
  type: AccountType;
  currency?: string;
  initialBalance?: number;
  isActive?: boolean;
}

export interface FinancialSnapshot {
  id: string;
  userId: string;
  date: Date;
  totalAssets: number;
  liquidAssets: number;
  illiquidAssets: number;
  totalLiabilities: number;
  shortTermLiabilities: number;
  longTermLiabilities: number;
  equity: number;
  cashBalance: number;
  netWorth: number;
  createdAt: Date;
}

// ==================== PERIOD SELECTOR ====================

export type PeriodPreset = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

export interface PeriodSelection {
  preset: PeriodPreset;
  customRange?: DateRange;
}
