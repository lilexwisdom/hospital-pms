import { Database } from '@/types/database.types';

export type UserRole = Database['public']['Enums']['user_role'];

export type PatientStatus = 
  | 'pending'                    // 대기중 - BD 배정된 설문 작성 완료
  | 'active'                     // 활성 - BD 상담 진행중
  | 'consulted'                  // 상담완료 - BD 상담 완료, CS 이관 대기
  | 'reservation_in_progress'    // 예약상담중 - CS 예약 상담 진행
  | 'reservation_completed'      // 예약완료 - 검사 예약 완료
  | 'examination_in_progress'    // 검사중 - 검사 당일
  | 'examination_completed'      // 검사완료 - 검사 종료
  | 'awaiting_results'          // 검사결과 대기 - 결과 대기중
  | 'closed';                   // 종결 - 모든 프로세스 완료

export interface PatientStatusTransition {
  from: PatientStatus;
  to: PatientStatus;
  allowedRoles: UserRole[];
  requiresNote?: boolean;
  autoAssignManager?: boolean;
}

export interface StatusChangeHistory {
  id: string;
  patient_id: string;
  from_status: PatientStatus | null;
  to_status: PatientStatus;
  changed_by: string;
  changed_at: string;
  notes: string | null;
  metadata?: Record<string, any>;
}

export interface StatusWorkflowConfig {
  transitions: PatientStatusTransition[];
  statusMetadata: Record<PatientStatus, {
    label: string;
    description: string;
    color: string;
    icon?: string;
    nextActions?: string[];
  }>;
}

export interface PatientStatusChangeRequest {
  patientId: string;
  newStatus: PatientStatus;
  notes?: string;
  assignedManagerId?: string;
  metadata?: Record<string, any>;
}

export interface PatientStatusValidationResult {
  isValid: boolean;
  error?: string;
  requiresNote?: boolean;
  allowedNextStatuses?: PatientStatus[];
}