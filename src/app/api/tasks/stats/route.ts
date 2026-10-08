import { NextResponse } from 'next/server';
import { getTaskStats } from '@/services/taskService';

export async function GET() {
  try {
    const stats = await getTaskStats();
    return NextResponse.json(stats);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
