-- Create a function to handle survey submission with transaction
CREATE OR REPLACE FUNCTION submit_survey_with_patient(
  p_token TEXT,
  p_patient_data JSONB,
  p_ssn TEXT,
  p_survey_responses JSONB,
  p_medical_data JSONB DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_token_data survey_tokens%ROWTYPE;
  v_existing_patient_id UUID;
  v_patient_id UUID;
  v_response_id UUID;
  v_ssn_hash TEXT;
  v_result JSONB;
BEGIN
  -- Start transaction
  -- Validate token and lock the row to prevent concurrent use
  SELECT * INTO v_token_data
  FROM survey_tokens
  WHERE token = p_token
  FOR UPDATE;
  
  -- Check if token exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid token' USING ERRCODE = 'invalid_parameter_value';
  END IF;
  
  -- Check if token is expired
  IF v_token_data.expires_at < NOW() THEN
    RAISE EXCEPTION 'Token expired' USING ERRCODE = 'invalid_parameter_value';
  END IF;
  
  -- Check if token is already used
  IF v_token_data.used_at IS NOT NULL THEN
    RAISE EXCEPTION 'Token already used' USING ERRCODE = 'invalid_parameter_value';
  END IF;
  
  -- Calculate SSN hash for duplicate check
  v_ssn_hash := hash_ssn(p_ssn);
  
  -- Check for existing patient with same SSN
  SELECT id INTO v_existing_patient_id
  FROM patients
  WHERE ssn_hash = v_ssn_hash
  LIMIT 1;
  
  IF v_existing_patient_id IS NOT NULL THEN
    -- Patient already exists
    v_patient_id := v_existing_patient_id;
    
    -- Update patient information if needed
    UPDATE patients
    SET 
      phone = COALESCE(p_patient_data->>'phone', phone),
      email = COALESCE(p_patient_data->>'email', email),
      address = COALESCE(p_patient_data->'address', address),
      updated_at = NOW()
    WHERE id = v_patient_id;
  ELSE
    -- Create new patient
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
      p_patient_data->>'name',
      p_patient_data->>'phone',
      p_patient_data->>'email',
      (p_patient_data->>'date_of_birth')::DATE,
      p_patient_data->>'gender',
      COALESCE(p_patient_data->'address', '{}')::JSONB,
      COALESCE(p_patient_data->'emergency_contact', '{}')::JSONB,
      v_token_data.created_by,
      NULL, -- CS manager will be assigned later
      encrypt_ssn(p_ssn),
      v_ssn_hash
    )
    RETURNING id INTO v_patient_id;
  END IF;
  
  -- Create medical record if medical data provided
  IF p_medical_data IS NOT NULL AND p_medical_data != '{}'::JSONB THEN
    INSERT INTO medical_records (
      patient_id,
      record_type,
      record_date,
      details,
      created_by
    )
    VALUES (
      v_patient_id,
      'initial_survey',
      NOW(),
      p_medical_data,
      v_token_data.created_by
    );
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
  )
  VALUES (
    p_token,
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
  
  -- Mark token as used
  UPDATE survey_tokens
  SET 
    used_at = NOW(),
    patient_id = v_patient_id,
    survey_data = p_survey_responses
  WHERE token = p_token;
  
  -- Log the survey submission
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
      'is_new_patient', v_existing_patient_id IS NULL
    )
  );
  
  -- Prepare result
  v_result := jsonb_build_object(
    'success', true,
    'patient_id', v_patient_id,
    'response_id', v_response_id,
    'is_new_patient', v_existing_patient_id IS NULL
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Rollback will happen automatically
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if patient exists by SSN
CREATE OR REPLACE FUNCTION check_patient_exists_by_ssn(p_ssn TEXT)
RETURNS JSONB AS $$
DECLARE
  v_patient_id UUID;
  v_patient_name TEXT;
BEGIN
  SELECT id, name INTO v_patient_id, v_patient_name
  FROM patients
  WHERE ssn_hash = hash_ssn(p_ssn)
  LIMIT 1;
  
  IF v_patient_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'exists', true,
      'patient_id', v_patient_id,
      'patient_name', v_patient_name
    );
  ELSE
    RETURN jsonb_build_object(
      'exists', false
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit log table if not exists
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID,
  action TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  changes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_by ON audit_logs(changed_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Grant permissions
GRANT EXECUTE ON FUNCTION submit_survey_with_patient TO authenticated;
GRANT EXECUTE ON FUNCTION check_patient_exists_by_ssn TO authenticated;

-- RLS for audit logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all audit logs" ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can view their own audit logs" ON audit_logs
  FOR SELECT
  TO authenticated
  USING (changed_by = auth.uid());