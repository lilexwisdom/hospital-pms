'use client';

import { useState, useEffect } from 'react';
import { PageContainer } from '@/components/layout';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { createSurveyToken, getUserSurveyTokens, type SurveyToken } from '@/app/actions/survey-token';
import { Plus, Copy, QrCode, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import QRCode from 'qrcode';
import { CanAccess } from '@/components/auth/ProtectedRoute';

export default function SurveyTokensPage() {
  const [tokens, setTokens] = useState<SurveyToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [selectedToken, setSelectedToken] = useState<SurveyToken | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const { toast } = useToast();

  // Form state
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [expiresInHours, setExpiresInHours] = useState('24');

  // Load tokens
  const loadTokens = async () => {
    setLoading(true);
    const result = await getUserSurveyTokens();
    
    if (result.success) {
      setTokens(result.data);
    } else {
      toast({
        title: '오류',
        description: result.error,
        variant: 'destructive',
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTokens();
  }, []);

  // Create token
  const handleCreateToken = async () => {
    if (!patientName.trim()) {
      toast({
        title: '오류',
        description: '환자 이름을 입력해주세요',
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);
    const formData = new FormData();
    formData.set('patientName', patientName);
    if (patientPhone) formData.set('patientPhone', patientPhone);
    if (patientEmail) formData.set('patientEmail', patientEmail);
    formData.set('expiresInHours', expiresInHours);

    const result = await createSurveyToken(formData);
    
    if (result.success) {
      toast({
        title: '성공',
        description: '설문 토큰이 생성되었습니다',
      });
      setShowCreateDialog(false);
      setPatientName('');
      setPatientPhone('');
      setPatientEmail('');
      loadTokens();
    } else {
      toast({
        title: '오류',
        description: result.error,
        variant: 'destructive',
      });
    }
    setCreating(false);
  };

  // Copy URL
  const copyUrl = (token: SurveyToken) => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const url = `${baseUrl}/survey/${token.token}`;
    navigator.clipboard.writeText(url);
    toast({
      title: '복사됨',
      description: 'URL이 클립보드에 복사되었습니다',
    });
  };

  // Generate QR Code
  const generateQR = async (token: SurveyToken) => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const url = `${baseUrl}/survey/${token.token}`;
    
    try {
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
      });
      setQrCodeUrl(qrDataUrl);
      setSelectedToken(token);
      setShowQRDialog(true);
    } catch (error) {
      toast({
        title: '오류',
        description: 'QR 코드 생성에 실패했습니다',
        variant: 'destructive',
      });
    }
  };

  // Table columns
  const columns = [
    {
      key: 'patient_name',
      header: '환자명',
      accessor: (row: SurveyToken) => row.patientName,
    },
    {
      key: 'patient_phone',
      header: '연락처',
      accessor: (row: SurveyToken) => row.patientPhone || '-',
    },
    {
      key: 'status',
      header: '상태',
      accessor: (row: SurveyToken) => {
        const now = new Date();
        const expiresAt = new Date(row.expiresAt);
        
        if (row.usedAt) {
          return <Badge variant="secondary">사용됨</Badge>;
        } else if (now > expiresAt) {
          return <Badge variant="destructive">만료됨</Badge>;
        } else {
          return <Badge variant="default">유효</Badge>;
        }
      },
    },
    {
      key: 'created_at',
      header: '생성일시',
      accessor: (row: SurveyToken) => 
        format(new Date(row.createdAt), 'yyyy-MM-dd HH:mm', { locale: ko }),
    },
    {
      key: 'expires_at',
      header: '만료일시',
      accessor: (row: SurveyToken) => 
        format(new Date(row.expiresAt), 'yyyy-MM-dd HH:mm', { locale: ko }),
    },
    {
      key: 'actions',
      header: '액션',
      accessor: (row: SurveyToken) => {
        const isValid = !row.usedAt && new Date() < new Date(row.expiresAt);
        
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyUrl(row)}
              disabled={!isValid}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => generateQR(row)}
              disabled={!isValid}
            >
              <QrCode className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <CanAccess role={['admin', 'manager', 'bd']}>
      <PageContainer
        title="설문 토큰 관리"
        description="환자 설문조사를 위한 토큰을 생성하고 관리합니다"
        actions={
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            토큰 생성
          </Button>
        }
      >
        <Card className="p-6">
          <DataTable
            data={tokens}
            columns={columns}
            loading={loading}
            emptyMessage="생성된 토큰이 없습니다"
          />
        </Card>

        {/* Create Token Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>설문 토큰 생성</DialogTitle>
              <DialogDescription>
                환자 정보를 입력하여 설문조사 토큰을 생성합니다.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="patientName">환자명 *</Label>
                <Input
                  id="patientName"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="홍길동"
                />
              </div>
              
              <div>
                <Label htmlFor="patientPhone">연락처</Label>
                <Input
                  id="patientPhone"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  placeholder="010-1234-5678"
                />
              </div>
              
              <div>
                <Label htmlFor="patientEmail">이메일</Label>
                <Input
                  id="patientEmail"
                  type="email"
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                  placeholder="patient@example.com"
                />
              </div>
              
              <div>
                <Label htmlFor="expiresInHours">유효 시간 (시간)</Label>
                <Input
                  id="expiresInHours"
                  type="number"
                  value={expiresInHours}
                  onChange={(e) => setExpiresInHours(e.target.value)}
                  min="1"
                  max="168"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  1시간 ~ 168시간(7일) 사이로 설정 가능합니다
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                disabled={creating}
              >
                취소
              </Button>
              <Button onClick={handleCreateToken} disabled={creating}>
                {creating && <LoadingSpinner size="sm" className="mr-2" />}
                생성
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* QR Code Dialog */}
        <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>QR 코드</DialogTitle>
              <DialogDescription>
                {selectedToken?.patientName}님의 설문 QR 코드
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex flex-col items-center space-y-4">
              {qrCodeUrl && (
                <img src={qrCodeUrl} alt="QR Code" className="border rounded" />
              )}
              
              <Button
                variant="outline"
                onClick={() => {
                  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
                  const url = `${baseUrl}/survey/${selectedToken?.token}`;
                  window.open(url, '_blank');
                }}
                className="w-full"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                설문 페이지 열기
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageContainer>
    </CanAccess>
  );
}