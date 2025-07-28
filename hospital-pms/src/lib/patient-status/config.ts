import { StatusWorkflowConfig, PatientStatus } from './types';

export const PATIENT_STATUS_CONFIG: StatusWorkflowConfig = {
  transitions: [
    // From pending status (BD 배정된 설문 작성 완료)
    {
      from: 'pending',
      to: 'active',
      allowedRoles: ['admin', 'manager', 'bd'],
      autoAssignManager: false // BD가 이미 배정된 상태
    },
    
    // From active status (BD 상담 진행중)
    {
      from: 'active',
      to: 'consulted',
      allowedRoles: ['admin', 'manager', 'bd'],
      requiresNote: true
    },
    
    // From consulted status (BD 상담 완료, CS 이관 대기)
    {
      from: 'consulted',
      to: 'reservation_in_progress',
      allowedRoles: ['admin', 'manager', 'cs'],
      autoAssignManager: true // CS 담당자 자동 배정
    },
    
    // From reservation_in_progress (CS 예약 상담 진행)
    {
      from: 'reservation_in_progress',
      to: 'reservation_completed',
      allowedRoles: ['admin', 'manager', 'cs'],
      requiresNote: true
    },
    
    // From reservation_completed (예약 완료)
    {
      from: 'reservation_completed',
      to: 'examination_in_progress',
      allowedRoles: ['admin', 'manager', 'cs']
    },
    
    // From examination_in_progress (검사중)
    {
      from: 'examination_in_progress',
      to: 'examination_completed',
      allowedRoles: ['admin', 'manager', 'cs'],
      requiresNote: true
    },
    
    // From examination_completed (검사 완료)
    {
      from: 'examination_completed',
      to: 'awaiting_results',
      allowedRoles: ['admin', 'manager', 'cs']
    },
    
    // From awaiting_results (검사결과 대기)
    {
      from: 'awaiting_results',
      to: 'closed',
      allowedRoles: ['admin', 'manager', 'cs'],
      requiresNote: true
    },
    
    // 예외 처리 - 관리자는 어떤 상태에서든 종결 가능
    {
      from: 'pending',
      to: 'closed',
      allowedRoles: ['admin', 'manager'],
      requiresNote: true
    },
    {
      from: 'active',
      to: 'closed',
      allowedRoles: ['admin', 'manager'],
      requiresNote: true
    },
    {
      from: 'consulted',
      to: 'closed',
      allowedRoles: ['admin', 'manager'],
      requiresNote: true
    },
    {
      from: 'reservation_in_progress',
      to: 'closed',
      allowedRoles: ['admin', 'manager'],
      requiresNote: true
    },
    {
      from: 'reservation_completed',
      to: 'closed',
      allowedRoles: ['admin', 'manager'],
      requiresNote: true
    },
    {
      from: 'examination_in_progress',
      to: 'closed',
      allowedRoles: ['admin', 'manager'],
      requiresNote: true
    },
    {
      from: 'examination_completed',
      to: 'closed',
      allowedRoles: ['admin', 'manager'],
      requiresNote: true
    },
    
    // 재활성화 - 종결된 환자를 다시 시작
    {
      from: 'closed',
      to: 'pending',
      allowedRoles: ['admin', 'manager'],
      requiresNote: true
    }
  ],
  
  statusMetadata: {
    pending: {
      label: '대기중',
      description: 'BD 배정된 설문 작성 완료',
      color: 'secondary',
      nextActions: ['BD 문진 상담 시작', '환자 정보 확인']
    },
    active: {
      label: '활성',
      description: 'BD 상담 진행중',
      color: 'default',
      nextActions: ['추가 문진 진행', '희망검사 조사', '상담 완료 처리']
    },
    consulted: {
      label: '상담완료',
      description: 'BD 상담 완료, CS 이관 대기',
      color: 'primary',
      nextActions: ['CS 담당자 배정', '예약 상담 시작']
    },
    reservation_in_progress: {
      label: '예약상담중',
      description: 'CS 예약 상담 진행',
      color: 'info',
      nextActions: ['검사 일정 조율', '예약 확정']
    },
    reservation_completed: {
      label: '예약완료',
      description: '검사 예약 완료',
      color: 'success',
      nextActions: ['검사 전 안내', '검사 당일 대기']
    },
    examination_in_progress: {
      label: '검사중',
      description: '검사 당일',
      color: 'warning',
      nextActions: ['검사 진행 확인', '검사 완료 처리']
    },
    examination_completed: {
      label: '검사완료',
      description: '검사 종료',
      color: 'success',
      nextActions: ['결과 대기', '추가 검사 확인']
    },
    awaiting_results: {
      label: '검사결과 대기',
      description: '모든 검사 결과 대기중',
      color: 'info',
      nextActions: ['결과 통보 준비', '최종 확인']
    },
    closed: {
      label: '종결',
      description: '모든 프로세스 완료',
      color: 'muted',
      nextActions: ['기록 보관', '재등록 가능']
    }
  }
};

export const getStatusLabel = (status: PatientStatus): string => {
  return PATIENT_STATUS_CONFIG.statusMetadata[status]?.label || status;
};

export const getStatusColor = (status: PatientStatus): string => {
  return PATIENT_STATUS_CONFIG.statusMetadata[status]?.color || 'default';
};

export const getStatusDescription = (status: PatientStatus): string => {
  return PATIENT_STATUS_CONFIG.statusMetadata[status]?.description || '';
};

export const getNextActions = (status: PatientStatus): string[] => {
  return PATIENT_STATUS_CONFIG.statusMetadata[status]?.nextActions || [];
};