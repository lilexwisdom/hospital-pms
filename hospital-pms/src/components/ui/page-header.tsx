import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  showBack?: boolean;
  backHref?: string;
  onBack?: () => void;
}

export function PageHeader({
  title,
  description,
  children,
  className,
  showBack = false,
  backHref,
  onBack,
}: PageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <div className={cn('mb-6 space-y-1', className)}>
      <div className="flex items-center gap-4">
        {showBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="h-8 w-8"
            aria-label="뒤로 가기"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-muted-foreground md:text-base">
              {description}
            </p>
          )}
        </div>
        {children && (
          <div className="flex items-center gap-2">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

interface PageHeaderActionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageHeaderAction({ children, className }: PageHeaderActionProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {children}
    </div>
  );
}