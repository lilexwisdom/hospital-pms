import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

type Client = SupabaseClient<Database>;

/**
 * Database helper functions for common operations
 * These functions provide type-safe wrappers around Supabase queries
 */

// ============================================
// User & Profile Helpers
// ============================================

export async function getCurrentUserProfile(supabase: Client) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile;
}

export async function updateUserProfile(
  supabase: Client,
  userId: string,
  updates: Partial<Database['public']['Tables']['profiles']['Update']>
) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================
// Patient Helpers
// ============================================

export async function createPatientWithSSN(
  supabase: Client,
  patientData: Omit<Database['public']['Tables']['patients']['Insert'], 'encrypted_ssn' | 'ssn_hash'>,
  ssn: string
) {
  const { data, error } = await supabase
    .rpc('create_patient_with_ssn', {
      patient_data: patientData,
      ssn: ssn
    });

  if (error) throw error;
  return data;
}

export async function searchPatientBySSN(supabase: Client, ssn: string) {
  const { data, error } = await supabase
    .rpc('find_patient_by_ssn', { ssn });

  if (error) throw error;
  return data;
}

export async function getPatientsByUser(
  supabase: Client,
  userId: string,
  role: Database['public']['Enums']['user_role']
) {
  let query = supabase.from('patients').select(`
    *,
    created_by_profile:profiles!patients_created_by_fkey(name, role),
    cs_manager_profile:profiles!patients_cs_manager_fkey(name, role)
  `);

  // Apply role-based filtering
  switch (role) {
    case 'bd':
      query = query.eq('created_by', userId);
      break;
    case 'cs':
      query = query.eq('cs_manager', userId);
      break;
    // admin and manager see all (handled by RLS)
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// ============================================
// Appointment Helpers
// ============================================

export async function getUpcomingAppointments(
  supabase: Client,
  limit = 10
) {
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      patient:patients(id, name, phone, email)
    `)
    .gte('scheduled_at', new Date().toISOString())
    .in('status', ['pending', 'confirmed'])
    .order('scheduled_at', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function getAppointmentsByDateRange(
  supabase: Client,
  startDate: Date,
  endDate: Date
) {
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      patient:patients(id, name, phone, email),
      created_by_profile:profiles!appointments_created_by_fkey(name, role),
      assigned_to_profile:profiles!appointments_assigned_to_fkey(name, role)
    `)
    .gte('scheduled_at', startDate.toISOString())
    .lte('scheduled_at', endDate.toISOString())
    .order('scheduled_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

// ============================================
// Survey Token Helpers
// ============================================

export async function getActiveSurveyTokens(supabase: Client, userId: string) {
  const { data, error } = await supabase
    .from('survey_tokens')
    .select('*')
    .eq('created_by', userId)
    .is('used_at', null)
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getSurveyTokenStats(supabase: Client, userId: string) {
  const { data: tokens, error } = await supabase
    .from('survey_tokens')
    .select('*')
    .eq('created_by', userId);

  if (error) throw error;

  const now = new Date();
  const stats = {
    total: tokens?.length || 0,
    used: tokens?.filter(t => t.used_at).length || 0,
    expired: tokens?.filter(t => !t.used_at && new Date(t.expires_at) < now).length || 0,
    active: tokens?.filter(t => !t.used_at && new Date(t.expires_at) >= now).length || 0,
  };

  return stats;
}

// ============================================
// Medical Records Helpers
// ============================================

export async function getPatientMedicalHistory(
  supabase: Client,
  patientId: string,
  recordTypes?: string[]
) {
  let query = supabase
    .from('medical_records')
    .select(`
      *,
      created_by_profile:profiles!medical_records_created_by_fkey(name, role)
    `)
    .eq('patient_id', patientId);

  if (recordTypes && recordTypes.length > 0) {
    query = query.in('record_type', recordTypes);
  }

  const { data, error } = await query.order('record_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

// ============================================
// Dashboard Statistics
// ============================================

export async function getDashboardStats(supabase: Client, userId: string) {
  const profile = await getCurrentUserProfile(supabase);
  if (!profile) throw new Error('User profile not found');

  const stats: any = {};

  // Get counts based on role
  switch (profile.role) {
    case 'admin':
    case 'manager':
      // Total counts for admin/manager
      const [patients, appointments, activeTokens] = await Promise.all([
        supabase.from('patients').select('id', { count: 'exact', head: true }),
        supabase.from('appointments')
          .select('id', { count: 'exact', head: true })
          .in('status', ['pending', 'confirmed']),
        supabase.from('survey_tokens')
          .select('id', { count: 'exact', head: true })
          .is('used_at', null)
          .gte('expires_at', new Date().toISOString())
      ]);

      stats.totalPatients = patients.count || 0;
      stats.activeAppointments = appointments.count || 0;
      stats.activeTokens = activeTokens.count || 0;
      break;

    case 'bd':
      // BD-specific counts
      const [bdPatients, bdTokens] = await Promise.all([
        supabase.from('patients')
          .select('id', { count: 'exact', head: true })
          .eq('created_by', userId),
        getSurveyTokenStats(supabase, userId)
      ]);

      stats.myPatients = bdPatients.count || 0;
      stats.tokenStats = bdTokens;
      break;

    case 'cs':
      // CS-specific counts
      const [csPatients, csAppointments] = await Promise.all([
        supabase.from('patients')
          .select('id', { count: 'exact', head: true })
          .eq('cs_manager', userId),
        supabase.from('appointments')
          .select('id', { count: 'exact', head: true })
          .or(`created_by.eq.${userId},assigned_to.eq.${userId}`)
          .in('status', ['pending', 'confirmed'])
      ]);

      stats.assignedPatients = csPatients.count || 0;
      stats.myAppointments = csAppointments.count || 0;
      break;
  }

  // Get recent activity (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: recentActivity } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(10);

  stats.recentActivity = recentActivity || [];
  stats.userRole = profile.role;

  return stats;
}

// ============================================
// Error Handling Utilities
// ============================================

export function handleSupabaseError(error: any): string {
  if (error.code === 'PGRST116') {
    return '데이터를 찾을 수 없습니다.';
  }
  if (error.code === '23505') {
    return '이미 존재하는 데이터입니다.';
  }
  if (error.code === '42501') {
    return '권한이 없습니다.';
  }
  if (error.message?.includes('JWT')) {
    return '인증이 만료되었습니다. 다시 로그인해주세요.';
  }
  return error.message || '알 수 없는 오류가 발생했습니다.';
}