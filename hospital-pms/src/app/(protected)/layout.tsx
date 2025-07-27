'use client';

import { AuthenticatedOnly } from '@/components/auth/ProtectedRoute';
import { useSessionWarning } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { showWarning, extendSession, dismissWarning } = useSessionWarning();

  return (
    <AuthenticatedOnly>
      <DashboardLayout>
        {children}
        
        {/* 세션 만료 경고 */}
        {showWarning && (
          <div className="fixed bottom-4 right-4 max-w-sm z-50">
            <Alert className="bg-yellow-50 border-yellow-400 dark:bg-yellow-900/20">
              <AlertTitle className="text-yellow-800 dark:text-yellow-400">
                세션 만료 경고
              </AlertTitle>
              <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                세션이 곧 만료됩니다. 계속하려면 세션을 연장하세요.
              </AlertDescription>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={extendSession}>
                  세션 연장
                </Button>
                <Button size="sm" variant="outline" onClick={dismissWarning}>
                  닫기
                </Button>
              </div>
            </Alert>
          </div>
        )}
      </DashboardLayout>
    </AuthenticatedOnly>
  );
}