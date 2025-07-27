#!/usr/bin/env node

/**
 * Script to create the default admin user using Supabase Admin API
 * This should be run after the database migrations have been applied
 * 
 * Usage: node scripts/create-admin-user.js
 * 
 * Required environment variables:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

const readline = require('readline');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('   Please check your .env.local file');
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function createAdminUser() {
  console.log('🏥 Hospital Management System - Admin User Setup');
  console.log('================================================\n');

  try {
    // Get admin credentials
    const email = await question('Admin email (default: admin@hospital.local): ') || 'admin@hospital.local';
    const password = await question('Admin password (min 6 characters): ');
    
    if (!password || password.length < 6) {
      console.error('❌ Password must be at least 6 characters long');
      process.exit(1);
    }

    const name = await question('Admin name (default: System Administrator): ') || 'System Administrator';
    const department = await question('Department (default: IT): ') || 'IT';

    console.log('\n📝 Creating admin user...');

    // Create user using Supabase Admin API
    const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name,
          department
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      if (data.msg && data.msg.includes('already been registered')) {
        console.log('ℹ️  User already exists. Updating profile...');
        
        // Get user ID
        const getUserResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?email=${email}`, {
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': SUPABASE_SERVICE_ROLE_KEY
          }
        });
        
        const users = await getUserResponse.json();
        if (users && users.users && users.users.length > 0) {
          const userId = users.users[0].id;
          
          // Update profile to admin role
          const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              'apikey': SUPABASE_SERVICE_ROLE_KEY,
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
              role: 'admin',
              name,
              department
            })
          });

          if (updateResponse.ok) {
            console.log('✅ Admin profile updated successfully!');
          } else {
            console.error('❌ Failed to update profile:', await updateResponse.text());
          }
        }
      } else {
        console.error('❌ Failed to create user:', data);
        process.exit(1);
      }
    } else {
      console.log('✅ Admin user created successfully!');
      console.log('   User ID:', data.user.id);
      console.log('   Email:', data.user.email);
    }

    console.log('\n🔐 Admin Setup Complete!');
    console.log('========================');
    console.log('You can now log in with:');
    console.log(`   Email: ${email}`);
    console.log('   Password: [hidden]');
    console.log('\n⚠️  Please change the password after first login!');

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the script
createAdminUser();