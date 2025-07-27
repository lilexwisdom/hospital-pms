-- Create SSN access audit log table
CREATE TABLE IF NOT EXISTS ssn_access_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  patient_id UUID REFERENCES patients(id),
  action TEXT NOT NULL CHECK (action IN ('encrypt', 'decrypt', 'view_masked', 'lookup')),
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  ip_address INET,
  user_agent TEXT,
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  metadata JSONB
);

-- Create indexes for efficient querying
CREATE INDEX idx_ssn_access_logs_user_id ON ssn_access_logs(user_id);
CREATE INDEX idx_ssn_access_logs_patient_id ON ssn_access_logs(patient_id);
CREATE INDEX idx_ssn_access_logs_accessed_at ON ssn_access_logs(accessed_at);
CREATE INDEX idx_ssn_access_logs_action ON ssn_access_logs(action);

-- RLS policies for audit logs
ALTER TABLE ssn_access_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admin users can view all SSN access logs" ON ssn_access_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Users can view their own access logs
CREATE POLICY "Users can view their own SSN access logs" ON ssn_access_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- System can insert audit logs (through service role)
CREATE POLICY "System can insert SSN access logs" ON ssn_access_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to log SSN access
CREATE OR REPLACE FUNCTION log_ssn_access(
  p_patient_id UUID,
  p_action TEXT,
  p_success BOOLEAN DEFAULT true,
  p_error_message TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO ssn_access_logs (
    user_id,
    patient_id,
    action,
    success,
    error_message,
    metadata
  )
  VALUES (
    auth.uid(),
    p_patient_id,
    p_action,
    p_success,
    p_error_message,
    p_metadata
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update decrypt_ssn function to include audit logging
CREATE OR REPLACE FUNCTION decrypt_ssn(encrypted_ssn BYTEA, key_name TEXT DEFAULT 'patient_ssn_key')
RETURNS TEXT AS $$
DECLARE
  encryption_key TEXT;
  decrypted_text TEXT;
  user_role TEXT;
BEGIN
  -- Check user role
  SELECT role INTO user_role
  FROM profiles
  WHERE id = auth.uid();
  
  -- Only admin and manager can decrypt
  IF user_role NOT IN ('admin', 'manager') THEN
    -- Log failed attempt
    PERFORM log_ssn_access(
      NULL,
      'decrypt',
      false,
      'Insufficient permissions'
    );
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
  
  -- Log successful access (note: we don't log patient_id here for security)
  PERFORM log_ssn_access(
    NULL,
    'decrypt',
    true,
    NULL,
    jsonb_build_object('key_name', key_name)
  );
  
  RETURN decrypted_text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update get_patient_ssn to include proper audit logging
CREATE OR REPLACE FUNCTION get_patient_ssn(patient_id UUID)
RETURNS TEXT AS $$
DECLARE
  ssn TEXT;
  encrypted BYTEA;
  user_role TEXT;
BEGIN
  -- Check user role
  SELECT role INTO user_role
  FROM profiles
  WHERE id = auth.uid();
  
  -- Only admin and manager can decrypt
  IF user_role NOT IN ('admin', 'manager') THEN
    -- Log failed attempt
    PERFORM log_ssn_access(
      patient_id,
      'decrypt',
      false,
      'Insufficient permissions'
    );
    RAISE EXCEPTION 'Insufficient permissions to view SSN';
  END IF;
  
  SELECT encrypted_ssn INTO encrypted
  FROM patients
  WHERE id = patient_id;
  
  IF encrypted IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- decrypt_ssn function will handle its own logging
  ssn := decrypt_ssn(encrypted);
  
  -- Log successful patient SSN access
  PERFORM log_ssn_access(
    patient_id,
    'decrypt',
    true
  );
  
  RETURN ssn;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view for audit log statistics
CREATE OR REPLACE VIEW ssn_access_statistics AS
SELECT 
  date_trunc('day', accessed_at) as access_date,
  action,
  COUNT(*) as access_count,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT patient_id) as unique_patients,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_attempts,
  SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) as failed_attempts
FROM ssn_access_logs
GROUP BY date_trunc('day', accessed_at), action
ORDER BY access_date DESC, action;

-- Grant access to the statistics view for admins
GRANT SELECT ON ssn_access_statistics TO authenticated;