import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

/**
 * Creates a Supabase client with service role key for admin operations
 * This client bypasses RLS and should only be used in server-side code
 */
export function createClientService() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}