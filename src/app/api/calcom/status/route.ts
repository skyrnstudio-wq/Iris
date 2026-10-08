import { NextResponse } from 'next/server';
import { isCalComConfigured, getMe } from '@/lib/calcom';

export async function GET() {
  try {
    const configured = await isCalComConfigured();
    
    if (!configured) {
      return NextResponse.json({ configured: false, connected: false });
    }

    const user = await getMe();
    
    if (user && user.email) {
      return NextResponse.json({ 
        configured: true, 
        connected: true, 
        user: {
          name: user.name,
          email: user.email,
          timeZone: user.timeZone,
          username: user.username
        }
      });
    } else {
      return NextResponse.json({ 
        configured: true, 
        connected: false, 
        error: 'Invalid Cal.com API key or unauthorized' 
      });
    }
  } catch (error: any) {
    return NextResponse.json({ 
      configured: true, 
      connected: false, 
      error: error.message || 'Unknown error' 
    }, { status: 500 });
  }
}
