'use client';

import { useState } from 'react';
import { PageContainer } from '@/components/layout';
import { PageHeader, PageHeaderAction } from '@/components/ui/page-header';
import { SearchInput, SearchBar } from '@/components/ui/search-input';
import { DataTable } from '@/components/ui/data-table';
import { LoadingSpinner, LoadingOverlay, LoadingDots, PageLoading } from '@/components/ui/loading-spinner';
import { ErrorBoundary, ErrorFallback } from '@/components/ui/error-boundary';
import { StatusBadge, RoleBadge, PriorityBadge } from '@/components/ui/status-badge';
import { AppointmentStatusIndicator, AppointmentTimeline } from '@/components/ui/appointment-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Download } from 'lucide-react';

// Sample data for DataTable
const samplePatients = [
  { id: 1, name: '홍길동', age: 45, gender: '남', phone: '010-1234-5678', status: 'active' },
  { id: 2, name: '김영희', age: 32, gender: '여', phone: '010-2345-6789', status: 'active' },
  { id: 3, name: '이철수', age: 58, gender: '남', phone: '010-3456-7890', status: 'inactive' },
  { id: 4, name: '박민정', age: 29, gender: '여', phone: '010-4567-8901', status: 'active' },
  { id: 5, name: '정대한', age: 67, gender: '남', phone: '010-5678-9012', status: 'active' },
];

// Sample appointments for status demo
const sampleAppointments = [
  { id: 1, patient: '홍길동', time: '09:00', status: 'pending' as const },
  { id: 2, patient: '김영희', time: '10:00', status: 'confirmed' as const },
  { id: 3, patient: '이철수', time: '11:00', status: 'completed' as const },
  { id: 4, patient: '박민정', time: '14:00', status: 'cancelled' as const },
  { id: 5, patient: '정대한', time: '15:00', status: 'no_show' as const },
];

export default function UIDemo() {
  const [searchValue, setSearchValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [throwError, setThrowError] = useState(false);

  // Simulate error for ErrorBoundary demo
  if (throwError) {
    throw new Error('테스트 오류입니다!');
  }

  // DataTable columns configuration
  const patientColumns = [
    { key: 'id', header: 'ID', sortable: true },
    { key: 'name', header: '이름', sortable: true },
    { key: 'age', header: '나이', sortable: true },
    { key: 'gender', header: '성별' },
    { key: 'phone', header: '연락처' },
    {
      key: 'status',
      header: '상태',
      accessor: (row: typeof samplePatients[0]) => (
        <Badge variant={row.status === 'active' ? 'default' : 'secondary'}>
          {row.status === 'active' ? '활성' : '비활성'}
        </Badge>
      ),
    },
  ];

  return (
    <PageContainer
      title="UI 컴포넌트 데모"
      description="Hospital PMS의 공통 UI 컴포넌트를 확인하세요"
    >
      <Tabs defaultValue="headers" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="headers">헤더/검색</TabsTrigger>
          <TabsTrigger value="table">데이터 테이블</TabsTrigger>
          <TabsTrigger value="status">상태 표시</TabsTrigger>
          <TabsTrigger value="loading">로딩/에러</TabsTrigger>
          <TabsTrigger value="navigation">네비게이션</TabsTrigger>
        </TabsList>

        {/* Headers and Search */}
        <TabsContent value="headers" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">페이지 헤더</h3>
            
            <div className="space-y-4">
              <PageHeader
                title="환자 관리"
                description="전체 환자 정보를 관리합니다"
              >
                <PageHeaderAction>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    내보내기
                  </Button>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    새 환자
                  </Button>
                </PageHeaderAction>
              </PageHeader>

              <PageHeader
                title="환자 상세정보"
                description="홍길동 (45세, 남)"
                showBack
                onBack={() => alert('뒤로 가기 클릭!')}
              />
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">검색 컴포넌트</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">기본 검색 입력</p>
                <SearchInput
                  value={searchValue}
                  onChange={setSearchValue}
                  onSearch={(value) => alert(`검색: ${value}`)}
                  placeholder="환자 이름으로 검색..."
                />
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">자동완성 검색</p>
                <SearchBar
                  onSearch={(value) => alert(`검색: ${value}`)}
                  placeholder="증상이나 진단명으로 검색..."
                  suggestions={['감기', '고혈압', '당뇨병', '두통', '복통']}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Data Table */}
        <TabsContent value="table">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">데이터 테이블</h3>
            
            <DataTable
              data={samplePatients}
              columns={patientColumns}
              pageSize={3}
              onRowClick={(row) => alert(`환자 선택: ${row.name}`)}
            />
          </Card>
        </TabsContent>

        {/* Status Indicators */}
        <TabsContent value="status" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">상태 배지</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">예약 상태</p>
                <div className="flex gap-2 flex-wrap">
                  <StatusBadge status="pending" />
                  <StatusBadge status="confirmed" />
                  <StatusBadge status="completed" />
                  <StatusBadge status="cancelled" />
                  <StatusBadge status="no_show" />
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">사용자 역할</p>
                <div className="flex gap-2 flex-wrap">
                  <RoleBadge role="admin" />
                  <RoleBadge role="manager" />
                  <RoleBadge role="bd" />
                  <RoleBadge role="cs" />
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">우선순위</p>
                <div className="flex gap-2 flex-wrap">
                  <PriorityBadge priority="high" />
                  <PriorityBadge priority="medium" />
                  <PriorityBadge priority="low" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">예약 상태 표시</h3>
            
            <div className="space-y-6">
              <div className="space-y-3">
                {sampleAppointments.map((apt) => (
                  <div key={apt.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{apt.patient}</p>
                      <p className="text-sm text-muted-foreground">{apt.time}</p>
                    </div>
                    <AppointmentStatusIndicator status={apt.status} />
                  </div>
                ))}
              </div>

              <div>
                <p className="text-sm font-medium mb-3">예약 진행 상황</p>
                <div className="space-y-4">
                  <AppointmentTimeline status="pending" />
                  <AppointmentTimeline status="confirmed" />
                  <AppointmentTimeline status="completed" />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Loading and Error States */}
        <TabsContent value="loading" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">로딩 상태</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-sm mb-2">Small</p>
                <LoadingSpinner size="sm" />
              </div>
              <div className="text-center">
                <p className="text-sm mb-2">Medium</p>
                <LoadingSpinner size="md" />
              </div>
              <div className="text-center">
                <p className="text-sm mb-2">Large</p>
                <LoadingSpinner size="lg" />
              </div>
              <div className="text-center">
                <p className="text-sm mb-2">With Text</p>
                <LoadingSpinner size="md" text="로딩중..." />
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <Button onClick={() => setIsLoading(!isLoading)}>
                로딩 오버레이 토글
              </Button>
              
              <div className="relative h-32 border rounded">
                <p className="p-4">콘텐츠 영역</p>
                <LoadingOverlay show={isLoading} text="데이터를 불러오는 중..." />
              </div>
              
              <p>
                로딩 점 애니메이션: <LoadingDots />
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">에러 처리</h3>
            
            <ErrorBoundary
              fallback={({ error, reset }) => (
                <ErrorFallback error={error} reset={reset} />
              )}
            >
              <div className="space-y-4">
                <p>ErrorBoundary가 오류를 캐치하고 복구 옵션을 제공합니다.</p>
                <Button
                  variant="destructive"
                  onClick={() => setThrowError(true)}
                >
                  오류 발생시키기
                </Button>
              </div>
            </ErrorBoundary>
          </Card>
        </TabsContent>

        {/* Navigation Demo */}
        <TabsContent value="navigation">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">네비게이션 컴포넌트</h3>
            <p className="text-muted-foreground">
              네비게이션 컴포넌트는 DashboardLayout과 MobileLayout에서 확인할 수 있습니다.
              주요 기능:
            </p>
            <ul className="mt-4 space-y-2 list-disc list-inside text-sm">
              <li>역할 기반 메뉴 표시/숨김</li>
              <li>활성 상태 표시</li>
              <li>키보드 네비게이션 지원</li>
              <li>ARIA 레이블 및 접근성 최적화</li>
              <li>모바일 햄버거 메뉴</li>
              <li>축소 가능한 사이드바</li>
            </ul>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

// Fix missing Badge import
import { Badge } from '@/components/ui/badge';