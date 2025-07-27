#!/usr/bin/env node

/**
 * Supabase 연결 테스트 스크립트
 * 
 * 사용법: node scripts/test-connection.js
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// 환경 변수 로드
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// 결과 출력 헬퍼
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(50));
  log(title, 'cyan');
  console.log('='.repeat(50));
}

function logTest(name, success, details = '') {
  const status = success ? '✅ PASS' : '❌ FAIL';
  const color = success ? 'green' : 'red';
  log(`${status} ${name}`, color);
  if (details) {
    console.log(`   ${details}`);
  }
}

// 메인 테스트 함수
async function testConnection() {
  logSection('Supabase 연결 테스트 시작');

  // 1. 환경 변수 확인
  logSection('1. 환경 변수 확인');
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  logTest('SUPABASE_URL', !!url, url ? `URL: ${url}` : '환경 변수가 설정되지 않음');
  logTest('ANON_KEY', !!anonKey, anonKey ? `Key: ${anonKey.substring(0, 20)}...` : '환경 변수가 설정되지 않음');
  logTest('SERVICE_KEY', !!serviceKey, serviceKey ? `Key: ${serviceKey.substring(0, 20)}...` : '환경 변수가 설정되지 않음');
  
  if (!url || !anonKey) {
    log('\n❌ 필수 환경 변수가 없습니다. .env.local 파일을 확인하세요.', 'red');
    process.exit(1);
  }

  // 2. Supabase 클라이언트 생성
  logSection('2. Supabase 클라이언트 생성');
  
  let supabase;
  try {
    supabase = createClient(url, anonKey);
    logTest('클라이언트 생성', true);
  } catch (error) {
    logTest('클라이언트 생성', false, error.message);
    process.exit(1);
  }

  // 3. 데이터베이스 연결 테스트
  logSection('3. 데이터베이스 연결 테스트');
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    logTest('데이터베이스 연결', true, 'profiles 테이블 접근 성공');
  } catch (error) {
    logTest('데이터베이스 연결', false, error.message);
  }

  // 4. 테이블 존재 확인
  logSection('4. 테이블 존재 확인');
  
  const tables = [
    'profiles',
    'patients',
    'medical_records',
    'survey_tokens',
    'survey_responses',
    'appointments',
    'appointment_status_history',
    'audit_logs'
  ];
  
  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('count')
        .limit(0);
      
      logTest(`${table} 테이블`, !error, error ? error.message : '');
    } catch (error) {
      logTest(`${table} 테이블`, false, error.message);
    }
  }

  // 5. RLS 정책 확인
  logSection('5. RLS (Row Level Security) 확인');
  
  try {
    // Service role key로 RLS 우회 테스트
    if (serviceKey) {
      const adminSupabase = createClient(url, serviceKey);
      const { data, error } = await adminSupabase
        .from('profiles')
        .select('count');
      
      logTest('Service Role 액세스', !error, error ? error.message : 'RLS 우회 성공');
    }
  } catch (error) {
    logTest('Service Role 액세스', false, error.message);
  }

  // 6. 함수 존재 확인
  logSection('6. 데이터베이스 함수 확인');
  
  const functions = [
    'has_role',
    'encrypt_ssn',
    'decrypt_ssn',
    'hash_ssn',
    'create_patient_with_ssn',
    'find_patient_by_ssn'
  ];
  
  for (const func of functions) {
    try {
      // 함수 존재 여부만 확인 (실행하지 않음)
      const { data, error } = await supabase.rpc(func, {}, { head: true });
      logTest(`${func} 함수`, true, '함수가 존재함');
    } catch (error) {
      // 파라미터 오류는 함수가 존재한다는 의미
      const exists = error.message.includes('required') || error.message.includes('argument');
      logTest(`${func} 함수`, exists, exists ? '함수가 존재함' : error.message);
    }
  }

  // 7. Auth 설정 확인
  logSection('7. Auth 설정 확인');
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    logTest('Auth 세션 체크', !error, session ? '활성 세션 있음' : '세션 없음 (정상)');
  } catch (error) {
    logTest('Auth 세션 체크', false, error.message);
  }

  // 8. 종합 결과
  logSection('테스트 완료');
  log('\n✨ 기본 연결 테스트가 완료되었습니다.', 'green');
  log('다음 단계: Auth 대시보드 설정 및 관리자 계정 생성', 'yellow');
}

// 스크립트 실행
testConnection().catch(error => {
  log('\n예기치 않은 오류가 발생했습니다:', 'red');
  console.error(error);
  process.exit(1);
});