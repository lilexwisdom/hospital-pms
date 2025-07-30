'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { hashSSN } from '@/lib/utils/encryption';

interface PatientData {
  id: string;
  name: string;
  phone: string;
  email: string;
  gender: string;
  date_of_birth: string;
  address: any;
  address_detail: string;
  emergency_contact: any;
  status: string;
  version: number;
}

export default function EditPatientPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    gender: '',
    date_of_birth: '',
    address: '',
    address_detail: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
    status: '',
  });

  useEffect(() => {
    fetchPatient();
  }, [patientId]);

  const fetchPatient = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (error) throw error;

      setPatient(data);
      setFormData({
        name: data.name || '',
        phone: data.phone || '',
        email: data.email || '',
        gender: data.gender || '',
        date_of_birth: data.date_of_birth || '',
        address: data.address?.city || '',
        address_detail: data.address_detail || '',
        emergency_contact_name: data.emergency_contact?.name || '',
        emergency_contact_phone: data.emergency_contact?.phone || '',
        emergency_contact_relationship: data.emergency_contact?.relationship || '',
        status: data.status || 'pending',
      });
    } catch (error) {
      console.error('Error fetching patient:', error);
      toast.error('환자 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!patient) return;
    
    setSaving(true);
    
    try {
      const supabase = createClient();
      
      // Prepare update data
      const updateData = {
        name: formData.name,
        phone: formData.phone || null,
        email: formData.email || null,
        gender: formData.gender || null,
        date_of_birth: formData.date_of_birth || null,
        address: formData.address ? { city: formData.address } : {},
        address_detail: formData.address_detail || null,
        emergency_contact: formData.emergency_contact_name ? {
          name: formData.emergency_contact_name,
          phone: formData.emergency_contact_phone,
          relationship: formData.emergency_contact_relationship
        } : {},
        status: formData.status,
        version: patient.version, // Include current version for optimistic locking
      };

      const { data, error } = await supabase
        .from('patients')
        .update(updateData)
        .eq('id', patientId)
        .eq('version', patient.version) // Optimistic locking check
        .select()
        .single();

      if (error) {
        console.error('Update error:', error);
        throw error;
      }
      
      if (!data) {
        throw new Error('다른 사용자가 이미 수정했습니다. 페이지를 새로고침해주세요.');
      }

      toast.success('환자 정보가 성공적으로 수정되었습니다.');
      router.push(`/patients/${patientId}`);
    } catch (error: any) {
      console.error('Error updating patient:', error);
      toast.error(error.message || '환자 정보 수정 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">환자를 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>환자 정보 수정</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">이름</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">전화번호</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="010-1234-5678"
                />
              </div>
              <div>
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label htmlFor="gender">성별</Label>
                <Select 
                  value={formData.gender} 
                  onValueChange={(value) => handleSelectChange('gender', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="성별 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">남성</SelectItem>
                    <SelectItem value="female">여성</SelectItem>
                    <SelectItem value="other">기타</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="date_of_birth">생년월일</Label>
                <Input
                  id="date_of_birth"
                  name="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label htmlFor="status">상태</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => handleSelectChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="상태 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">대기중</SelectItem>
                    <SelectItem value="scheduled">예약됨</SelectItem>
                    <SelectItem value="consulted">상담완료</SelectItem>
                    <SelectItem value="treatment_in_progress">치료중</SelectItem>
                    <SelectItem value="treatment_completed">치료완료</SelectItem>
                    <SelectItem value="follow_up">경과관찰</SelectItem>
                    <SelectItem value="discharged">퇴원</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="address">주소</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label htmlFor="address_detail">상세주소</Label>
                <Input
                  id="address_detail"
                  name="address_detail"
                  value={formData.address_detail}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">비상연락처</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="emergency_contact_name">이름</Label>
                  <Input
                    id="emergency_contact_name"
                    name="emergency_contact_name"
                    value={formData.emergency_contact_name}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label htmlFor="emergency_contact_phone">전화번호</Label>
                  <Input
                    id="emergency_contact_phone"
                    name="emergency_contact_phone"
                    value={formData.emergency_contact_phone}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label htmlFor="emergency_contact_relationship">관계</Label>
                  <Input
                    id="emergency_contact_relationship"
                    name="emergency_contact_relationship"
                    value={formData.emergency_contact_relationship}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/patients/${patientId}`)}
              >
                취소
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? '저장 중...' : '저장'}
              </Button>
            </div>
          </form>

          {patient && (
            <div className="mt-4 text-sm text-gray-500">
              현재 버전: {patient.version}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}