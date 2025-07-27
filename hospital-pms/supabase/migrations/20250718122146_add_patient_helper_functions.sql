-- Helper functions for patient management with encryption

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
    COALESCE((patient_data->>'created_by')::UUID, auth.uid()),
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

-- Function to get masked SSN for display
CREATE OR REPLACE FUNCTION get_masked_ssn(patient_id UUID)
RETURNS TEXT AS $$
DECLARE
  ssn TEXT;
BEGIN
  -- Try to decrypt if user has permission
  BEGIN
    SELECT decrypt_ssn(encrypted_ssn) INTO ssn
    FROM patients
    WHERE id = patient_id;
    
    IF ssn IS NOT NULL THEN
      RETURN mask_ssn(ssn);
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- If decryption fails due to permissions, return masked
      RETURN '***-**-****';
  END;
  
  RETURN '***-**-****';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get decrypted SSN (with permission check)
CREATE OR REPLACE FUNCTION get_patient_ssn(patient_id UUID)
RETURNS TEXT AS $$
DECLARE
  encrypted BYTEA;
BEGIN
  SELECT encrypted_ssn INTO encrypted
  FROM patients
  WHERE id = patient_id;
  
  IF encrypted IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- decrypt_ssn function will check permissions internally
  RETURN decrypt_ssn(encrypted);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update patient SSN (admin only)
CREATE OR REPLACE FUNCTION update_patient_ssn(
  patient_id UUID,
  new_ssn TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check admin permission
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can update SSN';
  END IF;
  
  -- Update encrypted SSN and hash
  UPDATE patients
  SET 
    encrypted_ssn = encrypt_ssn(new_ssn),
    ssn_hash = hash_ssn(new_ssn),
    updated_at = NOW()
  WHERE id = patient_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to bulk import patients (admin only)
CREATE OR REPLACE FUNCTION bulk_import_patients(
  patients_data JSONB[]
)
RETURNS TABLE (
  success BOOLEAN,
  patient_id UUID,
  error_message TEXT
) AS $$
DECLARE
  patient_record JSONB;
  new_patient_id UUID;
BEGIN
  -- Check admin permission
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can bulk import patients';
  END IF;
  
  -- Process each patient
  FOREACH patient_record IN ARRAY patients_data
  LOOP
    BEGIN
      -- Create patient
      INSERT INTO patients (
        name,
        phone,
        email,
        date_of_birth,
        gender,
        address,
        emergency_contact,
        created_by,
        encrypted_ssn,
        ssn_hash
      )
      VALUES (
        patient_record->>'name',
        patient_record->>'phone',
        patient_record->>'email',
        (patient_record->>'date_of_birth')::DATE,
        patient_record->>'gender',
        COALESCE(patient_record->'address', '{}')::JSONB,
        COALESCE(patient_record->'emergency_contact', '{}')::JSONB,
        auth.uid(),
        encrypt_ssn(patient_record->>'ssn'),
        hash_ssn(patient_record->>'ssn')
      )
      RETURNING id INTO new_patient_id;
      
      RETURN QUERY SELECT TRUE, new_patient_id, NULL::TEXT;
    EXCEPTION
      WHEN OTHERS THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, SQLERRM;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_patient_with_ssn TO authenticated;
GRANT EXECUTE ON FUNCTION find_patient_by_ssn TO authenticated;
GRANT EXECUTE ON FUNCTION get_masked_ssn TO authenticated;
GRANT EXECUTE ON FUNCTION get_patient_ssn TO authenticated;
GRANT EXECUTE ON FUNCTION update_patient_ssn TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_import_patients TO authenticated;