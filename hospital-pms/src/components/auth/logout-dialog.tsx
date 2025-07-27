'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, LogOut } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useServerAction } from '@/hooks/use-server-action';
import { signOut } from '@/app/actions/auth';

interface LogoutDialogProps {
  children?: React.ReactNode;
  onSuccess?: () => void;
}

export function LogoutDialog({ children, onSuccess }: LogoutDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const { execute, isPending } = useServerAction(signOut, {
    onSuccess: () => {
      setOpen(false);
      onSuccess?.();
      router.push('/login');
    },
    onError: (error) => {
      console.error('Logout error:', error);
      // 에러가 발생해도 로그인 페이지로 이동
      router.push('/login');
    },
  });

  const handleLogout = async () => {
    await execute(new FormData());
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="sm">
            <LogOut className="mr-2 h-4 w-4" />
            로그아웃
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>로그아웃 하시겠습니까?</AlertDialogTitle>
          <AlertDialogDescription>
            로그아웃하면 현재 세션이 종료되며,
            다시 로그인해야 시스템을 사용할 수 있습니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            취소
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleLogout();
            }}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                로그아웃 중...
              </>
            ) : (
              '로그아웃'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * 헤더나 사이드바에서 사용할 수 있는 로그아웃 버튼
 */
export function LogoutButton({ 
  variant = 'ghost',
  size = 'default',
  showIcon = true,
  className = '',
}: {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showIcon?: boolean;
  className?: string;
}) {
  return (
    <LogoutDialog>
      <Button variant={variant} size={size} className={className}>
        {showIcon && <LogOut className="mr-2 h-4 w-4" />}
        로그아웃
      </Button>
    </LogoutDialog>
  );
}

/**
 * 드롭다운 메뉴에서 사용할 수 있는 로그아웃 아이템
 */
export function LogoutMenuItem({ 
  onSelect,
  className = '',
}: {
  onSelect?: () => void;
  className?: string;
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { execute, isPending } = useServerAction(signOut, {
    onSuccess: () => {
      setDialogOpen(false);
      onSelect?.();
      router.push('/login');
    },
  });

  return (
    <>
      <div
        onClick={() => setDialogOpen(true)}
        className={`flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground ${className}`}
      >
        <LogOut className="mr-2 h-4 w-4" />
        <span>로그아웃</span>
      </div>
      
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>로그아웃 하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              로그아웃하면 현재 세션이 종료되며,
              다시 로그인해야 시스템을 사용할 수 있습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async (e) => {
                e.preventDefault();
                await execute(new FormData());
              }}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  로그아웃 중...
                </>
              ) : (
                '로그아웃'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}