-- Fix survey submission schema issues

-- First, add missing columns to patients table if they don't exist
ALTER TABLE patients ADD COLUMN IF NOT EXISTS address_detail TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive'));
ALTER TABLE patients ADD COLUMN IF NOT EXISTS assigned_bd_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Create index for assigned_bd_id
CREATE INDEX IF NOT EXISTS idx_patients_assigned_bd_id ON patients(assigned_bd_id);

-- Drop the incorrect function first
DROP FUNCTION IF EXISTS submit_survey_with_patient(text, jsonb, text, jsonb, jsonb);

-- Create the corrected submit_survey_with_patient function
CREATE OR REPLACE FUNCTION submit_survey_with_patient(
  p_token TEXT,
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
  v_address TEXT;
  v_address_detail TEXT;
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
      RAISE EXCEPTION 'Token has expired' USING ERRCODE = 'invalid_parameter_value';
    ELSIF EXISTS (SELECT 1 FROM survey_tokens WHERE token = v_token_uuid AND used_at IS NOT NULL) THEN
      RAISE EXCEPTION 'Token has already been used' USING ERRCODE = 'invalid_parameter_value';
    ELSE
      RAISE EXCEPTION 'Invalid token' USING ERRCODE = 'invalid_parameter_value';
    END IF;
  END IF;

  -- Hash the SSN for duplicate checking
  v_ssn_hash := hash_ssn(p_ssn);
  
  -- Check for existing patient with same SSN hash
  SELECT id INTO v_patient_id
  FROM patients
  WHERE ssn_hash = v_ssn_hash;
  
  -- Extract address data
  IF jsonb_typeof(p_patient_data->'address') = 'object' THEN
    -- Address is sent as object from frontend
    v_address := p_patient_data->'address'->>'street';
    v_address_detail := p_patient_data->'address'->>'detail';
  ELSE
    -- Address is sent as string
    v_address := p_patient_data->>'address';
    v_address_detail := p_patient_data->>'addressDetail';
  END IF;
  
  -- Handle patient creation or update
  IF v_patient_id IS NULL THEN
    -- Generate patient number
    v_patient_number := generate_patient_number();
    
    -- Create new patient
    INSERT INTO patients (
      id,
      patient_number,
      name,
      date_of_birth,  -- Fixed: use correct column name
      gender,
      phone,
      email,
      address,  -- Store as JSONB
      address_detail,  -- Store separately for convenience
      ssn_hash,
      encrypted_ssn,
      status,
      assigned_bd_id,
      created_by,
      -- Disease flags from survey
      flag_hypertension,
      flag_diabetes,
      flag_hyperlipidemia,
      flag_anticoagulant,
      flag_asthma,
      flag_allergy,
      flag_cardiovascular,
      flag_pregnancy
    ) VALUES (
      gen_random_uuid(),
      v_patient_number,
      p_patient_data->>'name',
      (p_patient_data->>'date_of_birth')::DATE,  -- Fixed: use correct field name
      p_patient_data->>'gender',
      p_patient_data->>'phone',
      p_patient_data->>'email',
      CASE 
        WHEN jsonb_typeof(p_patient_data->'address') = 'object' THEN p_patient_data->'address'
        ELSE jsonb_build_object(
          'street', v_address,
          'detail', v_address_detail,
          'postal_code', p_patient_data->>'postalCode'
        )
      END,
      v_address_detail,
      v_ssn_hash,
      encode(p_ssn::bytea, 'base64')::bytea,  -- Simple encoding for now
      'pending',
      v_token_data.created_by,
      v_token_data.created_by,
      -- Disease flags from patient data
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
    
    v_is_new_patient := true;
  ELSE
    -- Update existing patient
    UPDATE patients
    SET 
      name = p_patient_data->>'name',
      phone = p_patient_data->>'phone',
      email = COALESCE(p_patient_data->>'email', email),
      address = CASE 
        WHEN jsonb_typeof(p_patient_data->'address') = 'object' THEN p_patient_data->'address'
        ELSE COALESCE(
          jsonb_build_object(
            'street', v_address,
            'detail', v_address_detail,
            'postal_code', p_patient_data->>'postalCode'
          ),
          address
        )
      END,
      address_detail = COALESCE(v_address_detail, address_detail),
      updated_at = NOW(),
      -- Update disease flags
      flag_hypertension = COALESCE((p_patient_data->>'flag_hypertension')::BOOLEAN, flag_hypertension),
      flag_diabetes = COALESCE((p_patient_data->>'flag_diabetes')::BOOLEAN, flag_diabetes),
      flag_hyperlipidemia = COALESCE((p_patient_data->>'flag_hyperlipidemia')::BOOLEAN, flag_hyperlipidemia),
      flag_anticoagulant = COALESCE((p_patient_data->>'flag_anticoagulant')::BOOLEAN, flag_anticoagulant),
      flag_asthma = COALESCE((p_patient_data->>'flag_asthma')::BOOLEAN, flag_asthma),
      flag_allergy = COALESCE((p_patient_data->>'flag_allergy')::BOOLEAN, flag_allergy),
      flag_cardiovascular = COALESCE((p_patient_data->>'flag_cardiovascular')::BOOLEAN, flag_cardiovascular),
      flag_pregnancy = COALESCE((p_patient_data->>'flag_pregnancy')::BOOLEAN, flag_pregnancy)
    WHERE id = v_patient_id;
  END IF;

  -- Create survey response
  INSERT INTO survey_responses (
    id,
    token_id,
    patient_id,
    responses,
    created_at
  ) VALUES (
    gen_random_uuid(),
    v_token_uuid,
    v_patient_id,
    p_survey_responses,
    NOW()
  )
  RETURNING id INTO v_response_id;

  -- Store medical information if provided
  IF p_medical_data IS NOT NULL AND jsonb_typeof(p_medical_data) = 'object' THEN
    -- Store additional medical history
    IF (p_medical_data->>'medical_history' IS NOT NULL AND LENGTH(p_medical_data->>'medical_history') > 0) OR 
       (p_medical_data->>'medicalHistory' IS NOT NULL AND LENGTH(p_medical_data->>'medicalHistory') > 0) THEN
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
        'note',
        CURRENT_DATE,
        '설문조사 추가 의료정보',
        COALESCE(p_medical_data->>'medical_history', p_medical_data->>'medicalHistory'),
        jsonb_build_object('source', 'survey', 'survey_date', NOW()),
        v_token_data.created_by
      );
    END IF;

    -- Store current medications
    IF (p_medical_data->>'medications' IS NOT NULL AND LENGTH(p_medical_data->>'medications') > 0) OR
       (p_medical_data->>'currentMedications' IS NOT NULL AND LENGTH(p_medical_data->>'currentMedications') > 0) THEN
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
        '설문조사 복용 약물',
        COALESCE(p_medical_data->>'medications', p_medical_data->>'currentMedications'),
        jsonb_build_object('source', 'survey', 'survey_date', NOW()),
        v_token_data.created_by
      );
    END IF;

    -- Store allergy information
    IF p_medical_data->>'allergies' IS NOT NULL AND LENGTH(p_medical_data->>'allergies') > 0 THEN
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
        '설문조사 알레르기 정보',
        p_medical_data->>'allergies',
        jsonb_build_object('source', 'survey', 'survey_date', NOW()),
        v_token_data.created_by
      );
    END IF;

    -- Store examination preferences
    IF p_survey_responses->'examinations' IS NOT NULL THEN
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
        'note',
        CURRENT_DATE,
        '설문조사 희망 검사',
        CASE 
          WHEN p_survey_responses->'examinations'->>'otherExaminations' IS NOT NULL 
          THEN p_survey_responses->'examinations'->>'otherExaminations'
          ELSE '선택된 검사 항목 참조'
        END,
        jsonb_build_object(
          'source', 'survey', 
          'survey_date', NOW(),
          'selected_examinations', p_survey_responses->'examinations'
        ),
        v_token_data.created_by
      );
    END IF;
  END IF;

  -- Mark token as used
  UPDATE survey_tokens
  SET 
    used_at = NOW(),
    patient_id = v_patient_id,
    survey_data = p_survey_responses,
    updated_at = NOW()
  WHERE token = v_token_uuid;

  -- Return success response
  RETURN jsonb_build_object(
    'success', true,
    'patientId', v_patient_id,
    'responseId', v_response_id,
    'isNewPatient', v_is_new_patient,
    'message', CASE 
      WHEN v_is_new_patient THEN '설문이 완료되었습니다. 담당자가 곧 연락드리겠습니다.'
      ELSE '설문이 완료되었습니다. 기존 정보가 업데이트되었습니다.'
    END
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Log error and re-raise
    RAISE;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION submit_survey_with_patient TO anon, authenticated;

-- Add comments for new columns
COMMENT ON COLUMN patients.address_detail IS 'Detailed address information (apartment, unit, etc)';
COMMENT ON COLUMN patients.status IS 'Patient status in the system';
COMMENT ON COLUMN patients.assigned_bd_id IS 'BD user assigned to this patient';