import { NextResponse } from 'next/server';
import { getBookingsForDateRange, getUpcomingBookings, getAllBookings } from '@/lib/calcom';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  try {
    if (startDate && endDate) {
      const bookings = await getBookingsForDateRange(startDate, endDate);
      return NextResponse.json(bookings);
    }
    
    if (status === 'upcoming') {
      const bookings = await getUpcomingBookings();
      return NextResponse.json(bookings);
    }

    const bookings = await getAllBookings();
    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error in /api/calcom/bookings:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}
