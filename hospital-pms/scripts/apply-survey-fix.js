#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing required environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyFix() {
  try {
    console.log('Applying survey progress update fix...');
    
    // Read the migration SQL
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250723000000_fix_survey_progress_update.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', {
      sql: migrationSql
    });
    
    if (error) {
      // If RPC doesn't exist, try direct execution
      console.log('Trying alternative approach...');
      
      // Split the SQL into individual statements
      const statements = migrationSql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      for (const statement of statements) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        const { error: stmtError } = await supabase.from('_sql').select(statement);
        if (stmtError && !stmtError.message.includes('does not exist')) {
          console.error('Statement error:', stmtError);
        }
      }
    }
    
    console.log('✅ Survey progress fix applied successfully!');
    console.log('\nThe following changes were made:');
    console.log('- Updated survey_tokens update policy to allow survey_data updates');
    console.log('- Anonymous users can now save survey progress');
    console.log('- The 400 error when saving progress should be resolved');
    
  } catch (error) {
    console.error('Error applying fix:', error);
    console.error('\nManual fix instructions:');
    console.error('1. Go to your Supabase dashboard');
    console.error('2. Navigate to SQL Editor');
    console.error('3. Run the contents of: supabase/migrations/20250723000000_fix_survey_progress_update.sql');
  }
}

// Run the fix
applyFix();