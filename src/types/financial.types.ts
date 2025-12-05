// Assets
export interface Asset {
  id: string;
  userId: string;
  name: string;
  value: number;
  type: AssetType;
  category: AssetCategory;
  description: string | null;
  isActive: boolean;
  purchaseDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type AssetType = 'liquid' | 'illiquid';
export type AssetCategory = 'cash' | 'investment' | 'property' | 'vehicle' | 'other';

export interface AssetFormData {
  name: string;
  value: number;
  type: AssetType;
  category: AssetCategory;
  description?: string;
  purchaseDate?: Date;
}

// Debts
export interface Debt {
  id: string;
  userId: string;
  creditor: string;
  totalAmount: number;
  remainingAmount: number;
  monthlyPayment: number;
  annualRate: number;
  type: DebtType;
  description: string | null;
  status: DebtStatus;
  startDate: Date;
  endDate: Date | null;
  paidDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type DebtType = 'consumption' | 'housing' | 'education' | 'vehicle' | 'other';
export type DebtStatus = 'active' | 'paid';

export interface DebtFormData {
  creditor: string;
  totalAmount: number;
  remainingAmount: number;
  monthlyPayment: number;
  annualRate: number;
  type: DebtType;
  description?: string;
  startDate: Date;
  endDate?: Date;
}

// Financial Dashboard KPIs
export interface FinancialDashboardKPIs {
  monthlyIncome: number;
  monthlyDebts: number;
  monthlyExpenses: number;
  totalDebt: number;
  consumptionDebtPayment: number;
  liquidAssets: number;
  illiquidAssets: number;
  totalAssets: number;
  liquidAssetsPercentage: number;
  illiquidAssetsPercentage: number;
  solvencyRatio: number; // Cuántos meses puedes cubrir gastos con activos líquidos
  debtsByType: {
    type: string;
    amount: number;
    percentage: number;
    monthlyPayment: number;
  }[];
}
