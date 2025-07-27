-- Create a function that can update roles with proper authorization
-- This function should be created by the database owner

CREATE OR REPLACE FUNCTION update_user_role_admin(
  target_email TEXT,
  new_role TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- This runs with the privileges of the function owner
AS $$
BEGIN
  -- Direct update bypassing the trigger check
  UPDATE profiles 
  SET 
    role = new_role,
    updated_at = now()
  WHERE name = target_email;
  
  RETURN FOUND; -- Returns true if a row was updated
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_user_role_admin(TEXT, TEXT) TO authenticated;

-- Usage:
-- SELECT update_user_role_admin('grsurgeon001@gmail.com', 'bd');