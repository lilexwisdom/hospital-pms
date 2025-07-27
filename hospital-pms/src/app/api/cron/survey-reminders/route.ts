import { NextRequest, NextResponse } from 'next/server';
import { processPendingReminders } from '@/lib/reminders/survey-reminders';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from the cron job (e.g., Vercel Cron)
    const authHeader = headers().get('authorization');
    
    // In production, verify the authorization token
    if (process.env.NODE_ENV === 'production') {
      if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }
    
    // Process pending reminders
    await processPendingReminders();
    
    return NextResponse.json({
      success: true,
      message: 'Survey reminders processed',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Survey reminder cron error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process survey reminders',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}