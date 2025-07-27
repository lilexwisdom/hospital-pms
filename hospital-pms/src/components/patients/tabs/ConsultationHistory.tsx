'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  MessageSquare,
  Calendar,
  User,
  Search,
  Filter,
  Plus,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ConsultationHistoryProps {
  patientId: string;
}

interface Consultation {
  id: string;
  date: string;
  type: 'phone' | 'email' | 'visit' | 'message';
  consultant: string;
  department: string;
  summary: string;
  details: string;
  status: 'completed' | 'scheduled' | 'cancelled';
  duration?: number; // in minutes
  attachments?: string[];
}

export function ConsultationHistory({ patientId }: ConsultationHistoryProps) {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // TODO: Fetch consultation history from database
    // Mock data for now
    setConsultations([
      {
        id: '1',
        date: '2024-01-15T10:30:00',
        type: 'phone',
        consultant: '김상담 (CS)',
        department: '고객서비스',
        summary: '정기 건강 상태 확인',
        details: '환자분께서 최근 혈압약 복용 후 어지러움을 호소하셨습니다. 담당 의사와 상의하여 약물 조정이 필요할 것으로 보입니다.',
        status: 'completed',
        duration: 15
      },
      {
        id: '2',
        date: '2024-01-10T14:00:00',
        type: 'visit',
        consultant: '이매니저 (Manager)',
        department: '관리팀',
        summary: '병원 방문 상담',
        details: '정기 검진 결과 상담. 혈당 수치가 개선되고 있으며, 현재 치료 계획을 유지하기로 함.',
        status: 'completed',
        duration: 30
      },
      {
        id: '3',
        date: '2024-01-20T09:00:00',
        type: 'email',
        consultant: '박상담 (CS)',
        department: '고객서비스',
        summary: '검사 결과 문의',
        details: '최근 혈액 검사 결과에 대한 문의. 상세 설명 자료를 이메일로 발송함.',
        status: 'completed',
        attachments: ['blood_test_results.pdf']
      }
    ]);
    setLoading(false);
  }, [patientId]);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'phone':
        return <Phone className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'visit':
        return <User className="h-4 w-4" />;
      case 'message':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'phone':
        return '전화 상담';
      case 'email':
        return '이메일';
      case 'visit':
        return '방문 상담';
      case 'message':
        return '메시지';
      default:
        return type;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'scheduled':
        return 'secondary';
      case 'cancelled':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return '완료';
      case 'scheduled':
        return '예정';
      case 'cancelled':
        return '취소';
      default:
        return status;
    }
  };

  const filteredConsultations = consultations.filter(consultation => {
    const matchesSearch = searchTerm === '' || 
      consultation.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consultation.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consultation.consultant.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || consultation.type === filterType;
    
    return matchesSearch && matchesType;
  });

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              상담 이력
            </CardTitle>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              상담 기록 추가
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="상담 내용 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="상담 유형" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 유형</SelectItem>
                <SelectItem value="phone">전화 상담</SelectItem>
                <SelectItem value="email">이메일</SelectItem>
                <SelectItem value="visit">방문 상담</SelectItem>
                <SelectItem value="message">메시지</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Consultation Timeline */}
      <div className="space-y-4">
        {filteredConsultations.length > 0 ? (
          filteredConsultations.map((consultation) => (
            <Card key={consultation.id} className="overflow-hidden">
              <div 
                className="p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleExpand(consultation.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getTypeIcon(consultation.type)}
                      <span className="font-medium">{consultation.summary}</span>
                      <Badge variant={getStatusVariant(consultation.status)}>
                        {getStatusLabel(consultation.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(consultation.date), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {consultation.consultant}
                      </span>
                      <span>{getTypeLabel(consultation.type)}</span>
                      {consultation.duration && (
                        <span>{consultation.duration}분</span>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    {expandedIds.has(consultation.id) ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              {expandedIds.has(consultation.id) && (
                <div className="border-t px-4 py-3 bg-gray-50">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-1">상담 내용</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {consultation.details}
                      </p>
                    </div>
                    
                    {consultation.attachments && consultation.attachments.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-1">첨부 파일</p>
                        <div className="flex flex-wrap gap-2">
                          {consultation.attachments.map((file, index) => (
                            <Badge key={index} variant="secondary" className="cursor-pointer">
                              <FileText className="mr-1 h-3 w-3" />
                              {file}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        수정
                      </Button>
                      <Button size="sm" variant="outline">
                        삭제
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">상담 이력이 없습니다</p>
              <Button variant="outline" className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                첫 상담 기록 추가
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}