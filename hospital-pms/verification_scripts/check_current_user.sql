-- 현재 로그인한 사용자 정보 확인
SELECT 
    auth.uid() as current_user_id,
    p.email,
    p.role,
    p.name
FROM profiles p
WHERE p.id = auth.uid();

-- has_role 함수 테스트
SELECT 
    has_role('bd'),
    has_role('admin'),
    has_role('cs'),
    has_role('manager');

-- 직접 INSERT 테스트 (더 간단한 버전)
INSERT INTO patients (
    name, 
    encrypted_ssn, 
    ssn_hash, 
    created_by
) VALUES (
    'Test Patient Min',
    '\x0123456789'::bytea,
    'test_hash_min_' || now(),
    auth.uid()
) RETURNING id, name, created_by;