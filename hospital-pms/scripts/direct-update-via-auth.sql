-- Create a temporary bypass by checking for a specific condition
-- This uses the auth.uid() to check if it's you

-- First, find your auth user id
SELECT 
    p.id as profile_id,
    p.name,
    p.role,
    au.id as auth_user_id,
    au.email as auth_email
FROM profiles p
JOIN auth.users au ON p.id = au.id
WHERE p.name = 'grsurgeon001@gmail.com';

-- Create a modified function that allows YOU to change roles
CREATE OR REPLACE FUNCTION prevent_role_change() RETURNS TRIGGER AS $$
BEGIN
    -- Allow role change if:
    -- 1. No admin exists (initial setup)
    -- 2. Current user is admin
    -- 3. Current user is the Supabase project owner (you) - temporary bypass
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE role = 'admin') OR
       (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' OR
       auth.uid() = 'a69c70dd-47d2-4db5-832d-5933df33c468' THEN  -- Replace with your actual auth ID
        RETURN NEW;
    END IF;
    
    IF (OLD.role IS DISTINCT FROM NEW.role) THEN
        RAISE EXCEPTION 'Only admins can change user roles';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now update the role
UPDATE profiles SET role = 'bd' WHERE name = 'grsurgeon001@gmail.com';

-- IMPORTANT: Revert the function back to original after update
CREATE OR REPLACE FUNCTION prevent_role_change() RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.role IS DISTINCT FROM NEW.role) AND 
       (SELECT role FROM profiles WHERE id = auth.uid()) != 'admin' THEN
        RAISE EXCEPTION 'Only admins can change user roles';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;