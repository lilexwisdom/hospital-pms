import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database.types';

/**
 * Create a Supabase client for Server Components
 * This client automatically handles cookie-based auth
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

/**
 * Create a Supabase client for Server Actions
 * This client can handle both read and write operations
 */
export async function createActionClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // Handle cookie setting errors in server actions
            console.error('Error setting cookies in server action:', error);
          }
        },
      },
    }
  );
}

/**
 * Create a Supabase admin client with service role key
 * Use this only for administrative operations that bypass RLS
 * NEVER expose this to the client!
 */
export async function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // Handle cookie setting errors
          }
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/**
 * Get the current user from a Server Component
 */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Get the current user's profile with role information
 */
export async function getUserProfile() {
  const supabase = await createClient();
  const user = await getUser();
  
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile;
}

/**
 * Check if the current user has a specific role
 */
export async function hasRole(role: Database['public']['Enums']['user_role']) {
  const profile = await getUserProfile();
  return profile?.role === role;
}

/**
 * Check if the current user has any of the specified roles
 */
export async function hasAnyRole(roles: Database['public']['Enums']['user_role'][]) {
  const profile = await getUserProfile();
  return profile ? roles.includes(profile.role) : false;
}

/**
 * Require authentication or redirect
 */
export async function requireAuth(redirectTo = '/login') {
  const user = await getUser();
  
  if (!user) {
    // Import dynamically to avoid issues
    const { redirect } = await import('next/navigation');
    redirect(redirectTo);
  }
  
  return user;
}

/**
 * Require specific role or throw error
 */
export async function requireRole(
  role: Database['public']['Enums']['user_role'],
  errorMessage = 'Unauthorized: Insufficient permissions'
) {
  const user = await requireAuth();
  const profile = await getUserProfile();
  
  if (!profile || profile.role !== role) {
    throw new Error(errorMessage);
  }
  
  return { user, profile };
}

/**
 * Require any of the specified roles
 */
export async function requireAnyRole(
  roles: Database['public']['Enums']['user_role'][],
  errorMessage = 'Unauthorized: Insufficient permissions'
) {
  const user = await requireAuth();
  const profile = await getUserProfile();
  
  if (!profile || !roles.includes(profile.role)) {
    throw new Error(errorMessage);
  }
  
  return { user, profile };
}