export function isTelegramConfigured(): boolean {
  return !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

export interface TelegramSendOptions {
  parseMode?: 'HTML' | 'Markdown';
  chatId?: string;
  token?: string;
}

export async function sendTelegramMessage(
  text: string,
  options?: TelegramSendOptions
): Promise<boolean> {
  const token = options?.token || process.env.TELEGRAM_BOT_TOKEN;
  const chatId = options?.chatId || process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn('Telegram token or chat_id not configured');
    return false;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: options?.parseMode,
      }),
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
    return false;
  }
}

export async function sendReminder(taskTitle: string, scheduledTime: string): Promise<boolean> {
  return sendTelegramMessage(
    `🔔 <b>Reminder:</b>\nIt's time for: ${taskTitle}\n🕒 ${scheduledTime}`,
    { parseMode: 'HTML' }
  );
}

export async function sendDailySummary(plan: { completed: number; total: number; topTasks: string[] }): Promise<boolean> {
  const tasksText = plan.topTasks.map(t => `• ${t}`).join('\n');
  const text = `📊 <b>Daily Summary</b>\n\n✅ Completed: ${plan.completed}/${plan.total}\n\n🏆 <b>Top Tasks:</b>\n${tasksText}`;
  return sendTelegramMessage(text, { parseMode: 'HTML' });
}

export async function sendEveningReview(stats: { completed: number; total: number; rating?: number }): Promise<boolean> {
  let text = `🌙 <b>Evening Review</b>\n\nToday's progress: ${stats.completed}/${stats.total} tasks completed.`;
  if (stats.rating) {
    text += `\nDay Rating: ${'⭐'.repeat(stats.rating)}`;
  }
  text += `\n\nGreat job today! Rest well. 💤`;
  return sendTelegramMessage(text, { parseMode: 'HTML' });
}
