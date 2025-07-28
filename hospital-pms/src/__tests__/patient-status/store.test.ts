import { renderHook, act } from '@testing-library/react';
import { usePatientStatusStore } from '@/stores/patient-status.store';
import { PatientStatus } from '@/lib/patient-status/types';

describe('Patient Status Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => usePatientStatusStore());
    act(() => {
      result.current.statusHistory = {};
      result.current.pendingChanges = {};
      result.current.loading = {};
      result.current.errors = {};
    });
  });

  test('should validate status change', () => {
    const { result } = renderHook(() => usePatientStatusStore());

    act(() => {
      const isValid = result.current.validateStatusChange(
        'patient-1',
        'pending' as PatientStatus,
        'active' as PatientStatus,
        'admin'
      );
      expect(isValid).toBe(true);
    });

    // Invalid transition should set error
    act(() => {
      const isValid = result.current.validateStatusChange(
        'patient-2',
        'discharged' as PatientStatus,
        'pending' as PatientStatus,
        'cs'
      );
      expect(isValid).toBe(false);
      expect(result.current.errors['patient-2']).toBeTruthy();
    });
  });

  test('should set and clear pending changes', () => {
    const { result } = renderHook(() => usePatientStatusStore());

    const changeRequest = {
      patientId: 'patient-1',
      newStatus: 'active' as PatientStatus,
      notes: 'Test note'
    };

    act(() => {
      result.current.setPendingChange('patient-1', changeRequest);
    });

    expect(result.current.pendingChanges['patient-1']).toEqual(changeRequest);

    act(() => {
      result.current.clearPendingChange('patient-1');
    });

    expect(result.current.pendingChanges['patient-1']).toBeUndefined();
  });

  test('should add status history in correct order', () => {
    const { result } = renderHook(() => usePatientStatusStore());

    const history1 = {
      id: '1',
      patient_id: 'patient-1',
      from_status: 'pending' as PatientStatus,
      to_status: 'active' as PatientStatus,
      changed_by: 'user-1',
      changed_at: '2024-01-01T10:00:00Z',
      notes: null
    };

    const history2 = {
      id: '2',
      patient_id: 'patient-1',
      from_status: 'active' as PatientStatus,
      to_status: 'consulted' as PatientStatus,
      changed_by: 'user-2',
      changed_at: '2024-01-02T10:00:00Z',
      notes: 'Consultation completed'
    };

    act(() => {
      result.current.addStatusHistory('patient-1', history1);
      result.current.addStatusHistory('patient-1', history2);
    });

    const patientHistory = result.current.statusHistory['patient-1'];
    expect(patientHistory).toHaveLength(2);
    // Should be sorted by date descending
    expect(patientHistory[0].id).toBe('2');
    expect(patientHistory[1].id).toBe('1');
  });

  test('should manage loading state', () => {
    const { result } = renderHook(() => usePatientStatusStore());

    act(() => {
      result.current.setLoading('patient-1', true);
    });

    expect(result.current.loading['patient-1']).toBe(true);

    act(() => {
      result.current.setLoading('patient-1', false);
    });

    expect(result.current.loading['patient-1']).toBe(false);
  });

  test('should manage error state', () => {
    const { result } = renderHook(() => usePatientStatusStore());

    act(() => {
      result.current.setError('patient-1', 'Test error');
    });

    expect(result.current.errors['patient-1']).toBe('Test error');

    act(() => {
      result.current.clearError('patient-1');
    });

    expect(result.current.errors['patient-1']).toBeUndefined();
  });

  test('should get available statuses for patient', () => {
    const { result } = renderHook(() => usePatientStatusStore());

    const statuses = result.current.getAvailableStatusesForPatient(
      'patient-1',
      'pending' as PatientStatus,
      'admin'
    );

    expect(statuses).toContain('active');
    expect(statuses).toContain('inactive');
  });
});