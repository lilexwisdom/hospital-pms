'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; reset: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback } = this.props;
      
      if (Fallback) {
        return <Fallback error={this.state.error} reset={this.reset} />;
      }

      return <DefaultErrorFallback error={this.state.error} reset={this.reset} />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error?: Error;
  reset: () => void;
}

function DefaultErrorFallback({ error, reset }: ErrorFallbackProps) {
  const router = useRouter();

  return (
    <div className="flex min-h-[400px] items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 text-center">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-destructive/10 p-3">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
        </div>
        
        <h2 className="mb-2 text-xl font-semibold">문제가 발생했습니다</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
        </p>
        
        {error && process.env.NODE_ENV === 'development' && (
          <details className="mb-4 rounded-lg bg-muted p-3 text-left">
            <summary className="cursor-pointer text-sm font-medium">
              오류 상세 정보
            </summary>
            <pre className="mt-2 overflow-auto text-xs">
              {error.message}
              {error.stack && '\n\n' + error.stack}
            </pre>
          </details>
        )}
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => router.push('/')}
          >
            <Home className="mr-2 h-4 w-4" />
            홈으로
          </Button>
          <Button
            className="flex-1"
            onClick={reset}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            다시 시도
          </Button>
        </div>
      </Card>
    </div>
  );
}

export function ErrorFallback({ error, reset }: ErrorFallbackProps) {
  return <DefaultErrorFallback error={error} reset={reset} />;
}

// Hook for using error boundary functionality
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  return { resetError, captureError };
}