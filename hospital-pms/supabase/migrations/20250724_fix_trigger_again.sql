-- Fix the trigger that's preventing survey submission

-- First, check if the trigger exists and drop it
DROP TRIGGER IF EXISTS validate_creator_on_survey_tokens ON survey_tokens;

-- Drop the old function
DROP FUNCTION IF EXISTS validate_survey_token_creator();

-- Recreate the function to only validate on INSERT (not on SELECT or UPDATE of survey_data)
CREATE OR REPLACE FUNCTION validate_survey_token_creator()
RETURNS TRIGGER AS $$
BEGIN
  -- Only validate when inserting new tokens
  IF TG_OP = 'INSERT' THEN
    -- Check if the creator has bd or admin role
    IF NOT EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = NEW.created_by 
      AND role IN ('bd', 'admin')
    ) THEN
      RAISE EXCEPTION 'created_by must reference a user with BD or Admin role';
    END IF;
  END IF;
  
  -- For UPDATE operations, only validate if created_by is being changed
  IF TG_OP = 'UPDATE' AND NEW.created_by IS DISTINCT FROM OLD.created_by THEN
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

-- Create the trigger only for INSERT and UPDATE operations
CREATE TRIGGER validate_creator_on_survey_tokens
  BEFORE INSERT OR UPDATE ON survey_tokens
  FOR EACH ROW
  EXECUTE FUNCTION validate_survey_token_creator();

-- Also check if there's a check constraint causing this issue
ALTER TABLE survey_tokens DROP CONSTRAINT IF EXISTS check_created_by_role;

-- Verify the token being used has a valid created_by
SELECT 
  st.token,
  st.created_by,
  p.role as creator_role,
  st.expires_at,
  st.used_at
FROM survey_tokens st
LEFT JOIN profiles p ON st.created_by = p.id
WHERE st.token = '0c230c86-19cc-4a1a-bf10-bcf5c26958bf'::uuid;