import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { validateSSN, hashSSN } from '@/lib/security/ssn-encryption';

export async function POST(request: NextRequest) {
  try {
    const { ssn } = await request.json();
    
    if (!ssn) {
      return NextResponse.json(
        { error: 'SSN is required' },
        { status: 400 }
      );
    }
    
    // Validate SSN format
    if (!validateSSN(ssn)) {
      return NextResponse.json(
        { error: '유효하지 않은 주민등록번호 형식입니다' },
        { status: 400 }
      );
    }
    
    const supabase = await createServerClient();
    
    // Check if user is authenticated (optional for survey)
    const { data: { user } } = await supabase.auth.getUser();
    
    // Use the database function to check
    const { data, error } = await supabase
      .rpc('check_patient_exists_by_ssn', { p_ssn: ssn });
    
    if (error) {
      console.error('Duplicate check error:', error);
      return NextResponse.json(
        { error: '중복 확인 중 오류가 발생했습니다' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      exists: data.exists,
      patientName: data.patient_name,
      message: data.exists 
        ? '이미 등록된 환자입니다. 정보가 업데이트됩니다.' 
        : '신규 환자로 등록됩니다.'
    });
  } catch (error) {
    console.error('Patient duplicate check error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}