import { AdminOnly } from '@/components/auth/ProtectedRoute';

export default function AdminDashboard() {
  return (
    <AdminOnly>
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">관리자 대시보드</h1>
        <p className="text-muted-foreground">
          관리자 권한을 가진 사용자만 이 페이지에 접근할 수 있습니다.
        </p>
        
        <div className="grid gap-6 mt-8 md:grid-cols-2 lg:grid-cols-3">
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">사용자 관리</h2>
            <p className="text-sm text-muted-foreground">시스템 사용자 관리 및 권한 설정</p>
          </div>
          
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">시스템 설정</h2>
            <p className="text-sm text-muted-foreground">전체 시스템 설정 및 구성</p>
          </div>
          
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">감사 로그</h2>
            <p className="text-sm text-muted-foreground">시스템 전체 활동 로그 확인</p>
          </div>
        </div>
      </div>
    </AdminOnly>
  );
}