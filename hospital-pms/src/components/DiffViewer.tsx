import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight, Minus, Plus } from 'lucide-react';

interface DiffViewerProps {
  oldValues: Record<string, any> | null;
  newValues: Record<string, any> | null;
  changedFields?: string[];
  className?: string;
}

export function DiffViewer({ oldValues, newValues, changedFields = [], className }: DiffViewerProps) {
  // Get all unique keys from both objects
  const allKeys = new Set([
    ...(oldValues ? Object.keys(oldValues) : []),
    ...(newValues ? Object.keys(newValues) : []),
  ]);

  // Filter to only changed fields if provided
  const keysToShow = changedFields.length > 0 
    ? Array.from(allKeys).filter(key => changedFields.includes(key))
    : Array.from(allKeys);

  const formatValue = (value: any): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return '[Object]';
      }
    }
    if (typeof value === 'string' && value.length > 100) {
      return value.substring(0, 100) + '...';
    }
    return String(value);
  };

  const getFieldStatus = (key: string) => {
    const oldValue = oldValues?.[key];
    const newValue = newValues?.[key];
    
    if (oldValue === undefined && newValue !== undefined) {
      return 'added';
    }
    if (oldValue !== undefined && newValue === undefined) {
      return 'removed';
    }
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      return 'modified';
    }
    return 'unchanged';
  };

  const renderValue = (value: any, status: string) => {
    const formatted = formatValue(value);
    const isMultiline = formatted.includes('\n');

    return (
      <div
        className={cn(
          'px-3 py-2 rounded text-sm font-mono',
          status === 'removed' && 'bg-red-50 text-red-900 line-through',
          status === 'added' && 'bg-green-50 text-green-900',
          status === 'modified' && 'bg-yellow-50 text-yellow-900',
          status === 'unchanged' && 'bg-gray-50 text-gray-700'
        )}
      >
        {isMultiline ? (
          <pre className="whitespace-pre-wrap break-words">{formatted}</pre>
        ) : (
          <span className="break-words">{formatted}</span>
        )}
      </div>
    );
  };

  const renderDiffIcon = (status: string) => {
    switch (status) {
      case 'added':
        return <Plus className="h-4 w-4 text-green-600" />;
      case 'removed':
        return <Minus className="h-4 w-4 text-red-600" />;
      case 'modified':
        return <ChevronRight className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  if (keysToShow.length === 0) {
    return (
      <div className={cn('text-center py-8 text-muted-foreground', className)}>
        No changes to display
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {keysToShow.map((key) => {
        const status = getFieldStatus(key);
        const oldValue = oldValues?.[key];
        const newValue = newValues?.[key];

        // Skip unchanged fields unless we're showing all fields
        if (status === 'unchanged' && changedFields.length > 0) {
          return null;
        }

        return (
          <div key={key} className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              {renderDiffIcon(status)}
              <h4 className="font-medium text-sm">{key}</h4>
              <span
                className={cn(
                  'ml-auto text-xs px-2 py-1 rounded-full',
                  status === 'added' && 'bg-green-100 text-green-700',
                  status === 'removed' && 'bg-red-100 text-red-700',
                  status === 'modified' && 'bg-yellow-100 text-yellow-700',
                  status === 'unchanged' && 'bg-gray-100 text-gray-700'
                )}
              >
                {status}
              </span>
            </div>

            <div className="space-y-2">
              {status === 'modified' ? (
                <>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Old value:</p>
                    {renderValue(oldValue, 'removed')}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">New value:</p>
                    {renderValue(newValue, 'added')}
                  </div>
                </>
              ) : status === 'added' ? (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">New value:</p>
                  {renderValue(newValue, 'added')}
                </div>
              ) : status === 'removed' ? (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Removed value:</p>
                  {renderValue(oldValue, 'removed')}
                </div>
              ) : (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Value:</p>
                  {renderValue(newValue, 'unchanged')}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Simplified diff viewer for inline use
export function InlineDiffViewer({ 
  oldValue, 
  newValue, 
  fieldName 
}: { 
  oldValue: any; 
  newValue: any; 
  fieldName: string;
}) {
  const oldFormatted = formatValue(oldValue);
  const newFormatted = formatValue(newValue);

  return (
    <div className="space-y-1">
      <p className="text-sm font-medium">{fieldName}</p>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-red-600 line-through">{oldFormatted}</span>
        <ChevronRight className="h-3 w-3" />
        <span className="text-green-600">{newFormatted}</span>
      </div>
    </div>
  );
}

function formatValue(value: any): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '[Object]';
    }
  }
  return String(value);
}