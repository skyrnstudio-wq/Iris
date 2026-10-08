import { CalendarEvent } from '@/types';
import { getBookingsForDateRange, isCalComConfigured } from '@/lib/calcom';
import { tables } from '@/lib/supabase';

export async function getMergedCalendarEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
  const events: CalendarEvent[] = [];

  // 1. Fetch live Cal.com bookings
  if (await isCalComConfigured()) {
    try {
      const bookings = await getBookingsForDateRange(startDate.toISOString(), endDate.toISOString());
      for (const booking of bookings) {
        events.push({
          id: `calcom-${booking.uid || booking.id}`,
          title: booking.title,
          startTime: booking.startTime,
          endTime: booking.endTime,
          source: 'calcom',
          type: 'booking',
          location: booking.location,
          description: booking.description,
          attendees: booking.attendees,
        });
      }
    } catch (err) {
      console.error('Error fetching Cal.com bookings for calendar:', err);
    }
  }

  // 2. Fetch scheduled IRIS tasks from Supabase
  try {
    const { data: tasks } = await tables.tasks()
      .select('*')
      .not('scheduled_date', 'is', null)
      .gte('scheduled_date', startDate.toISOString())
      .lte('scheduled_date', endDate.toISOString());

    if (tasks && tasks.length > 0) {
      for (const task of tasks) {
        const scheduledStart = new Date(task.scheduled_date);
        if (task.scheduled_time && task.scheduled_time.includes(':')) {
          const [h, m] = task.scheduled_time.split(':').map(Number);
          if (!isNaN(h) && !isNaN(m)) {
            scheduledStart.setHours(h, m, 0, 0);
          }
        }
        const durationMin = task.estimated_min || 30;
        const scheduledEnd = new Date(scheduledStart.getTime() + durationMin * 60000);

        events.push({
          id: `iris-${task.id}`,
          title: task.title,
          startTime: scheduledStart.toISOString(),
          endTime: scheduledEnd.toISOString(),
          source: 'iris',
          type: 'task',
          domain: task.domain,
          description: task.description,
        });
      }
    }
  } catch (err) {
    console.error('Error fetching tasks from Supabase for calendar:', err);
  }

  // 3. Fetch scheduled routines/breaks/exercise from iris_time_blocks
  try {
    const { data: timeBlocks } = await tables.timeBlocks()
      .select('*')
      .gte('date', startDate.toISOString())
      .lte('date', endDate.toISOString());

    if (timeBlocks && timeBlocks.length > 0) {
      const existingTitles = new Set(events.map((e) => e.title.trim().toLowerCase()));

      for (const block of timeBlocks) {
        const normalized = (block.label || '').trim().toLowerCase();
        if (existingTitles.has(normalized)) continue;

        const bDate = new Date(block.date);
        const [sH, sM] = (block.start_time || '09:00').split(':').map(Number);
        const [eH, eM] = (block.end_time || '10:00').split(':').map(Number);
        const bStart = new Date(bDate);
        bStart.setHours(isNaN(sH) ? 9 : sH, isNaN(sM) ? 0 : sM, 0, 0);
        const bEnd = new Date(bDate);
        bEnd.setHours(isNaN(eH) ? 10 : eH, isNaN(eM) ? 0 : eM, 0, 0);

        events.push({
          id: `block-${block.id}`,
          title: block.label,
          startTime: bStart.toISOString(),
          endTime: bEnd.toISOString(),
          source: 'iris',
          type: 'task',
          domain: block.domain,
        });
        existingTitles.add(normalized);
      }
    }
  } catch (err) {
    console.error('Error fetching time blocks from Supabase for calendar:', err);
  }

  // 4. Sort chronologically
  events.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  return events;
}

export async function getTodayEvents(): Promise<CalendarEvent[]> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return getMergedCalendarEvents(start, end);
}

export async function getWeekEvents(weekStart: Date): Promise<CalendarEvent[]> {
  const start = new Date(weekStart);
  start.setHours(0, 0, 0, 0);
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 7);
  end.setHours(23, 59, 59, 999);
  return getMergedCalendarEvents(start, end);
}
