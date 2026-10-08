import { NextResponse } from 'next/server';
import { getMergedCalendarEvents } from '@/services/calendarService';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDateStr = searchParams.get('startDate');
  const endDateStr = searchParams.get('endDate');

  if (!startDateStr || !endDateStr) {
    return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 });
  }

  try {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: 'Invalid dates provided' }, { status: 400 });
    }

    const events = await getMergedCalendarEvents(startDate, endDate);
    return NextResponse.json(events);
  } catch (error) {
    console.error('Error in /api/calendar/events:', error);
    return NextResponse.json({ error: 'Failed to fetch calendar events' }, { status: 500 });
  }
}
