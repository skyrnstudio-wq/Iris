import { supabase, tables } from '@/lib/supabase';

export interface HabitData {
  id: string;
  name: string;
  domain: string;
  frequency: string;
  streak: number;
  bestStreak: number;
  isActive: boolean;
  history?: boolean[]; // last 7 days
}

export async function getHabits(): Promise<HabitData[]> {
  try {
    const { data: habits, error } = await tables.habits()
      .select('*')
      .order('created_at', { ascending: true });

    if (error || !habits) {
      console.error('Error fetching habits from Supabase:', error);
      return [];
    }

    // Fetch habit logs for past 7 days to calculate recent history
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: logs } = await tables.habitLogs()
      .select('*')
      .gte('date', sevenDaysAgo.toISOString());

    return habits.map((h: any) => {
      const habitLogs = (logs || []).filter((l: any) => l.habit_id === h.id && l.completed);
      // Map 7-day history (Mon-Sun or past 7 days)
      const history = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dStr = d.toISOString().split('T')[0];
        return habitLogs.some((l: any) => l.date && l.date.startsWith(dStr));
      });

      return {
        id: h.id,
        name: h.name,
        domain: h.domain,
        frequency: h.frequency,
        streak: h.streak || 0,
        bestStreak: h.best_streak || 0,
        isActive: h.is_active,
        history,
      };
    });
  } catch (err) {
    console.error('Unexpected error in getHabits:', err);
    return [];
  }
}

export async function createHabit(data: { name: string; domain: string; frequency?: string }): Promise<HabitData | null> {
  const id = `habit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const { data: created, error } = await tables.habits().insert({
    id,
    name: data.name,
    domain: data.domain || 'health',
    frequency: data.frequency || 'Daily',
    streak: 0,
    best_streak: 0,
    is_active: true,
  }).select().single();

  if (error || !created) {
    console.error('Error creating habit in Supabase:', error);
    return null;
  }

  return {
    id: created.id,
    name: created.name,
    domain: created.domain,
    frequency: created.frequency,
    streak: 0,
    bestStreak: 0,
    isActive: true,
    history: [false, false, false, false, false, false, false],
  };
}

export async function toggleHabitLog(habitId: string, dayOffset: number = 0): Promise<boolean> {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - dayOffset);
  const dateStr = targetDate.toISOString().split('T')[0];

  const { data: existing } = await tables.habitLogs()
    .select('id, completed')
    .eq('habit_id', habitId)
    .gte('date', `${dateStr}T00:00:00.000Z`)
    .lte('date', `${dateStr}T23:59:59.999Z`)
    .maybeSingle();

  if (existing) {
    // Delete or toggle
    await tables.habitLogs().delete().eq('id', existing.id);
    return false;
  } else {
    // Insert log
    await tables.habitLogs().insert({
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      habit_id: habitId,
      date: targetDate.toISOString(),
      completed: true,
    });
    return true;
  }
}
