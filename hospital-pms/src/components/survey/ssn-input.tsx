'use client';

import { forwardRef, useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SSNInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
}

export const SSNInput = forwardRef<HTMLInputElement, SSNInputProps>(
  ({ value, onChange, onBlur, error, disabled }, ref) => {
    const [showLastDigit, setShowLastDigit] = useState(false);
    const [frontValue, setFrontValue] = useState('');
    const [backValue, setBackValue] = useState('');

    // Parse the full SSN value
    useEffect(() => {
      if (value) {
        const parts = value.split('-');
        setFrontValue(parts[0] || '');
        setBackValue(parts[1] || '');
      } else {
        setFrontValue('');
        setBackValue('');
      }
    }, [value]);

    // Combine front and back values
    const handleChange = (front: string, back: string) => {
      const cleanFront = front.replace(/\D/g, '');
      const cleanBack = back.replace(/\D/g, '');
      
      if (cleanFront.length <= 6 && cleanBack.length <= 7) {
        setFrontValue(cleanFront);
        setBackValue(cleanBack);
        
        // Only set the full value when both parts are complete
        if (cleanFront || cleanBack) {
          onChange(`${cleanFront}-${cleanBack}`);
        } else {
          onChange('');
        }
      }
    };

    // Validate SSN format and checksum
    const validateSSN = (ssn: string): boolean => {
      const cleanSSN = ssn.replace(/-/g, '');
      if (cleanSSN.length !== 13) return false;

      // Basic format validation
      const regex = /^\d{6}\d{7}$/;
      if (!regex.test(cleanSSN)) return false;

      // Birth date validation
      const year = parseInt(cleanSSN.substring(0, 2));
      const month = parseInt(cleanSSN.substring(2, 4));
      const day = parseInt(cleanSSN.substring(4, 6));
      const genderDigit = parseInt(cleanSSN.substring(6, 7));

      // Determine century based on gender digit
      let fullYear = year;
      if (genderDigit <= 2) {
        fullYear = 1900 + year;
      } else if (genderDigit <= 4) {
        fullYear = 2000 + year;
      } else if (genderDigit <= 6) {
        fullYear = 1900 + year; // Foreign nationals born before 2000
      } else if (genderDigit <= 8) {
        fullYear = 2000 + year; // Foreign nationals born after 2000
      } else {
        fullYear = 1800 + year; // Very old cases
      }

      // Validate month and day
      if (month < 1 || month > 12) return false;
      if (day < 1 || day > 31) return false;

      // Checksum validation (Korean SSN algorithm)
      const weights = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5];
      let sum = 0;
      
      for (let i = 0; i < 12; i++) {
        sum += parseInt(cleanSSN.charAt(i)) * weights[i];
      }
      
      const checkDigit = (11 - (sum % 11)) % 10;
      return checkDigit === parseInt(cleanSSN.charAt(12));
    };


    const isValid = value && value.length === 14 && validateSSN(value);

    // Handle front input change with masking
    const handleFrontChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value.replace(/\D/g, ''); // Remove non-digits
      if (input.length <= 6) {
        handleChange(input, backValue);
      }
    };

    // Handle back input change with masking
    const handleBackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value.replace(/\D/g, ''); // Remove non-digits
      if (input.length <= 7) {
        handleChange(frontValue, input);
      }
    };

    return (
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <div className="flex-1">
            <Input
              ref={ref}
              value={frontValue}
              onChange={handleFrontChange}
              onBlur={onBlur}
              disabled={disabled}
              placeholder="앞 6자리"
              maxLength={6}
              pattern="\d*"
              inputMode="numeric"
              className={cn(
                error && 'border-destructive',
                'text-center font-mono'
              )}
            />
          </div>
          
          <span className="text-2xl text-muted-foreground">-</span>
          
          <div className="flex-1 relative">
            <Input
              value={backValue}
              onChange={handleBackChange}
              onBlur={onBlur}
              disabled={disabled}
              type={showLastDigit ? 'text' : 'password'}
              placeholder="뒤 7자리"
              maxLength={7}
              pattern="\d*"
              inputMode="numeric"
              className={cn(
                error && 'border-destructive',
                'text-center font-mono pr-10'
              )}
            />
            
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowLastDigit(!showLastDigit)}
              disabled={!backValue || disabled}
            >
              {showLastDigit ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        
        {value && value.length === 14 && !isValid && (
          <p className="text-sm text-destructive">올바른 주민등록번호 형식이 아닙니다</p>
        )}
      </div>
    );
  }
);

SSNInput.displayName = 'SSNInput';