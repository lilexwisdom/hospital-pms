// Re-export all common UI components for easy import
export { PageHeader, PageHeaderAction } from './page-header';
export { SearchInput, SearchBar } from './search-input';
export { DataTable } from './data-table';
export { LoadingSpinner, LoadingOverlay, LoadingDots, PageLoading } from './loading-spinner';
export { ErrorBoundary, ErrorFallback, useErrorHandler } from './error-boundary';
export { StatusBadge, RoleBadge, PriorityBadge } from './status-badge';
export { AppointmentStatusIndicator, AppointmentTimeline } from './appointment-status';

// Re-export shadcn/ui components that are commonly used
export { Button } from './button';
export { Card } from './card';
export { Input } from './input';
export { Label } from './label';
export { Badge } from './badge';
export { Alert, AlertDescription, AlertTitle } from './alert';
export { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
export { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './dialog';
export { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './dropdown-menu';
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
export { Skeleton } from './skeleton';
export { Toaster } from './toaster';
export { useToast } from './use-toast';