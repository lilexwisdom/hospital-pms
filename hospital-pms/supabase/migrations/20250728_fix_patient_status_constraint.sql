-- Fix patient status constraint to include all status values

-- First, drop the existing constraint
ALTER TABLE patients DROP CONSTRAINT IF EXISTS patients_status_check;

-- Add the updated constraint with all status values
ALTER TABLE patients ADD CONSTRAINT patients_status_check 
CHECK (status IN (
  'pending',
  'active',
  'inactive',
  'consulted',
  'treatment_in_progress',
  'treatment_completed',
  'follow_up',
  'discharged'
));

-- Add comment explaining the status values
COMMENT ON COLUMN patients.status IS 'Patient status: pending, active, inactive, consulted, treatment_in_progress, treatment_completed, follow_up, discharged';