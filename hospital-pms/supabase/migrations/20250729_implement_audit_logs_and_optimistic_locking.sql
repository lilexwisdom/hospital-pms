-- ============================================
-- Comprehensive Audit Log and Optimistic Locking Implementation
-- ============================================

-- 1. Create general audit_logs table
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  user_email TEXT,
  user_role TEXT,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[],
  version_before INTEGER,
  version_after INTEGER,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for efficient querying
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);

-- Enable RLS on audit logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins and managers can view audit logs
CREATE POLICY "Admin and managers can view audit logs" ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- No one can modify audit logs directly
CREATE POLICY "No one can modify audit logs" ON audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (FALSE);

CREATE POLICY "No one can update audit logs" ON audit_logs
  FOR UPDATE
  TO authenticated
  USING (FALSE)
  WITH CHECK (FALSE);

CREATE POLICY "No one can delete audit logs" ON audit_logs
  FOR DELETE
  TO authenticated
  USING (FALSE);

-- Grant service role access for triggers
GRANT INSERT ON audit_logs TO service_role;

-- 2. Add version column to all main tables for optimistic locking
-- ============================================
ALTER TABLE patients ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 NOT NULL;
ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 NOT NULL;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 NOT NULL;
ALTER TABLE survey_responses ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 NOT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 NOT NULL;

-- 3. Create a function to get changed fields between two JSONB objects
-- ============================================
CREATE OR REPLACE FUNCTION get_changed_fields(old_data JSONB, new_data JSONB)
RETURNS TEXT[] AS $$
DECLARE
  changed_fields TEXT[] = '{}';
  field TEXT;
BEGIN
  -- Get all keys from both old and new data
  FOR field IN 
    SELECT DISTINCT key FROM (
      SELECT jsonb_object_keys(old_data) AS key
      UNION
      SELECT jsonb_object_keys(new_data) AS key
    ) keys
  LOOP
    -- Check if field value changed
    IF (old_data->field IS DISTINCT FROM new_data->field) THEN
      changed_fields := array_append(changed_fields, field);
    END IF;
  END LOOP;
  
  RETURN changed_fields;
END;
$$ LANGUAGE plpgsql;

-- 4. Create a comprehensive audit trigger function
-- ============================================
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  user_role TEXT;
  old_data JSONB;
  new_data JSONB;
  changed_fields TEXT[];
  version_before INTEGER;
  version_after INTEGER;
BEGIN
  -- Get user information
  SELECT email, role INTO user_email, user_role
  FROM profiles
  WHERE id = auth.uid();

  -- Handle different operations
  IF TG_OP = 'INSERT' THEN
    new_data := to_jsonb(NEW);
    -- Remove sensitive data from audit log
    IF TG_TABLE_NAME = 'patients' THEN
      new_data := new_data - 'encrypted_ssn';
    END IF;
    
    version_after := COALESCE((NEW.version)::INTEGER, 1);
    
    INSERT INTO audit_logs (
      user_id, user_email, user_role, action, table_name, 
      record_id, new_values, version_after, metadata
    )
    VALUES (
      auth.uid(), user_email, user_role, 'INSERT', TG_TABLE_NAME,
      NEW.id, new_data, version_after,
      jsonb_build_object(
        'ip_address', current_setting('request.headers', true)::json->>'x-forwarded-for',
        'user_agent', current_setting('request.headers', true)::json->>'user-agent'
      )
    );
    RETURN NEW;
    
  ELSIF TG_OP = 'UPDATE' THEN
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
    
    -- Remove sensitive data from audit log
    IF TG_TABLE_NAME = 'patients' THEN
      old_data := old_data - 'encrypted_ssn';
      new_data := new_data - 'encrypted_ssn';
    END IF;
    
    -- Get changed fields
    changed_fields := get_changed_fields(old_data, new_data);
    
    -- Skip if only updated_at changed
    IF array_length(changed_fields, 1) = 1 AND changed_fields[1] = 'updated_at' THEN
      RETURN NEW;
    END IF;
    
    version_before := COALESCE((OLD.version)::INTEGER, 1);
    version_after := COALESCE((NEW.version)::INTEGER, version_before + 1);
    
    -- Update version
    NEW.version := version_after;
    
    INSERT INTO audit_logs (
      user_id, user_email, user_role, action, table_name,
      record_id, old_values, new_values, changed_fields,
      version_before, version_after, metadata
    )
    VALUES (
      auth.uid(), user_email, user_role, 'UPDATE', TG_TABLE_NAME,
      NEW.id, old_data, new_data, changed_fields,
      version_before, version_after,
      jsonb_build_object(
        'ip_address', current_setting('request.headers', true)::json->>'x-forwarded-for',
        'user_agent', current_setting('request.headers', true)::json->>'user-agent'
      )
    );
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    old_data := to_jsonb(OLD);
    
    -- Remove sensitive data from audit log
    IF TG_TABLE_NAME = 'patients' THEN
      old_data := old_data - 'encrypted_ssn';
    END IF;
    
    version_before := COALESCE((OLD.version)::INTEGER, 1);
    
    INSERT INTO audit_logs (
      user_id, user_email, user_role, action, table_name,
      record_id, old_values, version_before, metadata
    )
    VALUES (
      auth.uid(), user_email, user_role, 'DELETE', TG_TABLE_NAME,
      OLD.id, old_data, version_before,
      jsonb_build_object(
        'ip_address', current_setting('request.headers', true)::json->>'x-forwarded-for',
        'user_agent', current_setting('request.headers', true)::json->>'user-agent'
      )
    );
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create optimistic lock check function
-- ============================================
CREATE OR REPLACE FUNCTION check_optimistic_lock()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check on updates
  IF TG_OP = 'UPDATE' THEN
    -- Check if version matches
    IF OLD.version != NEW.version THEN
      RAISE EXCEPTION 'Concurrent update detected. Record has been modified by another user. Please refresh and try again.'
        USING ERRCODE = 'P0001',
              DETAIL = 'Version mismatch',
              HINT = jsonb_build_object(
                'expected_version', OLD.version,
                'provided_version', NEW.version,
                'current_version', OLD.version
              )::text;
    END IF;
    
    -- Increment version
    NEW.version := OLD.version + 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Apply audit triggers to all main tables
-- ============================================

-- Patients table
DROP TRIGGER IF EXISTS audit_patients_trigger ON patients;
CREATE TRIGGER audit_patients_trigger
  AFTER INSERT OR UPDATE OR DELETE ON patients
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS optimistic_lock_patients ON patients;
CREATE TRIGGER optimistic_lock_patients
  BEFORE UPDATE ON patients
  FOR EACH ROW
  EXECUTE FUNCTION check_optimistic_lock();

-- Medical records table
DROP TRIGGER IF EXISTS audit_medical_records_trigger ON medical_records;
CREATE TRIGGER audit_medical_records_trigger
  AFTER INSERT OR UPDATE OR DELETE ON medical_records
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS optimistic_lock_medical_records ON medical_records;
CREATE TRIGGER optimistic_lock_medical_records
  BEFORE UPDATE ON medical_records
  FOR EACH ROW
  EXECUTE FUNCTION check_optimistic_lock();

-- Appointments table
DROP TRIGGER IF EXISTS audit_appointments_trigger ON appointments;
CREATE TRIGGER audit_appointments_trigger
  AFTER INSERT OR UPDATE OR DELETE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS optimistic_lock_appointments ON appointments;
CREATE TRIGGER optimistic_lock_appointments
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION check_optimistic_lock();

-- Survey responses table
DROP TRIGGER IF EXISTS audit_survey_responses_trigger ON survey_responses;
CREATE TRIGGER audit_survey_responses_trigger
  AFTER INSERT OR UPDATE OR DELETE ON survey_responses
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS optimistic_lock_survey_responses ON survey_responses;
CREATE TRIGGER optimistic_lock_survey_responses
  BEFORE UPDATE ON survey_responses
  FOR EACH ROW
  EXECUTE FUNCTION check_optimistic_lock();

-- Profiles table (with special handling for sensitive operations)
DROP TRIGGER IF EXISTS audit_profiles_trigger ON profiles;
CREATE TRIGGER audit_profiles_trigger
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS optimistic_lock_profiles ON profiles;
CREATE TRIGGER optimistic_lock_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_optimistic_lock();

-- 7. Create view for recent audit activity
-- ============================================
CREATE OR REPLACE VIEW audit_activity_summary AS
SELECT 
  al.id,
  al.user_email,
  al.user_role,
  al.action,
  al.table_name,
  al.record_id,
  al.changed_fields,
  al.version_before,
  al.version_after,
  al.created_at,
  CASE 
    WHEN al.table_name = 'patients' THEN p.name
    WHEN al.table_name = 'profiles' THEN pr.full_name
    ELSE NULL
  END as record_name
FROM audit_logs al
LEFT JOIN patients p ON al.table_name = 'patients' AND al.record_id = p.id
LEFT JOIN profiles pr ON al.table_name = 'profiles' AND al.record_id = pr.id
ORDER BY al.created_at DESC;

-- Grant access to the view
GRANT SELECT ON audit_activity_summary TO authenticated;

-- 8. Create function to get audit history for a specific record
-- ============================================
CREATE OR REPLACE FUNCTION get_audit_history(
  p_table_name TEXT,
  p_record_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  user_email TEXT,
  user_role TEXT,
  action TEXT,
  changed_fields TEXT[],
  old_values JSONB,
  new_values JSONB,
  version_before INTEGER,
  version_after INTEGER,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.id,
    al.user_email,
    al.user_role,
    al.action,
    al.changed_fields,
    al.old_values,
    al.new_values,
    al.version_before,
    al.version_after,
    al.created_at
  FROM audit_logs al
  WHERE al.table_name = p_table_name
    AND al.record_id = p_record_id
  ORDER BY al.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_audit_history TO authenticated;

-- 9. Create function to restore a record to a previous version
-- ============================================
CREATE OR REPLACE FUNCTION restore_record_version(
  p_table_name TEXT,
  p_record_id UUID,
  p_target_version INTEGER
)
RETURNS JSONB AS $$
DECLARE
  target_data JSONB;
  current_version INTEGER;
  result JSONB;
BEGIN
  -- Check user permission
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'manager')
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions to restore records';
  END IF;
  
  -- Get the target version data from audit logs
  SELECT 
    CASE 
      WHEN action = 'DELETE' THEN old_values
      ELSE new_values
    END INTO target_data
  FROM audit_logs
  WHERE table_name = p_table_name
    AND record_id = p_record_id
    AND version_after = p_target_version
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF target_data IS NULL THEN
    RAISE EXCEPTION 'Version % not found for record', p_target_version;
  END IF;
  
  -- Restore based on table
  -- This is a placeholder - actual implementation would need dynamic SQL
  -- or specific handling for each table
  result := jsonb_build_object(
    'success', true,
    'message', 'Restore functionality requires table-specific implementation',
    'target_data', target_data
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION restore_record_version TO authenticated;

-- 10. Create statistics view for audit logs
-- ============================================
CREATE OR REPLACE VIEW audit_statistics AS
SELECT 
  date_trunc('day', created_at) as audit_date,
  table_name,
  action,
  user_role,
  COUNT(*) as operation_count,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT record_id) as unique_records
FROM audit_logs
GROUP BY date_trunc('day', created_at), table_name, action, user_role
ORDER BY audit_date DESC, table_name, action;

-- Grant access to the view
GRANT SELECT ON audit_statistics TO authenticated;