'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSurveyToken } from '@/hooks/useSurveyToken';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { SurveyForm } from '@/components/survey/survey-form';

export default function SurveyPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const { loading, valid, tokenData, error } = useSurveyToken(token);

  // Auto-save functionality
  const [savedData, setSavedData] = useState<any>(null);
  
  useEffect(() => {
    // Load saved data from localStorage if exists
    if (tokenData?.token) {
      const saved = localStorage.getItem(`survey_${tokenData.token}`);
      if (saved) {
        setSavedData(JSON.parse(saved));
      }
    }
  }, [tokenData]);

  const handleAutoSave = useCallback((data: any) => {
    if (tokenData?.token) {
      localStorage.setItem(`survey_${tokenData.token}`, JSON.stringify(data));
    }
  }, [tokenData]);

  const handleComplete = useCallback(() => {
    // Clear saved data on successful completion
    if (tokenData?.token) {
      localStorage.removeItem(`survey_${tokenData.token}`);
    }
    router.push('/survey/complete');
  }, [tokenData, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-medical flex items-center justify-center p-4">
        <Card className="p-8">
          <LoadingSpinner className="mx-auto" />
          <p className="text-center mt-4 text-muted-foreground">설문을 불러오는 중...</p>
        </Card>
      </div>
    );
  }

  if (error || !valid) {
    return (
      <div className="min-h-screen bg-gradient-medical flex items-center justify-center p-4">
        <Card className="max-w-md p-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || '유효하지 않은 설문 링크입니다.'}
            </AlertDescription>
          </Alert>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-medical py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">환자 정보 설문</h1>
          <p className="text-muted-foreground">
            정확한 진료를 위해 아래 정보를 입력해주세요
          </p>
        </div>

        <SurveyForm
          token={token}
          tokenData={tokenData}
          savedData={savedData}
          onAutoSave={handleAutoSave}
          onComplete={handleComplete}
        />
      </div>
    </div>
  );
}