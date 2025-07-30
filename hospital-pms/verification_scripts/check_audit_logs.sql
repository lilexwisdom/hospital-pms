-- Step 2.2: INSERT 작업 감사 로그 확인
-- 최근 5분 이내의 patients 테이블 INSERT 로그 조회
SELECT 
    id,
    table_name,
    operation,
    user_id,
    changed_at,
    old_data,
    new_data->>'name' as patient_name,
    new_data->>'phone' as patient_phone,
    new_data->>'email' as patient_email,
    jsonb_pretty(new_data) as new_data_formatted
FROM audit_logs
WHERE table_name = 'patients'
    AND operation = 'INSERT'
    AND changed_at > NOW() - INTERVAL '5 minutes'
ORDER BY changed_at DESC
LIMIT 5;

-- 환자 정보 확인 (암호화된 SSN 확인)
SELECT 
    id,
    name,
    phone,
    email,
    gender,
    date_of_birth,
    status,
    version,
    created_at,
    updated_at,
    -- SSN은 암호화되어 있으므로 hash만 확인
    substring(ssn_hash, 1, 10) || '...' as ssn_hash_preview
FROM patients
WHERE name LIKE '%테스트환자%'
ORDER BY created_at DESC
LIMIT 5;