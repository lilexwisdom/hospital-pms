-- Method 1: Drop and recreate the trigger function with bypass logic
CREATE OR REPLACE FUNCTION prevent_role_change() RETURNS TRIGGER AS $$
BEGIN
    -- Add bypass for initial setup
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE role = 'admin') THEN
        -- No admin exists, allow the change
        RETURN NEW;
    END IF;
    
    -- Original logic
    IF (OLD.role IS DISTINCT FROM NEW.role) AND 
       (SELECT role FROM profiles WHERE id = auth.uid()) != 'admin' THEN
        RAISE EXCEPTION 'Only admins can change user roles';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now try to update
UPDATE profiles SET role = 'bd' WHERE name = 'grsurgeon001@gmail.com';