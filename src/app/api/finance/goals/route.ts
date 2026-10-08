import { NextResponse } from 'next/server';
import { getAllGoals, createGoal, updateGoal, deleteGoal } from '@/services/financeService';

export async function GET() {
  try {
    const goals = await getAllGoals();
    return NextResponse.json(goals);
  } catch (error: any) {
    console.error('Error fetching goals:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch financial goals' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.title || body.targetAmount === undefined) {
      return NextResponse.json(
        { error: 'Title and targetAmount are required' },
        { status: 400 }
      );
    }

    const created = await createGoal({
      title: body.title,
      targetAmount: Number(body.targetAmount),
      currentAmount: Number(body.currentAmount || 0),
      targetDate: body.targetDate,
      category: body.category || 'savings',
      status: body.status || 'in_progress',
      notes: body.notes,
    });

    if (!created) {
      return NextResponse.json({ error: 'Failed to create financial goal' }, { status: 500 });
    }

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST goals:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process financial goal' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: 'Goal id is required' }, { status: 400 });
    }

    const updated = await updateGoal(body.id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update goal' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Goal id required' }, { status: 400 });
    }

    const success = await deleteGoal(id);
    if (!success) {
      return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to delete goal' },
      { status: 500 }
    );
  }
}
