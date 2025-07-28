'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { PatientStatus } from '@/lib/patient-status/types';
import { getStatusLabel, getStatusColor, getNextActions } from '@/lib/patient-status/config';
import { validateStatusTransition, requiresNote } from '@/lib/patient-status/validation';
import { changePatientStatus } from '@/app/actions/patient-status';
import { useAuth } from '@/hooks/useAuth';
import { usePatientPermissions } from '@/hooks/usePatientPermissions';
import { Database } from '@/types/database.types';

type UserRole = Database['public']['Enums']['user_role'];

interface PatientStatusChangeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  currentStatus: PatientStatus;
  patientName: string;
  createdBy?: string;
  assignedTo?: string;
  csManager?: string;
  onSuccess?: () => void;
}

export function PatientStatusChange({
  open,
  onOpenChange,
  patientId,
  currentStatus,
  patientName,
  createdBy,
  assignedTo,
  csManager,
  onSuccess
}: PatientStatusChangeProps) {
  const router = useRouter();
  const { role, user } = useAuth();
  const permissions = usePatientPermissions({
    patientId,
    currentStatus,
    createdBy,
    assignedTo,
    csManager
  });

  const [newStatus, setNewStatus] = useState<PatientStatus | ''>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleStatusChange = (value: string) => {
    setNewStatus(value as PatientStatus);
    setError(null);
    setValidationError(null);
    
    if (value && role) {
      const validation = validateStatusTransition(
        currentStatus,
        value as PatientStatus,
        role
      );
      
      if (!validation.isValid) {
        setValidationError(validation.error || null);
      }
    }
  };

  const handleSubmit = async () => {
    if (!newStatus) {
      setError('변경할 상태를 선택해주세요.');
      return;
    }
    
    if (!role) {
      setError('사용자 권한을 확인할 수 없습니다. 다시 로그인해주세요.');
      return;
    }

    // Final validation
    const validation = validateStatusTransition(currentStatus, newStatus, role);
    if (!validation.isValid) {
      setError(validation.error || '상태 변경이 허용되지 않습니다.');
      return;
    }

    // Check if note is required
    const noteRequired = requiresNote(currentStatus, newStatus);
    if (noteRequired && !notes.trim()) {
      setError('이 상태 변경에는 사유 입력이 필수입니다.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Submitting status change:', {
        patientId,
        currentStatus,
        newStatus,
        role,
        notes: notes.trim() || undefined
      });

      const result = await changePatientStatus({
        patientId,
        newStatus,
        notes: notes.trim() || undefined
      });

      console.log('Status change result:', result);

      if (result.success) {
        toast({
          title: '상태 변경 완료',
          description: `환자 상태가 '${getStatusLabel(newStatus)}'로 변경되었습니다.`,
        });
        
        // Close dialog and call success callback
        onOpenChange(false);
        // Call onSuccess after a small delay to ensure dialog closes first
        setTimeout(() => {
          onSuccess?.();
        }, 100);
      } else {
        setError(result.error || '상태 변경에 실패했습니다.');
      }
    } catch (err) {
      console.error('Status change error:', err);
      setError('상태 변경 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const isNoteRequired = newStatus && requiresNote(currentStatus, newStatus as PatientStatus);
  const nextActions = newStatus ? getNextActions(newStatus as PatientStatus) : [];

  // Debug info
  console.log('Current Status:', currentStatus);
  console.log('User Role:', role);
  console.log('Available Transitions:', permissions.availableStatusTransitions);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>환자 상태 변경</DialogTitle>
          <DialogDescription>
            {patientName} 환자의 상태를 변경합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Status */}
          <div className="space-y-2">
            <Label>현재 상태</Label>
            <div className="flex items-center gap-2">
              <Badge variant={getStatusColor(currentStatus) as any}>
                {getStatusLabel(currentStatus)}
              </Badge>
            </div>
          </div>

          {/* New Status Selection */}
          <div className="space-y-2">
            <Label htmlFor="status">변경할 상태</Label>
            <Select
              value={newStatus}
              onValueChange={handleStatusChange}
              disabled={!permissions.canChangeStatus || loading}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="상태를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {permissions.availableStatusTransitions.map((status) => (
                  <SelectItem key={status} value={status}>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={getStatusColor(status) as any}
                        className="h-5"
                      >
                        {getStatusLabel(status)}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {validationError && (
              <p className="text-sm text-destructive">{validationError}</p>
            )}
          </div>

          {/* Status Flow Visualization */}
          {newStatus && !validationError && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <Badge variant={getStatusColor(currentStatus) as any}>
                {getStatusLabel(currentStatus)}
              </Badge>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <Badge variant={getStatusColor(newStatus as PatientStatus) as any}>
                {getStatusLabel(newStatus as PatientStatus)}
              </Badge>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              변경 사유 {isNoteRequired && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              id="notes"
              placeholder={isNoteRequired ? "변경 사유를 입력하세요 (필수)" : "변경 사유를 입력하세요 (선택)"}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
              rows={3}
            />
          </div>

          {/* Next Actions Preview */}
          {nextActions.length > 0 && newStatus && (
            <div className="space-y-2">
              <Label>다음 가능한 작업</Label>
              <div className="text-sm text-muted-foreground space-y-1">
                {nextActions.map((action, index) => (
                  <div key={index}>• {action}</div>
                ))}
              </div>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!newStatus || loading || !!validationError}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            상태 변경
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}