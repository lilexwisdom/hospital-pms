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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import { AutocompleteInput } from '@/components/ui/autocomplete-input';

interface AllergyFieldsProps {
  fields: any[];
  form: UseFormReturn<MedicalInfoFormData>;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

// Common allergy suggestions by type
const allergySuggestions = {
  medication: [
    '페니실린',
    '아스피린',
    '이부프로펜',
    '설파제',
    '세팔로스포린',
    '마취제',
    '조영제',
    '항생제',
  ],
  food: [
    '우유',
    '계란',
    '땅콩',
    '견과류',
    '갑각류',
    '생선',
    '밀가루',
    '메밀',
    '복숭아',
    '토마토',
  ],
  environmental: [
    '꽃가루',
    '집먼지 진드기',
    '동물 털',
    '곰팡이',
    '라텍스',
    '니켈',
    '향수',
  ],
  other: [],
};

const severityLabels = {
  mild: '경증',
  moderate: '중등도',
  severe: '중증',
};

export function AllergyFields({
  fields,
  form,
  onAdd,
  onRemove,
}: AllergyFieldsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          알러지 정보
        </CardTitle>
        <Button size="sm" type="button" onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" />
          알러지 추가
        </Button>
      </CardHeader>
      <CardContent>
        {fields.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">등록된 알러지가 없습니다</p>
          </div>
        ) : (
          <div className="space-y-4">
            {fields.map((field, index) => {
              const allergyType = form.watch(`allergies.${index}.type`);
              const suggestions = allergySuggestions[allergyType as keyof typeof allergySuggestions] || [];

              return (
                <div key={field.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">알러지 {index + 1}</h4>
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
                      name={`allergies.${index}.type`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>알러지 유형 *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="유형 선택" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="medication">약물</SelectItem>
                              <SelectItem value="food">음식</SelectItem>
                              <SelectItem value="environmental">환경</SelectItem>
                              <SelectItem value="other">기타</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`allergies.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>알러지 항목 *</FormLabel>
                          <FormControl>
                            <AutocompleteInput
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="알러지 항목 입력"
                              suggestions={suggestions}
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
                      name={`allergies.${index}.reaction`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>반응/증상</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="예: 두드러기, 호흡곤란"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`allergies.${index}.severity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>심각도</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="심각도 선택" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="mild">{severityLabels.mild}</SelectItem>
                              <SelectItem value="moderate">{severityLabels.moderate}</SelectItem>
                              <SelectItem value="severe">{severityLabels.severe}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}