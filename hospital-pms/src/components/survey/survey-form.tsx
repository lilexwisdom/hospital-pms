'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight, Save, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Form } from '@/components/ui/form';

import { Step1PersonalInfo } from './steps/step1-personal-info';
import { Step2ContactInfo } from './steps/step2-contact-info';
import { Step3MedicalHistory } from './steps/step3-medical-history';
import { Step4Examinations } from './steps/step4-examinations';
import { Step5Confirmation } from './steps/step5-confirmation';

import { submitSurvey } from '@/app/actions/survey';
import { useSurveyProgress } from '@/hooks/useRealtimeNotifications';

// Survey form schema
const surveySchema = z.object({
  // Step 1 - Personal Information
  name: z.string().min(2, '이름은 2자 이상 입력해주세요'),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '올바른 생년월일 형식이 아닙니다 (YYYY-MM-DD)'),
  gender: z.enum(['male', 'female'], { 
    errorMap: () => ({ message: '성별을 선택해주세요' })
  }),
  ssn: z.string()
    .regex(/^\d{6}-\d{7}$/, '올바른 주민등록번호 형식이 아닙니다')
    .refine((ssn) => {
      // Validate SSN checksum
      const cleanSSN = ssn.replace(/-/g, '');
      if (cleanSSN.length !== 13) return false;

      // Birth date validation
      const year = parseInt(cleanSSN.substring(0, 2));
      const month = parseInt(cleanSSN.substring(2, 4));
      const day = parseInt(cleanSSN.substring(4, 6));

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
    }, '유효하지 않은 주민등록번호입니다'),
  
  // Step 2 - Contact Information
  phone: z.string().regex(/^01[0-9]-\d{3,4}-\d{4}$/, '올바른 전화번호 형식이 아닙니다'),
  email: z.union([
    z.string().email('올바른 이메일 주소를 입력해주세요'),
    z.literal(''),
  ]).optional(),
  address: z.string().min(10, '주소를 입력해주세요'),
  addressDetail: z.string().optional(),
  postalCode: z.string().regex(/^\d{5}$/, '올바른 우편번호 형식이 아닙니다'),
  
  // Step 3 - Medical History & Diseases
  // Disease checkboxes
  flagHypertension: z.boolean(),
  flagDiabetes: z.boolean(),
  flagHyperlipidemia: z.boolean(),
  flagAnticoagulant: z.boolean(),
  flagAsthma: z.boolean(),
  flagAllergy: z.boolean(),
  flagCardiovascular: z.boolean(),
  flagPregnancy: z.boolean(),
  flagNone: z.boolean(),
  
  // Additional medical info
  hasAllergies: z.boolean(),
  allergies: z.string().optional(),
  hasMedications: z.boolean(),
  medications: z.string().optional(),
  hasMedicalHistory: z.boolean(),
  medicalHistory: z.string().optional(),
  emergencyContact: z.string().regex(/^01[0-9]-\d{3,4}-\d{4}$/, '올바른 전화번호 형식이 아닙니다'),
  emergencyRelation: z.string().min(1, '관계를 입력해주세요'),
  
  // Step 4 - Desired Examinations
  examHeart: z.boolean(),
  examEndoscopy: z.boolean(),
  examCT: z.boolean(),
  examMRI: z.boolean(),
  examOther: z.string().optional(),
  
  // Step 5 - Confirmation
  agreePrivacy: z.boolean().refine(val => val === true, '개인정보 수집 및 이용에 동의해주세요'),
  agreeMedical: z.boolean().refine(val => val === true, '의료정보 활용에 동의해주세요'),
});

type SurveyFormData = z.infer<typeof surveySchema>;

interface SurveyFormProps {
  token: string;
  tokenData: any;
  savedData?: Partial<SurveyFormData>;
  onAutoSave: (data: Partial<SurveyFormData>) => void;
  onComplete: () => void;
}

const STEPS = [
  { title: '개인정보', description: '기본 인적사항을 입력해주세요' },
  { title: '연락처 정보', description: '연락 가능한 정보를 입력해주세요' },
  { title: '건강 정보', description: '진료에 필요한 정보를 입력해주세요' },
  { title: '희망 검사', description: '받고 싶은 검사를 선택해주세요' },
  { title: '확인 및 동의', description: '입력하신 정보를 확인해주세요' },
];

export function SurveyForm({ 
  token, 
  tokenData, 
  savedData, 
  onAutoSave, 
  onComplete 
}: SurveyFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { progress, saveProgress } = useSurveyProgress(token);
  
  const form = useForm<SurveyFormData>({
    resolver: zodResolver(surveySchema),
    defaultValues: progress?.data || savedData || {
      // Pre-fill from token data if available
      name: tokenData?.patientName || '',
      phone: tokenData?.patientPhone || '',
      email: tokenData?.patientEmail || '',
      // Other fields default to empty
      gender: undefined,
      birthDate: '',
      ssn: '',
      address: '',
      addressDetail: '',
      postalCode: '',
      // Disease flags - default flagNone to true
      flagHypertension: false,
      flagDiabetes: false,
      flagHyperlipidemia: false,
      flagAnticoagulant: false,
      flagAsthma: false,
      flagAllergy: false,
      flagCardiovascular: false,
      flagPregnancy: false,
      flagNone: true,
      // Additional medical info
      hasAllergies: false,
      allergies: '',
      hasMedications: false,
      medications: '',
      hasMedicalHistory: false,
      medicalHistory: '',
      emergencyContact: '',
      emergencyRelation: '',
      // Examinations
      examHeart: false,
      examEndoscopy: false,
      examCT: false,
      examMRI: false,
      examOther: '',
      // Agreements
      agreePrivacy: false,
      agreeMedical: false,
    },
    mode: 'onChange',
  });

  // Restore step from progress
  useEffect(() => {
    if (progress?.step && progress.step > currentStep) {
      setCurrentStep(progress.step);
    }
  }, [progress]);

  // Debug: Monitor form validation state
  useEffect(() => {
    const subscription = form.watch(() => {
      if (currentStep === STEPS.length - 1) {
        console.log('[Survey] Form state changed on last step:', {
          isValid: form.formState.isValid,
          errors: form.formState.errors,
          values: {
            agreePrivacy: form.getValues('agreePrivacy'),
            agreeMedical: form.getValues('agreeMedical'),
          }
        });
      }
    });
    return () => subscription.unsubscribe();
  }, [form, currentStep]);

  const { watch, trigger } = form;
  const formData = watch();

  // Auto-save on form changes
  useEffect(() => {
    const subscription = watch((data) => {
      onAutoSave(data);
    });
    return () => subscription.unsubscribe();
  }, [watch, onAutoSave]);

  // Validate current step fields
  const validateCurrentStep = async () => {
    let fieldsToValidate: (keyof SurveyFormData)[] = [];
    
    switch (currentStep) {
      case 0:
        fieldsToValidate = ['name', 'birthDate', 'gender', 'ssn'];
        break;
      case 1:
        fieldsToValidate = ['phone', 'email', 'address', 'postalCode'];
        break;
      case 2:
        fieldsToValidate = ['emergencyContact', 'emergencyRelation'];
        // Conditional validations
        if (formData.hasAllergies) fieldsToValidate.push('allergies');
        if (formData.hasMedications) fieldsToValidate.push('medications');
        if (formData.hasMedicalHistory) fieldsToValidate.push('medicalHistory');
        break;
      case 3:
        // No required validations for examinations step
        break;
      case 4:
        fieldsToValidate = ['agreePrivacy', 'agreeMedical'];
        break;
    }
    
    return await trigger(fieldsToValidate);
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < STEPS.length - 1) {
      // Save progress when moving to next step
      await saveProgress(currentStep + 1, formData);
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (data: SurveyFormData) => {
    console.log('[Survey] handleSubmit called with data:', data);
    setIsSubmitting(true);
    
    try {
      console.log('[Survey] Calling submitSurvey...');
      const result = await submitSurvey(token, data);
      console.log('[Survey] Server response:', result);
      
      if (result.success && result.data) {
        console.log('[Survey] Submission successful!');
        console.log('[Survey] Patient ID:', result.data.patientId);
        console.log('[Survey] Response ID:', result.data.responseId);
        console.log('[Survey] Is new patient:', result.data.isNewPatient);
        
        toast({
          title: '설문이 완료되었습니다',
          description: '입력하신 정보가 안전하게 저장되었습니다.',
        });
        
        // Pass data to completion page via query params
        const params = new URLSearchParams({
          patientId: result.data.patientId,
          responseId: result.data.responseId,
          isNewPatient: result.data.isNewPatient ? 'true' : 'false',
        });
        
        const redirectUrl = `/survey/complete?${params.toString()}`;
        console.log('[Survey] Redirecting to:', redirectUrl);
        
        // Add a small delay to ensure toast is shown
        setTimeout(() => {
          console.log('[Survey] Executing redirect...');
          window.location.href = redirectUrl;
        }, 500);
      } else {
        console.error('[Survey] Submission failed:', result.error);
        throw new Error(result.error || '설문 제출에 실패했습니다');
      }
    } catch (error) {
      console.error('[Survey] Error during submission:', error);
      toast({
        title: '오류가 발생했습니다',
        description: error instanceof Error ? error.message : '설문 제출 중 오류가 발생했습니다',
        variant: 'destructive',
      });
    } finally {
      console.log('[Survey] Setting isSubmitting to false');
      setIsSubmitting(false);
    }
  };

  const progressPercentage = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <Card>
      <CardHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle>{STEPS[currentStep].title}</CardTitle>
            <span className="text-sm text-muted-foreground">
              {currentStep + 1} / {STEPS.length}
            </span>
          </div>
          <CardDescription>{STEPS[currentStep].description}</CardDescription>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Show validation errors at the top if on last step */}
        {currentStep === STEPS.length - 1 && Object.keys(form.formState.errors).length > 0 && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>
              <p className="font-semibold mb-2">다음 항목을 확인해주세요:</p>
              <ul className="list-disc list-inside space-y-1">
                {Object.entries(form.formState.errors).map(([field, error]) => (
                  <li key={field} className="text-sm">
                    {field}: {error?.message || '입력이 필요합니다'}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
        
        <Form {...form}>
          <form 
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <div className={cn(currentStep !== 0 && 'hidden')}>
              <Step1PersonalInfo form={form} />
            </div>
            
            <div className={cn(currentStep !== 1 && 'hidden')}>
              <Step2ContactInfo form={form} />
            </div>
            
            <div className={cn(currentStep !== 2 && 'hidden')}>
              <Step3MedicalHistory form={form} />
            </div>
            
            <div className={cn(currentStep !== 3 && 'hidden')}>
              <Step4Examinations form={form} />
            </div>
            
            <div className={cn(currentStep !== 4 && 'hidden')}>
              <Step5Confirmation form={form} formData={formData} />
            </div>

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                이전
              </Button>
              
              {currentStep < STEPS.length - 1 ? (
                <Button type="button" onClick={handleNext}>
                  다음
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Save className="mr-2 h-4 w-4 animate-spin" />
                      제출 중...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      제출하기
                    </>
                  )}
                </Button>
              )}
            </div>
            
            {/* Temporary debug section */}
            {currentStep === STEPS.length - 1 && (
              <div className="mt-6 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                <p className="text-sm font-medium text-gray-700 mb-2">디버그 도구 (임시)</p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // Force check the agreement checkboxes
                      form.setValue('agreePrivacy', true);
                      form.setValue('agreeMedical', true);
                      console.log('[Debug] Checkboxes set to true');
                    }}
                  >
                    체크박스 자동 체크
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      console.log('[Debug] Triggering manual submit');
                      form.handleSubmit(handleSubmit)();
                    }}
                  >
                    수동 제출
                  </Button>
                </div>
              </div>
            )}
          </form>
        </Form>
        
      </CardContent>
    </Card>
  );
}