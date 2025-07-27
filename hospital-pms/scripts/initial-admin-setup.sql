-- Initial admin setup script
-- This is for setting up the first admin when no admins exist

-- Step 1: Check if any admin exists
DO $$
DECLARE
  admin_count INTEGER;
  first_user_id UUID;
BEGIN
  -- Count existing admins
  SELECT COUNT(*) INTO admin_count FROM profiles WHERE role = 'admin';
  
  IF admin_count = 0 THEN
    -- No admins exist, we need to create one
    -- Get the first user (usually the system creator)
    SELECT id INTO first_user_id FROM profiles ORDER BY created_at ASC LIMIT 1;
    
    -- Temporarily disable the trigger
    ALTER TABLE profiles DISABLE TRIGGER prevent_role_change_trigger;
    
    -- Make the first user an admin
    UPDATE profiles SET role = 'admin' WHERE id = first_user_id;
    
    -- Now update the target user to BD
    UPDATE profiles SET role = 'bd' WHERE name = 'grsurgeon001@gmail.com';
    
    -- Re-enable the trigger
    ALTER TABLE profiles ENABLE TRIGGER prevent_role_change_trigger;
    
    RAISE NOTICE 'Admin setup completed. First user is now admin, and grsurgeon001@gmail.com is now BD.';
  ELSE
    RAISE NOTICE 'Admin already exists. Please login as admin to change roles.';
  END IF;
END $$;