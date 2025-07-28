import { renderHook } from '@testing-library/react';
import { usePatientPermissions, useCanChangePatientStatus } from '@/hooks/usePatientPermissions';
import { useAuth } from '@/hooks/useAuth';
import { PatientStatus } from '@/lib/patient-status/types';

// Mock useAuth hook
jest.mock('@/hooks/useAuth');

describe('usePatientPermissions', () => {
  const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Admin permissions', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: 'admin-user' } as any,
        role: 'admin',
        session: null,
        profile: null,
        loading: false,
        isAuthenticated: true,
        isSessionExpiring: false,
        sessionRemainingTime: '',
        signIn: jest.fn(),
        signOut: jest.fn(),
        refreshSession: jest.fn(),
        hasRole: jest.fn(),
        hasAnyRole: jest.fn(),
      });
    });

    test('should have full permissions', () => {
      const { result } = renderHook(() => usePatientPermissions({
        patientId: 'patient-1',
        currentStatus: 'pending' as PatientStatus,
      }));

      expect(result.current.canViewPatient).toBe(true);
      expect(result.current.canEditPatient).toBe(true);
      expect(result.current.canChangeStatus).toBe(true);
      expect(result.current.canAssignManager).toBe(true);
      expect(result.current.canViewMedicalRecords).toBe(true);
      expect(result.current.canEditMedicalRecords).toBe(true);
      expect(result.current.canDeletePatient).toBe(true);
    });
  });

  describe('Manager permissions', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: 'manager-user' } as any,
        role: 'manager',
        session: null,
        profile: null,
        loading: false,
        isAuthenticated: true,
        isSessionExpiring: false,
        sessionRemainingTime: '',
        signIn: jest.fn(),
        signOut: jest.fn(),
        refreshSession: jest.fn(),
        hasRole: jest.fn(),
        hasAnyRole: jest.fn(),
      });
    });

    test('should have full permissions except delete', () => {
      const { result } = renderHook(() => usePatientPermissions({
        patientId: 'patient-1',
        currentStatus: 'active' as PatientStatus,
      }));

      expect(result.current.canViewPatient).toBe(true);
      expect(result.current.canEditPatient).toBe(true);
      expect(result.current.canChangeStatus).toBe(true);
      expect(result.current.canAssignManager).toBe(true);
      expect(result.current.canViewMedicalRecords).toBe(true);
      expect(result.current.canEditMedicalRecords).toBe(true);
      expect(result.current.canDeletePatient).toBe(false);
    });
  });

  describe('BD permissions', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: 'bd-user' } as any,
        role: 'bd',
        session: null,
        profile: null,
        loading: false,
        isAuthenticated: true,
        isSessionExpiring: false,
        sessionRemainingTime: '',
        signIn: jest.fn(),
        signOut: jest.fn(),
        refreshSession: jest.fn(),
        hasRole: jest.fn(),
        hasAnyRole: jest.fn(),
      });
    });

    test('should have permissions for created patients', () => {
      const { result } = renderHook(() => usePatientPermissions({
        patientId: 'patient-1',
        currentStatus: 'pending' as PatientStatus,
        createdBy: 'bd-user',
      }));

      expect(result.current.canViewPatient).toBe(true);
      expect(result.current.canEditPatient).toBe(true);
      expect(result.current.canChangeStatus).toBe(true);
      expect(result.current.canAssignManager).toBe(false);
      expect(result.current.canViewMedicalRecords).toBe(true);
      expect(result.current.canEditMedicalRecords).toBe(false);
      expect(result.current.canDeletePatient).toBe(false);
      expect(result.current.availableStatusTransitions).toContain('active');
    });

    test('should have limited permissions for non-created patients', () => {
      const { result } = renderHook(() => usePatientPermissions({
        patientId: 'patient-1',
        currentStatus: 'active' as PatientStatus,
        createdBy: 'other-user',
      }));

      expect(result.current.canViewPatient).toBe(false);
      expect(result.current.canEditPatient).toBe(false);
      expect(result.current.canChangeStatus).toBe(false);
      expect(result.current.availableStatusTransitions).toHaveLength(0);
    });
  });

  describe('CS permissions', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: 'cs-user' } as any,
        role: 'cs',
        session: null,
        profile: null,
        loading: false,
        isAuthenticated: true,
        isSessionExpiring: false,
        sessionRemainingTime: '',
        signIn: jest.fn(),
        signOut: jest.fn(),
        refreshSession: jest.fn(),
        hasRole: jest.fn(),
        hasAnyRole: jest.fn(),
      });
    });

    test('should have permissions for managed patients', () => {
      const { result } = renderHook(() => usePatientPermissions({
        patientId: 'patient-1',
        currentStatus: 'active' as PatientStatus,
        csManager: 'cs-user',
      }));

      expect(result.current.canViewPatient).toBe(true);
      expect(result.current.canEditPatient).toBe(true);
      expect(result.current.canChangeStatus).toBe(true);
      expect(result.current.canAssignManager).toBe(false);
      expect(result.current.canViewMedicalRecords).toBe(true);
      expect(result.current.canEditMedicalRecords).toBe(true);
      expect(result.current.canDeletePatient).toBe(false);
      expect(result.current.availableStatusTransitions).toContain('consulted');
    });

    test('should have no permissions for non-managed patients', () => {
      const { result } = renderHook(() => usePatientPermissions({
        patientId: 'patient-1',
        currentStatus: 'active' as PatientStatus,
        csManager: 'other-user',
      }));

      expect(result.current.canViewPatient).toBe(false);
      expect(result.current.canEditPatient).toBe(false);
      expect(result.current.canChangeStatus).toBe(false);
      expect(result.current.availableStatusTransitions).toHaveLength(0);
    });
  });

  describe('No auth', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        role: null,
        session: null,
        profile: null,
        loading: false,
        isAuthenticated: false,
        isSessionExpiring: false,
        sessionRemainingTime: '',
        signIn: jest.fn(),
        signOut: jest.fn(),
        refreshSession: jest.fn(),
        hasRole: jest.fn(),
        hasAnyRole: jest.fn(),
      });
    });

    test('should have no permissions when not authenticated', () => {
      const { result } = renderHook(() => usePatientPermissions({
        patientId: 'patient-1',
        currentStatus: 'active' as PatientStatus,
      }));

      expect(result.current.canViewPatient).toBe(false);
      expect(result.current.canEditPatient).toBe(false);
      expect(result.current.canChangeStatus).toBe(false);
      expect(result.current.canAssignManager).toBe(false);
      expect(result.current.canViewMedicalRecords).toBe(false);
      expect(result.current.canEditMedicalRecords).toBe(false);
      expect(result.current.canDeletePatient).toBe(false);
      expect(result.current.availableStatusTransitions).toHaveLength(0);
    });
  });
});

describe('useCanChangePatientStatus', () => {
  const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

  test('should return true for valid status transitions', () => {
    mockUseAuth.mockReturnValue({
      role: 'admin',
    } as any);

    const { result } = renderHook(() => 
      useCanChangePatientStatus('pending' as PatientStatus, 'active' as PatientStatus)
    );

    expect(result.current).toBe(true);
  });

  test('should return false for invalid transitions', () => {
    mockUseAuth.mockReturnValue({
      role: 'cs',
    } as any);

    const { result } = renderHook(() => 
      useCanChangePatientStatus('active' as PatientStatus, 'inactive' as PatientStatus)
    );

    expect(result.current).toBe(false);
  });

  test('should return false when no role', () => {
    mockUseAuth.mockReturnValue({
      role: null,
    } as any);

    const { result } = renderHook(() => 
      useCanChangePatientStatus('pending' as PatientStatus, 'active' as PatientStatus)
    );

    expect(result.current).toBe(false);
  });
});