import { NextRequest, NextResponse } from 'next/server';
import { getDailyPlan, generateDailyPlan } from '@/services/schedulerService';

export async function GET(request: NextRequest) {
  try {
    const dateParam = request.nextUrl.searchParams.get('date');
    const date = dateParam ? new Date(dateParam) : new Date();
    const plan = await getDailyPlan(date);
    return NextResponse.json(plan || { date, blocks: [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const date = body.date ? new Date(body.date) : new Date();
    const plan = await generateDailyPlan(date);
    return NextResponse.json(plan, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
