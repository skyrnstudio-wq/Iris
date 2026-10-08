import { supabase, tables } from '@/lib/supabase';
import { CreateTaskInput, UpdateTaskInput } from '@/types';

function mapFromDb(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    domain: row.domain || 'work',
    priority: row.priority || 'medium',
    status: row.status || 'backlog',
    estimatedMin: row.estimated_min,
    actualMin: row.actual_min,
    energyLevel: row.energy_level || 'medium',
    deadline: row.deadline ? new Date(row.deadline) : null,
    scheduledDate: row.scheduled_date ? new Date(row.scheduled_date) : null,
    scheduledTime: row.scheduled_time,
    recurrence: row.recurrence,
    parentId: row.parent_id,
    tags: row.tags,
    notes: row.notes,
    sortOrder: row.sort_order || 0,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    completedAt: row.completed_at ? new Date(row.completed_at) : null,
  };
}

export async function getAllTasks(filters?: { status?: string; domain?: string; search?: string }) {
  try {
    let query = tables.tasks().select('*');

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.domain) {
      query = query.eq('domain', filters.domain);
    }
    if (filters?.search) {
      query = query.ilike('title', `%${filters.search}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error || !data) {
      console.error('Error fetching tasks from Supabase:', error);
      return [];
    }

    return data.map(mapFromDb);
  } catch (err) {
    console.error('Unexpected error in getAllTasks:', err);
    return [];
  }
}

export async function getTaskById(id: string) {
  try {
    const { data, error } = await tables.tasks().select('*').eq('id', id).maybeSingle();
    if (error || !data) return null;
    return mapFromDb(data);
  } catch (err) {
    console.error('Error in getTaskById:', err);
    return null;
  }
}

export async function createTask(data: CreateTaskInput) {
  const id = `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const insertData = {
    id,
    title: data.title,
    description: data.description || null,
    domain: data.domain || 'work',
    priority: data.priority || 'medium',
    status: data.status || 'backlog',
    estimated_min: data.estimatedMin || 30,
    actual_min: null,
    energy_level: data.energyLevel || 'medium',
    deadline: data.deadline ? new Date(data.deadline).toISOString() : null,
    scheduled_date: data.scheduledDate ? new Date(data.scheduledDate).toISOString() : null,
    scheduled_time: data.scheduledTime || null,
    recurrence: (data as any).recurrence || null,
    parent_id: data.parentId || null,
    tags: data.tags || null,
    notes: data.notes || null,
    sort_order: 0,
    created_at: now,
    updated_at: now,
    completed_at: null,
  };

  const { data: created, error } = await tables.tasks().insert(insertData).select().single();
  if (error || !created) {
    console.error('Error creating task in Supabase:', error);
    throw new Error(error?.message || 'Failed to create task');
  }

  return mapFromDb(created);
}

export async function updateTask(id: string, data: UpdateTaskInput) {
  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.domain !== undefined) updateData.domain = data.domain;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.status !== undefined) {
    updateData.status = data.status;
    updateData.completed_at = data.status === 'done' ? new Date().toISOString() : null;
  }
  if (data.estimatedMin !== undefined) updateData.estimated_min = data.estimatedMin;
  if (data.deadline !== undefined) updateData.deadline = data.deadline ? new Date(data.deadline).toISOString() : null;

  const { data: updated, error } = await tables.tasks().update(updateData).eq('id', id).select().single();
  if (error || !updated) {
    console.error('Error updating task in Supabase:', error);
    throw new Error(error?.message || 'Failed to update task');
  }

  return mapFromDb(updated);
}

export async function deleteTask(id: string) {
  const { error } = await tables.tasks().delete().eq('id', id);
  if (error) {
    console.error('Error deleting task in Supabase:', error);
    throw new Error(error.message);
  }
}

export async function updateTaskStatus(id: string, status: string) {
  const updateData = {
    status,
    completed_at: status === 'done' ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };

  const { data: updated, error } = await tables.tasks().update(updateData).eq('id', id).select().single();
  if (error || !updated) {
    console.error('Error updating task status in Supabase:', error);
    throw new Error(error?.message || 'Failed to update task status');
  }

  return mapFromDb(updated);
}

export async function getTasksByDate(date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const { data, error } = await tables.tasks()
    .select('*')
    .or(`scheduled_date.gte.${startOfDay.toISOString()},deadline.gte.${startOfDay.toISOString()}`)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data.map(mapFromDb);
}

export async function getOverdueTasks() {
  const now = new Date().toISOString();
  const { data, error } = await tables.tasks()
    .select('*')
    .lt('deadline', now)
    .not('status', 'in', '("done","archived")');

  if (error || !data) return [];
  return data.map(mapFromDb);
}

export async function getTaskStats() {
  const { data: tasks } = await tables.tasks().select('*');
  const allTasks = tasks || [];

  const byDomain: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  let completed = 0;
  let overdue = 0;
  const now = new Date();

  allTasks.forEach((t: any) => {
    byDomain[t.domain] = (byDomain[t.domain] || 0) + 1;
    byStatus[t.status] = (byStatus[t.status] || 0) + 1;

    if (t.status === 'done') completed++;
    if (t.deadline && new Date(t.deadline) < now && t.status !== 'done' && t.status !== 'archived') {
      overdue++;
    }
  });

  return { total: allTasks.length, completed, overdue, byDomain, byStatus };
}
