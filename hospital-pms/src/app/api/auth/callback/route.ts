import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';
  const type = searchParams.get('type');
  const error_description = searchParams.get('error_description');

  // Handle errors from Supabase
  if (error_description) {
    console.error('Auth callback error:', error_description);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error_description)}`);
  }

  if (code) {
    const supabase = await createClient();
    
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (!error) {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Check if this is a password reset flow
          // In Supabase, password reset emails set specific parameters
          const isPasswordReset = type === 'recovery' || next === '/auth/reset-password';
          
          if (isPasswordReset) {
            console.log('Password recovery flow detected, redirecting to reset page');
            return NextResponse.redirect(`${origin}/auth/reset-password?from_email=true&type=recovery`);
          }
          
          // Regular login flow
          return NextResponse.redirect(`${origin}${next}`);
        }
      } else {
        console.error('Error exchanging code for session:', error);
        return NextResponse.redirect(`${origin}/login?error=invalid_link`);
      }
    } catch (err) {
      console.error('Unexpected error in auth callback:', err);
      return NextResponse.redirect(`${origin}/login?error=unexpected_error`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=invalid_link`);
}