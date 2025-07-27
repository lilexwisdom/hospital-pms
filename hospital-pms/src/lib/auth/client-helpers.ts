'use client';

import { createClient } from '@/lib/supabase/client';
import { AUTH_SESSION_CONFIG, AUTH_REDIRECTS, getAuthErrorMessage } from '@/config/auth';
import type { User, Session } from '@supabase/supabase-js';

/**
 * Client-side auth helper functions
 */

/**
 * Sign in with email and password (client-side)
 */
export async function signInWithEmail(email: string, password: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      error: getAuthErrorMessage(error),
      data: null,
    };
  }

  return { data, error: null };
}

/**
 * Sign up with email and password (client-side)
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  metadata?: {
    name: string;
    role: string;
    department?: string;
  }
) {
  const supabase = createClient();
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });

  if (error) {
    return {
      error: getAuthErrorMessage(error),
      data: null,
    };
  }

  return { data, error: null };
}

/**
 * Sign out (client-side)
 */
export async function signOut() {
  const supabase = createClient();
  
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    return {
      error: getAuthErrorMessage(error),
    };
  }

  return { error: null };
}

/**
 * Request password reset (client-side)
 */
export async function resetPassword(email: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
  });

  if (error) {
    return {
      error: getAuthErrorMessage(error),
      data: null,
    };
  }

  return { data, error: null };
}

/**
 * Update password (client-side)
 */
export async function updatePassword(newPassword: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return {
      error: getAuthErrorMessage(error),
      data: null,
    };
  }

  return { data, error: null };
}

/**
 * Verify OTP token from email (client-side)
 */
export async function verifyOtp(email: string, token: string, type: 'signup' | 'recovery') {
  const supabase = createClient();
  
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type,
  });

  if (error) {
    return {
      error: getAuthErrorMessage(error),
      data: null,
    };
  }

  return { data, error: null };
}

// Session management helpers
// ==========================

/**
 * Check if session is about to expire
 */
export function isSessionExpiringSoon(session: Session | null): boolean {
  if (!session) return false;
  
  // expires_at is a Unix timestamp in seconds, convert to milliseconds
  const expiresAt = (session.expires_at || 0) * 1000;
  const now = Date.now();
  const timeUntilExpiry = expiresAt - now;
  
  // Show warning when less than 30 minutes remaining
  return timeUntilExpiry < 30 * 60 * 1000; // 30 minutes before expiry
}

/**
 * Calculate remaining session time
 */
export function getSessionRemainingTime(session: Session | null): number {
  if (!session) return 0;
  
  // expires_at is a Unix timestamp in seconds, convert to milliseconds
  const expiresAt = (session.expires_at || 0) * 1000;
  const now = Date.now();
  const remaining = expiresAt - now;
  
  return Math.max(0, remaining);
}

/**
 * Format session remaining time for display
 */
export function formatSessionTime(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}시간 ${minutes % 60}분`;
  }
  
  if (minutes > 0) {
    return `${minutes}분`;
  }
  
  return '만료됨';
}

// Email verification helpers
// ==========================

/**
 * Resend verification email
 */
export async function resendVerificationEmail(email: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase.auth.resend({
    type: 'signup',
    email,
  });

  if (error) {
    return {
      error: getAuthErrorMessage(error),
      data: null,
    };
  }

  return { data, error: null };
}

/**
 * Check if email is verified
 */
export function isEmailVerified(user: User | null): boolean {
  if (!user) return false;
  return user.email_confirmed_at !== null;
}

// User metadata helpers
// =====================

/**
 * Get user metadata
 */
export function getUserMetadata(user: User | null) {
  if (!user) return null;
  
  return {
    name: user.user_metadata?.name || '',
    role: user.user_metadata?.role || '',
    department: user.user_metadata?.department || '',
  };
}

/**
 * Update user metadata
 */
export async function updateUserMetadata(metadata: Record<string, any>) {
  const supabase = createClient();
  
  const { data, error } = await supabase.auth.updateUser({
    data: metadata,
  });

  if (error) {
    return {
      error: getAuthErrorMessage(error),
      data: null,
    };
  }

  return { data, error: null };
}

// Security helpers
// ================

/**
 * Validate auth callback URL
 */
export function isValidRedirectUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const appUrl = new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
    
    // Only allow redirects to same origin
    return parsed.origin === appUrl.origin;
  } catch {
    return false;
  }
}

/**
 * Get safe redirect URL
 */
export function getSafeRedirectUrl(url?: string | null, defaultUrl: string = AUTH_REDIRECTS.SIGN_IN_SUCCESS): string {
  if (!url) return defaultUrl;
  
  return isValidRedirectUrl(url) ? url : defaultUrl;
}

/**
 * Generate secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return token;
}

// Auth state helpers
// ==================

/**
 * Auth state change handler type
 */
export type AuthStateHandler = (event: 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | 'USER_UPDATED', session: Session | null) => void;

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(handler: AuthStateHandler) {
  const supabase = createClient();
  
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    handler(event, session);
  });

  return subscription;
}

// Error recovery helpers
// ======================

/**
 * Handle auth error with recovery options
 */
export function getAuthErrorRecovery(error: string) {
  const recoveryOptions: Record<string, { action: string; link?: string }> = {
    '이메일 인증이 필요합니다': {
      action: '이메일 재전송',
      link: '/auth/resend-verification',
    },
    '세션이 만료되었습니다': {
      action: '다시 로그인',
      link: '/auth/login',
    },
    '비밀번호가 올바르지 않습니다': {
      action: '비밀번호 재설정',
      link: '/auth/forgot-password',
    },
  };

  for (const [key, recovery] of Object.entries(recoveryOptions)) {
    if (error.includes(key)) {
      return recovery;
    }
  }

  return null;
}