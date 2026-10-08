import { tables } from '@/lib/supabase';
import { TimeBlockData } from '@/types';
import { callAI } from '@/lib/openrouter';
import { DAILY_PLAN_SYSTEM_PROMPT, buildDailyPlanUserPrompt } from '@/lib/prompts';
import { getTasksByDate } from './taskService';
import { getPreferences } from './preferencesService';

export async function getDailyPlan(date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const dateStr = startOfDay.toISOString().split('T')[0];

  const { data } = await tables.dailyPlans()
    .select('*')
    .gte('date', `${dateStr}T00:00:00.000Z`)
    .lte('date', `${dateStr}T23:59:59.999Z`)
    .maybeSingle();

  if (!data) return null;
  return {
    id: data.id,
    date: new Date(data.date),
    timeBlocksJson: data.time_blocks_json,
    aiGenerated: data.ai_generated,
  };
}

export async function saveDailyPlan(date: Date, timeBlocks: TimeBlockData[], aiGenerated: boolean) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const dateStr = startOfDay.toISOString().split('T')[0];

  const id = `plan_${dateStr}`;
  const payload = {
    id,
    date: startOfDay.toISOString(),
    time_blocks_json: JSON.stringify(timeBlocks),
    ai_generated: aiGenerated,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await tables.dailyPlans()
    .upsert(payload, { onConflict: 'date' })
    .select()
    .single();

  if (error || !data) {
    console.error('Error saving daily plan to Supabase:', error);
    return null;
  }

  return {
    id: data.id,
    date: new Date(data.date),
    timeBlocksJson: data.time_blocks_json,
    aiGenerated: data.ai_generated,
  };
}

export async function getRulBasedSchedule(date: Date, tasks: any[], preferences: any): Promise<TimeBlockData[]> {
  const blocks: TimeBlockData[] = [];
  const wakeTime = preferences?.wakeTime || '06:30';
  const [wakeH, wakeM] = wakeTime.split(':').map(Number);
  
  // Morning routine block
  blocks.push({
    startTime: wakeTime,
    endTime: `${(wakeH + 1).toString().padStart(2, '0')}:${wakeM.toString().padStart(2, '0')}`,
    label: 'Morning Routine & Breakfast',
    type: 'routine',
    isFixed: true,
  });
  
  let currentH = wakeH + 1;
  for (const task of tasks) {
    if (currentH >= 22) break;
    const duration = task.estimatedMin || 30;
    const endH = currentH + Math.floor(duration / 60);
    const endM = duration % 60;
    blocks.push({
      startTime: `${currentH.toString().padStart(2, '0')}:00`,
      endTime: `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`,
      label: task.title,
      type: 'task',
      taskId: task.id,
      domain: task.domain,
    });
    currentH = endH + 1;
  }
  
  return blocks;
}

export async function getAISchedule(date: Date, tasks: any[], preferences: any): Promise<TimeBlockData[] | null> {
  const prompt = buildDailyPlanUserPrompt(date, tasks, preferences, []);
  const result = await callAI(DAILY_PLAN_SYSTEM_PROMPT, prompt);
  if (result && Array.isArray(result)) {
    return result as TimeBlockData[];
  }
  return null;
}

export async function generateDailyPlan(date: Date) {
  const tasks = await getTasksByDate(date);
  const prefs = await getPreferences();
  
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  let calcomBlocks: TimeBlockData[] = [];
  try {
    const { getBookingsForDateRange, isCalComConfigured } = await import('@/lib/calcom');
    if (await isCalComConfigured()) {
      const bookings = await getBookingsForDateRange(startOfDay.toISOString(), endOfDay.toISOString());
      calcomBlocks = bookings.map(b => {
        const start = new Date(b.startTime);
        const end = new Date(b.endTime);
        return {
          startTime: `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`,
          endTime: `${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`,
          label: b.title,
          type: 'routine',
          isFixed: true,
        };
      });
    }
  } catch (e) {
    console.error('Error fetching Cal.com blocks for daily plan:', e);
  }

  let blocks = await getAISchedule(date, tasks, prefs);
  let aiGenerated = true;
  
  if (!blocks) {
    blocks = await getRulBasedSchedule(date, tasks, prefs);
    aiGenerated = false;
  }
  
  blocks = [...calcomBlocks, ...blocks].sort((a, b) => a.startTime.localeCompare(b.startTime));
  return saveDailyPlan(date, blocks, aiGenerated);
}

export async function rescheduleRemaining(date: Date, completedTaskIds: string[]): Promise<TimeBlockData[]> {
  const plan = await getDailyPlan(date);
  if (!plan) return [];
  
  const blocks: TimeBlockData[] = JSON.parse(plan.timeBlocksJson);
  const remaining = blocks.filter(b => b.type !== 'task' || (b.taskId && !completedTaskIds.includes(b.taskId)));
  
  await saveDailyPlan(date, remaining, plan.aiGenerated);
  return remaining;
}
