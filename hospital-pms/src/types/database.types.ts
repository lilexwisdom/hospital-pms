export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      patients: {
        Row: {
          id: string
          name: string
          encrypted_ssn: ArrayBuffer
          ssn_hash: string
          phone: string | null
          email: string | null
          date_of_birth: string | null
          gender: 'male' | 'female' | 'other' | null
          address: Json
          address_detail: string | null
          emergency_contact: Json
          status: 'pending' | 'active' | 'inactive'
          patient_number: string | null
          created_by: string | null
          cs_manager: string | null
          assigned_bd_id: string | null
          created_at: string
          updated_at: string
          flag_hypertension: boolean
          flag_diabetes: boolean
          flag_hyperlipidemia: boolean
          flag_anticoagulant: boolean
          flag_asthma: boolean
          flag_allergy: boolean
          flag_cardiovascular: boolean
          flag_pregnancy: boolean
          version: number
        }
        Insert: {
          id?: string
          name: string
          encrypted_ssn: ArrayBuffer
          ssn_hash: string
          phone?: string | null
          email?: string | null
          date_of_birth?: string | null
          gender?: 'male' | 'female' | 'other' | null
          address?: Json
          address_detail?: string | null
          emergency_contact?: Json
          status?: 'pending' | 'active' | 'inactive'
          patient_number?: string | null
          created_by?: string | null
          cs_manager?: string | null
          assigned_bd_id?: string | null
          created_at?: string
          updated_at?: string
          flag_hypertension?: boolean
          flag_diabetes?: boolean
          flag_hyperlipidemia?: boolean
          flag_anticoagulant?: boolean
          flag_asthma?: boolean
          flag_allergy?: boolean
          flag_cardiovascular?: boolean
          flag_pregnancy?: boolean
          version?: number
        }
        Update: {
          id?: string
          name?: string
          encrypted_ssn?: ArrayBuffer
          ssn_hash?: string
          phone?: string | null
          email?: string | null
          date_of_birth?: string | null
          gender?: 'male' | 'female' | 'other' | null
          address?: Json
          address_detail?: string | null
          emergency_contact?: Json
          status?: 'pending' | 'active' | 'inactive'
          patient_number?: string | null
          created_by?: string | null
          cs_manager?: string | null
          assigned_bd_id?: string | null
          created_at?: string
          updated_at?: string
          flag_hypertension?: boolean
          flag_diabetes?: boolean
          flag_hyperlipidemia?: boolean
          flag_anticoagulant?: boolean
          flag_asthma?: boolean
          flag_allergy?: boolean
          flag_cardiovascular?: boolean
          flag_pregnancy?: boolean
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "patients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_cs_manager_fkey"
            columns: ["cs_manager"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_assigned_bd_id_fkey"
            columns: ["assigned_bd_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          role: 'admin' | 'manager' | 'bd' | 'cs'
          permissions: Json
          is_active: boolean
          created_at: string
          updated_at: string
          version: number
        }
        Insert: {
          id: string
          email: string
          name: string
          role: 'admin' | 'manager' | 'bd' | 'cs'
          permissions?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
          version?: number
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'admin' | 'manager' | 'bd' | 'cs'
          permissions?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      survey_responses: {
        Row: {
          id: string
          patient_id: string
          token_id: string
          response_data: Json
          completed_at: string | null
          created_at: string
          updated_at: string
          survey_token?: string
          version: number
        }
        Insert: {
          id?: string
          patient_id: string
          token_id: string
          response_data: Json
          completed_at?: string | null
          created_at?: string
          updated_at?: string
          survey_token?: string
          version?: number
        }
        Update: {
          id?: string
          patient_id?: string
          token_id?: string
          response_data?: Json
          completed_at?: string | null
          created_at?: string
          updated_at?: string
          survey_token?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "survey_tokens"
            referencedColumns: ["id"]
          }
        ]
      }
      survey_tokens: {
        Row: {
          id: string
          token: string
          expires_at: string
          used_at: string | null
          created_by: string
          created_at: string
          updated_at: string
          patient_name?: string
          patient_phone?: string
          patient_email?: string
          survey_data?: Json
        }
        Insert: {
          id?: string
          token: string
          expires_at: string
          used_at?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
          patient_name?: string
          patient_phone?: string
          patient_email?: string
          survey_data?: Json
        }
        Update: {
          id?: string
          token?: string
          expires_at?: string
          used_at?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
          patient_name?: string
          patient_phone?: string
          patient_email?: string
          survey_data?: Json
        }
        Relationships: [
          {
            foreignKeyName: "survey_tokens_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      appointments: {
        Row: {
          id: string
          patient_id: string
          scheduled_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          consultation_type: string
          cs_notes: string | null
          internal_notes: string | null
          duration_minutes: number | null
          assigned_to: string | null
          created_by: string
          reminder_sent: boolean
          created_at: string
          updated_at: string
          version: number
        }
        Insert: {
          id?: string
          patient_id: string
          scheduled_at: string
          status?: Database["public"]["Enums"]["appointment_status"]
          consultation_type?: string
          cs_notes?: string | null
          internal_notes?: string | null
          duration_minutes?: number | null
          assigned_to?: string | null
          created_by: string
          reminder_sent?: boolean
          created_at?: string
          updated_at?: string
          version?: number
        }
        Update: {
          id?: string
          patient_id?: string
          scheduled_at?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          consultation_type?: string
          cs_notes?: string | null
          internal_notes?: string | null
          duration_minutes?: number | null
          assigned_to?: string | null
          created_by?: string
          reminder_sent?: boolean
          created_at?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      appointment_status_history: {
        Row: {
          id: string
          appointment_id: string
          from_status: Database["public"]["Enums"]["appointment_status"] | null
          to_status: Database["public"]["Enums"]["appointment_status"]
          changed_by: string
          changed_at: string
          notes: string | null
        }
        Insert: {
          id?: string
          appointment_id: string
          from_status?: Database["public"]["Enums"]["appointment_status"] | null
          to_status: Database["public"]["Enums"]["appointment_status"]
          changed_by: string
          changed_at?: string
          notes?: string | null
        }
        Update: {
          id?: string
          appointment_id?: string
          from_status?: Database["public"]["Enums"]["appointment_status"] | null
          to_status?: Database["public"]["Enums"]["appointment_status"]
          changed_by?: string
          changed_at?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_status_history_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      medical_records: {
        Row: {
          id: string
          patient_id: string
          record_type: 'diagnosis' | 'treatment' | 'surgery' | 'medication' | 'allergy' | 'note'
          record_date: string
          title: string
          description: string | null
          metadata: Json
          attachments: Json
          created_by: string | null
          created_at: string
          updated_at: string
          version: number
        }
        Insert: {
          id?: string
          patient_id: string
          record_type: 'diagnosis' | 'treatment' | 'surgery' | 'medication' | 'allergy' | 'note'
          record_date: string
          title: string
          description?: string | null
          metadata?: Json
          attachments?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
          version?: number
        }
        Update: {
          id?: string
          patient_id?: string
          record_type?: 'diagnosis' | 'treatment' | 'surgery' | 'medication' | 'allergy' | 'note'
          record_date?: string
          title?: string
          description?: string | null
          metadata?: Json
          attachments?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "medical_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string
          user_email: string | null
          user_role: string | null
          action: 'INSERT' | 'UPDATE' | 'DELETE'
          table_name: string
          record_id: string
          old_values: Json | null
          new_values: Json | null
          changed_fields: string[] | null
          version_before: number | null
          version_after: number | null
          ip_address: string | null
          user_agent: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          user_email?: string | null
          user_role?: string | null
          action: 'INSERT' | 'UPDATE' | 'DELETE'
          table_name: string
          record_id: string
          old_values?: Json | null
          new_values?: Json | null
          changed_fields?: string[] | null
          version_before?: number | null
          version_after?: number | null
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          user_email?: string | null
          user_role?: string | null
          action?: 'INSERT' | 'UPDATE' | 'DELETE'
          table_name?: string
          record_id?: string
          old_values?: Json | null
          new_values?: Json | null
          changed_fields?: string[] | null
          version_before?: number | null
          version_after?: number | null
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "auth.users"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          metadata: Json
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          metadata?: Json
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          metadata?: Json
          read_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      audit_activity_summary: {
        Row: {
          id: string
          user_email: string | null
          user_role: string | null
          action: 'INSERT' | 'UPDATE' | 'DELETE'
          table_name: string
          record_id: string
          changed_fields: string[] | null
          version_before: number | null
          version_after: number | null
          created_at: string
          record_name: string | null
        }
      }
      audit_statistics: {
        Row: {
          audit_date: string
          table_name: string
          action: 'INSERT' | 'UPDATE' | 'DELETE'
          user_role: string | null
          operation_count: number
          unique_users: number
          unique_records: number
        }
      }
    }
    Functions: {
      use_survey_token: {
        Args: { p_token: string }
        Returns: { token_id: string; patient_data: Json }
      }
      cleanup_expired_tokens: {
        Args: Record<PropertyKey, never>
        Returns: void
      }
      has_role: {
        Args: { user_id: string; role: string }
        Returns: boolean
      }
      get_audit_history: {
        Args: { p_table_name: string; p_record_id: string; p_limit?: number }
        Returns: Array<{
          id: string
          user_email: string | null
          user_role: string | null
          action: 'INSERT' | 'UPDATE' | 'DELETE'
          changed_fields: string[] | null
          old_values: Json | null
          new_values: Json | null
          version_before: number | null
          version_after: number | null
          created_at: string
        }>
      }
      restore_record_version: {
        Args: { p_table_name: string; p_record_id: string; p_target_version: number }
        Returns: Json
      }
    }
    Enums: {
      appointment_status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
      user_role: 'admin' | 'manager' | 'bd' | 'cs'
    }
  }
}