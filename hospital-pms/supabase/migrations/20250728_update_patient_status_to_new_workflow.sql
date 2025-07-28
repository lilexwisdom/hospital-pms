-- Update patient status constraint to new workflow states

-- First, drop the existing constraint
ALTER TABLE patients DROP CONSTRAINT IF EXISTS patients_status_check;

-- Add the updated constraint with new status values
ALTER TABLE patients ADD CONSTRAINT patients_status_check 
CHECK (status IN (
  'pending',                  -- 대기중 - BD 배정된 설문 작성 완료
  'active',                   -- 활성 - BD 상담 진행중
  'consulted',                -- 상담완료 - BD 상담 완료, CS 이관 대기
  'reservation_in_progress',  -- 예약상담중 - CS 예약 상담 진행
  'reservation_completed',    -- 예약완료 - 검사 예약 완료
  'examination_in_progress',  -- 검사중 - 검사 당일
  'examination_completed',    -- 검사완료 - 검사 종료
  'awaiting_results',         -- 검사결과 대기 - 결과 대기중
  'closed'                    -- 종결 - 모든 프로세스 완료
));

-- Update any existing status values that need to be migrated
-- Map old statuses to new ones
UPDATE patients 
SET status = 'closed' 
WHERE status IN ('inactive', 'discharged', 'follow_up', 'treatment_completed', 'treatment_in_progress');

-- Add comment explaining the new status values
COMMENT ON COLUMN patients.status IS 'Patient status in new workflow: pending (BD 배정된 설문 작성 완료), active (BD 상담 진행중), consulted (BD 상담 완료), reservation_in_progress (CS 예약상담중), reservation_completed (예약완료), examination_in_progress (검사중), examination_completed (검사완료), awaiting_results (검사결과 대기), closed (종결)';

-- Update status history table constraint if exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'patient_status_history' 
        AND column_name = 'from_status'
    ) THEN
        -- Drop existing constraints on status history if any
        ALTER TABLE patient_status_history DROP CONSTRAINT IF EXISTS patient_status_history_from_status_check;
        ALTER TABLE patient_status_history DROP CONSTRAINT IF EXISTS patient_status_history_to_status_check;
        
        -- Add new constraints
        ALTER TABLE patient_status_history ADD CONSTRAINT patient_status_history_from_status_check 
        CHECK (from_status IS NULL OR from_status IN (
          'pending', 'active', 'consulted', 'reservation_in_progress', 
          'reservation_completed', 'examination_in_progress', 
          'examination_completed', 'awaiting_results', 'closed'
        ));
        
        ALTER TABLE patient_status_history ADD CONSTRAINT patient_status_history_to_status_check 
        CHECK (to_status IN (
          'pending', 'active', 'consulted', 'reservation_in_progress', 
          'reservation_completed', 'examination_in_progress', 
          'examination_completed', 'awaiting_results', 'closed'
        ));
    END IF;
END $$;