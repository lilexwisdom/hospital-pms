# Task 6.5 검증 체크리스트 - Step 2: INSERT 작업 감사 로그

## ✅ 완료된 항목

### 2.1 새 환자 등록
- [x] 환자 정보 입력 완료
  - 이름: 테스트환자1
  - 주민등록번호: 900101-1234567
  - 전화번호: 010-1234-5678
  - 이메일: test1@example.com
  - 성별: 남성
  - 생년월일: 1990-01-01
  - 주소: 서울시 강남구
  - 상세주소: 테스트동 123
  - 비상연락처: 테스트보호자 (010-8765-4321, 배우자)
- [x] 환자 등록 성공 (ID로 리다이렉트됨)

### 2.2 감사 로그 확인 필요
다음 SQL 쿼리를 실행하여 감사 로그를 확인하세요:

```sql
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
```

### 확인 사항
- [ ] audit_logs 테이블에 INSERT 레코드 생성 확인
- [ ] new_data에 환자 정보가 올바르게 저장되었는지 확인
- [ ] user_id가 현재 로그인한 사용자와 일치하는지 확인
- [ ] version 컬럼이 1로 설정되었는지 확인

## 다음 단계
SQL 쿼리 실행 결과를 공유해주시면 Step 3 (UPDATE 작업 테스트)로 진행하겠습니다.