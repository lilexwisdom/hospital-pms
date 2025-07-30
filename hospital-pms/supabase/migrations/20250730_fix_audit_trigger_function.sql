-- Fix audit_trigger_function to handle missing email column in profiles table
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  user_role TEXT;
  user_name TEXT;
  old_data JSONB;
  new_data JSONB;
  changed_fields TEXT[];
  version_before INTEGER;
  version_after INTEGER;
BEGIN
  -- Get user information from profiles and auth.users
  SELECT 
    COALESCE(u.email, 'system'),
    p.role,
    p.name
  INTO user_email, user_role, user_name
  FROM profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  WHERE p.id = auth.uid();

  -- If no user found, use system defaults
  IF user_email IS NULL THEN
    user_email := 'system';
    user_role := 'system';
    user_name := 'System';
  END IF;

  -- Handle different operations
  IF TG_OP = 'INSERT' THEN
    new_data := to_jsonb(NEW);
    -- Remove sensitive data from audit log
    IF TG_TABLE_NAME = 'patients' THEN
      new_data := new_data - 'encrypted_ssn';
    END IF;
    
    version_after := COALESCE((NEW.version)::INTEGER, 1);
    
    INSERT INTO audit_logs (
      table_name,
      operation,
      user_id,
      old_data,
      new_data,
      changed_at
    )
    VALUES (
      TG_TABLE_NAME,
      TG_OP,
      auth.uid(),
      NULL,
      new_data,
      NOW()
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
      table_name,
      operation,
      user_id,
      old_data,
      new_data,
      changed_at
    )
    VALUES (
      TG_TABLE_NAME,
      TG_OP,
      auth.uid(),
      old_data,
      new_data,
      NOW()
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
      table_name,
      operation,
      user_id,
      old_data,
      new_data,
      changed_at
    )
    VALUES (
      TG_TABLE_NAME,
      TG_OP,
      auth.uid(),
      old_data,
      NULL,
      NOW()
    );
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;