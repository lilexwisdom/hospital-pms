# Task 6.5 검증 체크리스트 - Step 4: DELETE 작업 감사 로그

## 테스트 시나리오

### 4.1 테스트용 환자 생성
1. `/patients/new`로 이동
2. 다음 정보로 새 환자 생성:
   - 이름: 삭제테스트환자
   - 주민등록번호: 900102-2345678
   - 전화번호: 010-9999-9999
   - 이메일: delete-test@example.com
   - 성별: 남성
   - 생년월일: 1990-01-02

### 4.2 환자 삭제
1. 생성된 환자의 상세 페이지로 이동
2. 우측 상단의 점 3개 메뉴 클릭
3. "삭제" 클릭
4. 확인 대화상자에서 "확인" 클릭

### 4.3 감사 로그 확인 SQL
```sql
-- DELETE 작업 감사 로그 확인
SELECT 
    id,
    table_name,
    action,
    user_id,
    user_email,
    user_role,
    created_at,
    old_values->>'name' as deleted_patient_name,
    old_values->>'phone' as deleted_patient_phone,
    old_values->>'status' as deleted_patient_status,
    version_before
FROM audit_logs
WHERE table_name = 'patients'
    AND action = 'DELETE'
    AND created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC
LIMIT 5;
```

### 확인 사항
- [ ] DELETE 로그가 생성되었는지
- [ ] old_values에 삭제된 환자 정보가 기록되었는지
- [ ] version_before가 기록되었는지
- [ ] 삭제 후 환자 목록으로 리다이렉트되는지

### 참고사항
- RLS 정책에 따라 admin 권한만 삭제 가능
- 삭제된 데이터는 audit_logs의 old_values에 보존됨
- encrypted_ssn은 감사 로그에서 제외됨