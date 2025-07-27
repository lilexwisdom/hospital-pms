'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { useAuth } from '@/hooks/useAuth';
import { MainNavigation, type NavItem } from '@/components/navigation';
import { LogoutButton } from '@/components/auth/logout-dialog';
import {
  Menu,
  X,
  Home,
  Users,
  Calendar,
  FileText,
  Settings,
  ChevronLeft,
  BarChart3,
  UserCircle,
  LogOut,
  ClipboardList,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navigationItems: NavItem[] = [
  {
    id: 'dashboard',
    title: '대시보드',
    href: '/dashboard',
    icon: Home,
  },
  {
    id: 'patients',
    title: '환자 관리',
    href: '/patients',
    icon: Users,
    roles: ['admin', 'manager', 'cs'],
  },
  {
    id: 'appointments',
    title: '예약 관리',
    href: '/appointments',
    icon: Calendar,
    roles: ['admin', 'manager', 'cs'],
  },
  {
    id: 'medical-records',
    title: '의료 기록',
    href: '/medical-records',
    icon: FileText,
    roles: ['admin', 'manager', 'cs'],
  },
  {
    id: 'survey-tokens',
    title: '설문 토큰',
    href: '/survey-tokens',
    icon: ClipboardList,
    roles: ['admin', 'manager', 'bd'],
  },
  {
    id: 'reports',
    title: '리포트',
    href: '/reports',
    icon: BarChart3,
    roles: ['admin', 'manager', 'bd'],
  },
  {
    id: 'settings',
    title: '설정',
    href: '/settings',
    icon: Settings,
    roles: ['admin'],
  },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, profile, loading } = useAuth();

  // Close mobile sidebar when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">H</span>
          </div>
          {!collapsed && (
            <span className="font-semibold text-lg">Hospital PMS</span>
          )}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="hidden md:flex"
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <MainNavigation
          items={navigationItems}
          collapsed={collapsed}
          showIcons={true}
        />
      </ScrollArea>

      {/* User Profile */}
      <div className="border-t p-4">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <UserCircle className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile?.name || user?.email}</p>
              <p className="text-xs text-muted-foreground truncate">{profile?.role}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex md:flex-col fixed inset-y-0 z-50 bg-card border-r transition-all duration-300",
          collapsed ? "w-20" : "w-64"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex h-full flex-col">
            <SidebarContent />
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className={cn(
        "flex flex-col transition-all duration-300",
        collapsed ? "md:pl-20" : "md:pl-64"
      )}>
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          <div className="flex-1">
            <h1 className="text-lg font-semibold">
              {navigationItems.find(item => item.href === pathname)?.title || '페이지'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LogoutButton variant="ghost" size="icon" showIcon={false}>
              <LogOut className="h-4 w-4" />
            </LogoutButton>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}