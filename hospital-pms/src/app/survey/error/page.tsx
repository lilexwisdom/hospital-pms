'use client';

import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Clock, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function SurveyErrorPage() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');

  const errorConfig = {
    expired: {
      icon: Clock,
      title: '설문 링크가 만료되었습니다',
      description: '이 설문 링크는 유효 기간이 지났습니다. 병원에 문의하여 새로운 링크를 받아주세요.',
      iconColor: 'text-yellow-500',
    },
    used: {
      icon: CheckCircle2,
      title: '이미 완료된 설문입니다',
      description: '이 설문은 이미 제출되었습니다. 추가 설문이 필요한 경우 병원에 문의해주세요.',
      iconColor: 'text-green-500',
    },
    invalid: {
      icon: XCircle,
      title: '유효하지 않은 설문 링크입니다',
      description: '올바르지 않은 설문 링크입니다. 받으신 링크를 다시 확인해주세요.',
      iconColor: 'text-red-500',
    },
  };

  const config = errorConfig[reason as keyof typeof errorConfig] || errorConfig.invalid;
  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-gradient-medical flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-muted p-4">
            <Icon className={`h-8 w-8 ${config.iconColor}`} />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold mb-3">{config.title}</h1>
        <p className="text-muted-foreground mb-8">{config.description}</p>
        
        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link href="/">홈으로 돌아가기</Link>
          </Button>
          
          <p className="text-sm text-muted-foreground">
            문의사항이 있으신가요?{' '}
            <a href="tel:02-1234-5678" className="text-primary hover:underline">
              02-1234-5678
            </a>
          </p>
        </div>
      </Card>
    </div>
  );
}