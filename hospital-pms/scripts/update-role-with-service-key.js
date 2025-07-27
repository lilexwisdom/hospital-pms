// This script uses the service role key to bypass RLS and triggers
// Run with: node scripts/update-role-with-service-key.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Get these from your Supabase project settings
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // You need to add this to your .env.local

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Please add:');
  console.error('NEXT_PUBLIC_SUPABASE_URL');
  console.error('SUPABASE_SERVICE_ROLE_KEY (get from Supabase Dashboard > Settings > API)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function updateUserRole() {
  try {
    // First, check current role
    const { data: currentUser, error: selectError } = await supabase
      .from('profiles')
      .select('id, name, role')
      .eq('name', 'grsurgeon001@gmail.com')
      .single();

    if (selectError) {
      console.error('Error fetching user:', selectError);
      return;
    }

    console.log('Current user:', currentUser);

    // Update the role to BD
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        role: 'bd',
        updated_at: new Date().toISOString()
      })
      .eq('name', 'grsurgeon001@gmail.com')
      .select();

    if (error) {
      console.error('Error updating role:', error);
    } else {
      console.log('Successfully updated role:', data);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

updateUserRole();