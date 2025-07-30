-- patients 테이블의 현재 구조 확인
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'patients'
ORDER BY ordinal_position;