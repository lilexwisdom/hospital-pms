# Survey Submission Schema Fix Documentation

## Problem Summary

The survey submission was failing with the error: "column birth_date of relation patients does not exist"

## Root Causes Identified

1. **Column Name Mismatch**: The latest migration (20250723150001) was using `birth_date` but the actual patients table uses `date_of_birth`
2. **Missing Columns**: The migration was trying to insert into `address_detail`, `status`, and `assigned_bd_id` columns that didn't exist
3. **Data Format Mismatch**: The frontend sends address as a JSONB object, but the migration was trying to handle it as separate string columns

## Data Flow Analysis

### Frontend (survey.ts)
- Sends `birthDate` in form data
- Converts to `date_of_birth` in patientData object
- Sends address as JSONB object with street, detail, and postal_code

### Database Schema (patients table)
- Uses `date_of_birth` column (not `birth_date`)
- Stores `address` as JSONB column
- Did not have `address_detail`, `status`, or `assigned_bd_id` columns

### Previous Migration Issues
- 20250723150001 incorrectly used `birth_date` instead of `date_of_birth`
- Tried to insert into non-existent columns

## Solution Implemented

### Migration: 20250723160000_fix_survey_submission_schema.sql

1. **Added Missing Columns**:
   - `address_detail TEXT` - For storing detailed address separately
   - `status VARCHAR(20)` - With CHECK constraint for valid values
   - `assigned_bd_id UUID` - References profiles table

2. **Fixed Column Names**:
   - Changed `birth_date` to `date_of_birth` in INSERT statement
   - Changed `(p_patient_data->>'birthDate')::DATE` to `(p_patient_data->>'date_of_birth')::DATE`

3. **Handled Address Format**:
   - Added logic to detect if address is sent as object or string
   - Properly stores address as JSONB while extracting detail for convenience
   - Maintains backward compatibility with both formats

4. **Fixed Medical Records**:
   - Uses correct `record_type` column (not `category`)
   - Properly handles both old and new field names from frontend
   - Added proper record types for each type of medical data

## Testing

Run the test script to verify the migration:

```sql
-- Check if columns were added
\d patients

-- Test the function with sample data
SELECT submit_survey_with_patient(
  'valid-token-uuid'::TEXT,
  '{"name":"Test Patient","date_of_birth":"1990-01-01","gender":"male","phone":"010-1234-5678","address":{"street":"Seoul","detail":"Apt 101","postal_code":"12345"},"flag_hypertension":true}'::JSONB,
  '123456-1234567',
  '{"personal_info":{},"medical_info":{},"examinations":{}}'::JSONB,
  '{"allergies":"Peanuts","medications":"Blood pressure medication"}'::JSONB
);
```

## Deployment Steps

1. Apply the migration:
   ```bash
   supabase migration up
   ```

2. Verify the function works:
   ```bash
   supabase functions invoke submit_survey_with_patient --data '{...}'
   ```

3. Test through the frontend survey form

## Rollback Plan

If issues occur, use the rollback migration:
1. Rename `20250723160001_rollback_survey_submission_schema.sql.rollback` to `.sql`
2. Apply the rollback migration
3. Note: This may result in data loss for the new columns

## Future Recommendations

1. **Consistent Naming**: Ensure frontend and backend use the same field names
2. **Schema Validation**: Add tests that validate migration compatibility
3. **Data Format Standards**: Document expected data formats for all API endpoints
4. **Migration Testing**: Test migrations with actual data before deployment