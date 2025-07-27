import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    // Try different queries to test RLS
    const tests = [];
    
    // Test 1: Simple select
    const { data: test1, error: error1 } = await supabase
      .from('patients')
      .select('*');
    
    tests.push({
      test: 'Simple select all patients',
      success: !error1,
      error: error1?.message,
      dataCount: test1?.length || 0
    });
    
    // Test 2: Select with count
    const { count, error: error2 } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true });
    
    tests.push({
      test: 'Select with count',
      success: !error2,
      error: error2?.message,
      count: count
    });
    
    // Test 3: Insert a test patient (if user has permission)
    const testPatient = {
      name: 'Test Patient',
      ssn_hash: 'test_hash_' + Date.now(),
      encrypted_ssn: new Uint8Array([1, 2, 3]).buffer,
      phone: '010-1234-5678',
      email: 'test@example.com',
      status: 'active',
      created_by: user.id,
      flag_hypertension: false,
      flag_diabetes: false,
      flag_hyperlipidemia: false,
      flag_anticoagulant: false,
      flag_asthma: false,
      flag_allergy: false,
      flag_cardiovascular: false,
      flag_pregnancy: false
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('patients')
      .insert(testPatient)
      .select();
    
    tests.push({
      test: 'Insert test patient',
      success: !insertError,
      error: insertError?.message,
      inserted: insertData
    });
    
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email
      },
      profile: {
        role: profile?.role,
        name: profile?.name
      },
      tests: tests
    });
    
  } catch (error) {
    return NextResponse.json({
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}