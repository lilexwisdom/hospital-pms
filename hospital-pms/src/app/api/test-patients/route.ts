import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // 1. Test basic connection
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      return NextResponse.json({ 
        error: 'Auth error', 
        details: authError.message 
      }, { status: 401 });
    }
    
    // 2. Try to list tables (using a simple query)
    const { data: tables, error: tablesError } = await supabase
      .from('patients')
      .select('id')
      .limit(1);
    
    if (tablesError) {
      // If patients table doesn't exist, try profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
        
      return NextResponse.json({
        user: user?.email,
        patientsTableError: tablesError.message,
        profilesTableExists: !profilesError,
        profilesError: profilesError?.message
      });
    }
    
    // 3. Get count of patients
    const { count, error: countError } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true });
    
    return NextResponse.json({
      success: true,
      user: user?.email,
      patientsTableExists: true,
      patientsCount: count,
      sampleData: tables
    });
    
  } catch (error) {
    return NextResponse.json({
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}