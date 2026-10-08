import { NextResponse } from 'next/server';
import { getAllTransactions, createTransaction } from '@/services/financeService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || undefined;
    const category = searchParams.get('category') || undefined;
    const month = searchParams.get('month') || undefined;
    const search = searchParams.get('search') || undefined;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined;

    const transactions = await getAllTransactions({
      type,
      category,
      month,
      search,
      limit,
    });

    return NextResponse.json(transactions);
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.amount || !body.type || !body.description) {
      return NextResponse.json(
        { error: 'Amount, type, and description are required' },
        { status: 400 }
      );
    }

    const created = await createTransaction({
      amount: Number(body.amount),
      type: body.type,
      category: body.category || 'Miscellaneous',
      description: body.description,
      date: body.date,
      paymentMethod: body.paymentMethod,
      isRecurring: Boolean(body.isRecurring),
      tags: body.tags,
      notes: body.notes,
    });

    if (!created) {
      return NextResponse.json(
        { error: 'Failed to create transaction' },
        { status: 500 }
      );
    }

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST transactions:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process transaction' },
      { status: 500 }
    );
  }
}
