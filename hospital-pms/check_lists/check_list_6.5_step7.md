# Task 6.5 검증 체크리스트 - Step 7: 권한 및 보안 테스트

## 테스트 시나리오

### 7.1 감사 로그 접근 권한 테스트
1. **관리자(Admin) 계정**:
   - `/admin/audit-logs` 접근 가능 ✅
   - 모든 감사 로그 조회 가능 ✅

2. **매니저(Manager) 계정**:
   - `/admin/audit-logs` 접근 가능해야 함
   - 모든 감사 로그 조회 가능해야 함

3. **CS/BD 계정**:
   - `/admin/audit-logs` 접근 불가 (Unauthorized 페이지로 리다이렉트)
   - 감사 로그 조회 불가

### 7.2 RLS 정책 확인
```sql
-- 감사 로그 RLS 정책 확인
SELECT 
    policyname,
    cmd,
    roles,
    qual
FROM pg_policies
WHERE tablename = 'audit_logs'
ORDER BY policyname;

-- 현재 사용자로 감사 로그 조회 시도
SELECT count(*) as visible_logs
FROM audit_logs;
```

### 7.3 민감한 데이터 보호 확인
1. **암호화된 SSN**:
   - 감사 로그에 encrypted_ssn이 포함되지 않음 ✅
   - DELETE 시 old_values에도 encrypted_ssn 제외됨 ✅

2. **metadata 정보**:
   - IP 주소, User Agent 등이 기록되는지 확인

### 7.4 감사 로그 무결성 테스트
```sql
-- 감사 로그 수정 시도 (실패해야 함)
UPDATE audit_logs 
SET user_email = 'hacker@example.com'
WHERE id = (SELECT id FROM audit_logs LIMIT 1);

-- 감사 로그 삭제 시도 (실패해야 함)
DELETE FROM audit_logs 
WHERE id = (SELECT id FROM audit_logs LIMIT 1);

-- 감사 로그 직접 삽입 시도 (실패해야 함)
INSERT INTO audit_logs (
    user_id, action, table_name, record_id
) VALUES (
    auth.uid(), 'FAKE', 'patients', gen_random_uuid()
);
```

### 확인 사항
- [ ] Admin과 Manager만 감사 로그 조회 가능
- [ ] CS/BD는 감사 로그 페이지 접근 불가
- [ ] 감사 로그 수정/삭제/직접삽입 모두 불가
- [ ] 민감한 데이터(encrypted_ssn)가 로그에서 제외됨

## 추가 보안 검증
1. **크로스 사용자 데이터 접근**:
   - 다른 사용자가 생성한 환자 정보 수정 권한
   - 역할별 적절한 권한 분리

2. **SQL Injection 방지**:
   - 필터링 입력값이 안전하게 처리되는지
   - 페이지네이션 파라미터 검증