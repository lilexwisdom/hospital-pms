import { createClient } from '@/lib/supabase/client';
import { createClient as createServerClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: {
    authStatus?: boolean;
    databaseConnection?: boolean;
    rlsWorking?: boolean;
    user?: any;
    profile?: any;
    error?: any;
  };
}

/**
 * Test Supabase connection from the client side
 */
export async function testClientConnection(): Promise<ConnectionTestResult> {
  try {
    const supabase = createClient();
    
    // Test 1: Auth status
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      return {
        success: false,
        message: 'Authentication check failed',
        details: { authStatus: false, error: authError }
      };
    }

    // Test 2: Database connection (try to fetch profiles)
    const { data: profiles, error: dbError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (dbError) {
      return {
        success: false,
        message: 'Database connection failed',
        details: { 
          authStatus: true, 
          databaseConnection: false, 
          error: dbError 
        }
      };
    }

    // Test 3: RLS working (if user is logged in)
    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        return {
          success: false,
          message: 'RLS check failed',
          details: { 
            authStatus: true, 
            databaseConnection: true,
            rlsWorking: false,
            error: profileError 
          }
        };
      }

      return {
        success: true,
        message: 'All connection tests passed',
        details: {
          authStatus: true,
          databaseConnection: true,
          rlsWorking: true,
          user: user,
          profile: profile
        }
      };
    }

    return {
      success: true,
      message: 'Connection successful (not authenticated)',
      details: {
        authStatus: true,
        databaseConnection: true,
        rlsWorking: null,
        user: null
      }
    };

  } catch (error) {
    return {
      success: false,
      message: 'Connection test failed',
      details: { error }
    };
  }
}

/**
 * Test Supabase connection from the server side
 */
export async function testServerConnection(): Promise<ConnectionTestResult> {
  try {
    const supabase = await createServerClient();
    
    // Test 1: Auth status
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError && authError.message !== 'Auth session missing!') {
      return {
        success: false,
        message: 'Server authentication check failed',
        details: { authStatus: false, error: authError }
      };
    }

    // Test 2: Database connection
    const { count, error: dbError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (dbError) {
      return {
        success: false,
        message: 'Server database connection failed',
        details: { 
          authStatus: true, 
          databaseConnection: false, 
          error: dbError 
        }
      };
    }

    return {
      success: true,
      message: 'Server connection successful',
      details: {
        authStatus: true,
        databaseConnection: true,
        user: user
      }
    };

  } catch (error) {
    return {
      success: false,
      message: 'Server connection test failed',
      details: { error }
    };
  }
}

/**
 * Run comprehensive connection diagnostics
 */
export async function runDiagnostics(client: SupabaseClient<Database>) {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    tests: {
      auth: { passed: false, details: null as any },
      database: { passed: false, details: null as any },
      rls: { passed: false, details: null as any },
      functions: { passed: false, details: null as any },
    }
  };

  // Test Auth
  try {
    const { data, error } = await client.auth.getSession();
    diagnostics.tests.auth.passed = !error;
    diagnostics.tests.auth.details = error || data;
  } catch (e) {
    diagnostics.tests.auth.details = e;
  }

  // Test Database
  try {
    const { error } = await client.from('profiles').select('count').limit(0);
    diagnostics.tests.database.passed = !error;
    diagnostics.tests.database.details = error || 'Database accessible';
  } catch (e) {
    diagnostics.tests.database.details = e;
  }

  // Test RLS
  try {
    const { data: { user } } = await client.auth.getUser();
    if (user) {
      const { data, error } = await client
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      diagnostics.tests.rls.passed = !error && data !== null;
      diagnostics.tests.rls.details = error || data;
    } else {
      diagnostics.tests.rls.details = 'No authenticated user';
    }
  } catch (e) {
    diagnostics.tests.rls.details = e;
  }

  // Test Functions
  try {
    const { data, error } = await client.rpc('has_role', { 
      required_role: 'admin' 
    });
    diagnostics.tests.functions.passed = !error;
    diagnostics.tests.functions.details = error || { has_role_result: data };
  } catch (e) {
    diagnostics.tests.functions.details = e;
  }

  return diagnostics;
}

/**
 * Health check endpoint data
 */
export async function getHealthCheckData() {
  const checks = {
    client: await testClientConnection(),
    server: await testServerConnection(),
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    }
  };

  const isHealthy = checks.client.success && checks.server.success;

  return {
    status: isHealthy ? 'healthy' : 'unhealthy',
    checks,
    summary: {
      healthy: isHealthy,
      message: isHealthy 
        ? 'All systems operational' 
        : 'Some systems are experiencing issues'
    }
  };
}