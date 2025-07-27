import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database.types';
import { suppressSupabaseWarnings } from './suppress-warnings';

// Suppress expected warnings in middleware
suppressSupabaseWarnings();

// Session configuration
const SESSION_CONFIG = {
  maxAge: 60 * 60 * 8, // 8 hours
  refreshThreshold: 60 * 30, // 30 minutes before expiry
  cookieName: 'sb-auth-token',
};

// Logging levels
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

/**
 * Middleware logger utility
 */
function log(level: LogLevel, message: string, meta?: any) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...(meta && { meta }),
  };
  
  // In production, send to logging service
  // For now, console log in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[AUTH-MW] ${level.toUpperCase()}: ${message}`, meta || '');
  }
}

/**
 * Create a Supabase client for middleware
 * This handles auth refresh and cookie management
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Get current session and check if it needs refresh
  // Note: getSession() is used here for performance in middleware
  // Actual auth verification happens in route handlers with getUser()
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    log('error', 'Failed to get session', { 
      error: sessionError.message,
      path: request.nextUrl.pathname 
    });
  }

  // Refresh session if it's close to expiry
  if (session && session.expires_in && session.expires_in < SESSION_CONFIG.refreshThreshold) {
    log('info', 'Refreshing session', { 
      expiresIn: session.expires_in,
      userId: session.user.id 
    });
    
    const { error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) {
      log('error', 'Failed to refresh session', { 
        error: refreshError.message,
        userId: session.user.id 
      });
    }
  }

  const user = session?.user;

  // Define protected routes and their required roles
  const protectedRoutes: { path: string; roles?: Database['public']['Enums']['user_role'][] }[] = [
    { path: '/dashboard', roles: ['admin', 'manager', 'bd', 'cs'] },
    { path: '/admin', roles: ['admin'] },
    { path: '/patients', roles: ['admin', 'manager', 'bd', 'cs'] },
    { path: '/appointments', roles: ['admin', 'manager', 'cs'] },
    { path: '/surveys', roles: ['admin', 'bd'] },
  ];

  // Define public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/signup', '/survey', '/test-daum-postcode', '/reset-password', '/auth/reset-password', '/auth/confirm', '/api/auth/callback'];

  const path = request.nextUrl.pathname;

  // Check if it's a public route
  const isPublicRoute = publicRoutes.some(route => 
    path === route || path.startsWith(`${route}/`)
  );

  // If it's a public route, allow access
  if (isPublicRoute) {
    return supabaseResponse;
  }

  // Check if user is authenticated
  if (!user) {
    log('info', 'Unauthenticated access attempt', { 
      path,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    });
    
    // Redirect to login for protected routes
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectTo', path);
    return NextResponse.redirect(url);
  }

  // Check role-based access for protected routes
  const protectedRoute = protectedRoutes.find(route => 
    path === route.path || path.startsWith(`${route.path}/`)
  );

  if (protectedRoute && protectedRoute.roles) {
    // Get user's profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !protectedRoute.roles.includes(profile.role)) {
      log('warn', 'Unauthorized access attempt', {
        userId: user.id,
        userRole: profile?.role || 'none',
        requiredRoles: protectedRoute.roles,
        path,
      });
      
      // Log to audit table for security tracking
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'unauthorized_access_attempt',
        resource_type: 'middleware',
        resource_id: path,
        changes: {
          path,
          userRole: profile?.role,
          requiredRoles: protectedRoute.roles,
        },
      }).then(({ error }) => {
        if (error) {
          log('error', 'Failed to log audit entry', { error: error.message });
        }
      });
      
      // Redirect to unauthorized page
      const url = request.nextUrl.clone();
      url.pathname = '/unauthorized';
      return NextResponse.redirect(url);
    }
  }

  // Log successful authentication for monitoring
  if (process.env.NODE_ENV === 'development') {
    log('debug', 'Authenticated request', {
      userId: user.id,
      path,
      sessionExpiresIn: session?.expires_in,
    });
  }

  // Add security headers
  // Remove X-Frame-Options to allow Daum postcode iframe
  // supabaseResponse.headers.set('X-Frame-Options', 'DENY');
  supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff');
  supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Add CSP header that allows Daum postcode and Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseDomain = new URL(supabaseUrl).hostname;
  
  supabaseResponse.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://t1.daumcdn.net https://postcode.map.daum.net; " +
    "style-src 'self' 'unsafe-inline' https://t1.daumcdn.net https://cdn.jsdelivr.net; " +
    "frame-src 'self' https://postcode.map.daum.net; " +
    "img-src 'self' data: https: blob:; " +
    `connect-src 'self' https://${supabaseDomain} wss://${supabaseDomain} https://postcode.map.daum.net https://t1.daumcdn.net; ` +
    "font-src 'self' data: https://cdn.jsdelivr.net; " +
    "object-src 'none'; " +
    "base-uri 'self';"
  );
  
  return supabaseResponse;
}

/**
 * Create middleware configuration
 */
export function createMiddlewareClient(request: NextRequest) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({ name, value, ...options });
          });
        },
      },
    }
  );
}