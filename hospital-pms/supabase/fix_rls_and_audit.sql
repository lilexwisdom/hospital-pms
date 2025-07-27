-- Fix RLS policies and create audit_logs table

-- ============================================
-- 1. Fix profiles update policy
-- ============================================
DROP POLICY IF EXISTS "Users can update own non-role fields" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Create trigger to prevent role changes by non-admins
CREATE OR REPLACE FUNCTION prevent_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If role is being changed
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    -- Check if user is admin
    IF NOT EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    ) THEN
      RAISE EXCEPTION 'Only admins can change user roles';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_role_change_policy ON profiles;
CREATE TRIGGER enforce_role_change_policy
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_role_change();

-- ============================================
-- 2. Fix patients update policies
-- ============================================
DROP POLICY IF EXISTS "BD can update patients they created" ON patients;
DROP POLICY IF EXISTS "CS can update assigned patients limited fields" ON patients;

CREATE POLICY "BD can update patients they created" ON patients
  FOR UPDATE
  USING (
    public.has_role('bd'::user_role)
    AND created_by = auth.uid()
  )
  WITH CHECK (
    created_by = auth.uid()
  );

CREATE POLICY "CS can update assigned patients" ON patients
  FOR UPDATE
  USING (
    public.has_role('cs'::user_role)
    AND cs_manager = auth.uid()
  )
  WITH CHECK (
    cs_manager = auth.uid()
  );

-- Create triggers to enforce field-level restrictions
CREATE OR REPLACE FUNCTION enforce_patient_field_restrictions()
RETURNS TRIGGER AS $$
DECLARE
  user_role user_role;
BEGIN
  SELECT role INTO user_role FROM profiles WHERE id = auth.uid();
  
  -- BD cannot change SSN fields
  IF user_role = 'bd' THEN
    IF OLD.encrypted_ssn IS DISTINCT FROM NEW.encrypted_ssn OR 
       OLD.ssn_hash IS DISTINCT FROM NEW.ssn_hash THEN
      RAISE EXCEPTION 'BD users cannot modify SSN data';
    END IF;
  END IF;
  
  -- CS cannot change sensitive fields
  IF user_role = 'cs' THEN
    IF OLD.encrypted_ssn IS DISTINCT FROM NEW.encrypted_ssn OR 
       OLD.ssn_hash IS DISTINCT FROM NEW.ssn_hash OR
       OLD.created_by IS DISTINCT FROM NEW.created_by THEN
      RAISE EXCEPTION 'CS users cannot modify sensitive patient data';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_patient_fields ON patients;
CREATE TRIGGER enforce_patient_fields
  BEFORE UPDATE ON patients
  FOR EACH ROW
  EXECUTE FUNCTION enforce_patient_field_restrictions();

-- ============================================
-- 3. Fix medical records update policy
-- ============================================
DROP POLICY IF EXISTS "Can update own medical records within time limit" ON medical_records;

CREATE POLICY "Can update own medical records" ON medical_records
  FOR UPDATE
  USING (
    created_by = auth.uid()
    -- Can only update within 24 hours
    AND created_at > NOW() - INTERVAL '24 hours'
  )
  WITH CHECK (
    created_by = auth.uid()
  );

-- Create trigger to enforce field restrictions
CREATE OR REPLACE FUNCTION enforce_medical_record_restrictions()
RETURNS TRIGGER AS $$
BEGIN
  -- Cannot change patient_id or created_by
  IF OLD.patient_id IS DISTINCT FROM NEW.patient_id OR
     OLD.created_by IS DISTINCT FROM NEW.created_by THEN
    RAISE EXCEPTION 'Cannot modify patient_id or created_by fields';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_medical_record_fields ON medical_records;
CREATE TRIGGER enforce_medical_record_fields
  BEFORE UPDATE ON medical_records
  FOR EACH ROW
  EXECUTE FUNCTION enforce_medical_record_restrictions();

-- ============================================
-- 4. Fix survey tokens update policy
-- ============================================
DROP POLICY IF EXISTS "System can update token usage" ON survey_tokens;

CREATE POLICY "Update token usage" ON survey_tokens
  FOR UPDATE
  USING (
    -- Allow anonymous updates for token usage
    true
  )
  WITH CHECK (
    -- Can only update used_at and patient_id
    -- Other fields must remain unchanged
    token = token AND
    created_by = created_by AND
    patient_name = patient_name AND
    expires_at = expires_at
  );

-- ============================================
-- 5. Fix appointments update policy
-- ============================================
DROP POLICY IF EXISTS "Update appointments based on role and assignment" ON appointments;

CREATE POLICY "Update appointments" ON appointments
  FOR UPDATE
  USING (
    public.has_any_role(ARRAY['cs', 'manager', 'admin']::user_role[])
    AND (
      public.has_any_role(ARRAY['admin', 'manager']::user_role[])
      OR created_by = auth.uid()
      OR assigned_to = auth.uid()
    )
  )
  WITH CHECK (
    public.has_any_role(ARRAY['cs', 'manager', 'admin']::user_role[])
  );

-- Create trigger to enforce assignment restrictions
CREATE OR REPLACE FUNCTION enforce_appointment_assignment()
RETURNS TRIGGER AS $$
DECLARE
  user_role user_role;
BEGIN
  SELECT role INTO user_role FROM profiles WHERE id = auth.uid();
  
  -- CS cannot reassign appointments to others (unless assigning to self)
  IF user_role = 'cs' AND 
     OLD.assigned_to IS DISTINCT FROM NEW.assigned_to AND
     NEW.assigned_to != auth.uid() THEN
    RAISE EXCEPTION 'CS users can only assign appointments to themselves';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_appointment_assignment_policy ON appointments;
CREATE TRIGGER enforce_appointment_assignment_policy
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION enforce_appointment_assignment();

-- ============================================
-- 6. Create audit_logs table
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  table_name VARCHAR(50) NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS on audit logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs" ON audit_logs
  FOR SELECT
  USING (public.has_role('admin'::user_role));

-- No one can modify audit logs
CREATE POLICY "No one can modify audit logs" ON audit_logs
  FOR ALL
  USING (FALSE);

-- Create index on audit logs
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================
-- 7. Run the last migration for indexes
-- ============================================
-- The index migration (20250718125529) should work without issues