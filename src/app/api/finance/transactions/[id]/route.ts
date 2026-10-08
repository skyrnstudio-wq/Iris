import { NextResponse } from 'next/server';
import { getTransactionById, updateTransaction, deleteTransaction } from '@/services/financeService';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const transaction = await getTransactionById(id);
    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }
    return NextResponse.json(transaction);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch transaction' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updated = await updateTransaction(id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
    }
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update transaction' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = await deleteTransaction(id);
    if (!success) {
      return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to delete transaction' }, { status: 500 });
  }
}
