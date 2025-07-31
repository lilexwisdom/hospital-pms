'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, addMinutes, setHours, setMinutes, isBefore, isAfter, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarIcon, Check, ChevronsUpDown, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
// import debounce from 'lodash/debounce'; // 제거

const appointmentSchema = z.object({
  patient_id: z.string().uuid('환자를 선택해주세요'),
  examination_item_id: z.string().uuid('검사 항목을 선택해주세요'),
  scheduled_at: z.date({
    required_error: '예약 날짜를 선택해주세요',
  }),
  scheduled_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, '올바른 시간 형식이 아닙니다'),
  notes: z.string().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface Patient {
  id: string;
  name: string;
  phone: string;
  date_of_birth: string;
}

interface ExaminationItem {
  id: string;
  name: string;
  category: string;
  duration_minutes: number;
  description: string;
}

interface CreateAppointmentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  preSelectedPatientId?: string;
}

export function CreateAppointmentModal({
  open,
  onClose,
  onSuccess,
  preSelectedPatientId,
}: CreateAppointmentModalProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [patientOpen, setPatientOpen] = useState(false);
  const [examinationItems, setExaminationItems] = useState<ExaminationItem[]>([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patient_id: preSelectedPatientId || '',
      examination_item_id: '',
      scheduled_time: '09:00',
      notes: '',
    },
  });

  const selectedDate = watch('scheduled_at');
  const selectedTime = watch('scheduled_time');
  const selectedExamId = watch('examination_item_id');

  // 검사 항목 로드
  useEffect(() => {
    const fetchExaminationItems = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('examination_items')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (!error && data) {
        setExaminationItems(data);
      }
    };

    fetchExaminationItems();
  }, []);

  // 미리 선택된 환자 정보 로드
  useEffect(() => {
    if (preSelectedPatientId) {
      const fetchPatient = async () => {
        const supabase = createClient();
        const { data } = await supabase
          .from('patients')
          .select('id, name, phone, date_of_birth')
          .eq('id', preSelectedPatientId)
          .single();

        if (data) {
          setPatients([data]);
        }
      };

      fetchPatient();
    }
  }, [preSelectedPatientId]);

  // 환자 검색 (디바운스 적용)
  useEffect(() => {
    if (!preSelectedPatientId && patientSearchTerm && patientSearchTerm.length >= 2) {
      const timer = setTimeout(async () => {
        setSearchingPatients(true);
        const supabase = createClient();
        
        try {
          const { data, error } = await supabase
            .from('patients')
            .select('id, name, phone, date_of_birth')
            .or(`name.ilike.%${patientSearchTerm}%,phone.ilike.%${patientSearchTerm}%`)
            .order('name')
            .limit(10);

          if (error) {
            console.error('Error searching patients:', error);
            toast.error('환자 검색 중 오류가 발생했습니다.');
          } else if (data) {
            setPatients(data);
          }
        } catch (err) {
          console.error('Unexpected error:', err);
        } finally {
          setSearchingPatients(false);
        }
      }, 300);

      return () => clearTimeout(timer);
    } else if (!patientSearchTerm || patientSearchTerm.length < 2) {
      setPatients([]);
    }
  }, [patientSearchTerm, preSelectedPatientId]);

  // 예약 가능 여부 확인
  useEffect(() => {
    if (!selectedDate || !selectedTime || !selectedExamId) {
      setAvailabilityMessage(null);
      setIsAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingAvailability(true);
      setAvailabilityMessage(null);

      try {
        const supabase = createClient();
        
        // 선택된 검사 항목 정보 가져오기
        const { data: examItem } = await supabase
          .from('examination_items')
          .select('duration_minutes')
          .eq('id', selectedExamId)
          .single();

        if (!examItem) return;

        // 예약 시간 계산
        const [hours, minutes] = selectedTime.split(':').map(Number);
        const scheduledAt = setMinutes(setHours(selectedDate, hours), minutes);

        // 시간 충돌 검사
        const { data: isAvailable, error } = await supabase.rpc(
          'check_appointment_availability',
          {
            p_scheduled_at: scheduledAt.toISOString(),
            p_duration_minutes: examItem.duration_minutes,
            p_examination_item_id: selectedExamId,
          }
        );

        if (error) throw error;

        // 영업시간 확인
        const { data: isBusinessHours } = await supabase.rpc(
          'is_business_hours',
          {
            p_datetime: scheduledAt.toISOString(),
          }
        );

        if (!isBusinessHours) {
          setIsAvailable(false);
          setAvailabilityMessage('선택한 시간은 진료 시간(09:00-18:00)이 아닙니다.');
        } else if (!isAvailable) {
          setIsAvailable(false);
          setAvailabilityMessage('선택한 시간에 이미 다른 예약이 있습니다.');
        } else {
          setIsAvailable(true);
          setAvailabilityMessage('예약 가능한 시간입니다.');
        }
      } catch (error) {
        console.error('Error checking availability:', error);
        setAvailabilityMessage('예약 가능 여부를 확인할 수 없습니다.');
      } finally {
        setCheckingAvailability(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [selectedDate, selectedTime, selectedExamId]);

  const onSubmit = async (data: AppointmentFormData) => {
    if (!isAvailable) {
      toast.error('선택한 시간에는 예약할 수 없습니다.');
      return;
    }

    try {
      const supabase = createClient();
      
      // 예약 시간 생성
      const [hours, minutes] = data.scheduled_time.split(':').map(Number);
      const scheduledAt = setMinutes(setHours(data.scheduled_at, hours), minutes);

      // 현재 사용자 정보 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.from('appointments').insert({
        patient_id: data.patient_id,
        examination_item_id: data.examination_item_id,
        scheduled_at: scheduledAt.toISOString(),
        status: 'pending',
        cs_notes: data.notes || null,
        created_by: user.id,
        duration_minutes: selectedExamination?.duration_minutes || 30,
        consultation_type: 'general',
      });

      if (error) throw error;

      toast.success('예약이 성공적으로 생성되었습니다.');
      reset();
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      toast.error(error.message || '예약 생성 중 오류가 발생했습니다.');
    }
  };

  const selectedPatient = patients.find(p => p.id === watch('patient_id'));
  const selectedExamination = examinationItems.find(e => e.id === selectedExamId);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>새 예약 등록</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 환자 선택 */}
          <div className="space-y-2">
            <Label>환자</Label>
            <Controller
              name="patient_id"
              control={control}
              render={({ field }) => (
                <Popover open={patientOpen} onOpenChange={setPatientOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={patientOpen}
                      className="w-full justify-between"
                      disabled={!!preSelectedPatientId}
                    >
                      {selectedPatient
                        ? `${selectedPatient.name} (${selectedPatient.phone})`
                        : "환자를 검색하세요..."}
                      {!preSelectedPatientId && (
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      )}
                    </Button>
                  </PopoverTrigger>
                  {!preSelectedPatientId && (
                    <PopoverContent className="w-full p-0">
                      <div className="p-2">
                        <Input
                          placeholder="이름 또는 전화번호로 검색..."
                          value={patientSearchTerm}
                          onChange={(e) => {
                            setPatientSearchTerm(e.target.value);
                          }}
                          className="mb-2"
                        />
                        {searchingPatients ? (
                          <div className="p-2 text-center text-sm text-gray-500">검색 중...</div>
                        ) : patients.length === 0 ? (
                          <div className="p-2 text-center text-sm text-gray-500">
                            {patientSearchTerm.length < 2 
                              ? "2글자 이상 입력하세요" 
                              : "환자를 찾을 수 없습니다"}
                          </div>
                        ) : (
                          <div className="max-h-64 overflow-y-auto">
                            {patients.map((patient) => (
                              <button
                                key={patient.id}
                                type="button"
                                onClick={() => {
                                  field.onChange(patient.id);
                                  setPatientOpen(false);
                                }}
                                className="w-full flex items-center gap-2 p-2 hover:bg-gray-100 rounded text-left"
                              >
                                <Check
                                  className={cn(
                                    "h-4 w-4 shrink-0",
                                    field.value === patient.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex-1">
                                  <div className="font-medium">{patient.name}</div>
                                  <div className="text-sm text-gray-500">
                                    {patient.phone} · {format(parseISO(patient.date_of_birth), 'yyyy년생')}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  )}
                </Popover>
              )}
            />
            {errors.patient_id && (
              <p className="text-sm text-red-500">{errors.patient_id.message}</p>
            )}
          </div>

          {/* 검사 항목 선택 */}
          <div className="space-y-2">
            <Label>검사 항목</Label>
            <Controller
              name="examination_item_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="검사 항목을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {examinationItems.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        <div>
                          <div>{item.name}</div>
                          <div className="text-sm text-gray-500">
                            {item.category} · {item.duration_minutes}분
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.examination_item_id && (
              <p className="text-sm text-red-500">{errors.examination_item_id.message}</p>
            )}
            {selectedExamination && (
              <p className="text-sm text-gray-600">{selectedExamination.description}</p>
            )}
          </div>

          {/* 날짜 선택 */}
          <div className="space-y-2">
            <Label>예약 날짜</Label>
            <Controller
              name="scheduled_at"
              control={control}
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? (
                        format(field.value, "yyyy년 MM월 dd일 (EEE)", { locale: ko })
                      ) : (
                        <span>날짜를 선택하세요</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      disabled={(date) => isBefore(date, new Date())}
                      locale={ko}
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            {errors.scheduled_at && (
              <p className="text-sm text-red-500">{errors.scheduled_at.message}</p>
            )}
          </div>

          {/* 시간 선택 */}
          <div className="space-y-2">
            <Label>예약 시간</Label>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <Controller
                name="scheduled_time"
                control={control}
                render={({ field }) => (
                  <Input
                    type="time"
                    {...field}
                    min="09:00"
                    max="18:00"
                    step="600" // 10분 단위
                  />
                )}
              />
            </div>
            {errors.scheduled_time && (
              <p className="text-sm text-red-500">{errors.scheduled_time.message}</p>
            )}
          </div>

          {/* 예약 가능 여부 표시 */}
          {availabilityMessage && (
            <div
              className={cn(
                "flex items-center space-x-2 p-3 rounded-md",
                isAvailable
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              )}
            >
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{availabilityMessage}</span>
            </div>
          )}

          {/* 메모 */}
          <div className="space-y-2">
            <Label>메모 (선택)</Label>
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="예약 관련 메모를 입력하세요"
                />
              )}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || checkingAvailability || !isAvailable}
            >
              {isSubmitting ? "예약 중..." : "예약 등록"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}