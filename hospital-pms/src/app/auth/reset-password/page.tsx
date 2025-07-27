'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ArrowLeft, Loader2, Lock, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PasswordInput } from '@/components/auth/password-input';
import { useServerAction } from '@/hooks/use-server-action';
import { updatePasswordWithToken } from '@/app/actions/auth';
import type { PasswordValidationResult } from '@/lib/auth/password-validation';

const resetPasswordConfirmSchema = z.object({
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['confirmPassword'],
});

type ResetPasswordConfirmFormData = z.infer<typeof resetPasswordConfirmSchema>;

export default function ResetPasswordConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const type = searchParams.get('type');
  
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidationResult>({
    isValid: false,
    errors: [],
    strength: 'weak',
    score: 0,
  });
  const [success, setSuccess] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const fromEmail = searchParams.get('from_email');

  const form = useForm<ResetPasswordConfirmFormData>({
    resolver: zodResolver(resetPasswordConfirmSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  // Verify the code and exchange it for a session
  useEffect(() => {
    const verifyCode = async () => {
      const supabase = createClient();
      
      // Check if we have a hash fragment (Supabase email link format)
      if (typeof window !== 'undefined' && window.location.hash) {
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
            setVerificationError('세션 설정에 실패했습니다');
          } else {
            // Clear the hash from URL
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
          }
          
          setIsVerifying(false);
          return;
        }
      }
      
      // If coming from email link with hash fragment
      if (fromEmail && type === 'recovery') {
        // Check if user is already authenticated from the email link
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          setVerificationError('비밀번호 재설정 링크가 만료되었습니다. 다시 요청해주세요.');
        }
        
        setIsVerifying(false);
        return;
      }
      
      // If we have a code, we'll use it for password update
      if (code) {
        console.log('Password reset code received:', code);
        // Don't try to exchange the code here due to PKCE requirements
        // Just verify it's present and allow user to enter new password
        setIsVerifying(false);
        return;
      } else if (!fromEmail) {
        // No code and not from email
        setVerificationError('유효하지 않은 재설정 링크입니다');
        setIsVerifying(false);
      }
    };

    verifyCode();
  }, [code, type, fromEmail]);

  const { execute, isPending, error } = useServerAction(updatePasswordWithToken, {
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    },
  });

  const onSubmit = async (data: ResetPasswordConfirmFormData) => {
    if (!passwordValidation.isValid) {
      form.setError('password', { message: '비밀번호 요구사항을 충족해주세요' });
      return;
    }

    const formData = new FormData();
    formData.set('token', code || ''); // Use code as token
    formData.set('password', data.password);
    formData.set('type', 'recovery');
    
    await execute(formData);
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">재설정 링크 확인 중...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verificationError || (!code && !fromEmail)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-destructive">
              잘못된 접근
            </CardTitle>
            <CardDescription className="text-center">
              {verificationError || '유효하지 않은 비밀번호 재설정 링크입니다'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>
                비밀번호 재설정 링크가 유효하지 않거나 만료되었습니다.
                <br />
                다시 비밀번호 재설정을 요청해주세요.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/reset-password">
                비밀번호 재설정 요청하기
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">
              비밀번호 재설정 완료
            </CardTitle>
            <CardDescription className="text-center">
              비밀번호가 성공적으로 변경되었습니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                잠시 후 로그인 페이지로 이동합니다.
                <br />
                새로운 비밀번호로 로그인해주세요.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/login">
                지금 로그인하기
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
              <Lock className="w-6 h-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            새 비밀번호 설정
          </CardTitle>
          <CardDescription className="text-center">
            새로운 비밀번호를 입력해주세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>새 비밀번호</FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder="••••••••"
                        autoComplete="new-password"
                        disabled={isPending}
                        showStrength={true}
                        showRequirements={true}
                        onValidationChange={setPasswordValidation}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>비밀번호 확인</FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder="••••••••"
                        autoComplete="new-password"
                        disabled={isPending}
                        showStrength={false}
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
                disabled={isPending || !passwordValidation.isValid}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    비밀번호 재설정 중...
                  </>
                ) : (
                  '비밀번호 재설정'
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