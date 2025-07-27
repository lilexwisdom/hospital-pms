'use client';

import { UseFormReturn } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { SSNInput } from '@/components/survey/ssn-input';

interface Step1PersonalInfoProps {
  form: UseFormReturn<any>;
}

export function Step1PersonalInfo({ form }: Step1PersonalInfoProps) {

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>이름 *</FormLabel>
            <FormControl>
              <Input placeholder="홍길동" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="birthDate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>생년월일 *</FormLabel>
            <FormControl>
              <Input 
                type="date" 
                {...field} 
                max={new Date().toISOString().split('T')[0]}
              />
            </FormControl>
            <FormDescription>
              YYYY-MM-DD 형식으로 입력해주세요
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="gender"
        render={({ field }) => (
          <FormItem>
            <FormLabel>성별 *</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="flex space-x-4"
              >
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <RadioGroupItem value="male" />
                  </FormControl>
                  <FormLabel className="font-normal cursor-pointer">
                    남성
                  </FormLabel>
                </FormItem>
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <RadioGroupItem value="female" />
                  </FormControl>
                  <FormLabel className="font-normal cursor-pointer">
                    여성
                  </FormLabel>
                </FormItem>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="ssn"
        render={({ field }) => (
          <FormItem>
            <FormLabel>주민등록번호 *</FormLabel>
            <FormControl>
              <SSNInput
                value={field.value || ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={form.formState.errors.ssn?.message}
                disabled={form.formState.isSubmitting}
              />
            </FormControl>
            <FormDescription>
              주민등록번호는 암호화되어 안전하게 보관됩니다
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}