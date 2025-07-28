'use client';

import { useState } from 'react';
import { Patient } from '@/types/patient.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Phone, 
  Mail, 
  Calendar, 
  User, 
  MapPin,
  Activity,
  FileText,
  AlertCircle,
  Edit2
} from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { PatientStatus } from '@/lib/patient-status/types';
import { getStatusLabel, getStatusColor } from '@/lib/patient-status/config';
import { PatientStatusChange } from '@/components/patients/PatientStatusChange';
import { usePatientPermissions } from '@/hooks/usePatientPermissions';

interface PatientOverviewProps {
  patient: Patient;
  onStatusChange?: () => void;
}

export function PatientOverview({ patient, onStatusChange }: PatientOverviewProps) {
  const [statusChangeOpen, setStatusChangeOpen] = useState(false);
  
  const permissions = usePatientPermissions({
    patientId: patient.id,
    currentStatus: patient.status as PatientStatus,
    createdBy: patient.created_by || undefined,
    assignedTo: patient.assigned_bd_id || undefined,
    csManager: patient.cs_manager || undefined
  });

  const getStatusBadgeVariant = (status: string) => {
    return getStatusColor(status as PatientStatus);
  };

  return (
    <div className="grid gap-6">
      {/* 기본 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">이름:</span>
                <span className="font-medium">{patient.name}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">생년월일:</span>
                <span className="font-medium">
                  {patient.date_of_birth 
                    ? format(new Date(patient.date_of_birth), 'yyyy년 MM월 dd일', { locale: ko })
                    : '-'}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">연락처:</span>
                <span className="font-medium">{patient.phone || '-'}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">이메일:</span>
                <span className="font-medium">{patient.email || '-'}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">주소:</span>
                <span className="font-medium">
                  {patient.address?.roadAddress 
                    ? `${patient.address.roadAddress} ${patient.address.addressDetail || ''}`
                    : '-'}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">상태:</span>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusBadgeVariant(patient.status) as any}>
                    {getStatusLabel(patient.status as PatientStatus)}
                  </Badge>
                  {permissions.canChangeStatus && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setStatusChangeOpen(true)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">BD 담당자:</span>
                <span className="font-medium">
                  {patient.assigned_bd_profile?.name || '미할당'}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">CS 담당자:</span>
                <span className="font-medium">
                  {patient.cs_manager_profile?.name || '미할당'}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">등록일:</span>
                <span className="font-medium">
                  {format(new Date(patient.created_at), 'yyyy년 MM월 dd일', { locale: ko })}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 건강 상태 요약 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            건강 상태 요약
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {patient.flag_diabetes ? '있음' : '없음'}
              </div>
              <div className="text-sm text-muted-foreground">당뇨병</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {patient.flag_hypertension ? '있음' : '없음'}
              </div>
              <div className="text-sm text-muted-foreground">고혈압</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {patient.flag_hyperlipidemia ? '있음' : '없음'}
              </div>
              <div className="text-sm text-muted-foreground">고지혈증</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {patient.flag_cardiovascular ? '있음' : '없음'}
              </div>
              <div className="text-sm text-muted-foreground">심혈관질환</div>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* 빠른 작업 */}
      <Card>
        <CardHeader>
          <CardTitle>빠른 작업</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              <Phone className="mr-2 h-4 w-4" />
              전화 걸기
            </Button>
            <Button variant="outline" size="sm">
              <Mail className="mr-2 h-4 w-4" />
              이메일 보내기
            </Button>
            <Button variant="outline" size="sm">
              <Calendar className="mr-2 h-4 w-4" />
              예약 잡기
            </Button>
            <Button variant="outline" size="sm">
              <FileText className="mr-2 h-4 w-4" />
              상담 기록 추가
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status Change Dialog */}
      <PatientStatusChange
        open={statusChangeOpen}
        onOpenChange={setStatusChangeOpen}
        patientId={patient.id}
        currentStatus={patient.status as PatientStatus}
        patientName={patient.name}
        createdBy={patient.created_by || undefined}
        assignedTo={patient.assigned_bd_id || undefined}
        csManager={patient.cs_manager || undefined}
        onSuccess={() => {
          setStatusChangeOpen(false);
          onStatusChange?.();
        }}
      />
    </div>
  );
}