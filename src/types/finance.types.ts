export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  description: string;
  notes: string | null;
  date: Date;
  isRecurring: boolean;
  recurringFrequency: RecurringFrequency | null;
  tags: string[] | null;
  createdAt: Date;
  updatedAt: Date;
  category?: TransactionCategory;
}

export interface TransactionCategory {
  id: string;
  userId: string;
  name: string;
  emoji: string;
  type: string; // income, expense, both
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Budget {
  id: string;
  userId: string;
  category: string;
  amount: number;
  period: BudgetPeriod;
  alertThreshold: number;
  createdAt: Date;
  updatedAt: Date;
}

export type TransactionType = 'income' | 'expense';

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export type BudgetPeriod = 'monthly' | 'yearly';

export interface TransactionFormData {
  amount: number;
  type: TransactionType;
  categoryId: string;
  description: string;
  notes?: string;
  date: Date;
  isRecurring?: boolean;
  recurringFrequency?: RecurringFrequency;
  tags?: string[];
}

export interface TransactionCategoryFormData {
  name: string;
  emoji: string;
  type: string; // income, expense, both
}

export interface BudgetFormData {
  category: string;
  amount: number;
  period: BudgetPeriod;
  alertThreshold?: number;
}

export interface CategoryTotal {
  categoryId: string;
  categoryName: string;
  emoji: string;
  total: number;
  percentage: number;
  transactions: number;
}

export interface FinanceStats {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  thisMonth: {
    income: number;
    expenses: number;
    balance: number;
  };
  topCategories: CategoryTotal[];
  recentTransactions: Transaction[];
  budgetStatus: {
    category: string;
    budget: number;
    spent: number;
    remaining: number;
    percentage: number;
    isOverBudget: boolean;
  }[];
}

export interface MonthlyTransactionGroup {
  month: string;
  year: number;
  transactions: Transaction[];
  totalIncome: number;
  totalExpenses: number;
  balance: number;
}
