-- Test script to verify survey submission works correctly

-- Test data matching what the frontend sends
WITH test_data AS (
  SELECT 
    'test-token-uuid'::TEXT as token,
    jsonb_build_object(
      'name', '테스트 환자',
      'date_of_birth', '1990-01-01',
      'gender', 'male',
      'phone', '010-1234-5678',
      'email', 'test@example.com',
      'address', jsonb_build_object(
        'street', '서울시 강남구 테스트로 123',
        'detail', '101동 202호',
        'postal_code', '12345'
      ),
      'emergency_contact', jsonb_build_object(
        'phone', '010-9876-5432',
        'relation', '배우자'
      ),
      'flag_hypertension', true,
      'flag_diabetes', false,
      'flag_hyperlipidemia', false,
      'flag_anticoagulant', false,
      'flag_asthma', false,
      'flag_allergy', true,
      'flag_cardiovascular', false,
      'flag_pregnancy', false
    ) as patient_data,
    '123456-1234567' as ssn,
    jsonb_build_object(
      'personal_info', jsonb_build_object(
        'name', '테스트 환자',
        'birthDate', '1990-01-01',
        'gender', 'male'
      ),
      'contact_info', jsonb_build_object(
        'phone', '010-1234-5678',
        'email', 'test@example.com',
        'address', '서울시 강남구 테스트로 123',
        'addressDetail', '101동 202호',
        'postalCode', '12345'
      ),
      'medical_info', jsonb_build_object(
        'diseases', jsonb_build_object(
          'hypertension', true,
          'diabetes', false,
          'hyperlipidemia', false,
          'anticoagulant', false,
          'asthma', false,
          'allergy', true,
          'cardiovascular', false,
          'pregnancy', false,
          'none', false
        ),
        'hasAllergies', true,
        'allergies', '땅콩 알레르기',
        'hasMedications', true,
        'medications', '혈압약 복용중',
        'hasMedicalHistory', true,
        'medicalHistory', '2020년 맹장수술',
        'emergencyContact', '010-9876-5432',
        'emergencyRelation', '배우자'
      ),
      'examinations', jsonb_build_object(
        'heart', true,
        'endoscopy', true,
        'ct', false,
        'mri', false,
        'other', false
      ),
      'agreements', jsonb_build_object(
        'privacy', true,
        'medical', true,
        'agreedAt', '2025-01-23T12:00:00Z'
      )
    ) as survey_responses,
    jsonb_build_object(
      'allergies', '땅콩 알레르기',
      'medications', '혈압약 복용중',
      'medical_history', '2020년 맹장수술'
    ) as medical_data
)
SELECT 
  token,
  patient_data,
  ssn,
  survey_responses,
  medical_data
FROM test_data;

-- To actually test the function, you would run:
-- SELECT submit_survey_with_patient(
--   'actual-token-uuid',
--   patient_data,
--   ssn,
--   survey_responses,
--   medical_data
-- ) FROM test_data;