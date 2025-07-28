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
import { Plus, Trash2, FileText, Calendar } from 'lucide-react';

interface MedicalHistoryFieldsProps {
  fields: any[];
  form: UseFormReturn<MedicalInfoFormData>;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

export function MedicalHistoryFields({
  fields,
  form,
  onAdd,
  onRemove,
}: MedicalHistoryFieldsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5" />
          과거 병력
        </CardTitle>
        <Button size="sm" type="button" onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" />
          병력 추가
        </Button>
      </CardHeader>
      <CardContent>
        {fields.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">등록된 과거 병력이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium">병력 {index + 1}</h4>
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
                  name={`medicalHistories.${index}.condition`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>진단명 *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="예: 당뇨병, 고혈압"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`medicalHistories.${index}.diagnosisYear`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>진단 연도</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="예: 2020"
                          min="1900"
                          max={new Date().getFullYear()}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`medicalHistories.${index}.notes`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>추가 정보</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="치료 경과, 현재 상태 등"
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