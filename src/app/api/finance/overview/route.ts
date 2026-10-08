import { NextResponse } from 'next/server';
import { getFinanceOverview } from '@/services/financeService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const targetDate = dateParam ? new Date(dateParam) : new Date();

    const overview = await getFinanceOverview(targetDate);
    return NextResponse.json(overview);
  } catch (error: any) {
    console.error('Error fetching finance overview:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch finance overview' },
      { status: 500 }
    );
  }
}
