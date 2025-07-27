import { NextResponse } from 'next/server';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Missing Supabase configuration' }, { status: 500 });
  }
  
  try {
    // Test Supabase connection
    const response = await fetch(`${supabaseUrl}/auth/v1/health`, {
      headers: {
        'apikey': supabaseKey,
        'Content-Type': 'application/json',
      },
    });
    
    const healthData = await response.json();
    
    // Get project info
    const projectResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseKey,
        'Content-Type': 'application/json',
      },
    });
    
    return NextResponse.json({
      health: healthData,
      projectStatus: projectResponse.status,
      timestamp: new Date().toISOString(),
      supabaseUrl,
      keyPrefix: supabaseKey.substring(0, 10) + '...',
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to connect to Supabase',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}