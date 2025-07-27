import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Check if this is a password reset
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Check if user needs to reset password
        // You can check user metadata or other indicators
        return NextResponse.redirect(`${origin}/auth/reset-password?from_email=true&type=recovery`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=invalid_link`);
}