import { NextRequest, NextResponse } from 'next/server';
import { tables } from '@/lib/supabase';
import { saveDailyPlan } from '@/services/schedulerService';
import { TimeBlockData } from '@/types';

function calculateMinutes(startTime: string, endTime: string): number {
  try {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    return totalMinutes > 0 ? totalMinutes : 30;
  } catch {
    return 30;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, timeBlocks, summary } = body;

    if (!Array.isArray(timeBlocks) || timeBlocks.length === 0) {
      return NextResponse.json(
        { error: 'No time blocks provided to apply.' },
        { status: 400 }
      );
    }

    const planDate = date ? new Date(date) : new Date();
    planDate.setHours(0, 0, 0, 0);
    const dateStr = planDate.toISOString().split('T')[0];

    // 1. Save to daily plan in Supabase
    const savedPlan = await saveDailyPlan(planDate, timeBlocks as TimeBlockData[], true);

    // 2. Clear old time blocks for this day and insert fresh ones in iris_time_blocks
    const dayStartIso = `${dateStr}T00:00:00.000Z`;
    const dayEndIso = `${dateStr}T23:59:59.999Z`;

    await tables.timeBlocks()
      .delete()
      .gte('date', dayStartIso)
      .lte('date', dayEndIso);

    const rowsToInsert = timeBlocks.map((b: any, idx: number) => ({
      id: `block_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      date: planDate.toISOString(),
      start_time: b.startTime,
      end_time: b.endTime,
      label: b.label,
      type: b.type || 'task',
      domain: b.domain || 'work',
      is_fixed: Boolean(b.isFixed),
      created_at: new Date().toISOString(),
    }));

    if (rowsToInsert.length > 0) {
      const { error: blockErr } = await tables.timeBlocks().insert(rowsToInsert);
      if (blockErr) {
        console.warn('Warning: Failed to insert individual time blocks:', blockErr);
      }
    }

    // 3. For any task-type block, ensure a corresponding task exists in iris_tasks
    for (const b of timeBlocks) {
      if (b.type === 'task' || (!['break', 'meal', 'routine'].includes(b.type) && b.domain)) {
        try {
          // Check if an existing task with same title exists
          const { data: existing } = await tables.tasks()
            .select('id')
            .eq('title', b.label)
            .maybeSingle();

          if (!existing) {
            const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
            const estMin = calculateMinutes(b.startTime, b.endTime);
            await tables.tasks().insert({
              id: taskId,
              title: b.label,
              domain: b.domain || 'work',
              priority: 'medium',
              status: 'planned',
              estimated_min: estMin,
              scheduled_date: planDate.toISOString(),
              scheduled_time: b.startTime,
              notes: b.notes || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          } else {
            // Update scheduled time for existing task
            await tables.tasks().update({
              scheduled_date: planDate.toISOString(),
              scheduled_time: b.startTime,
              status: 'planned',
              updated_at: new Date().toISOString(),
            }).eq('id', existing.id);
          }
        } catch (taskErr) {
          console.warn('Warning: Failed to sync task to database:', taskErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Day plan successfully applied to calendar and schedule.',
      plan: savedPlan,
      appliedBlocksCount: timeBlocks.length,
    });
  } catch (error: any) {
    console.error('Error applying schedule:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to apply schedule.' },
      { status: 500 }
    );
  }
}
