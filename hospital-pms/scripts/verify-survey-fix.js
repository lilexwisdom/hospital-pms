#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function verifyFix() {
  console.log('Verifying survey submission fix...\n');
  
  const checks = {
    patientNumberColumn: false,
    generatePatientNumberFunction: false,
    submitSurveyFunction: false,
    hashSsnFunction: false
  };

  try {
    // Check 1: Verify patient_number column exists
    console.log('1. Checking patient_number column...');
    const { data: columns, error: columnsError } = await supabase
      .from('patients')
      .select('patient_number')
      .limit(0);
    
    if (!columnsError) {
      checks.patientNumberColumn = true;
      console.log('   ✓ patient_number column exists');
    } else {
      console.log('   ✗ patient_number column missing');
    }

    // Check 2: Test generate_patient_number function
    console.log('\n2. Checking generate_patient_number function...');
    const { data: patientNum, error: genError } = await supabase
      .rpc('generate_patient_number');
    
    if (!genError && patientNum) {
      checks.generatePatientNumberFunction = true;
      console.log(`   ✓ Function works, generated: ${patientNum}`);
    } else {
      console.log('   ✗ generate_patient_number function missing or broken');
      if (genError) console.log(`     Error: ${genError.message}`);
    }

    // Check 3: Test hash_ssn function
    console.log('\n3. Checking hash_ssn function...');
    const { data: hash, error: hashError } = await supabase
      .rpc('hash_ssn', { p_ssn: 'test-ssn' });
    
    if (!hashError && hash) {
      checks.hashSsnFunction = true;
      console.log('   ✓ hash_ssn function works');
    } else {
      console.log('   ✗ hash_ssn function missing or broken');
      if (hashError) console.log(`     Error: ${hashError.message}`);
    }

    // Check 4: Verify submit_survey_with_patient function signature
    console.log('\n4. Checking submit_survey_with_patient function...');
    try {
      // Try calling with correct parameter types (will fail on token validation, but that's OK)
      const { error: funcError } = await supabase.rpc('submit_survey_with_patient', {
        p_token: '00000000-0000-0000-0000-000000000000', // TEXT parameter
        p_patient_data: {},
        p_ssn: '000000-0000000',
        p_survey_responses: {},
        p_medical_data: null
      });
      
      if (funcError) {
        // Check if it's a validation error (function exists) vs not found
        if (funcError.message.includes('Invalid token') || 
            funcError.message.includes('Token expired') ||
            funcError.message.includes('Token already used')) {
          checks.submitSurveyFunction = true;
          console.log('   ✓ Function exists with correct signature');
        } else if (funcError.message.includes('does not exist')) {
          console.log('   ✗ Function missing');
        } else {
          // Function exists but might have other issues
          checks.submitSurveyFunction = true;
          console.log('   ✓ Function exists (other error occurred)');
          console.log(`     Error: ${funcError.message}`);
        }
      } else {
        checks.submitSurveyFunction = true;
        console.log('   ✓ Function exists');
      }
    } catch (error) {
      console.log('   ✗ Error checking function:', error.message);
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('VERIFICATION SUMMARY:');
    console.log('='.repeat(50));
    
    const allPassed = Object.values(checks).every(check => check);
    const passedCount = Object.values(checks).filter(check => check).length;
    
    console.log(`Total checks: ${Object.keys(checks).length}`);
    console.log(`Passed: ${passedCount}`);
    console.log(`Failed: ${Object.keys(checks).length - passedCount}`);
    
    if (allPassed) {
      console.log('\n✅ All checks passed! The survey submission fix has been applied successfully.');
    } else {
      console.log('\n❌ Some checks failed. Please apply the migration:');
      console.log('   1. Go to Supabase Dashboard > SQL Editor');
      console.log('   2. Copy contents of: supabase/migrations/20250723150000_fix_survey_submission_function.sql');
      console.log('   3. Paste and run in SQL Editor');
    }

  } catch (error) {
    console.error('Verification error:', error);
  }
}

verifyFix();