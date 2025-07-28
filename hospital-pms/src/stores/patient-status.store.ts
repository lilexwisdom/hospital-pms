import { create } from 'zustand';
import { PatientStatus, StatusChangeHistory, PatientStatusChangeRequest } from '@/lib/patient-status/types';
import { validateStatusTransition, getAvailableStatuses } from '@/lib/patient-status/validation';
import { Database } from '@/types/database.types';

type UserRole = Database['public']['Enums']['user_role'];

interface PatientStatusState {
  // State
  statusHistory: Record<string, StatusChangeHistory[]>;
  pendingChanges: Record<string, PatientStatusChangeRequest>;
  loading: Record<string, boolean>;
  errors: Record<string, string>;
  
  // Actions
  validateStatusChange: (
    patientId: string,
    currentStatus: PatientStatus,
    newStatus: PatientStatus,
    userRole: UserRole
  ) => boolean;
  
  getAvailableStatusesForPatient: (
    patientId: string,
    currentStatus: PatientStatus,
    userRole: UserRole
  ) => PatientStatus[];
  
  setPendingChange: (
    patientId: string,
    change: PatientStatusChangeRequest
  ) => void;
  
  clearPendingChange: (patientId: string) => void;
  
  addStatusHistory: (
    patientId: string,
    history: StatusChangeHistory
  ) => void;
  
  setLoading: (patientId: string, loading: boolean) => void;
  
  setError: (patientId: string, error: string | null) => void;
  
  clearError: (patientId: string) => void;
}

export const usePatientStatusStore = create<PatientStatusState>((set, get) => ({
  // Initial state
  statusHistory: {},
  pendingChanges: {},
  loading: {},
  errors: {},
  
  // Validate status change
  validateStatusChange: (patientId, currentStatus, newStatus, userRole) => {
    const result = validateStatusTransition(currentStatus, newStatus, userRole);
    
    if (!result.isValid && result.error) {
      set((state) => ({
        errors: {
          ...state.errors,
          [patientId]: result.error!
        }
      }));
    }
    
    return result.isValid;
  },
  
  // Get available statuses for a patient
  getAvailableStatusesForPatient: (patientId, currentStatus, userRole) => {
    return getAvailableStatuses(currentStatus, userRole);
  },
  
  // Set pending change
  setPendingChange: (patientId, change) => {
    set((state) => ({
      pendingChanges: {
        ...state.pendingChanges,
        [patientId]: change
      }
    }));
  },
  
  // Clear pending change
  clearPendingChange: (patientId) => {
    set((state) => {
      const { [patientId]: _, ...rest } = state.pendingChanges;
      return { pendingChanges: rest };
    });
  },
  
  // Add status history
  addStatusHistory: (patientId, history) => {
    set((state) => ({
      statusHistory: {
        ...state.statusHistory,
        [patientId]: [
          ...(state.statusHistory[patientId] || []),
          history
        ].sort((a, b) => 
          new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
        )
      }
    }));
  },
  
  // Set loading state
  setLoading: (patientId, loading) => {
    set((state) => ({
      loading: {
        ...state.loading,
        [patientId]: loading
      }
    }));
  },
  
  // Set error
  setError: (patientId, error) => {
    set((state) => ({
      errors: {
        ...state.errors,
        [patientId]: error || ''
      }
    }));
  },
  
  // Clear error
  clearError: (patientId) => {
    set((state) => {
      const { [patientId]: _, ...rest } = state.errors;
      return { errors: rest };
    });
  }
}));