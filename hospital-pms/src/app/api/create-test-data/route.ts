import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profile?.role !== 'admin') {
      // Get an admin or BD user
      const { data: adminUser } = await supabase
        .from('profiles')
        .select('id')
        .in('role', ['admin', 'bd'])
        .limit(1)
        .single();
      
      if (!adminUser) {
        return NextResponse.json({ 
          error: 'No admin or BD user found to create patients' 
        }, { status: 403 });
      }
      
      // Use service role to bypass RLS temporarily
      const testPatients = [
        {
          name: '홍길동',
          ssn_hash: 'hash_hong_' + Date.now(),
          encrypted_ssn: new Uint8Array([1, 2, 3]),
          phone: '010-1234-5678',
          email: 'hong@example.com',
          date_of_birth: '1980-01-01',
          gender: 'male',
          address: { postcode: '12345', roadAddress: '서울시 강남구' },
          status: 'active',
          patient_number: 'P001',
          created_by: adminUser.id,
          flag_hypertension: true,
          flag_diabetes: false,
          flag_hyperlipidemia: false,
          flag_anticoagulant: false,
          flag_asthma: false,
          flag_allergy: false,
          flag_cardiovascular: false,
          flag_pregnancy: false
        },
        {
          name: '김영희',
          ssn_hash: 'hash_kim_' + Date.now() + 1,
          encrypted_ssn: new Uint8Array([4, 5, 6]),
          phone: '010-2345-6789',
          email: 'kim@example.com',
          date_of_birth: '1990-05-15',
          gender: 'female',
          address: { postcode: '54321', roadAddress: '서울시 서초구' },
          status: 'pending',
          patient_number: 'P002',
          created_by: adminUser.id,
          cs_manager: user.id, // Assign to current CS user
          flag_hypertension: false,
          flag_diabetes: true,
          flag_hyperlipidemia: false,
          flag_anticoagulant: false,
          flag_asthma: false,
          flag_allergy: true,
          flag_cardiovascular: false,
          flag_pregnancy: false
        },
        {
          name: '이철수',
          ssn_hash: 'hash_lee_' + Date.now() + 2,
          encrypted_ssn: new Uint8Array([7, 8, 9]),
          phone: '010-3456-7890',
          email: 'lee@example.com',
          date_of_birth: '1975-12-25',
          gender: 'male',
          address: { postcode: '67890', roadAddress: '서울시 송파구' },
          status: 'active',
          patient_number: 'P003',
          created_by: adminUser.id,
          cs_manager: user.id, // Assign to current CS user
          flag_hypertension: true,
          flag_diabetes: true,
          flag_hyperlipidemia: true,
          flag_anticoagulant: false,
          flag_asthma: false,
          flag_allergy: false,
          flag_cardiovascular: true,
          flag_pregnancy: false
        },
        {
          name: '박민수',
          ssn_hash: 'hash_park_' + Date.now() + 3,
          encrypted_ssn: new Uint8Array([10, 11, 12]),
          phone: '010-4567-8901',
          email: 'park@example.com',
          date_of_birth: '1985-08-20',
          gender: 'male',
          address: { postcode: '11111', roadAddress: '서울시 마포구' },
          status: 'inactive',
          patient_number: 'P004',
          created_by: adminUser.id,
          flag_hypertension: false,
          flag_diabetes: false,
          flag_hyperlipidemia: false,
          flag_anticoagulant: true,
          flag_asthma: true,
          flag_allergy: false,
          flag_cardiovascular: false,
          flag_pregnancy: false
        },
        {
          name: '정수진',
          ssn_hash: 'hash_jung_' + Date.now() + 4,
          encrypted_ssn: new Uint8Array([13, 14, 15]),
          phone: '010-5678-9012',
          email: 'jung@example.com',
          date_of_birth: '1995-03-10',
          gender: 'female',
          address: { postcode: '22222', roadAddress: '서울시 종로구' },
          status: 'active',
          patient_number: 'P005',
          created_by: adminUser.id,
          cs_manager: user.id,
          flag_hypertension: false,
          flag_diabetes: false,
          flag_hyperlipidemia: false,
          flag_anticoagulant: false,
          flag_asthma: false,
          flag_allergy: false,
          flag_cardiovascular: false,
          flag_pregnancy: true
        }
      ];
      
      // Note: This might still fail due to RLS. 
      // In production, you'd need to use service role or create through admin user
      return NextResponse.json({
        error: 'Current user is not admin/BD. Cannot create patients due to RLS policy.',
        suggestion: 'Please login as admin or BD user to create test data.',
        currentRole: profile?.role,
        requiredRoles: ['admin', 'bd']
      }, { status: 403 });
    }
    
    // If user is admin, create test data
    const testPatients = [
      {
        name: '홍길동',
        ssn_hash: 'hash_hong_' + Date.now(),
        encrypted_ssn: new Uint8Array([1, 2, 3]),
        phone: '010-1234-5678',
        email: 'hong@example.com',
        date_of_birth: '1980-01-01',
        gender: 'male',
        address: { postcode: '12345', roadAddress: '서울시 강남구' },
        status: 'active',
        patient_number: 'P001',
        created_by: user.id,
        flag_hypertension: true,
        flag_diabetes: false,
        flag_hyperlipidemia: false,
        flag_anticoagulant: false,
        flag_asthma: false,
        flag_allergy: false,
        flag_cardiovascular: false,
        flag_pregnancy: false
      }
    ];
    
    const { data, error } = await supabase
      .from('patients')
      .insert(testPatients)
      .select();
    
    if (error) {
      return NextResponse.json({ 
        error: 'Failed to create test data', 
        details: error.message 
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      created: data?.length || 0,
      data: data
    });
    
  } catch (error) {
    return NextResponse.json({
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}