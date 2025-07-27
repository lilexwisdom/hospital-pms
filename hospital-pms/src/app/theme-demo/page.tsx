'use client';

import { ThemeToggle } from '@/components/theme/theme-toggle';
import { StatusBadge, RoleBadge, PriorityBadge } from '@/components/ui/status-badge';
import { AppointmentStatusIndicator, AppointmentTimeline } from '@/components/ui/appointment-status';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

export default function ThemeDemoPage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Hospital PMS 테마 시스템</h1>
          <p className="text-muted-foreground mt-2">
            병원 관리 시스템을 위한 의료 테마 디자인 시스템
          </p>
        </div>
        <ThemeToggle />
      </div>

      {/* Color Palette */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">색상 팔레트</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="h-24 bg-primary rounded-lg mb-2" />
            <p className="text-sm font-medium">Primary (Medical Blue)</p>
            <p className="text-xs text-muted-foreground">의료 전문성</p>
          </div>
          <div>
            <div className="h-24 bg-accent rounded-lg mb-2" />
            <p className="text-sm font-medium">Accent (Healthcare Green)</p>
            <p className="text-xs text-muted-foreground">건강과 치유</p>
          </div>
          <div>
            <div className="h-24 bg-secondary rounded-lg mb-2" />
            <p className="text-sm font-medium">Secondary</p>
            <p className="text-xs text-muted-foreground">보조 색상</p>
          </div>
          <div>
            <div className="h-24 bg-muted rounded-lg mb-2" />
            <p className="text-sm font-medium">Muted</p>
            <p className="text-xs text-muted-foreground">배경 색상</p>
          </div>
        </div>
      </Card>

      {/* Status Badges */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">상태 배지</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">예약 상태</h3>
            <div className="flex gap-2 flex-wrap">
              <StatusBadge status="pending" />
              <StatusBadge status="confirmed" />
              <StatusBadge status="completed" />
              <StatusBadge status="cancelled" />
              <StatusBadge status="no_show" />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">사용자 역할</h3>
            <div className="flex gap-2 flex-wrap">
              <RoleBadge role="admin" />
              <RoleBadge role="manager" />
              <RoleBadge role="bd" />
              <RoleBadge role="cs" />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">우선순위</h3>
            <div className="flex gap-2 flex-wrap">
              <PriorityBadge priority="high" />
              <PriorityBadge priority="medium" />
              <PriorityBadge priority="low" />
            </div>
          </div>
        </div>
      </Card>

      {/* Appointment Status Indicators */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">예약 상태 표시</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">상태 인디케이터</h3>
            <div className="space-y-2">
              <AppointmentStatusIndicator status="pending" />
              <AppointmentStatusIndicator status="confirmed" />
              <AppointmentStatusIndicator status="completed" />
              <AppointmentStatusIndicator status="cancelled" />
              <AppointmentStatusIndicator status="no_show" />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">예약 타임라인</h3>
            <div className="space-y-3">
              <AppointmentTimeline status="pending" />
              <AppointmentTimeline status="confirmed" />
              <AppointmentTimeline status="completed" />
              <AppointmentTimeline status="cancelled" />
            </div>
          </div>
        </div>
      </Card>

      {/* Buttons */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">버튼 스타일</h2>
        <div className="flex gap-2 flex-wrap">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
        </div>
      </Card>

      {/* Alerts */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">알림 메시지</h2>
        <div className="space-y-3">
          <Alert>
            <AlertTitle>기본 알림</AlertTitle>
            <AlertDescription>
              환자 정보가 성공적으로 업데이트되었습니다.
            </AlertDescription>
          </Alert>
          
          <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20">
            <AlertTitle className="text-green-800 dark:text-green-400">성공</AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-300">
              예약이 확정되었습니다.
            </AlertDescription>
          </Alert>
          
          <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
            <AlertTitle className="text-yellow-800 dark:text-yellow-400">주의</AlertTitle>
            <AlertDescription className="text-yellow-700 dark:text-yellow-300">
              환자의 보험 정보를 확인해주세요.
            </AlertDescription>
          </Alert>
          
          <Alert className="border-red-500 bg-red-50 dark:bg-red-900/20">
            <AlertTitle className="text-red-800 dark:text-red-400">오류</AlertTitle>
            <AlertDescription className="text-red-700 dark:text-red-300">
              예약 시간이 중복됩니다.
            </AlertDescription>
          </Alert>
        </div>
      </Card>

      {/* Cards with Effects */}
      <div>
        <h2 className="text-xl font-semibold mb-4">카드 효과</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 card-hover">
            <h3 className="font-semibold mb-2">호버 효과</h3>
            <p className="text-sm text-muted-foreground">
              마우스를 올려보세요
            </p>
          </Card>
          
          <Card className="p-6 patient-card">
            <h3 className="font-semibold mb-2">환자 카드</h3>
            <p className="text-sm text-muted-foreground">
              환자 정보 표시용
            </p>
          </Card>
          
          <Card className="p-6 priority-high">
            <h3 className="font-semibold mb-2">긴급 표시</h3>
            <p className="text-sm text-muted-foreground">
              우선순위 높음
            </p>
          </Card>
        </div>
      </div>

      {/* Gradient Examples */}
      <Card className="p-6 bg-gradient-medical">
        <h2 className="text-xl font-semibold mb-4">그라데이션 배경</h2>
        <p className="text-muted-foreground">
          의료 테마 그라데이션을 사용한 배경 효과
        </p>
      </Card>
    </div>
  );
}