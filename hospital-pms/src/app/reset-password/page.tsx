'use client';

import { useState } from 'react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ArrowLeft, Loader2, Mail } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useServerAction } from '@/hooks/use-server-action';
import { resetPasswordRequest } from '@/app/actions/auth';
import { AlertCircle } from 'lucide-react';

const resetPasswordSchema = z.object({
  email: z.string().email('유효한 이메일 주소를 입력해주세요'),
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const { execute, isPending, error } = useServerAction(resetPasswordRequest, {
    onSuccess: (data) => {
      setSubmitted(true);
      setSubmittedEmail(data.email);
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    const formData = new FormData();
    formData.set('email', data.email);
    
    await execute(formData);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Mail className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">
              이메일을 확인해주세요
            </CardTitle>
            <CardDescription className="text-center">
              비밀번호 재설정 링크를 발송했습니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertTitle>이메일 발송 완료</AlertTitle>
              <AlertDescription>
                <strong>{submittedEmail}</strong>로 비밀번호 재설정 링크를 발송했습니다.
                <br />
                이메일을 확인하여 비밀번호를 재설정해주세요.
              </AlertDescription>
            </Alert>
            
            <div className="text-sm text-muted-foreground space-y-2">
              <p>• 이메일이 도착하지 않았다면 스팸함을 확인해주세요</p>
              <p>• 몇 분 후에도 이메일이 오지 않는다면 다시 시도해주세요</p>
              <p>• 등록된 이메일 주소가 맞는지 확인해주세요</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setSubmitted(false);
                form.reset();
              }}
            >
              다시 시도하기
            </Button>
            <Button asChild className="w-full">
              <Link href="/login">
                로그인 페이지로 돌아가기
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Mail className="w-6 h-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            비밀번호 재설정
          </CardTitle>
          <CardDescription className="text-center">
            가입하신 이메일 주소를 입력하시면
            <br />
            비밀번호 재설정 링크를 보내드립니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {process.env.NODE_ENV === 'development' && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>개발 환경 안내</AlertTitle>
                  <AlertDescription className="space-y-2 text-sm">
                    <p>Supabase 무료 플랜은 시간당 3-4개의 이메일만 발송 가능합니다.</p>
                    <p className="font-medium">대안:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Supabase 대시보드에서 직접 Magic Link 생성</li>
                      <li><Link href="/dev/reset-password-test" className="underline text-primary">개발용 테스트 페이지</Link> 사용</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>이메일 주소</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="name@hospital.com"
                        autoComplete="email"
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    발송 중...
                  </>
                ) : (
                  '비밀번호 재설정 링크 받기'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter>
          <Button
            asChild
            variant="ghost"
            className="w-full"
          >
            <Link href="/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              로그인 페이지로 돌아가기
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}