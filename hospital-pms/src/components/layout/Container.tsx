import { cn } from '@/lib/utils';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const containerSizes = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-7xl',
  xl: 'max-w-[1400px]',
  full: 'max-w-full',
};

export function Container({
  children,
  className,
  size = 'lg',
}: ContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-4 sm:px-6 lg:px-8',
        containerSizes[size],
        className
      )}
    >
      {children}
    </div>
  );
}

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageContainer({
  children,
  className,
  title,
  description,
  actions,
}: PageContainerProps) {
  return (
    <Container className={className}>
      {(title || description || actions) && (
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              {title && (
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  {title}
                </h1>
              )}
              {description && (
                <p className="mt-1 text-sm sm:text-base text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-2 flex-wrap">
                {actions}
              </div>
            )}
          </div>
        </div>
      )}
      {children}
    </Container>
  );
}