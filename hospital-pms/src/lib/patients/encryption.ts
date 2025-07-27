import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';

type Patient = Database['public']['Tables']['patients']['Row'];
type NewPatient = Database['public']['Tables']['patients']['Insert'];

export class PatientService {
  private supabase = createClient();

  /**
   * Create a new patient with encrypted SSN
   * The SSN encryption is handled by the database function
   */
  async createPatient(patientData: Omit<NewPatient, 'encrypted_ssn' | 'ssn_hash'> & { ssn: string }) {
    const { ssn, ...data } = patientData;
    
    // Call RPC function to create patient with encrypted SSN
    const { data: patient, error } = await this.supabase
      .rpc('create_patient_with_ssn', {
        patient_data: data,
        ssn: ssn
      });

    if (error) throw error;
    return patient;
  }

  /**
   * Search for a patient by SSN
   * Uses the hashed SSN for lookup without exposing the actual SSN
   */
  async findPatientBySSN(ssn: string): Promise<Patient | null> {
    const { data, error } = await this.supabase
      .rpc('find_patient_by_ssn', { ssn });

    if (error) throw error;
    return data;
  }

  /**
   * Get patient with masked SSN for display
   * Only authorized users can decrypt the full SSN
   */
  async getPatientWithMaskedSSN(patientId: string) {
    const { data: patient, error } = await this.supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single();

    if (error) throw error;

    // Get masked SSN
    const { data: maskedSSN } = await this.supabase
      .rpc('get_masked_ssn', { patient_id: patientId });

    return {
      ...patient,
      displaySSN: maskedSSN || '***-**-****'
    };
  }

  /**
   * Get decrypted SSN (only for authorized users)
   * This will throw an error if the user doesn't have permission
   */
  async getDecryptedSSN(patientId: string): Promise<string> {
    const { data, error } = await this.supabase
      .rpc('get_patient_ssn', { patient_id: patientId });

    if (error) {
      if (error.message.includes('Insufficient permissions')) {
        throw new Error('권한이 없습니다. 관리자 또는 매니저만 주민번호를 볼 수 있습니다.');
      }
      throw error;
    }

    return data;
  }

  /**
   * Update patient information
   * Cannot update SSN through this method for security
   */
  async updatePatient(patientId: string, updates: Partial<Omit<Patient, 'id' | 'encrypted_ssn' | 'ssn_hash' | 'created_at' | 'updated_at'>>) {
    const { data, error } = await this.supabase
      .from('patients')
      .update(updates)
      .eq('id', patientId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get patients for the current user
   * BD users see patients they created, CS users see patients they manage
   */
  async getMyPatients() {
    const { data, error } = await this.supabase
      .from('patients')
      .select(`
        *,
        created_by_profile:profiles!patients_created_by_fkey(name, role),
        cs_manager_profile:profiles!patients_cs_manager_fkey(name, role)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
}

// Database functions that need to be created
export const DATABASE_FUNCTIONS = `
-- Function to create patient with encrypted SSN
CREATE OR REPLACE FUNCTION create_patient_with_ssn(
  patient_data JSONB,
  ssn TEXT
)
RETURNS patients AS $$
DECLARE
  new_patient patients;
BEGIN
  INSERT INTO patients (
    name,
    phone,
    email,
    date_of_birth,
    gender,
    address,
    emergency_contact,
    created_by,
    cs_manager,
    encrypted_ssn,
    ssn_hash
  )
  VALUES (
    patient_data->>'name',
    patient_data->>'phone',
    patient_data->>'email',
    (patient_data->>'date_of_birth')::DATE,
    patient_data->>'gender',
    COALESCE(patient_data->'address', '{}')::JSONB,
    COALESCE(patient_data->'emergency_contact', '{}')::JSONB,
    (patient_data->>'created_by')::UUID,
    (patient_data->>'cs_manager')::UUID,
    encrypt_ssn(ssn),
    hash_ssn(ssn)
  )
  RETURNING * INTO new_patient;
  
  RETURN new_patient;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to find patient by SSN
CREATE OR REPLACE FUNCTION find_patient_by_ssn(ssn TEXT)
RETURNS patients AS $$
DECLARE
  patient patients;
BEGIN
  SELECT * INTO patient
  FROM patients
  WHERE ssn_hash = hash_ssn(ssn);
  
  RETURN patient;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get masked SSN
CREATE OR REPLACE FUNCTION get_masked_ssn(patient_id UUID)
RETURNS TEXT AS $$
DECLARE
  ssn TEXT;
BEGIN
  -- Only decrypt if user has permission
  SELECT decrypt_ssn(encrypted_ssn) INTO ssn
  FROM patients
  WHERE id = patient_id;
  
  IF ssn IS NULL THEN
    RETURN '***-**-****';
  END IF;
  
  RETURN mask_ssn(ssn);
EXCEPTION
  WHEN OTHERS THEN
    -- If decryption fails, return masked version
    RETURN '***-**-****';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get decrypted SSN (with permission check)
CREATE OR REPLACE FUNCTION get_patient_ssn(patient_id UUID)
RETURNS TEXT AS $$
DECLARE
  ssn TEXT;
  encrypted BYTEA;
BEGIN
  SELECT encrypted_ssn INTO encrypted
  FROM patients
  WHERE id = patient_id;
  
  IF encrypted IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- decrypt_ssn function will check permissions
  RETURN decrypt_ssn(encrypted);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;