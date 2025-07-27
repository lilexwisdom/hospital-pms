-- Step 1: First check if there's any admin user
SELECT id, name, role FROM profiles WHERE role = 'admin';

-- Step 2: If no admin exists, we need to temporarily disable the trigger
-- Run this with service role or as database owner
ALTER TABLE profiles DISABLE TRIGGER prevent_role_change_trigger;

-- Step 3: Create an admin user or update existing user to admin
-- Option A: Update the first user to admin (if you're the first user)
UPDATE profiles 
SET role = 'admin' 
WHERE id = (SELECT id FROM profiles ORDER BY created_at ASC LIMIT 1);

-- Option B: Update your current user to admin (replace with your user id)
-- UPDATE profiles SET role = 'admin' WHERE name = 'your-current-email@example.com';

-- Step 4: Now update the target user to BD
UPDATE profiles 
SET 
    role = 'bd',
    updated_at = now()
WHERE name = 'grsurgeon001@gmail.com';

-- Step 5: Re-enable the trigger
ALTER TABLE profiles ENABLE TRIGGER prevent_role_change_trigger;

-- Step 6: Verify the changes
SELECT id, name, role, updated_at 
FROM profiles 
WHERE name IN ('grsurgeon001@gmail.com') OR role = 'admin'
ORDER BY role;