'use client';

import React, { useState, useEffect } from 'react';
import { withProtectedRoute } from '@/components/auth/ProtectedRoute';
import { createClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react';

interface AuditLog {
  id: string;
  user_id: string;
  user_email: string;
  user_role: string;
  action: string;
  table_name: string;
  record_id: string;
  old_values: any;
  new_values: any;
  changed_fields: string[];
  version_before: number;
  version_after: number;
  created_at: string;
}

function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    table_name: 'all',
    action: 'all',
    user_email: '',
    date_from: '',
    date_to: '',
  });
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    fetchLogs();
  }, [page, filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters.table_name && filters.table_name !== 'all') {
        query = query.eq('table_name', filters.table_name);
      }
      if (filters.action && filters.action !== 'all') {
        query = query.eq('action', filters.action);
      }
      if (filters.user_email) {
        query = query.ilike('user_email', `%${filters.user_email}%`);
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      // Pagination
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      setLogs(data || []);
      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const toggleExpanded = (logId: string) => {
    setExpandedLog(expandedLog === logId ? null : logId);
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'INSERT': return 'text-green-600';
      case 'UPDATE': return 'text-blue-600';
      case 'DELETE': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">감사 로그</h1>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            필터
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Select 
              value={filters.table_name} 
              onValueChange={(value) => handleFilterChange('table_name', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="테이블 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="patients">환자</SelectItem>
                <SelectItem value="appointments">예약</SelectItem>
                <SelectItem value="medical_records">진료기록</SelectItem>
                <SelectItem value="survey_responses">설문응답</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={filters.action} 
              onValueChange={(value) => handleFilterChange('action', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="작업 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="INSERT">생성</SelectItem>
                <SelectItem value="UPDATE">수정</SelectItem>
                <SelectItem value="DELETE">삭제</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="사용자 이메일"
              value={filters.user_email}
              onChange={(e) => handleFilterChange('user_email', e.target.value)}
            />

            <Input
              type="date"
              placeholder="시작일"
              value={filters.date_from}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
            />

            <Input
              type="date"
              placeholder="종료일"
              value={filters.date_to}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">시간</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">사용자</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">작업</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">테이블</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">변경 내용</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">버전</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8">로딩 중...</td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8">감사 로그가 없습니다.</td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <React.Fragment key={log.id}>
                      <tr 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => toggleExpanded(log.id)}
                      >
                        <td className="px-4 py-3 text-sm">
                          {format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss', { locale: ko })}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div>{log.user_email}</div>
                          <div className="text-xs text-gray-500">{log.user_role}</div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`font-medium ${getActionColor(log.action)}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">{log.table_name}</td>
                        <td className="px-4 py-3 text-sm">
                          {log.changed_fields?.length > 0 ? (
                            <span className="text-xs">
                              {log.changed_fields.join(', ')}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {log.version_before && log.version_after ? (
                            <span>{log.version_before} → {log.version_after}</span>
                          ) : log.version_after ? (
                            <span>{log.version_after}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                      {expandedLog === log.id && (
                        <tr>
                          <td colSpan={6} className="px-4 py-4 bg-gray-50">
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium mb-2">상세 정보</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="font-medium">레코드 ID:</span> {log.record_id}
                                  </div>
                                  <div>
                                    <span className="font-medium">사용자 ID:</span> {log.user_id}
                                  </div>
                                </div>
                              </div>
                              
                              {log.old_values && (
                                <div>
                                  <h4 className="font-medium mb-2">이전 값</h4>
                                  <pre className="bg-white p-3 rounded text-xs overflow-auto max-h-48">
                                    {JSON.stringify(log.old_values, null, 2)}
                                  </pre>
                                </div>
                              )}
                              
                              {log.new_values && (
                                <div>
                                  <h4 className="font-medium mb-2">새 값</h4>
                                  <pre className="bg-white p-3 rounded text-xs overflow-auto max-h-48">
                                    {JSON.stringify(log.new_values, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-6">
        <div className="text-sm text-gray-700">
          전체 {totalPages}페이지 중 {page}페이지
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            이전
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
          >
            다음
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default withProtectedRoute(AuditLogsPage, {
  requiredRole: ['admin', 'manager'],
  fallbackUrl: '/unauthorized',
});