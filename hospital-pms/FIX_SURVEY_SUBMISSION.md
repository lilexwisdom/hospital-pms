# Fix Survey Submission Error

## Problem
The survey submission is failing with the error:
```
Could not find the function public.submit_survey_with_patient in the schema cache
```

This is because:
1. The function was incorrectly updated to expect a UUID parameter instead of TEXT
2. The function is missing required table columns and helper functions
3. The medical_records inserts use wrong column names

## Solution

You need to apply the migration file `supabase/migrations/20250723150000_fix_survey_submission_function.sql` to your Supabase database.

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/bqoaalfvvtkdqmovhavn)
2. Navigate to the **SQL Editor** section
3. Copy the entire contents of the file: `supabase/migrations/20250723150000_fix_survey_submission_function.sql`
4. Paste it into the SQL Editor
5. Click **Run** to execute the migration

### Option 2: Using Supabase CLI (if you have Docker)

1. Start Docker on your machine
2. Run the following command from the project directory:
   ```bash
   npm run supabase:push
   ```
3. Enter your database password when prompted

### Option 3: Manual Application

If the above options don't work, here's what the migration does:

1. **Adds patient_number column** to the patients table
2. **Creates a sequence** for generating patient numbers
3. **Creates generate_patient_number() function** for unique patient IDs
4. **Fixes the submit_survey_with_patient function** to:
   - Accept token as TEXT (not UUID)
   - Handle all disease flags properly
   - Create medical records with correct column names
   - Remove the notifications table dependency (not yet implemented)

## Verification

After applying the migration, test the survey submission:

1. Go to a survey link (e.g., `http://localhost:3000/survey/[token]`)
2. Fill out and submit the form
3. The submission should now work correctly

## Key Changes Made

1. **Function signature fixed**: Changed from `p_token UUID` back to `p_token TEXT`
2. **Patient number generation**: Added missing patient_number column and generation function
3. **Medical records structure**: Fixed to use correct columns (title, description, metadata)
4. **Removed notifications**: Commented out notification creation (to be implemented in Task 5.6)
5. **Fixed record_type**: Changed 'general' to 'note' for medical history

The migration ensures backward compatibility with the existing TypeScript code that passes the token as a string.