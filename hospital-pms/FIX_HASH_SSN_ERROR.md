# Fix hash_ssn Function Error

## Problem
The survey submission is failing with error: "function hash_ssn(text) does not exist"

## Solution
Run the following SQL in your Supabase Dashboard:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/bqoaalfvvtkdqmovhavn)
2. Navigate to SQL Editor
3. Run this SQL:

```sql
-- Create all missing functions for survey submission

-- 1. Create hash_ssn function
CREATE OR REPLACE FUNCTION hash_ssn(p_ssn TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Use SHA-256 hash for SSN
  RETURN encode(digest(p_ssn, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

-- 2. Create generate_patient_number function
CREATE OR REPLACE FUNCTION generate_patient_number()
RETURNS VARCHAR(20) AS $$
DECLARE
  v_year TEXT;
  v_seq TEXT;
BEGIN
  -- Get current year (2 digits)
  v_year := TO_CHAR(CURRENT_DATE, 'YY');
  
  -- Get next sequence value padded to 6 digits
  SELECT LPAD((COUNT(*) + 1)::TEXT, 6, '0') INTO v_seq
  FROM patients
  WHERE patient_number LIKE 'P' || v_year || '%';
  
  -- Return format: P{YY}{NNNNNN} e.g., P24001234
  RETURN 'P' || v_year || v_seq;
END;
$$ LANGUAGE plpgsql;

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION hash_ssn(text) TO anon;
GRANT EXECUTE ON FUNCTION generate_patient_number() TO anon;
```

## Quick Test
After running the SQL above, you can test if the functions exist:

```sql
-- Test hash_ssn function
SELECT hash_ssn('test123');

-- Test generate_patient_number function
SELECT generate_patient_number();
```

Both should return values without errors.

## Full Migration
If you need to run the complete migration with all missing tables and columns, use the file:
`/workspace/tm_cc_HPMS/hospital-pms/supabase/migrations/20250724_create_missing_functions.sql`