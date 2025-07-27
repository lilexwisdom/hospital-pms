-- Fixed Database Index Optimization
-- Removed indexes with NOW() function which is not IMMUTABLE

-- ============================================
-- 1. Composite Indexes for Common Queries
-- ============================================

-- Patients table: Common search patterns
CREATE INDEX IF NOT EXISTS idx_patients_name_phone ON patients(name, phone);
CREATE INDEX IF NOT EXISTS idx_patients_created_by_created_at ON patients(created_by, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_patients_cs_manager_created_at ON patients(cs_manager, created_at DESC);

-- Appointments table: Calendar and status queries
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_status ON appointments(scheduled_at, status);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_scheduled ON appointments(patient_id, scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_assigned_scheduled ON appointments(assigned_to, scheduled_at) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_created_by_status ON appointments(created_by, status);

-- Survey tokens: Active token lookups
CREATE INDEX IF NOT EXISTS idx_survey_tokens_token_expires ON survey_tokens(token, expires_at) WHERE used_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_survey_tokens_created_by_used ON survey_tokens(created_by, used_at);

-- Medical records: Patient history queries
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_date ON medical_records(patient_id, record_date DESC);
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_type ON medical_records(patient_id, record_type);

-- ============================================
-- 2. Partial Indexes for Filtered Queries
-- ============================================

-- Active appointments (not cancelled or completed)
CREATE INDEX IF NOT EXISTS idx_appointments_active ON appointments(scheduled_at, patient_id) 
WHERE status IN ('pending', 'confirmed');

-- Appointments without reminders sent
CREATE INDEX IF NOT EXISTS idx_appointments_pending_reminders ON appointments(scheduled_at, status) 
WHERE reminder_sent = FALSE;

-- Unused survey tokens
CREATE INDEX IF NOT EXISTS idx_survey_tokens_unused ON survey_tokens(expires_at, created_by) 
WHERE used_at IS NULL;

-- ============================================
-- 3. Function-based Indexes
-- ============================================

-- Case-insensitive name search
CREATE INDEX IF NOT EXISTS idx_patients_name_lower ON patients(LOWER(name));

-- Date-only index for appointments (ignoring time)
CREATE INDEX IF NOT EXISTS idx_appointments_date_only ON appointments(DATE(scheduled_at));

-- ============================================
-- 4. GIN Indexes for JSONB Fields
-- ============================================

-- Patient address searches
CREATE INDEX IF NOT EXISTS idx_patients_address_gin ON patients USING GIN (address);

-- Survey response data searches
CREATE INDEX IF NOT EXISTS idx_survey_responses_data_gin ON survey_responses USING GIN (responses);

-- Medical record metadata searches
CREATE INDEX IF NOT EXISTS idx_medical_records_metadata_gin ON medical_records USING GIN (metadata);

-- ============================================
-- 5. BRIN Indexes for Time-series Data
-- ============================================

-- For large time-series tables, BRIN indexes are more efficient
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_brin ON appointments USING BRIN (scheduled_at);
CREATE INDEX IF NOT EXISTS idx_medical_records_created_brin ON medical_records USING BRIN (created_at);
CREATE INDEX IF NOT EXISTS idx_patients_created_brin ON patients USING BRIN (created_at);

-- ============================================
-- 6. Unique Indexes for Business Rules
-- ============================================

-- Ensure one active token per patient email
CREATE UNIQUE INDEX IF NOT EXISTS idx_survey_tokens_unique_active_email 
ON survey_tokens(patient_email) 
WHERE used_at IS NULL AND patient_email IS NOT NULL;

-- ============================================
-- 7. Index Maintenance Commands
-- ============================================

-- Analyze tables to update statistics
ANALYZE profiles;
ANALYZE patients;
ANALYZE medical_records;
ANALYZE survey_tokens;
ANALYZE survey_responses;
ANALYZE appointments;
ANALYZE appointment_status_history;

-- Optional: VACUUM to reclaim space (run separately if needed)
-- VACUUM ANALYZE;