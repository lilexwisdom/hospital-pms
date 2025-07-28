'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  medicalInfoFormSchema, 
  MedicalInfoFormData,
  detectDiseaseFlags,
} from '@/lib/validations/medical-info';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Trash2, 
  AlertCircle,
  Activity,
  Pill,
  Scissors,
  AlertTriangle,
  FileText,
  Upload,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { MedicalHistoryFields } from './fields/MedicalHistoryFields';
import { MedicationFields } from './fields/MedicationFields';
import { SurgeryFields } from './fields/SurgeryFields';
import { AllergyFields } from './fields/AllergyFields';

interface MedicalInfoFormProps {
  patientId: string;
  initialData?: Partial<MedicalInfoFormData>;
  onSubmit?: (data: MedicalInfoFormData) => Promise<void>;
}

export function MedicalInfoForm({ 
  patientId, 
  initialData,
  onSubmit 
}: MedicalInfoFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detectedFlags, setDetectedFlags] = useState<Record<string, boolean>>({});

  const form = useForm<MedicalInfoFormData>({
    resolver: zodResolver(medicalInfoFormSchema),
    defaultValues: initialData || {
      medicalHistories: [],
      medications: [],
      surgeries: [],
      allergies: [],
      familyHistory: '',
    },
  });

  // Field arrays
  const {
    fields: medicalHistoryFields,
    append: appendMedicalHistory,
    remove: removeMedicalHistory,
  } = useFieldArray({
    control: form.control,
    name: 'medicalHistories',
  });

  const {
    fields: medicationFields,
    append: appendMedication,
    remove: removeMedication,
  } = useFieldArray({
    control: form.control,
    name: 'medications',
  });

  const {
    fields: surgeryFields,
    append: appendSurgery,
    remove: removeSurgery,
  } = useFieldArray({
    control: form.control,
    name: 'surgeries',
  });

  const {
    fields: allergyFields,
    append: appendAllergy,
    remove: removeAllergy,
  } = useFieldArray({
    control: form.control,
    name: 'allergies',
  });


  // Watch form changes to detect disease flags
  const watchedData = form.watch();
  
  useEffect(() => {
    const subscription = form.watch((data) => {
      const flags = detectDiseaseFlags(data as MedicalInfoFormData);
      setDetectedFlags(flags);
    });
    
    return () => subscription.unsubscribe();
  }, [form]);

  const handleSubmit = async (data: MedicalInfoFormData) => {
    try {
      setIsSubmitting(true);
      
      // Add detected flags to the data
      const dataWithFlags = {
        ...data,
        detectedFlags,
      };

      if (onSubmit) {
        await onSubmit(dataWithFlags);
      } else {
        // Default submission logic
        const response = await fetch(`/api/patients/${patientId}/medical-info`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataWithFlags),
        });

        if (!response.ok) {
          throw new Error('Failed to save medical information');
        }

        toast({
          title: '저장 완료',
          description: '의료 정보가 성공적으로 저장되었습니다.',
        });
      }
    } catch (error) {
      toast({
        title: '저장 실패',
        description: '의료 정보 저장 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Disease Flags Display */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              자동 감지된 주요 질환
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(detectedFlags).map(([flag, isDetected]) => {
                if (!isDetected) return null;
                
                const labels: Record<string, string> = {
                  flag_diabetes: '당뇨병',
                  flag_hypertension: '고혈압',
                  flag_hyperlipidemia: '고지혈증',
                  flag_cardiovascular: '심혈관질환',
                  flag_asthma: '천식',
                  flag_allergy: '알러지',
                  flag_anticoagulant: '항응고제 복용',
                  flag_pregnancy: '임신',
                };
                
                return (
                  <Badge key={flag} variant="secondary" className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {labels[flag] || flag}
                  </Badge>
                );
              })}
              {Object.values(detectedFlags).every(v => !v) && (
                <p className="text-sm text-muted-foreground">
                  입력된 정보를 기반으로 질환이 자동 감지됩니다
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Medical Information Tabs */}
        <Tabs defaultValue="history" className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="history">
              과거력 {medicalHistoryFields.length > 0 && `(${medicalHistoryFields.length})`}
            </TabsTrigger>
            <TabsTrigger value="medications">
              복약정보 {medicationFields.length > 0 && `(${medicationFields.length})`}
            </TabsTrigger>
            <TabsTrigger value="surgeries">
              수술이력 {surgeryFields.length > 0 && `(${surgeryFields.length})`}
            </TabsTrigger>
            <TabsTrigger value="allergies">
              알러지 {allergyFields.length > 0 && `(${allergyFields.length})`}
            </TabsTrigger>
          </TabsList>

          {/* Medical History Tab */}
          <TabsContent value="history" className="space-y-4">
            <MedicalHistoryFields
              fields={medicalHistoryFields}
              form={form}
              onAdd={() => appendMedicalHistory({ 
                condition: '', 
                diagnosisYear: '', 
                notes: '' 
              })}
              onRemove={removeMedicalHistory}
            />
            
            {/* Family History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">가족력</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="familyHistory"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="가족의 주요 질환 이력을 입력해주세요"
                          className="resize-none"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        부모, 형제자매의 주요 질환 (예: 당뇨, 고혈압, 암 등)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Medications Tab */}
          <TabsContent value="medications">
            <MedicationFields
              fields={medicationFields}
              form={form}
              onAdd={() => appendMedication({ 
                name: '', 
                dosage: '', 
                frequency: '', 
                startDate: '', 
                purpose: '' 
              })}
              onRemove={removeMedication}
            />
          </TabsContent>

          {/* Surgeries Tab */}
          <TabsContent value="surgeries">
            <SurgeryFields
              fields={surgeryFields}
              form={form}
              onAdd={() => appendSurgery({ 
                name: '', 
                date: '', 
                hospital: '', 
                notes: '' 
              })}
              onRemove={removeSurgery}
            />
          </TabsContent>

          {/* Allergies Tab */}
          <TabsContent value="allergies">
            <AllergyFields
              fields={allergyFields}
              form={form}
              onAdd={() => appendAllergy({ 
                type: 'medication', 
                name: '', 
                reaction: '', 
                severity: 'mild' 
              })}
              onRemove={removeAllergy}
            />
          </TabsContent>

        </Tabs>

        {/* Submit Button */}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline">
            취소
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                저장 중...
              </>
            ) : (
              '저장'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}