-- Script to create the first admin user
-- This must be run with superuser privileges in Supabase SQL Editor

-- Create a temporary function that bypasses RLS to update the first admin
CREATE OR REPLACE FUNCTION public.create_first_admin()
RETURNS void AS $$
DECLARE
    user_id UUID;
BEGIN
    -- Find the user with email admin@hospital.local
    SELECT id INTO user_id
    FROM auth.users
    WHERE email = 'admin@hospital.local'
    LIMIT 1;
    
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'User admin@hospital.local not found. Please create the user first.';
    END IF;
    
    -- Directly update the profile role, bypassing RLS
    UPDATE public.profiles
    SET role = 'admin',
        updated_at = NOW()
    WHERE id = user_id;
    
    RAISE NOTICE 'Successfully updated admin@hospital.local (ID: %) to admin role', user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the function
SELECT public.create_first_admin();

-- Drop the function after use (security best practice)
DROP FUNCTION public.create_first_admin();

-- Verify the update
SELECT 
    u.email,
    p.id,
    p.role,
    p.name,
    p.department,
    p.updated_at
FROM auth.users u
JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'admin@hospital.local';