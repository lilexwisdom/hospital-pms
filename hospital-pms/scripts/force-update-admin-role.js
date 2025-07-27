#!/usr/bin/env node

/**
 * Force update admin@hospital.local role to admin using direct REST API with service role
 * This bypasses RLS policies by using the service role key
 */

require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

async function forceUpdateAdminRole() {
  try {
    console.log('🔧 Force updating admin@hospital.local role to admin...\n');
    
    // Step 1: Get the user ID from auth.users
    console.log('1️⃣ Finding user in auth.users...');
    
    const getUserResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?email=admin@hospital.local`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY
      }
    });
    
    const userData = await getUserResponse.json();
    
    if (!userData.users || userData.users.length === 0) {
      console.error('❌ User admin@hospital.local not found');
      return;
    }
    
    const userId = userData.users[0].id;
    console.log('✅ Found user with ID:', userId);
    
    // Step 2: Use RPC to call a direct SQL update
    // First, let's try a direct PATCH with service role
    console.log('\n2️⃣ Updating profile with service role (bypassing RLS)...');
    
    const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        role: 'admin',
        updated_at: new Date().toISOString()
      })
    });
    
    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('❌ Update failed:', errorText);
      
      // If direct update fails, try using RPC
      console.log('\n3️⃣ Attempting update via RPC...');
      
      // We'll create a temporary function to do the update
      const createFunctionResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/create_temp_admin_update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': SUPABASE_SERVICE_ROLE_KEY
        },
        body: JSON.stringify({})
      });
      
      if (!createFunctionResponse.ok) {
        // Function doesn't exist, let's try raw SQL via the management API
        console.log('\n4️⃣ Final attempt: Creating and executing a temporary function...');
        
        // Since we can't run arbitrary SQL, let's use the REST API with a different approach
        // We'll disable RLS temporarily using the service role
        
        console.log('\n⚠️  Manual intervention required:');
        console.log('Please run the following SQL command in your Supabase SQL Editor:');
        console.log('```sql');
        console.log(`UPDATE public.profiles SET role = 'admin' WHERE id = '${userId}';`);
        console.log('```');
        console.log('\nAlternatively, run this command if you have Supabase CLI installed:');
        console.log(`supabase db execute --sql "UPDATE public.profiles SET role = 'admin' WHERE id = '${userId}';" --linked`);
        return;
      }
    } else {
      const result = await updateResponse.json();
      console.log('✅ Successfully updated role to admin!');
      console.log('Updated profile:', result[0]);
    }
    
    // Step 3: Verify the update
    console.log('\n5️⃣ Verifying the update...');
    
    const verifyResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY
      }
    });
    
    const profile = await verifyResponse.json();
    console.log('\nCurrent profile:', profile[0]);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

forceUpdateAdminRole();