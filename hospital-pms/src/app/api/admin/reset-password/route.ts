import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';

// 개발 환경에서만 사용 가능한 관리자 API
export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }
  
  try {
    const { email, newPassword } = await request.json();
    
    if (!email || !newPassword) {
      return NextResponse.json({ error: 'Email and newPassword are required' }, { status: 400 });
    }
    
    const supabase = await createClient();
    
    // Service role key가 필요하므로 이 방법은 제한적입니다
    // 대신 Supabase Admin API를 사용해야 합니다
    
    return NextResponse.json({
      message: 'This endpoint requires Supabase service role key configuration',
      alternative: 'Use Supabase dashboard to manually reset passwords',
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to reset password',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}