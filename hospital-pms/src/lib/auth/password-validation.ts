/**
 * Password validation utilities matching Supabase Auth policy
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong' | 'very-strong';
  score: number;
}

export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

// Default requirements matching Supabase configuration
export const DEFAULT_PASSWORD_REQUIREMENTS: PasswordRequirements = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
};

// Special characters allowed in passwords
export const SPECIAL_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

/**
 * Validate password against requirements
 */
export function validatePassword(
  password: string,
  requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS
): PasswordValidationResult {
  const errors: string[] = [];
  let score = 0;

  // Check minimum length
  if (password.length < requirements.minLength) {
    errors.push(`비밀번호는 최소 ${requirements.minLength}자 이상이어야 합니다.`);
  } else {
    score += 1;
  }

  // Check uppercase
  if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('대문자를 하나 이상 포함해야 합니다.');
  } else if (/[A-Z]/.test(password)) {
    score += 1;
  }

  // Check lowercase
  if (requirements.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('소문자를 하나 이상 포함해야 합니다.');
  } else if (/[a-z]/.test(password)) {
    score += 1;
  }

  // Check numbers
  if (requirements.requireNumbers && !/\d/.test(password)) {
    errors.push('숫자를 하나 이상 포함해야 합니다.');
  } else if (/\d/.test(password)) {
    score += 1;
  }

  // Check special characters
  const specialCharRegex = new RegExp(`[${SPECIAL_CHARS.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`);
  if (requirements.requireSpecialChars && !specialCharRegex.test(password)) {
    errors.push('특수문자(!@#$%^&* 등)를 하나 이상 포함해야 합니다.');
  } else if (specialCharRegex.test(password)) {
    score += 1;
  }

  // Additional scoring for length
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  // Check for common patterns (additional security)
  if (hasCommonPatterns(password)) {
    errors.push('일반적인 패턴이나 단어를 피해주세요.');
    score -= 1;
  }

  // Calculate strength
  const strength = calculateStrength(score);

  return {
    isValid: errors.length === 0,
    errors,
    strength,
    score: Math.max(0, score),
  };
}

/**
 * Calculate password strength based on score
 */
function calculateStrength(score: number): PasswordValidationResult['strength'] {
  if (score <= 2) return 'weak';
  if (score <= 4) return 'medium';
  if (score <= 6) return 'strong';
  return 'very-strong';
}

/**
 * Check for common patterns in password
 */
function hasCommonPatterns(password: string): boolean {
  const commonPatterns = [
    /^12345/,
    /^qwerty/i,
    /^password/i,
    /^admin/i,
    /^user/i,
    /(.)\1{2,}/, // Repeated characters (3 or more)
    /^[a-z]+$/i, // Only letters
    /^\d+$/, // Only numbers
  ];

  return commonPatterns.some(pattern => pattern.test(password));
}

/**
 * Generate password strength indicator UI classes
 */
export function getPasswordStrengthClass(strength: PasswordValidationResult['strength']): string {
  const classes = {
    'weak': 'text-red-600',
    'medium': 'text-yellow-600',
    'strong': 'text-green-600',
    'very-strong': 'text-emerald-600',
  };
  return classes[strength];
}

/**
 * Get password strength label in Korean
 */
export function getPasswordStrengthLabel(strength: PasswordValidationResult['strength']): string {
  const labels = {
    'weak': '약함',
    'medium': '보통',
    'strong': '강함',
    'very-strong': '매우 강함',
  };
  return labels[strength];
}

/**
 * Generate a secure random password
 */
export function generateSecurePassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = SPECIAL_CHARS;
  const all = uppercase + lowercase + numbers + special;

  let password = '';
  
  // Ensure at least one of each required character type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Validate password confirmation match
 */
export function validatePasswordMatch(password: string, confirmPassword: string): {
  isValid: boolean;
  error?: string;
} {
  if (password !== confirmPassword) {
    return {
      isValid: false,
      error: '비밀번호가 일치하지 않습니다.',
    };
  }
  return { isValid: true };
}

/**
 * Check if password has been pwned (for production, integrate with Have I Been Pwned API)
 */
export async function checkPasswordPwned(password: string): Promise<boolean> {
  // This is a placeholder. In production, implement actual HIBP API check
  // For now, return false (not pwned)
  return false;
}

/**
 * Password validation regex for form validation
 * Matches the Supabase policy requirements
 */
export const PASSWORD_VALIDATION_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{}|;:,.<>?])[A-Za-z\d!@#$%^&*()_+\-=[\]{}|;:,.<>?]{8,}$/;

/**
 * Get password requirements as a formatted string
 */
export function getPasswordRequirementsText(): string[] {
  return [
    '최소 8자 이상',
    '대문자 포함 (A-Z)',
    '소문자 포함 (a-z)',
    '숫자 포함 (0-9)',
    '특수문자 포함 (!@#$%^&* 등)',
  ];
}

/**
 * Validate password for Supabase Auth
 * Returns true if password meets all requirements
 */
export function isValidSupabasePassword(password: string): boolean {
  const result = validatePassword(password);
  return result.isValid;
}