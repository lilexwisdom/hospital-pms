'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getClient } from '@/lib/supabase/client';
import { AUTH_REDIRECTS, SESSION_CONFIG } from '@/config/auth';
import { 
  onAuthStateChange, 
  getSessionRemainingTime,
  isSessionExpiringSoon,
  formatSessionTime
} from '@/lib/auth/client-helpers';
import { signIn as signInAction, signOut as signOutAction, getCurrentUser } from '@/app/actions/auth';
import type { User, Session } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import type { UserSession } from '@/app/actions/types';

interface AuthProfile {
  id: string;
  role: Database['public']['Enums']['user_role'];
  name: string;
  department?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UseAuthReturn {
  user: User | null;
  session: Session | null;
  profile: AuthProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  isSessionExpiring: boolean;
  sessionRemainingTime: string;
  role: Database['public']['Enums']['user_role'] | null;
  signIn: (email: string, password: string, redirectTo?: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  hasRole: (role: Database['public']['Enums']['user_role']) => boolean;
  hasAnyRole: (roles: Database['public']['Enums']['user_role'][]) => boolean;
}

/**
 * Custom hook for authentication state management
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionRemainingTime, setSessionRemainingTime] = useState('');
  const profileLoadInProgressRef = useRef(false);
  const router = useRouter();
  const supabase = getClient();

  // Load user profile
  const loadProfile = useCallback(async (userId: string) => {
    try {
      // Ensure we have a valid user ID
      if (!userId) {
        console.warn('No user ID provided to loadProfile');
        setProfile(null);
        return;
      }

      // Prevent concurrent profile loads
      if (profileLoadInProgressRef.current) {
        return;
      }
      profileLoadInProgressRef.current = true;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // Check if it's a "no rows" error which is common on first load
        if (error.code === 'PGRST116') {
          console.warn('Profile not found for user:', userId);
          // Try to create profile via API - use fix-profile instead of ensure-profile
          try {
            const response = await fetch('/api/fix-profile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            });
            if (response.ok) {
              const result = await response.json();
              if (result.profile) {
                setProfile({
                  id: result.profile.id,
                  role: result.profile.role,
                  name: result.profile.name,
                  department: result.profile.department,
                  createdAt: result.profile.created_at,
                  updatedAt: result.profile.updated_at,
                });
                profileLoadInProgressRef.current = false;
                return;
              }
            }
          } catch (err) {
            console.error('Failed to fix profile:', err);
          }
          setProfile(null); // Set to null so UI knows profile is missing
          profileLoadInProgressRef.current = false;
          return;
        }
        // Log the actual error for debugging
        console.error('Profile query error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          userId
        });
        throw error;
      }
      
      if (data) {
        setProfile({
          id: data.id,
          role: data.role,
          name: data.name,
          department: data.department,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        });
      } else {
        console.warn('No profile data returned for user:', userId);
        setProfile(null);
      }
    } catch (error) {
      // If it's a network/CSP error, don't set profile to null
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        console.warn('Network error loading profile, will retry on next navigation');
      } else {
        console.error('Error loading profile:', error instanceof Error ? error.message : 'Unknown error', error);
        setProfile(null);
      }
    } finally {
      profileLoadInProgressRef.current = false;
    }
  }, [supabase]);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;
    
    const initAuth = async () => {
      try {
        // First get session to check if user might be authenticated
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          setUser(null);
          setSession(null);
          setProfile(null);
          setLoading(false);
          return;
        }
        
        if (!session) {
          console.log('No session found');
          setUser(null);
          setSession(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        // If we have a session, verify it's still valid with getUser()
        try {
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (!mounted) return;
          
          if (userError || !user) {
            // If it's a network error and we have session data, use it
            if (userError?.message?.includes('Failed to fetch') && session?.user) {
              console.warn('Network error verifying user, using session data');
              setSession(session);
              setUser(session.user);
              await loadProfile(session.user.id);
              setLoading(false);
              return;
            }
            
            console.log('Session invalid, user not authenticated');
            setUser(null);
            setSession(null);
            setProfile(null);
            setLoading(false);
            return;
          }

          // Valid session and user
          setSession(session);
          setUser(user);
          
          if (user) {
            await loadProfile(user.id);
          }
        } catch (fetchError) {
          // Network error - use session data but mark as unverified
          console.warn('Network error verifying user, using session data', fetchError);
          if (!mounted) return;
          
          setSession(session);
          setUser(session.user);
          
          if (session.user) {
            await loadProfile(session.user.id);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (!mounted) return;
        
        setUser(null);
        setSession(null);
        setProfile(null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();
    
    return () => {
      mounted = false;
    };
  }, [supabase, loadProfile]);

  // Subscribe to auth state changes
  useEffect(() => {
    const subscription = onAuthStateChange(async (event, session) => {
      // Skip INITIAL_SESSION as we handle it in the initialization effect
      if (event === 'INITIAL_SESSION') {
        return;
      }
      
      switch (event) {
        case 'SIGNED_IN':
          // Verify user is authenticated before updating state
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            setSession(session);
            setUser(user);
            await loadProfile(user.id);
            router.push(AUTH_REDIRECTS.SIGN_IN_SUCCESS);
          }
          break;
        case 'SIGNED_OUT':
          setSession(null);
          setUser(null);
          setProfile(null);
          router.push(AUTH_REDIRECTS.SIGN_OUT);
          break;
        case 'TOKEN_REFRESHED':
          // Verify user on token refresh
          const { data: { user: refreshedUser } } = await supabase.auth.getUser();
          if (refreshedUser) {
            setSession(session);
            setUser(refreshedUser);
            await loadProfile(refreshedUser.id);
          }
          break;
        case 'PASSWORD_RECOVERY':
        case 'USER_UPDATED':
          // Re-verify user for these events
          const { data: { user: updatedUser } } = await supabase.auth.getUser();
          if (updatedUser) {
            setSession(session);
            setUser(updatedUser);
            await loadProfile(updatedUser.id);
          } else {
            setSession(null);
            setUser(null);
            setProfile(null);
          }
          break;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, loadProfile, supabase]);

  // Session timer
  useEffect(() => {
    if (!session) {
      setSessionRemainingTime('');
      return;
    }

    const updateSessionTime = () => {
      const remaining = getSessionRemainingTime(session);
      setSessionRemainingTime(formatSessionTime(remaining));
    };

    // Update immediately
    updateSessionTime();

    // Update every minute
    const interval = setInterval(updateSessionTime, 60000);

    return () => clearInterval(interval);
  }, [session]);

  // Session expiry warning
  useEffect(() => {
    if (!session) return;

    const checkSessionExpiry = () => {
      if (isSessionExpiringSoon(session)) {
        // Show warning to user
        console.warn('Session expiring soon');
      }
    };

    // Check every 5 minutes
    const interval = setInterval(checkSessionExpiry, SESSION_CONFIG.CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [session]);

  const signIn = async (email: string, password: string, redirectTo?: string): Promise<boolean> => {
    try {
      const formData = new FormData();
      formData.set('email', email);
      formData.set('password', password);
      if (redirectTo) {
        formData.set('redirectTo', redirectTo);
      }

      const result = await signInAction(formData);
      
      if (result.success) {
        // Profile will be loaded by auth state change listener
        return true;
      } else {
        console.error('Sign in error:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Error signing in:', error);
      return false;
    }
  };

  const signOut = async () => {
    try {
      const formData = new FormData();
      const result = await signOutAction(formData);
      
      if (!result.success) {
        console.error('Sign out error:', result.error);
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      
      // Verify user after refresh
      if (data.session) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setSession(data.session);
          setUser(user);
          await loadProfile(user.id);
        }
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
    }
  };

  // Role check helpers
  const hasRole = useCallback((role: Database['public']['Enums']['user_role']): boolean => {
    return profile?.role === role;
  }, [profile]);

  const hasAnyRole = useCallback((roles: Database['public']['Enums']['user_role'][]): boolean => {
    return !!profile && roles.includes(profile.role);
  }, [profile]);

  return {
    user,
    session,
    profile,
    loading,
    isAuthenticated: !!user,
    isSessionExpiring: isSessionExpiringSoon(session),
    sessionRemainingTime,
    role: profile?.role ?? null,
    signIn,
    signOut,
    refreshSession,
    hasRole,
    hasAnyRole,
  };
}

/**
 * Hook to require authentication
 * Redirects to login if not authenticated
 */
export function useRequireAuth(requiredRole?: Database['public']['Enums']['user_role'] | Database['public']['Enums']['user_role'][]) {
  const { isAuthenticated, loading, hasRole, hasAnyRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push(AUTH_REDIRECTS.UNAUTHORIZED);
      } else if (requiredRole) {
        const hasRequiredRole = Array.isArray(requiredRole) 
          ? hasAnyRole(requiredRole)
          : hasRole(requiredRole);
          
        if (!hasRequiredRole) {
          router.push('/unauthorized');
        }
      }
    }
  }, [isAuthenticated, loading, router, requiredRole, hasRole, hasAnyRole]);

  return { isAuthenticated, loading };
}

/**
 * Hook to handle session expiry warnings
 */
export function useSessionWarning() {
  const { session, isSessionExpiring, sessionRemainingTime, refreshSession } = useAuth();
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    setShowWarning(isSessionExpiring);
  }, [isSessionExpiring]);

  const dismissWarning = () => {
    setShowWarning(false);
  };

  const extendSession = async () => {
    await refreshSession();
    setShowWarning(false);
  };

  return {
    showWarning,
    sessionRemainingTime,
    dismissWarning,
    extendSession,
  };
}