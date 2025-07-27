'use client';

import { forwardRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PasswordStrengthIndicator } from './password-strength-indicator';
import type { PasswordValidationResult } from '@/lib/auth/password-validation';

export interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  showStrength?: boolean;
  showRequirements?: boolean;
  onValidationChange?: (result: PasswordValidationResult) => void;
  strengthIndicatorClassName?: string;
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ 
    className, 
    showStrength = false, 
    showRequirements = true,
    onValidationChange,
    strengthIndicatorClassName,
    disabled,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [value, setValue] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
      props.onChange?.(e);
    };

    return (
      <div className="space-y-2">
        <div className="relative">
          <Input
            {...props}
            ref={ref}
            type={showPassword ? 'text' : 'password'}
            className={cn('pr-10', className)}
            disabled={disabled}
            onChange={handleChange}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-1 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
            disabled={disabled}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            <span className="sr-only">
              {showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
            </span>
          </Button>
        </div>
        
        {showStrength && (
          <PasswordStrengthIndicator
            password={props.value as string || value}
            showRequirements={showRequirements}
            className={strengthIndicatorClassName}
            onValidationChange={onValidationChange}
          />
        )}
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };