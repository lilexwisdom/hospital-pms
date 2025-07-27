import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';

type Appointment = Database['public']['Tables']['appointments']['Row'];
type NewAppointment = Database['public']['Tables']['appointments']['Insert'];
type AppointmentStatus = Database['public']['Enums']['appointment_status'];
type AppointmentHistory = Database['public']['Tables']['appointment_status_history']['Row'];

export interface CreateAppointmentData {
  patient_id: string;
  scheduled_at: string;
  duration_minutes?: number;
  consultation_type?: string;
  cs_notes?: string;
  assigned_to?: string;
}

export interface AvailableSlot {
  slot_date: string;
  slot_time: string;
  available: boolean;
}

export class AppointmentService {
  private supabase = createClient();

  /**
   * Create a new appointment
   */
  async createAppointment(data: CreateAppointmentData): Promise<Appointment> {
    const user = await this.supabase.auth.getUser();
    
    const { data: appointment, error } = await this.supabase
      .from('appointments')
      .insert({
        patient_id: data.patient_id,
        scheduled_at: data.scheduled_at,
        duration_minutes: data.duration_minutes || 30,
        consultation_type: data.consultation_type || 'general',
        cs_notes: data.cs_notes,
        assigned_to: data.assigned_to,
        created_by: user.data.user?.id!,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return appointment;
  }

  /**
   * Update appointment details
   */
  async updateAppointment(
    appointmentId: string,
    updates: Partial<Omit<Appointment, 'id' | 'created_at' | 'updated_at' | 'created_by'>>
  ): Promise<Appointment> {
    const { data, error } = await this.supabase
      .from('appointments')
      .update(updates)
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update appointment status
   */
  async updateAppointmentStatus(
    appointmentId: string,
    status: AppointmentStatus,
    reason?: string
  ): Promise<Appointment> {
    const { data, error } = await this.supabase
      .from('appointments')
      .update({ status })
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) throw error;

    // The trigger will automatically create history record
    // If we need to add a reason, we can update the history record
    if (reason) {
      await this.supabase
        .from('appointment_status_history')
        .update({ reason })
        .eq('appointment_id', appointmentId)
        .order('changed_at', { ascending: false })
        .limit(1);
    }

    return data;
  }

  /**
   * Get appointment by ID with full details
   */
  async getAppointment(appointmentId: string): Promise<Appointment & {
    patient: any;
    created_by_profile: any;
    assigned_to_profile: any;
  } | null> {
    const { data, error } = await this.supabase
      .from('appointments')
      .select(`
        *,
        patient:patients(
          id,
          name,
          phone,
          email,
          created_by_profile:profiles!patients_created_by_fkey(name, role),
          cs_manager_profile:profiles!patients_cs_manager_fkey(name, role)
        ),
        created_by_profile:profiles!appointments_created_by_fkey(name, role),
        assigned_to_profile:profiles!appointments_assigned_to_fkey(name, role)
      `)
      .eq('id', appointmentId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Get appointments for a patient
   */
  async getPatientAppointments(patientId: string): Promise<Appointment[]> {
    const { data, error } = await this.supabase
      .from('appointments')
      .select('*')
      .eq('patient_id', patientId)
      .order('scheduled_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get appointments for current user (CS staff)
   */
  async getMyAppointments(filter?: {
    status?: AppointmentStatus;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<Appointment[]> {
    let query = this.supabase
      .from('appointments')
      .select(`
        *,
        patient:patients(id, name, phone, email)
      `)
      .order('scheduled_at', { ascending: true });

    if (filter?.status) {
      query = query.eq('status', filter.status);
    }

    if (filter?.dateFrom) {
      query = query.gte('scheduled_at', filter.dateFrom);
    }

    if (filter?.dateTo) {
      query = query.lte('scheduled_at', filter.dateTo);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  /**
   * Get available appointment slots
   */
  async getAvailableSlots(
    startDate: string,
    endDate: string,
    durationMinutes: number = 30
  ): Promise<AvailableSlot[]> {
    const { data, error } = await this.supabase
      .rpc('get_available_slots', {
        start_date: startDate,
        end_date: endDate,
        duration_minutes: durationMinutes
      });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get appointment status history
   */
  async getAppointmentHistory(appointmentId: string): Promise<AppointmentHistory[]> {
    const { data, error } = await this.supabase
      .from('appointment_status_history')
      .select(`
        *,
        changed_by_profile:profiles!appointment_status_history_changed_by_fkey(name, role)
      `)
      .eq('appointment_id', appointmentId)
      .order('changed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get upcoming appointments that need reminders
   */
  async getAppointmentsNeedingReminders(): Promise<Appointment[]> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data, error } = await this.supabase
      .from('appointments')
      .select(`
        *,
        patient:patients(name, phone, email)
      `)
      .eq('status', 'confirmed')
      .eq('reminder_sent', false)
      .gte('scheduled_at', new Date().toISOString())
      .lte('scheduled_at', tomorrow.toISOString());

    if (error) throw error;
    return data || [];
  }

  /**
   * Mark reminder as sent
   */
  async markReminderSent(appointmentId: string): Promise<void> {
    const { error } = await this.supabase
      .from('appointments')
      .update({ reminder_sent: true })
      .eq('id', appointmentId);

    if (error) throw error;
  }

  /**
   * Cancel appointment
   */
  async cancelAppointment(appointmentId: string, reason: string): Promise<Appointment> {
    return this.updateAppointmentStatus(appointmentId, 'cancelled', reason);
  }

  /**
   * Confirm appointment
   */
  async confirmAppointment(appointmentId: string): Promise<Appointment> {
    return this.updateAppointmentStatus(appointmentId, 'confirmed');
  }

  /**
   * Complete appointment
   */
  async completeAppointment(appointmentId: string, notes?: string): Promise<Appointment> {
    const updates: any = { status: 'completed' };
    if (notes) {
      updates.internal_notes = notes;
    }
    
    const { data, error } = await this.supabase
      .from('appointments')
      .update(updates)
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}