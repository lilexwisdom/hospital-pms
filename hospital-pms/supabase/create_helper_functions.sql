-- Create helper functions for RLS policies
-- This should be run before the RLS policies migration

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(required_role public.user_role)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = required_role
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to check if user has any of the specified roles
CREATE OR REPLACE FUNCTION public.has_any_role(required_roles public.user_role[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = ANY(required_roles)
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to get current user's role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role AS $$
DECLARE
  user_role public.user_role;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = auth.uid();
  
  RETURN user_role;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION public.has_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_any_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_role TO authenticated;