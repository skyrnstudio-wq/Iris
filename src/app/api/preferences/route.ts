import { NextRequest, NextResponse } from 'next/server';
import { getPreferences, updatePreferences } from '@/services/preferencesService';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const prefs = await getPreferences();
    return NextResponse.json(prefs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const prefs = await updatePreferences(body);

    // Sync telegram credentials to .env if provided
    if (body.telegramBotToken || body.telegramChatId) {
      try {
        const envPath = path.resolve(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
          let envContent = fs.readFileSync(envPath, 'utf8');
          if (body.telegramBotToken) {
            process.env.TELEGRAM_BOT_TOKEN = body.telegramBotToken;
            envContent = envContent.replace(
              /TELEGRAM_BOT_TOKEN=".*?"/g,
              `TELEGRAM_BOT_TOKEN="${body.telegramBotToken}"`
            );
          }
          if (body.telegramChatId) {
            process.env.TELEGRAM_CHAT_ID = body.telegramChatId;
            envContent = envContent.replace(
              /TELEGRAM_CHAT_ID=".*?"/g,
              `TELEGRAM_CHAT_ID="${body.telegramChatId}"`
            );
          }
          fs.writeFileSync(envPath, envContent, 'utf8');
        }
      } catch (e) {
        console.warn('Could not sync to .env:', e);
      }
    }

    return NextResponse.json(prefs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
