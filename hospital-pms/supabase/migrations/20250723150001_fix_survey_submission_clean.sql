-- Clean up existing functions and create fixed versions

-- Drop existing functions first
DROP FUNCTION IF EXISTS hash_ssn(text);
DROP FUNCTION IF EXISTS submit_survey_with_patient(uuid, jsonb, text, jsonb, jsonb);
DROP FUNCTION IF EXISTS submit_survey_with_patient(text, jsonb, text, jsonb, jsonb);
DROP FUNCTION IF EXISTS generate_patient_number();

-- First, add patient_number column if it doesn't exist
ALTER TABLE patients ADD COLUMN IF NOT EXISTS patient_number VARCHAR(20) UNIQUE;

-- Create sequence for patient numbers if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS patient_number_seq START WITH 1000;

-- Create function to generate patient numbers
CREATE FUNCTION generate_patient_number()
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

-- Create simplified hash_ssn function
CREATE FUNCTION hash_ssn(p_ssn TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Use SHA-256 hash for SSN
  RETURN encode(digest(p_ssn, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Now create the fixed submit_survey_with_patient function
CREATE FUNCTION submit_survey_with_patient(
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
  
  -- Handle patient creation or update
  IF v_patient_id IS NULL THEN
    -- Generate patient number
    v_patient_number := generate_patient_number();
    
    -- Create new patient
    INSERT INTO patients (
      id,
      patient_number,
      name,
      birth_date,
      gender,
      phone,
      address,
      address_detail,
      ssn_hash,
      encrypted_ssn,
      status,
      assigned_bd_id,
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
      (p_patient_data->>'birthDate')::DATE,
      p_patient_data->>'gender',
      p_patient_data->>'phone',
      p_patient_data->>'address',
      p_patient_data->>'addressDetail',
      v_ssn_hash,
      encode(p_ssn::bytea, 'base64')::bytea,  -- Simple encoding for now
      'pending',
      v_token_data.created_by,
      -- Disease flags from survey responses
      COALESCE((p_survey_responses->'diseases'->>'hypertension')::BOOLEAN, false),
      COALESCE((p_survey_responses->'diseases'->>'diabetes')::BOOLEAN, false),
      COALESCE((p_survey_responses->'diseases'->>'hyperlipidemia')::BOOLEAN, false),
      COALESCE((p_survey_responses->'diseases'->>'anticoagulant')::BOOLEAN, false),
      COALESCE((p_survey_responses->'diseases'->>'asthma')::BOOLEAN, false),
      COALESCE((p_survey_responses->'diseases'->>'allergy')::BOOLEAN, false),
      COALESCE((p_survey_responses->'diseases'->>'cardiovascular')::BOOLEAN, false),
      COALESCE((p_survey_responses->'diseases'->>'pregnancy')::BOOLEAN, false)
    )
    RETURNING id INTO v_patient_id;
    
    v_is_new_patient := true;
  ELSE
    -- Update existing patient
    UPDATE patients
    SET 
      name = p_patient_data->>'name',
      phone = p_patient_data->>'phone',
      address = COALESCE(p_patient_data->>'address', address),
      address_detail = COALESCE(p_patient_data->>'addressDetail', address_detail),
      updated_at = NOW(),
      -- Update disease flags
      flag_hypertension = COALESCE((p_survey_responses->'diseases'->>'hypertension')::BOOLEAN, flag_hypertension),
      flag_diabetes = COALESCE((p_survey_responses->'diseases'->>'diabetes')::BOOLEAN, flag_diabetes),
      flag_hyperlipidemia = COALESCE((p_survey_responses->'diseases'->>'hyperlipidemia')::BOOLEAN, flag_hyperlipidemia),
      flag_anticoagulant = COALESCE((p_survey_responses->'diseases'->>'anticoagulant')::BOOLEAN, flag_anticoagulant),
      flag_asthma = COALESCE((p_survey_responses->'diseases'->>'asthma')::BOOLEAN, flag_asthma),
      flag_allergy = COALESCE((p_survey_responses->'diseases'->>'allergy')::BOOLEAN, flag_allergy),
      flag_cardiovascular = COALESCE((p_survey_responses->'diseases'->>'cardiovascular')::BOOLEAN, flag_cardiovascular),
      flag_pregnancy = COALESCE((p_survey_responses->'diseases'->>'pregnancy')::BOOLEAN, flag_pregnancy)
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
    IF p_medical_data->>'medicalHistory' IS NOT NULL AND LENGTH(p_medical_data->>'medicalHistory') > 0 THEN
      INSERT INTO medical_records (
        patient_id,
        category,
        title,
        description,
        metadata,
        created_by
      ) VALUES (
        v_patient_id,
        'survey_additional',
        '설문조사 추가 의료정보',
        p_medical_data->>'medicalHistory',
        jsonb_build_object('source', 'survey', 'survey_date', NOW()),
        v_token_data.created_by
      );
    END IF;

    -- Store current medications
    IF p_medical_data->>'currentMedications' IS NOT NULL AND LENGTH(p_medical_data->>'currentMedications') > 0 THEN
      INSERT INTO medical_records (
        patient_id,
        category,
        title,
        description,
        metadata,
        created_by
      ) VALUES (
        v_patient_id,
        'survey_medications',
        '설문조사 복용 약물',
        p_medical_data->>'currentMedications',
        jsonb_build_object('source', 'survey', 'survey_date', NOW()),
        v_token_data.created_by
      );
    END IF;

    -- Store examination preferences
    IF p_survey_responses->'examinations' IS NOT NULL THEN
      INSERT INTO medical_records (
        patient_id,
        category,
        title,
        description,
        metadata,
        created_by
      ) VALUES (
        v_patient_id,
        'survey_examinations',
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