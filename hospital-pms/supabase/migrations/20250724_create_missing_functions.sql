-- Create all missing functions for survey submission

-- 1. Create hash_ssn function if it doesn't exist
CREATE OR REPLACE FUNCTION hash_ssn(p_ssn TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Use SHA-256 hash for SSN
  RETURN encode(digest(p_ssn, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

-- 2. Create generate_patient_number function if it doesn't exist
CREATE OR REPLACE FUNCTION generate_patient_number()
RETURNS VARCHAR(20) AS $$
DECLARE
  v_year TEXT;
  v_seq TEXT;
BEGIN
  -- Get current year (2 digits)
  v_year := TO_CHAR(CURRENT_DATE, 'YY');
  
  -- Get next sequence value padded to 6 digits
  SELECT LPAD((COUNT(*) + 1)::TEXT, 6, '0') INTO v_seq
  FROM patients
  WHERE patient_number LIKE 'P' || v_year || '%';
  
  -- Return format: P{YY}{NNNNNN} e.g., P24001234
  RETURN 'P' || v_year || v_seq;
END;
$$ LANGUAGE plpgsql;

-- 3. Ensure survey_responses table exists
CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID REFERENCES survey_tokens(token),
  patient_id UUID REFERENCES patients(id),
  responses JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Add missing columns to patients table if they don't exist
ALTER TABLE patients ADD COLUMN IF NOT EXISTS ssn_hash TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS encrypted_ssn BYTEA;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS address_detail TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive'));
ALTER TABLE patients ADD COLUMN IF NOT EXISTS assigned_bd_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS patient_number VARCHAR(20) UNIQUE;

-- 5. Add disease flag columns if they don't exist
ALTER TABLE patients ADD COLUMN IF NOT EXISTS flag_hypertension BOOLEAN DEFAULT false;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS flag_diabetes BOOLEAN DEFAULT false;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS flag_hyperlipidemia BOOLEAN DEFAULT false;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS flag_anticoagulant BOOLEAN DEFAULT false;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS flag_asthma BOOLEAN DEFAULT false;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS flag_allergy BOOLEAN DEFAULT false;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS flag_cardiovascular BOOLEAN DEFAULT false;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS flag_pregnancy BOOLEAN DEFAULT false;

-- 6. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patients_ssn_hash ON patients(ssn_hash);
CREATE INDEX IF NOT EXISTS idx_survey_responses_token_id ON survey_responses(token_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_patient_id ON survey_responses(patient_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON patients TO anon;
GRANT ALL ON survey_responses TO anon;
GRANT ALL ON survey_tokens TO anon;
GRANT ALL ON medical_records TO anon;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION hash_ssn(text) TO anon;
GRANT EXECUTE ON FUNCTION generate_patient_number() TO anon;
GRANT EXECUTE ON FUNCTION submit_survey_with_patient(text, jsonb, text, jsonb, jsonb) TO anon;