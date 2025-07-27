-- Reset script: 기존 스키마 초기화 후 마이그레이션 실행
-- 주의: 이 스크립트는 모든 데이터를 삭제합니다!

-- 1. 기존 객체들 삭제
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS survey_responses CASCADE;
DROP TABLE IF EXISTS survey_tokens CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS encrypt_ssn(text) CASCADE;
DROP FUNCTION IF EXISTS decrypt_ssn(bytea) CASCADE;
DROP FUNCTION IF EXISTS search_patient_by_ssn(text) CASCADE;
DROP FUNCTION IF EXISTS mask_ssn(text) CASCADE;
DROP FUNCTION IF EXISTS validate_survey_token(uuid) CASCADE;
DROP FUNCTION IF EXISTS complete_survey_response(uuid) CASCADE;

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS patient_status CASCADE;
DROP TYPE IF EXISTS survey_status CASCADE;
DROP TYPE IF EXISTS appointment_status CASCADE;

-- 2. 이제 첫 번째 마이그레이션 실행
-- 아래에 20250718120829_create_user_profiles_schema.sql 내용을 붙여넣으세요