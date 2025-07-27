'use client';

import { useState, useEffect } from 'react';
import { Patient } from '@/types/patient.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Pill, 
  Scissors, 
  AlertTriangle,
  FileText,
  Activity,
  Calendar,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Button } from '@/components/ui/button';

interface MedicalInfoProps {
  patient: Patient;
}

interface MedicalData {
  medical_history?: string | null;
  family_history?: string | null;
  medications?: Array<{ name: string; dosage: string; frequency: string }>;
  surgeries?: Array<{ name: string; date: string; hospital: string }>;
  allergies?: string[];
  examination_results?: Array<{ 
    type: string; 
    date: string; 
    result: string; 
    notes?: string 
  }>;
}

export function MedicalInfo({ patient }: MedicalInfoProps) {
  const [medicalData, setMedicalData] = useState<MedicalData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch medical data from database
    // For now, using mock data
    setMedicalData({
      medical_history: null,
      family_history: null,
      medications: [],
      surgeries: [],
      allergies: [],
      examination_results: []
    });
    setLoading(false);
  }, [patient]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* 질병 플래그 */}
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

      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="history">과거력</TabsTrigger>
          <TabsTrigger value="medications">복약정보</TabsTrigger>
          <TabsTrigger value="surgeries">수술이력</TabsTrigger>
          <TabsTrigger value="allergies">알러지</TabsTrigger>
          <TabsTrigger value="examinations">검사결과</TabsTrigger>
        </TabsList>

        {/* 과거력/가족력 */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">과거력</CardTitle>
            </CardHeader>
            <CardContent>
              {medicalData.medical_history ? (
                <p className="text-sm whitespace-pre-wrap">{medicalData.medical_history}</p>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">등록된 과거력이 없습니다</p>
                  <Button variant="outline" size="sm" className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    과거력 추가
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">가족력</CardTitle>
            </CardHeader>
            <CardContent>
              {medicalData.family_history ? (
                <p className="text-sm whitespace-pre-wrap">{medicalData.family_history}</p>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">등록된 가족력이 없습니다</p>
                  <Button variant="outline" size="sm" className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    가족력 추가
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 복약정보 */}
        <TabsContent value="medications">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Pill className="h-5 w-5" />
                복약 정보
              </CardTitle>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                약물 추가
              </Button>
            </CardHeader>
            <CardContent>
              {medicalData.medications && medicalData.medications.length > 0 ? (
                <div className="space-y-3">
                  {medicalData.medications.map((med, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{med.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            용량: {med.dosage} | 복용법: {med.frequency}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm">수정</Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">등록된 복약 정보가 없습니다</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 수술이력 */}
        <TabsContent value="surgeries">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Scissors className="h-5 w-5" />
                수술 이력
              </CardTitle>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                수술 추가
              </Button>
            </CardHeader>
            <CardContent>
              {medicalData.surgeries && medicalData.surgeries.length > 0 ? (
                <div className="space-y-3">
                  {medicalData.surgeries.map((surgery, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{surgery.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            <Calendar className="inline h-3 w-3 mr-1" />
                            {format(new Date(surgery.date), 'yyyy년 MM월 dd일', { locale: ko })}
                            {surgery.hospital && ` | ${surgery.hospital}`}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm">수정</Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Scissors className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">등록된 수술 이력이 없습니다</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 알러지 */}
        <TabsContent value="allergies">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                알러지 정보
              </CardTitle>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                알러지 추가
              </Button>
            </CardHeader>
            <CardContent>
              {medicalData.allergies && medicalData.allergies.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {medicalData.allergies.map((allergy, index) => (
                    <Badge key={index} variant="secondary" className="text-sm">
                      {allergy}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">등록된 알러지가 없습니다</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 검사결과 */}
        <TabsContent value="examinations">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                검사 결과
              </CardTitle>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                검사 추가
              </Button>
            </CardHeader>
            <CardContent>
              {medicalData.examination_results && medicalData.examination_results.length > 0 ? (
                <div className="space-y-3">
                  {medicalData.examination_results.map((exam, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{exam.type}</h4>
                          <p className="text-sm text-muted-foreground">
                            <Calendar className="inline h-3 w-3 mr-1" />
                            {format(new Date(exam.date), 'yyyy년 MM월 dd일', { locale: ko })}
                          </p>
                          <p className="text-sm mt-1">{exam.result}</p>
                          {exam.notes && (
                            <p className="text-sm text-muted-foreground mt-1">{exam.notes}</p>
                          )}
                        </div>
                        <Button variant="ghost" size="sm">상세보기</Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">등록된 검사 결과가 없습니다</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}