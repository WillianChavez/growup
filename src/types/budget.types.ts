export interface IncomeSource {
  id: string;
  userId: string;
  name: string;
  amount: number;
  frequency: IncomeFrequency;
  category: IncomeCategory;
  isPrimary: boolean;
  description: string | null;
  isActive: boolean;
  startDate: Date;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecurringExpense {
  id: string;
  userId: string;
  name: string;
  amount: number;
  frequency: ExpenseFrequency;
  category: ExpenseCategory;
  dueDay: number | null;
  description: string | null;
  isActive: boolean;
  isEssential: boolean;
  startDate: Date;
  endDate: Date | null;
  lastPaid: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type IncomeFrequency = 'monthly' | 'biweekly' | 'weekly' | 'annual';
export type ExpenseFrequency = 'monthly' | 'biweekly' | 'weekly' | 'annual';
export type IncomeCategory =
  | 'salary'
  | 'freelance'
  | 'business'
  | 'investment'
  | 'rental'
  | 'other'
  | (string & {});
export type ExpenseCategory =
  | 'utilities'
  | 'internet'
  | 'subscriptions'
  | 'transportation'
  | 'groceries'
  | 'health'
  | 'rent'
  | 'education'
  | 'entertainment'
  | 'other'
  | (string & {});

export interface IncomeSourceFormData {
  name: string;
  amount: number;
  frequency: IncomeFrequency;
  category: IncomeCategory;
  isPrimary?: boolean;
  description?: string;
  isActive?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface RecurringExpenseFormData {
  name: string;
  amount: number;
  frequency: ExpenseFrequency;
  category: ExpenseCategory;
  dueDay?: number;
  description?: string;
  isActive?: boolean;
  isEssential?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface BudgetSummary {
  totalMonthlyIncome: number;
  totalMonthlyExpenses: number;
  actualMonthlyExpenses: number; // Added for comparison
  availableBalance: number;
  savingsRate: number; // Porcentaje
  expensesByCategory: {
    category: string;
    categoryName: string;
    amount: number;
    actualAmount: number; // Added for comparison
    percentage: number;
    isEssential: boolean;
  }[];
  incomeByCategory: {
    category: string;
    amount: number;
    actualAmount: number; // Added for comparison
    percentage: number;
  }[];
}
