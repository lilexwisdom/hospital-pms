import { cn } from "@/lib/utils";
import type { Database } from "@/types/database.types";

type AppointmentStatus = Database['public']['Enums']['appointment_status'];

interface AppointmentStatusIndicatorProps {
  status: AppointmentStatus;
  showText?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AppointmentStatusIndicator({
  status,
  showText = true,
  className,
  size = 'md',
}: AppointmentStatusIndicatorProps) {
  const statusConfig = {
    pending: {
      color: 'bg-yellow-500',
      text: '대기중',
      icon: '⏰',
    },
    confirmed: {
      color: 'bg-blue-500',
      text: '확정',
      icon: '✓',
    },
    completed: {
      color: 'bg-green-500',
      text: '완료',
      icon: '✓✓',
    },
    cancelled: {
      color: 'bg-gray-500',
      text: '취소',
      icon: '✕',
    },
    no_show: {
      color: 'bg-red-500',
      text: '노쇼',
      icon: '⚠',
    },
  };

  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  };

  const config = statusConfig[status];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'rounded-full',
          sizeClasses[size],
          config.color,
          'animate-pulse'
        )}
        aria-label={config.text}
      />
      {showText && (
        <span className="text-sm font-medium">
          {config.text}
        </span>
      )}
    </div>
  );
}

interface AppointmentTimelineProps {
  status: AppointmentStatus;
  className?: string;
}

export function AppointmentTimeline({ status, className }: AppointmentTimelineProps) {
  const statuses: AppointmentStatus[] = ['pending', 'confirmed', 'completed'];
  const currentIndex = statuses.indexOf(status);
  
  // Handle cancelled and no_show separately
  if (status === 'cancelled' || status === 'no_show') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <span className="text-xs">1</span>
          </div>
          <div className="h-0.5 w-12 bg-gray-200 dark:bg-gray-700" />
          <div className={cn(
            'h-8 w-8 rounded-full flex items-center justify-center',
            status === 'cancelled' ? 'bg-gray-500' : 'bg-red-500'
          )}>
            <span className="text-xs text-white">✕</span>
          </div>
        </div>
        <span className="text-sm text-muted-foreground ml-2">
          {status === 'cancelled' ? '예약 취소됨' : '방문하지 않음'}
        </span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center', className)}>
      {statuses.map((s, index) => (
        <div key={s} className="flex items-center">
          <div
            className={cn(
              'h-8 w-8 rounded-full flex items-center justify-center transition-colors',
              index <= currentIndex
                ? 'bg-primary text-primary-foreground'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
            )}
          >
            <span className="text-xs font-medium">{index + 1}</span>
          </div>
          {index < statuses.length - 1 && (
            <div
              className={cn(
                'h-0.5 w-12 transition-colors',
                index < currentIndex
                  ? 'bg-primary'
                  : 'bg-gray-200 dark:bg-gray-700'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}