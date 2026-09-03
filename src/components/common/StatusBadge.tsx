import React from 'react';
import { TopicStatus } from '../../types/syllabus';
import { CheckCircle2, Zap, AlertTriangle, RotateCw, Circle } from 'lucide-react';

interface StatusBadgeProps {
  status: TopicStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showLabel = true,
  className = ''
}) => {
  const configs: Record<
    TopicStatus,
    { label: string; bg: string; text: string; border: string; icon: React.ElementType }
  > = {
    completed: {
      label: 'Mastered',
      bg: 'bg-emerald-500/15 dark:bg-emerald-500/20',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-500/35',
      icon: CheckCircle2,
    },
    in_progress: {
      label: 'In Progress',
      bg: 'bg-amber-500/15 dark:bg-amber-500/20',
      text: 'text-amber-800 dark:text-amber-300',
      border: 'border-amber-500/40',
      icon: Zap,
    },
    revision_due: {
      label: 'Revision Due',
      bg: 'bg-purple-500/15 dark:bg-purple-500/20',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-500/35',
      icon: RotateCw,
    },
    weak: {
      label: 'Weak Topic',
      bg: 'bg-rose-500/15 dark:bg-rose-500/20',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-500/40',
      icon: AlertTriangle,
    },
    not_started: {
      label: 'Not Started',
      bg: 'bg-slate-100 dark:bg-slate-800/80',
      text: 'text-slate-600 dark:text-slate-400',
      border: 'border-slate-300 dark:border-slate-700',
      icon: Circle,
    },
  };

  const current = configs[status] || configs.not_started;
  const IconComponent = current.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px] gap-1 font-bold',
    md: 'px-2.5 py-1 text-xs gap-1.5 font-bold',
    lg: 'px-3 py-1.5 text-sm gap-2 font-bold',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <span
      className={`inline-flex items-center font-mono rounded-lg border shadow-xs ${current.bg} ${current.text} ${current.border} ${sizeClasses[size]} ${className} transition-all duration-200`}
    >
      <IconComponent className={`${iconSizes[size]} shrink-0`} />
      {showLabel && <span>{current.label}</span>}
    </span>
  );
};

