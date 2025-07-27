'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, Lock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PasswordInput } from '@/components/auth/password-input';
import { useServerAction } from '@/hooks/use-server-action';
import { signIn } from '@/app/actions/auth';

const loginSchema = z.object({
  email: z.string().email('유효한 이메일 주소를 입력해주세요'),
  password: z.string().min(1, '비밀번호를 입력해주세요'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';
  const code = searchParams.get('code');
  
  useEffect(() => {
    // Check if this is a password reset callback
    if (code && redirectTo === '/api/auth/callback') {
      // Redirect to the callback with the code
      router.push(`/api/auth/callback?code=${code}`);
    }
  }, [code, redirectTo, router]);
  

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const { execute, isPending, error } = useServerAction(signIn, {
    onSuccess: (data) => {
      router.push(data.redirectTo || redirectTo);
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    console.log('Login form submitted:', data);
    const formData = new FormData();
    formData.set('email', data.email);
    formData.set('password', data.password);
    formData.set('redirectTo', redirectTo);
    
    try {
      const result = await execute(formData);
      console.log('Login result:', result);
    } catch (err) {
      console.error('Login error:', err);
    }
  };

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
            Hospital PMS 로그인
          </CardTitle>
          <CardDescription className="text-center">
            이메일과 비밀번호를 입력하여 로그인하세요
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>이메일</FormLabel>
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

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>비밀번호</FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder="••••••••"
                        autoComplete="current-password"
                        disabled={isPending}
                        showStrength={false}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-end">
                <Link
                  href="/reset-password"
                  className="text-sm text-primary hover:underline"
                >
                  비밀번호를 잊으셨나요?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    로그인 중...
                  </>
                ) : (
                  '로그인'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-muted-foreground">
            Hospital Patient Management System
          </div>
          <div className="text-xs text-center text-muted-foreground">
            로그인에 문제가 있으신가요?{' '}
            <Link href="/contact" className="text-primary hover:underline">
              관리자에게 문의
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}