import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database.types';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ 
        error: 'No authenticated user',
        userError: userError?.message 
      }, { status: 401 });
    }
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    // Get session
    const { data: { session } } = await supabase.auth.getSession();
    
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        app_metadata: user.app_metadata,
        user_metadata: user.user_metadata,
      },
      profile,
      profileError: profileError?.message,
      session: {
        expires_at: session?.expires_at,
        expires_in: session?.expires_in,
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}