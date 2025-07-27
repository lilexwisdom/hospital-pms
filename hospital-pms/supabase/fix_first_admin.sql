-- Script to fix the first admin user by temporarily disabling the trigger
-- This must be run with superuser privileges in Supabase SQL Editor

-- Step 1: Temporarily disable the trigger
ALTER TABLE public.profiles DISABLE TRIGGER enforce_role_change_policy;

-- Step 2: Update the admin user role
UPDATE public.profiles 
SET role = 'admin', 
    updated_at = NOW() 
WHERE id = (
    SELECT id 
    FROM auth.users 
    WHERE email = 'admin@hospital.local'
    LIMIT 1
);

-- Step 3: Re-enable the trigger
ALTER TABLE public.profiles ENABLE TRIGGER enforce_role_change_policy;

-- Step 4: Verify the update
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