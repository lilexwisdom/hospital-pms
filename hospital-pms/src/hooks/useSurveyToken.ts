'use client';

import { useState, useEffect } from 'react';
import { validateSurveyToken, type TokenValidationResult } from '@/app/actions/survey-token';
import { useRouter } from 'next/navigation';

interface UseSurveyTokenReturn {
  loading: boolean;
  valid: boolean;
  tokenData: TokenValidationResult['token'] | null;
  error: string | null;
}

export function useSurveyToken(token: string): UseSurveyTokenReturn {
  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [tokenData, setTokenData] = useState<TokenValidationResult['token'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkToken = async () => {
      if (!token) {
        setError('토큰이 제공되지 않았습니다');
        setLoading(false);
        return;
      }

      try {
        const result = await validateSurveyToken(token);
        
        if (result.success) {
          if (result.data.valid) {
            setValid(true);
            setTokenData(result.data.token || null);
          } else {
            setError(result.data.reason || '유효하지 않은 토큰입니다');
            
            // Redirect to error page with reason
            const reason = result.data.reason?.includes('만료') ? 'expired' : 
                         result.data.reason?.includes('사용') ? 'used' : 'invalid';
            router.push(`/survey/error?reason=${reason}`);
          }
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError('토큰 검증 중 오류가 발생했습니다');
      } finally {
        setLoading(false);
      }
    };

    checkToken();
  }, [token, router]);

  return { loading, valid, tokenData, error };
}