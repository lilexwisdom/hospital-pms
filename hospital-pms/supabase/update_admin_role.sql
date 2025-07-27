-- Update admin@hospital.local user role from 'cs' to 'admin'
-- This script should be run with service role privileges

-- First, find the user ID for admin@hospital.local
DO $$
DECLARE
    user_id UUID;
BEGIN
    -- Get the user ID from auth.users table
    SELECT id INTO user_id
    FROM auth.users
    WHERE email = 'admin@hospital.local'
    LIMIT 1;
    
    IF user_id IS NULL THEN
        RAISE NOTICE 'User admin@hospital.local not found in auth.users table';
    ELSE
        RAISE NOTICE 'Found user with ID: %', user_id;
        
        -- Update the profile role to 'admin'
        UPDATE public.profiles
        SET role = 'admin',
            updated_at = NOW()
        WHERE id = user_id;
        
        IF FOUND THEN
            RAISE NOTICE 'Successfully updated admin@hospital.local role to admin';
        ELSE
            RAISE NOTICE 'Profile not found for user ID: %', user_id;
        END IF;
    END IF;
END $$;

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