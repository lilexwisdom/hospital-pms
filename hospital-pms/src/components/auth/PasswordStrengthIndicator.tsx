'use client';

import { useEffect, useState } from 'react';
import { validatePassword, getPasswordStrengthClass, getPasswordStrengthLabel } from '@/lib/auth/password-validation';

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
}

export function PasswordStrengthIndicator({ password, showRequirements = true }: PasswordStrengthIndicatorProps) {
  const [validation, setValidation] = useState(validatePassword(''));

  useEffect(() => {
    setValidation(validatePassword(password));
  }, [password]);

  if (!password) return null;

  const strengthPercentage = (validation.score / 7) * 100;

  return (
    <div className="mt-2 space-y-2">
      {/* Strength bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">비밀번호 강도</span>
          <span className={`font-medium ${getPasswordStrengthClass(validation.strength)}`}>
            {getPasswordStrengthLabel(validation.strength)}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              validation.strength === 'weak' ? 'bg-red-500' :
              validation.strength === 'medium' ? 'bg-yellow-500' :
              validation.strength === 'strong' ? 'bg-green-500' :
              'bg-emerald-500'
            }`}
            style={{ width: `${strengthPercentage}%` }}
          />
        </div>
      </div>

      {/* Requirements checklist */}
      {showRequirements && (
        <div className="space-y-1">
          <RequirementItem met={password.length >= 8} text="최소 8자 이상" />
          <RequirementItem met={/[A-Z]/.test(password)} text="대문자 포함" />
          <RequirementItem met={/[a-z]/.test(password)} text="소문자 포함" />
          <RequirementItem met={/\d/.test(password)} text="숫자 포함" />
          <RequirementItem met={/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password)} text="특수문자 포함" />
        </div>
      )}

      {/* Error messages */}
      {validation.errors.length > 0 && (
        <div className="mt-2 space-y-1">
          {validation.errors.map((error, index) => (
            <p key={index} className="text-sm text-red-600">
              • {error}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center space-x-2 text-sm">
      {met ? (
        <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      <span className={met ? 'text-green-700' : 'text-gray-500'}>{text}</span>
    </div>
  );
}