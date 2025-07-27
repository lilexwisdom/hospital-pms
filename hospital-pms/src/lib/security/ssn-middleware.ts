import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { logSSNAccess } from './ssn-encryption';

// Roles that can decrypt SSN
const DECRYPT_ALLOWED_ROLES = ['admin', 'manager'];

// Roles that can view masked SSN
const VIEW_ALLOWED_ROLES = ['admin', 'manager', 'doctor', 'nurse', 'cs'];

export interface SSNAccessContext {
  userId: string;
  userRole: string;
  canDecrypt: boolean;
  canViewMasked: boolean;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Checks if user has permission to decrypt SSN
 */
export async function checkSSNDecryptPermission(
  request: NextRequest
): Promise<SSNAccessContext | null> {
  try {
    const supabase = await createServerClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return null;
    }
    
    // Get user profile with role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profileError || !profile) {
      return null;
    }
    
    const userRole = profile.role as string;
    
    return {
      userId: user.id,
      userRole,
      canDecrypt: DECRYPT_ALLOWED_ROLES.includes(userRole),
      canViewMasked: VIEW_ALLOWED_ROLES.includes(userRole),
      ipAddress: request.headers.get('x-forwarded-for') || request.ip,
      userAgent: request.headers.get('user-agent') || undefined
    };
  } catch (error) {
    console.error('Error checking SSN permissions:', error);
    return null;
  }
}

/**
 * Middleware to protect SSN decryption endpoints
 */
export async function ssnDecryptionMiddleware(
  request: NextRequest,
  handler: (req: NextRequest, context: SSNAccessContext) => Promise<NextResponse>
): Promise<NextResponse> {
  const context = await checkSSNDecryptPermission(request);
  
  if (!context) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  if (!context.canDecrypt) {
    // Log failed attempt
    await logSSNAccess({
      userId: context.userId,
      patientId: 'unknown', // Extract from request if available
      action: 'decrypt',
      timestamp: new Date(),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      success: false,
      errorMessage: 'Insufficient permissions'
    });
    
    return NextResponse.json(
      { error: '권한이 없습니다. 관리자 또는 매니저만 주민번호를 복호화할 수 있습니다.' },
      { status: 403 }
    );
  }
  
  // User has permission, proceed with handler
  return handler(request, context);
}

/**
 * Rate limiting for SSN access
 */
const accessAttempts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(userId: string, maxAttempts = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const userAttempts = accessAttempts.get(userId);
  
  if (!userAttempts || userAttempts.resetAt < now) {
    // Reset window
    accessAttempts.set(userId, {
      count: 1,
      resetAt: now + windowMs
    });
    return true;
  }
  
  if (userAttempts.count >= maxAttempts) {
    return false;
  }
  
  userAttempts.count++;
  return true;
}

/**
 * Clean up old rate limit entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [userId, attempts] of accessAttempts.entries()) {
    if (attempts.resetAt < now) {
      accessAttempts.delete(userId);
    }
  }
}, 300000); // Clean up every 5 minutes