'use client';

import { useState, useEffect } from 'react';
import { Patient } from '@/types/patient.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Edit } from 'lucide-react';
import { MedicalInfoForm } from '../forms/MedicalInfoForm';
import { MedicalInfoFormData } from '@/lib/validations/medical-info';
import { toast } from '@/hooks/use-toast';

interface MedicalInfoProps {
  patient: Patient;
}

export function MedicalInfo({ patient }: MedicalInfoProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [medicalData, setMedicalData] = useState<MedicalInfoFormData | null>(null);

  useEffect(() => {
    fetchMedicalData();
  }, [patient.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchMedicalData = async () => {
    try {
      const response = await fetch(`/api/patients/${patient.id}/medical-info`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch medical information');
      }
      
      const data = await response.json();
      setMedicalData(data);
    } catch (error) {
      console.error('Error fetching medical data:', error);
      toast({
        title: '데이터 로드 실패',
        description: '의료 정보를 불러오는데 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: MedicalInfoFormData) => {
    try {
      // Save medical info to database
      const response = await fetch(`/api/patients/${patient.id}/medical-info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Save error response:', response.status, errorData);
        throw new Error('Failed to save medical information');
      }
      
      // Update patient flags based on detected flags
      if (data.detectedFlags) {
        const flagsResponse = await fetch(`/api/patients/${patient.id}/flags`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data.detectedFlags),
        });

        if (!flagsResponse.ok) {
          console.error('Failed to update patient flags');
        }
      }

      setMedicalData(data);
      setIsEditing(false);
      toast({
        title: '저장 완료',
        description: '의료 정보가 성공적으로 저장되었습니다.',
      });
    } catch (error) {
      console.error('Error saving medical info:', error);
      toast({
        title: '저장 실패',
        description: '의료 정보 저장 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with Edit Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">의료 정보</h2>
        <Button
          onClick={() => setIsEditing(!isEditing)}
          variant={isEditing ? "outline" : "default"}
        >
          <Edit className="mr-2 h-4 w-4" />
          {isEditing ? '취소' : '수정'}
        </Button>
      </div>

      {isEditing ? (
        // Edit Mode - Show Form
        <MedicalInfoForm
          patientId={patient.id}
          initialData={medicalData || undefined}
          onSubmit={handleSave}
        />
      ) : (
        // View Mode - Show Current Data
        <div className="space-y-6">
          {/* Disease Flags */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                주요 질환
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {patient.flag_diabetes && (
                  <Badge variant="destructive">당뇨병</Badge>
                )}
                {patient.flag_hypertension && (
                  <Badge variant="destructive">고혈압</Badge>
                )}
                {patient.flag_hyperlipidemia && (
                  <Badge variant="destructive">고지혈증</Badge>
                )}
                {patient.flag_cardiovascular && (
                  <Badge variant="destructive">심혈관질환</Badge>
                )}
                {patient.flag_asthma && (
                  <Badge variant="destructive">천식</Badge>
                )}
                {patient.flag_allergy && (
                  <Badge variant="destructive">알러지</Badge>
                )}
                {patient.flag_anticoagulant && (
                  <Badge variant="secondary">항응고제 복용</Badge>
                )}
                {patient.flag_pregnancy && (
                  <Badge variant="secondary">임신</Badge>
                )}
                {!patient.flag_diabetes && !patient.flag_hypertension && 
                 !patient.flag_hyperlipidemia && !patient.flag_cardiovascular &&
                 !patient.flag_asthma && !patient.flag_allergy && 
                 !patient.flag_anticoagulant && !patient.flag_pregnancy && (
                  <span className="text-muted-foreground text-sm">등록된 주요 질환이 없습니다</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Display medical data summary */}
          <div className="grid gap-4">
            {medicalData && (
              <>
                {/* Medical History Summary */}
                {(medicalData.medicalHistories.length > 0 || medicalData.familyHistory) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">과거력 / 가족력</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {medicalData.medicalHistories.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-medium mb-2">과거 병력</h4>
                          <ul className="space-y-1">
                            {medicalData.medicalHistories.map((history, index) => (
                              <li key={index} className="text-sm">
                                • {history.condition} {history.diagnosisYear && `(${history.diagnosisYear}년)`}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {medicalData.familyHistory && (
                        <div>
                          <h4 className="font-medium mb-2">가족력</h4>
                          <p className="text-sm">{medicalData.familyHistory}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Medications Summary */}
                {medicalData.medications.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">복약 정보</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {medicalData.medications.map((med, index) => (
                          <li key={index} className="text-sm">
                            <span className="font-medium">{med.name}</span>
                            {med.dosage && ` - ${med.dosage}`}
                            {med.frequency && `, ${med.frequency}`}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Surgeries Summary */}
                {medicalData.surgeries.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">수술 이력</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {medicalData.surgeries.map((surgery, index) => (
                          <li key={index} className="text-sm">
                            <span className="font-medium">{surgery.name}</span>
                            {surgery.date && ` - ${new Date(surgery.date).getFullYear()}년`}
                            {surgery.hospital && ` (${surgery.hospital})`}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Allergies Summary */}
                {medicalData.allergies.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">알러지 정보</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {medicalData.allergies.map((allergy, index) => (
                          <Badge key={index} variant="secondary">
                            {allergy.name}
                            {allergy.severity === 'severe' && ' (중증)'}
                            {allergy.severity === 'moderate' && ' (중등도)'}
                            {allergy.severity === 'mild' && ' (경증)'}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {!medicalData || (
              medicalData.medicalHistories.length === 0 &&
              medicalData.medications.length === 0 &&
              medicalData.surgeries.length === 0 &&
              medicalData.allergies.length === 0
            ) && (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">
                    등록된 의료 정보가 없습니다. 수정 버튼을 눌러 정보를 추가해주세요.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}