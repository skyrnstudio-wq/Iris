import { NextRequest, NextResponse } from 'next/server';
import { rescheduleRemaining } from '@/services/schedulerService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const date = body.date ? new Date(body.date) : new Date();
    const completedTaskIds = body.completedTaskIds || [];
    const remaining = await rescheduleRemaining(date, completedTaskIds);
    return NextResponse.json(remaining);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
