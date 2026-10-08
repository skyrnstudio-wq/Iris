import { NextResponse } from 'next/server';
import { getEventTypes } from '@/lib/calcom';

export async function GET() {
  try {
    const eventTypes = await getEventTypes();
    return NextResponse.json(eventTypes);
  } catch (error) {
    console.error('Error in /api/calcom/event-types:', error);
    return NextResponse.json({ error: 'Failed to fetch event types' }, { status: 500 });
  }
}
