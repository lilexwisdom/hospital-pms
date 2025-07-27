-- Check the prevent_role_change function
SELECT 
    p.proname AS function_name,
    pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'prevent_role_change'
AND n.nspname = 'public';

-- Check triggers on profiles table
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'profiles';

-- Check if there are any admin users
SELECT COUNT(*) as admin_count FROM profiles WHERE role = 'admin';