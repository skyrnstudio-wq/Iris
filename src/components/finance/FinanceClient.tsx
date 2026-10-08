"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  SlidersHorizontal, 
  Sparkles, 
  Trash2, 
  Search, 
  Check, 
  Target, 
  CreditCard,
  Building2,
  Calendar,
  AlertCircle,
  Loader2,
  TrendingUp,
  RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { 
  FinanceOverview, 
  Transaction, 
  Budget, 
  FinancialGoal, 
  TransactionType 
} from "@/types";
import { FINANCE_CATEGORIES, PAYMENT_METHODS } from "@/services/financeService";
import { format } from "date-fns";

export function FinanceClient() {
  const [overview, setOverview] = useState<FinanceOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search states for Ledger
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog States
  const [isTxOpen, setIsTxOpen] = useState(false);
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  const [isGoalOpen, setIsGoalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Transaction Form State
  const [txType, setTxType] = useState<TransactionType>('expense');
  const [txAmount, setTxAmount] = useState("");
  const [txCategory, setTxCategory] = useState<string>(FINANCE_CATEGORIES[0]);
  const [txDescription, setTxDescription] = useState("");
  const [txPaymentMethod, setTxPaymentMethod] = useState<string>('Card');
  const [txDate, setTxDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [txNotes, setTxNotes] = useState("");

  // Budget Form State
  const [budgetsList, setBudgetsList] = useState<Budget[]>([]);
  const [newBudgetCategory, setNewBudgetCategory] = useState<string>(FINANCE_CATEGORIES[0]);
  const [newBudgetLimit, setNewBudgetLimit] = useState("");

  // Goal Form State
  const [goalTitle, setGoalTitle] = useState("");
  const [goalTargetAmount, setGoalTargetAmount] = useState("");
  const [goalCurrentAmount, setGoalCurrentAmount] = useState("");
  const [goalTargetDate, setGoalTargetDate] = useState("");
  const [goalNotes, setGoalNotes] = useState("");

  // Fetch overview data
  const fetchOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/finance/overview");
      if (!res.ok) throw new Error("Failed to load financial data");
      const data: FinanceOverview = await res.json();
      setOverview(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load financial overview");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  // Fetch budgets when opening budget dialog
  const handleOpenBudgetDialog = async () => {
    setIsBudgetOpen(true);
    try {
      const res = await fetch("/api/finance/budgets");
      if (res.ok) {
        const data = await res.json();
        setBudgetsList(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Submit New Transaction
  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(txAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert("Please provide a valid amount");
      return;
    }
    if (!txDescription.trim()) {
      alert("Please provide a description");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/finance/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountNum,
          type: txType,
          category: txCategory,
          description: txDescription.trim(),
          paymentMethod: txPaymentMethod,
          date: txDate,
          notes: txNotes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to record transaction");
      }

      setIsTxOpen(false);
      // Reset form
      setTxAmount("");
      setTxDescription("");
      setTxNotes("");
      await fetchOverview();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Transaction
  const handleDeleteTransaction = async (id: string) => {
    if (!confirm("Delete this transaction?")) return;
    try {
      const res = await fetch(`/api/finance/transactions/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchOverview();
      } else {
        alert("Failed to delete transaction");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting transaction");
    }
  };

  // Save/Update Budget
  const handleSaveBudget = async (category: string, monthlyLimit: number) => {
    try {
      const res = await fetch("/api/finance/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, monthlyLimit }),
      });
      if (res.ok) {
        const updated = await res.json();
        setBudgetsList((prev) => {
          const filtered = prev.filter((b) => b.category !== category);
          return [...filtered, updated];
        });
        await fetchOverview();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Add New Category Budget
  const handleAddNewBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const limitNum = parseFloat(newBudgetLimit);
    if (isNaN(limitNum) || limitNum < 0) {
      alert("Please enter a valid monthly limit");
      return;
    }
    await handleSaveBudget(newBudgetCategory, limitNum);
    setNewBudgetLimit("");
  };

  // Delete Budget
  const handleDeleteBudget = async (id: string) => {
    try {
      const res = await fetch(`/api/finance/budgets?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setBudgetsList((prev) => prev.filter((b) => b.id !== id));
        await fetchOverview();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Create Goal
  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetNum = parseFloat(goalTargetAmount);
    if (!goalTitle.trim() || isNaN(targetNum) || targetNum <= 0) {
      alert("Please specify a goal title and target amount");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/finance/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: goalTitle.trim(),
          targetAmount: targetNum,
          currentAmount: parseFloat(goalCurrentAmount) || 0,
          targetDate: goalTargetDate || undefined,
          notes: goalNotes.trim() || undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to create goal");

      setIsGoalOpen(false);
      setGoalTitle("");
      setGoalTargetAmount("");
      setGoalCurrentAmount("");
      setGoalTargetDate("");
      setGoalNotes("");
      await fetchOverview();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Goal Increment
  const handleIncrementGoal = async (goal: FinancialGoal) => {
    const input = prompt(`Add saved funds to "${goal.title}" (in ₹):`, "10000");
    if (!input) return;
    const addAmount = parseFloat(input);
    if (isNaN(addAmount) || addAmount <= 0) return;

    try {
      const newTotal = goal.currentAmount + addAmount;
      const res = await fetch("/api/finance/goals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: goal.id,
          currentAmount: newTotal,
        }),
      });
      if (res.ok) {
        await fetchOverview();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filtered transactions for the ledger
  const filteredTransactions = useMemo(() => {
    if (!overview?.recentTransactions) return [];
    return overview.recentTransactions.filter((tx) => {
      if (filterType !== 'all' && tx.type !== filterType) return false;
      if (filterCategory !== 'all' && tx.category !== filterCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchDesc = tx.description.toLowerCase().includes(q);
        const matchCat = tx.category.toLowerCase().includes(q);
        const matchNotes = tx.notes ? tx.notes.toLowerCase().includes(q) : false;
        if (!matchDesc && !matchCat && !matchNotes) return false;
      }
      return true;
    });
  }, [overview?.recentTransactions, filterType, filterCategory, searchQuery]);

  if (loading && !overview) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-stone-500">
        <Loader2 className="w-5 h-5 animate-spin text-stone-800" />
        <span className="text-xs font-medium tracking-tight">Syncing financial ledger...</span>
      </div>
    );
  }

  const {
    totalIncome = 0,
    totalExpenses = 0,
    netBalance = 0,
    savingsRate = 0,
    categories = [],
    goals = [],
    insights = [],
    month = "October 2026",
  } = overview || {};

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-stone-900">
              Personal & Studio Finance
            </h1>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200">
              {month}
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Grounded cashflow tracking, category budgets, and liquidity runways.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={() => setIsTxOpen(true)}
            size="sm"
            className="h-8.5 px-3.5 bg-stone-900 hover:bg-stone-800 text-white rounded-md text-xs font-medium shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Record Transaction
          </Button>

          <Button
            onClick={handleOpenBudgetDialog}
            variant="outline"
            size="sm"
            className="h-8.5 px-3 bg-white hover:bg-stone-50 text-stone-700 border-stone-200 rounded-md text-xs font-medium"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5 text-stone-500" />
            Manage Budgets
          </Button>

          <Button
            onClick={() => setIsGoalOpen(true)}
            variant="outline"
            size="sm"
            className="h-8.5 px-3 bg-white hover:bg-stone-50 text-stone-700 border-stone-200 rounded-md text-xs font-medium"
          >
            <Target className="w-3.5 h-3.5 mr-1.5 text-stone-500" />
            New Goal
          </Button>
        </div>
      </div>

      {/* 4 Executive Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Net Cash Flow */}
        <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium">
            <span>Net Cashflow</span>
            <div className={`p-1 rounded-md ${netBalance >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-700'}`}>
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className={`text-xl sm:text-2xl font-bold tracking-tight tabular-nums ${
              netBalance >= 0 ? 'text-emerald-700' : 'text-stone-900'
            }`}>
              {netBalance >= 0 ? '+' : ''}₹{netBalance.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-stone-400 mt-0.5">
              {netBalance >= 0 ? 'Net surplus for the month' : 'Net outflow for the month'}
            </p>
          </div>
        </div>

        {/* Monthly Inflow */}
        <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium">
            <span>Monthly Inflow</span>
            <div className="p-1 rounded-md bg-emerald-50 text-emerald-700">
              <ArrowDownRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold tracking-tight tabular-nums text-stone-900">
              ₹{totalIncome.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Total client invoices & income
            </p>
          </div>
        </div>

        {/* Monthly Outflow */}
        <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium">
            <span>Monthly Outflow</span>
            <div className="p-1 rounded-md bg-stone-100 text-stone-700">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold tracking-tight tabular-nums text-stone-900">
              ₹{totalExpenses.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Operating & living expenses
            </p>
          </div>
        </div>

        {/* Savings Rate */}
        <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium">
            <span>Capital Retained</span>
            <div className="p-1 rounded-md bg-stone-100 text-stone-700">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold tracking-tight tabular-nums text-stone-900">
              {savingsRate}%
            </div>
            <div className="w-full bg-stone-100 h-1.5 rounded-md overflow-hidden mt-2">
              <div 
                className="bg-emerald-600 h-full rounded-md transition-all duration-300"
                style={{ width: `${Math.max(0, Math.min(100, savingsRate))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* AI Financial Intelligence Card */}
      <div className="bg-white rounded-xl border border-stone-200/80 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-stone-900 text-white shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-stone-900 tracking-tight">
                IRIS Financial Intelligence
              </h2>
              <span className="text-[10px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-md">
                Active Context
              </span>
            </div>
            <div className="text-xs text-stone-600 space-y-0.5">
              {insights.map((insight, idx) => (
                <p key={idx} className="leading-relaxed">
                  • {insight}
                </p>
              ))}
            </div>
          </div>
        </div>

        <Link
          href="/assistant"
          className="inline-flex items-center justify-center shrink-0 text-xs font-medium text-stone-700 hover:text-stone-900 bg-stone-50 hover:bg-stone-100 border border-stone-200/80 px-3 py-1.5 rounded-md transition-colors"
        >
          Ask IRIS to optimize cashflow →
        </Link>
      </div>

      {/* Main Content Layout: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Budgets & Goals (1/3) */}
        <div className="space-y-6">
          {/* Category Budgets */}
          <div className="bg-white rounded-xl border border-stone-200/80 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold tracking-tight text-stone-900">
                  Monthly Budgets
                </h3>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Category caps for {month}
                </p>
              </div>
              <button
                onClick={handleOpenBudgetDialog}
                className="text-xs font-medium text-stone-600 hover:text-stone-900"
              >
                Edit
              </button>
            </div>

            <div className="space-y-3.5">
              {categories.filter((c) => c.budget > 0).length === 0 ? (
                <div className="py-6 text-center text-xs text-stone-400 border border-dashed border-stone-200 rounded-lg">
                  No monthly budgets configured.
                  <div className="mt-2">
                    <Button
                      onClick={handleOpenBudgetDialog}
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs rounded-md"
                    >
                      Set Category Limits
                    </Button>
                  </div>
                </div>
              ) : (
                categories
                  .filter((c) => c.budget > 0)
                  .map((c) => {
                    const isOver = c.isOverBudget;
                    const isNear = !isOver && c.percentage >= 80;

                    return (
                      <div key={c.category} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-stone-800 truncate pr-2">
                            {c.category}
                          </span>
                          <div className="text-right tabular-nums text-[11px] shrink-0 font-medium">
                            <span className={isOver ? 'text-rose-700 font-semibold' : 'text-stone-900'}>
                              ₹{c.spent.toLocaleString('en-IN')}
                            </span>
                            <span className="text-stone-400"> / ₹{c.budget.toLocaleString('en-IN')}</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-stone-100 h-1.5 rounded-md overflow-hidden">
                          <div
                            className={`h-full rounded-md transition-all duration-300 ${
                              isOver
                                ? 'bg-rose-600'
                                : isNear
                                ? 'bg-amber-500'
                                : 'bg-stone-800'
                            }`}
                            style={{ width: `${Math.min(100, c.percentage)}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-stone-400">
                          <span>{c.percentage}% utilized</span>
                          <span>
                            {isOver ? (
                              <span className="text-rose-600 font-medium">Over by ₹{Math.abs(c.remaining).toLocaleString('en-IN')}</span>
                            ) : (
                              <span>₹{c.remaining.toLocaleString('en-IN')} left</span>
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          {/* Financial Goals & Reserves */}
          <div className="bg-white rounded-xl border border-stone-200/80 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold tracking-tight text-stone-900">
                  Goals & Reserves
                </h3>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Operating runway & targets
                </p>
              </div>
              <button
                onClick={() => setIsGoalOpen(true)}
                className="text-xs font-medium text-stone-600 hover:text-stone-900"
              >
                + Add
              </button>
            </div>

            <div className="space-y-3">
              {goals.length === 0 ? (
                <div className="py-6 text-center text-xs text-stone-400 border border-dashed border-stone-200 rounded-lg">
                  No liquidity goals set.
                </div>
              ) : (
                goals.map((g) => {
                  const pct = g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0;
                  return (
                    <div
                      key={g.id}
                      className="p-3 rounded-lg border border-stone-200/80 bg-stone-50/50 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-semibold text-stone-900 leading-snug">
                            {g.title}
                          </h4>
                          {g.notes && (
                            <p className="text-[10px] text-stone-400 mt-0.5">{g.notes}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleIncrementGoal(g)}
                          title="Add saved amount"
                          className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 transition-colors shrink-0"
                        >
                          + Add Funds
                        </button>
                      </div>

                      <div className="w-full bg-stone-200/70 h-1.5 rounded-md overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-md transition-all duration-300"
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] tabular-nums">
                        <span className="font-medium text-stone-800">
                          ₹{g.currentAmount.toLocaleString('en-IN')}
                          <span className="text-stone-400 font-normal"> / ₹{g.targetAmount.toLocaleString('en-IN')}</span>
                        </span>
                        <span className="text-stone-500 font-medium">{pct}%</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Transactions Ledger (2/3) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-stone-200/80 p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold tracking-tight text-stone-900">
                  Transactions Ledger
                </h3>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Detailed record of income and expenses
                </p>
              </div>

              {/* Type Switcher */}
              <div className="flex items-center bg-stone-100 p-0.5 rounded-md border border-stone-200/70 text-xs font-medium">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1 rounded-sm transition-colors ${
                    filterType === 'all'
                      ? 'bg-white text-stone-900 shadow-2xs'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterType('expense')}
                  className={`px-3 py-1 rounded-sm transition-colors ${
                    filterType === 'expense'
                      ? 'bg-white text-stone-900 shadow-2xs'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  Expenses
                </button>
                <button
                  onClick={() => setFilterType('income')}
                  className={`px-3 py-1 rounded-sm transition-colors ${
                    filterType === 'income'
                      ? 'bg-white text-stone-900 shadow-2xs'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  Inflow
                </button>
              </div>
            </div>

            {/* Search & Category Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search description, notes..."
                  className="pl-8.5 h-8.5 text-xs bg-stone-50 border-stone-200 rounded-md"
                />
              </div>

              <div className="w-full sm:w-48">
                <Select value={filterCategory} onValueChange={(val) => val && setFilterCategory(val)}>
                  <SelectTrigger className="h-8.5 text-xs bg-stone-50 border-stone-200 rounded-md">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-stone-200 text-xs">
                    <SelectItem value="all">All Categories</SelectItem>
                    {FINANCE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Transactions List */}
            <div className="divide-y divide-stone-100 border-t border-stone-100">
              {filteredTransactions.length === 0 ? (
                <div className="py-12 text-center text-xs text-stone-400 space-y-2">
                  <p>No transactions match your search.</p>
                  <Button
                    onClick={() => setIsTxOpen(true)}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs rounded-md"
                  >
                    + Record First Transaction
                  </Button>
                </div>
              ) : (
                filteredTransactions.map((tx) => {
                  const isInc = tx.type === 'income';
                  return (
                    <div
                      key={tx.id}
                      className="py-3 flex items-center justify-between gap-3 group hover:bg-stone-50/60 px-2 -mx-2 rounded-lg transition-colors"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          isInc ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-700'
                        }`}>
                          {isInc ? (
                            <ArrowDownRight className="w-4 h-4" />
                          ) : (
                            <CreditCard className="w-4 h-4" />
                          )}
                        </div>

                        <div className="min-w-0 space-y-0.5">
                          <p className="text-xs font-semibold text-stone-900 truncate">
                            {tx.description}
                          </p>
                          <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-stone-400">
                            <span className="font-medium text-stone-600 bg-stone-100 px-1.5 py-0.2 rounded-md">
                              {tx.category}
                            </span>
                            <span>•</span>
                            <span>{format(new Date(tx.date), 'MMM d, yyyy')}</span>
                            <span>•</span>
                            <span className="font-mono">{tx.paymentMethod}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-xs font-bold tabular-nums ${
                          isInc ? 'text-emerald-700' : 'text-stone-900'
                        }`}>
                          {isInc ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                        </span>

                        <button
                          onClick={() => handleDeleteTransaction(tx.id)}
                          title="Delete transaction"
                          className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-rose-600 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================= */}
      {/* MODAL 1: RECORD TRANSACTION               */}
      {/* ========================================= */}
      <Dialog open={isTxOpen} onOpenChange={setIsTxOpen}>
        <DialogContent className="sm:max-w-md bg-white border-stone-200 rounded-xl p-5">
          <DialogHeader className="pb-3 border-b border-stone-100">
            <DialogTitle className="text-base font-bold text-stone-900">
              Record Transaction
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-500">
              Add income or expenses to sync directly with your cloud ledger.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTransaction} className="space-y-4 pt-2">
            {/* Type selector */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 rounded-lg text-xs font-medium">
              <button
                type="button"
                onClick={() => setTxType('expense')}
                className={`py-1.5 rounded-md transition-colors ${
                  txType === 'expense'
                    ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Expense Outflow
              </button>
              <button
                type="button"
                onClick={() => setTxType('income')}
                className={`py-1.5 rounded-md transition-colors ${
                  txType === 'income'
                    ? 'bg-white text-emerald-800 shadow-2xs font-semibold'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Income Inflow
              </button>
            </div>

            {/* Amount */}
            <div className="space-y-1">
              <Label className="text-xs font-medium text-stone-700">Amount (₹)</Label>
              <Input
                type="number"
                step="any"
                required
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value)}
                placeholder="e.g. 1499"
                className="text-sm font-semibold h-9 bg-stone-50 border-stone-200 rounded-md"
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <Label className="text-xs font-medium text-stone-700">Description</Label>
              <Input
                required
                value={txDescription}
                onChange={(e) => setTxDescription(e.target.value)}
                placeholder="e.g. Cursor Pro subscription, Client retainer"
                className="text-xs h-9 bg-stone-50 border-stone-200 rounded-md"
              />
            </div>

            {/* Category & Payment Method */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-stone-700">Category</Label>
                <Select value={txCategory} onValueChange={(val) => val && setTxCategory(val)}>
                  <SelectTrigger className="h-9 text-xs bg-stone-50 border-stone-200 rounded-md">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-stone-200 text-xs">
                    {FINANCE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-stone-700">Payment Method</Label>
                <Select value={txPaymentMethod} onValueChange={(val) => val && setTxPaymentMethod(val)}>
                  <SelectTrigger className="h-9 text-xs bg-stone-50 border-stone-200 rounded-md">
                    <SelectValue placeholder="Method" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-stone-200 text-xs">
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date */}
            <div className="space-y-1">
              <Label className="text-xs font-medium text-stone-700">Date</Label>
              <Input
                type="date"
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
                className="text-xs h-9 bg-stone-50 border-stone-200 rounded-md"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <Label className="text-xs font-medium text-stone-700">Notes (Optional)</Label>
              <Textarea
                rows={2}
                value={txNotes}
                onChange={(e) => setTxNotes(e.target.value)}
                placeholder="Additional vendor details, tax tag..."
                className="text-xs bg-stone-50 border-stone-200 rounded-md resize-none"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsTxOpen(false)}
                className="h-8.5 text-xs rounded-md"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                size="sm"
                className="h-8.5 text-xs bg-stone-900 hover:bg-stone-800 text-white rounded-md font-medium"
              >
                {isSubmitting ? "Recording..." : "Record Transaction"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================= */}
      {/* MODAL 2: MANAGE BUDGETS                   */}
      {/* ========================================= */}
      <Dialog open={isBudgetOpen} onOpenChange={setIsBudgetOpen}>
        <DialogContent className="sm:max-w-lg bg-white border-stone-200 rounded-xl p-5">
          <DialogHeader className="pb-3 border-b border-stone-100">
            <DialogTitle className="text-base font-bold text-stone-900">
              Manage Monthly Budgets
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-500">
              Set monthly spending limits for each category to track burn rate.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Existing budgets list */}
            <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
              {budgetsList.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-stone-200 bg-stone-50/60 text-xs"
                >
                  <span className="font-semibold text-stone-900 truncate">
                    {b.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium tabular-nums text-stone-800">
                      ₹{b.monthlyLimit.toLocaleString('en-IN')}
                    </span>
                    <button
                      onClick={() => handleDeleteBudget(b.id)}
                      className="text-stone-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add/Update Budget Form */}
            <form onSubmit={handleAddNewBudget} className="pt-3 border-t border-stone-200 space-y-3">
              <h4 className="text-xs font-semibold text-stone-900">
                Add or Update Category Limit
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <Select value={newBudgetCategory} onValueChange={(val) => val && setNewBudgetCategory(val)}>
                  <SelectTrigger className="h-8.5 text-xs bg-stone-50 border-stone-200 rounded-md">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-stone-200 text-xs">
                    {FINANCE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  type="number"
                  placeholder="Monthly Limit (₹)"
                  value={newBudgetLimit}
                  onChange={(e) => setNewBudgetLimit(e.target.value)}
                  className="h-8.5 text-xs bg-stone-50 border-stone-200 rounded-md"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsBudgetOpen(false)}
                  className="h-8 text-xs rounded-md"
                >
                  Close
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="h-8 text-xs bg-stone-900 hover:bg-stone-800 text-white rounded-md"
                >
                  Save Limit
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================= */}
      {/* MODAL 3: ADD FINANCIAL GOAL               */}
      {/* ========================================= */}
      <Dialog open={isGoalOpen} onOpenChange={setIsGoalOpen}>
        <DialogContent className="sm:max-w-md bg-white border-stone-200 rounded-xl p-5">
          <DialogHeader className="pb-3 border-b border-stone-100">
            <DialogTitle className="text-base font-bold text-stone-900">
              Create Financial Goal
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-500">
              Set liquidity reserves, studio runway targets, or savings goals.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateGoal} className="space-y-3.5 pt-2">
            <div className="space-y-1">
              <Label className="text-xs font-medium text-stone-700">Goal Title</Label>
              <Input
                required
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                placeholder="e.g. Studio Runway 6 Months, Tax Reserve Q4"
                className="text-xs h-9 bg-stone-50 border-stone-200 rounded-md"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-stone-700">Target Amount (₹)</Label>
                <Input
                  type="number"
                  required
                  value={goalTargetAmount}
                  onChange={(e) => setGoalTargetAmount(e.target.value)}
                  placeholder="e.g. 300000"
                  className="text-xs h-9 bg-stone-50 border-stone-200 rounded-md"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-stone-700">Current Saved (₹)</Label>
                <Input
                  type="number"
                  value={goalCurrentAmount}
                  onChange={(e) => setGoalCurrentAmount(e.target.value)}
                  placeholder="e.g. 150000"
                  className="text-xs h-9 bg-stone-50 border-stone-200 rounded-md"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-stone-700">Target Date (Optional)</Label>
              <Input
                type="date"
                value={goalTargetDate}
                onChange={(e) => setGoalTargetDate(e.target.value)}
                className="text-xs h-9 bg-stone-50 border-stone-200 rounded-md"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-stone-700">Notes (Optional)</Label>
              <Textarea
                rows={2}
                value={goalNotes}
                onChange={(e) => setGoalNotes(e.target.value)}
                placeholder="Purpose of this reserve..."
                className="text-xs bg-stone-50 border-stone-200 rounded-md resize-none"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsGoalOpen(false)}
                className="h-8.5 text-xs rounded-md"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                size="sm"
                className="h-8.5 text-xs bg-stone-900 hover:bg-stone-800 text-white rounded-md font-medium"
              >
                {isSubmitting ? "Creating..." : "Create Goal"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
