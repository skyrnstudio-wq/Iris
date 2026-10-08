import { NextResponse } from 'next/server';

export async function GET() {
  const token = process.env.TELEGRAM_BOT_TOKEN || '8528779259:AAG8GYObup97kKRaqpf1aiWu_QCoXDPmZRY';

  if (!token) {
    return NextResponse.json({ error: 'Telegram Bot Token not configured' }, { status: 400 });
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates`, {
      cache: 'no-store',
    });
    const data = await res.json();

    if (!data.ok) {
      return NextResponse.json({ error: data.description || 'Failed to fetch updates' }, { status: 500 });
    }

    const updates = data.result || [];
    if (updates.length === 0) {
      return NextResponse.json({
        found: false,
        message: 'No messages received yet. Please open Telegram, search for @iris_the_personal_bot, and press Start (or send a message).',
        botUsername: 'iris_the_personal_bot',
      });
    }

    // Get the most recent message update
    for (let i = updates.length - 1; i >= 0; i--) {
      const u = updates[i];
      const msg = u.message || u.channel_post || u.callback_query?.message;
      if (msg && msg.chat && msg.chat.id) {
        return NextResponse.json({
          found: true,
          chatId: String(msg.chat.id),
          username: msg.from?.username || msg.chat.username || msg.from?.first_name || 'Telegram User',
          botUsername: 'iris_the_personal_bot',
        });
      }
    }

    return NextResponse.json({
      found: false,
      message: 'No valid chat messages found in recent updates.',
      botUsername: 'iris_the_personal_bot',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
