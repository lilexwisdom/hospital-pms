'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function AuthConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      const supabase = createClient();
      
      // Check for code in query parameters (Supabase email format)
      const code = searchParams.get('code');
      const type = searchParams.get('type');
      
      if (code) {
        try {
          console.log('Found code in query params:', code);
          
          // For password reset, we need to handle this differently
          // The code from email cannot be exchanged directly due to PKCE requirements
          // Instead, we'll store the code and redirect to password reset page
          
          // Store the code in localStorage temporarily
          if (typeof window !== 'undefined') {
            localStorage.setItem('supabase_reset_code', code);
          }
          
          // Redirect to password reset page with the code
          router.push(`/auth/reset-password?code=${code}&type=recovery`);
        } catch (err) {
          console.error('Unexpected error:', err);
          router.push('/login?error=invalid_link');
        }
      } else {
        // Check for hash fragment (alternative Supabase format)
        if (window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          
          if (accessToken && refreshToken) {
            console.log('Found tokens in hash, setting session');
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            
            if (sessionError) {
              console.error('Failed to set session:', sessionError);
              router.push('/login?error=invalid_link');
              return;
            }
            
            // Check type from hash
            const hashType = hashParams.get('type');
            if (hashType === 'recovery') {
              router.push('/auth/reset-password?from_email=true&type=recovery');
            } else {
              router.push('/dashboard');
            }
          } else {
            console.error('No code or tokens found');
            router.push('/login?error=invalid_link');
          }
        } else {
          console.error('No code or hash fragment found');
          router.push('/login?error=invalid_link');
        }
      }
    };

    handleEmailConfirmation();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">인증 처리 중...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}