export type TaskDomain = 'work' | 'health' | 'chores' | 'personal' | 'learning';
export type TaskPriority = 'urgent-important' | 'important' | 'urgent' | 'low';
export type TaskStatus = 'backlog' | 'planned' | 'in_progress' | 'blocked' | 'done' | 'archived';
export type EnergyLevel = 'high' | 'medium' | 'low';
export type TimeBlockType = 'task' | 'break' | 'meal' | 'exercise' | 'free' | 'routine';

export interface CreateTaskInput {
  title: string;
  description?: string;
  domain: TaskDomain;
  priority: TaskPriority;
  status?: TaskStatus;
  estimatedMin?: number;
  energyLevel?: EnergyLevel;
  deadline?: Date;
  scheduledDate?: Date;
  scheduledTime?: string;
  parentId?: string;
  tags?: string;
  notes?: string;
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  actualMin?: number;
  sortOrder?: number;
}

export interface TimeBlockData {
  startTime: string;
  endTime: string;
  label: string;
  type: TimeBlockType;
  taskId?: string;
  domain?: TaskDomain;
  isFixed?: boolean;
}

export interface DailySchedule {
  date: Date;
  blocks: TimeBlockData[];
}

// Cal.com Integration Types
export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  source: 'calcom' | 'iris';
  type: 'booking' | 'task';
  location?: string;
  description?: string;
  attendees?: { name: string; email: string }[];
  domain?: string;
}

// Personal Finance Types
export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  date: string;
  paymentMethod?: string;
  isRecurring?: boolean;
  tags?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateTransactionInput {
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  date?: string;
  paymentMethod?: string;
  isRecurring?: boolean;
  tags?: string;
  notes?: string;
}

export interface UpdateTransactionInput extends Partial<CreateTransactionInput> {}

export interface Budget {
  id: string;
  category: string;
  monthlyLimit: number;
  currency?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateBudgetInput {
  category: string;
  monthlyLimit: number;
  currency?: string;
}

export interface FinancialGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  category?: string;
  status?: 'in_progress' | 'achieved' | 'paused';
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateGoalInput {
  title: string;
  targetAmount: number;
  currentAmount?: number;
  targetDate?: string;
  category?: string;
  status?: 'in_progress' | 'achieved' | 'paused';
  notes?: string;
}

export interface CategorySpendSummary {
  category: string;
  spent: number;
  budget: number;
  percentage: number;
  remaining: number;
  isOverBudget: boolean;
}

export interface FinanceOverview {
  month: string;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  savingsRate: number;
  totalBudget: number;
  totalBudgetSpent: number;
  categories: CategorySpendSummary[];
  recentTransactions: Transaction[];
  goals: FinancialGoal[];
  insights: string[];
}

