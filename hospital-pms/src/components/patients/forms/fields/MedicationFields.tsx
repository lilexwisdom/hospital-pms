'use client';

import { UseFormReturn } from 'react-hook-form';
import { MedicalInfoFormData } from '@/lib/validations/medical-info';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Pill, Calendar } from 'lucide-react';
import { AutocompleteInput } from '@/components/ui/autocomplete-input';

interface MedicationFieldsProps {
  fields: any[];
  form: UseFormReturn<MedicalInfoFormData>;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

// Common medication suggestions
const medicationSuggestions = [
  { value: '아스피린', label: '아스피린 (항혈소판제)' },
  { value: '메트포르민', label: '메트포르민 (당뇨약)' },
  { value: '와파린', label: '와파린 (항응고제)' },
];

const dosageSuggestions = [
  '5mg', '10mg', '20mg', '25mg', '50mg', '100mg', '200mg', '500mg', '1g',
];

const frequencySuggestions = [
  { value: 'QD', label: '하루 1회' },
  { value: 'BID', label: '하루 2회' },
  { value: 'TID', label: '하루 3회' },
  { value: 'QID', label: '하루 4회' },
  { value: 'PRN', label: '필요시' },
  { value: 'HS', label: '취침 전' },
  { value: 'AC', label: '식전' },
  { value: 'PC', label: '식후' },
];

export function MedicationFields({
  fields,
  form,
  onAdd,
  onRemove,
}: MedicationFieldsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Pill className="h-5 w-5" />
          복약 정보
        </CardTitle>
        <Button size="sm" type="button" onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" />
          약물 추가
        </Button>
      </CardHeader>
      <CardContent>
        {fields.length === 0 ? (
          <div className="text-center py-8">
            <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">등록된 복약 정보가 없습니다</p>
          </div>
        ) : (
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium">약물 {index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`medications.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>약물명 *</FormLabel>
                        <FormControl>
                          <AutocompleteInput
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="약물명을 입력하세요"
                            suggestions={medicationSuggestions}
                            freeSolo
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`medications.${index}.dosage`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>용량</FormLabel>
                        <FormControl>
                          <AutocompleteInput
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="예: 100mg"
                            suggestions={dosageSuggestions.map(d => ({ value: d, label: d }))}
                            freeSolo
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`medications.${index}.frequency`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>복용법</FormLabel>
                        <FormControl>
                          <AutocompleteInput
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="예: 하루 2회"
                            suggestions={frequencySuggestions}
                            freeSolo
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`medications.${index}.startDate`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>복용 시작일</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="date"
                              className="pl-10"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name={`medications.${index}.purpose`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>복용 목적</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="예: 혈압 조절, 혈당 관리"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}