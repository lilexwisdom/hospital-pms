#!/usr/bin/env node

/**
 * Script to update admin@hospital.local user role from 'cs' to 'admin'
 * This uses the service role key to bypass RLS policies
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

async function updateAdminRole() {
  console.log('🔄 Updating admin@hospital.local role to admin...\n');

  // Create Supabase client with service role key (bypasses RLS)
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Step 1: Find the user in auth.users
    console.log('1️⃣ Finding user admin@hospital.local...');
    
    const { data: authUser, error: authError } = await supabase.auth.admin.listUsers({
      filter: 'email=admin@hospital.local',
      page: 1,
      perPage: 1
    });

    if (authError) {
      console.error('❌ Error finding user:', authError.message);
      return;
    }

    if (!authUser || !authUser.users || authUser.users.length === 0) {
      console.error('❌ User admin@hospital.local not found');
      console.log('ℹ️  Please create the user first using create-admin-user.js');
      return;
    }

    const userId = authUser.users[0].id;
    console.log('✅ Found user with ID:', userId);

    // Step 2: Check current profile
    console.log('\n2️⃣ Checking current profile...');
    
    const { data: currentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('❌ Error fetching profile:', profileError.message);
      return;
    }

    console.log('Current profile:', {
      id: currentProfile.id,
      role: currentProfile.role,
      name: currentProfile.name,
      department: currentProfile.department
    });

    if (currentProfile.role === 'admin') {
      console.log('✅ User already has admin role!');
      return;
    }

    // Step 3: Update the profile role
    console.log('\n3️⃣ Updating role from', currentProfile.role, 'to admin...');
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        role: 'admin',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('❌ Error updating profile:', updateError.message);
      return;
    }

    // Step 4: Verify the update
    console.log('\n4️⃣ Verifying update...');
    
    const { data: updatedProfile, error: verifyError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError.message);
      return;
    }

    console.log('\n✅ Successfully updated admin@hospital.local role to admin!');
    console.log('Updated profile:', {
      id: updatedProfile.id,
      role: updatedProfile.role,
      name: updatedProfile.name,
      department: updatedProfile.department,
      updated_at: updatedProfile.updated_at
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the update
updateAdminRole();