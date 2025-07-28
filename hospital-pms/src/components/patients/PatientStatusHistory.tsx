'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { 
  Timeline, 
  TimelineItem, 
  TimelineConnector, 
  TimelineContent, 
  TimelineDot, 
  TimelineOppositeContent,
  TimelineSeparator 
} from '@/components/ui/timeline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { getPatientStatusHistory } from '@/app/actions/patient-status';
import { StatusChangeHistory } from '@/lib/patient-status/types';
import { getStatusLabel, getStatusColor } from '@/lib/patient-status/config';
import { Clock, User, FileText } from 'lucide-react';

interface PatientStatusHistoryProps {
  patientId: string;
}

export function PatientStatusHistory({ patientId }: PatientStatusHistoryProps) {
  const [history, setHistory] = useState<StatusChangeHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, [patientId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const result = await getPatientStatusHistory(patientId);
      
      if (result.success && result.data) {
        setHistory(result.data);
      } else {
        setError(result.error || '이력을 불러올 수 없습니다.');
      }
    } catch (err) {
      setError('이력 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>상태 변경 이력</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>상태 변경 이력</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>상태 변경 이력</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            아직 상태 변경 이력이 없습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>상태 변경 이력</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <Timeline>
            {history.map((item, index) => (
              <TimelineItem key={item.id}>
                <TimelineOppositeContent className="text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(item.changed_at), 'yyyy.MM.dd HH:mm', { locale: ko })}
                  </div>
                </TimelineOppositeContent>
                <TimelineSeparator>
                  <TimelineDot className={`bg-${getStatusColor(item.to_status)}`} />
                  {index < history.length - 1 && <TimelineConnector />}
                </TimelineSeparator>
                <TimelineContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {item.from_status && (
                        <>
                          <Badge variant={getStatusColor(item.from_status) as any}>
                            {getStatusLabel(item.from_status)}
                          </Badge>
                          <span className="text-muted-foreground">→</span>
                        </>
                      )}
                      <Badge variant={getStatusColor(item.to_status) as any}>
                        {getStatusLabel(item.to_status)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>
                        {(item as any).changed_by_profile?.name || '알 수 없음'}
                        {' '}
                        ({(item as any).changed_by_profile?.role || ''})
                      </span>
                    </div>
                    
                    {item.notes && (
                      <div className="flex gap-2 text-sm">
                        <FileText className="h-3 w-3 text-muted-foreground mt-0.5" />
                        <p className="text-foreground">{item.notes}</p>
                      </div>
                    )}
                    
                    {item.metadata?.assigned_manager_changed && (
                      <p className="text-sm text-muted-foreground">
                        담당자가 변경되었습니다
                      </p>
                    )}
                  </div>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}