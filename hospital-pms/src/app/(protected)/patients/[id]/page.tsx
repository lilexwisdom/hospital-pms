'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { withProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PageLoadingSkeleton } from '@/components/auth/AuthLoading';
import { getClient } from '@/lib/supabase/client';
import { Patient } from '@/types/patient.types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, MoreVertical } from 'lucide-react';
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

function PatientDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const patientId = params.id as string;
  const currentTab = searchParams.get('tab') || 'overview';
  
  const supabase = getClient();

  // Fetch patient data
  useEffect(() => {
    const fetchPatient = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('patients')
          .select('*')
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
              <DropdownMenuItem className="text-red-600">삭제</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={currentTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="medical">의료정보</TabsTrigger>
          <TabsTrigger value="consultations">상담이력</TabsTrigger>
          <TabsTrigger value="appointments">예약정보</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="overview">
            <PatientOverview patient={patient} />
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