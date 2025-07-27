# 프로젝트 설정 체크리스트

## 📋 현재 진행 상황

### ✅ 완료된 작업 (코드 레벨)

- [x] Task 2.2: 사용자 프로필 및 역할 시스템
- [x] Task 2.3: 환자 테이블 (SSN 암호화 포함)
- [x] Task 2.4: 설문 및 예약 시스템
- [x] Task 2.5: RLS 정책 구현
- [x] Task 2.6: DB 인덱스 최적화 및 Supabase 클라이언트
- [x] Task 3.1: Auth 설정 가이드 및 유틸리티

### ⏳ 대기 중 (실제 설정 필요)

- [x] Supabase 프로젝트 생성
- [x] 환경 변수 설정
- [ ] 데이터베이스 마이그레이션
- [ ] Auth 대시보드 구성
- [ ] 초기 데이터 설정

---

## 🚀 즉시 해야 할 작업들

### 1. Supabase 프로젝트 생성 (10분)

1. [Supabase](https://app.supabase.com) 접속
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   ```
   Name: hospital-pms
   Database Password: [강력한 비밀번호 생성]
   Region: Northeast Asia (Seoul)
   ```
4. 프로젝트 생성 완료 후 대시보드에서:
   - Project URL 복사
   - Anon Key 복사
   - Service Role Key 복사

### 2. 환경 변수 설정 (5분)

```bash
cd /workspace/tm_cc_HPMS/hospital-pms
cp .env.example .env.local
```

`.env.local` 파일 편집:

```env
# Supabase에서 복사한 값들
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# 나머지는 기본값 유지
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SESSION_TIMEOUT=28800000
```

### 3. 데이터베이스 마이그레이션 (15분)

#### 옵션 A: Supabase CLI 사용 (권장)

```bash
# Supabase CLI 설치
npm install -g supabase

# 프로젝트 연결
cd /workspace/tm_cc_HPMS
supabase link --project-ref [your-project-ref]

# 마이그레이션 실행
supabase db push
```

#### 옵션 B: SQL 직접 실행

1. Supabase Dashboard → SQL Editor
2. 다음 순서로 마이그레이션 파일 실행:
   ```
   1. 20250718120829_create_user_profiles_schema.sql
   2. 20250718122002_create_patient_tables_with_encryption.sql
   3. 20250718122146_add_patient_helper_functions.sql
   4. 20250718122825_create_survey_appointment_tables.sql
   5. 20250718124654_enhance_rls_policies_and_permissions.sql
   6. 20250718125529_optimize_database_indexes.sql
   ```

### 4. Auth 설정 (10분)

[상세 가이드](/workspace/tm_cc_HPMS/docs/SUPABASE_AUTH_CONFIGURATION.md) 참조

주요 설정:

1. **Authentication → Providers**

   - Email 활성화
   - Email confirmation 활성화

2. **Authentication → Settings**

   - Session duration: 28800
   - Password requirements 모두 체크

3. **Authentication → Email Templates**
   - `/hospital-pms/src/config/email-templates/auth-emails.ts`에서 템플릿 복사

### 5. 초기 관리자 생성 (5분)

```bash
cd /workspace/tm_cc_HPMS
node scripts/create-admin-user.js
```

또는 seed 파일 실행:

```bash
supabase db seed
```

---

## 🧪 설정 검증

### 연결 테스트 실행

```bash
cd /workspace/tm_cc_HPMS/hospital-pms
npm run test:connection
```

### 수동 검증 체크리스트

- [ ] Supabase 대시보드에서 테이블 생성 확인
- [ ] RLS 정책 활성화 확인
- [ ] Auth 이메일 템플릿 설정 확인
- [ ] 관리자 계정으로 로그인 가능 확인

---

## 📊 진행 상황별 점검 시점

### 지금 (Task 3.1 완료)

✅ **필수**: Supabase 설정, DB 마이그레이션
✅ **권장**: 연결 테스트, 타입 생성
⏸️ **선택**: UI 개발은 아직 불필요

### Task 3 완료 후 (인증 시스템)

- 로그인/로그아웃 플로우
- 세션 관리
- 권한 체크

### Task 4 완료 후 (핵심 UI)

- 전체 사용자 경험
- 성능 최적화
- 프로덕션 준비

---

## 🆘 문제 해결

### "Connection refused" 오류

```bash
# 환경 변수 확인
cat .env.local | grep SUPABASE

# URL과 키가 올바른지 확인
```

### 마이그레이션 실패

```sql
-- Supabase SQL Editor에서 확인
SELECT * FROM information_schema.tables
WHERE table_schema = 'public';
```

### RLS 정책 오류

```sql
-- RLS 활성화 확인
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

---

## 📝 다음 단계

1. **즉시**: 위 체크리스트 완료 (약 45분)
2. **오늘 중**: 기본 연결 테스트
3. **이번 주**: Task 3.2~3.5 진행 (로그인 페이지 등)
4. **다음 주**: UI 개발 시작

---

## 💡 팁

- 프로젝트 Reference ID는 Supabase URL에서 확인 가능
  예: `https://xxxxx.supabase.co`에서 `xxxxx` 부분
- 개발 중에는 RLS를 일시적으로 비활성화할 수 있음 (보안 주의)
- 타입 자동 생성: `npm run supabase:types`
