'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Database } from '@/types/database.types';

type UserRole = Database['public']['Enums']['user_role'];

interface PermissionGuardProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  requireAnyRole?: boolean;
  fallback?: ReactNode;
  permissions?: string[];
  requireAllPermissions?: boolean;
}

export function PermissionGuard({
  children,
  allowedRoles,
  requireAnyRole = false,
  fallback = null,
  permissions,
  requireAllPermissions = true
}: PermissionGuardProps) {
  const { role, profile, loading } = useAuth();

  if (loading) {
    return null;
  }

  // Check role-based permissions
  if (allowedRoles && allowedRoles.length > 0) {
    if (!role || !allowedRoles.includes(role)) {
      return <>{fallback}</>;
    }
  }

  // Check specific permissions (if implemented in profile)
  if (permissions && permissions.length > 0 && profile?.permissions) {
    const userPermissions = profile.permissions as string[];
    
    if (requireAllPermissions) {
      const hasAllPermissions = permissions.every(
        permission => userPermissions.includes(permission)
      );
      if (!hasAllPermissions) {
        return <>{fallback}</>;
      }
    } else {
      const hasAnyPermission = permissions.some(
        permission => userPermissions.includes(permission)
      );
      if (!hasAnyPermission) {
        return <>{fallback}</>;
      }
    }
  }

  return <>{children}</>;
}

interface RoleGuardProps {
  children: ReactNode;
  role: UserRole | UserRole[];
  fallback?: ReactNode;
}

export function RoleGuard({ children, role, fallback = null }: RoleGuardProps) {
  const roles = Array.isArray(role) ? role : [role];
  return (
    <PermissionGuard allowedRoles={roles} fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

// Convenience components for common role checks
export function AdminOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return <RoleGuard role="admin" fallback={fallback}>{children}</RoleGuard>;
}

export function ManagerOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return <RoleGuard role="manager" fallback={fallback}>{children}</RoleGuard>;
}

export function AdminOrManager({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return <RoleGuard role={['admin', 'manager']} fallback={fallback}>{children}</RoleGuard>;
}

export function BDOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return <RoleGuard role="bd" fallback={fallback}>{children}</RoleGuard>;
}

export function CSOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return <RoleGuard role="cs" fallback={fallback}>{children}</RoleGuard>;
}