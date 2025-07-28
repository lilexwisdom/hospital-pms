'use client';

import { useAuth } from '@/hooks/useAuth';
import { PatientStatus } from '@/lib/patient-status/types';
import { getAvailableStatuses, canUserChangeStatus } from '@/lib/patient-status/validation';
import { Database } from '@/types/database.types';

type UserRole = Database['public']['Enums']['user_role'];

interface PatientPermissions {
  canViewPatient: boolean;
  canEditPatient: boolean;
  canChangeStatus: boolean;
  canAssignManager: boolean;
  canViewMedicalRecords: boolean;
  canEditMedicalRecords: boolean;
  canDeletePatient: boolean;
  availableStatusTransitions: PatientStatus[];
}

interface UsePatientPermissionsParams {
  patientId?: string;
  currentStatus?: PatientStatus;
  createdBy?: string;
  assignedTo?: string;
  csManager?: string;
}

export function usePatientPermissions({
  patientId,
  currentStatus,
  createdBy,
  assignedTo,
  csManager
}: UsePatientPermissionsParams = {}): PatientPermissions {
  const { user, role } = useAuth();

  if (!user || !role) {
    return {
      canViewPatient: false,
      canEditPatient: false,
      canChangeStatus: false,
      canAssignManager: false,
      canViewMedicalRecords: false,
      canEditMedicalRecords: false,
      canDeletePatient: false,
      availableStatusTransitions: []
    };
  }

  // Admin and Manager have full permissions
  if (role === 'admin' || role === 'manager') {
    return {
      canViewPatient: true,
      canEditPatient: true,
      canChangeStatus: true,
      canAssignManager: true,
      canViewMedicalRecords: true,
      canEditMedicalRecords: true,
      canDeletePatient: role === 'admin',
      availableStatusTransitions: currentStatus 
        ? getAvailableStatuses(currentStatus, role)
        : []
    };
  }

  // BD permissions
  if (role === 'bd') {
    const isCreator = createdBy === user.id;
    const isAssigned = assignedTo === user.id;
    
    return {
      canViewPatient: isCreator || isAssigned,
      canEditPatient: isCreator,
      canChangeStatus: isCreator && currentStatus !== undefined,
      canAssignManager: false,
      canViewMedicalRecords: isCreator || isAssigned,
      canEditMedicalRecords: false,
      canDeletePatient: false,
      availableStatusTransitions: currentStatus && (isCreator || isAssigned)
        ? getAvailableStatuses(currentStatus, role)
        : []
    };
  }

  // CS permissions
  if (role === 'cs') {
    const isManager = csManager === user.id;
    // CS can take over consulted patients (BD to CS handover)
    const canTakeOverConsulted = currentStatus === 'consulted';
    // CS can view all patients in CS-managed statuses
    const isCSManagedStatus = currentStatus && [
      'consulted',
      'reservation_in_progress', 
      'reservation_completed',
      'examination_in_progress',
      'examination_completed',
      'awaiting_results',
      'closed'
    ].includes(currentStatus);
    
    const canView = isManager || isCSManagedStatus;
    const canChange = isManager || canTakeOverConsulted;
    
    return {
      canViewPatient: canView,
      canEditPatient: isManager,
      canChangeStatus: canChange && currentStatus !== undefined,
      canAssignManager: false,
      canViewMedicalRecords: canView,
      canEditMedicalRecords: isManager,
      canDeletePatient: false,
      availableStatusTransitions: currentStatus && canChange
        ? getAvailableStatuses(currentStatus, role)
        : []
    };
  }

  // Default (no permissions)
  return {
    canViewPatient: false,
    canEditPatient: false,
    canChangeStatus: false,
    canAssignManager: false,
    canViewMedicalRecords: false,
    canEditMedicalRecords: false,
    canDeletePatient: false,
    availableStatusTransitions: []
  };
}

export function useCanChangePatientStatus(
  fromStatus: PatientStatus,
  toStatus: PatientStatus
): boolean {
  const { role } = useAuth();
  
  if (!role) return false;
  
  return canUserChangeStatus(role, fromStatus, toStatus);
}