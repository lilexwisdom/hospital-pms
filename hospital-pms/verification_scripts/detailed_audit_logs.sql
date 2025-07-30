-- 더 자세한 UPDATE 로그 확인
SELECT 
    id,
    user_email,
    created_at,
    changed_fields,
    version_before,
    version_after,
    jsonb_pretty(old_values) as old_data,
    jsonb_pretty(new_values) as new_data
FROM audit_logs
WHERE table_name = 'patients'
    AND action = 'UPDATE'
    AND created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC
LIMIT 1;