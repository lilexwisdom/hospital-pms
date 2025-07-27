-- Fix survey token validation to allow anonymous access for survey forms
-- The existing trigger was preventing SELECT operations which are needed for token validation

-- Drop the existing trigger
DROP TRIGGER IF EXISTS check_survey_token_creator ON survey_tokens;

-- Drop the existing function
DROP FUNCTION IF EXISTS validate_survey_token_creator();

-- Create a new validation function that only checks on INSERT
-- This allows the survey form to SELECT and validate tokens without triggering the role check
CREATE OR REPLACE FUNCTION validate_survey_token_creator()
RETURNS TRIGGER AS $$
BEGIN
  -- Only validate on INSERT, not on SELECT or when updating other fields
  IF TG_OP = 'INSERT' THEN
    IF NOT EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = NEW.created_by 
      AND role IN ('bd', 'admin')
    ) THEN
      RAISE EXCEPTION 'created_by must reference a user with BD or Admin role';
    END IF;
  ELSIF TG_OP = 'UPDATE' AND OLD.created_by IS DISTINCT FROM NEW.created_by THEN
    -- Also validate if someone tries to change the created_by field
    IF NOT EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = NEW.created_by 
      AND role IN ('bd', 'admin')
    ) THEN
      RAISE EXCEPTION 'created_by must reference a user with BD or Admin role';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger to only fire on INSERT and UPDATE
CREATE TRIGGER check_survey_token_creator
  BEFORE INSERT OR UPDATE ON survey_tokens
  FOR EACH ROW
  EXECUTE FUNCTION validate_survey_token_creator();

-- Also ensure the RLS policy for anonymous token validation is properly set
DROP POLICY IF EXISTS "Anonymous can validate token" ON survey_tokens;

-- Create a more permissive policy for anonymous token validation
-- This allows the survey form to check if a token exists and is valid
CREATE POLICY "Anonymous can validate token" ON survey_tokens
  FOR SELECT
  USING (
    -- Allow anonymous access (when auth.uid() is NULL)
    -- or authenticated access
    true
  );

-- Ensure proper permissions are granted
GRANT SELECT ON survey_tokens TO anon;
GRANT SELECT ON survey_tokens TO authenticated;

-- Add comment explaining the change
COMMENT ON FUNCTION validate_survey_token_creator() IS 'Validates that survey tokens are created by BD or Admin users. Only validates on INSERT or when created_by field is changed, allowing SELECT operations for token validation in survey forms.';