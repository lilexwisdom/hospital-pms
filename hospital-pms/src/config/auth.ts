/**
 * Auth configuration constants matching Supabase dashboard settings
 */

// Session configuration
export const AUTH_SESSION_CONFIG = {
  // Session duration in seconds (8 hours)
  SESSION_DURATION: 28800,
  // Session duration in milliseconds
  SESSION_DURATION_MS: 28800000,
  // JWT expiry (should match session duration)
  JWT_EXPIRY: 28800,
  // Remember me duration (30 days)
  REMEMBER_ME_DURATION_MS: 30 * 24 * 60 * 60 * 1000,
} as const;

// Password policy configuration
export const PASSWORD_POLICY = {
  MIN_LENGTH: 8,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBERS: true,
  REQUIRE_SPECIAL_CHARS: true,
  // Special characters allowed
  SPECIAL_CHARS: '!@#$%^&*()_+-=[]{}|;:,.<>?',
} as const;

// Auth rate limits
export const AUTH_RATE_LIMITS = {
  // Sign-up attempts per hour per IP
  SIGNUP_PER_HOUR: 5,
  // Sign-in attempts per hour per IP
  SIGNIN_PER_HOUR: 10,
  // Password reset attempts per hour per IP
  PASSWORD_RESET_PER_HOUR: 3,
  // Email verification resend per hour
  EMAIL_VERIFICATION_PER_HOUR: 3,
} as const;

// Auth error messages in Korean
export const AUTH_ERROR_MESSAGES = {
  // Supabase error code mappings
  'Invalid login credentials': '이메일 또는 비밀번호가 올바르지 않습니다.',
  'Email not confirmed': '이메일 인증이 필요합니다. 이메일을 확인해주세요.',
  'User already registered': '이미 등록된 이메일입니다.',
  'Password should be at least 8 characters': '비밀번호는 최소 8자 이상이어야 합니다.',
  'Invalid email': '올바른 이메일 형식이 아닙니다.',
  'User not found': '등록되지 않은 사용자입니다.',
  'Invalid password': '비밀번호가 정책에 맞지 않습니다.',
  'Too many requests': '너무 많은 요청이 있었습니다. 잠시 후 다시 시도해주세요.',
  'JWT expired': '세션이 만료되었습니다. 다시 로그인해주세요.',
  'Auth session missing': '인증 세션이 없습니다. 로그인해주세요.',
  
  // Custom error messages
  PASSWORD_MISMATCH: '비밀번호가 일치하지 않습니다.',
  WEAK_PASSWORD: '비밀번호가 너무 약합니다. 더 강한 비밀번호를 사용해주세요.',
  INVALID_TOKEN: '유효하지 않은 토큰입니다.',
  EXPIRED_TOKEN: '만료된 토큰입니다.',
  NETWORK_ERROR: '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.',
  UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다. IT 지원팀에 문의해주세요.',
} as const;

// Email template types
export const EMAIL_TEMPLATE_TYPES = {
  CONFIRMATION: 'confirmation',
  PASSWORD_RESET: 'password_reset',
  MAGIC_LINK: 'magic_link',
  EMAIL_CHANGE: 'email_change',
} as const;

// Auth redirect paths
export const AUTH_REDIRECTS = {
  // After successful sign in
  SIGN_IN_SUCCESS: '/dashboard',
  // After successful sign up
  SIGN_UP_SUCCESS: '/auth/verify-email',
  // After sign out
  SIGN_OUT: '/auth/login',
  // When session expires
  SESSION_EXPIRED: '/auth/login?expired=true',
  // When unauthorized
  UNAUTHORIZED: '/auth/login?unauthorized=true',
} as const;

// Auth cookie names
export const AUTH_COOKIES = {
  ACCESS_TOKEN: 'sb-access-token',
  REFRESH_TOKEN: 'sb-refresh-token',
  AUTH_TOKEN: 'sb-auth-token',
} as const;

// Auth provider configuration
export const AUTH_PROVIDERS = {
  EMAIL: {
    enabled: true,
    confirmEmail: true,
    enableEmailLink: false,
  },
  GOOGLE: {
    enabled: false,
  },
  GITHUB: {
    enabled: false,
  },
} as const;

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  BD: 'bd',
  CS: 'cs',
} as const;

// Role display names in Korean
export const ROLE_DISPLAY_NAMES = {
  [USER_ROLES.ADMIN]: '관리자',
  [USER_ROLES.MANAGER]: '매니저',
  [USER_ROLES.BD]: '사업개발',
  [USER_ROLES.CS]: '고객서비스',
} as const;

// Role permissions
export const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: [
    'manage_users',
    'view_all_patients',
    'edit_all_patients',
    'view_audit_logs',
    'manage_system_settings',
  ],
  [USER_ROLES.MANAGER]: [
    'view_all_patients',
    'edit_all_patients',
    'view_reports',
    'manage_appointments',
  ],
  [USER_ROLES.BD]: [
    'view_own_patients',
    'create_patients',
    'manage_survey_tokens',
  ],
  [USER_ROLES.CS]: [
    'view_assigned_patients',
    'manage_appointments',
    'update_patient_status',
  ],
} as const;

// Auth regex patterns
export const AUTH_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{}|;:,.<>?])[A-Za-z\d!@#$%^&*()_+\-=[\]{}|;:,.<>?]{8,}$/,
  PHONE: /^010-\d{4}-\d{4}$/,
} as const;

// Session management
export const SESSION_CONFIG = {
  // Check session every 5 minutes
  CHECK_INTERVAL_MS: 5 * 60 * 1000,
  // Warn before expiry (30 minutes)
  EXPIRY_WARNING_MS: 30 * 60 * 1000,
  // Auto refresh threshold (1 hour before expiry)
  AUTO_REFRESH_THRESHOLD_MS: 60 * 60 * 1000,
} as const;

/**
 * Get error message in Korean for Supabase auth errors
 */
export function getAuthErrorMessage(error: any): string {
  if (!error) return AUTH_ERROR_MESSAGES.UNKNOWN_ERROR;
  
  const message = error.message || error.error_description || error.error || '';
  
  // Check for known error messages
  for (const [key, value] of Object.entries(AUTH_ERROR_MESSAGES)) {
    if (message.includes(key)) {
      return value;
    }
  }
  
  // Check for error codes
  if (error.code === 'auth/invalid-email') {
    return AUTH_ERROR_MESSAGES['Invalid email'];
  }
  
  if (error.code === 'auth/weak-password') {
    return AUTH_ERROR_MESSAGES.WEAK_PASSWORD;
  }
  
  if (error.status === 429) {
    return AUTH_ERROR_MESSAGES['Too many requests'];
  }
  
  // Return the original message if no translation found
  return message || AUTH_ERROR_MESSAGES.UNKNOWN_ERROR;
}