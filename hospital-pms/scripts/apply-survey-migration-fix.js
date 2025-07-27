#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
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

async function applyMigration() {
  try {
    console.log('Applying survey submission fix migration...');

    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250723150000_fix_survey_submission_function.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split the migration into individual statements
    // This is a simple split - in production you'd want more robust SQL parsing
    const statements = migrationSQL
      .split(/;(?=\s*(?:CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|GRANT|COMMENT))/i)
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement.trim()) continue;

      // Add semicolon back if it was removed
      const sql = statement.endsWith(';') ? statement : statement + ';';
      
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      const { error } = await supabase.rpc('exec_sql', { 
        sql_query: sql 
      }).single();

      if (error) {
        // Try direct execution as a fallback
        console.log('Trying alternative execution method...');
        
        // Unfortunately, Supabase JS client doesn't support direct SQL execution
        // We'll need to use the Supabase CLI or apply manually
        console.error('Direct SQL execution not supported via JS client');
        console.error('Please apply the migration manually using Supabase Dashboard SQL Editor');
        console.error(`Migration file: ${migrationPath}`);
        throw error;
      }
    }

    console.log('Migration applied successfully!');
  } catch (error) {
    console.error('Error applying migration:', error);
    process.exit(1);
  }
}

// Alternative approach - test if the function exists and works
async function testFunction() {
  try {
    console.log('\nTesting if the function exists...');
    
    // Try to call the function with dummy data to see the error
    const { data, error } = await supabase.rpc('submit_survey_with_patient', {
      p_token: '00000000-0000-0000-0000-000000000000',
      p_patient_data: {},
      p_ssn: '000000-0000000',
      p_survey_responses: {},
      p_medical_data: null
    });

    if (error) {
      console.log('Function error:', error.message);
      if (error.message.includes('function') && error.message.includes('does not exist')) {
        console.log('\nThe function does not exist. Please apply the migration manually:');
        console.log('1. Go to your Supabase Dashboard');
        console.log('2. Navigate to the SQL Editor');
        console.log('3. Copy and paste the contents of:');
        console.log('   supabase/migrations/20250723150000_fix_survey_submission_function.sql');
        console.log('4. Execute the SQL');
      }
    } else {
      console.log('Function exists but returned:', data);
    }
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Run the test
testFunction();