'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  sidebarPosition?: 'left' | 'right';
  sidebarWidth?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export function SidebarLayout({
  children,
  sidebar,
  sidebarPosition = 'left',
  sidebarWidth = 'w-64',
  collapsible = true,
  defaultCollapsed = false,
}: SidebarLayoutProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside
        className={cn(
          'hidden md:block relative border-r bg-card transition-all duration-300',
          collapsed ? 'w-0' : sidebarWidth,
          sidebarPosition === 'right' && 'order-2 border-r-0 border-l'
        )}
      >
        {!collapsed && (
          <ScrollArea className="h-full">
            {sidebar}
          </ScrollArea>
        )}
        
        {collapsible && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'absolute top-4 -right-10 z-10',
              sidebarPosition === 'right' && '-left-10 right-auto'
            )}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              sidebarPosition === 'left' ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />
            ) : (
              sidebarPosition === 'left' ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

interface TabletSidebarLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TabletSidebarLayout({
  children,
  sidebar,
  open,
  onOpenChange,
}: TabletSidebarLayoutProps) {
  return (
    <div className="relative h-full">
      {/* Overlay */}
      {open && (
        <div
          className="absolute inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => onOpenChange(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'absolute inset-y-0 left-0 z-50 w-64 bg-background border-r transform transition-transform md:hidden',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <ScrollArea className="h-full">
          {sidebar}
        </ScrollArea>
      </div>

      {/* Main Content */}
      <main className="h-full">
        {children}
      </main>
    </div>
  );
}