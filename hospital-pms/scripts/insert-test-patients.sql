-- First, get an admin or bd user id
WITH admin_user AS (
  SELECT id FROM auth.users 
  WHERE email = 'lilexwisdom@gmail.com'
  LIMIT 1
)
-- Insert test patients
INSERT INTO patients (
  name, ssn_hash, encrypted_ssn, phone, email, 
  date_of_birth, gender, address, status, patient_number,
  created_by, cs_manager,
  flag_hypertension, flag_diabetes, flag_hyperlipidemia,
  flag_anticoagulant, flag_asthma, flag_allergy,
  flag_cardiovascular, flag_pregnancy
) VALUES 
(
  '홍길동', 
  'hash_hong_' || extract(epoch from now())::text,
  '\x010203'::bytea,
  '010-1234-5678',
  'hong@example.com',
  '1980-01-01',
  'male',
  '{"postcode": "12345", "roadAddress": "서울시 강남구"}'::jsonb,
  'active',
  'P001',
  (SELECT id FROM admin_user),
  (SELECT id FROM admin_user),
  true, false, false, false, false, false, false, false
),
(
  '김영희',
  'hash_kim_' || extract(epoch from now())::text,
  '\x040506'::bytea,
  '010-2345-6789',
  'kim@example.com',
  '1990-05-15',
  'female',
  '{"postcode": "54321", "roadAddress": "서울시 서초구"}'::jsonb,
  'pending',
  'P002',
  (SELECT id FROM admin_user),
  (SELECT id FROM admin_user),
  false, true, false, false, false, true, false, false
),
(
  '이철수',
  'hash_lee_' || extract(epoch from now())::text,
  '\x070809'::bytea,
  '010-3456-7890',
  'lee@example.com',
  '1975-12-25',
  'male',
  '{"postcode": "67890", "roadAddress": "서울시 송파구"}'::jsonb,
  'active',
  'P003',
  (SELECT id FROM admin_user),
  (SELECT id FROM admin_user),
  true, true, true, false, false, false, true, false
),
(
  '박민수',
  'hash_park_' || extract(epoch from now())::text,
  '\x0a0b0c'::bytea,
  '010-4567-8901',
  'park@example.com',
  '1985-08-20',
  'male',
  '{"postcode": "11111", "roadAddress": "서울시 마포구"}'::jsonb,
  'inactive',
  'P004',
  (SELECT id FROM admin_user),
  NULL,
  false, false, false, true, true, false, false, false
),
(
  '정수진',
  'hash_jung_' || extract(epoch from now())::text,
  '\x0d0e0f'::bytea,
  '010-5678-9012',
  'jung@example.com',
  '1995-03-10',
  'female',
  '{"postcode": "22222", "roadAddress": "서울시 종로구"}'::jsonb,
  'active',
  'P005',
  (SELECT id FROM admin_user),
  (SELECT id FROM admin_user),
  false, false, false, false, false, false, false, true
);