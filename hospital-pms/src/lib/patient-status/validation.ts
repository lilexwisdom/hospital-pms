import { PATIENT_STATUS_CONFIG } from './config';
import { 
  PatientStatus, 
  UserRole, 
  PatientStatusValidationResult,
  PatientStatusTransition 
} from './types';

export function validateStatusTransition(
  currentStatus: PatientStatus,
  newStatus: PatientStatus,
  userRole: UserRole
): PatientStatusValidationResult {
  // Check if trying to transition to the same status
  if (currentStatus === newStatus) {
    return {
      isValid: false,
      error: '동일한 상태로는 변경할 수 없습니다.'
    };
  }

  // Find valid transitions from current status
  const validTransitions = PATIENT_STATUS_CONFIG.transitions.filter(
    transition => transition.from === currentStatus
  );

  // Check if any transition exists from current status
  if (validTransitions.length === 0) {
    return {
      isValid: false,
      error: `'${currentStatus}' 상태에서는 다른 상태로 변경할 수 없습니다.`
    };
  }

  // Find the specific transition
  const transition = validTransitions.find(t => t.to === newStatus);
  
  if (!transition) {
    const allowedStatuses = validTransitions.map(t => t.to);
    return {
      isValid: false,
      error: `'${currentStatus}'에서 '${newStatus}'로 직접 변경할 수 없습니다.`,
      allowedNextStatuses: allowedStatuses
    };
  }

  // Check role permission
  if (!transition.allowedRoles.includes(userRole)) {
    return {
      isValid: false,
      error: `'${userRole}' 역할은 이 상태 변경을 수행할 권한이 없습니다.`
    };
  }

  // Valid transition
  return {
    isValid: true,
    requiresNote: transition.requiresNote,
    allowedNextStatuses: validTransitions.map(t => t.to)
  };
}

export function getAvailableTransitions(
  currentStatus: PatientStatus,
  userRole: UserRole
): PatientStatusTransition[] {
  return PATIENT_STATUS_CONFIG.transitions.filter(
    transition => 
      transition.from === currentStatus && 
      transition.allowedRoles.includes(userRole)
  );
}

export function getAvailableStatuses(
  currentStatus: PatientStatus,
  userRole: UserRole
): PatientStatus[] {
  const transitions = getAvailableTransitions(currentStatus, userRole);
  return transitions.map(t => t.to);
}

export function requiresNote(
  currentStatus: PatientStatus,
  newStatus: PatientStatus
): boolean {
  const transition = PATIENT_STATUS_CONFIG.transitions.find(
    t => t.from === currentStatus && t.to === newStatus
  );
  return transition?.requiresNote || false;
}

export function shouldAutoAssignManager(
  currentStatus: PatientStatus,
  newStatus: PatientStatus
): boolean {
  const transition = PATIENT_STATUS_CONFIG.transitions.find(
    t => t.from === currentStatus && t.to === newStatus
  );
  return transition?.autoAssignManager || false;
}

export function canUserChangeStatus(
  userRole: UserRole,
  fromStatus: PatientStatus,
  toStatus: PatientStatus
): boolean {
  const transition = PATIENT_STATUS_CONFIG.transitions.find(
    t => t.from === fromStatus && t.to === toStatus
  );
  return transition ? transition.allowedRoles.includes(userRole) : false;
}

// BD에서 CS로 핸드오버가 필요한 상태인지 확인
export function isHandoverToCS(
  fromStatus: PatientStatus,
  toStatus: PatientStatus
): boolean {
  return fromStatus === 'consulted' && toStatus === 'reservation_in_progress';
}

// 특정 역할이 관리할 수 있는 상태인지 확인
export function isStatusManagedByRole(
  status: PatientStatus,
  role: UserRole
): boolean {
  // BD가 관리하는 상태
  const bdManagedStatuses: PatientStatus[] = ['pending', 'active', 'consulted'];
  
  // CS가 관리하는 상태
  const csManagedStatuses: PatientStatus[] = [
    'reservation_in_progress',
    'reservation_completed',
    'examination_in_progress',
    'examination_completed',
    'awaiting_results',
    'closed'
  ];
  
  switch (role) {
    case 'bd':
      return bdManagedStatuses.includes(status);
    case 'cs':
      return csManagedStatuses.includes(status);
    case 'admin':
    case 'manager':
      return true; // 관리자는 모든 상태 관리 가능
    default:
      return false;
  }
}