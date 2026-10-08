import { NextRequest, NextResponse } from 'next/server';
import { getAllTasks, createTask } from '@/services/taskService';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || undefined;
    const domain = searchParams.get('domain') || undefined;
    const search = searchParams.get('search') || undefined;
    
    const tasks = await getAllTasks({ status, domain, search });
    return NextResponse.json(tasks);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const task = await createTask(body);
    return NextResponse.json(task, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
