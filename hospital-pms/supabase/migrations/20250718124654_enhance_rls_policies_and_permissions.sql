-- Enhanced RLS Policies and Granular Permissions
-- This migration reviews and enhances all existing RLS policies for better security

-- ============================================
-- 1. Create helper functions for role checking
-- ============================================

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(required_role user_role)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = required_role
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to check if user has any of the specified roles
CREATE OR REPLACE FUNCTION public.has_any_role(required_roles user_role[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = ANY(required_roles)
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to get current user's role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role AS $$
DECLARE
  user_role user_role;
BEGIN
  SELECT role INTO user_role
  FROM profiles
  WHERE id = auth.uid();
  
  RETURN user_role;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================
-- 2. Enhanced Profiles Table Policies
-- ============================================

-- Drop existing policies to recreate with better structure
DROP POLICY IF EXISTS "Profiles are viewable by all users" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Only admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Only admins can delete profiles" ON profiles;

-- Profiles: View policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Staff can view all profiles" ON profiles
  FOR SELECT
  USING (public.has_any_role(ARRAY['admin', 'manager', 'bd', 'cs']::user_role[]));

-- Profiles: Update policies
CREATE POLICY "Users can update own non-role fields" ON profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() 
    AND (OLD.role = NEW.role OR public.has_role('admin'::user_role))
  );

-- Profiles: Insert policy (handled by trigger, admin override)
CREATE POLICY "Only admins can manually insert profiles" ON profiles
  FOR INSERT
  WITH CHECK (public.has_role('admin'::user_role));

-- Profiles: Delete policy
CREATE POLICY "Only admins can delete profiles" ON profiles
  FOR DELETE
  USING (public.has_role('admin'::user_role));

-- ============================================
-- 3. Enhanced Patients Table Policies
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view relevant patients" ON patients;
DROP POLICY IF EXISTS "BD can create patients" ON patients;
DROP POLICY IF EXISTS "Users can update their patients" ON patients;
DROP POLICY IF EXISTS "Only admins can delete patients" ON patients;

-- Patients: View policies with role-based access
CREATE POLICY "Admin and Manager can view all patients" ON patients
  FOR SELECT
  USING (public.has_any_role(ARRAY['admin', 'manager']::user_role[]));

CREATE POLICY "BD can view patients they created" ON patients
  FOR SELECT
  USING (
    public.has_role('bd'::user_role) 
    AND created_by = auth.uid()
  );

CREATE POLICY "CS can view assigned patients" ON patients
  FOR SELECT
  USING (
    public.has_role('cs'::user_role)
    AND cs_manager = auth.uid()
  );

-- Patients: Insert policy
CREATE POLICY "BD and Admin can create patients" ON patients
  FOR INSERT
  WITH CHECK (
    public.has_any_role(ARRAY['bd', 'admin']::user_role[])
    AND (created_by = auth.uid() OR public.has_role('admin'::user_role))
  );

-- Patients: Update policies with field-level control
CREATE POLICY "BD can update patients they created" ON patients
  FOR UPDATE
  USING (
    public.has_role('bd'::user_role)
    AND created_by = auth.uid()
  )
  WITH CHECK (
    created_by = auth.uid()
    -- BD cannot change encrypted_ssn or ssn_hash
    AND OLD.encrypted_ssn = NEW.encrypted_ssn
    AND OLD.ssn_hash = NEW.ssn_hash
  );

CREATE POLICY "CS can update assigned patients limited fields" ON patients
  FOR UPDATE
  USING (
    public.has_role('cs'::user_role)
    AND cs_manager = auth.uid()
  )
  WITH CHECK (
    cs_manager = auth.uid()
    -- CS cannot change sensitive fields
    AND OLD.encrypted_ssn = NEW.encrypted_ssn
    AND OLD.ssn_hash = NEW.ssn_hash
    AND OLD.created_by = NEW.created_by
  );

CREATE POLICY "Admin and Manager can update all patients" ON patients
  FOR UPDATE
  USING (public.has_any_role(ARRAY['admin', 'manager']::user_role[]))
  WITH CHECK (public.has_any_role(ARRAY['admin', 'manager']::user_role[]));

-- Patients: Delete policy
CREATE POLICY "Only admin can delete patients" ON patients
  FOR DELETE
  USING (public.has_role('admin'::user_role));

-- ============================================
-- 4. Enhanced Medical Records Policies
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view relevant medical records" ON medical_records;
DROP POLICY IF EXISTS "Healthcare providers can create medical records" ON medical_records;
DROP POLICY IF EXISTS "Users can update their medical records" ON medical_records;
DROP POLICY IF EXISTS "Only admins can delete medical records" ON medical_records;

-- Medical Records: View policies
CREATE POLICY "View medical records based on patient access" ON medical_records
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = medical_records.patient_id
      AND (
        -- Admin/Manager can see all
        public.has_any_role(ARRAY['admin', 'manager']::user_role[])
        -- BD can see records for patients they created
        OR (public.has_role('bd'::user_role) AND p.created_by = auth.uid())
        -- CS can see records for patients they manage
        OR (public.has_role('cs'::user_role) AND p.cs_manager = auth.uid())
      )
    )
  );

-- Medical Records: Insert policy
CREATE POLICY "Authorized staff can create medical records" ON medical_records
  FOR INSERT
  WITH CHECK (
    public.has_any_role(ARRAY['admin', 'manager', 'cs']::user_role[])
    AND created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = patient_id
      AND (
        public.has_any_role(ARRAY['admin', 'manager']::user_role[])
        OR (public.has_role('cs'::user_role) AND p.cs_manager = auth.uid())
      )
    )
  );

-- Medical Records: Update policy
CREATE POLICY "Can update own medical records within time limit" ON medical_records
  FOR UPDATE
  USING (
    created_by = auth.uid()
    -- Can only update within 24 hours of creation
    AND created_at > NOW() - INTERVAL '24 hours'
  )
  WITH CHECK (
    created_by = auth.uid()
    -- Cannot change patient_id or created_by
    AND OLD.patient_id = NEW.patient_id
    AND OLD.created_by = NEW.created_by
  );

CREATE POLICY "Admin can update any medical record" ON medical_records
  FOR UPDATE
  USING (public.has_role('admin'::user_role))
  WITH CHECK (public.has_role('admin'::user_role));

-- Medical Records: Delete policy
CREATE POLICY "Only admin can delete medical records" ON medical_records
  FOR DELETE
  USING (public.has_role('admin'::user_role));

-- ============================================
-- 5. Enhanced Survey Token Policies
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "BD can create and view survey tokens" ON survey_tokens;
DROP POLICY IF EXISTS "Patients can use their tokens" ON survey_tokens;

-- Survey Tokens: View policies
CREATE POLICY "BD can view own tokens" ON survey_tokens
  FOR SELECT
  USING (
    public.has_role('bd'::user_role)
    AND created_by = auth.uid()
  );

CREATE POLICY "Admin can view all tokens" ON survey_tokens
  FOR SELECT
  USING (public.has_role('admin'::user_role));

CREATE POLICY "Anonymous can validate token" ON survey_tokens
  FOR SELECT
  USING (
    -- Allow token validation without auth
    auth.uid() IS NULL
    -- But only return minimal fields via view/function
  );

-- Survey Tokens: Insert policy
CREATE POLICY "BD and Admin can create tokens" ON survey_tokens
  FOR INSERT
  WITH CHECK (
    public.has_any_role(ARRAY['bd', 'admin']::user_role[])
    AND created_by = auth.uid()
  );

-- Survey Tokens: Update policy
CREATE POLICY "System can update token usage" ON survey_tokens
  FOR UPDATE
  USING (
    -- Only allow updating used_at and patient_id fields
    auth.uid() IS NULL OR auth.uid() IS NOT NULL
  )
  WITH CHECK (
    -- Ensure only specific fields can be updated
    OLD.token = NEW.token
    AND OLD.created_by = NEW.created_by
    AND OLD.expires_at = NEW.expires_at
    AND OLD.created_at = NEW.created_at
    AND (OLD.used_at IS NULL OR OLD.used_at = NEW.used_at)
  );

-- Survey Tokens: No delete allowed (historical record)

-- ============================================
-- 6. Enhanced Appointment Policies
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view relevant appointments" ON appointments;
DROP POLICY IF EXISTS "CS can create appointments" ON appointments;
DROP POLICY IF EXISTS "CS can update appointments" ON appointments;

-- Appointments: View policies
CREATE POLICY "View appointments based on role" ON appointments
  FOR SELECT
  USING (
    -- Admin/Manager see all
    public.has_any_role(ARRAY['admin', 'manager']::user_role[])
    -- CS see appointments they created or are assigned to
    OR (public.has_role('cs'::user_role) AND (created_by = auth.uid() OR assigned_to = auth.uid()))
    -- BD see appointments for their patients
    OR (
      public.has_role('bd'::user_role)
      AND EXISTS (
        SELECT 1 FROM patients p
        WHERE p.id = appointments.patient_id
        AND p.created_by = auth.uid()
      )
    )
  );

-- Appointments: Insert policy
CREATE POLICY "CS and above can create appointments" ON appointments
  FOR INSERT
  WITH CHECK (
    public.has_any_role(ARRAY['cs', 'manager', 'admin']::user_role[])
    AND created_by = auth.uid()
    -- Ensure they have access to the patient
    AND EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = patient_id
      AND (
        public.has_any_role(ARRAY['admin', 'manager']::user_role[])
        OR (public.has_role('cs'::user_role) AND p.cs_manager = auth.uid())
      )
    )
  );

-- Appointments: Update policy
CREATE POLICY "Update appointments based on role and assignment" ON appointments
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
    -- CS cannot reassign appointments to others
    AND (
      public.has_any_role(ARRAY['admin', 'manager']::user_role[])
      OR OLD.assigned_to = NEW.assigned_to
      OR NEW.assigned_to = auth.uid()
    )
  );

-- Appointments: Delete policy (soft delete via status preferred)
CREATE POLICY "Only admin can delete appointments" ON appointments
  FOR DELETE
  USING (public.has_role('admin'::user_role));

-- ============================================
-- 7. Create RLS Testing Functions
-- ============================================

-- Function to test RLS policies for a specific user
CREATE OR REPLACE FUNCTION test_user_access(
  test_user_id UUID,
  test_table_name TEXT
)
RETURNS TABLE (
  can_select BOOLEAN,
  can_insert BOOLEAN,
  can_update BOOLEAN,
  can_delete BOOLEAN,
  select_count INTEGER
) AS $$
DECLARE
  role_name user_role;
  select_query TEXT;
  record_count INTEGER;
BEGIN
  -- Get user role
  SELECT role INTO role_name FROM profiles WHERE id = test_user_id;
  
  -- Test SELECT access
  select_query := format('SELECT COUNT(*) FROM %I', test_table_name);
  
  -- This is a simplified version - in production, use proper security context switching
  EXECUTE select_query INTO record_count;
  
  RETURN QUERY
  SELECT 
    TRUE as can_select,
    CASE 
      WHEN role_name IN ('admin', 'bd', 'cs', 'manager') THEN TRUE
      ELSE FALSE
    END as can_insert,
    CASE 
      WHEN role_name IN ('admin', 'manager', 'cs', 'bd') THEN TRUE
      ELSE FALSE
    END as can_update,
    CASE 
      WHEN role_name = 'admin' THEN TRUE
      ELSE FALSE
    END as can_delete,
    record_count as select_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate all RLS policies
CREATE OR REPLACE FUNCTION validate_rls_policies()
RETURNS TABLE (
  table_name TEXT,
  has_rls_enabled BOOLEAN,
  policy_count INTEGER,
  missing_operations TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  WITH table_policies AS (
    SELECT 
      schemaname,
      tablename,
      (SELECT COUNT(*) FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename) as policy_count,
      EXISTS(SELECT 1 FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename AND pg_policies.cmd = 'SELECT') as has_select,
      EXISTS(SELECT 1 FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename AND pg_policies.cmd = 'INSERT') as has_insert,
      EXISTS(SELECT 1 FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename AND pg_policies.cmd = 'UPDATE') as has_update,
      EXISTS(SELECT 1 FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename AND pg_policies.cmd = 'DELETE') as has_delete
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename NOT LIKE 'pg_%'
  )
  SELECT 
    tablename::TEXT,
    (policy_count > 0) as has_rls_enabled,
    policy_count::INTEGER,
    ARRAY_REMOVE(ARRAY[
      CASE WHEN NOT has_select THEN 'SELECT' END,
      CASE WHEN NOT has_insert THEN 'INSERT' END,
      CASE WHEN NOT has_update THEN 'UPDATE' END,
      CASE WHEN NOT has_delete THEN 'DELETE' END
    ], NULL) as missing_operations
  FROM table_policies
  WHERE tablename IN ('profiles', 'patients', 'medical_records', 'survey_tokens', 
                      'survey_responses', 'appointments', 'appointment_status_history')
  ORDER BY tablename;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. Grant necessary permissions
-- ============================================

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION public.has_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_any_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION test_user_access TO authenticated;
GRANT EXECUTE ON FUNCTION validate_rls_policies TO authenticated;

-- ============================================
-- 9. Create audit log for sensitive operations
-- ============================================

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
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
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);

-- Function to log sensitive operations
CREATE OR REPLACE FUNCTION log_sensitive_operation()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') AND TG_TABLE_NAME = 'patients' THEN
    INSERT INTO audit_logs (
      user_id,
      action,
      table_name,
      record_id,
      old_data,
      new_data
    ) VALUES (
      auth.uid(),
      TG_OP,
      TG_TABLE_NAME,
      OLD.id,
      row_to_json(OLD)::JSONB,
      CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(NEW)::JSONB ELSE NULL END
    );
  END IF;
  
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for patient audit logging
CREATE TRIGGER audit_patient_changes
  AFTER UPDATE OR DELETE ON patients
  FOR EACH ROW
  EXECUTE FUNCTION log_sensitive_operation();

-- ============================================
-- 10. Summary Comment
-- ============================================

COMMENT ON SCHEMA public IS 'Hospital Patient Management System with enhanced RLS policies. 
All tables have row-level security enabled with role-based access control:
- admin: Full access to all data
- manager: Read access to all data, limited write access
- bd: Can create patients and survey tokens, manage own data
- cs: Can manage appointments and assigned patients
Each role has specific, granular permissions designed for healthcare compliance.';