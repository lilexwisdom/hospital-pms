import { describe, expect, test } from '@jest/globals';
import { 
  validateStatusTransition, 
  getAvailableTransitions,
  getAvailableStatuses,
  requiresNote,
  shouldAutoAssignManager,
  canUserChangeStatus
} from '@/lib/patient-status/validation';
import { PatientStatus, UserRole } from '@/lib/patient-status/types';

describe('Patient Status Validation', () => {
  describe('validateStatusTransition', () => {
    test('should reject transition to same status', () => {
      const result = validateStatusTransition('pending', 'pending', 'admin');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('동일한 상태로는 변경할 수 없습니다');
    });

    test('should allow valid transition for admin', () => {
      const result = validateStatusTransition('pending', 'active', 'admin');
      expect(result.isValid).toBe(true);
      expect(result.requiresNote).toBe(false);
    });

    test('should reject invalid transition', () => {
      const result = validateStatusTransition('discharged', 'pending', 'cs');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('직접 변경할 수 없습니다');
    });

    test('should reject transition for unauthorized role', () => {
      const result = validateStatusTransition('active', 'inactive', 'cs');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('권한이 없습니다');
    });

    test('should indicate when note is required', () => {
      const result = validateStatusTransition('active', 'consulted', 'cs');
      expect(result.isValid).toBe(true);
      expect(result.requiresNote).toBe(true);
    });
  });

  describe('getAvailableTransitions', () => {
    test('should return available transitions for admin from pending', () => {
      const transitions = getAvailableTransitions('pending', 'admin');
      expect(transitions).toHaveLength(2);
      expect(transitions.map(t => t.to)).toContain('active');
      expect(transitions.map(t => t.to)).toContain('inactive');
    });

    test('should return limited transitions for cs from active', () => {
      const transitions = getAvailableTransitions('active', 'cs');
      expect(transitions).toHaveLength(1);
      expect(transitions[0].to).toBe('consulted');
    });

    test('should return empty array for invalid status', () => {
      const transitions = getAvailableTransitions('invalid' as PatientStatus, 'admin');
      expect(transitions).toHaveLength(0);
    });
  });

  describe('getAvailableStatuses', () => {
    test('should return available status options for role', () => {
      const statuses = getAvailableStatuses('pending', 'bd');
      expect(statuses).toContain('active');
      expect(statuses).not.toContain('inactive');
    });
  });

  describe('requiresNote', () => {
    test('should return true for transitions requiring notes', () => {
      expect(requiresNote('pending', 'inactive')).toBe(true);
      expect(requiresNote('active', 'consulted')).toBe(true);
    });

    test('should return false for transitions not requiring notes', () => {
      expect(requiresNote('pending', 'active')).toBe(false);
      expect(requiresNote('treatment_completed', 'follow_up')).toBe(false);
    });
  });

  describe('shouldAutoAssignManager', () => {
    test('should return true for pending to active transition', () => {
      expect(shouldAutoAssignManager('pending', 'active')).toBe(true);
    });

    test('should return false for other transitions', () => {
      expect(shouldAutoAssignManager('active', 'consulted')).toBe(false);
    });
  });

  describe('canUserChangeStatus', () => {
    test('should check role permissions for specific transitions', () => {
      expect(canUserChangeStatus('admin', 'pending', 'active')).toBe(true);
      expect(canUserChangeStatus('bd', 'active', 'inactive')).toBe(false);
      expect(canUserChangeStatus('cs', 'active', 'consulted')).toBe(true);
    });
  });
});