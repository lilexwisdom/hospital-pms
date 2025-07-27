import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database.types';

/**
 * Create a Supabase client for use in the browser
 * This client uses the anon key and respects RLS policies
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Singleton instance for client-side usage
 * Use this when you need a consistent client instance
 */
let browserClient: ReturnType<typeof createClient> | undefined;

export function getClient() {
  if (!browserClient) {
    browserClient = createClient();
  }
  return browserClient;
}

