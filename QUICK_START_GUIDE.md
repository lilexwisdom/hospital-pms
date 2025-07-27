# 🚀 Hospital PMS Quick Start Guide

병원 환자 관리 시스템을 빠르게 시작하는 가이드입니다.

## ⚠️ 중요 사항
- 실제 애플리케이션 코드는 `hospital-pms/` 디렉토리 내에 있습니다
- 모든 명령어는 `hospital-pms/` 디렉토리에서 실행해야 합니다

## 📋 Prerequisites

- Node.js 18+ 설치
- Git 설치
- Supabase 계정

## 🏃‍♂️ 5분 안에 시작하기

### 1. Supabase 프로젝트 생성 (2분)

1. [app.supabase.com](https://app.supabase.com) 접속
2. "New Project" 클릭
3. 설정:
   ```
   Name: hospital-pms
   Password: [강력한 비밀번호]
   Region: Northeast Asia (Seoul)
   ```

### 2. 코드 클론 및 설정 (1분)

```bash
# 프로젝트 클론
git clone [your-repo-url]
cd tm_cc_HPMS/hospital-pms

# 환경 변수 설정
cp .env.example .env.local
```

### 3. 환경 변수 입력 (1분)

`.env.local` 편집:

```env
NEXT_PUBLIC_SUPABASE_URL=[Supabase 대시보드에서 복사]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[Supabase 대시보드에서 복사]
SUPABASE_SERVICE_ROLE_KEY=[Settings > API에서 복사]
```

### 4. 데이터베이스 설정 (1분)

```bash
# Supabase CLI 설치 (처음 한 번만)
npm install -g supabase

# 프로젝트 연결
cd ..  # tm_cc_HPMS 디렉토리로
supabase link --project-ref [your-project-ref]

# 마이그레이션 실행
supabase db push
```

## 🧪 설정 확인

```bash
# 연결 테스트
cd hospital-pms
npm run test:connection

# 데이터베이스 검증
npm run test:db
```

## 👤 관리자 계정 생성

```bash
npm run setup:admin
# 이메일: admin@hospital.com
# 비밀번호: Admin123!@#
```

## 🔐 Auth 대시보드 설정

1. Supabase Dashboard > Authentication > Providers
   - Email 활성화
2. Authentication > Settings
   - Session duration: 28800
   - 모든 Password requirements 체크

## 🎉 개발 시작

```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속

## 📁 프로젝트 구조

```
tm_cc_HPMS/
├── hospital-pms/          # Next.js 앱
│   ├── src/
│   │   ├── app/          # App Router 페이지
│   │   ├── components/   # React 컴포넌트
│   │   ├── lib/          # 유틸리티
│   │   │   ├── supabase/ # Supabase 클라이언트
│   │   │   ├── auth/     # 인증 헬퍼
│   │   │   ├── appointments/ # 예약 서비스
│   │   │   ├── patients/     # 환자 서비스
│   │   │   └── surveys/      # 설문 서비스
│   │   └── config/       # 설정 파일
│   ├── scripts/          # 유틸리티 스크립트
│   │   ├── test-connection.js
│   │   ├── verify-database.js
│   │   ├── create-admin-user.js
│   │   └── setup-supabase.sh
│   ├── supabase/
│   │   └── migrations/   # DB 마이그레이션
│   └── .env.local        # 환경 변수
├── docs/                 # 프로젝트 문서
├── .taskmaster/          # Task Master 설정
└── .env                  # Task Master API 키

```

## 🛠️ 주요 명령어

| 명령어                    | 설명                 |
| ------------------------- | -------------------- |
| `npm run dev`             | 개발 서버 시작       |
| `npm run build`           | 프로덕션 빌드        |
| `npm run test:connection` | Supabase 연결 테스트 |
| `npm run test:db`         | DB 구조 검증         |
| `npm run setup:admin`     | 관리자 계정 생성     |
| `npm run supabase:types`  | TypeScript 타입 생성 |

## 🔍 문제 해결

### "Connection refused" 오류

```bash
# 환경 변수 확인
cat .env.local | grep SUPABASE
```

### 마이그레이션 실패

```bash
# 수동으로 SQL 실행
# Supabase Dashboard > SQL Editor에서
# supabase/migrations/ 폴더의 파일들을 순서대로 실행
```

### 타입 오류

```bash
# 타입 재생성
npm run supabase:types
```

## 📚 다음 단계

1. **인증 페이지 구현** (Task 3.2-3.5)

   - 로그인/회원가입
   - 프로필 관리
   - 비밀번호 재설정

2. **대시보드 구현** (Task 4.1-4.3)

   - 역할별 대시보드
   - 통계 위젯
   - 빠른 작업

3. **환자 관리** (Task 4.4-4.9)
   - 환자 목록/검색
   - 상세 정보 관리
   - 의료 기록

## 🤝 도움말

- **문서**: `/docs` 폴더 참조
- **Task 목록**: `task-master list`
- **다음 작업**: `task-master next`

## ⚡ Pro Tips

1. **개발 중 RLS 비활성화** (주의!)

   ```sql
   -- Supabase SQL Editor에서
   ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
   ```

2. **빠른 타입 체크**

   ```bash
   npm run type-check
   ```

3. **실시간 로그 확인**
   - Supabase Dashboard > Logs > API logs

---

준비되셨나요? 🎯 `npm run dev`로 시작하세요!
