'use client';

import { withProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PageLoadingSkeleton } from '@/components/auth/AuthLoading';

interface PatientsPageProps {
  // 페이지 props 타입 정의
}

function PatientsPage(props: PatientsPageProps) {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">환자 관리</h1>
      <p className="text-muted-foreground mb-8">
        환자 정보를 검색하고 관리할 수 있습니다. (CS, Manager, Admin 접근 가능)
      </p>
      
      <div className="space-y-4">
        {/* 환자 검색 UI */}
        <div className="flex gap-4">
          <input 
            type="text" 
            placeholder="환자 이름 또는 ID로 검색..." 
            className="flex-1 px-4 py-2 border rounded-lg"
          />
          <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg">
            검색
          </button>
        </div>
        
        {/* 환자 목록 테이블 */}
        <div className="border rounded-lg p-4">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">ID</th>
                <th className="text-left p-2">이름</th>
                <th className="text-left p-2">연락처</th>
                <th className="text-left p-2">담당 CS</th>
                <th className="text-left p-2">마지막 방문</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-2">P001</td>
                <td className="p-2">홍길동</td>
                <td className="p-2">010-1234-5678</td>
                <td className="p-2">김CS</td>
                <td className="p-2">2024-01-15</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// CS, Manager, Admin만 접근 가능하도록 HOC로 감싸기
export default withProtectedRoute(PatientsPage, {
  requiredRole: ['cs', 'manager', 'admin'],
  fallbackUrl: '/unauthorized',
  loadingComponent: <PageLoadingSkeleton />
});