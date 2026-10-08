import { tables } from '@/lib/supabase';

export interface PreferencesData {
  id?: string;
  wakeTime?: string;
  sleepTime?: string;
  peakHoursStart?: string;
  peakHoursEnd?: string;
  workStartTime?: string;
  workEndTime?: string;
  breakDurationMin?: number;
  lunchTime?: string;
  lunchDurationMin?: number;
  timezone?: string;
  telegramBotToken?: string | null;
  telegramChatId?: string | null;
  openrouterApiKey?: string | null;
  calcomApiKey?: string | null;
}

export async function getPreferences(): Promise<PreferencesData> {
  const fallbackDefaults: PreferencesData = {
    id: 'default',
    wakeTime: '06:30',
    sleepTime: '22:30',
    peakHoursStart: '08:30',
    peakHoursEnd: '11:30',
    workStartTime: '08:30',
    workEndTime: '17:30',
    breakDurationMin: 15,
    lunchTime: '13:00',
    lunchDurationMin: 45,
    timezone: 'Asia/Kolkata',
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || null,
    telegramChatId: process.env.TELEGRAM_CHAT_ID || null,
    openrouterApiKey: null,
    calcomApiKey: null,
  };

  try {
    const { data: existing, error } = await tables.preferences()
      .select('*')
      .eq('id', 'default')
      .maybeSingle();

    if (error) {
      console.warn('Warning reading preferences from Supabase:', error.message);
    }

    if (existing) {
      return {
        id: existing.id,
        wakeTime: existing.wake_time || '06:30',
        sleepTime: existing.sleep_time || '22:30',
        peakHoursStart: existing.peak_hours_start || '08:30',
        peakHoursEnd: existing.peak_hours_end || '11:30',
        workStartTime: existing.work_start_time || '08:30',
        workEndTime: existing.work_end_time || '17:30',
        breakDurationMin: existing.break_duration_min ?? 15,
        lunchTime: existing.lunch_time || '13:00',
        lunchDurationMin: existing.lunch_duration_min ?? 45,
        timezone: existing.timezone || 'Asia/Kolkata',
        telegramBotToken: existing.telegram_bot_token || process.env.TELEGRAM_BOT_TOKEN || null,
        telegramChatId: existing.telegram_chat_id || process.env.TELEGRAM_CHAT_ID || null,
        openrouterApiKey: existing.openrouter_api_key || null,
        calcomApiKey: existing.calcom_api_key || null,
      };
    }

    // Insert default if record does not exist
    const defaults = {
      id: 'default',
      wake_time: fallbackDefaults.wakeTime,
      sleep_time: fallbackDefaults.sleepTime,
      peak_hours_start: fallbackDefaults.peakHoursStart,
      peak_hours_end: fallbackDefaults.peakHoursEnd,
      work_start_time: fallbackDefaults.workStartTime,
      work_end_time: fallbackDefaults.workEndTime,
      break_duration_min: fallbackDefaults.breakDurationMin,
      lunch_time: fallbackDefaults.lunchTime,
      lunch_duration_min: fallbackDefaults.lunchDurationMin,
      timezone: fallbackDefaults.timezone,
      telegram_bot_token: fallbackDefaults.telegramBotToken,
      telegram_chat_id: fallbackDefaults.telegramChatId,
    };

    const { data: created } = await tables.preferences().insert(defaults).select().single();
    if (created) {
      return {
        id: created.id,
        wakeTime: created.wake_time,
        sleepTime: created.sleep_time,
        peakHoursStart: created.peak_hours_start,
        peakHoursEnd: created.peak_hours_end,
        workStartTime: created.work_start_time,
        workEndTime: created.work_end_time,
        breakDurationMin: created.break_duration_min,
        lunchTime: created.lunch_time,
        lunchDurationMin: created.lunch_duration_min,
        timezone: created.timezone,
        telegramBotToken: created.telegram_bot_token,
        telegramChatId: created.telegram_chat_id,
        openrouterApiKey: created.openrouter_api_key,
        calcomApiKey: created.calcom_api_key,
      };
    }

    return fallbackDefaults;
  } catch (err) {
    console.error('Error in getPreferences:', err);
    return fallbackDefaults;
  }
}

export async function updatePreferences(data: Partial<PreferencesData>): Promise<PreferencesData> {
  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (data.wakeTime !== undefined) updateData.wake_time = data.wakeTime;
  if (data.sleepTime !== undefined) updateData.sleep_time = data.sleepTime;
  if (data.peakHoursStart !== undefined) updateData.peak_hours_start = data.peakHoursStart;
  if (data.peakHoursEnd !== undefined) updateData.peak_hours_end = data.peakHoursEnd;
  if (data.workStartTime !== undefined) updateData.work_start_time = data.workStartTime;
  if (data.workEndTime !== undefined) updateData.work_end_time = data.workEndTime;
  if (data.breakDurationMin !== undefined) updateData.break_duration_min = data.breakDurationMin;
  if (data.lunchTime !== undefined) updateData.lunch_time = data.lunchTime;
  if (data.lunchDurationMin !== undefined) updateData.lunch_duration_min = data.lunchDurationMin;
  if (data.timezone !== undefined) updateData.timezone = data.timezone;
  if (data.telegramBotToken !== undefined) updateData.telegram_bot_token = data.telegramBotToken;
  if (data.telegramChatId !== undefined) updateData.telegram_chat_id = data.telegramChatId;
  if (data.openrouterApiKey !== undefined) updateData.openrouter_api_key = data.openrouterApiKey;
  if (data.calcomApiKey !== undefined) updateData.calcom_api_key = data.calcomApiKey;

  // Use upsert to handle both existing and missing rows gracefully
  const { data: updated, error } = await tables.preferences()
    .upsert({ id: 'default', ...updateData })
    .select()
    .single();

  if (error || !updated) {
    console.error('Error updating preferences in Supabase:', error);
    throw new Error(error?.message || 'Failed to update preferences in database');
  }

  return {
    id: updated.id,
    wakeTime: updated.wake_time,
    sleepTime: updated.sleep_time,
    peakHoursStart: updated.peak_hours_start,
    peakHoursEnd: updated.peak_hours_end,
    workStartTime: updated.work_start_time,
    workEndTime: updated.work_end_time,
    breakDurationMin: updated.break_duration_min,
    lunchTime: updated.lunch_time,
    lunchDurationMin: updated.lunch_duration_min,
    timezone: updated.timezone,
    telegramBotToken: updated.telegram_bot_token,
    telegramChatId: updated.telegram_chat_id,
    openrouterApiKey: updated.openrouter_api_key,
    calcomApiKey: updated.calcom_api_key,
  };
}
