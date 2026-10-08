import { NextRequest, NextResponse } from 'next/server';
import { sendTelegramMessage } from '@/lib/telegram';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const message = body.message || '✨ Test message from IRIS (Chief of Staff)! Your Telegram integration is active.';
    const token = body.token || process.env.TELEGRAM_BOT_TOKEN;
    const chatId = body.chatId || process.env.TELEGRAM_CHAT_ID;

    if (!token) {
      return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN not provided or configured in .env' }, { status: 400 });
    }
    if (!chatId) {
      return NextResponse.json({ error: 'TELEGRAM_CHAT_ID not provided. Send /start to the bot and enter your Chat ID.' }, { status: 400 });
    }

    const success = await sendTelegramMessage(message, { token, chatId, parseMode: 'HTML' });
    
    if (success) {
      return NextResponse.json({ success: true, message: 'Message sent successfully' });
    } else {
      return NextResponse.json({ error: 'Failed to send message via Telegram API. Check chat_id and token permissions.' }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
