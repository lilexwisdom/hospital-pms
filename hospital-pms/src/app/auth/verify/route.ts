import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '/';

  if (token_hash && type) {
    const supabase = await createClient();
    
    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    });

    if (!error) {
      // Redirect to password reset page for recovery type
      if (type === 'recovery') {
        return NextResponse.redirect(new URL('/auth/reset-password?from_email=true&type=recovery', request.url));
      }
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // Redirect to error page
  return NextResponse.redirect(new URL('/login?error=invalid_link', request.url));
}