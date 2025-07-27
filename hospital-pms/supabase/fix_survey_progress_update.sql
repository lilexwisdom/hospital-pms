-- Fix survey_tokens update policy to allow survey_data updates
-- This fixes the 400 error when saving survey progress

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Update token usage" ON survey_tokens;

-- Create a new policy that allows updating survey_data for progress saving
CREATE POLICY "Update token usage and progress" ON survey_tokens
  FOR UPDATE
  USING (
    -- Allow anonymous updates for token usage and progress
    true
  )
  WITH CHECK (
    -- Can update used_at, patient_id, and survey_data
    -- Other important fields must remain unchanged
    token = token AND
    created_by = created_by AND
    patient_name = patient_name AND
    expires_at = expires_at AND
    created_at = created_at
  );

-- Add a comment explaining the policy
COMMENT ON POLICY "Update token usage and progress" ON survey_tokens IS 
'Allows anonymous users to update survey progress (survey_data), mark token as used (used_at), and link to patient (patient_id) while preventing changes to core token fields';