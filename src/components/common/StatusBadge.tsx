import React from 'react';
import { TopicStatus } from '../../types/syllabus';
import { CheckCircle2, Clock, AlertTriangle, RotateCw, Circle } from 'lucide-react';

interface StatusBadgeProps {
  status: TopicStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showLabel = true,
}) => {
  const configs: Record<
    TopicStatus,
    { label: string; bg: string; text: string; border: string; icon: React.ElementType }
  > = {
    completed: {
      label: 'Completed',
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
      text: 'text-emerald-700 dark:text-emerald-400',
      border: 'border-emerald-500/30',
      icon: CheckCircle2,
    },
    in_progress: {
      label: 'In Progress',
      bg: 'bg-sky-500/10 dark:bg-sky-500/15',
      text: 'text-sky-700 dark:text-sky-400',
      border: 'border-sky-500/30',
      icon: Clock,
    },
    revision_due: {
      label: 'Revision Due',
      bg: 'bg-amber-500/10 dark:bg-amber-500/15',
      text: 'text-amber-700 dark:text-amber-400',
      border: 'border-amber-500/30',
      icon: RotateCw,
    },
    weak: {
      label: 'Weak Topic',
      bg: 'bg-rose-500/10 dark:bg-rose-500/15',
      text: 'text-rose-700 dark:text-rose-400',
      border: 'border-rose-500/30',
      icon: AlertTriangle,
    },
    not_started: {
      label: 'Not Started',
      bg: 'bg-slate-500/10 dark:bg-slate-500/15',
      text: 'text-slate-600 dark:text-slate-400',
      border: 'border-slate-500/20',
      icon: Circle,
    },
  };

  const current = configs[status] || configs.not_started;
  const IconComponent = current.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border ${current.bg} ${current.text} ${current.border} ${sizeClasses[size]} transition-all duration-200`}
    >
      <IconComponent className={`${iconSizes[size]} shrink-0`} />
      {showLabel && <span>{current.label}</span>}
    </span>
  );
};
