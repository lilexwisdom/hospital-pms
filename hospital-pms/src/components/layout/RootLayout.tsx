'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from './DashboardLayout';
import { MobileLayout } from './MobileLayout';

interface RootLayoutProps {
  children: React.ReactNode;
  variant?: 'dashboard' | 'mobile' | 'auto';
  showMobileNav?: boolean;
  showMobileHeader?: boolean;
}

export function RootLayout({
  children,
  variant = 'auto',
  showMobileNav = true,
  showMobileHeader = true,
}: RootLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkMobile();

    // Add resize listener
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Force specific layout
  if (variant === 'dashboard') {
    return <DashboardLayout>{children}</DashboardLayout>;
  }

  if (variant === 'mobile') {
    return (
      <MobileLayout showBottomNav={showMobileNav} showHeader={showMobileHeader}>
        {children}
      </MobileLayout>
    );
  }

  // Auto-detect based on screen size
  if (isMobile) {
    return (
      <MobileLayout showBottomNav={showMobileNav} showHeader={showMobileHeader}>
        {children}
      </MobileLayout>
    );
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}