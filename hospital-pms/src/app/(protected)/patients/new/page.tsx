'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { withProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import { hashSSN, encryptSSN } from '@/lib/utils/encryption';

function NewPatientPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    ssn: '',
    phone: '',
    email: '',
    gender: '',
    date_of_birth: '',
    address: '',
    address_detail: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.ssn) {
      toast.error('이름과 주민등록번호는 필수 입력 항목입니다.');
      return;
    }

    setIsLoading(true);

    try {
      // Get current user
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('인증되지 않은 사용자입니다.');

      // Encrypt SSN
      const encryptedSSN = await encryptSSN(formData.ssn);
      const ssnHash = await hashSSN(formData.ssn);

      // Prepare patient data
      const patientData = {
        name: formData.name,
        encrypted_ssn: encryptedSSN,
        ssn_hash: ssnHash,
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
        status: 'pending',
        created_by: user.id,
      };

      // Insert patient
      const { data, error } = await supabase
        .from('patients')
        .insert(patientData)
        .select()
        .single();

      if (error) throw error;

      toast.success('환자가 성공적으로 등록되었습니다.');
      router.push(`/patients/${data.id}`);
    } catch (error: any) {
      console.error('Error creating patient:', error);
      toast.error(error.message || '환자 등록 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/patients')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          환자 목록으로 돌아가기
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>새 환자 등록</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 기본 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">기본 정보</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">이름 *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="ssn">주민등록번호 *</Label>
                  <Input
                    id="ssn"
                    type="text"
                    placeholder="YYMMDD-XXXXXXX"
                    value={formData.ssn}
                    onChange={(e) => handleChange('ssn', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone">전화번호</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="010-0000-0000"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="email">이메일</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="gender">성별</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => handleChange('gender', value)}
                  >
                    <SelectTrigger id="gender">
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
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => handleChange('date_of_birth', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* 주소 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">주소 정보</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="address">주소</Label>
                  <Input
                    id="address"
                    placeholder="시/도, 구/군"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="address_detail">상세주소</Label>
                  <Input
                    id="address_detail"
                    placeholder="상세 주소"
                    value={formData.address_detail}
                    onChange={(e) => handleChange('address_detail', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* 비상 연락처 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">비상 연락처</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="emergency_contact_name">이름</Label>
                  <Input
                    id="emergency_contact_name"
                    value={formData.emergency_contact_name}
                    onChange={(e) => handleChange('emergency_contact_name', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="emergency_contact_phone">전화번호</Label>
                  <Input
                    id="emergency_contact_phone"
                    type="tel"
                    placeholder="010-0000-0000"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => handleChange('emergency_contact_phone', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="emergency_contact_relationship">관계</Label>
                  <Input
                    id="emergency_contact_relationship"
                    placeholder="예: 배우자, 자녀"
                    value={formData.emergency_contact_relationship}
                    onChange={(e) => handleChange('emergency_contact_relationship', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* 제출 버튼 */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/patients')}
                disabled={isLoading}
              >
                취소
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? '등록 중...' : '환자 등록'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default withProtectedRoute(NewPatientPage, {
  allowedRoles: ['admin', 'bd', 'manager']
});