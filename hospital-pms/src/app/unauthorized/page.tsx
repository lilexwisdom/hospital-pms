'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, ArrowLeft, Home } from 'lucide-react';

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            접근 권한이 없습니다
          </CardTitle>
          <CardDescription className="text-gray-600 mt-2">
            요청하신 페이지에 접근할 권한이 없습니다.
            <br />
            필요한 권한이 있는지 확인해주세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">
              이 페이지에 접근하려면 다음 중 하나의 권한이 필요합니다:
            </p>
            <ul className="mt-2 text-sm text-gray-500 space-y-1">
              <li>• 관리자 (Admin)</li>
              <li>• 매니저 (Manager)</li>
              <li>• 상담원 (CS)</li>
              <li>• 사업개발 (BD)</li>
            </ul>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              이전 페이지로 돌아가기
            </Button>
            
            <Button
              onClick={() => router.push('/')}
              className="w-full"
            >
              <Home className="w-4 h-4 mr-2" />
              홈으로 이동
            </Button>
          </div>
          
          <p className="text-xs text-center text-gray-500 mt-4">
            문제가 지속되면 시스템 관리자에게 문의하세요.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}