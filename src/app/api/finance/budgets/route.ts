import { NextResponse } from 'next/server';
import { getAllBudgets, upsertBudget, deleteBudget } from '@/services/financeService';

export async function GET() {
  try {
    const budgets = await getAllBudgets();
    return NextResponse.json(budgets);
  } catch (error: any) {
    console.error('Error fetching budgets:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch budgets' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.category || body.monthlyLimit === undefined) {
      return NextResponse.json(
        { error: 'Category and monthlyLimit are required' },
        { status: 400 }
      );
    }

    const saved = await upsertBudget({
      category: body.category,
      monthlyLimit: Number(body.monthlyLimit),
      currency: body.currency || 'INR',
    });

    if (!saved) {
      return NextResponse.json({ error: 'Failed to save budget' }, { status: 500 });
    }

    return NextResponse.json(saved);
  } catch (error: any) {
    console.error('Error in POST budgets:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process budget' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Budget id required' }, { status: 400 });
    }

    const success = await deleteBudget(id);
    if (!success) {
      return NextResponse.json({ error: 'Failed to delete budget' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to delete budget' },
      { status: 500 }
    );
  }
}
