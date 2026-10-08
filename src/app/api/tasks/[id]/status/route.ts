import { NextRequest, NextResponse } from 'next/server';
import { updateTaskStatus } from '@/services/taskService';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    if (!body.status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }
    const task = await updateTaskStatus(id, body.status);
    return NextResponse.json(task);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
