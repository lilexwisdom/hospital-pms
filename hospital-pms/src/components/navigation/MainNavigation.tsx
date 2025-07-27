'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { ShowForRole } from '@/components/auth/ProtectedRoute';
import type { Database } from '@/types/database.types';

type UserRole = Database['public']['Enums']['user_role'];

export interface NavItem {
  id: string;
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  roles?: UserRole[];
  children?: NavItem[];
  disabled?: boolean;
}

interface MainNavigationProps {
  items: NavItem[];
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  showIcons?: boolean;
  collapsible?: boolean;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function MainNavigation({
  items,
  className,
  orientation = 'vertical',
  showIcons = true,
  collapsible = false,
  collapsed = false,
  onCollapsedChange,
}: MainNavigationProps) {
  const pathname = usePathname();
  const { hasAnyRole, loading, isAuthenticated, profile } = useAuth();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const navRef = useRef<HTMLElement>(null);

  // Filter items based on user role
  const visibleItems = items.filter((item) => {
    // Always show items without role restrictions
    if (!item.roles || item.roles.length === 0) return true;
    
    // During loading, show all items
    if (loading) return true;
    
    // If authenticated but profile is still loading/missing, show all items
    // This prevents menu items from disappearing after refresh
    if (isAuthenticated && !profile) return true;
    
    // After loading with profile, check if user has required role
    return hasAnyRole(item.roles);
  });

  // Check if item is active
  const isItemActive = (item: NavItem): boolean => {
    if (item.href === pathname) return true;
    if (item.children) {
      return item.children.some((child) => isItemActive(child));
    }
    return false;
  };

  // Toggle expanded state
  const toggleExpanded = (itemId: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!navRef.current) return;

      const focusableElements = navRef.current.querySelectorAll(
        'a, button:not(:disabled)'
      );
      const currentIndex = Array.from(focusableElements).indexOf(
        document.activeElement as HTMLElement
      );

      let nextIndex = currentIndex;

      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          nextIndex = (currentIndex + 1) % focusableElements.length;
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          nextIndex =
            currentIndex - 1 < 0
              ? focusableElements.length - 1
              : currentIndex - 1;
          break;
        case 'Home':
          e.preventDefault();
          nextIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          nextIndex = focusableElements.length - 1;
          break;
      }

      if (nextIndex !== currentIndex) {
        (focusableElements[nextIndex] as HTMLElement).focus();
      }
    };

    const nav = navRef.current;
    nav?.addEventListener('keydown', handleKeyDown);

    return () => {
      nav?.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const renderNavItem = (item: NavItem, level = 0) => {
    const Icon = item.icon;
    const isActive = isItemActive(item);
    const isExpanded = expandedItems.includes(item.id);
    const hasChildren = item.children && item.children.length > 0;

    // Skip role check during loading or when profile is missing
    if (!loading && isAuthenticated && profile && item.roles && !hasAnyRole(item.roles)) {
      return null;
    }

    const content = (
      <>
        {showIcons && Icon && (
          <Icon className={cn('h-4 w-4 flex-shrink-0', collapsed && 'mx-auto')} />
        )}
        {!collapsed && (
          <>
            <span className="flex-1">{item.title}</span>
            {item.badge !== undefined && (
              <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 text-xs text-primary-foreground">
                {item.badge}
              </span>
            )}
          </>
        )}
      </>
    );

    if (hasChildren) {
      return (
        <div key={item.id}>
          <button
            type="button"
            onClick={() => toggleExpanded(item.id)}
            disabled={item.disabled}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted hover:text-foreground',
              item.disabled && 'cursor-not-allowed opacity-50',
              level > 0 && 'ml-6'
            )}
            aria-expanded={isExpanded}
            aria-controls={`nav-group-${item.id}`}
          >
            {content}
            {!collapsed && (
              <svg
                className={cn(
                  'h-4 w-4 transition-transform',
                  isExpanded && 'rotate-180'
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            )}
          </button>
          {!collapsed && isExpanded && (
            <div
              id={`nav-group-${item.id}`}
              className="mt-1 space-y-1"
              role="group"
            >
              {item.children.map((child) => renderNavItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.id}
        href={item.href}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'hover:bg-muted hover:text-foreground',
          item.disabled && 'cursor-not-allowed opacity-50',
          level > 0 && 'ml-6',
          collapsed && 'justify-center'
        )}
        aria-current={isActive ? 'page' : undefined}
        aria-disabled={item.disabled}
        title={collapsed ? item.title : undefined}
      >
        {content}
      </Link>
    );
  };

  return (
    <nav
      ref={navRef}
      className={cn(
        'space-y-1',
        orientation === 'horizontal' && 'flex space-x-1 space-y-0',
        className
      )}
      role="navigation"
      aria-label="주 메뉴"
    >
      {visibleItems.map((item) => renderNavItem(item))}
    </nav>
  );
}

// Breadcrumb Navigation Component
interface BreadcrumbItem {
  title: string;
  href?: string;
}

interface BreadcrumbNavigationProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function BreadcrumbNavigation({
  items,
  className,
}: BreadcrumbNavigationProps) {
  return (
    <nav
      className={cn('flex items-center space-x-2 text-sm', className)}
      aria-label="이동 경로"
    >
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && (
            <svg
              className="mx-2 h-4 w-4 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          )}
          {item.href ? (
            <Link
              href={item.href}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.title}
            </Link>
          ) : (
            <span className="font-medium">{item.title}</span>
          )}
        </div>
      ))}
    </nav>
  );
}