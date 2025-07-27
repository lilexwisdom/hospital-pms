'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

// 개발 환경에서만 사용하는 테스트 페이지
export default function DevResetPasswordTest() {
  const router = useRouter();
  const [code, setCode] = useState('');

  const handleTestRedirect = () => {
    if (code) {
      // 실제 이메일 링크를 시뮬레이션
      router.push(`/?code=${code}`);
    }
  };

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>개발용 비밀번호 재설정 테스트</CardTitle>
          <CardDescription>
            Rate limit을 피하기 위한 개발 환경 전용 페이지
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              1. Supabase 대시보드에서 Authentication → Logs 확인<br />
              2. 최근 password recovery 이메일의 코드 복사<br />
              3. 아래에 붙여넣고 테스트
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">재설정 코드</label>
            <Input
              placeholder="예: f7fd5862-3a60-4e05-b7a5-168d6145b5d5"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
          
          <Button 
            onClick={handleTestRedirect}
            className="w-full"
            disabled={!code}
          >
            비밀번호 재설정 페이지로 이동
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}