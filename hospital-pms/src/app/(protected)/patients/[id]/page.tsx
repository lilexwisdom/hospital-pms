'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { withProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PageLoadingSkeleton } from '@/components/auth/AuthLoading';
import { createClient } from '@/lib/supabase/client';
import { Patient } from '@/types/patient.types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, MoreVertical } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Tab components (will be created next)
import { PatientOverview } from '@/components/patients/tabs/PatientOverview';
import { MedicalInfo } from '@/components/patients/tabs/MedicalInfo';
import { ConsultationHistory } from '@/components/patients/tabs/ConsultationHistory';
import { AppointmentInfo } from '@/components/patients/tabs/AppointmentInfo';
import { PatientStatusHistory } from '@/components/patients/PatientStatusHistory';

function PatientDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const patientId = params.id as string;
  const currentTab = searchParams.get('tab') || 'overview';
  
  const supabase = createClient();

  // Fetch patient data
  useEffect(() => {
    const fetchPatient = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('patients')
          .select(`
            *,
            created_by_profile:profiles!patients_created_by_fkey (
              id,
              name,
              role
            ),
            cs_manager_profile:profiles!patients_cs_manager_fkey (
              id,
              name,
              role
            ),
            assigned_bd_profile:profiles!patients_assigned_bd_id_fkey (
              id,
              name,
              role
            )
          `)
          .eq('id', patientId)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        setPatient(data);
      } catch (err) {
        console.error('Error fetching patient:', err);
        setError(err instanceof Error ? err.message : '환자 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      fetchPatient();
    }
  }, [patientId, supabase]);

  // Refetch patient data function
  const refetchPatient = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('patients')
        .select(`
          *,
          created_by_profile:profiles!patients_created_by_fkey (
            id,
            name,
            role
          ),
          cs_manager_profile:profiles!patients_cs_manager_fkey (
            id,
            name,
            role
          ),
          assigned_bd_profile:profiles!patients_assigned_bd_id_fkey (
            id,
            name,
            role
          )
        `)
        .eq('id', patientId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      setPatient(data);
    } catch (err) {
      console.error('Error refetching patient:', err);
    }
  };

  const handleTabChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('tab', value);
    router.push(`/patients/${patientId}?${newParams.toString()}`);
  };

  const handleEdit = () => {
    router.push(`/patients/${patientId}/edit`);
  };

  const handleBack = () => {
    router.push('/patients');
  };

  const handleDelete = async () => {
    if (!confirm('정말로 이 환자를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', patientId)
        .eq('version', patient.version); // Optimistic locking

      if (error) {
        if (error.message.includes('version')) {
          throw new Error('다른 사용자가 이미 수정했습니다. 페이지를 새로고침해주세요.');
        }
        throw error;
      }

      toast.success('환자가 성공적으로 삭제되었습니다.');
      router.push('/patients');
    } catch (err: any) {
      console.error('Error deleting patient:', err);
      toast.error(err.message || '환자 삭제 중 오류가 발생했습니다.');
    }
  };

  if (loading) {
    return <PageLoadingSkeleton />;
  }

  if (error || !patient) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <h3 className="font-semibold mb-2">오류가 발생했습니다</h3>
          <p>{error || '환자 정보를 찾을 수 없습니다.'}</p>
          <Button onClick={handleBack} className="mt-4" variant="outline">
            목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{patient.name}</h1>
            <p className="text-muted-foreground">
              환자 ID: {patient.id}
            </p>
          </div>
          <Button onClick={handleEdit} variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            정보 수정
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>상태 변경</DropdownMenuItem>
              <DropdownMenuItem>담당자 변경</DropdownMenuItem>
              <DropdownMenuItem>인쇄</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600" onClick={handleDelete}>삭제</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={currentTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-5 lg:w-[600px]">
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="medical">의료정보</TabsTrigger>
          <TabsTrigger value="consultations">상담이력</TabsTrigger>
          <TabsTrigger value="appointments">예약정보</TabsTrigger>
          <TabsTrigger value="status-history">상태이력</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="overview">
            <PatientOverview patient={patient} onStatusChange={refetchPatient} />
          </TabsContent>
          <TabsContent value="medical">
            <MedicalInfo patient={patient} />
          </TabsContent>
          <TabsContent value="consultations">
            <ConsultationHistory patientId={patient.id} />
          </TabsContent>
          <TabsContent value="appointments">
            <AppointmentInfo patientId={patient.id} />
          </TabsContent>
          <TabsContent value="status-history">
            <PatientStatusHistory patientId={patient.id} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

// CS, BD, Manager, Admin만 접근 가능
export default withProtectedRoute(PatientDetailPage, {
  requiredRole: ['cs', 'bd', 'manager', 'admin'],
  fallbackUrl: '/unauthorized',
  loadingComponent: <PageLoadingSkeleton />
});