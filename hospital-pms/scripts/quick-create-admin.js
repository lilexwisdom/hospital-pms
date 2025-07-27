#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function createAdmin() {
  try {
    console.log('Creating admin user...');
    
    // Create user using Supabase Admin API
    const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY
      },
      body: JSON.stringify({
        email: 'admin@hospital.local',
        password: 'admin123',
        email_confirm: true,
        user_metadata: {
          name: 'System Administrator',
          department: 'IT'
        }
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Error:', data);
      
      if (data.msg && data.msg.includes('already been registered')) {
        console.log('User already exists, updating profile...');
        
        // Get user ID
        const getUserResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?email=admin@hospital.local`, {
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': SUPABASE_SERVICE_ROLE_KEY
          }
        });
        
        const users = await getUserResponse.json();
        if (users && users.users && users.users.length > 0) {
          const userId = users.users[0].id;
          console.log('User ID:', userId);
          
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
              name: 'System Administrator',
              department: 'IT'
            })
          });

          if (updateResponse.ok) {
            console.log('✅ Admin profile updated successfully!');
          } else {
            console.error('Failed to update profile:', await updateResponse.text());
          }
        }
      }
    } else {
      console.log('✅ Admin user created successfully!');
      console.log('User ID:', data.user.id);
      console.log('Email:', data.user.email);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

createAdmin();