'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Check if this is a password reset redirect from Supabase
    const code = searchParams.get('code');
    const type = searchParams.get('type');
    const error = searchParams.get('error');
    const errorCode = searchParams.get('error_code');
    
    // Handle error cases
    if (error && errorCode) {
      console.error('Password reset error:', error, errorCode);
      router.push(`/reset-password?error=${error}&error_code=${errorCode}`);
      return;
    }
    
    // Handle password reset code - 홈페이지에서는 처리하지 않음
    // 이메일 링크는 직접 /api/auth/callback으로 가야 함
    
    // Check URL hash for Supabase auth tokens
    if (typeof window !== 'undefined' && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const type = hashParams.get('type');
      
      if (accessToken && type === 'recovery') {
        // For recovery, we need to handle it differently
        // The actual password update will happen after the user submits the new password
        router.push('/auth/reset-password?type=recovery&from_email=true');
      }
    }
  }, [searchParams, router]);

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-8 text-4xl font-bold">Hospital Patient Management System</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Welcome to the Hospital Patient Management System.
        </p>
      </div>
    </main>
  );
}
