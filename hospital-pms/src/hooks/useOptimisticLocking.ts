import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { PostgrestError } from '@supabase/supabase-js';

export interface OptimisticLockError extends PostgrestError {
  hint?: string;
}

export interface UseOptimisticLockingOptions {
  onConflict?: (error: OptimisticLockError) => void;
  onSuccess?: () => void;
  onError?: (error: PostgrestError) => void;
}

export interface OptimisticUpdate<T> {
  data: T;
  version: number;
}

export function useOptimisticLocking<T extends { version?: number }>(
  options: UseOptimisticLockingOptions = {}
) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [conflictError, setConflictError] = useState<OptimisticLockError | null>(null);

  const handleUpdate = useCallback(
    async (
      updateFn: (data: T) => Promise<{ data: T | null; error: PostgrestError | null }>,
      currentData: T
    ) => {
      setIsUpdating(true);
      setConflictError(null);

      try {
        const { data, error } = await updateFn(currentData);

        if (error) {
          // Check if it's an optimistic lock conflict
          if (error.code === 'P0001' && error.message?.includes('Concurrent update detected')) {
            const lockError = error as OptimisticLockError;
            setConflictError(lockError);
            
            toast.error(
              'This record has been modified by another user. Please refresh and try again.',
              {
                duration: 5000,
                icon: '⚠️',
              }
            );

            if (options.onConflict) {
              options.onConflict(lockError);
            }
          } else {
            // Other error
            toast.error(error.message || 'An error occurred while updating');
            if (options.onError) {
              options.onError(error);
            }
          }
          
          return { data: null, error };
        }

        // Success
        toast.success('Successfully updated');
        if (options.onSuccess) {
          options.onSuccess();
        }
        
        return { data, error: null };
      } finally {
        setIsUpdating(false);
      }
    },
    [options]
  );

  const clearConflict = useCallback(() => {
    setConflictError(null);
  }, []);

  return {
    handleUpdate,
    isUpdating,
    conflictError,
    clearConflict,
  };
}

// Helper function to prepare data with version for update
export function prepareOptimisticUpdate<T extends { version?: number }>(
  data: T,
  changes: Partial<T>
): T {
  return {
    ...data,
    ...changes,
    version: data.version || 1, // Include current version for conflict detection
  };
}

// Type guard for checking if error is optimistic lock error
export function isOptimisticLockError(error: PostgrestError | null): error is OptimisticLockError {
  return (
    error !== null &&
    error.code === 'P0001' &&
    error.message?.includes('Concurrent update detected')
  );
}