-- Add disease flag columns to patients table
ALTER TABLE patients
ADD COLUMN flag_hypertension BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN flag_diabetes BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN flag_hyperlipidemia BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN flag_anticoagulant BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN flag_asthma BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN flag_allergy BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN flag_cardiovascular BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN flag_pregnancy BOOLEAN DEFAULT false NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN patients.flag_hypertension IS '고혈압 (Hypertension)';
COMMENT ON COLUMN patients.flag_diabetes IS '당뇨 (Diabetes)';
COMMENT ON COLUMN patients.flag_hyperlipidemia IS '고지혈증 (Hyperlipidemia)';
COMMENT ON COLUMN patients.flag_anticoagulant IS '항응고제/항혈소판제 복용 (Anticoagulant/Antiplatelet medication)';
COMMENT ON COLUMN patients.flag_asthma IS '천식 (Asthma)';
COMMENT ON COLUMN patients.flag_allergy IS '특정 약물/음식 알러지 (Specific drug/food allergy)';
COMMENT ON COLUMN patients.flag_cardiovascular IS '뇌/심장 질환 (Brain/Heart disease)';
COMMENT ON COLUMN patients.flag_pregnancy IS '임신 가능성 (Pregnancy possibility)';

-- Update the submit_survey_with_patient function to handle disease flags
CREATE OR REPLACE FUNCTION submit_survey_with_patient(
  p_token UUID,
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
BEGIN
  -- Check token validity
  SELECT * INTO v_token_data
  FROM survey_tokens
  WHERE id = p_token
    AND expires_at > NOW()
    AND used_at IS NULL
  FOR UPDATE;
  
  IF NOT FOUND THEN
    -- Check if token exists but is expired or used
    IF EXISTS (SELECT 1 FROM survey_tokens WHERE id = p_token AND expires_at <= NOW()) THEN
      RAISE EXCEPTION 'Token expired' USING ERRCODE = 'invalid_parameter_value';
    ELSIF EXISTS (SELECT 1 FROM survey_tokens WHERE id = p_token AND used_at IS NOT NULL) THEN
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
    survey_token_id,
    patient_id,
    responses,
    completed_at
  ) VALUES (
    p_token,
    v_patient_id,
    p_survey_responses,
    NOW()
  )
  RETURNING id INTO v_response_id;
  
  -- Insert medical records if provided
  IF p_medical_data IS NOT NULL THEN
    -- Insert allergy record
    IF p_medical_data->>'allergies' IS NOT NULL THEN
      INSERT INTO medical_records (
        patient_id,
        record_type,
        record_date,
        title,
        description,
        created_by
      ) VALUES (
        v_patient_id,
        'allergy',
        CURRENT_DATE,
        'Survey-reported allergies',
        p_medical_data->>'allergies',
        v_token_data.created_by
      );
    END IF;
    
    -- Insert medication record
    IF p_medical_data->>'medications' IS NOT NULL THEN
      INSERT INTO medical_records (
        patient_id,
        record_type,
        record_date,
        title,
        description,
        created_by
      ) VALUES (
        v_patient_id,
        'medication',
        CURRENT_DATE,
        'Survey-reported medications',
        p_medical_data->>'medications',
        v_token_data.created_by
      );
    END IF;
    
    -- Insert medical history as note
    IF p_medical_data->>'medical_history' IS NOT NULL THEN
      INSERT INTO medical_records (
        patient_id,
        record_type,
        record_date,
        title,
        description,
        created_by
      ) VALUES (
        v_patient_id,
        'note',
        CURRENT_DATE,
        'Survey-reported medical history',
        p_medical_data->>'medical_history',
        v_token_data.created_by
      );
    END IF;
  END IF;
  
  -- Mark token as used
  UPDATE survey_tokens
  SET
    used_at = NOW(),
    patient_id = v_patient_id
  WHERE id = p_token;
  
  -- Create notification for BD
  INSERT INTO notifications (
    user_id,
    type,
    title,
    content,
    priority,
    action_url,
    metadata
  ) VALUES (
    v_token_data.created_by,
    'survey_completed',
    'Survey Completed: ' || (p_patient_data->>'name'),
    'Patient ' || (p_patient_data->>'name') || ' has completed the survey',
    'high',
    '/patients/' || v_patient_id,
    jsonb_build_object(
      'patient_id', v_patient_id,
      'patient_name', p_patient_data->>'name',
      'is_new_patient', v_is_new_patient,
      'survey_response_id', v_response_id
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