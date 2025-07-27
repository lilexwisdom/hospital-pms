'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { Menu, X } from 'lucide-react';
import type { NavItem } from './MainNavigation';

interface MobileNavigationProps {
  items: NavItem[];
  logo?: React.ReactNode;
  className?: string;
}

export function MobileNavigation({
  items,
  logo,
  className,
}: MobileNavigationProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user, profile, hasAnyRole } = useAuth();

  // Filter items based on user role
  const visibleItems = items.filter((item) => {
    if (!item.roles) return true;
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

  const renderNavItem = (item: NavItem, level = 0) => {
    const Icon = item.icon;
    const isActive = isItemActive(item);
    const hasChildren = item.children && item.children.length > 0;

    if (item.roles && !hasAnyRole(item.roles)) {
      return null;
    }

    if (hasChildren) {
      return (
        <div key={item.id} className={cn(level > 0 && 'ml-4')}>
          <div className="py-2 text-sm font-medium text-muted-foreground">
            {item.title}
          </div>
          <div className="space-y-1">
            {item.children.map((child) => renderNavItem(child, level + 1))}
          </div>
        </div>
      );
    }

    return (
      <Link
        key={item.id}
        href={item.href}
        onClick={() => setOpen(false)}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'hover:bg-muted hover:text-foreground',
          item.disabled && 'cursor-not-allowed opacity-50',
          level > 0 && 'ml-4'
        )}
      >
        {Icon && <Icon className="h-4 w-4" />}
        <span className="flex-1">{item.title}</span>
        {item.badge !== undefined && (
          <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 text-xs text-primary-foreground">
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Header */}
      <header className={cn('sticky top-0 z-40 md:hidden', className)}>
        <div className="flex h-14 items-center justify-between border-b bg-background px-4">
          {logo ? (
            logo
          ) : (
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold">H</span>
              </div>
              <span className="font-semibold">Hospital PMS</span>
            </Link>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(!open)}
            aria-label="메뉴 열기"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Mobile Menu Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <SheetHeader className="border-b p-4">
            <SheetTitle className="text-left">메뉴</SheetTitle>
            {user && (
              <div className="pt-2 text-sm">
                <p className="font-medium">{profile?.name || user.email}</p>
                <p className="text-muted-foreground">{profile?.role}</p>
              </div>
            )}
          </SheetHeader>
          
          <ScrollArea className="h-[calc(100vh-5rem)]">
            <nav className="p-4 space-y-1">
              {visibleItems.map((item) => renderNavItem(item))}
            </nav>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}

// Bottom Tab Navigation for Mobile
interface TabNavigationProps {
  items: NavItem[];
  className?: string;
}

export function TabNavigation({ items, className }: TabNavigationProps) {
  const pathname = usePathname();
  const { hasAnyRole } = useAuth();

  // Filter items based on user role (max 5 items for mobile)
  const visibleItems = items
    .filter((item) => {
      if (!item.roles) return true;
      return hasAnyRole(item.roles);
    })
    .slice(0, 5);

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 border-t bg-background md:hidden',
        className
      )}
    >
      <div className="grid h-16 grid-cols-5">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {Icon && <Icon className="h-5 w-5" />}
              <span className="truncate">{item.title}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute top-2 right-1/2 translate-x-3 -translate-y-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] text-destructive-foreground">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}