import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

const textSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
};

export function LoadingSpinner({
  className,
  size = 'md',
  text,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const content = (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      {text && (
        <p className={cn('text-muted-foreground', textSizeClasses[size])}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
}

interface LoadingOverlayProps {
  show: boolean;
  text?: string;
  className?: string;
}

export function LoadingOverlay({ show, text, className }: LoadingOverlayProps) {
  if (!show) return null;

  return (
    <div className={cn(
      'absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm',
      className
    )}>
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}

interface LoadingDotsProps {
  className?: string;
}

export function LoadingDots({ className }: LoadingDotsProps) {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)}>
      <span className="h-1 w-1 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
      <span className="h-1 w-1 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
      <span className="h-1 w-1 animate-bounce rounded-full bg-current" />
    </span>
  );
}

interface PageLoadingProps {
  text?: string;
}

export function PageLoading({ text = '페이지를 불러오는 중...' }: PageLoadingProps) {
  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}