-- patients 테이블의 RLS 정책 확인
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'patients'
ORDER BY policyname;

-- 테이블에 직접 INSERT 테스트 (간단한 데이터로)
-- 이 쿼리를 직접 실행해서 어떤 에러가 나는지 확인
/*
INSERT INTO patients (
    name, 
    encrypted_ssn, 
    ssn_hash, 
    email,
    status,
    created_by
) VALUES (
    'Test Patient Direct',
    '\x0123456789'::bytea,
    'test_hash_direct',
    'test@example.com',
    'pending',
    auth.uid()
) RETURNING id, name, email;
*/