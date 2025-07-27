'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ShowForRole, CanAccess } from '@/components/auth/ProtectedRoute';
import { PageContainer, StatsGrid, CardGrid } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SurveyResponseStats } from '@/components/dashboard/SurveyResponseStats';
import { RealtimeNotificationProvider } from '@/components/notifications/RealtimeNotificationProvider';
import { Loader2 } from 'lucide-react';

export default function Dashboard() {
  const { user, profile, role, loading, isAuthenticated } = useAuth();

  // Create or fix profile on mount if needed
  useEffect(() => {
    const fixProfile = async () => {
      if (!loading && isAuthenticated && !profile && user?.id) {
        try {
          const response = await fetch('/api/fix-profile', { 
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.profile) {
              // Reload to get fresh auth state
              window.location.reload();
            }
          }
        } catch (error) {
          console.error('Error fixing profile:', error);
        }
      }
    };

    fixProfile();
  }, [loading, isAuthenticated, profile, user]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If not authenticated after loading, don't render dashboard
  if (!loading && !isAuthenticated) {
    return null;
  }

  // Show debug info in development
  const debugInfo = process.env.NODE_ENV === 'development' ? (
    <div className="mb-4 p-4 bg-muted rounded-lg text-sm">
      <p>Debug Info:</p>
      <p>- Loading: {loading ? 'Yes' : 'No'}</p>
      <p>- Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
      <p>- User ID: {user?.id || 'None'}</p>
      <p>- Profile: {profile ? `${profile.name} (${profile.role})` : 'None'}</p>
      <p>- Role: {role || 'None'}</p>
    </div>
  ) : null;

  return (
    <RealtimeNotificationProvider>
      <PageContainer
        title="대시보드"
        description={loading ? '로딩중...' : `안녕하세요, ${profile?.name || user?.email || '사용자'}님. 역할: ${role || '확인중...'}`}
      >
      {debugInfo}
      {/* 통계 카드 섹션 */}
      <StatsGrid className="mb-8">
        <Card className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground">오늘의 예약</h3>
          <p className="text-2xl font-bold mt-2">12</p>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground">대기 중인 환자</h3>
          <p className="text-2xl font-bold mt-2">5</p>
        </Card>
        
        <ShowForRole role={['admin', 'manager']}>
          <Card className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground">총 환자 수</h3>
            <p className="text-2xl font-bold mt-2">1,234</p>
          </Card>
        </ShowForRole>
        
        <ShowForRole role="admin">
          <Card className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground">활성 사용자</h3>
            <p className="text-2xl font-bold mt-2">23</p>
          </Card>
        </ShowForRole>
      </StatsGrid>

        {/* 역할별 액션 버튼 */}
        <div className="flex gap-4 mb-8">
          <Button>환자 검색</Button>
          
          <CanAccess role={['admin', 'manager', 'bd']}>
            <Button variant="outline">새 환자 등록</Button>
          </CanAccess>
          
          <CanAccess role={['admin', 'manager', 'cs']}>
            <Button variant="outline">예약 관리</Button>
          </CanAccess>
          
          <CanAccess role="admin">
            <Button variant="destructive">시스템 관리</Button>
          </CanAccess>
        </div>

        {/* 역할별 섹션 */}
        <div className="space-y-6">
          {/* CS 팀 섹션 */}
          <ShowForRole role={['cs', 'manager', 'admin']}>
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">고객 서비스 대시보드</h2>
              <div className="space-y-2">
                <p>• 오늘의 상담 예약: 8건</p>
                <p>• 미확인 문의: 3건</p>
                <p>• 평균 응답 시간: 12분</p>
              </div>
            </Card>
          </ShowForRole>

          {/* BD 팀 섹션 */}
          <ShowForRole role={['bd', 'manager', 'admin']}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">사업 개발 대시보드</h2>
                <div className="space-y-2">
                  <p>• 신규 환자 등록: 15명</p>
                  <p>• 월간 성장률: +12%</p>
                  <p>• 예정된 미팅: 5건</p>
                </div>
              </Card>
              <SurveyResponseStats />
            </div>
          </ShowForRole>

          {/* 매니저/관리자 섹션 */}
          <ShowForRole role={['manager', 'admin']}>
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">관리 대시보드</h2>
              <div className="space-y-2">
                <p>• 팀 성과 지표</p>
                <p>• 직원 근태 현황</p>
                <p>• 월간 보고서</p>
              </div>
            </Card>
          </ShowForRole>

          {/* 관리자 전용 섹션 */}
          <ShowForRole role="admin">
            <Card className="p-6 border-destructive">
              <h2 className="text-xl font-semibold mb-4 text-destructive">시스템 관리</h2>
              <div className="space-y-2">
                <p>• 시스템 상태: 정상</p>
                <p>• 마지막 백업: 2시간 전</p>
                <p>• 보안 알림: 없음</p>
              </div>
              <div className="mt-4 space-x-2">
                <Button size="sm" variant="destructive">사용자 관리</Button>
                <Button size="sm" variant="outline">감사 로그</Button>
              </div>
            </Card>
          </ShowForRole>
        </div>
      </PageContainer>
    </RealtimeNotificationProvider>
  );
}