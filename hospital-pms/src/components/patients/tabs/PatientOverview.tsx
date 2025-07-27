'use client';

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
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface PatientOverviewProps {
  patient: Patient;
}

export function PatientOverview({ patient }: PatientOverviewProps) {
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'inactive':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return '활성';
      case 'pending':
        return '대기중';
      case 'inactive':
        return '비활성';
      default:
        return status;
    }
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
                <Badge variant={getStatusBadgeVariant(patient.status)}>
                  {getStatusLabel(patient.status)}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">담당자:</span>
                <span className="font-medium">
                  {patient.assigned_bd_profile?.name || '미할당'}
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
    </div>
  );
}