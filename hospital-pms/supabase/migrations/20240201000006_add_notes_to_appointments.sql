-- Add notes column to appointments table
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add comment
COMMENT ON COLUMN appointments.notes IS 'Optional notes for the appointment';