import { tables } from '@/lib/supabase';
import { 
  Transaction, 
  CreateTransactionInput, 
  UpdateTransactionInput,
  Budget, 
  CreateBudgetInput,
  FinancialGoal, 
  CreateGoalInput,
  FinanceOverview,
  CategorySpendSummary 
} from '@/types';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export const FINANCE_CATEGORIES = [
  'Software & Subscriptions',
  'Food & Dining',
  'Studio & Workspace',
  'Health & Fitness',
  'Travel & Commute',
  'Personal & Lifestyle',
  'Learning & Books',
  'Client Work & Business',
  'Investments & Savings',
  'Utilities & Bills',
  'Miscellaneous',
] as const;

export const PAYMENT_METHODS = [
  'Card',
  'UPI',
  'Bank Transfer',
  'Cash',
  'Crypto',
] as const;

function mapTransactionFromDb(row: any): Transaction {
  return {
    id: row.id,
    amount: Number(row.amount) || 0,
    type: row.type,
    category: row.category || 'Miscellaneous',
    description: row.description || '',
    date: row.date ? new Date(row.date).toISOString() : new Date().toISOString(),
    paymentMethod: row.payment_method || 'Card',
    isRecurring: Boolean(row.is_recurring),
    tags: row.tags || undefined,
    notes: row.notes || undefined,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
  };
}

function mapBudgetFromDb(row: any): Budget {
  return {
    id: row.id,
    category: row.category,
    monthlyLimit: Number(row.monthly_limit) || 0,
    currency: row.currency || 'INR',
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
  };
}

function mapGoalFromDb(row: any): FinancialGoal {
  return {
    id: row.id,
    title: row.title,
    targetAmount: Number(row.target_amount) || 0,
    currentAmount: Number(row.current_amount) || 0,
    targetDate: row.target_date ? new Date(row.target_date).toISOString() : undefined,
    category: row.category || 'savings',
    status: row.status || 'in_progress',
    notes: row.notes || undefined,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
  };
}



// ========================
// TRANSACTIONS
// ========================

export async function getAllTransactions(filters?: {
  type?: string;
  category?: string;
  month?: string; // YYYY-MM
  search?: string;
  limit?: number;
}): Promise<Transaction[]> {
  try {
    let query = tables.transactions().select('*');

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.search) {
      query = query.or(`description.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
    }
    if (filters?.month) {
      const [year, month] = filters.month.split('-').map(Number);
      const start = new Date(year, month - 1, 1).toISOString();
      const end = new Date(year, month, 0, 23, 59, 59, 999).toISOString();
      query = query.gte('date', start).lte('date', end);
    }

    const limit = filters?.limit || 100;
    query = query.order('date', { ascending: false }).limit(limit);

    const { data, error } = await query;
    if (error || !data) {
      console.error('Error fetching transactions:', error);
      return [];
    }

    return data.map(mapTransactionFromDb);
  } catch (err) {
    console.error('Unexpected error in getAllTransactions:', err);
    return [];
  }
}

export async function getTransactionById(id: string): Promise<Transaction | null> {
  try {
    const { data, error } = await tables.transactions().select('*').eq('id', id).maybeSingle();
    if (error || !data) return null;
    return mapTransactionFromDb(data);
  } catch (err) {
    console.error('Error in getTransactionById:', err);
    return null;
  }
}

export async function createTransaction(data: CreateTransactionInput): Promise<Transaction | null> {
  try {
    const id = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const row = {
      id,
      amount: data.amount,
      type: data.type,
      category: data.category || 'Miscellaneous',
      description: data.description || '',
      date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
      payment_method: data.paymentMethod || 'Card',
      is_recurring: Boolean(data.isRecurring),
      tags: data.tags || null,
      notes: data.notes || null,
    };

    const { data: created, error } = await tables.transactions().insert(row).select().single();
    if (error || !created) {
      console.error('Error creating transaction:', error);
      return null;
    }

    return mapTransactionFromDb(created);
  } catch (err) {
    console.error('Unexpected error in createTransaction:', err);
    return null;
  }
}

export async function updateTransaction(id: string, data: UpdateTransactionInput): Promise<Transaction | null> {
  try {
    const updates: any = {
      updated_at: new Date().toISOString(),
    };
    if (data.amount !== undefined) updates.amount = data.amount;
    if (data.type !== undefined) updates.type = data.type;
    if (data.category !== undefined) updates.category = data.category;
    if (data.description !== undefined) updates.description = data.description;
    if (data.date !== undefined) updates.date = new Date(data.date).toISOString();
    if (data.paymentMethod !== undefined) updates.payment_method = data.paymentMethod;
    if (data.isRecurring !== undefined) updates.is_recurring = data.isRecurring;
    if (data.tags !== undefined) updates.tags = data.tags;
    if (data.notes !== undefined) updates.notes = data.notes;

    const { data: updated, error } = await tables.transactions()
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error || !updated) {
      console.error('Error updating transaction:', error);
      return null;
    }

    return mapTransactionFromDb(updated);
  } catch (err) {
    console.error('Unexpected error in updateTransaction:', err);
    return null;
  }
}

export async function deleteTransaction(id: string): Promise<boolean> {
  try {
    const { error } = await tables.transactions().delete().eq('id', id);
    if (error) {
      console.error('Error deleting transaction:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Unexpected error in deleteTransaction:', err);
    return false;
  }
}

// ========================
// BUDGETS
// ========================

export async function getAllBudgets(): Promise<Budget[]> {
  try {
    const { data, error } = await tables.budgets().select('*').order('category', { ascending: true });
    if (error || !data) {
      console.error('Error fetching budgets:', error);
      return [];
    }
    return data.map(mapBudgetFromDb);
  } catch (err) {
    console.error('Unexpected error in getAllBudgets:', err);
    return [];
  }
}

export async function upsertBudget(data: CreateBudgetInput): Promise<Budget | null> {
  try {
    const id = `bgt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const row = {
      id,
      category: data.category,
      monthly_limit: data.monthlyLimit,
      currency: data.currency || 'INR',
      updated_at: new Date().toISOString(),
    };

    const { data: saved, error } = await tables.budgets()
      .upsert(row, { onConflict: 'category' })
      .select()
      .single();

    if (error || !saved) {
      console.error('Error upserting budget:', error);
      return null;
    }

    return mapBudgetFromDb(saved);
  } catch (err) {
    console.error('Unexpected error in upsertBudget:', err);
    return null;
  }
}

export async function deleteBudget(id: string): Promise<boolean> {
  try {
    const { error } = await tables.budgets().delete().eq('id', id);
    if (error) {
      console.error('Error deleting budget:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Unexpected error in deleteBudget:', err);
    return false;
  }
}

// ========================
// FINANCIAL GOALS
// ========================

export async function getAllGoals(): Promise<FinancialGoal[]> {
  try {
    const { data, error } = await tables.goals().select('*').order('created_at', { ascending: false });
    if (error || !data) {
      console.error('Error fetching financial goals:', error);
      return [];
    }
    return data.map(mapGoalFromDb);
  } catch (err) {
    console.error('Unexpected error in getAllGoals:', err);
    return [];
  }
}

export async function createGoal(data: CreateGoalInput): Promise<FinancialGoal | null> {
  try {
    const id = `goal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const row = {
      id,
      title: data.title,
      target_amount: data.targetAmount,
      current_amount: data.currentAmount || 0,
      target_date: data.targetDate ? new Date(data.targetDate).toISOString() : null,
      category: data.category || 'savings',
      status: data.status || 'in_progress',
      notes: data.notes || null,
    };

    const { data: created, error } = await tables.goals().insert(row).select().single();
    if (error || !created) {
      console.error('Error creating goal:', error);
      return null;
    }

    return mapGoalFromDb(created);
  } catch (err) {
    console.error('Unexpected error in createGoal:', err);
    return null;
  }
}

export async function updateGoal(id: string, data: Partial<CreateGoalInput>): Promise<FinancialGoal | null> {
  try {
    const updates: any = {
      updated_at: new Date().toISOString(),
    };
    if (data.title !== undefined) updates.title = data.title;
    if (data.targetAmount !== undefined) updates.target_amount = data.targetAmount;
    if (data.currentAmount !== undefined) updates.current_amount = data.currentAmount;
    if (data.targetDate !== undefined) updates.target_date = data.targetDate ? new Date(data.targetDate).toISOString() : null;
    if (data.category !== undefined) updates.category = data.category;
    if (data.status !== undefined) updates.status = data.status;
    if (data.notes !== undefined) updates.notes = data.notes;

    const { data: updated, error } = await tables.goals()
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error || !updated) {
      console.error('Error updating goal:', error);
      return null;
    }

    return mapGoalFromDb(updated);
  } catch (err) {
    console.error('Unexpected error in updateGoal:', err);
    return null;
  }
}

export async function deleteGoal(id: string): Promise<boolean> {
  try {
    const { error } = await tables.goals().delete().eq('id', id);
    if (error) {
      console.error('Error deleting goal:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Unexpected error in deleteGoal:', err);
    return false;
  }
}

// ========================
// FINANCE OVERVIEW & ANALYTICS
// ========================

export async function getFinanceOverview(targetDate: Date = new Date()): Promise<FinanceOverview> {
  try {
    const monthStart = startOfMonth(targetDate).toISOString();
    const monthEnd = endOfMonth(targetDate).toISOString();
    const monthStr = format(targetDate, 'MMMM yyyy');

    // Fetch this month's transactions, all budgets, all goals
    const [monthTxsRes, budgets, goals] = await Promise.all([
      tables.transactions()
        .select('*')
        .gte('date', monthStart)
        .lte('date', monthEnd)
        .order('date', { ascending: false }),
      getAllBudgets(),
      getAllGoals(),
    ]);

    const txs: Transaction[] = (monthTxsRes.data || []).map(mapTransactionFromDb);

    let totalIncome = 0;
    let totalExpenses = 0;
    const categorySpendMap: Record<string, number> = {};

    for (const t of txs) {
      if (t.type === 'income') {
        totalIncome += t.amount;
      } else {
        totalExpenses += t.amount;
        categorySpendMap[t.category] = (categorySpendMap[t.category] || 0) + t.amount;
      }
    }

    const netBalance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0;

    // Build category summaries (combining budgets and categories that had transactions)
    const allCategoryNames = Array.from(
      new Set([...budgets.map((b) => b.category), ...Object.keys(categorySpendMap)])
    );

    const categories: CategorySpendSummary[] = allCategoryNames.map((cat) => {
      const spent = categorySpendMap[cat] || 0;
      const budgetObj = budgets.find((b) => b.category === cat);
      const budgetLimit = budgetObj?.monthlyLimit || 0;
      const percentage = budgetLimit > 0 ? Math.round((spent / budgetLimit) * 100) : 0;
      const remaining = budgetLimit > 0 ? budgetLimit - spent : 0;

      return {
        category: cat,
        spent,
        budget: budgetLimit,
        percentage,
        remaining,
        isOverBudget: budgetLimit > 0 && spent > budgetLimit,
      };
    }).sort((a, b) => b.spent - a.spent);

    const totalBudget = budgets.reduce((acc, b) => acc + b.monthlyLimit, 0);
    const totalBudgetSpent = categories.reduce((acc, c) => acc + (c.budget > 0 ? c.spent : 0), 0);

    // Generate grounded, contextual insights
    const insights: string[] = [];

    if (totalIncome > 0 && savingsRate >= 20) {
      insights.push(`Strong savings rate of ${savingsRate}% this month. Net cash flow stands at ₹${netBalance.toLocaleString('en-IN')}.`);
    } else if (totalIncome > 0 && savingsRate < 0) {
      insights.push(`Outflow exceeds monthly inflow by ₹${Math.abs(netBalance).toLocaleString('en-IN')}. Prioritize pausing discretionary expenses.`);
    }

    const overBudgetCats = categories.filter((c) => c.isOverBudget);
    if (overBudgetCats.length > 0) {
      const names = overBudgetCats.map((c) => c.category).join(', ');
      insights.push(`Over budget in ${names}. Consider reallocating limits or trimming variable costs.`);
    }

    const nearLimitCats = categories.filter((c) => !c.isOverBudget && c.budget > 0 && c.percentage >= 80);
    if (nearLimitCats.length > 0) {
      insights.push(`${nearLimitCats[0].category} is at ${nearLimitCats[0].percentage}% of limit (₹${nearLimitCats[0].remaining.toLocaleString('en-IN')} remaining).`);
    }

    const activeGoal = goals.find((g) => g.status === 'in_progress');
    if (activeGoal) {
      const goalPct = activeGoal.targetAmount > 0 ? Math.round((activeGoal.currentAmount / activeGoal.targetAmount) * 100) : 0;
      insights.push(`${activeGoal.title} is ${goalPct}% complete (₹${(activeGoal.targetAmount - activeGoal.currentAmount).toLocaleString('en-IN')} remaining).`);
    }

    if (insights.length === 0) {
      insights.push(`Financial ledger active for ${monthStr}. Log expenses or client invoices to track cashflow.`);
    }

    return {
      month: monthStr,
      totalIncome,
      totalExpenses,
      netBalance,
      savingsRate,
      totalBudget,
      totalBudgetSpent,
      categories,
      recentTransactions: txs.slice(0, 15),
      goals,
      insights,
    };
  } catch (err) {
    console.error('Unexpected error in getFinanceOverview:', err);
    return {
      month: format(targetDate, 'MMMM yyyy'),
      totalIncome: 0,
      totalExpenses: 0,
      netBalance: 0,
      savingsRate: 0,
      totalBudget: 0,
      totalBudgetSpent: 0,
      categories: [],
      recentTransactions: [],
      goals: [],
      insights: ['Ready to record your first transaction.'],
    };
  }
}
