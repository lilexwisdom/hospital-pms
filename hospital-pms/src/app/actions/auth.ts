'use server';

import { z } from 'zod';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createActionClient } from '@/lib/supabase/server';
import { validatePassword } from '@/lib/auth/password-validation';
import { AUTH_ERROR_MESSAGES } from '@/config/auth';
import { 
  actionSuccess, 
  actionError, 
  AuthErrorCode,
  type ActionResponse, 
  type SignInResponse, 
  type UserSession,
  type PasswordResetResponse,
} from './types';

/**
 * 입력 검증 스키마
 */
const signInSchema = z.object({
  email: z.string().email('유효한 이메일 주소를 입력해주세요'),
  password: z.string().min(1, '비밀번호를 입력해주세요'),
  redirectTo: z.string().optional(),
});

const signUpSchema = z.object({
  email: z.string().email('유효한 이메일 주소를 입력해주세요'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다'),
  name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다'),
  role: z.enum(['admin', 'manager', 'bd', 'cs']).default('cs'),
  department: z.string().optional(),
});

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, '현재 비밀번호를 입력해주세요'),
  newPassword: z.string().min(8, '새 비밀번호는 최소 8자 이상이어야 합니다'),
});

const resetPasswordSchema = z.object({
  email: z.string().email('유효한 이메일 주소를 입력해주세요'),
});

const updatePasswordWithTokenSchema = z.object({
  token: z.string().min(1, '토큰이 필요합니다'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다'),
  type: z.string().optional(),
});

/**
 * 로그인 서버 액션
 */
export async function signIn(
  formData: FormData
): Promise<ActionResponse<SignInResponse>> {
  try {
    const supabase = await createActionClient();
    
    // 입력 검증
    const validatedData = signInSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
      redirectTo: formData.get('redirectTo'),
    });

    // Supabase 로그인
    console.log('Attempting login for:', validatedData.email);
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    });

    if (authError) {
      console.error('Auth error:', authError);
      // 에러 메시지를 한국어로 변환
      const errorMessage = AUTH_ERROR_MESSAGES[authError.message as keyof typeof AUTH_ERROR_MESSAGES] || AUTH_ERROR_MESSAGES.UNKNOWN_ERROR;
      return actionError(errorMessage, AuthErrorCode.INVALID_CREDENTIALS);
    }

    if (!authData.user) {
      return actionError(AUTH_ERROR_MESSAGES.UNKNOWN_ERROR, AuthErrorCode.UNKNOWN_ERROR);
    }

    // 사용자 프로필 조회
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      return actionError('프로필 정보를 불러올 수 없습니다', AuthErrorCode.UNKNOWN_ERROR);
    }

    // 감사 로그 기록
    await supabase.from('audit_logs').insert({
      user_id: authData.user.id,
      action: 'sign_in',
      resource_type: 'auth',
      resource_id: authData.user.id,
      changes: {
        email: authData.user.email,
        role: profile.role,
        signInAt: new Date().toISOString(),
      },
    });

    const response: SignInResponse = {
      user: {
        id: authData.user.id,
        email: authData.user.email!,
        emailVerified: !!authData.user.email_confirmed_at,
        lastSignInAt: authData.user.last_sign_in_at,
      },
      profile: {
        id: profile.id,
        role: profile.role,
        name: profile.name,
        department: profile.department,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
      },
      redirectTo: validatedData.redirectTo,
    };

    return actionSuccess(response, '로그인에 성공했습니다');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return actionError(
        error.issues[0].message,
        AuthErrorCode.INVALID_CREDENTIALS
      );
    }
    
    console.error('SignIn error:', error);
    return actionError(AUTH_ERROR_MESSAGES.UNKNOWN_ERROR, AuthErrorCode.UNKNOWN_ERROR);
  }
}

/**
 * 로그아웃 서버 액션
 */
export async function signOut(): Promise<ActionResponse<null>> {
  console.log('SignOut action called');
  try {
    const supabase = await createActionClient();
    
    // 현재 사용자 정보 가져오기 (감사 로그용)
    const { data: { user } } = await supabase.auth.getUser();
    
    // 로그아웃 처리
    const { error } = await supabase.auth.signOut();

    if (error) {
      return actionError('로그아웃 중 오류가 발생했습니다', AuthErrorCode.UNKNOWN_ERROR);
    }

    // 감사 로그 기록 (사용자 정보가 있는 경우)
    if (user) {
      try {
        await supabase.from('audit_logs').insert({
          user_id: user.id,
          action: 'sign_out',
          table_name: 'auth',
          new_data: {
            signOutAt: new Date().toISOString(),
          },
        });
      } catch (err) {
        console.error('Failed to log sign out:', err);
      }
    }

    return actionSuccess(null, '로그아웃되었습니다');
  } catch (error) {
    console.error('SignOut error:', error);
    return actionError('로그아웃 중 오류가 발생했습니다', AuthErrorCode.UNKNOWN_ERROR);
  }
}

/**
 * 현재 세션 조회 서버 액션
 */
export async function getSession(): Promise<ActionResponse<UserSession | null>> {
  try {
    const supabase = await createActionClient();
    
    // 세션 정보 조회
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return actionSuccess(null);
    }

    // 사용자 정보 조회
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return actionSuccess(null);
    }

    // 프로필 정보 조회
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return actionSuccess(null);
    }

    const userSession: UserSession = {
      user: {
        id: user.id,
        email: user.email!,
        emailVerified: !!user.email_confirmed_at,
        lastSignInAt: user.last_sign_in_at,
      },
      profile: {
        id: profile.id,
        role: profile.role,
        name: profile.name,
        department: profile.department,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
      },
      session: {
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        expiresIn: session.expires_in || 0,
        expiresAt: new Date(session.expires_at || 0).toISOString(),
      },
    };

    return actionSuccess(userSession);
  } catch (error) {
    console.error('GetSession error:', error);
    return actionError('세션 정보를 불러올 수 없습니다', AuthErrorCode.UNKNOWN_ERROR);
  }
}

/**
 * 비밀번호 변경 서버 액션
 */
export async function updatePassword(
  formData: FormData
): Promise<ActionResponse<null>> {
  try {
    const supabase = await createActionClient();
    
    // 입력 검증
    const validatedData = updatePasswordSchema.parse({
      currentPassword: formData.get('currentPassword'),
      newPassword: formData.get('newPassword'),
    });

    // 비밀번호 정책 검증
    const passwordValidation = validatePassword(validatedData.newPassword);
    if (!passwordValidation.isValid) {
      return actionError(
        passwordValidation.errors.join(', '),
        AuthErrorCode.INVALID_CREDENTIALS
      );
    }

    // 현재 사용자 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return actionError('인증이 필요합니다', AuthErrorCode.UNAUTHORIZED);
    }

    // 현재 비밀번호 확인 (재로그인)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: validatedData.currentPassword,
    });

    if (signInError) {
      return actionError('현재 비밀번호가 올바르지 않습니다', AuthErrorCode.INVALID_CREDENTIALS);
    }

    // 비밀번호 업데이트
    const { error: updateError } = await supabase.auth.updateUser({
      password: validatedData.newPassword,
    });

    if (updateError) {
      return actionError('비밀번호 변경에 실패했습니다', AuthErrorCode.UNKNOWN_ERROR);
    }

    // 감사 로그 기록
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'password_changed',
      table_name: 'auth',
      new_data: {
        changedAt: new Date().toISOString(),
      },
    });

    return actionSuccess(null, '비밀번호가 성공적으로 변경되었습니다');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return actionError(
        error.issues[0].message,
        AuthErrorCode.INVALID_CREDENTIALS
      );
    }
    
    console.error('UpdatePassword error:', error);
    return actionError('비밀번호 변경 중 오류가 발생했습니다', AuthErrorCode.UNKNOWN_ERROR);
  }
}

/**
 * 비밀번호 재설정 요청 서버 액션
 */
export async function resetPasswordRequest(
  formData: FormData
): Promise<ActionResponse<PasswordResetResponse>> {
  try {
    const supabase = await createActionClient();
    
    // 입력 검증
    const validatedData = resetPasswordSchema.parse({
      email: formData.get('email'),
    });

    // 비밀번호 재설정 이메일 발송
    const redirectUrl = process.env.NEXT_PUBLIC_APP_URL 
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback?type=recovery`
      : 'http://localhost:3000/api/auth/callback?type=recovery';
    
    console.log('Sending password reset email to:', validatedData.email);
    console.log('Redirect URL:', redirectUrl);
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(validatedData.email, {
      redirectTo: redirectUrl,
    });
    
    console.log('Reset password response:', { data, error });

    if (error) {
      console.error('Password reset email error:', error);
      // Rate limit 에러인 경우
      if (error.message.includes('rate limit') || error.status === 429 || error.code === 'over_email_send_rate_limit') {
        return actionError('너무 많은 요청이 있었습니다. 잠시 후 다시 시도해주세요.', AuthErrorCode.UNKNOWN_ERROR);
      }
      // 그 외의 경우에도 보안상 성공 메시지 반환
      // 하지만 개발 환경에서는 에러 로그 확인
    }

    return actionSuccess({
      email: validatedData.email,
      message: '입력하신 이메일로 비밀번호 재설정 링크를 발송했습니다',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return actionError(
        error.issues[0].message,
        AuthErrorCode.INVALID_CREDENTIALS
      );
    }
    
    console.error('ResetPasswordRequest error:', error);
    return actionError('비밀번호 재설정 요청 중 오류가 발생했습니다', AuthErrorCode.UNKNOWN_ERROR);
  }
}

/**
 * 현재 사용자 정보 조회 서버 액션
 */
export async function getCurrentUser(): Promise<ActionResponse<UserSession['user'] & UserSession['profile'] | null>> {
  try {
    const supabase = await createActionClient();
    
    // 사용자 정보 조회
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return actionSuccess(null);
    }

    // 프로필 정보 조회
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return actionSuccess(null);
    }

    const currentUser = {
      id: user.id,
      email: user.email!,
      emailVerified: !!user.email_confirmed_at,
      lastSignInAt: user.last_sign_in_at,
      role: profile.role,
      name: profile.name,
      department: profile.department,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    };

    return actionSuccess(currentUser);
  } catch (error) {
    console.error('GetCurrentUser error:', error);
    return actionError('사용자 정보를 불러올 수 없습니다', AuthErrorCode.UNKNOWN_ERROR);
  }
}

/**
 * 토큰을 사용한 비밀번호 재설정 서버 액션
 */
export async function updatePasswordWithToken(
  formData: FormData
): Promise<ActionResponse<null>> {
  try {
    const supabase = await createActionClient();
    
    // 입력 검증
    const validatedData = updatePasswordWithTokenSchema.parse({
      token: formData.get('token'),
      password: formData.get('password'),
      type: formData.get('type'),
    });

    // 비밀번호 정책 검증
    const passwordValidation = validatePassword(validatedData.password);
    if (!passwordValidation.isValid) {
      return actionError(
        passwordValidation.errors.join(', '),
        AuthErrorCode.INVALID_CREDENTIALS
      );
    }

    // Supabase의 비밀번호 재설정 플로우
    if (validatedData.type === 'recovery') {
      // 비밀번호 재설정 이메일 링크를 통해 들어온 경우
      // Supabase는 URL의 fragment (#access_token=...) 에 토큰을 포함시키므로
      // 클라이언트 사이드에서 처리해야 합니다
      
      // 현재 세션 확인
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('No authenticated user for password reset:', userError);
        // 토큰이 'authenticated'인 경우 더 자세한 메시지 제공
        if (validatedData.token === 'authenticated') {
          return actionError('인증이 필요합니다. 이메일의 재설정 링크를 통해 접속해주세요.', AuthErrorCode.SESSION_EXPIRED);
        }
        return actionError('비밀번호 재설정 링크가 만료되었습니다. 다시 요청해주세요.', AuthErrorCode.SESSION_EXPIRED);
      }
      
      // 비밀번호 업데이트
      const { error: updateError } = await supabase.auth.updateUser({
        password: validatedData.password,
      });

      if (updateError) {
        console.error('Password update error:', updateError);
        return actionError('비밀번호 재설정에 실패했습니다', AuthErrorCode.UNKNOWN_ERROR);
      }
    } else {
      // 다른 타입의 토큰 처리 (향후 확장 가능)
      return actionError('지원하지 않는 재설정 방식입니다', AuthErrorCode.INVALID_CREDENTIALS);
    }

    // 감사 로그 기록
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'password_reset',
        table_name: 'auth',
        new_data: {
          resetAt: new Date().toISOString(),
          method: 'email_token',
        },
      });
    }

    return actionSuccess(null, '비밀번호가 성공적으로 재설정되었습니다');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return actionError(
        error.issues[0].message,
        AuthErrorCode.INVALID_CREDENTIALS
      );
    }
    
    console.error('UpdatePasswordWithToken error:', error);
    return actionError('비밀번호 재설정 중 오류가 발생했습니다', AuthErrorCode.UNKNOWN_ERROR);
  }
}