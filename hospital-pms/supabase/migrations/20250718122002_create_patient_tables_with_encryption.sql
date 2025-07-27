-- Enable pgcrypto extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a secure key storage table (for production, use external key management)
CREATE TABLE IF NOT EXISTS encryption_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name VARCHAR(50) UNIQUE NOT NULL,
  key_value TEXT NOT NULL, -- In production, this should reference external KMS
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  rotated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Insert default encryption key (CHANGE THIS IN PRODUCTION!)
INSERT INTO encryption_keys (key_name, key_value) 
VALUES ('patient_ssn_key', 'CHANGE_THIS_SECRET_KEY_IN_PRODUCTION_USE_KMS')
ON CONFLICT (key_name) DO NOTHING;

-- Restrict access to encryption keys table
ALTER TABLE encryption_keys ENABLE ROW LEVEL SECURITY;

-- Only service role can access encryption keys
CREATE POLICY "Service role only for encryption keys" ON encryption_keys
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Create patients table
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  encrypted_ssn BYTEA NOT NULL, -- Encrypted SSN using pgcrypto
  ssn_hash TEXT NOT NULL, -- Hash for unique constraint and lookups
  phone VARCHAR(20),
  email VARCHAR(255),
  date_of_birth DATE,
  gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
  address JSONB DEFAULT '{}',
  emergency_contact JSONB DEFAULT '{}',
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  cs_manager UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_ssn_hash UNIQUE(ssn_hash)
);

-- Create medical_records table
CREATE TABLE medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  record_type VARCHAR(50) NOT NULL CHECK (record_type IN ('diagnosis', 'treatment', 'surgery', 'medication', 'allergy', 'note')),
  record_date DATE NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  attachments JSONB DEFAULT '[]', -- Array of file references
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create trigger functions to validate roles
CREATE OR REPLACE FUNCTION validate_patient_created_by()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = NEW.created_by 
      AND role IN ('bd', 'admin')
    ) THEN
      RAISE EXCEPTION 'created_by must reference a user with BD or Admin role';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_patient_cs_manager()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.cs_manager IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = NEW.cs_manager 
      AND role IN ('cs', 'admin')
    ) THEN
      RAISE EXCEPTION 'cs_manager must reference a user with CS or Admin role';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to enforce role constraints
CREATE TRIGGER check_patient_created_by
  BEFORE INSERT OR UPDATE ON patients
  FOR EACH ROW
  EXECUTE FUNCTION validate_patient_created_by();

CREATE TRIGGER check_patient_cs_manager
  BEFORE INSERT OR UPDATE ON patients
  FOR EACH ROW
  EXECUTE FUNCTION validate_patient_cs_manager();

-- Create function to encrypt SSN
CREATE OR REPLACE FUNCTION encrypt_ssn(ssn TEXT, key_name TEXT DEFAULT 'patient_ssn_key')
RETURNS BYTEA AS $$
DECLARE
  encryption_key TEXT;
BEGIN
  -- Get encryption key
  SELECT key_value INTO encryption_key 
  FROM encryption_keys 
  WHERE encryption_keys.key_name = encrypt_ssn.key_name;
  
  IF encryption_key IS NULL THEN
    RAISE EXCEPTION 'Encryption key not found';
  END IF;
  
  -- Encrypt the SSN
  RETURN pgp_sym_encrypt(ssn, encryption_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to decrypt SSN (restricted access)
CREATE OR REPLACE FUNCTION decrypt_ssn(encrypted_ssn BYTEA, key_name TEXT DEFAULT 'patient_ssn_key')
RETURNS TEXT AS $$
DECLARE
  encryption_key TEXT;
  decrypted_text TEXT;
BEGIN
  -- Check if user has permission to decrypt
  IF auth.jwt()->>'role' NOT IN ('service_role') AND 
     NOT EXISTS (
       SELECT 1 FROM profiles 
       WHERE id = auth.uid() 
       AND role IN ('admin', 'manager')
     ) THEN
    RAISE EXCEPTION 'Insufficient permissions to decrypt SSN';
  END IF;
  
  -- Get encryption key
  SELECT key_value INTO encryption_key 
  FROM encryption_keys 
  WHERE encryption_keys.key_name = decrypt_ssn.key_name;
  
  IF encryption_key IS NULL THEN
    RAISE EXCEPTION 'Encryption key not found';
  END IF;
  
  -- Decrypt the SSN
  decrypted_text := pgp_sym_decrypt(encrypted_ssn, encryption_key);
  
  -- Log access for audit trail (optional)
  -- INSERT INTO audit_log (user_id, action, resource_type, resource_id)
  -- VALUES (auth.uid(), 'decrypt_ssn', 'patient', patient_id);
  
  RETURN decrypted_text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to hash SSN for lookups
CREATE OR REPLACE FUNCTION hash_ssn(ssn TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(digest(ssn, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to mask SSN for display
CREATE OR REPLACE FUNCTION mask_ssn(ssn TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Return last 4 digits only: ***-**-1234
  IF LENGTH(ssn) >= 4 THEN
    RETURN '***-**-' || RIGHT(ssn, 4);
  ELSE
    RETURN '***-**-****';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create updated_at triggers
CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON patients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_records_updated_at
  BEFORE UPDATE ON medical_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_patients_created_by ON patients(created_by);
CREATE INDEX idx_patients_cs_manager ON patients(cs_manager);
CREATE INDEX idx_patients_created_at ON patients(created_at);
CREATE INDEX idx_patients_name ON patients(name);
CREATE INDEX idx_patients_phone ON patients(phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_patients_email ON patients(email) WHERE email IS NOT NULL;

CREATE INDEX idx_medical_records_patient_id ON medical_records(patient_id);
CREATE INDEX idx_medical_records_record_type ON medical_records(record_type);
CREATE INDEX idx_medical_records_record_date ON medical_records(record_date);
CREATE INDEX idx_medical_records_created_by ON medical_records(created_by);

-- Enable RLS on tables
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for patients table
-- BD and CS can view patients they created or manage
CREATE POLICY "Users can view relevant patients" ON patients
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      -- Admins and managers can see all
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'manager')
      )
      OR
      -- BD can see patients they created
      created_by = auth.uid()
      OR
      -- CS can see patients they manage
      cs_manager = auth.uid()
    )
  );

-- BD can insert patients
CREATE POLICY "BD can create patients" ON patients
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('bd', 'admin')
    )
    AND created_by = auth.uid()
  );

-- Users can update patients they created or manage
CREATE POLICY "Users can update their patients" ON patients
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'manager')
      )
      OR created_by = auth.uid()
      OR cs_manager = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'manager')
      )
      OR created_by = auth.uid()
      OR cs_manager = auth.uid()
    )
  );

-- Only admins can delete patients
CREATE POLICY "Only admins can delete patients" ON patients
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for medical_records table
-- Users can view medical records for patients they can access
CREATE POLICY "Users can view relevant medical records" ON medical_records
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = medical_records.patient_id
      AND (
        -- Check if user can view this patient
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'manager')
        )
        OR patients.created_by = auth.uid()
        OR patients.cs_manager = auth.uid()
      )
    )
  );

-- Healthcare providers can insert medical records
CREATE POLICY "Healthcare providers can create medical records" ON medical_records
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = patient_id
      AND (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'manager')
        )
        OR patients.created_by = auth.uid()
        OR patients.cs_manager = auth.uid()
      )
    )
  );

-- Users can update medical records they created
CREATE POLICY "Users can update their medical records" ON medical_records
  FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Only admins can delete medical records
CREATE POLICY "Only admins can delete medical records" ON medical_records
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON patients TO authenticated;
GRANT SELECT, INSERT, UPDATE ON medical_records TO authenticated;
GRANT EXECUTE ON FUNCTION encrypt_ssn TO authenticated;
GRANT EXECUTE ON FUNCTION decrypt_ssn TO authenticated;
GRANT EXECUTE ON FUNCTION hash_ssn TO authenticated;
GRANT EXECUTE ON FUNCTION mask_ssn TO authenticated;