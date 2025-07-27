-- First, check current user's role
SELECT id, name, role FROM profiles WHERE name = 'grsurgeon001@gmail.com';

-- If you need to update as admin, you might need to:
-- 1. Login as an admin user in Supabase Dashboard
-- 2. Or temporarily disable the RLS policy
-- 3. Or use service role key

-- Option 1: Update using admin privileges (run this in Supabase Dashboard while logged in as admin)
UPDATE profiles 
SET 
    role = 'bd',
    updated_at = now()
WHERE name = 'grsurgeon001@gmail.com';

-- Option 2: If you have access to disable RLS temporarily
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
-- UPDATE profiles SET role = 'bd', updated_at = now() WHERE name = 'grsurgeon001@gmail.com';
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Verify the update
SELECT id, name, role, updated_at 
FROM profiles 
WHERE name = 'grsurgeon001@gmail.com';