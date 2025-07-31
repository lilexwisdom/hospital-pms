'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { withProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreateAppointmentModal } from '@/components/appointments/CreateAppointmentModal';
import { AppointmentCalendar } from '@/components/appointments/AppointmentCalendar';
import { format, startOfDay, endOfDay, parseISO, addDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Plus, Calendar as CalendarIcon, Clock, User, FileText, Grid3x3, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Appointment {
  id: string;
  patient_id: string;
  examination_item_id: string;
  scheduled_at: string;
  status: string;
  cs_notes: string | null;
  created_at: string;
  patient: {
    name: string;
    phone: string;
  };
  examination_item: {
    name: string;
    category: string;
    duration_minutes: number;
  };
}

function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate, viewMode]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patients!appointments_patient_id_fkey (name, phone),
          examination_item:examination_items!appointments_examination_item_id_fkey (name, category, duration_minutes)
        `)
        .order('scheduled_at', { ascending: true });

      if (error) throw error;

      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: '대기중', className: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: '확정', className: 'bg-blue-100 text-blue-800' },
      completed: { label: '완료', className: 'bg-gray-100 text-gray-800' },
      cancelled: { label: '취소됨', className: 'bg-red-100 text-red-800' },
      no_show: { label: '노쇼', className: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      className: 'bg-gray-100 text-gray-800',
    };

    return (
      <Badge className={cn('font-normal', config.className)}>
        {config.label}
      </Badge>
    );
  };

  const groupAppointmentsByHour = () => {
    const hourlyAppointments: { [key: string]: Appointment[] } = {};
    
    // 09:00 ~ 18:00 시간대 초기화
    for (let hour = 9; hour < 18; hour++) {
      hourlyAppointments[`${hour.toString().padStart(2, '0')}:00`] = [];
    }

    appointments.forEach(appointment => {
      const date = parseISO(appointment.scheduled_at);
      const hourKey = format(date, 'HH:00');
      if (hourlyAppointments[hourKey]) {
        hourlyAppointments[hourKey].push(appointment);
      }
    });

    return hourlyAppointments;
  };

  const hourlyAppointments = groupAppointmentsByHour();

  const handleAppointmentClick = (appointment: any) => {
    // TODO: Open appointment details/edit modal
    console.log('Appointment clicked:', appointment);
  };

  const handleCreateAppointment = () => {
    setCreateModalOpen(true);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">예약 관리</h1>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            onClick={() => setViewMode('calendar')}
          >
            <Grid3x3 className="h-4 w-4 mr-2" />
            캘린더 뷰
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4 mr-2" />
            리스트 뷰
          </Button>
          <Button onClick={handleCreateAppointment}>
            <Plus className="h-4 w-4 mr-2" />
            새 예약
          </Button>
        </div>
      </div>

      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'calendar' | 'list')}>
        <TabsContent value="calendar" className="mt-0">
          {/* FullCalendar View */}
          <AppointmentCalendar
            onAppointmentClick={handleAppointmentClick}
            onCreateAppointment={handleCreateAppointment}
          />

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  오늘 예약
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {appointments.filter(apt => 
                    format(parseISO(apt.scheduled_at), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                  ).length}
                </p>
                <p className="text-xs text-muted-foreground">건</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  이번 주 예약
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{appointments.length}</p>
                <p className="text-xs text-muted-foreground">건</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  대기 중
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {appointments.filter(apt => apt.status === 'pending').length}
                </p>
                <p className="text-xs text-muted-foreground">건</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  완료
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {appointments.filter(apt => apt.status === 'completed').length}
                </p>
                <p className="text-xs text-muted-foreground">건</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="list" className="mt-0">
          {/* Original List View */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                전체 예약 목록
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-500">로딩 중...</div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(hourlyAppointments).map(([hour, hourAppointments]) => (
                    <div key={hour} className="border-b pb-4 last:border-0">
                      <div className="flex items-start gap-4">
                        <div className="w-20 flex-shrink-0">
                          <div className="text-sm font-medium text-gray-600">{hour}</div>
                        </div>
                        <div className="flex-1">
                          {hourAppointments.length === 0 ? (
                            <div className="text-sm text-gray-400">예약 없음</div>
                          ) : (
                            <div className="space-y-2">
                              {hourAppointments.map((appointment) => (
                                <div
                                  key={appointment.id}
                                  className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors cursor-pointer"
                                  onClick={() => handleAppointmentClick(appointment)}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-gray-500" />
                                        <span className="font-medium">
                                          {appointment.patient.name}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                          ({appointment.patient.phone})
                                        </span>
                                        {getStatusBadge(appointment.status)}
                                      </div>
                                      <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <FileText className="h-3 w-3" />
                                        {appointment.examination_item.name}
                                        <span className="text-gray-400">•</span>
                                        <Clock className="h-3 w-3" />
                                        {appointment.examination_item.duration_minutes}분
                                      </div>
                                      {appointment.cs_notes && (
                                        <div className="text-sm text-gray-500 mt-1">
                                          메모: {appointment.cs_notes}
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {format(parseISO(appointment.scheduled_at), 'HH:mm')}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CreateAppointmentModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={fetchAppointments}
      />
    </div>
  );
}

export default withProtectedRoute(AppointmentsPage, {
  requiredRole: ['admin', 'manager', 'cs', 'bd'],
});