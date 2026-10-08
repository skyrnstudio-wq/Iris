import { NextResponse } from 'next/server';
import { getHabits, createHabit, toggleHabitLog } from '@/services/habitService';

export async function GET() {
  try {
    const habits = await getHabits();
    return NextResponse.json(habits);
  } catch (error) {
    console.error('Error fetching habits:', error);
    return NextResponse.json({ error: 'Failed to fetch habits' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === 'toggle') {
      const result = await toggleHabitLog(body.habitId, body.dayOffset || 0);
      return NextResponse.json({ success: true, completed: result });
    }

    const created = await createHabit(body);
    return NextResponse.json(created);
  } catch (error) {
    console.error('Error in habits endpoint:', error);
    return NextResponse.json({ error: 'Failed to process habit request' }, { status: 500 });
  }
}
