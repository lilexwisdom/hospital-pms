'use client';

import { useState, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { EventClickArg, EventDropArg, EventApi, DateSelectArg } from '@fullcalendar/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar, ChevronLeft, ChevronRight, Plus, Grid3x3, List, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';

interface Appointment {
  id: string;
  patient_id: string;
  patient?: {
    name: string;
    phone: string;
  };
  examination_item_id: string;
  examination_item?: {
    name: string;
    category: string;
    duration_minutes: number;
  };
  scheduled_at: string;
  status: string;
  cs_notes: string | null;
  created_at: string;
}

interface AppointmentCalendarProps {
  patientId?: string;
  doctorId?: string;
  departmentId?: string;
  onAppointmentClick?: (appointment: Appointment) => void;
  onCreateAppointment?: () => void;
}

export function AppointmentCalendar({
  patientId,
  doctorId,
  departmentId,
  onAppointmentClick,
  onCreateAppointment
}: AppointmentCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const [view, setView] = useState('dayGridMonth');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchAppointments();
  }, [patientId, doctorId, departmentId]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('appointments')
        .select(`
          *,
          patients (
            name
          )
        `);

      if (patientId) {
        query = query.eq('patient_id', patientId);
      }
      if (doctorId) {
        query = query.eq('doctor_id', doctorId);
      }
      if (departmentId) {
        query = query.eq('department_id', departmentId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('예약 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getEventColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#f59e0b'; // amber
      case 'confirmed':
        return '#3b82f6'; // blue
      case 'completed':
        return '#10b981'; // green
      case 'cancelled':
        return '#ef4444'; // red
      case 'no_show':
        return '#dc2626'; // red-600
      default:
        return '#6b7280'; // gray
    }
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const appointment = appointments.find(apt => apt.id === clickInfo.event.id);
    if (appointment) {
      setSelectedAppointment(appointment);
      setShowDetails(true);
      if (onAppointmentClick) {
        onAppointmentClick(appointment);
      }
    }
  };

  const handleEventDrop = async (dropInfo: EventDropArg) => {
    const appointment = appointments.find(apt => apt.id === dropInfo.event.id);
    if (!appointment) return;

    const newDateTime = dropInfo.event.start!;

    try {
      // Check for conflicts
      const { data: conflicts, error: conflictError } = await supabase
        .rpc('check_appointment_conflicts', {
          p_examination_item_id: appointment.examination_item_id,
          p_scheduled_at: newDateTime.toISOString(),
          p_exclude_id: appointment.id
        });

      if (conflictError) throw conflictError;

      if (conflicts && conflicts.length > 0) {
        toast.error('선택한 시간에 이미 다른 예약이 있습니다.');
        dropInfo.revert();
        return;
      }

      // Update appointment
      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          scheduled_at: newDateTime.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', appointment.id);

      if (updateError) throw updateError;

      toast.success('예약이 성공적으로 변경되었습니다.');
      fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast.error('예약 변경에 실패했습니다.');
      dropInfo.revert();
    }
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    if (onCreateAppointment) {
      onCreateAppointment();
    }
  };

  const calendarEvents = appointments.map(apt => {
    const startDateTime = new Date(apt.scheduled_at);
    const duration = apt.examination_item?.duration_minutes || 30;
    const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

    return {
      id: apt.id,
      title: `${apt.patient?.name || 'Unknown'} - ${apt.examination_item?.name || 'Unknown'}`,
      start: startDateTime,
      end: endDateTime,
      backgroundColor: getEventColor(apt.status),
      borderColor: getEventColor(apt.status),
      extendedProps: {
        appointment: apt
      }
    };
  });

  const handleViewChange = (newView: string) => {
    setView(newView);
    if (calendarRef.current) {
      calendarRef.current.getApi().changeView(newView);
    }
  };

  const handlePrev = () => {
    if (calendarRef.current) {
      calendarRef.current.getApi().prev();
    }
  };

  const handleNext = () => {
    if (calendarRef.current) {
      calendarRef.current.getApi().next();
    }
  };

  const handleToday = () => {
    if (calendarRef.current) {
      calendarRef.current.getApi().today();
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            예약 캘린더
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={handlePrev}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleToday}>
                오늘
              </Button>
              <Button variant="outline" size="icon" onClick={handleNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {view === 'dayGridMonth' && <Grid3x3 className="mr-2 h-4 w-4" />}
                  {view === 'timeGridWeek' && <CalendarDays className="mr-2 h-4 w-4" />}
                  {view === 'timeGridDay' && <Calendar className="mr-2 h-4 w-4" />}
                  {view === 'listWeek' && <List className="mr-2 h-4 w-4" />}
                  {view === 'dayGridMonth' && '월'}
                  {view === 'timeGridWeek' && '주'}
                  {view === 'timeGridDay' && '일'}
                  {view === 'listWeek' && '목록'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleViewChange('dayGridMonth')}>
                  <Grid3x3 className="mr-2 h-4 w-4" />
                  월별 보기
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleViewChange('timeGridWeek')}>
                  <CalendarDays className="mr-2 h-4 w-4" />
                  주별 보기
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleViewChange('timeGridDay')}>
                  <Calendar className="mr-2 h-4 w-4" />
                  일별 보기
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleViewChange('listWeek')}>
                  <List className="mr-2 h-4 w-4" />
                  목록 보기
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {onCreateAppointment && (
              <Button onClick={onCreateAppointment}>
                <Plus className="mr-2 h-4 w-4" />
                예약 추가
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView={view}
          locale="ko"
          headerToolbar={false}
          height="auto"
          events={calendarEvents}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          dateClick={handleDateSelect}
          selectable={true}
          selectMirror={true}
          editable={true}
          droppable={true}
          dayMaxEvents={true}
          weekends={true}
          slotMinTime="08:00:00"
          slotMaxTime="20:00:00"
          slotDuration="00:30:00"
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: false
          }}
          eventClassNames="cursor-pointer"
        />
      </CardContent>

      {/* Appointment Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>예약 상세 정보</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">환자명</p>
                <p className="font-medium">{selectedAppointment.patient?.name || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">검사 항목</p>
                <p className="font-medium">{selectedAppointment.examination_item?.name || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">날짜 및 시간</p>
                <p className="font-medium">
                  {format(new Date(selectedAppointment.scheduled_at), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">소요 시간</p>
                <p className="font-medium">{selectedAppointment.examination_item?.duration_minutes || 30}분</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">상태</p>
                <Badge variant={selectedAppointment.status === 'confirmed' ? 'default' : 'secondary'}>
                  {selectedAppointment.status === 'pending' && '대기중'}
                  {selectedAppointment.status === 'confirmed' && '확정'}
                  {selectedAppointment.status === 'completed' && '완료'}
                  {selectedAppointment.status === 'cancelled' && '취소'}
                  {selectedAppointment.status === 'no_show' && '노쇼'}
                </Badge>
              </div>
              {selectedAppointment.cs_notes && (
                <div>
                  <p className="text-sm text-muted-foreground">메모</p>
                  <p className="font-medium">{selectedAppointment.cs_notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}