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
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText } from 'lucide-react';

interface Step4ExaminationsProps {
  form: UseFormReturn<any>;
}

export function Step4Examinations({ form }: Step4ExaminationsProps) {
  return (
    <div className="space-y-6">
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          희망하시는 검사를 선택해주세요. 의료진이 상담 시 참고하겠습니다.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">희망 검사 항목</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <FormField
            control={form.control}
            name="examHeart"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="font-normal">
                    심장검사
                  </FormLabel>
                  <FormDescription className="text-sm">
                    심전도, 심초음파 등
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="examEndoscopy"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="font-normal">
                    위/대장 내시경
                  </FormLabel>
                  <FormDescription className="text-sm">
                    위내시경, 대장내시경
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="examCT"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="font-normal">
                    CT 촬영
                  </FormLabel>
                  <FormDescription className="text-sm">
                    흉부, 복부 등 컴퓨터 단층촬영
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="examMRI"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="font-normal">
                    MRI 촬영
                  </FormLabel>
                  <FormDescription className="text-sm">
                    뇌, 척추 등 자기공명영상
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <FormField
        control={form.control}
        name="examOther"
        render={({ field }) => (
          <FormItem>
            <FormLabel>기타 희망 검사</FormLabel>
            <FormControl>
              <Textarea
                placeholder="예: 유방촬영술, 골밀도 검사 등"
                className="resize-none"
                rows={3}
                {...field}
              />
            </FormControl>
            <FormDescription>
              위 항목에 없는 검사를 희망하시는 경우 입력해주세요
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}