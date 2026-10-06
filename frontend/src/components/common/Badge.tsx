import React from 'react';

export type BadgeVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'accent';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
}) => {
  const variantStyles = {
    success: 'bg-success-bg text-success border-success/25',
    warning: 'bg-warning-bg text-warning border-warning/25',
    danger: 'bg-danger-bg text-danger border-danger/25',
    info: 'bg-info-bg text-info border-info/25',
    neutral: 'bg-surface text-secondary border-border',
    accent: 'bg-accent-muted text-accent border-accent/25',
  };

  const dotColors = {
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
    info: 'bg-info',
    neutral: 'bg-secondary',
    accent: 'bg-accent',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-medium',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border ${sizeStyles[size]} ${variantStyles[variant]} transition-colors`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColors[variant]}`} />}
      <span>{children}</span>
    </span>
  );
};

