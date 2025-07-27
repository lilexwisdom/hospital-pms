# Instructions to Update admin@hospital.local Role to Admin

## Background

The user `admin@hospital.local` currently has the role 'cs' (Customer Service) and needs to be updated to 'admin' role. Due to Row Level Security (RLS) policies, only existing admins can change user roles, creating a chicken-and-egg problem for the first admin.

## Solution Options

### Option 1: Use Supabase Dashboard (Recommended)

1. Log in to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the following SQL command:

```sql
UPDATE public.profiles 
SET role = 'admin', updated_at = NOW() 
WHERE id = 'e2859ef2-25d0-472c-a715-75148fb297ca';
```

4. Click "Run" to execute the query
5. Verify the update by running:

```sql
SELECT * FROM public.profiles WHERE id = 'e2859ef2-25d0-472c-a715-75148fb297ca';
```

### Option 2: Use the Prepared SQL Script

1. Log in to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the entire contents of `/workspace/tm_cc_HPMS/hospital-pms/supabase/create_first_admin.sql`
4. Paste and run it in the SQL Editor
5. This script will:
   - Create a temporary function with SECURITY DEFINER
   - Update the admin role
   - Clean up after itself
   - Show the updated profile

### Option 3: Use Supabase CLI (if installed)

Run the following command from the project directory:

```bash
cd /workspace/tm_cc_HPMS/hospital-pms
supabase db execute --sql "UPDATE public.profiles SET role = 'admin' WHERE id = 'e2859ef2-25d0-472c-a715-75148fb297ca';" --linked
```

## After Update

Once the admin role is updated:

1. The user admin@hospital.local will have full admin privileges
2. They can manage other users and change their roles through the application
3. The RLS policies will allow this admin user to perform all administrative tasks

## Security Note

This is a one-time operation needed to bootstrap the first admin user. All subsequent role changes should be done through the application by authenticated admin users.