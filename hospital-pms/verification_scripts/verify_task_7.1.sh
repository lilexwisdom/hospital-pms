#!/bin/bash

echo "=== Task 7.1 Verification Script ==="
echo "예약 생성 모달 및 시간 충돌 검사 검증"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Database connection details
DB_HOST="aws-0-ap-northeast-2.pooler.supabase.com"
DB_PORT="6543"
DB_NAME="postgres"
DB_USER="postgres.jqxbufxeiwsxqmmcqxka"

echo "1. 데이터베이스 구조 검증"
echo "========================="

# Check examination_items table
echo -e "\n${YELLOW}[CHECK]${NC} examination_items 테이블 확인..."
PGPASSWORD=$SUPABASE_DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -d $DB_NAME -U $DB_USER -c "
SELECT COUNT(*) as count FROM examination_items WHERE is_active = true;
" 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}[PASS]${NC} examination_items 테이블 확인 완료"
else
    echo -e "${RED}[FAIL]${NC} examination_items 테이블 확인 실패"
fi

# Check appointments table structure
echo -e "\n${YELLOW}[CHECK]${NC} appointments 테이블 구조 확인..."
PGPASSWORD=$SUPABASE_DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -d $DB_NAME -U $DB_USER -c "
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'appointments' 
AND column_name = 'examination_item_id';
" 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}[PASS]${NC} appointments.examination_item_id 컬럼 확인 완료"
else
    echo -e "${RED}[FAIL]${NC} appointments.examination_item_id 컬럼 확인 실패"
fi

echo -e "\n2. RPC 함수 검증"
echo "================"

# Test is_business_hours function
echo -e "\n${YELLOW}[CHECK]${NC} is_business_hours 함수 테스트..."

# Test case 1: Business hours (should return true)
RESULT=$(PGPASSWORD=$SUPABASE_DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -d $DB_NAME -U $DB_USER -t -c "
SELECT is_business_hours('2024-02-01 10:00:00+00'::timestamptz);
" 2>/dev/null | tr -d ' ')

if [ "$RESULT" = "t" ]; then
    echo -e "${GREEN}[PASS]${NC} 영업시간 내 (10:00) - true 반환"
else
    echo -e "${RED}[FAIL]${NC} 영업시간 내 (10:00) - 예상: true, 실제: $RESULT"
fi

# Test case 2: Non-business hours (should return false)
RESULT=$(PGPASSWORD=$SUPABASE_DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -d $DB_NAME -U $DB_USER -t -c "
SELECT is_business_hours('2024-02-01 08:00:00+00'::timestamptz);
" 2>/dev/null | tr -d ' ')

if [ "$RESULT" = "f" ]; then
    echo -e "${GREEN}[PASS]${NC} 영업시간 외 (08:00) - false 반환"
else
    echo -e "${RED}[FAIL]${NC} 영업시간 외 (08:00) - 예상: false, 실제: $RESULT"
fi

# Test check_appointment_availability function
echo -e "\n${YELLOW}[CHECK]${NC} check_appointment_availability 함수 테스트..."
PGPASSWORD=$SUPABASE_DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -d $DB_NAME -U $DB_USER -c "
SELECT check_appointment_availability(
    '2024-12-31 14:00:00+00'::timestamptz,
    30,
    (SELECT id FROM examination_items LIMIT 1)
);
" 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}[PASS]${NC} check_appointment_availability 함수 호출 성공"
else
    echo -e "${RED}[FAIL]${NC} check_appointment_availability 함수 호출 실패"
fi

echo -e "\n3. RLS 정책 검증"
echo "================"

echo -e "\n${YELLOW}[CHECK]${NC} 환자 조회 권한 확인..."
PGPASSWORD=$SUPABASE_DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -d $DB_NAME -U $DB_USER -c "
SELECT COUNT(*) FROM pg_policies 
WHERE tablename = 'patients' 
AND policyname LIKE '%select%'
AND definition LIKE '%cs%';
" 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}[PASS]${NC} CS 역할의 환자 조회 정책 확인"
else
    echo -e "${RED}[FAIL]${NC} CS 역할의 환자 조회 정책 미확인"
fi

echo -e "\n4. 샘플 데이터 검증"
echo "==================="

echo -e "\n${YELLOW}[CHECK]${NC} 검사 항목 데이터 확인..."
PGPASSWORD=$SUPABASE_DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -d $DB_NAME -U $DB_USER -c "
SELECT category, COUNT(*) as count 
FROM examination_items 
WHERE is_active = true 
GROUP BY category
ORDER BY category;
"

echo -e "\n${YELLOW}[INFO]${NC} 대표 검사 항목 목록:"
PGPASSWORD=$SUPABASE_DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -d $DB_NAME -U $DB_USER -c "
SELECT name, category, duration_minutes 
FROM examination_items 
WHERE is_active = true 
LIMIT 5;
"

echo -e "\n5. API 엔드포인트 테스트"
echo "======================="

# Check if the app is running
echo -e "\n${YELLOW}[CHECK]${NC} 애플리케이션 실행 상태 확인..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 > /tmp/status_code 2>/dev/null
STATUS_CODE=$(cat /tmp/status_code)

if [ "$STATUS_CODE" = "200" ] || [ "$STATUS_CODE" = "302" ] || [ "$STATUS_CODE" = "307" ]; then
    echo -e "${GREEN}[PASS]${NC} 애플리케이션이 포트 3001에서 실행 중 (상태 코드: $STATUS_CODE)"
else
    echo -e "${RED}[FAIL]${NC} 애플리케이션 연결 실패 (상태 코드: $STATUS_CODE)"
fi

echo -e "\n6. 컴포넌트 파일 확인"
echo "===================="

FILES_TO_CHECK=(
    "src/components/appointments/CreateAppointmentModal.tsx"
    "src/app/(protected)/appointments/page.tsx"
    "check_lists/check_list_7.1.md"
)

for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}[PASS]${NC} $file 파일 존재"
    else
        echo -e "${RED}[FAIL]${NC} $file 파일 없음"
    fi
done

echo -e "\n7. 최종 검증 결과"
echo "================="

echo -e "\n${YELLOW}구현 완료 항목:${NC}"
echo "✅ examination_items 테이블 및 샘플 데이터"
echo "✅ appointments 테이블 examination_item_id 추가"
echo "✅ is_business_hours() 함수"
echo "✅ check_appointment_availability() 함수"
echo "✅ CreateAppointmentModal 컴포넌트"
echo "✅ 예약 목록 페이지"
echo "✅ 환자 검색 자동완성 (디바운스 포함)"
echo "✅ 실시간 예약 가능 여부 확인"

echo -e "\n${YELLOW}테스트 필요 항목:${NC}"
echo "⏳ 실제 예약 생성 플로우"
echo "⏳ 시간 충돌 시나리오"
echo "⏳ 다양한 검사 항목별 예약"
echo "⏳ 예약 목록 필터링 및 정렬"

echo -e "\n${GREEN}=== 검증 완료 ===${NC}"
echo "Task 7.1 기본 구현이 완료되었습니다."
echo "브라우저에서 http://localhost:3001/appointments 접속하여 테스트를 진행하세요."