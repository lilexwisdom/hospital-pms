'use client';

import { useMemo, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { 
  validatePassword, 
  getPasswordStrengthClass, 
  getPasswordStrengthLabel,
  type PasswordValidationResult 
} from '@/lib/auth/password-validation';
import { Check, X } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
  className?: string;
  onValidationChange?: (result: PasswordValidationResult) => void;
}

export function PasswordStrengthIndicator({
  password,
  showRequirements = true,
  className,
  onValidationChange,
}: PasswordStrengthIndicatorProps) {
  const validationResult = useMemo(() => {
    if (!password) {
      return {
        isValid: false,
        errors: [],
        strength: 'weak' as const,
        score: 0,
      };
    }
    return validatePassword(password);
  }, [password]);

  useEffect(() => {
    if (password && onValidationChange) {
      onValidationChange(validationResult);
    }
  }, [password, validationResult, onValidationChange]);

  const requirements = useMemo(() => [
    {
      label: '최소 8자 이상',
      met: password.length >= 8,
    },
    {
      label: '대문자 포함 (A-Z)',
      met: /[A-Z]/.test(password),
    },
    {
      label: '소문자 포함 (a-z)',
      met: /[a-z]/.test(password),
    },
    {
      label: '숫자 포함 (0-9)',
      met: /\d/.test(password),
    },
    {
      label: '특수문자 포함 (!@#$%^&* 등)',
      met: /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password),
    },
  ], [password]);

  if (!password) {
    return null;
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Strength Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">비밀번호 강도</span>
          <span 
            className={cn(
              'font-medium transition-colors',
              getPasswordStrengthClass(validationResult.strength)
            )}
          >
            {getPasswordStrengthLabel(validationResult.strength)}
          </span>
        </div>
        <Progress 
          value={(validationResult.score / 7) * 100} 
          className="h-2"
          indicatorClassName={cn(
            'transition-all',
            validationResult.strength === 'weak' && 'bg-red-500',
            validationResult.strength === 'medium' && 'bg-yellow-500',
            validationResult.strength === 'strong' && 'bg-green-500',
            validationResult.strength === 'very-strong' && 'bg-emerald-500'
          )}
        />
      </div>

      {/* Requirements List */}
      {showRequirements && (
        <div className="space-y-1">
          {requirements.map((req, index) => (
            <div
              key={index}
              className={cn(
                'flex items-center gap-2 text-xs transition-all',
                req.met ? 'text-green-600' : 'text-muted-foreground'
              )}
            >
              {req.met ? (
                <Check className="h-3 w-3 flex-shrink-0" />
              ) : (
                <X className="h-3 w-3 flex-shrink-0" />
              )}
              <span className={cn(req.met && 'line-through')}>{req.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Error Messages */}
      {!validationResult.isValid && validationResult.errors.length > 0 && !showRequirements && (
        <ul className="space-y-1 text-xs text-destructive">
          {validationResult.errors.map((error, index) => (
            <li key={index}>• {error}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Compact version for inline use
export function PasswordStrengthBadge({ password }: { password: string }) {
  const validationResult = useMemo(() => {
    if (!password) return null;
    return validatePassword(password);
  }, [password]);

  if (!validationResult) return null;

  return (
    <span 
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        validationResult.strength === 'weak' && 'bg-red-100 text-red-700',
        validationResult.strength === 'medium' && 'bg-yellow-100 text-yellow-700',
        validationResult.strength === 'strong' && 'bg-green-100 text-green-700',
        validationResult.strength === 'very-strong' && 'bg-emerald-100 text-emerald-700'
      )}
    >
      {getPasswordStrengthLabel(validationResult.strength)}
    </span>
  );
}