import { cn } from '@/lib/utils';

interface StackProps {
  children: React.ReactNode;
  className?: string;
  spacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  direction?: 'vertical' | 'horizontal';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
}

const spacingClasses = {
  vertical: {
    none: 'space-y-0',
    xs: 'space-y-1',
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6',
    xl: 'space-y-8',
  },
  horizontal: {
    none: 'space-x-0',
    xs: 'space-x-1',
    sm: 'space-x-2',
    md: 'space-x-4',
    lg: 'space-x-6',
    xl: 'space-x-8',
  },
};

const alignClasses = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
};

const justifyClasses = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
};

export function Stack({
  children,
  className,
  spacing = 'md',
  direction = 'vertical',
  align = 'stretch',
  justify = 'start',
  wrap = false,
}: StackProps) {
  return (
    <div
      className={cn(
        'flex',
        direction === 'vertical' ? 'flex-col' : 'flex-row',
        spacingClasses[direction][spacing],
        alignClasses[align],
        justifyClasses[justify],
        wrap && 'flex-wrap',
        className
      )}
    >
      {children}
    </div>
  );
}

// Convenience components
export function VStack({ children, className, ...props }: Omit<StackProps, 'direction'>) {
  return (
    <Stack direction="vertical" className={className} {...props}>
      {children}
    </Stack>
  );
}

export function HStack({ children, className, ...props }: Omit<StackProps, 'direction'>) {
  return (
    <Stack direction="horizontal" className={className} {...props}>
      {children}
    </Stack>
  );
}

// Responsive Stack
interface ResponsiveStackProps extends Omit<StackProps, 'direction'> {
  direction?: {
    default?: 'vertical' | 'horizontal';
    sm?: 'vertical' | 'horizontal';
    md?: 'vertical' | 'horizontal';
    lg?: 'vertical' | 'horizontal';
  };
}

export function ResponsiveStack({
  children,
  className,
  direction = { default: 'vertical', md: 'horizontal' },
  ...props
}: ResponsiveStackProps) {
  const directionClasses = [
    direction.default === 'vertical' ? 'flex-col' : 'flex-row',
    direction.sm && (direction.sm === 'vertical' ? 'sm:flex-col' : 'sm:flex-row'),
    direction.md && (direction.md === 'vertical' ? 'md:flex-col' : 'md:flex-row'),
    direction.lg && (direction.lg === 'vertical' ? 'lg:flex-col' : 'lg:flex-row'),
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cn(
        'flex',
        directionClasses,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}