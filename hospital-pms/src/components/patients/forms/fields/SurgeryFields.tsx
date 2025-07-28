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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Scissors, Calendar } from 'lucide-react';
import { AutocompleteInput } from '@/components/ui/autocomplete-input';

interface SurgeryFieldsProps {
  fields: any[];
  form: UseFormReturn<MedicalInfoFormData>;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

// Common surgery suggestions
const surgerySuggestions = [
  '충수돌기 절제술 (맹장 수술)',
  '담낭 절제술',
  '자궁 절제술',
  '제왕절개',
  '탈장 수술',
  '백내장 수술',
  '관상동맥 우회술',
  '슬관절 치환술',
  '척추 수술',
  '편도선 절제술',
  '갑상선 절제술',
  '대장 절제술',
  '위 절제술',
];

export function SurgeryFields({
  fields,
  form,
  onAdd,
  onRemove,
}: SurgeryFieldsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Scissors className="h-5 w-5" />
          수술 이력
        </CardTitle>
        <Button size="sm" type="button" onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" />
          수술 추가
        </Button>
      </CardHeader>
      <CardContent>
        {fields.length === 0 ? (
          <div className="text-center py-8">
            <Scissors className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">등록된 수술 이력이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium">수술 {index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <FormField
                  control={form.control}
                  name={`surgeries.${index}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>수술명 *</FormLabel>
                      <FormControl>
                        <AutocompleteInput
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="수술명을 입력하세요"
                          suggestions={surgerySuggestions}
                          freeSolo
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`surgeries.${index}.date`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>수술일</FormLabel>
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

                  <FormField
                    control={form.control}
                    name={`surgeries.${index}.hospital`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>병원명</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="수술한 병원명"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name={`surgeries.${index}.notes`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>추가 정보</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="수술 관련 추가 정보 (합병증, 회복 기간 등)"
                          className="resize-none"
                          rows={2}
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