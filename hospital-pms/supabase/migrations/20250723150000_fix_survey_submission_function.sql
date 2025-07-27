-- Fix the submit_survey_with_patient function to accept token as TEXT (the actual token value)
-- instead of UUID. The TypeScript code passes the token value, not the ID.

-- First, add patient_number column if it doesn't exist
ALTER TABLE patients ADD COLUMN IF NOT EXISTS patient_number VARCHAR(20) UNIQUE;

-- Create sequence for patient numbers if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS patient_number_seq START WITH 1000;

-- Create function to generate patient numbers
CREATE OR REPLACE FUNCTION generate_patient_number()
RETURNS VARCHAR(20) AS $$
DECLARE
  v_year TEXT;
  v_seq TEXT;
BEGIN
  -- Get current year (2 digits)
  v_year := TO_CHAR(CURRENT_DATE, 'YY');
  
  -- Get next sequence value padded to 6 digits
  v_seq := LPAD(nextval('patient_number_seq')::TEXT, 6, '0');
  
  -- Return format: P{YY}{NNNNNN} e.g., P24001234
  RETURN 'P' || v_year || v_seq;
END;
$$ LANGUAGE plpgsql;

-- Now create the fixed submit_survey_with_patient function
CREATE OR REPLACE FUNCTION submit_survey_with_patient(
  p_token TEXT,  -- Changed back from UUID to TEXT
  p_patient_data JSONB,
  p_ssn TEXT,
  p_survey_responses JSONB,
  p_medical_data JSONB DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_token_data RECORD;
  v_patient_id UUID;
  v_response_id UUID;
  v_is_new_patient BOOLEAN := false;
  v_ssn_hash TEXT;
  v_encrypted_ssn BYTEA;
  v_encryption_key TEXT;
  v_patient_number VARCHAR(20);
  v_token_uuid UUID;
BEGIN
  -- Convert token string to UUID
  BEGIN
    v_token_uuid := p_token::UUID;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE EXCEPTION 'Invalid token format' USING ERRCODE = 'invalid_parameter_value';
  END;

  -- Check token validity
  SELECT * INTO v_token_data
  FROM survey_tokens
  WHERE token = v_token_uuid
    AND expires_at > NOW()
    AND used_at IS NULL
  FOR UPDATE;
  
  IF NOT FOUND THEN
    -- Check if token exists but is expired or used
    IF EXISTS (SELECT 1 FROM survey_tokens WHERE token = v_token_uuid AND expires_at <= NOW()) THEN
      RAISE EXCEPTION 'Token expired' USING ERRCODE = 'invalid_parameter_value';
    ELSIF EXISTS (SELECT 1 FROM survey_tokens WHERE token = v_token_uuid AND used_at IS NOT NULL) THEN
      RAISE EXCEPTION 'Token already used' USING ERRCODE = 'invalid_parameter_value';
    ELSE
      RAISE EXCEPTION 'Invalid token' USING ERRCODE = 'invalid_parameter_value';
    END IF;
  END IF;
  
  -- Get encryption key
  SELECT key_value INTO v_encryption_key
  FROM encryption_keys
  WHERE key_name = 'patient_ssn_key';
  
  IF v_encryption_key IS NULL THEN
    RAISE EXCEPTION 'Encryption key not found';
  END IF;
  
  -- Generate SSN hash for lookup
  v_ssn_hash := encode(digest(p_ssn, 'sha256'), 'hex');
  
  -- Check if patient exists
  SELECT id INTO v_patient_id
  FROM patients
  WHERE ssn_hash = v_ssn_hash;
  
  IF v_patient_id IS NULL THEN
    -- Create new patient
    v_is_new_patient := true;
    
    -- Encrypt SSN
    v_encrypted_ssn := pgp_sym_encrypt(p_ssn, v_encryption_key);
    
    -- Generate patient number
    v_patient_number := generate_patient_number();
    
    -- Insert patient with disease flags
    INSERT INTO patients (
      patient_number,
      name,
      encrypted_ssn,
      ssn_hash,
      phone,
      email,
      date_of_birth,
      gender,
      address,
      emergency_contact,
      created_by,
      flag_hypertension,
      flag_diabetes,
      flag_hyperlipidemia,
      flag_anticoagulant,
      flag_asthma,
      flag_allergy,
      flag_cardiovascular,
      flag_pregnancy
    ) VALUES (
      v_patient_number,
      p_patient_data->>'name',
      v_encrypted_ssn,
      v_ssn_hash,
      p_patient_data->>'phone',
      p_patient_data->>'email',
      (p_patient_data->>'date_of_birth')::DATE,
      p_patient_data->>'gender',
      p_patient_data->'address',
      p_patient_data->'emergency_contact',
      v_token_data.created_by,
      COALESCE((p_patient_data->>'flag_hypertension')::BOOLEAN, false),
      COALESCE((p_patient_data->>'flag_diabetes')::BOOLEAN, false),
      COALESCE((p_patient_data->>'flag_hyperlipidemia')::BOOLEAN, false),
      COALESCE((p_patient_data->>'flag_anticoagulant')::BOOLEAN, false),
      COALESCE((p_patient_data->>'flag_asthma')::BOOLEAN, false),
      COALESCE((p_patient_data->>'flag_allergy')::BOOLEAN, false),
      COALESCE((p_patient_data->>'flag_cardiovascular')::BOOLEAN, false),
      COALESCE((p_patient_data->>'flag_pregnancy')::BOOLEAN, false)
    )
    RETURNING id INTO v_patient_id;
  ELSE
    -- Update existing patient with disease flags
    UPDATE patients
    SET
      phone = COALESCE(p_patient_data->>'phone', phone),
      email = COALESCE(p_patient_data->>'email', email),
      address = COALESCE(p_patient_data->'address', address),
      emergency_contact = COALESCE(p_patient_data->'emergency_contact', emergency_contact),
      flag_hypertension = COALESCE((p_patient_data->>'flag_hypertension')::BOOLEAN, flag_hypertension),
      flag_diabetes = COALESCE((p_patient_data->>'flag_diabetes')::BOOLEAN, flag_diabetes),
      flag_hyperlipidemia = COALESCE((p_patient_data->>'flag_hyperlipidemia')::BOOLEAN, flag_hyperlipidemia),
      flag_anticoagulant = COALESCE((p_patient_data->>'flag_anticoagulant')::BOOLEAN, flag_anticoagulant),
      flag_asthma = COALESCE((p_patient_data->>'flag_asthma')::BOOLEAN, flag_asthma),
      flag_allergy = COALESCE((p_patient_data->>'flag_allergy')::BOOLEAN, flag_allergy),
      flag_cardiovascular = COALESCE((p_patient_data->>'flag_cardiovascular')::BOOLEAN, flag_cardiovascular),
      flag_pregnancy = COALESCE((p_patient_data->>'flag_pregnancy')::BOOLEAN, flag_pregnancy),
      updated_at = NOW()
    WHERE id = v_patient_id;
  END IF;
  
  -- Create survey response
  INSERT INTO survey_responses (
    survey_token,
    patient_id,
    survey_type,
    started_at,
    completed_at,
    responses,
    metadata
  ) VALUES (
    v_token_uuid,
    v_patient_id,
    'initial_patient_survey',
    COALESCE(v_token_data.created_at, NOW()),
    NOW(),
    p_survey_responses,
    jsonb_build_object(
      'ip_address', current_setting('request.headers', true)::jsonb->>'x-forwarded-for',
      'user_agent', current_setting('request.headers', true)::jsonb->>'user-agent',
      'submitted_at', NOW()
    )
  )
  RETURNING id INTO v_response_id;
  
  -- Insert medical records if provided
  IF p_medical_data IS NOT NULL THEN
    -- Insert allergy record
    IF p_medical_data->>'allergies' IS NOT NULL AND p_medical_data->>'allergies' != '' THEN
      INSERT INTO medical_records (
        patient_id,
        record_type,
        record_date,
        title,
        description,
        metadata,
        created_by
      ) VALUES (
        v_patient_id,
        'allergy',
        CURRENT_DATE,
        'Survey-reported allergies',
        p_medical_data->>'allergies',
        jsonb_build_object('source', 'patient_survey'),
        v_token_data.created_by
      );
    END IF;
    
    -- Insert medication record
    IF p_medical_data->>'medications' IS NOT NULL AND p_medical_data->>'medications' != '' THEN
      INSERT INTO medical_records (
        patient_id,
        record_type,
        record_date,
        title,
        description,
        metadata,
        created_by
      ) VALUES (
        v_patient_id,
        'medication',
        CURRENT_DATE,
        'Survey-reported medications',
        p_medical_data->>'medications',
        jsonb_build_object('source', 'patient_survey'),
        v_token_data.created_by
      );
    END IF;
    
    -- Insert medical history as note
    IF p_medical_data->>'medical_history' IS NOT NULL AND p_medical_data->>'medical_history' != '' THEN
      INSERT INTO medical_records (
        patient_id,
        record_type,
        record_date,
        title,
        description,
        metadata,
        created_by
      ) VALUES (
        v_patient_id,
        'note',  -- Changed from 'general' to 'note' as per the CHECK constraint
        CURRENT_DATE,
        'Survey-reported medical history',
        p_medical_data->>'medical_history',
        jsonb_build_object('source', 'patient_survey'),
        v_token_data.created_by
      );
    END IF;
  END IF;
  
  -- Mark token as used and update survey_data
  UPDATE survey_tokens
  SET
    used_at = NOW(),
    patient_id = v_patient_id,
    survey_data = p_survey_responses
  WHERE token = v_token_uuid;
  
  -- TODO: Create notification for BD (notifications table not yet implemented)
  -- This will be implemented in Task 5.6 as mentioned in the TypeScript code

  -- Log the survey submission in audit_logs
  INSERT INTO audit_logs (
    table_name,
    record_id,
    action,
    changed_by,
    changes
  )
  VALUES (
    'survey_responses',
    v_response_id,
    'INSERT',
    v_token_data.created_by,
    jsonb_build_object(
      'token', p_token,
      'patient_id', v_patient_id,
      'is_new_patient', v_is_new_patient
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'patient_id', v_patient_id,
    'response_id', v_response_id,
    'is_new_patient', v_is_new_patient
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also ensure hash_ssn function exists (it's used in the function above)
CREATE OR REPLACE FUNCTION hash_ssn(p_ssn TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(digest(p_ssn, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION submit_survey_with_patient TO anon;
GRANT EXECUTE ON FUNCTION submit_survey_with_patient TO authenticated;
GRANT EXECUTE ON FUNCTION hash_ssn TO anon;
GRANT EXECUTE ON FUNCTION hash_ssn TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION submit_survey_with_patient IS 'Handles survey submission with patient creation/update in a transaction. Accepts token as TEXT (UUID string), patient data, SSN, survey responses, and optional medical data.';
COMMENT ON FUNCTION hash_ssn IS 'Generates SHA256 hash of SSN for secure comparison without storing actual SSN.';