-- Supabase SQL Editor에서 실행할 쿼리들

-- 1. 사용자 확인
SELECT id, email, created_at, last_sign_in_at 
FROM auth.users 
WHERE email IN ('grsurgeon001@gmail.com', 'lilexwisdom@gmail.com');

-- 2. 특정 사용자의 비밀번호를 직접 업데이트하는 함수
-- 주의: 이 방법은 개발 환경에서만 사용하세요
-- Supabase는 auth.users 테이블의 직접 수정을 허용하지 않으므로
-- 대신 다음과 같은 방법을 사용해야 합니다:

-- 옵션 1: 임시 비밀번호로 강제 설정 (Service Role Key 필요)
-- 이는 Supabase 대시보드의 SQL Editor에서는 실행할 수 없습니다.

-- 옵션 2: 최근 이메일 로그 확인
SELECT 
  id,
  user_id,
  created_at,
  data->>'email' as email,
  data->>'action' as action
FROM auth.audit_log_entries
WHERE data->>'action' = 'user_recovery_requested'
ORDER BY created_at DESC
LIMIT 10;

-- 옵션 3: Rate limit 상태 확인 (가능한 경우)
-- Supabase는 rate limit 정보를 직접 제공하지 않지만
-- 최근 요청 횟수를 확인할 수 있습니다
SELECT 
  COUNT(*) as request_count,
  DATE_TRUNC('hour', created_at) as hour
FROM auth.audit_log_entries
WHERE data->>'action' = 'user_recovery_requested'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;