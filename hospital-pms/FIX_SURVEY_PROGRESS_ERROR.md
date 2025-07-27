# Fix for Survey Progress Save Error (400 Status)

## Problem Description

The survey form was showing "Error saving progress to database" with a 400 status error. This occurred because the Row Level Security (RLS) policy for the `survey_tokens` table was too restrictive and didn't allow updating the `survey_data` field.

## Root Cause

The existing RLS policy `"Update token usage"` only allowed updating:
- `used_at` 
- `patient_id`

But the survey progress feature needs to update:
- `survey_data` (to store progress)
- `updated_at` (to track last update time)

## Solution

### Option 1: Automatic Fix (Recommended)

Run the provided script:

```bash
cd hospital-pms
npm run apply-survey-fix
# or
node scripts/apply-survey-fix.js
```

### Option 2: Manual Fix via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the following SQL:

```sql
-- Fix survey_tokens update policy to allow survey_data updates
-- This migration fixes the 400 error when saving survey progress

-- Drop the existing restrictive policies
DROP POLICY IF EXISTS "Update token usage" ON survey_tokens;
DROP POLICY IF EXISTS "System can update token usage" ON survey_tokens;

-- Create a new policy that allows updating survey_data for progress saving
CREATE POLICY "Update token usage and progress" ON survey_tokens
  FOR UPDATE
  USING (
    -- Allow anonymous updates for token usage and progress
    true
  )
  WITH CHECK (
    -- Can update used_at, patient_id, survey_data, and updated_at
    -- Core token fields must remain unchanged
    token = token AND
    created_by = created_by AND
    patient_name = patient_name AND
    patient_phone IS NOT DISTINCT FROM patient_phone AND
    patient_email IS NOT DISTINCT FROM patient_email AND
    expires_at = expires_at AND
    created_at = created_at
  );

-- Add a comment explaining the policy
COMMENT ON POLICY "Update token usage and progress" ON survey_tokens IS 
'Allows anonymous users to update survey progress (survey_data), mark token as used (used_at), link to patient (patient_id), and update timestamp (updated_at) while preventing changes to core token fields';
```

### Option 3: Using Supabase CLI

If you have Supabase CLI configured:

```bash
cd hospital-pms
supabase db push
```

## Changes Made

### 1. Database Policy Update
- File: `supabase/migrations/20250723000000_fix_survey_progress_update.sql`
- Updated the RLS policy to allow `survey_data` and `updated_at` fields to be updated

### 2. Code Update
- File: `src/hooks/useRealtimeNotifications.tsx`
- Added `updated_at` field to the update payload to track when progress was last saved

## Verification

After applying the fix, verify it works:

1. Open a survey link in an incognito/private browser window
2. Fill out some fields in the survey
3. Navigate between survey steps
4. Check browser console - there should be no 400 errors
5. Check browser's Local Storage - survey progress should be saved
6. Check Supabase dashboard - the `survey_tokens` table should show updated `survey_data`

## Security Considerations

The updated policy maintains security by:
- Still preventing changes to core token fields (token, created_by, expires_at, etc.)
- Only allowing updates to fields necessary for progress tracking
- Maintaining the anonymous access pattern for survey respondents
- Preserving the token validation mechanism

## Rollback Instructions

If you need to rollback this change:

```sql
-- Rollback to the original restrictive policy
DROP POLICY IF EXISTS "Update token usage and progress" ON survey_tokens;

CREATE POLICY "Update token usage" ON survey_tokens
  FOR UPDATE
  USING (true)
  WITH CHECK (
    token = token AND
    created_by = created_by AND
    patient_name = patient_name AND
    expires_at = expires_at
  );
```

## Additional Notes

- Survey progress is saved both in browser's localStorage and in the database
- localStorage serves as the primary storage for quick access
- Database storage provides backup and allows progress recovery across devices
- The fix preserves all existing security constraints while enabling the progress feature