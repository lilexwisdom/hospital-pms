import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database.types";

type AppointmentStatus = Database['public']['Enums']['appointment_status'];
type UserRole = Database['public']['Enums']['user_role'];

interface StatusBadgeProps {
  status: AppointmentStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusStyles = {
    pending: 'badge-pending',
    confirmed: 'badge-confirmed',
    completed: 'badge-completed',
    cancelled: 'badge-cancelled',
    no_show: 'badge-no-show',
  };

  const statusText = {
    pending: '대기중',
    confirmed: '확정',
    completed: '완료',
    cancelled: '취소',
    no_show: '노쇼',
  };

  return (
    <Badge 
      className={cn(statusStyles[status], className)}
      variant="secondary"
    >
      {statusText[status]}
    </Badge>
  );
}

interface RoleBadgeProps {
  role: UserRole;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const roleStyles = {
    admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
    manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    bd: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400',
    cs: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400',
  };

  const roleText = {
    admin: '관리자',
    manager: '매니저',
    bd: '사업개발',
    cs: '고객서비스',
  };

  return (
    <Badge 
      className={cn(roleStyles[role], className)}
      variant="secondary"
    >
      {roleText[role]}
    </Badge>
  );
}

interface PriorityBadgeProps {
  priority: 'high' | 'medium' | 'low';
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const priorityStyles = {
    high: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    low: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
  };

  const priorityText = {
    high: '높음',
    medium: '보통',
    low: '낮음',
  };

  return (
    <Badge 
      className={cn(priorityStyles[priority], className)}
      variant="secondary"
    >
      {priorityText[priority]}
    </Badge>
  );
}