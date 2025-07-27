'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';

export default function ErrorPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            인증 오류가 발생했습니다
          </CardTitle>
          <CardDescription className="text-gray-600 mt-2">
            로그인 처리 중 문제가 발생했습니다.
            <br />
            다시 시도하거나 관리자에게 문의해주세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              일시적인 오류일 수 있습니다. 잠시 후 다시 시도해주세요.
            </p>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => router.push('/login')}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              다시 로그인하기
            </Button>
            
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              이전 페이지로 돌아가기
            </Button>
          </div>
          
          <div className="text-center pt-4 border-t">
            <p className="text-xs text-gray-500">
              오류가 지속되면 다음 정보와 함께 관리자에게 문의하세요:
            </p>
            <code className="text-xs bg-gray-100 px-2 py-1 rounded mt-2 inline-block">
              Error: AUTH_SESSION_ERROR
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}