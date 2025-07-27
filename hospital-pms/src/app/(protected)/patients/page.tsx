'use client';

import { useState } from 'react';
import { withProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PageLoadingSkeleton } from '@/components/auth/AuthLoading';
import { usePatientTable } from '@/hooks/usePatientTable';
import { PatientFilters } from '@/components/patients/PatientFilters';
import { PatientTable } from '@/components/patients/PatientTable';
import { PatientFilters as IPatientFilters } from '@/types/patient.types';
import { Button } from '@/components/ui/button';
import { Plus, Download, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PatientsPageProps {
  // 페이지 props 타입 정의
}

function PatientsPage(props: PatientsPageProps) {
  const [filters, setFilters] = useState<IPatientFilters>({});
  const router = useRouter();
  
  console.log('PatientsPage rendering...');
  
  const {
    table,
    isLoading,
    error,
    refetch,
    totalCount,
    currentPage,
    totalPages,
  } = usePatientTable({ filters });
  
  console.log('Table data:', { isLoading, error, totalCount });

  const handleCreatePatient = () => {
    router.push('/patients/new' as any);
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export patients');
  };

  const handleImport = () => {
    // TODO: Implement import functionality
    console.log('Import patients');
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <h3 className="font-semibold mb-2">오류가 발생했습니다</h3>
          <p>{error.message}</p>
          <Button onClick={() => refetch()} className="mt-4" variant="outline">
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">환자 관리</h1>
            <p className="text-muted-foreground mt-2">
              환자 정보를 검색하고 관리할 수 있습니다.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleImport}>
              <Upload className="mr-2 h-4 w-4" />
              가져오기
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              내보내기
            </Button>
            <Button onClick={handleCreatePatient}>
              <Plus className="mr-2 h-4 w-4" />
              새 환자 등록
            </Button>
          </div>
        </div>

        {/* Filters */}
        <PatientFilters filters={filters} onFiltersChange={setFilters} />
      </div>

      {/* Table */}
      <PatientTable
        table={table}
        isLoading={isLoading}
        totalCount={totalCount}
        currentPage={currentPage}
        totalPages={totalPages}
      />
    </div>
  );
}

// CS, Manager, Admin만 접근 가능하도록 HOC로 감싸기
export default withProtectedRoute(PatientsPage, {
  requiredRole: ['cs', 'manager', 'admin'],
  fallbackUrl: '/unauthorized',
  loadingComponent: <PageLoadingSkeleton />
});