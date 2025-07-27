'use client';

import { useState, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { ActionResponse } from '@/app/actions/types';

type ServerActionFunction<TInput, TOutput> = (
  input: TInput
) => Promise<ActionResponse<TOutput>>;

interface UseServerActionOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  redirectTo?: string;
}

/**
 * 서버 액션을 편리하게 사용하기 위한 커스텀 훅
 * 
 * @example
 * const { execute, isPending, error } = useServerAction(signIn, {
 *   onSuccess: (data) => {
 *     console.log('로그인 성공:', data);
 *     router.push('/dashboard');
 *   },
 *   onError: (error) => {
 *     toast.error(error);
 *   }
 * });
 * 
 * // FormData를 사용하는 경우
 * <form action={execute}>
 * 
 * // 일반 함수로 사용하는 경우
 * await execute(formData);
 */
export function useServerAction<TInput = FormData, TOutput = unknown>(
  action: ServerActionFunction<TInput, TOutput>,
  options?: UseServerActionOptions
) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TOutput | null>(null);

  const execute = useCallback(
    async (input: TInput) => {
      setError(null);
      setData(null);

      try {
        const result = await action(input);

        if (result.success) {
          setData(result.data);
          
          // 성공 콜백 실행
          options?.onSuccess?.(result.data);
          
          // 리다이렉트 처리
          if (options?.redirectTo) {
            startTransition(() => {
              router.push(options.redirectTo!);
            });
          }
          
          return result;
        } else {
          setError(result.error);
          
          // 에러 콜백 실행
          options?.onError?.(result.error);
          
          return result;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다';
        setError(errorMessage);
        
        // 에러 콜백 실행
        options?.onError?.(errorMessage);
        
        return {
          success: false,
          error: errorMessage,
        } as ActionResponse<TOutput>;
      }
    },
    [action, options, router]
  );

  // Form action으로 사용할 수 있도록 래핑
  const formAction = useCallback(
    (formData: FormData) => {
      startTransition(() => {
        execute(formData as TInput);
      });
    },
    [execute]
  );

  return {
    execute,
    formAction,
    isPending,
    error,
    data,
    isError: !!error,
    isSuccess: !!data,
  };
}

/**
 * 여러 서버 액션을 순차적으로 실행하는 훅
 * 
 * @example
 * const { executeAll, isPending, errors } = useServerActionChain([
 *   { action: validateUser, input: { userId } },
 *   { action: updateProfile, input: profileData },
 *   { action: sendNotification, input: { message } }
 * ]);
 */
export function useServerActionChain<T extends Array<{ action: any; input: any }>>(
  actions: T,
  options?: UseServerActionOptions
) {
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<(string | null)[]>([]);
  const [results, setResults] = useState<any[]>([]);

  const executeAll = useCallback(async () => {
    setErrors([]);
    setResults([]);

    const newErrors: (string | null)[] = [];
    const newResults: any[] = [];

    startTransition(async () => {
      for (let i = 0; i < actions.length; i++) {
        const { action, input } = actions[i];
        
        try {
          const result = await action(input);
          
          if (result.success) {
            newResults.push(result.data);
            newErrors.push(null);
          } else {
            newErrors.push(result.error);
            newResults.push(null);
            
            // 에러 발생 시 체인 중단
            break;
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다';
          newErrors.push(errorMessage);
          newResults.push(null);
          break;
        }
      }

      setErrors(newErrors);
      setResults(newResults);

      // 모든 액션이 성공한 경우
      if (newErrors.every(err => err === null)) {
        options?.onSuccess?.(newResults);
      } else {
        // 에러가 있는 경우
        const firstError = newErrors.find(err => err !== null);
        if (firstError) {
          options?.onError?.(firstError);
        }
      }
    });
  }, [actions, options]);

  return {
    executeAll,
    isPending,
    errors,
    results,
    hasError: errors.some(err => err !== null),
    isAllSuccess: errors.length === actions.length && errors.every(err => err === null),
  };
}