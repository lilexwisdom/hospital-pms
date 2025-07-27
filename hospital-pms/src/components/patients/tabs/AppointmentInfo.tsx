'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  Plus,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface AppointmentInfoProps {
  patientId: string;
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  type: 'consultation' | 'examination' | 'treatment' | 'followup';
  location: string;
  doctor: string;
  department: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
}

export function AppointmentInfo({ patientId }: AppointmentInfoProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  useEffect(() => {
    // TODO: Fetch appointments from database
    // Mock data for now
    setAppointments([
      {
        id: '1',
        date: '2024-01-25',
        time: '10:00',
        type: 'consultation',
        location: '3층 내과 진료실',
        doctor: '김의사',
        department: '내과',
        status: 'scheduled',
        notes: '혈압약 처방 관련 상담'
      },
      {
        id: '2',
        date: '2024-01-15',
        time: '14:30',
        type: 'examination',
        location: '2층 검사실',
        doctor: '이의사',
        department: '진단검사의학과',
        status: 'completed',
        notes: '정기 혈액검사'
      },
      {
        id: '3',
        date: '2024-02-05',
        time: '11:00',
        type: 'followup',
        location: '3층 내과 진료실',
        doctor: '김의사',
        department: '내과',
        status: 'scheduled'
      }
    ]);
    setLoading(false);
  }, [patientId]);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'consultation':
        return '진료';
      case 'examination':
        return '검사';
      case 'treatment':
        return '치료';
      case 'followup':
        return '경과관찰';
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'consultation':
        return 'bg-blue-100 text-blue-800';
      case 'examination':
        return 'bg-green-100 text-green-800';
      case 'treatment':
        return 'bg-purple-100 text-purple-800';
      case 'followup':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'cancelled':
        return 'outline';
      case 'no-show':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled':
        return '예정';
      case 'completed':
        return '완료';
      case 'cancelled':
        return '취소';
      case 'no-show':
        return '미방문';
      default:
        return status;
    }
  };

  const getAppointmentsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return appointments.filter(apt => apt.date === dateStr);
  };

  const upcomingAppointments = appointments
    .filter(apt => new Date(apt.date) >= new Date() && apt.status === 'scheduled')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const pastAppointments = appointments
    .filter(apt => new Date(apt.date) < new Date() || apt.status !== 'scheduled')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              예약 정보
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('calendar')}
              >
                캘린더
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                목록
              </Button>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                예약 추가
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {viewMode === 'calendar' ? (
        // Calendar View
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <div className="relative">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    locale={ko}
                    className="rounded-md border"
                    modifiers={{
                      hasAppointments: (date) => {
                        const dateStr = format(date, 'yyyy-MM-dd');
                        return appointments.some(apt => apt.date === dateStr);
                      }
                    }}
                    modifiersClassNames={{
                      hasAppointments: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full"
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {format(selectedDate, 'yyyy년 MM월 dd일', { locale: ko })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {getAppointmentsForDate(selectedDate).length > 0 ? (
                  <div className="space-y-3">
                    {getAppointmentsForDate(selectedDate).map((apt) => (
                      <div key={apt.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className={cn('text-xs px-2 py-1 rounded', getTypeColor(apt.type))}>
                            {getTypeLabel(apt.type)}
                          </span>
                          <Badge variant={getStatusVariant(apt.status)}>
                            {getStatusLabel(apt.status)}
                          </Badge>
                        </div>
                        <p className="font-medium text-sm">{apt.time}</p>
                        <p className="text-sm text-muted-foreground">{apt.doctor} - {apt.department}</p>
                        <p className="text-sm text-muted-foreground">{apt.location}</p>
                        {apt.notes && (
                          <p className="text-sm mt-2">{apt.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">이 날짜에 예약이 없습니다</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        // List View
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Appointments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">예정된 예약</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingAppointments.length > 0 ? (
                <div className="space-y-3">
                  {upcomingAppointments.map((apt) => (
                    <div key={apt.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn('text-xs px-2 py-1 rounded', getTypeColor(apt.type))}>
                              {getTypeLabel(apt.type)}
                            </span>
                            <Badge variant={getStatusVariant(apt.status)}>
                              {getStatusLabel(apt.status)}
                            </Badge>
                          </div>
                          <p className="font-medium">
                            {format(new Date(apt.date), 'yyyy년 MM월 dd일', { locale: ko })} {apt.time}
                          </p>
                        </div>
                        <Button size="sm" variant="outline">
                          상세
                        </Button>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {apt.doctor} - {apt.department}
                        </p>
                        <p className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {apt.location}
                        </p>
                        {apt.notes && (
                          <p className="flex items-start gap-1 mt-2">
                            <AlertCircle className="h-3 w-3 mt-0.5" />
                            {apt.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">예정된 예약이 없습니다</p>
                  <Button variant="outline" className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    예약 추가
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Past Appointments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">지난 예약</CardTitle>
            </CardHeader>
            <CardContent>
              {pastAppointments.length > 0 ? (
                <div className="space-y-3">
                  {pastAppointments.map((apt) => (
                    <div key={apt.id} className="border rounded-lg p-4 opacity-75">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn('text-xs px-2 py-1 rounded', getTypeColor(apt.type))}>
                              {getTypeLabel(apt.type)}
                            </span>
                            <Badge variant={getStatusVariant(apt.status)}>
                              {getStatusLabel(apt.status)}
                            </Badge>
                          </div>
                          <p className="font-medium text-sm">
                            {format(new Date(apt.date), 'yyyy년 MM월 dd일', { locale: ko })} {apt.time}
                          </p>
                        </div>
                        <Button size="sm" variant="ghost">
                          상세
                        </Button>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>{apt.doctor} - {apt.department}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">지난 예약이 없습니다</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}