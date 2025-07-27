-- Add disease flag columns to patients table

-- Add all disease flag columns
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS flag_hypertension BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS flag_diabetes BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS flag_hyperlipidemia BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS flag_anticoagulant BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS flag_asthma BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS flag_allergy BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS flag_cardiovascular BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS flag_pregnancy BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN patients.flag_hypertension IS '고혈압 여부';
COMMENT ON COLUMN patients.flag_diabetes IS '당뇨 여부';
COMMENT ON COLUMN patients.flag_hyperlipidemia IS '고지혈증 여부';
COMMENT ON COLUMN patients.flag_anticoagulant IS '항응고제/항혈소판제 복용 여부';
COMMENT ON COLUMN patients.flag_asthma IS '천식 여부';
COMMENT ON COLUMN patients.flag_allergy IS '특정 약물/음식 알러지 여부';
COMMENT ON COLUMN patients.flag_cardiovascular IS '뇌/심장 질환 여부';
COMMENT ON COLUMN patients.flag_pregnancy IS '임신 가능성 여부';

-- Create indexes for frequently queried flags
CREATE INDEX IF NOT EXISTS idx_patients_flag_hypertension ON patients(flag_hypertension) WHERE flag_hypertension = true;
CREATE INDEX IF NOT EXISTS idx_patients_flag_diabetes ON patients(flag_diabetes) WHERE flag_diabetes = true;
CREATE INDEX IF NOT EXISTS idx_patients_flag_cardiovascular ON patients(flag_cardiovascular) WHERE flag_cardiovascular = true;

-- Verify columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'patients' 
AND column_name LIKE 'flag_%'
ORDER BY column_name;