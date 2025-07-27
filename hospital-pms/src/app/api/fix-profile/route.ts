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
      .maybeSingle(); // Use maybeSingle to avoid error when no row exists
    
    if (checkError && checkError.code !== 'PGRST116') {
      return NextResponse.json({ 
        error: 'Failed to check profile',
        details: checkError 
      }, { status: 500 });
    }
    
    if (existingProfile) {
      // Update to admin role if not already
      if (existingProfile.role !== 'admin') {
        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update({ 
            role: 'admin',
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)
          .select()
          .single();
          
        if (updateError) {
          return NextResponse.json({ 
            error: 'Failed to update profile',
            details: updateError 
          }, { status: 500 });
        }
          
        return NextResponse.json({
          message: 'Profile updated to admin',
          profile: updatedProfile
        });
      }
      
      return NextResponse.json({
        message: 'Profile already has admin role',
        profile: existingProfile
      });
    }
    
    // Create profile if it doesn't exist
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        role: 'admin',
        name: user.email?.split('@')[0] || 'Admin User',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
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
      message: 'Profile created with admin role',
      profile: newProfile
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}