-- 1. Check current user permissions
SELECT current_user, session_user;

-- 2. Check if we're superuser
SELECT current_setting('is_superuser');

-- 3. Check trigger details
SELECT 
    t.tgname as trigger_name,
    p.proname as function_name,
    t.tgenabled as is_enabled
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'profiles'::regclass;

-- 4. Check the prevent_role_change function
SELECT prosrc 
FROM pg_proc 
WHERE proname = 'prevent_role_change';

-- 5. Check current profiles
SELECT id, name, role, created_at 
FROM profiles 
ORDER BY created_at 
LIMIT 5;