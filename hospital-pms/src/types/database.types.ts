export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      appointment_status_history: {
        Row: {
          appointment_id: string
          changed_at: string
          changed_by: string
          from_status: Database["public"]["Enums"]["appointment_status"] | null
          id: string
          notes: string | null
          to_status: Database["public"]["Enums"]["appointment_status"]
        }
        Insert: {
          appointment_id: string
          changed_at?: string
          changed_by: string
          from_status?: Database["public"]["Enums"]["appointment_status"] | null
          id?: string
          notes?: string | null
          to_status: Database["public"]["Enums"]["appointment_status"]
        }
        Update: {
          appointment_id?: string
          changed_at?: string
          changed_by?: string
          from_status?: Database["public"]["Enums"]["appointment_status"] | null
          id?: string
          notes?: string | null
          to_status?: Database["public"]["Enums"]["appointment_status"]
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
      appointments: {
        Row: {
          assigned_to: string | null
          consultation_type: string
          created_at: string
          created_by: string
          cs_notes: string | null
          duration_minutes: number | null
          id: string
          internal_notes: string | null
          patient_id: string
          reminder_sent: boolean | null
          scheduled_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          consultation_type?: string
          created_at?: string
          created_by: string
          cs_notes?: string | null
          duration_minutes?: number | null
          id?: string
          internal_notes?: string | null
          patient_id: string
          reminder_sent?: boolean | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          consultation_type?: string
          created_at?: string
          created_by?: string
          cs_notes?: string | null
          duration_minutes?: number | null
          id?: string
          internal_notes?: string | null
          patient_id?: string
          reminder_sent?: boolean | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Relationships: [
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
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          }
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      encryption_keys: {
        Row: {
          created_at: string
          id: string
          key_name: string
          key_value: string
          rotated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          key_name: string
          key_value: string
          rotated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          key_name?: string
          key_value?: string
          rotated_at?: string
        }
        Relationships: []
      }
      medical_records: {
        Row: {
          attachments: Json | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          metadata: Json | null
          patient_id: string
          record_date: string
          record_type: string
          title: string
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          patient_id: string
          record_date: string
          record_type: string
          title: string
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          patient_id?: string
          record_date?: string
          record_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          }
        ]
      }
      patients: {
        Row: {
          address: Json | null
          created_at: string
          created_by: string | null
          cs_manager: string | null
          date_of_birth: string | null
          email: string | null
          emergency_contact: Json | null
          encrypted_ssn: string
          gender: string | null
          id: string
          name: string
          phone: string | null
          ssn_hash: string
          updated_at: string
        }
        Insert: {
          address?: Json | null
          created_at?: string
          created_by?: string | null
          cs_manager?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact?: Json | null
          encrypted_ssn: string
          gender?: string | null
          id?: string
          name: string
          phone?: string | null
          ssn_hash: string
          updated_at?: string
        }
        Update: {
          address?: Json | null
          created_at?: string
          created_by?: string | null
          cs_manager?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact?: Json | null
          encrypted_ssn?: string
          gender?: string | null
          id?: string
          name?: string
          phone?: string | null
          ssn_hash?: string
          updated_at?: string
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
          }
        ]
      }
      profiles: {
        Row: {
          created_at: string
          department: string | null
          id: string
          name: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          id: string
          name: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string | null
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      survey_responses: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          metadata: Json | null
          patient_id: string | null
          responses: Json
          started_at: string
          survey_token: string
          survey_type: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          patient_id?: string | null
          responses?: Json
          started_at?: string
          survey_token: string
          survey_type?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          patient_id?: string | null
          responses?: Json
          started_at?: string
          survey_token?: string
          survey_type?: string
          updated_at?: string
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
            foreignKeyName: "survey_responses_survey_token_fkey"
            columns: ["survey_token"]
            isOneToOne: false
            referencedRelation: "survey_tokens"
            referencedColumns: ["token"]
          }
        ]
      }
      survey_tokens: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string
          patient_email: string | null
          patient_id: string | null
          patient_name: string
          patient_phone: string | null
          survey_data: Json | null
          token: string
          updated_at: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string
          patient_email?: string | null
          patient_id?: string | null
          patient_name: string
          patient_phone?: string | null
          survey_data?: Json | null
          token?: string
          updated_at?: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string
          patient_email?: string | null
          patient_id?: string | null
          patient_name?: string
          patient_phone?: string | null
          survey_data?: Json | null
          token?: string
          updated_at?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_tokens_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_tokens_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_survey_response: {
        Args: {
          response_id: string
        }
        Returns: undefined
      }
      create_patient_with_ssn: {
        Args: {
          patient_data: Json
          ssn: string
        }
        Returns: {
          address: Json | null
          created_at: string
          created_by: string | null
          cs_manager: string | null
          date_of_birth: string | null
          email: string | null
          emergency_contact: Json | null
          encrypted_ssn: string
          gender: string | null
          id: string
          name: string
          phone: string | null
          ssn_hash: string
          updated_at: string
        }
      }
      current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      decrypt_ssn: {
        Args: {
          encrypted_data: string
        }
        Returns: string
      }
      encrypt_ssn: {
        Args: {
          ssn: string
          key_name?: string
        }
        Returns: string
      }
      find_patient_by_ssn: {
        Args: {
          ssn: string
        }
        Returns: {
          address: Json | null
          created_at: string
          created_by: string | null
          cs_manager: string | null
          date_of_birth: string | null
          email: string | null
          emergency_contact: Json | null
          encrypted_ssn: string
          gender: string | null
          id: string
          name: string
          phone: string | null
          ssn_hash: string
          updated_at: string
        }
      }
      get_masked_ssn: {
        Args: {
          patient_id: string
        }
        Returns: string
      }
      get_patient_ssn: {
        Args: {
          patient_id: string
        }
        Returns: string
      }
      handle_new_user: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      has_any_role: {
        Args: {
          required_roles: Database["public"]["Enums"]["user_role"][]
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          required_role: Database["public"]["Enums"]["user_role"]
        }
        Returns: boolean
      }
      hash_ssn: {
        Args: {
          ssn: string
        }
        Returns: string
      }
      mask_ssn: {
        Args: {
          ssn: string
        }
        Returns: string
      }
      record_appointment_status_change: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      search_patient_by_ssn: {
        Args: {
          ssn_search: string
        }
        Returns: {
          address: Json | null
          created_at: string
          created_by: string | null
          cs_manager: string | null
          date_of_birth: string | null
          email: string | null
          emergency_contact: Json | null
          encrypted_ssn: string
          gender: string | null
          id: string
          name: string
          phone: string | null
          ssn_hash: string
          updated_at: string
        }[]
      }
      test_user_access: {
        Args: {
          test_user_id: string
        }
        Returns: Json
      }
      update_updated_at_column: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      validate_rls_policies: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      validate_survey_token: {
        Args: {
          token_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      appointment_status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show"
      user_role: "admin" | "manager" | "bd" | "cs"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}