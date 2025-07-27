import { createRouteClient } from '@/lib/supabase/route-handler';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createRouteClient();
    
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // Get auth settings (일부 정보는 제한될 수 있음)
    const debugInfo = {
      hasSession: !!session,
      sessionError,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    };
    
    return NextResponse.json(debugInfo);
  } catch (error) {
    return NextResponse.json({ error: 'Debug error', details: error }, { status: 500 });
  }
}

// Test email sending without actually sending
export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    const supabase = createRouteClient();
    
    // Check if user exists
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();
    
    return NextResponse.json({
      userExists: !!userData,
      userError,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Test error', details: error }, { status: 500 });
  }
}