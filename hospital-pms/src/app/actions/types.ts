/**
 * Server Action Types
 * 서버 액션의 표준 응답 타입과 에러 타입을 정의합니다.
 */

import type { Database } from '@/types/database.types';

export type UserRole = Database['public']['Enums']['user_role'];

/**
 * 서버 액션 성공 응답
 */
export type ActionSuccess<T = unknown> = {
  success: true;
  data: T;
  message?: string;
};

/**
 * 서버 액션 실패 응답
 */
export type ActionError = {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, any>;
};

/**
 * 서버 액션 응답 타입
 */
export type ActionResponse<T = unknown> = ActionSuccess<T> | ActionError;

/**
 * 사용자 세션 정보
 */
export type UserSession = {
  user: {
    id: string;
    email: string;
    emailVerified: boolean;
    lastSignInAt?: string;
  };
  profile: {
    id: string;
    role: UserRole;
    name: string;
    department?: string | null;
    createdAt: string;
    updatedAt: string;
  };
  session: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    expiresAt: string;
  };
};

/**
 * 로그인 응답 데이터
 */
export type SignInResponse = {
  user: UserSession['user'];
  profile: UserSession['profile'];
  redirectTo?: string;
};

/**
 * 비밀번호 재설정 응답
 */
export type PasswordResetResponse = {
  email: string;
  message: string;
};

/**
 * 프로필 업데이트 데이터
 */
export type ProfileUpdateData = {
  name?: string;
  department?: string | null;
};

/**
 * 인증 에러 코드
 */
export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * 서버 액션 헬퍼 함수: 성공 응답 생성
 */
export function actionSuccess<T>(data: T, message?: string): ActionSuccess<T> {
  return {
    success: true,
    data,
    message,
  };
}

/**
 * 서버 액션 헬퍼 함수: 에러 응답 생성
 */
export function actionError(
  error: string,
  code?: string,
  details?: Record<string, any>
): ActionError {
  return {
    success: false,
    error,
    code,
    details,
  };
}