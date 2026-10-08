import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jomjrtsalhkqkxtaoarx.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvbWpydHNhbGhrcWt4dGFvYXJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MzUwOTYsImV4cCI6MjEwNTQxMTA5Nn0.S2jIy34E7FDJvoN-8uGc0UeWK0agRvO28RO2SykD6Ic';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
});

export const tables = {
  tasks: () => supabase.from('iris_tasks'),
  timeBlocks: () => supabase.from('iris_time_blocks'),
  dailyPlans: () => supabase.from('iris_daily_plans'),
  habits: () => supabase.from('iris_habits'),
  habitLogs: () => supabase.from('iris_habit_logs'),
  preferences: () => supabase.from('iris_user_preferences'),
  transactions: () => supabase.from('iris_transactions'),
  budgets: () => supabase.from('iris_budgets'),
  goals: () => supabase.from('iris_financial_goals'),
};

