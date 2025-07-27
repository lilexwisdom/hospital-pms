import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database.types';

export async function POST() {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ 
        error: 'No authenticated user',
        userError: userError?.message 
      }, { status: 401 });
    }
    
    // Check if profile exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (existingProfile) {
      return NextResponse.json({
        message: 'Profile already exists',
        profile: existingProfile
      });
    }
    
    // Create profile if it doesn't exist
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        role: 'admin', // Default to admin for testing
        name: user.email?.split('@')[0] || 'User',
      })
      .select()
      .single();
    
    if (createError) {
      return NextResponse.json({ 
        error: 'Failed to create profile',
        details: createError 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      message: 'Profile created successfully',
      profile: newProfile
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}