# Task 6.5 검증 체크리스트 - Step 5: 낙관적 잠금 테스트

## 낙관적 잠금(Optimistic Locking)이란?
- 두 사용자가 동시에 같은 데이터를 수정할 때 충돌을 방지하는 기술
- version 번호를 사용하여 데이터가 변경되었는지 확인
- 나중에 저장하려는 사용자에게 경고 메시지 표시

## 테스트 시나리오

### 5.1 동시 편집 시뮬레이션
1. **브라우저 1 (Chrome)**:
   - 환자 상세 페이지 열기: `/patients/1ca4e3a5-fcff-451f-ac11-407d42eae4f4`
   - "정보 수정" 버튼 클릭
   - 수정 페이지를 열어두고 **아직 저장하지 않음**

2. **브라우저 2 (Edge 또는 시크릿 모드)**:
   - 같은 환자 페이지 열기
   - "정보 수정" 버튼 클릭
   - 전화번호를 다른 값으로 변경 (예: 010-7777-7777)
   - **저장** 버튼 클릭 (성공해야 함)

3. **브라우저 1로 돌아가서**:
   - 전화번호를 또 다른 값으로 변경 (예: 010-8888-8888)
   - **저장** 버튼 클릭
   - 오류 메시지가 나타나야 함: "다른 사용자가 이미 수정했습니다. 페이지를 새로고침해주세요."

### 5.2 확인 SQL
```sql
-- version 변경 이력 확인
SELECT 
    id,
    action,
    user_email,
    created_at,
    new_values->>'name' as patient_name,
    version_before,
    version_after,
    changed_fields
FROM audit_logs
WHERE table_name = 'patients'
    AND record_id = '1ca4e3a5-fcff-451f-ac11-407d42eae4f4'
    AND action = 'UPDATE'
ORDER BY created_at DESC
LIMIT 5;
```

### 확인 사항
- [ ] 첫 번째 저장은 성공하고 version이 증가
- [ ] 두 번째 저장 시도는 실패하고 오류 메시지 표시
- [ ] 감사 로그에 첫 번째 수정만 기록됨
- [ ] version 번호가 순차적으로 증가함

## 테스트 결과 기록
1. 첫 번째 저장 시 version: ___ → ___
2. 두 번째 저장 시도 결과: _______________
3. 오류 메시지 내용: _______________