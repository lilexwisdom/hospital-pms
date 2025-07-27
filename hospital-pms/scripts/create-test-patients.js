import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestPatients() {
  try {
    // Get a BD or admin user to be the creator
    const { data: adminUser } = await supabase
      .from('profiles')
      .select('id')
      .in('role', ['admin', 'bd'])
      .limit(1)
      .single();

    if (!adminUser) {
      console.error('No admin or BD user found');
      return;
    }

    console.log('Using user:', adminUser.id);

    // Create test patients
    const testPatients = [
      {
        name: '홍길동',
        ssn_hash: 'hash_hong_' + Date.now(),
        encrypted_ssn: Buffer.from('encrypted_ssn_hong'),
        phone: '010-1234-5678',
        email: 'hong@example.com',
        date_of_birth: '1980-01-01',
        gender: 'male',
        address: { postcode: '12345', roadAddress: '서울시 강남구' },
        status: 'active',
        patient_number: 'P001',
        created_by: adminUser.id,
        flag_hypertension: true,
        flag_diabetes: false,
        flag_hyperlipidemia: false,
        flag_anticoagulant: false,
        flag_asthma: false,
        flag_allergy: false,
        flag_cardiovascular: false,
        flag_pregnancy: false
      },
      {
        name: '김영희',
        ssn_hash: 'hash_kim_' + Date.now(),
        encrypted_ssn: Buffer.from('encrypted_ssn_kim'),
        phone: '010-2345-6789',
        email: 'kim@example.com',
        date_of_birth: '1990-05-15',
        gender: 'female',
        address: { postcode: '54321', roadAddress: '서울시 서초구' },
        status: 'pending',
        patient_number: 'P002',
        created_by: adminUser.id,
        flag_hypertension: false,
        flag_diabetes: true,
        flag_hyperlipidemia: false,
        flag_anticoagulant: false,
        flag_asthma: false,
        flag_allergy: true,
        flag_cardiovascular: false,
        flag_pregnancy: false
      },
      {
        name: '이철수',
        ssn_hash: 'hash_lee_' + Date.now(),
        encrypted_ssn: Buffer.from('encrypted_ssn_lee'),
        phone: '010-3456-7890',
        email: 'lee@example.com',
        date_of_birth: '1975-12-25',
        gender: 'male',
        address: { postcode: '67890', roadAddress: '서울시 송파구' },
        status: 'active',
        patient_number: 'P003',
        created_by: adminUser.id,
        cs_manager: adminUser.id,
        flag_hypertension: true,
        flag_diabetes: true,
        flag_hyperlipidemia: true,
        flag_anticoagulant: false,
        flag_asthma: false,
        flag_allergy: false,
        flag_cardiovascular: true,
        flag_pregnancy: false
      }
    ];

    const { data, error } = await supabase
      .from('patients')
      .insert(testPatients)
      .select();

    if (error) {
      console.error('Error creating patients:', error);
    } else {
      console.log('Created patients:', data);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

createTestPatients();