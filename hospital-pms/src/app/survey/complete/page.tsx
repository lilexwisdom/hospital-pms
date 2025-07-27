'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Home, FileText } from 'lucide-react';
import Link from 'next/link';

export default function SurveyCompletePage() {
  const searchParams = useSearchParams();
  const [showDetails, setShowDetails] = useState(false);
  
  const patientId = searchParams.get('patientId');
  const responseId = searchParams.get('responseId');
  const isNewPatient = searchParams.get('isNewPatient') === 'true';
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
            <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">설문이 완료되었습니다!</CardTitle>
          <CardDescription className="text-lg mt-2">
            소중한 시간을 내어 설문에 참여해 주셔서 감사합니다
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              {isNewPatient ? (
                <>귀하의 정보가 안전하게 저장되었으며, 곧 담당자가 연락드릴 예정입니다.</>
              ) : (
                <>귀하의 정보가 업데이트되었습니다.</>
              )}
            </p>
            <p className="text-sm text-muted-foreground">
              문의사항이 있으시면 언제든지 연락 주시기 바랍니다.
            </p>
          </div>
          
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm font-medium mb-2">다음 단계</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• 담당자가 1-2일 내 연락드립니다</li>
              <li>• 진료 예약 일정을 안내해드립니다</li>
              <li>• 추가 문의사항을 상담해드립니다</li>
            </ul>
          </div>
          
          {(patientId || responseId) && (
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => setShowDetails(!showDetails)}
              >
                <span>참조 번호 {showDetails ? '숨기기' : '보기'}</span>
                <FileText className="h-4 w-4" />
              </Button>
              
              {showDetails && (
                <div className="bg-muted/30 rounded-lg p-4 space-y-2 text-sm">
                  {patientId && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">환자 ID:</span>
                      <span className="font-mono text-xs">{patientId}</span>
                    </div>
                  )}
                  {responseId && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">응답 ID:</span>
                      <span className="font-mono text-xs">{responseId}</span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    * 이 번호는 문의 시 참조용으로 사용될 수 있습니다
                  </p>
                </div>
              )}
            </div>
          )}
          
          <div className="pt-4 space-y-3">
            <Link href="/" className="block">
              <Button className="w-full" size="lg">
                <Home className="mr-2 h-4 w-4" />
                홈으로 돌아가기
              </Button>
            </Link>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                병원 연락처: <a href="tel:02-1234-5678" className="text-primary hover:underline">02-1234-5678</a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}