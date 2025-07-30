# Task 6.5 검증 체크리스트 - Step 3: UPDATE 작업 감사 로그

## 테스트 시나리오

### 3.1 환자 정보 수정
1. 방금 생성한 환자의 상세 페이지로 이동
2. 다음 정보를 수정:
   - 전화번호: 010-1234-5678 → 010-9999-8888
   - 이메일: test1@example.com → updated@example.com
   - 상태: pending → consulted
3. 저장 버튼 클릭

### 3.2 감사 로그 확인 SQL
```sql
-- UPDATE 작업 감사 로그 확인
SELECT 
    id,
    table_name,
    action,
    user_id,
    user_email,
    created_at,
    old_values->>'phone' as old_phone,
    new_values->>'phone' as new_phone,
    old_values->>'email' as old_email,
    new_values->>'email' as new_email,
    old_values->>'status' as old_status,
    new_values->>'status' as new_status,
    changed_fields,
    version_before,
    version_after
FROM audit_logs
WHERE table_name = 'patients'
    AND action = 'UPDATE'
    AND created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC
LIMIT 5;
```

### 확인 사항
- [ ] UPDATE 로그가 생성되었는지
- [ ] changed_fields에 변경된 필드 목록이 있는지
- [ ] version이 1에서 2로 증가했는지
- [ ] old_values와 new_values가 올바른지

## 진행 방법
환자 상세 페이지의 URL은: `/patients/1ca4e3a5-fcff-451f-ac11-407d42eae4f4`
(위 ID는 방금 생성한 환자의 ID입니다)

정보를 수정하고 저장한 후 위 SQL을 실행해주세요.