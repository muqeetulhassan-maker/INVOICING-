import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionText,
  onAction,
  actionIcon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-10 sm:p-14 text-center rounded-2xl border border-dashed border-border bg-surface-raised/50">
      <div className="p-3.5 rounded-2xl bg-surface border border-border shadow-soft text-muted mb-4">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-base font-heading font-bold text-ink">{title}</h3>
      <p className="text-xs sm:text-sm text-secondary max-w-sm mt-1 mb-5 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <Button variant="primary" size="sm" onClick={onAction} leftIcon={actionIcon}>
          {actionText}
        </Button>
      )}
    </div>
  );
};

