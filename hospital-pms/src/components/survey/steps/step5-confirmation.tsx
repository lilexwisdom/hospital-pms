'use client';

import { UseFormReturn } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface Step5ConfirmationProps {
  form: UseFormReturn<any>;
  formData: any;
}

export function Step5Confirmation({ form, formData }: Step5ConfirmationProps) {
  const maskSSN = (ssn: string) => {
    if (!ssn) return '';
    const parts = ssn.split('-');
    if (parts.length !== 2) return ssn;
    return `${parts[0]}-${parts[1][0]}******`;
  };

  return (
    <div className="space-y-6">
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">개인정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">이름</span>
                <span className="font-medium">{formData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">생년월일</span>
                <span className="font-medium">{formData.birthDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">성별</span>
                <span className="font-medium">
                  {formData.gender === 'male' ? '남성' : '여성'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">주민등록번호</span>
                <span className="font-medium">{maskSSN(formData.ssn)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">연락처 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">휴대폰</span>
                <span className="font-medium">{formData.phone}</span>
              </div>
              {formData.email && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">이메일</span>
                  <span className="font-medium">{formData.email}</span>
                </div>
              )}
              <div className="space-y-1">
                <span className="text-muted-foreground">주소</span>
                <div className="text-sm">
                  <p className="font-medium">[{formData.postalCode}] {formData.address}</p>
                  {formData.addressDetail && (
                    <p className="text-muted-foreground">{formData.addressDetail}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">건강 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Disease Information */}
              <div className="space-y-2">
                <p className="text-sm font-medium">기저 질환</p>
                <div className="flex flex-wrap gap-2">
                  {formData.flagNone ? (
                    <Badge variant="outline">해당사항 없음</Badge>
                  ) : (
                    <>
                      {formData.flagHypertension && <Badge variant="secondary">고혈압</Badge>}
                      {formData.flagDiabetes && <Badge variant="secondary">당뇨</Badge>}
                      {formData.flagHyperlipidemia && <Badge variant="secondary">고지혈증</Badge>}
                      {formData.flagAnticoagulant && <Badge variant="secondary">항응고제 복용</Badge>}
                      {formData.flagAsthma && <Badge variant="secondary">천식</Badge>}
                      {formData.flagAllergy && <Badge variant="secondary">알러지</Badge>}
                      {formData.flagCardiovascular && <Badge variant="secondary">뇌/심장 질환</Badge>}
                      {formData.flagPregnancy && <Badge variant="secondary">임신 가능성</Badge>}
                    </>
                  )}
                </div>
              </div>
              
              {formData.hasAllergies && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">알레르기 상세</span>
                    <Badge variant="secondary" className="text-xs">있음</Badge>
                  </div>
                  <p className="text-sm">{formData.allergies}</p>
                </div>
              )}
              
              {formData.hasMedications && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">복용 약물</span>
                    <Badge variant="secondary" className="text-xs">있음</Badge>
                  </div>
                  <p className="text-sm">{formData.medications}</p>
                </div>
              )}
              
              {formData.hasMedicalHistory && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">과거 병력</span>
                    <Badge variant="secondary" className="text-xs">있음</Badge>
                  </div>
                  <p className="text-sm">{formData.medicalHistory}</p>
                </div>
              )}
              
              <Separator />
              
              <div className="space-y-2">
                <p className="text-sm font-medium">비상 연락처</p>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">연락처</span>
                    <span>{formData.emergencyContact}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">관계</span>
                    <span>{formData.emergencyRelation}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">희망 검사</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(formData.examHeart || formData.examEndoscopy || formData.examCT || formData.examMRI) ? (
                <div className="flex flex-wrap gap-2">
                  {formData.examHeart && <Badge variant="outline">심장검사</Badge>}
                  {formData.examEndoscopy && <Badge variant="outline">위/대장 내시경</Badge>}
                  {formData.examCT && <Badge variant="outline">CT 촬영</Badge>}
                  {formData.examMRI && <Badge variant="outline">MRI 촬영</Badge>}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">선택한 검사가 없습니다</p>
              )}
              
              {formData.examOther && (
                <div className="space-y-1 pt-2">
                  <p className="text-sm text-muted-foreground">기타 희망 검사:</p>
                  <p className="text-sm">{formData.examOther}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      <Separator />

      <div className="space-y-4">
        <FormField
          control={form.control}
          name="agreePrivacy"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  개인정보 수집 및 이용에 동의합니다 *
                </FormLabel>
                <p className="text-sm text-muted-foreground">
                  입력하신 개인정보는 의료법에 따라 안전하게 보호됩니다
                </p>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="agreeMedical"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  의료정보 활용에 동의합니다 *
                </FormLabel>
                <p className="text-sm text-muted-foreground">
                  진료 및 건강관리 목적으로만 사용됩니다
                </p>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}