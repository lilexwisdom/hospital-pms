'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import type { Database } from '@/types/database.types';

type UserRole = Database['public']['Enums']['user_role'];

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  fallbackUrl?: string;
  loadingComponent?: React.ReactNode;
}

/**
 * ProtectedRoute HOC (Higher Order Component)
 * 인증 및 역할 기반 접근 제어를 처리하는 컴포넌트
 */
export function ProtectedRoute({
  children,
  requiredRole,
  fallbackUrl = '/unauthorized',
  loadingComponent,
}: ProtectedRouteProps) {
  const { user, profile, loading, isAuthenticated, hasRole, hasAnyRole } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    console.log('ProtectedRoute:', { 
      loading, 
      isAuthenticated, 
      requiredRole,
      currentProfile: profile,
      isAuthorized 
    });
    
    // Skip checks while loading
    if (loading) {
      return;
    }

    // Check authentication after loading completes
    if (!isAuthenticated) {
      console.log('Not authenticated, redirecting to /login');
      router.push('/login');
      return;
    }

    // Check role requirements if specified
    if (requiredRole) {
      const hasRequiredRole = Array.isArray(requiredRole)
        ? hasAnyRole(requiredRole)
        : hasRole(requiredRole);

      console.log('Role check:', { 
        requiredRole, 
        hasRequiredRole,
        userRole: profile?.role 
      });

      if (!hasRequiredRole) {
        console.log('No required role, redirecting to:', fallbackUrl);
        router.push(fallbackUrl);
        return;
      }
    }

    // All checks passed
    console.log('Authorization passed');
    setIsAuthorized(true);
  }, [loading, isAuthenticated, requiredRole, hasRole, hasAnyRole, router, fallbackUrl, profile]);

  // 로딩 중일 때
  if (loading) {
    return loadingComponent || <DefaultLoadingComponent />;
  }

  // 인증/권한 확인 중일 때
  if (!isAuthorized) {
    return loadingComponent || <DefaultLoadingComponent />;
  }

  // 인증 및 권한 확인 완료
  return <>{children}</>;
}

/**
 * withProtectedRoute HOC Factory
 * 컴포넌트를 보호된 라우트로 감싸는 고차 함수
 */
export function withProtectedRoute<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    requiredRole?: UserRole | UserRole[];
    fallbackUrl?: string;
    loadingComponent?: React.ReactNode;
  }
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

/**
 * 기본 로딩 컴포넌트
 */
function DefaultLoadingComponent() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}

/**
 * 역할별 보호 컴포넌트들
 */

// 관리자 전용 컴포넌트
export function AdminOnly({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="admin" fallbackUrl="/unauthorized">
      {children}
    </ProtectedRoute>
  );
}

// 매니저 이상 권한 컴포넌트
export function ManagerOnly({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole={['admin', 'manager']} fallbackUrl="/unauthorized">
      {children}
    </ProtectedRoute>
  );
}

// BD 팀 접근 가능 컴포넌트
export function BDAccess({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole={['admin', 'manager', 'bd']} fallbackUrl="/unauthorized">
      {children}
    </ProtectedRoute>
  );
}

// CS 팀 접근 가능 컴포넌트
export function CSAccess({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole={['admin', 'manager', 'cs']} fallbackUrl="/unauthorized">
      {children}
    </ProtectedRoute>
  );
}

// 모든 인증된 사용자 접근 가능 컴포넌트
export function AuthenticatedOnly({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  );
}

/**
 * 조건부 렌더링을 위한 권한 확인 컴포넌트
 */
interface CanAccessProps {
  role?: UserRole | UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function CanAccess({ role, children, fallback = null }: CanAccessProps) {
  const { loading, isAuthenticated, hasRole, hasAnyRole } = useAuth();

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  if (role) {
    const hasRequiredRole = Array.isArray(role) ? hasAnyRole(role) : hasRole(role);
    if (!hasRequiredRole) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}

/**
 * 권한 기반 표시/숨김 컴포넌트
 */
export function ShowForRole({ 
  role, 
  children 
}: { 
  role: UserRole | UserRole[]; 
  children: React.ReactNode 
}) {
  return <CanAccess role={role}>{children}</CanAccess>;
}

/**
 * 권한 기반 숨김 컴포넌트
 */
export function HideForRole({ 
  role, 
  children 
}: { 
  role: UserRole | UserRole[]; 
  children: React.ReactNode 
}) {
  const { loading, isAuthenticated, hasRole, hasAnyRole } = useAuth();

  if (loading || !isAuthenticated) {
    return null;
  }

  const hasRequiredRole = Array.isArray(role) ? hasAnyRole(role) : hasRole(role);
  
  // 해당 역할을 가진 경우 숨김
  if (hasRequiredRole) {
    return null;
  }

  return <>{children}</>;
}