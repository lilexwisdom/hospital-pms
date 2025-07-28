'use client';

import { useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  FileText, 
  Calendar, 
  Upload, 
  X,
  File,
  Image,
  FileSpreadsheet 
} from 'lucide-react';
import { AutocompleteInput } from '@/components/ui/autocomplete-input';
import { toast } from '@/hooks/use-toast';

interface ExaminationFieldsProps {
  fields: any[];
  form: UseFormReturn<MedicalInfoFormData>;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

// Common examination types
const examinationTypes = [
  '혈액검사',
  '소변검사',
  'X-ray',
  'CT',
  'MRI',
  '초음파',
  '심전도 (ECG)',
  '내시경',
  '골밀도 검사',
  '폐기능 검사',
  '종양표지자 검사',
  '호르몬 검사',
  '알레르기 검사',
];

// File type icons
const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return <Image className="h-4 w-4" />;
  if (fileType.includes('pdf')) return <FileText className="h-4 w-4" />;
  if (fileType.includes('sheet') || fileType.includes('excel')) return <FileSpreadsheet className="h-4 w-4" />;
  return <File className="h-4 w-4" />;
};

export function ExaminationFields({
  fields,
  form,
  onAdd,
  onRemove,
}: ExaminationFieldsProps) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const handleFileUpload = async (index: number, files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploadingIndex(index);
    const uploadedFiles = [];

    try {
      for (const file of Array.from(files)) {
        // Check file size (limit to 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: '파일 크기 초과',
            description: `${file.name}은 10MB를 초과합니다.`,
            variant: 'destructive',
          });
          continue;
        }

        // Create FormData for upload
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'examination_result');

        // TODO: Replace with actual file upload endpoint
        // const response = await fetch('/api/upload', {
        //   method: 'POST',
        //   body: formData,
        // });
        
        // For now, create a mock uploaded file object
        const uploadedFile = {
          name: file.name,
          url: URL.createObjectURL(file), // In production, this would be the uploaded file URL
          size: file.size,
          type: file.type,
        };

        uploadedFiles.push(uploadedFile);
      }

      // Update form with uploaded files
      const currentFiles = form.getValues(`examinationResults.${index}.files`) || [];
      form.setValue(`examinationResults.${index}.files`, [...currentFiles, ...uploadedFiles]);

      toast({
        title: '파일 업로드 완료',
        description: `${uploadedFiles.length}개의 파일이 업로드되었습니다.`,
      });
    } catch (error) {
      toast({
        title: '업로드 실패',
        description: '파일 업로드 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setUploadingIndex(null);
    }
  };

  const removeFile = (examIndex: number, fileIndex: number) => {
    const currentFiles = form.getValues(`examinationResults.${examIndex}.files`) || [];
    const updatedFiles = currentFiles.filter((_, i) => i !== fileIndex);
    form.setValue(`examinationResults.${examIndex}.files`, updatedFiles);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5" />
          검사 결과
        </CardTitle>
        <Button size="sm" type="button" onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" />
          검사 추가
        </Button>
      </CardHeader>
      <CardContent>
        {fields.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">등록된 검사 결과가 없습니다</p>
          </div>
        ) : (
          <div className="space-y-4">
            {fields.map((field, index) => {
              const files = form.watch(`examinationResults.${index}.files`) || [];
              
              return (
                <div key={field.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">검사 {index + 1}</h4>
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
                      name={`examinationResults.${index}.type`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>검사 종류 *</FormLabel>
                          <FormControl>
                            <AutocompleteInput
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="검사 종류 선택"
                              suggestions={examinationTypes}
                              freeSolo
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`examinationResults.${index}.date`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>검사일 *</FormLabel>
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
                    name={`examinationResults.${index}.result`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>검사 결과 *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="주요 검사 결과를 입력하세요"
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`examinationResults.${index}.normalRange`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>정상 범위</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="예: 70-100"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`examinationResults.${index}.unit`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>단위</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="예: mg/dL"
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
                    name={`examinationResults.${index}.notes`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>추가 메모</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="의사 소견, 추가 설명 등"
                            className="resize-none"
                            rows={2}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* File Upload Section */}
                  <div className="space-y-2">
                    <FormLabel>검사 결과지 첨부</FormLabel>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                        multiple
                        onChange={(e) => handleFileUpload(index, e.target.files)}
                        disabled={uploadingIndex === index}
                        className="hidden"
                        id={`file-upload-${index}`}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById(`file-upload-${index}`)?.click()}
                        disabled={uploadingIndex === index}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {uploadingIndex === index ? '업로드 중...' : '파일 선택'}
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        이미지, PDF, Word, Excel 파일 (최대 10MB)
                      </span>
                    </div>

                    {/* Uploaded Files Display */}
                    {files.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {files.map((file, fileIndex) => (
                          <div
                            key={fileIndex}
                            className="flex items-center justify-between p-2 rounded-md bg-muted"
                          >
                            <div className="flex items-center gap-2">
                              {getFileIcon(file.type)}
                              <span className="text-sm truncate max-w-xs">
                                {file.name}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {(file.size / 1024).toFixed(1)} KB
                              </Badge>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index, fileIndex)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
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