import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Save } from 'lucide-react';
import { OptimisticLockError } from '@/hooks/useOptimisticLocking';

interface ConflictResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  onForceUpdate?: () => void;
  error: OptimisticLockError | null;
  tableName?: string;
}

export function ConflictResolutionModal({
  isOpen,
  onClose,
  onRefresh,
  onForceUpdate,
  error,
  tableName = 'record',
}: ConflictResolutionModalProps) {
  const getVersionInfo = () => {
    if (!error?.hint) return null;
    
    try {
      const hint = JSON.parse(error.hint);
      return {
        expectedVersion: hint.expected_version,
        providedVersion: hint.provided_version,
        currentVersion: hint.current_version,
      };
    } catch {
      return null;
    }
  };

  const versionInfo = getVersionInfo();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <DialogTitle>Concurrent Edit Detected</DialogTitle>
          </div>
          <DialogDescription className="mt-3 space-y-2">
            <p>
              Another user has modified this {tableName} while you were editing it.
              Your changes have not been saved to prevent data conflicts.
            </p>
            {versionInfo && (
              <div className="mt-3 p-3 bg-gray-50 rounded-md text-sm">
                <p className="font-medium mb-1">Version Information:</p>
                <ul className="space-y-1 text-gray-600">
                  <li>Your version: {versionInfo.providedVersion}</li>
                  <li>Current version: {versionInfo.currentVersion}</li>
                </ul>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3">
          <div className="p-4 bg-blue-50 rounded-md">
            <h4 className="font-medium text-blue-900 mb-1">Recommended Action</h4>
            <p className="text-sm text-blue-700">
              Refresh the page to see the latest changes, then reapply your edits if needed.
            </p>
          </div>

          {onForceUpdate && (
            <div className="p-4 bg-yellow-50 rounded-md">
              <h4 className="font-medium text-yellow-900 mb-1">Force Update (Use with caution)</h4>
              <p className="text-sm text-yellow-700">
                Override the other user's changes with your edits. This may result in data loss.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {onForceUpdate && (
            <Button
              variant="destructive"
              onClick={() => {
                onForceUpdate();
                onClose();
              }}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Force Update
            </Button>
          )}
          <Button
            onClick={() => {
              onRefresh();
              onClose();
            }}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Page
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}