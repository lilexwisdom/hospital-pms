-- Database Index Optimization for Performance
-- This migration adds additional indexes for common query patterns

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

-- Upcoming appointments for reminders
CREATE INDEX IF NOT EXISTS idx_appointments_upcoming_reminders ON appointments(scheduled_at) 
WHERE status = 'confirmed' AND reminder_sent = FALSE AND scheduled_at > NOW();

-- Unused survey tokens nearing expiry
CREATE INDEX IF NOT EXISTS idx_survey_tokens_expiring_soon ON survey_tokens(expires_at, created_by) 
WHERE used_at IS NULL AND expires_at > NOW() AND expires_at < NOW() + INTERVAL '24 hours';

-- Recent medical records for quick access
CREATE INDEX IF NOT EXISTS idx_medical_records_recent ON medical_records(patient_id, created_at DESC) 
WHERE created_at > NOW() - INTERVAL '6 months';

-- ============================================
-- 3. Function-based Indexes
-- ============================================

-- Case-insensitive name search
CREATE INDEX IF NOT EXISTS idx_patients_name_lower ON patients(LOWER(name));

-- Date-only index for appointments (ignoring time)
CREATE INDEX IF NOT EXISTS idx_appointments_date_only ON appointments(DATE(scheduled_at));

-- SSN hash index (already exists, but ensure it's optimal)
-- Note: ssn_hash already has unique constraint which creates an index

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

-- For large tables with time-based queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at_brin ON audit_logs USING BRIN (created_at);
CREATE INDEX IF NOT EXISTS idx_appointment_history_changed_at_brin ON appointment_status_history USING BRIN (changed_at);

-- ============================================
-- 6. Index Maintenance Commands
-- ============================================

-- Analyze tables to update statistics
ANALYZE profiles;
ANALYZE patients;
ANALYZE medical_records;
ANALYZE appointments;
ANALYZE survey_tokens;
ANALYZE survey_responses;
ANALYZE appointment_status_history;
ANALYZE audit_logs;

-- ============================================
-- 7. Create Index Usage Monitoring Function
-- ============================================

CREATE OR REPLACE FUNCTION get_index_usage_stats()
RETURNS TABLE (
  schemaname TEXT,
  tablename TEXT,
  indexname TEXT,
  index_size TEXT,
  idx_scan BIGINT,
  idx_tup_read BIGINT,
  idx_tup_fetch BIGINT,
  is_unique BOOLEAN,
  is_primary BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.schemaname::TEXT,
    s.tablename::TEXT,
    s.indexrelname::TEXT,
    pg_size_pretty(pg_relation_size(s.indexrelid))::TEXT,
    s.idx_scan,
    s.idx_tup_read,
    s.idx_tup_fetch,
    i.indisunique,
    i.indisprimary
  FROM pg_stat_user_indexes s
  JOIN pg_index i ON s.indexrelid = i.indexrelid
  WHERE s.schemaname = 'public'
  ORDER BY s.schemaname, s.tablename, s.indexrelname;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. Create Unused Index Detection Function
-- ============================================

CREATE OR REPLACE FUNCTION find_unused_indexes()
RETURNS TABLE (
  schemaname TEXT,
  tablename TEXT,
  indexname TEXT,
  index_size TEXT,
  created_days_ago INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.schemaname::TEXT,
    s.tablename::TEXT,
    s.indexrelname::TEXT,
    pg_size_pretty(pg_relation_size(s.indexrelid))::TEXT,
    NULL::INTEGER as created_days_ago -- Index creation time not available in standard PostgreSQL
  FROM pg_stat_user_indexes s
  WHERE s.schemaname = 'public'
  AND s.idx_scan = 0
  AND s.indexrelname NOT LIKE '%_pkey'
  AND s.indexrelname NOT LIKE '%_unique'
  ORDER BY pg_relation_size(s.indexrelid) DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. Create Query Performance Helper
-- ============================================

CREATE OR REPLACE FUNCTION explain_query_indexes(query_text TEXT)
RETURNS TABLE (
  plan_line TEXT
) AS $$
BEGIN
  RETURN QUERY
  EXECUTE 'EXPLAIN (ANALYZE, BUFFERS) ' || query_text;
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT 'Error: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions on monitoring functions
GRANT EXECUTE ON FUNCTION get_index_usage_stats TO authenticated;
GRANT EXECUTE ON FUNCTION find_unused_indexes TO authenticated;
GRANT EXECUTE ON FUNCTION explain_query_indexes TO authenticated;

-- ============================================
-- 10. Comments for Documentation
-- ============================================

COMMENT ON INDEX idx_patients_name_phone IS 'Composite index for patient search by name and phone';
COMMENT ON INDEX idx_appointments_scheduled_status IS 'Optimize appointment calendar queries';
COMMENT ON INDEX idx_appointments_active IS 'Partial index for active appointments only';
COMMENT ON INDEX idx_patients_address_gin IS 'GIN index for JSONB address field searches';
COMMENT ON INDEX idx_audit_logs_created_at_brin IS 'BRIN index for time-series audit log queries';

COMMENT ON FUNCTION get_index_usage_stats IS 'Monitor index usage statistics to identify heavily used or unused indexes';
COMMENT ON FUNCTION find_unused_indexes IS 'Identify indexes that have never been used and could be dropped';
COMMENT ON FUNCTION explain_query_indexes IS 'Helper to analyze query execution plans and index usage';