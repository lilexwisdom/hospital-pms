'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { useAuth } from '@/hooks/useAuth';
import {
  Home,
  Users,
  Calendar,
  FileText,
  Menu,
} from 'lucide-react';

interface MobileLayoutProps {
  children: React.ReactNode;
  showBottomNav?: boolean;
  showHeader?: boolean;
}

interface BottomNavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: Array<'admin' | 'manager' | 'bd' | 'cs'>;
}

const bottomNavItems: BottomNavItem[] = [
  {
    title: '홈',
    href: '/dashboard',
    icon: Home,
  },
  {
    title: '환자',
    href: '/patients',
    icon: Users,
    roles: ['admin', 'manager', 'cs'],
  },
  {
    title: '예약',
    href: '/appointments',
    icon: Calendar,
    roles: ['admin', 'manager', 'cs'],
  },
  {
    title: '기록',
    href: '/medical-records',
    icon: FileText,
    roles: ['admin', 'manager', 'cs'],
  },
  {
    title: '메뉴',
    href: '/menu',
    icon: Menu,
  },
];

export function MobileLayout({
  children,
  showBottomNav = true,
  showHeader = true,
}: MobileLayoutProps) {
  const pathname = usePathname();
  const { profile, hasAnyRole } = useAuth();

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Mobile Header */}
      {showHeader && (
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background/95 backdrop-blur px-4">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">H</span>
            </div>
            <span className="font-semibold">Hospital PMS</span>
          </Link>
          <ThemeToggle />
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Bottom Navigation */}
      {showBottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
          <div className="grid grid-cols-5 h-16">
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              // Check role permissions
              if (item.roles && !hasAnyRole(item.roles)) {
                return null;
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center py-2 px-1 text-xs font-medium transition-colors",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className={cn("h-5 w-5 mb-1", isActive && "text-primary")} />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

/**
 * Mobile-optimized Card component
 */
export function MobileCard({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      className={cn(
        "bg-card rounded-lg border p-4 shadow-sm",
        onClick && "cursor-pointer active:scale-[0.98] transition-transform",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

/**
 * Mobile-optimized List component
 */
export function MobileList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("divide-y divide-border", className)}>
      {children}
    </div>
  );
}

/**
 * Mobile-optimized List Item component
 */
export function MobileListItem({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 bg-background",
        onClick && "cursor-pointer active:bg-muted transition-colors",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}