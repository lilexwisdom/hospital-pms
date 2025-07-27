/**
 * Suppress Supabase auth warnings in development
 * These warnings are expected in certain contexts like middleware
 */
export function suppressSupabaseWarnings() {
  if (process.env.NODE_ENV === 'development') {
    const originalWarn = console.warn;
    console.warn = (...args) => {
      const message = args[0];
      if (
        typeof message === 'string' && 
        message.includes('Using the user object as returned from supabase.auth.getSession()')
      ) {
        // Suppress this specific warning
        return;
      }
      originalWarn.apply(console, args);
    };
  }
}