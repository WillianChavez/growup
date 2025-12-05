export interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  category: GoalCategory;
  priority: GoalPriority;
  status: GoalStatus;
  targetDate: Date | null;
  progress: number;
  milestones: Milestone[] | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}

export type GoalCategory =
  | 'personal'
  | 'professional'
  | 'health'
  | 'financial'
  | 'relationships'
  | 'learning'
  | 'creative'
  | 'other';

export type GoalPriority = 'low' | 'medium' | 'high';

export type GoalStatus = 'not-started' | 'in-progress' | 'completed' | 'abandoned';

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: Date;
}

export interface GoalFormData {
  title: string;
  description?: string;
  category: GoalCategory;
  priority: GoalPriority;
  status?: GoalStatus;
  targetDate?: Date;
  progress?: number;
  milestones?: Omit<Milestone, 'id'>[];
}

export interface GoalStats {
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  completionRate: number;
  completedThisYear: number;
  completedThisMonth: number;
  byCategory: { category: GoalCategory; count: number }[];
}
