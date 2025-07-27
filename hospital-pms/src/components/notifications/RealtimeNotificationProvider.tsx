'use client';

import { useEffect } from 'react';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { useAuth } from '@/hooks/useAuth';

export function RealtimeNotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const { isConnected } = useRealtimeNotifications(profile?.role);

  useEffect(() => {
    if (isConnected) {
      console.log('Real-time notifications active for role:', profile?.role);
    }
  }, [isConnected, profile?.role]);

  return <>{children}</>;
}