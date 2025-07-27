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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Step3MedicalHistoryProps {
  form: UseFormReturn<any>;
}

export function Step3MedicalHistory({ form }: Step3MedicalHistoryProps) {
  const hasAllergies = form.watch('hasAllergies');
  const hasMedications = form.watch('hasMedications');
  const hasMedicalHistory = form.watch('hasMedicalHistory');
  const gender = form.watch('gender');
  const flagNone = form.watch('flagNone');

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    if (numbers.length <= 10) return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  // Handle mutually exclusive logic for "None of the above"
  const handleDiseaseChange = (field: string, checked: boolean) => {
    if (field === 'flagNone' && checked) {
      // If "None of the above" is checked, uncheck all other diseases
      form.setValue('flagHypertension', false);
      form.setValue('flagDiabetes', false);
      form.setValue('flagHyperlipidemia', false);
      form.setValue('flagAnticoagulant', false);
      form.setValue('flagAsthma', false);
      form.setValue('flagAllergy', false);
      form.setValue('flagCardiovascular', false);
      form.setValue('flagPregnancy', false);
    } else if (field !== 'flagNone' && checked) {
      // If any disease is checked, uncheck "None of the above"
      form.setValue('flagNone', false);
    }
    form.setValue(field, checked);
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          정확한 의료 정보는 안전한 진료를 위해 매우 중요합니다. 
          알고 계신 정보를 모두 입력해주세요.
        </AlertDescription>
      </Alert>

      {/* Disease Checkboxes Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">기저 질환</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <FormField
            control={form.control}
            name="flagHypertension"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => handleDiseaseChange('flagHypertension', checked as boolean)}
                  />
                </FormControl>
                <FormLabel className="font-normal">고혈압</FormLabel>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="flagDiabetes"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => handleDiseaseChange('flagDiabetes', checked as boolean)}
                  />
                </FormControl>
                <FormLabel className="font-normal">당뇨</FormLabel>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="flagHyperlipidemia"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => handleDiseaseChange('flagHyperlipidemia', checked as boolean)}
                  />
                </FormControl>
                <FormLabel className="font-normal">고지혈증</FormLabel>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="flagAnticoagulant"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => handleDiseaseChange('flagAnticoagulant', checked as boolean)}
                  />
                </FormControl>
                <FormLabel className="font-normal">
                  항응고제/항혈소판제 복용
                  <span className="text-sm text-muted-foreground ml-1">(아스피린, 와파린 등)</span>
                </FormLabel>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="flagAsthma"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => handleDiseaseChange('flagAsthma', checked as boolean)}
                  />
                </FormControl>
                <FormLabel className="font-normal">천식</FormLabel>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="flagAllergy"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => handleDiseaseChange('flagAllergy', checked as boolean)}
                  />
                </FormControl>
                <FormLabel className="font-normal">특정 약물/음식 알러지</FormLabel>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="flagCardiovascular"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => handleDiseaseChange('flagCardiovascular', checked as boolean)}
                  />
                </FormControl>
                <FormLabel className="font-normal">
                  뇌/심장 질환
                  <span className="text-sm text-muted-foreground ml-1">(뇌졸중, 협심증, 심근경색 등)</span>
                </FormLabel>
              </FormItem>
            )}
          />
          
          {gender === 'female' && (
            <FormField
              control={form.control}
              name="flagPregnancy"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => handleDiseaseChange('flagPregnancy', checked as boolean)}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">임신 가능성</FormLabel>
                </FormItem>
              )}
            />
          )}
          
          <div className="pt-2 border-t">
            <FormField
              control={form.control}
              name="flagNone"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => handleDiseaseChange('flagNone', checked as boolean)}
                    />
                  </FormControl>
                  <FormLabel className="font-normal font-medium">위에 해당하는 사항 없음</FormLabel>
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <FormField
          control={form.control}
          name="hasAllergies"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">알레르기가 있으신가요?</FormLabel>
                <FormDescription>
                  음식, 약물, 기타 알레르기 포함
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {hasAllergies && (
          <FormField
            control={form.control}
            name="allergies"
            render={({ field }) => (
              <FormItem>
                <FormLabel>알레르기 상세 정보 *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="예: 페니실린, 새우, 땅콩 등"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>

      <div className="space-y-4">
        <FormField
          control={form.control}
          name="hasMedications"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">현재 복용 중인 약이 있으신가요?</FormLabel>
                <FormDescription>
                  처방약, 일반약 모두 포함
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {hasMedications && (
          <FormField
            control={form.control}
            name="medications"
            render={({ field }) => (
              <FormItem>
                <FormLabel>복용 중인 약물 *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="약물명과 복용 목적을 입력해주세요"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>

      <div className="space-y-4">
        <FormField
          control={form.control}
          name="hasMedicalHistory"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">과거 병력이 있으신가요?</FormLabel>
                <FormDescription>
                  수술, 입원, 만성질환 등
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {hasMedicalHistory && (
          <FormField
            control={form.control}
            name="medicalHistory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>과거 병력 상세 *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="진단명, 치료 시기 등을 입력해주세요"
                    className="resize-none"
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>

      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-lg font-medium">비상 연락처</h3>
        
        <FormField
          control={form.control}
          name="emergencyContact"
          render={({ field }) => (
            <FormItem>
              <FormLabel>비상 연락처 *</FormLabel>
              <FormControl>
                <Input
                  placeholder="010-1234-5678"
                  {...field}
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    field.onChange(formatted);
                  }}
                />
              </FormControl>
              <FormDescription>
                응급상황 시 연락 가능한 번호를 입력해주세요
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="emergencyRelation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>관계 *</FormLabel>
              <FormControl>
                <Input
                  placeholder="예: 배우자, 부모님, 자녀"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}