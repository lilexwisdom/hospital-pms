'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/app/actions/auth';
import { PatientStatus, PatientStatusChangeRequest, StatusChangeHistory } from '@/lib/patient-status/types';
import { validateStatusTransition, shouldAutoAssignManager } from '@/lib/patient-status/validation';
import { Database } from '@/types/database.types';
import { createClient } from '@/lib/supabase/server';

type UserRole = Database['public']['Enums']['user_role'];

export interface ChangePatientStatusParams {
  patientId: string;
  newStatus: PatientStatus;
  notes?: string;
  assignedManagerId?: string;
  metadata?: Record<string, any>;
}

export interface ChangePatientStatusResult {
  success: boolean;
  error?: string;
  history?: StatusChangeHistory;
}

export async function changePatientStatus(
  params: ChangePatientStatusParams
): Promise<ChangePatientStatusResult> {
  console.log('changePatientStatus called with:', params);
  
  try {
    // Get current user
    const userResponse = await getCurrentUser();
    console.log('User response:', userResponse);
    
    if (!userResponse.success || !userResponse.data) {
      return { success: false, error: '인증되지 않은 사용자입니다.' };
    }

    const userData = userResponse.data;
    const userRole = userData.role as UserRole;
    console.log('User role:', userRole);

    // Get server client for database operations
    const serverClient = await createClient();

    // Get current patient status
    console.log('Fetching patient:', params.patientId);
    const { data: patient, error: patientError } = await serverClient
      .from('patients')
      .select('status, cs_manager, assigned_bd_id')
      .eq('id', params.patientId)
      .single();

    console.log('Patient query result:', { patient, error: patientError });

    if (patientError || !patient) {
      console.error('Patient fetch error:', patientError);
      return { success: false, error: '환자 정보를 찾을 수 없습니다.' };
    }

    const currentStatus = patient.status as PatientStatus;

    // Validate status transition
    const validation = validateStatusTransition(
      currentStatus,
      params.newStatus,
      userRole
    );

    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    // Check if note is required
    if (validation.requiresNote && !params.notes) {
      return { success: false, error: '이 상태 변경에는 사유 입력이 필요합니다.' };
    }

    // Prepare update data
    const updateData: any = {
      status: params.newStatus,
      updated_at: new Date().toISOString()
    };

    // Auto-assign manager if needed
    if (shouldAutoAssignManager(currentStatus, params.newStatus)) {
      if (params.assignedManagerId) {
        updateData.cs_manager = params.assignedManagerId;
      } else {
        // For consulted -> reservation_in_progress transition, always assign CS manager
        if (currentStatus === 'consulted' && params.newStatus === 'reservation_in_progress') {
          // If CS is making the change, assign to them
          if (userRole === 'cs') {
            updateData.cs_manager = userData.id;
          } else if (!patient.cs_manager && userRole === 'manager') {
            // If manager is making the change and no CS assigned, assign to manager
            updateData.cs_manager = userData.id;
          }
          // If admin is making the change, keep existing cs_manager or leave null
        } else if (!patient.cs_manager) {
          // For other transitions, only assign if no manager exists
          if (userRole === 'cs' || userRole === 'manager') {
            updateData.cs_manager = userData.id;
          }
        }
      }
    }

    // No need to recreate client - use the one we already have
    
    // Update patient status
    console.log('Updating patient with data:', updateData);
    const { data: updateResult, error: updateError } = await serverClient
      .from('patients')
      .update(updateData)
      .eq('id', params.patientId)
      .select();

    console.log('Update result:', { updateResult, updateError });

    if (updateError) {
      console.error('Update error:', updateError);
      return { success: false, error: '상태 업데이트에 실패했습니다.' };
    }

    // Create status history record
    const historyData: Omit<StatusChangeHistory, 'id'> = {
      patient_id: params.patientId,
      from_status: currentStatus,
      to_status: params.newStatus,
      changed_by: userData.id,
      changed_at: new Date().toISOString(),
      notes: params.notes || null,
      metadata: params.metadata
    };

    const { data: history, error: historyError } = await serverClient
      .from('patient_status_history')
      .insert(historyData)
      .select()
      .single();

    if (historyError) {
      console.error('Failed to create status history:', historyError);
      // Don't fail the whole operation if history fails
    }

    // Create notification for relevant users
    if (updateData.cs_manager && updateData.cs_manager !== userData.id) {
      await serverClient
        .from('notifications')
        .insert({
          user_id: updateData.cs_manager,
          type: 'patient_status_changed',
          title: '환자 상태 변경',
          message: `${patient.cs_manager === updateData.cs_manager ? '담당' : '새로 배정된'} 환자의 상태가 변경되었습니다.`,
          metadata: {
            patient_id: params.patientId,
            old_status: currentStatus,
            new_status: params.newStatus,
            changed_by: userData.id
          }
        });
    }

    // Create audit log
    await serverClient
      .from('audit_logs')
      .insert({
        user_id: userData.id,
        action: 'patient_status_change',
        resource_type: 'patients',
        resource_id: params.patientId,
        changes: {
          from: currentStatus,
          to: params.newStatus,
          notes: params.notes,
          assigned_manager: updateData.cs_manager
        }
      });

    // Revalidate patient pages
    revalidatePath(`/patients/${params.patientId}`);
    revalidatePath('/patients');

    return {
      success: true,
      history: history as StatusChangeHistory
    };
  } catch (error) {
    console.error('Error changing patient status:', error);
    return {
      success: false,
      error: '상태 변경 중 오류가 발생했습니다.'
    };
  }
}

export async function getPatientStatusHistory(
  patientId: string
): Promise<{ success: boolean; data?: StatusChangeHistory[]; error?: string }> {
  try {
    const userResponse = await getCurrentUser();
    if (!userResponse.success || !userResponse.data) {
      return { success: false, error: '인증되지 않은 사용자입니다.' };
    }

    const serverClient = await createClient();

    const { data, error } = await serverClient
      .from('patient_status_history')
      .select(`
        *,
        changed_by_profile:profiles!patient_status_history_changed_by_fkey (
          id,
          name,
          role
        )
      `)
      .eq('patient_id', patientId)
      .order('changed_at', { ascending: false });

    if (error) {
      return { success: false, error: '상태 변경 이력을 불러올 수 없습니다.' };
    }

    return {
      success: true,
      data: data as StatusChangeHistory[]
    };
  } catch (error) {
    console.error('Error fetching status history:', error);
    return {
      success: false,
      error: '이력 조회 중 오류가 발생했습니다.'
    };
  }
}